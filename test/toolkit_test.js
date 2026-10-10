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

// Measured 2026-09-06: the family's own audit query, in Russian, matched
// NOTHING out of 530 skills — every noun arrived declined («скилов») while the
// descriptions advertise the base form («скилл»). The shortlist must survive
// inflection without a language table.
it('an inflected query word reaches the description that carries its stem', () => {
  const corpus = [
    { id: 'make-skill', description: 'аудит скилла против стандарта - "сделай скилл", "skill audit"' },
    { id: 'noise', description: 'совсем другие слова про сад и огород' },
  ];
  const { rows } = T.rank(corpus, 'проведи аудит скилов', 5, new Set(['make-skill']));
  assert.strictEqual((rows[0] || {}).id, 'make-skill',
    `the declined query missed the advertising skill (got ${rows.map((r) => r.id).join(',') || 'nothing'})`);
  // The mechanism, pinned at its edges: plural-to-singular in both alphabets,
  // and a floor of four so a short stem cannot loosen into everything.
  assert.strictEqual(T.termHit('a skill description', 'skills'), true);
  assert.strictEqual(T.termHit('здесь стоит скилл', 'скилов'), true);
  assert.strictEqual(T.termHit('дом и сад', 'домов'), false,
    'a four-letter floor was crossed — short stems must not loosen');
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

// --- a routed task never prints NOTHING (REQ-06, 2026-10-08) --------------------------

const TR = require('../lib/triggers.js');

/** A roster big enough for the spread filter to run, where the routed words are common. */
function crowded() {
  const out = [];
  for (let i = 0; i < 60; i += 1) {
    out.push({ plugin: 'noise@vendor', id: `noise-${i}`,
      description: `a payment bot animation helper number ${i} for checkout` });
  }
  out.push({ plugin: 'sheleg-dev@sheleg-dev', id: 'stripe-billing', description: 'Stripe checkout, payment webhooks.' });
  out.push({ plugin: 'telegram-dev@telegram-dev', id: 'telegram-bots', description: 'A Telegram bot on the Bot API.' });
  return out;
}
const FAM = ['stripe-billing', 'telegram-bots', 'task-pipeline', 'sheleg-design', 'agent-orchestrator'];

it('the six tasks the audit saw print NOTHING each name a routed skill first', () => {
  const roster = crowded();
  for (const [task, first] of [
    ['payment bug', 'stripe-billing'],
    ['Telegram bot', 'telegram-bots'],
    ['improve the animations', 'task-pipeline'],
    ['build an orchestrator', 'task-pipeline'],
    ['add Stripe checkout', 'task-pipeline'],
  ]) {
    const seeds = T.seedsFor(TR, task, []);
    const { rows } = T.rank(roster, task, 12, FAM, { seeds, protect: T.advertisedWords(TR.ROUTES) });
    assert.ok(rows.length, `${task}: NOTHING`);
    assert.strictEqual(rows[0].id, first, `${task}: ${rows.map((r) => r.id).join(',')}`);
    assert.ok(rows[0].seeded, `${task}: the first row is not the routed one`);
  }
  // `icon` routes nowhere in the family; with no declaration it is a term-overlap question
  assert.deepStrictEqual(T.seedsFor(TR, 'make an icon', []), []);
});

it('a seed that is not installed still prints, and says so', () => {
  const seeds = T.seedsFor(TR, 'add a Telegram bot', []);
  const out = T.report([{ plugin: 'x@y', id: 'pdf', description: 'PDF.' }], [], { for: 'add a Telegram bot', seeds });
  assert.ok(/telegram-bots .*NOT installed on this machine/.test(out), out);
  assert.ok(!/NOTHING on this machine matched/.test(out), 'a routed task printed NOTHING');
});

it('a word a family trigger carries is never dropped as non-discriminating', () => {
  const roster = crowded();
  const protect = T.advertisedWords(TR.ROUTES);
  assert.ok(protect.has('payment') && protect.has('bot') && protect.has('checkout'));
  const plain = T.rank(roster, 'payment checkout', 12, FAM);
  assert.ok(plain.weak.includes('payment'), 'the fixture no longer reproduces the drop — it proves nothing');
  const kept = T.rank(roster, 'payment checkout', 12, FAM, { protect });
  assert.deepStrictEqual(kept.weak, [], `still dropped: ${kept.weak.join(', ')}`);
  // …and a word no trigger carries is still measured: the filter is narrowed, not off
  assert.ok(T.rank(roster, 'helper number', 12, FAM, { protect }).weak.includes('helper'));
});

// ── `--find`: the agent parsed the meaning, the search ranks CONCEPTS ─────────────
// Measured 2026-10-10: `--for "сделай pdf отчёт из таблицы excel"` put
// portfolio-monitoring first and never printed `pdf` or `xlsx`, because a raw sentence
// was scored word by word with a two-word floor. `--find` takes the concepts the agent
// derived and treats each one as deliberate.

const FIND = [
  { plugin: 'other@vendor', id: 'pdf', description: 'Read, create and merge PDF documents.', path: '/s/pdf/SKILL.md' },
  { plugin: 'third@vendor', id: 'xlsx', description: 'Spreadsheets: read and write Excel workbooks.', path: '/s/xlsx/SKILL.md' },
  { plugin: 'fin@vendor', id: 'portfolio-monitoring', description: 'Track portfolio company performance from PDF and Excel packages.', path: '/s/pm/SKILL.md' },
  { plugin: '(plain ~/.claude/skills)', id: 'project-reports', description: 'Use when work produces a report.', path: '/s/pr/SKILL.md', visibility: 'user-invocable-only' },
  { plugin: 'other@vendor', id: 'graphify', description: 'Knowledge graph.', path: '/s/g/SKILL.md' },
];

it('find: concepts the agent chose rank the named skills first (the measured miss)', () => {
  const { rows } = T.find(FIND, 'pdf, xlsx, excel, spreadsheet');
  assert.deepStrictEqual(rows.slice(0, 2).map((r) => r.id).sort(), ['pdf', 'xlsx'], rows.map((r) => r.id).join(','));
});

it('find: a name match outranks a description that merely mentions the concept', () => {
  const { rows } = T.find(FIND, 'pdf');
  assert.strictEqual(rows[0].id, 'pdf');
  assert.ok(rows.some((r) => r.id === 'portfolio-monitoring'), 'a one-concept description hit must still show');
});

it('find: a skill hidden from the listing is found, marked, and carries its path', () => {
  const { rows } = T.find(FIND, 'report');
  const r = rows.find((x) => x.id === 'project-reports');
  assert.ok(r, 'hidden skill not found');
  const out = T.renderFind(rows, 'report');
  assert.ok(/project-reports.*hidden/.test(out), out);
  assert.ok(out.includes('/s/pr/SKILL.md'), 'the path is what a host without the skill listed opens');
});

it('find: a multi-word concept needs all its words, not one of them', () => {
  const { rows } = T.find(FIND, 'knowledge graph');
  assert.deepStrictEqual(rows.map((r) => r.id), ['graphify']);
  assert.deepStrictEqual(T.find(FIND, 'knowledge spreadsheet').rows, []);
});

it('find: nothing matched is said in words, never an empty print', () => {
  const out = T.renderFind(T.find(FIND, 'kubernetes').rows, 'kubernetes');
  assert.ok(/NOTHING/.test(out), out);
});

it('find: a name match is a whole name part, not a substring (review: "ui" hit guidelines)', () => {
  const rows = T.find([
    { plugin: 'a@b', id: 'web-design-guidelines', description: 'Review pages.' },
    { plugin: 'a@b', id: 'ui-toolkit-web', description: 'Components.' },
    { plugin: 'a@b', id: 'algorithmic-art', description: 'Art.' },
  ], 'ui, go').rows;
  assert.deepStrictEqual(rows.map((r) => r.id), ['ui-toolkit-web']);
});

it('find: a shared-root row is labelled as a file to read, not as listed', () => {
  const out = T.renderFind([{ id: 'x', score: 1, hits: ['x'], namespace: 'shared', path: '/s/x/SKILL.md', description: '' }], 'x');
  assert.ok(/shared root/.test(out) && !/listed/.test(out), out);
});

it('find: concepts split on commas and semicolons, folded, ё to е', () => {
  assert.deepStrictEqual(T.concepts('PDF; Отчёт ,  excel ,,'), ['pdf', 'отчет', 'excel']);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
