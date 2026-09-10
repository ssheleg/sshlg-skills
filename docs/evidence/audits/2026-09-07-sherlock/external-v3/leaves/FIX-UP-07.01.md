# FIX-UP-07.01 — Read-only provider inventory

Parent `FIX-UP-07` · implementation · P2

## Что и зачем

Updater не управляет native Codex plugin provider и не проверяет active digest

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/skills.json`

implementation; exact local source path. SHA256: `2cad25e3e8a6768f2d39b2e8be05a64b4d642932f6af132cc691835f8bd4e094`

```text
221:       "reads": "~/.agents/skills",
222:       "note": "plus a Cursor rules file the launcher writes for routing"
223:     },
224:     {
225:       "name": "Codex",
226:       "id": "codex",
227:       "channel": "skills CLI",
228:       "reads": "~/.agents/skills",
229:       "note": "routing block goes to ~/.codex/AGENTS.md"
230:     },
231:     {
232:       "name": "Gemini CLI",
233:       "id": "gemini-cli",
234:       "channel": "skills CLI",
235:       "reads": "~/.agents/skills",
236:       "note": "routing block goes to ~/.gemini/GEMINI.md"
237:     },
238:     {
239:       "name": "OpenCode",
240:       "id": "opencode",
```

### Edit `repo://sshlg-skills/bin/sshlg-skills.js`

implementation; exact local source path. SHA256: `ca46e7513b7554452333322fb6ff8d4b27bea58a2b17917724d2df5e44942930`

```text
227:   return run('npx', argv);
228: }
229:
230: function cmdInstall(f) {
231:   let ok = true;
232:   if (!f.claudeOnly) {
233:     const agents = skillsCliAgents(f);
234:     log(`\n== Installing to agents via skills CLI: ${agents.join(', ')} ==`);
235:     for (const argv of plan.installPlan(SKILLS, agents)) ok = runPlanned(argv) && ok;
236:     // Unconditional: the skills CLI auto-detects Claude Code and drops a plain
237:     // copy whether or not this run was asked to manage plugins, and the copy
238:     // decides nothing about the flag it was created under.
239:     pruneClaudeShadows();
240:   }
241:   if (f.claude || f.claudeOnly) {
242:     log(`\n== Installing Claude Code plugins ==`);
243:     for (const s of SKILLS) {
244:       log(`\n- ${s.name}`);
245:       ok = run('claude', ['plugin', 'marketplace', 'add', s.pluginMarketplace]) && ok;
246:       ok = run('claude', ['plugin', 'install', s.pluginInstall]) && ok;
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Host/scope/namespace/realpath/digest/installed/enabled/applicable/loaded separately; historical cache candidates not active.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Old cache+one enabled version не duplicate; unknown precedence UNKNOWN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-07.01.json), [parent](../parents/FIX-UP-07.json). Полный audit не required prompt input.
