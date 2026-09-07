# FIX-TP-01.01 — Intake из имеющегося контекста

Parent `FIX-TP-01` · implementation · P1

## Что и зачем

Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`

implementation; exact local source path. SHA256: `f8876b8eb0b20169e7ca037869c4eb83164754c9bc271da52895fc27c1d0dc8a`

```text
95: WHY→UI→scenario chain runs through `/ux` and its linter, which belongs in the host's
96: CI so UX drift cannot merge. **Not installed on a UI task? The stage-3 spec gate
97: stops** — offer the install and wait (`references/companion-skills.md`).
98:
99: **The grill is built in and mandatory** (`references/grill.md`). No "clear enough task"
100: exemption and no stage 1 without a committed, operator-confirmed brief. It produces the
101: **REQ spine** — the request as an addressable list, each row naming how it is verified —
102: which stages 3–5 trace to, stage 4 set-compares against, and **stage 10 accounts for
103: every one of**, turning the pipeline from a funnel into a circle.
104:
105: **Harvest before you ask** (`references/knowledge-sources.md`). Stage 0 opens by
106: pulling what the project already knows about *this* task, writes the source ledger
107: into the brief, and then interviews **against** it — so the operator outranks any
108: document, **but only out loud**, and an override is a recorded decision rather than
109: an undetected divergence. That ledger is also stage 9's work list. Which sources,
110: and the two ways the retro is read — standing instructions in full because they
111: bind this run, the log queried because nothing caps it — are in
112: `references/knowledge-sources.md` and `references/retrospective.md`.
113:
114: **Three artifacts close a run, not two — and they are a convergence, not a sequence.**
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/grill.md`

implementation; exact local source path. SHA256: `2491a99efdc3223ba2afcb7cfe17de885fd8ee8e2e60dfa1d7da5235cbf1ed7d`

```text
47: Interview the operator relentlessly about every aspect of the task until you reach
48: a **shared understanding**. Walk down each branch of the decision tree, resolving
49: dependencies between decisions one by one.
50:
51: 1. **One question per turn.** Never bundle. Wait for the answer before the next.
52: 2. **Recommend an answer with every question** (+ a one-line rationale). "What do
53:    you think?" is lazy — you have the codebase in front of you, they don't.
54: 3. **If the codebase can answer it, go read the codebase.** Spending the
55:    operator's turn on something `grep`/`Read`/context7 would have told you is the
56:    most common way to waste a grill.
57: 4. **Depth-first.** Finish a branch before opening another; ask prerequisite
58:    decisions first, so later answers don't invalidate earlier ones.
59: 5. **Reconcile contradictions immediately**, and chase dodges: "we'll decide
60:    later" → "what's the latest you can decide and still ship?"
61: 6. **Cover the autonomy sweep** (below). An unasked question is not neutral — it
62:    is a scheduled interruption at stage 6.
63:
64: **Stop** when a re-scan surfaces no new branches. Don't grill past diminishing
65: returns: genuinely reversible calls can be deferred with a note.
66:
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-tp-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Строить brief из запроса/файлов, спрашивать лишь существенное неизвестное; уже принятое не пересогласовывать.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Полный brief даёт ноль intake questions; отсутствующая material decision создаёт один bounded decision task.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TP-01.01.json), [parent](../parents/FIX-TP-01.json). Полный audit не required prompt input.
