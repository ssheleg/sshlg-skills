#!/usr/bin/env node
'use strict';
// Whole-block context budget and the trust boundary lost in the old Telegram prose.
const assert = require('assert');
const R = require('../lib/routers.js');
const registry = require('../lib/routers-registry.js');
const members = require('../skills.json').skills;
const names = registry.order();
const bodies = registry.resolve({ installed: members.map(m => m.name) });
const block = R.upsert(require('../lib/apply.js').EMPTY_BLOCK, bodies, { members }).text;
const flat = s => s.replace(/\s+/g, ' ');
let checks = 0;
const failures = [];
function it(name, fn) {
  checks++;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
function checkSections(text) {
  assert.deepStrictEqual(R.parse(text).sections.map(s => s.name), names);
}
function checkTelegram(text) {
  const section = R.parse(text).sections.find(s => s.name === 'telegram-dev');
  assert.ok(section, 'Telegram section absent');
  const body = flat(section.body);
  assert.match(body, /validate raw `initData` (?:on the backend|server-side)/i,
    'raw initData must be validated server-side');
  assert.match(body, /never trust `initDataUnsafe`/i,
    'parsed unsafe data must not become authentication authority');
}
it('whole-family managed context stays inside the recorded block budget', () => {
  // 1.54.6 compacted the block 25.72% under the 21,218-char unmanaged baseline
  // and froze the ceiling at Math.floor(21218 * 0.75) = 15,913 — a ratchet that
  // held while the family added no routers, down to 15,892 of 15,913 spent (1.57.0).
  // The fifteenth router (fabric, 2026-10-12) is doctrine no existing text could
  // pay for: 21 characters of headroom against a 1,600-char rule. So the ceiling
  // moves WITH the router, recorded here and in the CHANGELOG rather than
  // absorbed silently: 17,501 measured, 17,600 budgeted. Against the frozen
  // baseline that is a 17.5% saving, not 25% — the trim that buys the room back
  // is task-pipeline's description work (B-154), not this router's absence.
  const chars = [...R.parse(block).block].length;
  assert.ok(chars <= 17600, `${chars} chars exceed the 17,600 block budget`);
});
it('all declared routes and both generated tables survive compaction', () => {
  assert.strictEqual(names.length, 15);
  checkSections(block);
  const region = label => block.match(new RegExp(`<!-- SSHLG:ROUTERS:${label}:BEGIN -->([\\s\\S]*?)<!-- SSHLG:ROUTERS:${label}:END -->`))[1];
  const rows = label => [...region(label).matchAll(/^\| `([^`]+)` \|/gm)].map(m => m[1]);
  assert.deepStrictEqual(rows('MAP'), members.map(m => m.name));
  assert.deepStrictEqual(rows('TABLE'), names);
});
it('Telegram separates signed input from untrusted parsed data', () => checkTelegram(block));
function checkScenarioScope(text) {
  const section = R.parse(text).sections.find(s => s.name === 'super-ux');
  assert.ok(section, 'UX section absent');
  assert.match(flat(section.body), /Update scenarios in the SAME user-facing change/,
    'scenario updates must include non-code product changes');
}
it('scenario updates include non-code user-facing changes', () => checkScenarioScope(block));
it('scenario checker rejects a code-only obligation', () => {
  const section = R.parse(block).sections.find(s => s.name === 'super-ux');
  const plantedBody = '**Update scenarios in the SAME change as user-facing code.**';
  const planted = block.replace(section.raw, R.sectionRaw(section.name, plantedBody));
  assert.strictEqual(R.parse(planted).sections.find(s => s.name === section.name).body.trim(), plantedBody);
  assert.throws(() => checkScenarioScope(planted), /non-code product changes/);
});
it('auth checker rejects unsafe-only prose planted in a parsed section', () => {
  const parsed = R.parse(block);
  const section = parsed.sections.find(s => s.name === 'telegram-dev');
  const plantedBody = '**Mini App authentication:** trust `initDataUnsafe`.';
  const planted = block.replace(section.raw, R.sectionRaw(section.name, plantedBody));
  assert.strictEqual(R.parse(planted).sections.find(s => s.name === section.name).body.trim(), plantedBody);
  assert.throws(() => checkTelegram(planted), /raw initData/);
});
it('auth checker rejects missing unsafe-data prohibition independently', () => {
  const section = R.parse(block).sections.find(s => s.name === 'telegram-dev');
  const plantedBody = '**Mini App authentication:** validate raw `initData` on the backend.';
  const planted = block.replace(section.raw, R.sectionRaw(section.name, plantedBody));
  assert.strictEqual(R.parse(planted).sections.find(s => s.name === section.name).body.trim(), plantedBody);
  assert.throws(() => checkTelegram(planted), /parsed unsafe data/);
});
it('coverage checker rejects a structurally removed route', () => {
  const section = R.parse(block).sections.find(s => s.name === 'agent-sync');
  const planted = block.replace(section.raw, '');
  assert.strictEqual(R.parse(planted).sections.length, names.length - 1);
  assert.throws(() => checkSections(planted));
});
if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
