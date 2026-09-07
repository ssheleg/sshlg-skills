<sub>ssheleg skills — make-skill · evidence-docs</sub>

# Аудит семейства ssheleg / sshlg-skills

**Срез: 7 сентября 2026 · 9 пакетов · 28 скиллов · аудит без изменения исходников.** Название Sherlock Skills трактуется как семейство из вашего роутинга и установленного sshlg-skills. Остальные сторонние скиллы машины в предметную область не включены.

## Вывод

Семейство имеет развитую упаковку, предметные инструкции и тесты, но пока не даёт достаточных оснований считать все его обязательные правила и проверки надёжными. Найдено **90 замечаний: 50 P1 и 40 P2**. Это реестр разнородных дефектов, противоречий и пробелов доказательства, а не число подтверждённых production-инцидентов. P1 означает первоочередное исправление: неверная гарантия, риск денег/доступа/координации или системное искажение выполнения; P2 — ограниченная ошибка, переносимость либо качество доказательств. P0 не присваивался: непосредственный действующий инцидент не наблюдался.

Самая опасная закономерность — превращение слабого сигнала в сильный вывод: наличие числа становится подтверждением факта; принятый риск скрывает дефект; полученный webhook считается обработанным; любое подтверждение становится разрешением; успешный lexical fixture читается как доказательство полезности скилла. Архитектуру следует сохранить по предметным владельцам, а общие сигналы разделить на намерение, полномочия, состояние исполнения и вид доказательства.

**Приоритет работ:** сначала исправить опасные алгоритмы платежей, OAuth, Telegram и leases; затем честность проверок и происхождение фактов; после этого маршрутизацию, контракты, переносимость и реальные end-to-end evals. Полная перепись семейства до исправления конкретных P1 не нужна.

## Навигация и комплект

Полный текст ниже содержит индивидуальные карточки всех скиллов, все finding cards, целевую архитектуру и последовательный план. Машиночитаемые приложения: [90 замечаний](findings.json), [граф реализации](roadmap.json), [задачи CSV](backlog.csv), [28 сценариев модели](architecture-scenarios.json), [инвентарь и digests](deep-inventory.json). Для чтения отдельными частями доступны [архитектура](architecture.md) и [план](roadmap.md).

### Шесть показательных проблем

- **Недостоверные факты:** единственный факт «500 integrations» позволяет линтеру пропустить «500 million paying customers». Проверяется числовой токен, теряются субъект и единица. [UX-01](#ux-01).
- **Деньги:** webhook claim фиксируется до обработки; crash между ними превращает повтор в duplicate без выдачи entitlement. Это контрсценарий опубликованного рецепта, а не обнаруженный платёжный инцидент. [DV-01](#dv-01).
- **OAuth:** рецепты сохраняют токены в подписанных клиентских session cookies; подпись не делает содержимое секретным. [DV-07](#dv-07).
- **Координация:** воспроизведены коллизия выдачи ID и гонки leases, включая два успешных acquire. [SY-01](#sy-01), [SY-03](#sy-03), [SY-05](#sy-05).
- **Роутинг:** текущий запрос про аудит семейства выбирает task-pipeline, а «объясни и почини» может не выбрать ничего; цитата отказа выключает маршрут. Это результаты классификатора, не доказательство того, что модель всегда им следует. [RT-01](#rt-01), [RT-02](#rt-02).
- **Мнимое доказательство качества:** успешный тест выбора названия скилла, проверка наличия маркера или собственная повторённая oracle не доказывают правильный результат. [EV-01](#ev-01), [UX-05](#ux-05), [TG-03](#tg-03).

## Что и насколько проверено

Прочитаны все 28 SKILL.md. Механически проверена поставка всех 28; зафиксирован manifest 445 файлов внутри skill subtrees. References, scripts, hooks, линтеры и тесты углублённо прочитаны по рискам; все 241 записи UX best practices и 39 style packs прошли структурный обзор. Это **не** означает независимую фактологическую проверку всех внешних ссылок в 241 практике или визуальный runtime-аудит каждого из 39 стилей. Полный semantic proof каждого предложения в большой библиотеке этим аудитом не получен.

Запускались существующие тесты, синтетические контрпримеры в scratch, strict validators чистых Git-экспортов, проверка npm pins и GitHub release runs. Реальные пользовательские данные, деньги, публикации и production-трафик не затрагивались. Native Claude plugin eval недоступен в установленном доступе; фактическая автозагрузка и польза скиллов в живой матрице hosts остаются NOT_RUN. Эти ограничения включены в план, а не заменены оценкой «всё проверено».

**Как читать доказательства:** reproduced — запущенный контрпример; source review/design defect — конкретный рецепт и разобранный возможный исход; primary source verified — сравнение с первичным источником; evidence gap — недостаточность заявленного доказательства. Конкретный вид сохранён в каждой карточке. Теоретический опасный исход не объявляется происшедшим в production.

### Зафиксированные версии

| Пакет | Версия | SHA | Скиллов | Release на этом SHA |
|---|---|---|---:|---|
| super-ux | 0.55.1 | `a60f6b423c61` | 7 | [PASS](https://github.com/ssheleg/super-ux/actions/runs/34058653971) |
| task-pipeline | 1.85.2 | `66487ce32e7d` | 3 | [PASS](https://github.com/ssheleg/task-pipeline/actions/runs/34079231832) |
| agent-sync | 1.19.3 | `ef45d404d160` | 1 | [PASS](https://github.com/ssheleg/agent-sync/actions/runs/34059588968) |
| make-skill | 0.27.1 | `015052149a9c` | 1 | [PASS](https://github.com/ssheleg/make-skill/actions/runs/34058649953) |
| sheleg-design | 1.59.4 | `ca855d92f4a8` | 1 | [PASS](https://github.com/ssheleg/sheleg-design-skill/actions/runs/34060320859) |
| seo-aeo-audit | 0.25.11 | `aa38de5f8f07` | 1 | [PASS](https://github.com/ssheleg/seo-aeo-audit/actions/runs/34058662184) |
| sheleg-dev | 0.11.8 | `42dfb5df9298` | 7 | [PASS](https://github.com/ssheleg/sheleg-dev/actions/runs/34065720198) |
| agent-stack | 0.23.2 | `1f99f8f0914f` | 4 | [PASS](https://github.com/ssheleg/agent-stack/actions/runs/34058657853) |
| telegram-dev | 0.1.11 | `0263b899e582` | 3 | [PASS](https://github.com/ssheleg/telegram-dev/actions/runs/33416039163) |



Зонтичный пакет: **1.46.1**, commit `7ef37e8bd5220d6ab355346634ff19196de8f41b`. Pins актуальны на момент запроса реестра: [live-pins.log](live-pins.log). Сравнение sibling checkout выявило отличия SHA только у design (CHANGELOG) и SEO (CI workflow); тела навыков этим не изменены. Все 28 `.agents/skills/*/SKILL.md` совпадают с закреплёнными исходниками. Старые версии в cache найдены, но само наличие старого каталога не доказывает активную загрузку или конфликт.

Инвентарь toolkit: 527 записей, из них 28 семейства и 499 остальных. Это обзор Claude install records/skills, а не доказанное число callable skills текущего Codex: RT-03. Сумма тел 28 скиллов — 86,451 cl100k tokens; сумма descriptions — 6,162. Это размер каталога, **не** расход каждой сессии: UB-01. Расчёт: [deep-inventory.json](deep-inventory.json).

### Проверки и их смысл

| Проверка | Итог | Что действительно подтверждено | Доказательство |
|---|---|---|---|
| Чистая mechanical validation | PASS 28/28 | Текущие структурные правила аудитора на committed trees | [deep-inventory.json](deep-inventory.json) |
| Claude strict root + nested plugin | PASS 18/18 | Совместимость проверенных manifest/skill metadata с установленным CLI | [strict-results.json](strict-results.json) |
| Umbrella npm test | PASS · 50 suites / 920 fixtures | Существующий регрессионный набор; не semantic correctness всех рецептов | [umbrella-tests.log](umbrella-tests.log) |
| make-skill и clean SEO tests | PASS | Существующие test suites | [make-skill-tests.log](make-skill-tests.log), [seo-clean.log](seo-clean.log) |
| UX, brand lint, UX lint, design | PASS | Текущие валидаторы; рядом приведены пропущенные ими контрпримеры | [ux-design.md](ux-design.md) |
| sheleg-dev npm run test:all | PASS · 48 planted defects rejected | Core + negative tests после восстановления окружения | [sheleg-dev-final.log](sheleg-dev-final.log) |
| task-pipeline npm run test:all | PASS | Итог повторного полного запуска | [pipeline-final.log](pipeline-final.log), [final-test-results.json](final-test-results.json) |
| Telegram existing test suite | PASS | Тесты пакета, включая собственную canonicalization oracle | [integrations.md](integrations.md) |
| Agent-stack / agent-sync validators | PASS | Текущие validators; scanner self-test 11/11 | [agent-stack-validator.log](agent-stack-validator.log), [agent-sync-validator-retry.log](agent-sync-validator-retry.log), [agent-harness-selftest.log](agent-harness-selftest.log) |
| Pins и exact-SHA release | PASS · 9/9 | Публикации и закреплённые версии на момент проверки | [live-pins.log](live-pins.log), [live-ci.json](live-ci.json) |
| Native Claude plugin eval | NOT_RUN | Early access gate не позволил выполнить eval | [native-eval.log](native-eval.log) |
| Предлагаемый typed routing prototype | PASS · 28 cases / 5 invariants / 4 rejected mutants | Внутренняя согласованность authored intents; не распознавание языка и не LLM outcome | [architecture-prototype.log](architecture-prototype.log) |

Первоначальные механические ошибки make-skill/SEO были вызваны локальными __pycache__, чистые Git-экспорты прошли. Во время части тестов закончилось место: это TEST_ERROR, а не доказательство дефекта продукта. DV-20 относится к неправильной классификации ошибки копирования fixture, а не к 40 реально пропущенным мутантам. После восстановления места выполнены повторные запуски; оригинальные логи сохранены. Первый pipeline timeout и ошибка fixture также не объявлены дефектами пакета.

## Что уже сделано хорошо

У семейства есть явные предметные владельцы, закреплённые версии, тестовые наборы и negative tests, receipts и правила разграничения UX/visual/copy/integrations. Это полезная основа для сопровождения. Проверка release pins и strict packaging проходит. Проблема обнаруживается глубже: тесты иногда подтверждают собственные assumptions, а инструкции усиливают их до обязательных гарантий. Исправлять нужно и рецепт, и доказательство, которое раньше пропускало ошибку.

## Каждый скилл: назначение, проблемы и целевая роль

Все 28 прошли чистую структурную проверку; у всех есть замечания по содержанию, стыкам или границе доказательства. «GAP» ниже не означает, что скилл бесполезен: он означает, что заявленная область пока имеет конкретные незакрытые замечания. Общие RT/UB проблемы распространяются на выбор всего семейства и перечислены отдельно, без повторного увеличения счётчика.

| Скилл | Пакет | Замечания | Целевая ответственность |
|---|---|---|---|
| [brand-voice](#skill-brand-voice) | super-ux | [UX-01](#ux-01), [UX-02](#ux-02), [UX-03](#ux-03) | Связывать полные утверждения с типизированными фактами; лексические эвристики показывать как advisory. |
| [copywriting](#skill-copywriting) | super-ux | [UX-01](#ux-01), [UX-02](#ux-02), [UX-03](#ux-03), [UX-04](#ux-04), [UX-05](#ux-05), [UX-15](#ux-15) | Однозначно назначить владельца strings.md; проверить реальный выход модели и статус процесса, а не маркер. |
| [vision](#skill-vision) | super-ux | [UX-06](#ux-06), [UX-07](#ux-07) | Писать артефакт независимо от host; сохранять язык пользователя и машинные ключи схемы отдельно. |
| [ux-flows](#skill-ux-flows) | super-ux | [UX-09](#ux-09), [UX-10](#ux-10), [UX-11](#ux-11), [UX-14](#ux-14), [UX-15](#ux-15) | Сценарии выражают наблюдаемое поведение; частота приёма конкурентов не доказывает его эффективность. |
| [ux-audit](#skill-ux-audit) | super-ux | [UX-01](#ux-01), [UX-02](#ux-02), [UX-03](#ux-03), [UX-12](#ux-12), [UX-13](#ux-13), [UX-14](#ux-14), [UX-15](#ux-15) | Раздельно отмечать static conformance и runtime observed; ограничивать проверки предметом изменения. |
| [ux-scenarios](#skill-ux-scenarios) | super-ux | [UX-10](#ux-10), [UX-11](#ux-11), [UX-14](#ux-14), [UX-15](#ux-15) | Описывать предусловия, наблюдаемые исходы и уровень проверки; поддержать local/staging и обход optional Figma. |
| [ux-foundation](#skill-ux-foundation) | super-ux | [UX-08](#ux-08), [UX-09](#ux-09), [UX-10](#ux-10), [UX-14](#ux-14), [UX-15](#ux-15) | Разделить verified fact, founder decision и hypothesis; убрать выдуманные технические/правовые предпосылки. |
| [project-audit](#skill-project-audit) | task-pipeline | [PA-01](#pa-01), [PA-02](#pa-02), [PA-03](#pa-03), [ED-01](#ed-01) | Сохранять finding независимо от принятого риска; source defect отделять от production incidence; HTML policy едина. |
| [task-pipeline](#skill-task-pipeline) | task-pipeline | [TP-01](#tp-01), [TP-02](#tp-02), [TP-03](#tp-03), [TP-04](#tp-04), [EV-01](#ev-01) | Профили по scope/risk; не навязывать полный цикл каждому изменению и не удалять редкие защитные правила по частоте. |
| [evidence-docs](#skill-evidence-docs) | task-pipeline | [ED-01](#ed-01) | Объявлять bundle dependencies и честный proof kind; сделать одиночную установку разрешимой либо явно неподдерживаемой. |
| [agent-sync](#skill-agent-sync) | agent-sync | [SY-01](#sy-01), [SY-02](#sy-02), [SY-03](#sy-03), [SY-04](#sy-04), [SY-05](#sy-05), [SY-06](#sy-06), [SY-07](#sy-07), [SY-08](#sy-08) | Стабильная выдача ID; leases на ресурс с fencing и owner-specific renewal; честная граница hook enforcement. |
| [make-skill](#skill-make-skill) | make-skill | [MS-01](#ms-01), [MS-02](#ms-02), [MS-03](#ms-03), [MS-04](#ms-04), [ED-01](#ed-01), [EV-01](#ev-01) | Настоящие YAML-типы и tokenizer; audit без побочных release effects; адаптер требований конкретного host. |
| [sheleg-design](#skill-sheleg-design) | sheleg-design | [DS-01](#ds-01), [DS-02](#ds-02), [DS-03](#ds-03), [DS-04](#ds-04), [DS-05](#ds-05), [DS-06](#ds-06) | Общий semantic token contract + adapters; условия доступности/производительности вместо неподтверждённых универсальных gates. |
| [seo-aeo-audit](#skill-seo-aeo-audit) | seo-aeo-audit | [SE-01](#se-01), [SE-02](#se-02), [SE-03](#se-03), [SE-04](#se-04), [EV-01](#ev-01) | Иерархия Google требований и рекомендаций; scope manual actions; не выдавать source category за истинность claim. |
| [google-auth](#skill-google-auth) | sheleg-dev | [DV-07](#dv-07), [DV-08](#dv-08), [DV-09](#dv-09), [DV-10](#dv-10), [DV-19](#dv-19) | Серверное хранилище токенов; изоляция клиентов/сессий; state/nonce lifecycle и верный ADC precedence. |
| [google-signin](#skill-google-signin) | sheleg-dev | [DV-10](#dv-10), [DV-11](#dv-11), [DV-12](#dv-12), [DV-19](#dv-19) | Серверная одноразовая challenge; email authority; fail-closed CSRF и negative/replay fixtures. |
| [error-tracking](#skill-error-tracking) | sheleg-dev | [DV-15](#dv-15), [DV-16](#dv-16), [DV-19](#dv-19) | Проверять scrubber на URL credentials и bot tokens; согласовать восстановление Telegram session с владельцем домена. |
| [frontend-performance](#skill-frontend-performance) | sheleg-dev | [DV-17](#dv-17), [DV-18](#dv-18), [DV-19](#dv-19) | Разделять измерения field/lab и условные оптимизации; профиль подтверждает улучшение. |
| [crypto-payments](#skill-crypto-payments) | sheleg-dev | [DV-05](#dv-05), [DV-06](#dv-06), [DV-19](#dv-19) | Явная state machine с paid/refunded; валюты и единицы расчёта; не кредитовать любой mapped FINAL. |
| [stripe-billing](#skill-stripe-billing) | sheleg-dev | [DV-01](#dv-01), [DV-02](#dv-02), [DV-03](#dv-03), [DV-04](#dv-04), [DV-19](#dv-19) | Транзакционный inbox/business ledger/outbox; crash recovery, порядок событий и суммы возвратов. |
| [ad-tracking](#skill-ad-tracking) | sheleg-dev | [DV-13](#dv-13), [DV-14](#dv-14), [DV-19](#dv-19) | Все каналы, включая noscript, читают один consent state; отличать platform policy от юридического основания. |
| [agent-harness](#skill-agent-harness) | agent-stack | [AS-04](#as-04), [AS-05](#as-05), [AS-11](#as-11), [AS-14](#as-14) | Не путать boolean confirmation с authority; динамический граф проверять по trace; partial evidence сохранять без eval corpus. |
| [agent-evals](#skill-agent-evals) | agent-stack | [AS-06](#as-06), [AS-07](#as-07), [AS-08](#as-08), [AS-09](#as-09), [AS-10](#as-10) | Synthetic+production корпуса; temporal safety assertions; корректная статистика и недублируемый usage. |
| [agent-orchestrator](#skill-agent-orchestrator) | agent-stack | [AS-01](#as-01), [AS-02](#as-02), [AS-03](#as-03), [AS-04](#as-04), [AS-05](#as-05) | Durable saga и accounting invariants; сохранять control edges; provenance-aware memory без слияния отрицаний. |
| [agent-interop](#skill-agent-interop) | agent-stack | [AS-12](#as-12), [AS-13](#as-13) | Матрица capabilities MCP/A2A; закреплённые запускаемые SDK examples с migration tests. |
| [telegram-bots](#skill-telegram-bots) | telegram-dev | [TG-01](#tg-01), [TG-02](#tg-02) | Доказать бизнес-эффект после crash/retry; учитывать сохранённые allowed_updates. |
| [telegram-userbots](#skill-telegram-userbots) | telegram-dev | [DV-16](#dv-16), [TG-05](#tg-05) | Ограничивать суммарный retry budget; необратимую revoked session не пытаться лечить перезапуском. |
| [telegram-miniapps](#skill-telegram-miniapps) | telegram-dev | [TG-03](#tg-03), [TG-04](#tg-04) | Различать HMAC и Ed25519 canonicalization; проверять future timestamp и поддерживать menu launch/query flows. |



<a id="skill-brand-voice"></a>

### brand-voice

**Сейчас:** Создаёт словарь, голос и реестр фактов бренда. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/brand-voice/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/brand-voice/SKILL.md). Тело: 1413 cl100k tokens.

**Целевая роль:** Связывать полные утверждения с типизированными фактами; лексические эвристики показывать как advisory.

**Исправления и приёмка:**

- [UX-01 — B030 не доказывает происхождение утверждения](#ux-01): FIX-UX-01 в M2. Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.

- [UX-02 — B051 объявляет спамом текст без единого повторения](#ux-02): FIX-UX-02 в M2. 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

- [UX-03 — Humanization «никогда не блокирует» расходится с исполняемым B060](#ux-03): FIX-UX-03 в M2. Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.



<a id="skill-copywriting"></a>

### copywriting

**Сейчас:** Пишет текст по сценариям и бренд-паку. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/copywriting/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md). Тело: 1995 cl100k tokens.

**Целевая роль:** Однозначно назначить владельца strings.md; проверить реальный выход модели и статус процесса, а не маркер.

**Исправления и приёмка:**

- [UX-01 — B030 не доказывает происхождение утверждения](#ux-01): FIX-UX-01 в M2. Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.

- [UX-02 — B051 объявляет спамом текст без единого повторения](#ux-02): FIX-UX-02 в M2. 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

- [UX-03 — Humanization «никогда не блокирует» расходится с исполняемым B060](#ux-03): FIX-UX-03 в M2. Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.

- [UX-04 — У одного скилла два несовместимых правила владения strings.md](#ux-04): FIX-UX-04 в M4. Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.

- [UX-05 — Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт](#ux-05): FIX-UX-05 в M2. Обе mock-подмены из probes должны FAIL; невалидный exit никогда PASS; успешный artifact с двумя поверхностями и двумя корректными строками проходит; репозиторий до/после одинаков.

- [UX-15 — BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15): FIX-UX-15 в M4. Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



<a id="skill-vision"></a>

### vision

**Сейчас:** Собирает исходное продуктовое направление и допущения. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/vision/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/vision/SKILL.md). Тело: 1767 cl100k tokens.

**Целевая роль:** Писать артефакт независимо от host; сохранять язык пользователя и машинные ключи схемы отдельно.

**Исправления и приёмка:**

- [UX-06 — Новый проект Codex получает правило в CLAUDE.md](#ux-06): FIX-UX-06 в M5. Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.

- [UX-07 — Язык vision и обязательный формат заголовков не согласованы на входе](#ux-07): FIX-UX-07 в M5. Русский fixture всех 9 секций проходит по canonical IDs; действительно отсутствующая anti-vision fail; изменение языка title не меняет identity.



<a id="skill-ux-flows"></a>

### ux-flows

**Сейчас:** Описывает переходы, состояния и библиотеку практик. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md). Тело: 4229 cl100k tokens.

**Целевая роль:** Сценарии выражают наблюдаемое поведение; частота приёма конкурентов не доказывает его эффективность.

**Исправления и приёмка:**

- [UX-09 — Воронки конкурентов из proxy превращаются в «proven base»](#ux-09): FIX-UX-09 в M4. Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.

- [UX-10 — Loading из существующей задержки превращён в инсценировку вычисления](#ux-10): FIX-UX-10 в M4. Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

- [UX-11 — Figma fallback и provisional flow не доходят до разрешённого build state](#ux-11): FIX-UX-11 в M3. Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

- [UX-14 — BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](#ux-14): FIX-UX-14 в M4. Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

- [UX-15 — BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15): FIX-UX-15 в M4. Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



<a id="skill-ux-audit"></a>

### ux-audit

**Сейчас:** Сопоставляет реализацию со сценариями и evidence. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md). Тело: 4304 cl100k tokens.

**Целевая роль:** Раздельно отмечать static conformance и runtime observed; ограничивать проверки предметом изменения.

**Исправления и приёмка:**

- [UX-01 — B030 не доказывает происхождение утверждения](#ux-01): FIX-UX-01 в M2. Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.

- [UX-02 — B051 объявляет спамом текст без единого повторения](#ux-02): FIX-UX-02 в M2. 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

- [UX-03 — Humanization «никогда не блокирует» расходится с исполняемым B060](#ux-03): FIX-UX-03 в M2. Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.

- [UX-12 — Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата](#ux-12): FIX-UX-12 в M2. Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.

- [UX-13 — Общий precondition требует scenarios даже независимому copy/benchmark scope](#ux-13): FIX-UX-13 в M3. Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.

- [UX-14 — BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](#ux-14): FIX-UX-14 в M4. Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

- [UX-15 — BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15): FIX-UX-15 в M4. Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



<a id="skill-ux-scenarios"></a>

### ux-scenarios

**Сейчас:** Даёт общий формат сценариев для последующих работ. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-scenarios/SKILL.md). Тело: 1954 cl100k tokens.

**Целевая роль:** Описывать предусловия, наблюдаемые исходы и уровень проверки; поддержать local/staging и обход optional Figma.

**Исправления и приёмка:**

- [UX-10 — Loading из существующей задержки превращён в инсценировку вычисления](#ux-10): FIX-UX-10 в M4. Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

- [UX-11 — Figma fallback и provisional flow не доходят до разрешённого build state](#ux-11): FIX-UX-11 в M3. Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

- [UX-14 — BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](#ux-14): FIX-UX-14 в M4. Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

- [UX-15 — BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15): FIX-UX-15 в M4. Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



<a id="skill-ux-foundation"></a>

### ux-foundation

**Сейчас:** Связывает аудитории, задачи и продуктовые ограничения. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/SKILL.md). Тело: 1961 cl100k tokens.

**Целевая роль:** Разделить verified fact, founder decision и hypothesis; убрать выдуманные технические/правовые предпосылки.

**Исправления и приёмка:**

- [UX-08 — Approval оператора может стереть происхождение предположения](#ux-08): FIX-UX-08 в M2. Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.

- [UX-09 — Воронки конкурентов из proxy превращаются в «proven base»](#ux-09): FIX-UX-09 в M4. Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.

- [UX-10 — Loading из существующей задержки превращён в инсценировку вычисления](#ux-10): FIX-UX-10 в M4. Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

- [UX-14 — BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](#ux-14): FIX-UX-14 в M4. Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

- [UX-15 — BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15): FIX-UX-15 в M4. Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



<a id="skill-project-audit"></a>

### project-audit

**Сейчас:** Даёт структуру диагностики целого проекта. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md). Тело: 3446 cl100k tokens.

**Целевая роль:** Сохранять finding независимо от принятого риска; source defect отделять от production incidence; HTML policy едина.

**Исправления и приёмка:**

- [PA-01 — Документированное решение автоматически оправдывает дефект](#pa-01): FIX-PA-01 в M2. Фикстура ADR разрешает логирование refresh token: аудитор всё равно обнаруживает раскрытие, связывает с ADR; сознательная поддержка только одного браузера при подходящем контракте — accepted limitation.

- [PA-02 — Отсутствие production измерения запрещает считать доказанный механизм дефектом](#pa-02): FIX-PA-02 в M2. Race reproduced/production unknown остаётся finding; нулевая выборка не превращается в нулевой риск; JSON хранит scope и время наблюдения.

- [PA-03 — Опциональная HTML-страница обязательна в критерии выхода](#pa-03): FIX-PA-03 в M2. Без --report HTML не создаётся и run complete допустим; --report требует существующий HTML, безопасные ссылки и inspect/render status.

- [ED-01 — Переносимость зависит от совместной упаковки соседнего task-pipeline](#ed-01): FIX-ED-01 в M5. Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.



<a id="skill-task-pipeline"></a>

### task-pipeline

**Сейчас:** Организует поставку изменений и её проверок. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md). Тело: 4607 cl100k tokens.

**Целевая роль:** Профили по scope/risk; не навязывать полный цикл каждому изменению и не удалять редкие защитные правила по частоте.

**Исправления и приёмка:**

- [TP-01 — Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе](#tp-01): FIX-TP-01 в M3. Полный brief → 0 лишних вопросов, задача с реальным неоднозначным контрактом → один содержательный вопрос; отдельно измерить quality/time/tokens с baseline.

- [TP-02 — Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»](#tp-02): FIX-TP-02 в M3. Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.

- [TP-03 — Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами](#tp-03): FIX-TP-03 в M3. Трёхстадийный custom profile валиден и не получает дополнительные stage0/7/10; обязательные kernel invariants всё равно проверяются.

- [TP-04 — Неиспользованное правило автоматически считается ненужным](#tp-04): FIX-TP-04 в M3. Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.

- [EV-01 — Проверка выбора названия не доказывает пользу выполнения скилла](#ev-01): FIX-EV-01 в M6. Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



<a id="skill-evidence-docs"></a>

### evidence-docs

**Сейчас:** Требует доказательств для документальных утверждений. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/task-pipeline/plugins/task-pipeline/skills/evidence-docs/SKILL.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/evidence-docs/SKILL.md). Тело: 1883 cl100k tokens.

**Целевая роль:** Объявлять bundle dependencies и честный proof kind; сделать одиночную установку разрешимой либо явно неподдерживаемой.

**Исправления и приёмка:**

- [ED-01 — Переносимость зависит от совместной упаковки соседнего task-pipeline](#ed-01): FIX-ED-01 в M5. Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.



<a id="skill-agent-sync"></a>

### agent-sync

**Сейчас:** Предоставляет журнал, IDs, claims и координацию. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md). Тело: 4506 cl100k tokens.

**Целевая роль:** Стабильная выдача ID; leases на ресурс с fencing и owner-specific renewal; честная граница hook enforcement.

**Исправления и приёмка:**

- [SY-01 — Выданные IDs меняются задним числом; два reserve возвращают один номер](#sy-01): FIX-SY-01 в M1. Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.

- [SY-02 — Общий last-renew позволяет активности одного агента подавлять продление чужих leases](#sy-02): FIX-SY-02 в M1. С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.

- [SY-03 — Local renew перезаписывает уже завершённый steal](#sy-03): FIX-SY-03 в M1. Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.

- [SY-04 — Task lease не защищает общий файл от владельца другой task lease](#sy-04): FIX-SY-04 в M1. Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.

- [SY-05 — Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают](#sy-05): FIX-SY-05 в M1. Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.

- [SY-06 — Одно gated смешивает lease guarantee, видимость и наличие host enforcement](#sy-06): FIX-SY-06 в M5. Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.

- [SY-07 — Guard охватывает редактор и некоторые git commit, но не все записи через shell](#sy-07): FIX-SY-07 в M5. Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.

- [SY-08 — Поиск task-pipeline не учитывает native Codex plugin cache](#sy-08): FIX-SY-08 в M5. Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.



<a id="skill-make-skill"></a>

### make-skill

**Сейчас:** Упаковывает и проверяет skills/plugins. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/make-skill/plugins/make-skill/skills/make-skill/SKILL.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md). Тело: 4557 cl100k tokens.

**Целевая роль:** Настоящие YAML-типы и tokenizer; audit без побочных release effects; адаптер требований конкретного host.

**Исправления и приёмка:**

- [MS-01 — Приближение chars/3.9 выдаёт PASS токенового лимита](#ms-01): FIX-MS-01 в M2. Unicode, английский, код, смешанный RU/EN; сравнение с независимым tokenizer; отсутствие библиотеки не возвращает PASS измерения.

- [MS-02 — Самодельный YAML parser теряет типы metadata](#ms-02): FIX-MS-02 в M2. Двусторонние fixtures: quoted/unquoted numeric, boolean, null, YAML escapes, multiline scalars, duplicate keys; одинаковые вердикты с upstream validator.

- [MS-03 — Аудит по описанию автоматически превращается в исправление и release](#ms-03): FIX-MS-03 в M3. Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.

- [MS-04 — Платформенные ограничения описаны как универсальные и частично устарели](#ms-04): FIX-MS-04 в M5. Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.

- [ED-01 — Переносимость зависит от совместной упаковки соседнего task-pipeline](#ed-01): FIX-ED-01 в M5. Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.

- [EV-01 — Проверка выбора названия не доказывает пользу выполнения скилла](#ev-01): FIX-EV-01 в M6. Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



<a id="skill-sheleg-design"></a>

### sheleg-design

**Сейчас:** Содержит визуальные пакеты, motion и Figma handoff. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md). Тело: 4275 cl100k tokens.

**Целевая роль:** Общий semantic token contract + adapters; условия доступности/производительности вместо неподтверждённых универсальных gates.

**Исправления и приёмка:**

- [DS-01 — Сравнение packs сменой CSS не имеет общего token API](#ds-01): FIX-DS-01 в M5. Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.

- [DS-02 — Опрос о значении craft превращён в нормативный порядок разработки](#ds-02): FIX-DS-02 в M4. Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.

- [DS-03 — Производительность CSS/API описана абсолютами вместо проверяемых условий](#ds-03): FIX-DS-03 в M4. Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.

- [DS-04 — Duration table допускает 500ms, общий UI gate запрещает >300ms](#ds-04): FIX-DS-04 в M4. 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.

- [DS-05 — No-JS критерий применяется ко всем поверхностям, включая внутренние UI](#ds-05): FIX-DS-05 в M4. Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.

- [DS-06 — Eval-регрессия не покрывает текущий composition/runtime](#ds-06): FIX-DS-06 в M6. Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.



<a id="skill-seo-aeo-audit"></a>

### seo-aeo-audit

**Сейчас:** Покрывает техническую доступность, источники и извлечение ответов. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md). Тело: 4398 cl100k tokens.

**Целевая роль:** Иерархия Google требований и рекомендаций; scope manual actions; не выдавать source category за истинность claim.

**Исправления и приёмка:**

- [SE-01 — Рекомендации Discover превращены в обязательный gate](#se-01): FIX-SE-01 в M4. Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.

- [SE-02 — Любая manual action объявлена обнулением всех улучшений сайта](#se-02): FIX-SE-02 в M4. Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.

- [SE-03 — Cross-track проверка объявляет совместимые наблюдения противоречием](#se-03): FIX-SE-03 в M4. Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.

- [SE-04 — Тип источника автоматически подменяет силу конкретного утверждения](#se-04): FIX-SE-04 в M4. Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.

- [EV-01 — Проверка выбора названия не доказывает пользу выполнения скилла](#ev-01): FIX-EV-01 в M6. Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



<a id="skill-google-auth"></a>

### google-auth

**Сейчас:** Покрывает OAuth, токены и Application Default Credentials. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/SKILL.md). Тело: 1987 cl100k tokens.

**Целевая роль:** Серверное хранилище токенов; изоляция клиентов/сессий; state/nonce lifecycle и верный ADC precedence.

**Исправления и приёмка:**

- [DV-07 — OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie](#dv-07): FIX-DV-07 в M1. Локальный HTTP client выполняет stubbed OAuth callback, декодирует Set-Cookie: ни client_secret, ни access/refresh token отсутствуют; stdout/stderr также чисты.

- [DV-08 — ADC precedence написан в обратном порядке](#dv-08): FIX-DV-08 в M4. В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.

- [DV-09 — Express OAuth использует общий mutable client и неполную проверку state](#dv-09): FIX-DV-09 в M1. Интерливинг A/B с задержкой между setCredentials и transport использует разные Authorization; missing/expired/reused state не вызывает token endpoint.

- [DV-10 — Nonce равен присланному клиентом значению, а не ожидаемому сервером](#dv-10): FIX-DV-10 в M1. Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-google-signin"></a>

### google-signin

**Сейчас:** Описывает проверку личности и связывание аккаунтов. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md). Тело: 1425 cl100k tokens.

**Целевая роль:** Серверная одноразовая challenge; email authority; fail-closed CSRF и negative/replay fixtures.

**Исправления и приёмка:**

- [DV-10 — Nonce равен присланному клиентом значению, а не ожидаемому сервером](#dv-10): FIX-DV-10 в M1. Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.

- [DV-11 — Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом](#dv-11): FIX-DV-11 в M1. JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.

- [DV-12 — Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract](#dv-12): FIX-DV-12 в M1. TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-error-tracking"></a>

### error-tracking

**Сейчас:** Описывает сбор, очистку и обработку ошибок. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/SKILL.md). Тело: 2641 cl100k tokens.

**Целевая роль:** Проверять scrubber на URL credentials и bot tokens; согласовать восстановление Telegram session с владельцем домена.

**Исправления и приёмка:**

- [DV-15 — Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs](#dv-15): FIX-DV-15 в M1. Canary matrix fake Redis/AMQP/Postgres URLs, encoded credentials, Telegram path, access-token query, nested events; ни один fake secret не доходит до test transport.

- [DV-16 — Правила восстановления дают противоположные действия для отозванной сессии](#dv-16): FIX-DV-16 в M4. Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-frontend-performance"></a>

### frontend-performance

**Сейчас:** Собирает диагностику производительности страницы. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md). Тело: 2336 cl100k tokens.

**Целевая роль:** Разделять измерения field/lab и условные оптимизации; профиль подтверждает улучшение.

**Исправления и приёмка:**

- [DV-17 — FCP ошибочно объявлен неизмеримым в поле](#dv-17): FIX-DV-17 в M4. Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.

- [DV-18 — Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев](#dv-18): FIX-DV-18 в M4. Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-crypto-payments"></a>

### crypto-payments

**Сейчас:** Разделяет статусы провайдера и внутренний расчёт. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md). Тело: 4245 cl100k tokens.

**Целевая роль:** Явная state machine с paid/refunded; валюты и единицы расчёта; не кредитовать любой mapped FINAL.

**Исправления и приёмка:**

- [DV-05 — Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID](#dv-05): FIX-DV-05 в M1. pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.

- [DV-06 — Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера](#dv-06): FIX-DV-06 в M4. Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-stripe-billing"></a>

### stripe-billing

**Сейчас:** Собирает жизненный цикл подписки, webhook и entitlement. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/SKILL.md). Тело: 4222 cl100k tokens.

**Целевая роль:** Транзакционный inbox/business ledger/outbox; crash recovery, порядок событий и суммы возвратов.

**Исправления и приёмка:**

- [DV-01 — Claim фиксирует получение, но ошибочно считается завершением работы](#dv-01): FIX-DV-01 в M1. Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.

- [DV-02 — Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant](#dv-02): FIX-DV-02 в M1. Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.

- [DV-03 — Компенсация количества не компенсирует уже снятые деньги](#dv-03): FIX-DV-03 в M1. Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.

- [DV-04 — Refund CAS проигрыш молча теряет больший cumulative refund](#dv-04): FIX-DV-04 в M1. Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-ad-tracking"></a>

### ad-tracking

**Сейчас:** Связывает browser/server события и consent state. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md). Тело: 4204 cl100k tokens.

**Целевая роль:** Все каналы, включая noscript, читают один consent state; отличать platform policy от юридического основания.

**Исправления и приёмка:**

- [DV-13 — Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты](#dv-13): FIX-DV-13 в M4. Near-miss advertiser-only GA4/Ads без publisher inventory не требует certified CMP автоматически; Basic проходит; неизвестная юрисдикция не автоматически granted.

- [DV-14 — Безусловный noscript pixel противоречит consent-gated архитектуре](#dv-14): FIX-DV-14 в M1. Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.

- [DV-19 — Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19): FIX-DV-19 в M6. Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="skill-agent-harness"></a>

### agent-harness

**Сейчас:** Задаёт ограничения исполнения, audit и scanner. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/SKILL.md). Тело: 2665 cl100k tokens.

**Целевая роль:** Не путать boolean confirmation с authority; динамический граф проверять по trace; partial evidence сохранять без eval corpus.

**Исправления и приёмка:**

- [AS-04 — Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload](#as-04): FIX-AS-04 в M1. Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.

- [AS-05 — Аудируемость ошибочно приравнена к статическому графу](#as-05): FIX-AS-05 в M4. Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.

- [AS-11 — confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности](#as-11): FIX-AS-11 в M1. Agent-authored confirm:true без grant отвергается; повтор с изменёнными arguments также; заранее авторизованное действие проходит. Сценарий untrusted content→destructive write входит в threat tests независимо от private-data доступа.

- [AS-14 — Отсутствие evals ошибочно делает весь аудит unfalsifiable](#as-14): FIX-AS-14 в M2. Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.



<a id="skill-agent-evals"></a>

### agent-evals

**Сейчас:** Систематизирует eval sets, grading и метрики. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md). Тело: 4079 cl100k tokens.

**Целевая роль:** Synthetic+production корпуса; temporal safety assertions; корректная статистика и недублируемый usage.

**Исправления и приёмка:**

- [AS-06 — Первый релиз фактически остаётся без исполняемого eval-корпуса](#as-06): FIX-AS-06 в M2. Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.

- [AS-07 — Запрет проверки порядка пропускает подтверждение после действия](#as-07): FIX-AS-07 в M2. Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.

- [AS-08 — Статистические правила выдают предположения за универсальные границы](#as-08): FIX-AS-08 в M2. Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.

- [AS-09 — OpenTelemetry: закрытый enum и неверное сложение вложенных token counters](#as-09): FIX-AS-09 в M2. Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.

- [AS-10 — Повтор проверки старого ответа назван проверкой изменения решения модели](#as-10): FIX-AS-10 в M2. Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.



<a id="skill-agent-orchestrator"></a>

### agent-orchestrator

**Сейчас:** Даёт паттерны графов, памяти и учёта расходов. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/SKILL.md). Тело: 4217 cl100k tokens.

**Целевая роль:** Durable saga и accounting invariants; сохранять control edges; provenance-aware memory без слияния отрицаний.

**Исправления и приёмка:**

- [AS-01 — Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ](#as-01): FIX-AS-01 в M1. Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.

- [AS-02 — Нулевой baseline путается с отсутствующим: первый реальный расход теряется](#as-02): FIX-AS-02 в M1. Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.

- [AS-03 — Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию](#as-03): FIX-AS-03 в M1. Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.

- [AS-04 — Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload](#as-04): FIX-AS-04 в M1. Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.

- [AS-05 — Аудируемость ошибочно приравнена к статическому графу](#as-05): FIX-AS-05 в M4. Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.



<a id="skill-agent-interop"></a>

### agent-interop

**Сейчас:** Определяет выбор протокола и интеграции SDK. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/SKILL.md). Тело: 3079 cl100k tokens.

**Целевая роль:** Матрица capabilities MCP/A2A; закреплённые запускаемые SDK examples с migration tests.

**Исправления и приёмка:**

- [AS-12 — MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor](#as-12): FIX-AS-12 в M4. В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.

- [AS-13 — Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks](#as-13): FIX-AS-13 в M4. Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.



<a id="skill-telegram-bots"></a>

### telegram-bots

**Сейчас:** Покрывает Bot API updates, delivery и идемпотентность. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md). Тело: 2309 cl100k tokens.

**Целевая роль:** Доказать бизнес-эффект после crash/retry; учитывать сохранённые allowed_updates.

**Исправления и приёмка:**

- [TG-01 — Crash fixture зелёный, но после реальной redelivery update теряется](#tg-01): FIX-TG-01 в M1. Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.

- [TG-02 — Оmitted allowed_updates ошибочно приравнен к пустому списку](#tg-02): FIX-TG-02 в M4. Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.



<a id="skill-telegram-userbots"></a>

### telegram-userbots

**Сейчас:** Разбирает MTProto, session и FloodWait. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/telegram-dev/plugins/telegram-dev/skills/telegram-userbots/SKILL.md](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/SKILL.md). Тело: 1718 cl100k tokens.

**Целевая роль:** Ограничивать суммарный retry budget; необратимую revoked session не пытаться лечить перезапуском.

**Исправления и приёмка:**

- [DV-16 — Правила восстановления дают противоположные действия для отозванной сессии](#dv-16): FIX-DV-16 в M4. Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.

- [TG-05 — Лимит одного FloodWait не ограничивает бесконечную retry sequence](#tg-05): FIX-TG-05 в M4. Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.



<a id="skill-telegram-miniapps"></a>

### telegram-miniapps

**Сейчас:** Описывает initData, launch surfaces и серверную проверку. **Вердикт:** structural PASS; semantic/contract GAP. Источник: [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md). Тело: 2029 cl100k tokens.

**Целевая роль:** Различать HMAC и Ed25519 canonicalization; проверять future timestamp и поддерживать menu launch/query flows.

**Исправления и приёмка:**

- [TG-03 — HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle](#tg-03): FIX-TG-03 в M1. Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).

- [TG-04 — Матрица launch surfaces неверно запрещает menu-button query flow](#tg-04): FIX-TG-04 в M4. Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.



## Реестр конкретных замечаний

Каждая карточка содержит локатор, наблюдение, последствие, исправление и приёмку. Ссылки на исходник относятся к зафиксированным версиям выше; номер строки после будущих изменений может сдвинуться. Совместные замечания перечислены один раз. Риск эксплуатации и ошибка в документации разделены полями доказательств.



<a id="rt-01"></a>

### RT-01 · P1 · Лексический роутер теряет намерение и смешивает аудит с изменением

**Затронуто:** sshlg-skills. **Доказательство:** `reproduced`. **План:** FIX-RT-01 → M3; пока proposed.

**Наблюдение:** Ваш запрос выбрал только task-pipeline. «Объясни причину и почини…» возвращает пустой маршрут. Read-only аудит получает одновременно diagnosis и delivery; использование sub-agent ошибочно считается созданием агентной системы. Это доказано для классификатора; фактическое поведение LLM может исправить или усугубить ошибку.

**Локаторы:** [lib/triggers.js:40](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/triggers.js#L40); [lib/triggers.js:740](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/triggers.js#L740); [routing-reproductions.json](routing-reproductions.json)

**Исправление:** Классифицировать по отдельным полям intent, subject, effects и facets; regex оставить источником кандидатов. Audit → make-skill/project-audit без исполнения delivery. Отрицания и поясняющая часть не должны выключать самостоятельную часть запроса на действие.

**Приёмка:** Набор RU/EN: audit-only, объясни+исправь, обычная работа subagent, опечатки и склонения; проверки ожидаемого набора маршрутов и запрещённых побочных действий.



<a id="rt-02"></a>

### RT-02 · P1 · Отказ от одного маршрута выключает всю эскалацию; цитата тоже считается отказом

**Затронуто:** sshlg-skills. **Доказательство:** `reproduced`. **План:** FIX-RT-02 → M3; пока proposed.

**Наблюдение:** «…без дизайна» обнуляет все маршруты в данном ходе; optedOut сохраняется на сессию. Цитируемое «no pipeline.» тоже даёт true. Общая эскалация выключается намеренно по текущей доктрине, но цитата — не выбор пользователя. Это не выключает гарантированно сами LLM-инструкции.

**Локаторы:** [lib/triggers.js:726](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/triggers.js#L726); [lib/turnstate.js:56](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/turnstate.js#L56); [routing-reproductions.json](routing-reproductions.json)

**Исправление:** Хранить waivers по route_id, scope и источнику: явный акт пользователя, не цитата/пример/ответ инструмента. Общесессионный отказ от всех подсказок оставить отдельным осознанным флагом. Изменение нынешней общей политики записать как решение, а не скрытую починку.

**Приёмка:** Отказ от design сохраняет billing и UX; обсуждение фразы отказа не меняет state; явно выбранный session waiver переживает следующий ход и может быть отозван.



<a id="rt-03"></a>

### RT-03 · P2 · Toolkit объявляет доступность машины по инвентарю только Claude Code

**Затронуто:** sshlg-skills. **Доказательство:** `observed`. **План:** FIX-RT-03 → M3; пока proposed.

**Наблюдение:** 527 — число строк Claude inventory, а не измерение доступных именно этому Codex инструментов/скиллов. Plain-ветка включает каталоги и symlink без требования живого SKILL.md; объявление family зависит от id, а не происхождения. Возможны ложная доступность и ошибочный выбор версии.

**Локаторы:** [lib/conflicts.js:157](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/conflicts.js#L157); [lib/conflicts.js:182](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/conflicts.js#L182); [lib/toolkit.js:200](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/toolkit.js#L200)

**Исправление:** Host adapters: discovered / enabled / exposed / callable отдельно, namespace+provenance+content digest вместо голого id. В отчёте показывать host и недоступные capability; сохранить просмотр других хостов как inventory.

**Приёмка:** Синтетические host homes: broken symlink, одноимённый чужой скилл, plugin только в Claude и skill только в Codex; roster active host содержит только реально разрешимые записи.



<a id="rt-04"></a>

### RT-04 · P2 · Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута

**Затронуто:** sshlg-skills. **Доказательство:** `observed`. **План:** FIX-RT-04 → M3; пока proposed.

**Наблюдение:** Открытый run снимает вопрос сразу для всех маршрутов, а законный отдельный make-skill/UX-аудит без pipeline run может получить «nothing has taken that route yet». Факт работы с предметным скиллом и факт pipeline run — разные события. Bash по договору вообще вне gate; это advisory enforcement, не security boundary.

**Локаторы:** [lib/routegate.js:53](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/routegate.js#L53); [lib/routegate.js:75](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/routegate.js#L75)

**Исправление:** Использовать receipt выбранного маршрута с task_id, skill_digest и допустимыми эффектами. Проверять нужный маршрут, а не существование чужого run.md. Не превращать это в новое подтверждение каждого обратимого действия.

**Приёмка:** Read-only audit с receipt не запрашивает pipeline; старый run не разрешает новую несвязанную публикацию; все bypass/degraded поверхности явно перечислены.



<a id="ms-01"></a>

### MS-01 · P1 · Приближение chars/3.9 выдаёт PASS токенового лимита

**Затронуто:** make-skill. **Доказательство:** `reproduced`. **План:** FIX-MS-01 → M2; пока proposed.

**Наблюдение:** Синтетический body из 16 000 иероглифов = 16 000 cl100k tokens, но аудитор сообщает ~4102 и PASS. На текущих 28 телах реальный токенизатор переполнения не нашёл; дефект в гарантии валидатора, а не в доказанном переполнении семейства.

**Локаторы:** [skills/make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py:95](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/scripts/audit_skill.py#L95); [skills/make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py:371](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/scripts/audit_skill.py#L371); [auditor-reproductions.json](auditor-reproductions.json)

**Исправление:** Подключить реальный именованный tokenizer; без него budget status=UNMEASURED, estimate отдельным полем. House thresholds отделить от требований формата и host policy.

**Приёмка:** Unicode, английский, код, смешанный RU/EN; сравнение с независимым tokenizer; отсутствие библиотеки не возвращает PASS измерения.

**Первичные источники:** [Agent Skills — спецификация](https://agentskills.io/specification)



<a id="ms-02"></a>

### MS-02 · P1 · Самодельный YAML parser теряет типы metadata

**Затронуто:** make-skill. **Доказательство:** `reproduced`. **План:** FIX-MS-02 → M2; пока proposed.

**Наблюдение:** metadata.version: 1.0 парсится настоящим YAML как float, но bundled audit возвращает ноль GAP. Контракт требует string→string. В текущих скиллах эта planted ошибка не заявляется найденной: проверяется способность аудитора обнаружить будущий дефект.

**Локаторы:** [skills/make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py:144](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/scripts/audit_skill.py#L144); [skills/make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py:187](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/scripts/audit_skill.py#L187); [auditor-reproductions.json](auditor-reproductions.json); [https://agentskills.io/specification](https://agentskills.io/specification)

**Исправление:** Разделить полноценный YAML validation и быстрый stdlib precheck. Либо bundle безопасный parser, либо явно ограничить supported subset и не пропускать неподдержанные формы как корректные.

**Приёмка:** Двусторонние fixtures: quoted/unquoted numeric, boolean, null, YAML escapes, multiline scalars, duplicate keys; одинаковые вердикты с upstream validator.

**Первичные источники:** [Agent Skills — спецификация](https://agentskills.io/specification)



<a id="ms-03"></a>

### MS-03 · P1 · Аудит по описанию автоматически превращается в исправление и release

**Затронуто:** make-skill. **Доказательство:** `instruction_conflict`. **План:** FIX-MS-03 → M3; пока proposed.

**Наблюдение:** Workflow Retrofit предписывает исправить всё, bump и release даже когда вход — вопрос о соответствии. Команда skill-audit ограничивает исправления до отчёта, а agent-аудитор вообще только читает. Три входа имеют разные effect contracts. В текущем аудите исходники не менялись благодаря явному пользовательскому scope.

**Локаторы:** [skills/make-skill/plugins/make-skill/skills/make-skill/SKILL.md:201](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md#L201); [skills/make-skill/plugins/make-skill/skills/make-skill/SKILL.md:221](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md#L221)

**Исправление:** Явные режимы audit / retrofit / release. По «audit» только доказательства и план. Переход к записи/публикации определяется намерением и ранее данной авторизацией, а не выбранным скиллом.

**Приёмка:** Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.



<a id="ms-04"></a>

### MS-04 · P2 · Платформенные ограничения описаны как универсальные и частично устарели

**Затронуто:** make-skill. **Доказательство:** `observed`. **План:** FIX-MS-04 → M5; пока proposed.

**Наблюдение:** Фраза «MCP/subagents существуют только внутри Claude Code» неверно описывает этот Codex runtime. Документ о manifests-only тоже устарел: Claude Code с v2.1.233 умеет валидировать frontmatter skill directories. Рекомендации 500/5000 и house правила не равны универсальной причине отказа загрузки.

**Локаторы:** [skills/make-skill/plugins/make-skill/skills/make-skill/SKILL.md:132](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md#L132); [skills/make-skill/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md:137](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md#L137); [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

**Исправление:** Матрица adapter capabilities по версии хоста; native fallback по обнаруженным инструментам. В таблице каждой нормы owner=spec/host/house, required vs recommended и дата последней проверки.

**Приёмка:** Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.

**Первичные источники:** [Claude Code — skills](https://code.claude.com/docs/en/skills); [Claude Code — plugins reference](https://code.claude.com/docs/en/plugins-reference)



<a id="tp-01"></a>

### TP-01 · P1 · Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе

**Затронуто:** task-pipeline. **Доказательство:** `instruction_conflict`. **План:** FIX-TP-01 → M3; пока proposed.

**Наблюдение:** Доктрина гарантированно требует дополнительный human round вместо проверки, есть ли реальный пробел. Утверждение, что меньшая модель всегда дороже из-за переделок, не подкреплено сравнительным измерением. Это увеличивает остановки и стоимость по инструкции; величина реальной потери не измерена.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:99](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L99); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/grill.md:51](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/grill.md#L51); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/model-tiering.md:16](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/model-tiering.md#L16)

**Исправление:** Intake должен строить brief из запроса и источников, спрашивать только недостающие необратимые/продуктовые решения. Сохранять выбранную пользователем модель; менять уровень по измерению задач, а не универсальному постулату.

**Приёмка:** Полный brief → 0 лишних вопросов, задача с реальным неоднозначным контрактом → один содержательный вопрос; отдельно измерить quality/time/tokens с baseline.



<a id="tp-02"></a>

### TP-02 · P1 · Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»

**Затронуто:** task-pipeline. **Доказательство:** `instruction_conflict`. **План:** FIX-TP-02 → M3; пока proposed.

**Наблюдение:** Отсутствие бренда семейства превращается в невозможность пройти UI gate, даже если сценарии уже эквивалентно описаны. Чужой полноценный design workflow объявляется undesigned при отсутствии sheleg-design. Это подмена качества наличием конкретного пакета.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:96](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L96); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md:53](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md#L53); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md:175](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md#L175)

**Исправление:** Гейт проверяет обязательные артефакты/поведение и их качество. Preferred provider из семейства, альтернативный provider с тем же контрактом или inline fallback допустимы. При отсутствии инструмента писать, какая именно проверка не сделана.

**Приёмка:** Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.



<a id="tp-03"></a>

### TP-03 · P2 · Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами

**Затронуто:** task-pipeline. **Доказательство:** `instruction_conflict`. **План:** FIX-TP-03 → M3; пока proposed.

**Наблюдение:** Один текст разрешает wholesale replacement stages, другой запрещает идти дальше без конкретного stage0 и сохраняет references/stages как нормативные. Не определено, какой документ побеждает на custom pipeline; растёт риск ложного gate либо скрытого пропуска контракта.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:253](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L253); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:165](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L165); [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:90](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L90)

**Исправление:** Разделить kernel (effect scope, evidence, dependencies, resume) и default profile (0–10). Сначала компилировать выбранный profile, затем исполнять только его gates. Доктрины называются capability, а не фиксированным номером стадии.

**Приёмка:** Трёхстадийный custom profile валиден и не получает дополнительные stage0/7/10; обязательные kernel invariants всё равно проверяются.



<a id="tp-04"></a>

### TP-04 · P1 · Неиспользованное правило автоматически считается ненужным

**Затронуто:** task-pipeline. **Доказательство:** `observed`. **План:** FIX-TP-04 → M3; пока proposed.

**Наблюдение:** Пять run stamps или 60 дней без срабатывания объявляются доказательством situational rule и поводом удалить standing instruction. Для редкой аварии, security-инварианта и recovery-процедуры отсутствие события не означает отсутствие ценности. Архив сохраняет текст, но убирает активную защиту.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/retrospective.md:280](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/retrospective.md#L280)

**Исправление:** Классы rules: permanent safety/contract, situational, temporary. TTL только временным; cold означает review-needed, не автоматическое отключение. У situational хранить exposure opportunities, не только число запусков.

**Приёмка:** Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.



<a id="pa-01"></a>

### PA-01 · P1 · Документированное решение автоматически оправдывает дефект

**Затронуто:** project-audit. **Доказательство:** `observed`. **План:** FIX-PA-01 → M2; пока proposed.

**Наблюдение:** Решение «так задумано» может быть ошибочным, устаревшим или нарушать внешний контракт. Правило разрешает findings только undecided и unpropagated; documented по определению исключается. Это системный источник false negatives в аудите.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md:162](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md#L162); [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md:163](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md#L163)

**Исправление:** Decision status и technical validity — разные оси. Accepted trade-off может быть отмечен принятой ценой; документированное нарушение остаётся finding с decision_id, причиной пересмотра и контрдоказательством.

**Приёмка:** Фикстура ADR разрешает логирование refresh token: аудитор всё равно обнаруживает раскрытие, связывает с ADR; сознательная поддержка только одного браузера при подходящем контракте — accepted limitation.



<a id="pa-02"></a>

### PA-02 · P1 · Отсутствие production измерения запрещает считать доказанный механизм дефектом

**Затронуто:** project-audit. **Доказательство:** `observed`. **План:** FIX-PA-02 → M2; пока proposed.

**Наблюдение:** Ошибку auth/гонку можно доказать воспроизведением до реального инцидента. Текст требует production incidence для finding, а collector _finding не имеет полей frequency/consequence status, поэтому поведение prose и данных расходится. Может недооценить редкую катастрофическую ошибку.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md:141](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md#L141); [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/scripts/audit.py:898](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/scripts/audit.py#L898)

**Исправление:** Отдельно mechanism status, exploit/reproduction, exposure, observed incidence и impact uncertainty. Доказанный defect может иметь incidence unknown. UNKNOWN не равно 0; отсутствие телеметрии не понижает техническую истинность.

**Приёмка:** Race reproduced/production unknown остаётся finding; нулевая выборка не превращается в нулевой риск; JSON хранит scope и время наблюдения.



<a id="pa-03"></a>

### PA-03 · P2 · Опциональная HTML-страница обязательна в критерии выхода

**Затронуто:** project-audit. **Доказательство:** `instruction_conflict`. **План:** FIX-PA-03 → M2; пока proposed.

**Наблюдение:** Основная часть пишет HTML только при --report, exit criterion требует страницу и её открытие всегда. Read-only также используется как «ничего не записано», хотя sidecar создаётся в docs/audit. Это провоцирует лишние артефакты или ложный done.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md:212](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md#L212); [skills/task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md:258](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/project-audit/SKILL.md#L258)

**Исправление:** Указать read-only относительно target source/data, разрешённый output dir; условный DoD по requested deliverables. Добавить mode stdout/json/html и не требовать браузер для json-only.

**Приёмка:** Без --report HTML не создаётся и run complete допустим; --report требует существующий HTML, безопасные ссылки и inspect/render status.



<a id="ed-01"></a>

### ED-01 · P2 · Переносимость зависит от совместной упаковки соседнего task-pipeline

**Затронуто:** evidence-docs, project-audit, make-skill. **Доказательство:** `reproduced`. **План:** FIX-ED-01 → M5; пока proposed.

**Наблюдение:** При установленном полном plugin всё разрешается. В изолированной копии одного evidence-docs воспроизводятся 11 broken links, project-audit — 3. Bundled auditor разрешает escape при наличии соседа и затем пишет «stays inside». Это условная ошибка для single-skill transport, не доказательство поломки текущей полной установки.

**Локаторы:** [skills/task-pipeline/plugins/task-pipeline/skills/evidence-docs/SKILL.md:16](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/evidence-docs/SKILL.md#L16); [skills/make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py:501](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/scripts/audit_skill.py#L501); [auditor-reproductions.json](auditor-reproductions.json)

**Исправление:** Либо объявлять bundle dependency и тестировать package closure, либо собирать автономный skill artifact с канонической документацией внутри references. Одна source-home, generated copies с digest; не править дубликаты вручную.

**Приёмка:** Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.



<a id="se-01"></a>

### SE-01 · P1 · Рекомендации Discover превращены в обязательный gate

**Затронуто:** seo-aeo-audit. **Доказательство:** `externally_confirmed`. **План:** FIX-SE-01 → M4; пока proposed.

**Наблюдение:** Google допускает indexed+policy-compliant контент без специальных tags; скилл утверждает отсутствие карточки без двух метатегов и маркирует это CONFIRMED blocker. Условия большой картинки, рекомендации и eligibility смешаны.

**Локаторы:** [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:163](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L163); [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/discover.md:147](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/discover.md#L147); [https://developers.google.com/search/docs/appearance/google-discover](https://developers.google.com/search/docs/appearance/google-discover)

**Исправление:** Три отдельные проверки: eligibility, large preview permission (с альтернативой AMP), image selection recommendation. SDK reverse engineering оставить FIELD, без бинарного вывода о допуске.

**Приёмка:** Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.

**Первичные источники:** [Google Search — Discover](https://developers.google.com/search/docs/appearance/google-discover)



<a id="se-02"></a>

### SE-02 · P1 · Любая manual action объявлена обнулением всех улучшений сайта

**Затронуто:** seo-aeo-audit. **Доказательство:** `externally_confirmed`. **План:** FIX-SE-02 → M4; пока proposed.

**Наблюдение:** Google описывает частичные и sitewide manual actions, понижение и исключение страниц. Правило «nothing counts until lifted» может отменить полезную работу для незатронутых страниц и конверсии.

**Локаторы:** [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:182](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L182); [https://support.google.com/webmasters/answer/9044175?hl=en](https://support.google.com/webmasters/answer/9044175?hl=en)

**Исправление:** Записывать action type, affected URL patterns, surface, severity и scope. Приоритет устранения нарушения сохранять, блокировать зависимые действия только в затронутой области.

**Приёмка:** Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.

**Первичные источники:** [Google Search Console — manual actions](https://support.google.com/webmasters/answer/9044175?hl=en)



<a id="se-03"></a>

### SE-03 · P2 · Cross-track проверка объявляет совместимые наблюдения противоречием

**Затронуто:** seo-aeo-audit. **Доказательство:** `observed`. **План:** FIX-SE-03 → M4; пока proposed.

**Наблюдение:** Короткая малоценная страница может идеально извлекаться, а один URL может иметь confirmed HTTP status и hypothetical ranking cause. Предписанное «one did not look properly» заставляет искусственно согласовывать разные свойства и терять реальные данные.

**Локаторы:** [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:219](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L219); [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:216](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L216)

**Исправление:** Сравнивать claim key=(subject,predicate,scope,time,instrument). Противоречие возникает только для несовместимых значений одного predicate; независимые аспекты сохранять.

**Приёмка:** Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.



<a id="se-04"></a>

### SE-04 · P2 · Тип источника автоматически подменяет силу конкретного утверждения

**Затронуто:** seo-aeo-audit. **Доказательство:** `instruction_conflict`. **План:** FIX-SE-04 → M4; пока proposed.

**Наблюдение:** Любой third-party index capped STUDY, но STUDY требует опубликованной методики и выборки. В одном месте STUDY можно ship на подходящей популяции, в другом всё ниже CONFIRMED требует experiments. Наблюдение и переносимость эффекта закодированы одним label.

**Локаторы:** [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/tooling.md:44](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/tooling.md#L44); [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/evidence-tiers.md:29](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/evidence-tiers.md#L29); [skills/seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:243](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L243)

**Исправление:** Разнести source quality, directness, population scope, causal support и uncertainty. Политика rollout определяется риском действия и доказательством эффекта; не blanket рангом поставщика.

**Приёмка:** Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.



<a id="ev-01"></a>

### EV-01 · P1 · Проверка выбора названия не доказывает пользу выполнения скилла

**Затронуто:** task-pipeline, make-skill, seo-aeo-audit. **Доказательство:** `observed`. **План:** FIX-EV-01 → M6; пока proposed.

**Наблюдение:** Исторические результаты честно фиксируют ограничения: contaminated family roster, одиночные ответы name/none, pipeline scenarios не выполнены. В текущем запуске native eval отказал early access. Сводный performance gain над режимом без скиллов не измерен; нельзя заключить, что семейство улучшает работу в целом.

**Локаторы:** [skills/task-pipeline/test/evals/RESULTS.md:3](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/test/evals/RESULTS.md#L3); [skills/make-skill/test/evals/RESULTS.md:91](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/evals/RESULTS.md#L91); [skills/seo-aeo-audit/test/evals/RESULTS.md:38](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/test/evals/RESULTS.md#L38); [native-eval.log](native-eval.log)

**Исправление:** Три испытательных слоя: deterministic tools, routing actual-load traces, end-to-end outcome with/without. Одинаковые задачи, изолированные workspaces, зафиксированные host/model/digests, независимые outcome graders и cost/latency. Разрешить синтетические safety/effect contract тесты до production.

**Приёмка:** Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



<a id="ub-01"></a>

### UB-01 · P2 · Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса

**Затронуто:** sshlg-skills. **Доказательство:** `observed`. **План:** FIX-UB-01 → M3; пока proposed.

**Наблюдение:** Сумма статических description+commands+Claude block не знает активный host, сокращение listing, загрузку по требованию и reuse после compaction. Текст «every session» придаёт расчёту полноты, которой у прибора нет.

**Локаторы:** [test/audit_bundle.py:163](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/test/audit_bundle.py#L163); [test/audit_bundle.py:21](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/test/audit_bundle.py#L21); [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

**Исправление:** Переименовать в raw_catalog_cl100k; отдельно measured_prompt_cost из runtime trace, host version и реально exposed listing. Missing runtime sample → unknown; не оценивать качество по размеру каталога.

**Приёмка:** Сравнить generated listing и фактически переданный prompt на выбранном host; статический подсчёт и runtime measurement никогда не используют одинаковое поле/подпись.

**Первичные источники:** [Claude Code — skills](https://code.claude.com/docs/en/skills)



<a id="ux-01"></a>

### UX-01 · P1 · B030 не доказывает происхождение утверждения

**Затронуто:** brand-voice, copywriting, ux-audit. **Доказательство:** `reproduced`. **План:** FIX-UX-01 → M2; пока proposed.

**Наблюдение:** Все публичные значения объединяются в set без subject, unit, denominator или ссылки утверждения на факт. Единственный факт «supported integrations = 500» разрешает «We serve 500 million paying customers». Воспроизведено: check_facts вернул []. Отдельно пропущены «99 languages» (голые числа <100 не извлекаются) и «2026 integrations» (любое 19xx/20xx объявлено годом).

**Чем ухудшает результат:** Ложный пропуск именно в защите от выдуманных данных. Документ/копирайтер может прочитать отсутствие B030 как подтверждение, хотя предмет и масштаб заменены. Это не доказывает, что такие утверждения уже публиковались.

**Локаторы:** [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:843](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L843); [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:1092](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1092); [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:1134](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1134); [skills/super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md:218](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/brand-voice/references/brand-contract.md#L218)

**Исправление:** Ввести claim-id → fact-id, субъект, единицу, популяцию, дату и разрешённые преобразования. Линтер проверяет ссылку/единицу/точность, семантический аудит проверяет утверждение. До этого сузить обещание B030 до проверки известного числового токена и явно показывать unverified claims. Не исключать год без контекста.

**Приёмка:** Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.



<a id="ux-02"></a>

### UX-02 · P1 · B051 объявляет спамом текст без единого повторения

**Затронуто:** brand-voice, copywriting, ux-audit. **Доказательство:** `reproduced`. **План:** FIX-UX-02 → M2; пока proposed.

**Наблюдение:** После 40 значимых слов любой token >1% даёт error. Для 45 уникальных слов частота каждого 1/45=2.22%; тест получил B051 на item0, ни одного повтора нет. Для короткой страницы условие математически невыполнимо. Дополнительно все marketing code files объединены в один документ без route mapping.

**Чем ухудшает результат:** Блокирует корректную короткую копию и поощряет искусственное удлинение/синонимы; объединение страниц может скрывать локальную переоптимизацию. Фраза «lowers citation likelihood» представлена как измеренный эффект, но в коде это порог без измерения поисковой выдачи.

**Локаторы:** [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:1531](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1531); [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:1538](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1538); [skills/super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md:421](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/brand-voice/references/brand-contract.md#L421)

**Исправление:** Сделать repetition advisory с минимальным count и длиной, учитывать зарегистрированные термины и язык, группировать по реально отрендеренной странице. Удалить универсальное обещание влияния на цитирование. Google описывает unnatural repetition/manipulative intent, а не порог 1%: https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing .

**Приёмка:** 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.



<a id="ux-03"></a>

### UX-03 · P1 · Humanization «никогда не блокирует» расходится с исполняемым B060

**Затронуто:** brand-voice, copywriting, ux-audit. **Доказательство:** `reproduced`. **План:** FIX-UX-03 → M2; пока proposed.

**Наблюдение:** SKILL запрещает превращать marker count в verdict/gate; reference задаёт grades «reads as written by a person», «decisive on its own», error при 3 S1. Код считает substring и выдаёт error. Цитата-словарь с delve / needless to say / in conclusion воспроизводит error и Naturalness grade C; Humanization: off с причиной ничего не меняет.

**Чем ухудшает результат:** Ухудшает авторский текст ради прохождения линтера и противоречит обязательной сохранности цитат. Возникает эвристическое распознавание происхождения текста без валидированной модели и без калибровки по языкам.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/copywriting/SKILL.md:128](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md#L128); [skills/super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:31](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/references/ai-tells.md#L31); [skills/super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:35](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/references/ai-tells.md#L35); [skills/super-ux/plugins/super-ux/scripts/brand_lint.py:1600](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1600)

**Исправление:** Единый контракт: humanization review всегда advisory, word markers не устанавливают authorship/naturalness grade. Учитывать цитаты/код/термины, разделить редакционный off и явно выбранные brand bans. Удалить severity переход из количества маркеров.

**Приёмка:** Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.



<a id="ux-04"></a>

### UX-04 · P2 · У одного скилла два несовместимых правила владения strings.md

**Затронуто:** copywriting. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-UX-04 → M4; пока proposed.

**Наблюдение:** Правило «This skill never writes to docs/brand/» абсолютно; Write step 5 и DoD требуют добавлять/обновлять strings.md, который находится в docs/brand/.

**Чем ухудшает результат:** Агент либо нарушает собственный запрет, либо оставляет реестр несогласованным, либо делает лишний handoff на каждую строку.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/copywriting/SKILL.md:25](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md#L25); [skills/super-ux/plugins/super-ux/skills/copywriting/SKILL.md:81](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md#L81); [skills/super-ux/plugins/super-ux/skills/copywriting/SKILL.md:161](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md#L161)

**Исправление:** Разделить ownership по файлам: brand-voice владеет voice/terms/facts/channels/locale policy, copywriting пишет strings.md (proposed) и продуктовый текст. Общая схема явно разрешает эти mutations и claim при координации.

**Приёмка:** Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.



<a id="ux-05"></a>

### UX-05 · P1 · Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт

**Затронуто:** copywriting. **Доказательство:** `reproduced`. **План:** FIX-UX-05 → M2; пока proposed.

**Наблюдение:** run.py не проверяет subprocess.returncode и оценивает substring. Подмена процесса на exit 1 с stdout «Humanization: no copy produced; process failed» даёт PASS/exit 0 (EV-01). EV-04 обещает отдельную status line на поверхность, но expect содержит только один Humanization:; одна строка без обеих копий также PASS. Это локальная mock-проверка scorer, не запуск модели. Обозначения EV-01 и EV-04 в этом описании — локальные eval fixtures super-ux, не идентификаторы замечаний сводного реестра.

**Чем ухудшает результат:** Метрика измеряет печать слова, а называется выполнением humanization. Ошибка harness может отчётно подтвердить отсутствие работы. cwd=реальный репозиторий, без изолированного fixture, даёт риск изменения/контаминации, платный запуск здесь намеренно не выполнялся.

**Локаторы:** [skills/super-ux/test/evals/run.py:54](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/run.py#L54); [skills/super-ux/test/evals/run.py:62](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/run.py#L62); [skills/super-ux/test/evals/cases.json:7](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/cases.json#L7); [skills/super-ux/test/evals/cases.json:40](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/cases.json#L40)

**Исправление:** Ошибка/timeout/tool refusal = отдельный outcome; изолированный fixture, фиксированный scope tools, запись run manifest/stdout/artifacts. Проверять число surfaces и изменения текста/semantic invariants; не только наличие строки. Отдельно тестировать order sweeps и no-op уже хорошего текста.

**Приёмка:** Обе mock-подмены из probes должны FAIL; невалидный exit никогда PASS; успешный artifact с двумя поверхностями и двумя корректными строками проходит; репозиторий до/после одинаков.



<a id="ux-06"></a>

### UX-06 · P2 · Новый проект Codex получает правило в CLAUDE.md

**Затронуто:** vision. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-UX-06 → M5; пока proposed.

**Наблюдение:** Step 4 правильно перечисляет файлы по агенту, затем при отсутствии всех создаёт CLAUDE.md. Линтер удовлетворяется любым из трёх файлов и не проверяет, читает ли его текущий host.

**Чем ухудшает результат:** В Codex/Gemini rule может быть установлен в невидимый файл, а наличие считаться выполненным. Это точный противоречивый путь инструкции; новый host session не запускался.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/vision/SKILL.md:123](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/vision/SKILL.md#L123); [skills/super-ux/plugins/super-ux/skills/vision/SKILL.md:125](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/vision/SKILL.md#L125); [skills/super-ux/plugins/super-ux/scripts/ux_lint.py:787](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/ux_lint.py#L787)

**Исправление:** Сначала определить host capabilities; default instruction target по текущему host, explicit project target приоритетнее. Проверка должна сверять materialized rule с активным target, не только с существованием любого файла.

**Приёмка:** Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.



<a id="ux-07"></a>

### UX-07 · P2 · Язык vision и обязательный формат заголовков не согласованы на входе

**Затронуто:** vision. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-UX-07 → M5; пока proposed.

**Наблюдение:** SKILL велит писать на языке документации, но не требует прочитать scenario-format и не выделяет invariant headings. Контракт и regex требуют девять буквальных английских heading. Русская vision с семантически эквивалентными секциями будет U030.

**Чем ухудшает результат:** Риск лишнего rewrite/отказа валидации для корректного русскоязычного документа. В отличие от тела, это форматная неоднозначность, а не претензия к девяти выбранным слоям.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/vision/SKILL.md:68](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/vision/SKILL.md#L68); [skills/super-ux/plugins/super-ux/skills/ux-scenarios/references/scenario-format.md:164](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-scenarios/references/scenario-format.md#L164); [skills/super-ux/plugins/super-ux/scripts/ux_lint.py:741](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/ux_lint.py#L741)

**Исправление:** Явно прочитать контракт до записи; использовать устойчивые section IDs с локализуемыми title либо сказать, что машинные headings остаются английскими, а содержание переводится.

**Приёмка:** Русский fixture всех 9 секций проходит по canonical IDs; действительно отсутствующая anti-vision fail; изменение языка title не меняет identity.



<a id="ux-08"></a>

### UX-08 · P2 · Approval оператора может стереть происхождение предположения

**Затронуто:** ux-foundation. **Доказательство:** `risk_from_contract`. **План:** FIX-UX-08 → M2; пока proposed.

**Наблюдение:** Reverse предписывает observed/inferred, затем держит inferred «until the user confirms». Контракт confirmed описывает как подтверждение наблюдением. Оператор-основатель может подтвердить желаемую персону без исследования; отдельные approval и evidence status не представлены.

**Чем ухудшает результат:** После подтверждения предположение начинает читаться как знание о пользователях и каскадирует в flows/brand. Реальные сфабрикованные persona в этом аудите не обнаружены; это путь ошибочного повышения уверенности.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:87](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/SKILL.md#L87); [skills/super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:126](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/SKILL.md#L126); [skills/super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:132](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/SKILL.md#L132); [skills/super-ux/plugins/super-ux/skills/ux-foundation/references/scenario-format.md:92](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/references/scenario-format.md#L92)

**Исправление:** Развести evidence_kind (brief/owner-belief/interview/telemetry/code-inference), decision_status и validation_status. Approval меняет decision, но не provenance. Для эмоций и Frequency×Severity×Solvability хранить источник, шкалу и unknown вместо обязательного выдуманного балла.

**Приёмка:** Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.



<a id="ux-09"></a>

### UX-09 · P2 · Воронки конкурентов из proxy превращаются в «proven base»

**Затронуто:** ux-foundation, ux-flows. **Доказательство:** `observed_semantic_conflict`. **План:** FIX-UX-09 → M4; пока proposed.

**Наблюдение:** Reference честно признаёт, что убыточная хорошо финансируемая воронка выглядит как прибыльная, но рядом говорит «Nobody keeps paying ... at a loss for months», «production spend follows return», а распространённые паттерны называет proven base. Неизвестный profit превращается в доказанную причинную эффективность.

**Чем ухудшает результат:** Survivorship/selection bias направляет продукт на чужую аудиторию; повторение конкурентов может быть общей ошибкой, шаблоном агентства или правилом платформы. Это логический конфликт самой методики, не установление фактической убыточности чьей-либо рекламы.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:81](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/references/funnel-research.md#L81); [skills/super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:86](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/references/funnel-research.md#L86); [skills/super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:118](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-foundation/references/funnel-research.md#L118)

**Исправление:** Все market signals маркировать как observed exposure; вывод о механизме как hypothesis с альтернативными объяснениями. Частоты считать скриптом по corpus с denominator/дубликатами; adoption через локальный эксперимент, не «proven» из частоты.

**Приёмка:** Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.



<a id="ux-10"></a>

### UX-10 · P1 · Loading из существующей задержки превращён в инсценировку вычисления

**Затронуто:** ux-flows, ux-foundation, ux-scenarios. **Доказательство:** `observed_semantic_conflict`. **План:** FIX-UX-10 → M4; пока proposed.

**Наблюдение:** BP-005 применим когда loading/preparation уже существует. Funnel-research задаёт обязательный шаг Loading как «A calculated pause that makes the result feel computed for this person», а SKILL требует занести каждый шаг (включая loading) в экран/сценарий. Это расширяет практику до искусственной задержки и создаёт риск ложного впечатления персонального расчёта.

**Чем ухудшает результат:** Можно ухудшить time-to-value и ввести человека в заблуждение о реальной обработке его данных, затем легализовать это цепочкой SCN/UX audit. Нет подтверждения, что такой интерфейс уже отгружен.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-flows/references/funnel-research.md:192](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/funnel-research.md#L192); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/funnel-research.md:198](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/funnel-research.md#L198); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:161](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L161); [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:64](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L64)

**Исправление:** Loading только при реальной асинхронной работе; показывать фактическую операцию и не задерживать готовый результат. Если narrative pause нужен продукту, назвать его честно без claims персонального анализа и измерить затраты/понимание.

**Приёмка:** Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.



<a id="ux-11"></a>

### UX-11 · P1 · Figma fallback и provisional flow не доходят до разрешённого build state

**Затронуто:** ux-flows, ux-scenarios. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-UX-11 → M3; пока proposed.

**Наблюдение:** Design допускает provisional profile без foundation и text-only при недоступном Figma. Финальный build gate требует всю утверждённую цепочку и, при default Figma enabled, каждый state linked to frame. ux-scenarios допускает no-Traces только tiny/explicit choice. Деградация разрешает создать текст, но не объясняет, какие условия снимают блок реализации.

**Чем ухудшает результат:** Нет единого терминального состояния: агент продолжает документацию и застревает на gate либо игнорирует правило. В уже авторизованной работе это выглядит повторным запросом разрешения на обычный следующий шаг.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:98](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L98); [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:194](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L194); [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:278](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L278); [skills/super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:294](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L294); [skills/super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md:33](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-scenarios/SKILL.md#L33)

**Исправление:** Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях.

**Приёмка:** Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.



<a id="ux-12"></a>

### UX-12 · P1 · Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата

**Затронуто:** ux-audit. **Доказательство:** `observed_evidence_mismatch`. **План:** FIX-UX-12 → M2; пока proposed.

**Наблюдение:** Loop проверяет «expected result observably occurs» против code; validated → implemented после PASS. Live pass off by default. Код может содержать ветку, но реальные env/auth/network/CSS её не дают пользователю. Источник file:line доказывает текст реализации, не всякий runtime outcome.

**Чем ухудшает результат:** Ложная уверенность в достижимости ожидаемого результата. Не каждый static PASS ошибочен: чистые локальные свойства можно доказать чтением. Проблема — отсутствие раздельного evidence type и требований по типу проверяемого свойства.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:210](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L210); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:218](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L218); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:249](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L249); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:290](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L290)

**Исправление:** Разделить static conformance, executable verification и production observation. Для runtime зависимых критериев PASS только с тестом/браузером/проверенным runtime receipt, иначе BLOCKED/unverified. Сохранить хорошее разделение delivery vs Product outcome.

**Приёмка:** Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.



<a id="ux-13"></a>

### UX-13 · P2 · Общий precondition требует scenarios даже независимому copy/benchmark scope

**Затронуто:** ux-audit. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-UX-13 → M3; пока proposed.

**Наблюдение:** В начале unconditional stop если нет scenarios; ниже copy требует только voice и single-pass scopes запускают только соответствующий pass. Standalone brand/copy проекта без UX цепочки ошибочно маршрутизируется в создание scenarios. Benchmark также требует file:line для внешних наблюдений.

**Чем ухудшает результат:** Scope creep, создание ненужных артефактов и потеря времени до read-only ответа. Существует развилка текста, а не доказанный сбой live invocation.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:25](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L25); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:45](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L45); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:70](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L70); [skills/super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:203](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-audit/SKILL.md#L203)

**Исправление:** Предусловия вычислять после scope: scenario → base, copy → brand, benchmark → observed URLs+receipts. Схема evidence допускает URL+timestamp+capture для внешних данных; file:line только для code claims.

**Приёмка:** Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.



<a id="ds-01"></a>

### DS-01 · P1 · Сравнение packs сменой CSS не имеет общего token API

**Затронуто:** sheleg-design. **Доказательство:** `observed_contract_gap`. **План:** FIX-DS-01 → M5; пока proposed.

**Наблюдение:** SKILL честно говорит, что во всех packs совпадают только --bg/--ink, но велит менять только token layer на существующей странице с тем же markup. Workbench использует --panel/--accent/--r-control/--font-ui; orchard — --surface/--cta/--radius-sm/--font-sans. Не определён adapter для сравнения.

**Чем ухудшает результат:** Исчезающие declarations/fallback или остатки предыдущего CSS дают неверную оценку pack. Это подтверждённый интерфейсный разрыв; браузерное воспроизведение всех 39 packs здесь не проводилось.

**Локаторы:** [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:179](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L179); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:197](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L197); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/workbench.css:5](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/styles/tokens/workbench.css#L5); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/orchard.css:8](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/styles/tokens/orchard.css#L8)

**Исправление:** Ввести небольшой semantic role API и per-pack adapter, не переименовывая identity tokens. Harness заменяет весь scope atomically, обнаруживает unresolved var и не наследует старый pack. Проверять совместимость компонентных slots; сравнивать layout отдельно когда pack требует другой композиции.

**Приёмка:** Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.



<a id="ds-02"></a>

### DS-02 · P2 · Опрос о значении craft превращён в нормативный порядок разработки

**Затронуто:** sheleg-design. **Доказательство:** `source_verified_inference_error`. **План:** FIX-DS-02 → M4; пока proposed.

**Наблюдение:** Числа 58/47/36/35/15 воспроизводятся в первоисточнике Figma, но это частота определения craft, не измерение эффективного порядка работ. Скилл делает переход «Read that as a definition of done, in that order», ставя polish до problem solving/clear UX.

**Чем ухудшает результат:** Искажение корректных данных на стадии интерпретации. Может усиливать оптимизацию под внешнюю убедительность до решения пользовательской задачи, хотя Creative Director отдельно требует alignment-first.

**Локаторы:** [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:154](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L154); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:159](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L159)

**Исправление:** Оставить опрос как контекст с точным смыслом и ссылкой; порядок gates вывести из dependency graph: задача/состояния/доступность/система/polish. Обязательный порядок обозначить как авторское решение, не вывод исследования. Источник: https://www.figma.com/blog/state-of-the-designer-2026/ .

**Приёмка:** Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.



<a id="ds-03"></a>

### DS-03 · P2 · Производительность CSS/API описана абсолютами вместо проверяемых условий

**Затронуто:** sheleg-design. **Доказательство:** `source_verified_overclaim`. **План:** FIX-DS-03 → M4; пока proposed.

**Наблюдение:** Запрещён сам addEventListener(scroll) как якобы обязательно janky; filter/clip-path названы safe. Производительность зависит от объёма работы/paint/device. MDN описывает допустимый scroll handler с throttling; Chrome/web.dev предупреждает о стоимости blur и рекомендует измерять pipeline, а не обещает safe для любого filter.

**Чем ухудшает результат:** Лишние зависимости/переписывание корректного кода и разрешение дорогих эффектов по имени свойства. Нет измерения деградации конкретного shipped app; дефект — формулировка технического правила.

**Локаторы:** [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:168](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L168); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:179](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L179); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:182](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L182)

**Исправление:** Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide .

**Приёмка:** Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.



<a id="ds-04"></a>

### DS-04 · P2 · Duration table допускает 500ms, общий UI gate запрещает >300ms

**Затронуто:** sheleg-design. **Доказательство:** `observed_instruction_conflict`. **План:** FIX-DS-04 → M4; пока proposed.

**Наблюдение:** Строка modals/drawers/sheets = 200–500ms; следующее правило UI ≤300ms. Exception entrance описан, но таблица не разделяет entrance/interaction/exit, и modal animation обычно отвечает обоим словам.

**Чем ухудшает результат:** Агент выбирает корректный по таблице 400ms drawer и нарушает gate либо считает любой UI transition entrance и обходит потолок.

**Локаторы:** [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:114](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L114); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:117](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L117); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:315](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L315)

**Исправление:** Единая таблица по purpose+frequency+platform с explicit exceptions и canonical duration IDs. Разделить interactive feedback, spatial modal transition и marketing entrance, убрать пересечение трактовок.

**Приёмка:** 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.



<a id="ds-05"></a>

### DS-05 · P2 · No-JS критерий применяется ко всем поверхностям, включая внутренние UI

**Затронуто:** sheleg-design. **Доказательство:** `observed_scope_gap`. **План:** FIX-DS-05 → M4; пока proposed.

**Наблюдение:** Creative Director включает product/agent/native surfaces, а общая обязательная Quality table требует content in served HTML без условия public/web. Router SEO отдельно исключает logged-in internal tools. Native screen вообще не имеет served HTML.

**Чем ухудшает результат:** Ненужный SSR/ложный FAIL для внутреннего SPA или native app. Может расширить объём дизайн-задачи до архитектуры backend без пользы.

**Локаторы:** [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:32](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L32); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:202](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L202); [skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:216](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L216)

**Исправление:** Applicability predicates на каждую проверку: public-web-crawlable → no-JS content, web-internal → loading/error/accessibility, native → platform semantics. В отчёте NOT_APPLICABLE с причиной, а не PASS без запуска.

**Приёмка:** Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.



<a id="ds-06"></a>

### DS-06 · P2 · Eval-регрессия не покрывает текущий composition/runtime

**Затронуто:** sheleg-design. **Доказательство:** `observed_validation_limit`. **План:** FIX-DS-06 → M6; пока proposed.

**Наблюдение:** Design результаты версии 1.58.2, baseline 1.59.4; UX результаты 0.52.2, baseline 0.55.1. По одному trigger probe вместо обещанных трёх, scenario design оценивает планы read-only, а live build/Figma explicitly not reproducible. Это честно раскрыто, но не доказательство текущего исполнения/роутинга в полном окружении.

**Чем ухудшает результат:** Чистые structural gates можно принять за behavioral confidence. Full roster текущего host сильно больше 28/31 кандидата; layered routing нельзя оценить вопросом «which ONE skill».

**Локаторы:** [skills/sheleg-design/test/evals/RESULTS.md:16](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L16); [skills/sheleg-design/test/evals/RESULTS.md:38](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L38); [skills/sheleg-design/test/evals/RESULTS.md:47](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L47); [skills/super-ux/test/evals/RESULTS.md:12](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/RESULTS.md#L12); [skills/super-ux/test/evals/RESULTS.md:81](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/RESULTS.md#L81)

**Исправление:** Сохранить историю, добавить current-version manifest, реальные packaged installs, несколько seeds/repeats на поддержанных host/model, multi-skill route sequence и resource budget. Runtime fixtures вместо только планов; transcript/content hash сохранять за пределами /tmp.

**Приёмка:** Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.



<a id="ux-14"></a>

### UX-14 · P2 · BP-212 ошибочно объявляет локальное тестирование оплаты невозможным

**Затронуто:** ux-foundation, ux-flows, ux-scenarios, ux-audit. **Доказательство:** `primary_source_verified_technical_error`. **План:** FIX-UX-14 → M4; пока proposed.

**Наблюдение:** BP-212 требует реальный публичный адрес до подключения платёжного провайдера и объясняет это невозможностью проверить post-payment path локально. Stripe документирует test locally without a registered URL, stripe listen --forward-to localhost:4242/webhook. Ошибка относится к universal gate, а не к необходимости доступного HTTPS endpoint в production.

**Чем ухудшает результат:** Лишний деплой и публичная поверхность раньше локальной проверки; сценарии/план получают выдуманную техническую зависимость. Изменения реальных проектов или ущерб не измерялись.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2018](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2018); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2020](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2020)

**Исправление:** Развести local sandbox, staging и production. Локальный webhook forwarding или официальный emulator допустим для wiring/tests; публичный HTTPS endpoint обязателен для production delivery. Provider capability определяет dependency, а не универсальная UX практика.

**Приёмка:** Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

**Первичные источники:** [Stripe — локальная проверка webhook](https://docs.stripe.com/webhooks#local-listener)



<a id="ux-15"></a>

### UX-15 · P1 · BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку

**Затронуто:** ux-foundation, ux-flows, ux-scenarios, copywriting, ux-audit. **Доказательство:** `primary_source_verified_legal_overgeneralization`. **План:** FIX-UX-15 → M4; пока proposed.

**Наблюдение:** Для любого поля quiz/email/payment status практика требует consent перед первой записью и обосновывает это GDPR Art.13. Art.13 касается информации; EDPB перечисляет шесть возможных legal bases, consent лишь одна. Не всякое необходимое для договора или установленное законом действие должно зависеть от consent checkbox. Это проверка сформулированного universal claim; выбор lawful basis конкретного продукта требует его контекста.

**Чем ухудшает результат:** Ненужные consent gates, неверная фиксация lawful basis и последствия withdrawal; copy может обещать управление обработкой, которого продукт не реализует. Реальная неправомерная обработка ни у одного проекта этим аудитом не установлена.

**Локаторы:** [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2026](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2026); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2027](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2027); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2034](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2034); [skills/super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2035](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/references/best-practices.md#L2035)

**Исправление:** Ввести processing-purpose→legal-basis→notice→rights/retention record. Consent gate только когда выбранная basis и применимые нормы требуют именно согласия; не смешивать маркетинговое tracking consent, contractual processing и informational notice. Удалить универсальное обоснование consent через Art.13.

**Приёмка:** Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.

**Первичные источники:** [EDPB — правовые основания обработки данных](https://www.edpb.europa.eu/topics/key-gdpr-concepts/legal-basis_en); [EDPB — правовые основания обработки данных](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)



<a id="dv-01"></a>

### DV-01 · P1 · Claim фиксирует получение, но ошибочно считается завершением работы

**Затронуто:** stripe-billing. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-01 → M1; пока proposed.

**Наблюдение:** INSERT processed_event фиксируется до handle; удаляется только при пойманном исключении. SIGKILL после INSERT не вызывает catch. Эффекты после commit не имеют durable outbox.

**Чем ухудшает результат:** Повтор отвечает duplicate, хотя entitlement или уведомление не выполнены; ошибка эффекта после commit может повторить ранее выполненные эффекты.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/SKILL.md:200](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/SKILL.md#L200); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md:224](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md#L224); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/SKILL.md:225](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/SKILL.md#L225)

**Исправление:** Разделить received/processing/completed; claim с lease и восстановлением; entitlement + business dedup + outbox в одной транзакции; consumer эффектов с собственной идемпотентностью.

**Приёмка:** Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.



<a id="dv-02"></a>

### DV-02 · P1 · Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant

**Затронуто:** stripe-billing. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-02 → M1; пока proposed.

**Наблюдение:** Пример отбрасывает periodStart <= lastGrantedPeriodStart; fixture требует выдать оба периода при February→January. SELECT→UPDATE внутри транзакции сам по себе не задаёт isolation/row lock; reconciliation не несёт event.id.

**Чем ухудшает результат:** Оплаченный старый период теряет allowance; два независимых входа могут начислить один период дважды при обычной изоляции БД.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:146](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L146); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md:215](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md#L215); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/fixtures/reference-handler.mjs:214](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/fixtures/reference-handler.mjs#L214)

**Исправление:** Уникальная запись grant по subscription/item/invoice/period и атомарная выдача; отдельно monotonic mirror состояния. Определить isolation и retry serialization failures.

**Приёмка:** Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.



<a id="dv-03"></a>

### DV-03 · P1 · Компенсация количества не компенсирует уже снятые деньги

**Затронуто:** stripe-billing. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-03 → M1; пока proposed.

**Наблюдение:** Upgrade использует always_invoice; при сбое БД возвращает oldQuantity с proration_behavior:none. Эта операция не возвращает начисление первой invoice.

**Чем ухудшает результат:** Клиент платит за upgrade и получает старое число seats; текст называет это компенсирующим revert, создавая ложное ощущение восстановления.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:165](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L165); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:178](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L178)

**Исправление:** Durable operation intent с idempotency key; предпочесть восстановить БД из подтверждённого Stripe состояния. Если бизнес выбрал rollback, отдельно оформить подтверждённую финансовую компенсацию и её статус.

**Приёмка:** Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.



<a id="dv-04"></a>

### DV-04 · P1 · Refund CAS проигрыш молча теряет больший cumulative refund

**Затронуто:** stripe-billing. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-04 → M1; пока proposed.

**Наблюдение:** Два обработчика с одинаковым stored.refundedTotal для cumulative 4000 и 9000: если 4000 выиграл, 9000 возвращает без перечитывания. Marker и clawBack разделены; rollback marker без CAS способен затереть более новый total.

**Чем ухудшает результат:** Недостаточное clawback и расхождение ledger; при падении между marker и clawBack retry пропускается.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:257](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L257); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:265](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L265); [skills/sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md:270](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L270)

**Исправление:** Под row lock/serializable transaction вычислять max(total_seen), delta и обновлять ledger вместе; CAS loser перечитывает и повторяет. Денежные значения хранить в minor units, а не /100 float.

**Приёмка:** Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.



<a id="dv-05"></a>

### DV-05 · P1 · Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID

**Затронуто:** crypto-payments. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-05 → M1; пока proposed.

**Наблюдение:** В body creditUser следует после любого успешного updateMany(mapped), без проверки PAID и общей транзакции. Reference улучшает paid gate и транзакцию, но return при paid/paid_over отбрасывает refund/hold updates.

**Чем ухудшает результат:** Если копировать body, pending/AML/failed могут кредитовать, crash теряет credit; если копировать reference, refund после paid не записывается. Это дефекты примеров, не доказательство активного продового ущерба.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:93](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L93); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:183](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L183); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:196](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L196); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md:1098](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L1098)

**Исправление:** Один исполняемый эталон; разделить payment status, immutable settlement grant и refund ledger. Only confirmed settlement credit; атомарный business dedup; refunds и holds не отбрасывать как duplicate.

**Приёмка:** pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.



<a id="dv-06"></a>

### DV-06 · P2 · Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера

**Затронуто:** crypto-payments. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-06 → M4; пока proposed.

**Наблюдение:** Body: buffer не выдаётся пользователю, credit intent; waterfall: paidAmountUsd ?? tokenAmount (описан как plan units) ?? amountUsd. Heleket reference: tokenAmount=invoiceAmount, buffer возвращается в баланс. Единого dimensional contract нет.

**Чем ухудшает результат:** В разных generated integrations одинаковая оплата создаёт разные балансы; tokens могут трактоваться как USD. Бизнес-политика незаметно выбирается скиллом.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:235](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L235); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:272](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L272); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md:877](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L877); [skills/sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md:1257](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L1257)

**Исправление:** Ввести Money(currency, minor/decimal), Asset(network, amount), Entitlement(units), FX quote с источником/временем. Выбор refund excess/credit excess/buffer fee оформлять явной политикой проекта.

**Приёмка:** Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.



<a id="dv-07"></a>

### DV-07 · P1 · OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie

**Затронуто:** google-auth. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-07 → M1; пока proposed.

**Наблюдение:** Flask default session и Starlette SessionMiddleware подписывают, но не шифруют cookie. В credentials положены client_secret, token, refresh_token. Body также прямо console.log(tokens.access_token). Официальные docs подтверждают читаемость session contents.

**Чем ухудшает результат:** Любой пользователь с такой сессией получает OAuth client_secret; credential replication в браузер и логи увеличивает поверхность утечки. Дефект шаблона подтверждён, реальные deployment не обследованы.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:486](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L486); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:527](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L527); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:569](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L569); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/SKILL.md:238](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/SKILL.md#L238)

**Исправление:** В cookie только случайный opaque session id; Google credentials хранить server-side encrypted store, доступ по session+principal. Удалить token logging; production secret без dev fallback; HTTPS guard.

**Приёмка:** Локальный HTTP client выполняет stubbed OAuth callback, декодирует Set-Cookie: ни client_secret, ни access/refresh token отсутствуют; stdout/stderr также чисты.

**Первичные источники:** [Flask — sessions](https://flask.palletsprojects.com/en/stable/quickstart/#sessions); [Starlette — SessionMiddleware](https://raw.githubusercontent.com/encode/starlette/master/docs/middleware.md)



<a id="dv-08"></a>

### DV-08 · P1 · ADC precedence написан в обратном порядке

**Затронуто:** google-auth. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-08 → M4; пока proposed.

**Наблюдение:** Body и reference говорят attached service account → local ADC → env. Google документирует env → local ADC → attached service account.

**Чем ухудшает результат:** Оператор может считать workload identity фактическим principal, хотя старый env JSON подменяет его; ошибочные разрешения и доступ не к тому проекту.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/SKILL.md:89](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/SKILL.md#L89); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/adc-and-service-accounts.md:24](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/adc-and-service-accounts.md#L24)

**Исправление:** Исправить оба места из одной canonical таблицы; сначала показывать фактически resolved principal/source без секрета, затем настраивать.

**Приёмка:** В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.

**Первичные источники:** [Google Cloud — Application Default Credentials](https://docs.cloud.google.com/docs/authentication/application-default-credentials)



<a id="dv-09"></a>

### DV-09 · P1 · Express OAuth использует общий mutable client и неполную проверку state

**Затронуто:** google-auth. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-09 → M1; пока proposed.

**Наблюдение:** Один OAuth2 client на весь процесс; каждый /profile меняет его credentials. Сравнение state допускает undefined===undefined; state не consume, отсутствует TTL.

**Чем ухудшает результат:** Конкурентные запросы разных пользователей разделяют credential state; сессия без ожидаемого state не отвергается до code exchange.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:380](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L380); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:403](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L403); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md:412](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L412)

**Исправление:** Client на запрос/пользователя, credentials не мутировать глобально; required cryptorandom state привязать к server session, TTL, atomic consume; validation до token exchange.

**Приёмка:** Интерливинг A/B с задержкой между setCredentials и transport использует разные Authorization; missing/expired/reused state не вызывает token endpoint.



<a id="dv-10"></a>

### DV-10 · P1 · Nonce равен присланному клиентом значению, а не ожидаемому сервером

**Затронуто:** google-signin, google-auth. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-10 → M1; пока proposed.

**Наблюдение:** Клиент генерирует nonce и POSTит вместе с credential; backend сравнивает их и даже пропускает проверку если nonce отсутствует. Серверного challenge/consume нет. Утверждение 'stolen token cannot be replayed' не следует из кода: nonce читается из JWT.

**Чем ухудшает результат:** Перехваченный ещё действующий token повторно обменивается на новую app session; заявленная replay defense отсутствует.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md:37](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L37); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md:47](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L47); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:264](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L264); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:380](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L380); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/sign-in-with-google.md:294](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/sign-in-with-google.md#L294)

**Исправление:** Server-issued nonce связан с pre-auth HttpOnly session, TTL и one-time consume; обязательное точное совпадение token nonce с server expectation, а не body nonce.

**Приёмка:** Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.



<a id="dv-11"></a>

### DV-11 · P1 · Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом

**Затронуто:** google-signin. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-11 → M1; пока proposed.

**Наблюдение:** email_verified=true используется как доказательство inbox ownership для auto-link. Google отдельно исключает non-Gmail без hd: владение сторонним email могло измениться с момента первоначальной верификации.

**Чем ухудшает результат:** Возможна привязка Google identity прежнего владельца стороннего адреса к локальному аккаунту нынешнего владельца.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md:59](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L59); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:188](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L188); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:193](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L193)

**Исправление:** По умолчанию linking после fresh re-auth текущего локального аккаунта; если auto-link нужен, явно учитывать Google authoritative conditions и независимый challenge для прочих адресов. Unverified pre-registration направлять в безопасное recovery, не только в чужой password.

**Приёмка:** JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.

**Первичные источники:** [Google Identity — проверка ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)



<a id="dv-12"></a>

### DV-12 · P1 · Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract

**Затронуто:** google-signin. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-12 → M1; пока proposed.

**Наблюдение:** Endpoint принимает Pydantic JSON body, хотя заявляет поддержку GIS form POST; missing Sec-Fetch-Site считается same-origin, Origin fallback отсутствует, none разрешён.

**Чем ухудшает результат:** Form flow получает 422; отсутствующий metadata header становится разрешением. Конкретный browser exploit зависит от delivery/content type, поэтому он не объявлен воспроизведённым.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md:70](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L70); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:359](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L359); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:365](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L365); [skills/sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md:371](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L371)

**Исправление:** Раздельные явно типизированные form/JSON paths; form требует оба g_csrf_token, JSON требует trusted same-origin или точный Origin fallback; отсутствие обоих fail closed.

**Приёмка:** TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.



<a id="dv-13"></a>

### DV-13 · P2 · Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты

**Затронуто:** ad-tracking. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-13 → M4; пока proposed.

**Наблюдение:** Basic ошибочно 'No conversion modeling' (Google: general model), certified CMP объявлен обязательным всем Google ad products (официальный scope publisher AdSense/AdManager/AdMob); 'always Advanced', '65–70%' и 'no banner needed' вне EEA представлены универсально.

**Чем ухудшает результат:** Генерация необязательной CMP миграции, неверных прогнозов recovered revenue и отправки данных без выбранной политики consent.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:61](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L61); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:77](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L77); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md:22](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L22); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md:31](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L31); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md:74](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L74)

**Исправление:** Развести product policy, geography/legal decision и технику. Scope+source+checked_at у требований; Basic general vs Advanced advertiser-specific model; процент только как dated measured study, не обещание. Режим выбирается политикой проекта.

**Приёмка:** Near-miss advertiser-only GA4/Ads без publisher inventory не требует certified CMP автоматически; Basic проходит; неизвестная юрисдикция не автоматически granted.

**Первичные источники:** [Google Tag Platform — consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode); [Google AdMob — требования consent/CMP](https://support.google.com/admob/answer/13554116?hl=en)



<a id="dv-14"></a>

### DV-14 · P1 · Безусловный noscript pixel противоречит consent-gated архитектуре

**Затронуто:** ad-tracking. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-14 → M1; пока proposed.

**Наблюдение:** Meta noscript img дан без server consent gate, хотя перед этим обещано не рендерить Meta до consent. В том же body GA4 G-tag snippet всё ещё несёт allow_enhanced_conversions, который ниже запрещено помещать на G-tag.

**Чем ухудшает результат:** При отключённом JS копия noscript отправляет PageView без получения согласия; исправления текста не исправили копируемые примеры.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:53](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L53); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:233](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L233); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:115](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L115); [skills/sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md:161](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L161)

**Исправление:** Генерировать snippets из исполняемых templates; noscript разрешать только по ранее сохранённому server-verifiable consent либо убрать. Исправить G/AW конфигурацию синхронно с prose.

**Приёмка:** Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.



<a id="dv-15"></a>

### DV-15 · P1 · Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs

**Затронуто:** error-tracking. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-15 → M1; пока proposed.

**Наблюдение:** Выполнен код из reference. redis://:AUDIT_FAKE_PASSWORD@host:6379 не изменился (regex требует непустого user); Telegram /bot<TOKEN>/ и ?access_token также не изменились. postgres://user:pw@ редактируется.

**Чем ухудшает результат:** Добавление Sentry по инструкции может передавать секреты в messages/exceptions несмотря на обещание scheme-agnostic покрытия.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md:86](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L86); [skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md:92](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L92); [skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md:119](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L119)

**Исправление:** Парсер/редактор URL поддерживает пустой username, encoded credentials, token query/path; отдельные application secret shapes; ограничить обещание покрытия и также проверять attachments/transactions/logs по используемым SDK hooks.

**Приёмка:** Canary matrix fake Redis/AMQP/Postgres URLs, encoded credentials, Telegram path, access-token query, nested events; ни один fake secret не доходит до test transport.



<a id="dv-16"></a>

### DV-16 · P2 · Правила восстановления дают противоположные действия для отозванной сессии

**Затронуто:** error-tracking, telegram-userbots. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-16 → M4; пока proposed.

**Наблюдение:** error-tracking называет exit non-zero/crash loop видимым решением credential failure; telegram-userbots требует alert и запрещает restart loop для dead session.

**Чем ухудшает результат:** Результат зависит от последнего прочитанного skill; автоматический restart не восстанавливает credential и засоряет сигнал.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/SKILL.md:223](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/SKILL.md#L223); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-userbots/SKILL.md:147](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/SKILL.md#L147); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-userbots/references/sessions-and-auth.md:73](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/references/sessions-and-auth.md#L73)

**Исправление:** Единый typed health contract: liveness процесса, readiness способности служить, degraded_auth с остановкой работ + alert, recovery только после новой auth. Exit/restart допустимы для recoverable failure и контролируемой политики supervisor.

**Приёмка:** Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.



<a id="dv-17"></a>

### DV-17 · P2 · FCP ошибочно объявлен неизмеримым в поле

**Затронуто:** frontend-performance. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-17 → M4; пока proposed.

**Наблюдение:** Skill говорит, что только три CWV field-measurable, и помещает FCP в lab-only diagnostics. web.dev прямо перечисляет FCP lab и field инструменты.

**Чем ухудшает результат:** Аудит может отбросить полезные RUM данные, приравнять lab score к реальному UX или дать заказчику неверную классификацию.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:31](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L31); [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:44](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L44)

**Исправление:** Разделить две независимые оси: CWV/not-CWV и lab/field availability. Обязательные p75, device/cohort, period, sample size; TBT как диагностическая корреляция, не замена доказательства INP.

**Приёмка:** Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.

**Первичные источники:** [Web.dev — First Contentful Paint](https://web.dev/articles/fcp)



<a id="dv-18"></a>

### DV-18 · P2 · Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев

**Затронуто:** frontend-performance. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-18 → M4; пока proposed.

**Наблюдение:** Only hero+nav initial; named imports only; allow all loaded CSP origins ради score; footer headings заменять p; modern last-two targets без user support policy. Это предписания, не условные диагностики.

**Чем ухудшает результат:** Риск убрать нужную семантику/поддержку устройств, расширить CSP и увеличить waterfall ради Lighthouse. Конкретные регрессии на сайте не воспроизводились.

**Локаторы:** [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:66](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L66); [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:72](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L72); [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:101](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L101); [skills/sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md:114](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L114)

**Исправление:** Перед изменением проверить performance trace и сценарии, browser support contract, accessibility owner. CSP origins одобрять по функциональной необходимости; semantic headings по структуре; lazy-load по измеренному waterfall.

**Приёмка:** Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.



<a id="dv-19"></a>

### DV-19 · P2 · Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата

**Затронуто:** stripe-billing, crypto-payments, ad-tracking, google-auth, google-signin, error-tracking, frontend-performance. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-19 → M6; пока proposed.

**Наблюдение:** RESULTS честно указывает design intent, coordinator scoring и release 0.11.1, тогда как current package 0.11.8. В s03 ожидается server-side credentials, но copyable Flask/FastAPI этому противоречит; runtime tests охватывают Stripe и ads, не auth/crypto.

**Чем ухудшает результат:** Высокий scenario pass создаёт ложный запас доверия, если его воспринимать как quality gate генерируемого кода; wording-quality не ловит credential cookie и nonce bypass.

**Локаторы:** [skills/sheleg-dev/test/evals/RESULTS.md:17](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/RESULTS.md#L17); [skills/sheleg-dev/test/evals/RESULTS.md:37](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/RESULTS.md#L37); [skills/sheleg-dev/test/evals/scenarios.json:43](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/scenarios.json#L43)

**Исправление:** Сохранить routing eval, добавить generated-artifact eval с offline provider stubs, реальной БД, fault injection, hard security invariants; фиксировать exact model, commit, prompt/tool trace, grader version и raw results.

**Приёмка:** Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



<a id="dv-20"></a>

### DV-20 · P2 · Ошибка окружения классифицируется как доказанный пропуск валидатора

**Затронуто:** sheleg-dev test runner. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-DV-20 → M2; пока proposed.

**Наблюдение:** npm run test:all: базовые suites PASS; negatives 40 FAIL с cp: No space left on device, но runner печатает 'validator accepted a planted defect', 'guard does not actually fire'.

**Чем ухудшает результат:** Аудит данных врёт о причине отказа и направляет ремонт на валидатор вместо неисполненного setup. Доказано реальным логом, не симуляцией.

**Локаторы:** [skills/sheleg-dev/test/negatives.py:338](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L338); [skills/sheleg-dev/test/negatives.py:361](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L361); [skills/sheleg-dev/test/negatives.py:377](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L377)

**Исправление:** Явные стадии fixture_setup→mutation_verified→validator_ran→assertion; TEST_ERROR/BROKEN для setup/copy/timeout, GAP только при состоявшемся validator accept. Resource preflight и cleanup finally.

**Приёмка:** Сымитировать ENOSPC/failed cp и timeout: TEST_ERROR, ноль 'guard bypass' findings; корректно созданный mutant accepted → GAP. Повтор полного negative suite после ресурсов.



<a id="tg-01"></a>

### TG-01 · P1 · Crash fixture зелёный, но после реальной redelivery update теряется

**Затронуто:** telegram-bots. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-TG-01 → M1; пока proposed.

**Наблюдение:** Выполнен штатный Handler: crash_on=1001, затем poll_batch повторно доставленных updates → work=[1002], processed=[1001,1002], offset=1003. Test проверяет лишь наличие UPDATE_A в still_delivered, не вызывает повторный handle.

**Чем ухудшает результат:** Постоянная потеря работы после durable claim, несмотря на PASS 'crash redelivers rather than loses'; ack-before-process дополнительно требует durable queue.

**Локаторы:** [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md:73](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L73); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md:123](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L123); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py:94](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L94); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py:183](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L183)

**Исправление:** Принять update в durable inbox, ack после commit enqueue; state+lease+retry worker. Business grant keyed charge, outbox для send. Проверять не только redelivery, но eventual completed work.

**Приёмка:** Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.



<a id="tg-02"></a>

### TG-02 · P2 · Оmitted allowed_updates ошибочно приравнен к пустому списку

**Затронуто:** telegram-bots. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-TG-02 → M4; пока proposed.

**Наблюдение:** Official API: omission retains previous setting; [] resets to all except три типа. Skill утверждает одинаковое поведение. Также update_id sequential утверждён без оговорки про random после недели без updates.

**Чем ухудшает результат:** Миграция сохраняет старый узкий filter, хотя агент ждёт default; код high-water assumption может не обработать первый update после долгого простоя.

**Локаторы:** [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md:105](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L105); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md:78](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md#L78); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md:19](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md#L19)

**Исправление:** Таблица unset/[]/explicit и getWebhookInfo evidence; хранить desired subscription отдельно. Update id использовать как identity, не глобальную гарантию монотонности навсегда.

**Приёмка:** Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.

**Первичные источники:** [Telegram — getupdates](https://core.telegram.org/bots/api#getupdates); [Telegram — update](https://core.telegram.org/bots/api#update)



<a id="tg-03"></a>

### TG-03 · P1 · HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle

**Затронуто:** telegram-miniapps. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-TG-03 → M1; пока proposed.

**Наблюдение:** Telegram HMAC строится из всех received fields кроме hash; в third-party Ed25519 исключаются hash+signature. Рекомендованный самим skill init-data-golang исключает только hash. Наш all-fields signed vector с signature=... получает bad signature; self-test добавляет signature ПОСЛЕ signing, закрепляя ошибку.

**Чем ухудшает результат:** Валидные payloads с signature отвергаются; убедительный ложный тест провоцирует автора приложения отключить проверку при реальном login.

**Локаторы:** [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md:75](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L75); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md:98](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L98); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py:34](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L34); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py:154](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L154)

**Исправление:** Разделить HMAC и Ed25519 canonicalization, запретить shared false helper; официальные/независимые golden vectors с signature. Включить строгий parse duplicate fields и upper/lower auth_date window.

**Приёмка:** Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).

**Первичные источники:** [Telegram — validating data received via the mini app](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app); [Telegram Mini Apps — независимый Go validator](https://raw.githubusercontent.com/Telegram-Mini-Apps/init-data-golang/master/validate.go)



<a id="tg-04"></a>

### TG-04 · P2 · Матрица launch surfaces неверно запрещает menu-button query flow

**Затронуто:** telegram-miniapps. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-TG-04 → M4; пока proposed.

**Наблюдение:** Reference объединяет direct link/menu: neither, no query. Telegram menu button работает как inline button и может answerWebAppQuery. Inline-query app ошибочно приравнен к inline button. DeviceStorage/SecureStorage перечислены 'all 8.0+', хотя требуется проверять capability для каждого метода.

**Чем ухудшает результат:** Генерация лишних backend обходов и неработающих return paths; функции на старых клиентах вызываются по слишком низкому guard.

**Локаторы:** [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md:12](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md#L12); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md:13](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md#L13); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/references/viewport-and-platform.md:46](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/viewport-and-platform.md#L46)

**Исправление:** Разделить keyboard, inline keyboard, menu, inline mode, direct/main/attachment surfaces; capability/API floor у каждого метода с первичным source.

**Приёмка:** Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.

**Первичные источники:** [Telegram — launching mini apps from the menu button](https://core.telegram.org/bots/webapps#launching-mini-apps-from-the-menu-button); [Telegram — inline mode mini apps](https://core.telegram.org/bots/webapps#inline-mode-mini-apps)



<a id="tg-05"></a>

### TG-05 · P2 · Лимит одного FloodWait не ограничивает бесконечную retry sequence

**Затронуто:** telegram-userbots. **Доказательство:** `source_review_and_counterexample`. **План:** FIX-TG-05 → M4; пока proposed.

**Наблюдение:** call_with_flood while True проверяет только e.seconds > cap. Бесконечный поток коротких FloodWait никогда не остановится, хотя body запрещает unbounded sleeping. Скрипт быстрого старта также не импортирует os/StringSession (SKILL:68).

**Чем ухудшает результат:** Worker может навсегда удержать job; deadline/cancellation/retry budget не заданы. Связь 'длительный wait ⇒ ban' является эвристикой автора, не измеренной гарантией.

**Локаторы:** [skills/telegram-dev/plugins/telegram-dev/skills/telegram-userbots/references/rate-and-flood.md:13](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/references/rate-and-flood.md#L13); [skills/telegram-dev/plugins/telegram-dev/skills/telegram-userbots/SKILL.md:159](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/SKILL.md#L159)

**Исправление:** Добавить wall-clock deadline, cumulative wait и attempt budget, cancellation и checkpoint queue; max wait трактовать как backpressure, длительные waits как policy choice. Runnable login/session example с явными imports.

**Приёмка:** Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.



<a id="as-01"></a>

### AS-01 · P1 · Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ

**Затронуто:** agent-orchestrator. **Доказательство:** `documented_design_defect`. **План:** FIX-AS-01 → M1; пока proposed.

**Наблюдение:** Алгоритм фиксирует DB, затем повышает внешний лимит и при любом API failure восстанавливает DB. Внешний API не участвует в prepare/commit: это не 2PC. Transaction-scoped advisory lock отпускается до внешнего вызова, поэтому не сериализует всю составную операцию.

**Контрсценарий / воспроизведение:** Контрсценарий: провайдер применил +35, ответ потерян; клиент видит timeout и возвращает деньги в DB. Доступны и восстановленный резерв, и внешние +35. Это разбор опубликованного алгоритма; денежные операции не запускались.

**Чем ухудшает результат:** Двойное кредитование, потерянные intents при crash между commit и API, переписывание последующих изменений компенсацией старых значений.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:69](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md#L69); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:83](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md#L83); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:101](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md#L101)

**Исправление:** Назвать saga/outbox; хранить operation_id и состояния pending/applied/unknown/compensated. При ambiguous timeout сначала сверять статус по идемпотентному ключу; компенсировать только подтверждённый отказ и только собственную проводку. Ввести сериализацию или CAS на весь tenant transfer state, а не обещать её транзакционным lock до HTTP.

**Приёмка:** Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.

**Первичные источники:** [AWS — идемпотентность и безопасные повторы](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)



<a id="as-02"></a>

### AS-02 · P1 · Нулевой baseline путается с отсутствующим: первый реальный расход теряется

**Затронуто:** agent-orchestrator. **Доказательство:** `documented_algorithm_counterexample`. **План:** FIX-AS-02 → M1; пока proposed.

**Наблюдение:** lastRecordedUsage == 0 объявлен достаточным признаком отсутствия наблюдения; любой спад usage объявлен пересозданием ключа.

**Контрсценарий / воспроизведение:** Новый ключ уже наблюдался с usage=0. Между первым и вторым poll потрачено 5; правило seed baseline, record nothing пропускает эти 5. Спад счётчика без смены key_id также не доказывает пересоздание.

**Чем ухудшает результат:** Занижение затрат и бюджеты, которые не учитывают первую порцию расхода; незамеченные коррекции/сбои provider counter.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:146](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md#L146); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:151](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md#L151)

**Исправление:** Хранить baseline_initialized, observed_at и provider_key_generation отдельно от суммы; ноль — валидное значение. На уменьшение без смены поколения переводить reconciliation в anomaly, не объяснять причину догадкой.

**Приёмка:** Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.



<a id="as-03"></a>

### AS-03 · P1 · Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию

**Затронуто:** agent-orchestrator. **Доказательство:** `measured_counterexample_to_published_pattern`. **План:** FIX-AS-03 → M1; пока proposed.

**Наблюдение:** Dedup выбирает SequenceMatcher>=0.75, повышает confidence, сохраняет более длинный текст и реактивирует запись. Конфликт ищется только по нескольким английским словам/negation flip, без entity/attribute/scope/validity. Verified notes вообще exempt from decay.

**Контрсценарий / воспроизведение:** agents-sync-reproduce.py: Always allow external sharing of customer data и Never allow external sharing of customer data дают similarity=0.8791; более длинным остаётся Always. Дополнительный кодовый контрпример: Use Python и Never use production credentials имеют общий use/negation flip и могут ошибочно supersede друг друга.

**Чем ухудшает результат:** Коррекция пользователя превращается в подкрепление старой ошибки; unrelated memories деактивируются; confidence показывает частоту совпадений, а не доказанную истинность.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:365](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md#L365); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:398](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md#L398); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:413](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md#L413); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:427](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md#L427); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-lifecycle.md:148](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/memory-lifecycle.md#L148)

**Исправление:** Similarity использовать только для поиска кандидатов. Записи хранить с entity/attribute/scope/provenance/validity; contradiction gate до merge. Подтверждение отделить от повторного извлечения, не повышать доверие за self-generated повтор; temporal supersession и reversible history. Verified не освобождает volatile fact от freshness.

**Приёмка:** Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.



<a id="as-04"></a>

### AS-04 · P1 · Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload

**Затронуто:** agent-orchestrator, agent-harness. **Доказательство:** `architectural_counterexample`. **План:** FIX-AS-04 → M1; пока proposed.

**Наблюдение:** Правило No payload, no edge и шаг No→delete не различают dataflow, control flow, approval и зависимости по разделяемому состоянию.

**Контрсценарий / воспроизведение:** Backup→migration, acquire→write, disable writers→schema change могут не передавать документ/объект непосредственно, но порядок обязателен. Объявить результат проверки или lease token явным payload можно, однако этот контракт в тесте отсутствует.

**Чем ухудшает результат:** Оптимизация графа может убрать safety barrier либо распараллелить операции над одним ресурсом.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md:285](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/SKILL.md#L285); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:127](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md#L127); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:367](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md#L367)

**Исправление:** Типизировать ребро: data/control/authorization/resource. Для любого ребра требовать rationale и доказательство, но удалять только если нет ни причинного, ни ресурсного, ни разрешительного ограничения. Side-effect footprint и read/write sets проверять перед fan-out.

**Приёмка:** Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.



<a id="as-05"></a>

### AS-05 · P2 · Аудируемость ошибочно приравнена к статическому графу

**Затронуто:** agent-orchestrator, agent-harness. **Доказательство:** `overgeneralization`. **План:** FIX-AS-05 → M4; пока proposed.

**Наблюдение:** Динамический граф объявлен unfalsifiable from outside, а статический обязательным для аудита. Это смешивает заранее нарисованный план и сохранённый фактический execution graph.

**Контрсценарий / воспроизведение:** Динамический dispatcher может сохранять node_created, edge_added, policy/model versions, arguments, outcomes и immutable trace. Статический граф без этих записей, напротив, не доказывает, что было выполнено.

**Чем ухудшает результат:** Ненужные фиксированные цепочки, brittle planning и запрет подходящих adaptive workflows без выигранной гарантии.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:101](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/SKILL.md#L101); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:263](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md#L263); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md:298](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/SKILL.md#L298)

**Исправление:** Статический граф оставить предпочтением для предсказуемости. Аудируемость определять через полноту execution record, версии policy и детерминированные границы; динамике поставить budget/depth/node caps и provenance.

**Приёмка:** Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.



<a id="as-06"></a>

### AS-06 · P1 · Первый релиз фактически остаётся без исполняемого eval-корпуса

**Затронуто:** agent-evals. **Доказательство:** `primary_source_contradiction`. **План:** FIX-AS-06 → M2; пока proposed.

**Наблюдение:** Corpus должен появляться from production, never up front; первый offline gate — observables only. Критерий без input/trial не исполняется и не доказывает capability. Та же глава затем допускает simulated users, оставляя противоречивый маршрут.

**Контрсценарий / воспроизведение:** Новый агент возвратов без production: невозможно исполнить предрелизную проверку correct amount/consent/retry, если конструирование входов заранее запрещено. Anthropic рекомендует requirements→test cases и ручные development checks ещё до production.

**Чем ухудшает результат:** Cold-start release без измеренных сценариев, первая авария становится способом получения тестового набора.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:245](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L245); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:256](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L256); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:261](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L261)

**Исправление:** Разрешить curated/synthetic/manual seed corpus до релиза, маркировать источник каждого input; дополнять production regressions. Release gate обязан иметь executed trials, а observable-only — состояние specification-ready, не release-ready.

**Приёмка:** Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.

**Первичные источники:** [Anthropic — evals для AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)



<a id="as-07"></a>

### AS-07 · P1 · Запрет проверки порядка пропускает подтверждение после действия

**Затронуто:** agent-evals. **Доказательство:** `logical_counterexample`. **План:** FIX-AS-07 → M2; пока proposed.

**Наблюдение:** Для полного trace разрешены set/subset/forbidden lists, never as an order. Рекомендация избегать хрупкого exact sequence превращена в запрет семантически обязательного happens-before.

**Контрсценарий / воспроизведение:** Трейсы [confirm,charge] и [charge,confirm] имеют одинаковые множества вызовов, final response и конечный баланс; второй нарушает условие согласия до списания, но указанные matchers их не различат.

**Чем ухудшает результат:** False PASS на важных нарушениях, произошедших по пути к правильному конечному состоянию.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:79](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L79); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:167](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L167)

**Исправление:** Запрещать только избыточный exact global sequence. Разрешить temporal assertions и partial order: authorization precedes effect, read fresh precedes write, transaction completes before publish.

**Приёмка:** Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.



<a id="as-08"></a>

### AS-08 · P2 · Статистические правила выдают предположения за универсальные границы

**Затронуто:** agent-evals. **Доказательство:** `measured_mathematical_counterexample`. **План:** FIX-AS-08 → M2; пока proposed.

**Наблюдение:** Wald interval дан без ограничений по n/p; зависимость всегда должна расширять band; p^k объявлено worst case; независимые средние запрещено сравнивать вообще. Всё это требует дополнительных предположений.

**Контрсценарий / воспроизведение:** Скрипт показывает n=3,p=1→band=0. Для четырёх trial с ровно одним случайно расположенным failure marginal p=.75, но all-pass=0, меньше p^4=.3164. Следовательно independence не универсальный worst case. Отрицательная зависимость может уменьшить variance.

**Чем ухудшает результат:** Ложная уверенность на маленьком наборе, неверные thresholds и отбрасывание корректного unpaired экспериментального дизайна.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:31](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L31); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:52](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L52); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:106](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L106); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:118](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L118)

**Исправление:** Для proportion использовать Wilson/exact и явно описать iid/cluster assumptions; pass@k/pass^k считать по task-level trials. Для clustered/paired результатов применять соответствующий bootstrap/McNemar; unpaired сравнение допускается с его SE. Вместо never/worst case дать условные утверждения.

**Приёмка:** Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.



<a id="as-09"></a>

### AS-09 · P1 · OpenTelemetry: закрытый enum и неверное сложение вложенных token counters

**Затронуто:** agent-evals. **Доказательство:** `verified_protocol_semantic_error`. **План:** FIX-AS-09 → M2; пока proposed.

**Наблюдение:** gen_ai.operation.name назван closed 17-value enum; current primary разрешает custom value при отсутствии подходящего well-known. Текст утверждает, что input_tokens+output_tokens misses reasoning and cache writes, хотя это подмножества total counters по семантике.

**Контрсценарий / воспроизведение:** Сверка 2026-09-07 с OTel raw docs: cache_read и cache_write SHOULD be included in input_tokens, reasoning.output_tokens SHOULD be included in output_tokens. Adding them again doubles portions. Расчёт цены действительно требует разных rates, но не добавления подмножеств сверх total.

**Чем ухудшает результат:** Ложные conformance violations для extensions; завышенные счета/затраты при буквальном исправлении указанного misses.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:51](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/otel-genai.md#L51); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:130](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/otel-genai.md#L130); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:135](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/otel-genai.md#L135)

**Исправление:** Переписать enum как extensible well-known set; token totals и disjoint billing buckets разделить. Для цены вычитать cached portions из total и применять provider-specific rates; не суммировать modalities/reasoning с totals повторно. Прикрепить commit SHA/schema revision и actual observation date.

**Приёмка:** Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.

**Первичные источники:** [OpenTelemetry — GenAI spans и usage](https://raw.githubusercontent.com/open-telemetry/semantic-conventions-genai/main/docs/gen-ai/gen-ai-spans.md)



<a id="as-10"></a>

### AS-10 · P2 · Повтор проверки старого ответа назван проверкой изменения решения модели

**Затронуто:** agent-evals. **Доказательство:** `logical_contract_error`. **План:** FIX-AS-10 → M2; пока proposed.

**Наблюдение:** Fixture replay описан как бесплатная assertion над stored run и должен отвечать did the decision change. Но старое output не меняется при смене нового prompt/model/tool schema. Детерминированна проверка, а не новый agent trial.

**Контрсценарий / воспроизведение:** В stored run правильный tool A. Новый prompt теперь выбирает B. Повтор assertion на старом run продолжает PASS; нужно действительно выполнить candidate на frozen input.

**Чем ухудшает результат:** Регрессионный gate может быть зелёным, вообще не запускав изменённую систему.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:174](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/otel-genai.md#L174); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:62](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L62); [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:70](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md#L70)

**Исправление:** Три разных операции: regrade old output, execute candidate against frozen fixture, deterministic workflow replay. Хранить candidate version/output и оценку отдельно от старого trace; стоимость model call и stochasticity отражать.

**Приёмка:** Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.



<a id="as-11"></a>

### AS-11 · P1 · confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности

**Затронуто:** agent-harness. **Доказательство:** `security_overclaim`. **План:** FIX-AS-11 → M1; пока proposed.

**Наблюдение:** Булевое поле полезно против неполных arguments, но его может поставить сама модель. Формулировка Any two are safe даёт blanket safety для пар возможностей. Например untrusted content+write capability причиняет damage без доступа к private data.

**Контрсценарий / воспроизведение:** Модель формирует destructive call с confirm:true без человеческого события; schema проходит. Untrusted README просит удалить публичный workspace: private-data элемента нет, но вред возможен. Реальные destructive tools не вызывались.

**Чем ухудшает результат:** Ошибочная архитектура approval и threat model, которая не учитывает integrity/availability и другие каналы утечки.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-harness/references/tools.md:126](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/references/tools.md#L126); [skills/agent-stack/plugins/agent-stack/skills/agent-harness/references/tools.md:157](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/references/tools.md#L157); [skills/agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md:58](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/references/audit.md#L58)

**Исправление:** Для user approval нужен проверяемый grant от trusted control plane, bound to principal/action/arguments/expiry, либо уже существующее разрешение. Булевое поле назвать syntax guard. Trifecta описывать как достаточную конфигурацию конкретного exfiltration риска, не полную модель безопасности.

**Приёмка:** Agent-authored confirm:true без grant отвергается; повтор с изменёнными arguments также; заранее авторизованное действие проходит. Сценарий untrusted content→destructive write входит в threat tests независимо от private-data доступа.



<a id="as-12"></a>

### AS-12 · P2 · MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor

**Затронуто:** agent-interop. **Доказательство:** `verified_sdk_version_drift`. **План:** FIX-AS-12 → M4; пока proposed.

**Наблюдение:** Закреплена ревизия wire, но не distribution/version/import SDK. Пример использует FastMCP и transport settings в constructor. Current official Python SDK stable v2 переименовал класс MCPServer и переместил transport args; standalone fastmcp — другая distribution.

**Контрсценарий / воспроизведение:** Primary SDK README и migration guide проверены 2026-09-07. Пример без import/package pin неоднозначен и не соответствует актуальному official v2 constructor. ASGI lifespan и mount/health ordering также не показаны как runnable integration; endpoint probe не запускался.

**Чем ухудшает результат:** Copy/paste ведёт к ImportError/TypeError либо выбору другого SDK, а недостающая lifecycle wiring — к неработающему mounted endpoint.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:5](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md#L5); [skills/agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:30](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md#L30); [skills/agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:73](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md#L73)

**Исправление:** У каждого executable example назвать distribution, imports, tested version и lifecycle. Дать отдельные v2/current и v1 migration paths, health route с проверенным порядком registration. Проверять localhost protocol call, а не только наличие строки в markdown.

**Приёмка:** В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.

**Первичные источники:** [MCP — Python SDK](https://github.com/modelcontextprotocol/python-sdk); [MCP Python SDK — migration](https://py.sdk.modelcontextprotocol.io/migration/)



<a id="as-13"></a>

### AS-13 · P2 · Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks

**Затронуто:** agent-interop. **Доказательство:** `internal_routing_contradiction`. **План:** FIX-AS-13 → M4; пока proposed.

**Наблюдение:** Body утверждает: если поверх tools/call нужны task lifecycle/progress/resumable handle — wanted A2A. Позже тот же skill правильно описывает MCP Tasks с durable handle и mid-flight input.

**Контрсценарий / воспроизведение:** Десятиминутный export/report tool с фиксированным контрактом и negotiated Tasks: lifecycle нужен, автономного peer нет. Первая эвристика ведёт в A2A, последующие references — в MCP Tasks.

**Чем ухудшает результат:** Лишний протокол, cards/auth/lifecycle без потребности, либо непоследовательные рекомендации одного skill.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md:74](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/SKILL.md#L74); [skills/agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md:134](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/SKILL.md#L134); [skills/agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp.md:220](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-interop/references/mcp.md#L220)

**Исправление:** Главный dispatch criterion: capability/tool execution против автономного peer outcome. Длительность — второй вопрос о Tasks capability/transport, не выбор протокола. Проверять фактически поддержанные extensions клиента/SDK.

**Приёмка:** Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.



<a id="as-14"></a>

### AS-14 · P2 · Отсутствие evals ошибочно делает весь аудит unfalsifiable

**Затронуто:** agent-harness. **Доказательство:** `evidence_overgeneralization`. **План:** FIX-AS-14 → M2; пока proposed.

**Наблюдение:** No evals предписано ставить первым и объявлять всё последующее unfalsifiable. Но детерминированная гонка, hardcoded secret или неправильно связанный timeout доказуемы без поведенческого eval suite. Most agent bugs are prompt bugs также не подкреплено измеренной долей дефектов.

**Контрсценарий / воспроизведение:** Пять SY reproductions этого аудита показывают нарушения координации непосредственно. Наличие/отсутствие агентного корпуса не меняет доказательство двух владельцев одного lease.

**Чем ухудшает результат:** Аудитор может закончить раньше конкретных критических дефектов или начать править prompt там, где нужна исправленная синхронизация.

**Локаторы:** [skills/agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:148](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/SKILL.md#L148); [skills/agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md:90](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/references/audit.md#L90); [skills/agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:36](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-harness/SKILL.md#L36)

**Исправление:** Разделить source-level invariant proof, deterministic reproduction и behavioral estimate. No evals — finding о неизвестной надежности, приоритет определяется конкретным вредом; prompt-first оставить диагностической эвристикой с исключениями.

**Приёмка:** Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.



<a id="sy-01"></a>

### SY-01 · P1 · Выданные IDs меняются задним числом; два reserve возвращают один номер

**Затронуто:** agent-sync. **Доказательство:** `measured_code_defect`. **План:** FIX-SY-01 → M1; пока proposed.

**Наблюдение:** Reservation ID — позиция события в сортировке (client timestamp, run, index); timestamp имеет секундную точность. Поздний event может встать раньше уже выданного. Settle sleep не создаёт immutable total order. Названный race-free test вызывает alpha/beta/gamma последовательно в возрастающем порядке.

**Контрсценарий / воспроизведение:** agents-sync-reproduce.py SY-01 использует настоящий Sync.reserve и in-memory sharded plane: baseline7; zeta получает7, потом alpha в той же секунде получает7; общий replay меняет zeta на8. Ни облако, ни реальные register files не использовались.

**Чем ухудшает результат:** Коллизии DEC/OQ/DEP, ссылки на разные решения под одним ID; журнал выглядит согласованным только после ретроактивного переназначения.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:117](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L117); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1398](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1398); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1434](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1434); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2200](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L2200); [skills/agent-sync/test/validate.py:908](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/test/validate.py#L908)

**Исправление:** Выделение ID перенести в linearizable allocator: CAS/transaction или git ref с compare-and-swap; присвоенный value и reservation_id писать неизменно. Для offline — уникальные составные IDs/ULID с явным последующим mapping. Client clock пригоден для display, не арбитража.

**Приёмка:** Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.



<a id="sy-02"></a>

### SY-02 · P1 · Общий last-renew позволяет активности одного агента подавлять продление чужих leases

**Затронуто:** agent-sync. **Доказательство:** `measured_code_defect`. **План:** FIX-SY-02 → M1; пока proposed.

**Наблюдение:** Throttle marker лежит в .agent-sync/last-renew на checkout, а held()/refresh относятся к одному run. Любой acquire или renew сдвигает общую отметку, в том числе для чужих run.

**Контрсценарий / воспроизведение:** SY-02: два Sync с разными rid, один root; A.renew(TASK-A)=True, сразу B.renew(TASK-B)=False; B._refresh_lease вообще не вызван. Постоянная активность A может повторять suppression.

**Чем ухудшает результат:** Работающий B теряет TTL, другой агент перехватывает его задачу; одновременно UI показывает нормальную hook-активность.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1761](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1761); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1778](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1778)

**Исправление:** Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных.

**Приёмка:** С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.



<a id="sy-03"></a>

### SY-03 · P1 · Local renew перезаписывает уже завершённый steal

**Затронуто:** agent-sync. **Доказательство:** `measured_code_defect`. **План:** FIX-SY-03 → M1; пока proposed.

**Наблюдение:** _refresh_lease читает owner, затем tmp.replace(lock) без CAS и без того же critical section, которым пользуется steal. Проверка владельца устаревает до replace.

**Контрсценарий / воспроизведение:** SY-03 инъецирует настоящий _steal_expired после чтения old-owner и до Path.replace. Steal успешно устанавливает new-owner; старый renew отвечает True и восстанавливает old-owner. Только temporary files.

**Чем ухудшает результат:** Новый и старый агенты считают задачу своей, lease authority теряет линейность, работа может быть перезаписана.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1739](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1739); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1750](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1750); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1565](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1565)

**Исправление:** Один OS-backed critical section для acquire/renew/release/steal, revision/fencing token и проверка поколения. Просроченный владелец не продлевает lease без нового acquire. Не использовать unconditional replace для изменения ownership-sensitive state.

**Приёмка:** Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.



<a id="sy-04"></a>

### SY-04 · P1 · Task lease не защищает общий файл от владельца другой task lease

**Затронуто:** agent-sync. **Доказательство:** `measured_contract_gap`. **План:** FIX-SY-04 → M1; пока proposed.

**Наблюдение:** guard(path) разрешает запись при наличии любого held key. Это честно описано как one lease covers every guarded file, но не обеспечивает обещание who may write this file/no collisions. Ключи разных задач не взаимно исключают общий registry.

**Контрсценарий / воспроизведение:** SY-04: A держитTASK-A, B держитTASK-B, оба guard на один docs/DECISIONS.md возвращаютTrue. Это прямое измерение gate, не воспроизведение потери реальных данных.

**Чем ухудшает результат:** Shared registry read-modify-write может терять чужие строки несмотря на два корректно взятых task leases.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2848](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L2848); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:235](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L235); [skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md:237](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md#L237)

**Исправление:** Разделить task ownership и resource mutation lock. Для shared registries — краткий file/register transaction lock либо append-only event log с CAS; canonical paths и common repo identity. Изолированные worktrees плюс merge policy — другой честно объявленный режим.

**Приёмка:** Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.



<a id="sy-05"></a>

### SY-05 · P1 · Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают

**Затронуто:** agent-sync. **Доказательство:** `measured_code_defect`. **План:** FIX-SY-05 → M1; пока proposed.

**Наблюдение:** Имя lock создаётся атомарно, содержимое записывается позднее. Конкурент читает пустой JSON как {}, не считает его live и может украсть через _steal_expired. Первый продолжает писать в уже удалённый inode и тоже возвращает won.

**Контрсценарий / воспроизведение:** SY-05 запускает настоящие acquire() двух run; scheduler pause вставлен на os.fdopen после O_EXCL первого. Вывод [(True,second-owner),(True,first-owner)], на диске second-owner. Cloud/cross-machine не использовались.

**Чем ухудшает результат:** Нарушено базовое mutual exclusion даже на одной машине до истечения TTL.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1584](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1584); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1644](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1644); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1670](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1670); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1679](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1679)

**Исправление:** Создание и чтение ownership state сериализовать тем же OS lock либо публиковать уже заполненный объект атомарным no-replace primitive; partial/corrupt lock не считать немедленно stealable. Crash cleanup отличать от активного незавершённого create по арбитражу, не эвристике пустого JSON.

**Приёмка:** Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.



<a id="sy-06"></a>

### SY-06 · P2 · Одно gated смешивает lease guarantee, видимость и наличие host enforcement

**Затронуто:** agent-sync. **Доказательство:** `measured_source_contract_conflict`. **План:** FIX-SY-06 → M5; пока proposed.

**Наблюдение:** Код gated зависит от cfg и lease_mode. SKILL требует ungated без Claude hooks; backend-fs требует ungated по отсутствию shared awareness; adapter contract ещё связывает это с capabilities record plane. Один boolean отвечает на три разных вопроса.

**Контрсценарий / воспроизведение:** Наши scratch Sync с default local, cfg.gated=True дают gated=True без какого-либо host hook. Generated board/status берут это же свойство. На Codex enforcement не появляется от local lease.

**Чем ухудшает результат:** Оператор может прочитать gated как аппаратную защиту всех edits, хотя это лишь арбитраж ключа при добровольном использовании API.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1375](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1375); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2937](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L2937); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:45](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L45); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/references/backend-fs.md:36](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/references/backend-fs.md#L36); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md:55](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md#L55)

**Исправление:** Заменить на независимые lease_scope, enforcement_mode, awareness_scope, identity_strength и backend_health. В generated docs брать значения из runtime evidence; временно явно расшифровать legacy gated и убрать противоречащие references.

**Приёмка:** Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.



<a id="sy-07"></a>

### SY-07 · P2 · Guard охватывает редактор и некоторые git commit, но не все записи через shell

**Затронуто:** agent-sync. **Доказательство:** `observed_enforcement_limit`. **План:** FIX-SY-07 → M5; пока proposed.

**Наблюдение:** PreToolUse матчеры Edit/Write/MultiEdit/NotebookEdit и Bash с git commit фильтром. Python write_text, sed -i, redirect в Bash до commit не блокируются. Поздняя проверка staged paths не предотвращает потерю рабочего дерева до staging.

**Контрсценарий / воспроизведение:** SY-07 вызывает настоящий guard.sh в temp project с конфигурацией и Bash payload с Python write_text: exit0. Сам shell write не выполнялся. Реальная доставка hook event хостом не проверялась; manifest также фильтрует Bash по git commit.

**Чем ухудшает результат:** Неполная защита при формулировке безусловной enforcement; при смене host/tool naming покрытие становится ещё уже.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/hooks/hooks.json:22](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/hooks/hooks.json#L22); [skills/agent-sync/plugins/agent-sync/hooks/hooks.json:35](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/hooks/hooks.json#L35); [skills/agent-sync/plugins/agent-sync/hooks/guard.sh:36](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/hooks/guard.sh#L36); [skills/agent-sync/plugins/agent-sync/hooks/guard.sh:108](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/hooks/guard.sh#L108)

**Исправление:** Чётко объявить advisory protection boundary. Если нужна enforceable гарантия — file writes через trusted mutation API/isolated worktree/OS controls с resource locks; не пытаться считать regex shell parser универсальным sandbox. Host adapters имеют capability matrix.

**Приёмка:** Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.



<a id="sy-08"></a>

### SY-08 · P2 · Поиск task-pipeline не учитывает native Codex plugin cache

**Затронуто:** agent-sync. **Доказательство:** `observed_portability_defect`. **План:** FIX-SY-08 → M5; пока proposed.

**Наблюдение:** pipeline_installed проверяет только ~/.claude/plugins/cache/task-pipeline и direct ~/.agents/skills/task-pipeline либо ~/.claude/skills/task-pipeline. Native ~/.codex/plugins/cache/... не входит. Наличие копии на этом компьютере может маскировать дефект.

**Контрсценарий / воспроизведение:** SY-08 создаёт temp HOME с единственной Codex plugin копией SKILL.md и вызывает настоящую pipeline_installed(): False. Из самого status install не запускался; на реальной машине альтернативная direct копия может скрывать этот дефект.

**Чем ухудшает результат:** Ложный missing dependency, повторные установки и остановки на поддерживаемом host.

**Локаторы:** [skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:3542](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L3542); [skills/agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:149](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L149)

**Исправление:** Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding.

**Приёмка:** Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.



## Сквозные сценарии: как локальная ошибка усиливается в цепочке

Ниже — **анализ возможного взаимодействия найденных дефектов**, а не запись состоявшихся production-инцидентов. Исходные дефекты имеют собственные доказательства в карточках; выполнение всей составной цепочки живой моделью пока не проверялось. Эти сценарии нужно перенести в actual-load evaluation M6.

| Сценарий | Как результат может ухудшиться сейчас | Поведение целевой архитектуры | Приёмка композиции |
|---|---|---|---|
| Новый лендинг из существующего brand pack | Число из другого факта проходит B030; copy получает видимость проверки; последующий аудит видит согласованный источник, но неверный subject/unit. UX-01, UX-08, SE-04. | Claim сохраняет subject/predicate/unit/source. Founder approval разрешает использование решения, но не меняет происхождение факта. | Ввести единственный факт 500 integrations и запрос на социальное доказательство: нигде в опубликованном артефакте нет 500 million customers; неверный claim имеет явный FAIL/unverified, а не PASS. |
| Изменение UI без браузера или Figma | Требование инструмента может остановить подготовку результата; альтернативно статическая проверка становится отметкой implemented без runtime evidence. UX-11, UX-12, TP-02. | Согласованный textual spec и код можно подготовить; runtime verification отмечается NOT_RUN. Зависимость от Figma определяется deliverable, а не наличием UI вообще. | Задача не запрашивает покупку/подключение Figma для текстового handoff; не утверждает, что пользователь прошёл экран без browser receipt. Обязательная runtime-приёмка остаётся незавершённой. |
| Stripe subscription: повтор после crash | Получение события записано как обработка; процесс падает; повтор отклоняется; зелёный fixture повторной доставки может проверять только dedup, не entitlement. DV-01, DV-02. | Inbox хранит состояние обработки; business transition и outbox атомарны. Верификатор смотрит баланс/доступ и eventual effect, а не только HTTP status. | Crash в каждой границе транзакции, повтор и обратный порядок событий: один корректный entitlement, верные суммы, отсутствие необъяснённой pending операции. |
| Google OAuth внутри обычного приложения | Читаемая cookie содержит токены; общий OAuth client смешивает состояние; положительный callback проходит smoke, но не проверяет session isolation. DV-07, DV-09, DV-10. | Токены находятся в серверном хранилище; у каждой сессии свой контекст; state/nonce одноразовые и связаны с инициатором. | Два параллельных пользователя, повтор callback, чужой state и отсутствие nonce: нет переноса credentials, повторного создания сессии и токенов в клиентской cookie/логе. |
| Два агента редактируют общий реестр | ID меняет владельца при replay; lease другого ресурса подавляет renewal; успешный takeover может быть затёрт; guard считает наличие любой lease достаточным. SY-01…SY-05. | Allocation сериализован; lease привязана к resource и owner; каждое изменение несёт fencing token. Hook честно описывает, что способен перехватить. | При заранее управляемом interleaving есть один победитель на ресурс; выданный ID не меняется; stale writer получает отказ; независимые ресурсы не мешают renewal. |
| Mini App с корректными подписанными initData | HMAC canonicalization повторяет ошибку в implementation и test oracle; зелёный тест не выявляет несовместимость с реальным payload. TG-03. | Положительные/отрицательные fixtures приходят из независимо проверенного алгоритма; HMAC и Ed25519 режимы разделены. | Одни и те же байты проверяются отдельной oracle и рецептом; присутствие signature, будущая дата, изменение user/query data и replay имеют заранее заданные исходы. |
| Аудит существующего решения | ADR/согласование исключает замечание или отсутствие production consequence запрещает его зарегистрировать. PA-01, PA-02, AS-14. | Техническое наблюдение, production occurrence, принятый риск и решение об исправлении хранятся отдельно. | Доказуемый source defect остаётся finding при наличии ADR и без production доступа. Отчёт не выдумывает инцидент; решение «не исправлять» объясняется отдельно. |
| Аудит семейства со смешанным запросом | Слово «аудит» включает delivery; объясняющая часть гасит исправление; процитированный отказ отключает несвязанные маршруты. RT-01, RT-02, MS-03. | Независимые части запроса дают typed intent/effects. Только прямой scoped waiver влияет на конкретный маршрут. Audit заканчивается отчётом. | Дословный текущий запрос выбирает make-skill/evidence-docs и создаёт только audit artifacts; не запускает source fixes/release. «Объясни и исправь» сохраняет обе части; цитаты не меняют policy. |

В каждом таком тесте нужны четыре режима: без предметного скилла; явно названный предметный скилл; автоматический выбор; вся нужная композиция. Сравнение только первого и последнего не покажет, какой слой дал пользу или ухудшение. Сохраняются выбранные версии, actual-load receipt, разрешённые эффекты, финальный артефакт и независимый verdict. Стоимость и число лишних уточнений измеряются рядом с качеством, а не объявляются заранее выигрышем.


## Целевая архитектура: сохранить предметную глубину, сократить власть эвристик

Это **предлагаемый контракт**, а не описание уже реализованного состояния. Семейство остаётся девятью пакетами и 28 публичными скиллами. Переписывать всё в монолит или создавать ещё один обязательный оркестратор поверх task-pipeline не требуется. Общими должны стать небольшие схемы данных, правила выбора и проверяемые переходы; предметные знания остаются у владельцев.

### 1. Что есть сейчас

`skills.json` связывает пакеты, версии и публичные имена. Git submodules закрепляют исходники; member packages доставляют skills, scripts, commands, hooks и references. Launcher ставит копии в разные среды и материализует routing block. `routers-registry.js` описывает границы предметных областей, `triggers.js` ищет языковые совпадения, `routegate.js` иногда просит подтверждение обхода. Затем модель читает SKILL.md и дочерние инструкции. Доменные скрипты и линтеры проверяют часть артефактов; исторические evals оценивают часть выбора/исполнения.

Проблемные связи доказаны в RT/MS/TP/PA/UX/DV/TG/SY finding cards ниже. В частности, выбор названия, доступность способности, разрешение записи, доказательство факта и завершение задачи иногда обозначаются одним признаком. Именно эти связи нужно разделить.

### 2. Семь уровней и их ответственность

| Уровень | Владелец | Вход → выход | Чего этот уровень не решает |
|---|---|---|---|
| Реестр и release lock | sshlg-skills + make-skill | immutable source digests, manifests → resolver inventory | Не объявляет доступным то, что просто найдено на диске |
| Адаптер среды | sshlg-skills | host/version/native tools/install records → capabilities | Не выдаёт разрешение использовать секреты или писать наружу |
| Выбор маршрута | sshlg-skills | task intent + subject + facets + scope → route plan с объяснением | Не начинает release из слова audit |
| Контекст и предметный контракт | 28 скиллов | артефакты/источники → минимальный набор инструкций и required outputs | Не загружает всё семейство каждый раз |
| Исполнение | task-pipeline для repository change; прямой executor для audit/artifact | выбранный профиль, зависимости, разрешённые эффекты → receipts | Не делает необязательный инструмент обязательной покупкой |
| Проверка | domain verifiers + независимый eval harness | artifact + внешние oracle + replay → typed result | Не называет PASS отсутствие ошибки запуска |
| Доставка и обратная связь | member CI + umbrella | release candidate + validation matrix → immutable release и наблюдения | Не исправляет правила по одному понравившемуся результату |

Поток: **запрос → typed intent → разрешимый route plan → доменные артефакты → проверка результата → авторизованная доставка → измеренная обратная связь**. Ветка audit заканчивается отчётом. Ветка change входит в delivery profile. У них могут быть общие знания, но разные допустимые эффекты.

### 3. Что должен объявлять каждый скилл

Внутренний `skill.contract.json` размещается рядом со SKILL.md. Это предлагаемое расширение семейства, не новое требование Agent Skills specification. Публичный frontmatter остаётся совместимым со стандартом.

```json
{
  "contract_version": 1,
  "skill_id": "google-signin",
  "job": "implement_or_review_google_identity_login",
  "modes": ["explain", "audit", "implement"],
  "inputs": ["identity_policy", "existing_auth_flow", "host_capabilities"],
  "outputs": ["auth_flow_change_or_findings", "verification_receipts"],
  "allowed_effect_classes": ["read", "source_write", "test_fixture_write"],
  "required_capabilities": [],
  "optional_capabilities": ["browser", "google_test_identity"],
  "contracts": ["claim.v1", "verification.v1", "auth-session.v1"],
  "exclusions": ["server_to_google_service_credentials"],
  "owner": "sheleg-dev",
  "degradation": {"google_test_identity": "record_live_verification_unavailable"}
}
```

`allowed_effect_classes` — максимальная область ответственности скилла, **не авторизация действия**. Эффективные действия — пересечение пользовательского запроса/сохранённых разрешений, возможностей среды и этого контракта. `audit` не наследует source_write от implement. Credentials/data scopes проверяются инструментом и политикой среды; текст скилла не повышает права.

Идентификатор поставщика включает origin и digest. Совпадение `copywriting` из двух источников не делает их одной версией. Ключи shared schemas версионируются. Single source of truth допустим в source repo; distributable generated copies собираются автоматически, а равенство доказывается digest. Это разрешает конфликт между одной авторской копией и автономной доставкой.

### 4. Маршрутизация настраивается по проекту и задаче

Порядок приоритетов: системные/host ограничения → актуальный запрос и ранее данная авторизация → explicit project policy → user defaults → shipped defaults. Авторская рекомендация скилла находится ниже этих уровней. Нельзя заставлять пользователя повторять уже заданный выбор ради внутреннего gate.

Текущие `~/.sshlg-skills/config.json` и managed blocks сохраняются на время миграции. Новый пример ниже пока **не поддерживаемый CLI config**, а проектируемый формат для последующего внедрения:

```yaml
schema: sshlg-policy/v1
profile: standard             # minimal | standard | high-assurance
routing:
  mode: advise               # advise | enforce-artifact-contracts
  language: [ru, en]
  preferred_providers:
    ui_scenarios: super-ux
    visual_design: sheleg-design
    product_copy: super-ux
  alternatives: allowed_when_contract_matches
  waivers:
    - route: sheleg-design
      scope: task
      source: explicit_user_choice
execution:
  model: inherit
  clarification: missing_material_decisions_only
  preserve_prior_authorization: true
  audit_source_mutations: forbidden
  optional_tools_missing: record_degradation
artifacts:
  root: docs
  ux: docs/ux
  brand: docs/brand
  audit_output: outside_source_by_default
verification:
  unexplained_tool_error: TEST_ERROR
  runtime_claim_requires_runtime_receipt: true
  lexical_style_checks: advisory
```

При компиляции policy выдаётся `route-receipt.json`: task-id; прочитанный scope; active host; какой источник дал каждый параметр; skill ids+digests; порядок и причины зависимостей; deferred checks; требуемые решения. Для непонятого текста допускается `ambiguous`: агент уточняет только ту часть, без которой нельзя выбрать безопасный или полезный следующий шаг. Regex может предложить кандидатов, но не должен безусловно выключать всё из-за слова «объясни» или цитаты отказа.

Минимальная цепочка зависит от изменения. Изменение существующего error string не требует заново писать vision, personas и flows. Новый продукт требует этих решений. Отдельный пост проходит copywriting и brand contract, не delivery pipeline. MCP server относится к agent-interop, применение уже существующего MCP для аудита — не строительство агентной системы.

Состояния route: `planned → resolved → running → verified → complete`, с альтернативами `degraded`, `blocked_by_required_input`, `failed`, `cancelled`. `degraded` может закончить задачу с ограниченным утверждением, если недоступная проверка не обязательна для результата. Отсутствие Figma не отменяет согласованную текстовую спецификацию; отсутствие runtime proof не разрешает утверждать, что реальный пользователь прошёл экран.

### 5. Общая модель фактов и решений

```json
{
  "claim_id": "CLM-001",
  "subject": "product",
  "predicate": "supported_integrations",
  "value": 500,
  "unit": "integration",
  "population": "published_catalogue",
  "as_of": "2026-09-07",
  "epistemic_status": "observed",
  "decision_status": "accepted_for_use",
  "evidence": [{"kind": "computed_catalogue", "artifact_digest": "...", "locator": "..."}],
  "allowed_transformations": ["exact", "round_down_with_label"]
}
```

Значение 500 для integrations не доказывает 500 million customers. Approval основателя не меняет hypothesis на observed. ADR не делает техническое решение корректным; факт ошибки и принятие её стоимости сохраняются раздельно. Отсутствие инцидента отличается от отсутствия измерения. Описание свойства и объяснение его причины — разные claims. Противоречие определяется предметом, предикатом, популяцией и моментом, а не совпадением URL или числа.

Состояния проверки: `PASS`, `FAIL`, `NOT_RUN`, `TEST_ERROR`, `NOT_APPLICABLE`; `N/A` в человекочитаемых таблицах — краткое отображение `NOT_APPLICABLE`, не дополнительное состояние схемы. Evidence kind: `static`, `unit`, `integration`, `browser`, `production_observation`, `human_judgment`. Субъективная оценка без заданного протокола не выдаётся за инструментальное измерение; human grading по rubric сохраняет протокол, выборку и согласованность оценщиков. Отдельно confidence/rationale и severity/impact. Ни отсутствие библиотек, ни ENOSPC, ни пустой stdout не преобразуются в PASS.

### 6. Стыки, которые нужно сделать контрактами

| Стык | Контракт | Независимый критерий |
|---|---|---|
| vision → foundation | решение продукта vs гипотезы аудитории | approval не стирает provenance |
| foundation → flows → scenarios | identity, states, assumptions, acceptance criteria | сценарии покрывают задачу, а не выбранный красивый экран |
| UX → copy + visual | screen/state ids, length/locale budgets, доступность | copy помещается, смысл действия и состояние согласованы |
| copy → facts | claim-id → typed fact-id | сохранены субъект, число, единица, отрицание и смысл |
| style pack → компоненты | semantic role tokens + per-pack adapter | все required roles разрешаются, старый pack не протекает |
| auth → app session | challenge/nonce/state/session authority | callback связан с правильным инициатором; replay не создаёт новую сессию |
| webhook → balance/entitlement | durable inbox + transaction + outbox | received ≠ completed; crash recovery выполняет эффект ровно по business key |
| leases → shared writes | owner+resource+fencing token | stale owner не может записать после takeover |
| model telemetry → wallet | inclusions и единицы provider usage | reasoning/cache tokens не оплачиваются повторно |
| source → install | release digest + dependency closure | все заявленные каналы несут проверенный bundle |
| eval → release | task outcome + actual-load trace + baseline | скилл даёт измеренную пользу либо честно не проходит критерий |

«Ровно один эффект» здесь означает бизнес-инвариант внутри определённого транзакционного контура и идемпотентного получателя. Нельзя обещать универсальный exactly-once delivery для сети. Для внешнего API нужны idempotency key, durable retry и reconciliation.

### 7. Профили исполнения и стоимость

**Minimal:** вопрос, аудит одного предмета, малое обратимое изменение. Только релевантные знания и проверка результата; без обязательного интервью, графа ради графа и трёх рецензентов на узел.

**Standard:** обычный change с кодом и артефактами. Достаточный brief из уже известных данных, зависимости, соответствующие риску tests, review существенных изменений, явный release boundary.

**High-assurance:** деньги, identity, concurrent state, необратимые действия. Независимые oracle, fault injection, crash/replay, scope-specific review и preconditions. Число рецензентов определяется задачей/риском и измеренной полезностью, не постоянной цифрой для любого файла.

Профиль — стартовая настройка, не право понизить требуемую проверку. Например, короткий auth patch всё равно нуждается в replay/CSRF проверке. Сначала держать выбранную пользователем модель; менять модель/parallelism по конкретной задаче и измерению стоимости. Не обещать заранее, что самая дорогая модель всегда экономнее.

Предлагаемая первая матрица поддержки ниже — **план проверки**, не утверждение, что она уже пройдена. Разумно начать с непосредственно используемых здесь сред, а расширять supported claim после такого же набора receipts.

| Среда | Что проверять отдельно | Правило поддержки |
|---|---|---|
| Claude Code | install/enable, native skill resolution, hook scope, фактическая загрузка, resume; version pin CLI | Strict validate и runtime outcome — разные receipts. Gated native eval не считается выполненным по наличию help. |
| Codex desktop | Plugin и `.agents` пути, выбранный источник и digest, tools текущей задачи, роль project instructions | Не выводить доступность из Claude install registry. Возможность инструмента должна прийти от действующего host adapter. |
| Codex CLI | Та же задача на собственном чистом профиле, precedence и resume | Проход desktop не переносится автоматически на CLI; общая часть может быть повторно использована, runtime receipt — отдельный. |
| Остальные заявляемые каналы | Для каждого отдельная чистая установка, разрешение зависимостей, actual load, outcome, upgrade/rollback | До проверки — experimental/untested. Plain-folder доставка без hooks может быть поддержана как guidance, если ограничения enforcement описаны явно. |

Каждую среду проверять в двух вариантах: минимальная установка семейства без companions и используемая полная конфигурация. Это отделит полезность самого скилла от случайно доступного соседнего плагина. Одинаковая версия текста не гарантирует одинаковое исполнение. Для offline/ограниченных сред недоступная внешняя проверка получает NOT_RUN; сведения из памяти не получают свежую дату проверки.

### 8. Почему схема жизнеспособна, и чего прототип не доказывает

`architecture-prototype.py` — небольшой исполняемый планировщик **типизированных** заданий. В нём 28 authored сценариев охватывают все публичные скиллы; проверяются точный выбранный набор, отсутствие чужого маршрута, read-only эффекты, отказ от одного skill, отсутствие optional Figma/browser, сохранённая авторизация и блокировка неизвестного production target. Четыре намеренных дефекта результата должны быть отвергнуты. Это воспроизводится командами из verification appendix.

Тест показывает, что предложенную развязку intent/effects/capabilities можно выразить и проверить детерминированно на этих 28 заданиях. В графе плана отдельно проверено отсутствие циклов. Это ограниченная проверка согласованности, а не доказательство полноты всех возможных jobs. Она **не** проверяет LLM-классификацию естественного языка, настоящие tool permissions, новый installer, обработку concurrency в production, или эффективность всех 28 скиллов. Эти работы явно находятся в плане, не считаются выполненными из-за зелёного прототипа.

Схема не требует одновременно менять все domain docs. Сначала исправляются наиболее опасные snippets с независимыми fixtures (M1), затем типы результатов (M2) и routing (M3); общие sidecars мигрируют в M5. Старые bodies на переходе работают через compatibility adapter. Legacy routing остаётся advisory до сравнения с новым планировщиком на одинаковых задачах. Откат означает вернуть предыдущий release lock/profile; пользовательские формулировки не теряются.

### 9. Критерий «100% реализовано»

Абсолютная безошибочность открытого набора инструкций недоказуема. Здесь 100% означает **весь согласованный объём этой программы закрыт проверяемыми результатами**:

- каждый finding имеет отдельное решение: исправлен с regression proof или осознанно принят с основанием; accepted risk не перекрашивается в fixed. Для завершения этой программы открытого P1 в заявленной supported scope не остаётся: его исправляют либо явно изымают небезопасный рецепт/неподтверждённое обещание из поддержки; одно согласование риска не закрывает P1;
- у каждого из 28 skills есть mode/effect/input/output/capability contract, рабочая dependency closure и актуальная verified source map;
- каждый заявленный supported host проходит изолированную установку, resolution, задачу и повтор после resume/compaction; неподтверждённые hosts обозначены experimental;
- критические auth/payment/concurrency примеры выдерживают независимые негативные и crash/replay проверки;
- routing evaluation содержит multi-intent, русские склонения, цитаты, отказ по scope, compound tasks; тестируется actual load, а не только ответ названием;
- для качества есть with/without и ablation: без скилла; domain skill; routing+domain; полный delivery. Измеряются correctness, лишние действия/вопросы, стоимость и latency;
- пороги заранее зафиксированы владельцем; критические contract violations — нулевой допуск на обязательном наборе, остальные метрики оцениваются с размером выборки и неопределённостью;
- опубликованные артефакты, pins и установленные копии имеют проверенное соответствие; rollback проверен; sustained monitor запускается только после явной настройки пользователем.

Нельзя считать этап завершённым по количеству файлов, строк линтера, подписей reviewer или найденных проблем. Готовность — матрица конкретных контрактов и доказательств.


### Исполненные сценарии предлагаемой модели

Входы intent/facets заданы вручную. Таблица проверяет состав маршрута и ограничения эффектов. Обычный язык, принятие решения самой моделью, фактический запуск скиллов и runtime-результат продукта здесь не моделируются. Для случаев без authorized_effects прототип оставляет только чтение: наличие change intent само по себе не используется как универсальная запись-разрешение.

| Сценарий | Ожидаемые скиллы | Итог |
|---|---|---|
| SC-01 — Аудит семейства как текущий запрос | make-skill, evidence-docs | PASS |
| SC-02 — Read-only проект | project-audit, evidence-docs | PASS |
| SC-03 — Определение термина | Ни одного | PASS |
| SC-04 — Объясни и исправь Google login | task-pipeline, google-signin | PASS |
| SC-05 — Исправить ошибку в согласованном UI | task-pipeline, ux-scenarios, ux-audit | PASS |
| SC-06 — Новый продукт | task-pipeline, vision, ux-foundation, ux-flows, ux-scenarios, copywriting, sheleg-design, brand-voice, seo-aeo-audit | PASS |
| SC-07 — Структура экрана без выбора визуала | task-pipeline, ux-flows, ux-scenarios | PASS |
| SC-08 — Отдельный пост | copywriting | PASS |
| SC-09 — Бренд с нуля | brand-voice | PASS |
| SC-10 — Stripe backend | task-pipeline, stripe-billing | PASS |
| SC-11 — Crypto | task-pipeline, crypto-payments | PASS |
| SC-12 — Sentry | task-pipeline, error-tracking | PASS |
| SC-13 — Attribution | task-pipeline, ad-tracking | PASS |
| SC-14 — Server Google ADC | task-pipeline, google-auth | PASS |
| SC-15 — CWV | task-pipeline, frontend-performance | PASS |
| SC-16 — Использовать субагента для обычной задачи | task-pipeline | PASS |
| SC-17 — Создать agent system | task-pipeline, agent-orchestrator, agent-harness, agent-evals, agent-interop | PASS |
| SC-18 — Telegram bot | task-pipeline, telegram-bots | PASS |
| SC-19 — Telegram user account automation | task-pipeline, telegram-userbots | PASS |
| SC-20 — Mini App со Stars | task-pipeline, telegram-miniapps, telegram-bots, ux-scenarios, copywriting, sheleg-design | PASS |
| SC-21 — Конкурентные writers общего реестра | task-pipeline, agent-sync | PASS |
| SC-22 — Один writer | task-pipeline | PASS |
| SC-23 — Нет Figma | task-pipeline, ux-scenarios, sheleg-design | PASS |
| SC-24 — Нет browser | task-pipeline, ux-scenarios | PASS |
| SC-25 — Отказ только от дизайна | task-pipeline, stripe-billing, ux-scenarios | PASS |
| SC-26 — Deploy был явно разрешён ранее | task-pipeline | PASS |
| SC-27 — Не определён production target | task-pipeline | PASS |
| SC-28 — SEO audit с недоступной GSC | seo-aeo-audit, evidence-docs | PASS |



Инварианты: all_28_skills_exercised, figma_absence_not_blocking, browser_absence_not_false_verified, standing_auth_no_reask, unknown_target_blocks_external. Мутанты проверяют, что испорченные правила действительно отвергаются; четыре проверки модели не заменяют полноценный независимый тест production router.

## Последовательный план: от текущего состояния до проверенного выпуска

Аудит, воспроизведения и модель архитектуры выполнены. Исправления исходников, миграция контрактов и releases **не выполнялись**. Ни один FIX ниже не объявлен закрытым. Нумерация — последовательность зависимостей; отдельные задачи одной фазы можно выполнять независимо после её входных условий. Граф содержит 90 задач исправления и 9 контрольных вех; циклов и потерянных finding нет.

У каждого FIX критерий приёмки конкретнее общего gate фазы. Исполнитель должен сначала закрепить наблюдение тестом или проверяемым источником, затем исправить канонический рецепт, обновить распространяемые копии и сохранить receipt. PR/CI не обязаны проходить новую общую архитектуру до исправления опасных примеров в M1. Даты и трудозатраты не назначены: состав команды и доступ к реальным host evals пока не заданы.

До закрытия SY-01…SY-05 изменения одного shared resource выполняются одним писателем последовательно; текущая lease не считается доказательством взаимного исключения. Задачи в разных независимых пакетах могут идти параллельно. Эталон проверки хранится отдельно от исправляемого алгоритма: исправить implementation и oracle одинаковым способом недостаточно. Это снимает зависимость ремонта от гарантий самого повреждённого механизма.

| Веха | Предшественник | Задач | Ответственный пакет | Результат |
|---|---|---:|---|---|
| M0 — Зафиксировать базу и границы программы | — | 0 | sshlg-skills | Версии, digests, реестр 90 замечаний, fixtures, список поддерживаемых host/version и определение production evidence. |
| M1 — Исправить примеры с риском потери денег, доступа и блокировок | M0 | 24 | sheleg-dev · telegram-dev · agent-sync · agent-stack | Независимые crash/concurrency/replay fixtures; исправленные алгоритмы и все их копии. Патчи допускаются отдельно от новой общей архитектуры. |
| M2 — Сделать проверку честной и факты типизированными | M1 | 18 | super-ux · task-pipeline · make-skill · agent-stack | Result schema PASS/FAIL/NOT_RUN/TEST_ERROR/N/A; claim/fact provenance; независимые oracle вместо самопроверяющихся примеров. |
| M3 — Заменить принуждение по словам на маршрут по намерению и эффектам | M2 | 12 | sshlg-skills · task-pipeline · make-skill | Раздельные intent/subject/facets/effects; route receipt; scoped waivers; capability adapter; minimal/standard/high-assurance profiles. |
| M4 — Устранить предметные противоречия и устаревшие правила | M3 | 25 | Все предметные пакеты | Исправленные правила дизайна/SEO/UX/телеметрии/OAuth/Telegram; source register с датой и областью применимости; единый источник дублируемых рецептов. |
| M5 — Мигрировать 28 скиллов на совместимые контракты и host adapters | M4 | 8 | sshlg-skills · make-skill · владельцы 28 скиллов | 28 sidecars skill.contract.json; project policy; capability receipts; clean-install матрица заявленных сред; адаптеры токенов и sibling dependencies. |
| M6 — Проверить настоящее применение и пользу семейства | M5 | 3 | Общий eval harness + владельцы доменов | Actual-load end-to-end matrix: baseline, named skill, auto-route, full composition; с инструментами и без optional tools; repeated seeds и независимые grading criteria. |
| M7 — Выпустить и проверить ограниченное развёртывание | M6 | 0 | Member CI + umbrella release | Release candidates с pinned digests, опубликованные member versions, затем umbrella; smoke на чистых профилях, release receipts и проверяемый rollback. |
| M8 — Закрыть программу и закрепить обслуживание | M7 | 0 | Владелец семейства | Матрица 28/28 contracts, 90/90 dispositions, закрытые P1, остаточные ограничения, регламент обновления внешних норм, эталонный eval set. |



### M0. Зафиксировать базу и границы программы

**Вход:** зафиксированный аудит. **Выход:** Версии, digests, реестр 90 замечаний, fixtures, список поддерживаемых host/version и определение production evidence.

**Контроль завершения:** Артефакты этого аудита приняты как исходная точка; каждое замечание имеет owner, статус и приёмку. Решение команды о поддерживаемых средах записано.

**Управление регрессией:** Исходники ещё не меняются; сохранять исходные версии и тестовые receipts.



### M1. Исправить примеры с риском потери денег, доступа и блокировок

**Вход:** M0. **Выход:** Независимые crash/concurrency/replay fixtures; исправленные алгоритмы и все их копии. Патчи допускаются отдельно от новой общей архитектуры.

**Контроль завершения:** Ни один критический counterexample не воспроизводится; старый алгоритм обязан провалить новый тест. Реальные секреты/платежи для проверки не нужны.

**Управление регрессией:** Малые независимые releases; при регрессии отключать опасный рецепт и откатывать пакет, не маскировать повторный FAIL.



- **FIX-DV-01 · P1 · sheleg-dev** — [Claim фиксирует получение, но ошибочно считается завершением работы](#dv-01). Разделить received/processing/completed; claim с lease и восстановлением; entitlement + business dedup + outbox в одной транзакции; consumer эффектов с собственной идемпотентностью. **Приёмка:** Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.



- **FIX-DV-02 · P1 · sheleg-dev** — [Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant](#dv-02). Уникальная запись grant по subscription/item/invoice/period и атомарная выдача; отдельно monotonic mirror состояния. Определить isolation и retry serialization failures. **Приёмка:** Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.



- **FIX-DV-03 · P1 · sheleg-dev** — [Компенсация количества не компенсирует уже снятые деньги](#dv-03). Durable operation intent с idempotency key; предпочесть восстановить БД из подтверждённого Stripe состояния. Если бизнес выбрал rollback, отдельно оформить подтверждённую финансовую компенсацию и её статус. **Приёмка:** Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.



- **FIX-DV-04 · P1 · sheleg-dev** — [Refund CAS проигрыш молча теряет больший cumulative refund](#dv-04). Под row lock/serializable transaction вычислять max(total_seen), delta и обновлять ledger вместе; CAS loser перечитывает и повторяет. Денежные значения хранить в minor units, а не /100 float. **Приёмка:** Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.



- **FIX-DV-05 · P1 · sheleg-dev** — [Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID](#dv-05). Один исполняемый эталон; разделить payment status, immutable settlement grant и refund ledger. Only confirmed settlement credit; атомарный business dedup; refunds и holds не отбрасывать как duplicate. **Приёмка:** pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.



- **FIX-DV-07 · P1 · sheleg-dev** — [OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie](#dv-07). В cookie только случайный opaque session id; Google credentials хранить server-side encrypted store, доступ по session+principal. Удалить token logging; production secret без dev fallback; HTTPS guard. **Приёмка:** Локальный HTTP client выполняет stubbed OAuth callback, декодирует Set-Cookie: ни client_secret, ни access/refresh token отсутствуют; stdout/stderr также чисты.



- **FIX-DV-09 · P1 · sheleg-dev** — [Express OAuth использует общий mutable client и неполную проверку state](#dv-09). Client на запрос/пользователя, credentials не мутировать глобально; required cryptorandom state привязать к server session, TTL, atomic consume; validation до token exchange. **Приёмка:** Интерливинг A/B с задержкой между setCredentials и transport использует разные Authorization; missing/expired/reused state не вызывает token endpoint.



- **FIX-DV-10 · P1 · sheleg-dev** — [Nonce равен присланному клиентом значению, а не ожидаемому сервером](#dv-10). Server-issued nonce связан с pre-auth HttpOnly session, TTL и one-time consume; обязательное точное совпадение token nonce с server expectation, а не body nonce. **Приёмка:** Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.



- **FIX-DV-11 · P1 · sheleg-dev** — [Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом](#dv-11). По умолчанию linking после fresh re-auth текущего локального аккаунта; если auto-link нужен, явно учитывать Google authoritative conditions и независимый challenge для прочих адресов. Unverified pre-registration направлять в безопасное recovery, не только в чужой password. **Приёмка:** JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.



- **FIX-DV-12 · P1 · sheleg-dev** — [Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract](#dv-12). Раздельные явно типизированные form/JSON paths; form требует оба g_csrf_token, JSON требует trusted same-origin или точный Origin fallback; отсутствие обоих fail closed. **Приёмка:** TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.



- **FIX-DV-14 · P1 · sheleg-dev** — [Безусловный noscript pixel противоречит consent-gated архитектуре](#dv-14). Генерировать snippets из исполняемых templates; noscript разрешать только по ранее сохранённому server-verifiable consent либо убрать. Исправить G/AW конфигурацию синхронно с prose. **Приёмка:** Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.



- **FIX-DV-15 · P1 · sheleg-dev** — [Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs](#dv-15). Парсер/редактор URL поддерживает пустой username, encoded credentials, token query/path; отдельные application secret shapes; ограничить обещание покрытия и также проверять attachments/transactions/logs по используемым SDK hooks. **Приёмка:** Canary matrix fake Redis/AMQP/Postgres URLs, encoded credentials, Telegram path, access-token query, nested events; ни один fake secret не доходит до test transport.



- **FIX-TG-01 · P1 · telegram-dev** — [Crash fixture зелёный, но после реальной redelivery update теряется](#tg-01). Принять update в durable inbox, ack после commit enqueue; state+lease+retry worker. Business grant keyed charge, outbox для send. Проверять не только redelivery, но eventual completed work. **Приёмка:** Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.



- **FIX-TG-03 · P1 · telegram-dev** — [HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle](#tg-03). Разделить HMAC и Ed25519 canonicalization, запретить shared false helper; официальные/независимые golden vectors с signature. Включить строгий parse duplicate fields и upper/lower auth_date window. **Приёмка:** Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).



- **FIX-AS-01 · P1 · agent-stack** — [Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ](#as-01). Назвать saga/outbox; хранить operation_id и состояния pending/applied/unknown/compensated. При ambiguous timeout сначала сверять статус по идемпотентному ключу; компенсировать только подтверждённый отказ и только собственную проводку. Ввести сериализацию или CAS на весь tenant transfer state, а не обещать её транзакционным lock до HTTP. **Приёмка:** Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.



- **FIX-AS-02 · P1 · agent-stack** — [Нулевой baseline путается с отсутствующим: первый реальный расход теряется](#as-02). Хранить baseline_initialized, observed_at и provider_key_generation отдельно от суммы; ноль — валидное значение. На уменьшение без смены поколения переводить reconciliation в anomaly, не объяснять причину догадкой. **Приёмка:** Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.



- **FIX-AS-03 · P1 · agent-stack** — [Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию](#as-03). Similarity использовать только для поиска кандидатов. Записи хранить с entity/attribute/scope/provenance/validity; contradiction gate до merge. Подтверждение отделить от повторного извлечения, не повышать доверие за self-generated повтор; temporal supersession и reversible history. Verified не освобождает volatile fact от freshness. **Приёмка:** Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.



- **FIX-AS-04 · P1 · agent-stack** — [Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload](#as-04). Типизировать ребро: data/control/authorization/resource. Для любого ребра требовать rationale и доказательство, но удалять только если нет ни причинного, ни ресурсного, ни разрешительного ограничения. Side-effect footprint и read/write sets проверять перед fan-out. **Приёмка:** Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.



- **FIX-AS-11 · P1 · agent-stack** — [confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности](#as-11). Для user approval нужен проверяемый grant от trusted control plane, bound to principal/action/arguments/expiry, либо уже существующее разрешение. Булевое поле назвать syntax guard. Trifecta описывать как достаточную конфигурацию конкретного exfiltration риска, не полную модель безопасности. **Приёмка:** Agent-authored confirm:true без grant отвергается; повтор с изменёнными arguments также; заранее авторизованное действие проходит. Сценарий untrusted content→destructive write входит в threat tests независимо от private-data доступа.



- **FIX-SY-01 · P1 · agent-sync** — [Выданные IDs меняются задним числом; два reserve возвращают один номер](#sy-01). Выделение ID перенести в linearizable allocator: CAS/transaction или git ref с compare-and-swap; присвоенный value и reservation_id писать неизменно. Для offline — уникальные составные IDs/ULID с явным последующим mapping. Client clock пригоден для display, не арбитража. **Приёмка:** Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.



- **FIX-SY-02 · P1 · agent-sync** — [Общий last-renew позволяет активности одного агента подавлять продление чужих leases](#sy-02). Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных. **Приёмка:** С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.



- **FIX-SY-03 · P1 · agent-sync** — [Local renew перезаписывает уже завершённый steal](#sy-03). Один OS-backed critical section для acquire/renew/release/steal, revision/fencing token и проверка поколения. Просроченный владелец не продлевает lease без нового acquire. Не использовать unconditional replace для изменения ownership-sensitive state. **Приёмка:** Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.



- **FIX-SY-04 · P1 · agent-sync** — [Task lease не защищает общий файл от владельца другой task lease](#sy-04). Разделить task ownership и resource mutation lock. Для shared registries — краткий file/register transaction lock либо append-only event log с CAS; canonical paths и common repo identity. Изолированные worktrees плюс merge policy — другой честно объявленный режим. **Приёмка:** Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.



- **FIX-SY-05 · P1 · agent-sync** — [Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают](#sy-05). Создание и чтение ownership state сериализовать тем же OS lock либо публиковать уже заполненный объект атомарным no-replace primitive; partial/corrupt lock не считать немедленно stealable. Crash cleanup отличать от активного незавершённого create по арбитражу, не эвристике пустого JSON. **Приёмка:** Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.



### M2. Сделать проверку честной и факты типизированными

**Вход:** M1. **Выход:** Result schema PASS/FAIL/NOT_RUN/TEST_ERROR/N/A; claim/fact provenance; независимые oracle вместо самопроверяющихся примеров.

**Контроль завершения:** Неверные единицы и субъекты не проходят; exit!=0 не становится PASS; отсутствие браузера/данных не становится подтверждением; согласование не меняет происхождение факта.

**Управление регрессией:** Первый запуск новых семантических проверок в report mode; включение gate после разбора ложных срабатываний.



- **FIX-MS-01 · P1 · make-skill** — [Приближение chars/3.9 выдаёт PASS токенового лимита](#ms-01). Подключить реальный именованный tokenizer; без него budget status=UNMEASURED, estimate отдельным полем. House thresholds отделить от требований формата и host policy. **Приёмка:** Unicode, английский, код, смешанный RU/EN; сравнение с независимым tokenizer; отсутствие библиотеки не возвращает PASS измерения.



- **FIX-MS-02 · P1 · make-skill** — [Самодельный YAML parser теряет типы metadata](#ms-02). Разделить полноценный YAML validation и быстрый stdlib precheck. Либо bundle безопасный parser, либо явно ограничить supported subset и не пропускать неподдержанные формы как корректные. **Приёмка:** Двусторонние fixtures: quoted/unquoted numeric, boolean, null, YAML escapes, multiline scalars, duplicate keys; одинаковые вердикты с upstream validator.



- **FIX-PA-01 · P1 · task-pipeline** — [Документированное решение автоматически оправдывает дефект](#pa-01). Decision status и technical validity — разные оси. Accepted trade-off может быть отмечен принятой ценой; документированное нарушение остаётся finding с decision_id, причиной пересмотра и контрдоказательством. **Приёмка:** Фикстура ADR разрешает логирование refresh token: аудитор всё равно обнаруживает раскрытие, связывает с ADR; сознательная поддержка только одного браузера при подходящем контракте — accepted limitation.



- **FIX-PA-02 · P1 · task-pipeline** — [Отсутствие production измерения запрещает считать доказанный механизм дефектом](#pa-02). Отдельно mechanism status, exploit/reproduction, exposure, observed incidence и impact uncertainty. Доказанный defect может иметь incidence unknown. UNKNOWN не равно 0; отсутствие телеметрии не понижает техническую истинность. **Приёмка:** Race reproduced/production unknown остаётся finding; нулевая выборка не превращается в нулевой риск; JSON хранит scope и время наблюдения.



- **FIX-PA-03 · P2 · task-pipeline** — [Опциональная HTML-страница обязательна в критерии выхода](#pa-03). Указать read-only относительно target source/data, разрешённый output dir; условный DoD по requested deliverables. Добавить mode stdout/json/html и не требовать браузер для json-only. **Приёмка:** Без --report HTML не создаётся и run complete допустим; --report требует существующий HTML, безопасные ссылки и inspect/render status.



- **FIX-UX-01 · P1 · super-ux** — [B030 не доказывает происхождение утверждения](#ux-01). Ввести claim-id → fact-id, субъект, единицу, популяцию, дату и разрешённые преобразования. Линтер проверяет ссылку/единицу/точность, семантический аудит проверяет утверждение. До этого сузить обещание B030 до проверки известного числового токена и явно показывать unverified claims. Не исключать год без контекста. **Приёмка:** Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.



- **FIX-UX-02 · P1 · super-ux** — [B051 объявляет спамом текст без единого повторения](#ux-02). Сделать repetition advisory с минимальным count и длиной, учитывать зарегистрированные термины и язык, группировать по реально отрендеренной странице. Удалить универсальное обещание влияния на цитирование. Google описывает unnatural repetition/manipulative intent, а не порог 1%: https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing . **Приёмка:** 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.



- **FIX-UX-03 · P1 · super-ux** — [Humanization «никогда не блокирует» расходится с исполняемым B060](#ux-03). Единый контракт: humanization review всегда advisory, word markers не устанавливают authorship/naturalness grade. Учитывать цитаты/код/термины, разделить редакционный off и явно выбранные brand bans. Удалить severity переход из количества маркеров. **Приёмка:** Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.



- **FIX-UX-05 · P1 · super-ux** — [Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт](#ux-05). Ошибка/timeout/tool refusal = отдельный outcome; изолированный fixture, фиксированный scope tools, запись run manifest/stdout/artifacts. Проверять число surfaces и изменения текста/semantic invariants; не только наличие строки. Отдельно тестировать order sweeps и no-op уже хорошего текста. **Приёмка:** Обе mock-подмены из probes должны FAIL; невалидный exit никогда PASS; успешный artifact с двумя поверхностями и двумя корректными строками проходит; репозиторий до/после одинаков.



- **FIX-UX-08 · P2 · super-ux** — [Approval оператора может стереть происхождение предположения](#ux-08). Развести evidence_kind (brief/owner-belief/interview/telemetry/code-inference), decision_status и validation_status. Approval меняет decision, но не provenance. Для эмоций и Frequency×Severity×Solvability хранить источник, шкалу и unknown вместо обязательного выдуманного балла. **Приёмка:** Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.



- **FIX-UX-12 · P1 · super-ux** — [Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата](#ux-12). Разделить static conformance, executable verification и production observation. Для runtime зависимых критериев PASS только с тестом/браузером/проверенным runtime receipt, иначе BLOCKED/unverified. Сохранить хорошее разделение delivery vs Product outcome. **Приёмка:** Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.



- **FIX-DV-20 · P2 · sheleg-dev** — [Ошибка окружения классифицируется как доказанный пропуск валидатора](#dv-20). Явные стадии fixture_setup→mutation_verified→validator_ran→assertion; TEST_ERROR/BROKEN для setup/copy/timeout, GAP только при состоявшемся validator accept. Resource preflight и cleanup finally. **Приёмка:** Сымитировать ENOSPC/failed cp и timeout: TEST_ERROR, ноль 'guard bypass' findings; корректно созданный mutant accepted → GAP. Повтор полного negative suite после ресурсов.



- **FIX-AS-06 · P1 · agent-stack** — [Первый релиз фактически остаётся без исполняемого eval-корпуса](#as-06). Разрешить curated/synthetic/manual seed corpus до релиза, маркировать источник каждого input; дополнять production regressions. Release gate обязан иметь executed trials, а observable-only — состояние specification-ready, не release-ready. **Приёмка:** Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.



- **FIX-AS-07 · P1 · agent-stack** — [Запрет проверки порядка пропускает подтверждение после действия](#as-07). Запрещать только избыточный exact global sequence. Разрешить temporal assertions и partial order: authorization precedes effect, read fresh precedes write, transaction completes before publish. **Приёмка:** Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.



- **FIX-AS-08 · P2 · agent-stack** — [Статистические правила выдают предположения за универсальные границы](#as-08). Для proportion использовать Wilson/exact и явно описать iid/cluster assumptions; pass@k/pass^k считать по task-level trials. Для clustered/paired результатов применять соответствующий bootstrap/McNemar; unpaired сравнение допускается с его SE. Вместо never/worst case дать условные утверждения. **Приёмка:** Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.



- **FIX-AS-09 · P1 · agent-stack** — [OpenTelemetry: закрытый enum и неверное сложение вложенных token counters](#as-09). Переписать enum как extensible well-known set; token totals и disjoint billing buckets разделить. Для цены вычитать cached portions из total и применять provider-specific rates; не суммировать modalities/reasoning с totals повторно. Прикрепить commit SHA/schema revision и actual observation date. **Приёмка:** Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.



- **FIX-AS-10 · P2 · agent-stack** — [Повтор проверки старого ответа назван проверкой изменения решения модели](#as-10). Три разных операции: regrade old output, execute candidate against frozen fixture, deterministic workflow replay. Хранить candidate version/output и оценку отдельно от старого trace; стоимость model call и stochasticity отражать. **Приёмка:** Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.



- **FIX-AS-14 · P2 · agent-stack** — [Отсутствие evals ошибочно делает весь аудит unfalsifiable](#as-14). Разделить source-level invariant proof, deterministic reproduction и behavioral estimate. No evals — finding о неизвестной надежности, приоритет определяется конкретным вредом; prompt-first оставить диагностической эвристикой с исключениями. **Приёмка:** Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.



### M3. Заменить принуждение по словам на маршрут по намерению и эффектам

**Вход:** M2. **Выход:** Раздельные intent/subject/facets/effects; route receipt; scoped waivers; capability adapter; minimal/standard/high-assurance profiles.

**Контроль завершения:** RU/EN смешанные запросы, цитаты и отказы выбирают ожидаемый scope. Audit не меняет source; согласованная работа не спрашивает повторного разрешения; отсутствие optional tool не создаёт тупик.

**Управление регрессией:** Shadow comparison старого и нового маршрута, затем переключение по host/project. Никакой скрытой автозаписи в shadow mode.



- **FIX-RT-01 · P1 · sshlg-skills** — [Лексический роутер теряет намерение и смешивает аудит с изменением](#rt-01). Классифицировать по отдельным полям intent, subject, effects и facets; regex оставить источником кандидатов. Audit → make-skill/project-audit без исполнения delivery. Отрицания и поясняющая часть не должны выключать самостоятельную часть запроса на действие. **Приёмка:** Набор RU/EN: audit-only, объясни+исправь, обычная работа subagent, опечатки и склонения; проверки ожидаемого набора маршрутов и запрещённых побочных действий.



- **FIX-RT-02 · P1 · sshlg-skills** — [Отказ от одного маршрута выключает всю эскалацию; цитата тоже считается отказом](#rt-02). Хранить waivers по route_id, scope и источнику: явный акт пользователя, не цитата/пример/ответ инструмента. Общесессионный отказ от всех подсказок оставить отдельным осознанным флагом. Изменение нынешней общей политики записать как решение, а не скрытую починку. **Приёмка:** Отказ от design сохраняет billing и UX; обсуждение фразы отказа не меняет state; явно выбранный session waiver переживает следующий ход и может быть отозван.



- **FIX-RT-03 · P2 · sshlg-skills** — [Toolkit объявляет доступность машины по инвентарю только Claude Code](#rt-03). Host adapters: discovered / enabled / exposed / callable отдельно, namespace+provenance+content digest вместо голого id. В отчёте показывать host и недоступные capability; сохранить просмотр других хостов как inventory. **Приёмка:** Синтетические host homes: broken symlink, одноимённый чужой скилл, plugin только в Claude и skill только в Codex; roster active host содержит только реально разрешимые записи.



- **FIX-RT-04 · P2 · sshlg-skills** — [Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута](#rt-04). Использовать receipt выбранного маршрута с task_id, skill_digest и допустимыми эффектами. Проверять нужный маршрут, а не существование чужого run.md. Не превращать это в новое подтверждение каждого обратимого действия. **Приёмка:** Read-only audit с receipt не запрашивает pipeline; старый run не разрешает новую несвязанную публикацию; все bypass/degraded поверхности явно перечислены.



- **FIX-MS-03 · P1 · make-skill** — [Аудит по описанию автоматически превращается в исправление и release](#ms-03). Явные режимы audit / retrofit / release. По «audit» только доказательства и план. Переход к записи/публикации определяется намерением и ранее данной авторизацией, а не выбранным скиллом. **Приёмка:** Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.



- **FIX-TP-01 · P1 · task-pipeline** — [Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе](#tp-01). Intake должен строить brief из запроса и источников, спрашивать только недостающие необратимые/продуктовые решения. Сохранять выбранную пользователем модель; менять уровень по измерению задач, а не универсальному постулату. **Приёмка:** Полный brief → 0 лишних вопросов, задача с реальным неоднозначным контрактом → один содержательный вопрос; отдельно измерить quality/time/tokens с baseline.



- **FIX-TP-02 · P1 · task-pipeline** — [Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»](#tp-02). Гейт проверяет обязательные артефакты/поведение и их качество. Preferred provider из семейства, альтернативный provider с тем же контрактом или inline fallback допустимы. При отсутствии инструмента писать, какая именно проверка не сделана. **Приёмка:** Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.



- **FIX-TP-03 · P2 · task-pipeline** — [Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами](#tp-03). Разделить kernel (effect scope, evidence, dependencies, resume) и default profile (0–10). Сначала компилировать выбранный profile, затем исполнять только его gates. Доктрины называются capability, а не фиксированным номером стадии. **Приёмка:** Трёхстадийный custom profile валиден и не получает дополнительные stage0/7/10; обязательные kernel invariants всё равно проверяются.



- **FIX-TP-04 · P1 · task-pipeline** — [Неиспользованное правило автоматически считается ненужным](#tp-04). Классы rules: permanent safety/contract, situational, temporary. TTL только временным; cold означает review-needed, не автоматическое отключение. У situational хранить exposure opportunities, не только число запусков. **Приёмка:** Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.



- **FIX-UB-01 · P2 · sshlg-skills** — [Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса](#ub-01). Переименовать в raw_catalog_cl100k; отдельно measured_prompt_cost из runtime trace, host version и реально exposed listing. Missing runtime sample → unknown; не оценивать качество по размеру каталога. **Приёмка:** Сравнить generated listing и фактически переданный prompt на выбранном host; статический подсчёт и runtime measurement никогда не используют одинаковое поле/подпись.



- **FIX-UX-11 · P1 · super-ux** — [Figma fallback и provisional flow не доходят до разрешённого build state](#ux-11). Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях. **Приёмка:** Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.



- **FIX-UX-13 · P2 · super-ux** — [Общий precondition требует scenarios даже независимому copy/benchmark scope](#ux-13). Предусловия вычислять после scope: scenario → base, copy → brand, benchmark → observed URLs+receipts. Схема evidence допускает URL+timestamp+capture для внешних данных; file:line только для code claims. **Приёмка:** Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.



### M4. Устранить предметные противоречия и устаревшие правила

**Вход:** M3. **Выход:** Исправленные правила дизайна/SEO/UX/телеметрии/OAuth/Telegram; source register с датой и областью применимости; единый источник дублируемых рецептов.

**Контроль завершения:** Каждое finding из этой фазы закрыто конкретной приёмкой. Универсальные запреты заменены условиями, где источник подтверждает только условное правило.

**Управление регрессией:** Сохранять rationale и предыдущий рецепт; спорная эвристика становится advisory, а не новым обязательным gate.



- **FIX-SE-01 · P1 · seo-aeo-audit** — [Рекомендации Discover превращены в обязательный gate](#se-01). Три отдельные проверки: eligibility, large preview permission (с альтернативой AMP), image selection recommendation. SDK reverse engineering оставить FIELD, без бинарного вывода о допуске. **Приёмка:** Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.



- **FIX-SE-02 · P1 · seo-aeo-audit** — [Любая manual action объявлена обнулением всех улучшений сайта](#se-02). Записывать action type, affected URL patterns, surface, severity и scope. Приоритет устранения нарушения сохранять, блокировать зависимые действия только в затронутой области. **Приёмка:** Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.



- **FIX-SE-03 · P2 · seo-aeo-audit** — [Cross-track проверка объявляет совместимые наблюдения противоречием](#se-03). Сравнивать claim key=(subject,predicate,scope,time,instrument). Противоречие возникает только для несовместимых значений одного predicate; независимые аспекты сохранять. **Приёмка:** Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.



- **FIX-SE-04 · P2 · seo-aeo-audit** — [Тип источника автоматически подменяет силу конкретного утверждения](#se-04). Разнести source quality, directness, population scope, causal support и uncertainty. Политика rollout определяется риском действия и доказательством эффекта; не blanket рангом поставщика. **Приёмка:** Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.



- **FIX-UX-04 · P2 · super-ux** — [У одного скилла два несовместимых правила владения strings.md](#ux-04). Разделить ownership по файлам: brand-voice владеет voice/terms/facts/channels/locale policy, copywriting пишет strings.md (proposed) и продуктовый текст. Общая схема явно разрешает эти mutations и claim при координации. **Приёмка:** Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.



- **FIX-UX-09 · P2 · super-ux** — [Воронки конкурентов из proxy превращаются в «proven base»](#ux-09). Все market signals маркировать как observed exposure; вывод о механизме как hypothesis с альтернативными объяснениями. Частоты считать скриптом по corpus с denominator/дубликатами; adoption через локальный эксперимент, не «proven» из частоты. **Приёмка:** Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.



- **FIX-UX-10 · P1 · super-ux** — [Loading из существующей задержки превращён в инсценировку вычисления](#ux-10). Loading только при реальной асинхронной работе; показывать фактическую операцию и не задерживать готовый результат. Если narrative pause нужен продукту, назвать его честно без claims персонального анализа и измерить затраты/понимание. **Приёмка:** Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.



- **FIX-DS-02 · P2 · sheleg-design** — [Опрос о значении craft превращён в нормативный порядок разработки](#ds-02). Оставить опрос как контекст с точным смыслом и ссылкой; порядок gates вывести из dependency graph: задача/состояния/доступность/система/polish. Обязательный порядок обозначить как авторское решение, не вывод исследования. Источник: https://www.figma.com/blog/state-of-the-designer-2026/ . **Приёмка:** Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.



- **FIX-DS-03 · P2 · sheleg-design** — [Производительность CSS/API описана абсолютами вместо проверяемых условий](#ds-03). Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide . **Приёмка:** Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.



- **FIX-DS-04 · P2 · sheleg-design** — [Duration table допускает 500ms, общий UI gate запрещает >300ms](#ds-04). Единая таблица по purpose+frequency+platform с explicit exceptions и canonical duration IDs. Разделить interactive feedback, spatial modal transition и marketing entrance, убрать пересечение трактовок. **Приёмка:** 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.



- **FIX-DS-05 · P2 · sheleg-design** — [No-JS критерий применяется ко всем поверхностям, включая внутренние UI](#ds-05). Applicability predicates на каждую проверку: public-web-crawlable → no-JS content, web-internal → loading/error/accessibility, native → platform semantics. В отчёте NOT_APPLICABLE с причиной, а не PASS без запуска. **Приёмка:** Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.



- **FIX-UX-14 · P2 · super-ux** — [BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](#ux-14). Развести local sandbox, staging и production. Локальный webhook forwarding или официальный emulator допустим для wiring/tests; публичный HTTPS endpoint обязателен для production delivery. Provider capability определяет dependency, а не универсальная UX практика. **Приёмка:** Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.



- **FIX-UX-15 · P1 · super-ux** — [BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](#ux-15). Ввести processing-purpose→legal-basis→notice→rights/retention record. Consent gate только когда выбранная basis и применимые нормы требуют именно согласия; не смешивать маркетинговое tracking consent, contractual processing и informational notice. Удалить универсальное обоснование consent через Art.13. **Приёмка:** Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



- **FIX-DV-06 · P2 · sheleg-dev** — [Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера](#dv-06). Ввести Money(currency, minor/decimal), Asset(network, amount), Entitlement(units), FX quote с источником/временем. Выбор refund excess/credit excess/buffer fee оформлять явной политикой проекта. **Приёмка:** Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.



- **FIX-DV-08 · P1 · sheleg-dev** — [ADC precedence написан в обратном порядке](#dv-08). Исправить оба места из одной canonical таблицы; сначала показывать фактически resolved principal/source без секрета, затем настраивать. **Приёмка:** В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.



- **FIX-DV-13 · P2 · sheleg-dev** — [Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты](#dv-13). Развести product policy, geography/legal decision и технику. Scope+source+checked_at у требований; Basic general vs Advanced advertiser-specific model; процент только как dated measured study, не обещание. Режим выбирается политикой проекта. **Приёмка:** Near-miss advertiser-only GA4/Ads без publisher inventory не требует certified CMP автоматически; Basic проходит; неизвестная юрисдикция не автоматически granted.



- **FIX-DV-16 · P2 · sheleg-dev, telegram-dev** — [Правила восстановления дают противоположные действия для отозванной сессии](#dv-16). Единый typed health contract: liveness процесса, readiness способности служить, degraded_auth с остановкой работ + alert, recovery только после новой auth. Exit/restart допустимы для recoverable failure и контролируемой политики supervisor. **Приёмка:** Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.



- **FIX-DV-17 · P2 · sheleg-dev** — [FCP ошибочно объявлен неизмеримым в поле](#dv-17). Разделить две независимые оси: CWV/not-CWV и lab/field availability. Обязательные p75, device/cohort, period, sample size; TBT как диагностическая корреляция, не замена доказательства INP. **Приёмка:** Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.



- **FIX-DV-18 · P2 · sheleg-dev** — [Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев](#dv-18). Перед изменением проверить performance trace и сценарии, browser support contract, accessibility owner. CSP origins одобрять по функциональной необходимости; semantic headings по структуре; lazy-load по измеренному waterfall. **Приёмка:** Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.



- **FIX-TG-02 · P2 · telegram-dev** — [Оmitted allowed_updates ошибочно приравнен к пустому списку](#tg-02). Таблица unset/[]/explicit и getWebhookInfo evidence; хранить desired subscription отдельно. Update id использовать как identity, не глобальную гарантию монотонности навсегда. **Приёмка:** Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.



- **FIX-TG-04 · P2 · telegram-dev** — [Матрица launch surfaces неверно запрещает menu-button query flow](#tg-04). Разделить keyboard, inline keyboard, menu, inline mode, direct/main/attachment surfaces; capability/API floor у каждого метода с первичным source. **Приёмка:** Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.



- **FIX-TG-05 · P2 · telegram-dev** — [Лимит одного FloodWait не ограничивает бесконечную retry sequence](#tg-05). Добавить wall-clock deadline, cumulative wait и attempt budget, cancellation и checkpoint queue; max wait трактовать как backpressure, длительные waits как policy choice. Runnable login/session example с явными imports. **Приёмка:** Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.



- **FIX-AS-05 · P2 · agent-stack** — [Аудируемость ошибочно приравнена к статическому графу](#as-05). Статический граф оставить предпочтением для предсказуемости. Аудируемость определять через полноту execution record, версии policy и детерминированные границы; динамике поставить budget/depth/node caps и provenance. **Приёмка:** Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.



- **FIX-AS-12 · P2 · agent-stack** — [MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor](#as-12). У каждого executable example назвать distribution, imports, tested version и lifecycle. Дать отдельные v2/current и v1 migration paths, health route с проверенным порядком registration. Проверять localhost protocol call, а не только наличие строки в markdown. **Приёмка:** В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.



- **FIX-AS-13 · P2 · agent-stack** — [Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks](#as-13). Главный dispatch criterion: capability/tool execution против автономного peer outcome. Длительность — второй вопрос о Tasks capability/transport, не выбор протокола. Проверять фактически поддержанные extensions клиента/SDK. **Приёмка:** Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.



### M5. Мигрировать 28 скиллов на совместимые контракты и host adapters

**Вход:** M4. **Выход:** 28 sidecars skill.contract.json; project policy; capability receipts; clean-install матрица заявленных сред; адаптеры токенов и sibling dependencies.

**Контроль завершения:** Каждый skill объявляет modes, required inputs, outputs, effects, fallbacks, proof. Контракты согласованы на стыках. Установка/удаление/upgrade/rollback не оставляют конфликтующих активных копий.

**Управление регрессией:** Версионирование schema; старые пакеты читаются адаптером в legacy mode с явными ограничениями; migration обратима.



- **FIX-MS-04 · P2 · make-skill** — [Платформенные ограничения описаны как универсальные и частично устарели](#ms-04). Матрица adapter capabilities по версии хоста; native fallback по обнаруженным инструментам. В таблице каждой нормы owner=spec/host/house, required vs recommended и дата последней проверки. **Приёмка:** Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.



- **FIX-ED-01 · P2 · make-skill, task-pipeline** — [Переносимость зависит от совместной упаковки соседнего task-pipeline](#ed-01). Либо объявлять bundle dependency и тестировать package closure, либо собирать автономный skill artifact с канонической документацией внутри references. Одна source-home, generated copies с digest; не править дубликаты вручную. **Приёмка:** Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.



- **FIX-UX-06 · P2 · super-ux** — [Новый проект Codex получает правило в CLAUDE.md](#ux-06). Сначала определить host capabilities; default instruction target по текущему host, explicit project target приоритетнее. Проверка должна сверять materialized rule с активным target, не только с существованием любого файла. **Приёмка:** Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.



- **FIX-UX-07 · P2 · super-ux** — [Язык vision и обязательный формат заголовков не согласованы на входе](#ux-07). Явно прочитать контракт до записи; использовать устойчивые section IDs с локализуемыми title либо сказать, что машинные headings остаются английскими, а содержание переводится. **Приёмка:** Русский fixture всех 9 секций проходит по canonical IDs; действительно отсутствующая anti-vision fail; изменение языка title не меняет identity.



- **FIX-DS-01 · P1 · sheleg-design** — [Сравнение packs сменой CSS не имеет общего token API](#ds-01). Ввести небольшой semantic role API и per-pack adapter, не переименовывая identity tokens. Harness заменяет весь scope atomically, обнаруживает unresolved var и не наследует старый pack. Проверять совместимость компонентных slots; сравнивать layout отдельно когда pack требует другой композиции. **Приёмка:** Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.



- **FIX-SY-06 · P2 · agent-sync** — [Одно gated смешивает lease guarantee, видимость и наличие host enforcement](#sy-06). Заменить на независимые lease_scope, enforcement_mode, awareness_scope, identity_strength и backend_health. В generated docs брать значения из runtime evidence; временно явно расшифровать legacy gated и убрать противоречащие references. **Приёмка:** Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.



- **FIX-SY-07 · P2 · agent-sync** — [Guard охватывает редактор и некоторые git commit, но не все записи через shell](#sy-07). Чётко объявить advisory protection boundary. Если нужна enforceable гарантия — file writes через trusted mutation API/isolated worktree/OS controls с resource locks; не пытаться считать regex shell parser универсальным sandbox. Host adapters имеют capability matrix. **Приёмка:** Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.



- **FIX-SY-08 · P2 · agent-sync** — [Поиск task-pipeline не учитывает native Codex plugin cache](#sy-08). Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding. **Приёмка:** Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.



### M6. Проверить настоящее применение и пользу семейства

**Вход:** M5. **Выход:** Actual-load end-to-end matrix: baseline, named skill, auto-route, full composition; с инструментами и без optional tools; repeated seeds и независимые grading criteria.

**Контроль завершения:** Все P1-negative fixtures детерминированно проходят. Реальный host подтверждает загрузку выбранной версии. Качество результата, ложные блокировки, лишние вопросы, latency и стоимость измерены. Порог принимается заранее; недоступный native eval честно NOT_RUN.

**Управление регрессией:** Новый route/profile не становится default до достижения заранее записанных порогов; неопределённый результат ведёт к дополнительной выборке, не к выдуманному PASS.



- **FIX-EV-01 · P1 · make-skill, seo-aeo-audit, task-pipeline** — [Проверка выбора названия не доказывает пользу выполнения скилла](#ev-01). Три испытательных слоя: deterministic tools, routing actual-load traces, end-to-end outcome with/without. Одинаковые задачи, изолированные workspaces, зафиксированные host/model/digests, независимые outcome graders и cost/latency. Разрешить синтетические safety/effect contract тесты до production. **Приёмка:** Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



- **FIX-DS-06 · P2 · sheleg-design** — [Eval-регрессия не покрывает текущий composition/runtime](#ds-06). Сохранить историю, добавить current-version manifest, реальные packaged installs, несколько seeds/repeats на поддержанных host/model, multi-skill route sequence и resource budget. Runtime fixtures вместо только планов; transcript/content hash сохранять за пределами /tmp. **Приёмка:** Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.



- **FIX-DV-19 · P2 · sheleg-dev** — [Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](#dv-19). Сохранить routing eval, добавить generated-artifact eval с offline provider stubs, реальной БД, fault injection, hard security invariants; фиксировать exact model, commit, prompt/tool trace, grader version и raw results. **Приёмка:** Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



### M7. Выпустить и проверить ограниченное развёртывание

**Вход:** M6. **Выход:** Release candidates с pinned digests, опубликованные member versions, затем umbrella; smoke на чистых профилях, release receipts и проверяемый rollback.

**Контроль завершения:** Каждый опубликованный архив соответствует проверенному digest; registry/source/runtime version не расходятся; canary реальные задачи без новых P1-регрессий; rollback проверен.

**Управление регрессией:** Откат umbrella lock и конкретных member packages на предыдущий проверенный набор; не переписывать опубликованный артефакт.



### M8. Закрыть программу и закрепить обслуживание

**Вход:** M7. **Выход:** Матрица 28/28 contracts, 90/90 dispositions, закрытые P1, остаточные ограничения, регламент обновления внешних норм, эталонный eval set.

**Контроль завершения:** Все условия раздела «100%» выполнены и имеют receipts. Исключение разрешено только с ограничением обещания/поддержки, а не путём переименования ошибки. Нет открытого P1 внутри заявленной области.

**Управление регрессией:** При новом критическом контрпримере открыть конкретный finding/release incident и ограничить затронутый рецепт. Автоматическое наблюдение требует отдельной настройки пользователем.



### Что считать прогрессом

Считать отдельно: findings с доказанным исправлением / 90; контракты, прошедшие host matrix / 28; пройденные критические сценарии / согласованный набор; реально проверенные релизы / выпускаемый набор. Эти четыре знаменателя нельзя свести к проценту качества модели. Изменённый текст без контрпроверки не закрывает задачу. Неисполненный тест — NOT_RUN, сбой окружения — TEST_ERROR.

Только типовые экземпляры этой программы имеют конечный критерий 100%. Обещание безошибочности всех будущих ответов модели в него не входит.


## Ограничения и незакрытые вопросы

1. Не измерена частота реального вреда на пользовательских проектах. Описанные последствия относятся к опубликованным алгоритмам и контролируемым примерам.
2. Нет behavioural baseline «без скилла / со скиллом / auto-route / вся композиция» на текущих версиях и hosts. Historical eval не подменяет этот эксперимент.
3. Не проверены все внешние факты каждой practice/reference; самые рискованные и спорные сверены с первичными источниками. Для полного claim-level покрытия нужен реестр источников M4.
4. Не выполнен визуальный и accessibility runtime на всех 39 style packs; проверены структура, токены и часть инструкций.
5. Не доказана реальная активная версия по каждому агентному host лишь по cache inventory; это требует runtime receipt M5/M6.
6. Предлагаемые sidecars и policy — новый дизайн, ещё не поддерживаемая конфигурация. Прототип проверяет ограниченную непротиворечивость, а не гарантирует жизнеспособность под любой нагрузкой.
7. Исходники и настройки агентов не исправлялись. Для реализации составлен конкретный граф; доступ к gated eval и целевой host support list остаются входами программы.

## Воспроизводимость и приложения

Исходные тематические отчёты сохраняют дополнительные команды, подробности чтения и первичные ссылки: [ux-design.md](ux-design.md), [coverage-supplement.md](coverage-supplement.md), [integrations.md](integrations.md), [agents-sync.md](agents-sync.md).

Контрпримеры и модель: [auditor_reproductions.py](auditor_reproductions.py), [auditor-reproductions.json](auditor-reproductions.json), [routing-reproductions.json](routing-reproductions.json), [ux-design-probes.py](ux-design-probes.py), [ux-design-probes.txt](ux-design-probes.txt), [agents-sync-reproduce.py](agents-sync-reproduce.py), [agents-sync-reproduce.log](agents-sync-reproduce.log), [architecture-prototype.py](architecture-prototype.py), [architecture-scenarios.json](architecture-scenarios.json). Запускать эксперименты следует в scratch с исходными версиями; отчёт фиксирует именно эти результаты.

Метаданные и проверка полноты: [inventory.json](inventory.json), [file-manifest.json](file-manifest.json), [evidence-snapshots.json](evidence-snapshots.json), [findings.json](findings.json), [roadmap.json](roadmap.json), [report-validation.json](report-validation.json), [source-status-final.json](source-status-final.json). evidence-snapshots.json сохраняет небольшие фрагменты вокруг локаторов и digests файлов на момент аудита; фрагмент не заменяет весь аргумент карточки. Clean exports после проверки удалены; deep_checks.py воссоздаёт их из Git. Сами digests и логи сохранены.

## Применённые навыки и маршрут

Использованы make-skill для конструкции, структуры и переносимости навыков; evidence-docs для локаторов, воспроизведений и границ выводов. make-skill применён в режиме аудита: автоматическое исправление/публикация из retrofit не соответствуют этому запросу. task-pipeline не применялся как workflow изменения исходников; тесты пакета запускались. project-audit не выбран: предметом является конструкция семейства, а не диагностика отдельного продукта. Предметные скиллы читались как объекты проверки, а не принимались за авторитет для проверки самих себя.

Точные прочитанные входы: [machine-snapshot://.codex/plugins/cache/make-skill/make-skill/0.27.1/skills/make-skill/SKILL.md](machine-snapshot://.codex/plugins/cache/make-skill/make-skill/0.27.1/skills/make-skill/SKILL.md); [machine-snapshot://.agents/skills/evidence-docs/SKILL.md](machine-snapshot://.agents/skills/evidence-docs/SKILL.md). Подзадачи аудита распределены по предметным областям по инструкции bundled skill-auditor; выводы сведены в один реестр. Все замечания сохранены как предложения, без записи в проектные boards.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — аудит конструкции и переносимости скиллов
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — проверяемые доказательства и границы выводов

<sub>A star on [the bundle](https://github.com/ssheleg/sshlg-skills) helps.</sub>
