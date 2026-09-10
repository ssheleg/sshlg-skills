# FIX-SE-03.01 — Cross-track проверка объявляет совместимые наблюдения противоречием

Parent `FIX-SE-03` · implementation · P2

## Что и зачем

Cross-track проверка объявляет совместимые наблюдения противоречием

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
215: 3. **A finding whose evidence rung contradicts a neighbour's.** Two rows about one
216:    URL at `CONFIRMED` and `HYPOTHESIS` is a fact about the instruments, not the
217:    site; the lower rung defers or the disagreement is stated.
218: 4. **A track that returned nothing where a neighbour implies it should have.** F
219:    found no extractability problem on pages E called thin — one of the two did not
220:    look properly, and which is worth a minute now rather than a contradiction in
221:    the report.
222:
223: Write the answer either way: `Cross-track: clean`, or the pairs with their
224: rulings. A check whose silence is indistinguishable from not having run is not
225: evidence — and this is the one most easily skipped, because every track
226: individually went green.
227:
228: Then order every finding. Do not present an unranked list.
229:
230: **Four axes, no scalar** — the first that separates two findings decides, in
231: this order: `impact` · `irreversibility` · `uncertainty` · `coordination`.
232: `effort` is recorded and never ranks. A product cannot be argued with on its
233: inputs; an axis can. Definitions:
234: [`deliverable-templates.md`](references/deliverable-templates.md).
```

Тестовый artifact: `repo://seo-aeo-audit/test/audit_regressions/fix-se-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сравнивать claim key=(subject,predicate,scope,time,instrument). Противоречие возникает только для несовместимых значений одного predicate; независимые аспекты сохранять.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SE-03.01.json), [parent](../parents/FIX-SE-03.json). Полный audit не required prompt input.
