# FIX-UP-06.01 — Typed installer result

Parent `FIX-UP-06` · implementation · P2

## Что и зачем

Super-ux возвращает успешный exit code после неудачной установки

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/bin/super-ux.js`

implementation; exact local source path. SHA256: `4682d2b55e9e43ebee8cad1323f41d8ef1f25bbf2f5dbac453d6e6715e49bde6`

```text
240:     );
241:     return 'refused';
242:   }
243:   console.log(`\n--- Skills for any agent: delegating to the skills CLI picker ---`);
244:   const status = run('npx', ['--yes', 'skills', 'add', REPO]);
245:   if (status !== 'ok') console.error(`warning: 'npx skills add ${REPO}' ${status}`);
246:   return status;
247: }
248:
249: /**
250:  * The last line of a successful run says how the next version arrives —
251:  * "Installed" is not a complete sentence. Auto-update is off on purpose:
252:  * this member composes with its family, and per-marketplace autoUpdate moves
253:  * each member on its own clock, into combinations nobody tested together.
254:  */
255: function printUpdateLine() {
256:   console.log(
257:     '\nUpdates: rerun npx super-ux@latest (--cursor <dir> --force refreshes a\n' +
258:     "project's rules and linters), or refresh the whole family with\n" +
259:     'npx --yes sshlg-skills@latest update (every channel, and it prunes plain\n' +
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-up-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. installed/unchanged/refused/unsupported/failed, actual backend exit/signal/command preserved.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Selected failure exit1, refusal3, unsupported documented nonzero.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-06.01.json), [parent](../parents/FIX-UP-06.json). Полный audit не required prompt input.
