# FIX-DS-03 — Производительность CSS/API описана абсолютами вместо проверяемых условий

P2 · очередь 2 · расчётная волна 9 · planned_not_implemented

Модули: sheleg-design. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Запрещён сам addEventListener(scroll) как якобы обязательно janky; filter/clip-path названы safe. Производительность зависит от объёма работы/paint/device. MDN описывает допустимый scroll handler с throttling; Chrome/web.dev предупреждает о стоимости blur и рекомендует измерять pipeline, а не обещает safe для любого filter.

- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:168](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L168)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:179](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L179)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:182](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md#L182)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [supporting evidence appendix](../../ux-design.json) · sha256 `2aeca4305c0efc4c514539406f2fc4a553f5410361b6252facc7db0f2f3d01e5`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide .

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sheleg-design`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-DS-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
