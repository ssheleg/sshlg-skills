# FIX-AS-13.01 — Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks

Parent `FIX-AS-13` · implementation · P2

## Что и зачем

Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-interop/SKILL.md`

implementation; exact local source path. SHA256: `7f53a82ad5a3b4e64792ddefd66bf91e11cb511eaec53d637e8a616c22261558`

```text
70: tasks, while MCP is more about agents using capabilities."* Real systems run both — an A2A
71: server whose internals speak MCP — and that is the recommended architecture, not a
72: compromise.
73:
74: **The tell that you picked wrong:** if you find yourself inventing a task lifecycle, a
75: progress channel and a resumable handle on top of `tools/call`, you wanted A2A. If you find
76: yourself publishing an agent card for something that is one HTTP call with a JSON schema,
77: you wanted MCP.
78:
79: ---
80:
81: ## References
82:
83: Each file opens with its own **Load this when** line and its revision stamp. This table is
84: an index; the trigger lives in the file, so the two cannot drift apart.
85:
86: | File | Read it when |
87: |---|---|
88: | [`references/mcp.md`](references/mcp.md) | you are **building or calling an MCP server** — the layers, per-request `_meta`, `server/discover`, the three server primitives and the one surviving client primitive, notifications, caching, transports, and the full deprecation register |
89: | [`references/mcp-ship.md`](references/mcp-ship.md) | the server is written and **cannot be reached** — mounting inside an existing web app, transport-level auth, client config, and the 404 that is really a double path |
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp.md`

implementation; exact local source path. SHA256: `36762b68129af76c53e35c35530f1c1309c8aac6a815c4549c1ee09d055738f2`

```text
216: ## Extensions
217:
218: Opt-in, negotiated, and worth checking before inventing an equivalent:
219:
220: - **Tasks** — a durable handle for long-running requests: poll for status, supply input
221:   mid-flight, retrieve the result later. This is the answer to "my tool takes ten minutes",
222:   and it exists so you do not hold a connection open or invent a job table.
223: - **MCP Apps** — interactive UI rendered inline in the conversation.
224: - **Skills over MCP** — structured instruction sets discovered and consumed through MCP,
225:   which is how a server ships Agent Skills rather than only tools.
226:
227: ## Traps
228:
229: - **Writing the client against a remembered handshake.** Covered above; it is the big one.
230: - **Treating `isError: true` as success.** It arrives inside a 200.
231: - **A tool named for the verb, not the domain.** `search` collides the moment a second
232:   server is connected; `flights_search` does not. Federation makes this expensive later
233:   (`gateway.md`).
234: - **Trusting tool output.** The specification is explicit that tool descriptions and
235:   annotations are **untrusted unless the server is trusted**. Output from a server is input
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-13.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Главный dispatch criterion: capability/tool execution против автономного peer outcome. Длительность — второй вопрос о Tasks capability/transport, не выбор протокола. Проверять фактически поддержанные extensions клиента/SDK.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-13.01.json), [parent](../parents/FIX-AS-13.json). Полный audit не required prompt input.
