# FIX-VD-07 — Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит

P2 · очередь 1 · расчётная волна 7 · planned_not_implemented

Модули: sheleg-design, sshlg-skills. Требования: E-05, E-06, E-03.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

В текущем reachable ~/.agents/skills/frontend-design/SKILL.md нет Inter/Roboto/Arial bans. Исходный upstream по source string не переаудирован, поэтому finding именно про несоответствие recommendation реально достигнутому skill на этой машине. В retrieved Nicegram turn его чтение не найдено; обвинять конкурирующий skill в результате Nicegram нельзя.

- [repo://sshlg-skills/lib/packs.js:152](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/packs.js#L152)
- [machine-snapshot://.agents/skills/frontend-design/SKILL.md:19](machine-snapshot://.agents/skills/frontend-design/SKILL.md:19)
- [machine-snapshot://.agents/skills/frontend-design/SKILL.md:31](machine-snapshot://.agents/skills/frontend-design/SKILL.md:31)
- [machine-snapshot://.agents/skills/frontend-design/SKILL.md:33](machine-snapshot://.agents/skills/frontend-design/SKILL.md:33)
- [repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:104](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L104)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [supporting evidence appendix](../design-depth.json) · sha256 `f42d9e1b0368b4fcdf589090548a5a3ae4cdf0338cb6cca2448c3adfabce4eb3`
- [supporting evidence appendix](../nicegram-route-receipt.json) · sha256 `59b1771fe8f2881fd0f0ca9f12c30461e0d909397fa025092a1958b8658ede49`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Указывать resolved path/digest/version/provenance и обновлять why по достигнутому descriptor либо помечать как generic upstream description. Для каждого cast tool давать scoped input: что fixed, что open, какие deliverables нужны, чьи инструкции о copy/implementation применимы. frontend-design использовать для concept hypotheses/visual critique внутри согласованных границ, а не второй end-to-end router.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fixture с двумя разными frontend-design реализациями одного имени показывает оба источника, выбирает actual resolved file и не печатает отсутствующие bans. Cast handoff для preserve-brand передаёт palette invariants, но оставляет composition exploration; для exact-Figma reproduction отключает aesthetic risk. Route trace хранит digest прочитанной версии.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42", "sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sheleg-design`, `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/lib/packs.js`, `file:repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-VD-07.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
