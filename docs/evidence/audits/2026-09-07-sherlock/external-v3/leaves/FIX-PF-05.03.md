# FIX-PF-05.03 — Packet result metadata

Parent `FIX-PF-05` · implementation · P2

## Что и зачем

Saved Markdown brief уже есть, portable immutable node packet ещё нет

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md`

implementation; exact local source path. SHA256: `38e00b2a5845805a7ae02921099c37e9fddf832272aaa360c33d61546fffb47b`

```text
128: ## 2. Workspace and ledger
129:
130: Conversation memory does not survive compaction. A controller that lost its place
131: re-dispatches completed tasks — the most expensive failure this stage has.
132: **Track progress in a file, not only in todos.**
133:
134: - Each plan owns a git-ignored workspace: `.task-pipeline/build/<plan-basename>/`
135:   at the repo root. Everything for THIS plan lives there — ledger, task briefs,
136:   implementer reports, review packages. Another plan's directory is never yours to
137:   read or write. `.task-pipeline/` must be git-ignored — the isolation step above
138:   adds and commits it; if you skipped that step, do it now, in its own commit, so
139:   scratch files never land in a task's diff.
140: - Ledger: `<workspace>/progress.md`, first line = its identity:
141:   `# build ledger — plan: <plan file path>`.
142: - **Resuming:** a task with a `Task <N>: complete` line is DONE — never
143:   re-dispatch it; resume at the first task without one. A task whose last line is a
144:   fix round is mid-loop: continue at the next round. A ledger naming a different
145:   plan belongs to that plan — leave it and start your own.
146: - After compaction, trust the ledger and `git log` over your recollection: the
147:   commits it names exist even when your context no longer remembers them.
```

### Edit_from_predecessor `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/execution-result.schema.json`

new capability target; audit does not create it; consume produced path/digest from prerequisite, do not overwrite as a fresh Create. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-05.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Результат хранит typed outputs/current packet digest и freshness; credentials не входят в immutable packet.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Token/secret fixture не попадает в bundle, changed predecessor output пересобирает revision.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-05.02` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-02.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `CTX-02.01` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.02` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.03` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.04` (data): Потребляет принятый контракт/результат предыдущей задачи.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-05.03.json), [parent](../parents/FIX-PF-05.json). Полный audit не required prompt input.
