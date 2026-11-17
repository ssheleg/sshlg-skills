#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
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

// B-355: the prune deleted under CLAUDE_CONFIG_DIR while the quarantine read and
// wrote under ~/.claude, so with both copies present the uncaptured one was removed.
it('capture, prune and restore work under CLAUDE_CONFIG_DIR, never under ~/.claude', (q, home) => {
  const alt = path.join(home, 'switchboard-profile');
  fs.mkdirSync(path.join(alt, 'skills'), { recursive: true });
  fs.writeFileSync(path.join(alt, 'skills', 'vision'), 'the copy Claude reads');
  fs.writeFileSync(path.join(home, '.claude', 'skills', 'vision'), 'an unrelated copy');
  const saved = process.env.CLAUDE_CONFIG_DIR;
  process.env.CLAUDE_CONFIG_DIR = alt;
  try {
    const r = q.prune(['vision'], { stamp: 'stamp-env' });
    assert.deepStrictEqual(r.pruned, ['vision']);
    assert.ok(!fs.existsSync(path.join(alt, 'skills', 'vision')), 'the copy under the profile was not pruned');
    assert.strictEqual(fs.readFileSync(path.join(home, '.claude', 'skills', 'vision'), 'utf8'), 'an unrelated copy',
      'the copy under ~/.claude was touched');
    assert.ok(q.quarantineDir().startsWith(alt), `quarantine outside the profile: ${q.quarantineDir()}`);
    assert.ok(q.restore('vision'), 'restore returned null');
    assert.strictEqual(fs.readFileSync(path.join(alt, 'skills', 'vision'), 'utf8'), 'the copy Claude reads');
  } finally {
    if (saved === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = saved;
  }
});

it('a binary file survives capture and restore byte for byte', (q, home) => {
  const p = path.join(home, '.claude', 'skills', 'bin');
  const bytes = Buffer.from([0, 255, 128, 10, 0xc3, 0x28, 1, 2]);   // 0xc3 0x28 is not UTF-8
  fs.writeFileSync(p, bytes);
  const r = q.prune(['bin'], { stamp: 'stamp-bin' });
  assert.deepStrictEqual(r.pruned, ['bin']);
  assert.ok(q.restore('bin'), 'restore returned null');
  assert.ok(fs.readFileSync(p).equals(bytes), 'the restored bytes differ');
});

it('a directory capture is verified by its contents, and restores them', (q, home) => {
  const d = path.join(home, '.claude', 'skills', 'tree');
  fs.mkdirSync(path.join(d, 'references'), { recursive: true });
  fs.writeFileSync(path.join(d, 'SKILL.md'), 'top');
  fs.writeFileSync(path.join(d, 'references', 'a.md'), 'deep');
  const row = q.capture('tree');
  assert.ok(row && row.kind === 'dir' && /^[0-9a-f]{64}$/.test(row.digest), JSON.stringify(row));
  const r = q.prune(['tree'], { stamp: 'stamp-tree' });
  assert.deepStrictEqual(r.pruned, ['tree']);
  q.restore('tree');
  assert.strictEqual(fs.readFileSync(path.join(d, 'references', 'a.md'), 'utf8'), 'deep');
});

it('a manifest that cannot be written stops the prune before any delete', (q, home) => {
  const p = path.join(home, '.claude', 'skills', 'edited');
  fs.writeFileSync(p, 'the only copy');
  const enospc = () => { const e = new Error('no space left on device'); e.code = 'ENOSPC'; throw e; };
  const r = q.prune(['edited'], { stamp: 'stamp-x', writeFile: enospc });
  assert.deepStrictEqual(r.pruned, [], 'pruned without a manifest');
  assert.match(String(r.error), /ENOSPC/, 'no error reported');
  assert.strictEqual(fs.readFileSync(p, 'utf8'), 'the only copy');
});

it('a store whose manifest is gone is archived, never overwritten by the next capture', (q, home) => {
  const p = path.join(home, '.claude', 'skills', 'edited');
  fs.writeFileSync(p, 'first run bytes');
  q.capture('edited');                                   // a run that died before its manifest
  fs.writeFileSync(p, 'second run bytes');
  const r = q.prune(['edited'], { stamp: 'stamp-2' });
  assert.deepStrictEqual(r.pruned, ['edited']);
  assert.ok(r.archived, 'the manifest-less store was not archived');
  assert.strictEqual(fs.readFileSync(path.join(r.archived, 'edited'), 'utf8'), 'first run bytes');
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: quarantine — ${checks} checks`);
