#!/usr/bin/env node
'use strict';
// Fixtures for lib/injectors.js — who else speaks before the first prompt.
//
// Three properties, and each one is a way this check could be worse than nothing:
//   - it must be SILENT when nothing else injects, or it becomes the noise that
//     teaches an operator to switch hooks off;
//   - it must make NO claim from a registry it could not read, because a guard that
//     answers from missing input is indistinguishable from one that approves;
//   - its on-demand report must print on a clean machine too, since a check whose
//     output nobody has ever seen has never been watched working.

const assert = require('assert');
const I = require('../lib/injectors.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const HOOKS = {
  'superpowers@claude-plugins-official': {
    path: '/h/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/hooks/hooks.json',
    events: ['SessionStart'],
  },
  'agent-sync@agent-sync': {
    path: '/h/.claude/plugins/cache/agent-sync/agent-sync/1.10.0/hooks/hooks.json',
    events: ['SessionStart', 'PreToolUse'],
  },
  'caveman@caveman': {
    path: '/h/.claude/plugins/cache/caveman/caveman/25d22f864ad6/hooks/hooks.json',
    events: ['UserPromptSubmit'],
  },
};

it('a plugin that speaks at SessionStart is reported', () => {
  const rows = I.injectors(['superpowers@claude-plugins-official'], HOOKS);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].spec, 'superpowers@claude-plugins-official');
  assert.ok(rows[0].hooksPath.endsWith('hooks/hooks.json'));
});

it('a plugin that hooks something else is not reported', () => {
  assert.deepStrictEqual(I.injectors(['caveman@caveman'], HOOKS), []);
});

it('a DISABLED plugin is not reported even though its hooks.json declares the event', () => {
  // The whole point of the check is enablement: the file on disk says SessionStart
  // whether or not the plugin is on, and reporting from the file would report a
  // plugin that never runs.
  assert.deepStrictEqual(I.injectors([], HOOKS), []);
});

it('the order is stable, so a diff between two runs means something', () => {
  const a = I.injectors(['superpowers@claude-plugins-official', 'agent-sync@agent-sync'], HOOKS);
  const b = I.injectors(['agent-sync@agent-sync', 'superpowers@claude-plugins-official'], HOOKS);
  assert.deepStrictEqual(a.map((r) => r.spec), b.map((r) => r.spec));
});

it('nothing else injecting is SILENCE, not a sentence', () => {
  assert.strictEqual(I.line([]), '');
});

it('the session line names the plugins and stays one line', () => {
  const rows = I.injectors(['superpowers@claude-plugins-official', 'agent-sync@agent-sync'], HOOKS);
  const l = I.line(rows);
  assert.ok(l.includes('agent-sync'), 'names agent-sync');
  assert.ok(l.includes('superpowers'), 'names superpowers');
  assert.ok(!l.includes('\n'), 'stays one line — the session block is ~90 tokens on purpose');
  assert.ok(!l.includes('hooks.json'), 'no file paths in the session line; that is the verb');
});

it('an unreadable registry produces no claim, not a wrong one', () => {
  // Standing instruction #1: a component that never receives its input must not
  // answer as though it had.
  assert.deepStrictEqual(I.injectors(['superpowers@claude-plugins-official'], null), []);
  assert.deepStrictEqual(I.injectors(null, HOOKS), []);
  assert.deepStrictEqual(I.injectors(['x@y'], { 'x@y': {} }), []);
  assert.deepStrictEqual(I.injectors(['x@y'], { 'x@y': { events: 'SessionStart' } }), [],
    'a string where a list belongs is unreadable input, not a match');
});

it('the report prints on a clean machine too', () => {
  const r = I.report([]);
  assert.ok(r.includes('none'), 'says none rather than printing an empty block');
  assert.ok(r.includes('per-hook disable'), 'states the remedy even when nothing is found');
});

it('the report names each file, and refuses to call the list a list of offenders', () => {
  const rows = I.injectors(['agent-sync@agent-sync'], HOOKS);
  const r = I.report(rows);
  assert.ok(r.includes('hooks/hooks.json'), 'names the file');
  assert.ok(/what INJECTS, not what competes/.test(r),
    'the honest limit is stated in the output, not only in the source');
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: injectors — ${checks} checks`);
