# FIX-UP-07 — Updater не управляет native Codex plugin provider и не проверяет active digest

P2 · очередь 2 · расчётная волна 15 · planned_not_implemented

Модули: sshlg-skills, sheleg-design. Требования: E-05, E-06, E-07, E-08.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

В skills.json Codex описан только каналом skills CLI. Install/update имеют только skills CLI, Claude plugin и local runtime операции. Узкая filesystem инвентаризация прочитала 336 SKILL.md candidates в hub и семейных Claude/Codex caches; все 28 skill names имеют hub, для 25 names есть native Codex plugin cache (telegram только hub/Claude в измерении). Historical cache versions не равны active providers. Провайдер, реально выбранный host для следующей/текущей сессии, launcher не разрешает и его digest не сравнивает.

- [repo://sshlg-skills/skills.json:225](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/skills.json#L225)
- [repo://sshlg-skills/bin/sshlg-skills.js:231](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L231)
- [repo://sshlg-skills/bin/sshlg-skills.js:283](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L283)
- [repo://sshlg-skills/bin/sshlg-skills.js:323](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L323)
- [repo://sshlg-skills/bin/sshlg-skills.js:64](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L64)
- [repo://sheleg-design/bin/cli.js:528](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L528)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Ввести read-only provider resolver с host API adapter, project/user/admin scopes, exact skill id и namespace, canonical realpath, source digest, installed/enabled/applicable/loaded states. Codex native plugin install/update передавать только поддерживаемому host API; при отсутствии API выдавать UNSUPPORTED_UPDATE и конкретный ручной шаг. Receipt имеет desired/installed/loaded digest и reload-required, а неизвестное не окрашивает зелёным. Одинаковые capabilities должны лежать под make-skill/runtime/toolkit/update, а не в разных списках.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fixture: stale native plugin + fresh hub => report mismatch и не overall current.
Fixture: cache old versions + только одна enabled version => candidates не считаются active duplicates.
Project override и namespaced invocation разрешаются отдельно; unknown runtime precedence => UNKNOWN, без prune.
После supported update/reload smoke-test host показывает нужный skill/version/source digest; без live host статус NOT-RUN.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b", "sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sshlg-skills`, `repo:repo://sheleg-design`, `file:repo://sshlg-skills/skills.json`, `file:repo://sshlg-skills/bin/sshlg-skills.js`, `file:repo://sheleg-design/bin/cli.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-07.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
