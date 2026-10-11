#!/usr/bin/env node
'use strict';
// Fixtures for lib/visibility.js — which skills keep their place in a host's listing.
//
// The property under test is OWNERSHIP as much as the plan: the launcher hides only
// what it can name as its own, never touches a value the operator set by hand, and its
// revert removes exactly what it wrote. And an edit to a file the launcher did not write
// must either reproduce every other byte or refuse.

const assert = require('assert');
const V = require('../lib/visibility.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const DAY = 86400e3;
const NOW = Date.UTC(2026, 9, 10);
const USAGE = {
  'used-recently': { usageCount: 3, lastUsedAt: NOW - 5 * DAY },
  'used-long-ago': { usageCount: 40, lastUsedAt: NOW - 200 * DAY },
  'task-pipeline:task-pipeline': { usageCount: 9, lastUsedAt: NOW - DAY },
};
const PERSONAL = ['used-recently', 'used-long-ago', 'never-used', 'named-in-instructions', 'operator-set'];
const FAMILY = ['task-pipeline', 'ux-flows'];

it('core: family, recently used and instruction-named skills; nothing else', () => {
  const core = V.core({ personal: PERSONAL, family: FAMILY, usage: USAGE, now: NOW, days: 60,
    instructions: 'Read the `named-in-instructions` skill first.' });
  assert.deepStrictEqual([...core].sort(),
    ['named-in-instructions', 'task-pipeline', 'used-recently', 'ux-flows']);
});

it('core: a name mentioned in prose without backticks does not count — only a deliberate reference', () => {
  const core = V.core({ personal: ['pdf'], family: [], usage: {}, now: NOW, days: 60,
    instructions: 'export it as a pdf file' });
  assert.ok(!core.has('pdf'));
});

it('claude plan: hides the rest, skips what the operator already set, keeps --keep', () => {
  const core = new Set(['used-recently']);
  const plan = V.claudePlan({ personal: PERSONAL, core, overrides: { 'operator-set': 'on' }, keep: ['never-used'] });
  assert.deepStrictEqual(plan.hide.sort(), ['named-in-instructions', 'used-long-ago']);
  assert.deepStrictEqual(plan.respected, ['operator-set']);
});

it('claude settings: only skillOverrides changes, and the rest is byte-identical', () => {
  const before = JSON.stringify({ model: 'x', enabledPlugins: { 'a@b': true } }, null, 2) + '\n';
  const r = V.editClaudeSettings(before, { set: ['b', 'a'], unset: [] });
  assert.strictEqual(r.ok, true);
  const after = JSON.parse(r.text);
  assert.deepStrictEqual(after.skillOverrides, { a: 'user-invocable-only', b: 'user-invocable-only' });
  assert.strictEqual(after.model, 'x');
  const back = V.editClaudeSettings(r.text, { set: [], unset: ['a', 'b'] });
  assert.strictEqual(back.text, before, 'revert must return the original bytes');
});

it('claude settings: a file not in canonical 2-space JSON form is refused, not reformatted', () => {
  const odd = '{"model":"x"}\n';
  const r = V.editClaudeSettings(odd, { set: ['a'], unset: [] });
  assert.strictEqual(r.ok, false);
  assert.ok(/format/.test(r.reason), r.reason);
});

it('claude settings: unset leaves a value the operator changed since', () => {
  const t = JSON.stringify({ skillOverrides: { a: 'on', b: 'user-invocable-only' } }, null, 2) + '\n';
  const r = V.editClaudeSettings(t, { set: [], unset: ['a', 'b'] });
  assert.deepStrictEqual(JSON.parse(r.text).skillOverrides, { a: 'on' });
  assert.deepStrictEqual(r.kept, ['a']);
});

const CODEX = [
  'model = "x"',
  '',
  '["skills"]',
  '"config" = [{ "path" = "/h/.agents/skills/fam/SKILL.md", "enabled" = false }]',
  '',
  '[other]',
  'a = 1',
  '',
].join('\n');

it('codex: appends disabled entries in the file\'s own style and touches no other line', () => {
  const r = V.editCodexConfig(CODEX, { disable: ['/h/.agents/skills/z/SKILL.md'], enable: [] });
  assert.strictEqual(r.ok, true, r.reason);
  const a = CODEX.split('\n');
  const b = r.text.split('\n');
  assert.strictEqual(a.length, b.length);
  const changed = a.map((l, i) => l !== b[i]).filter(Boolean).length;
  assert.strictEqual(changed, 1);
  assert.ok(b[3].includes('{ "path" = "/h/.agents/skills/z/SKILL.md", "enabled" = false }'), b[3]);
  assert.ok(b[3].includes('/fam/SKILL.md'), 'an existing entry was lost');
});

it('codex: revert removes exactly the launcher\'s entries and returns the original bytes', () => {
  const on = V.editCodexConfig(CODEX, { disable: ['/h/.agents/skills/z/SKILL.md'], enable: [] }).text;
  const off = V.editCodexConfig(on, { disable: [], enable: ['/h/.agents/skills/z/SKILL.md'] });
  assert.strictEqual(off.text, CODEX);
});

it('codex: an entry already present is not duplicated (idempotent)', () => {
  const once = V.editCodexConfig(CODEX, { disable: ['/h/.agents/skills/z/SKILL.md'], enable: [] }).text;
  const twice = V.editCodexConfig(once, { disable: ['/h/.agents/skills/z/SKILL.md'], enable: [] }).text;
  assert.strictEqual(twice, once);
});

it('codex: no skills table yet — one is appended, nothing above it moves', () => {
  const t = 'model = "x"\n';
  const r = V.editCodexConfig(t, { disable: ['/p/SKILL.md'], enable: [] });
  assert.ok(r.text.startsWith(t), 'existing bytes moved');
  assert.ok(/\n\[skills\]\nconfig = \[\{ path = "\/p\/SKILL\.md", enabled = false \}\]\n$/.test(r.text), r.text);
});

it('codex: a skills table in a shape this cannot parse is refused, never guessed at', () => {
  const t = '[skills]\nconfig = [\n  { path = "/a", enabled = false },\n]\n';
  const r = V.editCodexConfig(t, { disable: ['/p'], enable: [] });
  assert.strictEqual(r.ok, false);
  assert.ok(r.reason, 'a refusal names its reason');
});

// ── review findings, 2026-10-10 — each input reproduced a defect before the fix ──

it('codex: `skills` defined any other way is refused, never a second definition appended', () => {
  for (const t of [
    '[[skills.config]]\npath = "/a/SKILL.md"\nenabled = false\n',
    'skills.config = [{ path = "/a", enabled = false }]\n',
    'skills = { config = [] }\n',
    '"skills".config = []\n',
  ]) {
    const r = V.editCodexConfig(t, { disable: ['/p'], enable: [] });
    assert.strictEqual(r.ok, false, `accepted: ${JSON.stringify(t)} → ${JSON.stringify(r.text)}`);
  }
});

it('codex: an indented header or one with a comment is still the table', () => {
  for (const h of ['  [skills]', '[skills] # mine']) {
    const t = `${h}\nconfig = [{ path = "/a", enabled = false }]\n`;
    const r = V.editCodexConfig(t, { disable: ['/p'], enable: [] });
    assert.strictEqual(r.ok, true, r.reason);
    assert.strictEqual((r.text.match(/skills\]/g) || []).length, 1, r.text);
  }
});

it('codex: added lists only what was not already there', () => {
  const r = V.editCodexConfig(CODEX, { disable: ['/h/.agents/skills/fam/SKILL.md', '/n/SKILL.md'], enable: [] });
  assert.deepStrictEqual(r.added, ['/n/SKILL.md']);
});

it('codex: an escaped path compares decoded — no duplicate, revert finds it', () => {
  const t = '[skills]\nconfig = [{ path = "/q\\"x/SKILL.md", enabled = false }]\n';
  assert.strictEqual(V.editCodexConfig(t, { disable: ['/q"x/SKILL.md'], enable: [] }).text, t);
  assert.strictEqual(V.editCodexConfig(t, { disable: [], enable: ['/q"x/SKILL.md'] }).text, '[skills]\nconfig = []\n');
});

it('codex: a control character in a path is escaped, not written raw', () => {
  const r = V.editCodexConfig('', { disable: ['/a\tb/SKILL.md'], enable: [] });
  assert.ok(r.text.includes('/a\\tb/SKILL.md'), r.text);
});

it('codex: CRLF line endings survive on the edited line', () => {
  const t = '[skills]\r\nconfig = [{ path = "/a", enabled = false }]\r\n[x]\r\n';
  const r = V.editCodexConfig(t, { disable: ['/p'], enable: [] });
  assert.ok(/\]\r\n\[x\]/.test(r.text), JSON.stringify(r.text));
});

it('claude settings: nothing to change returns the file untouched, even an empty map', () => {
  const t = JSON.stringify({ skillOverrides: {} }, null, 2) + '\n';
  assert.strictEqual(V.editClaudeSettings(t, { set: [], unset: [] }).text, t);
});

it('claude settings: existing keys keep their order; new ones are appended', () => {
  const t = JSON.stringify({ skillOverrides: { z: 'on', a: 'off' } }, null, 2) + '\n';
  const r = V.editClaudeSettings(t, { set: ['m'], unset: [] });
  assert.deepStrictEqual(Object.keys(JSON.parse(r.text).skillOverrides), ['z', 'a', 'm']);
});

it('core: a slash-command mention names the skill too', () => {
  const core = V.core({ personal: ['graphify'], family: [], usage: {}, now: NOW, days: 60, instructions: 'On `/graphify`, read it.' });
  assert.ok(core.has('graphify'));
});

it('listing cost: a listed name counts, a description only when on (capped at 1536), hidden costs nothing', () => {
  const rows = [
    { name: 'a', description: 'x'.repeat(2000), state: 'on' },
    { name: 'bb', description: 'y'.repeat(10), state: 'name-only' },
    { name: 'ccc', description: 'z'.repeat(10), state: 'hidden' },
  ];
  assert.strictEqual(V.listingChars(rows), 1 + 1536 + 2);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
