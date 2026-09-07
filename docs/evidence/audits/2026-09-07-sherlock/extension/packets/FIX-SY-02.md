# FIX-SY-02 — Общий last-renew позволяет активности одного агента подавлять продление чужих leases

P1 · очередь 0 · расчётная волна 2 · planned_not_implemented

Модули: agent-sync. Требования: E-05, E-06.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

Throttle marker лежит в .agent-sync/last-renew на checkout, а held()/refresh относятся к одному run. Любой acquire или renew сдвигает общую отметку, в том числе для чужих run.

- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1761](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1761)
- [repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py:1778](https://github.com/ssheleg/agent-sync/blob/ef45d404d1604a9a0d142f983b5cccc495133ca0/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py#L1778)

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

2. Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"agent-sync": "ef45d404d1604a9a0d142f983b5cccc495133ca0"}`.

Write scope: `repo:repo://agent-sync`, `file:repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-SY-02.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
