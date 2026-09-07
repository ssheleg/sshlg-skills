# FIX-UP-03 — Выбор агента не ограничивает весь update

P2 · очередь 2 · расчётная волна 10 · planned_not_implemented

Модули: sshlg-skills. Требования: E-05, E-06, E-07, E-08.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Fixture agent-scope: update --no-claude --agent codex с ранее данным consent=yes меняет все три fixture файла: .claude/CLAUDE.md, .codex/AGENTS.md и .gemini/GEMINI.md. refreshBlock не передаёт agents/claudeOnly; apply iterates all TARGETS. Refresh skills update name --global не содержит агентного scope; это действительно глобальный интерфейс upstream, а не пропущенный поддерживаемый флаг. Shared hub по определению тоже общий.

- [repo://sshlg-skills/lib/plan.js:48](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L48)
- [repo://sshlg-skills/lib/plan.js:91](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L91)
- [repo://sshlg-skills/bin/sshlg-skills.js:267](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L267)
- [repo://sshlg-skills/bin/sshlg-skills.js:347](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L347)
- [repo://sshlg-skills/lib/apply.js:180](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L180)
- [repo://sshlg-skills/lib/apply.js:203](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L203)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Разделить --host/--channel и --scope shared|host; resolver до начала операций показывает затрагиваемые shared storage и indirect consumers. Передать выбранные targets во все emitters; общие объекты обновлять только как явно названную часть плана. Для host-only использовать staging точного payload/add к поддерживаемому агенту либо объявлять невозможность изоляции общего hub.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fixture с Claude/Codex/Gemini/Cursor сохраняет все невыбранные instruction files.
--claude-only не обновляет Codex/Gemini instructions; --no-claude не меняет Claude state, кроме явно выбранного shared scope.
Test на два агента, читающих один symlink target, показывает shared-effect до apply и не обещает per-host isolation.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-02](FIX-UP-02.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/lib/plan.js`, `file:repo://sshlg-skills/bin/sshlg-skills.js`, `file:repo://sshlg-skills/lib/apply.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-03.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
