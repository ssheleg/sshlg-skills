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

/** The `description:` value, front matter only — the string a host actually reads. */
function description(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm) return '';
  const d = /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|$)/m.exec(fm[1]);
  return (d ? d[1] : '').toLowerCase();
}

// --- the derivation proof ---------------------------------------------------

it('every trigger is a word the skill itself advertises', () => {
  const missing = [];
  let checkedRoutes = 0;
  for (const [route, spec] of Object.entries(T.ROUTES)) {
    const file = skillFile(spec.skill);
    if (!file) continue; // submodule not materialized — reported below, not passed over
    checkedRoutes += 1;
    const desc = description(file);
    assert.ok(desc.length > 40, `${spec.skill}: description did not parse (${desc.length} chars)`);
    for (const t of spec.triggers) {
      if (!desc.includes(t)) missing.push(`${route}: ${JSON.stringify(t)} not in ${spec.skill}'s description`);
    }
  }
  assert.ok(checkedRoutes > 0,
    'no submodule was materialized, so this check proved nothing — clone with --recursive');
  assert.deepStrictEqual(missing, [],
    `the hook fires on words the skill does not claim:\n  ${missing.join('\n  ')}`);
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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
