# FIX-VD-01 — Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции

P1 · очередь 1 · расчётная волна 10 · planned_not_implemented

Модули: sheleg-design, super-ux. Требования: E-05, E-06, E-03.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

В initial Nicegram объявлены 4/1/5, dark+gold и system type; A/B = сразу чат / чат-сервисы. В локальном style.md нет двух самостоятельных визуальных направлений. Это наблюдение о данном выполнении, не доказательство, что запрет единолично вызвал результат. Собственная local concept identity уже является полезным допустимым обходом обязательных published packs.

- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:80](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L80)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:204](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L204)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:142](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L142)
- [repo://super-ux/plugins/super-ux/skills/references/visual-identity.md:51](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/references/visual-identity.md#L51)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md:136](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L136)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md:160](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L160)
- [machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:3](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:3)
- [machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:14](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:14)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [module:super-ux](../context/modules/super-ux.md) · sha256 `b5cc2eac477dd48cc3867614cc307571fda37bf29552d85d8a78bb5559b753ce`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../design-depth.json) · sha256 `f42d9e1b0368b4fcdf589090548a5a3ae4cdf0338cb6cca2448c3adfabce4eb3`
- [supporting evidence appendix](../nicegram-route-receipt.json) · sha256 `59b1771fe8f2881fd0f0ca9f12c30461e0d909397fa025092a1958b8658ede49`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Ввести этап exploration с частичной фиксацией: locked invariants (brand colors/logo/accessibility), open axes (composition/type hierarchy/control anatomy/motion purpose). Разрешить 2–3 небольших рендера одного реального ключевого состояния в одной системе бренда. До выбора это provisional direction, после выбора — semantic tokens и пак. Полный контракт/13 headings требовать при публикации reusable pack, не для каждого эскиза. Разделить UI update и identity redesign вместо запрета любых component edits.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

На брифе «улучшить Nicegram, сохранить бренд» показать минимум две реально разные композиции стартового чата и context sheet; у каждой неизменны бренд и сценарий, явно различаются ≥2 открытых визуальных оси. На «исправить spacing по точному Figma» вариаций не создавать. Повторить с существующим токен-файлом и без него; наличие токенов само по себе не должно закрывать exploration.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42", "super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463"}`.

Write scope: `repo:repo://sheleg-design`, `repo:repo://super-ux`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`, `file:repo://super-ux/plugins/super-ux/skills/references/visual-identity.md`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-VD-01.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан. Часть рекомендации подготовлена локально в worktree; вся задача остаётся открытой до реализации/приёмки/release.
