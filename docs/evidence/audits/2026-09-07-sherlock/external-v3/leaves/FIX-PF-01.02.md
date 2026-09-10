# FIX-PF-01.02 — Authority boundary

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

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py`

implementation; exact local source path. SHA256: `9627d7e27b0495358a55cd250b48ff39359e3493633ffe23335c783f5900b723`

```text
679:         print(line, file=sys.stderr)
680:     return 1 if bad else 0
681:
682:
683: def cmd_next(graph, args):
684:     if violations(graph):
685:         die("graph does not validate — run `validate` first", 1)
686:     nodes = graph.get("nodes") or []
687:     if nodes and all(n.get("status") in TERMINAL for n in nodes):
688:         return 3
689:     ready = frontier(graph)
690:     if not ready:
691:         return 4
692:     # The frontier and nothing else. This is the line that enters a context on
693:     # every iteration of every loop, so every word here is paid for repeatedly.
694:     for n in ready:
695:         print(f"{n['id']}  {n['owner']}  {n['title']}")
696:
697:     # On stderr, always. The frontier rows are the one line paid for on every iteration of
698:     # every loop, and a warning inside them would be paid for the same way — and read as a
```

### Edit_from_predecessor `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/execution-attempt.schema.json`

new capability target; audit does not create it; consume produced path/digest from prerequisite, do not overwrite as a fresh Create. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Create `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/execution_authority.py`

Standalone sqlite3 authority; local filesystem only, Fabric adapter owns distributed execution.. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Реализовать standalone coordinator через Python stdlib sqlite3, BEGIN IMMEDIATE и persistent attempt table. Graph CLI external mode использует один coordinator interface; недоступный arbitration блокирует dispatch. Local SQLite mode не обещает distributed/NAS safety; Fabric позже заменяет authority через adapter. OS lock не держится весь LLM run.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Два независимых local claim дают одного победителя; lock/error не запускает work; advisory next не выдаёт execution claim.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
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

Appendix и полный parent contract: [leaf JSON](FIX-PF-01.02.json), [parent](../parents/FIX-PF-01.json). Полный audit не required prompt input.
