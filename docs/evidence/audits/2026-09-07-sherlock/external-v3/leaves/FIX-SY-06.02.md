# FIX-SY-06.02 — Generated capability docs

Parent `FIX-SY-06` · implementation · P2

## Что и зачем

Одно gated смешивает lease guarantee, видимость и наличие host enforcement

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


## Exact targets и source окна

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`

implementation; exact local source path. SHA256: `f90d370ec77b6ee50d518ccf98f74c071ed5e6b75fdd9f4bffcde5a350ca0074`

```text
41: coordination plane, where `status` shows it to every agent. Committed to a branch, a claim
42: is invisible until the merge and turns the shared roadmap into a file two branches both
43: edit. Land work with `merge`: conflicts computed **before** anything is touched, the merge
44: recorded in `docs/MERGES.md`, the `--key` lease released; `merges` says what landed while
45: you were away. **Read `references/branching.md`** before merging.
46:
47: **3. Hooks exist only in Claude Code.** Elsewhere nothing blocks a guarded edit: run
48: `guard` yourself and record the run as `ungated`. Do not describe a project as protected
49: when it is not.
50:
51: **4. Parse liberally, and never call an unreadable log a lost race.** The store rewrites
52: what you wrote — Outline turns a `- ` bullet into `* `. Emit `- `, accept `-`/`*`/`+`,
53: count anything entry-shaped that fails, and **fail loudly** past 2% unparseable. Reporting
54: `lost` when the truth is *unreadable* names a holder who does not exist. Watch for a
55: silent pre-filter: a `continue` before the regex hides bad lines from the counter.
56:
57: ## Bringing this into ANY project — the whole chain
58:
59: ```
60: scaffold  → create the documentation architecture, only where it is absent
```

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/backend-fs.md`

implementation; exact local source path. SHA256: `426276f4b3bcd7b0a4bf5a1ce6202719c9a97931d26967823add2e19f8ee8267`

```text
32: **awareness**: with it configured, the coordinator:
33:
34: 1. says so at session start, in one plain sentence;
35: 2. keeps the lease exactly as configured — `leaseBackend` is independent of this choice;
36: 3. marks every run `ungated` on the board, because nobody else can read the state.
37:
38: ## The lease is not this backend's job
39:
40: Do not look for a lease mechanism here. `leaseBackend: "local"` decides with an atomic
41: file create; `leaseBackend: "git"` decides with a pushed ref whose non-fast-forward
42: rejection is a real compare-and-swap. Both work regardless of which knowledge backend is
43: configured — see `lease-protocol.md`.
44:
45: ## When this is the right choice
46:
47: - A project with one agent at a time, which wants the journal and the board without
48:   standing up a service.
49: - An air-gapped or offline repository.
50: - A first run, before the operator has chosen a knowledge backend.
51:
```

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/references/adapter-contract.md`

implementation; exact local source path. SHA256: `b0fc59dbe77edfef302ae18dc2315247815d03b944f25e0524ebc1e1b68970a4`

```text
51: coordinator additionally:
52:
53: 1. states it once, in plain words, at session start;
54: 2. keeps the local lock as the only arbiter (`references/backend-fs.md`);
55: 3. marks every run `ungated` on the board.
56:
57: There is no third option. A lease that is not actually exclusive is worse than no
58: lease at all, because the other agent stops checking.
59:
60: ## Errors and retries
61:
62: Every primitive returns a typed failure; none may raise past the caller.
63:
64: | Condition | Handling |
65: |---|---|
66: | Rate limited | Honour the backend's own retry hint; exponential backoff; at most 5 attempts, then fail loudly |
67: | Auth failure | Fail immediately. Never retry a credential — it is not going to become valid |
68: | Not found | For `tree.ensure`, create. For everything else, report the missing path; do not create silently |
69: | Transport error | Retry twice with backoff, then fail with the underlying message intact |
70:
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-06.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Adapter/backend docs генерировать из capability contract; unavailable observations сохранять как unknown.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

SKILL/backend/adapter не дают противоречивого описания одного mode.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-SY-06.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-UP-07.01` (data): Уровень enforcement объявляется по capabilities текущего host/provider.
- `FIX-UP-07.02` (data): Уровень enforcement объявляется по capabilities текущего host/provider.
- `FIX-UP-07.03` (data): Уровень enforcement объявляется по capabilities текущего host/provider.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-06.02.json), [parent](../parents/FIX-SY-06.json). Полный audit не required prompt input.
