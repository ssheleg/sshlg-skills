# FIX-SE-01.01 — Рекомендации Discover превращены в обязательный gate

Parent `FIX-SE-01` · implementation · P1

## Что и зачем

Рекомендации Discover превращены в обязательный gate

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Диагностика публичных web surfaces для поиска и извлечения.

Вход: public URLs, crawl/render evidence, claims. Выход: scoped findings, applicability и source attribution.

Граница: Рекомендация поисковой системы не универсальный gate; absence of production effect не стирает наблюдаемый механизм.


## Exact targets и source окна

### Edit `repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md`

implementation; exact local source path. SHA256: `931e0b18c21d7822a918003a119ea1ca4a3c4a4c2a8aa0dfd9dc0f005d3a5e10`

```text
159: third-party "agent-readiness score" is a checklist generator rather than a target:
160: [agent-readiness.md](references/agent-readiness.md).
161:
162: **Discover is not one of the ten tracks, and it is not part of track A.** It has
163: its own ranking pass, its own gate (two metatags, without which no card renders at
164: all) and its own freshness curve, so a site where Discover is a material traffic
165: source needs [discover.md](references/discover.md) run as an eleventh pass — and a
166: site where it is not can skip it entirely. Check the GSC Discover report before
167: deciding.
168:
169: **Before any decline diagnosis**, run the date-alignment and update-response
170: protocol in [references/algorithm-updates.md](references/algorithm-updates.md) —
171: "a core update hit us" is not a finding, and half the documented GSC outages
172: coincided with rollouts.
173:
174: Each track has two halves: the **diagnostic** work and a **mechanical sweep** for
175: completeness — [technical-checks.md](references/technical-checks.md) §A3 for A/B,
176: [onpage-checks.md](references/onpage-checks.md) for D/E. Diagnose first; the sweep
177: catches the boring failures afterwards, and only sweep items with an observable
178: impact reach the findings table.
```

### Edit `repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/references/discover.md`

implementation; exact local source path. SHA256: `28cce435029bccd0b68c1c20a74f5382d2dfe4beac34cfa6d63ad1e510649f98`

```text
143: # 4. freshness — is anything being published at all
144: curl -s "$URL" | grep -oE 'datePublished"[^,]+|article:published_time[^>]+'
145: ```
146:
147: Findings route into the report like any other: gate failures are CONFIRMED
148: blockers, the SDK-derived items are FIELD and belong in the pilot column of the
149: change plan, not in the blocker list.
150:
151: ## What not to promise
152:
153: Discover traffic is volatile by design and it is not a keyword surface — there
154: is no query to rank for, no position to track, and week-to-week swings of a
155: large factor are normal for sites that are working correctly. A plan that
156: projects Discover traffic like organic search is projecting something that does
157: not behave like organic search. Fix eligibility, publish, and report the
158: distribution rather than a number.
```

Тестовый artifact: `repo://seo-aeo-audit/test/audit_regressions/fix-se-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Три отдельные проверки: eligibility, large preview permission (с альтернативой AMP), image selection recommendation. SDK reverse engineering оставить FIELD, без бинарного вывода о допуске.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SE-01.01.json), [parent](../parents/FIX-SE-01.json). Полный audit не required prompt input.
