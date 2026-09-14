#!/usr/bin/env node
'use strict';
// Fixtures for lib/quarantine.js — the recoverable-prune store.
//
// The incident this suite exists for, measured 2026-09-14 on v1.48.3: the store is
// keyed by skill id, `capture` wrote its entry BLIND, and a second run over the same
// id threw `EEXIST` out of `pruneClaudeShadows`. `update` died there — after the
// skills CLI had created the plain copies and before anything pruned them — leaving
// 20 shadowed plugins on the operator's machine, which is worse than the state the
// command started in. A recovery mechanism that breaks the command it protects is the
// failure mode worth a suite of its own.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'qtine-'));
  const realHome = process.env.HOME;
  process.env.HOME = home;
  // The module reads os.homedir(), which honours $HOME on POSIX.
  const saved = os.homedir;
  os.homedir = () => home;
  delete require.cache[require.resolve('../lib/quarantine.js')];
  const q = require('../lib/quarantine.js');
  try {
    fs.mkdirSync(path.join(home, '.claude', 'skills'), { recursive: true });
    fn(q, home);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  } finally {
    os.homedir = saved;
    process.env.HOME = realHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
}

function plantSymlink(home, id, target) {
  const p = path.join(home, '.claude', 'skills', id);
  fs.symlinkSync(target, p);
  return p;
}

it('capture stores a symlink and verifies it landed', (q, home) => {
  plantSymlink(home, 'vision', '../../.agents/skills/vision');
  const row = q.capture('vision');
  assert.ok(row, 'capture returned null for a plain symlink');
  assert.strictEqual(row.kind, 'symlink');
  assert.strictEqual(row.target, '../../.agents/skills/vision');
});

it('a SECOND capture of the same id does not throw — the incident', (q, home) => {
  plantSymlink(home, 'vision', '../../.agents/skills/vision');
  assert.ok(q.capture('vision'), 'first capture failed');
  // Same id, a second run. v1.48.3 threw EEXIST here and killed `update`.
  const again = q.capture('vision');
  assert.ok(again, 'the second capture returned null');
  assert.strictEqual(again.kind, 'symlink');
});

it('a capture that cannot be verified returns null rather than authorising a delete', (q, home) => {
  const row = q.capture('not-there');
  assert.strictEqual(row, null, 'captured something that does not exist');
});

it('rollPrevious archives the whole store under the stamp it was written with', (q, home) => {
  plantSymlink(home, 'vision', '../../.agents/skills/vision');
  const row = q.capture('vision');
  q.writeManifest([row], 'skills-all-20260910-083628');
  const archive = q.rollPrevious();
  assert.ok(archive, 'rollPrevious returned null over a real store');
  assert.ok(archive.endsWith(path.join('archive', 'skills-all-20260910-083628')), archive);
  // lstat, not exists: the entry is a symlink whose target is deliberately absent in
  // the fixture, and existsSync follows the link — it would report the moved entry gone.
  assert.ok(fs.lstatSync(path.join(archive, 'vision')).isSymbolicLink(), 'the entry did not move');
  assert.ok(fs.existsSync(path.join(archive, 'manifest.json')), 'the manifest did not move');
  assert.ok(!fs.existsSync(path.join(q.quarantineDir(), 'vision')) &&
    !fs.readdirSync(q.quarantineDir()).includes('vision'),
    'the entry is still in the live store — a later capture would collide again');
});

it('rollPrevious over an empty store is a no-op, not a failure', (q) => {
  assert.strictEqual(q.rollPrevious(), null);
});

it('rolling then capturing keeps BOTH the old bytes and the new', (q, home) => {
  const p = path.join(home, '.claude', 'skills', 'edited');
  fs.writeFileSync(p, 'the operator edited this');
  const first = q.capture('edited');
  q.writeManifest([first], 'stamp-one');
  const archive = q.rollPrevious();
  fs.writeFileSync(p, 'a later, different copy');
  const second = q.capture('edited');
  assert.strictEqual(fs.readFileSync(path.join(archive, 'edited'), 'utf8'),
    'the operator edited this', 'the archived bytes were overwritten — the store lost the only copy');
  assert.strictEqual(second.bytes, 'a later, different copy');
});

it('restore reconstructs the exact type and bytes from the live manifest', (q, home) => {
  const p = path.join(home, '.claude', 'skills', 'edited');
  fs.writeFileSync(p, 'bytes that must come back');
  const row = q.capture('edited');
  q.writeManifest([row], 'stamp-two');
  fs.rmSync(p);
  const back = q.restore('edited');
  assert.ok(back, 'restore returned null');
  assert.strictEqual(fs.readFileSync(p, 'utf8'), 'bytes that must come back');
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: quarantine — ${checks} checks`);
