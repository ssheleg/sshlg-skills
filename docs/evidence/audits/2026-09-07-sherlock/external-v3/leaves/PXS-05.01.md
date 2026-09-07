# PXS-05.01 — Связать browser claims с состояниями и артефактами

Parent `PXS-05` · implementation · P2

## Что и зачем

Связать browser claims с состояниями и артефактами

Конкретная реализация приведена в шагах ниже.

## Решения

SMALL_EXTENSION_OF_EXISTING_BROWSER_DOCTRINE; Не вводить Playwright/js_repl обязательной зависимостью Не дублировать существующее look/suite/library; добавить machine-readable связь Оригинальные Apache sources атрибутировать; Figma text/assets не переносить

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/browser.md`

reviewed adoption target. SHA256: `3611ea06a113d06e696bd572918d33db726f0026fda60825bbebe38126150496`

```text
1: # The browser — how the look is actually taken, and how a suite is run beside it
2:
3: [`companion-skills.md`](companion-skills.md) decides **which** channel a project has
4: and how to install it. This file is **how to use one**: the model both channels share,
5: the commands the look is made of, and the three different things people mean when they
6: say *"tested in a browser"*.
7:
8: Stages 5, 6 and 8 ([`stages.md`](stages.md)) and [`tdd.md`](tdd.md) demand a look at the
9: rendered surface. Until this file existed, they demanded it and named no mechanism —
10: which is how a run says *I checked the browser* and means *I ran the unit tests*.
11:
12: > **Every command and flag below was read from the tool's own `--help`**, not from a
13: > vendor page. Where the two disagreed, `--help` won and the page was wrong — see
14: > *Rationalizations*. Re-derive before quoting:
15: > `npx @playwright/cli@latest --help` and `npx @playwright/mcp@latest --help`.
16: >
17: > **Use the scoped name with `npx`.** `npx playwright-cli --help` fails outside a project
18: > that has already installed it (`could not determine executable to run`), and the bare
19: > `playwright-cli` on npm is **somebody else's package** — Microsoft's, deprecated in
20: > favour of this one. The binary is called `playwright-cli`; the package is
```

### Create `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/templates/browser-claims.json`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Create `repo://task-pipeline/test/browser_claims_test.py`

reviewed adoption target. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/pxs-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Добавить browser-claims template, связывающий existing REQ/scenario IDs с состоянием и видом проверки.
Уточнить browser.md ссылкой на contract, сохранив existing look/suite/library split.
Добавить stdlib проверку отсутствующего артефакта, неправильного state и полного toggle cycle.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Functional PASS при missing visual proof не даёт visual PASS
Same screenshot из initial state не закрывает claim про opened/error state
No browser channel => NOT_RUN с причиной, validator работает stdlib

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `PXS-01.01` (data): Consumes accepted method/artifact from prerequisite.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](PXS-05.01.json), [parent](../parents/PXS-05.json). Полный audit не required prompt input.
