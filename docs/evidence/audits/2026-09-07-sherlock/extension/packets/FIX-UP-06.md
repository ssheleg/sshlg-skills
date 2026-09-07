# FIX-UP-06 — Super-ux возвращает успешный exit code после неудачной установки

P2 · очередь 2 · расчётная волна 11 · planned_not_implemented

Модули: super-ux. Требования: E-05, E-06, E-07, E-08.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Fixture super-menu-failure: stdin выбирает пункт 3 (Claude plugin); все четыре вызванных child operations замоканы с status1. Вывод содержит plugin install failed, но процесс заканчивается exit0. installClaudePlugin не возвращает status; menu отслеживает только refused ветку skills picker и печатает update line.

- [repo://super-ux/bin/super-ux.js:244](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L244)
- [repo://super-ux/bin/super-ux.js:264](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L264)
- [repo://super-ux/bin/super-ux.js:278](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L278)
- [repo://super-ux/bin/super-ux.js:445](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L445)
- [repo://super-ux/bin/super-ux.js:459](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L459)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:super-ux](../context/modules/super-ux.md) · sha256 `b5cc2eac477dd48cc3867614cc307571fda37bf29552d85d8a78bb5559b753ce`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Все install functions возвращают typed result installed|unchanged|refused|unsupported|failed; menu агрегирует только выбранные обязательные операции, устанавливает nonzero на failure и печатает completion отдельно от optional routing offer. Различать ENOENT, permission, network и backend nonzero, сохраняя command, exit/signal и recovery.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Selected plugin failure и skills CLI failure => exit1; explicit refusal=>3; unsupported host=>выбранный стабильный nonzero.
Optional absent router launcher не превращает удачную установку skill в failure.
Mixed selections дают PARTIAL с конкретными failed operations и не печатают overall success.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463"}`.

Write scope: `repo:repo://super-ux`, `file:repo://super-ux/bin/super-ux.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-06.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
