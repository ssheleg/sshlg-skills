# FIX-AS-08 — Статистические правила выдают предположения за универсальные границы

P2 · очередь 2 · расчётная волна 11 · planned_not_implemented

Модули: agent-stack. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Wald interval дан без ограничений по n/p; зависимость всегда должна расширять band; p^k объявлено worst case; независимые средние запрещено сравнивать вообще. Всё это требует дополнительных предположений.

- [repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:31](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L31)
- [repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:52](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L52)
- [repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:106](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L106)
- [repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md:118](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/references/statistics.md#L118)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:agent-stack](../context/modules/agent-stack.md) · sha256 `7f735a083a16130f6f7c517bfe939c7765ecd15e2f0b2192676e3bb133b0e2db`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../agents-sync.json) · sha256 `2a09f147a9831de08154965e825930738fc668f41918c8304d19c727a0b146ed`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Для proportion использовать Wilson/exact и явно описать iid/cluster assumptions; pass@k/pass^k считать по task-level trials. Для clustered/paired результатов применять соответствующий bootstrap/McNemar; unpaired сравнение допускается с его SE. Вместо never/worst case дать условные утверждения.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"agent-stack": "1f99f8f0914f122da1629e6ede6fd60a7e23d1ea"}`.

Write scope: `repo:repo://agent-stack`, `file:repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-AS-08.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
