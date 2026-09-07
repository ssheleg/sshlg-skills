# FIX-EV-01.13 — Outcome corpus: make-skill

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Create `repo://make-skill/evals/cases/make-skill.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ev-01.13.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

MS-01: Приближение chars/3.9 выдаёт PASS токенового лимита — Unicode, английский, код, смешанный RU/EN; сравнение с независимым tokenizer; отсутствие библиотеки не возвращает PASS измерения.

MS-02: Самодельный YAML parser теряет типы metadata — Двусторонние fixtures: quoted/unquoted numeric, boolean, null, YAML escapes, multiline scalars, duplicate keys; одинаковые вердикты с upstream validator.

MS-03: Аудит по описанию автоматически превращается в исправление и release — Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.

MS-04: Платформенные ограничения описаны как универсальные и частично устарели — Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.

ED-01: Переносимость зависит от совместной упаковки соседнего task-pipeline — Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.

EV-01: Проверка выбора названия не доказывает пользу выполнения скилла — Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для make-skill записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; make-skill не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.13.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
