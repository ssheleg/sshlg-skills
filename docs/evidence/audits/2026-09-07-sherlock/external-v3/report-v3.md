<sub>ssheleg skills — make-skill · evidence-docs · sheleg-design · task-pipeline</sub>

# Внешние знания и декомпозированный план v3

Аудит семи ссылок охватил шесть репозиториев. Сохранили все **119 исходных родительских задач**, добавили **20 новых**, ещё **14 предложений встроили в существующие**. Получилось **139 parents и 254 небольших leaf-задач**. Parent — цель и общая приёмка; агент получает leaf с одним outcome, связанным контекстом и конкретными targets. [План JSON](plan.json), [проверка](plan-validation.json), [соответствие предложений](proposal-resolution.json).

Это план разработки и подготовленные локальные изменения инструкций. Все runtime fixes, actual host handoff, comparative model eval и release остаются открытыми. Написанная инструкция не объявляется измеренным улучшением дизайна.

## Что переносить и что исключить

| Источник | Проверенный срез | Полезное для семьи | Что не переносим |
|---|---|---|---|
| julianoczkowski/designer-skills | 8 skills, все тела прочитаны | Учитывать существующие components; reuse/modify/create; маленькие вертикальные outcomes; ранняя проверка визуального риска; trace brief → review | Второй `.design` store, обязательное повторное интервью, выбор brief по mtime, blanket mobile/dark defaults и противоречащие vertical slice шаблоны «Foundation → Core → Interactions» |
| pbakaus/impeccable | 1 логический umbrella skill + 23 command references; семантические границы пофайлово | Типографические роли; осмысленная композиция/плотность; проверка screenshot state; критика actual render; resolved/partial/unresolved после исправления; native/stress методы | Launcher/binary, context/concept/live runtime, обязательные seed/cards/raster/fonts/imagegen и стилевые запреты. Существующие render tools остаются достаточным путём |
| Owl-Listener/designer-skills | 111 локальных skills и 34 commands; 37 skill bodies прочитаны полностью | Research provenance, конфликтующие наблюдения, criteria-first concept comparison, walkthrough, handoff состояния/props/tokens/a11y | Marketplace автоматически тянет внешние git-subdir entries: 24 ссылки на 4 других repo не считаются проверенными payload. pnpm/bootstrap/CDN/assets не переносятся |
| anthropics/skills | 19 skills + template; 6 skill bodies полностью и выбранные auxiliary files | Progressive disclosure, output-based eval, разделение tuning/holdout, явные units/outcome states, fresh-reader метод | Document helpers с ограниченными условиями копирования; обязательный Claude CLI/чужие scripts; ошибочные trigger/benchmark/statistical assumptions |
| composio-community/awesome-codex-skills | 880 skills, включая 832 automation entries | Отдельные packaging/resource-closure counterexamples и проверка promises против scripts; полезные authoring/eval идеи в ограниченном scope | 832 automation имеют MCP signals в scan и исключены из dependency-free baseline; огромный SaaS каталог, login/keys/MCP, отсутствующие references и слабый quick validator |
| openai/skills, curated | 39 curated entries; совместный detailed platform audit ниже | CLI result semantics, browser-state claims, evidence limitations, scoped security/research/eval patterns | Deprecated repo не принимается за актуальную платформенную норму. Figma terms и provider-specific runtimes не копируются; credentials/SDK остаются optional вне core |

Источники таблицы и точные commits: [Impeccable/Juliano](design-sources.md), [Owl/Anthropic](method-sources.md), [Composio/OpenAI](platform-sources.md). Это полный inventory с выборочным глубоким чтением подходящих кандидатов, **не семантический аудит каждого из 1000+ тел**. По Composio/OpenAI полностью прочитаны 16 bodies, 4 — выбранными разделами, 899 — только scan; эти границы сохранены в каждой карточке. Генерируемые host copies, шаблоны и commands не выдаются за независимые уникальные skills.

## Почему прямое копирование ухудшило бы setup

Актуальный Impeccable — уже не только набор markdown-подсказок. В reviewed closure есть исполняемый launcher, services и генерируемые ресурсы. Копирование umbrella подключило бы его собственную систему выбора direction и обязательные gates поверх семейной. Мы берём локальные методы type/layout/review, а route и артефакты сохраняем свои. [Runtime closure и исключения](design-sources.json).

В отдельно запрошенном Composio `skill-creator` есть PyYAML, две несуществующие promised references и различие между обещаниями проверки и `quick_validate`. Упаковка требует отдельной проверки symlink/resource scope. Его нельзя использовать как замену make-skill только потому, что имя совпадает. Counterexamples перенесены в приёмку MS/ED задач. [Deep reviews](platform-sources.md).

В Anthropic skill-creator audit выявил error→false в trigger eval, способный дать PASS отрицательному case; использование tuning test для выбора лучшей версии; output chars под именем tokens и другие ограничения aggregation. Эти методы разложены на полезную процедуру и дефектную реализацию. Сами scripts не запускались и не копировались. [EXT-M findings](method-sources.md).

Открытая публикация репозитория не является единой лицензией на все файлы. В platform inventory 862 entries не имеют обнаруженной skill/root license, 8 имеют Figma Developer Terms/Beta, остальные — указанные в sidecar Apache/MIT. Отсутствие license — причина не копировать материал, не утверждение о злонамеренности. Для Anthropic document skills применены reference-only решения; Owl font binaries и их происхождение не считаются проверенными assets. [License records](method-sources.json), [platform license inventory](platform-sources.json).

## Единая архитектура применения

External snapshot → provenance/license/dependency review → решение adapt/reference/optional/reject → локальная bounded method → существующий family owner → isolated coexistence/outcome tests → versioned release.

| Работа | Единственный основной owner | Связанные outputs |
|---|---|---|
| Goals, IA, flows, evidence и walkthrough | super-ux | scenario/screen/state IDs, research ledger, bounded interactive graph |
| Typography, composition, native adaptation, render critique | sheleg-design | chosen direction, semantic roles, stateful captures, specific findings |
| Text states и semantic preservation | copywriting внутри super-ux | strings и факты, связанные с теми же scenario IDs |
| External intake, portability, authoring | make-skill | source/digest/license/dependency decisions; closed required references |
| Decomposition, packets, execution profile | task-pipeline | parent → leaf, exact targets, inputs/outputs, freshness и acceptance |
| Behavioral measurement и factual claims | agent-evals / evidence-docs | frozen corpus, raw outcomes, correct units, limitations |
| Installation/update/discovery | sshlg-skills и host adapters | desired/installed/active bytes и scoped transaction receipts |

Новые внешние global routers не добавляются. Небольшие visual operations оформляются режимами существующего sheleg-design; при необходимости новый reference загружается условно. Один проект не получает параллельные `DESIGN.md`, `.design/`, brand и планирующие stores лишь ради чужого skill. Не импортируются абсолюты вроде запрета одного font family или требования тёмной темы на любой поверхности.

## Что уже изменено в исходниках

1. **task-pipeline:** правила leaf sizing и primary/appendix context в `decomposition.md`; ссылка из planning; cold-start contract и UI annex с reuse/modify/create, state IDs, tokens/content/a11y/assets. Material unknown становится ограниченной decision task; это не разрешение выдумать ответ.
2. **make-skill:** selective adoption в existing enterprise reference и load trigger в SKILL. Отдельно knowledge/runtime, terms, required/optional capabilities, network/assets/keys и clean transfer decisions.
3. **sheleg-design:** focused Type/Composition/State adaptation/Finish внутри существующего skill, capture validity, чистый stop и отсутствие внешнего runtime. Исправлено правило, считавшее любое component edit редизайном. Cursor copy синхронизирована.
4. **super-ux:** предыдущие локальные изменения clickable flow recommendation сохранены в cumulative patch; новые research/stress/a11y методы пока находятся в плане.

Все правки — в isolated worktrees; основные checkout не переписаны и установленные агенты не обновлены. [Cumulative patches и source bases](patches/manifest.json). Никакие foreign binaries/scripts/installers не выполнялись; новых обязательных packages, keys или MCP configs не добавлено.

## Как устроена декомпозиция

У leaf есть why, fixed decisions, exact Edit/Create targets, source windows/hashes, concrete steps, expected result, positive/negative acceptance, inputs, typed dependencies, outputs, rollback и exclusions. Широкий родительский отчёт вынесен в appendix; материализуется только нужный контекст. Если предыдущая задача создаёт файл, downstream получает `Edit_from_predecessor` и новый digest вместо второго независимого Create.

Из исходных 119 parents не потерян ни один. Маленькая factual correction может быть одним leaf; крупные update/authority/packet/eval задачи разбиты по независимым outcomes. Тест и необходимые docs идут вместе с outcome, а не превращаются в обязательные отдельные фазы. Задача «схема» проверяет схему; конкурентный claim проверяется там, где реализован coordinator. Persistence decision предшествует соответствующим writes. Новые knowledge proposals не создают дублирующий compiler или review cycle.

Пример: `FIX-UP-05` разделён на общий transaction writer, task-pipeline adapter, design adapter и recovery checks. Два adapter tasks используют один contract и не получают право редактировать чужой installer. `CTX-02` разделён на mapping findings, leaf compiler, relocatable bundle и pre-dispatch freshness/budget. `FIX-EV-01` содержит общий harness/schema и отдельный corpus для каждого из 28 family skills, с собственными исходными failure cases.

Выбранный для этого плана primary budget — **24KiB UTF-8**, не универсальное ограничение модели. Текущий максимум **14961 bytes**, максимум измерения primary artifact в `o200k_base` — **3449 tokens**. Эти числа не включают весь host system prompt, инструменты и ещё не произведённые predecessor outputs. Перед dispatch нужен новый materialization и измерение реального assembled prompt. При превышении бюджет решается декомпозицией, а не усечением acceptance.

Устранить всякое инженерное суждение невозможно. План должен убрать повторное принятие material decisions, а не заставить агента молча следовать устаревшему решению. Новый counterexample возвращается владельцу решения и порождает новую revision. Ни одна leaf сейчас не названа production-ready или completed.

## Приоритеты и последовательность

1. **Независимые критические исправления:** destructive dry-run/prune, money/auth/claim defects. Их не задерживает перенос визуальных методов.
2. **Контракты и bounded planning:** CTX-01/02, source intake, evidence/holdout semantics; принять подготовленные doctrine patches и проверить them in use.
3. **Визуальное качество и UX:** typography/composition/capture checks, state stress, research provenance и UI handoff, с actual render cases. Визуальная ветка идёт параллельно независимым runtime fixes.
4. **Execution/Fabric/update integration:** authority/proof/graph semantics, portable packets, provider adapters и transaction recovery после своих prerequisites.
5. **Итоговая acceptance/release:** реальные host loads, independent-session handoff, with/without-skill outputs, integrated parent criteria, staged install/update/rollback. Полный результат достигается по receipts и bounded corpus, не по числу текстовых правил.

Расчёт содержит 49 волн при консервативной блокировке repository integration. Это порядок зависимостей при условном неограниченном числе работников, не обещание сроков. Реальный coordinator ограничивает concurrency по доступным агентам и точным resource claims. [Wave manifest](plan-manifest.json).

## Проверки и ограничения

Проверены ссылки, hashes, parent/leaf mapping, DAG, первичный context budget и специфические ошибки compiler, обнаруженные независимым review. Отдельно выполнены 12 негативных проверок контракта: missing decision, duplicate/cycle/unknown dependency, превышение budget, подмена hashes, false done, model override, parent coverage/dispatch и untyped edge. [Результат](plan-contract-tests.json). Repo validators проверяют подготовленные instructions и generated copies; они не доказывают качество будущего model output. [Итоговая проверка](final-validation.json), [review](independent-plan-review.json), [проверки интерфейса отчёта](report-ui-validation.json).

Два прежних read-only Nicegram reference файла больше недоступны. Их locators и digests сохранены как historical evidence в VD-03, но удалены из обязательного execution context; наблюдения о них не объявляются текущими. Это не файлы семейных пакетов и не внешние source repos этого аудита.

Шесть source repos закреплены на commits и оставлены неизменными после clone. Внешние scripts — NOT_RUN; ручное чтение и static scan не доказывают их runtime безопасность. Live model A/B, actual cross-host install и Fabric runtime этой итерацией не выполнялись. Все такие проверки имеют своё место в итоговом плане.

## Подробные материалы

- [Impeccable и Juliano — все решения и источники](design-sources.md).
- [Owl и Anthropic — исследование, eval, a11y, handoff](method-sources.md).
- [Composio, skill-creator и OpenAI curated](platform-sources.md).
- [План JSON](plan.json), [leaf CSV](development-plan.csv), [краткий индекс задач](development-plan.md).
- [Предыдущий аудит всех family skills](../report.html), [v2 архитектура/Fabric/update](../extension/report-v2.html).

Фактически применены make-skill (отбор/зависимости), evidence-docs (provenance и границы), sheleg-design (visual methods), task-pipeline (декомпозиция/контекст). Внешние skills были предметом анализа, их инструкции не получали право управлять этой задачей.


**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — отбор внешних методов и зависимостей
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — provenance и доказательства
- [`sheleg-design`](https://github.com/ssheleg/sheleg-design-skill) — визуальные методы и критика
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — декомпозиция и контекст исполнителя

<sub>A star on [the bundle](https://github.com/ssheleg/sshlg-skills) helps.</sub>
