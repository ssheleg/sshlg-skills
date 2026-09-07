# ADOPT-M-03.01 — Подключить outcome reference кmake-skill

Parent `ADOPT-M-03` · implementation · P2

## Что и зачем

Подключить outcome reference кmake-skill

Конкретная реализация приведена в шагах ниже.

## Решения

Из make-skill условно подключать outcome method только для изменения поведения. Conformance audit не превращается в retrofit или release без соответствующего пользовательского scope.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/SKILL.md`

reviewed adoption target. SHA256: `9d4b36c72b7f8fcc8bc899694baf130edc73fe6e33ea2b70a142d0707de1c63e`

```text
1: ---
2: name: make-skill
3: description: Use when creating, upgrading, auditing, or publishing agent skills and Claude Code plugins - "make a skill" / "сделай скилл", "skill audit" / «аудит скилов», "wrap it in a plugin" / "заверни в плагин", "publish a skill" / "опубликуй скилл", "retrofit a skill to the standard" / "приведи скилл к стандарту", "does this skill match the spec" / "соответствует ли скилл стандарту", "claude plugin validate fails" / "проверь плагин по документации Anthropic", "is this skill safe to install" / "безопасно ли ставить этот скилл" - or when a skill must reach an MCP server or another agent over A2A. NOT for a version bump or release in a repo that ships anything but a skill or plugin. Encodes the Agent Skills standard, Anthropic's platform rules (limits, budgets, Skills API, evals), the plugin reference (manifests, layout, validate --strict), plus the ssheleg pipeline - marketplace layout, version sync, validator+CI, distribution, npm gotchas.
4: license: MIT
5: compatibility: Authoring works on any agent. The bundled scripts/ need python3. Publishing steps need git, gh, node and npm; the plugin gates need the claude CLI. Not usable on the Claude API surface, which has no network and no runtime package install.
6: metadata:
7:   author: ssheleg
8:   version: "0.27.1"
9:   homepage: https://github.com/ssheleg/make-skill
10: ---
11:
12: # make-skill — Create, Retrofit, and Ship Skills the Proven Way
13:
14: Copy from a working repo (usually `~/DATA/<name>`): **`ssheleg/super-ux`**
15: (multi-skill suite, Cursor rules) or **`ssheleg/task-pipeline`** (single-skill
16: orchestrator, release automation). **make-skill itself** is built to this canon.
17:
18: ## References — load on demand
19:
20: | Read | When |
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/adopt-m-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: Из make-skill условно подключать outcome method только для изменения поведения. Conformance audit не превращается в retrofit или release без соответствующего пользовательского scope.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Link resolves; conformanceaudit stops atreport; behavior request loads outcome method.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `ADOPT-M-02.01` (data): Consumes predecessor method/fixture contract

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-03.01.json), [parent](../parents/ADOPT-M-03.json). Полный audit не required prompt input.
