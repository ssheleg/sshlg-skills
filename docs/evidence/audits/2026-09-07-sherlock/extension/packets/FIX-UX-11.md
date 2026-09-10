# FIX-UX-11 — Figma fallback и provisional flow не доходят до разрешённого build state

P1 · очередь 1 · расчётная волна 7 · planned_not_implemented

Модули: super-ux. Требования: E-05, E-06.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Design допускает provisional profile без foundation и text-only при недоступном Figma. Финальный build gate требует всю утверждённую цепочку и, при default Figma enabled, каждый state linked to frame. ux-scenarios допускает no-Traces только tiny/explicit choice. Деградация разрешает создать текст, но не объясняет, какие условия снимают блок реализации.

- [repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:98](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L98)
- [repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:194](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L194)
- [repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:278](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L278)
- [repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:294](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-flows/SKILL.md#L294)
- [repo://super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md:33](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/ux-scenarios/SKILL.md#L33)

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

2. Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [CTX-03](CTX-03.md) · data: Build gate должен принимать согласованный provisional prototype state.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463"}`.

Write scope: `repo:repo://super-ux`, `file:repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md`, `file:repo://super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UX-11.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
