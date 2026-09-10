# FIX-SY-06 — Одно gated смешивает lease guarantee, видимость и наличие host enforcement

P2 · очередь 2 · расчётная волна 16 · planned_not_implemented

Модули: agent-sync. Требования: E-05, E-06.

Корректность и поддерживаемость после независимых P1 fixes.

## Проблема и доказательства

Код gated зависит от cfg и lease_mode. SKILL требует ungated без Claude hooks; backend-fs требует ungated по отсутствию shared awareness; adapter contract ещё связывает это с capabilities record plane. Один boolean отвечает на три разных вопроса.

- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1375](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1375)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:2937](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L2937)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md:45](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/SKILL.md#L45)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/backend-fs.md:36](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/references/backend-fs.md#L36)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md:55](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md#L55)

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

2. Заменить на независимые lease_scope, enforcement_mode, awareness_scope, identity_strength и backend_health. В generated docs брать значения из runtime evidence; временно явно расшифровать legacy gated и убрать противоречащие references.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-07](FIX-UP-07.md) · data: Уровень enforcement объявляется по capabilities текущего host/provider.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"agent-sync": "ef45d404d1604a9a0d142f983b5cccc495133ca0"}`.

Write scope: `repo:repo://agent-sync`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/backend-fs.md`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-SY-06.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
