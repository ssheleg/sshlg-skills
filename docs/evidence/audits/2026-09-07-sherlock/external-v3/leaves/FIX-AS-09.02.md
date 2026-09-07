# FIX-AS-09.02 — Disjoint billing buckets

Parent `FIX-AS-09` · implementation · P1

## Что и зачем

OpenTelemetry: закрытый enum и неверное сложение вложенных token counters

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
47: | planning | `plan {gen_ai.agent.name}` | `INTERNAL` |
48: | agent creation | `create_agent {gen_ai.agent.name}` | — |
49: | MCP | `{mcp.method.name} {target}`, target being the tool or prompt name | — |
50:
51: `gen_ai.operation.name` is a **closed 17-value enum** — `chat`, `text_completion`,
52: `generate_content`, `embeddings`, `retrieval`, `fetch_response`, `execute_tool`,
53: `create_agent`, `invoke_agent`, `plan` and the rest. A value outside it is not an extension,
54: it is a name a backend cannot group by.
55:
56: **Only two attributes are Required on an inference span.** Everything else that matters —
57: the model that actually answered, token counts, finish reasons — is Recommended or
58: Conditionally Required. A conformant instrumentation can therefore be almost empty, which is
59: the reason to specify what *you* need rather than to trust conformance as a floor.
60:
61: One behaviour worth knowing before you count spans: **automatic retries collapse into one
62: span.** A span is one logical operation, not one HTTP request, so a retry storm is invisible
63: at this layer and has to be measured somewhere else.
64:
65: ## The evaluation event, missing the field §7 requires
66:
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-09.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Totals не складывать с cached/modality/reasoning subsets; provider rates применять к disjoint buckets.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Cached token не charged дважды; totals и price receipt сходятся с независимым example.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-AS-09.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-09.02.json), [parent](../parents/FIX-AS-09.json). Полный audit не required prompt input.
