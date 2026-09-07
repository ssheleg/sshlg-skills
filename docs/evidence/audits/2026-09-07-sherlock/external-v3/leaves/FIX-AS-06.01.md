# FIX-AS-06.01 — Первый релиз фактически остаётся без исполняемого eval-корпуса

Parent `FIX-AS-06` · implementation · P1

## Что и зачем

Первый релиз фактически остаётся без исполняемого eval-корпуса

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
241:
242: | Tier | Is | Written | Because |
243: |---|---|---|---|
244: | **Observable** | the criterion that would show one requirement was met — a pass/fail rubric (§4), a trajectory or state-change assertion (§2) | **before the implementation exists** | a requirement with no observable is unfinished: attach one afterwards and you are inventing the test having already seen the code, so the output has decided what counts as success |
245: | **Corpus** | the inputs those criteria run against — fixtures, datasets, minimised production failures | **from production, never up front** | every natural-language input is unique, so the edge cases cannot be enumerated offline; inputs invented in advance test your imagination |
246:
247: **Neither rule softens the other, because they govern different objects.** An observable is
248: a *criterion* — what would count as success. A corpus is a *sample* — which inputs you
249: happen to have. The criterion costs nothing to write early and can only be written honestly
250: early; the sample written early is green on inputs no user sends. Both therefore hold at
251: full strength: **a requirement that ships without an observable is unfinished, and a corpus
252: with no production in it is imagination.** The requirement itself gets its id and its
253: definition of done from `task-pipeline`'s REQ spine — what this pack owns is the
254: observable's *form*, not the register it hangs on.
255:
256: **The first release has no production, so its offline gate is observables only** (§3). That
257: is not the corpus rule suspended for a special case: the corpus is empty because nothing has
258: run yet, and it fills from the first real traces. Inventing *inputs* to fill it sooner would
259: still be imagination.
260:
```

### Edit `repo://agent-stack/test/evals/scenarios.json`

External-method enrichment owned by this outcome. SHA256: `2505896c550f53a2ea820dacc559826c21e59809fd0623d6838b79155e17220a`

```text
1: {
2:   "note": "Score each expected_behavior line independently. These are authored evaluations, not executed results.",
3:   "scenarios": [
4:     {
5:       "id": "s01",
6:       "title": "Resumable orchestrator",
7:       "skills": [
8:         "agent-orchestrator"
9:       ],
10:       "query": "Design a production orchestrator for research tasks with parallel collection, one checker, a human approval before publication, and resume after restart.",
11:       "files": [],
12:       "expected_behavior": [
13:         "Represents work as a graph whose edges name payloads",
14:         "Places a convergence checker before the consuming node",
15:         "Persists enough state to resume without replaying completed side effects",
16:         "Names provider failure and context-pressure behavior"
17:       ]
18:     },
19:     {
20:       "id": "s02",
```

### Create `repo://agent-stack/test/evals/fixtures/bootstrap-corpus.json`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разрешить curated/synthetic/manual seed corpus до релиза, маркировать источник каждого input; дополнять production regressions. Release gate обязан иметь executed trials, а observable-only — состояние specification-ready, не release-ready.

Уточнение PXS-03: ENRICH_EXISTING_AS06; Не брать OpenAI/MCP evaluator, XML wrappers или API keys Точный scalar matcher только для scalar задач; side effects и trajectories отдельные assertions Seed corpus дополняется production traces, не объявляется доказательством полного coverage
Разрешить synthetic bootstrap corpus в agent-evals с явной provenance рядом с production corpus.
Добавить шесть замороженных локальных кейсов с known answers и forbidden side effects.
Связать кейсы с behavioral scenarios и проверить isolation плюс TEST_ERROR classification.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.
Первый релиз имеет исполняемые offline assertions без production telemetry
Повреждённый fixture/input/runner => TEST_ERROR, не behavior fail/pass
Isolation: результат case B одинаков независимо от запуска case A
Первый релиз имеет исполняемые offline assertions без production telemetry
Повреждённый fixture/input/runner => TEST_ERROR, не behavior fail/pass
Isolation: результат case B одинаков независимо от запуска case A

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-06.01.json), [parent](../parents/FIX-AS-06.json). Полный audit не required prompt input.
