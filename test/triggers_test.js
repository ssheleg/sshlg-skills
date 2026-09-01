#!/usr/bin/env node
'use strict';
// Fixtures for lib/triggers.js — what the UserPromptSubmit hook injects.
//
// The load-bearing one is the first: every trigger this module fires on must be
// a word the corresponding skill's own `description` already advertises. Without
// that check the hook becomes a second, unversioned routing policy that drifts
// from the skills it routes to — and drifts silently, because nothing else reads
// it.
//
// The rest are all about silence. A hook that fires on a question does exactly
// the damage every router's boundary warns about: "Running ten stages for a
// single character is the fastest way to teach an agent to route around it." So
// three different reasons must each produce nothing, and each is asserted
// separately rather than folded into one "no match" case.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const T = require('../lib/triggers.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');

/** `member/skill` → the shipped SKILL.md, or null when the submodule is absent. */
function skillFile(ref) {
  const [member, skill] = ref.split('/');
  const base = path.join(ROOT, 'skills', member, 'plugins');
  if (!fs.existsSync(base)) return null;
  for (const plugin of fs.readdirSync(base)) {
    const p = path.join(base, plugin, 'skills', skill, 'SKILL.md');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** The `description:` value, front matter only — the string a host actually reads.
 *
 * The end anchor is `(?![\s\S])` and not `$`. Under `/m` — which the `^` needs,
 * because `description:` is not the first key — `$` matches at the end of the
 * FIRST LINE, so a folded scalar was cut there: 74 characters of `stripe-billing`
 * instead of 993, and the same for every other skill. The advertisement check
 * below was therefore comparing triggers against one line of fifteen and passing,
 * and `desc.length > 40` never fired because one line clears forty.
 *
 * Found on 2026-08-14 by a route whose triggers were real words from real
 * descriptions and were reported missing. The check was asking a smaller question
 * than it claimed, which is the shape this repository's retro keeps recording.
 */
function description(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm) return '';
  const d = /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
  // Whitespace is collapsed for the same reason `router_texts_test.js` collapses
  // it: a folded scalar is hard-wrapped, so an advertised phrase can land across
  // a line break (`"оплата\n  подпиской"`). Matching the raw string would make the
  // WRAPPING load-bearing and reject a trigger the skill does advertise. A host
  // reads the folded value as one line, which is what this now compares against.
  return (d ? d[1] : '').toLowerCase().replace(/\s+/g, ' ');
}

// --- the derivation proof ---------------------------------------------------

it('every trigger is a word the skill itself advertises', () => {
  const missing = [];
  let checkedRoutes = 0;
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    // A pack-fronted route holds each group of triggers against its OWN skill.
    // Checking them all against one description would either reject real words
    // or force the route to point at a skill it does not mean.
    const groups = spec.sources || [{ skill: spec.skill, triggers: spec.triggers }];
    let sawOne = false;
    for (const group of groups) {
      const file = skillFile(group.skill);
      if (!file) continue; // submodule not materialized — reported below, not passed over
      sawOne = true;
      const desc = description(file);
      assert.ok(desc.length > 200,
        `${group.skill}: description did not parse (${desc.length} chars) — the folded ` +
        `scalar is longer than this, so the regex stopped early`);
      for (const t of group.triggers) {
        if (!desc.includes(t)) missing.push(`${route}: ${JSON.stringify(t)} not in ${group.skill}'s description`);
      }
    }
    if (sawOne) checkedRoutes += 1;
  }
  assert.ok(checkedRoutes > 0,
    'no submodule was materialized, so this check proved nothing — clone with --recursive');
  assert.deepStrictEqual(missing, [],
    `the hook fires on words the skill does not claim:\n  ${missing.join('\n  ')}`);
});

it('a pack-fronted route reaches every skill it fronts', () => {
  // The derivation above makes `spec.skill` the first source's, which is exactly
  // the field that would hide a typo'd skill in sources 2..N behind a valid one.
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    if (!spec.sources) continue;
    for (const group of spec.sources) {
      assert.ok(skillFile(group.skill), `${route}: source names no shipped skill: ${group.skill}`);
    }
    assert.deepStrictEqual(
      spec.triggers, spec.sources.flatMap((s) => s.triggers),
      `${route}: derived triggers do not equal the union of its sources`
    );
  }
});

it('every route names a skill that exists', () => {
  const absent = Object.entries(T.ROUTES)
    .filter(([, s]) => !skillFile(s.skill))
    .map(([r, s]) => `${r} → ${s.skill}`);
  assert.deepStrictEqual(absent, [], `routes pointing at no shipped skill: ${absent.join(', ')}`);
});

// --- silence, for three different reasons ----------------------------------

it('a question emits nothing, even when it carries a trigger word', () => {
  // The dangerous case: "audit" is a real trigger, and this is still a question.
  assert.strictEqual(T.render('почему этот аудит падает?'), '');
  assert.strictEqual(T.render('what does the migration script do?'), '');
  assert.strictEqual(T.render('объясни, как работает интеграция'), '');
});

it('a refusal phrase silences the hook completely', () => {
  assert.strictEqual(T.render('добавь фичу, без пайплайна'), '');
  assert.strictEqual(T.render('no pipeline, just fix the migration'), '');
  assert.strictEqual(T.render('сделай лендинг как есть'), '');
});

// THE MISSING DIRECTION. Two fixtures above assert that no refusal is also a
// trigger; until 2026-09-01 nothing asserted the converse — that ordinary work
// language is not read as a refusal. It was not a hypothetical: `optedOut` is
// one boolean for all twelve routers, sticky for the session and silent, and
// `quick` and `as is` fired on six of the thirteen prompts below, so the most
// natural sentence in software English switched the whole enforcement layer off
// with nothing printed.
//
// Two entries are deliberately here and deliberately NOT asserted silent-free:
// `draft it` and `no docs` still over-fire on the last two lines, measured and
// left, because one hit apiece on a corpus written by the person proposing the
// change is the shape of the corpus rather than evidence. The board carries the
// number; this fixture carries the ones that were.
it('ORDINARY WORK LANGUAGE IS NOT A REFUSAL — the invariant that ran one way', () => {
  const ordinary = [
    'as the migration is risky, refactor the payment module first',
    'a quick win: add the paywall screen',
    'quickly add sentry to the backend',
    'the quick brown fox jumps over the lazy dog',
    'refactor it as the code is unreadable',
    'as long as it is fast, build the onboarding flow',
    'a quick question about the paywall, then design the hero',
    'this is quicker than the migration, wire up stripe',
    // The four that survived v1.15.0 with one hit apiece and were LEFT then, because
    // one hit each on a corpus written by the person proposing the change is the shape
    // of the corpus rather than evidence. v1.26.0 closes them by MECHANISM instead: a
    // refusal must be the sentence's own act, which is checkable in both directions.
    'draft it into the landing page and then design the hero',
    'there are no docs for this SDK, read the source and add the stripe webhook',
    'передай текст как есть в лендинг и свёрстай его',
    'на словах это просто: сделай миграцию базы',
  ];
  const refused = ordinary.filter((p) => T.optedOut(p));
  assert.deepStrictEqual(refused, [],
    'ordinary work language read as a refusal — that silences ALL twelve routers '
    + 'for the rest of the session, and prints nothing');
});

it('no trigger at all emits nothing', () => {
  assert.strictEqual(T.render('привет'), '');
  assert.strictEqual(T.render('ls -la'), '');
  assert.strictEqual(T.render(''), '');
  assert.strictEqual(T.render(null), '');
  assert.strictEqual(T.render(undefined), '');
});

// --- and it does fire when it should --------------------------------------

it('a repository change routes to task-pipeline', () => {
  const out = T.render('добавь оплату картой в чекаут — новая фича');
  assert.ok(out.includes('/task-pipeline'), `no pipeline route in: ${out}`);
  assert.ok(out.includes('stages 2–4'),
    'the note must say WHERE planning lives, or it forbids without redirecting');
});

it('one prompt can ask for several routes, in registry order', () => {
  const routes = T.match('рефактор лендинга и его дизайн-токены');
  assert.ok(routes.includes('task-pipeline'), `expected pipeline in ${routes}`);
  assert.ok(routes.includes('sheleg-design'), `expected design in ${routes}`);
  assert.deepStrictEqual(routes, Object.keys(T.ROUTES).filter((r) => routes.includes(r)),
    'routes came back out of registry order');
});

it('matching is case-insensitive', () => {
  assert.deepStrictEqual(T.match('REFACTOR the auth module'), T.match('refactor the auth module'));
});

it('the injected note points at the block rather than quoting it', () => {
  const out = T.render('внедрить новую интеграцию');
  assert.ok(/routing block/i.test(out), 'the note does not point at the block');
  assert.ok(!out.includes('SSHLG:ROUTER'),
    'the note carries block sentinels — it is copying the single home, not citing it');
  assert.ok(!/Refusal phrase:/.test(out),
    'the note restates router bodies; the block is their one home');
});

// --- the session note is a pointer, and its size is the whole point --------

it('the session note stays a pointer, not a second copy of the doctrine', () => {
  const note = T.sessionNote();
  assert.ok(/routing block/i.test(note), 'the session note does not point at the block');
  assert.ok(!note.includes('SSHLG:ROUTER'), 'the session note copies block sentinels');
  // Superpowers' equivalent measured 854 tokens. A hard character ceiling is a
  // proxy a fixture can enforce offline; the token audit carries the real number.
  assert.ok(note.length < 600,
    `the session note is ${note.length} chars — it is becoming the thing this family removed`);
});

it('the session note names the pipeline and where planning lives', () => {
  const note = T.sessionNote();
  assert.ok(note.includes('/task-pipeline'), 'the session note names no route');
  assert.ok(note.includes('stages 2–4'),
    'without this the note forbids a separate planning cycle without saying where planning went');
});

// --- the classifiers are separable, and each one actually decides ----------

it('isQuestion and optedOut each distinguish their inputs', () => {
  assert.strictEqual(T.isQuestion('почему падает?'), true);
  assert.strictEqual(T.isQuestion('починить падение'), false);
  assert.strictEqual(T.optedOut('без пайплайна'), true);
  assert.strictEqual(T.optedOut('с пайплайном'), false);
});

it('no refusal phrase is also a trigger, or saying it would fire the hook', () => {
  const clash = [];
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    for (const t of spec.triggers) {
      for (const r of T.REFUSALS) {
        if (r.includes(t) || t.includes(r)) {
          clash.push(`${route}: trigger ${JSON.stringify(t)} overlaps refusal ${JSON.stringify(r)}`);
        }
      }
    }
  }
  assert.deepStrictEqual(clash, [], `a refusal phrase that trips a trigger cannot opt out: ${clash.join(', ')}`);
});

it('no trigger MATCHES inside a refusal — the raw check above cannot see a stem', () => {
  // The raw-containment check passed «без интеграций» while the matcher fired
  // `интеграция` inside it: `интеграций` is one inflection away, which is exactly
  // the tolerance `matches` exists to provide. A refusal the matcher reads as a
  // trigger is the B-82 shape — the phrase can never be added, and if it were,
  // the advertised opt-out would summon the route it declines. Checked the way
  // the runtime checks, so a stem-level collision fails here before it ships.
  const clash = [];
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    for (const t of spec.triggers) {
      for (const r of T.REFUSALS) {
        if (T.matches(r, t)) {
          clash.push(`${route}: trigger ${JSON.stringify(t)} fires inside refusal ${JSON.stringify(r)}`);
        }
      }
    }
  }
  assert.deepStrictEqual(clash, [], `the matcher reads a refusal as a trigger: ${clash.join(', ')}`);
  // The pair this check exists for, kept as the executable record of why
  // sheleg-dev's refusal is «без обвязки» and not «без интеграций»:
  assert.strictEqual(T.matches('без интеграций', 'интеграция'), true,
    'the stem-level collision this guard was written against no longer reproduces — re-derive the rename');
});

it('every refusal the routing block advertises is one this module parses', () => {
  // XF-01/XF-04, 2026-08-29: eleven English aliases and both telegram forms were
  // advertised by the block and absent here — `optedOut('no brand')` → false while
  // the operator's file said the phrase would work. The registry is the single
  // home of the router texts, so the list is READ from their own refusal lines
  // rather than restated; a router gaining a phrase without teaching the matcher
  // fails this fixture in the same change.
  const registry = require('../lib/routers-registry.js').REGISTRY;
  const missing = [];
  let declared = 0;
  for (const [name, entry] of Object.entries(registry)) {
    const m = /\*\*Refusal phrase:([^*]+)\*\*/.exec(entry.text);
    assert.ok(m, `${name}: no refusal declaration found`);
    const phrases = [
      ...[...m[1].matchAll(/"([^"]+)"/g)].map((q) => q[1]),
      ...[...m[1].matchAll(/«([^»]+)»/g)].map((q) => q[1]),
    ].map((p) => p.toLowerCase());
    assert.ok(phrases.length >= 2, `${name}: fewer than two phrases declared`);
    for (const p of phrases) {
      declared += 1;
      if (!T.REFUSALS.includes(p)) missing.push(`${name}: ${JSON.stringify(p)}`);
    }
  }
  assert.ok(declared >= 24, `only ${declared} advertised phrases were read — the parse stopped early`);
  assert.deepStrictEqual(missing, [],
    `the block advertises refusals the hook does not honour:\n  ${missing.join('\n  ')}`);
  // The one refusal no router entry owns — the toolkit protocol's — read from the
  // rendered block the same way an operator receives it.
  const R = require('../lib/routers.js');
  const members = require('../skills.json').skills;
  const empty = '<!-- SSHLG:ROUTERS:BEGIN v=1 -->\n## Роутинг работы — семья ssheleg\n'
    + '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->\n<!-- SSHLG:ROUTERS:TABLE:END -->\n'
    + '<!-- SSHLG:ROUTERS:END -->';
  const block = R.upsert(empty, { 'task-pipeline': 'body' }, { members }).text;
  const proto = /PROTOCOL:BEGIN -->([\s\S]*?)<!-- SSHLG:ROUTERS:PROTOCOL:END/.exec(block);
  assert.ok(proto, 'the rendered block carries no protocol region');
  const pm = /\*\*Refusal phrase:([^*]+)\*\*/.exec(proto[1]);
  assert.ok(pm, 'the protocol region declares no refusal');
  for (const p of [
    ...[...pm[1].matchAll(/"([^"]+)"/g)].map((q) => q[1]),
    ...[...pm[1].matchAll(/«([^»]+)»/g)].map((q) => q[1]),
  ].map((s) => s.toLowerCase())) {
    assert.ok(T.REFUSALS.includes(p), `the protocol's refusal ${JSON.stringify(p)} is not honoured`);
  }
});

it('the advertised English aliases actually opt out — the XF-04 regression', () => {
  // Measured 2026-08-29 before the fix: optedOut('no brand') → false, and
  // 'rewrite this, no brand' routed to task-pipeline AND copywriting — the block
  // advertised an opt-out that summoned both routes instead.
  assert.strictEqual(T.optedOut('rewrite this, no brand'), true);
  assert.deepStrictEqual(T.match('rewrite this, no brand'), []);
  assert.deepStrictEqual(T.match('add a paywall screen, no scenarios'), []);
  assert.deepStrictEqual(T.match('build a landing page, no design'), []);
  assert.deepStrictEqual(T.match('сделай телеграм бот, но без телеграма — только апи'), []);
  assert.deepStrictEqual(T.match('refactor the auth module, no docs'), []);
});

it('sheleg-dev declines as «без обвязки»/"no wiring" — the XF-01 regression', () => {
  // Before the rename the block advertised «без интеграций», which the matcher
  // reads as task-pipeline's `интеграция`: «оплата подпиской, но без интеграций»
  // → ["task-pipeline","sheleg-dev"], optedOut false (measured 2026-08-29). The
  // renamed phrase is sayable in both languages:
  assert.strictEqual(T.optedOut('оплата подпиской, но без обвязки'), true);
  assert.deepStrictEqual(T.match('оплата подпиской, но без обвязки'), []);
  assert.strictEqual(T.optedOut('stripe checkout, but no wiring'), true);
  assert.deepStrictEqual(T.match('stripe checkout, but no wiring'), []);
  // And the OLD phrase is deliberately not a refusal: it still routes, because a
  // phrase the matcher reads as a trigger cannot be allowed to opt out — see the
  // match-level clash check above. The block no longer advertises it.
  assert.strictEqual(T.optedOut('оплата подпиской, но без интеграций'), false);
});

// --- inflection: the corpus that made the case ------------------------------
//
// Twenty prompts written the way an operator writes them, not the way a skill's
// description is written. Substring matching scored 11 on 2026-08-12, and the two
// it still misses are honest: neither `исправь` nor a bare `fix` is a word any of
// these skills advertises, so routing on them would be inventing policy here.

const CORPUS = [
  'сделай фичу в репозитории', 'нужен рефакторинг лендинга', 'почини баг в билде',
  'добавь интеграцию со stripe', 'запусти миграцию базы', 'давай новую фичу',
  'сделай рефактор этого модуля', 'нужна миграция схемы', 'проведи аудит репозитория',
  'добавь фикс и залей', 'опубликуй скилл в маркетплейс', 'заверни это в плагин',
  'нарисуй мокап экрана', 'сделай дизайн-токены', 'add a feature to the launcher',
  'refactor this module', 'run a migration', 'integrate stripe billing',
  'исправь ошибку в апи', 'fix the failing test',
];

it('the inflection corpus scores at least 18 of 20', () => {
  const hits = CORPUS.filter((c) => T.match(c).length);
  assert.ok(hits.length >= 18,
    `${hits.length}/20 — misses: ${CORPUS.filter((c) => !T.match(c).length).join(' | ')}`);
});

it('the accusative is the ordinary case, and it used to be lost entirely', () => {
  for (const [prompt, route] of [
    ['сделай фичу', 'task-pipeline'], ['запусти миграцию', 'task-pipeline'],
    ['добавь интеграцию', 'task-pipeline'], ['почини баг', 'task-pipeline'],
  ]) {
    assert.ok(T.match(prompt).includes(route), `${JSON.stringify(prompt)} routed nowhere`);
  }
});

it('a phrase tolerates words between its own — «заверни ЭТО в плагин»', () => {
  assert.ok(T.match('заверни это в плагин').includes('make-skill'));
  assert.ok(T.match('заверни в плагин').includes('make-skill'));
});

it('the word must END — `аудит` does not fire on `аудитория`', () => {
  // The precision budget of the whole scheme. Without the closing boundary a
  // routing note appears on the word "auditorium", and the line stops being read.
  assert.deepStrictEqual(T.match('аудитория лендинга выросла'), []);
  assert.deepStrictEqual(T.match('the auditorium seats 400'), []);
});

it('a refusal still wins when it is inflected too', () => {
  assert.strictEqual(T.render('сделай фичу без пайплайна'), '');
  assert.strictEqual(T.render('рефактор, но без пайплайна'), '');
});

it('a question with an inflected trigger is still a question', () => {
  assert.strictEqual(T.render('почему упала миграцию накатывающая джоба?'), '');
  assert.strictEqual(T.render('объясни эту интеграцию'), '');
});

it('the stemmers cut what inflects and leave what does not', () => {
  assert.strictEqual(T.stemRu('фича').stem, 'фич');
  assert.strictEqual(T.stemRu('починить').stem, 'почини');
  assert.strictEqual(T.stemRu('аудит').stem, 'аудит', 'a consonant-final noun must not be cut');
  assert.strictEqual(T.stemRu('ux').stem, 'ux', 'a short word must survive intact');
  assert.strictEqual(T.stemLat('integration').stem, 'integrat');
  assert.strictEqual(T.stemLat('audit').stem, 'audit');
});

it('a word can always still match itself, whatever was cut from it', () => {
  // The allowance has to be at least what the stemmer removed, or a trigger
  // stops matching the very form it is written in.
  for (const [, spec] of Object.entries(T.ROUTES)) {
    for (const t of spec.triggers) {
      assert.ok(T.matches(t, t), `trigger ${JSON.stringify(t)} no longer matches itself`);
    }
  }
});

// --- a hyphen inside a trigger is a separator, not a letter (B-84) -----------
//
// `agent-interop` advertises `MCP-сервер`, so the route carried the word and
// `подключи mcp сервер` still reached nothing: splitting a trigger on whitespace
// alone made the hyphen load-bearing. The `gap` between words had always accepted
// hyphens, which is why only one half of the seam was ever exercised.

it('a hyphenated trigger matches both spellings, and so does a hyphenated prompt', () => {
  assert.deepStrictEqual(T.match('подключи mcp сервер'), ['agent-stack']);
  assert.deepStrictEqual(T.match('подключи mcp-сервер'), ['agent-stack']);
  assert.deepStrictEqual(T.match('нужен суб агент'), ['agent-stack']);
  assert.deepStrictEqual(T.match('нужен суб-агент'), ['agent-stack']);
});

it('a refusal survives the same split, in both spellings', () => {
  // «без make-skill» is the refusal whose own trigger-shaped name made this
  // worth asserting: if the split broke it, saying the phrase would stop
  // declining the route it names.
  assert.strictEqual(T.optedOut('без make-skill'), true);
  assert.strictEqual(T.optedOut('без make skill'), true);
  assert.deepStrictEqual(T.match('сделай скилл, без make-skill'), []);
});

it('splitting on the hyphen did not loosen anything into a neighbouring word', () => {
  // The precision controls from the `аудит`/`аудитория` case, re-run against the
  // split: a trigger's words must still each END where a word ends.
  assert.deepStrictEqual(T.match('аудитория лендинга выросла'), []);
  assert.deepStrictEqual(T.match('субагентство недвижимости'), []);
  assert.deepStrictEqual(T.match('mcpserverless'), []);
});

// --- the four routers that were unreachable ---------------------------------

it('every router in the block can be named by this table', () => {
  // Until v0.43.0 the block carried eight routers and this table held four, so
  // "the agent picks the right skill itself" was structurally impossible for half
  // the family — no trigger, no name, no route.
  const registry = require('../lib/routers-registry.js').REGISTRY;
  const missing = Object.keys(registry).filter((r) => !(r in T.ROUTES));
  assert.deepStrictEqual(missing, [],
    `routers the prompt hook can never name: ${missing.join(', ')}`);
});

it('the four added routes each fire on their own words', () => {
  for (const [prompt, route] of [
    ['напиши текст для лендинга', 'copywriting'],
    ['сделай seo-аудит сайта', 'seo-llmo'],
    ['запиши решение в decision record', 'evidence-docs'],
    ['возьми задачу B-16', 'agent-sync'],
  ]) {
    assert.ok(T.match(prompt).includes(route), `${JSON.stringify(prompt)} did not route to ${route}`);
  }
});

// --- the pack's seventh skill, routable at last (XF-02) ----------------------

it('error tracking routes to sheleg-dev — the map-table-only gap, again', () => {
  // The B-81 shape recurring on one skill: `error-tracking` sat in the map table
  // with no router clause, no WHEN word and no hook source. Measured 2026-08-29:
  // both prompts below reached []. Zero description edits — every trigger is in
  // the skill's own advertised `Triggers -` list.
  assert.ok(T.match('add sentry to the api service').includes('sheleg-dev'));
  assert.ok(T.match('подключи sentry в бэкенд').includes('sheleg-dev'));
  assert.ok(T.match('настрой трекинг ошибок').includes('sheleg-dev'));
  assert.ok(T.match('set up error tracking for the worker').includes('sheleg-dev'));
});

it('and the sentry word stays out of questions and refusals', () => {
  assert.deepStrictEqual(T.match('почему sentry ничего не ловит?'), [],
    'a question carrying the trigger must stay a question');
  assert.deepStrictEqual(T.match('добавь sentry, но без обвязки'), []);
});

// --- the ReAct homograph is out (XF-05) --------------------------------------

it('the ReAct phrase forms route to agent-stack; the bare word still does not', () => {
  // agent-stack v0.17.0 advertises "ReAct loop" / "react pattern" (its
  // SKILL.md:11) — the phrase is unambiguous where the bare homograph was not.
  assert.deepStrictEqual(T.match('the agent needs a react loop with a checker'), ['agent-stack']);
  assert.deepStrictEqual(T.match('поставь агенту react pattern'), ['agent-stack']);
});

it('the bare `react` no longer routes a frontend prompt to agent-stack', () => {
  // Measured 2026-08-29 before the fix: «сделай форму логина на react» →
  // ["agent-stack"] — the trigger meant ReAct, the operator meant the framework,
  // and a lowercasing matcher cannot tell them apart. The word is removed; the
  // phrase forms wait on agent-harness advertising one (agent-stack's release).
  assert.deepStrictEqual(T.match('сделай форму логина на react'), []);
  assert.deepStrictEqual(T.match('rewrite the dashboard in react'), ['task-pipeline'],
    'the pipeline half of this prompt is real (`rewrite`); agent-stack must not join it');
  // The route is still reachable by the vocabulary it honestly owns:
  assert.ok(T.match('выбери workflow or agent для этой задачи').includes('agent-stack'));
});

// --- the question exception, and how narrow it is ---------------------------

it('a trigger phrased as a question still fires — the skill claimed those words', () => {
  // `seo-aeo-audit` advertises «почему упал трафик» and «почему нет позиций».
  // The generic question filter silenced it on exactly the phrasings it owns.
  assert.deepStrictEqual(T.match('почему упал трафик'), ['seo-llmo']);
  assert.deepStrictEqual(T.match('почему нет позиций'), ['seo-llmo']);
});

it('and a plain question still wins over a plain trigger', () => {
  // The exception must not become "questions route now". These carry real
  // triggers (`аудит`, `интеграция`, `миграция`) in a question, and stay silent.
  assert.deepStrictEqual(T.match('почему этот аудит падает?'), []);
  assert.deepStrictEqual(T.match('объясни, как работает интеграция'), []);
  assert.deepStrictEqual(T.match('что делает эта миграция'), []);
});

it('a refusal beats the question exception too', () => {
  assert.deepStrictEqual(T.match('почему упал трафик, без seo'), []);
});

// THE OTHER HALF, AND IT IS THE HALF THAT MAKES THE RULE SHIPPABLE.
//
// A rule that removes false positives by silencing genuine refusals is worse than the
// one it replaces. The first formulation of this rule did exactly that: it required
// punctuation on BOTH sides and missed «сделай лендинг как есть» and «объясни на
// словах», because Russian puts the phrase at the end without a comma. Measured, not
// reasoned — which is why the trailing case exists at all.
//
// Both corpora here are SELF-WRITTEN, which is the same weakness that held the four
// phrases back before. The defence is not a better corpus but a two-sided one: this
// fixture fails if the rule ever silences a refusal an operator actually said.
it('EVERY GENUINE REFUSAL IS STILL HEARD — the direction that makes the rule safe', () => {
  const declined = [
    // The one an earlier formulation of this rule missed: a connective sits between the
    // comma and the phrase, so requiring punctuation immediately before it silenced a
    // refusal the operator said out loud. Caught by the XF-04 fixture, not by reasoning.
    'сделай телеграм бот, но без телеграма — только апи',
    'rewrite this, no brand',
    'add a paywall screen, no scenarios',
    'добавь фичу, без пайплайна',
    'без пайплайна',
    'wire up stripe, no design',
    'no design',
    'write the landing copy, draft it',
    'draft it',
    'refactor the auth module, no docs',
    'no docs',
    'сделай лендинг как есть',      // trailing, no comma — the Russian idiom
    'как есть',
    'объясни на словах',            // trailing again
    'no pipeline, just fix the migration',
    'just fix it, no pipeline',
  ];
  const missed = declined.filter((p) => !T.optedOut(p));
  assert.deepStrictEqual(missed, [],
    'a refusal the operator said out loud was not heard — that costs them a route they '
    + 'declined, which is worse than the over-firing this rule exists to stop');
});

it('the refusal rule did not narrow ordinary routing', () => {
  // `matches()` stays tolerant for TRIGGERS on purpose — only refusals got stricter.
  assert.deepStrictEqual(T.match('build an onboarding flow'), ['super-ux']);
  assert.deepStrictEqual(T.match('подключи stripe и сделай миграцию').sort(),
    ['sheleg-dev', 'task-pipeline']);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
