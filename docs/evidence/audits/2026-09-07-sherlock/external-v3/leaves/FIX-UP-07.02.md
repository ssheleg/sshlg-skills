# FIX-UP-07.02 — Native lifecycle capability

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


Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

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

### Edit `repo://sheleg-design/bin/cli.js`

implementation; exact local source path. SHA256: `e61994965d33da1d88ca261cd985acdd1e6c04b9d9a545a0a8834e003ae99e53`

```text
524:   // complete sentence. Auto-update is off on purpose: this member composes
525:   // with its family, and per-marketplace autoUpdate moves each member on its
526:   // own clock, into combinations nobody tested together.
527:   console.log(
528:     `Updates: rerun ${c("bold", "npx sheleg-design-skill@latest --force")}, or refresh the\n` +
529:       `whole family with ${c("bold", "npx --yes sshlg-skills@latest update")} (every channel,\n` +
530:       `and it prunes plain copies that would shadow a plugin).\n`,
531:   );
532: }
533:
534: /**
535:  * Ask the family launcher to write the routing block, for this member only.
536:  *
537:  * Delegated rather than reimplemented, for three reasons. The block describes
538:  * what the machine actually has, so a lone member rendering the whole thing
539:  * would produce a table for routers nobody installed. `--member` limits the
540:  * write to the `sheleg-design` section and leaves everyone else's alone, which
541:  * is what lets the bundle and a single installer both write. And the launcher is
542:  * the only writer that copies the operator's global instruction file before
543:  * touching it — that file has no version control behind it.
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-07.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Codex install/update через supported host API only; fallback UNSUPPORTED_UPDATE с manual step, no fake mutation.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Without API no overall current; after supported reload receipt verifies actual loaded digest.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-07.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-07.02.json), [parent](../parents/FIX-UP-07.json). Полный audit не required prompt input.
