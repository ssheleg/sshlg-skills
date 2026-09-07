# FIX-TP-02 — Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»

P1 · очередь 1 · расчётная волна 18 · planned_not_implemented

Модули: task-pipeline. Требования: E-05, E-06.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Отсутствие бренда семейства превращается в невозможность пройти UI gate, даже если сценарии уже эквивалентно описаны. Чужой полноценный design workflow объявляется undesigned при отсутствии sheleg-design. Это подмена качества наличием конкретного пакета.

- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md:96](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/SKILL.md#L96)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md:53](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md#L53)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md:175](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md#L175)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [supporting evidence appendix](../../parent-findings.json) · sha256 `86af0f7e1fc5918b3f5a1564bb1ddb688167e604436637b5178a1c2c42affe83`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Гейт проверяет обязательные артефакты/поведение и их качество. Preferred provider из семейства, альтернативный provider с тем же контрактом или inline fallback допустимы. При отсутствии инструмента писать, какая именно проверка не сделана.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5"}`.

Write scope: `repo:repo://task-pipeline`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-TP-02.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
