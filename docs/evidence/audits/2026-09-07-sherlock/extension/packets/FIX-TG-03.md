# FIX-TG-03 — HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle

P1 · очередь 0 · расчётная волна 2 · planned_not_implemented

Модули: telegram-dev. Требования: E-05, E-06.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

Telegram HMAC строится из всех received fields кроме hash; в third-party Ed25519 исключаются hash+signature. Рекомендованный самим skill init-data-golang исключает только hash. Наш all-fields signed vector с signature=... получает bad signature; self-test добавляет signature ПОСЛЕ signing, закрепляя ошибку.

- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md:75](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L75)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md:98](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L98)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py:34](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L34)
- [repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py:154](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L154)

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

2. Разделить HMAC и Ed25519 canonicalization, запретить shared false helper; официальные/независимые golden vectors с signature. Включить строгий parse duplicate fields и upper/lower auth_date window.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"telegram-dev": "0263b899e5827c65d366d2bbac73557a56045235"}`.

Write scope: `repo:repo://telegram-dev`, `file:repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md`, `file:repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-TG-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
