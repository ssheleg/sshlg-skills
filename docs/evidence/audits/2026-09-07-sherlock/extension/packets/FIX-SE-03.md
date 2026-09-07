# FIX-SE-03 — Cross-track проверка объявляет совместимые наблюдения противоречием

P2 · очередь 2 · расчётная волна 4 · planned_not_implemented

Модули: seo-aeo-audit. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Короткая малоценная страница может идеально извлекаться, а один URL может иметь confirmed HTTP status и hypothetical ranking cause. Предписанное «one did not look properly» заставляет искусственно согласовывать разные свойства и терять реальные данные.

- [repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:219](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L219)
- [repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md:216](https://github.com/ssheleg/seo-aeo-audit/blob/db261482a520df1b7373283955921f1282de866d/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md#L216)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:seo-aeo-audit](../context/modules/seo-aeo-audit.md) · sha256 `3a3482cd54111b6e826aaa1c30b42d69d0a889a5ffdf42fd987017f2b85e13f0`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [supporting evidence appendix](../../parent-findings.json) · sha256 `86af0f7e1fc5918b3f5a1564bb1ddb688167e604436637b5178a1c2c42affe83`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Сравнивать claim key=(subject,predicate,scope,time,instrument). Противоречие возникает только для несовместимых значений одного predicate; независимые аспекты сохранять.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"seo-aeo-audit": "db261482a520df1b7373283955921f1282de866d"}`.

Write scope: `repo:repo://seo-aeo-audit`, `file:repo://seo-aeo-audit/plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-SE-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
