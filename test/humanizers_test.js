#!/usr/bin/env node
'use strict';
// Fixtures for lib/humanizers.js — the anti-AI-writing skills a run can reach.
//
// Two properties, and the second one is the one that matters ethically.
//
// The registry is DATA. Two implementations are listed because they were the two asked
// about, not because they are the field, and a skill that hard-codes one of them ships a
// preference disguised as a dependency. So `pick` reads modes rather than names, and
// nothing here ranks by popularity.
//
// And the caveat is NOT DROPPABLE. Independent audits found false-positive rates above 60%
// on non-native English writers (Liang et al., Stanford, Patterns 2023). A family that let
// this become a gate would be shipping a filter that penalises exactly those writers, so
// the report says so every time it runs — including when nothing is installed and there is
// nothing to warn about yet.

const assert = require('assert');

const H = require('../lib/humanizers.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const BOTH = [{ id: 'humanizer' }, { id: 'avoid-ai-writing' }, { id: 'copywriting' }];
const NONE = [{ id: 'copywriting' }];

it('every entry declares a repo, an install line and at least one mode', () => {
  assert.ok(H.REGISTRY.length >= 2, 'the registry is empty');
  for (const h of H.REGISTRY) {
    assert.ok(h.id && h.repo && h.install, `${h.id}: incomplete entry`);
    assert.ok(Array.isArray(h.modes) && h.modes.length, `${h.id}: declares no mode`);
    for (const m of h.modes) {
      assert.ok(['detect', 'rewrite', 'edit'].includes(m), `${h.id}: unknown mode ${m}`);
    }
    assert.ok(h.rules, `${h.id}: does not say where its rules come from`);
  }
});

it('pick reads MODES, never names', () => {
  // The whole reason this is a registry. A caller wanting detect-only gets whatever
  // implements it, which today is one of the two and tomorrow may not be.
  const detect = H.pick(BOTH, 'detect').map((h) => h.id);
  assert.deepStrictEqual(detect, ['avoid-ai-writing'],
    'detect returned something that does not declare the mode');
  const rewrite = H.pick(BOTH, 'rewrite').map((h) => h.id);
  assert.deepStrictEqual(rewrite, ['humanizer', 'avoid-ai-writing']);
});

it('pick returns nothing when the mode is installed nowhere', () => {
  assert.deepStrictEqual(H.pick(NONE, 'rewrite'), []);
  assert.deepStrictEqual(H.pick(BOTH, 'no-such-mode'), []);
});

it('rewrite is the default, so a caller that names no mode still gets one', () => {
  assert.deepStrictEqual(H.pick(BOTH).map((h) => h.id), H.pick(BOTH, 'rewrite').map((h) => h.id));
});

it('an uninstalled implementation still shows how to install it', () => {
  const out = H.report(NONE);
  for (const h of H.REGISTRY) {
    assert.ok(out.includes(h.install), `${h.id}: the report does not say how to install it`);
  }
});

it('the false-positive caveat is printed whether or not any are installed', () => {
  // The ethical core: this is a writing-quality tool, not a verdict, and the people it
  // misjudges most are writing in a second language.
  for (const skills of [BOTH, NONE, []]) {
    const out = H.report(skills);
    assert.ok(/NOT a verdict/.test(out), 'the report omits that this is not a verdict');
    assert.ok(/non-native English writers/.test(out),
      'the report omits who the false positives fall on');
    assert.ok(/60%/.test(out), 'the report drops the measured figure');
  }
});

it('with none installed it says nothing here requires one', () => {
  const out = H.report(NONE);
  assert.ok(/None installed/.test(out), out);
  assert.ok(/no\s+gate in this family fails/.test(out),
    'the report does not say a missing humanizer breaks nothing');
});

it('the list invites a pull request, because two is not the field', () => {
  assert.ok(/pull request/.test(H.report(BOTH)), 'the registry does not say how to extend it');
  assert.ok(!/pull request/.test(H.report(BOTH, { contribute: false })),
    '--quiet did not drop the contribution line');
});

it('installed state is read from the roster, not assumed', () => {
  const on = H.present(BOTH).filter((h) => h.installed).map((h) => h.id);
  assert.deepStrictEqual(on.sort(), ['avoid-ai-writing', 'humanizer']);
  assert.deepStrictEqual(H.present(NONE).filter((h) => h.installed), []);
  assert.deepStrictEqual(H.present([]).filter((h) => h.installed), []);
});

it('embedded is declared per implementation, not assumed of all', () => {
  // A skill producing copy needs a documented way to get back ONLY the text; one that
  // returns a report leaves the caller parsing prose. Only one of the two documents it.
  const embedded = H.REGISTRY.filter((h) => h.embedded).map((h) => h.id);
  assert.deepStrictEqual(embedded, ['humanizer']);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
