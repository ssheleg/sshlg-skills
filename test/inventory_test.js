#!/usr/bin/env node
'use strict';
// Fixtures for lib/inventory.js — the map of the family that goes into the
// managed block.
//
// Measured before this existed: the block named 6 of 20 commands, 8 of 19
// skills and 6 of 8 members, and never mentioned `sheleg-dev` or `agent-stack`
// at all. An agent installing the whole pack learned eight rules about WHEN to
// route and nothing about WHAT it had.
//
// The fix is a MAP, not a catalogue, and the distinction carries the design.
// Claude Code already puts every skill's name and description in front of the
// agent; copying those into the operator's global instructions would be a
// second home for one fact — the thing `docs/DOCMAP.md` exists to forbid — and
// it would be the copy that goes stale. What no harness can derive is the
// shape: which single command starts each member, what each one closes, and
// the order they compose in. That is what this renders.
//
// `entry` is DECLARED in skills.json, never derived. super-ux's entry point is
// `/ux` and its member name is `super-ux`; no rule over the name finds that,
// and a map whose entry points are guessed is worse than no map — it sends the
// agent to a command that does not exist.

const assert = require('assert');
const path = require('path');
const I = require('../lib/inventory.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const MEMBERS = [
  { name: 'super-ux', entry: '/ux', role: 'что интерфейс должен делать', skillNames: ['vision', 'ux-audit'] },
  { name: 'task-pipeline', entry: '/task-pipeline', role: 'как изменение доедет до репозитория', skillNames: ['task-pipeline', 'evidence-docs'] },
  { name: 'sheleg-dev', entry: null, role: 'интеграции', skillNames: ['crypto-payments', 'google-auth'] },
];

it('every member gets a row, including the ones with no command', () => {
  const rows = I.mapRows(MEMBERS);
  assert.deepStrictEqual(rows.map((r) => r.name), ['super-ux', 'task-pipeline', 'sheleg-dev']);
});

it('a member with a command shows it as the entry point', () => {
  assert.strictEqual(I.mapRows(MEMBERS)[0].entry, '`/ux`');
});

it('a member with no command names its skills instead of showing an empty cell', () => {
  // An empty cell reads as "nothing here". These members are reached by
  // description, not by a command, and the agent has to be told which names to
  // reach for.
  const row = I.mapRows(MEMBERS)[2];
  assert.ok(row.entry.includes('crypto-payments'), row.entry);
  assert.ok(row.entry.includes('google-auth'), row.entry);
  assert.ok(!row.entry.includes('/'), 'a skill id must not be rendered as a command');
});

it('the rendered map is a table with one row per member', () => {
  const md = I.renderMap(MEMBERS);
  const rows = md.split('\n').filter((l) => l.startsWith('| `'));
  assert.strictEqual(rows.length, 3, md);
});

it('the map names every member', () => {
  const md = I.renderMap(MEMBERS);
  for (const m of MEMBERS) assert.ok(md.includes(m.name), `${m.name} missing from the map`);
});

it('a declared entry that is not a command is refused rather than rendered', () => {
  // Guessing is the failure this design exists to avoid. If `entry` ever holds
  // something that is not a slash command, the map would send an agent to a
  // command that does not exist — and it would look authoritative.
  assert.throws(
    () => I.mapRows([{ name: 'x', entry: 'ux', role: 'r', skillNames: ['a'] }]),
    /entry.*must start with/i
  );
});

it('a member with neither entry nor skills is refused — the row would say nothing', () => {
  assert.throws(() => I.mapRows([{ name: 'x', entry: null, role: 'r', skillNames: [] }]), /x/);
});

it('a missing role is refused, because the column is the point of the map', () => {
  assert.throws(() => I.mapRows([{ name: 'x', entry: '/x', skillNames: ['a'] }]), /role/i);
});

it('renderMap touches no filesystem', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'inventory.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  assert.ok(!/require\(\s*['"]fs['"]\s*\)/.test(src), 'lib/inventory.js must not require fs');
});

it('the real registry renders, and every entry it declares is a real command', () => {
  // The map is only worth having if it is true of the shipped family. This
  // reads skills.json and the commands actually on disk.
  const fs = require('fs');
  const glob = (d) => { try { return fs.readdirSync(d); } catch (_) { return []; } };
  const root = path.join(__dirname, '..');
  const man = JSON.parse(fs.readFileSync(path.join(root, 'skills.json'), 'utf8'));
  const shipped = new Set();
  for (const m of man.skills) {
    for (const f of glob(path.join(root, m.dir, 'plugins', m.name, 'commands'))) {
      if (f.endsWith('.md')) shipped.add('/' + f.slice(0, -3));
    }
  }
  const rows = I.mapRows(man.skills);
  assert.strictEqual(rows.length, man.skills.length);
  for (const m of man.skills) {
    if (!m.entry) continue;
    assert.ok(shipped.has(m.entry), `${m.name} declares entry ${m.entry}, which no member ships`);
  }
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
