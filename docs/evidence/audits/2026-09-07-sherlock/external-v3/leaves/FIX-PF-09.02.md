# FIX-PF-09.02 — Immutable outputs and resource scope

Parent `FIX-PF-09` · implementation · P1

## Что и зачем

Fabric task lease не ограничивает публикацию handoff текущим owner/attempt

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/main/agentSurface.ts`

implementation; exact local source path. SHA256: `b7335a6b973de06035ab81e3051d3f497fea70774c9e98d3755094e58a5a7913`

```text
784:     // NOT CLOSE ITS OWN TASK. It moves work to review and says what it
785:     // concluded; accepting or cancelling is the operator's move.
786:
787:     /** The task, or null when it is not this project's — the same answer. */
788:     const ownTask = async (
789:       taskId: string
790:     ): Promise<{ id: string; status: TaskState; title: string | null; instruction: string } | null> => {
791:       // The sharpest instance of IMP-04, and it was mine. A failed read made
792:       // this return null, and every tool built on it then answered "no such
793:       // task in this project" — a confident statement about the ESTATE
794:       // produced by a transient failure. Refusing is the honest answer.
795:       const found = await db
796:         .from('project_tasks')
797:         .select('id,status,title,instruction')
798:         .eq('id', taskId)
799:         .eq('project_id', scope.projectId)
800:         .maybeSingle()
801:       if (found.error) throw new Error(`the board could not be read: ${found.error.message}`)
802:       return (found.data as { id: string; status: TaskState; title: string; instruction: string } | null) ?? null
803:     }
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-09.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Accepted output immutable; correction new revision, downstream stale; resource write scope отдельно от task lease.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Поздняя правка не мутирует consumed output; shared file не защищён ложным task-only claim.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-09.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-09.02.json), [parent](../parents/FIX-PF-09.json). Полный audit не required prompt input.
