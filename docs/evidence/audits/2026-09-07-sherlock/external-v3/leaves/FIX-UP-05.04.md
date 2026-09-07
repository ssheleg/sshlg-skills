# FIX-UP-05.04 — Recovery boundaries

Parent `FIX-UP-05` · implementation · P1

## Что и зачем

Перезапись member/runtime не атомарна и не даёт rollback

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/runtime.js`

implementation; exact local source path. SHA256: `cd88458e46f3b729b6da27c163c3d3b43dba8bffaf210247275d6acab6f32032`

```text
99:   }
100:
101:   const copied = [];
102:   const copyDir = (from, to) => {
103:     fs.mkdirSync(to, { recursive: true });
104:     let entries;
105:     try { entries = fs.readdirSync(from, { withFileTypes: true }); } catch (e) { return; }
106:     for (const e of entries) {
107:       const a = path.join(from, e.name);
108:       const b = path.join(to, e.name);
109:       if (e.isDirectory()) copyDir(a, b);
110:       else if (e.name.endsWith('.js')) {
111:         fs.copyFileSync(a, b);
112:         copied.push(path.relative(runtimeRoot, b).split(path.sep).join('/'));
113:       }
114:     }
115:   };
116:
117:   fs.mkdirSync(runtimeRoot, { recursive: true });
118:   for (const d of DIRS) copyDir(path.join(pkgRoot, d), path.join(runtimeRoot, d));
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-05.04.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Fault injection SIGTERM до/после switch, journal replay/rollback, permission/ENOSPC.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Restart восстанавливает coherent active digest, unknown extras сохраняются.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-05.01` (data): Uses transaction writer or adapters for recovery testing.
- `FIX-UP-05.02` (data): Uses transaction writer or adapters for recovery testing.
- `FIX-UP-05.03` (data): Uses transaction writer or adapters for recovery testing.
- `FIX-UP-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-05.04.json), [parent](../parents/FIX-UP-05.json). Полный audit не required prompt input.
