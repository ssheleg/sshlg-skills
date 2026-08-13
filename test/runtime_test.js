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

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: runtime — ${checks} checks`);
