# PXS-01.01 — Добавить source/runtime contract для внешних заимствований

Parent `PXS-01` · implementation · P2

## Что и зачем

Добавить source/runtime contract для внешних заимствований

Конкретная реализация приведена в шагах ниже.

## Решения

Общий intake остаётся в существующем enterprise.md: provenance/license/dependency closure/adapt-reference-optional-reject. Sidecar не добавляет нестандартные frontmatter fields. No API key не равно no dependency.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/references/enterprise.md`

reviewed adoption target. SHA256: `b2e23d3160ecbc5c4f38a02cf100830c6cdcd3f154c1c1e7c8dfea00874a7f24`

```text
1: # Trust, evaluation, governance — skills other people install
2:
3: **Load this when:** installing or reviewing a skill you did not write, publishing
4: one that others will run, or running a fleet of skills across a team or org
5: (recall limits, approval gates, lifecycle, rollback).
6:
7: Source: Anthropic's
8: [Skills for enterprise](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)
9: plus the security section of the
10: [overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).
11: *Read from both on 2026-08-03.*
12:
13: ## Contents
14:
15: - Why this is a security boundary at all
16: - Risk tiers — what to look for
17: - Review checklist before installing anything
18: - Approval gates — the five evaluation dimensions
19: - Lifecycle
20: - Registry — what to record per skill
```

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

### Create `repo://make-skill/test/evals/fixtures/external-adoption.json`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/pxs-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Довести подготовленную Selective knowledge adoption процедуру в enterprise.md и условную ссылку из authoring.md; сохранить один canonical intake.
Записать четыре synthetic intake fixtures: OAuth без key, npx без package, missing license, deprecated source.
Проверить default verdict без setup/login/provider calls.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Все 4 fixtures выбирают правильный adoption verdict и не вызывают install/login
Каждая copied/adapted source содержит pinned permalink и attribution receipt
No key не выводится как no dependency

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](PXS-01.01.json), [parent](../parents/PXS-01.json). Полный audit не required prompt input.
