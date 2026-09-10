# FIX-DV-20.01 — Ошибка окружения классифицируется как доказанный пропуск валидатора

Parent `FIX-DV-20` · implementation · P2

## Что и зачем

Ошибка окружения классифицируется как доказанный пропуск валидатора

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/test/negatives.py`

implementation; exact local source path. SHA256: `b7e3cb20bdabf295df7e29536940aef002427a5ae0fb40867e994ed6f800d7ff`

```text
334:         # "the guard is broken". Skips get their own status so they stay visible.
335:         skipped = r.returncode == 0 and "SKIP:" in r.stdout
336:         noop = cdir and os.path.isdir(cdir) and not differs_from_repo(cdir)
337:         if noop and not skipped:
338:             status, bucket = "BROKEN", broken
339:         elif skipped:
340:             status, bucket = "SKIP", None
341:         elif passed:
342:             status, bucket = "PASS", None
343:         else:
344:             status, bucket = "FAIL", failed
345:         print(f"  {status:<7}{label(name)}")
346:         if bucket is not None:
347:             bucket.append((label(name), r.stdout[-500:], r.stderr[-500:]))
348:         sweep([cdir])
349:
350:     for name, script in props:
351:         cdir = copy_dir_of(script)
352:         sweep([cdir])
353:         r = subprocess.run(["bash", "-c", script], cwd=_base, capture_output=True, text=True)
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-20.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Явные стадии fixture_setup→mutation_verified→validator_ran→assertion; TEST_ERROR/BROKEN для setup/copy/timeout, GAP только при состоявшемся validator accept. Resource preflight и cleanup finally.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Сымитировать ENOSPC/failed cp и timeout: TEST_ERROR, ноль 'guard bypass' findings; корректно созданный mutant accepted → GAP. Повтор полного negative suite после ресурсов.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-20.01.json), [parent](../parents/FIX-DV-20.json). Полный audit не required prompt input.
