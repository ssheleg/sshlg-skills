# FIX-RT-02.01 — Route-scoped waiver state

Parent `FIX-RT-02` · implementation · P1

## Что и зачем

Отказ от одного маршрута выключает всю эскалацию; цитата тоже считается отказом

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/turnstate.js`

implementation; exact local source path. SHA256: `71306bf03e2175c4ec2e984f29e00fca133ff60ec94202e87da65697bc5db093`

```text
52:  */
53: function write(home, sessionId, patch) {
54:   const current = read(home, sessionId);
55:   const next = Object.assign({}, current, patch);
56:   if (current.optedOut) next.optedOut = true;
57:   try {
58:     const file = fileFor(home, sessionId);
59:     fs.mkdirSync(path.dirname(file), { recursive: true });
60:     fs.writeFileSync(file, JSON.stringify(next), 'utf8');
61:   } catch (e) {
62:     /* A turn hint that cannot be stored is a turn hint that does not happen. */
63:   }
64:   return next;
65: }
66:
67: /**
68:  * Delete session files older than `maxAgeMs`.
69:  *
70:  * Called on session start. Without it this directory grows one small file per
71:  * session forever, which is the kind of litter nobody notices until it is
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-rt-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Хранить route_id/scope/source/user_act; quoted/tool text не создаёт waiver.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Отказ от design оставляет billing/UX; цитата refusal не меняет state.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-RT-02.01.json), [parent](../parents/FIX-RT-02.json). Полный audit не required prompt input.
