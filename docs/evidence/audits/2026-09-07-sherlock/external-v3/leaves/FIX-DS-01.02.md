# FIX-DS-01.02 — Rendered pack comparison

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

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сравнивать один компонент/контент/viewport через adapters, сохранить geometry/state differences.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Смена pack меняет ожидаемые semantics; отсутствие adapter не объявляется готовым comparison.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-DS-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-01.02.json), [parent](../parents/FIX-DS-01.json). Полный audit не required prompt input.
