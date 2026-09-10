# FIX-VD-06.01 — Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей

Parent `FIX-VD-06` · implementation · P2

## Что и зачем

Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей

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
103: pages on the same pack, one for a regulated insurer and one for a design
104: studio, are not the same page. Three dials carry that difference, and they are
105: set once, out loud, before any layout exists.
106:
107: - **`DESIGN_VARIANCE`** 1–10 — 1 is perfect symmetry, 10 is deliberate
108:   asymmetry and no two sections alike.
109: - **`MOTION_INTENSITY`** 1–10 — 1 is static, 10 is cinematic and physical.
110: - **`VISUAL_DENSITY`** 1–10 — 1 is a gallery wall, 10 is a cockpit.
111:
112: **Baseline `7 / 5 / 4`.** State the values and one line of reasoning before
113: building; do not ask the user to edit a file, and do not silently drift from
114: what you announced.
115:
116: ### Reading them off the brief
117:
118: | The brief reads as | VARIANCE | MOTION | DENSITY |
119: |---|---|---|---|
120: | minimalist, calm, editorial, "quiet like Linear" | 5–6 | 3–4 | 2–3 |
121: | premium consumer, brand-led, "feels expensive" | 7–8 | 5–7 | 3–4 |
122: | agency, portfolio, experimental, award-bait | 9–10 | 7–9 | 3–4 |
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SHELEG_DESIGN.md`

External-method enrichment owned by this outcome. SHA256: `5e73a5e569b0fd1556ce63ff85814cea2032e04d457d1e3f928b020594eb366a`

```text
1: # SHELEG Design
2:
3: A motion-and-particle interface system, reverse-engineered from the Nicegram
4: Business OS landing page. This document captures *how* the page reaches its
5: level — the layout discipline, the scroll narrative, the WebGL particle field,
6: the DOM choreography, and the registration tricks that fuse them — so you can
7: build new sites on the same principles and understand *why* each piece works.
8:
9: > SHELEG Design is the **motion + systems** layer. It assumes a **visual**
10: > system already exists (color, type, elevation, components) — that half lives
11: > in the style packs under [`styles/`](./styles/), one of which
12: > (`instrument-console`) is the near-black aerospace console this document's
13: > reference implementation used. Pick a pack, implement its
14: > `styles/tokens/<pack>.css` verbatim, then layer SHELEG Design on top.
15: > Where a pack's motion tokens differ from the defaults in §10, **the pack
16: > wins** — it is the visual contract.
17:
18: > **Every `**Reference file:**` path below belongs to the reference
19: > implementation, not to your project.** `src/lib/motion/scroll-progress.ts` and
20: > its siblings do not exist until you write them, and none of them ships with
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сделать dials необязательной shorthand, основной контракт — reference anchors + наблюдаемые targets конкретного сценария: reading width, CTA reachability, visible alternatives, keyboard state, deliberate empty-space purpose. Для сохранения identity motion не повышать автоматически. Для числа указывать example/counterexample или выводить его из принятого direction, а не закреплять до первого рендера.

Уточнение XD-07: Согласовать с отдельным VD-06 redesign dials; не создавать второй owner той же задачи.
Сослаться на focused references только для нужной задачи.
Назвать dials preference hints, добавить observed anchors вместо claims об измерении качества.
Развести invariant token contract и открытый composition choice, не запрещая существующую систему.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Два независимых исполнителя по одному brief должны объяснить через одинаковые наблюдаемые признаки, что означает density/variance. Число без anchors не считается evidence. Проверить quiet dashboard, consumer chat и accessibility-large-text: одинаковая цифра не подменяет разные платформенные задачи.
Вход не заставляет загрузить все новые refs.
В конкуренции с brief побеждает явное требование пользователя, а не dogmatic style floor.
Вход не заставляет загрузить все новые refs.
В конкуренции с brief побеждает явное требование пользователя, а не dogmatic style floor.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-VD-01.01` (data): Калибровочные renders берутся из реальных вариантов direction exploration.
- `FIX-VD-01.02` (data): Калибровочные renders берутся из реальных вариантов direction exploration.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-06.01.json), [parent](../parents/FIX-VD-06.json). Полный audit не required prompt input.
