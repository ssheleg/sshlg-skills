'use strict';
/**
 * The routers — one entry per router, and the only place one is declared.
 *
 * Before this file the text lived in `router-texts.js` and the precedence row
 * in `routers.js`. Nothing compared the halves, so a router could exist in one
 * and be missing from the other with both files syntactically perfect. At
 * three routers that is survivable; at eight it is a scheduled bug. An entry
 * now carries everything a router is: what it needs installed, its two table
 * cells, and its text.
 *
 * **Key order is table order.** One place, one order, nothing to keep in sync.
 *
 * Each text carries four things, and `router_texts_test.js` checks all of
 * them: the rule, the boundary in BOTH directions, the refusal phrase, and one
 * sentence placing it against its nearest neighbours. A router without a
 * boundary swallows everything and gets routed around within a week.
 *
 * **`requires: []` means the rule is not a skill.** Two of these are rules
 * that hold whether or not anything is installed — evidence, and designing for
 * the machine that will quote you. They were the reason a router stopped being
 * a property of a member.
 *
 * The place-sentence names only NEIGHBOURS, never the full list: with eight
 * routers an enumeration in every text is eight copies of one ordering, and
 * the table already renders that ordering from the sections that survived.
 */

const SUPER_UX = `**Если \`super-ux\` установлен, любая работа над продуктом и его интерфейсом
идёт через цепочку** — сначала сценарии и их валидация, потом интерфейс. Это
касается не только экранов: продуктовые решения, воронки, онбординг, шаги
оплаты — всё, у чего есть пользователь и путь. \`docs/ux/scenarios.md\` —
источник правды для user-facing поведения; файла нет → предложи \`/ux\` до
работы над UI. Изменение user-facing поведения обновляет сценарии тем же
изменением. Проверка кода против сценариев — \`/ux-audit\`, с доказательствами
\`file:line\`.

**Граница — «у этого есть пользователь».** НЕ через цепочку: внутренние
скрипты, миграции без интерфейса, работа с данными, инфраструктура. Рисовать
сценарий для cron-джобы — способ научить обходить цепочку стороной.

**Фраза отказа: «без сценариев».**

**Место среди роутеров:** super-ux решает, что интерфейс должен делать;
\`sheleg-design\` — как это выглядит; \`copywriting\` — как это звучит.`;

const SHELEG_DESIGN = `**Если \`sheleg-design\` установлен, визуальный слой идёт через него** — токены и
темы, типографика и ритм, движение и его деградация до покоя, визуальный язык
бренда, граница с Figma (токены как переменные, дизайн в код без переноса сырых
значений). Кинематографичный лендинг, дашборд, админка, интерфейс агента — один
и тот же слой.

**Граница — «решается, КАК это выглядит».** НЕ через него: чисто структурная
правка (что где стоит — это \`super-ux\`), текст (это \`copywriting\`), бэкенд,
внутренние скрипты без интерфейса. Подбирать палитру для парсера логов — способ
научить обходить его стороной.

**Фраза отказа: «без дизайна» или «как есть».**

**Место среди роутеров:** \`super-ux\` решает, что интерфейс должен делать;
sheleg-design — как это выглядит и движется. Вайрфрейм — к первому, визуал
поверх него — ко второму.`;

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

**Место среди роутеров:** \`sheleg-design\` решает, как это выглядит;
copywriting — как это звучит. Лендинг проходит оба и ещё \`task-pipeline\`;
пост в соцсеть — только copywriting, репозиторий он не меняет.`;

const SEO_LLMO = `**Любая публичная веб-поверхность проектируется сразу для двух читателей** —
человека и машины, которая её процитирует. Решается НА ПРОЕКТИРОВАНИИ, а не
аудитом постфактум: URL и иерархия, один вопрос — одна страница, ответ
извлекаем без исполнения JS, разметка и сущности, факты с единым домом,
внутренние ссылки как объяснение структуры. Переделывать это после запуска
дороже, чем решить сразу — адреса уже разошлись по ссылкам и индексам.
Проверка постфактум — \`/seo-aeo-audit\`, и она проверяет, а не проектирует.

**Граница — «это увидит незалогиненный читатель или краулер».** НЕ через
правило: интерфейс за логином, админки, внутренние инструменты, CLI, скрипты.
Оптимизировать под выдачу экран настроек биллинга — способ научить меня
пропускать правило там, где оно работает.

**Фраза отказа: «без SEO».**

**Место среди роутеров:** \`copywriting\` решает, как это звучит; seo-llmo —
найдёт ли это машина. Оба нужны лендингу; ни один — внутренней панели.`;

const EVIDENCE_DOCS = `**Утверждение без доказательства — не документация.** Каждый факт, который
уезжает в документ, несёт свой чек: \`file:line\`, команду и её вывод, имя
теста. Число — вычисленное, а не пересказанное; имя файла, команды или флага —
разрешимое. «Доки в синхроне» — команда с кодом выхода, а не фраза в конце
отчёта. Документация едет ТЕМ ЖЕ изменением, что и код: следующим тикетом она
не едет никогда.

**Граница — «это будет прочитано как истина».** НЕ через правило: черновик,
рассуждение вслух, ответ в чате, коммит-сообщение, комментарий в коде.
Требовать ссылку на строку в реплике «сейчас посмотрю» — способ научить меня
игнорировать правило там, где оно защищает.

**Фраза отказа: «без доков» или «на словах».** Работает на задаче, которая по
границе прошла бы через правило: говорю прямо, что документ не подкреплён, а
не выдаю оценку за измерение.

**Место среди роутеров:** \`task-pipeline\` решает, как изменение доедет до
репозитория; evidence-docs — чем доказано то, что о нём написано.`;

const TASK_PIPELINE = `**Если \`task-pipeline\` установлен, любая работа, которая МЕНЯЕТ РЕПОЗИТОРИЙ,
идёт через него** — без отдельной просьбы. Фича, фикс, рефактор, миграция,
интеграция, переписывание, внедрение, харденинг; на любом языке и любыми
словами. **Планирование этой работы — часть пайплайна, а не отдельный цикл:**
брейншторм, спека и план — это его стадии 2–4, и отдельного планировочного
маршрута рядом с ним не существует.

**Граница — «меняет репозиторий», и она в обе стороны.** НЕ через пайплайн:
вопрос и ответ на него, объяснение, чтение и разбор кода; опечатка,
однострочная правка, механическое переименование; разведка и измерение,
которые ничего не коммитят. Прогонять десять стадий ради одного символа — самый
быстрый способ научить обходить пайплайн стороной.

**Фраза отказа: «без пайплайна» или «quick».** Пограничный случай — называю,
каким путём иду, одной строкой, а не выбираю молча.

**Место среди роутеров:** \`super-ux\` решает, что интерфейс должен делать;
task-pipeline — как изменение доедет до репозитория. Первый отвечает за
содержание, второй за доставку.`;

const MAKE_SKILL = `**Если \`make-skill\` установлен, работа НАД скилом или плагином идёт через
него** — создать, привести к стандарту, проверить на соответствие, обернуть в
плагин, синхронизировать версии, поставить валидатор и CI, опубликовать в
каждый канал. Он знает, где у Agent Skills лимиты фронт-маттера, что требует
\`claude plugin validate --strict\` и почему plain-копия в \`~/.claude/skills/\`
затеняет плагин.

**Граница — «меняется устройство самого скила».** НЕ через него: работа С
ПОМОЩЬЮ скила, обычный код в обычном репозитории, правка доктрины внутри уже
стандартного скила. Звать его, чтобы поправить абзац в \`SKILL.md\`, — способ
научить обходить его стороной.

**Фраза отказа: «без make-skill».**

**Место среди роутеров:** \`task-pipeline\` ведёт изменение по стадиям;
make-skill отвечает за то, соответствует ли результат стандарту скила. Релиз
скила проходит оба.`;

const AGENT_SYNC = `**Если \`agent-sync\` установлен И в проекте есть \`.claude/agent-sync.json\`,
общие реестры правятся только под заявкой** — решения, открытые вопросы,
роадмап, воркстримы, зависимости. Заявка берётся ДО правки, id резервируется
race-free, прогон журналируется. Это работает, даже когда про координацию никто
не спрашивал: незаявленная правка общего файла — это способ, которым два агента
затирают друг друга.

**Граница — «файл в проекте, где включена координация».** НЕ через него:
проект без \`.claude/agent-sync.json\`, обычные файлы кода, работа в одиночку.
Брать лизу на правку README в репозитории, где ты один, — способ научить
обходить его стороной.

**Фраза отказа: «без координации».**

**Место среди роутеров:** \`task-pipeline\` решает, как изменение доедет до
репозитория; agent-sync — кто прямо сейчас держит этот файл. Второй нужен
только там, где агентов больше одного.`;

/**
 * name -> { requires, answers, when, text }.
 *
 * Order: the first five say what the change CONTAINS, the sixth how it
 * reaches the repository, the last two are about the tooling itself.
 */
const REGISTRY = {
  'super-ux': {
    requires: ['super-ux'],
    answers: 'что интерфейс должен делать',
    when: 'есть user-facing поведение',
    text: SUPER_UX,
  },
  'sheleg-design': {
    requires: ['sheleg-design'],
    answers: 'как это выглядит и движется',
    when: 'есть визуальный слой',
    text: SHELEG_DESIGN,
  },
  copywriting: {
    requires: ['super-ux'],
    answers: 'как это звучит',
    when: 'есть текст, который увидит пользователь продукта',
    text: COPYWRITING,
  },
  'seo-llmo': {
    requires: [],
    answers: 'найдёт ли это машина',
    when: 'поверхность видна незалогиненному читателю',
    text: SEO_LLMO,
  },
  'evidence-docs': {
    requires: [],
    answers: 'чем это доказано',
    when: 'что-то утверждается как истина',
    text: EVIDENCE_DOCS,
  },
  'task-pipeline': {
    requires: ['task-pipeline'],
    answers: 'как изменение доедет до репозитория',
    when: 'изменение касается репозитория',
    text: TASK_PIPELINE,
  },
  'make-skill': {
    requires: ['make-skill'],
    answers: 'как устроен сам скил',
    when: 'меняется устройство скила или плагина',
    text: MAKE_SKILL,
  },
  'agent-sync': {
    requires: ['agent-sync'],
    answers: 'кто сейчас держит этот файл',
    when: 'в проекте включена координация агентов',
    text: AGENT_SYNC,
  },
};

/** Every router name, in table order. */
function order() {
  return Object.keys(REGISTRY);
}

/** Table rows for the names present, in registry order. Never a hand-kept list. */
function rows(names) {
  const present = names || [];
  return order()
    .filter((name) => present.includes(name))
    .map((name) => [name, REGISTRY[name].answers, REGISTRY[name].when]);
}

/** Are this router's required members all installed? */
function available(name, installed) {
  const entry = REGISTRY[name];
  if (!entry) return false;
  return entry.requires.every((m) => (installed || []).includes(m));
}

/**
 * The routers that belong in the block: required members installed AND not
 * switched off. `isEnabled` is injected rather than imported so this module
 * stays free of the filesystem, like `routers.js` beside it.
 */
function resolve(opts) {
  const o = opts || {};
  const enabled = o.isEnabled || (() => true);
  const out = {};
  for (const name of order()) {
    if (!available(name, o.installed)) continue;
    if (!enabled(name)) continue;
    out[name] = REGISTRY[name].text;
  }
  return out;
}

/**
 * The routers that must be REMOVED from the block: known, available, and
 * switched off.
 *
 * A router whose member is not installed is not "off" — there is no section
 * to remove, and reporting one would make every uninstalled member look like
 * a deliberate refusal.
 */
function disabled(opts) {
  const o = opts || {};
  const enabled = o.isEnabled || (() => true);
  return order().filter((name) => available(name, o.installed) && !enabled(name));
}

module.exports = { REGISTRY, order, rows, available, resolve, disabled };
