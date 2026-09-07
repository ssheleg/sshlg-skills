# FIX-UP-08.03 — Platform scope fixtures

Parent `FIX-UP-08` · implementation · P2

## Что и зачем

Host roots фиксированы и расходятся с поддерживаемыми overrides

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/apply.js`

implementation; exact local source path. SHA256: `3e5f57562f00ea9f8e5c4624fc780a75928699b2b0d4b864bda9cc3527b54123`

```text
30: //
31: // Not here, deliberately: Cursor keeps one file per rule under
32: // `~/.cursor/rules/*.mdc` with YAML front-matter. That is a different shape,
33: // not a different path, and it gets its own emitter rather than a row here.
34: const TARGETS = [
35:   { agent: 'claude', dir: '.claude', file: 'CLAUDE.md' },
36:   { agent: 'codex', dir: '.codex', file: 'AGENTS.md' },
37:   { agent: 'gemini', dir: '.gemini', file: 'GEMINI.md' },
38: ];
39:
40: const EMPTY_BLOCK = [
41:   R.BEGIN + ' — managed by sshlg-skills. To opt out: replace this whole block\n     with a single SSHLG:ROUTERS:OPTOUT comment line. -->',
42:   '## Роутинг работы — семья ssheleg',
43:   '',
44:   '<!-- SSHLG:ROUTERS:MAP:BEGIN -->',
45:   '<!-- SSHLG:ROUTERS:MAP:END -->',
46:   '',
47:   '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
48:   '<!-- SSHLG:ROUTERS:TABLE:END -->',
49:   R.END,
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-08.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Windows/XDG/missing host/alternate profile cases с explicit capability verdict.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Unknown platform не silently Linux default и не пишет в соседний profile.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-08.02` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-UP-03.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-03.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-07.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-07.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-07.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-08.03.json), [parent](../parents/FIX-UP-08.json). Полный audit не required prompt input.
