# FIX-DS-01.01 — Semantic token adapter

Parent `FIX-DS-01` · implementation · P1

## Что и зачем

Сравнение packs сменой CSS не имеет общего token API

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

implementation; exact local source path. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
175:   before writing CSS for a cinematic page. A scene has planes; everything on one
176:   plane is the failure no amount of easing repairs.
177: - **Charts — the role contract in the same file, plus the `dataviz` handoff
178:   where that skill exists**, before drawing a chart in any pack. Token names are
179:   not uniform across the thirty-nine packs — only `--bg` and `--ink` resolve in
180:   every one — and an undefined custom property does not error, it silently falls
181:   back. Guessing one is the quietest way to ship a wrong chart. A `dataviz`
182:   skill is an optional neighbour this skill does not ship: where none is
183:   installed, the role table in `SURFACE_COMPOSITION.md` IS the chart contract,
184:   applied by hand.
185: - **Mobile surfaces** ([`MOBILE_SURFACES.md`](./MOBILE_SURFACES.md)), when the
186:   brief is a native app screen or a mobile-web view — not a desktop page whose
187:   only mobile concern is collapse. Five mobile rules the packs each state alone,
188:   a sixth **no pack answers** (the type ramp follows viewport width, not the
189:   user's text size), and the half no pack decides on a phone: platform
190:   convention.
191:
192: ## Choosing between packs — mount them, don't imagine them
193:
194: When more than one pack could carry a product, do not argue about it. Render
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/workbench.css`

implementation; exact local source path. SHA256: `e49d177f7ce45919dcaf8dbf4b5a11c84057a4b76ee145ebdfb0a931ae959272`

```text
1: /* SHELEG Design — Workbench token layer (light default + dark twin).
2:    Copy verbatim; consume only var(--…) in components.
3:    Theme switch: set data-theme="dark" on :root. */
4: :root {
5:   --bg: #f7f8fa;
6:   --panel: #ffffff;
7:   --panel-2: #f7f8fa;
8:   --ink: #1a1f2b;
9:   --muted: #5b6472;
10:   --border: #e6e9ef;
11:   --border-strong: #d7dce4;
12:   /* @role non-text: --accent, --info — 4.30:1 in both themes, just under AA. The accent
13:      fills buttons and marks selection and --accent-ink is the text that sits ON it;
14:      --info deliberately IS the accent hue, for "running / working", and it is a dot and a
15:      bar rather than a word. */
16:   --accent: #2f6feb;
17:   --accent-weak: #eaf0fe;
18:   --accent-ink: #ffffff; /* text ON the accent — 4.57:1 on --accent */
19:   --ok: #1a7f37;
20:   --ok-weak: #e6f4ea;
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/orchard.css`

implementation; exact local source path. SHA256: `3bffbf89bf4910c967ec24ca65df82a0efe98980167721a380e6a95e4093614b`

```text
4:    candy orange is the single action colour, and neither is a text colour —
5:    see the contrast notes, they are the part of this pack most often broken. */
6: :root {
7:   /* ---- Field & slabs --------------------------------------------------- */
8:   --bg: #fffef4; /* the field the slabs sit on — warm, yellow-cast near-white */
9:   --surface: #f6ecdc; /* oat: the default slab and card fill */
10:   --surface-2: #fbf7ea; /* the lighter pill (nav, floating chips) */
11:   --surface-ink: #3a1b13; /* cacao slab — inverted sections and selected chips */
12:   --line: #e3d7c8; /* hairline on oat */
13:
14:   /* ---- Ink ------------------------------------------------------------- */
15:   --ink: #3a1b13; /* cacao, not black — 15.4:1 on --bg, 13.3:1 on --surface */
16:   --ink-soft: rgba(58, 27, 19, 0.6); /* 4.1:1 on oat — NOT body copy */
17:   --on-ink: #fffef4;
18:   --on-primary: #fffef4; /* only on --primary-deep, never on --primary */
19:
20:   /* ---- Brand green ----------------------------------------------------- */
21:   /* @role non-text: --primary, --cta — sage at 3.42:1 on --bg and the candy orange at 2.75:1
22:      are fills and large-text colours, which both declarations already say; --primary-deep
23:      is the text-safe green at 4.9:1. */
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Определить общий semantic token contract поверх существующих packs, без обещания CSS swap для несовместимых keys.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Workbench/orchard mapping полный, missing token выявляется до comparison.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-01.01.json), [parent](../parents/FIX-DS-01.json). Полный audit не required prompt input.
