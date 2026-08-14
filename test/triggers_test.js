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
  assert.strictEqual(T.render('quick fix for the migration'), '');
  assert.strictEqual(T.render('сделай лендинг как есть'), '');
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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
