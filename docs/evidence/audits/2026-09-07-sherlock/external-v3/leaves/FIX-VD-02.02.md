# FIX-VD-02.02 — Bounded rerender comparison

Parent `FIX-VD-02` · implementation · P1

## Что и зачем

Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`

implementation; exact local source path. SHA256: `245951a4a3adc9f52566b13cbb35b7e9548200e6d04fbf59a857502c4a442bf2`

```text
123: justification backwards. Three to five criteria, each one *checkable by someone
124: who did not build either variation*, and each one traceable to the brief's Job or
125: Falsifier.
126:
127: A usable rubric line looks like *"the primary action is reachable without
128: scrolling at 1280×800"* or *"the type scale uses at most five distinct sizes"* —
129: not *"feels more premium"*.
130:
131: ### When to fork
132:
133: Fork when **all three** hold:
134:
135: 1. the lane has both a credible family answer and a credible outside one,
136: 2. the brief is genuinely under-determined — two defensible directions exist,
137: 3. the surface is worth it: a landing page, a hero, a product's main screen, a
138:    visual language being set for the first time.
139:
140: ### When NOT to fork
141:
142: A token change. A spacing fix. A bug. A surface with a locked design system,
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

implementation; exact local source path. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
158: Designer 2026*, n=906): **visual polish 58% · thoughtful problem solving 47% ·
159: clear intuitive UX 36% · emotion and delight 35% · consistency 15%.** Read that
160: as a definition of done, in that order:
161:
162: 1. **Polish** — the pack applied without exception: tokens, not literals; no
163:    ad-hoc hex, radius or font size anywhere in the diff.
164: 2. **Systems thinking** — the visual decision lives in one place (the token
165:    layer, the `SCENES` registry) and everything else reads it.
166: 3. **Clear UX** — structure and behavior are not this skill's half; if the
167:    flows and states aren't decided, stop and decide them first.
168: 4. **Emotion** — earned motion only (principle 4), and never at the cost of 1–3.
169: 5. **Consistency** — one ease, one duration set, one accent, one atom per job
170:    across every screen.
171:
172: ## Load on demand — three things the pack layer does not decide
173:
174: - **Scene depth — six layers** ([`SURFACE_COMPOSITION.md`](./SURFACE_COMPOSITION.md)),
175:   before writing CSS for a cinematic page. A scene has planes; everything on one
176:   plane is the failure no amount of easing repairs.
177: - **Charts — the role contract in the same file, plus the `dataviz` handoff
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-02.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Same content/viewport; ограниченный budget, unresolved choice surfaced; mechanical checks отдельно от craft.

Уточнение XD-04: Fresh subagent optional; последовательный независимый pass разрешён имеющимися средствами.
Встроить ссылки в Act3/5, не дублируя основной pipeline и не перезаписывая принятую узкую рекомендацию.
До mechanical results сделать visual read: focal order, hierarchy, density, typography, intentional detail; дать keep/change с evidence.
После fix проверить ту же матрицу: resolved/partial/unresolved и регрессии; quality judgment отделить от compliance/functional result.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Before/after сохраняют scenario, no endless polish; PNG presence не quality PASS.
Токены PASS + одинаковая скучная композиция не дают автоматически craft PASS.
Для already-chosen direction доступен один critique pass без обязательного fork.
Budget exhaustion оставляет unresolved, не переименовывает его в ship.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-VD-02.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-02.02.json), [parent](../parents/FIX-VD-02.json). Полный audit не required prompt input.
