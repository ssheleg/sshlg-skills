# CTX-02 — Report → prioritized packet compiler и context freshness gate

P1 · очередь 1 · расчётная волна 2 · planned_not_implemented

Модули: task-pipeline. Требования: E-05, E-06, E-01, E-02, E-10.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Превратить audit finding в traceable task без потери evidence/limits; присоединить program/module/contracts, base commit/digests, concrete steps, write sets, acceptance и rollback. Обеспечить offline export/import content-addressed bundle, expected upstream outputs и пересборку после prerequisite changes. Добавить pre-dispatch dry-run: closure, context budget, capability, dependencies, resource conflicts. Перенести и расширить audit prototype packet_contract.py в поддерживаемую capability с repository tests.



## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Превратить audit finding в traceable task без потери evidence/limits; присоединить program/module/contracts, base commit/digests, concrete steps, write sets, acceptance и rollback. Обеспечить offline export/import content-addressed bundle, expected upstream outputs и пересборку после prerequisite changes. Добавить pre-dispatch dry-run: closure, context budget, capability, dependencies, resource conflicts. Перенести и расширить audit prototype packet_contract.py в поддерживаемую capability с repository tests.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Все 115 findings проходят mapping без дублей и потерь; чистый отдельный процесс импортирует bundle без исходного абсолютного root; повреждение файла, усечение acceptance и изменение upstream output блокируют dispatch. Prompt materialization сохраняет инварианты в объявленном budget.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [CTX-01](CTX-01.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5"}`.

Write scope: `repo:repo://task-pipeline`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/context_packets.py`, `file:repo://task-pipeline/test/context_packets_test.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](CTX-02.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
