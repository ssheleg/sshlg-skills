# ADOPT-M-11.01 — Добавитьstandards-vs-heuristics a11yreference

Parent `ADOPT-M-11` · implementation · P2

## Что и зачем

Добавитьstandards-vs-heuristics a11yreference

Конкретная реализация приведена в шагах ниже.

## Решения

A11y reference различает WCAG criterion/version/level/units/exceptions и design heuristics. Browser screenshot не доказывает DOM/assistive technology behavior. Проверки по доступным tools, без автоматической установки axe.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Create `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/references/accessibility-evidence.md`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/adopt-m-11.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: A11y reference различает WCAG criterion/version/level/units/exceptions и design heuristics. Browser screenshot не доказывает DOM/assistive technology behavior. Проверки по доступным tools, без автоматической установки axe.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

18pxnormal at3:1 FAIL;24pxnormalboundary;24pxtargetAAcase≠44enhancedcase; absentATNOT_RUN; noautoinstallaxe.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-11.01.json), [parent](../parents/ADOPT-M-11.json). Полный audit не required prompt input.
