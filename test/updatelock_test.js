#!/usr/bin/env node
'use strict';
// The update lock and the state.json schema stamp (R05, B-159).
//
// `decide()` is pure and fixtured without a HOME. What only a process can show —
// a second `update` refused with exit 2, a stale lock taken over, the lock gone on
// every way out — runs the real launcher in a sandbox HOME with the tools it drives
// (git, npx, npm, claude, gh) replaced by PATH stubs, so what is under test is the
// lock and not the network.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('../lib/updatelock.js');
const store = require('../lib/store.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const NOW = 1_800_000_000_000;
const MIN = 60 * 1000;

// --- decide: pure ----------------------------------------------------------

it('no lock is an acquire', () => {
  assert.strictEqual(L.decide(null, NOW, true).action, 'acquire');
  assert.strictEqual(L.decide(undefined, NOW, true).action, 'acquire');
});

it('a young lock with a live pid is a refusal that names pid and age', () => {
  const d = L.decide({ pid: 4242, startedAt: NOW - 90 * 1000, host: 'h' }, NOW, true);
  assert.strictEqual(d.action, 'refuse');
  assert.match(d.reason, /pid 4242/);
  assert.match(d.reason, /90 s/);
});

// Fix round, risk i: on the SAME host a live pid is a running update, however long it has
// run — a slow `update` past 30 minutes was taken over while it was still writing. The
// 30-minute clock is only for a lock from another host, whose pid means nothing here.
it('same host and a live pid is a refusal however old the lock is (risk i)', () => {
  const d = L.decide({ pid: 1, startedAt: NOW - 31 * MIN, host: 'h' }, NOW, true, true);
  assert.strictEqual(d.action, 'refuse', 'a live update on this host was taken over for being slow');
  assert.strictEqual(L.decide({ pid: 1, startedAt: NOW - 600 * MIN, host: 'h' }, NOW, true, true).action, 'refuse');
  assert.strictEqual(L.decide({ pid: 1, startedAt: NOW - 31 * MIN, host: 'h' }, NOW, false, true).action, 'takeover',
    'a dead pid on this host must still be taken over');
});

it('a lock from another host is judged by the clock: stale after 30 minutes, young before', () => {
  const d = L.decide({ pid: 1, startedAt: NOW - 31 * MIN, host: 'x' }, NOW, true, false);
  assert.strictEqual(d.action, 'takeover');
  assert.match(d.reason, /stale/);
  assert.strictEqual(L.decide({ pid: 1, startedAt: NOW - 29 * MIN, host: 'x' }, NOW, true, false).action, 'refuse',
    'a 29 minute foreign lock is still young');
});

it('a young lock whose pid is dead is taken over', () => {
  const d = L.decide({ pid: 999999, startedAt: NOW - MIN, host: 'h' }, NOW, false);
  assert.strictEqual(d.action, 'takeover');
  assert.match(d.reason, /not running/);
});

it('a lock without a readable startedAt is not a reason to refuse for ever', () => {
  // from another host the clock is all there is, and an unreadable clock is no claim
  assert.strictEqual(L.decide({ pid: 1 }, NOW, true, false).action, 'takeover');
  assert.strictEqual(L.decide({ pid: 1, startedAt: 'x' }, NOW, true, false).action, 'takeover');
  // on this host the pid decides: dead is taken over, alive is a running update
  assert.strictEqual(L.decide({ pid: 1 }, NOW, false, true).action, 'takeover');
  assert.strictEqual(L.decide({ pid: 1 }, NOW, true, true).action, 'refuse');
});

// --- the filesystem wrapper -------------------------------------------------

function sandbox() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-lock-')));
}

it('acquire creates the lock exclusively with pid, startedAt and host; release removes only ours', () => {
  const home = sandbox();
  const a = L.acquire(home, { now: NOW, pid: process.pid, host: 'h1' });
  assert.ok(a.ok && a.token);
  const body = JSON.parse(fs.readFileSync(L.lockPath(home), 'utf8'));
  assert.deepStrictEqual(body, { pid: process.pid, startedAt: NOW, host: 'h1' });
  const b = L.acquire(home, { now: NOW + 1000, pid: process.pid, host: 'h1', alive: () => true });
  assert.strictEqual(b.ok, false, 'a second acquire while the first lives must be refused');
  assert.match(b.message, new RegExp(`pid ${process.pid}`));
  // a stranger's token never deletes our lock
  assert.strictEqual(L.release(home, { pid: 1, startedAt: 1 }), false);
  assert.ok(fs.existsSync(L.lockPath(home)));
  assert.strictEqual(L.release(home, a.token), true);
  assert.ok(!fs.existsSync(L.lockPath(home)));
  fs.rmSync(home, { recursive: true, force: true });
});

it('a stale lock from another host is taken over and the takeover is reported', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 77, startedAt: NOW - 45 * MIN, host: 'h0' }));
  const a = L.acquire(home, { now: NOW, pid: 5, host: 'h1', alive: () => true });
  assert.ok(a.ok);
  assert.match(a.tookOver, /stale/);
  assert.strictEqual(JSON.parse(fs.readFileSync(L.lockPath(home), 'utf8')).pid, 5);
  fs.rmSync(home, { recursive: true, force: true });
});

it('a lock from another host is judged by the clock alone, never by a pid that means nothing here', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 424242, startedAt: NOW - MIN, host: 'elsewhere' }));
  const a = L.acquire(home, { now: NOW, pid: 5, host: 'here', alive: () => false });
  assert.strictEqual(a.ok, false, 'a foreign host\'s young lock was taken because its pid is absent here');
  fs.rmSync(home, { recursive: true, force: true });
});

// Fix round, risk b: between judging a lock and unlinking it, another `update` can take
// it over and write its own. Unlinking then deletes the SUCCESSOR's lock, and two updates
// run at once. The `alive` seam runs after the read and before the unlink, which is
// exactly the window: it plants a fresh lock there.
it('a takeover never deletes a lock that changed after it was judged (risk b)', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 77, startedAt: NOW - MIN, host: 'h1' }));
  const fresh = { pid: 88, startedAt: NOW, host: 'h1' };
  const a = L.acquire(home, { now: NOW, pid: 5, host: 'h1', alive: (pid) => {
    if (pid === 77) { fs.writeFileSync(L.lockPath(home), JSON.stringify(fresh)); return false; }
    return true;
  } });
  assert.strictEqual(a.ok, false, 'the run took a lock a successor had just written');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(L.lockPath(home), 'utf8')), fresh,
    'the successor\'s lock was deleted');
  fs.rmSync(home, { recursive: true, force: true });
});

// Fix round 2, J: the re-read narrowed risk b but left a window between the re-read and the
// unlink. The takeover is now a rename of the judged lock to a unique name, a check that the
// renamed file IS the judged lock, and a restore when it is not. `beforeTakeover` runs at the
// last moment before the destructive step — exactly the remaining window.
it('a successor\'s lock written after the re-read is restored, never deleted (J)', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 77, startedAt: NOW - MIN, host: 'h1' }));
  const fresh = { pid: 88, startedAt: NOW, host: 'h1' };
  let planted = 0;
  const a = L.acquire(home, { now: NOW, pid: 5, host: 'h1', alive: (pid) => pid !== 77,
    beforeTakeover: () => { if (!planted++) fs.writeFileSync(L.lockPath(home), JSON.stringify(fresh)); } });
  assert.strictEqual(planted, 1, 'the seam never ran — the fixture tests nothing');
  assert.strictEqual(a.ok, false, 'the run took a lock a successor had just written');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(L.lockPath(home), 'utf8')), fresh,
    'the successor\'s lock was deleted');
  assert.deepStrictEqual(fs.readdirSync(path.dirname(L.lockPath(home))).filter((n) => n !== 'update.lock'), [],
    'a renamed lock was left behind');
  // the control: with nothing planted the dead holder's lock IS taken over
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 77, startedAt: NOW - MIN, host: 'h1' }));
  const b = L.acquire(home, { now: NOW, pid: 5, host: 'h1', alive: (pid) => pid !== 77 });
  assert.ok(b.ok && /not running/.test(b.tookOver), `the control was not taken over: ${JSON.stringify(b)}`);
  assert.strictEqual(JSON.parse(fs.readFileSync(L.lockPath(home), 'utf8')).pid, 5);
  fs.rmSync(home, { recursive: true, force: true });
});

it('a lock file that does not parse is refused while fresh and taken over once old', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), '{ not json');
  const fresh = L.acquire(home, { now: Date.now(), pid: 5, host: 'h' });
  assert.strictEqual(fresh.ok, false);
  const old = new Date(Date.now() - 5 * MIN);
  fs.utimesSync(L.lockPath(home), old, old);
  const later = L.acquire(home, { now: Date.now(), pid: 5, host: 'h' });
  assert.ok(later.ok && /unreadable/.test(later.tookOver));
  fs.rmSync(home, { recursive: true, force: true });
});

// --- the real command -------------------------------------------------------

const STUB_DIRS = [];
function stubEnv(home, extra) {
  const stubs = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-lock-stubs-'));
  STUB_DIRS.push(stubs);
  const bodies = Object.assign({
    git: '#!/bin/sh\nexit 0\n', claude: '#!/bin/sh\nexit 0\n',
    npx: '#!/bin/sh\nexit 0\n', npm: '#!/bin/sh\necho 9.9.9\n', gh: '#!/bin/sh\necho "[]"\n',
  }, extra || {});
  for (const [name, body] of Object.entries(bodies)) {
    fs.writeFileSync(path.join(stubs, name), body, { mode: 0o755 });
  }
  return Object.assign({}, process.env, {
    HOME: home, USERPROFILE: home, SSHLG_SKILLS_NO_PROBE: '1', PATH: `${stubs}:${process.env.PATH}`,
  });
}
function update(env, args) {
  const r = spawnSync('node', [path.join(ROOT, 'bin', 'sshlg-skills.js'), 'update'].concat(args || []),
    { encoding: 'utf8', env });
  return { out: `${r.stdout}${r.stderr}`, status: r.status };
}

it('a second real `update` while one holds the lock exits 2 and names the holder', () => {
  const home = sandbox();
  const env = stubEnv(home);
  // a live holder: this very process, started a moment ago, on this host
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(L.lockPath(home),
    JSON.stringify({ pid: process.pid, startedAt: Date.now() - 5000, host: os.hostname() }));
  const r = update(env);
  assert.strictEqual(r.status, 2, `expected exit 2, got ${r.status}:\n${r.out.slice(-400)}`);
  assert.match(r.out, new RegExp(`pid ${process.pid}`), 'the refusal does not name the holder pid');
  assert.match(r.out, /\d+ s ago/, 'the refusal does not give the holder age');
  assert.ok(fs.existsSync(L.lockPath(home)), 'the refused run deleted the holder\'s lock');
  fs.rmSync(home, { recursive: true, force: true });
});

it('a live holder on this host is refused by the real command however old (risk i)', () => {
  const home = sandbox();
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(L.lockPath(home),
    JSON.stringify({ pid: process.pid, startedAt: Date.now() - 45 * MIN, host: os.hostname() }));
  const r = update(stubEnv(home));
  assert.strictEqual(r.status, 2, `a 45-minute live holder was not refused: ${r.status}\n${r.out.slice(-300)}`);
  fs.rmSync(home, { recursive: true, force: true });
});

it('a stale foreign and a dead-pid lock are taken over by the real command, and the lock is gone after', () => {
  for (const lock of [
    { pid: process.pid, startedAt: Date.now() - 31 * MIN, host: 'another-host.invalid' },
    { pid: 2147483646, startedAt: Date.now() - MIN, host: os.hostname() },
  ]) {
    const home = sandbox();
    const env = stubEnv(home);
    fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
    fs.writeFileSync(L.lockPath(home), JSON.stringify(lock));
    const r = update(env);
    assert.match(r.out, /took over update\.lock/, `no takeover was logged:\n${r.out.slice(-400)}`);
    assert.ok(r.status !== 2, 'a takeover was refused');
    assert.ok(!fs.existsSync(L.lockPath(home)), 'the lock survived the run that took it');
    fs.rmSync(home, { recursive: true, force: true });
  }
});

it('the lock is released after a normal run and a failing one, and a dry run takes none', () => {
  const home = sandbox();
  const ok = update(stubEnv(home));
  assert.ok(ok.status !== 2);
  assert.ok(!fs.existsSync(L.lockPath(home)), 'the lock survived a normal run');
  // failing: every tool it drives exits 1, so the run ends non-zero — through process.exit paths too
  const bad = update(stubEnv(home, { git: '#!/bin/sh\nexit 1\n', npx: '#!/bin/sh\nexit 1\n', claude: '#!/bin/sh\nexit 1\n' }));
  assert.strictEqual(bad.status, 1, `the failing run did not fail: ${bad.status}`);
  assert.ok(!fs.existsSync(L.lockPath(home)), 'the lock survived a failing run');
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: process.pid, startedAt: Date.now(), host: os.hostname() }));
  const dry = update(stubEnv(home), ['--dry-run']);
  assert.ok(dry.status !== 2, 'a preview was refused by a lock — it writes nothing and needs none');
  fs.rmSync(home, { recursive: true, force: true });
});

// --- schemaVersion ---------------------------------------------------------

it('every state.json writer stamps schemaVersion: 1, and an older file is still read', () => {
  assert.strictEqual(store.STATE_SCHEMA, 1);
  const home = sandbox();
  const dir = path.join(home, '.sshlg-skills');
  fs.mkdirSync(dir, { recursive: true });
  const state = path.join(dir, 'state.json');
  const read = () => JSON.parse(fs.readFileSync(state, 'utf8'));
  // an OLD file: no schemaVersion, an updateCheck from before this contract
  fs.writeFileSync(state, JSON.stringify({ routers: 'yes', updateCheck: { at: 1, latest: '1.0.0' } }));
  const env = stubEnv(home);

  spawnSync('node', [path.join(ROOT, 'lib', 'updateprobe.js')], { env, encoding: 'utf8' });
  assert.strictEqual(read().schemaVersion, 1, 'updateprobe did not stamp');
  assert.strictEqual(read().routers, 'yes', 'the writer lost a key it does not own');
  assert.strictEqual(read().updateCheck.latest, '9.9.9');

  fs.writeFileSync(state, JSON.stringify({ routers: 'yes' }));
  spawnSync('node', [path.join(ROOT, 'lib', 'handoffprobe.js'), 'o/r'], { env, encoding: 'utf8' });
  assert.strictEqual(read().schemaVersion, 1, 'handoffprobe did not stamp');
  assert.ok(read().inbound, 'handoffprobe recorded nothing');

  fs.writeFileSync(state, JSON.stringify({ routers: 'yes' }));
  spawnSync('node', [path.join(ROOT, 'lib', 'updaterun.js')], { env, encoding: 'utf8' });
  assert.strictEqual(read().schemaVersion, 1, 'updaterun did not stamp');

  fs.writeFileSync(state, JSON.stringify({ routers: 'yes' }));
  require('../lib/consent.js').writeState(home, { routers: 'no' });
  assert.strictEqual(read().schemaVersion, 1, 'consent.writeState did not stamp');
  assert.strictEqual(read().routers, 'no');
  fs.rmSync(home, { recursive: true, force: true });
});

// --- signals stop `update` (fix round #1) ------------------------------------
//
// The run is synchronous (spawnSync per step). A JS signal handler replaced Node's default
// terminate action and could only run after the whole body had finished, so Ctrl-C and a
// supervisor's SIGTERM no longer stopped `update`. Real process, a step that sleeps 5 s.
const SIGNAL_DRIVER = `
const { spawn } = require('child_process'); const fs = require('fs');
const [bin, mark, sig, group] = process.argv.slice(1);
const child = spawn(process.execPath, [bin, 'update'], { detached: true, stdio: 'ignore' });
let at = 0;
child.on('exit', (code, signal) => {
  try { process.kill(-child.pid, 'SIGKILL'); } catch (e) {}
  console.log(JSON.stringify({ code, signal, ms: at ? Date.now() - at : -1, pid: child.pid }));
  process.exit(0);
});
const t0 = Date.now();
const iv = setInterval(() => {
  if (!at && fs.existsSync(mark)) {
    at = Date.now();
    if (group === '1') process.kill(-child.pid, sig); else process.kill(child.pid, sig);
  } else if (Date.now() - t0 > 30000) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch (e) {}
    console.log(JSON.stringify({ timeout: true, signalled: Boolean(at) })); process.exit(0);
  }
}, 20);`;

for (const [sig, group] of [['SIGTERM', '0'], ['SIGINT', '1']]) {
  it(`${sig} to the ${group === '1' ? 'process group' : 'pid'} stops a running \`update\` within 2 s; the next run takes the lock over (#1)`, () => {
    const home = sandbox();
    const mark = path.join(home, 'npx-started');
    const env = stubEnv(home, { npx: `#!/bin/sh\ntouch "${mark}"\nsleep 5\nexit 0\n` });
    const r = spawnSync(process.execPath, ['-e', SIGNAL_DRIVER, path.join(ROOT, 'bin', 'sshlg-skills.js'), mark, sig, group],
      { env, encoding: 'utf8', timeout: 40000 });
    const res = JSON.parse((r.stdout || '').trim().split('\n').pop() || '{}');
    assert.ok(!res.timeout, res.signalled
      ? `update was still running 30 s after ${sig} — the signal did not stop it`
      : `the update never reached the sleeping step: ${r.stdout}${r.stderr}`);
    assert.strictEqual(res.signal, sig, `update did not end by ${sig}: ${JSON.stringify(res)}`);
    assert.ok(res.ms >= 0 && res.ms < 2000, `update took ${res.ms} ms to stop after ${sig}`);
    assert.ok(fs.existsSync(L.lockPath(home)), 'the killed run left no lock — the takeover below proves nothing');
    const next = update(stubEnv(home));
    assert.ok(new RegExp(`took over update\\.lock — holder pid ${res.pid} is not running`).test(next.out),
      `the next update did not take over the dead holder's lock:\n${next.out.slice(0, 400)}`);
    assert.strictEqual(next.status, 0, `the next update failed: ${next.status}`);
    fs.rmSync(home, { recursive: true, force: true });
  });
}

// --- the idle updater and a held lock (fix round #4) -------------------------
it('an update.lock held elsewhere (exit 2) is recorded as busy, not a failure, and the next idle retries (#4)', () => {
  const chk = require('../lib/updatecheck.js');
  const home = sandbox();
  const state = path.join(home, '.sshlg-skills', 'state.json');
  fs.mkdirSync(path.dirname(state), { recursive: true });
  fs.writeFileSync(state, JSON.stringify({ updateCheck: { at: Date.now(), latest: '9.9.9' } }));
  const env = stubEnv(home, { npx: '#!/bin/sh\necho "update: refused — another update is running (pid 1, started 3 s ago)."\nexit 2\n' });
  spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js')], { env, encoding: 'utf8' });
  const uc = JSON.parse(fs.readFileSync(state, 'utf8')).updateCheck;
  assert.notStrictEqual(uc.ok, false, `a busy lock was recorded as a failed update: ${JSON.stringify(uc)}`);
  assert.ok(Number.isFinite(uc.busyAt), `the busy outcome was not recorded: ${JSON.stringify(uc)}`);
  assert.strictEqual(chk.ranLine(uc), '', 'a busy lock printed an unattended-update line');
  assert.strictEqual(chk.shouldAutoUpdate({}, Object.assign({}, uc, { self: '1.0.0' }), Date.now()).run, false,
    'an idle ping right after a busy exit spawned another update (G)');
  assert.strictEqual(chk.shouldAutoUpdate({}, Object.assign({}, uc, { self: '1.0.0' }),
    Date.now() + chk.BUSY_BACKOFF_MS + 1000).run, true, 'the idle updater never retries after a busy lock');
  // the control: a real failure (exit 1) IS recorded as ok:false
  spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js')],
    { env: stubEnv(home, { npx: '#!/bin/sh\nexit 1\n' }), encoding: 'utf8' });
  assert.strictEqual(JSON.parse(fs.readFileSync(state, 'utf8')).updateCheck.ok, false, 'the control failure was not recorded');
  fs.rmSync(home, { recursive: true, force: true });
});

// --- no stale outcome during or after a run (fix round 2, B) -----------------
//
// The stamp kept the previous run's `ok/from/to`, so a SessionStart while the idle updater
// was still running reported the PREVIOUS outcome as this attempt's ("FAILED — run update"
// while that run held the lock), and recorded the stamp as reported; after a busy exit only
// `ranAt` came back, and the line printed again.
function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function waitFor(pred, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (pred()) return true; sleepMs(50); }
  return pred();
}

it('a SessionStart while the idle updater runs, and after it exits busy, prints no ran line (B)', () => {
  const chk = require('../lib/updatecheck.js');
  const { spawn } = require('child_process');
  const home = sandbox();
  const state = path.join(home, '.sshlg-skills', 'state.json');
  fs.mkdirSync(path.dirname(state), { recursive: true });
  const t0 = Date.now() - 2 * 24 * 3600 * 1000;
  // the last run FAILED and that was already said
  fs.writeFileSync(state, JSON.stringify({ updateCheck: Object.assign(
    { at: Date.now(), latest: null }, chk.ranRecord('1.0.0', null, false, t0), chk.reportedRecord(t0)) }));
  const env = stubEnv(home, { npx: '#!/bin/sh\nsleep 2\necho "update: refused — another update is running."\nexit 2\n' });
  const run = spawn(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js')], { env, stdio: 'ignore' });
  const ctx = () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'session-start.js')],
      { env, encoding: 'utf8', input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', session_id: 's' }) });
    return JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  };
  try {
    assert.ok(waitFor(() => store.readJson(state).updateCheck.ranAt > t0, 5000), 'the updater never stamped its run');
    const during = ctx();
    assert.ok(!/unattended set update|updated while you were away/.test(during),
      `a SessionStart during the run reported the previous outcome as this one's:\n${during}`);
    assert.ok(waitFor(() => Number.isFinite(store.readJson(state).updateCheck.busyAt), 8000), 'the busy exit was never recorded');
    const after = ctx();
    assert.ok(!/unattended set update|updated while you were away/.test(after),
      `after a busy exit the previous outcome was reported again:\n${after}`);
    const uc = store.readJson(state).updateCheck;
    assert.deepStrictEqual([uc.ranAt, uc.ok, uc.reportedRanAt], [t0, false, t0], `the previous outcome was not restored: ${JSON.stringify(uc)}`);
  } finally {
    try { run.kill(); } catch (e) { /* already gone */ }
    fs.rmSync(home, { recursive: true, force: true });
  }
});

it('no writer merges updateCheck caller-side: every sub-key write is a function of the file (I)', () => {
  const offenders = [];
  for (const rel of ['lib/updaterun.js', 'lib/updateprobe.js', 'hooks/session-start.js']) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/updateCheck:\s*Object\.assign/.test(text)) offenders.push(rel);
    if (!/store\.nested\('updateCheck'/.test(text)) offenders.push(`${rel} (no nested write)`);
  }
  assert.deepStrictEqual(offenders, [], 'updateCheck is still merged from a copy the caller read earlier');
});

// --- the probe merges into updateCheck (fix round #6) ------------------------
it('the registry probe keeps ranAt/from/to/ok, so the idle interval guard survives (#6)', () => {
  const chk = require('../lib/updatecheck.js');
  const home = sandbox();
  const state = path.join(home, '.sshlg-skills', 'state.json');
  fs.mkdirSync(path.dirname(state), { recursive: true });
  const ranAt = Date.now() - 1000;
  fs.writeFileSync(state, JSON.stringify({ updateCheck: { at: 1, latest: '9.9.9', ranAt, from: '1.0.0', to: '9.9.8', ok: true } }));
  spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updateprobe.js')], { env: stubEnv(home), encoding: 'utf8' });
  const uc = JSON.parse(fs.readFileSync(state, 'utf8')).updateCheck;
  assert.strictEqual(uc.ranAt, ranAt, `the probe erased ranAt: ${JSON.stringify(uc)}`);
  assert.deepStrictEqual([uc.from, uc.to, uc.ok], ['1.0.0', '9.9.8', true]);
  assert.ok(uc.at > 1 && uc.latest === '9.9.9', 'the probe did not record its own answer');
  assert.strictEqual(chk.shouldAutoUpdate({}, Object.assign({}, uc, { self: '1.0.0' }), Date.now()).run, false,
    'right after a run the idle updater would run again');
  fs.rmSync(home, { recursive: true, force: true });
});

// --- the unattended run is reported next session (fix round, risk j) ---------
it('after an unattended run the next SessionStart says what it did (risk j)', () => {
  const home = sandbox();
  const env = stubEnv(home, { npx: '#!/bin/sh\nmkdir -p "$HOME/.sshlg-skills/runtime"\necho \'{"version":"9.9.9"}\' > "$HOME/.sshlg-skills/runtime/package.json"\nexit 0\n' });
  spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js')], { env, encoding: 'utf8' });
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'session-start.js')],
    { env, encoding: 'utf8', input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', session_id: 's' }) });
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.ok(/The set updated while you were away: [\d.]+ → 9\.9\.9/.test(ctx),
    `the run was recorded and never reported:\n${ctx}`);
  fs.rmSync(home, { recursive: true, force: true });
});

// --- one writer for state.json (fix round #5, #6, risk g) ---------------------
it('every state.json writer goes through store.writeJson: 0600, written by rename, keys merged (risk g)', () => {
  const home = sandbox();
  const state = path.join(home, '.sshlg-skills', 'state.json');
  const env = stubEnv(home);
  const writers = [
    ['updateprobe', () => spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updateprobe.js')], { env })],
    ['handoffprobe', () => spawnSync(process.execPath, [path.join(ROOT, 'lib', 'handoffprobe.js'), 'o/r'], { env })],
    ['updaterun', () => spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js')], { env })],
    ['session-start', () => spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'session-start.js')],
      { env, input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }) })],
    ['consent', () => require('../lib/consent.js').writeState(home, { routers: 'yes' })],
  ];
  // session-start writes only when it has something to record: an unattended run to mark
  // as reported is one (the injectors set is the other, and needs a plugin registry)
  const seed = { 'session-start': { updateCheck: require('../lib/updatecheck.js').ranRecord('1.0.0', '9.9.9', true, Date.now()) } };
  for (const [name, run] of writers) {
    fs.mkdirSync(path.dirname(state), { recursive: true });
    fs.writeFileSync(state, JSON.stringify(Object.assign({ routers: 'yes', keep: 1 }, seed[name])), { mode: 0o644 });
    fs.chmodSync(state, 0o644);
    // A hard link to the seeded file: a rename leaves it holding the seed, an in-place
    // rewrite changes it too. Comparing inode NUMBERS was the first version, and it failed on
    // CI's ext4, which hands a freed inode number straight back to the next file — a writer
    // that renames twice ends on the number it started with (retro #11: suspect the checker).
    const link = `${state}.seed-link`;
    try { fs.unlinkSync(link); } catch (e) { /* none yet */ }
    fs.linkSync(state, link);
    const seeded = fs.readFileSync(link, 'utf8');
    run();
    const st = fs.statSync(state);
    assert.strictEqual(st.mode & 0o777, 0o600, `${name} left state.json at ${(st.mode & 0o777).toString(8)}`);
    assert.strictEqual(fs.readFileSync(link, 'utf8'), seeded, `${name} rewrote state.json in place, not by rename`);
    fs.unlinkSync(link);
    const after = JSON.parse(fs.readFileSync(state, 'utf8'));
    assert.strictEqual(after.keep, 1, `${name} dropped a key it does not own`);
    assert.strictEqual(after.schemaVersion, 1, `${name} did not stamp schemaVersion`);
  }
  const leftovers = fs.readdirSync(path.dirname(state)).filter((n) => n.includes('.tmp'));
  assert.deepStrictEqual(leftovers, [], 'a temp file was left behind');
  fs.rmSync(home, { recursive: true, force: true });
});

it('nothing outside lib/store.js writes state.json directly (risk g)', () => {
  const offenders = [];
  for (const dir of ['lib', 'hooks', 'bin']) {
    for (const n of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.js'))) {
      const rel = `${dir}/${n}`;
      if (rel === 'lib/store.js') continue;
      const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!/writeFileSync\(|renameSync\(/.test(line)) return;
        const near = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        if (/state\.json|statePath/.test(near)) offenders.push(`${rel}:${i + 1}`);
      });
    }
  }
  assert.deepStrictEqual(offenders, [], 'state.json is written outside its one writer');
});

// --- the documented keys are the written keys (fix round #5) ------------------
it('docs/working-rules/state-json.md documents every updateCheck key the code writes (#5)', () => {
  const chk = require('../lib/updatecheck.js');
  const doc = fs.readFileSync(path.join(ROOT, 'docs', 'working-rules', 'state-json.md'), 'utf8');
  const row = doc.split('\n').find((l) => l.startsWith('| `updateCheck` |'));
  assert.ok(row, 'the updateCheck row is gone from the contract');
  const m = /`\{([^}]*)\}`/.exec(row);
  assert.ok(m, 'the updateCheck row lists no keys');
  const documented = new Set(m[1].split(',').map((k) => k.trim()).filter((k) => k && k !== '...' && k !== '…'));
  const written = new Set(Object.keys(chk.record('1.0.0', 1))
    .concat(Object.keys(chk.ranRecord('1.0.0', '1.0.1', true, 1)))
    .concat(Object.keys(chk.busyRecord(1)))
    .concat(Object.keys(chk.reportedRecord(1))));
  assert.ok(written.size >= 6, `the collector saw too few keys: ${[...written]}`);
  const missing = [...written].filter((k) => !documented.has(k));
  assert.deepStrictEqual(missing, [], `written and undocumented: ${missing.join(', ')}`);
  const phantom = [...documented].filter((k) => !written.has(k));
  assert.deepStrictEqual(phantom, [], `documented and never written: ${phantom.join(', ')}`);
});

for (const d of STUB_DIRS) fs.rmSync(d, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
