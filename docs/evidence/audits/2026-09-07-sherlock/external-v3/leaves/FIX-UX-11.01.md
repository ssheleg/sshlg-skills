# FIX-UX-11.01 — Figma fallback и provisional flow не доходят до разрешённого build state

Parent `FIX-UX-11` · implementation · P1

## Что и зачем

Figma fallback и provisional flow не доходят до разрешённого build state

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md`

implementation; exact local source path. SHA256: `08fee3fa580918356d6d3c398948413144cf60e45274ec78d50a0e44500b6d58`

```text
94: ## Design (forward)
95:
96: Per story (or tight cluster):
97:
98: 0. **No foundation? Say so, then design anyway — in a declared shape.** The
99:    steps below read "per story" and the practice pass builds its profile from
100:    `foundation.md`, but the commonest real brief is *"we know almost nothing"*,
101:    and until now nothing said what to do with it. Recommend `ux-foundation`
102:    first (that stands), and if the work proceeds without it, carry three things
103:    explicitly rather than improvising silently: a **provisional profile** table
104:    with each dimension's value and where it came from (`brief` / `inferred` /
105:    `assumed` — and an assumed dimension that decides the flow's shape is called
106:    out as such); `Traces:` written as an **unbacked provisional job** in the
107:    user's words, to be replaced with JTBD/ST ids when the foundation lands; and
108:    an **open decisions** list naming what each one would change. Screens whose
109:    spec depends on one of those decisions take `Status: blocked`, not
110:    `designed`. A flow built this way is honest input for the next stage; a flow
111:    built this way *without* the three blocks is a set of invented personas with
112:    a diagram on top.
113: 1. **Task analysis** (principles doc, method section): goal in the user's
```

### Edit `repo://super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md`

implementation; exact local source path. SHA256: `dbdf9cfbe78809f49e763416e76c4c58847de62ba5ffc1b845f8d2c177ea88e1`

```text
29: IDs; traceability rules enforced (every must/should story covered; every
30: flow node/edge covered; every scenario serves a story or job — a scenario
31: serving nothing is a candidate for deletion, not implementation). Steps are
32: written use-case style: user action -> observable system response. If the
33: upper layers are missing on a non-trivial product, recommend `ux-foundation`
34: → `ux-flows` first; proceed in v1 mode (no Traces) only for tiny projects
35: or on explicit user choice.
36:
37: **Design taste:** apply
38: [ux-design-principles.md](references/ux-design-principles.md) — states
39: per screen, error recovery, primary-action rules — when writing Expected
40: results and Errors & recovery.
41:
42: ## The hard rule
43:
44: 1. Scenarios come BEFORE interface. A new feature or project starts with
45:    drafting scenarios and validating them against the existing base —
46:    conflicts, overlaps, gaps — and getting them approved. Only then design
47:    and build UI.
48: 2. Any change touching user-facing behavior updates `docs/ux/scenarios.md`
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-11.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-03.01` (data): Build gate должен принимать согласованный provisional prototype state.
- `CTX-03.02` (data): Build gate должен принимать согласованный provisional prototype state.
- `CTX-03.03` (data): Build gate должен принимать согласованный provisional prototype state.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-11.01.json), [parent](../parents/FIX-UX-11.json). Полный audit не required prompt input.
