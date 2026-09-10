# CTX-02.02 — Leaf compiler

Parent `CTX-02` · implementation · P1

## Что и зачем

Report → prioritized packet compiler и context freshness gate

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit_from_predecessor `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/context_packets.py`

new capability target; audit does not create it; consume produced path/digest from prerequisite, do not overwrite as a fresh Create. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/planning.md`

External-method enrichment owned by this outcome. SHA256: `52ad2916a11615cd9e58845bd72f82fe0e667a3237a683cd207b9db620b6178c`

```text
1: # Plan — stage 4, built in
2:
3: Turning the spec into an implementation plan a **zero-context implementer** can
4: execute task by task without reading the spec, the chat, or the rest of the plan.
5: Built into this skill; nothing to install.
6:
7: > Ported from the `writing-plans` skill in
8: > [obra/superpowers](https://github.com/obra/superpowers) (MIT — see `LICENSE` →
9: > *Third-party*), extended with the dependency graph, parallel groups and
10: > file-ownership rules this pipeline's stage-5 subagent build depends on.
11:
12: ## Contents
13:
14: - Audience
15: - Before writing tasks
16: - Task right-sizing
17: - Plan header — required
18: - Task structure — required
19: - No placeholders
20: - Self-review — before handing off
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/ctx-02.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Outcome slices carry resolved decisions, exact scope, parent acceptance mapping and budgeted primary vs appendix.

Уточнение ADOPT-M-13: Cold reader получает только разрешённый packet без истории автора. Он должен определить цель, входы, решения, scope, outputs, acceptance, guards и resume. Missing version/output contract блокирует readiness.
Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Cold reader получает только разрешённый packet без истории автора. Он должен определить цель, входы, решения, scope, outputs, acceptance, guards и resume. Missing version/output contract блокирует readiness.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

Уточнение XD-14: Правило встраивается напрямую в canonical compiler/decomposition; temporary handoff note и второй task-list формат не создаются.
Встроить reuse/modify/create classification в leaf packet.
Сохранять behavior+styling+states одного outcome вместе; не переносить шаблон Foundation/Core/Interactions/Responsive как независимые обязательные phases.
Visual uncertainty проверять ранним ограниченным render slice, с тем же scenario contract.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Broad unresolved parent не dispatch leaf; focused positive/negative acceptance required.
Coldreader answers8concretepacketquestions; missingversionoroutputcontract failsreadiness; no newservice/APIkey.
Ни design-flow, ни .design/TASKS.md не становятся параллельным plan authority.
Feature выбирается активным ID/explicit path, не mtime.
Каждый slice имеет конкретный expected result и testable acceptance.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-02.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `CTX-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `CTX-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `CTX-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](CTX-02.02.json), [parent](../parents/CTX-02.json). Полный audit не required prompt input.
