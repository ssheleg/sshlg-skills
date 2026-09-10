# FIX-DV-17.01 — FCP ошибочно объявлен неизмеримым в поле

Parent `FIX-DV-17` · implementation · P2

## Что и зачем

FCP ошибочно объявлен неизмеримым в поле

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/frontend-performance/SKILL.md`

implementation; exact local source path. SHA256: `2116f5413396c6c00867e3b2c0cd523d3047793642e2077a24eebc63bcc9d385`

```text
27: 5. **Validate** -- `next build` (or framework equivalent) + re-run Lighthouse. Verify no regressions.
28:
29: ## Core Web Vitals, and the diagnostics beside them
30:
31: **Three metrics are Core Web Vitals. The other three are not**, and the difference
32: is not pedantry: only the first three are what Google reports and ranks on, and
33: only they are field-measurable. TBT is a *lab* metric — web.dev says it "is not
34: part of the Core Web Vitals set because they are not field-measurable" — and it
35: stands in for INP when you have no field data. Telling a client their Speed Index
36: is a failing Core Web Vital is telling them about a thing Google does not measure.
37:
38: | Core Web Vital | Good | Needs Work | Poor |
39: |--------|------|------------|------|
40: | LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s |
41: | INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
42: | CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
43:
44: | Lab diagnostic | Good | Needs Work | Poor | Stands in for |
45: |--------|------|------------|------|---|
46: | FCP (First Contentful Paint) | < 1.8s | 1.8-3.0s | > 3.0s | early LCP signal |
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-17.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить две независимые оси: CWV/not-CWV и lab/field availability. Обязательные p75, device/cohort, period, sample size; TBT как диагностическая корреляция, не замена доказательства INP.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-17.01.json), [parent](../parents/FIX-DV-17.json). Полный audit не required prompt input.
