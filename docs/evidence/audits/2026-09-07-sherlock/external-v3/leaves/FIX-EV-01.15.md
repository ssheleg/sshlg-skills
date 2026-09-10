# FIX-EV-01.15 — Outcome corpus: seo-aeo-audit

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Диагностика публичных web surfaces для поиска и извлечения.

Вход: public URLs, crawl/render evidence, claims. Выход: scoped findings, applicability и source attribution.

Граница: Рекомендация поисковой системы не универсальный gate; absence of production effect не стирает наблюдаемый механизм.


## Exact targets и source окна

### Create `repo://seo-aeo-audit/evals/cases/seo-aeo-audit.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://seo-aeo-audit/test/audit_regressions/fix-ev-01.15.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

SE-01: Рекомендации Discover превращены в обязательный gate — Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.

SE-02: Любая manual action объявлена обнулением всех улучшений сайта — Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.

SE-03: Cross-track проверка объявляет совместимые наблюдения противоречием — Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.

SE-04: Тип источника автоматически подменяет силу конкретного утверждения — Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.

EV-01: Проверка выбора названия не доказывает пользу выполнения скилла — Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для seo-aeo-audit записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; seo-aeo-audit не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.15.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
