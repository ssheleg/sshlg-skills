#!/usr/bin/env node
'use strict';
// Fixtures for lib/shadow.js.
//
// The check this replaces under-reports, and the fixture that matters is the one
// where plugin and marketplace names differ — because that is the case the cheap
// version misses and the case this machine actually has.

const assert = require('assert');
const S = require('../lib/shadow.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// Real shapes from this machine: the skill id on the left, the plugin that
// provides it on the right. Note that neither pair shares a name.
const PROVIDED = {
  'ux-flows': 'super-ux@super-ux',
  'copywriting': 'super-ux@super-ux',
  'sheleg-design': 'sheleg-design@sheleg-design-skill',
  'task-pipeline': 'task-pipeline@task-pipeline',
};

it('a plain copy of a plugin-provided skill is a shadow', () => {
  const rows = S.shadows(['task-pipeline', 'graphify'], PROVIDED);
  assert.strictEqual(rows.length, 1);
  assert.deepStrictEqual(rows[0], { skill: 'task-pipeline', plugin: 'task-pipeline@task-pipeline' });
});

it('a skill that exists ONLY as a plain copy is not a shadow', () => {
  // `graphify` and `context7-docs` live nowhere else on this machine. Reporting
  // them would train the operator to ignore the report.
  assert.deepStrictEqual(S.shadows(['graphify', 'context7-docs'], PROVIDED), []);
});

it('the skill id is compared, not the marketplace name', () => {
  // `sheleg-design` ships from the `sheleg-design-skill` marketplace. A check
  // comparing marketplace names finds nothing here and reports a clean machine.
  const rows = S.shadows(['sheleg-design'], PROVIDED);
  assert.strictEqual(rows.length, 1, 'the differing-name case was missed — the under-report this module exists for');
  assert.strictEqual(rows[0].plugin, 'sheleg-design@sheleg-design-skill');
});

it('several skills from one plugin each shadow it separately', () => {
  const rows = S.shadows(['copywriting', 'ux-flows'], PROVIDED);
  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows.map((r) => r.skill), ['copywriting', 'ux-flows'], 'rows are not sorted');
});

it('a Map is accepted as well as an object', () => {
  const rows = S.shadows(['task-pipeline'], new Map(Object.entries(PROVIDED)));
  assert.strictEqual(rows.length, 1);
});

it('empty inputs are silence, not a throw', () => {
  assert.deepStrictEqual(S.shadows(undefined, undefined), []);
  assert.deepStrictEqual(S.shadows([], PROVIDED), []);
});

it('a clean machine renders nothing at all', () => {
  assert.strictEqual(S.render([]), '');
  assert.strictEqual(S.render(undefined), '');
});

it('the report names the skill, the plugin, and the remedy', () => {
  const out = S.render(S.shadows(['sheleg-design'], PROVIDED));
  assert.match(out, /sheleg-design/);
  assert.match(out, /sheleg-design-skill/);
  assert.match(out, /sshlg-skills@latest update/, 'the report does not say what to do about it');
});

it('the count agrees with the rows, singular and plural', () => {
  assert.match(S.render(S.shadows(['task-pipeline'], PROVIDED)), /1 shadowing plain copy/);
  assert.match(S.render(S.shadows(['task-pipeline', 'ux-flows'], PROVIDED)), /2 shadowing plain copies/);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
