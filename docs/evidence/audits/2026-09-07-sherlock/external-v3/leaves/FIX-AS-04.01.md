# FIX-AS-04.01 — Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload

Parent `FIX-AS-04` · implementation · P1

## Что и зачем

Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md`

implementation; exact local source path. SHA256: `c8900c2f7247937e9a558dedae5d1fd184544a71da02952df20ec546597d5d45`

```text
281: [`references/graph-engineering.md`](references/graph-engineering.md).
282:
283: Four rules, and these are the ones that change code:
284:
285: - **Label every edge with what crosses it. No payload, no edge.** Run the fake-edge test
286:   over any chain you inherited: write the steps as boxes, ask of each arrow whether data
287:   from A actually enters B, and delete the arrows that only encode the order somebody
288:   typed. Two or three per workflow is the normal yield.
289: - **`depends_on` is a claim, so execute by layer.** §5's executor walked `plan.stages` in
290:   list order beside a model that declared its dependencies — which serialises a plan that
291:   went to the trouble of saying it need not be. Kahn the graph; a cycle fails the plan
292:   rather than deadlocking the run.
293: - **A parallel layer needs a checker before its convergence.** Three branches run, one
294:   returns a hallucination, and the synthesis node cannot tell: it combines all three and
295:   answers confidently. The checker decides *usable / not usable* and nothing else, and
296:   the convergence depends on **the checker**, never directly on a branch.
297: - **Static unless you can name what forces dynamic.** A graph that picks its own next
298:   nodes cannot be audited afterwards, because the shape that ran is not the shape anyone
299:   drew. Where a run has to be explainable, that settles it.
300:
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md`

implementation; exact local source path. SHA256: `27bf343eaf2ab0c7b2975ee8060f4c56623e394dca995950cade8d9bf40047b1`

```text
123: Five minutes, no tooling, and it is the highest-yield thing in this file.
124:
125: 1. Write every step as a box.
126: 2. Draw an arrow between each pair of consecutive steps.
127: 3. For each arrow ask: **does data from A actually enter B?** — not *"does B come after
128:    A"*.
129: 4. Yes → keep it, and **write the payload on the arrow**.
130: 5. No → delete it. That wait was free to give away and you were paying for it.
131: 6. Everything with no incoming arrow starts immediately.
132: 7. Everything with no outgoing arrow is a final output.
133:
134: The tell that the test is being done honestly is step 4: if the payload cell is empty,
135: the edge is fake, and the person drawing it now has to say so out loud rather than
136: leaving the arrow in place because it looked orderly.
137:
138: **Expect two or three fake edges in any workflow you have not run this against.** The
139: classic is *"review file A, then review file B"*: it reads as a sequence, and the review
140: of B never once looks at what A returned.
141:
142: ## 4. The diamond
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Типизировать ребро: data/control/authorization/resource. Для любого ребра требовать rationale и доказательство, но удалять только если нет ни причинного, ни ресурсного, ни разрешительного ограничения. Side-effect footprint и read/write sets проверять перед fan-out.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-01.01` (data): Общий typed edge contract заменяет удаление зависимостей без payload.
- `CTX-01.02` (data): Общий typed edge contract заменяет удаление зависимостей без payload.
- `CTX-01.03` (data): Общий typed edge contract заменяет удаление зависимостей без payload.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-04.01.json), [parent](../parents/FIX-AS-04.json). Полный audit не required prompt input.
