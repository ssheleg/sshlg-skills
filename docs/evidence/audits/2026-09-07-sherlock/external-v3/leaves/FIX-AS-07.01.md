# FIX-AS-07.01 — Запрет проверки порядка пропускает подтверждение после действия

Parent `FIX-AS-07` · implementation · P1

## Что и зачем

Запрет проверки порядка пропускает подтверждение после действия

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md`

implementation; exact local source path. SHA256: `18c38888b66555da7a2f301740e420b47e44d8194c2dab2c20ea94a19b02394f`

```text
75: Assert on three axes at once, with three different mechanisms:
76:
77: | Axis | Assert | With |
78: |---|---|---|
79: | Trajectory | what the run **must not** do, and what it must have touched — never the order | set/subset matchers, forbidden-call lists |
80: | Final response | quality, tone, policy compliance | rubric or judge |
81: | **State change** | the memory row exists, the file was written, the artifact is there | direct inspection of the side effect |
82:
83: The third axis is the one people forget. **Assert on side effects, not only on prose** —
84: an agent that says it saved the preference and did not is a pass on two axes out of three.
85:
86: Easiest inputs to generate, hardest outputs to validate automatically.
87:
88: ### Multi-turn — validates a thread
89:
90: A scripted turn sequence with a **checkpoint after every turn and fail-fast on
91: deviation**. Without that, turn 3 goes off the rails and turns 4–10 assert nothing while
92: still reporting a result.
93:
94: > Turn 1: "I prefer Python over JavaScript." Turn 3's output must still be Python.
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Запрещать только избыточный exact global sequence. Разрешить temporal assertions и partial order: authorization precedes effect, read fresh precedes write, transaction completes before publish.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-07.01.json), [parent](../parents/FIX-AS-07.json). Полный audit не required prompt input.
