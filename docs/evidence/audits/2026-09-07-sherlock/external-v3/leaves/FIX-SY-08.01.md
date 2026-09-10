# FIX-SY-08.01 — Поиск task-pipeline не учитывает native Codex plugin cache

Parent `FIX-SY-08` · implementation · P2

## Что и зачем

Поиск task-pipeline не учитывает native Codex plugin cache

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


## Exact targets и source окна

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`

implementation; exact local source path. SHA256: `9b64e93e16025c61cce840b5facbeed619927a20c07f6f919ac92816d6ddc3b6`

```text
3538:     print("  agent_sync.py acquire <TASK-ID>")
3539:     return 0
3540:
3541:
3542: def pipeline_installed() -> bool:
3543:     home = Path.home()
3544:     if list(home.glob(".claude/plugins/cache/task-pipeline/**/skills/task-pipeline/SKILL.md")):
3545:         return True
3546:     if (home / ".agents/skills/task-pipeline/SKILL.md").exists():
3547:         return True
3548:     return (home / ".claude/skills/task-pipeline/SKILL.md").exists()
3549:
3550:
3551: def cmd_bootstrap(_args: argparse.Namespace) -> int:
3552:     root = project_root()
3553:     load_env_file(root)
3554:     cfg_path = root / CONFIG_PATH
3555:     cfg = json.loads(cfg_path.read_text()) if cfg_path.exists() else {}
3556:     backend = os.environ.get("AGENT_SYNC_BACKEND") or cfg.get("backend") or "fs"
3557:     cls = CLOUD_ADAPTERS.get(backend)
```

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/SKILL.md`

implementation; exact local source path. SHA256: `f90d370ec77b6ee50d518ccf98f74c071ed5e6b75fdd9f4bffcde5a350ca0074`

```text
145:   away — watermarked per run, so it stays quiet until something changes. A dependency that
146:   moved may unblock what you planned, or invalidate it.
147:
148: What else `status` decides: no credentials → degraded mode, reported, and it continues;
149: `task-pipeline` absent → it prints the install line and stops. Do not improvise a substitute
150: flow — without those stages there is nothing to bind to.
151:
152: ```bash
153: npx sshlg-skills install
154: ```
155:
156: ## The commands
157:
158: | Command | Does |
159: |---|---|
160: | `init` | **Run first.** Ask where state lives, write config + gitignored env file, print the operator's step |
161: | `status` | Inspect, repair, report, name one next action |
162: | `bootstrap` | Create the cloud container and print the id to paste into the env file |
163: | `acquire <KEY>` | Take the lease on a task id. Prints `won` or `lost <holder>` |
164: | `renew <KEY>` | Extend the lease. The `PostToolUse` hook does this for you |
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-07.01` (data): Native discovery должен использовать единый provider resolver.
- `FIX-UP-07.02` (data): Native discovery должен использовать единый provider resolver.
- `FIX-UP-07.03` (data): Native discovery должен использовать единый provider resolver.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-08.01.json), [parent](../parents/FIX-SY-08.json). Полный audit не required prompt input.
