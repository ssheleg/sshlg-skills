# FIX-DV-13.02 — Mode-specific examples

Parent `FIX-DV-13` · implementation · P2

## Что и зачем

Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md`

implementation; exact local source path. SHA256: `dd8e5b7a38bb1b7af080f0fe4ad896025875665b7d1df8dcb6824f55cc44e4d6`

```text
18: - [Verification](#verification)
19:
20: ## Status check — 2026
21:
22: Consent Mode v2 has been required since **March 2024** for anyone using Google
23: advertising products with EEA or UK traffic, and by 2026 Google additionally
24: expects a **certified CMP** from the Consent Management Platform programme —
25: a hand-rolled banner that sets the signals correctly is no longer sufficient on
26: its own for Google's ad products. Verify your CMP's certification status before
27: treating this box as ticked. *(Checked 2026-08-06.)*
28:
29: ## Advanced vs Basic Mode
30:
31: | Mode | Tags load before consent? | Cookieless pings? | Conversion modeling? |
32: |------|--------------------------|-------------------|---------------------|
33: | **Basic** | No — tags blocked until consent granted | No | No |
34: | **Advanced** | Yes — tags load with denied defaults | Yes | Yes (recovers ~65-70% of lost data) |
35:
36: **Always prefer Advanced mode** — it allows Google to model conversions from users who deny
37: consent without storing any cookies or identifying individuals.
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-13.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Basic и Advanced моделировать как разные технические contracts, выбранные policy.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Fixture каждого режима сохраняет его pre-consent behavior, нет смешанного waterfall.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-DV-13.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-13.02.json), [parent](../parents/FIX-DV-13.json). Полный audit не required prompt input.
