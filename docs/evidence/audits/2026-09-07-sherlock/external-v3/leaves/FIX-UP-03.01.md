# FIX-UP-03.01 — Explicit scope resolution

Parent `FIX-UP-03` · implementation · P2

## Что и зачем

Выбор агента не ограничивает весь update

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/plan.js`

implementation; exact local source path. SHA256: `177c10c65b2ec482418f8da8cfaeedf59e46736242529625abd3d3ee9241f9f8`

```text
44:  * A repo may ship several skills under different names (super-ux ships seven,
45:  * and none of them is called `super-ux`), so passing a repo name here matches
46:  * nothing and updates nothing.
47:  */
48: function updateArgs(name) {
49:   return ['--yes', 'skills', 'update', name, '--global', '--yes'];
50: }
51:
52: /**
53:  * Which agents this run targets: `--all` wins, then `--agent`, then the pack's
54:  * defaults. `claude-code` is removed while the plugin channel is on — the
55:  * skills CLI would write `~/.claude/skills/<id>`, and that plain copy shadows
56:  * the plugin and serves its frozen version forever.
57:  */
58: function resolveAgents(defaults, flags) {
59:   const f = flags || {};
60:   if (f.all) return ['*'];
61:   const chosen = (f.agents && f.agents.length) ? f.agents.slice() : (defaults || []).slice();
62:   return f.claude === false ? chosen : chosen.filter((a) => a !== 'claude-code');
63: }
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Host/channel и shared/host scope отдельно; shared symlink consumers перечислены до apply.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Host-only plan не скрывает shared effects; impossible isolation явная unsupported.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-03.01.json), [parent](../parents/FIX-UP-03.json). Полный audit не required prompt input.
