# FIX-VD-02.01 — Actionable render critique

Parent `FIX-VD-02` · implementation · P1

## Что и зачем

Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера

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
123: justification backwards. Three to five criteria, each one *checkable by someone
124: who did not build either variation*, and each one traceable to the brief's Job or
125: Falsifier.
126:
127: A usable rubric line looks like *"the primary action is reachable without
128: scrolling at 1280×800"* or *"the type scale uses at most five distinct sizes"* —
129: not *"feels more premium"*.
130:
131: ### When to fork
132:
133: Fork when **all three** hold:
134:
135: 1. the lane has both a credible family answer and a credible outside one,
136: 2. the brief is genuinely under-determined — two defensible directions exist,
137: 3. the surface is worth it: a landing page, a hero, a product's main screen, a
138:    visual language being set for the first time.
139:
140: ### When NOT to fork
141:
142: A token change. A spacing fix. A bug. A surface with a locked design system,
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Критика привязана к image region, observable defect, intended change; clean result допустим, нет quota findings.

Уточнение ADOPT-M-10: Линзы visual critique применяются по brief; observed render, субъективное суждение и source CSS — разные evidence. Clean-stop и budget обязательны; нет квоты дефектов, универсального ratio или automatic brand P1.
Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Линзы visual critique применяются по brief; observed render, субъективное суждение и source CSS — разные evidence. Clean-stop и budget обязательны; нет квоты дефектов, универсального ratio или automatic brand P1.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Generic premium/generic фразы без region не acceptance; valid no-action останавливает loop.
Sameflowvisualalternatives remainvalid; missingbrand=NOT_ASSESSED; no fabricateddefectoncleanrender; strictconstraints gatebefore softwinner.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-02.01.json), [parent](../parents/FIX-VD-02.json). Полный audit не required prompt input.
