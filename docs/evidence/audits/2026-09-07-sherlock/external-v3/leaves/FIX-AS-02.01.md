# FIX-AS-02.01 — Нулевой baseline путается с отсутствующим: первый реальный расход теряется

Parent `FIX-AS-02` · implementation · P1

## Что и зачем

Нулевой baseline путается с отсутствующим: первый реальный расход теряется

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
142: ```
143:
144: Three cases, and only the first is obvious:
145:
146: - `lastRecordedUsage == 0 && currentUsage > 0` → **seed the baseline, record
147:   nothing.** Recording it charges the tenant for everything spent before you
148:   started watching.
149: - `currentUsage > lastRecordedUsage` → record `delta`, then immediately enforce
150:   budgets (below).
151: - `currentUsage < lastRecordedUsage` → the key was recreated. **Resync the
152:   baseline, record nothing.** A negative delta treated as spend credits money
153:   that was never returned.
154:
155: Sync your stored limit from the provider's authoritative value on the same pass —
156: under the lock, with a re-read, so the sync does not clobber a transfer that
157: landed mid-poll.
158:
159: ---
160:
161: ## Guardrails: budgets, loops, auto-pause
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Хранить baseline_initialized, observed_at и provider_key_generation отдельно от суммы; ноль — валидное значение. На уменьшение без смены поколения переводить reconciliation в anomaly, не объяснять причину догадкой.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-02.01.json), [parent](../parents/FIX-AS-02.json). Полный audit не required prompt input.
