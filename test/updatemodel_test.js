#!/usr/bin/env node
'use strict';
// Fixtures for lib/updatemodel.js — the closing line of every install.
//
// The behaviour worth gating is not the wording. It is that the notice REPORTS and never
// writes: `known_marketplaces.json` belongs to the operator and to Claude Code, and a
// launcher that silently flipped somebody's setting to match its own opinion would be the
// same class of act as the two defects that destroyed `~/.claude/CLAUDE.md`. So the module
// reads one file, names what it found, and changes nothing.
//
// The second property: an absent or unreadable file is not an error. A machine with no
// plugins has nothing to report, and failing an install over a missing JSON file would be
// worse than the drift the notice exists to warn about.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const U = require('../lib/updatemodel.js');
const data = require('../skills.json');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const MARKETS = data.skills.map((s) => s.pluginInstall.split('@')[1]);

function tmpHome(known) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'um-'));
  if (known !== undefined) {
    const dir = path.join(home, '.claude', 'plugins');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'known_marketplaces.json'),
      typeof known === 'string' ? known : JSON.stringify(known));
  }
  return home;
}

it('the notice names the one command that updates the set', () => {
  const out = U.notice('install', { on: [] }).join('\n');
  assert.ok(out.includes(U.FAMILY_LINE), out);
  assert.ok(/npx sshlg-skills@latest update/.test(out), out);
});

it('it says auto-update is off ON PURPOSE, and why', () => {
  // Without the reason this reads as a missing feature, and the next person turns it on.
  const out = U.notice('install', { on: [] }).join('\n');
  assert.ok(/OFF for these packs on purpose/.test(out), out);
  assert.ok(/combination nobody\s+tested/.test(out),
    'the notice does not say what auto-update would cost');
  assert.ok(/no member argument|takes no member argument/.test(out),
    'the notice does not tie the reason to the launcher rule it comes from');
});

it('install says nothing checks for you; update does not repeat it', () => {
  const i = U.notice('install', { on: [] }).join('\n');
  const u = U.notice('update', { on: [] }).join('\n');
  assert.ok(/Nothing checks for you/.test(i), i);
  assert.ok(!/Nothing checks for you/.test(u),
    'update repeats a line that only matters at install time');
});

it('a marketplace with the flag on is NAMED, not summarised', () => {
  // "some marketplaces auto-update" is not actionable; the operator needs the name.
  const out = U.notice('update', { on: ['make-skill', 'super-ux'] }).join('\n');
  assert.ok(/make-skill/.test(out) && /super-ux/.test(out), out);
  assert.ok(/2 of this family's marketplaces/.test(out), out);
});

it('and the notice says it changed nothing', () => {
  // The whole reason this module reads rather than writes.
  const out = U.notice('update', { on: ['make-skill'] }).join('\n');
  assert.ok(/Nothing here changed\s+it/.test(out),
    'the notice does not say it left the setting alone');
  assert.ok(/\/plugin/.test(out), 'the notice does not say where to change it');
});

it('with none on, the notice carries no warning at all', () => {
  const out = U.notice('update', { on: [] }).join('\n');
  assert.ok(!/NOTE:/.test(out), `a clean machine was warned anyway:\n${out}`);
});

it('only this family\'s marketplaces are read — a foreign one is not our business', () => {
  const home = tmpHome({
    'make-skill': { autoUpdate: true },
    'somebody-else': { autoUpdate: true },
    'super-ux': {},
  });
  const r = U.autoUpdateState(home, MARKETS);
  assert.deepStrictEqual(r.on, ['make-skill']);
  assert.strictEqual(r.read, true);
});

it('absent means absent — only `true` counts as on', () => {
  // `claude plugin marketplace add` writes no such key at all, which is the normal state
  // for every pack installed the official way. A missing key is not `false` and not an
  // error; it is simply not on.
  const home = tmpHome({
    'make-skill': {},
    'super-ux': { autoUpdate: false },
    'agent-sync': { autoUpdate: 'true' },
  });
  assert.deepStrictEqual(U.autoUpdateState(home, MARKETS).on, []);
});

it('a missing or corrupt file reports nothing and throws nothing', () => {
  // An install must not fail over its own closing note.
  const empty = U.autoUpdateState(tmpHome(), MARKETS);
  assert.deepStrictEqual(empty.on, []);
  assert.strictEqual(empty.read, false, 'a missing file was reported as read');

  const corrupt = U.autoUpdateState(tmpHome('{ not json'), MARKETS);
  assert.deepStrictEqual(corrupt.on, []);
  assert.strictEqual(corrupt.read, false);
});

it('reading does not write', () => {
  // Asserted rather than assumed: the file is the operator's and Claude Code's.
  const home = tmpHome({ 'make-skill': { autoUpdate: true } });
  const file = path.join(home, '.claude', 'plugins', 'known_marketplaces.json');
  const before = fs.readFileSync(file, 'utf8');
  U.autoUpdateState(home, MARKETS);
  U.notice('update', U.autoUpdateState(home, MARKETS));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before,
    'the notice rewrote the operator\'s marketplace file');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
