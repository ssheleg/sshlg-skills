# CTX-03.03 — Coverage and handoff receipt

Parent `CTX-03` · implementation · P1

## Что и зачем

Интерактивные UX flow previews как связанный deliverable

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Create `repo://super-ux/test/interactive_flow_cases.json`

new capability target; audit does not create it. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Create `repo://super-ux/plugins/super-ux/skills/ux-flows/references/prototype-walkthrough.md`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/ctx-03.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Declared/walked/NOT_RUN coverage and persistent artifact digest; production and art-direction gates separate.

Уточнение ADOPT-M-09: Дополнить существующий interactive-flow contract walkthrough без подсказок UI: цель пользователя, reset/back/error/keyboard/async. Не создавать второй flow store; declared и walked states разделены.
Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Дополнить существующий interactive-flow contract walkthrough без подсказок UI: цель пользователя, reset/back/error/keyboard/async. Не создавать второй flow store; declared и walked states разделены.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Dead control fails smoke; preview never upgrades implemented/product evidence.
Offlineinteractivefixture hasdeclaredvswalkedstates; screenshotonlynotfunctionalPASS; externalpayment mockexplicit.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-03.02` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](CTX-03.03.json), [parent](../parents/CTX-03.json). Полный audit не required prompt input.
