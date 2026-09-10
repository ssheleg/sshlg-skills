# FIX-PF-01 — Graph mutation lock не является claim узла или fencing исполнителя

P1 · очередь 1 · расчётная волна 7 · planned_not_implemented

Модули: task-pipeline, Fabric. Требования: E-05, E-06, E-01, E-02.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Два независимых процесса next получают N-001, status остаётся pending. owner — название роли, не session/attempt. running можно записать вручную, но CLI не имеет acquire/start/renew/release/recover; потерянный running даёт next exit4 навсегда до внешней правки. flock защищает add/park/close/certify, что подтверждено восемью параллельными add без потерь. При ошибке lock реализация продолжает unlocked с предупреждением.

- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:683](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L683)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:722](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L722)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:747](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L747)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:758](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L758)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1418](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1418)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1493](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1493)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json:83](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/graph.schema.json#L83)

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

2. В external-executor режиме отдать claim одному durable coordinator; атомарно ready→claimed выдаёт attempt_id, lease_generation/fencing token, owner_id и expires_at. Mutations выполняются только с expected revision. Fail-closed при невозможности арбитража; advisory режим остаётся явно отдельным. Не держать OS lock на всё время LLM job.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Два claim одного node/version дают одного победителя; restart/expiry позволяет новый attempt, late old attempt не публикует result; независимые add сохраняются; недоступный lock не запускает external work.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [CTX-01](CTX-01.md) · data: Потребляет принятый контракт/результат предыдущей задачи.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "Fabric": "91337391aa8d24966bf0c57db381e6fe63b48bce"}`.

Write scope: `repo:repo://task-pipeline`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json`, `file:repo://fabric/apps/desktop/src/main/executionAuthority.ts`, `repo:repo://fabric`, `file:repo://task-pipeline/test/execution_claim_test.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-PF-01.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
