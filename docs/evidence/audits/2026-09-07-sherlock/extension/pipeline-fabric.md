# task-pipeline как внешний planning/execution pipeline для Fabric

**Срез 2026-09-07. Аудит исходников и bounded scratch; реализация не менялась.**

Схема «один planning agent → независимые executors из сохранённых packets → reviewer/integrator» жизнеспособна как целевой контракт. task-pipeline уже даёт полезную доктрину разложения, подробных task briefs, worktree isolation и convergence review. Но текущий graph CLI не является готовым worker queue, а текущий Fabric chain API не является адаптером его graph/schema. Полностью автономный запуск нескольких executors поверх этих интерфейсов сейчас рано объявлять надёжным.

Это 10 дополнительных карточек PF: конкретные дефекты и недостающие контракты для нового сценария. Они не означают 10 наблюдённых production-инцидентов и не заменяют прежние TP/AS/SY карточки. PF-02/03 углубляют прежнюю тему доказательства; PF-04 связан с AS-04, но проверяет новый исполняемый counterexample.

## Что есть и чего пока нет

| Возможность | Текущее состояние | Основание |
|---|---|---|
| Planner вне executor context | Да как Markdown workflow: brief/report files, exact REQ/interface, clean agent window | build.md §4.1 |
| Independent processes read shared graph | Да; fresh next читает сохранённый graph | scratch два процесса |
| Atomic graph mutations | Да на проверенном macOS/fcntl пути: lock перед read, unique tmp+replace | 8/8 concurrent add |
| Atomic node claim / fencing | Нет у graph CLI; у Fabric есть task claim arbitration, но нет связи с graph attempt и result publication | PF-01,09 |
| Immutable node context packet | Не представлен в node schema и интеграции | PF-05 |
| Stale graph/candidate invalidation | Graph revisions объясняют правку, но не являются CAS/version binding | PF-02 |
| Named handoff | В Fabric есть name/value, needs; обязательная непустота проверяется на одном ребре | PF-08,09 |
| Reviewer/integrator | Есть доктрина и validator формы; closing можно обойти | PF-03 |
| Resume | Markdown progress и session data есть; running attempt lease recovery в graph CLI нет | PF-01,05 |
| Provider-independent execution | Task doctrine переносима; Fabric Codex runner сейчас без Fabric tools | PF-10 |

## Воспроизведения

Команды выполнялись только в папке аудита. Python создаёт временный Git repository, отдельные CLI processes и удаляет scratch; Node импортирует настоящий chainAdvance, но заменяет DB/journal/spawn на in-memory mocks. Ни настоящие executors, ни production API не запускались.

```sh
python3 pipeline-fabric-repro.py
node pipeline-fabric-chain-repro.mjs
```

- Planner add завершился; оба fresh next вернули один N-001, pending не изменился. Это доказательство чтения через process boundary и отсутствия claim в этой операции; выполнение кода двумя LLM не проверялось.
- 8 конкурентных add → 8 уникальных nodes, все exit0. Нельзя писать, что task-pipeline вообще не имеет атомарности.
- Park required producer → consumer frontier exit0; running без owner/TTL → next exit4.
- Verdict commit v1 + code/check v2 → close exit0 с observed at v2.
- certify unit FAIL exit1 → direct close exit0.
- Fabric diamond: C running, но B spawned с незаполненным {schema}; второй tick создаёт второй spawn, B остаётся backlog.

Логи: [graph probes](pipeline-fabric-repro.json), [Fabric chain probe](pipeline-fabric-chain-repro.json). PASS этих программ означает подтверждение контрпримеров, а не исправление исходников.

## PF-01 · P1 · Graph mutation lock не является claim узла или fencing исполнителя

**Доказательство:** measured_capability_gap; production occurrence unknown.

Два независимых процесса next получают N-001, status остаётся pending. owner — название роли, не session/attempt. running можно записать вручную, но CLI не имеет acquire/start/renew/release/recover; потерянный running даёт next exit4 навсегда до внешней правки. flock защищает add/park/close/certify, что подтверждено восемью параллельными add без потерь. При ошибке lock реализация продолжает unlocked с предупреждением.

**Локаторы:** [graph.py:683](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L683); [graph.py:722](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L722); [graph.py:747](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L747); [graph.py:758](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L758); [graph.py:1418](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1418); [graph.py:1493](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1493); [graph.schema.json:83](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/graph.schema.json#L83)

**Исправление:** В external-executor режиме отдать claim одному durable coordinator; атомарно ready→claimed выдаёт attempt_id, lease_generation/fencing token, owner_id и expires_at. Mutations выполняются только с expected revision. Fail-closed при невозможности арбитража; advisory режим остаётся явно отдельным. Не держать OS lock на всё время LLM job.

**Приёмка:** Два claim одного node/version дают одного победителя; restart/expiry позволяет новый attempt, late old attempt не публикует result; независимые add сохраняются; недоступный lock не запускает external work.

**Модули и интерфейсы (предложение):** TaskPipeline graph.py: claim/renew/release/recover API либо адаптер к Fabric coordinator; Fabric durable coordinator: claim(run_id,node_id,node_revision,owner,idempotency_key) → AttemptGrant

**Зависимости:** можно начать отдельно.

## PF-02 · P1 · Старое доказательство принимается после смены кода и контракта узла

**Доказательство:** reproduced_code_defect; production occurrence unknown.

Создан verdict для commit v1, затем code commit v2 и node.check заменён на v2. close exit0, evidence сохраняет v1 PASS и добавляет observed at v2. Stamping текущего HEAD не проверяет, что reviewer видел этот HEAD; graph revisions — только verb/node/why, без version/precondition.

**Локаторы:** [graph.py:1206](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1206); [graph.py:1308](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1308); [graph.py:1346](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1346); [graph.py:1356](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1356); [graph.py:768](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L768); [graph.schema.json:269](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/graph.schema.json#L269)

**Исправление:** Review receipt обязан связывать run/node/attempt, graph revision, packet digest, tested base/head/tree digest и checks. close сравнивает их с accepted candidate, а не переписывает provenance текущим HEAD. Изменение brief/REQ/interface инвалидирует затронутые nodes/descendants; новый graph version хранит supersedes+reason.

**Приёмка:** Старый verdict после v2 либо изменения check/REQ/packet получает STALE и graph byte-identical; downstream stale пересобирается; изменение независимого node не требует бессмысленной инвалидизации всего графа.

**Модули и интерфейсы (предложение):** ReviewReceipt v1 → validateReceiptAgainstCandidate; GraphVersion/revision and stale closure planner

**Зависимости:** PF-01.

## PF-03 · P1 · Прямой close обходит проваленную обязательную certification

**Доказательство:** reproduced_code_defect; production occurrence unknown.

Реальный certify записывает unit=fail и exit1; затем прямой close со структурно валидным verdict возвращает0 и done. close проверяет форму и blockers, но не требует успешную certification текущего candidate. Регулярное выражение cross-tier проверяет текст, а не независимость sessions/reviewers.

**Локаторы:** [graph.py:563](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L563); [graph.py:1136](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1136); [graph.py:1223](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1223); [graph.py:1300](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1300); [graph.py:1336](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1336); [build.md:380](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L380)

**Исправление:** Закрытие только через trusted coordinator с receipt успешного gate profile на том же candidate digest. Ручное исключение — отдельное authorized disposition с причиной, а не имитация pass. Сохранять reviewer identity/context exposure; syntax lint не называть доказательством blind review.

**Приёмка:** Fail любого обязательного gate не позволяет complete; изменение candidate сбрасывает certification; raw fabricated verdict или чужой attempt не проходит; authorized waiver не становится measured PASS.

**Модули и интерфейсы (предложение):** TaskPipeline close/certify: CertificationReceipt and candidate binding; Fabric review/integration transition guard

**Зависимости:** PF-02.

## PF-04 · P1 · Parked обязательного producer делает его consumer runnable без payload

**Доказательство:** reproduced_semantic_defect; production occurrence unknown.

TERMINAL={done,parked}; frontier, close и certify считают parked выполненной зависимостью. В scratch N-002 с required artifact-v1 становится runnable после park N-001 с причиной producer unavailable. Это сознательная семантика кода, но она не выражает необходимость конкретного результата. Fabric mayStartStep справедливо различает done/cancelled и missing.

**Локаторы:** [graph.py:79](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L79); [graph.py:85](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L85); [graph.py:406](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L406); [graph.py:1164](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1164); [chain.ts:50](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/chain.ts#L50); [work-graph.md:42](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/work-graph.md#L42)

**Исправление:** Разделить terminal execution status и dependency satisfaction. Required artifact/control/authorization edge имеет predicate; park producer блокирует consumer до explicit alternative/replan. Waiver ребра создаёт версию графа и затронутого packet.

**Приёмка:** Park/cancel required producer не запускает consumer; optional skipped edge разрешён только с declared fallback; retry/replan создаёт новую provenance, coverage не объявляет parked requirement fulfilled.

**Модули и интерфейсы (предложение):** DependencyContract v1 {kind,required,artifact_schema,acceptance_predicate,fallback}; TaskPipeline frontier/close/certify use satisfiedEdge()

**Зависимости:** PF-02.

## PF-05 · P2 · Saved Markdown brief уже есть, portable immutable node packet ещё нет

**Доказательство:** source_contract_gap; production occurrence unknown.

build.md требует task brief/report файлами, REQ цитаты, interfaces и отдельные worktree. Но graph schema не связывает node с brief/packet/base revision/output schema, next печатает только id/role/title. Graph и build workspace git-ignored; build cleanup удаляет packet/report. Fabric context pack содержит memory selection и task brief с SHA, но session directory удаляется, DB lock хранит ids/hash, не точные bytes и compiler version. Это не проверенный export/import пакета planner→executor.

**Локаторы:** [build.md:132](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L132); [build.md:194](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L194); [build.md:201](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L201); [build.md:560](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L560); [graph.schema.json:65](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/graph.schema.json#L65); [contextPack.ts:30](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/contextPack.ts#L30); [sessionBundle.ts:195](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L195); [20260901000013_context_packs.sql:19](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260901000013_context_packs.sql#L19)

**Исправление:** Compiler фиксирует goal/REQ text/global constraints/interfaces, input artifacts с digest, base/tree, allowed scope, budgets, validation profile, skill lock. Immutable packet хранится отдельно от ephemeral credentials/worktree; resolver материализует пути на другом host. Agent transcript не нужен. Global constraints включать в каждый packet или pin shared immutable artifact; output metadata typed.

**Приёмка:** Planner process завершается; свежий executor другой runtime читает только packet и разрешённые artifact refs, выполняет task и выдаёт validated result; отсутствующий digest input → BLOCKED_INPUT; packet bytes доступны после session cleanup; воспроизведение не зависит от cwd/домашнего пути.

**Модули и интерфейсы (предложение):** New TaskPacketCompiler(plan,scope,artifacts,skillLock) → NodePacket; ArtifactStore put/get(sha256), PacketResolver; NodeResult {attempt_id,packet_digest,base,head,outputs,checks,decisions,concerns}

**Зависимости:** PF-02.

## PF-06 · P2 · Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration

**Доказательство:** source_inventory_gap; production occurrence unknown.

ADR-0009 обещает versioned pipeline, pinned running graph и registry skills. В прочитанных runtime paths работают project_tasks/task_links/task_handoffs, session context и runner registry. Поиск всего supabase/migrations не нашёл pipeline/graph_version storage или skill provisioning; migration1 прямо откладывает runs/nodes. Не найден импорт pipeline.schema.json/graph.schema.json или bridge CLI. Совпадение слова pipeline в docs не подтверждает интеграцию.

**Локаторы:** [0009-the-development-pipeline-is-data-the-operator-can-edit.md:17](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/docs/adr/0009-the-development-pipeline-is-data-the-operator-can-edit.md#L17); [0030-a-run-is-one-execution-of-one-graph.md:17](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/docs/adr/0030-a-run-is-one-execution-of-one-graph.md#L17); [20260831000001_migration_one.sql:8](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260831000001_migration_one.sql#L8); [chainAdvance.ts:24](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L24); [pipeline.schema.json:227](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/pipeline.schema.json#L227)

**Исправление:** Ввести explicit import/compile adapter. task-pipeline остаётся внешним authoring/verification package; Fabric хранит execution authority и projection. Pipeline version pins skill source/version/digest, stage contract, gate profile; compiler сообщает unsupported field вместо молчаливой потери. Выбрать одну authority, не два scheduler поверх одной очереди.

**Приёмка:** Golden import/export сохраняет REQ/node/typed edge/check/skills и manual gates; unsupported schema version явная ошибка; edit pipeline не меняет in-flight run; fresh host подтверждает bytes реально загруженного skill; planning agent не перепроходит grill для executors.

**Модули и интерфейсы (предложение):** New pipelineAdapter.ts: importTaskPipeline(bundle) → FabricGraphVersion; New pipeline/graph-version/run/attempt storage and event projectors; SkillResolver: source+version+digest+host compatibility

**Зависимости:** PF-01, PF-04, PF-05.

## PF-07 · P1 · Fabric chainAdvance повторно запускает follower, создавая новые задачи

**Доказательство:** reproduced_module_defect_mock_store; production occurrence unknown.

chainAdvance выбирает backlog follower и вызывает startTask без его taskId. Реальный startTask создаёт новый UUID, не меняет исходный follower. Mutex running локален одному process/call. Два последовательных вызова actual advancer с mock DB дают два spawn, исходный B остаётся backlog. Tick не записывает idempotency/start claim для B; loop-depth связь созданному task здесь также не добавляется.

**Локаторы:** [chainAdvance.ts:37](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L37); [chainAdvance.ts:57](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L57); [chainAdvance.ts:127](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L127); [index.ts:839](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/index.ts#L839); [index.ts:851](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/index.ts#L851)

**Исправление:** Запускать existing follower через durable dispatch intent, keyed run/node/version/attempt. CAS backlog→dispatching и outbox до spawn; после crash reconcile process/session. Если создаётся child attempt task, parent mapping и spawned link должны появиться в той же логической операции. Не выдавать бесконечную серию независимых task UUID.

**Приёмка:** Два ticks и два desktop workers дают один logical attempt; crash до/после spawn не теряет mapping и не повторяет completed work; retry получает новый attempt с predecessor; loop bound считает chain переходы.

**Модули и интерфейсы (предложение):** Replace ChainDeps.startTask with dispatchExistingNode(command); startTask/startExistingTask adapter and durable DispatchIntent projector

**Зависимости:** PF-01.

## PF-08 · P1 · Fabric fan-in проверяет каждое ребро отдельно, поэтому запускает неполный consumer

**Доказательство:** reproduced_module_defect_mock_store; production occurrence unknown.

for(const link of links) проверяет status/input одного predecessor и сразу запускает follower. В diamond A(done,report)→B и C(running,schema)→B запускается B с текстом Use A delivered and {schema}. Когда оба predecessors done, один tick может запускать B по каждому ребру отдельно; объединения всех inputs нет.

**Локаторы:** [chainAdvance.ts:68](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L68); [chainAdvance.ts:84](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L84); [chainAdvance.ts:123](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/chainAdvance.ts#L123); [chain.ts:62](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/chain.ts#L62)

**Исправление:** Группировать incoming edges по follower/version. Сначала удовлетворить все required predicates, затем объединить versioned artifacts по namespace и разрешить name collisions. Только после complete input set атомарный claim/dispatch. Текстовую interpolation выполнять после schema validation.

**Приёмка:** Diamond: C running → zero spawn; оба done и all inputs → один spawn с report+schema; conflicting names → explicit conflict, не last-write-wins; один predecessor cancelled/parked → consumer blocked или declared fallback.

**Модули и интерфейсы (предложение):** ChainPlanner.resolveInputs(follower,incomingEdges,artifactVersions) → ReadyPacket | Blocked; chainAdvance dispatch one node, not one edge

**Зависимости:** PF-04, PF-07.

## PF-09 · P1 · Fabric task lease не ограничивает публикацию handoff текущим owner/attempt

**Доказательство:** source_level_authority_gap; production occurrence unknown.

fabric_task_claim имеет server-side SQL arbitration: on conflict update only expired; append_event serializes per estate, API read-back сообщает winner. Это сильнее check-then-write в tool. Однако ownTask проверяет только project_id. fabric_task_handoff принимает любой taskId своего проекта, не сверяет live lease/attempt; apply_handoffs заменяет value по (task_id,name), не проверяя fencing/version. writeScopes лишь намерение для соседей, не file lock. Stale/другой project session может заменить result, на который опирается follower. Live DB/host attack не запускался.

**Локаторы:** [agentSurface.ts:788](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/agentSurface.ts#L788); [agentSurface.ts:925](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/agentSurface.ts#L925); [agentSurface.ts:976](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/agentSurface.ts#L976); [20260905000016_operating_surfaces.sql:288](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260905000016_operating_surfaces.sql#L288); [20260905000027_chains.sql:53](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260905000027_chains.sql#L53); [20260831000001_migration_one.sql:185](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260831000001_migration_one.sql#L185)

**Исправление:** publishResult требует authenticated owner+run/node/attempt+fence и output schema. Проверка и append единая DB transaction. Принятые outputs immutable; исправление — new version, downstream stale. Для writes отдельные resource scopes/isolation; не считать task lease защитой всех путей. Append-only journal сохраняется.

**Приёмка:** СессияB не публикует за live ownerA; после takeover публикация старого A rejected; повтор same idempotency key возвращает тот же receipt; correction creates output version и инвалидирует подписанных consumers; read-only observers продолжают читать.

**Модули и интерфейсы (предложение):** AgentSurface fabric_node_result_publish → Coordinator.publishResult; SQL atomic owner/fence check + result version projection

**Зависимости:** PF-01, PF-05.

## PF-10 · P2 · Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools

**Доказательство:** observed_runtime_adapter_boundary; production occurrence unknown.

AgentDescriptor Codex явно connectsToSurface=false, adapter none. Bundle compiler умеет mcp-config-flag и none, остальные отказывает; Claude adapter получает config+preamble. Поэтому запуск Codex terminal не доказывает доступ к claim/handoff/memory и равенство executor capabilities. Смена модели и смена runtime — разные оси.

**Локаторы:** [agents.ts:54](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/agents.ts#L54); [agents.ts:123](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/agents.ts#L123); [sessionBundle.ts:148](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L148); [sessionBundle.ts:176](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L176)

**Исправление:** Сохранить portable packet и отдельный executor capability adapter. Для каждого host подтвердить actual registration/tool call и project/run/session scope. Unsupported adapter не получает ready-for-dispatch; headless packet-only executor возможен через отдельный trusted result channel. Provider/model preferences наследуются отдельно от транспорта.

**Приёмка:** Один golden packet Claude/Codex executors: одинаковые contract inputs/outputs и authority restrictions; actual tool discovery/call receipt, cleanup/revoke; отрицательный unsupported host не запускается как supposedly connected. Не переносить native hidden reasoning/transcript между vendor runtimes.

**Модули и интерфейсы (предложение):** ExecutorAdapter capabilities/launch/deliver/resume/cancel/result; HostConnectionReceipt separate from SkillLoadReceipt

**Зависимости:** PF-05, PF-06.

## Предлагаемый handoff contract

Рекомендуемое разделение: task-pipeline — authoring/verification package и CLI для инспекции; Fabric — единственный durable execution coordinator. Planner и reviewer являются клиентами coordinator. agent-sync может координировать разработку самих репозиториев, но его отдельный task lease не подменяет Fabric node attempt и resource fencing. Не создавать две authoritative копии очереди, каждая со своим done.

1. **Planning session.** Research, harvest, grill только по отсутствующим материальным решениям, spec и plan. Итог — versioned PlanningBundle: user intent/authorization refs, REQs, accepted decisions, specs, typed graph, node packets, skill lock. Planner не обязан жить во время выполнения. Он может вернуться для NEEDS_CONTEXT/replan; все ответы становятся новой версией артефакта.
2. **Import/compile.** Adapter проверяет schema/capabilities, сохраняет immutable graph version и artifact digests. Не переносит названия fields без смыслового mapping. Различает stage config, work graph, run и node attempt.
3. **Dispatch.** Scheduler выбирает готовый node только после всех required input/control predicates. Atomic claim выдаёт grant с attempt/fence. Workspace materializer готовит отдельный worktree на pinned base; packet resolver проверяет все hashes и required inputs.
4. **Execution.** Executor получает packet, разрешённые artifacts и capabilities. Возвращает NodeResult: status (SUCCEEDED/NEEDS_CONTEXT/BLOCKED/FAILED/CANCELLED), tested candidate, artifact outputs, проверенные команды/результаты, decisions/concerns. SUCCEEDED означает кандидат к review, не интеграцию.
5. **Review.** Независимый reviewer видит тот же packet и immutable candidate diff. Gate profile задаётся риском; отдельные unit/seam/product facets не требуют всегда трёх одинаковых модельных запусков. Review receipt привязан к candidate и examiner identity; NOT_RUN не становится PASS.
6. **Integration.** Integrator проверяет все outputs сходящегося слоя, применяет approved diff на актуальную integration base, выполняет требуемые seam/regression checks. При изменении candidate/base — recheck affected evidence. Только atomic accepted transition публикует immutable outputs для dependent nodes.
7. **Resume/replan.** Процесс может исчезнуть в любой точке: lease expires, coordinator создаёт новый attempt с predecessor, old fence отвергается. Изменение требований или upstream artifact формирует новую graph/packet version; затронутые descendants получают STALE. Независимые accepted outputs можно переносить только после проверки input equivalence.
8. **Close/retain.** Run завершён после accepted/cancelled dispositions всех relevant nodes и требований; blocked не masquerades complete. Credentials и worktrees очищаются отдельно; packet/result/review/execution journal сохраняются с retention policy.

```json
{
  "schema": "fabric.node-packet/v1",
  "project_id": "uuid",
  "run_id": "uuid",
  "graph_version": "sha256:...",
  "node_id": "N-001",
  "node_revision": 2,
  "packet_digest": "sha256:...",
  "goal_ref": "sha256:...",
  "requirements": [
    {
      "id": "REQ-001",
      "text": "exact accepted requirement",
      "acceptance_ref": "sha256:..."
    }
  ],
  "global_constraints_ref": "sha256:...",
  "inputs": [
    {
      "name": "contract",
      "artifact_digest": "sha256:...",
      "schema": "contract/v1",
      "required": true,
      "producer_node": "N-000",
      "producer_attempt": "uuid"
    }
  ],
  "repo": {
    "identity": "canonical origin",
    "base_commit": "sha",
    "tree_digest": "sha256:..."
  },
  "write_scope": [
    "src/owned-module/"
  ],
  "skills": [
    {
      "id": "task-pipeline",
      "source": "registry origin",
      "version": "pinned",
      "digest": "sha256:..."
    }
  ],
  "checks": [
    {
      "id": "CHK-001",
      "kind": "unit",
      "command_ref": "sha256:..."
    }
  ],
  "output_contract": "node-result/v1",
  "authorization_refs": [
    "grant-id-or-scope-decision"
  ],
  "execution_policy": {
    "model": "inherit",
    "runtime_capabilities": [
      "repo-read",
      "isolated-write",
      "result-publish"
    ],
    "attempt_budget": 3
  }
}
```

`AttemptGrant` отдельно от packet: authenticated owner, expires_at, fencing_token, idempotency_key. Packet не может выдать сам себе разрешение. Secret material и native model hidden reasoning не входят в переносимый artifact. Signed hash сам по себе не доказывает истинность результата — только какие bytes были приняты.

## Последовательные implementation tasks

| Этап | Задачи | Выход / условие готовности |
|---|---|---|
| A — Закрепить дефекты | PF-02/03/04/07/08 negative fixtures | Старый код стабильно проваливает assertions, fixtures не используют production |
| B — Исправить текущие пути | PF-02/03/04 и PF-07/08 | stale/failed-cert/missing-input не закрываются; repeated ticks не дублируют follower |
| C — Execution authority | PF-01/09 | единый claim/attempt/fence и owner-bound result publication, crash/retry tests |
| D — Compiler и artifact store | PF-05/06 | portable versioned packets; golden import/export; skill resolution и actual-load receipt |
| E — Host adapters | PF-10 | минимум два реально проверенных runtime либо явно ограниченная support matrix |
| F — End-to-end gate | все PF | planner exits → two isolated executors → independent review → serialized integration → restart/replan; деньги/публикация вне scope |

Один planning agent не должен стать ручным диспетчером каждого heartbeat. Его сложный контекст нужен для решений и replan; выбор frontier, claim, recovery, проверка hashes и идемпотентность — детерминированные функции. Один executor не получает весь platform spec, но получает все собственные constraints и точные контракты соседей.

## Границы и чтение

Baseline: task-pipeline `66487ce32e7d4548fdaf7405eba5a21b44bb86d5`; Fabric `91337391aa8d24966bf0c57db381e6fe63b48bce`. Fabric имеет чужие untracked файлы product walkthrough/fixtures/scripts; они не читались как предмет проверки и не менялись. Активная другая работа не прерывалась.

Полностью прочитаны task-pipeline SKILL, пять запрошенных references, graph.py, graph/schema/example и pipeline schema; Fabric chain, advancer, context compiler, session bundle, agent descriptors, plan grouping, chain migration/test и перечисленные ADR. Большие index.ts, agentSurface.ts и несколько migrations прочитаны по релевантным функциям, не целиком. Agent-orchestrator и agent-interop SKILL прочитаны как архитектурные ориентиры; их старые универсальные запреты AS-04/05 не приняты как истина. Полный список и SHA256 прочитанных source files — в JSON.

Не проверены: running Fabric database/schema deployment, actual tool registration/session permissions, реальные LLM outputs, cross-machine locking, installer/provisioning всех skills, production incidence. Существующий Fabric chain test требует запись в DB и потому не запускался; его код прочитан. Полный npm test:all не повторялся. Жизнеспособность целевого контракта здесь — архитектурный вывод с конкретными необходимыми gates, не заявление о готовом работающем продукте.
