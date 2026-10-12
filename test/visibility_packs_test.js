#!/usr/bin/env node
'use strict';
// Fixtures for the pack half of lib/visibility.js — which packs a host hides, by the
// operator's marks (pack-marks.json) and their per-pack overrides (config.json), and the
// JSON edits that write it into Gemini, Pi and OpenCode settings.
//
// The properties under test: the usage core always wins over a pack mark; an override
// beats the shipped mark; a family pack is never hidden; an edit either reproduces every
// other byte of the operator's file or refuses; and a revert removes only what the
// launcher added — an entry the operator already had survives it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const V = require('../lib/visibility.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const MARKS = {
  schema: 'pack-marks/1',
  revision: 1,
  packs: [
    { pack: 'acme/finance', audience: 'finance', host: ['*'], hidden: true, markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
    { pack: 'acme/docs', audience: 'documents', host: ['*'], hidden: false, markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
    { pack: 'acme/gemini-only', audience: 'x', host: ['gemini'], hidden: true, markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
    { pack: 'ssheleg/task-pipeline', audience: 'family', host: ['*'], hidden: false, markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
  ],
};

it('the shipped pack-marks.json is valid pack-marks/1', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pack-marks.json'), 'utf8'));
  assert.deepStrictEqual(V.marksProblems(data), []);
});

it('marks: a missing revision, a duplicate pack and a non-boolean hidden are each named', () => {
  const bad = { schema: 'pack-marks/1', packs: [
    { pack: 'a/b', audience: 'x', host: ['*'], hidden: true, markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
    { pack: 'a/b', audience: 'x', host: ['*'], hidden: 'yes', markedBy: 'operator', markedAt: '2026-10-13', reason: 'r' },
  ] };
  const p = V.marksProblems(bad).join('\n');
  assert.ok(/revision/.test(p), p);
  assert.ok(/a\/b.*twice|duplicate/.test(p), p);
  assert.ok(/hidden/.test(p), p);
});

it('marks: a family pack marked hidden is refused', () => {
  const fam = JSON.parse(JSON.stringify(MARKS));
  fam.packs[3].hidden = true;
  assert.ok(V.marksProblems(fam).some((p) => /family/.test(p)));
});

it('marks: a wrong schema is refused rather than read', () => {
  assert.ok(V.marksProblems({ schema: 'pack-marks/2', revision: 1, packs: [] }).length > 0);
  assert.strictEqual(V.marksIndex({ schema: 'pack-marks/2', revision: 1, packs: [] }).size, 0);
});

it('packHidden: the mark decides; a host list limits it; a family pack is never hidden', () => {
  const marks = V.marksIndex(MARKS);
  assert.strictEqual(V.packHidden('acme/finance', 'pi', { marks }), true);
  assert.strictEqual(V.packHidden('acme/docs', 'pi', { marks }), false);
  assert.strictEqual(V.packHidden('acme/gemini-only', 'pi', { marks }), false);
  assert.strictEqual(V.packHidden('acme/gemini-only', 'gemini', { marks }), true);
  assert.strictEqual(V.packHidden('ssheleg/task-pipeline', 'pi', { marks }), false);
  assert.strictEqual(V.packHidden('unmarked/pack', 'pi', { marks }), false);
});

it('packHidden: showPacks beats hidePacks beats the shipped mark', () => {
  const marks = V.marksIndex(MARKS);
  const config = { visibility: { hidePacks: ['acme/docs', 'acme/finance'], showPacks: ['acme/finance'] } };
  assert.strictEqual(V.packHidden('acme/finance', 'pi', { marks, config }), false, 'showPacks wins');
  assert.strictEqual(V.packHidden('acme/docs', 'pi', { marks, config }), true, 'hidePacks beats a shown mark');
  assert.strictEqual(V.packHidden('ssheleg/task-pipeline', 'pi', { marks, config: { visibility: { hidePacks: ['ssheleg/task-pipeline'] } } }), false,
    'not even an override hides a family pack');
});

it('hostHide: hidden packs minus the usage core; unpacked skills are never hidden', () => {
  const marks = V.marksIndex(MARKS);
  const skills = [
    { name: 'dcf', pack: 'acme/finance' },
    { name: 'used-dcf', pack: 'acme/finance' },
    { name: 'docx', pack: 'acme/docs' },
    { name: 'local', pack: null },
    { name: 'task-pipeline', pack: 'ssheleg/task-pipeline' },
  ];
  const hide = V.hostHide({ skills, host: 'pi', marks, config: {}, core: new Set(['used-dcf', 'task-pipeline']) });
  assert.deepStrictEqual(hide, ['dcf']);
});

it('config overrides: hide/show/default keep the two lists disjoint and drop empties', () => {
  let v = V.setPackOverride({}, 'acme/docs', 'hide');
  assert.deepStrictEqual(v, { hidePacks: ['acme/docs'] });
  v = V.setPackOverride(v, 'acme/docs', 'show');
  assert.deepStrictEqual(v, { showPacks: ['acme/docs'] });
  v = V.setPackOverride(v, 'acme/docs', 'default');
  assert.deepStrictEqual(v, {});
  assert.throws(() => V.setPackOverride({}, 'not a pack', 'hide'), /owner\/repo/);
});

// ── JSON edits ──
const GEMINI = JSON.stringify({ hooks: { a: 1 }, skills: { disabled: ['operator-own'] } }, null, 2) + '\n';

it('json list: adds only what is absent, reports what it added, round-trips byte for byte', () => {
  const r = V.editJsonList(GEMINI, { keys: ['skills', 'disabled'], add: ['b', 'operator-own', 'a'], remove: [] });
  assert.strictEqual(r.ok, true, r.reason);
  assert.deepStrictEqual(r.added, ['b', 'a']);
  assert.deepStrictEqual(JSON.parse(r.text).skills.disabled, ['operator-own', 'b', 'a']);
  const back = V.editJsonList(r.text, { keys: ['skills', 'disabled'], add: [], remove: r.added });
  assert.strictEqual(back.text, GEMINI);
});

it('json list: an absent path is created, and its revert removes the containers it emptied', () => {
  const before = JSON.stringify({ mcpServers: {} }, null, 2) + '\n';
  const r = V.editJsonList(before, { keys: ['skills', 'disabled'], add: ['x'], remove: [] });
  assert.deepStrictEqual(JSON.parse(r.text).skills, { disabled: ['x'] });
  const back = V.editJsonList(r.text, { keys: ['skills', 'disabled'], add: [], remove: ['x'] });
  assert.strictEqual(back.text, before);
});

it('json list: nothing to do returns the same text', () => {
  const r = V.editJsonList(GEMINI, { keys: ['skills', 'disabled'], add: ['operator-own'], remove: ['not-there'] });
  assert.strictEqual(r.text, GEMINI);
  assert.deepStrictEqual(r.added, []);
});

it('json list: a file not in the 2-space form, or a non-list at the path, is refused', () => {
  assert.strictEqual(V.editJsonList('{"a":1}\n', { keys: ['skills'], add: ['x'], remove: [] }).ok, false);
  assert.strictEqual(V.editJsonList('{\n  // c\n}\n', { keys: ['skills'], add: ['x'], remove: [] }).ok, false);
  const notList = JSON.stringify({ skills: { disabled: 'x' } }, null, 2) + '\n';
  assert.strictEqual(V.editJsonList(notList, { keys: ['skills', 'disabled'], add: ['y'], remove: [] }).ok, false);
});

it('json list: Pi writes no trailing newline, and its file keeps that form', () => {
  const pi = JSON.stringify({ theme: 'dark' }, null, 2);
  const r = V.editJsonList(pi, { keys: ['skills'], add: ['-/h/.agents/skills/x'], remove: [] });
  assert.ok(!r.text.endsWith('\n'));
  assert.strictEqual(V.editJsonList(r.text, { keys: ['skills'], add: [], remove: ['-/h/.agents/skills/x'] }).text, pi);
});

it('json list: a missing file is created only when asked, in the form asked', () => {
  const none = V.editJsonList(null, { keys: ['skills'], add: ['x'], remove: [] });
  assert.strictEqual(none.skipped, true);
  const made = V.editJsonList(null, { keys: ['skills'], add: ['x'], remove: [], create: true, newline: false });
  assert.strictEqual(made.text, JSON.stringify({ skills: ['x'] }, null, 2));
});

const OPENCODE = JSON.stringify({ $schema: 'https://opencode.ai/config.json', permission: { skill: { mine: 'allow' } } }, null, 2) + '\n';

it('json map: denies what is absent, respects a value the operator set, reverts only its own', () => {
  const r = V.editJsonMap(OPENCODE, { keys: ['permission', 'skill'], set: ['mine', 'b'], value: 'deny', unset: [] });
  assert.strictEqual(r.ok, true, r.reason);
  assert.deepStrictEqual(r.added, ['b']);
  assert.deepStrictEqual(r.respected, ['mine']);
  assert.deepStrictEqual(JSON.parse(r.text).permission.skill, { mine: 'allow', b: 'deny' });
  const back = V.editJsonMap(r.text, { keys: ['permission', 'skill'], set: [], value: 'deny', unset: ['b', 'mine'] });
  assert.strictEqual(back.text, OPENCODE, 'an operator value is not removed by a revert');
});

it('json map: a whole-permission string (permission.skill = "deny") is refused, not overwritten', () => {
  const t = JSON.stringify({ permission: { skill: 'ask' } }, null, 2) + '\n';
  assert.strictEqual(V.editJsonMap(t, { keys: ['permission', 'skill'], set: ['a'], value: 'deny', unset: [] }).ok, false);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
