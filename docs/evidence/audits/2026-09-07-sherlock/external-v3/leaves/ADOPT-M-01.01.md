# ADOPT-M-01.01 — Добавить выборочную загрузку refs с бюджетом

Parent `ADOPT-M-01` · implementation · P2

## Что и зачем

Добавить выборочную загрузку refs с бюджетом

Конкретная реализация приведена в шагах ниже.

## Решения

В authoring описать условие загрузки каждой reference и разделение primary/appendix. Обязательные решения и acceptance не усекать; 500 строк — эвристика длины, не доказательство token budget.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/references/authoring.md`

reviewed adoption target. SHA256: `793d7eb0f76ebeb273330af79b7bc923aa93da9a7296f20199120a8afe53d907`

```text
1: # Authoring craft — writing a body an agent actually follows
2:
3: **Load this when:** writing or rewriting a `SKILL.md` body, tuning a description
4: that fires too rarely or too often, deciding how prescriptive to be, bundling
5: `scripts/`, or building the evaluations that prove the skill works.
6:
7: Hard limits and field rules are in `references/agent-skills-spec.md`; this file is
8: the craft on top of them. Sources: Anthropic's
9: [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
10: and [agentskills.io](https://agentskills.io/skill-creation/best-practices).
11: *Read from both on 2026-08-03.*
12:
13: ## Contents
14:
15: - Naming — what to call the skill
16: - Description — the entire triggering budget
17: - Where a rule lives decides whether it exists
18: - Trigger eval loop — when firing is wrong
19: - Degrees of freedom — how prescriptive to be
20: - Body patterns worth copying
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/adopt-m-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: В authoring описать условие загрузки каждой reference и разделение primary/appendix. Обязательные решения и acceptance не усекать; 500 строк — эвристика длины, не доказательство token budget.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Large multilingual fixture resolves only requiredvariant; missingrequiredref blocksdispatch; report actualtokenizer or explicitestimate.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-01.01.json), [parent](../parents/ADOPT-M-01.json). Полный audit не required prompt input.
