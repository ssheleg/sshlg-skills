# FIX-EV-01 — Проверка выбора названия не доказывает пользу выполнения скилла

P1 · очередь 1 · расчётная волна 3 · planned_not_implemented

Модули: task-pipeline, make-skill, seo-aeo-audit. Требования: E-05, E-06.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Исторические результаты честно фиксируют ограничения: contaminated family roster, одиночные ответы name/none, pipeline scenarios не выполнены. В текущем запуске native eval отказал early access. Сводный performance gain над режимом без скиллов не измерен; нельзя заключить, что семейство улучшает работу в целом.

- [repo://task-pipeline/test/evals/RESULTS.md:3](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/test/evals/RESULTS.md#L3)
- [repo://make-skill/test/evals/RESULTS.md:91](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/evals/RESULTS.md#L91)
- [repo://seo-aeo-audit/test/evals/RESULTS.md:38](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/test/evals/RESULTS.md#L38)
- [audit://native-eval.log](../../native-eval.log)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [module:make-skill](../context/modules/make-skill.md) · sha256 `65c7beadcbe0174176ac10fe9e46de09dea5379d9bf46c7b32d84a726b8b8df4`
- [module:seo-aeo-audit](../context/modules/seo-aeo-audit.md) · sha256 `3a3482cd54111b6e826aaa1c30b42d69d0a889a5ffdf42fd987017f2b85e13f0`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [supporting evidence appendix](../../parent-findings.json) · sha256 `86af0f7e1fc5918b3f5a1564bb1ddb688167e604436637b5178a1c2c42affe83`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Три испытательных слоя: deterministic tools, routing actual-load traces, end-to-end outcome with/without. Одинаковые задачи, изолированные workspaces, зафиксированные host/model/digests, независимые outcome graders и cost/latency. Разрешить синтетические safety/effect contract тесты до production.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "make-skill": "015052149a9c62a8a69e18a2a5dd6bf2f6e8196a", "seo-aeo-audit": "db261482a520df1b7373283955921f1282de866d"}`.

Write scope: `repo:repo://task-pipeline`, `repo:repo://make-skill`, `repo:repo://seo-aeo-audit`, `file:repo://task-pipeline/test/evals/RESULTS.md`, `file:repo://make-skill/test/evals/RESULTS.md`, `file:repo://seo-aeo-audit/test/evals/RESULTS.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-EV-01.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
