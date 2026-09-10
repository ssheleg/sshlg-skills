# FIX-AS-14.01 — Отсутствие evals ошибочно делает весь аудит unfalsifiable

Parent `FIX-AS-14` · implementation · P2

## Что и зачем

Отсутствие evals ошибочно делает весь аудит unfalsifiable

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
144: 4. **Output a prioritized plan, not a score.** A number tells nobody what to change on
145:    Monday. This is the same rule `agent-evals` applies to eval rubrics and
146:    `seo-aeo-audit` to sites.
147:
148: **The finding that ends most audits early:** the system has no evals. Everything downstream
149: is then unfalsifiable — including this audit. Say so first, and make it the first item.
150:
151: ---
152:
153: ## Boundaries
154:
155: **Against `agent-orchestrator`.** That skill owns the loop's *plumbing*: iteration guards,
156: trimming, sub-agent dispatch, provider routing, memory layers, checkpoints. This one owns
157: what the model is *told*. They meet at four seams, each crossing in exactly one place:
158:
159: 1. **Describing a tool** so the model picks the right one is this skill's
160:    `references/tools.md`; assembling the tool *list* per request from capability flags is
161:    the orchestrator's §3, which points here for the wording.
162: 2. **What the prompt says** — altitude, vocabulary, enumerated statuses — is this skill's
163:    `references/system-prompt.md`; *rebuilding* that prompt per request, in the same pass
```

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-harness/references/audit.md`

implementation; exact local source path. SHA256: `27345a957edd015425cae8ebb7086d0c75f7df6091f2a3752f33c2ec5f6bc80e`

```text
86: - **Which layer owns the boundary?** If the harness delegates it (`layers.md`), audit the surroundings instead of filing a finding.
87: - Is tool access differentiated per caller, or is one credential shared by every path?
88: - Is tool output treated as **untrusted input**?
89: - Can an audit row prove a control was applied — does it carry the **policy version**?
90: - Is there a deterministic limit anywhere consequential, or only probabilistic content checks?
91:
92: ### 7 — Evidence
93:
94: - **Are there evals?** If not, this is finding number one and everything else is unfalsifiable.
95: - Do they judge the **trajectory**, or only the final answer?
96: - Has any production failure become a permanent fixture?
97: - Is a judge calibrated against human labels, or trusted because it is a judge?
98: - Can a past run be replayed — is the execution record durable?
99:
100: ## Evidence tiers
101:
102: Every finding carries one, and the tier is part of the finding:
103:
104: | Tier | Means | Example |
105: |---|---|---|
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-14.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить source-level invariant proof, deterministic reproduction и behavioral estimate. No evals — finding о неизвестной надежности, приоритет определяется конкретным вредом; prompt-first оставить диагностической эвристикой с исключениями.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-14.01.json), [parent](../parents/FIX-AS-14.json). Полный audit не required prompt input.
