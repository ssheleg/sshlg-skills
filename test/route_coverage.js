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

const T = require('../lib/triggers.js');

const CASES = [
  // --- growth: funnels, activation, retention, paywalls -------------------
  // Every one of these is territory the super-ux router text claims in
  // `lib/routers-registry.js` ("product decisions, funnels, onboarding,
  // payment steps") and knowledge the pack genuinely carries.
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

  // --- money, tracking, sign-in, speed ------------------------------------
  ['подключить stripe', 'sheleg-dev'],
  ['добавь оплату подпиской', 'sheleg-dev'],
  ['настрой meta pixel', 'sheleg-dev'],
  ['вход через google', 'sheleg-dev'],
  ['ускорить сайт', 'sheleg-dev'],
  ['сайт медленно грузится', 'sheleg-dev'],

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
