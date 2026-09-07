# FIX-VD-04.01 — shadcn назван unstyled: token mapping ошибочно подаётся как достаточное отсутствие чужой визуальной системы

Parent `FIX-VD-04` · implementation · P2

## Что и зачем

shadcn назван unstyled: token mapping ошибочно подаётся как достаточное отсутствие чужой визуальной системы

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

implementation; exact local source path. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
233: that already has a component layer has already answered, and migrating one on
234: taste is not a design decision.
235:
236: **Why it composes rather than competes.** `shadcn/ui` is not a theme. It is
237: unstyled primitives plus Tailwind, themed through CSS custom properties — so it
238: *consumes* a token layer instead of bringing its own look. That is exactly the
239: seam a pack is: the pack decides what `--bg` means, the kit decides what a
240: `DropdownMenu` is.
241:
242: **The two vocabularies are different, and this is the trap.** The packs resolve
243: `--bg` and `--ink` everywhere and little else by that name; `shadcn/ui` expects
244: `--background`, `--foreground`, `--primary`, `--muted` and the rest of its own
245: contract. **Map them explicitly in the pack's token file** — an undefined custom
246: property does not error, it silently falls back, which is the same failure the
247: chart rule above exists for. A kit mounted without that mapping renders in its
248: starter palette and looks like nobody chose anything.
249:
250: **The boundary — product UI, not the cinematic surface.** Dashboards, admin
251: panels, internal tools, chat and agent interfaces: yes, and the answer is yes by
252: default. A scroll-driven landing page: **no** — there are no controls to reuse
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Описать shadcn как редактируемые styled components, использующие headless primitives. Выделить adapter contract: semantic color + geometry + density + typography + elevation + state/anatomy. После token remap обязательно сравнить rendered component matrix с выбранным direction. Не объявлять custom component edits автоматически redesign.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

В fixture взять Card/Button/Dialog одной версии shadcn, применить pack и проверить не только цветовые variables, но вычисленные размеры, padding, radius, shadow, fonts, states. Список намеренно сохранённых defaults должен быть явным. Документация dependency подтверждается https://ui.shadcn.com/docs; version/checked date фиксируются.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-04.01.json), [parent](../parents/FIX-VD-04.json). Полный audit не required prompt input.
