# ADOPT-M-12.01 — Подключитьa11yevidence изdesignentry

Parent `ADOPT-M-12` · implementation · P2

## Что и зачем

Подключитьa11yevidence изdesignentry

Конкретная реализация приведена в шагах ниже.

## Решения

Design entry подключает a11y evidence по relevant scope через existing capability, не создаёт нового глобального router. Visual judgment не выдаётся за WCAG conformance.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

reviewed adoption target. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
1: ---
2: name: sheleg-design
3: description: Use when deciding how something LOOKS or MOVES — cinematic landing pages and hero sections, particle/WebGL, scrubbed motion, drift, dashboards, admin or internal tools, mobile screens, chat or agent interfaces, tokens, palettes, typography and the Figma border. Triggers - "design a landing" / "дизайн лендинга", "build a landing page" / "сделай лендинг", "scroll animation" / "скролл-анимация", "dashboard style" / "стиль дашборда", "design tokens, style pack" / "дизайн-токены", "light/dark theme" / "светлая/тёмная тема", "figma variables" / "переменные фигмы, фигма в код", "mobile screen" / "мобильный экран", "palette, colors" / "палитра, цвета", "typography, font" / "типографика, шрифт", "how it looks, make it prettier" / "выглядит, красиво, красивее", "visual reference" / "визуальные референсы", "investor deck as a web page" / "веб-презентация", "redesign" / "редизайн, свёрстай, вёрстка". Not for structure, copy, backend behavior, or .pptx decks.
4: license: MIT
5: compatibility: Kit/lane commands need node>=16, npx, network. Optional siblings — dataviz, shadcn, migrate-radix-to-base. Each has an in-text fallback when absent or unreachable.
6: metadata:
7:   version: 1.59.4
8: ---
9:
10: # SHELEG Design
11:
12: ## Overview
13:
14: A page feels cinematic not from many animations, but from a **single source of
15: truth** (measured scroll position) driving **many cheap, layered,
16: independently-degradable responses**. Centralize scroll into one store; layers
17: read it per frame and react in their own language. Nothing crossfades — things
18: *redeploy*. Every layer degrades to a calm static state.
19:
20: **READ FIRST, BEFORE ANY OF THE CRAFT BELOW:**
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/adopt-m-12.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Design entry подключает a11y evidence по relevant scope через existing capability, не создаёт нового глобального router. Visual judgment не выдаётся за WCAG conformance.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Linkresolves; purevisualjudgment cannot produceWCAGconformancewithoutscopedchecks.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `ADOPT-M-11.01` (data): Consumes predecessor method/fixture contract

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-12.01.json), [parent](../parents/ADOPT-M-12.json). Полный audit не required prompt input.
