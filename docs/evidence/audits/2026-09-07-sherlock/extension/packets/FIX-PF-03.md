# FIX-PF-03 — Прямой close обходит проваленную обязательную certification

P1 · очередь 1 · расчётная волна 9 · planned_not_implemented

Модули: task-pipeline. Требования: E-05, E-06, E-01, E-02.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Реальный certify записывает unit=fail и exit1; затем прямой close со структурно валидным verdict возвращает0 и done. close проверяет форму и blockers, но не требует успешную certification текущего candidate. Регулярное выражение cross-tier проверяет текст, а не независимость sessions/reviewers.

- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:563](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L563)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1136](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1136)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1223](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1223)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1300](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1300)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py:1336](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py#L1336)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md:380](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L380)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [supporting evidence appendix](../pipeline-fabric-repro.json) · sha256 `93882b71773046385a6dd12dd638fe7dd2ad6050c8bcb943528cb79df77bb5d6`
- [supporting evidence appendix](../pipeline-fabric-chain-repro.json) · sha256 `de4770b81354d1b05b5af15d16c55d4d982f9597d3ed203b2343c1e0145f6fab`
- [supporting evidence appendix](../pipeline-fabric.json) · sha256 `32c397418c52908a631fe62a955f386e00568b97e60781e518128073cf6f6536`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Закрытие только через trusted coordinator с receipt успешного gate profile на том же candidate digest. Ручное исключение — отдельное authorized disposition с причиной, а не имитация pass. Сохранять reviewer identity/context exposure; syntax lint не называть доказательством blind review.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fail любого обязательного gate не позволяет complete; изменение candidate сбрасывает certification; raw fabricated verdict или чужой attempt не проходит; authorized waiver не становится measured PASS.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-PF-02](FIX-PF-02.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5"}`.

Write scope: `repo:repo://task-pipeline`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-PF-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
