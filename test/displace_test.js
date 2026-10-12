#!/usr/bin/env node
'use strict';
// Fixtures for lib/displace.js.
//
// This module exists because of a limit in the event that triggers it:
// `ConfigChange` discards `systemMessage` and `continue`, delivers no
// `additionalContext`, and a change it blocks "surfaces no message to you or to
// Claude". So the detector cannot speak, and the fixture below that matters most
// is the one asserting a REPORT can be built later from what it wrote down.

const assert = require('assert');
const D = require('../lib/displace.js');
const H = require('../lib/hooks.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = '/opt/sshlg-skills';
const installed = () => H.plan({}, ROOT, {}).settings;

it('a settings file we just wrote reports nothing', () => {
  assert.deepStrictEqual(D.check(installed(), ROOT), []);
});

// ONE RULE FOR "OUR ENTRY IS CURRENT" (fix round 2, A). `hooks status`, `hooks install`,
// `update` and this detector all judge an entry by the fields this pack writes
// (`lib/hooks.js` OWN_*_KEYS). An operator's `timeout` on our entry is theirs, not a
// displacement; and an entry that is gone cannot be told apart from one the operator
// removed by hand, so it is listed by `hooks status` on demand and never nagged about at
// every session start (whose named repair, `hooks install`, would put it back).

it('a field the operator added to our entry is not reported as altered (A)', () => {
  const s = installed();
  s.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  s.hooks.SessionStart[0].note = 'mine';
  s.statusLine.padding = 0;
  assert.deepStrictEqual(D.check(s, ROOT), [],
    'an operator field read as our entry no longer matching — the repair would delete it');
});

it('an entry that is gone is not nagged about: removed by hand looks the same (A)', () => {
  const s = installed();
  delete s.hooks.PreToolUse;
  delete s.statusLine;
  assert.deepStrictEqual(D.check(s, ROOT), [],
    'a hand-removed entry was reported every session, with a repair that re-adds it');
});

it('an entry someone rewrote is reported altered, with the field that differs', () => {
  const s = installed();
  s.hooks.UserPromptSubmit[0].hooks[0].command = `node "${ROOT}/hooks/user-prompt-submit.js" --их-флаг`;
  assert.deepStrictEqual(D.check(s, ROOT), [{ key: 'UserPromptSubmit', state: 'altered', reason: 'command' }]);
  const m = installed();
  m.hooks.PreToolUse[0].matcher = 'Edit';
  assert.deepStrictEqual(D.check(m, ROOT), [{ key: 'PreToolUse', state: 'altered', reason: 'matcher' }]);
});

it('a status line another tool legitimately holds is NOT a displacement', () => {
  // `hooks install` already reports that conflict and refuses to take it. Saying
  // it again every session would be nagging about a decision already made.
  const s = installed();
  s.statusLine = { type: 'command', command: 'bash /elsewhere/caveman.sh' };
  assert.ok(!D.check(s, ROOT).some((r) => r.key === 'statusLine'),
    'a foreign status line was reported as our entry being displaced');
});

it('another pack hooking the same event is not a displacement', () => {
  const s = installed();
  s.hooks.SessionStart.unshift({ matcher: 'startup', hooks: [{ type: 'command', command: 'their-hook' }] });
  assert.deepStrictEqual(D.check(s, ROOT), [], 'a co-existing hook was read as displacing ours');
});

it('an empty settings file reports nothing, and does not throw', () => {
  assert.deepStrictEqual(D.check({}, ROOT), []);
  assert.deepStrictEqual(D.check(undefined, ROOT), []);
});

it('the expectation comes from lib/hooks.js, so a rename cannot desynchronise it', () => {
  // If this module carried its own copy of the plan, adding an event would leave
  // the detector describing an install nobody performs.
  const s = installed();
  for (const e of H.EVENTS) s.hooks[e][0].hooks[0].async = true;
  const reported = D.check(s, ROOT).filter((r) => r.state === 'altered').map((r) => r.key);
  for (const e of H.EVENTS) assert.ok(reported.includes(e), `${e} is wired but not watched`);
});

it('the detector and `update` agree: what it reports is exactly what a refresh would change (A)', () => {
  const s = installed();
  s.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  s.hooks.PreToolUse[0].matcher = 'Edit';
  delete s.hooks.Notification;
  const refresh = H.plan(s, ROOT, { refreshOnly: true }).reasons.map((r) => r.event);
  assert.deepStrictEqual(refresh, ['PreToolUse'], 'the control: a refresh changes the matcher alone');
  assert.deepStrictEqual(D.check(s, ROOT).map((r) => r.key), refresh);
});

it('the record survives as data, because the event that makes it cannot speak', () => {
  const s = installed();
  s.hooks.PreToolUse[0].matcher = 'Edit';
  const rec = D.record(D.check(s, ROOT), '2026-08-12T10:00:00Z');
  assert.strictEqual(rec.at, '2026-08-12T10:00:00Z');
  assert.ok(rec.entries.length);
  assert.ok(rec.entries.every((e) => /:altered$/.test(e)), `unreadable record: ${rec.entries}`);
});

it('the report names the count and the repair', () => {
  const out = D.render(D.record([{ key: 'PreToolUse', state: 'altered' }], '2026-08-12T10:00:00Z'));
  assert.match(out, /PreToolUse:altered/);
  assert.match(out, /hooks install/, 'the report does not say how to fix it');
  assert.match(out, /Nothing was blocked/, 'the report must say it did not interfere');
});

it('nothing recorded renders nothing', () => {
  assert.strictEqual(D.render(null), '');
  assert.strictEqual(D.render({ entries: [] }), '');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
