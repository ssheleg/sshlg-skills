# ADOPT-M-05.01 — Добавить контрпримеры кeval contract

Parent `ADOPT-M-05` · implementation · P2

## Что и зачем

Добавить контрпримеры кeval contract

Конкретная реализация приведена в шагах ниже.

## Решения

Добавить независимые от чужого runner fixtures: timeout, отсутствующая metric, плоская директория runs, перепутанные config labels, пустое evidence, непрочитанный feedback. Для каждого expected typed outcome и units; наличие fixture не означает успешный запуск.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Create `repo://make-skill/test/evals/outcome-contract-cases.json`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/adopt-m-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Добавить независимые от чужого runner fixtures: timeout, отсутствующая metric, плоская директория runs, перепутанные config labels, пустое evidence, непрочитанный feedback. Для каждого expected typed outcome и units; наличие fixture не означает успешный запуск.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Eachcase has expectedtypedoutcome/unit/baseline; noneclaimexecutedPASS. Existingrunner adaptation is separate FIX-EV-01 implementation.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `ADOPT-M-02.01` (data): Consumes predecessor method/fixture contract
- `FIX-AS-08.01` (data): Consumes predecessor method/fixture contract
- `FIX-AS-08.02` (data): Consumes predecessor method/fixture contract

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-05.01.json), [parent](../parents/ADOPT-M-05.json). Полный audit не required prompt input.
