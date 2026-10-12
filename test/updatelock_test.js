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

it('a lock older than 30 minutes is taken over even when its pid is alive', () => {
  const d = L.decide({ pid: 1, startedAt: NOW - 31 * MIN, host: 'h' }, NOW, true);
  assert.strictEqual(d.action, 'takeover');
  assert.match(d.reason, /stale/);
  assert.strictEqual(L.decide({ pid: 1, startedAt: NOW - 29 * MIN, host: 'h' }, NOW, true).action, 'refuse',
    'a 29 minute lock is still young');
});

it('a young lock whose pid is dead is taken over', () => {
  const d = L.decide({ pid: 999999, startedAt: NOW - MIN, host: 'h' }, NOW, false);
  assert.strictEqual(d.action, 'takeover');
  assert.match(d.reason, /not running/);
});

it('a lock without a readable startedAt is not a reason to refuse for ever', () => {
  assert.strictEqual(L.decide({ pid: 1 }, NOW, true).action, 'takeover');
  assert.strictEqual(L.decide({ pid: 1, startedAt: 'x' }, NOW, true).action, 'takeover');
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

it('a stale lock is taken over and the takeover is reported', () => {
  const home = sandbox();
  fs.mkdirSync(path.dirname(L.lockPath(home)), { recursive: true });
  fs.writeFileSync(L.lockPath(home), JSON.stringify({ pid: 77, startedAt: NOW - 45 * MIN, host: 'h1' }));
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

function stubEnv(home, extra) {
  const stubs = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-lock-stubs-'));
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

it('a stale and a dead-pid lock are taken over by the real command, and the lock is gone after', () => {
  for (const lock of [
    { pid: process.pid, startedAt: Date.now() - 31 * MIN, host: os.hostname() },
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
  fs.writeFileSync(state, JSON.stringify({ routers: 'yes', updateCheck: { checkedAt: 1, latest: '1.0.0' } }));
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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
