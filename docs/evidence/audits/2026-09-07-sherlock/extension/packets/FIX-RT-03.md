# FIX-RT-03 — Toolkit объявляет доступность машины по инвентарю только Claude Code

P2 · очередь 2 · расчётная волна 17 · planned_not_implemented

Модули: sshlg-skills. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

527 — число строк Claude inventory, а не измерение доступных именно этому Codex инструментов/скиллов. Plain-ветка включает каталоги и symlink без требования живого SKILL.md; объявление family зависит от id, а не происхождения. Возможны ложная доступность и ошибочный выбор версии.

- [repo://sshlg-skills/lib/conflicts.js:157](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/conflicts.js#L157)
- [repo://sshlg-skills/lib/conflicts.js:182](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/conflicts.js#L182)
- [repo://sshlg-skills/lib/toolkit.js:200](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/toolkit.js#L200)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [supporting evidence appendix](../../parent-findings.json) · sha256 `86af0f7e1fc5918b3f5a1564bb1ddb688167e604436637b5178a1c2c42affe83`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Host adapters: discovered / enabled / exposed / callable отдельно, namespace+provenance+content digest вместо голого id. В отчёте показывать host и недоступные capability; сохранить просмотр других хостов как inventory.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Синтетические host homes: broken symlink, одноимённый чужой скилл, plugin только в Claude и skill только в Codex; roster active host содержит только реально разрешимые записи.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-07](FIX-UP-07.md) · data: Toolkit показывает effective provider inventory вместо Claude-only roster.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/lib/conflicts.js`, `file:repo://sshlg-skills/lib/toolkit.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-RT-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
