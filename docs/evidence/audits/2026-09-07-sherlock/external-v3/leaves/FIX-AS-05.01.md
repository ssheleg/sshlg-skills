# FIX-AS-05.01 — Аудируемость ошибочно приравнена к статическому графу

Parent `FIX-AS-05` · implementation · P2

## Что и зачем

Аудируемость ошибочно приравнена к статическому графу

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-harness/SKILL.md`

implementation; exact local source path. SHA256: `4451a75918cc367a51c602c72857a0c4ead2f50031aaedc3b8e1126cf8a361ed`

```text
97: nodes read their own output and decide what comes next.
98:
99: **Static first, always** — go dynamic only after the static version hits a wall you can
100: name, because dynamic is more powerful and much harder to control. And one row of that
101: decision is hard rather than preferential: **a run that has to be auditable is static.**
102: A dynamic graph's executed shape is not the shape anybody drew, so *"here is the design"*
103: and *"here is what happened"* stop being the same document, and every claim about the run
104: becomes unfalsifiable from outside.
105:
106: The six-row table, the rest of the model — the fake-edge test, the diamond, the checker
107: node before a convergence — and what a host actually executes when it fans out are one
108: home away: `agent-orchestrator/references/graph-engineering.md`. It is not restated here,
109: because a decision table with two homes is one that will disagree with itself.
110: ---
111:
112: ## References
113:
114: Each opens with its own **Load this when** line and a revision stamp — this material moves,
115: and `test/validate.py` fails the build on a reference that does not say when it was read.
116:
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md`

implementation; exact local source path. SHA256: `27bf343eaf2ab0c7b2975ee8060f4c56623e394dca995950cade8d9bf40047b1`

```text
259: | Reach for | When |
260: |---|---|
261: | **static** | the task repeats and the structure is the same each time |
262: | **static** | predictability and speed matter more than flexibility |
263: | **static** | **always first** — switch only after the static version hits a wall you can name |
264: | dynamic | the scope of the work depends on what is discovered along the way |
265: | dynamic | a node must choose its successors from its own output |
266: | **never dynamic** | **you will need to audit exactly what ran and why** |
267:
268: The last row is a hard rule in this pack, not a preference. A dynamic graph's executed
269: shape is not the shape anybody drew, so *"here is the graph"* and *"here is what
270: happened"* stop being the same document — and every claim about the run becomes
271: unfalsifiable from the outside. That is the same failure `agent-evals` names when a
272: system has no durable trace.
273:
274: **Most workflows that feel like they need a dynamic graph need a better static one.**
275: Dynamic is more powerful and much harder to control; it is the second reach, never the
276: first.
277:
278: ## 8. When not to build a graph at all
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-orchestrator/SKILL.md`

implementation; exact local source path. SHA256: `c8900c2f7247937e9a558dedae5d1fd184544a71da02952df20ec546597d5d45`

```text
294:   returns a hallucination, and the synthesis node cannot tell: it combines all three and
295:   answers confidently. The checker decides *usable / not usable* and nothing else, and
296:   the convergence depends on **the checker**, never directly on a branch.
297: - **Static unless you can name what forces dynamic.** A graph that picks its own next
298:   nodes cannot be audited afterwards, because the shape that ran is not the shape anyone
299:   drew. Where a run has to be explainable, that settles it.
300:
301: ---
302:
303: ## Checklist — Building a New Orchestrator
304:
305: The sections above are the map. These are the items a reader **cannot** derive from a
306: heading — the ones that were learned by getting them wrong:
307:
308: - [ ] In-loop trimming at ~80% of the window, wrap-up injected at ~70%, and a max-iteration
309:       guard that composes a partial answer rather than returning nothing
310: - [ ] A recoverable provider error **refunds** its iteration; a misconfiguration must not
311:       spend the budget that exists to stop a runaway
312: - [ ] Retries and fallbacks are capped **in total** — three providers × three retries is
313:       nine calls for one prompt
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Статический граф оставить предпочтением для предсказуемости. Аудируемость определять через полноту execution record, версии policy и детерминированные границы; динамике поставить budget/depth/node caps и provenance.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-05.01.json), [parent](../parents/FIX-AS-05.json). Полный audit не required prompt input.
