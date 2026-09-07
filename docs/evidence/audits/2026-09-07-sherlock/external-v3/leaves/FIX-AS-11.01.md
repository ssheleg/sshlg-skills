# FIX-AS-11.01 — Approval grant contract

Parent `FIX-AS-11` · implementation · P1

## Что и зачем

confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/tools.md`

implementation; exact local source path. SHA256: `158ea7770d04e94d1c326d17e6fc08ebab2ab9ff583a65ab3e98bdf38805fa98`

```text
122: - Absolute paths instead of relative ones, when relative paths get resolved against a
123:   directory the agent guessed.
124: - An `enum` instead of a free-text field with a list of valid values in the description.
125: - One tool that does the two-step correctly instead of two tools that must be ordered.
126: - A required `confirm: true` on a destructive action, so a partially-formed call fails
127:   closed.
128:
129: ## Annotations, and the risk one tool cannot show you
130:
131: MCP tools carry four hints, and their defaults are asymmetric on purpose:
132:
133: | Hint | Default | So an unannotated tool is assumed to be |
134: |---|---|---|
135: | `readOnlyHint` | `false` | one that writes |
136: | `destructiveHint` | `true` | destructive |
137: | `idempotentHint` | `false` | unsafe to repeat |
138: | `openWorldHint` | `true` | reaching outside your system |
139:
140: **A server author who omits annotations entirely has declared the most dangerous shape**,
141: which is the correct fail-closed choice and the opposite of what most authors assume they
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-11.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Trusted grant связывает principal/action/arguments/expiry или существующее user authorization; confirm:true лишь syntax guard.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Произвольный client boolean не создаёт authorization, stale grant не разрешает changed arguments.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-11.01.json), [parent](../parents/FIX-AS-11.json). Полный audit не required prompt input.
