# FIX-TP-03.01 — Kernel и profile contract

Parent `FIX-TP-03` · implementation · P2

## Что и зачем

Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`

implementation; exact local source path. SHA256: `f8876b8eb0b20169e7ca037869c4eb83164754c9bc271da52895fc27c1d0dc8a`

```text
249: `pipeline.example.json` → `pipeline.json`, define its **own** stages (any count),
250: point each `skills[]` at what its environment resolves, set each `gate.type`
251: (`auto`/`judgment`/`manual`) to fit its process, and toggle its own `release`
252: block. The
253: framework ships no fixed stage count and no opinion on which gates are manual —
254: `pipeline.schema.json` is the only contract.
255:
256: ## References
257:
258: Most references are routed from the **Built-in doctrine** table above, keyed by
259: the stage that sends you there. The rest are routed by prose: `stages.md` (named
260: at every stage of *How to run*), `learned.md` (cited where a rule binds) and
261: `probing.md` (from `gates.md`, whose checks it proves). The config contracts sit
262: beside this file: `pipeline.schema.json` and `pipeline.example.json`.
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/pipeline.schema.json`

new capability target; audit does not create it. SHA256: `99ff340ca0a9e3a1e35ad891723c200c5b06f3371429d65a88765c1dd63cd2f6`

```text
1: {
2:   "$schema": "http://json-schema.org/draft-07/schema#",
3:   "$id": "https://raw.githubusercontent.com/ssheleg/task-pipeline/main/plugins/task-pipeline/skills/task-pipeline/pipeline.schema.json",
4:   "title": "task-pipeline config",
5:   "description": "Generic contract for a pipeline config. An ordered list of stages; each stage is run by the host project's own skills/agents and guarded by a typed gate. The framework imposes no specific stages, skills, or gate assignments — those are entirely the host project's config. Copy pipeline.example.json and rewrite it to match your project.",
6:   "type": "object",
7:   "required": [
8:     "stages"
9:   ],
10:   "additionalProperties": true,
11:   "properties": {
12:     "version": {
13:       "type": "integer",
14:       "minimum": 1
15:     },
16:     "stages": {
17:       "type": "array",
18:       "minItems": 1,
19:       "description": "The pipeline stages, in order. Any number, any names — your project's real stages.",
20:       "items": {
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-tp-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Kernel: scope/evidence/deps/resume; stages принадлежат selected profile, не глобальным номерам.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Минимальный трёхстадийный profile сохраняет kernel fields без stage7.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TP-03.01.json), [parent](../parents/FIX-TP-03.json). Полный audit не required prompt input.
