# FIX-DV-19.01 — Artifact eval: stripe-billing

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

### Create `repo://sheleg-dev/evals/cases/fix-dv-19.01.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-19.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

DV-01: Claim фиксирует получение, но ошибочно считается завершением работы — Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.

DV-02: Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant — Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.

DV-03: Компенсация количества не компенсирует уже снятые деньги — Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.

DV-04: Refund CAS проигрыш молча теряет больший cumulative refund — Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.

DV-19: Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата — Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Добавить offline artifact/fault-injection corpus stripe-billing, привязанный к соответствующим DV findings; protocol/provider stubs не являются oracle сами для себя.

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

Appendix и полный parent contract: [leaf JSON](FIX-DV-19.01.json), [parent](../parents/FIX-DV-19.json). Полный audit не required prompt input.
