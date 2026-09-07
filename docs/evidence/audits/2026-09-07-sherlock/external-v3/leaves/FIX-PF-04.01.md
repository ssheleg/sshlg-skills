# FIX-PF-04.01 — Dependency satisfaction predicate

Parent `FIX-PF-04` · implementation · P1

## Что и зачем

Parked обязательного producer делает его consumer runnable без payload

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
75:     # dispatched as agents — voluminous reading, small answer
76:     "verifier", "decomposer", "ux", "ui", "researcher", "market-analyst", "bug-analyst",
77: }
78:
79: TERMINAL = {"done", "parked"}
80: NO_GRAPH = {"producer", "doctrine"}
81: # One place, and the schema enumerates the same three. Two homes for this set is
82: # what let `close` write a verb the format forbade.
83: REVISION_VERBS = {"add", "park", "close"}
84: # Parking a node PROMOTES its dependents: `parked` is terminal, so anything
85: # blocked on it becomes runnable even though the payload it waited on never
86: # arrived. That is deliberate — `can_continue_around` in the verdict is the
87: # same idea — but it is a real consequence of parking a blocker rather than a
88: # leaf, and it is written here because the frontier will not explain it.
89:
90:
91: def die(msg, code=1):
92:     print(msg, file=sys.stderr)
93:     sys.exit(code)
94:
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/work-graph.md`

implementation; exact local source path. SHA256: `1a7e7631173e03e582469738583c37e4025797eabf9263ecf1b5de9d7e806ac6`

```text
38: | `goal_clauses` | release work no requirement names. Enumerated, never matched against the goal's prose: substring-matching a sentence produces confidence without correctness |
39: | `nodes[].owner` | which role does it. A node nobody can dispatch never leaves the frontier and nothing says why |
40: | `nodes[].serves` | the REQ or goal clause it exists for. A node serving neither is **parked with that as the reason** |
41: | `nodes[].blocked_by` | what must close first. This is what the frontier obeys |
42: | `nodes[].touches` | what it **mutates**. Two runnable nodes writing one file is the false parallelism [`planning.md`](planning.md) refuses — *distinct is not the same as independent, and the check is what they touch, never what they are called* |
43: | `nodes[].check` | **how this node will be closed** — one command, or the named judgement where no command can decide it. Required on every node except a `parked` one. The certification's `unit` tier runs it and reports its output as the evidence row ([`certification.md`](certification.md) — three blind tiers close a node, not one reader); before this field existed that instruction pointed at an absence, leaving a verifier the two things it forbids — invent a check, or run everything (B-080) |
44: | `nodes[].evidence` | required when `status` is `done`. A node called done by assertion is what evidence exists to prevent |
45: | `nodes[].parked_reason` | required when `status` is `parked`. A park with no reason is indistinguishable, a week later, from work quietly dropped |
46: | `edges[].payload` | what the dependency hands over. **An edge carrying no named artifact is chronology drawn as architecture** |
47: | `revisions` | why the graph is not the graph stage 2 wrote. A graph that changed for reasons nobody recorded can explain its own completion by appealing to a plan that existed only at the end |
48:
49: ## The verbs, and their exit codes
50:
51: Exit codes are the contract, per standing instruction `R-004`: **the next command is
52: conditional on the code, never merely sequenced after it.**
53:
54: | Verb | Prints | Codes |
55: |---|---|---|
56: | `validate` | every violation, in a stable order | `0` clean · `1` any |
57: | `next` | the frontier, ordered by how much each node unblocks — **and nothing else** | `0` printed · `3` all done · `4` nothing runnable |
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Terminal status отдельно от required data/control/resource predicate; park не satisfies required producer.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Parked producer блокирует consumer, valid alternative требует explicit versioned edge change.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-02.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-04.01.json), [parent](../parents/FIX-PF-04.json). Полный audit не required prompt input.
