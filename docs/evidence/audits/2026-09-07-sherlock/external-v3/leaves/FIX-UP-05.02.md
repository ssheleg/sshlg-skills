# FIX-UP-05.02 — Task-pipeline installer adapter

Parent `FIX-UP-05` · implementation · P1

## Что и зачем

Перезапись member/runtime не атомарна и не даёт rollback

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/bin/task-pipeline.js`

implementation; exact local source path. SHA256: `f1bb12004a95f273de184a397e456d224f4edfcc5911e706eb75ff67edffc12d`

```text
48:     if (entry.isDirectory()) copyDir(s, d);
49:     else fs.copyFileSync(s, d);
50:   }
51: }
52:
53: function installOne(label, src, dest, isDir, force) {
54:   if (fs.existsSync(dest) && !force) {
55:     console.log(`skip: ${label} already installed at ${dest} (rerun with --force to overwrite)`);
56:     return;
57:   }
58:   fs.rmSync(dest, { recursive: true, force: true });
59:   fs.mkdirSync(path.dirname(dest), { recursive: true });
60:   if (isDir) copyDir(src, dest);
61:   else fs.copyFileSync(src, dest);
62:   console.log(`Installed ${label} -> ${dest}`);
63: }
64:
65: /**
66:  * Ask the family launcher to write the routing block, for this member only.
67:  *
```

### Edit `repo://task-pipeline/install.sh`

implementation; exact local source path. SHA256: `7f39315a8faf2f0c75bfa4a1e3e985305512868292271e0a02fb566617d5fe71`

```text
41: if [[ -e "$DEST" && "$FORCE" -eq 0 ]]; then
42:   echo "skip: skill already installed at $DEST (rerun with --force to overwrite)"
43: else
44:   mkdir -p "$(dirname "$DEST")"
45:   rm -rf "$DEST"
46:   cp -R "$SRC" "$DEST"
47:   echo "Installed task-pipeline skill   -> $DEST"
48: fi
49:
50: # 2. slash command (so /task-pipeline works for the plain-skill install too)
51: CMD_SRC="$HERE/plugins/task-pipeline/commands/task-pipeline.md"
52: CMD_DEST="${HOME}/.claude/commands/task-pipeline.md"
53: if [[ -e "$CMD_DEST" && "$FORCE" -eq 0 ]]; then
54:   echo "skip: command already installed at $CMD_DEST (rerun with --force to overwrite)"
55: else
56:   mkdir -p "$(dirname "$CMD_DEST")"
57:   cp "$CMD_SRC" "$CMD_DEST"
58:   echo "Installed /task-pipeline command -> $CMD_DEST"
59: fi
60:
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-up-05.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Применить writer contract к npm и shell installer task-pipeline; все payload до switch.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

--force=false сохраняет пользовательские bytes; stage crash не меняет active.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-05.01` (data): Uses transaction writer or adapters for recovery testing.
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

Appendix и полный parent contract: [leaf JSON](FIX-UP-05.02.json), [parent](../parents/FIX-UP-05.json). Полный audit не required prompt input.
