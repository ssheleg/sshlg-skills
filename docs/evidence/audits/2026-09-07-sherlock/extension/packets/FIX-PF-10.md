# FIX-PF-10 — Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools

P2 · очередь 1 · расчётная волна 16 · planned_not_implemented

Модули: task-pipeline, Fabric. Требования: E-05, E-06, E-01, E-02.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

AgentDescriptor Codex явно connectsToSurface=false, adapter none. Bundle compiler умеет mcp-config-flag и none, остальные отказывает; Claude adapter получает config+preamble. Поэтому запуск Codex terminal не доказывает доступ к claim/handoff/memory и равенство executor capabilities. Смена модели и смена runtime — разные оси.

- [repo://fabric/apps/desktop/src/shared/agents.ts:54](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/agents.ts#L54)
- [repo://fabric/apps/desktop/src/shared/agents.ts:123](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/shared/agents.ts#L123)
- [repo://fabric/apps/desktop/src/main/sessionBundle.ts:148](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L148)
- [repo://fabric/apps/desktop/src/main/sessionBundle.ts:176](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L176)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [module:Fabric](../context/modules/Fabric.md) · sha256 `c4eda16b894540743b4948b5ca1d8b1de3c18e70e56a97f3a9e006e33b8ddb51`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [supporting evidence appendix](../pipeline-fabric-repro.json) · sha256 `93882b71773046385a6dd12dd638fe7dd2ad6050c8bcb943528cb79df77bb5d6`
- [supporting evidence appendix](../pipeline-fabric-chain-repro.json) · sha256 `de4770b81354d1b05b5af15d16c55d4d982f9597d3ed203b2343c1e0145f6fab`
- [supporting evidence appendix](../pipeline-fabric.json) · sha256 `32c397418c52908a631fe62a955f386e00568b97e60781e518128073cf6f6536`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Сохранить portable packet и отдельный executor capability adapter. Для каждого host подтвердить actual registration/tool call и project/run/session scope. Unsupported adapter не получает ready-for-dispatch; headless packet-only executor возможен через отдельный trusted result channel. Provider/model preferences наследуются отдельно от транспорта.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Один golden packet Claude/Codex executors: одинаковые contract inputs/outputs и authority restrictions; actual tool discovery/call receipt, cleanup/revoke; отрицательный unsupported host не запускается как supposedly connected. Не переносить native hidden reasoning/transcript между vendor runtimes.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-PF-05](FIX-PF-05.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- [FIX-PF-06](FIX-PF-06.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- [FIX-UP-07](FIX-UP-07.md) · data: Consumer host adapter должен знать discovery/provider и фактически загруженный контекст Codex.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "Fabric": "91337391aa8d24966bf0c57db381e6fe63b48bce"}`.

Write scope: `repo:repo://task-pipeline`, `repo:repo://fabric`, `file:repo://fabric/apps/desktop/src/shared/agents.ts`, `file:repo://fabric/apps/desktop/src/main/sessionBundle.ts`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-PF-10.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
