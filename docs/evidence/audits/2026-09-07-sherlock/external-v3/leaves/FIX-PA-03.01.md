# FIX-PA-03.01 — Опциональная HTML-страница обязательна в критерии выхода

Parent `FIX-PA-03` · implementation · P2

## Что и зачем

Опциональная HTML-страница обязательна в критерии выхода

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md`

implementation; exact local source path. SHA256: `db94e3a51b1477995d267505d5a68a8803ad4e44f5f9a6f3bcb0bd292a18c215`

```text
208:   bumped past its tag makes no common claim, and is `blind`, not `clean`.
209:
210: ## The artefacts — the sidecar always, the page on request
211:
212: `docs/audit/<date>-audit.json` is written on every run. **The HTML page is written
213: only with `--report`.**
214:
215: The split is not symmetry. The sidecar is what makes this a ratchet rather than a
216: snapshot, and the next run reads it — skipping it would silently turn every future run
217: into a first run. The page is a **report**, and a report is an artefact that outlives
218: the conversation: one nobody asked for is a document nobody ordered and nobody
219: maintains, sitting untracked under `docs/` one `git add -A` from the product's
220: history. Answer in the conversation; write the page when somebody wants a page.
221:
222: **The page carries aggregates and pointers, never raw bodies.** Counts, top
223: classes, trends, and a link to the issue in its own system — never a stack
224: trace, a log line or a row of data. The report is a file people forward, and a
225: report that cannot be shared is one nobody writes twice.
226:
227: **A secret is reported by place and class, never by value.** `file:line`, which
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pa-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Указать read-only относительно target source/data, разрешённый output dir; условный DoD по requested deliverables. Добавить mode stdout/json/html и не требовать браузер для json-only.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Без --report HTML не создаётся и run complete допустим; --report требует существующий HTML, безопасные ссылки и inspect/render status.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PA-03.01.json), [parent](../parents/FIX-PA-03.json). Полный audit не required prompt input.
