# FIX-AS-01.01 — Saga state model

Parent `FIX-AS-01` · implementation · P1

## Что и зачем

Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/llm-proxy-billing.md`

implementation; exact local source path. SHA256: `2653908730241a48363ee7db469d31bbe4aba17a80d436646b9a17b41c291660`

```text
65: | `CRITICAL_BALANCE_THRESHOLD` | $1 | permit auto-topup from the account wallet |
66: | `AUTO_TOPUP_AMOUNT` | $15 | ceiling pulled per auto-topup |
67:
68: ---
69:
70: ## Two-phase commit across a DB and an external API
71:
72: You have a database you can roll back and an HTTP API you cannot. Order matters,
73: and so does what you do when step 2 fails.
74:
75: **DB first, API second, compensate on failure:**
76:
77: 1. Acquire the lock (below).
78: 2. Read fresh balances **inside** the transaction — not before it.
79: 3. Compute the transfer and apply the markup once.
80: 4. Zero the source tier, increment the destination, write an audit row.
81: 5. Commit.
82: 6. Call the provider to raise the key limit.
83: 7. **On API failure: a compensating transaction restores every DB value and
84:    writes a `compensation` audit row.**
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Термин saga/outbox; operation_id и pending/applied/unknown/compensated, не two-phase commit.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Документированный HTTP timeout не автоматически compensated.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-01.01.json), [parent](../parents/FIX-AS-01.json). Полный audit не required prompt input.
