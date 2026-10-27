#!/usr/bin/env node
'use strict';
// Fixtures for lib/runtime.js — the wired copy the hooks actually execute.
//
// B-22, found at stage 8 of the 2026-08-13 run and not by any gate: `update` brought
// six plugins to their new versions and left `~/.sshlg-skills/runtime/lib/` at 24
// modules against the package's 25. The module missing was the one that release
// existed to ship, so its SessionStart line could never print. Every hook improvement
// since v0.42.0 had reached machines the same way — only via `hooks install`.
//
// Three properties, and each is a different way this could still be wrong:
//   - a runtime that EXISTS is refreshed, including modules it has never seen;
//   - a runtime that does NOT exist is not created, because `update` is not the
//     moment to install something the operator never asked for — the same rule the
//     routing block's own refresh follows;
//   - the answer says what it did, so a caller can print it and a fixture can assert
//     it without diffing directories.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('../lib/runtime.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rt-'));
}

/** A package with two hooks, three lib modules and a manifest. */
function seedPackage(root) {
  fs.mkdirSync(path.join(root, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(root, 'hooks', 'session-start.js'), '// v2\n');
  fs.writeFileSync(path.join(root, 'hooks', 'notification.js'), '// v2\n');
  fs.writeFileSync(path.join(root, 'lib', 'triggers.js'), '// v2\n');
  fs.writeFileSync(path.join(root, 'lib', 'guard.js'), '// v2\n');
  fs.writeFileSync(path.join(root, 'lib', 'injectors.js'), '// NEW in this release\n');
  fs.writeFileSync(path.join(root, 'skills.json'), '{"skills":[]}\n');
  fs.writeFileSync(path.join(root, 'package.json'), '{"version":"2.0.0"}\n');
  // Not a .js file and not the manifest: must NOT travel.
  fs.writeFileSync(path.join(root, 'lib', 'README.md'), 'notes\n');
  return root;
}

/** A runtime as it looks on a machine that installed an OLDER release. */
function seedOldRuntime(root) {
  fs.mkdirSync(path.join(root, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(root, 'hooks', 'session-start.js'), '// v1\n');
  fs.writeFileSync(path.join(root, 'hooks', 'notification.js'), '// v1\n');
  fs.writeFileSync(path.join(root, 'lib', 'triggers.js'), '// v1\n');
  fs.writeFileSync(path.join(root, 'lib', 'guard.js'), '// v1\n');
  // injectors.js deliberately absent — this is exactly the B-22 machine.
  fs.writeFileSync(path.join(root, 'skills.json'), '{"skills":["old"]}\n');
  return root;
}

it('a module the runtime has never seen arrives', () => {
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  const r = R.sync(pkg, rt, { create: false });
  assert.ok(fs.existsSync(path.join(rt, 'lib', 'injectors.js')),
    'the new module is the whole point of B-22 and it did not arrive');
  assert.ok(r.copied.includes('lib/injectors.js'), 'the report names what arrived');
});

it('a module the runtime already had is refreshed, not left at the old bytes', () => {
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  R.sync(pkg, rt, { create: false });
  const body = fs.readFileSync(path.join(rt, 'lib', 'triggers.js'), 'utf8');
  assert.strictEqual(body, '// v2\n', 'a stale module is worse than a missing one — it runs');
});

it('the manifest travels, because lib/plan.js reads it', () => {
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  R.sync(pkg, rt, { create: false });
  assert.strictEqual(fs.readFileSync(path.join(rt, 'skills.json'), 'utf8'), '{"skills":[]}\n');
});

it('non-js files do not travel', () => {
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  R.sync(pkg, rt, { create: false });
  assert.ok(!fs.existsSync(path.join(rt, 'lib', 'README.md')),
    'the wired copy is code the hooks require, not documentation');
});

it('a runtime that does NOT exist is not created by a refresh', () => {
  // The same rule the routing block's refresh follows: a machine that has no
  // runtime has not consented to hooks, and an update is not the moment to ask.
  const pkg = seedPackage(tmp());
  const absent = path.join(tmp(), 'never-installed');
  const r = R.sync(pkg, absent, { create: false });
  assert.strictEqual(fs.existsSync(absent), false, 'update installed something nobody asked for');
  assert.strictEqual(r.created, false);
  assert.deepStrictEqual(r.copied, []);
  assert.ok(/not installed/i.test(r.reason || ''), 'the reason is stated, not implied');
});

it('install CREATES it, because that is what install means', () => {
  const pkg = seedPackage(tmp());
  const fresh = path.join(tmp(), 'first-install');
  const r = R.sync(pkg, fresh, { create: true });
  assert.ok(fs.existsSync(path.join(fresh, 'lib', 'injectors.js')));
  assert.strictEqual(r.created, true);
});

it('a second sync changes nothing — proven by hashes, at the layer that repeats', () => {
  // Standing instruction #2. This one is cheap to prove and was cheap to get wrong.
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  const hash = (root) => {
    const crypto = require('crypto');
    const h = crypto.createHash('sha256');
    const walk = (d, base) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full, base);
        else { h.update(path.relative(base, full)); h.update(fs.readFileSync(full)); }
      }
    };
    walk(root, root);
    return h.digest('hex');
  };
  R.sync(pkg, rt, { create: false });
  const a = hash(rt);
  R.sync(pkg, rt, { create: false });
  const b = hash(rt);
  R.sync(pkg, rt, { create: false });
  assert.strictEqual(a, b, 'not idempotent');
  assert.strictEqual(b, hash(rt), 'not idempotent on the third run');
});

it('what is stale can be reported without writing anything', () => {
  const pkg = seedPackage(tmp());
  const rt = seedOldRuntime(tmp());
  const s = R.stale(pkg, rt);
  assert.ok(s.missing.includes('lib/injectors.js'), 'the missing module is named');
  assert.ok(s.differing.includes('lib/triggers.js'), 'the stale module is named');
  // and it wrote nothing
  assert.ok(!fs.existsSync(path.join(rt, 'lib', 'injectors.js')));
});

// B-193: a module the package drops is retired only when the runtime's own manifest
// proves the hub installed exactly those bytes; anything else stays where it is.
it('a dropped module the hub installed is retired to .retired/, foreign or edited files stay', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  fs.writeFileSync(path.join(pkg, 'lib', 'dropped.js'), '// will be dropped\n');
  assert.equal(R.sync(pkg, rt, { create: true }).ok, true);
  assert.ok(fs.existsSync(path.join(rt, '.managed.json')), 'manifest written after sync');
  fs.writeFileSync(path.join(rt, 'lib', 'foreign.js'), '// not ours\n');
  fs.unlinkSync(path.join(pkg, 'lib', 'dropped.js'));
  fs.writeFileSync(path.join(pkg, 'lib', 'guard.js'), '// v3\n');
  const r = R.sync(pkg, rt);
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.retired, ['lib/dropped.js']);
  assert.ok(!fs.existsSync(path.join(rt, 'lib', 'dropped.js')));
  const kept = fs.readdirSync(path.join(rt, '.retired')).map(d => path.join(rt, '.retired', d, 'lib', 'dropped.js'));
  assert.ok(kept.some(f => fs.existsSync(f) && fs.readFileSync(f, 'utf8') === '// will be dropped\n'), 'retired bytes kept');
  assert.ok(fs.existsSync(path.join(rt, 'lib', 'foreign.js')), 'a file the manifest never named stays');
});
it('a dropped module edited after install is not retired', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  fs.writeFileSync(path.join(pkg, 'lib', 'dropped.js'), '// will be dropped\n');
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, 'lib', 'dropped.js'), '// edited by hand\n');
  fs.unlinkSync(path.join(pkg, 'lib', 'dropped.js'));
  fs.writeFileSync(path.join(pkg, 'lib', 'guard.js'), '// v3\n');
  const r = R.sync(pkg, rt);
  assert.equal(r.ok, true); assert.deepEqual(r.retired, []);
  assert.equal(fs.readFileSync(path.join(rt, 'lib', 'dropped.js'), 'utf8'), '// edited by hand\n');
});
it('a malformed manifest retires nothing and is replaced', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, '.managed.json'), '{not json');
  fs.writeFileSync(path.join(pkg, 'lib', 'guard.js'), '// v3\n');
  const r = R.sync(pkg, rt);
  assert.equal(r.ok, true); assert.deepEqual(r.retired, []);
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(rt, '.managed.json'), 'utf8')));
});

it('retirement never follows a symlinked .retired and never retires a hook script', () => {
  const pkg = seedPackage(tmp()), rt = tmp(), elsewhere = tmp();
  fs.writeFileSync(path.join(pkg, 'lib', 'dropped.js'), '// will be dropped\n');
  fs.writeFileSync(path.join(pkg, 'hooks', 'gone.js'), '// hook dropped\n');
  R.sync(pkg, rt, { create: true });
  fs.symlinkSync(elsewhere, path.join(rt, '.retired'));
  fs.unlinkSync(path.join(pkg, 'lib', 'dropped.js')); fs.unlinkSync(path.join(pkg, 'hooks', 'gone.js'));
  fs.writeFileSync(path.join(pkg, 'lib', 'guard.js'), '// v3\n');
  const r = R.sync(pkg, rt);
  assert.equal(r.ok, true); assert.deepEqual(r.retired, []); assert.match(r.ownedError || '', /unsafe directory/);
  assert.ok(fs.existsSync(path.join(rt, 'lib', 'dropped.js')), 'nothing moved through the symlink');
  assert.equal(fs.readdirSync(elsewhere).length, 0);
  assert.ok(fs.existsSync(path.join(rt, 'hooks', 'gone.js')), 'a hook script may still be wired; it stays');
});

// B-259: a module older than the ownership record (`lib/router-texts.js` predates
// `.managed.json`) is unrecorded, so B-193 alone could never retire it. The package
// ships the path and sha256 of every blob that path ever held; an unrecorded file
// with one of those exact bytes is the hub's and retires like a recorded one.
const shaOf = (text) => require('crypto').createHash('sha256').update(text).digest('hex');
it('an unrecorded module whose bytes match a retired blob of that path is retired', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, 'lib', 'router-texts.js'), '// an old release\n');
  fs.writeFileSync(path.join(pkg, 'lib', 'guard.js'), '// v3\n');
  const table = { 'lib/router-texts.js': [shaOf('// older still\n'), shaOf('// an old release\n')] };
  const r = R.sync(pkg, rt, { retiredBlobs: table });
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.retired, ['lib/router-texts.js']);
  assert.ok(!fs.existsSync(path.join(rt, 'lib', 'router-texts.js')));
  const kept = fs.readdirSync(path.join(rt, '.retired')).map(d => path.join(rt, '.retired', d, 'lib', 'router-texts.js'));
  assert.ok(kept.some(f => fs.existsSync(f) && fs.readFileSync(f, 'utf8') === '// an old release\n'), 'retired bytes kept');
  assert.ok(!('lib/router-texts.js' in JSON.parse(fs.readFileSync(path.join(rt, '.managed.json'), 'utf8')).files));
});
it('an unchanged runtime still retires a history-matched module (the update most machines see)', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, 'lib', 'router-texts.js'), '// an old release\n');
  const r = R.sync(pkg, rt, { retiredBlobs: { 'lib/router-texts.js': [shaOf('// an old release\n')] } });
  assert.equal(r.status, 'unchanged'); assert.deepEqual(r.retired, ['lib/router-texts.js']);
});
it('an edited, foreign or still-shipped file is never retired by the history table', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, 'lib', 'router-texts.js'), '// edited by hand\n');
  fs.writeFileSync(path.join(rt, 'lib', 'foreign.js'), '// not ours\n');
  fs.writeFileSync(path.join(rt, 'hooks', 'old-hook.js'), '// hook\n');
  const table = {
    'lib/router-texts.js': [shaOf('// an old release\n')],
    'lib/foreign.js': [shaOf('// something else\n')],
    'lib/guard.js': [shaOf('// v1\n')],               // still shipped: never retired
    'hooks/old-hook.js': [shaOf('// hook\n')],        // a hook may still be wired
  };
  const r = R.sync(pkg, rt, { retiredBlobs: table });
  assert.equal(r.ok, true, r.reason); assert.deepEqual(r.retired, []);
  for (const f of ['lib/router-texts.js', 'lib/foreign.js', 'lib/guard.js', 'hooks/old-hook.js']) {
    assert.ok(fs.existsSync(path.join(rt, f)), `${f} was moved`);
  }
});
it('a malformed history table retires nothing and the sync still succeeds', () => {
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  fs.writeFileSync(path.join(rt, 'lib', 'router-texts.js'), '// an old release\n');
  for (const bad of [null, [], { 'lib/router-texts.js': 'nope' }, { '../escape.js': [shaOf('x')] }, { 'lib/router-texts.js': ['short'] }]) {
    const r = R.sync(pkg, rt, { retiredBlobs: bad });
    assert.equal(r.ok, true, JSON.stringify(bad)); assert.deepEqual(r.retired, [], JSON.stringify(bad));
  }
  assert.ok(fs.existsSync(path.join(rt, 'lib', 'router-texts.js')));
});
it('the shipped table is the default, and names lib/router-texts.js', () => {
  const T = require('../lib/runtime-retired.js');
  assert.ok(Array.isArray(T.BLOBS['lib/router-texts.js']) && T.BLOBS['lib/router-texts.js'].length >= 1);
  const pkg = seedPackage(tmp()), rt = tmp();
  R.sync(pkg, rt, { create: true });
  // No fixture bytes match a real release blob, so the default table moves nothing here.
  fs.writeFileSync(path.join(rt, 'lib', 'router-texts.js'), '// not a release\n');
  assert.deepEqual(R.sync(pkg, rt).retired, []);
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: runtime — ${checks} checks`);
