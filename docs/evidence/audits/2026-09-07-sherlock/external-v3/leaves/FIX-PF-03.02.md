# FIX-PF-03.02 — Explicit exception disposition

Parent `FIX-PF-03` · implementation · P1

## Что и зачем

Прямой close обходит проваленную обязательную certification

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
559:                         r"|\btier\s+\d\s+(?:passed|failed|says|said|confirm\w*)"
560:                         r"|as\s+the\s+(?:unit|seam|product)\s+tier", re.I)
561:
562:
563: def tier_violations(t):
564:     """Everything wrong with one tier report, in a stable order.
565:
566:     Same law as `verdict_violations`: the shape is checked rather than trusted,
567:     and every refusal names the key, because a report rejected without naming its
568:     fault is a report the next attempt reproduces.
569:     """
570:     out = []
571:     if not isinstance(t, dict):
572:         return ["tier report is not an object"]
573:
574:     for k in TIER_KEYS:
575:         if k not in t:
576:             out.append("tier report has no `%s` — all eight are required, because a "
577:                        "report that omits one is silent about it rather than clear" % k)
578:     if out:
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md`

implementation; exact local source path. SHA256: `38e00b2a5845805a7ae02921099c37e9fddf832272aaa360c33d61546fffb47b`

```text
376:
377: **The boundary with certification:** this review closes a **prose-plan task** —
378: one reviewer, the five-round cap of §4.5. A **work-graph node** is closed by the
379: three blind tiers and `graph.py certify` instead
380: ([`certification.md`](certification.md), ceiling 3); the artifact the queue is —
381: plan or graph — decides which protocol closes the work, never whichever is
382: cheaper at the moment of closing.
383:
384: The REQ verdict is the one the other two can't produce: a task can meet every line
385: of its brief and still miss the requirement it was written to deliver. A ❌ there
386: enters the fix loop like any Important finding.
387:
388: A review may report **"cannot verify from diff"** items — requirements that live in
389: unchanged code or span tasks. They don't block the review, but you resolve each one
390: yourself before completing the task; you hold the cross-task context the reviewer
391: lacks. A confirmed gap becomes a failed spec review and enters the fix loop.
392:
393: ### 4.5 The fix loop
394:
395: Triggered by: spec ❌, any Critical or Important finding, or a "cannot verify" item
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-03.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Authorized exception отдельный тип с reason/identity, никогда fake PASS; reviewer exposure указывать честно.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Exception не становится certified; syntax lint не marked blind review.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-03.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-02.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-03.02.json), [parent](../parents/FIX-PF-03.json). Полный audit не required prompt input.
