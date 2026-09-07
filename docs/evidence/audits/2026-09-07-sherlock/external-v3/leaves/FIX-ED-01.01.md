# FIX-ED-01.01 — Single-skill dependency closure

Parent `FIX-ED-01` · implementation · P2

## Что и зачем

Переносимость зависит от совместной упаковки соседнего task-pipeline

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/evidence-docs/SKILL.md`

implementation; exact local source path. SHA256: `a3fade838d53aab95f6f77d21f8ec99bcaa355310f72f32b1bd174638574383e`

```text
12:
13: It is a **navigator, not a second copy**. Every law below has exactly one home — that is
14: canon 3, and a navigator that restated the doctrine would break the rule it is indexing.
15: The full statement of each canon, its rationale and its enforcement live in
16: [`documentation.md`](../task-pipeline/references/documentation.md) → *The canons*.
17:
18: ## The ten canons
19:
20: 1. **A claim carries its address** — `file:line`, a command with its output, a test name; a lesson names its commit.
21:    - **1a. A token that looks like evidence is not evidence until it has been resolved.** A sha, a line number, a path, a flag, a test name: every one can be plausible and absent, and each is trusted at exactly the moment nobody re-reads it. A commit reference is filled **after** the commit exists and checked with a command.
22: 2. **Numbers are computed, never restated.**
23:    - **2a. A number out of the shell is not a measurement until you have looked at what matched.** Print the matched items classified beside the count whenever the token can occur inside something else, and never pipe a command whose exit status governs what happens next — the shell then answers about the pager. *Eighteen lines containing these three digits* and *eighteen throttle events* are different claims.
24: 3. **Every fact has exactly one home** — others link, never restate.
25: 4. **A reference resolves from where the document is read** — not from where it lives.
26: 5. **Green nobody watched turn red is not evidence.**
27:    - **5a. A model too small to reproduce the defect is too small to prove the fix.** Reproduce first, fix second: a harness that goes green on the unfixed input is not a harness. Where the model is smaller than the subject, the gap is stated as a list of what it omits, with numbers.
28: 6. **A check proves its scope and nothing beyond it.**
29: 7. **Silence is not a pass** — ask what a mechanism prints when it did not look.
30: 8. **An estimate is never announced as a measurement** — a rule states its evidence condition.
31: 9. **What was not checked is printed beside what was.**
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-ed-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Каждый standalone artifact содержит required references внутри own directory; source-home одна, copies generated.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Изолированная skill directory разрешает все required links без соседнего checkout.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-ED-01.01.json), [parent](../parents/FIX-ED-01.json). Полный audit не required prompt input.
