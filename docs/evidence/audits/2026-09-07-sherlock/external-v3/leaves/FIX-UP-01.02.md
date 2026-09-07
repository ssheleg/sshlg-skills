# FIX-UP-01.02 — Pinned payload resolution

Parent `FIX-UP-01` · implementation · P1

## Что и зачем

Обещание закреплённого релиза семьи не обеспечено установкой

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
311:     log(`\n== Updating skills-CLI installs (global): ${names.join(', ')} ==`);
312:     log(`   then reconciling against: ${agents.join(', ') || '(no agents resolved — add step skipped)'}`);
313:     // One invocation per skill: a single bad id must not fail the whole batch.
314:     for (const argv of plan.updatePlan(SKILLS, agents)) ok = runPlanned(argv) && ok;
315:     pruneClaudeShadows();
316:   }
317:   if (f.claude || f.claudeOnly) {
318:     log(`\n== Updating Claude Code plugins ==`);
319:     for (const s of SKILLS) {
320:       ok = run('claude', ['plugin', 'marketplace', 'update', s.pluginInstall.split('@')[1]]) && ok;
321:       ok = run('claude', ['plugin', 'update', s.pluginInstall]) && ok;
322:     }
323:     log('\n(restart Claude Code to apply)');
324:   }
325:   // `update`, never `install`: a machine that has no block has not consented
326:   // to one, and an update is not the moment to ask.
327:   ok = refreshBlock(f, 'update') && ok;
328:
329:   // The wired copy the hooks actually EXECUTE. Until v0.47.0 this was the one thing
330:   // `update` did not update: the copy lived in a closure inside `cmdHooks` and ran on
```

### Edit `repo://sshlg-skills/package.json`

implementation; exact local source path. SHA256: `a5a87f2296210ade1a9e20d613a550a385b74b2bb2c047b969a9ffd44d7e56ac`

```text
11:     "queue": "python3 scripts/queue.py",
12:     "convergence": "bash scripts/convergence.sh"
13:   },
14:   "files": [
15:     "bin",
16:     "lib",
17:     "hooks",
18:     "skills.json",
19:     "README.md",
20:     "LICENSE",
21:     "CHANGELOG.md"
22:   ],
23:   "repository": "github:ssheleg/sshlg-skills",
24:   "homepage": "https://skills.sshlg.me/",
25:   "license": "MIT",
26:   "author": {
27:     "name": "ssheleg",
28:     "url": "https://x.com/sshlg93"
29:   },
30:   "engines": {
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Resolve/check read-only получает все payload до apply, сверяет digest; unpinnable API не называется pinned.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Corrupt/missing payload блокирует apply до mutations.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-01.02.json), [parent](../parents/FIX-UP-01.json). Полный audit не required prompt input.
