# FIX-UX-13.01 — Общий precondition требует scenarios даже независимому copy/benchmark scope

Parent `FIX-UX-13` · implementation · P2

## Что и зачем

Общий precondition требует scenarios даже независимому copy/benchmark scope

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md`

implementation; exact local source path. SHA256: `617713c7a76cbff36c8c9211c93246a1a11068a3aaa02e0b75dcf87eef7dde45`

```text
21: **Format contract:** [scenario-format.md](references/scenario-format.md)
22: (ux-contract v4) — report structure, verdicts (PASS / PARTIAL / FAIL /
23: BLOCKED), severities.
24:
25: **Precondition:** `docs/ux/scenarios.md` exists. If it doesn't, stop and run
26: the `ux-scenarios` skill first — there is nothing to audit against. The
27: opt-out is spoken: an operator saying **"no scenarios"** / **«без сценариев»**
28: declines the scenario route — review what exists without the base and state
29: that in the report.
30:
31: **Full context:** when `docs/ux/foundation.md` exists, audit each scenario
32: WITH its chain — load the traced story's acceptance criteria (Given/When/
33: Then) as additional checks, and note whether the implementation actually
34: serves the job and journey stage, not just renders the elements. A flow
35: whose buttons all exist but whose job outcome is unreachable is PARTIAL at
36: best. When `docs/ux/flows.md` exists, also verify the code implements the
37: flow diagram: every node reachable, every edge (including error edges)
38: wired, screen states from the flow's table present — unimplemented
39: nodes/edges are findings on the traced scenarios.
40:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-13.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Предусловия вычислять после scope: scenario → base, copy → brand, benchmark → observed URLs+receipts. Схема evidence допускает URL+timestamp+capture для внешних данных; file:line только для code claims.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-13.01.json), [parent](../parents/FIX-UX-13.json). Полный audit не required prompt input.
