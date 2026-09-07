# FIX-TG-01 — Crash fixture зелёный, но после реальной redelivery update теряется

P1 · очередь 0 · расчётная волна 1 · planned_not_implemented

Модули: telegram-dev. Требования: E-05, E-06.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

Выполнен штатный Handler: crash_on=1001, затем poll_batch повторно доставленных updates → work=[1002], processed=[1001,1002], offset=1003. Test проверяет лишь наличие UPDATE_A в still_delivered, не вызывает повторный handle.

- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md:73](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L73)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md:123](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L123)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py:94](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L94)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py:183](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L183)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:telegram-dev](../context/modules/telegram-dev.md) · sha256 `89512c15565bbc8f820bb9b4116d663e2ab1a7f1ef6d71377bbf9a04dd3ee442`
- [contract:integration](../context/contracts/integration.md) · sha256 `6afa0b0347b041557ffabcfeaed821ff999542ac765d9088fb166dbde0360054`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../integrations-findings.json) · sha256 `60b3011f1cd6e94c9c851c310db9279cde7feb4601845e619abb72d263676beb`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Принять update в durable inbox, ack после commit enqueue; state+lease+retry worker. Business grant keyed charge, outbox для send. Проверять не только redelivery, но eventual completed work.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"telegram-dev": "0263b899e5827c65d366d2bbac73557a56045235"}`.

Write scope: `repo:repo://telegram-dev`, `file:repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md`, `file:repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-TG-01.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
