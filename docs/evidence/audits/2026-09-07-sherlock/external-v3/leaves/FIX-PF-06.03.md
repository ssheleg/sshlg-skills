# FIX-PF-06.03 — Append-only persistence contract

Parent `FIX-PF-06` · decision · P2

## Что и зачем

Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Create `repo://fabric/docs/evidence/plans/task-pipeline-persistence-contract.md`

bounded decision output; reserves future new migration/ADR IDs under repository rules. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-06.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Проверить named sources и перечислить только эту нерешённую decision.

2. Если нужна DB schema, новый migration/ADR ID резервируется отдельным change artifact; старые migrations/ADRs read-only.

3. Записать выбранный вариант, отвергнутые альтернативы, exact Create/Edit scope и проверяемые consequences.

4. Consumer implementation получает новую packet revision; decision artifact не считается implementation PASS.

## Наблюдаемый результат и приёмка

Decision artifact фиксирует нужна ли новая schema, exact reserved Create IDs при необходимости, recovery approach и будущие upgrade criteria; migration execution ещё не объявляется выполненным.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-04.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-04.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-03.01` (control): Completion boundary Fabric должна сохранять mandatory certification task-pipeline.
- `FIX-PF-03.02` (control): Completion boundary Fabric должна сохранять mandatory certification task-pipeline.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-06.03.json), [parent](../parents/FIX-PF-06.json). Полный audit не required prompt input.
