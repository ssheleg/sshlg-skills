# FIX-AS-08.01 — Proportion and trial units

Parent `FIX-AS-08` · implementation · P2

## Что и зачем

Статистические правила выдают предположения за универсальные границы

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/statistics.md`

implementation; exact local source path. SHA256: `a9da4f542487b66e4005e4031213ea6e9aa8cee048a1dba60647fa3f3bbe8943`

```text
27: ```
28: SE(p) = sqrt( p * (1 - p) / n )
29: ```
30:
31: The 95% band is roughly `±1.96 · SE`. Computed, not quoted:
32:
33: | n | p | 95% band |
34: |---|---|---|
35: | 100 | 0.70 | **±8.98 pp** |
36: | 400 | 0.70 | ±4.49 pp |
37: | 1000 | 0.70 | ±2.84 pp |
38:
39: ```python
40: import math
41: def band(p, n): return 1.96 * math.sqrt(p * (1 - p) / n) * 100   # percentage points
42: ```
43:
44: **So "the new one gets 73% where the old one got 70%, on a hundred cases" is not a
45: result.** It is a number inside its own noise. The error shrinks as `1/√n`, which is the
46: whole practical consequence: **the fix for a 2–3 pp expected gain is more tasks, not more
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Wilson/exact для proportion с iid/cluster assumptions; pass@k/pass^k по task-level trials.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Нулевая/малая выборка не универсальная граница; повторные trials не считаются независимыми tasks.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-08.01.json), [parent](../parents/FIX-AS-08.json). Полный audit не required prompt input.
