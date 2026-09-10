# FIX-AS-11.02 — Threat model limits

Parent `FIX-AS-11` · implementation · P1

## Что и зачем

confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md`

implementation; exact local source path. SHA256: `27345a957edd015425cae8ebb7086d0c75f7df6091f2a3752f33c2ec5f6bc80e`

```text
54: - Are descriptions written **for a model choosing under uncertainty**, or for a human reading docs?
55: - Do responses return **meaning or identifiers**?
56: - Is there a default limit on response size, or only an optional one?
57: - Do errors **name the next action**?
58: - Are destructive tools guarded by shape (`confirm: true`, absolute paths, enums) rather than by instruction?
59: - What was the agent **actually equipped with**? Three different truths — *required* by the task, *installed* on the machine, *loaded* by the session — and the receipts are the compiled bundle's lockfile and the session-init capability list. An audit that reads only the config file has checked the first truth of three.
60:
61: ### 3 — Control flow
62:
63: - **Workflow or agent — and was that decided, or defaulted?** An agent where a chain would do is the most expensive finding on this list.
64: - Is there a **bounded iteration guard**, and what happens at the bound — a partial answer, or nothing?
65: - Are retries and fallbacks **multiplied**? Three providers × three retries is nine calls for one prompt.
66: - Is there loop detection, or does a repeated near-identical tool call run until the budget does?
67: - Do sub-agents return **distilled summaries** or transcripts?
68:
69: ### 4 — Context
70:
71: - Does anything measure window usage **before** a request fails?
72: - Is there a compaction strategy, and does it preserve **decisions and open questions** rather than the discussion?
73: - Can a large tool result be **offloaded** and referenced, or does it land in the window whole?
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-11.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Trifecta — конкретный exfiltration pattern, не полная безопасность; audit оценивает capabilities/effects отдельно.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Отсутствующий один элемент не PASS для unrelated destructive effect.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-AS-11.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-11.02.json), [parent](../parents/FIX-AS-11.json). Полный audit не required prompt input.
