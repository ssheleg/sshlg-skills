#!/usr/bin/env node
'use strict';
// Fixtures for lib/cursor.js — the fourth channel, in its own shape.
//
// The other three targets are a managed block inside a file the operator owns
// and mostly wrote. Cursor is the opposite: `~/.cursor/rules/*.mdc` is one
// file per rule, so the file is ours end to end. That removes the
// preservation problem and introduces the mirror of it — owning a file means
// an overwrite destroys whatever was there and leaves no diff to notice by.
//
// Hence the sentinel test: a file at our name that does not carry our marker
// belongs to someone else and is not ours to replace.

const assert = require('assert');
const C = require('../lib/cursor.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const BEGIN = '<!-- SSHLG:ROUTERS:BEGIN';

it('the rule opens with YAML front-matter', () => {
  const out = C.renderRule('body');
  assert.ok(out.startsWith('---\n'), out.slice(0, 40));
  assert.strictEqual(out.split('\n').filter((l) => l === '---').length, 2);
});

it('alwaysApply is true — a rule loaded on demand routes nothing', () => {
  assert.ok(/^alwaysApply: true$/m.test(C.renderRule('body')));
});

it('the body is carried through unchanged', () => {
  const body = '## Heading\n\n| a | b |\n|---|---|\n| 1 | 2 |';
  assert.ok(C.renderRule(body).includes(body));
});

it('trailing whitespace is settled, so a second write is byte-identical', () => {
  assert.strictEqual(C.renderRule('body\n\n\n'), C.renderRule('body'));
});

it('an absent file is ours to create', () => {
  assert.strictEqual(C.mayWrite(null, BEGIN), true);
});

it('a file carrying our sentinel is ours to refresh', () => {
  assert.strictEqual(C.mayWrite(`---\nx\n---\n${BEGIN} -->\nbody`, BEGIN), true);
});

it('a file at our name WITHOUT our sentinel is not ours to overwrite', () => {
  // Someone else's rule happens to sit at that filename. Replacing it would
  // delete a file whose author never opted into this pack, and — because we
  // own the whole file rather than a fenced region — there would be no
  // surviving text to notice the loss by.
  assert.strictEqual(C.mayWrite('---\ndescription: mine\n---\n\nmy own rule', BEGIN), false);
});

it('the filename is fixed and namespaced', () => {
  assert.strictEqual(C.FILENAME, 'sshlg-routing.mdc');
});

it('renderRule touches no filesystem', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'cursor.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  assert.ok(!/require\(\s*['"]fs['"]\s*\)/.test(src), 'lib/cursor.js must not require fs');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
