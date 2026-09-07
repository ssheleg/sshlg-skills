# FIX-DV-19.02 — Artifact eval: crypto-payments

Parent `FIX-DV-19` · verification · P2

## Что и зачем

Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Create `repo://sheleg-dev/evals/cases/fix-dv-19.02.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-19.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

DV-05: Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID — pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.

DV-06: Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера — Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.

DV-19: Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата — Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Добавить offline artifact/fault-injection corpus crypto-payments, привязанный к соответствующим DV findings; protocol/provider stubs не являются oracle сами для себя.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Позитивный результат и исходный counterexample проверяются по state/outputs; exit/trace/environment фиксируются.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-19.02.json), [parent](../parents/FIX-DV-19.json). Полный audit не required prompt input.
