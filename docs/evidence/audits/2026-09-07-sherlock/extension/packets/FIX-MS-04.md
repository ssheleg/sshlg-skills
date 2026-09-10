# FIX-MS-04 — Платформенные ограничения описаны как универсальные и частично устарели

P2 · очередь 2 · расчётная волна 5 · planned_not_implemented

Модули: make-skill. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Фраза «MCP/subagents существуют только внутри Claude Code» неверно описывает этот Codex runtime. Документ о manifests-only тоже устарел: Claude Code с v2.1.233 умеет валидировать frontmatter skill directories. Рекомендации 500/5000 и house правила не равны универсальной причине отказа загрузки.

- [repo://make-skill/plugins/make-skill/skills/make-skill/SKILL.md:132](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/SKILL.md#L132)
- [repo://make-skill/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md:137](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md#L137)
- [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:make-skill](../context/modules/make-skill.md) · sha256 `65c7beadcbe0174176ac10fe9e46de09dea5379d9bf46c7b32d84a726b8b8df4`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [supporting evidence appendix](../../parent-findings.json) · sha256 `86af0f7e1fc5918b3f5a1564bb1ddb688167e604436637b5178a1c2c42affe83`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Матрица adapter capabilities по версии хоста; native fallback по обнаруженным инструментам. В таблице каждой нормы owner=spec/host/house, required vs recommended и дата последней проверки.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"make-skill": "015052149a9c62a8a69e18a2a5dd6bf2f6e8196a"}`.

Write scope: `repo:repo://make-skill`, `file:repo://make-skill/plugins/make-skill/skills/make-skill/SKILL.md`, `file:repo://make-skill/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-MS-04.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
