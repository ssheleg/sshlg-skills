#!/usr/bin/env node
'use strict';
const assert = require('assert');
const T = require('../lib/toolkit');
// Frozen bilingual synthetic corpus. No operator inventory or private descriptions.
const corpus = [
  { id: 'make-skill', description: 'Use when creating or auditing agent skills. Triggers: skill audit, аудит скилов. Validate skill construction.', visibility: 'user-invocable-only', path: '/catalog/make-skill/SKILL.md' },
  { id: 'skill-search', description: 'Find an installed skill. Skill discovery; поиск скиллов.', path: '/catalog/skill-search/SKILL.md' },
  { id: 'brand-discovery', description: 'A skill for discovery of company materials and audit reports.' },
  { id: 'company-audit', description: 'Audit a company. This skill uses discovery of documents.' },
  ...Array.from({length: 15}, (_, i) => ({id: `noise-${i}`, description: 'Audit reports using a skill.'})),
  { id: 'pdf', description: 'Read and create PDF files.' },
  { id: 'xlsx', description: 'Create Excel spreadsheets.' },
  { id: 'knowledge-graph', description: 'Build a graph of documents.' },
  { id: 'stripe-billing', description: 'Payment webhooks; проверка платежей.' },
  { id: 'task-pipeline', description: 'Execute repository changes in waves.' },
  { id: 'dead-skill', description: 'skill audit', callable: false },
];
const probes = [
  {q:'skill discovery, поиск скиллов, token budget, экономия токенов, waves, skill audit', want:['make-skill','skill-search'], k:5},
  {q:'skill audit', want:['make-skill'], k:1},
  {q:'аудит скилов', want:['make-skill'], k:1},
  {q:'поиск скиллов', want:['skill-search'], k:1},
  {q:'pdf, excel, spreadsheet', want:['pdf','xlsx'], k:5},
  {q:'knowledge graph', want:['knowledge-graph'], k:1},
  {q:'payment webhooks', want:['stripe-billing'], k:1},
  {q:'проверка платежей', want:['stripe-billing'], k:1},
  {q:'waves', want:['task-pipeline'], k:1},
];
let checks = 0;
const failures = [];
function test(name, fn) { checks++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
let relevant = 0, found = 0, rr = 0;
for (const p of probes) test(p.q, () => {
  const rows = T.find(corpus, p.q, 40).rows;
  const misses = [];
  for (const id of p.want) {
    const rank = rows.findIndex(r => r.id === id) + 1;
    relevant++; if (rank && rank <= p.k) found++; if(rank) rr += 1 / rank;
    if (!(rank > 0 && rank <= p.k)) misses.push(`${id} rank ${rank}, required top ${p.k}`);
  }
  assert.deepStrictEqual(misses, []);
});
test('unrelated query returns nothing', () => assert.deepStrictEqual(T.find(corpus, 'volcanic basalt').rows, []));
test('unreadable skill excluded while hidden skill retains path', () => {
  const rows = T.find(corpus, 'skill audit', 40).rows;
  assert.ok(!rows.some(r => r.id === 'dead-skill'));
  assert.strictEqual(rows.find(r => r.id === 'make-skill').path, '/catalog/make-skill/SKILL.md');
});
test('whole-word phrase avoids substring boost', () => {
  const rows = T.find([
    {id:'real', description:'A skill audit checks construction in its owning package.'},
    {id:'wrong',description:'skill auditor'},
  ], 'skill audit').rows;
  assert.strictEqual(rows[0].id,'real');
});
console.log(`RETRIEVAL: ${found}/${relevant} expected skills within declared cutoff; MRR=${(rr/relevant).toFixed(3)}; synthetic corpus only`);
if (failures.length) { failures.forEach(f => console.log(`FAIL: ${f}`)); process.exit(1); }
console.log(`OK (${checks} checks)`);
