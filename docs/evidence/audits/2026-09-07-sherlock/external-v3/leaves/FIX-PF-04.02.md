# FIX-PF-04.02 — Fabric edge semantics

Parent `FIX-PF-04` · implementation · P1

## Что и зачем

Parked обязательного producer делает его consumer runnable без payload

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/shared/chain.ts`

implementation; exact local source path. SHA256: `e1d0b6d7e9db699c984de8ee3656a31d1f6eefed8a83d82b4e006c2ba47df111`

```text
46:  * present with an EMPTY value is treated as missing: handing over nothing under
47:  * the right name is the failure this rule exists for, and it is the shape a
48:  * well-meaning agent produces.
49:  */
50: export function mayStartStep(
51:   step: ChainStep,
52:   previous: Outcome,
53:   produced: Readonly<Record<string, string | null | undefined>>
54: ): StartVerdict {
55:   if (previous !== 'done')
56:     return {
57:       start: false,
58:       why: `the previous step ended as ${previous}, and only work that finished hands anything on`,
59:       missing: []
60:     }
61:
62:   const missing = step.needs.filter((n) => !(produced[n] ?? '').trim())
63:   if (missing.length > 0)
64:     return {
65:       start: false,
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-04.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Fabric shared chain model сохраняет тот же distinction и unknown required predicate fail closed.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Портированный graph не делает parked required edge ready.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-04.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-02.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-04.02.json), [parent](../parents/FIX-PF-04.json). Полный audit не required prompt input.
