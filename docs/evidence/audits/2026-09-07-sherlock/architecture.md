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
