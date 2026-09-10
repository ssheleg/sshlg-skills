# FIX-PF-10.01 — Codex capability adapter

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

### Edit `repo://fabric/apps/desktop/src/main/sessionBundle.ts`

implementation; exact local source path. SHA256: `8e481d8051c2a32e1c31b40236c9a6ace85c244ea83f7d14df0256af0240c4d1`

```text
144:           console.error(`context pack failed for session ${sessionId}:`, e)
145:         }
146:       }
147:
148:       // DISPATCHED on the agent's declared adapter, not hardcoded. Before
149:       // this, every connecting agent got Claude Code's flags whether or not it
150:       // understood them — a second one would have failed to start, or started
151:       // with no Fabric tools and no complaint.
152:       switch (adapter) {
153:         case 'mcp-config-flag':
154:           // strict: the session sees Fabric's tools and nothing the machine
155:           // happens to have configured elsewhere.
156:           //
157:           // AND THE PREAMBLE, which is the other half of M123. Handing an agent
158:           // tools does not tell it the rules; `fabric_whoami` holds those, and
159:           // until this argument existed the only thing asking for that call was
160:           // a sentence inside a tool description. The preamble names one tool
161:           // and no rule — `preamble.ts` says why, and a test enforces it.
162:           return {
163:             dir,
```

Тестовый artifact: `repo://fabric/test/audit_regressions/fix-pf-10.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Actual tool registration/session/project scope проверяется; no API → unsupported, portable packet-only mode отдельный trusted transport.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Codex executor не ready без нужного result channel; model preferences inherited.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

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

Appendix и полный parent contract: [leaf JSON](FIX-PF-10.01.json), [parent](../parents/FIX-PF-10.json). Полный audit не required prompt input.
