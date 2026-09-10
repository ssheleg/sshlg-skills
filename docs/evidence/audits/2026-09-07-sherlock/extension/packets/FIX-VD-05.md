# FIX-VD-05 — Общий kit spine фиксирует внешний API ценой базовой DOM-семантики и доступных адаптаций

P1 · очередь 1 · расчётная волна 4 · planned_not_implemented

Модули: sheleg-design. Требования: E-05, E-06, E-03.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Подтверждено чтением полного workbench kit и механическим сканированием39Button/39Heading. Непереданные props отбрасываются destructuring, независимо от того, разрешит ли TS конкретный aria-* синтаксис. Это статически определённое поведение; live rendering всех kits не запускался. Nicegram не использовал этот React kit, поэтому ему этот defect не приписан.

- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md:68](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L68)
- [repo://sheleg-design/kits/workbench/src/Button.tsx:3](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L3)
- [repo://sheleg-design/kits/workbench/src/Button.tsx:23](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L23)
- [repo://sheleg-design/kits/workbench/src/Button.tsx:27](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L27)
- [repo://sheleg-design/kits/workbench/src/Heading.tsx:5](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Heading.tsx#L5)
- [repo://sheleg-design/kits/workbench/src/Heading.tsx:11](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Heading.tsx#L11)

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

2. Общий spine должен включать native props и ref с контролируемым override, Button type=button default но переопределяемый, aria/state passthrough. Heading: независимые as/level и visual size. Единообразный API сохранить, расширив контракт сразу во всех kits. Отделить reference primitives от полноценного product component system и добавить composition recipes для forms/dialogs/navigation.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Small tests: icon-only button передаёт aria-label; trigger передаёт aria-expanded/controls; submit button отправляет форму; ref.focus работает; heading h2 может выглядеть как display/h1, не меняя outline. Проверить это через реальный DOM/render хотя бы одного representative kit и structural shared-contract check39, без обязательных39live builds.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sheleg-design`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md`, `file:repo://sheleg-design/kits/workbench/src/Button.tsx`, `file:repo://sheleg-design/kits/workbench/src/Heading.tsx`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-VD-05.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
