# FIX-PA-01.01 — Документированное решение автоматически оправдывает дефект

Parent `FIX-PA-01` · implementation · P1

## Что и зачем

Документированное решение автоматически оправдывает дефект

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
158:
159: - **Read the call site, not only the definition.** A finding about a module is not
160:   written until the places that use it have been read.
161: - **Every row states which of three it is:** *(a)* undecided, *(b)* decided and
162:   documented right here, *(c)* decided elsewhere and not propagated. Only **(a)** and
163:   **(c)** are work. **(b)** is the audit being wrong, and recording that is worth more
164:   than deleting the row.
165: - **Where the verdict is (c), the remedy is a mechanical check, not an edit.** A
166:   written rule nobody verifies reaches exactly as far as the place it was written; the
167:   durable fix in all five cases was a guard that asks the project's own instruction of
168:   every copy, not a patch to the copy that happened to be found.
169:
170: ## Three verdicts, and why the third one exists
171:
172: `clean` · `finding` · `blind`. The vocabulary is closed; a fourth value is
173: refused at construction.
174:
175: **`blind` is the whole design.** Without it, a probe that could not look and a
176: probe that found nothing produce the same empty section, and a reader takes the
177: second meaning every time. This is `audit.md`'s *silence is not a reading*
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pa-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Decision status и technical validity — разные оси. Accepted trade-off может быть отмечен принятой ценой; документированное нарушение остаётся finding с decision_id, причиной пересмотра и контрдоказательством.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Фикстура ADR разрешает логирование refresh token: аудитор всё равно обнаруживает раскрытие, связывает с ADR; сознательная поддержка только одного браузера при подходящем контракте — accepted limitation.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PA-01.01.json), [parent](../parents/FIX-PA-01.json). Полный audit не required prompt input.
