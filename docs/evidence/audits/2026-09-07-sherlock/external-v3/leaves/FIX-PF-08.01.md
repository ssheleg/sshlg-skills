# FIX-PF-08.01 — All-prerequisite fan-in

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

### Edit `repo://fabric/apps/desktop/src/shared/chain.ts`

implementation; exact local source path. SHA256: `e1d0b6d7e9db699c984de8ee3656a31d1f6eefed8a83d82b4e006c2ba47df111`

```text
58:       why: `the previous step ended as ${previous}, and only work that finished hands anything on`,
59:       missing: []
60:     }
61:
62:   const missing = step.needs.filter((n) => !(produced[n] ?? '').trim())
63:   if (missing.length > 0)
64:     return {
65:       start: false,
66:       why:
67:         `it needs ${missing.join(', ')} and the step before it produced ` +
68:         `${missing.length === 1 ? 'nothing under that name' : 'nothing under those names'}. ` +
69:         `Starting anyway would hand an agent an empty quotation and a question about it.`,
70:       missing
71:     }
72:
73:   const values: Record<string, string> = {}
74:   for (const n of step.needs) values[n] = (produced[n] as string).trim()
75:   return { start: true, values }
76: }
77:
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сгруппировать incoming edges по follower/version; readiness только если все required predicates satisfied.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Первый из двух producers не запускает consumer, второй делает ready.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

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

Appendix и полный parent contract: [leaf JSON](FIX-PF-08.01.json), [parent](../parents/FIX-PF-08.json). Полный audit не required prompt input.
