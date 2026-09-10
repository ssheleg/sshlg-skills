# FIX-SY-01.02 — Allocator receipts and offline mapping

Parent `FIX-SY-01` · implementation · P1

## Что и зачем

Выданные IDs меняются задним числом; два reserve возвращают один номер

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
113:
114:
115: # --------------------------------------------------------------------------- utils
116:
117: def now_iso() -> str:
118:     return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
119:
120:
121: def parse_iso_or_none(ts: str) -> float | None:
122:     """The instant this string names, or None when it names none.
123:
124:     `parse_iso` folds an unreadable timestamp into 0.0, and every expiry test then reads
125:     that as "expired in 1970". For exclusion that is the right answer — a lock whose clock
126:     cannot be read must not go on holding a key. For residue it is the wrong one: *spent*
127:     and *unreadable* are different verdicts, and only the first may be cleared.
128:     """
129:     try:
130:         return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(
131:             tzinfo=timezone.utc).timestamp()
132:     except (TypeError, ValueError):
```

### Edit `repo://agent-sync/test/validate.py`

implementation; exact local source path. SHA256: `c7c6cea76c7dd5c1772fc817aaffe6aa60d656b5a8dd15aeaddffa087bc50e7a`

```text
904:
905:     return Plane()
906:
907:
908: def check_reserve_is_race_free() -> None:
909:     """Two runs must never be handed one id — the headline promise of this tool.
910:
911:     It was broken and nothing here could see it: `reserve` read `log_id(...)`, which is
912:     THIS run's own shard, and never merged the others. Three runs each seeded their own
913:     `base` from the register and each returned the same number. The pure allocator was
914:     tested and correct; the caller never consulted it with the whole log. So the check
915:     has to drive `Sync.reserve` itself, from more than one identity.
916:     """
917:     cwd = os.getcwd()
918:     try:
919:         with tempfile.TemporaryDirectory() as project:
920:             _git_project(project)
921:             docs = Path(project) / "docs"
922:             docs.mkdir()
923:             (docs / "DECISIONS.md").write_text(
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Записать backend/revision/reservation receipt; offline mapping append-only; проверить crash/retry.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Retry одного reservation key не выдаёт второй номер; offline ID не сталкивается с global sequence.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-SY-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-01.02.json), [parent](../parents/FIX-SY-01.json). Полный audit не required prompt input.
