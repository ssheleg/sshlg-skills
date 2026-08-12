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

it('an entry someone deleted is reported missing', () => {
  const s = installed();
  delete s.hooks.PreToolUse;
  const rows = D.check(s, ROOT);
  assert.deepStrictEqual(rows, [{ key: 'PreToolUse', state: 'missing' }]);
});

it('an entry someone rewrote is reported altered, not missing', () => {
  // Different repairs and different stories: one says another installer dropped
  // us, the other says it edited us. Collapsing them loses which happened.
  const s = installed();
  s.hooks.UserPromptSubmit[0].hooks[0].command = `node "${ROOT}/hooks/user-prompt-submit.js" --их-флаг`;
  assert.deepStrictEqual(D.check(s, ROOT), [{ key: 'UserPromptSubmit', state: 'altered' }]);
});

it('a status line dropped entirely is reported', () => {
  const s = installed();
  delete s.statusLine;
  assert.ok(D.check(s, ROOT).some((r) => r.key === 'statusLine' && r.state === 'missing'));
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

it('an empty settings file reports every entry, and does not throw', () => {
  const rows = D.check({}, ROOT);
  assert.strictEqual(rows.length, H.EVENTS.length + 1, `expected every event plus statusLine, got ${rows.length}`);
  assert.deepStrictEqual(D.check(undefined, ROOT), rows);
});

it('the expectation comes from lib/hooks.js, so a rename cannot desynchronise it', () => {
  // If this module carried its own copy of the plan, adding an event would leave
  // the detector describing an install nobody performs.
  const s = installed();
  for (const e of H.EVENTS) delete s.hooks[e];
  const reported = D.check(s, ROOT).filter((r) => r.state === 'missing').map((r) => r.key);
  for (const e of H.EVENTS) assert.ok(reported.includes(e), `${e} is wired but not watched`);
});

it('the record survives as data, because the event that makes it cannot speak', () => {
  const rec = D.record(D.check({}, ROOT), '2026-08-12T10:00:00Z');
  assert.strictEqual(rec.at, '2026-08-12T10:00:00Z');
  assert.ok(rec.entries.length);
  assert.ok(rec.entries.every((e) => /:(missing|altered)$/.test(e)), `unreadable record: ${rec.entries}`);
});

it('the report names the count and the repair', () => {
  const out = D.render(D.record([{ key: 'PreToolUse', state: 'missing' }], '2026-08-12T10:00:00Z'));
  assert.match(out, /PreToolUse:missing/);
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
