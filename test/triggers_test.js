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


/** A routed skill's description, read the way the validator reads it. */
function descriptionOf(ref) {
  const [member, name] = ref.split('/');
  const base = path.join(__dirname, '..', 'skills', member, 'plugins');
  if (!fs.existsSync(base)) return null;
  for (const plugin of fs.readdirSync(base)) {
    const file = path.join(base, plugin, 'skills', name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const front = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(file, 'utf8'));
    if (!front) return null;
    // `$` under /m is end of LINE and would measure a multi-line description as its
    // first line — B-63's defect, reproduced once in this repository on 2026-09-05.
    const d = /^description:\s*(?:[>|]-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m
      .exec(front[1]);
    return d ? d[1].replace(/\s+/g, ' ').trim() : null;
  }
  return null;
}

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
  const stale = [];
  let checkedRoutes = 0;
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    // A pack-fronted route holds each group of triggers against its OWN skill.
    // Checking them all against one description would either reject real words
    // or force the route to point at a skill it does not mean.
    const groups = spec.sources
      || [{ skill: spec.skill, triggers: spec.triggers, objects: spec.objects || [] }];
    let sawOne = false;
    for (const group of groups) {
      const file = skillFile(group.skill);
      if (!file) continue; // submodule not materialized — reported below, not passed over
      sawOne = true;
      const desc = description(file);
      // 2026-10-20 (context diet): descriptions became routers of about 400 characters and
      // the trigger lists moved into each SKILL.md body under "Triggers". The hook's words
      // must still be the skill's own words, so they are looked for in the whole file.
      const advertised = fs.readFileSync(file, 'utf8').toLowerCase().replace(/\s+/g, ' ');
      assert.ok(desc.length > 200,
        `${group.skill}: description did not parse (${desc.length} chars) — the folded ` +
        `scalar is longer than this, so the regex stopped early`);
      // An OBJECT is a trigger that needs a verb in front of it; it is still a word the
      // hook fires on, so it is held to the same advertisement rule.
      for (const t of (group.triggers || []).concat(group.objects || [])) {
        const pending = T.PENDING[t];
        if (advertised.includes(t)) {
          // The member advertised it: the excuse has done its job and must go, or it
          // would excuse the NEXT removal of this word silently.
          if (pending && pending.skill === group.skill) stale.push(`${t} (${group.skill})`);
          continue;
        }
        if (pending && pending.skill === group.skill) continue;
        missing.push(`${route}: ${JSON.stringify(t)} not in ${group.skill}'s SKILL.md`);
      }
    }
    if (sawOne) checkedRoutes += 1;
  }
  assert.ok(checkedRoutes > 0,
    'no submodule was materialized, so this check proved nothing — clone with --recursive');
  assert.deepStrictEqual(missing, [],
    `the hook fires on words the skill does not claim:\n  ${missing.join('\n  ')}`);
  assert.deepStrictEqual(stale, [],
    `PENDING excuses whose member now advertises the word — delete them from lib/triggers.js:\n  ${stale.join('\n  ')}`);
});

it('a PENDING excuse names its skill, the member change it waits on, and a real trigger', () => {
  // The excuse is the EXCUSED mechanism of the completeness check below, applied to the
  // soundness check above: an entry is a word the member is being asked to advertise in a
  // parallel member change, never a bare count, and it must be a word the table uses.
  const used = new Set();
  for (const spec of Object.values(T.ROUTES)) {
    for (const g of spec.sources || [{ triggers: spec.triggers, objects: spec.objects || [] }]) {
      for (const t of (g.triggers || []).concat(g.objects || [])) used.add(t);
    }
  }
  const entries = Object.entries(T.PENDING);
  assert.ok(entries.length <= 4, `${entries.length} pending words — prefer words the descriptions already carry`);
  for (const [word, p] of entries) {
    assert.ok(used.has(word), `${word} is excused but no route fires on it`);
    assert.ok(skillFile(p.skill), `${word}: ${p.skill} is not a shipped skill`);
    assert.ok(p.waits && p.waits.length > 30 && p.waits.includes(p.skill.split('/')[0]),
      `${word}: the excuse does not name the member change it waits on`);
  }
});

it('a trigger carrying ё routes identically without it, which is how it is typed', () => {
  // Russian is normally typed WITHOUT ё. Measured 2026-09-03 before the fold:
  // `звезды телеграм` reached nothing while `звёзды телеграм` reached telegram-dev,
  // and the same for `отчет о приемке` against evidence-docs. Two routers were
  // unreachable for the standard spelling of their own advertised triggers.
  const withYo = [];
  for (const spec of Object.values(T.ROUTES)) {
    const groups = spec.sources || [{ triggers: spec.triggers }];
    for (const g of groups) for (const t of g.triggers || []) if (t.includes('ё')) withYo.push(t);
  }
  assert.ok(withYo.length > 0, 'no trigger carries ё — this fixture is asserting nothing');
  const broken = withYo.filter((t) => {
    const a = JSON.stringify(T.match(t));
    const b = JSON.stringify(T.match(t.replace(/ё/g, 'е')));
    return a !== b;
  });
  assert.deepStrictEqual(broken, [],
    `these triggers only match when ё is typed:\n  ${broken.join('\n  ')}`);
});

it('folding ё does not make two different triggers collide', () => {
  // The precision the fold spends. Russian has real pairs — всё/все, нёбо/небо — so a
  // trigger whose е-form is a different word would over-match. Nothing in the shipped
  // table does today; this is what notices when one arrives.
  const seen = new Map();
  const collisions = [];
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    const groups = spec.sources || [{ triggers: spec.triggers }];
    for (const g of groups) for (const t of g.triggers || []) {
      const folded = t.toLowerCase().replace(/ё/g, 'е');
      const prev = seen.get(folded);
      if (prev && prev.raw !== t) collisions.push(`${prev.route}:${prev.raw} vs ${route}:${t}`);
      else if (!prev) seen.set(folded, { route, raw: t });
    }
  }
  assert.deepStrictEqual(collisions, [],
    `two triggers become the same word once ё is folded:\n  ${collisions.join('\n  ')}`);
});

it('a pack-fronted route reaches every skill it fronts', () => {
  // The derivation above makes `spec.skill` the first source's, which is exactly
  // the field that would hide a typo'd skill in sources 2..N behind a valid one.
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    if (!spec.sources) continue;
    // `fabric` declares `foreign: true` — its sources ship in the
    // fabric-agent-adapter plugin, outside this manifest, so no checkout of
    // THIS repository can hold their SKILL.md files. Declared on the route,
    // like PENDING, so every consumer reads the same exception.
    if (spec.foreign) continue;
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
    // The one declared exception, and why: `fabric` fronts the
    // fabric-agent-adapter plugin's skills, which are not family members and
    // are never materialized under `skills/`. Their descriptions are the
    // advertisement of record on the machine that has them; this fixture can
    // only check routes whose skills this repository ships.
    .filter(([, s]) => !s.foreign && !skillFile(s.skill))
    .map(([r, s]) => `${r} → ${s.skill}`);
  assert.deepStrictEqual(absent, [], `routes pointing at no shipped skill: ${absent.join(', ')}`);
});

it('release iteration requests reach task-pipeline in both languages', () => {
  for (const prompt of ['release iteration', 'итерация релиза',
      'start a release iteration', 'запусти итерацию релиза']) {
    assert.ok(T.match(prompt).includes('task-pipeline'), prompt);
  }
});

it('release iteration questions and opt-outs retain silence', () => {
  for (const prompt of ['what is a release iteration?', 'что такое итерация релиза?',
      'release iteration, no pipeline', 'итерация релиза, без пайплайна']) {
    assert.strictEqual(T.render(prompt), '', prompt);
  }
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
// one boolean for all fifteen routers, sticky for the session and silent, and
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
    'ordinary work language read as a refusal — that silences ALL fifteen routers '
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
  assert.ok(/refusal phrase/i.test(out), 'the note no longer says how a route is declined');
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

// Claude Code fires `UserPromptSubmit` for system-generated turns too. On
// 2026-09-06 every background-agent notification in one session was "routed"
// because its body mentioned member names — and a notification QUOTING a
// refusal phrase would have silenced the session with nobody having said it.
it('a system-generated turn neither routes nor spends the session opt-out', () => {
  const note = '[SYSTEM NOTIFICATION - NOT USER INPUT]\n'
    + 'Agent finished: wired the stripe checkout flow, сделай лендинг next.';
  // The content genuinely routes — remove the marker and the routes appear —
  // so the silence below is the guard's, not an accident of the wording.
  assert.ok(T.match(note.replace('[SYSTEM NOTIFICATION - NOT USER INPUT]\n', '')).length > 0,
    'the fixture text stopped carrying any trigger, so the case proves nothing');
  assert.deepStrictEqual(T.match(note), [], 'a task notification was routed as if a person asked');
  assert.strictEqual(T.render(note), '', 'the hook would print routes for a system turn');
  const quoted = '<task-notification>the run logged «без пайплайна» and exited 0</task-notification>';
  assert.strictEqual(T.optedOut(quoted), false,
    'a notification quoting a refusal phrase silenced the whole session');
  assert.strictEqual(T.isSystemTurn('сделай лендинг'), false, 'an ordinary prompt read as a system turn');
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
  // «подключи» writes, so the chain names delivery beside the subject (REQ-03, 2026-10-08)
  assert.deepStrictEqual(T.match('подключи mcp сервер'), ['task-pipeline', 'agent-stack']);
  assert.deepStrictEqual(T.match('подключи mcp-сервер'), ['task-pipeline', 'agent-stack']);
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

it('fabric fires on its compounds and stays silent on the boundary', () => {
  // The memberless router's hook half: the network's name in a compound and the
  // agent-service shape name the route — on a machine where Fabric is installed
  // (B-169), which this test states rather than inherits from the runner.
  const fabricHere = require('../lib/machine.js').probe({ env: { FABRIC_SERVICES_DIR: require('os').tmpdir() } });
  for (const prompt of [
    'open the fabric service dashboard',
    'port already taken by an agent service',
    'local agent services on this machine',
    'add the well-known endpoint for fabric-service/0.1',
    'сделай агента совместимым с fabric',
    'подключить проект к fabric',
    'новый агент под fabric',
  ]) {
    assert.ok(T.match(prompt, { machine: fabricHere }).includes('fabric'), `${JSON.stringify(prompt)} did not route to fabric`);
  }
  // The org's own working rules are not Fabric's: B-169 took them out of this route.
  assert.ok(!T.match('work on a PassionCode repo', { machine: fabricHere }).includes('fabric'));
  // …and the boundary the router text draws holds here too: generic services
  // are not Fabric, and a brand-new agent with no contract named is ordinary
  // dev work. «что запущено» is a question no fabric skill advertises, so the
  // hook says nothing and the block carries the rule.
  assert.deepStrictEqual(T.match('restart the nginx service'), []);
  assert.deepStrictEqual(T.match('подними сервисы в докере'), []);
  assert.deepStrictEqual(T.match('что запущено на этой машине'), []);
  // The refusal is sayable: it declines the route it names.
  assert.strictEqual(T.optedOut('open the fabric dashboard, no fabric'), true);
  assert.deepStrictEqual(T.match('подключить проект к fabric, но без фабрики'), []);
});

it('B-169: without Fabric on the machine the fabric route stays silent', () => {
  const machine = require('../lib/machine.js');
  const absent = machine.probe({ env: { FABRIC_SERVICES_DIR: '/nonexistent/fabric-services' } });
  assert.ok(!T.match('open the fabric service dashboard', { machine: absent }).includes('fabric'));
  assert.ok(!T.match('подключить проект к fabric', { machine: absent }).includes('fabric'));
  // The per-OS default is what the router text names.
  const at = (platform, env) => machine.fabricServicesDir({ platform, env, home: '/h' });
  assert.strictEqual(at('darwin', {}), '/h/Library/Application Support/ai.passioncode.fabric/services');
  assert.strictEqual(at('linux', {}), '/h/.local/share/passioncode-fabric/services');
  assert.strictEqual(at('linux', { XDG_DATA_HOME: '/x' }), '/x/passioncode-fabric/services');
  assert.strictEqual(at('win32', { LOCALAPPDATA: 'C:\\L' }), 'C:\\L\\passioncode-fabric\\services');
  assert.strictEqual(at('darwin', { FABRIC_SERVICES_DIR: '/d' }), '/d');
  assert.strictEqual(machine.holds('no-such-predicate', absent), false, 'an unknown predicate never holds');
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
  // "build" writes, so the chain adds delivery (REQ-03); the refusal rule narrowed nothing
  assert.deepStrictEqual(T.match('build an onboarding flow'), ['task-pipeline', 'super-ux']);
  assert.deepStrictEqual(T.match('подключи stripe и сделай миграцию').sort(),
    ['sheleg-dev', 'task-pipeline']);
});

it('a Russian verbal prefix does not hide an advertised stem', () => {
  // The suffix side of a trigger has always been tolerant; the prefix side ended the
  // match before the stem was reached, so «рефактор модуля» routed and «отрефактори
  // модуль» did not — one word, two answers. Measured across the shipped table before
  // the fix: not one prefixed form of any single-word Cyrillic trigger reached its own
  // route. `B-84` recorded this class as settled and it was not.
  // `оплата` is sheleg-dev's since 2026-10-08, so the payment module names the pack too
  assert.deepStrictEqual(T.match('отрефактори модуль оплаты'), ['task-pipeline', 'sheleg-dev']);
  assert.deepStrictEqual(T.match('зарефакторь этот класс'), ['task-pipeline']);
  assert.deepStrictEqual(T.match('перепроверь прод'), ['task-pipeline']);
  // and the bare stem still matches itself, which every earlier change to this
  // matcher has had to prove separately
  assert.deepStrictEqual(T.match('рефактор модуля'), ['task-pipeline']);
});

it('the prefix rule stops at five letters, and that is what keeps it honest', () => {
  // `фикс` is four letters. Without the floor, `за` + `фикс` would route «зафиксируй
  // результат» to the delivery pipeline — recording a result and fixing a defect are
  // different acts wearing the same shape. The floor is the whole reason the rule can
  // be tolerant at all.
  assert.deepStrictEqual(T.match('зафиксируй результат'), []);
  assert.deepStrictEqual(T.match('записал в блокнот'), []);
  // The bare stem is untouched by the floor: it never needed the prefix.
  assert.ok(T.match('фикс в проде').includes('task-pipeline'));
});

it('no single-letter prefix, because one letter reaches the middles of words', () => {
  // Declared, never derived — and the list is asserted rather than described, so a
  // later edit that adds `с` or `в` fails here instead of in a session six weeks on.
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'triggers.js'), 'utf8');
  const m = /const RU_PREFIX = '([^']+)'/.exec(src);
  assert.ok(m, 'RU_PREFIX is gone');
  const singles = m[1].split('|').filter((p) => p.length < 2);
  assert.deepStrictEqual(singles, [],
    `single-letter prefixes would match inside unrelated words: ${singles.join(', ')}`);
  // Longest-first, because alternation is first-match: `пере` before `пер`, `про`
  // before `по`. A list sorted the other way silently matches the shorter one.
  const parts = m[1].split('|');
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      assert.ok(!parts[j].startsWith(parts[i]),
        `'${parts[i]}' precedes its own extension '${parts[j]}' — alternation is `
        + 'first-match, so the shorter one wins and the longer is unreachable');
    }
  }
});

it('the reserve guard states no split it did not compute', () => {
  // It used to state one, and the sentence was wrong in both halves: *8 blocked, 10
  // not blocked* against a computed 11 and 6, on figures that attributed 341 free
  // characters to a route fronted by a skill with 5. A number restated inside the
  // guard for the rule that numbers are computed is the one place it costs most.
  const v = fs.readFileSync(path.join(__dirname, 'validate.py'), 'utf8');
  const at = v.indexOf('def check_the_description_reserve_is_not_spent');
  assert.ok(at !== -1, 'the reserve guard is gone');
  const body = v.slice(at, v.indexOf('\ncheck_the_description_reserve_is_not_spent()', at));
  const typed = body.match(/\b\d+\s+(?:of\s+\S+\s+)?(?:remaining\s+)?misses?\b|\b\d+\s+are\s+blocked\b|\bblocked by (?:it|this budget)\b/g);
  assert.deepStrictEqual(typed, null,
    `the guard states a routing split it does not compute: ${JSON.stringify(typed)}`);
  // The disclosure names the command that prints the misses. Until 2026-10-27 that
  // command also sorted them into blocked and free by description budget; B-266 removed
  // the split because the budget stopped binding when trigger phrases moved into each
  // SKILL.md's `## Triggers` body (2026-10-20). It must not grow back.
  assert.ok(/route_coverage\.js/.test(body),
    'the disclosure no longer names the command that prints the routing misses');
  const rc = fs.readFileSync(path.join(__dirname, 'route_coverage.js'), 'utf8');
  assert.deepStrictEqual(rc.match(/^const (?:spendable|TIGHT|HOUSE|ROOM) = /gm), null,
    'route_coverage.js computes a description-reserve split again; that budget no longer binds (B-266)');
});

// --- the completeness half: every advertised phrase reaches its own route --------------
//
// The COMPLETENESS half of the derivation proof. The fixture above asks whether every
// trigger is advertised (soundness); this one asks whether every advertised phrase is a
// trigger. On 2026-09-05 **26 of 169** description phrases were not. On 2026-10-20 the
// trigger lists moved out of the descriptions into each SKILL.md's `## Triggers` body,
// and this check kept reading only the description, and only the FIRST skill of each
// route: by 2026-10-27 it held 7 skills' worth of phrases while 39 skills advertised
// (B-265). It now reads both places in every family SKILL.md.

/**
 * A quoted phrase: "…", «…», or '…' whose quotes are not apostrophes. The single-quote
 * arm requires a non-letter on both outer sides, so "why doesn't ChatGPT cite us" and
 * "the pipeline's own ladder" are not cut at the apostrophe, which the first form of
 * this regex did (`[«"']…[»"']` read `"why doesn'` as a phrase and lost the pairing of
 * every quote after it).
 */
const QUOTED = /"([^"]*)"|«([^»]*)»|(?<![\p{L}\p{N}])'([^'\n]*?)'(?![\p{L}\p{N}])/gu;
const PHRASE_MAX = 80;

/**
 * The phrases a stretch of advertisement quotes, split on commas the way one pair of
 * quotes lists several («палитра, цвета»). A quote longer than a phrase is a description
 * carried verbatim into the body (task-pipeline 1.98.0 moved its old descriptions
 * there): the phrases quoted INSIDE it count, up to its "Not for", where refusals begin.
 */
function quotedPhrases(text) {
  const out = [];
  for (const m of text.matchAll(QUOTED)) {
    const inner = (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]).trim();
    if (inner.length > PHRASE_MAX) {
      const stop = inner.search(/[.;:]?\s+not for\b/i);
      out.push(...quotedPhrases(stop > 0 ? inner.slice(0, stop) : inner));
      continue;
    }
    out.push(...inner.split(/\s*,\s*/));
  }
  return out.map((x) => x.trim()).filter((x) => x.length > 2 && /[a-zа-яё]/i.test(x));
}

/** The description's `Triggers -` list, up to the sentence that starts its boundary. */
function descriptionTriggers(text) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm) return '';
  const d = /^description:\s*(?:[>|]-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
  const s = d ? d[1].replace(/\s+/g, ' ') : '';
  const at = s.search(/Triggers\s*[-–—:]/i);
  if (at === -1) return '';
  const seg = s.slice(at);
  const stop = seg.search(/\.\s+(?:Not for|For defining|The boundary)/i);
  return stop > 0 ? seg.slice(0, stop) : seg;
}

/** The body's `## Triggers` section, up to the next second-level heading. */
function bodyTriggers(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  const m = /^## Triggers[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(body);
  return m ? m[1].replace(/\s+/g, ' ') : '';
}

/** Every phrase one SKILL.md advertises, each once, with where it was first read. */
function advertisedPhrases(text) {
  const seen = new Map();
  for (const p of quotedPhrases(descriptionTriggers(text))) if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { phrase: p, where: 'description' });
  for (const p of quotedPhrases(bodyTriggers(text))) if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { phrase: p, where: '## Triggers' });
  return [...seen.values()];
}

/** Every family SKILL.md as `member/skill` → path. `.cursor/` mirrors are not shipped skills. */
function familySkills() {
  const out = new Map();
  const base = path.join(ROOT, 'skills');
  if (!fs.existsSync(base)) return out;
  for (const member of fs.readdirSync(base)) {
    const plugins = path.join(base, member, 'plugins');
    if (!fs.existsSync(plugins)) continue;
    for (const plugin of fs.readdirSync(plugins)) {
      const dir = path.join(plugins, plugin, 'skills');
      if (!fs.existsSync(dir)) continue;
      for (const skill of fs.readdirSync(dir)) {
        const file = path.join(dir, skill, 'SKILL.md');
        if (fs.existsSync(file)) out.set(`${member}/${skill}`, file);
      }
    }
  }
  return out;
}

/** `member/skill` → the route whose table names it as a source. */
function routeOfSkill() {
  const owner = new Map();
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    for (const g of spec.sources || [{ skill: spec.skill }]) if (!owner.has(g.skill)) owner.set(g.skill, route);
  }
  return owner;
}

/**
 * Skills deliberately on no route, with the reason. Their phrases are not checked.
 */
const UNROUTED = new Map([
  ['make-skill/skill-search', 'the first-step catalogue search every task runs (the '
    + 'routing protocol\'s `toolkit --find`); make-skill\'s router boundary excludes USING a '
    + 'skill, so its line would be false on «какой скилл»'],
]);

// Shared reasons, so one judgement reads once.
const GENERIC_STORE = 'a store-release word every mobile app uses; Mobile Publisher owns the '
  + 'App Store and Google Play, and xr-dev\'s boundary excludes phone apps';
const GENERIC_PROFILER = 'a general Android or GPU profiler; a phone-app or desktop profiling '
  + 'prompt would be told it builds for a Quest headset';
const ML_MODEL = 'an ML model is compressed and is too heavy in the same words (measured: «сожми '
  + 'модель квантованием» named web3d-dev); the asset forms (`compress this glb`) route';

/**
 * Advertised phrases the hook does NOT route, each with why routing it would speak where
 * silence is right. Keyed by skill, then by the phrase as the member writes it, lowercased.
 * Every entry must still be advertised and still unreached, or it fails as stale.
 */
const NOT_ROUTED = {
  'agent-stack/agent-harness': {
    'static or dynamic': 'too generic: static or dynamic typing, imports and linking say it '
      + 'about code that is not an agent',
  },
  'agent-stack/agent-interop': {
    'server.json': 'a file name many servers and tools use; routing it would name agent-stack '
      + 'on any server config edit',
    'agentgateway': 'names this machine\'s own running gateway (~/.config/agentgateway); an ops '
      + 'prompt about it would be told it builds an agent system',
  },
  'sheleg-dev/ad-tracking': {
    'retargeting': 'the English stem `retarget` also fires on "retarget Mixamo", web3d-dev\'s '
      + 'animation word (measured: both routes named)',
    'google ads': 'campaign work is asked for by the product name, and ad-tracking says "Not '
      + 'for campaigns"',
  },
  'sheleg-dev/error-tracking': {
    'release tracking': 'release tracking in a project tracker says it too (measured: "set up '
      + 'release tracking in jira" named sheleg-dev); «релизы в Sentry» routes',
    'наблюдаемость': 'an infrastructure word: route_coverage keeps «настрой мониторинг и алерты» '
      + 'silent, and observability beyond error tracking is not the pack\'s',
  },
  'sheleg-dev/frontend-performance': {
    'performance audit': 'a database or backend performance audit says it too (measured: named '
      + 'sheleg-dev); nothing names a page',
    'оптимизация скорости': 'the speed of anything, a query or a build (measured: «оптимизация '
      + 'скорости запросов к базе» named sheleg-dev)',
    'cls': 'Python\'s `cls` parameter: «переименуй cls в классметоде» would be told it wires '
      + 'money or tracking',
    'lazy loading': 'ORM lazy loading (SQLAlchemy, Hibernate) is the same phrase about a '
      + 'database, not a page',
  },
  'sheleg-dev/google-auth': {
    'service account': 'Kubernetes and every cloud have service accounts; the phrase alone '
      + 'does not name Google',
    'сервисный аккаунт': 'Kubernetes and every cloud have service accounts; the phrase alone '
      + 'does not name Google',
  },
  'super-ux/ux-foundation': {
    'джобы': 'CI and cron jobs in Russian dev speech (measured: «cron джобы падают» named '
      + 'super-ux); `jtbd` routes',
    'who is this for': 'a generic question about any artefact ("who is this PR for"), and the '
      + 'hook keeps questions silent',
  },
  'super-ux/ux-audit': {
    'run the scenarios': 'load-test scenarios (k6, Gatling) are run in the same words (measured: '
      + '"run the load test scenarios" named super-ux)',
  },
  'super-ux/ux-scenarios': {
    'новая фича': 'fires on every new feature, including internal scripts super-ux\'s boundary '
      + 'excludes; task-pipeline already names the delivery',
    'new feature': 'fires on every new feature, including internal scripts super-ux\'s boundary '
      + 'excludes; task-pipeline already names the delivery',
    'use cases': 'a code layer in clean architecture (`UseCases`) and a testing phrase as often '
      + 'as a UX request',
  },
  'super-ux/vision': {
    'видение': 'anyone\'s view of anything (measured: «у меня другое видение архитектуры» named '
      + 'super-ux); «продуктовое видение» routes',
    'vision': 'too generic: computer vision, Apple Vision Pro, a vision model',
    'what is this product about': 'a question: the trigger would carry «what is» through the '
      + 'filter that keeps questions silent',
  },
  'task-pipeline/task-pipeline': {
    'waves': 'a mode of `/task-pipeline`, named with the command; bare it is any wave (animation, '
      + 'rollout)',
    'волнами': 'a mode of `/task-pipeline`, named with the command; bare it is any wave '
      + '(«появляются волнами»)',
    'checkup': 'a mode of `/task-pipeline`, named with the command; bare it is any health check',
    'чекап': 'a mode of `/task-pipeline`, named with the command; bare it is any health check',
    'setup': 'a mode of `/task-pipeline`, named with the command; bare it is every environment '
      + 'setup',
  },
  'telegram-dev/telegram-userbots': {
    'read channel history': 'Slack and Discord channels have history too (measured: "read the '
      + 'slack channel history" named telegram-dev)',
    'user account': 'too generic: every product has user accounts; the phrase does not name '
      + 'Telegram',
  },
  'web3d-dev/web3d-assets': {
    'сожми модель': ML_MODEL,
    'модель слишком тяжёлая': ML_MODEL,
  },
  'web3d-dev/web3d-animation': {
    'ретаргетинг': 'already sheleg-dev\'s ad word (ad-tracking advertises it); a second route on '
      + 'it would name 3D on every ad prompt',
  },
  'xr-dev/quest-lifecycle': {
    'what are we missing before launch': 'a launch question about any product; nothing in it '
      + 'names a headset',
    'что нужно до релиза': 'a launch question about any product; nothing in it names a headset',
  },
  'xr-dev/quest-perf': {
    'dropped frames': 'web animation and video drop frames too; the phrase does not name a headset',
    'просадка кадров': 'web animation and video drop frames too; the phrase does not name a headset',
    'app is hot': 'compiles to fire on "the app is hot-reloaded" (a hyphen ends the word)',
    'gpu bound': 'ML training and desktop games are GPU bound too; nothing names a headset',
    'упёрлись в gpu': 'ML training and desktop games hit the GPU too; nothing names a headset',
    'perfetto trace': GENERIC_PROFILER,
    'трейс perfetto': GENERIC_PROFILER,
    'simpleperf': GENERIC_PROFILER,
    'renderdoc': GENERIC_PROFILER,
  },
  'xr-dev/quest-spatial': {
    'hybrid app': 'a hybrid mobile app (Cordova, Capacitor) is the common meaning',
    'гибридное приложение': 'a hybrid mobile app (Cordova, Capacitor) is the common meaning',
  },
  'xr-dev/quest-store': {
    'выложить в стор': GENERIC_STORE,
    'release channel': GENERIC_STORE,
    'релизный канал': GENERIC_STORE,
    'app review': GENERIC_STORE,
    'ревью приложения': GENERIC_STORE,
    'store assets': GENERIC_STORE,
    'ассеты для стора': GENERIC_STORE,
    'test user': GENERIC_STORE,
    'тестовый аккаунт': GENERIC_STORE,
    'pre-order': GENERIC_STORE,
    'предзаказ': GENERIC_STORE,
    'publish to the store': GENERIC_STORE,
  },
  'xr-dev/quest-tooling': {
    'симулятор': 'the iOS and Android simulators are the common meaning',
    'install the apk': 'every Android app installs an APK; the phrase does not name a headset',
    'developer mode': 'every phone and browser has a developer mode',
    'режим разработчика': 'every phone and browser has a developer mode',
  },
  'xr-dev/quest-webxr': {
    'a-frame': 'the matcher splits on hyphens, so it compiles to the English "a frame" and '
      + 'fires on "render a frame"',
    'bubblewrap': 'also the Linux sandbox (`bwrap`) agent harnesses run under',
    'покупки в вебе': 'web purchases in general are sheleg-dev\'s charge; nothing names a headset',
  },
};

/**
 * One skill's advertised phrases against its route: what is unreached, and which
 * allow-list entries no longer hold. Pure over `text`, so a plant can be fed to it.
 */
function completeness(ref, route, text) {
  const allowed = NOT_ROUTED[ref] || {};
  const phrases = advertisedPhrases(text);
  const unreached = [];
  const excused = [];
  const reached = [];
  for (const { phrase, where } of phrases) {
    const reaches = T.match(phrase).includes(route);
    const why = allowed[phrase.toLowerCase()];
    if (reaches) { reached.push(phrase); continue; }
    if (why) { excused.push(phrase); continue; }
    unreached.push(`${route}: "${phrase}" (${ref}, ${where})`);
  }
  const advertised = new Set(phrases.map((p) => p.phrase.toLowerCase()));
  const stale = Object.keys(allowed)
    .filter((p) => !advertised.has(p) || reached.some((r) => r.toLowerCase() === p))
    .map((p) => `${ref}: "${p}" is ${advertised.has(p) ? 'reached now' : 'no longer advertised'}`);
  return { total: phrases.length, unreached, excused, stale };
}

it('every phrase a SKILL.md advertises, in its description or its ## Triggers, reaches its own route', () => {
  const skills = familySkills();
  if (!skills.size) return; // no submodule materialised: the soundness fixture reports it
  assert.ok(skills.size >= 30, `only ${skills.size} family skills were found; the walk stopped early`);
  const owner = routeOfSkill();
  let total = 0;
  let excused = 0;
  const unreached = [];
  const stale = [];
  const orphans = [];
  for (const [ref, file] of skills) {
    if (UNROUTED.has(ref)) {
      if (owner.has(ref)) stale.push(`${ref} is declared unrouted and the ${owner.get(ref)} route names it`);
      continue;
    }
    const route = owner.get(ref);
    if (!route) { orphans.push(ref); continue; }
    const r = completeness(ref, route, fs.readFileSync(file, 'utf8'));
    total += r.total;
    excused += r.excused.length;
    unreached.push(...r.unreached);
    stale.push(...r.stale);
  }
  for (const ref of Object.keys(NOT_ROUTED)) {
    if (!skills.has(ref)) stale.push(`${ref} is allow-listed and ships no SKILL.md`);
  }
  console.log(`  advertised phrases: ${total} over ${skills.size - UNROUTED.size} routed skills, `
    + `${unreached.length} unreached, ${excused} allow-listed`);
  assert.deepStrictEqual(orphans, [],
    'a family skill no route names and UNROUTED does not declare; its phrases route nowhere');
  assert.ok(total >= 300, `only ${total} advertised phrases were read; the extraction stopped early`);
  assert.deepStrictEqual(unreached, [],
    'advertised and unreachable: add the phrase to its route in lib/triggers.js, or allow-list it here with the reason');
  assert.deepStrictEqual(stale, [], 'allow-list entries that no longer hold');
  for (const why of [...UNROUTED.values(), ...Object.values(NOT_ROUTED).flatMap(Object.values)]) {
    assert.ok(why && why.length > 30, `an allow-list entry has no reason: ${why}`);
  }
});

it('the completeness check fails on a planted phrase, and reads both places', () => {
  // The negative control: a phrase no route carries, planted once in a description's
  // `Triggers -` list and once in a body `## Triggers`, must be reported from each.
  const plant = 'квантовый телепорт шлема';
  const text = '---\nname: quest-native\ndescription: Use when testing. Triggers - '
    + `"${plant} в описании". Not for anything.\n---\n\n# x\n\n## Triggers\n\n`
    + `More phrases: "${plant}", "openxr app".\n\n## Next\n\n"${plant} после раздела".\n`;
  const r = completeness('xr-dev/quest-native', 'xr-dev', text);
  assert.deepStrictEqual(r.unreached.map((u) => u.replace(/ \(.*$/, '')), [
    `xr-dev: "${plant} в описании"`, `xr-dev: "${plant}"`,
  ]);
  assert.ok(r.unreached[0].endsWith('description)') && r.unreached[1].endsWith('## Triggers)'));
  // apostrophes inside a phrase do not break the pairing of the quotes after them
  assert.deepStrictEqual(quotedPhrases('"why doesn\'t it cite us" / "почему", \'waves\'/\'волнами\''),
    ["why doesn't it cite us", 'почему', 'waves', 'волнами']);
});

// --- word forms the 2026-10-08 audit lost (REQ-01) -----------------------------------
//
// Six of twelve ordinary Russian tasks printed no routing line on the installed 1.53.0.
// Each fixture below reproduced on 4374ffe before the matcher changed.

it('a three-letter Cyrillic noun inflects — «бота» is `бот`', () => {
  // `wordPattern` returned a word under four letters verbatim, so `телеграм бот` could
  // match «телеграм бот» and never «телеграм-бота», the accusative an operator types.
  assert.ok(T.match('добавь телеграм-бота').includes('telegram-dev'));
  assert.ok(T.match('сделай телеграм бота').includes('telegram-dev'));
  assert.ok(T.match('нужен телеграм ботом').includes('telegram-dev'));
  // …and the allowance is two letters, so the word still has to END near the stem
  assert.ok(!T.match('телеграм ботинок').includes('telegram-dev'));
});

it('a declared Cyrillic brand stem matches its Latin spelling inside Russian text', () => {
  // «Telegram-бота»: a Latin brand followed by a Cyrillic inflection, which neither the
  // English trigger `telegram bot` nor the Russian `телеграм бот` could reach.
  assert.ok(T.match('добавь Telegram-бота').includes('telegram-dev'));
  assert.ok(T.match('добавь Telegram бота в проект').includes('telegram-dev'));
  assert.ok(T.match('перенеси дизайн из Figma в код').includes('sheleg-design'));
  // The alias table is declared, one-directional and tiny; every key is a stem a
  // trigger actually carries, or the entry could never fire.
  for (const stem of Object.keys(T.BRAND_ALIASES)) {
    const carried = Object.values(T.ROUTES).some((s) =>
      (s.triggers || []).concat(s.objects || []).some((t) =>
        t.toLowerCase().replace(/ё/g, 'е').split(/[\s\-–—]+/).some((w) => w.startsWith(stem))));
    assert.ok(carried, `BRAND_ALIASES.${stem} names a stem no trigger carries`);
  }
});

it('an OBJECT routes only when an action verb governs it', () => {
  // `дашборд`, `баг`, `app store` are words that occur in questions, logs and status talk
  // as often as in instructions. As objects they need «сделай/добавь/почини/…» or
  // make/build/add/fix/write in front of them, within the same two-word gap a phrase uses.
  assert.ok(T.match('сделай дашборд в админке').includes('sheleg-design'));
  assert.ok(T.match('build a dashboard in the admin panel').includes('sheleg-design'));
  assert.ok(T.match('исправь баг в апи').includes('task-pipeline'));
  assert.ok(T.match('напиши описание для App Store').includes('copywriting'));
  assert.ok(T.match('improve the animations').includes('sheleg-design'));
  // …and without the verb they are silent
  assert.deepStrictEqual(T.match('открой дашборд графаны'), []);
  assert.deepStrictEqual(T.match('баг воспроизводится редко'), []);
  assert.deepStrictEqual(T.match('the app store review took a week'), []);
});

it('every object reaches its route behind a verb, and no object is also a bare trigger', () => {
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    for (const o of spec.objects || []) {
      assert.ok(T.match(`сделай ${o}`).includes(route) || T.match(`make ${o}`).includes(route),
        `${route}: object ${JSON.stringify(o)} does not route even behind a verb`);
      assert.ok(!spec.triggers.includes(o), `${route}: ${o} is both a trigger and an object`);
    }
  }
});

it('no object fires inside a refusal phrase', () => {
  const clash = [];
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    for (const o of spec.objects || []) {
      for (const r of T.REFUSALS) if (T.matches(r, o)) clash.push(`${route}:${o} in ${r}`);
    }
  }
  assert.deepStrictEqual(clash, []);
});

// --- the chain (REQ-03) ---------------------------------------------------------------

it('a subject route on a prompt that writes also names the pipeline', () => {
  // «сделай редизайн лендинга» classified as change + write and printed the visual and
  // copy lines with no delivery line, so the agent was told how it should look and not
  // how it reaches the repository.
  for (const p of ['сделай редизайн лендинга', 'добавь экран онбординга в приложение',
                   'добавь Telegram-бота', 'улучши анимации', 'собери агента-оркестратора',
                   'add an onboarding screen to the app', 'redesign the landing page']) {
    assert.ok(T.match(p).includes('task-pipeline'), `${JSON.stringify(p)} → ${JSON.stringify(T.match(p))}`);
  }
  assert.ok(T.render('сделай редизайн лендинга').includes('/task-pipeline'));
});

it('a question, an explanation and an audit do NOT gain the pipeline — the other direction', () => {
  // The boundary cuts both ways: «проверь дизайн лендинга» still names the visual route,
  // because it is about how it looks, and still does not name delivery, because an audit
  // asks for a verdict, not a diff.
  assert.deepStrictEqual(T.match('проверь дизайн лендинга'), ['sheleg-design']);
  assert.deepStrictEqual(T.match('объясни, как работает онбординг'), []);
  assert.deepStrictEqual(T.match('почему телеграм бот молчит?'), []);
  assert.deepStrictEqual(T.match('3D-сцена тормозит'), ['web3d-dev']);
  // a subject route with no write intent at all stays a facet
  assert.deepStrictEqual(T.match('палитра лендинга'), ['sheleg-design']);
});

it('the chain is the subject list, and the list names only routes the table has', () => {
  for (const r of T.SUBJECT_ROUTES) assert.ok(T.ROUTES[r], `SUBJECT_ROUTES names ${r}, which has no route`);
  for (const r of ['task-pipeline', 'project-audit', 'evidence-docs', 'agent-sync', 'make-skill', 'seo-llmo']) {
    assert.ok(!T.SUBJECT_ROUTES.includes(r), `${r} is not a subject route`);
  }
});

it('a refusal still beats the chain', () => {
  assert.deepStrictEqual(T.match('добавь экран онбординга, без пайплайна'), []);
});

// --- the two routers that were only map rows (REQ-07) ------------------------------------

it('xr-dev and web3d-dev are routes, reached by their own advertised words', () => {
  assert.ok(T.match('add a WebXR session to the site').includes('xr-dev'));
  assert.ok(T.match('нативное приложение для Quest').includes('xr-dev'));
  assert.ok(T.match('3D-сцена тормозит').includes('web3d-dev'));
  assert.ok(T.match('the React Three Fiber scene drops frames').includes('web3d-dev'));
  assert.strictEqual(T.optedOut('добавь WebXR, без xr'), true);
  assert.strictEqual(T.optedOut('make it 3d, no web3d'), true);
});

// --- operator-declared routes (REQ-04) ----------------------------------------------------

it('a declared external route is printed after the family routes, and never shadows one', () => {
  const external = T.externalRoutes({ 'example-media': { triggers: ['иконка', 'promo video'] } });
  assert.deepStrictEqual(T.match('сделай иконку', { external }), ['example-media']);
  assert.deepStrictEqual(T.match('сделай иконку'), [], 'an undeclared route must not fire');
  const out = T.render('make a promo video', { external });
  assert.ok(out.includes('example-media'), out);
  assert.ok(/declared/.test(out), 'the line does not say the route is the operator\'s declaration');
  // a declaration may not take a family router's name
  assert.deepStrictEqual(T.externalRoutes({ 'task-pipeline': { triggers: ['ролик'] } }), []);
  // the question filter and the refusal phrases govern declared routes exactly as family ones
  assert.deepStrictEqual(T.match('что такое иконка?', { external }), []);
  assert.deepStrictEqual(T.match('сделай иконку, без пайплайна', { external }), []);
});

// --- the stem prefilter changes no answer (R06) ----------------------------
// `matches` rejects a phrase whose word stems are absent before building its regular
// expression. The cases below are the ones a careless prefilter loses: a Latin brand
// standing in for a Cyrillic one, a verbal prefix, an inflected ending, a hyphen.
it('the stem prefilter keeps brand aliases, prefixes, inflections and hyphens', () => {
  assert.ok(T.match('добавь Telegram-бота для уведомлений').includes('telegram-dev'), 'brand alias lost');
  assert.ok(T.match('отрефактори модуль оплаты').length > 0, 'verbal prefix lost');
  assert.ok(T.match('сделай лендинг').includes('sheleg-design'), 'inflected form lost');
  assert.deepStrictEqual(T.match('привет'), [], 'a prompt with no stem in it routed');
  assert.strictEqual(T.matches('Рефакторинг оплаты', 'рефакторинг'), true);
  assert.strictEqual(T.matches('аудитория', 'аудит'), false, 'the word-end rule was lost');
});

// --- once per route (R01, B-155) -------------------------------------------

it('render lists only the routes not yet noted, and nothing when all were', () => {
  const prompt = 'сделай фичу экспорта в csv';
  const routes = T.match(prompt);
  assert.ok(routes.length >= 1, 'the control prompt no longer routes — the fixture proves nothing');
  const full = T.render(prompt, { noted: [] });
  assert.ok(full.includes('[sshlg-routing]'), 'nothing noted must print as today');
  assert.strictEqual(T.render(prompt, { noted: routes }), '',
    'a route already noted in this session was printed again');
  const rest = T.render(prompt, { noted: [routes[0]] });
  if (routes.length === 1) assert.strictEqual(rest, '');
  else assert.ok(rest.length > 0 && rest.length < full.length, 'a partial noted set did not shrink the note');
});

it('a new route on a later turn prints only that route', () => {
  const first = T.match('сделай фичу экспорта в csv');
  const second = T.match('сделай фичу экспорта в csv, поправь дизайн и анимации лендинга');
  const fresh = second.filter((r) => !first.includes(r));
  assert.ok(fresh.length >= 1, 'the fixture prompts share every route — nothing new to show');
  const out = T.render('сделай фичу экспорта в csv, поправь дизайн и анимации лендинга', { noted: first });
  const lines = out.split('\n').filter((l) => l.startsWith('- this '));
  // The one exception is the delivery pairing (fix round #9): a newly printed facet on a
  // writing prompt brings the `task-pipeline` line with it even though it was noted.
  const paired = fresh.some((r) => T.SUBJECT_ROUTES.includes(r)) && second.includes('task-pipeline')
    && !fresh.includes('task-pipeline') ? 1 : 0;
  assert.strictEqual(lines.length, fresh.length + paired, `expected only the new routes, got:\n${out}`);
  const lineOf = T.routeLines();
  for (const r of first.filter((x) => x !== 'task-pipeline')) {
    assert.ok(!out.includes(lineOf[r]), `an already-noted route other than delivery was printed again: ${r}`);
  }
});

// --- the facet brings its delivery line (fix round #9) ---------------------
// README: "When a route that says what a change contains … matched and the prompt
// writes, the `task-pipeline` line is printed beside it". `noted` filtered task-pipeline
// out once it had been printed, so «исправь баг» then «сделай редизайн лендинга» named
// the visual layer and copy, and not delivery — the README promise broken on turn two.
it('a newly printed facet route on a writing prompt prints task-pipeline beside it, even when noted', () => {
  const lineOf = T.routeLines();
  const first = T.match('исправь баг');
  assert.deepStrictEqual(first, ['task-pipeline'], 'the control prompt changed — the fixture proves nothing');
  const out = T.render('сделай редизайн лендинга', { noted: first });
  assert.ok(out.includes(lineOf['sheleg-design']), `the facet is missing:\n${out}`);
  assert.ok(out.includes(lineOf['task-pipeline']), `the facet came without its delivery line:\n${out}`);
  // nothing new: everything noted, the pairing does not resurrect the note
  assert.strictEqual(T.render('сделай редизайн лендинга', { noted: T.match('сделай редизайн лендинга') }), '');
  // a question does not write, so a fresh facet there carries no delivery line
  const q = T.render('почему сделай редизайн лендинга так выглядит?', { noted: ['task-pipeline'] });
  assert.ok(!q.includes(lineOf['task-pipeline']), `a non-writing prompt was paired with delivery:\n${q}`);
});

// --- the prefilter is invisible: a generic invariant (fix round, risk e) ----
// `matches` and `objectMatches` reject a phrase whose required stems are absent BEFORE
// building its expression. That is only an optimisation if it never changes an answer, so
// this compares both against the expression alone, for every shipped phrase — triggers,
// objects, QUESTION and REFUSALS — and the forms people type: inflected endings, a verbal
// prefix, a hyphen for a space, upper case, `ё`, and a Latin brand inside Russian.
// Watched failing with `requiredStems` keeping alias words (receipt, fix round).
it('the stem prefilter never changes an answer of matches() or objectMatches()', () => {
  const phrases = new Set(T.QUESTION.concat(T.REFUSALS));
  const objects = new Set();
  for (const spec of Object.values(T.ROUTES)) {
    for (const t of spec.triggers || []) phrases.add(t);
    for (const o of spec.objects || []) objects.add(o);
  }
  const ENDINGS = ['', 'а', 'у', 'ом', 'ами', 'е', 'ы', 'ов', 's', 'ing', 'ed'];
  const variants = (p) => {
    const words = p.split(/\s+/);
    const out = new Set([p, p.toUpperCase(), p.replace(/е/g, 'ё'), p.replace(/\s+/g, '-'),
      `сделай ${p}`, `от${p}`, `пере${p}`, `please ${p} now`, `${p}, без пайплайна`]);
    for (const e of ENDINGS) out.add(words.map((w) => w + e).join(' '));
    for (const [ru, lat] of Object.entries(T.BRAND_ALIASES)) {
      if (p.includes(ru)) {
        out.add(p.replace(ru, lat));
        out.add(p.replace(ru, lat[0].toUpperCase() + lat.slice(1)));
        out.add(p.replace(new RegExp(`${ru}[а-яё]*`), lat));
      }
    }
    return [...out];
  };
  const fold = (t) => String(t).toLowerCase().replace(/ё/g, 'е');
  const list = [...phrases];
  let compared = 0;
  let positives = 0;
  const wrong = [];
  list.forEach((phrase, i) => {
    // its own forms, and a neighbour's — so both the hits and the misses are exercised
    const texts = variants(phrase).concat(variants(list[(i + 1) % list.length]));
    const re = T.phrasePattern(phrase);
    for (const text of texts) {
      const want = re.test(fold(text));
      const got = T.matches(text, phrase);
      compared += 1;
      if (want) positives += 1;
      if (got !== want) wrong.push(`matches(${JSON.stringify(text)}, ${JSON.stringify(phrase)}) = ${got}, expression says ${want}`);
    }
  });
  const objList = [...objects];
  objList.forEach((object, i) => {
    const texts = variants(object).concat(variants(objList[(i + 1) % objList.length]))
      .flatMap((t) => [t, `исправь ${t}`, `fix the ${t}`, `сделай ${t}`]);
    const re = T.objectPattern(object);
    for (const text of texts) {
      const want = re.test(fold(text));
      const got = T.objectMatches(text, object);
      compared += 1;
      if (want) positives += 1;
      if (got !== want) wrong.push(`objectMatches(${JSON.stringify(text)}, ${JSON.stringify(object)}) = ${got}, expression says ${want}`);
    }
  });
  // The collector must have seen both answers, or the equality proves nothing (#11).
  assert.ok(list.length > 100 && objList.length > 5, `too few phrases collected: ${list.length}/${objList.length}`);
  assert.ok(positives > 1000 && compared - positives > 1000,
    `the corpus is one-sided: ${positives} hits of ${compared}`);
  assert.ok(T.BRAND_ALIASES && Object.keys(T.BRAND_ALIASES).length >= 1);
  assert.strictEqual(wrong.length, 0, `${wrong.length} of ${compared} differ, e.g.\n  ${wrong.slice(0, 5).join('\n  ')}`);
});

// --- B-84's с/ш case, held on its own -------------------------------------
//
// `stemRu` cuts `записать` to `записа-` and cannot reach `запиш-`; the table carries
// the advertised imperative «запиши решение» instead. Until 2026-10-27 the only
// fixture that said the imperative routed also carried `decision record`, so the
// imperative could have gone and the fixture would still pass.

it('B-84: the imperative of an с/ш verb routes on its own, and the stemmer was not widened', () => {
  for (const p of ['запиши решение', 'запишите решение', 'записать решение']) {
    assert.deepStrictEqual(T.match(p), ['evidence-docs'], p);
  }
  // the alternation was bridged by advertising one phrase, not by teaching the stemmer
  // a conjugation class: a different object, or the bare verb, stays silent
  for (const p of ['запиши номер телефона', 'запиши это', 'записал в блокнот']) {
    assert.deepStrictEqual(T.match(p), [], p);
  }
});

// --- B-241: a status question and a look are not orders --------------------
//
// «миграция прошла? посмотри логи» read as a write, because `миграция` is a noun in
// CHANGE_WORDS and a clause that names a migration counted as one being ordered. A
// clause that asks WHETHER something happened, or a turn that only asks to look, writes
// nothing; an imperative inside the same clause still does.

const B241_NOT_WRITE = [
  'миграция прошла? посмотри логи',
  'миграция прошла?',
  'прошла ли миграция?',
  'фикс задеплоился?',
  'рефактор уже смержили?',
  'ты сделал миграцию?',
  'посмотри логи миграции',
  'миграция прошла, посмотри логи',
  'проверь логи миграции',
  'глянь, что сломалось в интеграции',
  'did the migration pass? check the logs',
  'did the migration pass?',
  'is the fix deployed?',
  'has the refactor been merged?',
  'did you fix the login bug?',
  'look at the migration logs',
  'check the logs of the last migration',
  'show me the migration logs',
  // a Latin noun inside a Russian question is not an English imperative
  'fix в проде прошёл?',
  'давай посмотрим логи миграции',
];
const B241_WRITE = [
  'проведи миграцию',
  'смигрируй базу',
  'запусти миграцию',
  'запусти миграцию?',
  'сделай миграцию базы',
  'миграция упала? почини её',
  'посмотри логи и почини миграцию',
  'посмотри логи, почини миграцию',
  'можешь сделать миграцию?',
  'фичу логина сделаешь?',
  // the status clause no longer carries the write for the order beside it
  'ну что, миграция готова? давай следующую фичу',
  'migrate the database',
  'run the migration and fix the logs',
  'did the migration pass? if not, fix it',
  'can you add a paywall screen?',
  'look at the logs and fix the migration',
  'could you update the migration?',
  'fix the migration?',
  'create a migration for users',
  // English marks an order by position: a state verb ("show") earlier in the clause
  // does not turn the order after the comma into a look
  'the paywall does not show up, fix it',
];

it('B-241: a status question or a look does not write (RU and EN)', () => {
  const wrong = B241_NOT_WRITE.filter((p) => T.classify(p).effects.write);
  assert.deepStrictEqual(wrong, [], 'read as an order to change the repository');
  assert.ok(B241_NOT_WRITE.filter((p) => /[а-я]/.test(p)).length >= 10
    && B241_NOT_WRITE.filter((p) => !/[а-я]/.test(p)).length >= 8, 'the corpus lost a language');
});

it('B-241: an order still writes, with or without a question mark (RU and EN)', () => {
  const wrong = B241_WRITE.filter((p) => !T.classify(p).effects.write);
  assert.deepStrictEqual(wrong, [], 'an order read as a report');
  assert.ok(B241_WRITE.filter((p) => /[а-я]/.test(p)).length >= 10
    && B241_WRITE.filter((p) => !/[а-я]/.test(p)).length >= 8, 'the corpus lost a language');
});

it('B-241: the hook stops naming delivery for a status question or a look', () => {
  for (const p of ['миграция прошла? посмотри логи', 'фикс задеплоился?', 'посмотри логи миграции',
    'глянь, что сломалось в интеграции', 'did the migration pass? check the logs', 'look at the migration logs']) {
    assert.deepStrictEqual(T.match(p), [], p);
  }
  // an audit the pipeline claims keeps its route: checking production is a finding
  // that lands in the repository, and `проверь`/`check` are its words, not a look
  assert.deepStrictEqual(T.match('перепроверь прод'), ['task-pipeline']);
  assert.ok(T.match('check the fix in production').includes('task-pipeline'));
  for (const p of ['проведи миграцию', 'миграция упала? почини её', 'посмотри логи и почини миграцию']) {
    assert.deepStrictEqual(T.match(p), ['task-pipeline'], p);
  }
});

it('B-241: a status clause keeps its candidates; only the write verdict moves', () => {
  const c = T.classify('миграция прошла? посмотри логи');
  assert.deepStrictEqual(c.clauses.map((x) => x.intent), ['question', 'audit']);
  assert.ok(c.facets.includes('task-pipeline'), 'the shortlist lost the route the clause names');
  assert.strictEqual(c.effects.report, true);
  assert.deepStrictEqual(T.splitClauses('миграция прошла? посмотри логи'), ['миграция прошла', 'посмотри логи']);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
