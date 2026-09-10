# FIX-SY-08 — Поиск task-pipeline не учитывает native Codex plugin cache

P2 · очередь 2 · расчётная волна 17 · planned_not_implemented

Модули: agent-sync. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

pipeline_installed проверяет только ~/.claude/plugins/cache/task-pipeline и direct ~/.agents/skills/task-pipeline либо ~/.claude/skills/task-pipeline. Native ~/.codex/plugins/cache/... не входит. Наличие копии на этом компьютере может маскировать дефект.

- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:3542](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L3542)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:149](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L149)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:agent-sync](../context/modules/agent-sync.md) · sha256 `91be68a9bb12e4e06b95d9c049f885d2ec1762ff4e5bf7fea4ceb1b4146a69d6`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [supporting evidence appendix](../../agents-sync.json) · sha256 `2a09f147a9831de08154965e825930738fc668f41918c8304d19c727a0b146ed`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-07](FIX-UP-07.md) · data: Native discovery должен использовать единый provider resolver.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"agent-sync": "ef45d404d1604a9a0d142f983b5cccc495133ca0"}`.

Write scope: `repo:repo://agent-sync`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-SY-08.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
