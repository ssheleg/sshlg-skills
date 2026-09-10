# FIX-PF-06.02 — Single-authority dispatch integration

Parent `FIX-PF-06` · implementation · P2

## Что и зачем

Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/main/chainAdvance.ts`

implementation; exact local source path. SHA256: `5d02c078f5e2cbbbd2d2de571575e7b4b2105b66ae57a51c775326558b8e4e35`

```text
20: import { mayStartStep, fillBrief, type Outcome } from '../shared/chain.ts'
21: import { mayChain } from '../shared/loopBound.ts'
22: import type { TaskRow } from '../shared/types'
23:
24: export interface ChainDeps {
25:   db: SupabaseClient
26:   journal: Journal
27:   startTask: (input: {
28:     projectId: string
29:     instruction: string
30:     optionId: string
31:     preset?: string
32:   }) => Promise<{ task: TaskRow }>
33:   estateId: string
34: }
35:
36: export function createChainAdvance(deps: ChainDeps): () => Promise<void> {
37:   let running = false
38:   return async (): Promise<void> => {
39:     if (running) return
```

### Edit_from_predecessor `repo://fabric/apps/desktop/src/main/pipelineAdapters/taskPipeline.ts`

new capability target; audit does not create it; consume produced path/digest from prerequisite, do not overwrite as a fresh Create. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-06.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Adapter передаёт очередь Fabric authority; graph.py не второй scheduler; projection обратная по immutable run/node IDs.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Один imported node не dispatch дважды двумя системами; result возвращается тому же node revision.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-06.01` (data): Uses accepted import contract and the prerequisite persistence decision.
- `FIX-PF-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-04.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-04.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-03.01` (control): Completion boundary Fabric должна сохранять mandatory certification task-pipeline.
- `FIX-PF-03.02` (control): Completion boundary Fabric должна сохранять mandatory certification task-pipeline.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-06.02.json), [parent](../parents/FIX-PF-06.json). Полный audit не required prompt input.
