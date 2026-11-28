#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// Fixtures for lib/skillsaudit.js: the read-only skills audit (B-368, ST-18).
//
// The module is pure, so every rule is decided here from listings, with no HOME:
// the four hint kinds, the runner on each hint, a runner that could not be read
// (named, never shown as clean), and the item shape, which must stay inside the
// contract's `project-setup/1` skills item (additionalProperties: false).

const assert = require('assert');
const A = require('../lib/skillsaudit.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const NOW = Date.parse('2026-11-28T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const plugin = (name, spec, version) => ({ name, scope: 'global', channel: 'plugin', plugin: spec, version, path: `/c/${spec}/${name}/SKILL.md`, callable: true });
const plain = (name) => ({ name, scope: 'global', channel: 'plain', plugin: null, version: null, path: `/h/.claude/skills/${name}`, callable: true });
const proj = (name) => ({ name, scope: 'project', channel: 'plain', plugin: null, version: null, path: `/p/.claude/skills/${name}`, callable: true });
const claude = (copies) => ({ id: 'claude-code', profile: '/h/.claude', copies });
const base = { pins: { 'super-ux': '0.68.0' }, ownedPlugins: ['super-ux@super-ux'], routed: ['task-pipeline'], now: NOW, days: 60 };
const run = (copies, extra) => A.audit(Object.assign({}, base, { runners: [claude(copies)] }, extra || {}));
const item = (rep, name, scope) => rep.skills.find((s) => s.name === name && s.scope === (scope || 'global'));
const kinds = (it) => it.hints.map((h) => h.kind + (h.other ? `:${h.other}` : '') + (h.latest ? `@${h.latest}` : '')).sort();

it('a clean family skill has no hints and carries its version', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.68.0')]);
  const s = item(r, 'copywriting');
  assert.deepStrictEqual(s.hints, []);
  assert.strictEqual(s.version, '0.68.0');
  assert.strictEqual(s.source, 'skills-audit');
  assert.strictEqual(s.installed, true);
});

it('stale: installed behind the pin names the pin as latest', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.67.1')]);
  assert.deepStrictEqual(kinds(item(r, 'copywriting')), ['stale@0.68.0']);
  assert.strictEqual(r.counts.stale, 1);
});

it('stale: ahead of the pin, or no pin, is not stale', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.69.0'), plugin('foo', 'other@mkt', '0.1.0')], { routed: ['foo'] });
  assert.deepStrictEqual(kinds(item(r, 'copywriting')), []);
  assert.deepStrictEqual(kinds(item(r, 'foo')), []);
});

it('shadowed: a plain ~/.claude/skills copy over a plugin, other is global', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.68.0'), plain('copywriting')]);
  assert.deepStrictEqual(kinds(item(r, 'copywriting')), ['shadowed:global']);
  const ev = r.evidence.find((e) => e.name === 'copywriting');
  assert.ok(ev.commands.some((c) => c.startsWith('npx --yes sshlg-skills@latest update')), 'family shadow names update');
  assert.strictEqual(ev.copies.length, 2);
});

it('duplicate: two plugins ship one skill id, other names the second plugin', () => {
  const r = run([plugin('pdf', 'docs@a', '1.0.0'), plugin('pdf', 'pdf-tools@b', '2.0.0')], { routed: ['pdf'] });
  assert.deepStrictEqual(kinds(item(r, 'pdf')), ['duplicate:plugin:pdf-tools']);
});

it('project copy over a global plugin: shadowed on global, duplicate on project', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.68.0'), proj('copywriting')]);
  assert.deepStrictEqual(kinds(item(r, 'copywriting')), ['shadowed:project']);
  assert.deepStrictEqual(kinds(item(r, 'copywriting', 'project')), ['duplicate:plugin:super-ux']);
});

it('unused: outside every route and no recent use', () => {
  const r = run([plain('random-skill')]);
  assert.deepStrictEqual(kinds(item(r, 'random-skill')), ['unused']);
});

it('unused: a router name, a declared route or a family plugin clears it', () => {
  const r = run([plain('task-pipeline'), plugin('vision', 'super-ux@super-ux', '0.68.0'), plugin('ns:task-pipeline', 'x@y', '1.0.0')]);
  assert.deepStrictEqual(kinds(item(r, 'task-pipeline')), []);
  assert.deepStrictEqual(kinds(item(r, 'vision')), []);
  assert.deepStrictEqual(kinds(item(r, 'ns:task-pipeline')), [], 'a namespaced id is routed by its bare name');
});

it('unused: skillUsage within the window clears it, outside it does not', () => {
  const fresh = run([plain('a'), plain('b')], { usage: { 'claude-code': { a: NOW - 5 * DAY, b: NOW - 90 * DAY } } });
  assert.deepStrictEqual(kinds(item(fresh, 'a')), []);
  assert.deepStrictEqual(kinds(item(fresh, 'b')), ['unused']);
});

it('every hint names its runner', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.67.1'), plain('copywriting'), plain('z')]);
  for (const s of r.skills) for (const h of s.hints) assert.strictEqual(h.runner, 'claude-code');
});

it('one skill of one scope stays one item across runners, hints split by runner', () => {
  const r = A.audit(Object.assign({}, base, { runners: [
    claude([plugin('copywriting', 'super-ux@super-ux', '0.68.0')]),
    { id: 'codex', profile: '/h/.codex', copies: [plugin('copywriting', 'super-ux@super-ux', '0.67.1')] },
  ] }));
  const items = r.skills.filter((s) => s.name === 'copywriting');
  assert.strictEqual(items.length, 1);
  assert.deepStrictEqual(items[0].hints, [{ kind: 'stale', latest: '0.68.0', runner: 'codex' }]);
});

it('a runner not read is named in degraded, never counted as clean', () => {
  const r = A.audit(Object.assign({}, base, { runners: [claude([]), { id: 'codex', profile: '/h/.codex', read: false, reason: 'not read in this release' }] }));
  assert.deepStrictEqual(r.degraded, [{ runner: 'codex', profile: '/h/.codex', reason: 'not read in this release' }]);
  assert.deepStrictEqual(r.runners.map((x) => [x.id, x.read]), [['claude-code', true], ['codex', false]]);
  assert.ok(/not read: codex/.test(A.render(r)));
});

it('non-callable copies and names outside the contract pattern are skipped with a reason', () => {
  const r = run([Object.assign(plain('broken'), { callable: false }), plain('Bad_Name')]);
  assert.strictEqual(r.skills.length, 0);
  assert.deepStrictEqual(r.skipped.map((s) => s.name).sort(), ['Bad_Name', 'broken']);
});

it('items stay inside the contract skills item (no extra members, enums hold)', () => {
  const r = run([plugin('copywriting', 'super-ux@super-ux', '0.67.1'), plain('copywriting'), proj('copywriting'), plain('z'),
    plugin('pdf', 'docs@a', '1.0.0'), plugin('pdf', 'pdf-tools@b', '2.0.0')]);
  const allowed = new Set(['name', 'scope', 'version', 'expected', 'installed', 'hints', 'source']);
  const hintKeys = new Set(['kind', 'other', 'latest', 'runner']);
  for (const s of r.skills) {
    for (const k of Object.keys(s)) assert.ok(allowed.has(k), `item member ${k}`);
    assert.ok(/^[a-z0-9][a-z0-9:-]{0,127}$/.test(s.name));
    assert.ok(['global', 'project'].includes(s.scope));
    assert.ok(s.hints.length <= 16);
    for (const h of s.hints) {
      for (const k of Object.keys(h)) assert.ok(hintKeys.has(k), `hint member ${k}`);
      assert.ok(['duplicate', 'shadowed', 'stale', 'unused'].includes(h.kind));
      if (h.other) assert.ok(/^(?:global|project|plugin:[a-z0-9][a-z0-9-]{0,63})$/.test(h.other), h.other);
      assert.ok(/^[a-z][a-z0-9-]{0,63}$/.test(h.runner));
    }
  }
  assert.strictEqual(r.format, 'skills-audit/1');
  assert.strictEqual(r.readOnly, true);
});

it('the same input gives the same report (sorted, deterministic)', () => {
  const copies = [plain('z'), plugin('copywriting', 'super-ux@super-ux', '0.67.1'), plain('a')];
  assert.deepStrictEqual(run(copies), run(copies.slice().reverse()));
});

it('render: counts line, may-run hints and the read-only footer', () => {
  const text = A.render(run([plugin('copywriting', 'super-ux@super-ux', '0.67.1'), plain('copywriting'), plain('z')]));
  assert.ok(/duplicate 0, shadowed 1, stale 1, unused 1/.test(text), text);
  assert.ok(/may run: npx --yes sshlg-skills@latest update/.test(text));
  assert.ok(/Nothing was changed/.test(text));
  assert.ok(!text.includes('\u2014'), 'no em dash in text for people');
});

it('compareVersions orders dotted numbers and refuses others', () => {
  assert.strictEqual(A.compareVersions('0.67.1', '0.68.0'), -1);
  assert.strictEqual(A.compareVersions('1.10.0', '1.9.9'), 1);
  assert.strictEqual(A.compareVersions('1.0', '1.0.0'), 0);
  assert.strictEqual(A.compareVersions('1.0.0-beta', '1.0.0'), null);
  assert.strictEqual(A.compareVersions(null, '1.0.0'), null);
});

it('outside Claude Code a plain copy beside a plugin is a duplicate, not shadowed', () => {
  const r = A.audit(Object.assign({}, base, { runners: [{ id: 'codex', profile: '/h/.codex',
    copies: [plugin('copywriting', 'super-ux@super-ux', '0.68.0'), plain('copywriting')] }] }));
  assert.deepStrictEqual(r.skills[0].hints, [{ kind: 'duplicate', other: 'global', runner: 'codex' }]);
});

it('a duplicate in another runner names that runner, not a claude command', () => {
  const r = A.audit(Object.assign({}, base, { routed: ['viz'], runners: [{ id: 'codex', profile: '/h/.codex',
    copies: [plugin('viz', 'viz@a', '1.0.0'), plugin('viz', 'viz@b', '1.0.0')] }] }));
  const cmds = r.evidence[0].commands.join('\n');
  assert.ok(/in codex/.test(cmds) && !/claude plugin/.test(cmds), cmds);
});

it('a runner note is kept and printed', () => {
  const r = A.audit(Object.assign({}, base, { runners: [{ id: 'codex', profile: '/h/.codex', note: 'flags not read', copies: [] }] }));
  assert.strictEqual(r.runners[0].note, 'flags not read');
  assert.ok(/note: codex: flags not read/.test(A.render(r)));
});

if (failures.length) {
  console.error(`FAIL: skillsaudit, ${failures.length} of ${checks}`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
