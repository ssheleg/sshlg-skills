# FIX-DS-05.01 — No-JS критерий применяется ко всем поверхностям, включая внутренние UI

Parent `FIX-DS-05` · implementation · P2

## Что и зачем

No-JS критерий применяется ко всем поверхностям, включая внутренние UI

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`

implementation; exact local source path. SHA256: `245951a4a3adc9f52566b13cbb35b7e9548200e6d04fbf59a857502c4a442bf2`

```text
28: is the one that costs something:
29:
30: | | |
31: |---|---|
32: | **Surface** | landing / hero, product UI, mobile screen, agent interface, deck-as-page |
33: | **Job** | what the person who lands here must be able to do, in their words |
34: | **Constraint** | the thing that is not negotiable — a brand, a stack, a deadline, an existing system |
35: | **Falsifier** | **what would prove this design failed**, stated so that it could actually happen |
36:
37: A falsifier is not "it looks bad". It is *"a first-time visitor cannot say what
38: this product does after five seconds"*, *"the primary action is below the fold on
39: a 13-inch laptop"*, *"the dashboard's densest table needs horizontal scrolling at
40: 1280px"*. If you cannot write one, the brief is a mood and the rest of this
41: document cannot help you.
42:
43: **Where the brief comes from, in order of preference.** If `super-ux` is
44: installed and the project keeps a UX scenario base — `/ux` reports whether it
45: does and where — the Job line is **traced to a scenario id**, not invented, and a
46: design that answers no scenario is the first finding, before any visual work. No
47: scenario base: offer `/ux` once, then proceed with the brief written here and say
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Applicability predicates на каждую проверку: public-web-crawlable → no-JS content, web-internal → loading/error/accessibility, native → platform semantics. В отчёте NOT_APPLICABLE с причиной, а не PASS без запуска.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-05.01.json), [parent](../parents/FIX-DS-05.json). Полный audit не required prompt input.
