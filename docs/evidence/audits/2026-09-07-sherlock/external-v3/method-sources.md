# Внешние методики: Owl Designer Skills и Anthropic Skills

Срез исходников закреплён commit SHA. Это read-only аудит пригодности к переносу; ни один внешний скилл не установлен, ни один его скрипт не запускался. Все задачи ниже — предложения, не завершённая интеграция.

## Вывод

Переносить стоит небольшой набор методов внутрь уже существующих владельцев: super-ux — research/поведение; sheleg-design — художественное решение/визуальная проверка; make-skill + agent-evals — проверка пользы; task-pipeline — сохранённый контекст и handoff. Внешние команды не становятся вторым маршрутом. Простой путь работает с локальными Markdown/JSON/HTML и уже доступными инструментами, без новых обязательных зависимостей, сервисов и API-ключей.

## Версии и границы

- [owl-designer](https://github.com/Owl-Listener/designer-skills/tree/9a6930cf84a822eb458624bd11c61aac5bbdf224): `9a6930cf84a822eb458624bd11c61aac5bbdf224`, commit date `2026-09-05T15:32:50Z`. Локально: https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224.
- [anthropic](https://github.com/anthropics/skills/tree/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f): `41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f`, commit date `2026-09-03T09:37:13-07:00`. Локально: https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f.

Подсчитано: Owl 111 SKILL.md + 34 команд в9localplugins; marketplace содержит ещё24plugin refs на4другихrepo. Их содержимое не входит в этот audit и число273 изREADME не является числом прочитанных здесьskills. Anthropic19skills +1template;0commands.

Полностью прочитаны 37 Owl skill bodies и6 Anthropic bodies; остальные перечислены с уровнем scan. Skill-creator: полностью прочитаны 3agent instructions, schemas, run_loop/run_eval/improve_description/aggregate_benchmark. Webapp-testing: body, helper,3examples. Более широкая transitive execution closure не объявляется проверенной. Ни helper scripts, ни user trials не запускались. Риски ниже доказаны чтением исходников; production occurrence неизвестен.

## Лицензии и зависимости

Owl: MIT, copyright MC Dean; при переносе существенного текста сохранять copyright и разрешительную часть. Локальные методики — преимущественно короткий Markdown, без обязательных MCP/API keys. Figma, исследовательские хранилища и AT упоминаются как инструменты/источники, их упоминание не означает обязательную установку. Python/PyYAML относится к repo maintenance, не к применению самих методов.

Anthropic:14skills содержат Apache-2.0;4document skills source-available с запретами копирования/derivatives/distribution. doc-coauthoring и template не имеют локальной декларации лицензии; root LICENSE не найден. Их текст не переносить. Canvas fonts имеют отдельные OFL notices; шрифты в предлагаемый перенос не входят. Полный список с hashes — JSON/licenses. Source URL сам по себе не является лицензией на копирование.

Original skill-creator optimization использует Python + authenticated claude -p: новый API key не требуется, но CLI/аккаунт/сеть/расход провайдера остаются зависимостями. Их не делать обязательными. UI testing через уже доступный browser adapter; внешний Playwright helper не переносить. React/Parcel/Radix bootstrap, CDN p5.js и обязательный font download исключить.

## Конкретные проблемы, которые нельзя импортировать

### EXT-M-01 — Owl marketplace fanout не равен изученной локальной коллекции

Наблюдение: Из 33 записей9local;24git-subdir с4URL, без commit pin. В clone111SKILL/34commands.
Риск: Blind install расширяет dependency/review scope; 273 нельзя обозначать как прочитанные.
Исправление при адаптации: Переносить выбранные методики по pinned SHA, не plugin marketplace.
Приёмка: Inventory distinguishes local111 and external24plugin references; no installs/network needed by adopted core.
Источники: [.claude-plugin/marketplace.json:65](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/.claude-plugin/marketplace.json#L65); [owl-designer/README.md:5](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/README.md#L5).
Связь с исходным аудитом: новая граница внешнего переноса.

### EXT-M-02 — Лицензии Anthropic неоднородны; doc-coauthoring без локального LICENSE

Наблюдение: 4document skills имеют restrictive text;14skills Apache-2.0; doc-coauthoring и template без локального license, root LICENSE отсутствует. Font OFL notices отдельные.
Риск: Копирование целого repo/prompts/fonts в family не имеет единой разрешительной основы.
Исправление при адаптации: Apache/MIT adaptations с provenance/license notices; restricted/unclear только ссылка/описание назначения, без переноса текста/кода/assets.
Приёмка: Every transferred file/section maps to source SHA, license and modifications; zero restricted document files or unreviewed fonts in distribution.
Источники: [docx/LICENSE.txt:13](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/docx/LICENSE.txt#L13); [anthropic/README.md:20](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/README.md#L20); [skill-creator/LICENSE.txt:90](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/LICENSE.txt#L90).
Связь с исходным аудитом: новая граница внешнего переноса.

### EXT-M-03 — Trigger eval сбой превращает в успешный отрицательный пример

Наблюдение: Exceptions append False; negative expectation passes trigger_rate<0.5. Timeout/nonzero/malformed stream также не отдельный outcome; первый посторонний tool немедленно False.
Риск: Ошибка auth/CLI или tool-before-skill выглядит хорошим routing; это не task completion.
Исправление при адаптации: Typed outcomes PASS/FAIL/TEST_ERROR/NOT_RUN; full bounded trace observation; isolate skill registry; report selection and execution separately.
Приёмка: Missing CLI/auth/timeout/nonzero never increases true-negative score; legitimate Read-before-Skill recognized; no actor writes project command registry.
Источники: [scripts/run_eval.py:223](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/run_eval.py#L223); [scripts/run_eval.py:231](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/run_eval.py#L231); [scripts/run_eval.py:133](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/run_eval.py#L133).
Связь с исходным аудитом: EV-01, UX-05.

### EXT-M-04 — Held-out test используется для выбора winner

Наблюдение: Improvement prompt blind к test (good), но итоговая версия=max(test_passed) из повторяемых iterations. Split/matching по query text; дубликаты могут пересечь группы.
Риск: Reported best_test_score selection-biased; не независимая финальная оценка generalization.
Исправление при адаптации: Train/validation дляподбора + untouched final test; unique case IDs and grouping by source/prompt family; frozen model/seed/budget.
Приёмка: Holdout inspected exactly once after winner frozen; duplicate source groups cannot cross splits; report sample/run counts and uncertainty.
Источники: [scripts/run_loop.py:194](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/run_loop.py#L194); [scripts/run_loop.py:216](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/run_loop.py#L216); [skill-creator/SKILL.md:394](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/SKILL.md#L394).
Связь с исходным аудитом: AS-08, EV-01.

### EXT-M-05 — Benchmark units/schema/counts искажаются

Наблюдение: Flat documented with_skill/grading.json skipped because no run-*; missing metrics=>0; output_chars assigned tokens; runs_per_configuration=3 hardcoded; first2 sorted configs determine delta sign. SKILL assertions vs schemas expectations mismatch.
Риск: Пустой benchmark/фиктивная экономия/обратный delta и неверный n могут выглядеть реальным улучшением.
Исправление при адаптации: Versioned JSON Schema; explicit candidate/baseline; actual run manifest; null metrics+unit/provenance; verify artifact content; per-case paired stats when paired.
Приёмка: Flat/nested normalize or explicit schema error; 1run reports1; output_chars never tokens; missing data not zero; candidate naming cannot flip sign.
Источники: [scripts/aggregate_benchmark.py:105](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/aggregate_benchmark.py#L105); [scripts/aggregate_benchmark.py:149](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/aggregate_benchmark.py#L149); [scripts/aggregate_benchmark.py:271](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/scripts/aggregate_benchmark.py#L271); [references/schemas.md:20](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/references/schemas.md#L20).
Связь с исходным аудитом: MS-01, AS-08, AS-09, EV-01.

### EXT-M-06 — Оценка субъективного результата смешана с подтверждением пользователя

Наблюдение: Empty feedback трактуется как fine и stop; comparator prioritizes overall rubric above assertions and discourages ties.
Риск: Unreviewed output accepted; стиль побеждает обязательную correctness/security requirement; unsupported forcedwinner.
Исправление при адаптации: Explicit reviewed/accepted/changes_requested/unreviewed, hard gates before soft criteria, tie/inconclusive allowed, blinded order and calibrated rubric.
Приёмка: Empty feedback remains unreviewed; visually better but invariant-violating output cannot win; equivalent pair yields TIE/INCONCLUSIVE.
Источники: [skill-creator/SKILL.md:282](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/SKILL.md#L282); [skill-creator/SKILL.md:320](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/SKILL.md#L320); [agents/comparator.md:79](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/agents/comparator.md#L79).
Связь с исходным аудитом: UX-08, AS-07, DS-06.

### EXT-M-07 — Численные design heuristics нельзя превращать в WCAG gates

Наблюдение: critique-color дает18px regular/14px bold large text вместо18pt/14pt. 44px заявлен общим минимумом; 30–40% automation без source; типографические ratios без контекста.
Риск: Может пропустить недостаточный contrast и дать false violations на допустимые targets. Screenshot не устанавливает CSS/DOM/AT факты.
Исправление при адаптации: WCAG2.2 level/criterion/exemptions and measured CSS units from primary W3C; heuristics advisory.
Приёмка: 18CSSpx regular at3:1 fails1.4.3; 24CSSpx regular boundary correct;2.5.8 24CSSpx+exceptions distinct from enhanced44; unavailableAT=NOT_RUN.
Источники: [critique-color/SKILL.md:12](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-color/SKILL.md#L12); [critique-affordance/SKILL.md:15](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-affordance/SKILL.md#L15); [accessibility-test-plan/SKILL.md:12](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/accessibility-test-plan/SKILL.md#L12); [critique-visual-hierarchy/SKILL.md:22](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-visual-hierarchy/SKILL.md#L22).
Связь с исходным аудитом: DS-03, UX-12.

### EXT-M-08 — Часть research выводов сформулирована как причинность без доказательства

Наблюдение: Форма retention/funnel прямо связывается с причиной; persona включает invented name/photo/quote; фиксированные квоты цитат; confidence High по large sample.
Риск: Синтетические personas/цитаты/каузальный диагноз могут попасть в facts/packet как observed.
Исправление при адаптации: Raw evidence ledger, hypothesis labels and source spans, counterevidence, unknowns; no invented verbatim; confidence from relevance/method/independence not n alone.
Приёмка: 2 supportedquotes stay2; missingresearch produces explicitly hypotheticalpersona; funnelshape produces competing hypotheses not proven diagnosis.
Источники: [behavioural-analytics/SKILL.md:19](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/behavioural-analytics/SKILL.md#L19); [user-persona/SKILL.md:27](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/user-persona/SKILL.md#L27); [summarize-interview/SKILL.md:19](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/summarize-interview/SKILL.md#L19); [research-repository/SKILL.md:25](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/research-repository/SKILL.md#L25).
Связь с исходным аудитом: UX-01, UX-08, UX-09, AS-03.

### EXT-M-09 — Поведенческие концепты и art direction — разные эксперименты

Наблюдение: Owl parallel-concepts holdsvisualconstant to comparebehavior and calls sameflow2visuals oneconcept. Prototype recommends throwaway.
Риск: Без scoped adaptation это отменит artisticdirections иудалит evidence links доpacketconsumption.
Исправление при адаптации: Scope behavior alternatives to super-ux, visual alternatives to sheleg-design; lock other axes, preserve artifact until decision/resume retention complete.
Приёмка: Sameflow2distincttreatments valid visualexploration; changedflow2identicalstyles valid behavioralexploration; coldexecutor still resolves chosen/rejectedartifact.
Источники: [parallel-concepts/SKILL.md:16](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/parallel-concepts/SKILL.md#L16); [concept-selection/SKILL.md:17](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/concept-selection/SKILL.md#L17); [prototype-strategy/SKILL.md:34](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/prototype-strategy/SKILL.md#L34).
Связь с исходным аудитом: DS-02, PF-05.

### EXT-M-10 — Web testing шаблон не является надежным portable harness

Наблюдение: Mandatorynetworkidle; readiness лишьTCPport; shell=True stdout/stderr pipes не дренируются; cleanup terminates shell not explicitprocessgroup; childtest timeout отсутствует.
Риск: Wrongserver accepted, persistentconnections timeout, noisyserver pipeblock, childprocess mayremain. Это staticsourcerisk, не runtimeincident.
Исправление при адаптации: Use existing hostbrowser adapter and actionability assertions; ifserverfixture needed use ownprocess/portidentity/readiness/logdrain/boundedcleanup.
Приёмка: Persistentnetworkapp test waits actual UI assertion; wrongportserver fails identity; timeout cleans owneddescendants without touching unrelatedserver.
Источники: [webapp-testing/SKILL.md:14](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/webapp-testing/SKILL.md#L14); [webapp-testing/SKILL.md:60](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/webapp-testing/SKILL.md#L60); [scripts/with_server.py:23](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/webapp-testing/scripts/with_server.py#L23); [scripts/with_server.py:69](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/webapp-testing/scripts/with_server.py#L69).
Связь с исходным аудитом: PF-10, UX-12.

### EXT-M-11 — Artifact builder вводит лишние зависимости и слабый final gate

Наблюдение: Auto globalpnpm plusdozenspackages, Parcel overlay, npmnetwork; testafterpresentation optional.
Риск: Сложность install увеличивается ради простого прототипа; artifact может неработать.
Исправление при адаптации: Reject workflow. PlainlocalHTML/JS or existingprojectstack, same previewcontract with browserwalk prior completionclaim.
Приёмка: Simplejourney preview opens withnetworkdisabled andnonewdependencies; reset/error/back keyboard pass.
Источники: [scripts/init-artifact.sh:32](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/web-artifacts-builder/scripts/init-artifact.sh#L32); [scripts/init-artifact.sh:270](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/web-artifacts-builder/scripts/init-artifact.sh#L270); [scripts/bundle-artifact.sh:19](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/web-artifacts-builder/scripts/bundle-artifact.sh#L19); [web-artifacts-builder/SKILL.md:66](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/web-artifacts-builder/SKILL.md#L66).
Связь с исходным аудитом: CTX-03, UX-12.

### EXT-M-12 — Art defaults подменяют brief и portable artifact

Наблюдение: Canvas invents useralreadyaskedmasterpiece; frontend invents rejectedproposals; algorithmic locksAnthropicbranding andCDN whileclaimsself-contained.
Риск: Preference laundering, branddrift, offlinefailure, redundantcritique.
Исправление при адаптации: Extract explicit artisticintent/parameterization onlyoptional; userbriefwins; no invented history/networkfonts; deterministicfixtures.
Приёмка: Existingbrand/approveddirection preserved; no mandatoryhero/manifesto; offlinepreview hasno externalassetrequests.
Источники: [canvas-design/SKILL.md:23](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/canvas-design/SKILL.md#L23); [canvas-design/SKILL.md:122](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/canvas-design/SKILL.md#L122); [algorithmic-art/SKILL.md:231](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/algorithmic-art/SKILL.md#L231); [algorithmic-art/SKILL.md:280](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/algorithmic-art/SKILL.md#L280); [frontend-design/SKILL.md:9](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/frontend-design/SKILL.md#L9).
Связь с исходным аудитом: DS-02, DS-06.

### EXT-M-13 — Fresh-reader test полезен, но не заменяет truth/runtime verification

Наблюдение: Reader видит только документ+вопрос; completion определен correctanswers/noambiguity. Grader independently examines outputs (good).
Риск: Логично изложенная ложь может пройти; executor с fullhistory обходит packetgap.
Исправление при адаптации: Coldreader gets only resolvedpacket and separate source receipts, checks expectedquestions/version/inputs/acceptance and marks missing evidence; runtimeclaim stays notimplemented.
Приёмка: Freshreader can identifyinputversions/forbiddenactions/outputs/recovery solelypacket; a wrong factualreceipt fails despite fluentanswer.
Источники: [doc-coauthoring/SKILL.md:263](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/doc-coauthoring/SKILL.md#L263); [doc-coauthoring/SKILL.md:331](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/doc-coauthoring/SKILL.md#L331); [agents/grader.md:27](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/agents/grader.md#L27).
Связь с исходным аудитом: CTX-01, CTX-02, PF-05, AS-14.

## Согласование с уже подготовленной архитектурой

Критерии и evidence не создают очередной цикл brainstorm/spec/plan: планер использует их для текущих stages и сохраняет выбранные решения в packets. Пользовательский complete brief и утверждённое направление не требуют повторного интервью. Предложение Owl сравнивать разные действия пользователя относится к UX; сравнение разных визуальных трактовок одного сценария остаётся задачей creative director. Разнообразие концептов не требует отдельных исполнителей.

Handoff spec дополняет domain content packet: props/states/tokens/copy/assets/а11y/responsive. Он не заменяет atomic claim, lease, fencing, graph revision или Fabric adapter. Эти runtime gaps из PF остаются открытыми. Cold-reader проверка обнаруживает отсутствующий контекст, но не подтверждает runtime integration или production correctness. Неопределённая лицензия doc-coauthoring означает, что fresh-reader contract следует написать самостоятельно по CTX-требованиям, а источник оставить reference.

Progressive disclosure относится к выбору релевантной ветви; оно не позволяет скрыть обязательные constraints, accepted decisions, output contract или source provenance ради лимита контекста. Missing required reference блокирует dispatch; optional reference можно не грузить с причиной. Источник истины один; копии reference вsuper-ux должны оставаться в существующем generated-sync механизме, не расходиться вручную.

Предлагаемая минимальная последовательность: лицензии/provenance и явное решение по каждому методу → компактные authoring/eval/research references → links из existing owners → regression fixtures → cold-reader packet review → browser/output checks на доступном host → evidence-based certification. Принятие методики не равно установке внешнего пакета и не доказывает закрытие original finding.

## Небольшие задачи для реализации

### ADOPT-M-01 — Добавить выборочную загрузку refs с бюджетом

**Edit** [authoring.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/authoring.md)
Решение: Core routes when/readref; decisioncritical context always retained;500lines heuristic nottokenproof.
Выход: One scoped authoring section
Приёмка: Large multilingual fixture resolves only requiredvariant; missingrequiredref blocksdispatch; report actualtokenizer or explicitestimate.
Data prerequisites: нет; связь с текущими tasks: FIX-MS-01, CTX-01.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-02 — Зафиксировать метод output eval без hostlock

**Create** [outcome-evaluation.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/outcome-evaluation.md)
Решение: Frozeninputs/oldskill/control;artifactfirst;honeststatuses;no mandatoryCLI/browser/subagent.
Выход: Method reference with minimalrunrecord
Приёмка: Examples distinguish routing, outputcorrectness, visualjudgment; error/NOT_RUN notPASS; actor tool names supplied byhost.
Data prerequisites: нет; связь с текущими tasks: FIX-EV-01, FIX-MS-04, FIX-UX-05.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-03 — Подключить outcome reference кmake-skill

**Edit** [SKILL.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md)
Решение: Add conditionalpointer for behaviorimprovement; audit doesnotauthorizeedit/release.
Выход: One entrypoint link with when-to-read
Приёмка: Link resolves; conformanceaudit stops atreport; behavior request loads outcome method.
Data prerequisites: ADOPT-M-02; связь с текущими tasks: FIX-MS-03.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-04 — Разделить tuningvalidation и finalholdout

**Edit** [statistics.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md)
Решение: UniquegroupedcaseIDs; frozenfinalholdout; uncertainty notWaldn3.
Выход: Selection-vs-final evaluation section
Приёмка: Synthetic reusedvalidation example cannot be labeled unseenfinaltest; dependentrepeats notiidclaimed.
Data prerequisites: нет; связь с текущими tasks: FIX-AS-08, FIX-EV-01.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-05 — Добавить контрпримеры кeval contract

**Create** [outcome-contract-cases.json](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/evals/outcome-contract-cases.json)
Решение: Fixturesonly, noforeignrunner: timeout, absentmetric, flatlayout, swappedconfignames, emptyevidence, unreviewedfeedback.
Выход: Small versionedfixture data
Приёмка: Eachcase has expectedtypedoutcome/unit/baseline; noneclaimexecutedPASS. Existingrunner adaptation is separate FIX-EV-01 implementation.
Data prerequisites: ADOPT-M-02, ADOPT-M-04; связь с текущими tasks: FIX-EV-01, FIX-UX-05.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-06 — Сохранить provenance вresearch synthesis

**Create** [research-evidence.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/references/research-evidence.md)
Решение: Observation/citation/inference/hypothesis distinct; noquotasforcingevidence; conflictsretained.
Выход: Evidence ledger template
Приёмка: Two contradictoryparticipants remainlinked; singlesource flagged; noavailabledata stayshypothesis; number+entity+unit+time boundtogether.
Data prerequisites: нет; связь с текущими tasks: FIX-UX-01, FIX-UX-08, FIX-AS-03.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-07 — Подключитьresearch ledger безновойresearchroute

**Edit** [SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/SKILL.md)
Решение: Use ledger for suppliedresearch/factualclaims; no mandatory Notion/Dovetail/browserwhenlocaldata sufficient.
Выход: Conditional reference and source-to-scenario seam
Приёмка: Local transcriptfixture needsnoplugins/keys; scenarios retain evidenceIDs and unknowns.
Data prerequisites: ADOPT-M-06; связь с текущими tasks: FIX-UX-09.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-08 — Добавить сравнениеbehavioralconcepts

**Edit** [SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md)
Решение: Criteria/hardconstraints beforecomparison; compareflowalternativesonlywhenopen; settledflow retained.
Выход: Scoped decision procedure
Приёмка: Two options have discriminatingbehavior; rejectedoption containswhy/revisit/locator; no mandatoryextraapproval.
Data prerequisites: нет; связь с текущими tasks: CTX-03, FIX-UX-11.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-09 — Добавитьscenarios-first browserwalk checklist

**Create** [prototype-walkthrough.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/prototype-walkthrough.md)
Решение: Complement preparedinteractive-flow-prototypes; no duplicate flowstore. Goaltask noUIhint, reset/back/error/keyboard/async.
Выход: Walk record template
Приёмка: Offlineinteractivefixture hasdeclaredvswalkedstates; screenshotonlynotfunctionalPASS; externalpayment mockexplicit.
Data prerequisites: нет; связь с текущими tasks: CTX-03, FIX-UX-12.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-10 — Уточнитьvisualcritique contract

**Edit** [CREATIVE_DIRECTOR.md](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md)
Решение: Seven lenses optionalbybrief;observedrender/subjectivejudgment/sourceCSS different;cleanstop,budget,briefwins;noexactratioorbrandautoP1.
Выход: Small extension to prepared directorpatch
Приёмка: Sameflowvisualalternatives remainvalid; missingbrand=NOT_ASSESSED; no fabricateddefectoncleanrender; strictconstraints gatebefore softwinner.
Data prerequisites: нет; связь с текущими tasks: FIX-DS-02, FIX-DS-06.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-11 — Добавитьstandards-vs-heuristics a11yreference

**Create** [accessibility-evidence.md](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/references/accessibility-evidence.md)
Решение: Use primaryWCAG criterion/version/level/units/exceptions; AT hostmatrix; no screenshotclaimsDOM.
Выход: Compact evidenceformat andboundaryexamples
Приёмка: 18pxnormal at3:1 FAIL;24pxnormalboundary;24pxtargetAAcase≠44enhancedcase; absentATNOT_RUN; noautoinstallaxe.
Data prerequisites: нет; связь с текущими tasks: FIX-DS-03, FIX-UX-12.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-12 — Подключитьa11yevidence изdesignentry

**Edit** [SKILL.md](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md)
Решение: Family visualrouteowns requirement;existinga11ycapabilityoptional; avoidcreating competingrouter.
Выход: Conditionalpointer to accessibilityevidence
Приёмка: Linkresolves; purevisualjudgment cannot produceWCAGconformancewithoutscopedchecks.
Data prerequisites: ADOPT-M-11; связь с текущими tasks: нет.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-13 — Добавитьcold-reader packetreview

**Edit** [planning.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/planning.md)
Решение: Reader receives onlyresolvedpacket, noauthorhistory; checksinputs/decisions/outputs/guardrails/resume; implementationstatus separate. Independently specified fromCTX, no docco wordingcopy.
Выход: Smallreviewgate complement currentcontext/microtaskpatch
Приёмка: Coldreader answers8concretepacketquestions; missingversionoroutputcontract failsreadiness; no newservice/APIkey.
Data prerequisites: нет; связь с текущими tasks: CTX-01, CTX-02, FIX-PF-05.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

### ADOPT-M-14 — ДобавитьUIhandoff section вpacket doctrine

**Edit** [planning.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/planning.md)
Решение: Domainannex carries states/props/tokens/content/a11y/assets versions; coreclaim/fence remains schedulercontract.
Выход: UI packet annex fields
Приёмка: Executor implements fixture without regrill; stale visualspec triggerspacketrevision; domainannex optionalfornonUI.
Data prerequisites: ADOPT-M-13; связь с текущими tasks: FIX-PF-05, CTX-01.
Resource: этот target path; пересекающиеся правки сериализовать. Перед dispatch перепроверить базу, hashes и подготовленные doctrine patches. Статус: proposed_not_implemented; readiness: planned_requires_dispatch_refresh.

## Полный inventory решений по каждому skill

| Repo / skill | Coverage | Decision | Конкретный перенос / исключение |
|---|---|---|---|
| [owl-designer/design-critique](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-critique/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-debt-audit](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-debt-audit/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-impact-reporting](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-impact-reporting/SKILL.md) | full_body | adapt | Baseline/дата/sample/cofactors; не выдавать shipped screens за outcome и before/after за причинность. |
| [owl-designer/design-qa-checklist](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-qa-checklist/SKILL.md) | full_body | adapt | Spec-versus-render/browser evidence по выбранным платформам; не единый WCAG44px gate. |
| [owl-designer/design-review-process](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-review-process/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-sprint-plan](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/design-sprint-plan/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/handoff-spec](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/handoff-spec/SKILL.md) | full_body | adapt | Visual/token/interaction/content/assets/a11y edge cases добавить в domain section packet. Не вторая система task/lease/revision. |
| [owl-designer/team-workflow](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/team-workflow/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/version-control-strategy](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/skills/version-control-strategy/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/affinity-diagram](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/affinity-diagram/SKILL.md) | full_body | adapt | Участник и locator у каждого наблюдения; сохранять единичный/противоречащий сигнал. Не искусственно включать участника в каждый вывод. |
| [owl-designer/behavioural-analytics](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/behavioural-analytics/SKILL.md) | full_body | adapt | Проверять определение события, знаменатель, путь, релизы и сегменты; формы графика только гипотезы, не причинный диагноз. |
| [owl-designer/card-sort-analysis](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/card-sort-analysis/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/diary-study-plan](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/diary-study-plan/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/empathy-map](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/empathy-map/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/interview-script](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/interview-script/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/jobs-to-be-done](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/jobs-to-be-done/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/journey-map](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/journey-map/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/qual-quant-triangulation](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/qual-quant-triangulation/SKILL.md) | full_body | adapt | Сверять популяцию/вопрос/период и формулировать опровержение конкурирующих объяснений; не выбирать источник автоматически. |
| [owl-designer/research-repository](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/research-repository/SKILL.md) | full_body | adapt | Связь insight→study→raw evidence, дата, sample, conflict/superseded; локальный Markdown/JSON. Не переносить сервисы и confidence только по размеру sample. |
| [owl-designer/summarize-interview](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/summarize-interview/SKILL.md) | full_body | adapt | Разделять цитату, явно сказанное, наблюдение и интерпретацию. Квоты 3–5 тем/5–8 цитат заменить на максимум по наличию источников. |
| [owl-designer/survey-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/survey-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/usability-test-plan](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/usability-test-plan/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/user-persona](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/skills/user-persona/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/accessibility-audit](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/accessibility-audit/SKILL.md) | full_body | adapt | Criterion/version/level, location, barrier, steps, remediation; отдельные observed/NOT_RUN/NOT_APPLICABLE. |
| [owl-designer/component-spec](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/component-spec/SKILL.md) | full_body | adapt | Props/state/accessibility контракт для компонента как interface packet; не требовать полную DS для прототипа. |
| [owl-designer/design-system-governance](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/design-system-governance/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-token](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/design-token/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/documentation-template](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/documentation-template/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/icon-system](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/icon-system/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/localization-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/localization-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/motion-system](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/motion-system/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/naming-convention](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/naming-convention/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/pattern-library](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/pattern-library/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/theming-system](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/skills/theming-system/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/case-study](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/case-study/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-negotiation](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/design-negotiation/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-rationale](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/design-rationale/SKILL.md) | full_body | adapt | Decision/context/options/evidence/trade-offs/validation; один decision ID и versioned links в packets. |
| [owl-designer/design-system-adoption](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/design-system-adoption/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-token-audit](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/design-token-audit/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/presentation-deck](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/presentation-deck/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/ux-writing](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/skills/ux-writing/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/animation-principles](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/animation-principles/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/conversational-ux](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/conversational-ux/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/doherty-threshold](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/doherty-threshold/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/error-handling-ux](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/error-handling-ux/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/feedback-patterns](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/feedback-patterns/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/fitts-law](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/fitts-law/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/form-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/form-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/gesture-patterns](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/gesture-patterns/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/hicks-law](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/hicks-law/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/interfaces-that-feel](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/interfaces-that-feel/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/jakobs-law](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/jakobs-law/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/loading-states](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/loading-states/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/micro-interaction-spec](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/micro-interaction-spec/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/millers-law](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/millers-law/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/navigation-patterns](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/navigation-patterns/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/onboarding-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/onboarding-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/peak-end-rule](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/peak-end-rule/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/search-ux](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/search-ux/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/serial-position-effect](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/serial-position-effect/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/state-machine](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/state-machine/SKILL.md) | full_body | adapt | States/events/guards/actions/invariants; допустимые terminal states, параллельные состояния и stale async responses явно. |
| [owl-designer/teslers-law](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/teslers-law/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/zeigarnik-effect](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/skills/zeigarnik-effect/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/a-b-test-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/a-b-test-design/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/accessibility-test-plan](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/accessibility-test-plan/SKILL.md) | full_body | adapt | Матрица flow×keyboard/AT/zoom/motion с фактическими hosts; автоматизация только часть проверки, без 30–40% гарантии. |
| [owl-designer/click-test-plan](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/click-test-plan/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/concept-selection](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/concept-selection/SKILL.md) | full_body | adapt | Пороги отделить от trade-offs, критерии до сравнения, downside/revisit и retrievable rejected options; не универсальное never combine. |
| [owl-designer/heuristic-evaluation](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/heuristic-evaluation/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/parallel-concepts](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/parallel-concepts/SKILL.md) | full_body | adapt | Поведенческие оси, сопоставимая fidelity, разнообразие по вопросу; не запрет визуальных направлений у sheleg-design и не обязательный параллельный runtime. |
| [owl-designer/prototype-strategy](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/prototype-strategy/SKILL.md) | full_body | adapt | Fidelity по вопросу и риску; requested clickable journey остается обязательным deliverable; сохранять artifact до закрытия решения. |
| [owl-designer/test-scenario](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/test-scenario/SKILL.md) | full_body | adapt | Задание с целью без подсказки UI path; observed outcome/assistance отдельно от предполагаемого маршрута. |
| [owl-designer/user-flow-diagram](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/user-flow-diagram/SKILL.md) | full_body | adapt | Метки triggers на ребрах, screen IDs, exit/error/recovery/async; диаграмма не доказательство работающего прототипа. |
| [owl-designer/wireframe-spec](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/skills/wireframe-spec/SKILL.md) | full_body | adapt | Реальный content contract, состояния и responsive annotations; grayscale convention не технический gate. |
| [owl-designer/aesthetic-usability](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/aesthetic-usability/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/color-system](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/color-system/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/dark-mode-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/dark-mode-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/data-visualization](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/data-visualization/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/illustration-style](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/illustration-style/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-closure](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-closure/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-common-region](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-common-region/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-continuity](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-continuity/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-figure-ground](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-figure-ground/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-proximity](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-proximity/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/law-of-similarity](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/law-of-similarity/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/layout-grid](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/layout-grid/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/platform-conventions](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/platform-conventions/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/readable-measure](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/readable-measure/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/responsive-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/responsive-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/spacing-system](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/spacing-system/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/typography-scale](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/typography-scale/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/visual-hierarchy](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/visual-hierarchy/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/von-restorff-effect](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/skills/von-restorff-effect/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/business-design](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/business-design/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/competitive-analysis](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/competitive-analysis/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/content-strategy](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/content-strategy/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-brief](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/design-brief/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/design-principles](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/design-principles/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/experience-map](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/experience-map/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/information-architecture](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/information-architecture/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/metrics-definition](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/metrics-definition/SKILL.md) | full_body | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/north-star-vision](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/north-star-vision/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/opportunity-framework](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/opportunity-framework/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/service-blueprint](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/service-blueprint/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/stakeholder-alignment](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/skills/stakeholder-alignment/SKILL.md) | metadata_headings_and_dependency_scan | reference | Сохранить как тематический reference; не переносить отдельный skill/route, цифры и нормативные claims требуют primary-source проверки перед использованием. |
| [owl-designer/critique-affordance](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-affordance/SKILL.md) | full_body | adapt | Видимость интерактивности и состояний; screenshot не доказывает реальный click target/keyboard/ARIA. |
| [owl-designer/critique-brand-consistency](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-brand-consistency/SKILL.md) | full_body | adapt | Сверка с реально существующим brand pack; отсутствующая dimension NOT_ASSESSED, не PASS. Token source проверять в CSS/variables. |
| [owl-designer/critique-color](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-color/SKILL.md) | full_body | adapt | Измеряемые пары и значения contrast, forced-colors и несводимость смысла к цвету; исправить px/pt и exemptions. |
| [owl-designer/critique-composition](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-composition/SKILL.md) | full_body | adapt | Observation→impact→actionable fix с screenshot/viewport; не обязательная находка на каждой оси. |
| [owl-designer/critique-information-density](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-information-density/SKILL.md) | full_body | adapt | Приоритет информации по сценарию, controlled disclosure; F/Z patterns не универсальный закон и не eye-tracking evidence. |
| [owl-designer/critique-typography](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-typography/SKILL.md) | full_body | adapt | Проверка масштаба/читаемости/согласованности, субъективные ориентиры отделить от стандартов; не fixed ratios gate. |
| [owl-designer/critique-visual-hierarchy](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/skills/critique-visual-hierarchy/SKILL.md) | full_body | adapt | Обоснование приоритета и наблюдаемого emphasis; не 1.5× mandatory и не exactly-one zone для всех экранов. |
| [anthropic/academy-guide](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/academy-guide/SKILL.md) | metadata_headings_and_dependency_scan | reject | Продвижение Claude Academy не решает задачи семейства; никаких дополнительных on-every-answer hooks. |
| [anthropic/algorithmic-art](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/algorithmic-art/SKILL.md) | selected_sections_not_full_body | optional | Seed/parameter exploration как идея для generative artwork. Не переносить p5.js CDN, принудительный Anthropic brand/template и обещание offline/self-contained. |
| [anthropic/brand-guidelines](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/brand-guidelines/SKILL.md) | metadata_headings_and_dependency_scan | reject | Anthropic brand не бренд пользователя; не автоматический default. Может быть reference только для явно заказанного Anthropic brand artifact. |
| [anthropic/canvas-design](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/canvas-design/SKILL.md) | full_body | optional | Только необязательный источник идей для самостоятельного artwork, не продуктовый default. Не переносить вымышленные слова пользователя, fixed minimal-text стиль, обязательный manifesto/скачивание fonts. |
| [anthropic/claude-api](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/claude-api/SKILL.md) | metadata_headings_and_dependency_scan | reference | Только при явно выбранном Anthropic provider. Не переносить модельные defaults, обязательные SDK/CLI, pricing/cache факты и обход provider-neutral contract. |
| [anthropic/discernment-nudge](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/discernment-nudge/SKILL.md) | metadata_headings_and_dependency_scan | reject | Не переносить recurring post-answer nudges и общий trigger; targeted uncertainty уже часть evidence contract. |
| [anthropic/doc-coauthoring](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/doc-coauthoring/SKILL.md) | full_body | reference | Полезен fresh-reader test документов/packets. Локальной лицензии у этого skill нет и root LICENSE отсутствует: текст/код не переносить, контракт cold-reader вывести независимо из требований CTX. |
| [anthropic/docx](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/docx/SKILL.md) | metadata_headings_and_dependency_scan | reference | Source-available restrictive license: исключить prompts/scripts/assets из family distribution. Специализированные форматы обслуживать имеющимися authorized tools; не вводить их runtime dependencies ради этого аудита. |
| [anthropic/frontend-design](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/frontend-design/SKILL.md) | full_body | adapt | Взять subject-specific visual choices, compact provisional tokens, brief precedence и rendered critique. Исключить вымышленное «клиент уже отверг», обязательный hero, перечни запрещенной эстетики и обход copywriting. |
| [anthropic/internal-comms](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/internal-comms/SKILL.md) | metadata_headings_and_dependency_scan | reference | Форматы служебных сообщений вне узкого scope; не делать вторую writing route. |
| [anthropic/mcp-builder](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/mcp-builder/SKILL.md) | full_body | reference | Outcome-oriented tool design полезно как reference agent-interop; API coverage не универсальная цель. Не переносить SDK examples/eval runner до отдельной versioned protocol проверки. |
| [anthropic/pdf](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/pdf/SKILL.md) | metadata_headings_and_dependency_scan | reference | Source-available restrictive license: исключить prompts/scripts/assets из family distribution. Специализированные форматы обслуживать имеющимися authorized tools; не вводить их runtime dependencies ради этого аудита. |
| [anthropic/pptx](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/pptx/SKILL.md) | metadata_headings_and_dependency_scan | reference | Source-available restrictive license: исключить prompts/scripts/assets из family distribution. Специализированные форматы обслуживать имеющимися authorized tools; не вводить их runtime dependencies ради этого аудита. |
| [anthropic/skill-creator](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/skill-creator/SKILL.md) | full_body | adapt | Взять progressive disclosure, frozen baseline/output review, critique weak assertions и near-miss trigger cases. Переписать измерение независимо: без CLI-only зависимости, не копировать eval scripts с найденными дефектами. |
| [anthropic/slack-gif-creator](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/slack-gif-creator/SKILL.md) | metadata_headings_and_dependency_scan | optional | Pillow/imageio/numpy и Slack-specific constraints только при отдельном GIF deliverable; в core не нужны. |
| [anthropic/theme-factory](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/theme-factory/SKILL.md) | metadata_headings_and_dependency_scan | reference | Готовые темы могут быть референсами, но выбор пресета не art direction; не переносить обязательный theme picker. |
| [anthropic/web-artifacts-builder](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/web-artifacts-builder/SKILL.md) | metadata_headings_and_dependency_scan | reject | Не переносить init/bundle workflow: auto global pnpm, десятки packages, второй bundler и тестирование после показа конфликтуют с lightweight prototype. |
| [anthropic/webapp-testing](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/webapp-testing/SKILL.md) | full_body | adapt | Взять inspect rendered state→act→verify и lifecycle responsibility. Использовать уже доступный browser/test runner; исключить обязательный Python Playwright/networkidle и запуск неизвестного скрипта до чтения. |
| [anthropic/xlsx](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/skills/xlsx/SKILL.md) | metadata_headings_and_dependency_scan | reference | Source-available restrictive license: исключить prompts/scripts/assets из family distribution. Специализированные форматы обслуживать имеющимися authorized tools; не вводить их runtime dependencies ради этого аудита. |
| [anthropic/template](https://github.com/anthropics/skills/blob/41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f/template/SKILL.md) | metadata_headings_and_dependency_scan | reference | Template metadata reference only; no adoption proposed. |

## Полный inventory команд Owl

Все34команды — reference, не установка/новыеentrypoints. Командные имена namespace-sensitive; test-plan присутствует в двухplugins.

| Команда | Coverage |
|---|---|
| [design-ops/commands/handoff.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/commands/handoff.md) | metadata_headings_and_dependency_scan |
| [design-ops/commands/plan-sprint.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/commands/plan-sprint.md) | metadata_headings_and_dependency_scan |
| [design-ops/commands/setup-workflow.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-ops/commands/setup-workflow.md) | metadata_headings_and_dependency_scan |
| [design-research/commands/discover.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/commands/discover.md) | metadata_headings_and_dependency_scan |
| [design-research/commands/interview.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/commands/interview.md) | metadata_headings_and_dependency_scan |
| [design-research/commands/synthesize.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/commands/synthesize.md) | metadata_headings_and_dependency_scan |
| [design-research/commands/test-plan.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-research/commands/test-plan.md) | metadata_headings_and_dependency_scan |
| [design-systems/commands/audit-system.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/commands/audit-system.md) | metadata_headings_and_dependency_scan |
| [design-systems/commands/create-component.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/commands/create-component.md) | metadata_headings_and_dependency_scan |
| [design-systems/commands/tokenize.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/design-systems/commands/tokenize.md) | metadata_headings_and_dependency_scan |
| [designer-toolkit/commands/build-presentation.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/commands/build-presentation.md) | metadata_headings_and_dependency_scan |
| [designer-toolkit/commands/start-here.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/commands/start-here.md) | full_body |
| [designer-toolkit/commands/write-case-study.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/commands/write-case-study.md) | metadata_headings_and_dependency_scan |
| [designer-toolkit/commands/write-rationale.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/designer-toolkit/commands/write-rationale.md) | metadata_headings_and_dependency_scan |
| [interaction-design/commands/design-form.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/commands/design-form.md) | metadata_headings_and_dependency_scan |
| [interaction-design/commands/design-interaction.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/commands/design-interaction.md) | metadata_headings_and_dependency_scan |
| [interaction-design/commands/design-onboarding.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/commands/design-onboarding.md) | metadata_headings_and_dependency_scan |
| [interaction-design/commands/error-flow.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/commands/error-flow.md) | metadata_headings_and_dependency_scan |
| [interaction-design/commands/map-states.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/interaction-design/commands/map-states.md) | metadata_headings_and_dependency_scan |
| [prototyping-testing/commands/evaluate.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/commands/evaluate.md) | metadata_headings_and_dependency_scan |
| [prototyping-testing/commands/experiment.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/commands/experiment.md) | metadata_headings_and_dependency_scan |
| [prototyping-testing/commands/explore-options.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/commands/explore-options.md) | full_body |
| [prototyping-testing/commands/prototype-plan.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/commands/prototype-plan.md) | metadata_headings_and_dependency_scan |
| [prototyping-testing/commands/test-plan.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/prototyping-testing/commands/test-plan.md) | metadata_headings_and_dependency_scan |
| [ui-design/commands/color-palette.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/commands/color-palette.md) | metadata_headings_and_dependency_scan |
| [ui-design/commands/design-screen.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/commands/design-screen.md) | metadata_headings_and_dependency_scan |
| [ui-design/commands/platform-audit.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/commands/platform-audit.md) | metadata_headings_and_dependency_scan |
| [ui-design/commands/responsive-audit.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/commands/responsive-audit.md) | metadata_headings_and_dependency_scan |
| [ui-design/commands/type-system.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ui-design/commands/type-system.md) | metadata_headings_and_dependency_scan |
| [ux-strategy/commands/benchmark.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/commands/benchmark.md) | metadata_headings_and_dependency_scan |
| [ux-strategy/commands/frame-problem.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/commands/frame-problem.md) | metadata_headings_and_dependency_scan |
| [ux-strategy/commands/strategize.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/ux-strategy/commands/strategize.md) | metadata_headings_and_dependency_scan |
| [visual-critique/commands/critique-screen.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/commands/critique-screen.md) | full_body |
| [visual-critique/commands/critique-ux.md](https://github.com/Owl-Listener/designer-skills/blob/9a6930cf84a822eb458624bd11c61aac5bbdf224/visual-critique/commands/critique-ux.md) | metadata_headings_and_dependency_scan |

## Проверки и ограничения

- clone --depth1 обеих указанных репозиториев: exit0; git rev-parse HEAD закреплён в receipts.
- Локальный собственный scanner: inventory всех SKILL.md/commands/лицензий, hashes, source evidence line bounds; сторонний код не импортировался и не выполнялся.
- Deep-read coverage перечислен в JSON. Scanned ≠ semantic PASS; отсутствие finding для scan-onlyskill не означает качество подтверждено.
- W3C первичные страницы проверены: [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [target-size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Playwright: [load-state](https://playwright.dev/docs/api/class-page#page-wait-for-load-state).
- Никаких пользовательских исследований, платных API evals, установок, performance/security suites, remote adoption или Fabric runtime tests не выполнено.
- Достоинства — пригодные конструкции метода, а не доказанный рост качества. Показать пользу можно только после маленьких paired outcome experiments на семейных scenarios с тем же model/input/context/budget.

Артефакты подготовлены для единого внешнего плана Sherlock Skills. Исходники семьи не изменялись.
