# FIX-PF-10.02 — Real two-session handoff

Parent `FIX-PF-10` · implementation · P2

## Что и зачем

Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.


## Exact targets и source окна

### Edit `repo://fabric/apps/desktop/src/shared/agents.ts`

implementation; exact local source path. SHA256: `182d2bca580003c197aacc3bcebcc16e0d2f3b0f84be6e252ea5f4f33d846703`

```text
50:  * program's arguments and either failed to start or started with no Fabric
51:  * tools and no complaint.
52:  *
53:  * `unimplemented` exists so that stays impossible: an agent may DECLARE an
54:  * adapter before anyone has written it, and the launch refuses rather than
55:  * quietly borrowing the flags of whoever went first.
56:  */
57: export type SurfaceAdapter = 'mcp-config-flag' | 'none' | 'unimplemented'
58:
59: export interface AgentDescriptor {
60:   id: string
61:   label: string
62:   /** What actually runs. `null` means the operator's login shell. */
63:   program: string | null
64:   description: string
65:   /** Whether this option is handed a credential for the agent surface. */
66:   connectsToSurface: boolean
67:   /**
68:    * How this CLI is told where Fabric's MCP config is. `mcp-config-flag` is
69:    * Claude Code's `--mcp-config … --strict-mcp-config`; a third agent that
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-10.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. На поддержанном host выполнить fresh planner packet→independent executor→trusted result; no transcript dependency.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Recorded actual-load/tool call/current result, NOT_RUN если host недоступен.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-10.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-PF-05.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-05.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-06.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-06.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-06.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-07.01` (data): Consumer host adapter должен знать discovery/provider и фактически загруженный контекст Codex.
- `FIX-UP-07.02` (data): Consumer host adapter должен знать discovery/provider и фактически загруженный контекст Codex.
- `FIX-UP-07.03` (data): Consumer host adapter должен знать discovery/provider и фактически загруженный контекст Codex.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-10.02.json), [parent](../parents/FIX-PF-10.json). Полный audit не required prompt input.
