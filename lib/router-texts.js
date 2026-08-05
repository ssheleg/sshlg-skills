'use strict';
/**
 * The packaged router texts.
 *
 * These are defaults, not the truth. Where the operator already wrote a rule
 * by hand, migration moves their wording in and these are never used — a rule
 * someone wrote in their own words is followed, and a rule that arrived as
 * boilerplate is skimmed.
 *
 * Each text carries four things, and the fixtures check for all of them: the
 * rule, the boundary in both directions, the refusal phrase, and one sentence
 * placing it against the other routers. A router without a boundary swallows
 * everything and gets routed around within a week.
 */

const SUPER_UX = `**Если \`super-ux\` установлен, любая работа с пользовательским интерфейсом
идёт через цепочку** — сначала сценарии и их валидация, потом интерфейс.
\`docs/ux/scenarios.md\` — источник правды для user-facing поведения; файла нет
→ предложи \`/ux\` до работы над UI. Изменение user-facing поведения обновляет
сценарии тем же изменением. Проверка кода против сценариев — \`/ux-audit\`, с
доказательствами \`file:line\`.

**Граница — «у этого есть пользователь».** НЕ через цепочку: внутренние
скрипты, миграции без интерфейса, работа с данными, инфраструктура. Рисовать
сценарий для cron-джобы — способ научить обходить цепочку стороной.

**Фраза отказа: «без сценариев».**

**Место среди роутеров:** super-ux решает, что интерфейс должен делать;
\`copywriting\` — как это звучит; \`task-pipeline\` — как изменение доедет до
репозитория.`;

const COPYWRITING = `**Если \`super-ux\` установлен, любой текст, который увидит пользователь
продукта, пишется через \`copywriting\`** — строки интерфейса, ошибки, пустые
состояния, лендинг, цены, блог, changelog для пользователей, посты, описание в
сторе, объявления, письма. Первым действием скил читает бренд-пак
(\`docs/brand/voice.md\`, \`terminology.md\`, \`facts.md\`); пака нет →
\`/brand-init\` до письма, а не после.

**Граница — «отгружается пользователю продукта».** НЕ через скил: коммиты и
описания PR, комментарии в коде, README для разработчиков, внутренние доки,
ответы в чате. Прогонять брендбук ради строки в CHANGELOG для разработчиков —
самый быстрый способ научить меня обходить его стороной.

**Фраза отказа: «без бренда» или «черновиком».** Работает на задаче, которая
по границе прошла бы через скил: пишу напрямую и говорю вслух, что бренд-пак
пропущен по просьбе, а не молча.

**Место среди роутеров:** \`super-ux\` решает, что интерфейс должен делать;
copywriting — как это звучит; \`task-pipeline\` — как изменение доедет до
репозитория. Лендинг проходит все три; пост в соцсеть — только copywriting,
репозиторий он не меняет.`;

const TASK_PIPELINE = `**Если \`task-pipeline\` установлен, любая работа, которая МЕНЯЕТ РЕПОЗИТОРИЙ,
идёт через него** — без отдельной просьбы. Фича, фикс, рефактор, миграция,
интеграция, переписывание, внедрение, харденинг; на любом языке и любыми
словами.

**Граница — «меняет репозиторий», и она в обе стороны.** НЕ через пайплайн:
вопрос и ответ на него, объяснение, чтение и разбор кода; опечатка,
однострочная правка, механическое переименование; разведка и измерение,
которые ничего не коммитят. Прогонять десять стадий ради одного символа — самый
быстрый способ научить обходить пайплайн стороной.

**Фраза отказа: «без пайплайна» или «quick».** Пограничный случай — называю,
каким путём иду, одной строкой, а не выбираю молча.

**Место среди роутеров:** \`super-ux\` решает, что интерфейс должен делать;
\`copywriting\` — как это звучит; task-pipeline — как изменение доедет до
репозитория.`;

/** Skill name in `skills.json` → the router it contributes. */
const BY_MEMBER = {
  'super-ux': { 'super-ux': SUPER_UX, copywriting: COPYWRITING },
  'task-pipeline': { 'task-pipeline': TASK_PIPELINE },
};

/** The routers contributed by the members actually installed. */
function forMembers(names) {
  const out = {};
  for (const name of names || []) {
    Object.assign(out, BY_MEMBER[name] || {});
  }
  return out;
}

module.exports = { SUPER_UX, COPYWRITING, TASK_PIPELINE, BY_MEMBER, forMembers };
