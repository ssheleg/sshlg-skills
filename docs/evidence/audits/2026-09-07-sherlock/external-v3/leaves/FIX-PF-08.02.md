# FIX-PF-08.02 — Namespaced input merge

Parent `FIX-PF-08` · implementation · P1

## Что и зачем

Fabric fan-in проверяет каждое ребро отдельно, поэтому запускает неполный consumer

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/main/chainAdvance.ts`

implementation; exact local source path. SHA256: `5d02c078f5e2cbbbd2d2de571575e7b4b2105b66ae57a51c775326558b8e4e35`

```text
64:       const waiting = new Map(
65:         (followers.data ?? []).map((t) => [t.id as string, t])
66:       )
67:
68:       for (const link of links) {
69:         const follower = waiting.get(link.task_id as string)
70:         if (!follower) continue
71:         const status = outcomeOf.get(link.target_id as string)
72:         // A predecessor that has not finished is not a refusal — it is a chain
73:         // that has not got there yet, and saying so every minute would fill the
74:         // journal with "not yet".
75:         if (status !== 'done' && status !== 'cancelled' && status !== 'abandoned') continue
76:
77:         const { data: produced } = await deps.db
78:           .from('task_handoffs')
79:           .select('name,value')
80:           .eq('task_id', link.target_id as string)
81:         const values: Record<string, string> = {}
82:         for (const h of produced ?? []) values[h.name as string] = h.value as string
83:
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-08.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Versioned artifacts объединить по namespace; collisions явная ошибка; interpolation после schema validation.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Два одинаковых output names не перезаписываются молча; valid input set claim один раз.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-08.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-04.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-04.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-07.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-07.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-08.02.json), [parent](../parents/FIX-PF-08.json). Полный audit не required prompt input.
