# FIX-AS-10.01 — Повтор проверки старого ответа назван проверкой изменения решения модели

Parent `FIX-AS-10` · implementation · P2

## Что и зачем

Повтор проверки старого ответа назван проверкой изменения решения модели

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-evals/references/otel-genai.md`

implementation; exact local source path. SHA256: `8ac9f1b7fec5d03e989b2eff6838a55e36f918cb99d63b1d62f72932e06bcb17`

```text
170: | Sense | What re-runs | Cost | Answers |
171: |---|---|---|---|
172: | **Durable execution** (Temporal) | nothing — recorded results are replayed and only the failed step retries | free, deterministic | can I resume without redoing 20 web searches |
173: | **Trace playground** (Phoenix) | the model call, against the live provider, with an edited prompt | a real call | would a different prompt have done better |
174: | **Fixture replay** (this skill, §2 single-step) | an assertion over a stored run | free | did the decision at this point change |
175:
176: They are not interchangeable, and a runbook that says *"replay the run"* has not said what it
177: means. Name the sense.
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md`

implementation; exact local source path. SHA256: `18c38888b66555da7a2f301740e420b47e44d8194c2dab2c20ea94a19b02394f`

```text
58: ### Single-step — validates a run
59:
60: Fixture is a serialized run: prompt, tool schemas, context. Assert the decision at that
61: point — tool name, argument shape.
62:
63: > "Schedule a meeting with Harrison tomorrow morning", with `find_meeting_times`,
64: > `schedule_meeting` and `send_email` available, must call `find_meeting_times` first.
65:
66: This is the one granularity where *first* is a legitimate assertion: the fixture is a
67: single decision, so the ordering claim is the subject rather than a proxy for it. Across a
68: whole trajectory it stops being one — see §5.
69:
70: Cheap, deterministic, CI-blocking. **Precondition: a stable agent architecture.** These
71: break on a graph refactor, and a suite that fails on every refactor gets deleted.
72:
73: ### Full-turn — validates a trace
74:
75: Assert on three axes at once, with three different mechanisms:
76:
77: | Axis | Assert | With |
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-10.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Три разных операции: regrade old output, execute candidate against frozen fixture, deterministic workflow replay. Хранить candidate version/output и оценку отдельно от старого trace; стоимость model call и stochasticity отражать.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-10.01.json), [parent](../parents/FIX-AS-10.json). Полный audit не required prompt input.
