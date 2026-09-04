#!/usr/bin/env node
'use strict';
// Fixtures for lib/toolkit.js — the roster an agent picks its tools from.
//
// The property under test is not the ranking. It is that the index NEVER LIES BY
// OMISSION: every provider prints its count even when its members stay closed, an empty
// shortlist says so instead of printing nothing, and the walk is the one in conflicts.js
// rather than a second answer to "what is installed".
//
// The ranking itself is deliberately weak — term overlap against each skill's own
// description — and the report says so in its own output, because a shortlist that reads
// like a decision is worse than no shortlist. A fixture asserts that sentence is present.

const assert = require('assert');

const T = require('../lib/toolkit.js');
const C = require('../lib/conflicts.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const SKILLS = [
  { plugin: 'super-ux@super-ux', id: 'ux-audit', description: 'Audit the codebase against scenarios.' },
  { plugin: 'task-pipeline@task-pipeline', id: 'task-pipeline', description: 'Carry a change to the repository.' },
  { plugin: 'other@vendor', id: 'seo-audit', description: 'Run a comprehensive SEO audit of a site.' },
  { plugin: 'other@vendor', id: 'pdf', description: 'Read and write PDF files.' },
  { plugin: 'third@vendor', id: 'xlsx', description: 'Spreadsheets.' },
  { plugin: '(plain ~/.claude/skills)', id: 'graphify', description: 'Turn any input into a knowledge graph.' },
];
const FAMILY = ['ux-audit', 'task-pipeline'];

it('the family is separated from everything else, and nothing is dropped', () => {
  const { family, foreign, total } = T.classify(SKILLS, FAMILY);
  assert.deepStrictEqual(family.map((s) => s.id), ['task-pipeline', 'ux-audit']);
  assert.strictEqual(total, SKILLS.length);
  const counted = family.length + foreign.reduce((n, g) => n + g.count, 0);
  assert.strictEqual(counted, SKILLS.length, `${counted} classified out of ${SKILLS.length}`);
});

it('plain copies sort last, because they are the likeliest stale duplicate', () => {
  const { foreign } = T.classify(SKILLS, FAMILY);
  assert.strictEqual(foreign[foreign.length - 1].provider, '(plain ~/.claude/skills)');
  assert.ok(foreign[foreign.length - 1].plain, 'the plain channel was not marked as such');
  assert.ok(!foreign[0].plain, 'a packaged provider sorted behind a plain one');
});

it('a skill with no plugin is still counted, under a named bucket', () => {
  // Dropping it would make the total disagree with the roster, silently.
  const { foreign, total } = T.classify([{ id: 'orphan', description: 'x' }], []);
  assert.strictEqual(total, 1);
  assert.strictEqual(foreign[0].provider, '(unknown)');
});

it('the shortlist ranks by how many of the task words a description carries', () => {
  const { rows } = T.rank(SKILLS, 'seo audit of a site', 5, FAMILY);
  assert.strictEqual(rows[0].id, 'seo-audit', `${rows[0] && rows[0].id} led instead`);
  assert.ok(rows[0].score >= 2, `score ${rows[0].score}`);
  assert.ok(rows.every((s) => s.hits.length >= 2),
    'a row below the two-term floor was ranked anyway');
});

it('common words do not drag in every skill', () => {
  // Without a stop list, "the" and "and" match nearly every description and the shortlist
  // becomes an arbitrary slice of the whole roster with a confident-looking order.
  assert.deepStrictEqual(T.terms('the and of for on with is это как'), []);
  assert.deepStrictEqual(T.rank(SKILLS, 'the and of', 5, FAMILY).rows, []);
});

it('an empty query yields no shortlist rather than the whole roster', () => {
  assert.deepStrictEqual(T.rank(SKILLS, '', 5, FAMILY).rows, []);
  assert.deepStrictEqual(T.rank(SKILLS, null, 5, FAMILY).rows, []);
});

it('every provider prints its count even when its skills stay closed', () => {
  const out = T.report(SKILLS, FAMILY, {});
  for (const g of T.classify(SKILLS, FAMILY).foreign) {
    assert.ok(out.includes(g.provider), `${g.provider} is missing from the index`);
    const line = out.split('\n').find((l) => l.includes(g.provider));
    assert.ok(new RegExp(`\\b${g.count}\\s*$`).test(line), `${g.provider} printed no count: ${line}`);
  }
  assert.ok(!out.includes('seo-audit'), 'a closed provider leaked a member into the index');
  assert.ok(/never a sample/.test(out), 'the index does not say that groups are closed');
});

it('--expand opens exactly the provider named, and no other', () => {
  const out = T.report(SKILLS, FAMILY, { expand: ['other@vendor'] });
  assert.ok(out.includes('seo-audit') && out.includes('pdf'), 'the expanded provider stayed closed');
  assert.ok(!out.includes('Spreadsheets'), 'an unexpanded provider was opened too');
});

it('the report says its ranking is not a decision', () => {
  // The whole risk of this feature: a ranked list reads as an answer. If this sentence
  // ever goes, the shortlist starts looking authoritative and the caveat is gone.
  const out = T.report(SKILLS, FAMILY, { for: 'seo audit' });
  assert.ok(/SHORTLIST, not a decision/.test(out), out.slice(-400));
  assert.ok(/term overlap/.test(out), 'the ranking method is not disclosed');
});

it('a query that matches nothing says so, rather than printing an empty list', () => {
  const out = T.report(SKILLS, FAMILY, { for: 'zzzquux' });
  assert.ok(/NOTHING on this machine matched/.test(out), out.slice(-300));
});

it('family members are marked in the shortlist', () => {
  const out = T.report(SKILLS, FAMILY, { for: 'audit the scenarios in this repository' });
  const row = out.split('\n').find((l) => l.includes('ux-audit') && l.includes('['));
  assert.ok(row && row.trim().startsWith('*'), `family row is not marked: ${row}`);
});

it('a shortlist can be EMPTY, and says so', () => {
  // A fixed-length answer makes a miss look like a hit: this padded to seven
  // least-bad string matches whether seven fitted or none did.
  const out = T.report(SKILLS, FAMILY, { for: 'quantum cryogenics helium dilution' });
  assert.ok(/NOTHING on this machine matched/.test(out),
    'an empty shortlist printed nothing instead of saying it was empty');
});

it('one shared word is not a hit, and the drop is counted out loud', () => {
  // `build-zoom-video-sdk-app` reached position two on a backlog query, matched on
  // `after` and `full`. One term is where any two English sentences overlap.
  const { rows, dropped } = T.rank(SKILLS, 'audit', 12, FAMILY);
  assert.deepStrictEqual(rows, [], 'a single-term match survived the floor');
  assert.ok(dropped >= 1, 'the dropped rows were not counted');
});

it('a word carried by most of a REAL-SIZED roster is measured out, not listed out', () => {
  // A hand-kept stoplist is a guess about the language; which words separate nothing
  // is a fact about this roster. The corpus is padded past CORPUS_FLOOR deliberately:
  // below it the ratio has no meaning and the filter is off.
  const many = Array.from({ length: 60 }, (_, i) => (
    { plugin: 'x@y', id: `s${i}`, description: 'a skill that does ordinary things' }));
  many.push({ plugin: 'x@y', id: 'rare-one', description: 'a skill about xylophones' });
  const { weak } = T.rank(many, 'skill xylophones', 12, []);
  assert.ok(weak.includes('skill'), `a word in every description was kept: ${JSON.stringify(weak)}`);
  assert.ok(!weak.includes('xylophones'), 'a rare word was discarded as common');
});

it('the spread filter is OFF on a small roster, where a ratio means nothing', () => {
  // One match in six is 16.7%: every term would clear a 10% threshold and the
  // shortlist would empty itself. Found by a fixture, not by reasoning.
  const { weak } = T.rank(SKILLS, 'seo audit of a site', 5, FAMILY);
  assert.deepStrictEqual(weak, [], 'the ratio filter ran on a corpus too small to have one');
});

it('on an equal score the family skill wins', () => {
  const rows = T.rank([
    { plugin: 'other@vendor', id: 'zzz-foreign', description: 'audit scenarios repository' },
    { plugin: 'super-ux@super-ux', id: 'ux-audit', description: 'audit scenarios repository' },
  ], 'audit scenarios repository', 12, ['ux-audit']).rows;
  assert.strictEqual(rows[0].id, 'ux-audit',
    'a foreign skill outranked the family on a tie — how make-skill finished tenth');
});

it('the roster walk is conflicts.js\'s, not a second copy of it', () => {
  // Two walks answer "what is installed" identically until somebody fixes one of them.
  assert.strictEqual(T.readSkills, C.readSkills,
    'toolkit exports a different reader than conflicts — that is a second home for one fact');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
