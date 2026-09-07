# FIX-PF-05.02 — Fabric context materialization

Parent `FIX-PF-05` · implementation · P2

## Что и зачем

Saved Markdown brief уже есть, portable immutable node packet ещё нет

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/main/contextPack.ts`

implementation; exact local source path. SHA256: `b0a6e6059527e6538c88067c3b76f9e6c28c179cfc71ff4cd745bc7457e573ec`

```text
26: import { createHash } from 'node:crypto'
27: import type { SupabaseClient } from '@supabase/supabase-js'
28:
29: export interface ContextPack {
30:   markdown: string
31:   sha256: string
32:   chars: number
33:   factIds: string[]
34:   factSeqs: number[]
35:   transcriptIds: string[]
36:   omittedFacts: number
37:   omittedTranscripts: number
38: }
39:
40: export interface ContextPackInput {
41:   db: SupabaseClient
42:   projectId: string
43:   taskInstruction?: string | null
44:   /**
45:    * The task's brief, when it has one (M146 step 5). Distinct from the
```

### Edit `repo://fabric/apps/desktop/src/main/sessionBundle.ts`

implementation; exact local source path. SHA256: `8e481d8051c2a32e1c31b40236c9a6ace85c244ea83f7d14df0256af0240c4d1`

```text
191:           )
192:       }
193:     },
194:
195:     discard(sessionId: string): void {
196:       // Order matters. Revoke first: it works even if the unlink fails, and it
197:       // is the half that actually closes the door — the file is only a copy.
198:       deps.surface.revokeSession(sessionId)
199:       try {
200:         rmSync(dirFor(sessionId), { recursive: true, force: true })
201:       } catch (e) {
202:         console.error(`could not remove session directory ${sessionId}:`, e)
203:       }
204:     }
205:   }
206: }
```

### Create `repo://fabric/apps/desktop/src/main/executionPacket.ts`

new capability target; audit does not create it. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-05.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Materialize content-addressed refs через contextPack/sessionBundle; local path не portable identity.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Bundle переносится в другой root с теми же digests; missing blob блокирует start.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-05.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-02.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `CTX-02.01` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.02` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.03` (data): Потребляет принятый контракт/результат предыдущей задачи.
- `CTX-02.04` (data): Потребляет принятый контракт/результат предыдущей задачи.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-05.02.json), [parent](../parents/FIX-PF-05.json). Полный audit не required prompt input.
