# FIX-UP-08 — Host roots фиксированы и расходятся с поддерживаемыми overrides

P2 · очередь 2 · расчётная волна 23 · planned_not_implemented

Модули: sshlg-skills, task-pipeline, super-ux, sheleg-design. Требования: E-05, E-06, E-07, E-08.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Fixture custom-host-root запускает update --agent codex --no-claude с CODEX_HOME в отдельной temp папке. Custom AGENTS.md остаётся прежним, default ~/.codex/AGENTS.md меняется. Source paths для Claude guards также жёстко используют .claude. Текущий primary upstream skills CLI учитывает CODEX_HOME и CLAUDE_CONFIG_DIR, поэтому subprocess installation и family router/prune могут работать с разными home roots.

- [repo://sshlg-skills/lib/apply.js:34](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L34)
- [repo://sshlg-skills/lib/apply.js:187](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L187)
- [repo://sshlg-skills/bin/sshlg-skills.js:138](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L138)
- [repo://task-pipeline/bin/task-pipeline.js:196](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L196)
- [repo://task-pipeline/bin/task-pipeline.js:203](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L203)
- [repo://super-ux/bin/super-ux.js:47](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L47)
- [repo://sheleg-design/bin/cli.js:381](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L381)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [module:super-ux](../context/modules/super-ux.md) · sha256 `b5cc2eac477dd48cc3867614cc307571fda37bf29552d85d8a78bb5559b753ce`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Единый HostContext resolver: explicit CLI root > документированный host env > platform default; использовать его и для install, inventory, guards, router, consent scope, rollback. Поддерживать alternate profiles явно. Не выводить наличие установленного host только из случайной оставшейся директории; capability probe отдельно от pathname.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fixture custom CODEX_HOME/CLAUDE_CONFIG_DIR меняет только выбранный root, default stays byte-identical.
Plugin collision в custom root обнаруживается до записи; stale default root не блокирует другой профиль.
Windows/XDG/root-with-spaces и missing host дают отдельные протестированные results; неподдержанные платформы UNKNOWN.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-03](FIX-UP-03.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- [FIX-UP-07](FIX-UP-07.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b", "task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463", "sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42"}`.

Write scope: `repo:repo://sshlg-skills`, `repo:repo://task-pipeline`, `repo:repo://super-ux`, `repo:repo://sheleg-design`, `file:repo://sshlg-skills/lib/apply.js`, `file:repo://sshlg-skills/bin/sshlg-skills.js`, `file:repo://task-pipeline/bin/task-pipeline.js`, `file:repo://super-ux/bin/super-ux.js`, `file:repo://sheleg-design/bin/cli.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-08.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
