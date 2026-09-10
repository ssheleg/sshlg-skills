# FIX-PF-01.01 — Attempt grant schema

Parent `FIX-PF-01` · implementation · P1

## Что и зачем

Graph mutation lock не является claim узла или fencing исполнителя

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json`

implementation; exact local source path. SHA256: `4082692ee896c4edb96576aa93772046e3a48c9b53944e649af7241774ac7405`

```text
79:         "title": {
80:           "type": "string",
81:           "minLength": 1
82:         },
83:         "owner": {
84:           "type": "string",
85:           "minLength": 1,
86:           "description": "The role that runs it. Required by schema because a node with no owner is a node nobody dispatches — it sits in the frontier forever and the loop looks stalled for a reason no output explains. Whether the name is a role that EXISTS is `graph.py validate`'s question, not this file's."
87:         },
88:         "status": {
89:           "enum": [
90:             "pending",
91:             "running",
92:             "done",
93:             "blocked",
94:             "parked"
95:           ],
96:           "description": "`blocked` is waiting on an edge; `parked` is the verifier's deliberate *«this is a blocker, continue around it»*. The two are different facts and collapsing them loses the one a person needs."
97:         },
98:         "blocked_by": {
```

### Create `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/execution-attempt.schema.json`

new capability target; audit does not create it. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Определить owner/attempt/revision/fence/expiry и states ready→claimed, не использовать role name как identity.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Schema rejects missing owner/revision/fence/expiry и сохраняет valid grant identity при round-trip; atomic claim проверяет следующий implementation leaf.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-01.01` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-01.02` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-01.03` (data): Потребляет принятый контракт/результат предыдущей задачи.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-01.01.json), [parent](../parents/FIX-PF-01.json). Полный audit не required prompt input.
