# FIX-SY-04 — Task lease не защищает общий файл от владельца другой task lease

P1 · очередь 0 · расчётная волна 4 · planned_not_implemented

Модули: agent-sync, agent-stack. Требования: E-05, E-06.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

guard(path) разрешает запись при наличии любого held key. Это честно описано как one lease covers every guarded file, но не обеспечивает обещание who may write this file/no collisions. Ключи разных задач не взаимно исключают общий registry.

- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2848](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L2848)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:235](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L235)
- [repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md:237](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md#L237)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:agent-sync](../context/modules/agent-sync.md) · sha256 `91be68a9bb12e4e06b95d9c049f885d2ec1762ff4e5bf7fea4ceb1b4146a69d6`
- [module:agent-stack](../context/modules/agent-stack.md) · sha256 `7f735a083a16130f6f7c517bfe939c7765ecd15e2f0b2192676e3bb133b0e2db`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:evidence](../context/contracts/evidence.md) · sha256 `5eebd2b6e79abf83c1f46244a65acd4abc4624f688000166a6204635f1ce7a88`
- [supporting evidence appendix](../../agents-sync.json) · sha256 `2a09f147a9831de08154965e825930738fc668f41918c8304d19c727a0b146ed`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Разделить task ownership и resource mutation lock. Для shared registries — краткий file/register transaction lock либо append-only event log с CAS; canonical paths и common repo identity. Изолированные worktrees плюс merge policy — другой честно объявленный режим.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"agent-sync": "ef45d404d1604a9a0d142f983b5cccc495133ca0", "agent-stack": "1f99f8f0914f122da1629e6ede6fd60a7e23d1ea"}`.

Write scope: `repo:repo://agent-sync`, `repo:repo://agent-stack`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`, `file:repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-SY-04.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
