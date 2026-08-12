#!/usr/bin/env node
'use strict';
// Fixtures for lib/hooks.js — the edit to the operator's settings.json.
//
// Two properties carry the file, and both are about not destroying something the
// operator did not ask about:
//   - another pack's SessionStart hook survives ours being added;
//   - another tool's statusLine is a reported conflict, never a silent overwrite.
//
// The third is idempotence, asserted on the computed edit rather than on a write,
// because a pure planner is where that can be proven without a HOME.

const assert = require('assert');
const H = require('../lib/hooks.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = '/opt/sshlg-skills';
const FOREIGN_HOOK = {
  matcher: 'startup',
  hooks: [{ type: 'command', command: '"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd" session-start' }],
};

it('adding ours keeps another pack\'s SessionStart hook', () => {
  const before = { hooks: { SessionStart: [FOREIGN_HOOK] } };
  const { settings } = H.plan(before, ROOT, {});
  const events = settings.hooks.SessionStart;
  assert.strictEqual(events.length, 2, `expected theirs + ours, got ${events.length}`);
  assert.deepStrictEqual(events[0], FOREIGN_HOOK, 'the other pack\'s hook was modified');
  assert.ok(H.isOurs(events[1].hooks[0].command, ROOT), 'ours was not added');
});

it('a second plan is a no-op — ours is refreshed in place, never duplicated', () => {
  const first = H.plan({ hooks: { SessionStart: [FOREIGN_HOOK] } }, ROOT, {});
  const second = H.plan(first.settings, ROOT, {});
  assert.deepStrictEqual(second.settings, first.settings, 'the second plan changed the file again');
  assert.deepStrictEqual(second.changed, [], `second plan still reports: ${second.changed}`);
  assert.strictEqual(second.settings.hooks.SessionStart.length, 2, 'ours was appended twice');
});

it('a foreign statusLine is a conflict, and is NOT taken without force', () => {
  const before = { statusLine: { type: 'command', command: 'bash /elsewhere/caveman.sh' } };
  const { settings, conflicts } = H.plan(before, ROOT, {});
  assert.strictEqual(conflicts.length, 1, 'the conflict was not reported');
  assert.strictEqual(conflicts[0].key, 'statusLine');
  assert.deepStrictEqual(settings.statusLine, before.statusLine,
    'someone else\'s status line was replaced without being asked');
});

it('with force it is taken, and the conflict is still reported', () => {
  const before = { statusLine: { type: 'command', command: 'bash /elsewhere/caveman.sh' } };
  const { settings, conflicts, changed } = H.plan(before, ROOT, { force: true });
  assert.strictEqual(conflicts.length, 1, 'force silenced the report of what it displaced');
  assert.ok(H.isOurs(settings.statusLine.command, ROOT), 'force did not take the status line');
  assert.ok(changed.some((c) => /replaced/.test(c)), `changed says: ${changed}`);
});

it('an absent statusLine is simply set, with no conflict', () => {
  const { settings, conflicts } = H.plan({}, ROOT, {});
  assert.deepStrictEqual(conflicts, []);
  assert.ok(H.isOurs(settings.statusLine.command, ROOT));
});

it('removal takes ours out and leaves theirs untouched', () => {
  const installed = H.plan({ hooks: { SessionStart: [FOREIGN_HOOK] } }, ROOT, {}).settings;
  const { settings } = H.removal(installed, ROOT);
  assert.deepStrictEqual(settings.hooks.SessionStart, [FOREIGN_HOOK],
    'removal did not restore the file to just the other pack\'s hook');
  assert.ok(!settings.statusLine, 'our status line survived removal');
});

it('removal deletes the key rather than leaving an empty array', () => {
  const installed = H.plan({}, ROOT, {}).settings;
  const { settings } = H.removal(installed, ROOT);
  assert.ok(!settings.hooks || !('UserPromptSubmit' in settings.hooks),
    'an empty UserPromptSubmit array was left behind');
  assert.ok(!('hooks' in settings), `an empty hooks object was left: ${JSON.stringify(settings.hooks)}`);
});

it('removal is idempotent and does not invent keys on a clean file', () => {
  const { settings, changed } = H.removal({}, ROOT);
  assert.deepStrictEqual(settings, {});
  assert.deepStrictEqual(changed, []);
});

it('everything outside our keys is preserved byte for byte', () => {
  const before = {
    env: { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' },
    enabledPlugins: { 'caveman@caveman': true },
    hooks: { PostToolUse: [{ hooks: [{ type: 'command', command: 'their-linter' }] }] },
  };
  const { settings } = H.plan(before, ROOT, {});
  assert.deepStrictEqual(settings.env, before.env);
  assert.deepStrictEqual(settings.enabledPlugins, before.enabledPlugins);
  assert.deepStrictEqual(settings.hooks.PostToolUse, before.hooks.PostToolUse);
  const back = H.removal(settings, ROOT).settings;
  assert.deepStrictEqual(back, before, 'install then remove did not round-trip to the original');
});

it('describe names all three entries and the matcher', () => {
  const d = H.describe(ROOT).join('\n');
  for (const k of ['SessionStart', 'UserPromptSubmit', 'statusLine', H.MATCHER]) {
    assert.ok(d.includes(k), `describe() omits ${k}`);
  }
});

it('isOurs matches by path, so a copy elsewhere is not claimed', () => {
  assert.strictEqual(H.isOurs(`node "${ROOT}/hooks/session-start.js"`, ROOT), true);
  assert.strictEqual(H.isOurs('node "/somewhere/else/hooks/session-start.js"', ROOT), false);
  assert.strictEqual(H.isOurs(undefined, ROOT), false);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
