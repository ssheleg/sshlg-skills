# FIX-PF-07.01 — Existing follower identity

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

### Edit `repo://fabric/apps/desktop/src/main/index.ts`

implementation; exact local source path. SHA256: `a075532e4620e6515459da26be6f81b15a46f024ca7ab7858f0e49582ea8e30a`

```text
835:    * Start a task and open its session. EXTRACTED from the IPC handler because
836:    * M134's research door needs the same act: two implementations of "start a
837:    * task" are two implementations free to disagree about what gets journalled.
838:    */
839:   const startTask = async (input: {
840:     projectId: string
841:     instruction: string
842:     optionId: string
843:     preset?: string
844:     presetEdited?: boolean
845:     permissionMode?: string | null
846:   }): Promise<{ task: TaskRow; session: { sessionId: string } }> => {
847:       const instruction = input.instruction?.trim()
848:       if (!instruction) throw new Error('a task needs an instruction')
849:       const project = await readProject(input.projectId)
850:       const cwd = project.repo_path ?? app.getPath('home')
851:       const id = randomUUID()
852:
853:       // The task is recorded BEFORE the session is spawned: a start that fails
854:       // is an attempt the operator asked for, and a row that only appears on
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Dispatch intent указывает existing followerId и idempotency run/node/revision/attempt key; не каждый trigger создаёт новую task.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Repeated chain advance возвращает один follower/attempt mapping.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

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

Appendix и полный parent contract: [leaf JSON](FIX-PF-07.01.json), [parent](../parents/FIX-PF-07.json). Полный audit не required prompt input.
