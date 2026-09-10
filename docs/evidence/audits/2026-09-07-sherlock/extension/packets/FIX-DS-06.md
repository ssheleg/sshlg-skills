# FIX-DS-06 — Eval-регрессия не покрывает текущий composition/runtime

P2 · очередь 2 · расчётная волна 14 · planned_not_implemented

Модули: sheleg-design, super-ux. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Design результаты версии 1.58.2, baseline 1.59.4; UX результаты 0.52.2, baseline 0.55.1. По одному trigger probe вместо обещанных трёх, scenario design оценивает планы read-only, а live build/Figma explicitly not reproducible. Это честно раскрыто, но не доказательство текущего исполнения/роутинга в полном окружении.

- [repo://sheleg-design/test/evals/RESULTS.md:16](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L16)
- [repo://sheleg-design/test/evals/RESULTS.md:38](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L38)
- [repo://sheleg-design/test/evals/RESULTS.md:47](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/test/evals/RESULTS.md#L47)
- [repo://super-ux/test/evals/RESULTS.md:12](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/RESULTS.md#L12)
- [repo://super-ux/test/evals/RESULTS.md:81](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/test/evals/RESULTS.md#L81)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [module:super-ux](../context/modules/super-ux.md) · sha256 `b5cc2eac477dd48cc3867614cc307571fda37bf29552d85d8a78bb5559b753ce`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../ux-design.json) · sha256 `2aeca4305c0efc4c514539406f2fc4a553f5410361b6252facc7db0f2f3d01e5`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Сохранить историю, добавить current-version manifest, реальные packaged installs, несколько seeds/repeats на поддержанных host/model, multi-skill route sequence и resource budget. Runtime fixtures вместо только планов; transcript/content hash сохранять за пределами /tmp.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42", "super-ux": "a60f6b423c619b37a3bb43564b58b02b6200e463"}`.

Write scope: `repo:repo://sheleg-design`, `repo:repo://super-ux`, `file:repo://sheleg-design/test/evals/RESULTS.md`, `file:repo://super-ux/test/evals/RESULTS.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-DS-06.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
