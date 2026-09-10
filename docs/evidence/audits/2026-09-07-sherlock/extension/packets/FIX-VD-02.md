# FIX-VD-02 — Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера

P1 · очередь 1 · расчётная волна 2 · planned_not_implemented

Модули: sheleg-design. Требования: E-05, E-06, E-03.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Nicegram реально имел imageView нескольких mockups и поздние screenshots, browser suites и independent review. Поэтому диагноз «не смотрели картинки» неверен. В inspected G01--start: крупная пустая область, небольшой значок, два одинаковых suggestions, нижний composer; в C01--ready: плотная формовая группа сверху sheet, затем пустое поле. Это нейтральные описания композиции, а не объективный verdict ugly. В receipts нет отдельного сравнительного art-direction протокола; отсутствие записи не доказывает отсутствие внутренней критики.

- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:127](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L127)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:207](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L207)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:218](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L218)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:225](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L225)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:162](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L162)
- [machine-snapshot://DATA/nicegram-assistant-preview/docs/VERIFICATION.md:12](machine-snapshot://DATA/nicegram-assistant-preview/docs/VERIFICATION.md:12)
- [machine-snapshot://DATA/nicegram-assistant-preview/docs/ux/audits/2026-09-07-baseline.md:133](machine-snapshot://DATA/nicegram-assistant-preview/docs/ux/audits/2026-09-07-baseline.md:133)
- [machine-snapshot://.agents/skills/frontend-design/SKILL.md:43](machine-snapshot://.agents/skills/frontend-design/SKILL.md:43)

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

2. Добавить после render отдельный visual critique: три конкретных наблюдения с crop/координатой, intended effect, proposed adjustment, second render. Сравнивать hierarchy, spacing rhythm, optical alignment, type treatment, platform feel и specificity to product; контраст и keyboard оставить отдельными gate. Требовать показать пределы оценки, а не присваивать псевдоточный score вкусу. Для существенной поверхности минимум один подтверждённый цикл улучшения либо аргументированное «дальнейшее изменение ухудшает X».

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Один reviewer без чтения кода сравнивает до/после на одинаковом viewport/content. Для каждого замечания есть image region и видимое изменение; замечания «premium/generic» без конкретики не считаются. Оба варианта отдельно проходят accessibility/UX. При равном результате user видит осмысленный tradeoff. В eval нельзя засчитывать наличие PNG или слово polish как успех визуального качества.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sheleg-design`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-VD-02.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан. Часть рекомендации подготовлена локально в worktree; вся задача остаётся открытой до реализации/приёмки/release.
