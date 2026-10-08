#!/usr/bin/env node
'use strict';
// The routing audit of 2026-10-08, kept as a gate.
//
// The audit typed twelve ordinary tasks at the installed runtime (1.53.0) and six of the
// Russian ones printed no routing line at all — so the `PreToolUse` escalation, which only
// acts on routes the prompt hook recorded, had nothing to act on either. Those twelve, their
// English variants and the boundary controls live in `evals/hook-routing.json`, and this
// suite holds `lib/triggers.js` to them.
//
// Unlike `routing_eval.js` this calls no model: `match()` is deterministic, so the result is
// a verdict rather than a measurement and belongs in `npm test`. `want` is the EXACT route
// set — a case that gains a route it should not have fails as surely as one that loses the
// route it should — and the silence cases are half the file on purpose.
//
// The harness is watched failing, not assumed to: three plants below each remove one thing
// the cases depend on and require the harness to notice. A green suite after a plant that
// changed nothing is the same output as a green suite after a real one (retro #6).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const T = require('../lib/triggers.js');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'evals', 'hook-routing.json'), 'utf8'));
const EXTERNAL = T.externalRoutes(DATA.external);

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

/** Every case that disagrees with the table, as `id: got vs want` lines. */
function disagreements(cases, external) {
  const out = [];
  for (const c of cases) {
    const got = T.match(c.prompt, { external: c.noExternal ? [] : external }).slice().sort();
    const want = c.want.slice().sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      out.push(`${c.id} ${JSON.stringify(c.prompt)}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
  }
  return out;
}

it('the fixture holds the twelve audit tasks and an English variant of each', () => {
  const ru = DATA.cases.filter((c) => /^ru-\d\d$/.test(c.id));
  const en = DATA.cases.filter((c) => /^en-\d\d$/.test(c.id));
  assert.strictEqual(ru.length, 12, `${ru.length} Russian audit tasks`);
  assert.strictEqual(en.length, 12, `${en.length} English variants`);
  const ids = DATA.cases.map((c) => c.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'a duplicate id silently shadows a case');
});

it('silence is asserted, not only routing — over-routing is invisible without it', () => {
  assert.ok(DATA.cases.filter((c) => c.want.length === 0).length >= 6,
    'fewer than six cases expect silence');
});

it('the declared example route parses, and it is the neutral example', () => {
  assert.deepStrictEqual(EXTERNAL.map((r) => r.name), ['example-media']);
  assert.ok(EXTERNAL[0].triggers.length >= 8, 'the example route lost its triggers');
});

it('EVERY AUDIT CASE ROUTES AS DECLARED', () => {
  const bad = disagreements(DATA.cases, EXTERNAL);
  assert.deepStrictEqual(bad, [], `\n  ${bad.join('\n  ')}`);
});

it('every audit task names at least one route — the 6-of-12 finding, closed', () => {
  const silent = DATA.cases.filter((c) => /^(ru|en)-\d\d$/.test(c.id))
    .filter((c) => !T.match(c.prompt, { external: EXTERNAL }).length)
    .map((c) => c.id);
  assert.deepStrictEqual(silent, []);
});

// --- the harness, watched failing ------------------------------------------------

it('PLANT: without the declared route, the media cases fail', () => {
  const bad = disagreements(DATA.cases.filter((c) => c.want.includes('example-media')), []);
  assert.ok(bad.length >= 4, `only ${bad.length} media case(s) noticed the missing route`);
});

it('PLANT: with a subject route removed from the table, its cases fail', () => {
  const saved = T.ROUTES['telegram-dev'];
  delete T.ROUTES['telegram-dev'];
  let bad;
  try {
    bad = disagreements(DATA.cases.filter((c) => c.want.includes('telegram-dev')), EXTERNAL);
  } finally {
    T.ROUTES['telegram-dev'] = saved;
  }
  assert.ok(bad.length >= 3, `only ${bad.length} telegram case(s) noticed the missing route`);
  // restored, or every later suite in this process reads a damaged table
  assert.ok(T.match('add a Telegram bot').includes('telegram-dev'), 'the plant was not restored');
});

it('PLANT: with the chain off, every chained case fails', () => {
  const chained = DATA.cases.filter((c) => c.want.includes('task-pipeline')
    && c.want.some((r) => T.SUBJECT_ROUTES.includes(r)));
  assert.ok(chained.length >= 10, `only ${chained.length} chained cases`);
  const saved = T.SUBJECT_ROUTES.slice();
  T.SUBJECT_ROUTES.length = 0;
  let bad;
  try {
    bad = disagreements(chained, EXTERNAL);
  } finally {
    T.SUBJECT_ROUTES.push(...saved);
  }
  // A chained case whose own words also carry a task-pipeline trigger («почини»,
  // "fix") keeps the route without the chain, so not every case can fail — but the
  // ones that reach the pipeline ONLY through the chain must.
  assert.ok(bad.length >= 8, `only ${bad.length} of ${chained.length} chained cases noticed`);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
