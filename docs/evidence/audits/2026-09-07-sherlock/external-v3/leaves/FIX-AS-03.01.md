# FIX-AS-03.01 — Memory identity and contradiction

Parent `FIX-AS-03` · implementation · P1

## Что и зачем

Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/patterns.md`

implementation; exact local source path. SHA256: `1a4d60f4811dd4b9fa99f1c6d6f72223790a4ee49bb8146e8dfe9bf606eee550`

```text
361: ```
362:
363: ---
364:
365: ## Confidence Management
366:
367: ```
368: LEARNING CONFIDENCE:
369:   Initial:     0.6
370:   Confirmed:   +0.1 (cap 1.0)
371:   Applied:     tracked (times_applied counter)
372:   Contradicted: -0.3
373:   Stale (30d): -0.02/month
374:   Deactivated: below 0.2
375:
376: SESSION NOTE CONFIDENCE:
377:   Initial:     0.7
378:   Confirmed:   +0.1 (cap 1.0)
379:   Verified:    +0.15 (exempt from decay)
380:   Stale (60d): -0.1 per cycle
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/memory-lifecycle.md`

implementation; exact local source path. SHA256: `9e46e6538eac0f29cbe32f0d07f141bf4db31f33b445d2893d8ae966a8c18397`

```text
144: | Consolidation, local | `patterns.md` → Fuzzy Deduplication |
145: | Updating, conflict resolution | `patterns.md` → Conflict Resolution |
146: | Forgetting, time-based | `patterns.md` → Confidence Management |
147: | Global integration, cross-scope | `patterns.md` → Cross-Resource Learning Transfer |
148: | **Frequency-based forgetting** | **nowhere — and the long-tail trap above is why that is a deliberate omission rather than a gap to close carelessly** |
149: | **Temporal annotation instead of deletion** | **nowhere** — Conflict Resolution currently resolves rather than annotates |
150: | **Dual-phase updating** | **nowhere** — the pack updates inline |
151:
152: The last three are named as absent rather than quietly added: each is a real change to a
153: mechanism that is in production, and this file's job is to say what the options are, not to
154: change `patterns.md` from a survey.
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Entity/attribute/scope/provenance/validity обязательны; similarity только candidate retrieval; contradiction gate перед merge.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Похожая противоположная инструкция не усиливается и не перезаписывает актуальную.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-03.01.json), [parent](../parents/FIX-AS-03.json). Полный audit не required prompt input.
