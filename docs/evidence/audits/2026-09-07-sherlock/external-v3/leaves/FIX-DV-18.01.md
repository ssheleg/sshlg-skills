# FIX-DV-18.01 — Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев

Parent `FIX-DV-18` · implementation · P2

## Что и зачем

Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев

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
62: - **Remove unused preconnects** -- If fonts are self-hosted, `preconnect` to font CDNs is dead weight.
63:
64: ### JavaScript (TBT, FCP, LCP)
65:
66: - **Code split aggressively** -- Lazy-load below-the-fold sections. Only hero + nav in initial bundle.
67: - **Defer third-party scripts** -- GA, analytics, chat widgets load after interactive (`afterInteractive` or `defer`).
68: - **Target modern browsers** -- Set `browserslist` to avoid shipping polyfills for `Array.prototype.at`, `Object.fromEntries`, etc.:
69:   ```
70:   last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions, last 2 Edge versions
71:   ```
72: - **Tree-shake imports** -- Named imports only. No `import * as`.
73: - **Analyze bundles** -- Use `@next/bundle-analyzer`, `source-map-explorer`, or `vite-plugin-visualizer`.
74:
75: ### CSS & Animations (CLS)
76:
77: - **Composite-only animations** -- Only animate `transform` and `opacity` (GPU-composited). Never animate `background-position`, `width`, `height`, `top/left`, `margin`, `padding`.
78: - **Use `will-change` sparingly** -- Add `will-change: transform` or `will-change: filter` only on elements that actually animate.
79: - **Inline critical CSS** -- Framework should handle this (Next.js does automatically).
80: - **Avoid layout shifts** -- Set explicit `width`/`height` on images and embeds. Reserve space for dynamic content.
81:
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-18.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Перед изменением проверить performance trace и сценарии, browser support contract, accessibility owner. CSP origins одобрять по функциональной необходимости; semantic headings по структуре; lazy-load по измеренному waterfall.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-18.01.json), [parent](../parents/FIX-DV-18.json). Полный audit не required prompt input.
