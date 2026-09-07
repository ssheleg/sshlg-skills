# ADOPT-M-07.01 — Подключитьresearch ledger безновойresearchroute

Parent `ADOPT-M-07` · implementation · P2

## Что и зачем

Подключитьresearch ledger безновойresearchroute

Конкретная реализация приведена в шагах ниже.

## Решения

UX foundation использует локальный research ledger и переносит evidence IDs/unknowns в сценарии. Notion, Dovetail и browser не нужны, если материалы уже доступны локально.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md`

reviewed adoption target. SHA256: `eb1b153f9e520811822c1d27dd418b4c280213190d20798fdf76ea758fef604d`

```text
1: ---
2: name: ux-foundation
3: description: Use when defining or revising WHO the users are and WHY they use the product - personas, Jobs to Be Done, customer journey maps, user stories with acceptance criteria. A journey covers the end-to-end experience including what happens after the first session - where a user comes back, where user retention is won, and where churn actually starts. Maintains docs/ux/foundation.md, the WHY layer that UX scenarios trace to. Triggers - "jtbd" / "джобы", "customer journey" / "карта пути", "user story" / "юзер стори", "personas" / "персоны", "who is this for", "user retention" / "ретеншн", "churn" / "отток", new product discovery.
4: compatibility: Any agent with file read/write. The closing lint (python3 docs/ux/lint.py, seeded by this pack) needs python3 3.9+, stdlib only - nothing to pip install. The Figma on/off choice recorded in step 5 needs no tooling of its own - the Figma MCP matters downstream, in ux-flows.
5: license: MIT
6: ---
7:
8: # ux-foundation — The WHY Layer
9:
10: > Part of **super-ux** — see [system-map.md](references/system-map.md)
11: > for the whole pipeline (foundation → flows → screens → scenarios → audits
12: > → plans) and the four sync rules. After changes, run the linter
13: > (`python3 docs/ux/lint.py`).
14:
15:
16: Interfaces fail when built without knowing WHO uses them and WHY. This skill
17: maintains `docs/ux/foundation.md`: **Personas → Jobs to Be Done → Customer
18: journeys → User stories.** Scenarios (`ux-scenarios` skill) are built on top
19: and trace to these IDs — the full chain gives every scenario its context.
20:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/adopt-m-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: UX foundation использует локальный research ledger и переносит evidence IDs/unknowns в сценарии. Notion, Dovetail и browser не нужны, если материалы уже доступны локально.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Local transcriptfixture needsnoplugins/keys; scenarios retain evidenceIDs and unknowns.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `ADOPT-M-06.01` (data): Consumes predecessor method/fixture contract

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-07.01.json), [parent](../parents/ADOPT-M-07.json). Полный audit не required prompt input.
