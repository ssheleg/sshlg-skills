# FIX-UP-03.02 — All emitters obey target

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

### Edit `repo://sshlg-skills/bin/sshlg-skills.js`

implementation; exact local source path. SHA256: `ca46e7513b7554452333322fb6ff8d4b27bea58a2b17917724d2df5e44942930`

```text
263:  * The block's own rules are untouched: the operator's wording still wins,
264:  * consent is still asked once and recorded, and drift is still only reported.
265:  * What changes is that nobody has to remember a fourth command.
266:  */
267: function refreshBlock(f, mode) {
268:   if (f.member) return true; // a lone member's installer speaks only for itself
269:   log('\n== Refreshing the routing block ==');
270:   return cmdRouters({
271:     claude: f.claude,
272:     dryRun: f.dryRun,
273:     mode,
274:   });
275: }
276:
277: function cmdUpdate(f) {
278:   let ok = true;
279:   // The plan is COUNTED, not estimated — the same arrays the loops below walk, so a
280:   // member added to the family changes the denominator without anyone remembering to.
281:   const agentsForCount = f.claudeOnly ? [] : skillsCliAgents(f);
282:   progress.total =
```

### Edit `repo://sshlg-skills/lib/apply.js`

implementation; exact local source path. SHA256: `3e5f57562f00ea9f8e5c4624fc780a75928699b2b0d4b864bda9cc3527b54123`

```text
176:  * Apply the routers to every agent instruction file that exists on this
177:  * machine. Returns one record per considered target; writes nothing that the
178:  * record does not report.
179:  */
180: function apply(opts) {
181:   const home = opts.home;
182:   const log = opts.log || ((m) => console.log(m));
183:   const targets = [];
184:
185:   for (const t of TARGETS) {
186:     const dir = path.join(home, t.dir);
187:     if (!fs.existsSync(dir)) {
188:       targets.push({ file: path.join(dir, t.file), action: 'agent-absent' });
189:       continue;
190:     }
191:     const record = applyOne(path.join(dir, t.file), opts.routers || {}, opts);
192:     record.agent = t.agent;
193:     targets.push(record);
194:
195:     if (record.action === 'malformed') {
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-03.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Передать resolved target set всем emitters/runtime/update paths.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Не выбранные CLAUDE/AGENTS/GEMINI files byte-identical, включая --claude-only/--no-claude.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-03.01` (data): Consumes the preceding contract/state/API decision described in this outcome.
- `FIX-UP-02.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-03.02.json), [parent](../parents/FIX-UP-03.json). Полный audit не required prompt input.
