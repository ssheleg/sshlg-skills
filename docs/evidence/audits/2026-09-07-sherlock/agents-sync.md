# Аудит agent-stack и agent-sync — 5 скиллов, 2026-09-07

Проверены исходные тела всех пяти скиллов и ключевые алгоритмы. Главный вывод: сильные идеи про границы и доказательства соседствуют с неверными универсальными правилами, а в координации детерминированно воспроизведены нарушения арбитража. Это аудит с предложениями, исходники не исправлялись. Обнаруженные дефекты не означают, что уже произошли потери в production.

## Версии и граница доказательств

- agent-stack: `1f99f8f0914f122da1629e6ede6fd60a7e23d1ea`, validator сообщает v0.23.2.
- agent-sync: `ef45d404d1604a9a0d142f983b5cccc495133ca0`, SKILL metadata v1.19.3.
- Все результаты воспроизведения лежат в [agents-sync-reproduce.log](agents-sync-reproduce.log); воспроизводимый скрипт — [agents-sync-reproduce.py](agents-sync-reproduce.py). Он пишет только во временный каталог и не вызывает облако.
- GAP у prose-pattern означает дефект инструкции/алгоритма, не запуск реального кошелька или агента. Measured code defect означает наблюдение на настоящем методе с контролируемым окружением.
- Production deployments, личные memory stores, cloud Notion/Outline, реальные переводы, multi-machine remote и реальное автоматическое skill loading не проверялись.

## Что сделано хорошо

| Skill | Сильная часть | Доказательство |
|---|---|---|
| agent-orchestrator | Context-pressure ladder, сохранение typed restrictive state, durability и отделение factual memory от experiential | `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/context-engineering.md:86`; `memory-architecture.md:97` |
| agent-evals | State-change assertions рядом с prose, code checks до LLM judge, требование калибровки и score source | `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:79`; `SKILL.md:169`; `SKILL.md:299` |
| agent-harness | Разделяет prompt/tool interface от loop; scanner честно перечисляет blind spots, self-test проверяет и positives, и negatives | `repo://agent-stack/plugins/agent-stack/skills/agent-harness/scripts/audit_agent.py:257`; [self-test log](agent-harness-selftest.log) |
| agent-interop | Ревизии спецификаций закреплены; новые MCP 2026-07-28 и A2A1.0 действительно подтверждаются текущими primary sources; isError/untrusted/per-hop auth разобраны | `repo://agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md:26`; `references/mcp.md:141` |
| agent-sync | Отличает record plane от lease authority, не доверяет append как CAS; identity degradation и residue ownership описаны; негативные тесты исторических багов есть | `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1375`; `repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/lease-protocol.md:109` |

Протокольные ссылки проверены заново, поэтому современный MCP не объявлен ошибкой только потому, что модель могла помнить старый initialize. [MCP current](https://modelcontextprotocol.io/specification/2026-07-28), [deprecation register](https://modelcontextprotocol.io/specification/2026-07-28/deprecated), [A2A specification](https://a2a-protocol.org/latest/specification/).

## Реестр замечаний

| ID | Skill | Приоритет | Доказательство | Проблема |
|---|---|---|---|---|
| AS-01 | agent-orchestrator | P1 | documented_design_defect | Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ |
| AS-02 | agent-orchestrator | P1 | documented_algorithm_counterexample | Нулевой baseline путается с отсутствующим: первый реальный расход теряется |
| AS-03 | agent-orchestrator | P1 | measured_counterexample_to_published_pattern | Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию |
| AS-04 | agent-orchestrator, agent-harness | P1 | architectural_counterexample | Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload |
| AS-05 | agent-orchestrator, agent-harness | P2 | overgeneralization | Аудируемость ошибочно приравнена к статическому графу |
| AS-06 | agent-evals | P1 | primary_source_contradiction | Первый релиз фактически остаётся без исполняемого eval-корпуса |
| AS-07 | agent-evals | P1 | logical_counterexample | Запрет проверки порядка пропускает подтверждение после действия |
| AS-08 | agent-evals | P2 | measured_mathematical_counterexample | Статистические правила выдают предположения за универсальные границы |
| AS-09 | agent-evals | P1 | verified_protocol_semantic_error | OpenTelemetry: закрытый enum и неверное сложение вложенных token counters |
| AS-10 | agent-evals | P2 | logical_contract_error | Повтор проверки старого ответа назван проверкой изменения решения модели |
| AS-11 | agent-harness | P1 | security_overclaim | confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности |
| AS-12 | agent-interop | P2 | verified_sdk_version_drift | MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor |
| AS-13 | agent-interop | P2 | internal_routing_contradiction | Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks |
| AS-14 | agent-harness | P2 | evidence_overgeneralization | Отсутствие evals ошибочно делает весь аудит unfalsifiable |
| SY-01 | agent-sync | P1 | measured_code_defect | Выданные IDs меняются задним числом; два reserve возвращают один номер |
| SY-02 | agent-sync | P1 | measured_code_defect | Общий last-renew позволяет активности одного агента подавлять продление чужих leases |
| SY-03 | agent-sync | P1 | measured_code_defect | Local renew перезаписывает уже завершённый steal |
| SY-04 | agent-sync | P1 | measured_contract_gap | Task lease не защищает общий файл от владельца другой task lease |
| SY-05 | agent-sync | P1 | measured_code_defect | Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают |
| SY-06 | agent-sync | P2 | measured_source_contract_conflict | Одно gated смешивает lease guarantee, видимость и наличие host enforcement |
| SY-07 | agent-sync | P2 | observed_enforcement_limit | Guard охватывает редактор и некоторые git commit, но не все записи через shell |
| SY-08 | agent-sync | P2 | observed_portability_defect | Поиск task-pipeline не учитывает native Codex plugin cache |

## agent-orchestrator

### AS-01 — Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ

**GAP · P1 · documented_design_defect.**

**Наблюдение.** Алгоритм фиксирует DB, затем повышает внешний лимит и при любом API failure восстанавливает DB. Внешний API не участвует в prepare/commit: это не 2PC. Transaction-scoped advisory lock отпускается до внешнего вызова, поэтому не сериализует всю составную операцию.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:69`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:83`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:101`

**Воспроизведение / контрсценарий.** Контрсценарий: провайдер применил +35, ответ потерян; клиент видит timeout и возвращает деньги в DB. Доступны и восстановленный резерв, и внешние +35. Это разбор опубликованного алгоритма; денежные операции не запускались.

**Влияние.** Двойное кредитование, потерянные intents при crash между commit и API, переписывание последующих изменений компенсацией старых значений.

**Исправление.** Назвать saga/outbox; хранить operation_id и состояния pending/applied/unknown/compensated. При ambiguous timeout сначала сверять статус по идемпотентному ключу; компенсировать только подтверждённый отказ и только собственную проводку. Ввести сериализацию или CAS на весь tenant transfer state, а не обещать её транзакционным lock до HTTP.

**Критерий приёмки.** Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.

**Проверенные primary sources:** [aws.amazon.com](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).
### AS-02 — Нулевой baseline путается с отсутствующим: первый реальный расход теряется

**GAP · P1 · documented_algorithm_counterexample.**

**Наблюдение.** lastRecordedUsage == 0 объявлен достаточным признаком отсутствия наблюдения; любой спад usage объявлен пересозданием ключа.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:146`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md:151`

**Воспроизведение / контрсценарий.** Новый ключ уже наблюдался с usage=0. Между первым и вторым poll потрачено 5; правило seed baseline, record nothing пропускает эти 5. Спад счётчика без смены key_id также не доказывает пересоздание.

**Влияние.** Занижение затрат и бюджеты, которые не учитывают первую порцию расхода; незамеченные коррекции/сбои provider counter.

**Исправление.** Хранить baseline_initialized, observed_at и provider_key_generation отдельно от суммы; ноль — валидное значение. На уменьшение без смены поколения переводить reconciliation в anomaly, не объяснять причину догадкой.

**Критерий приёмки.** Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.
### AS-03 — Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию

**GAP · P1 · measured_counterexample_to_published_pattern.**

**Наблюдение.** Dedup выбирает SequenceMatcher>=0.75, повышает confidence, сохраняет более длинный текст и реактивирует запись. Конфликт ищется только по нескольким английским словам/negation flip, без entity/attribute/scope/validity. Verified notes вообще exempt from decay.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:365`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:398`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:413`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md:427`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-lifecycle.md:148`

**Воспроизведение / контрсценарий.** agents-sync-reproduce.py: Always allow external sharing of customer data и Never allow external sharing of customer data дают similarity=0.8791; более длинным остаётся Always. Дополнительный кодовый контрпример: Use Python и Never use production credentials имеют общий use/negation flip и могут ошибочно supersede друг друга.

**Влияние.** Коррекция пользователя превращается в подкрепление старой ошибки; unrelated memories деактивируются; confidence показывает частоту совпадений, а не доказанную истинность.

**Исправление.** Similarity использовать только для поиска кандидатов. Записи хранить с entity/attribute/scope/provenance/validity; contradiction gate до merge. Подтверждение отделить от повторного извлечения, не повышать доверие за self-generated повтор; temporal supersession и reversible history. Verified не освобождает volatile fact от freshness.

**Критерий приёмки.** Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.
### AS-04 — Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload

**GAP · P1 · architectural_counterexample.**

**Наблюдение.** Правило No payload, no edge и шаг No→delete не различают dataflow, control flow, approval и зависимости по разделяемому состоянию.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md:285`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:127`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:367`

**Воспроизведение / контрсценарий.** Backup→migration, acquire→write, disable writers→schema change могут не передавать документ/объект непосредственно, но порядок обязателен. Объявить результат проверки или lease token явным payload можно, однако этот контракт в тесте отсутствует.

**Влияние.** Оптимизация графа может убрать safety barrier либо распараллелить операции над одним ресурсом.

**Исправление.** Типизировать ребро: data/control/authorization/resource. Для любого ребра требовать rationale и доказательство, но удалять только если нет ни причинного, ни ресурсного, ни разрешительного ограничения. Side-effect footprint и read/write sets проверять перед fan-out.

**Критерий приёмки.** Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.
### AS-05 — Аудируемость ошибочно приравнена к статическому графу

**GAP · P2 · overgeneralization.**

**Наблюдение.** Динамический граф объявлен unfalsifiable from outside, а статический обязательным для аудита. Это смешивает заранее нарисованный план и сохранённый фактический execution graph.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:101`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md:263`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md:298`

**Воспроизведение / контрсценарий.** Динамический dispatcher может сохранять node_created, edge_added, policy/model versions, arguments, outcomes и immutable trace. Статический граф без этих записей, напротив, не доказывает, что было выполнено.

**Влияние.** Ненужные фиксированные цепочки, brittle planning и запрет подходящих adaptive workflows без выигранной гарантии.

**Исправление.** Статический граф оставить предпочтением для предсказуемости. Аудируемость определять через полноту execution record, версии policy и детерминированные границы; динамике поставить budget/depth/node caps и provenance.

**Критерий приёмки.** Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.

## agent-evals

### AS-06 — Первый релиз фактически остаётся без исполняемого eval-корпуса

**GAP · P1 · primary_source_contradiction.**

**Наблюдение.** Corpus должен появляться from production, never up front; первый offline gate — observables only. Критерий без input/trial не исполняется и не доказывает capability. Та же глава затем допускает simulated users, оставляя противоречивый маршрут.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:245`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:256`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:261`

**Воспроизведение / контрсценарий.** Новый агент возвратов без production: невозможно исполнить предрелизную проверку correct amount/consent/retry, если конструирование входов заранее запрещено. Anthropic рекомендует requirements→test cases и ручные development checks ещё до production.

**Влияние.** Cold-start release без измеренных сценариев, первая авария становится способом получения тестового набора.

**Исправление.** Разрешить curated/synthetic/manual seed corpus до релиза, маркировать источник каждого input; дополнять production regressions. Release gate обязан иметь executed trials, а observable-only — состояние specification-ready, не release-ready.

**Критерий приёмки.** Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.

**Проверенные primary sources:** [www.anthropic.com](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).
### AS-07 — Запрет проверки порядка пропускает подтверждение после действия

**GAP · P1 · logical_counterexample.**

**Наблюдение.** Для полного trace разрешены set/subset/forbidden lists, never as an order. Рекомендация избегать хрупкого exact sequence превращена в запрет семантически обязательного happens-before.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:79`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:167`

**Воспроизведение / контрсценарий.** Трейсы [confirm,charge] и [charge,confirm] имеют одинаковые множества вызовов, final response и конечный баланс; второй нарушает условие согласия до списания, но указанные matchers их не различат.

**Влияние.** False PASS на важных нарушениях, произошедших по пути к правильному конечному состоянию.

**Исправление.** Запрещать только избыточный exact global sequence. Разрешить temporal assertions и partial order: authorization precedes effect, read fresh precedes write, transaction completes before publish.

**Критерий приёмки.** Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.
### AS-08 — Статистические правила выдают предположения за универсальные границы

**GAP · P2 · measured_mathematical_counterexample.**

**Наблюдение.** Wald interval дан без ограничений по n/p; зависимость всегда должна расширять band; p^k объявлено worst case; независимые средние запрещено сравнивать вообще. Всё это требует дополнительных предположений.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:31`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:52`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:106`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:118`

**Воспроизведение / контрсценарий.** Скрипт показывает n=3,p=1→band=0. Для четырёх trial с ровно одним случайно расположенным failure marginal p=.75, но all-pass=0, меньше p^4=.3164. Следовательно independence не универсальный worst case. Отрицательная зависимость может уменьшить variance.

**Влияние.** Ложная уверенность на маленьком наборе, неверные thresholds и отбрасывание корректного unpaired экспериментального дизайна.

**Исправление.** Для proportion использовать Wilson/exact и явно описать iid/cluster assumptions; pass@k/pass^k считать по task-level trials. Для clustered/paired результатов применять соответствующий bootstrap/McNemar; unpaired сравнение допускается с его SE. Вместо never/worst case дать условные утверждения.

**Критерий приёмки.** Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.
### AS-09 — OpenTelemetry: закрытый enum и неверное сложение вложенных token counters

**GAP · P1 · verified_protocol_semantic_error.**

**Наблюдение.** gen_ai.operation.name назван closed 17-value enum; current primary разрешает custom value при отсутствии подходящего well-known. Текст утверждает, что input_tokens+output_tokens misses reasoning and cache writes, хотя это подмножества total counters по семантике.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:51`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:130`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:135`

**Воспроизведение / контрсценарий.** Сверка 2026-09-07 с OTel raw docs: cache_read и cache_write SHOULD be included in input_tokens, reasoning.output_tokens SHOULD be included in output_tokens. Adding them again doubles portions. Расчёт цены действительно требует разных rates, но не добавления подмножеств сверх total.

**Влияние.** Ложные conformance violations для extensions; завышенные счета/затраты при буквальном исправлении указанного misses.

**Исправление.** Переписать enum как extensible well-known set; token totals и disjoint billing buckets разделить. Для цены вычитать cached portions из total и применять provider-specific rates; не суммировать modalities/reasoning с totals повторно. Прикрепить commit SHA/schema revision и actual observation date.

**Критерий приёмки.** Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.

**Проверенные primary sources:** [raw.githubusercontent.com](https://raw.githubusercontent.com/open-telemetry/semantic-conventions-genai/main/docs/gen-ai/gen-ai-spans.md).
### AS-10 — Повтор проверки старого ответа назван проверкой изменения решения модели

**GAP · P2 · logical_contract_error.**

**Наблюдение.** Fixture replay описан как бесплатная assertion над stored run и должен отвечать did the decision change. Но старое output не меняется при смене нового prompt/model/tool schema. Детерминированна проверка, а не новый agent trial.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md:174`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:62`
- `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md:70`

**Воспроизведение / контрсценарий.** В stored run правильный tool A. Новый prompt теперь выбирает B. Повтор assertion на старом run продолжает PASS; нужно действительно выполнить candidate на frozen input.

**Влияние.** Регрессионный gate может быть зелёным, вообще не запускав изменённую систему.

**Исправление.** Три разных операции: regrade old output, execute candidate against frozen fixture, deterministic workflow replay. Хранить candidate version/output и оценку отдельно от старого trace; стоимость model call и stochasticity отражать.

**Критерий приёмки.** Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.

## agent-harness

### AS-11 — confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности

**GAP · P1 · security_overclaim.**

**Наблюдение.** Булевое поле полезно против неполных arguments, но его может поставить сама модель. Формулировка Any two are safe даёт blanket safety для пар возможностей. Например untrusted content+write capability причиняет damage без доступа к private data.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/tools.md:126`
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/tools.md:157`
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md:58`

**Воспроизведение / контрсценарий.** Модель формирует destructive call с confirm:true без человеческого события; schema проходит. Untrusted README просит удалить публичный workspace: private-data элемента нет, но вред возможен. Реальные destructive tools не вызывались.

**Влияние.** Ошибочная архитектура approval и threat model, которая не учитывает integrity/availability и другие каналы утечки.

**Исправление.** Для user approval нужен проверяемый grant от trusted control plane, bound to principal/action/arguments/expiry, либо уже существующее разрешение. Булевое поле назвать syntax guard. Trifecta описывать как достаточную конфигурацию конкретного exfiltration риска, не полную модель безопасности.

**Критерий приёмки.** Agent-authored confirm:true без grant отвергается; повтор с изменёнными arguments также; заранее авторизованное действие проходит. Сценарий untrusted content→destructive write входит в threat tests независимо от private-data доступа.
### AS-14 — Отсутствие evals ошибочно делает весь аудит unfalsifiable

**GAP · P2 · evidence_overgeneralization.**

**Наблюдение.** No evals предписано ставить первым и объявлять всё последующее unfalsifiable. Но детерминированная гонка, hardcoded secret или неправильно связанный timeout доказуемы без поведенческого eval suite. Most agent bugs are prompt bugs также не подкреплено измеренной долей дефектов.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:148`
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md:90`
- `repo://agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md:36`

**Воспроизведение / контрсценарий.** Пять SY reproductions этого аудита показывают нарушения координации непосредственно. Наличие/отсутствие агентного корпуса не меняет доказательство двух владельцев одного lease.

**Влияние.** Аудитор может закончить раньше конкретных критических дефектов или начать править prompt там, где нужна исправленная синхронизация.

**Исправление.** Разделить source-level invariant proof, deterministic reproduction и behavioral estimate. No evals — finding о неизвестной надежности, приоритет определяется конкретным вредом; prompt-first оставить диагностической эвристикой с исключениями.

**Критерий приёмки.** Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.

## agent-interop

### AS-12 — MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor

**GAP · P2 · verified_sdk_version_drift.**

**Наблюдение.** Закреплена ревизия wire, но не distribution/version/import SDK. Пример использует FastMCP и transport settings в constructor. Current official Python SDK stable v2 переименовал класс MCPServer и переместил transport args; standalone fastmcp — другая distribution.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:5`
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:30`
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md:73`

**Воспроизведение / контрсценарий.** Primary SDK README и migration guide проверены 2026-09-07. Пример без import/package pin неоднозначен и не соответствует актуальному official v2 constructor. ASGI lifespan и mount/health ordering также не показаны как runnable integration; endpoint probe не запускался.

**Влияние.** Copy/paste ведёт к ImportError/TypeError либо выбору другого SDK, а недостающая lifecycle wiring — к неработающему mounted endpoint.

**Исправление.** У каждого executable example назвать distribution, imports, tested version и lifecycle. Дать отдельные v2/current и v1 migration paths, health route с проверенным порядком registration. Проверять localhost protocol call, а не только наличие строки в markdown.

**Критерий приёмки.** В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.

**Проверенные primary sources:** [github.com](https://github.com/modelcontextprotocol/python-sdk), [py.sdk.modelcontextprotocol.io](https://py.sdk.modelcontextprotocol.io/migration/).
### AS-13 — Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks

**GAP · P2 · internal_routing_contradiction.**

**Наблюдение.** Body утверждает: если поверх tools/call нужны task lifecycle/progress/resumable handle — wanted A2A. Позже тот же skill правильно описывает MCP Tasks с durable handle и mid-flight input.

**Файлы:**
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md:74`
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md:134`
- `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp.md:220`

**Воспроизведение / контрсценарий.** Десятиминутный export/report tool с фиксированным контрактом и negotiated Tasks: lifecycle нужен, автономного peer нет. Первая эвристика ведёт в A2A, последующие references — в MCP Tasks.

**Влияние.** Лишний протокол, cards/auth/lifecycle без потребности, либо непоследовательные рекомендации одного skill.

**Исправление.** Главный dispatch criterion: capability/tool execution против автономного peer outcome. Длительность — второй вопрос о Tasks capability/transport, не выбор протокола. Проверять фактически поддержанные extensions клиента/SDK.

**Критерий приёмки.** Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.

## agent-sync

### SY-01 — Выданные IDs меняются задним числом; два reserve возвращают один номер

**GAP · P1 · measured_code_defect.**

**Наблюдение.** Reservation ID — позиция события в сортировке (client timestamp, run, index); timestamp имеет секундную точность. Поздний event может встать раньше уже выданного. Settle sleep не создаёт immutable total order. Названный race-free test вызывает alpha/beta/gamma последовательно в возрастающем порядке.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:117`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1398`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1434`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2200`
- `repo://agent-sync/test/validate.py:908`

**Воспроизведение / контрсценарий.** agents-sync-reproduce.py SY-01 использует настоящий Sync.reserve и in-memory sharded plane: baseline7; zeta получает7, потом alpha в той же секунде получает7; общий replay меняет zeta на8. Ни облако, ни реальные register files не использовались.

**Влияние.** Коллизии DEC/OQ/DEP, ссылки на разные решения под одним ID; журнал выглядит согласованным только после ретроактивного переназначения.

**Исправление.** Выделение ID перенести в linearizable allocator: CAS/transaction или git ref с compare-and-swap; присвоенный value и reservation_id писать неизменно. Для offline — уникальные составные IDs/ULID с явным последующим mapping. Client clock пригоден для display, не арбитража.

**Критерий приёмки.** Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.
### SY-02 — Общий last-renew позволяет активности одного агента подавлять продление чужих leases

**GAP · P1 · measured_code_defect.**

**Наблюдение.** Throttle marker лежит в .agent-sync/last-renew на checkout, а held()/refresh относятся к одному run. Любой acquire или renew сдвигает общую отметку, в том числе для чужих run.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1761`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1778`

**Воспроизведение / контрсценарий.** SY-02: два Sync с разными rid, один root; A.renew(TASK-A)=True, сразу B.renew(TASK-B)=False; B._refresh_lease вообще не вызван. Постоянная активность A может повторять suppression.

**Влияние.** Работающий B теряет TTL, другой агент перехватывает его задачу; одновременно UI показывает нормальную hook-активность.

**Исправление.** Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных.

**Критерий приёмки.** С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.
### SY-03 — Local renew перезаписывает уже завершённый steal

**GAP · P1 · measured_code_defect.**

**Наблюдение.** _refresh_lease читает owner, затем tmp.replace(lock) без CAS и без того же critical section, которым пользуется steal. Проверка владельца устаревает до replace.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1739`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1750`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1565`

**Воспроизведение / контрсценарий.** SY-03 инъецирует настоящий _steal_expired после чтения old-owner и до Path.replace. Steal успешно устанавливает new-owner; старый renew отвечает True и восстанавливает old-owner. Только temporary files.

**Влияние.** Новый и старый агенты считают задачу своей, lease authority теряет линейность, работа может быть перезаписана.

**Исправление.** Один OS-backed critical section для acquire/renew/release/steal, revision/fencing token и проверка поколения. Просроченный владелец не продлевает lease без нового acquire. Не использовать unconditional replace для изменения ownership-sensitive state.

**Критерий приёмки.** Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.
### SY-04 — Task lease не защищает общий файл от владельца другой task lease

**GAP · P1 · measured_contract_gap.**

**Наблюдение.** guard(path) разрешает запись при наличии любого held key. Это честно описано как one lease covers every guarded file, но не обеспечивает обещание who may write this file/no collisions. Ключи разных задач не взаимно исключают общий registry.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2848`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:235`
- `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md:237`

**Воспроизведение / контрсценарий.** SY-04: A держитTASK-A, B держитTASK-B, оба guard на один docs/DECISIONS.md возвращаютTrue. Это прямое измерение gate, не воспроизведение потери реальных данных.

**Влияние.** Shared registry read-modify-write может терять чужие строки несмотря на два корректно взятых task leases.

**Исправление.** Разделить task ownership и resource mutation lock. Для shared registries — краткий file/register transaction lock либо append-only event log с CAS; canonical paths и common repo identity. Изолированные worktrees плюс merge policy — другой честно объявленный режим.

**Критерий приёмки.** Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.
### SY-05 — Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают

**GAP · P1 · measured_code_defect.**

**Наблюдение.** Имя lock создаётся атомарно, содержимое записывается позднее. Конкурент читает пустой JSON как {}, не считает его live и может украсть через _steal_expired. Первый продолжает писать в уже удалённый inode и тоже возвращает won.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1584`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1644`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1670`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1679`

**Воспроизведение / контрсценарий.** SY-05 запускает настоящие acquire() двух run; scheduler pause вставлен на os.fdopen после O_EXCL первого. Вывод [(True,second-owner),(True,first-owner)], на диске second-owner. Cloud/cross-machine не использовались.

**Влияние.** Нарушено базовое mutual exclusion даже на одной машине до истечения TTL.

**Исправление.** Создание и чтение ownership state сериализовать тем же OS lock либо публиковать уже заполненный объект атомарным no-replace primitive; partial/corrupt lock не считать немедленно stealable. Crash cleanup отличать от активного незавершённого create по арбитражу, не эвристике пустого JSON.

**Критерий приёмки.** Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.
### SY-06 — Одно gated смешивает lease guarantee, видимость и наличие host enforcement

**GAP · P2 · measured_source_contract_conflict.**

**Наблюдение.** Код gated зависит от cfg и lease_mode. SKILL требует ungated без Claude hooks; backend-fs требует ungated по отсутствию shared awareness; adapter contract ещё связывает это с capabilities record plane. Один boolean отвечает на три разных вопроса.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1375`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2937`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:45`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/backend-fs.md:36`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md:55`

**Воспроизведение / контрсценарий.** Наши scratch Sync с default local, cfg.gated=True дают gated=True без какого-либо host hook. Generated board/status берут это же свойство. На Codex enforcement не появляется от local lease.

**Влияние.** Оператор может прочитать gated как аппаратную защиту всех edits, хотя это лишь арбитраж ключа при добровольном использовании API.

**Исправление.** Заменить на независимые lease_scope, enforcement_mode, awareness_scope, identity_strength и backend_health. В generated docs брать значения из runtime evidence; временно явно расшифровать legacy gated и убрать противоречащие references.

**Критерий приёмки.** Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.
### SY-07 — Guard охватывает редактор и некоторые git commit, но не все записи через shell

**GAP · P2 · observed_enforcement_limit.**

**Наблюдение.** PreToolUse матчеры Edit/Write/MultiEdit/NotebookEdit и Bash с git commit фильтром. Python write_text, sed -i, redirect в Bash до commit не блокируются. Поздняя проверка staged paths не предотвращает потерю рабочего дерева до staging.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/hooks/hooks.json:22`
- `repo://agent-sync/plugins/agent-sync/hooks/hooks.json:35`
- `repo://agent-sync/plugins/agent-sync/hooks/guard.sh:36`
- `repo://agent-sync/plugins/agent-sync/hooks/guard.sh:108`

**Воспроизведение / контрсценарий.** SY-07 вызывает настоящий guard.sh в temp project с конфигурацией и Bash payload с Python write_text: exit0. Сам shell write не выполнялся. Реальная доставка hook event хостом не проверялась; manifest также фильтрует Bash по git commit.

**Влияние.** Неполная защита при формулировке безусловной enforcement; при смене host/tool naming покрытие становится ещё уже.

**Исправление.** Чётко объявить advisory protection boundary. Если нужна enforceable гарантия — file writes через trusted mutation API/isolated worktree/OS controls с resource locks; не пытаться считать regex shell parser универсальным sandbox. Host adapters имеют capability matrix.

**Критерий приёмки.** Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.
### SY-08 — Поиск task-pipeline не учитывает native Codex plugin cache

**GAP · P2 · observed_portability_defect.**

**Наблюдение.** pipeline_installed проверяет только ~/.claude/plugins/cache/task-pipeline и direct ~/.agents/skills/task-pipeline либо ~/.claude/skills/task-pipeline. Native ~/.codex/plugins/cache/... не входит. Наличие копии на этом компьютере может маскировать дефект.

**Файлы:**
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:3542`
- `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:149`

**Воспроизведение / контрсценарий.** SY-08 создаёт temp HOME с единственной Codex plugin копией SKILL.md и вызывает настоящую pipeline_installed(): False. Из самого status install не запускался; на реальной машине альтернативная direct копия может скрывать этот дефект.

**Влияние.** Ложный missing dependency, повторные установки и остановки на поддерживаемом host.

**Исправление.** Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding.

**Критерий приёмки.** Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.

## Архитектура, которая закрывает эти дефекты

1. **Instruction plane.** Роутер выбирает capability owner по цели, эффекту и состоянию проекта; skill описывает цель, вход, выход, ограничения и fallback. Read-only аудит не превращается в implementation или install без потребности.
2. **Control plane.** User authorization и resource grants хранятся отдельно от промпта. Ни confirm:true, ни statement в skill не создаёт права. Предварительное явное разрешение сохраняется и не требует повторного запроса на каждый шаг.
3. **Execution plane.** План содержит data/control/authorization/resource edges, effect footprints, limits и typed checkpoints. Static/dynamic — выбор реализации; auditability — свойство сохранённого execution graph. Retry не повторяет side effects без idempotency.
4. **Coordination plane.** Task ownership отделён от file/register mutation. ID allocator и lease transitions используют один линейризуемый арбитр; cloud knowledge pages — проекции, не арбитраж. Locks имеют run/resource/revision/expiry, а writers проверяют fencing.
5. **Evidence plane.** Claim→source revision→repro/test result. В документах факт, измерение, вывод и гипотеза различаются. Пример кода — runnable fixture с pinned SDK; старый tested version не объявляется current без live check.
6. **Memory plane.** Факты, стратегии и рабочее состояние обновляются разными правилами. Confidence не заменяет provenance. Старое знание superseded в своём scope; правки обратимы; приватные данные имеют отдельную deletion policy.
7. **Eval plane.** Seed corpus до первого релиза, production regressions после; model execution отдельно от grader replay. Temporal invariants и side effects проверяются; uncertainty считается по соответствующему sample design.

## Последовательность исправлений для этой части семейства

- **Шаг 1 — зафиксировать отрицательные примеры.** Перенести SY-01/02/03/05 и AS-03/08 из audit artifacts в содержательные регрессионные тесты; никаких новых гарантий до failing→passing. Это не выполнено данным аудитом.
- **Шаг 2 — устранить shared-state corruption.** Linearizable ID allocation, единый lease critical section, per-key renew, partial-lock publication, resource lock contract: SY-01…05. Проверить interleavings и clock skew, затем multi-process и bare-remote integration.
- **Шаг 3 — исправить опасные инструкции.** Сага/unknown outcomes и spend baseline (AS-01/02), contradiction-safe memory (AS-03), approval/control edges (AS-04/07/11). Это правки смыслов, а не косметика текста.
- **Шаг 4 — восстановить доказательный eval gate.** Seed corpus (AS-06), candidate execution (AS-10), корректная статистика (AS-08), OTel counters (AS-09), границы аудируемости (AS-05/14). Проверить негативные сценарии и false positives.
- **Шаг 5 — закрыть host/protocol seams.** Матрица enforcement/awareness/lease scope, shell/tool limitations, Codex discovery (SY-06…08), runnable SDK examples и MCP/A2A route cases (AS-12/13).
- **Шаг 6 — behavioral re-evaluation текущих versions.** Clean host sessions на заявленных моделях, реальные tool-use сценарии, near-miss routing. Фиксировать immutable model ID, prompt/tool/skill revisions, sample count, raw traces и grader version. Сначала canary, затем расширение.
- **100% по этой части означает:** все перечисленные acceptance tests исполнены на объявленной support matrix, нет unresolved P1, каждый unknown либо проверен, либо явно исключён из обещаемой гарантии. Это не обещание универсальной безошибочности навыков.

## Покрытие чтения и проверок

Полностью прочитаны пять SKILL.md. agent-stack: целиком прочитаны references statistics, otel-genai, memory-architecture, memory-lifecycle, context-engineering, runtime, pipeline, harness audit/tools/layers/system-prompt/techniques, interop mcp/mcp-ship/a2a; patterns прочитаны по разделам loop, learning extraction, confidence, dedup, conflict, sharing; graph-engineering и llm-proxy-billing — основная архитектурная часть и целевые section searches. gateway — основной routing/auth/config фрагмент. Остальные memory-landscape, kv-cache, provider-lifecycle, governance, pi/pi-sdk, registry/mcp-scale учтены в индексе и границах, но не заявляются полностью построчно проверенными. Их отдельные numeric/API claims остаются за пределами этого дочернего прохода.

agent-sync: целиком SKILL, lease-protocol, adapter-contract, backend-fs, hook guard/_lib/manifest; script — identity/index, event replay/reserve, acquire/renew/steal, guard, gating, dependency detection; тесты — relevant fixtures и negative-test design. Остальные backend/roadmap/branching/binding references проверены целевым поиском по guarantees/routing. Все ~4963 строки coordinator не проходили формальную верификацию.

| Команда | Результат | Что доказывает |
|---|---|---|
| `python3 agent-stack/test/validate.py` | PASS, exit0, 15 checks, v0.23.2 | Структурный validator; не истинность prose |
| `python3 agent-harness/scripts/audit_agent.py --self-test` | PASS, 11/11, exit0 | Scanner ловит свои plant fixtures и молчит на трёх корректных |
| `python3 agents-sync-reproduce.py` | PASS, exit0 | Восемь SY counterexamples и AS-03/08 воспроизведены; PASS здесь означает подтверждение дефекта |
| Первый `python3 agent-sync/test/validate.py` | INCONCLUSIVE, exit120, пустой log во время ENOSPC | Причина exit120 не изолирована; это не GAP в skill. Повтор ниже после освобождения места |
| Повтор `python3 -u agent-sync/test/validate.py` | PASS, exit0: agent-sync v1.19.3 — all checks green | Повтор после df показал25Gi available. Существующие тесты проходят, несмотря на новые counterexamples |
| Live cloud, реальный денежный API, multi-machine races, реальные auto-loading trials | NOT-RUN | Требует отдельного sandbox/deployment и выделенного eval harness; к production не обращались |

Существующие eval logs прочитаны: agent-stack сообщает поведенческие rows для v0.17.1 (one probe/model/query, uncalibrated LLM judge, текущий skill позже); agent-sync — scenarios v1.18.7 и trigger rerun v1.19.0, scenarios после него не rerun. Это честные ограниченные исторические измерения, не end-to-end PASS текущих versions. Механический parent audit отдельно сообщает 28/28 house и18/18 strict; эти числа не пересчитывались здесь.

Применены инструкции `make-skill/agents/skill-auditor.md` и `references/retrofit.md` для процедуры evidence-first. Изменения исходников, публикация, обновление registry и облачная синхронизация не выполнялись. Машиночитаемый реестр: [agents-sync.json](agents-sync.json).
