# FIX-DS-04.01 — Duration table допускает 500ms, общий UI gate запрещает >300ms

Parent `FIX-DS-04` · implementation · P2

## Что и зачем

Duration table допускает 500ms, общий UI gate запрещает >300ms

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md`

implementation; exact local source path. SHA256: `a9b04b4df0bda4053c0b7214e2fd0a9915bf326350da84e7351e5c1a21ecf879`

```text
110: |---|---|
111: | Button press feedback | 100–160 ms |
112: | Tooltips, small popovers | 125–200 ms |
113: | Dropdowns, selects | 150–250 ms |
114: | Modals, drawers, sheets | 200–500 ms |
115: | Marketing, explanatory, scrollytelling | longer, deliberately |
116:
117: **UI motion stays at or under 300 ms.** A 180 ms select feels responsive; the
118: same select at 400 ms feels like the app is thinking. The boundary is stated
119: because a gate applies it: 300 ms is the ceiling itself and a control may sit on
120: it with a reason, 301 ms is over. **An entrance is not UI motion** and is not
121: bounded by this number — it may run longer when the value is measured off a
122: reference, provided it never gates content and the pack says which of the two
123: rules its token answers to. `--dur-reveal` at 500 ms and `--dur-fast` at 150 ms
124: are both correct; the same 500 ms on a button is not.
125:
126: Speed is not only comfort — it is perceived performance. A faster spinner makes
127: an identical load feel shorter. A tooltip that skips its delay after the first
128: one makes the whole toolbar feel quicker. Easing amplifies this: `ease-out` at
129: 200 ms reads faster than `ease-in` at 200 ms because movement starts at once.
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Единая таблица по purpose+frequency+platform с explicit exceptions и canonical duration IDs. Разделить interactive feedback, spatial modal transition и marketing entrance, убрать пересечение трактовок.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-04.01.json), [parent](../parents/FIX-DS-04.json). Полный audit не required prompt input.
