# FIX-VD-06 — Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей

P2 · очередь 1 · расчётная волна 11 · planned_not_implemented

Модули: sheleg-design. Требования: E-05, E-06, E-03.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Числа Nicegram сохранены на нескольких этапах. Source .welcome padding-top85px плюс phone geometry задают реальную композицию, но ссылка density5 на такой результат не дана. Это недостаток операционализации, не доказанный причинный эффект и не требование делать любой чат плотным.

- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:107](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L107)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:110](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L110)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:127](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L127)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:146](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L146)
- [machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:5](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:5)
- [machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:12](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:12)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [supporting evidence appendix](../design-depth.json) · sha256 `f42d9e1b0368b4fcdf589090548a5a3ae4cdf0338cb6cca2448c3adfabce4eb3`
- [supporting evidence appendix](../nicegram-route-receipt.json) · sha256 `59b1771fe8f2881fd0f0ca9f12c30461e0d909397fa025092a1958b8658ede49`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Сделать dials необязательной shorthand, основной контракт — reference anchors + наблюдаемые targets конкретного сценария: reading width, CTA reachability, visible alternatives, keyboard state, deliberate empty-space purpose. Для сохранения identity motion не повышать автоматически. Для числа указывать example/counterexample или выводить его из принятого direction, а не закреплять до первого рендера.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Два независимых исполнителя по одному brief должны объяснить через одинаковые наблюдаемые признаки, что означает density/variance. Число без anchors не считается evidence. Проверить quiet dashboard, consumer chat и accessibility-large-text: одинаковая цифра не подменяет разные платформенные задачи.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-VD-01](FIX-VD-01.md) · data: Калибровочные renders берутся из реальных вариантов direction exploration.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sheleg-design`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-VD-06.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
