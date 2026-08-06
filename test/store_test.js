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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
