# FIX-PF-07.02 — Crash-safe dispatch reconciliation

Parent `FIX-PF-07` · implementation · P1

## Что и зачем

Fabric chainAdvance повторно запускает follower, создавая новые задачи

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
33:   estateId: string
34: }
35:
36: export function createChainAdvance(deps: ChainDeps): () => Promise<void> {
37:   let running = false
38:   return async (): Promise<void> => {
39:     if (running) return
40:     running = true
41:     try {
42:       // Followers still waiting: a `follows` link from a task in backlog.
43:       const { data: links } = await deps.db
44:         .from('task_links')
45:         .select('task_id,target_id,needs')
46:         .eq('rel', 'follows')
47:         .eq('target_kind', 'task')
48:       if (!links?.length) return
49:
50:       const followerIds = [...new Set(links.map((l) => l.task_id as string))]
51:       const targetIds = [...new Set(links.map((l) => l.target_id as string))]
52:       const [followers, targets] = await Promise.all([
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-07.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Backlog→dispatching CAS + durable intent/outbox перед spawn; restart сверяет existing process/session.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Crash до/после spawn не теряет mapping и не создаёт бесконечные UUID.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-07.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-07.02.json), [parent](../parents/FIX-PF-07.json). Полный audit не required prompt input.
