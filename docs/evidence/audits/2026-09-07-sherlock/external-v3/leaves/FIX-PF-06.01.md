# FIX-PF-06.01 — Adapter import mapping

Parent `FIX-PF-06` · implementation · P2

## Что и зачем

Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/pipeline.schema.json`

implementation; exact local source path. SHA256: `99ff340ca0a9e3a1e35ad891723c200c5b06f3371429d65a88765c1dd63cd2f6`

```text
223:             }
224:           },
225:           "allOf": [
226:             {
227:               "if": {
228:                 "properties": {
229:                   "type": {
230:                     "const": "judgment"
231:                   }
232:                 },
233:                 "required": [
234:                   "type"
235:                 ]
236:               },
237:               "then": {
238:                 "required": [
239:                   "judge"
240:                 ],
241:                 "properties": {
242:                   "judge": {
```

### Create `repo://fabric/apps/desktop/src/main/pipelineAdapters/taskPipeline.ts`

new capability target; audit does not create it. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Новый Fabric taskPipeline adapter валидирует graph/profile/skill pin и явно отвергает unsupported mandatory fields.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Неизвестный gate не silently omitted, supported graph round-trip сохраняет constraints.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-06.03` (data): Persistence/ADR scope and recovery decision must precede adapter writes.
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

Appendix и полный parent contract: [leaf JSON](FIX-PF-06.01.json), [parent](../parents/FIX-PF-06.json). Полный audit не required prompt input.
