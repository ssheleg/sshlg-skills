# FIX-UP-04.02 — Recoverable migration

Parent `FIX-UP-04` · implementation · P1

## Что и зачем

Prune удаляет единственную plain-копию по непроверенной записи registry

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
121: }
122:
123: // The skills CLI auto-detects Claude Code and writes ~/.claude/skills/<id> even when
124: // we never ask for that agent. While the Claude PLUGIN channel is active those plain
125: // copies shadow the plugin, so prune them — "one channel per agent", enforced.
126: function pruneClaudeShadows() {
127:   const base = path.join(os.homedir(), '.claude', 'skills');
128:   const ls = (d) => { try { return fs.readdirSync(d); } catch (_) { return []; } };
129:
130:   // The INSTALLED set, not the marketplace list. Those are separate operations and a
131:   // marketplace outlives its plugin, so pruning on the marketplace deleted the plain
132:   // copy of a member whose plugin was gone — the only copy, and the skill with it.
133:   // Unreadable registry ⇒ empty set ⇒ nothing is pruned: a guard that never received
134:   // its input refuses rather than approves.
135:   const installedMarketplaces = () => {
136:     try {
137:       const reg = JSON.parse(fs.readFileSync(
138:         path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'), 'utf8'));
139:       return Object.keys(reg.plugins || {})
140:         .map(spec => spec.split('@')[1]).filter(Boolean);
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-04.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Edited/unknown plain copies сохранить в quarantine manifest; symlink switch atomic; restore возвращает bytes/type.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Injected install failure сохраняет старое; fresh --all не создаёт собственную shadow copy.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-04.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
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

Appendix и полный parent contract: [leaf JSON](FIX-UP-04.02.json), [parent](../parents/FIX-UP-04.json). Полный audit не required prompt input.
