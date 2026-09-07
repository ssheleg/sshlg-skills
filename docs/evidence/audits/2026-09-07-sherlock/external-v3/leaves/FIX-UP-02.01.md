# FIX-UP-02.01 — Central operation plan

Parent `FIX-UP-02` · implementation · P1

## Что и зачем

Принятый --dry-run всё равно запускает обновления и удаляет файлы

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/bin/sshlg-skills.js`

implementation; exact local source path. SHA256: `ca46e7513b7554452333322fb6ff8d4b27bea58a2b17917724d2df5e44942930`

```text
79:     if (a === '--all') f.all = true;
80:     else if (a === '--no-claude') f.claude = false;
81:     else if (a === '--claude-only') f.claudeOnly = true;
82:     else if (a === '--bump-pins') f.bumpPins = true;
83:     else if (a === '--dry-run') f.dryRun = true;
84:     else if (a === '--update') f.mode = 'update';
85:     else if (a === '--diff') {
86:       const v = argv[++i];
87:       if (!v || v.startsWith('-')) { log('--diff needs a router name, e.g. --diff task-pipeline'); process.exit(2); }
88:       f.diff = v;
89:     }
90:     else if (a === '--adopt') {
91:       // Comma list and never "all". Adoption replaces words a person wrote in
92:       // a file with no version control behind it, so each one is named.
93:       const v = argv[++i];
94:       if (!v || v.startsWith('-')) { log('--adopt needs a router name, e.g. --adopt task-pipeline'); process.exit(2); }
95:       f.adopt = v.split(',').map(s => s.trim()).filter(Boolean);
96:       if (!f.adopt.length) { log('--adopt got an empty list'); process.exit(2); }
97:     }
98:     else if (a === '--member') {
```

### Create `repo://sshlg-skills/lib/operation-result.js`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Create `repo://sshlg-skills/test/operation-result_test.js`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Install/update сначала строят immutable OperationPlan всех subprocess/prune/router/runtime действий; dry-run только render.

Уточнение PXS-02: ENRICH_EXISTING_UP_NOT_DUPLICATE; Оставить Node stdlib, без Rust/SDK/CLI parser package Не делать live network inside default doctor; network check отдельный явный режим Эта запись уточняет UP tasks, не добавляет второй independent implementation
Определить typed OperationResult в Node stdlib: scope/status/evidence/error class/remediation.
Подключить result к существующим операциям umbrella вместо parse human prose.
Добавить unit fixtures dry-run/partial/unknown/error и сверить их с UP counterexamples.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

HOME/project/runtime hashes unchanged, 0 mutation calls для --all/--bump-pins.
Dry-run имеет 0 mutations, но complete plan receipt
Auth/network/parse/child failures nonzero; unsupported/unknown не masquerade as success
UP fixtures возвращают scope и effect fields без секретов

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-02.01.json), [parent](../parents/FIX-UP-02.json). Полный audit не required prompt input.
