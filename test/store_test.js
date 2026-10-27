#!/usr/bin/env node
'use strict';
// Fixtures for lib/store.js — the JSON files under ~/.sshlg-skills/.
//
// The property that matters is the one Node does NOT give you for free:
// writeFileSync's `mode` is passed only to open(), so on an ALREADY EXISTING
// file it is ignored entirely, and on creation it is masked by the umask.
// A file holding a decision about the operator's global instructions must be
// 0600 in both cases, which takes an explicit chmod. That is what these
// fixtures watch.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const S = require('../lib/store.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-store-'));
}
function modeOf(file) {
  return fs.statSync(file).mode & 0o777;
}

it('a missing file reads as an empty object, not a throw', () => {
  const home = tmpHome();
  assert.deepStrictEqual(S.readJson(path.join(home, 'nope.json')), {});
});

it('a file we cannot parse reads as empty — a broken file is not an answer', () => {
  const home = tmpHome();
  const f = path.join(home, 'broken.json');
  fs.writeFileSync(f, '{ this is not json');
  assert.deepStrictEqual(S.readJson(f), {});
});

it('a JSON scalar is not a state object', () => {
  const home = tmpHome();
  const f = path.join(home, 'scalar.json');
  fs.writeFileSync(f, '"just a string"');
  assert.deepStrictEqual(S.readJson(f), {});
});

it('writeJson creates the parent directory and merges', () => {
  const home = tmpHome();
  const f = path.join(home, '.sshlg-skills', 'x.json');
  S.writeJson(f, { a: 1 });
  S.writeJson(f, { b: 2 });
  assert.deepStrictEqual(S.readJson(f), { a: 1, b: 2 });
});

it('a new file is 0600 despite the umask', () => {
  const home = tmpHome();
  const f = path.join(home, '.sshlg-skills', 'new.json');
  const old = process.umask(0o000); // the permissive case: no mask to hide behind
  try {
    S.writeJson(f, { a: 1 });
  } finally {
    process.umask(old);
  }
  assert.strictEqual(modeOf(f), 0o600, 'a fresh state file is world-readable');
});

it('an EXISTING loose file is tightened to 0600 — the case `mode` cannot reach', () => {
  const home = tmpHome();
  const f = path.join(home, 'loose.json');
  fs.writeFileSync(f, '{}');
  fs.chmodSync(f, 0o644);
  S.writeJson(f, { a: 1 });
  assert.strictEqual(modeOf(f), 0o600, 'writeFileSync mode is ignored on an existing file');
});

it('deleting a key: an explicit undefined removes it', () => {
  const home = tmpHome();
  const f = path.join(home, 'del.json');
  S.writeJson(f, { a: 1, b: 2 });
  S.writeJson(f, { a: undefined });
  assert.deepStrictEqual(S.readJson(f), { b: 2 });
});

// --- read-modify-write inside the writer (fix round 2, I) --------------------
//
// `updateCheck` is shared by three processes — the registry probe, the idle updater and the
// session-start hook — and each merged its sub-keys caller-side: read the file, build the
// object, write it. A writer that landed between that read and that write was erased. The
// patch is now a function applied to the file as it is at write time, under a short lock.

it('a function patch sees the file as it is at write time, not as the caller last read it (I)', () => {
  const file = path.join(tmpHome(), 'state.json');
  S.writeJson(file, { updateCheck: { at: 1, latest: '1.0.0' }, keep: 1 });
  const stale = S.readJson(file);                      // a caller reads …
  S.writeJson(file, S.nested('updateCheck', { reportedRanAt: 7 }));   // … another writer lands …
  S.writeJson(file, S.nested('updateCheck', { ranAt: 9, ok: undefined }, { schemaVersion: 1 }));
  const got = S.readJson(file);
  assert.deepStrictEqual(got.updateCheck, { at: 1, latest: '1.0.0', reportedRanAt: 7, ranAt: 9 },
    `a sub-key written by another writer was lost: ${JSON.stringify(got)}`);
  assert.strictEqual(got.keep, 1);
  assert.strictEqual(got.schemaVersion, 1);
  assert.ok(stale.updateCheck && !('reportedRanAt' in stale.updateCheck), 'the fixture did not interleave');
  // a plain function patch, too
  S.writeJson(file, (cur) => Object.assign({}, cur, { n: (cur.n || 0) + 1 }));
  S.writeJson(file, (cur) => Object.assign({}, cur, { n: (cur.n || 0) + 1 }));
  assert.strictEqual(S.readJson(file).n, 2);
  assert.deepStrictEqual(fs.readdirSync(path.dirname(file)).filter((n) => n !== 'state.json'), [],
    'a lock or temp file was left behind');
});

it('four processes interleaving updateCheck writes lose none of them (I)', () => {
  const home = tmpHome();
  const file = path.join(home, 'state.json');
  const per = 30;
  const writer = path.join(home, 'w.js');
  fs.writeFileSync(writer, `const S = require(${JSON.stringify(path.join(__dirname, '..', 'lib', 'store.js'))});
const [file, id, per] = process.argv.slice(2);
for (let i = 1; i <= Number(per); i += 1) {
  S.writeJson(file, (cur) => {
    const uc = Object.assign({}, cur.updateCheck);
    uc['k' + id] = (uc['k' + id] || 0) + 1;
    return Object.assign({}, cur, { updateCheck: uc });
  });
}
`);
  const { spawnSync } = require('child_process');
  const cmd = [0, 1, 2, 3].map((i) => `node "${writer}" "${file}" ${i} ${per} &`).join(' ') + ' wait';
  spawnSync('sh', ['-c', cmd], { encoding: 'utf8' });
  const uc = S.readJson(file).updateCheck || {};
  assert.deepStrictEqual([uc.k0, uc.k1, uc.k2, uc.k3], [per, per, per, per],
    `interleaved writers lost updates: ${JSON.stringify(uc)}`);
  assert.deepStrictEqual(fs.readdirSync(home).filter((n) => !['state.json', 'w.js'].includes(n)), [],
    'a lock or temp file was left behind');
});

it('a lock left by a dead writer does not block the next write for long (I)', () => {
  const file = path.join(tmpHome(), 'state.json');
  fs.writeFileSync(`${file}.lock`, '999999');
  const old = (Date.now() - 60 * 1000) / 1000;
  fs.utimesSync(`${file}.lock`, old, old);
  const t0 = Date.now();
  S.writeJson(file, { a: 1 });
  assert.strictEqual(S.readJson(file).a, 1);
  assert.ok(Date.now() - t0 < 1500, `a stale lock held the write for ${Date.now() - t0} ms`);
  // and a fresh one held by nobody is waited out, never a hang
  fs.writeFileSync(`${file}.lock`, '999999');
  const t1 = Date.now();
  S.writeJson(file, { b: 2 });
  assert.strictEqual(S.readJson(file).b, 2, 'a write behind a held lock was dropped');
  assert.ok(Date.now() - t1 < 3000, `a held lock hung the writer for ${Date.now() - t1} ms`);
  try { fs.unlinkSync(`${file}.lock`); } catch (e) { /* the writer may have broken it */ }
});

// Final polish, item 2: withLock must never spin. Two retry paths skipped the deadline — a
// lock whose stat failed (a dangling symlink at `<file>.lock`: `wx` says EEXIST, `stat`
// follows the link and says ENOENT) and a stale lock that could not be unlinked (a read-only
// directory) — and looped for ever. Each runs in a child process with a hard timeout, so a
// regression fails this check instead of hanging the suite.
function boundedWrite(file) {
  const { spawnSync } = require('child_process');
  const code = `const S = require(${JSON.stringify(path.join(__dirname, '..', 'lib', 'store.js'))});
try { S.writeJson(${JSON.stringify(file)}, { a: 1 }); console.log('wrote'); } catch (e) { console.log('threw ' + e.code); }`;
  const limit = (S.LOCK_WAIT_MS || 1000) + 4000;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: limit, killSignal: 'SIGKILL' });
  return { ms: Date.now() - t0, out: (r.stdout || '').trim(), signal: r.signal, limit };
}

it('a dead writer\'s lock in a read-only directory: writeJson returns or throws within the wait (final polish 2)', () => {
  const dir = path.join(tmpHome(), 'ro');
  fs.mkdirSync(dir);
  const file = path.join(dir, 'state.json');
  fs.writeFileSync(file, '{}\n');
  fs.writeFileSync(`${file}.lock`, '999999');
  const old = (Date.now() - 60 * 1000) / 1000;
  fs.utimesSync(`${file}.lock`, old, old);
  fs.chmodSync(dir, 0o500);
  try {
    const r = boundedWrite(file);
    assert.ok(!r.signal, `writeJson spun past ${r.limit} ms on an unremovable stale lock (killed by ${r.signal})`);
    assert.ok(/^(wrote|threw)/.test(r.out), `no outcome: ${r.out}`);
  } finally {
    fs.chmodSync(dir, 0o700);
  }
});

it('a dangling symlink at <file>.lock: writeJson returns within the wait and writes (final polish 2)', () => {
  const home = tmpHome();
  const file = path.join(home, 'state.json');
  fs.symlinkSync(path.join(home, 'nowhere', 'gone'), `${file}.lock`);
  const r = boundedWrite(file);
  assert.ok(!r.signal, `writeJson spun past ${r.limit} ms on a dangling symlink lock (killed by ${r.signal})`);
  assert.strictEqual(r.out, 'wrote', `the write did not happen: ${r.out}`);
  assert.strictEqual(S.readJson(file).a, 1);
});

// B-227: a live holder is waited for, never written past or broken as stale. A writer that
// waited LOCK_WAIT_MS (1 s) wrote past a live holder, and a lock older than LOCK_STALE_MS
// (2 s) was removed while its holder still ran; either way the holder's rename then
// replaced the file with a version read before the other write, and that write was lost.
// The holder here keeps the lock for 2.5 s, past both old bounds, deterministically.
function slowHolder(file, marker, holdMs) {
  const { spawn } = require('child_process');
  const code = `const fs=require('fs'),S=require(${JSON.stringify(path.join(__dirname, '..', 'lib', 'store.js'))});
S.writeJson(${JSON.stringify(file)}, (cur) => { fs.writeFileSync(${JSON.stringify(marker)}, 'held');
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${holdMs}); return Object.assign({}, cur, { holder: 1 }); });
fs.writeFileSync(${JSON.stringify(marker + '.done')}, 'done');`;
  return spawn(process.execPath, ['-e', code], { stdio: ['ignore', 'ignore', 'pipe'] });
}
function waitFor(cond, ms) {
  const end = Date.now() + ms;
  while (!cond()) { if (Date.now() > end) return false; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10); }
  return true;
}
it('B-227: a live holder past the old wait and stale bounds keeps the waiter\'s write', () => {
  const home = tmpHome();
  const file = path.join(home, 'config.json');
  const marker = path.join(home, 'held');
  S.writeJson(file, { seed: 1 });
  slowHolder(file, marker, 2500);
  assert.ok(waitFor(() => fs.existsSync(marker), 10000), 'the holder never took the lock');
  S.writeJson(file, (cur) => Object.assign({}, cur, { waiter: 1 }));
  assert.ok(waitFor(() => fs.existsSync(marker + '.done'), 15000), 'the holder did not finish');
  const got = S.readJson(file);
  assert.deepStrictEqual([got.seed, got.holder, got.waiter], [1, 1, 1], `a write was lost: ${JSON.stringify(got)}`);
  assert.ok(!fs.existsSync(`${file}.lock`), 'the lock was left behind');
});
it('B-227: a holder whose lock was broken and replaced leaves the successor\'s lock alone', () => {
  const file = path.join(tmpHome(), 'state.json');
  S.writeJson(file, (cur) => {
    fs.unlinkSync(`${file}.lock`);                                   // broken as stale by another …
    fs.writeFileSync(`${file}.lock`, String(process.ppid || 1));     // … who now holds it
    return Object.assign({}, cur, { a: 1 });
  });
  assert.ok(fs.existsSync(`${file}.lock`), 'the holder removed a lock it no longer owned');
  fs.unlinkSync(`${file}.lock`);
});
it('B-227: a live holder that never lets go makes the waiter fail loudly, not write past', () => {
  const home = tmpHome();
  const file = path.join(home, 'state.json');
  S.writeJson(file, { seed: 1 });
  fs.writeFileSync(`${file}.lock`, String(process.pid));             // held by a live process (this one)
  const t0 = Date.now();
  let code = null;
  try { S.writeJson(file, { b: 2 }); } catch (e) { code = e.code; }
  assert.strictEqual(code, 'ELOCKED', 'a write past a live holder can be lost');
  assert.strictEqual(S.readJson(file).b, undefined);
  assert.ok(Date.now() - t0 < S.LOCK_WAIT_MS + 2000, `the waiter hung for ${Date.now() - t0} ms`);
  fs.unlinkSync(`${file}.lock`);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
