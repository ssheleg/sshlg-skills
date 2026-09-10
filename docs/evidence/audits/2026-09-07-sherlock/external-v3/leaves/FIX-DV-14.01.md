# FIX-DV-14.01 — Безусловный noscript pixel противоречит consent-gated архитектуре

Parent `FIX-DV-14` · implementation · P1

## Что и зачем

Безусловный noscript pixel противоречит consent-gated архитектуре

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/ad-tracking/SKILL.md`

implementation; exact local source path. SHA256: `96e6acdec42ef2cadfe6d1d9d51380d0b1fe506e6abe496c555fd32611fdab1d`

```text
49:   Mode v2         (render only      (render only        (opt_in /
50:   (built-in)      when granted)     when granted)       opt_out)
51: ```
52:
53: **Key principle:** GA4 uses its own built-in Consent Mode v2 (defaults denied, updates on consent). All other pixels (Meta, LinkedIn, Mixpanel) use a consent-gated pattern — they are not rendered at all until the user grants consent. A shared `CustomEvent` allows dynamic consent changes without page reload.
54:
55: ---
56:
57: ## Consent
58:
59: Read `references/consent-mode.md` for all seven consent signals, Advanced vs
60: Basic mode, region-specific defaults, granular consent and GTM wiring. Consent
61: Mode v2 is **mandatory** in the EU/EEA since March 2024.
62:
63: **The order is the whole thing, and getting it wrong is invisible:**
64:
65: ```
66: 1. dataLayer init + gtag() stub
67: 2. gtag('consent', 'default', { …'denied', wait_for_update: 500 })
68: 3. restore a stored decision → gtag('consent', 'update', …)
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-14.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Генерировать snippets из исполняемых templates; noscript разрешать только по ранее сохранённому server-verifiable consent либо убрать. Исправить G/AW конфигурацию синхронно с prose.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-14.01.json), [parent](../parents/FIX-DV-14.json). Полный audit не required prompt input.
