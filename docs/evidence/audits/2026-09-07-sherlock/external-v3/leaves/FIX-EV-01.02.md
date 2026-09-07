# FIX-EV-01.02 — Outcome corpus: brand-voice

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Create `repo://super-ux/evals/cases/brand-voice.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ev-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

UX-01: B030 не доказывает происхождение утверждения — Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.

UX-02: B051 объявляет спамом текст без единого повторения — 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

UX-03: Humanization «никогда не блокирует» расходится с исполняемым B060 — Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для brand-voice записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; brand-voice не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.02.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
