# FIX-SE-04.01 — Тип источника автоматически подменяет силу конкретного утверждения

Parent `FIX-SE-04` · implementation · P2

## Что и зачем

Тип источника автоматически подменяет силу конкретного утверждения

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Диагностика публичных web surfaces для поиска и извлечения.

Вход: public URLs, crawl/render evidence, claims. Выход: scoped findings, applicability и source attribution.

Граница: Рекомендация поисковой системы не универсальный gate; absence of production effect не стирает наблюдаемый механизм.


## Exact targets и source окна

### Edit `repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/tooling.md`

implementation; exact local source path. SHA256: `4d84dca7aacf06cc4c486f2c87ce93fd0577f028c7979aeea2d1a988c8d8a7a7`

```text
40: | 1 · server logs | `CONFIRMED` | the fetch happened; the line is the observation |
41: | 2 · Search Console / Bing / Yandex Webmaster | `CONFIRMED` | the engine's own answer about your property |
42: | 3 · full crawl | `CONFIRMED` for what the crawler *saw* (a directive, a status code, a link) · `STUDY` for anything it *models* (internal PageRank, "orphan candidates") | a crawler observes markup and infers structure; the two are different claims |
43: | 4 · field performance (CrUX, RUM) | `CONFIRMED` for the distribution it reports · never for a cause | it measures users, not the reason |
44: | 5 · third-party indices | `STUDY`, and no higher — two indices agreeing is a stronger `STUDY`, not a `CONFIRMED` | a panel estimate about someone else's property |
45: | 6 · manual fetch + DevTools | `CONFIRMED` for what the response contains (header, source, rendered DOM) · `HYPOTHESIS` for what it implies about indexing | the lowest rung by *breadth*, not by reliability: one page seen exactly |
46:
47: Rung 6 sitting at the bottom is about coverage, not truth. A `view-source` showing
48: `noindex` is `CONFIRMED` — `evidence-tiers.md` names an HTTP response and a
49: rendered DOM as CONFIRMED-grade observations — while "therefore the page is not
50: indexed" is an inference that rung 2 settles in one call.
51:
52: **A public-only audit** (no property access at all) is capped at `STUDY` by rung 5,
53: which is what `SKILL.md` step 1 says. It cannot answer "why is this page not
54: indexed" at any tier, because no rung it can reach observes the index.
55:
56: **Rung 1 does not exist on most hosted platforms.** Shopify, Wix, Squarespace and
57: comparable SaaS hosts expose no raw access logs, so a crawl-budget question there
58: starts at rung 2 and the finding is capped there. Say that in the report instead
59: of presenting a crawler's URL count as crawl data — a crawler tells you how many
```

### Edit `repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/evidence-tiers.md`

implementation; exact local source path. SHA256: `f8371be735bad646b273874f5f4dee2d92fccb4335054d12a0f93e7106bac546`

```text
25:
26: | Tier | Definition | Allowed action | Uncertainty rank |
27: |---|---|---|---|
28: | **CONFIRMED** | Documented by the engine, or reproduced on this site with an observation you can point at (GSC output, log line, HTTP response, rendered DOM) | Ship it. Blockers of this tier come first. | 1.0 |
29: | **STUDY** | Published multi-site data with a stated method and sample size | Ship it where the site matches the study population; state the source and sample in the report | 0.7 |
30: | **FIELD** | A single practitioner case, one site, no control | Pilot on one template or a page cohort; measure before rollout | 0.4 |
31: | **HYPOTHESIS** | Mechanism plausible, evidence absent or contradictory | Experiment only, with a control group; never sitewide, never sold as a fix | 0.2 |
32:
33: ## Rules
34:
35: 1. **Never let a lower tier outrank a higher-tier blocker.** An interesting
36:    HYPOTHESIS does not get engineering time while a CONFIRMED indexation blocker
37:    is open.
38: 2. **Cite the observation, not the authority.** "Vendor X says schema helps" is
39:    not a tier. "URL Inspection shows the user-declared canonical as `None` on
40:    template Y, screenshot dated 2026-07-28" is CONFIRMED.
41: 3. **Downgrade on conflict.** When two credible studies disagree (as they do on
42:    serving Markdown to AI crawlers), the claim drops to HYPOTHESIS and moves to
43:    the experiment list — you do not pick the flattering one.
44: 4. **Engine statements are evidence about intent, not always about behavior.**
```

### Edit `repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md`

implementation; exact local source path. SHA256: `931e0b18c21d7822a918003a119ea1ca4a3c4a4c2a8aa0dfd9dc0f005d3a5e10`

```text
239:
240: 1. **Blockers** — indexation, penalties, hijacks, revenue pages unreachable.
241: 2. **Leaks** — crawl budget, equity, cannibalization, read-budget waste.
242: 3. **Gains** — intent fit, information gain, extractability, entity consensus.
243: 4. **Experiments** — anything below CONFIRMED that deserves a split test rather
244:    than a rollout. Design them per
245:    [references/experiments.md](references/experiments.md); never roll a
246:    HYPOTHESIS sitewide.
247:
248: ## Step 4 — Deliverables
249:
250: Write these files, seeded from the skeletons in
251: [references/deliverable-templates.md](references/deliverable-templates.md).
252: Never overwrite an existing audit or plan silently — write a new dated file, or
253: ask first:
254:
255: - `docs/seo/audit-<YYYY-MM-DD>.md` — findings, each carrying its **evidence rung**,
256:   which is the source the observation came from and caps its tier
257:   ([tooling.md](references/tooling.md)).
258: - `docs/seo/plan-<YYYY-MM-DD>.md` — the change plan: an exact target per change,
```

Тестовый artifact: `repo://seo-aeo-audit/test/audit_regressions/fix-se-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разнести source quality, directness, population scope, causal support и uncertainty. Политика rollout определяется риском действия и доказательством эффекта; не blanket рангом поставщика.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SE-04.01.json), [parent](../parents/FIX-SE-04.json). Полный audit не required prompt input.
