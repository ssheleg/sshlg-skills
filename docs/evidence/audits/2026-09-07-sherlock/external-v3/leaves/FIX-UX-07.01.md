# FIX-UX-07.01 — Locale-independent IDs

Parent `FIX-UX-07` · implementation · P2

## Что и зачем

Язык vision и обязательный формат заголовков не согласованы на входе

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/vision/SKILL.md`

implementation; exact local source path. SHA256: `21bb12c216af4a6e9d49b4712ab036731a51fd9e9124f5892dd8274832661f40`

```text
64: the product well enough to write its vision — go back to step 0.
65:
66: ## Step 2 — write `docs/ux/vision.md` in nine layers
67:
68: Every layer is mandatory. Write in the project's documentation language.
69:
70: **1. Essence.** One sentence. `[Product] is [type of system] that changes how
71: [user] [does X]`. No feature names, no UI, no technology. The test: *if the
72: product were rebuilt from scratch on a different stack, would this sentence
73: still be true?* If not, it names an implementation, not an essence.
74:
75: **2. Core idea.** Not a problem statement — an observation about the world.
76:
77: ```
78: [X] is abundant.
79: [Y] is scarce.
80: → this product bridges the gap.
81: ```
82:
83: One observation, not a list. "Information is abundant, clarity is scarce."
```

### Edit `repo://super-ux/plugins/super-ux/skills/ux-scenarios/references/scenario-format.md`

implementation; exact local source path. SHA256: `9017a498b260aeb5d42c6ada422a4ee663491ab50485c0f6787aba7e220fdc6b`

```text
160: Optional, and owned by the `vision` skill. Present or absent, never partial:
161: a vision missing its anti-vision is the one shape that reliably settles no
162: argument.
163:
164: **Nine sections, these headings, in this order.** The linter keys off them.
165:
166: ```markdown
167: # <Product> — Vision
168:
169: **Status:** draft | approved
170: **Last reviewed:** YYYY-MM-DD
171:
172: ## 1. Essence
173: ## 2. Core idea
174: ## 3. What the system does
175: ## 4. The user's role
176: ## 5. Principles
177: ## 6. Anti-vision
178: ## 7. Horizon
179: ## 8. The one sentence
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Машинная identity секций стабильна; display title локализуем. Не требовать английского prose ради parser.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Русский vision сохраняет все 9 IDs, missing anti-vision FAIL.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-07.01.json), [parent](../parents/FIX-UX-07.json). Полный audit не required prompt input.
