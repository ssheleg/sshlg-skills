# FIX-UX-03 — Humanization «никогда не блокирует» расходится с исполняемым B060

P1 · очередь 1 · расчётная волна 4 · planned_not_implemented

Модули: super-ux. Требования: E-05, E-06.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

SKILL запрещает превращать marker count в verdict/gate; reference задаёт grades «reads as written by a person», «decisive on its own», error при 3 S1. Код считает substring и выдаёт error. Цитата-словарь с delve / needless to say / in conclusion воспроизводит error и Naturalness grade C; Humanization: off с причиной ничего не меняет.

- [repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md:128](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/SKILL.md#L128)
- [repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:31](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/references/ai-tells.md#L31)
- [repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:35](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/copywriting/references/ai-tells.md#L35)
- [repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1600](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/scripts/brand_lint.py#L1600)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:super-ux](../context/modules/super-ux.md) · sha256 `b5cc2eac477dd48cc3867614cc307571fda37bf29552d85d8a78bb5559b753ce`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../ux-design.json) · sha256 `2aeca4305c0efc4c514539406f2fc4a553f5410361b6252facc7db0f2f3d01e5`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Единый контракт: humanization review всегда advisory, word markers не устанавливают authorship/naturalness grade. Учитывать цитаты/код/термины, разделить редакционный off и явно выбранные brand bans. Удалить severity переход из количества маркеров.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463"}`.

Write scope: `repo:repo://super-ux`, `file:repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md`, `file:repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md`, `file:repo://super-ux/plugins/super-ux/scripts/brand_lint.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UX-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
