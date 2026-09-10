# FIX-SE-02.01 — Любая manual action объявлена обнулением всех улучшений сайта

Parent `FIX-SE-02` · implementation · P1

## Что и зачем

Любая manual action объявлена обнулением всех улучшений сайта

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
178: impact reach the findings table.
179:
180: **Order matters.** A track-A blocker (site not fetchable, noindex in the
181: pre-render source, manual action) makes every other finding moot — a manual
182: action is a binary multiplier: nothing you improve counts until it is lifted.
183: Work A → B → C before spending time on F/G.
184:
185: **Evidence ladder** — ordered by **evidence strength, not convenience**, from
186: server logs down to a manual fetch; the rungs and their routing are in
187: [tooling.md](references/tooling.md). Use the highest rung you can actually reach
188: and state which one a finding rests on. A public-only audit with no property
189: access is valid work, but its indexation and query findings are inferences rather
190: than observations, and get tiered accordingly.
191:
192: **Seven scripts ship with the skill** — `preflight.py`, `gsc_pull.py`,
193: `page_audit.py`, `url_inspection.py`, `agent_surface.py`, `psi_pull.py` and
194: `sitemap_audit.py`. Their invocations, and the **four traps that decide whether a
195: finding is real** — rendered vs server HTML, the JSON array shape, truncation
196: dropping count-based findings, and the evidence tier that enters triage where
197: severity does not — are in [scripts.md](references/scripts.md).
```

Тестовый artifact: `repo://seo-aeo-audit/test/audit_regressions/fix-se-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Записывать action type, affected URL patterns, surface, severity и scope. Приоритет устранения нарушения сохранять, блокировать зависимые действия только в затронутой области.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SE-02.01.json), [parent](../parents/FIX-SE-02.json). Полный audit не required prompt input.
