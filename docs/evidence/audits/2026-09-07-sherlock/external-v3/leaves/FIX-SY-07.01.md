# FIX-SY-07.01 — Guard охватывает редактор и некоторые git commit, но не все записи через shell

Parent `FIX-SY-07` · implementation · P2

## Что и зачем

Guard охватывает редактор и некоторые git commit, но не все записи через shell

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


## Exact targets и source окна

### Edit `repo://agent-sync/plugins/agent-sync/hooks/hooks.json`

implementation; exact local source path. SHA256: `bafecc6c603c5ff76d307d9174605c60ac59057b9a8d39213c045590d8d4764d`

```text
18:       {
19:         "matcher": "Edit|Write|MultiEdit|NotebookEdit",
20:         "hooks": [
21:           {
22:             "type": "command",
23:             "shell": "bash",
24:             "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/guard.sh\"",
25:             "timeout": 20
26:           }
27:         ]
28:       },
29:       {
30:         "matcher": "Bash",
31:         "if": "Bash(git commit *)",
32:         "hooks": [
33:           {
34:             "type": "command",
35:             "shell": "bash",
36:             "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/guard.sh\"",
37:             "timeout": 20
```

### Edit `repo://agent-sync/plugins/agent-sync/hooks/guard.sh`

implementation; exact local source path. SHA256: `8b77edec8a7fd5e75bfaf2bf7f02cd868eda4f0e036236015d0defb190eacab7`

```text
32:
33: # git commit: check every staged path instead of a single file argument.
34: if [ -z "$path" ]; then
35:   # What repository, and is this even a commit. Both used to be wrong, and the second one is why
36:   # the first went unnoticed: the old test was `case "$cmd" in *"git commit"*)`, a CONTIGUOUS
37:   # substring. `git -C <dir> commit` does not contain it, so every commit made that way skipped the
38:   # guard entirely -- in any repository, submodule or not. The repo was then hardcoded to
39:   # CLAUDE_PROJECT_DIR, so even a bare `git commit` inside a submodule read the umbrella's empty
40:   # index and passed. Measured 2026-08-07: a full day of commits to guarded registers, with the
41:   # Edit-tool half of this hook refusing correctly the whole time, so the protection looked present.
42:   #
43:   # Tokenised in python rather than globbed in shell: `git log --grep=commit` must not match, and
44:   # `git -c user.name=x -C dir commit` must.
45:   parsed=$(python3 -c '
46: import json, shlex, sys
47: try:
48:     d = json.load(sys.stdin)
49: except Exception:
50:     print("0 ."); sys.exit(0)
51: cmd = (d.get("tool_input") or {}).get("command", "")
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Чётко объявить advisory protection boundary. Если нужна enforceable гарантия — file writes через trusted mutation API/isolated worktree/OS controls с resource locks; не пытаться считать regex shell parser универсальным sandbox. Host adapters имеют capability matrix.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-07.01.json), [parent](../parents/FIX-SY-07.json). Полный audit не required prompt input.
