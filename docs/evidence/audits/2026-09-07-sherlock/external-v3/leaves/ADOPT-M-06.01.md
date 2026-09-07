# ADOPT-M-06.01 — Сохранить provenance вresearch synthesis

Parent `ADOPT-M-06` · implementation · P2

## Что и зачем

Сохранить provenance вresearch synthesis

Конкретная реализация приведена в шагах ниже.

## Решения

Research ledger хранит observation, citation, inference и hypothesis отдельно. Противоречащие участники сохраняются со ссылками; для числа связаны entity, unit, population и date. Нет данных — остаётся hypothesis, без квоты выдуманных доказательств.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Create `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/research-evidence.md`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/adopt-m-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Research ledger хранит observation, citation, inference и hypothesis отдельно. Противоречащие участники сохраняются со ссылками; для числа связаны entity, unit, population и date. Нет данных — остаётся hypothesis, без квоты выдуманных доказательств.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Two contradictoryparticipants remainlinked; singlesource flagged; noavailabledata stayshypothesis; number+entity+unit+time boundtogether.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-06.01.json), [parent](../parents/ADOPT-M-06.json). Полный audit не required prompt input.
