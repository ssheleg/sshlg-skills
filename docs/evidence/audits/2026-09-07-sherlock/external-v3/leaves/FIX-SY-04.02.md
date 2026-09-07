# FIX-SY-04.02 — Write-mode documentation

Parent `FIX-SY-04` · implementation · P1

## Что и зачем

Task lease не защищает общий файл от владельца другой task lease

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`

implementation; exact local source path. SHA256: `f90d370ec77b6ee50d518ccf98f74c071ed5e6b75fdd9f4bffcde5a350ca0074`

```text
231: python3 "$SKILL_DIR/scripts/agent_sync.py" guard docs/DECISIONS.md
232: ```
233:
234: **Exit 2 is about *this run*: it holds no lease** — not that somebody else holds that file.
235: One lease covers every guarded file; hold one or write none. A denial names the other run
236: **and its key**, because "r-x holds a lease" beside a path gets repeated as "r-x holds this
237: file". Do not edit anyway, and do not "just fix one line" — a clobbered decision looks exactly
238: like a decision.
239:
240: Claude Code's `PreToolUse` hook runs this for you. Elsewhere nothing does.
241:
242: ## Reserving an id
243:
244: Reading a "Next free ID" line is not reserving it — two agents read the same number and both
245: use it.
246:
247: ```bash
248: python3 "$SKILL_DIR/scripts/agent_sync.py" reserve DEC   # → DEC-0216
249: ```
250:
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-architecture.md`

implementation; exact local source path. SHA256: `3b3d373a0078c350bb86ce66f512b87a90d06991c5ba58e77476444f4edfc91e`

```text
233: - **A naive global store** — every agent reads and writes one space. This buys joint
234:   attention and costs **memory clutter, write contention, and no role- or permission-aware
235:   access control**.
236:
237: **What this pack already has, and what it is not.** `agent-sync` gives leases, race-free id
238: reservation and a run journal: it decides *who may write this file right now*. That is
239: coordination, and it is not shared memory — it says nothing about what an agent should be
240: allowed to *read*, or whose experiential memory is trustworthy enough to act on. An agent
241: system that needs both needs both.
242:
243: **The design rule:** make shared writes **attributed and scoped**. An entry carries who
244: wrote it and under what role, and a reader may weigh it accordingly. Unattributed shared
245: memory means one agent's wrong conclusion becomes every agent's premise, with nothing in
246: the record to trace it back.
247:
248: ## 8. Trustworthy memory
249:
250: Three pillars, and the survey's position is that these stop being features and become
251: requirements once an agent is deployed and persistent.
252:
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-04.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Описать short transaction lock и isolated worktree/merge как разные modes; не обещать enforcement по одному task owner.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Recipe для shared registry берёт resource claim, ordinary isolated code не требует global lease.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-SY-04.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-04.02.json), [parent](../parents/FIX-SY-04.json). Полный audit не required prompt input.
