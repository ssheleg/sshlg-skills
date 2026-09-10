# FIX-UX-10.01 — Loading из существующей задержки превращён в инсценировку вычисления

Parent `FIX-UX-10` · implementation · P1

## Что и зачем

Loading из существующей задержки превращён в инсценировку вычисления

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/references/funnel-research.md`

implementation; exact local source path. SHA256: `21db211ef0bd9f11bd09bb7d234cc976d00686ea1aeb085ac57c676e3c53a802`

```text
188: | Step | Its job | Where it is specified |
189: |---|---|---|
190: | Landing | Pick up the ad's exact promise and move the visitor into the quiz | BP-116, BP-117 |
191: | Quiz | Build commitment, and collect the few answers the offer repeats | BP-002, BP-143, BP-211 |
192: | Loading | A calculated pause that makes the result feel computed for this person | BP-005 |
193: | Offer | The answers come back as a plan, wording branched, price not | BP-010, BP-211 |
194: | Paywall | Tiers, what is included, the trial, the anchor unit | BP-118, BP-022, BP-070 |
195: | Checkout | The smallest identity that unblocks the purchase, total visible before the last step | BP-119, BP-120 |
196: | Success | Confirmation, and the handoff into the product | BP-125, BP-215 |
197:
198: Every one of those steps is a screen in `screens.md` and a scenario in
199: `scenarios.md`, including the loading screen and including the branch where the
200: quiz answer is missing. A step that exists in the build and not in the record is
201: the drift the chain exists to prevent.
202:
203: ## What this method cannot do
204:
205: Stated so the output is not read as more than it is.
206:
207: - **It cannot rank funnels by profit.** Every signal is spend. A competitor
```

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md`

implementation; exact local source path. SHA256: `e0dcfdb6bf395662b2c81c32b8ecaad6c2059bebe62e6a8c75537834d790ff91`

```text
157: - **Apply when:** designing post-paywall/post-signup experience.
158: - **Tags:** post-paywall, onboarding, activation, retention, personalization
159: - **Source:** [48Laws] L4
160:
161: #### BP-005: Loading screens that sell, not spin
162: - **Do:** replace generic loaders before the paywall with value messaging, social proof, or personalized copy.
163: - **Why:** primes intent in dead time; excited users convert better.
164: - **Apply when:** any loading/preparation moment exists before a conversion point.
165: - **Tags:** onboarding, paywall, social-proof, conversion
166: - **Source:** [48Laws] L5
167:
168: #### BP-006: Social proof early in onboarding
169: - **Do:** show "X people use this", press mentions, testimonials during onboarding; personalize testimonials to the user's stated goal when possible.
170: - **Why:** users are still evaluating; trust cues lower perceived risk.
171: - **Apply when:** onboarding of an evaluating (not yet committed) user.
172: - **Tags:** onboarding, social-proof, trust, conversion
173: - **Source:** [48Laws] L6
174:
175: #### BP-007: Use the user's name early
176: - **Do:** capture first name early and surface it in the next screens ("Let's get you started, [Name]").
```

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md`

implementation; exact local source path. SHA256: `08fee3fa580918356d6d3c398948413144cf60e45274ec78d50a0e44500b6d58`

```text
60: producing (ad → landing → quiz → loading → offer → paywall → checkout →
61: success) and the practice that specifies each step, which is the diagram this
62: skill draws. Every step there is a screen in `screens.md` and a scenario in
63: `scenarios.md`, **the loading screen and the missing-answer branch included** —
64: those two are the ones that get built and never recorded.
65:
66: **Position in the chain:** foundation (WHY) → **flows (HOW) + screens (UI
67: map)** → scenarios (WHAT). Stories in, flows and screens out; `ux-scenarios`
68: then covers every node and edge with scenarios. If foundation is missing on
69: a non-trivial product, recommend `ux-foundation` first. The chain's opt-out
70: is spoken: **"no scenarios"** / **«без сценариев»** from the operator
71: declines it — design without the chain and say so.
72:
73: **Money moments are first-class flows:** when the foundation declares a
74: Monetization section, design dedicated flows for each money moment —
75: paywall (first-session placement, BP-069), upgrade-at-limit (the gated
76: action's limit branch is a flow edge to the offer, BP-074), trial start/end,
77: cancel + winback (BP-123), rating prompt after success moments (BP-076).
78: When the foundation's purchase surface is web checkout or web2app, the web
79: funnel (landing → pricing → signup → checkout, BP-116..121), recurring
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-10.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Loading только при реальной асинхронной работе; показывать фактическую операцию и не задерживать готовый результат. Если narrative pause нужен продукту, назвать его честно без claims персонального анализа и измерить затраты/понимание.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-10.01.json), [parent](../parents/FIX-UX-10.json). Полный audit не required prompt input.
