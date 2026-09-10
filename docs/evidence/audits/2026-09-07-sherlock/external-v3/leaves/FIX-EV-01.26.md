# FIX-EV-01.26 — Outcome corpus: agent-orchestrator

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Create `repo://agent-stack/evals/cases/agent-orchestrator.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-ev-01.26.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

AS-01: Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ — Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.

AS-02: Нулевой baseline путается с отсутствующим: первый реальный расход теряется — Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.

AS-03: Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию — Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.

AS-04: Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload — Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.

AS-05: Аудируемость ошибочно приравнена к статическому графу — Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для agent-orchestrator записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; agent-orchestrator не проходит лишь по названию. Недоступный live host = NOT_RUN.

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

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.26.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
