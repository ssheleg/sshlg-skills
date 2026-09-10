# FIX-DV-06 — Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера

P2 · очередь 2 · расчётная волна 14 · planned_not_implemented

Модули: sheleg-dev. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Body: buffer не выдаётся пользователю, credit intent; waterfall: paidAmountUsd ?? tokenAmount (описан как plan units) ?? amountUsd. Heleket reference: tokenAmount=invoiceAmount, buffer возвращается в баланс. Единого dimensional contract нет.

- [repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:235](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L235)
- [repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md:272](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L272)
- [repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md:877](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L877)
- [repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md:1257](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L1257)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-dev](../context/modules/sheleg-dev.md) · sha256 `15267b79bd525b710fbceab7c11d0592be900bff0e0d471daa0b87fc309e708f`
- [contract:integration](../context/contracts/integration.md) · sha256 `6afa0b0347b041557ffabcfeaed821ff999542ac765d9088fb166dbde0360054`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../integrations-findings.json) · sha256 `60b3011f1cd6e94c9c851c310db9279cde7feb4601845e619abb72d263676beb`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Ввести Money(currency, minor/decimal), Asset(network, amount), Entitlement(units), FX quote с источником/временем. Выбор refund excess/credit excess/buffer fee оформлять явной политикой проекта.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-dev": "42dfb5df929897f5cf39c72c0c69725f6bb664e2"}`.

Write scope: `repo:repo://sheleg-dev`, `file:repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md`, `file:repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-DV-06.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
