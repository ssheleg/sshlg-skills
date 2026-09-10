# FIX-TP-01.02 — Наследование модели

Parent `FIX-TP-01` · implementation · P1

## Что и зачем

Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`

implementation; exact local source path. SHA256: `f8876b8eb0b20169e7ca037869c4eb83164754c9bc271da52895fc27c1d0dc8a`

```text
95: WHY→UI→scenario chain runs through `/ux` and its linter, which belongs in the host's
96: CI so UX drift cannot merge. **Not installed on a UI task? The stage-3 spec gate
97: stops** — offer the install and wait (`references/companion-skills.md`).
98:
99: **The grill is built in and mandatory** (`references/grill.md`). No "clear enough task"
100: exemption and no stage 1 without a committed, operator-confirmed brief. It produces the
101: **REQ spine** — the request as an addressable list, each row naming how it is verified —
102: which stages 3–5 trace to, stage 4 set-compares against, and **stage 10 accounts for
103: every one of**, turning the pipeline from a funnel into a circle.
104:
105: **Harvest before you ask** (`references/knowledge-sources.md`). Stage 0 opens by
106: pulling what the project already knows about *this* task, writes the source ledger
107: into the brief, and then interviews **against** it — so the operator outranks any
108: document, **but only out loud**, and an override is a recorded decision rather than
109: an undetected divergence. That ledger is also stage 9's work list. Which sources,
110: and the two ways the retro is read — standing instructions in full because they
111: bind this run, the log queried because nothing caps it — are in
112: `references/knowledge-sources.md` and `references/retrospective.md`.
113:
114: **Three artifacts close a run, not two — and they are a convergence, not a sequence.**
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/model-tiering.md`

implementation; exact local source path. SHA256: `eec87d302fcc42c87888e194ded48cd1e3ee3c3d575b2089307f754a2240c9d9`

```text
12:
13: Every stage runs on that model by default. The pipeline is a full delivery cycle:
14: the grill has to hear what the operator didn't say, the spec has to lock contracts
15: a zero-context implementer will follow, and the build has to hold a plan in its
16: head. Downgrading any of those to save tokens costs more in rework than it saves.
17:
18: ## Never hardcode a model id
19:
20: Model ids go stale — generations ship, tiers get renamed, and the operator may not
21: even be on the same provider. So:
22:
23: - **Resolve at runtime.** Look at what the environment actually offers (`/model`,
24:   the harness's model list) and pick the top reasoning tier available there.
25: - **Treat any id in this repo as an example**, including in `pipeline.example.json`.
26:   Stage configs use provider-agnostic tokens:
27:   - `default` — the model confirmed for this run (the recommendation above)
28:   - `inherit` — whatever the operator is currently on; no recommendation
29: - **Another provider is fine.** "Top tier available" is the contract. If the
30:   environment has no Opus-class model, the best available one is the right answer —
31:   say which one you settled on and keep going.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-tp-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сохранить explicit model/effort; tier advice отделить от обязательного выбора. Никакой смены по размеру задачи без основания.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

План и executor сохраняют user model; unsupported capability отражается отдельно.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TP-01.02.json), [parent](../parents/FIX-TP-01.json). Полный audit не required prompt input.
