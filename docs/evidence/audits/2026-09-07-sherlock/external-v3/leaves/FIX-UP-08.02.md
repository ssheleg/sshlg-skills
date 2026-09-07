# FIX-UP-08.02 — Member installer root adapters

Parent `FIX-UP-08` · implementation · P2

## Что и зачем

Host roots фиксированы и расходятся с поддерживаемыми overrides

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://task-pipeline/bin/task-pipeline.js`

implementation; exact local source path. SHA256: `f1bb12004a95f273de184a397e456d224f4edfcc5911e706eb75ff67edffc12d`

```text
192:   const cmdSrc = path.join(ROOT, 'plugins/task-pipeline/commands/task-pipeline.md');
193:   for (const [p, what] of [[skillSrc, 'skill sources'], [cmdSrc, 'command source']]) {
194:     if (!fs.existsSync(p)) {
195:       console.error(`error: ${what} missing at ${p} — corrupted package?`);
196:       return 1;
197:     }
198:   }
199:
200:   const home = os.homedir(); // respects $HOME on POSIX — tests override via env
201:
202:   // One channel per agent. This installer writes a PLAIN copy to
203:   // ~/.claude/skills/<id>, and while the Claude Code PLUGIN channel is active that
204:   // copy SHADOWS the plugin — silently serving whatever version was copied, forever.
205:   // The family launcher (sshlg-skills) prunes exactly these copies for that reason,
206:   // so creating one without saying so undoes the thing it is paired with.
207:   const pluginDirs = [
208:     path.join(home, '.claude', 'plugins', 'marketplaces', 'task-pipeline'),
209:     path.join(home, '.claude', 'plugins', 'cache', 'task-pipeline'),
210:   ];
211:   if (!force && pluginDirs.some((d) => fs.existsSync(d))) {
```

### Edit `repo://super-ux/bin/super-ux.js`

implementation; exact local source path. SHA256: `4682d2b55e9e43ebee8cad1323f41d8ef1f25bbf2f5dbac453d6e6715e49bde6`

```text
43:  */
44: function installedPluginSpec(home, name) {
45:   try {
46:     const raw = fs.readFileSync(
47:       path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8');
48:     const parsed = JSON.parse(raw);
49:     const plugins =
50:       parsed && typeof parsed === 'object' &&
51:       parsed.plugins && typeof parsed.plugins === 'object'
52:         ? parsed.plugins
53:         : parsed;
54:     if (!plugins || typeof plugins !== 'object') return null;
55:     for (const spec of Object.keys(plugins)) {
56:       if (spec === name) return `${name}@${name}`;
57:       if (spec.startsWith(name + '@')) return spec;
58:     }
59:   } catch {
60:     // missing or corrupt = no plugin — fail open on absence, never crash
61:   }
62:   return null;
```

### Edit `repo://sheleg-design/bin/cli.js`

implementation; exact local source path. SHA256: `e61994965d33da1d88ca261cd985acdd1e6c04b9d9a545a0a8834e003ae99e53`

```text
377:  */
378: function installedPluginSpec(home) {
379:   try {
380:     const raw = fs.readFileSync(
381:       path.join(home, ".claude", "plugins", "installed_plugins.json"),
382:       "utf8",
383:     );
384:     const parsed = JSON.parse(raw);
385:     const plugins =
386:       parsed &&
387:       typeof parsed === "object" &&
388:       parsed.plugins &&
389:       typeof parsed.plugins === "object"
390:         ? parsed.plugins
391:         : parsed;
392:     if (!plugins || typeof plugins !== "object") return null;
393:     for (const spec of Object.keys(plugins)) {
394:       if (spec === SKILL_SLUG) return `${SKILL_SLUG}@${SKILL_SLUG}`;
395:       if (spec.startsWith(SKILL_SLUG + "@")) return spec;
396:     }
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-up-08.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Task-pipeline/super-ux/design принимают один HostContext contract с локальным bundled resolver.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Default roots unchanged при custom profile; stale default не блокирует selected root.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-08.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
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

Appendix и полный parent contract: [leaf JSON](FIX-UP-08.02.json), [parent](../parents/FIX-UP-08.json). Полный audit не required prompt input.
