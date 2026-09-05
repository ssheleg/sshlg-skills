#!/usr/bin/env node
'use strict';
/**
 * How much of the family's own territory the prompt hook can actually name.
 *
 * `triggers_test.js` asks whether every trigger is advertised by the skill it
 * fronts — a soundness question, and it has always passed. Nothing asked the
 * completeness question: given a prompt an operator would really type, does any
 * route get named at all? On 2026-08-17 the answer was **32 of 71 reach
 * nothing**, and the whole of the growth vocabulary the `super-ux` router text
 * promises — funnels, onboarding, activation, retention, paywalls — was in that
 * 32. The knowledge was in the pack the entire time; the selector could not
 * say its name.
 *
 * **Deliberately not a `_test.js`, and not for the reason `check_pins.py` is
 * outside the gate.** That one is excluded because it needs the network. This
 * one is excluded because its expectations are a judgement about what an
 * operator means, and a judgement that fails a build is a judgement nobody may
 * revise. It measures; the board decides what the number should be.
 *
 * Run: `node test/route_coverage.js` (add `--all` to list the hits too).
 *
 * `want` is the route set an operator would expect, `''` meaning silence is the
 * correct answer. A case passes if ANY expected route is named — the hook may
 * legitimately name more than one craft for one prompt.
 */

const fs = require('fs');
const path = require('path');
const T = require('../lib/triggers.js');

const CASES = [
  // --- growth: funnels, activation, retention, paywalls -------------------
  // Every one of these is territory the super-ux router text claims in
  // `lib/routers-registry.js` ("product decisions, funnels, onboarding,
  // payment steps") and knowledge the pack genuinely carries.
  // --- diagnosis: the whole project as the subject ----------------------
  // Territory the project-audit router claims. `аудит` alone belongs to
  // task-pipeline and correctly reaches it; these phrases must reach the
  // diagnosis route as well, and a request to audit ONE thing must not.
  // --- the design lane's own vocabulary, and the words a router text names ------
  // The umbrella's block says "before design, redesign, layout, front-end or
  // mobile-UI work"; the trigger layer fires only on words a skill advertises about
  // itself. On 2026-09-03 every prompt in this group reached nothing, so the
  // paragraph telling an agent what to do about them was inert for its own subject.
  ['редизайн сайта', 'sheleg-design'],
  ['переделай дизайн', 'sheleg-design'],
  ['сверстай лендинг', 'sheleg-design'],
  ['нужна вёрстка дашборда', 'sheleg-design'],
  ['redesign the landing page', 'sheleg-design'],
  // --- ё, which Russian is normally typed without --------------------------------
  // Both spellings must name the same route. Before the fold in `normalise()` the
  // right-hand spelling of each of these reached nothing while the ё form routed.
  ['звезды телеграм', 'telegram-dev'],
  ['отчет о приемке', 'evidence-docs'],
  ['сделай темную тему', 'sheleg-design'],
  // --- lanes the design pack declares and nobody advertises ----------------------
  // Kept as measured misses rather than quietly dropped: `a11y` has NO router
  // (`B-140`), and the token vocabulary is blocked on a description at 1014 of 1024.
  // A coverage file that lists only what passes is a coverage file nobody believes.
  ['обнови токены темы', 'sheleg-design'],
  ['проверь доступность интерфейса', 'sheleg-design|task-pipeline'],
  ['контрастность текста слишком низкая', 'sheleg-design'],
  ['проаудируй проект', 'project-audit'],
  ['аудит проекта целиком', 'project-audit'],
  ['что у нас не доделано в проекте', 'project-audit'],
  ['audit the project', 'project-audit'],
  ['what is unfinished here', 'project-audit'],
  ['состояние проекта на сегодня', 'project-audit'],
  ['как повысить ретеншн пользователей', 'super-ux'],
  ['улучши активацию новых пользователей', 'super-ux'],
  ['сделай онбординг для новых юзеров', 'super-ux'],
  ['спроектируй воронку активации', 'super-ux'],
  ['почему пользователи отваливаются на втором шаге', 'super-ux'],
  ['добавь пейволл после онбординга', 'super-ux'],
  ['design an activation funnel', 'super-ux'],
  ['improve user retention', 'super-ux'],
  ['build an onboarding flow', 'super-ux'],
  ['reduce churn on the trial', 'super-ux'],
  ['add a paywall screen', 'super-ux'],
  ['сделай реферальную программу', 'super-ux'],
  ['a/b тест на лендинге', 'super-ux|sheleg-design'],
  ['настрой аналитику продукта', 'sheleg-dev'],
  ['посчитай конверсию воронки', 'super-ux'],

  // --- agent systems -------------------------------------------------------
  // The pack is installed and every one of these words is already in an
  // agent-stack description's own `Triggers -` list. There is no router.
  ['напиши оркестратор агентов', 'agent-stack'],
  ['build an agent orchestrator', 'agent-stack'],
  ['сделай эвалы для агента', 'agent-stack'],
  ['add tool calling loop', 'agent-stack'],
  ['подключи mcp сервер', 'agent-stack'],
  ['настрой биллинг токенов для llm', 'agent-stack|sheleg-dev'],
  ['sub-agent coordination', 'agent-stack'],

  // --- money, tracking, errors, sign-in, speed -----------------------------
  ['подключить stripe', 'sheleg-dev'],
  ['добавь оплату подпиской', 'sheleg-dev'],
  ['настрой meta pixel', 'sheleg-dev'],
  ['вход через google', 'sheleg-dev'],
  ['ускорить сайт', 'sheleg-dev'],
  ['сайт медленно грузится', 'sheleg-dev'],
  // The pack's seventh skill, unroutable until 2026-08-29 (XF-02): both prompts
  // measured `[]` while `error-tracking` sat in the map table.
  ['добавь sentry в бэкенд', 'sheleg-dev'],
  ['set up error tracking for the api', 'sheleg-dev'],
  // The ReAct homograph (XF-05): the operator means the framework, and no route
  // is better than the wrong craft. Measured `["agent-stack"]` until 2026-08-29.
  ['сделай форму логина на react', ''],

  // --- Russian verbal prefixes, which the matcher loses entirely ------------
  // `phrasePattern` demanded a word boundary BEFORE the stem, so every prefixed form
  // of an advertised verb reached nothing while the bare stem routed: `рефактор
  // модуля` → task-pipeline and `отрефактори модуль` → []. B-84 recorded this class
  // as settled in v0.85.1; it was not. The suffix side has always been tolerant
  // (`stem[а-яё]{0,allowance}`), and Russian prefixes an operator actually types —
  // от-, за-, по-, про-, пере-, до- — sat on the other side of the same word.
  ['зарефакторь этот класс', 'task-pipeline'],
  ['проаудируй проект', 'project-audit|task-pipeline'],
  ['перепроверь прод', 'task-pipeline'],
  ['доработай онбординг', 'task-pipeline'],
  // The precision this spends, probed rather than asserted. Prefix tolerance applies
  // only to stems of five letters or more, so `фикс` stays untouched and
  // «зафиксируй результат» — a different act in the same shape — keeps its silence.
  ['зафиксируй результат', ''],
  ['записал в блокнот', ''],

  // --- design references and style search ----------------------------------
  // Both packs carry this deeply — sheleg-design has a reference-sweep section and
  // DESIGN_SYNC_BRIDGE.md §4 telling Lazyweb, Mobbin and Refero apart by what each
  // returns; ux-flows has the parallel rule. The split follows §4's own sentence:
  // a sweep answers content and structure, never what it looks like.
  ['найди референсы дизайна', 'super-ux'],
  ['подбери референсы', 'super-ux'],
  ['find reference screens', 'super-ux'],
  ['нужны визуальные референсы', 'sheleg-design|super-ux'],
  ['какой style pack взять', 'sheleg-design'],
  // Refused by measurement rather than left undone: the bare `стиль` fires on
  // «стиль кода» and «стиль коммитов», `подбери стиль` on the same, and
  // `pick a style` on *pick a style guide for python*. Silence is the wanted answer.
  ['подбери стиль кода', ''],
  ['стиль коммитов', ''],
  ['pick a style guide for python', ''],

  // --- the visual layer ----------------------------------------------------
  ['поменяй палитру', 'sheleg-design'],
  ['сделай красиво', 'sheleg-design'],
  ['дизайн лендинга', 'sheleg-design'],
  ['сделай лендинг', 'sheleg-design|copywriting'],
  ['подбери шрифт', 'sheleg-design'],
  ['добавь анимацию на скролле', 'sheleg-design'],
  ['свёрстай дашборд', 'sheleg-design'],

  // --- text a user of the product reads ------------------------------------
  ['напиши текст для лендинга', 'copywriting'],
  ['перепиши описание', 'copywriting'],
  ['напиши пост в твиттер', 'copywriting'],
  ['текст ошибки для формы', 'copywriting'],
  ['звучит как нейросеть, перепиши', 'copywriting'],

  // --- whether a machine will find it --------------------------------------
  ['сделай seo-аудит', 'seo-llmo'],
  ['почему упал трафик', 'seo-llmo'],
  ['добавь schema markup', 'seo-llmo'],
  ['страница не индексируется', 'seo-llmo'],

  // --- work that changes the repository ------------------------------------
  ['добавь фичу экспорта в csv', 'task-pipeline'],
  ['почини баг с логином', 'task-pipeline'],
  ['отрефактори модуль оплаты', 'task-pipeline'],
  ['сделай миграцию базы', 'task-pipeline'],
  ['напиши тесты для этого модуля', 'task-pipeline'],
  ['подними версию и зарелизь', 'task-pipeline'],
  ['удали мёртвый код', 'task-pipeline'],
  ['почини доступность для скринридеров', 'task-pipeline'],

  // --- the construction of a skill ------------------------------------------
  ['сделай скилл', 'make-skill'],
  ['заверни в плагин', 'make-skill'],
  ['проверь скилл по стандарту', 'make-skill'],

  // --- who is holding this file ---------------------------------------------
  ['возьми задачу', 'agent-sync'],
  ['кто сейчас делает этот файл', 'agent-sync'],

  // --- what proves it --------------------------------------------------------
  ['запиши решение', 'evidence-docs'],
  ['чем это подтверждено', 'evidence-docs'],

  // --- no router owns these, and silence may well be right -------------------
  // Kept in the corpus so the decision stays visible rather than implicit: two
  // of them (accessibility, i18n) ARE first-class tags inside super-ux.
  ['проверь безопасность приложения', ''],
  ['настрой ci/cd', ''],
  ['подними инфраструктуру в докере', ''],
  ['добавь локализацию на испанский', ''],
  ['настрой мониторинг и алерты', ''],
  ['спроектируй схему базы данных', ''],

  // --- silence is the whole answer -------------------------------------------
  ['что делает этот модуль', ''],
  ['объясни как работает роутинг', ''],
  ['почему здесь так сделано', ''],
  ['сделай фичу, но без пайплайна', ''],
  ['поменяй палитру без дизайна', ''],
  ['напиши текст черновиком', ''],
];

const all = process.argv.includes('--all');
const pad = (s, n) => String(s).padEnd(n);

let ok = 0;
const missed = [];
const noise = [];

for (const [prompt, want] of CASES) {
  const got = T.match(prompt);
  const expect = want ? want.split('|') : [];
  const hit = expect.length === 0 ? got.length === 0 : got.some((g) => expect.includes(g));
  const row = [prompt, got.join(',') || '—', want || '(silence)'];
  if (hit) { ok += 1; if (all) console.log(`ok     ${pad(row[0], 46)} → ${row[1]}`); }
  else if (expect.length) missed.push(row);
  else noise.push(row);
}

for (const r of missed) console.log(`MISS   ${pad(r[0], 46)} got=${pad(r[1], 24)} want=${r[2]}`);
for (const r of noise) console.log(`NOISE  ${pad(r[0], 46)} got=${pad(r[1], 24)} want=${r[2]}`);

console.log(
  `\n${ok} named an expected route · ${missed.length} reached nothing expected · ` +
  `${noise.length} spoke where silence was right · ${CASES.length} prompts`
);

// --- why each remaining miss is still a miss -------------------------------
// The umbrella's `check_the_description_reserve_is_not_spent` used to DISCLOSE this
// split in a hand-typed sentence — *8 blocked, 10 not blocked* — and the sentence was
// wrong in both halves and in two of its four figures. It attributed 341 free
// characters to `super-ux`, whose route is fronted by `ux-flows` at 5, and 149 to
// `sheleg-dev`, fronted by `stripe-billing` at 7. A repository whose own rule is that
// a number is computed and not restated had restated one inside the guard for that
// rule. It is computed here, where the misses live and the route→skill map is one
// `require` away, and the guard now discloses only what it measures.
const HOUSE = 970;               // make-skill's house limit; 1024 is the standard's
const ROOM = 25;                 // a trigger phrase and its separator, at the floor
const descriptionLength = (ref) => {
  const [member, name] = ref.split('/');
  const base = path.join(__dirname, '..', 'skills', member, 'plugins');
  if (!fs.existsSync(base)) return null;
  for (const plugin of fs.readdirSync(base)) {
    const file = path.join(base, plugin, 'skills', name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const front = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(file, 'utf8'));
    if (!front) return null;
    // The same extraction the validator uses. A `$` under /m would stop at the first
    // line end and silently measure a multi-line description as one line — which is
    // `B-63`'s defect, and it was reproduced here once before this comment existed.
    // `$` is deliberately NOT used: under /m it means end of LINE, so a multi-line
    // description measures as its first line. Written as a warning in this comment and
    // then committed anyway on the first pass — `sheleg-dev` read 72 characters instead
    // of 963, which turned a blocked route into one with 898 free.
    const d = /^description:\s*(?:[>|]-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(front[1]);
    if (!d) return null;
    return d[1].replace(/\s+/g, ' ').trim().length;
  }
  return null;
};

const free = {};
for (const [route, entry] of Object.entries(T.ROUTES)) {
  const n = descriptionLength(entry.skill);
  if (n !== null) free[route] = HOUSE - n;
}

if (Object.keys(free).length < 2) {
  console.log('\nreserve split — fewer than two members are materialised; not measured');
} else {
  let blocked = 0;
  const openRows = [];
  for (const r of missed) {
    const routes = String(r[2]).split('|').filter((x) => free[x] !== undefined);
    if (!routes.length) continue;
    const best = Math.max(...routes.map((x) => free[x]));
    if (best >= ROOM) openRows.push([r[0], routes.map((x) => `${x}=${free[x]}`).join(' ')]);
    else blocked += 1;
  }
  console.log(
    `\nreserve split — ${blocked} of ${missed.length} misses are blocked by the 970 ` +
    `reserve (no expected route has ${ROOM} characters free); ${openRows.length} are not`
  );
  for (const [prompt, why] of openRows) console.log(`  free   ${pad(prompt, 46)} ${why}`);
}
