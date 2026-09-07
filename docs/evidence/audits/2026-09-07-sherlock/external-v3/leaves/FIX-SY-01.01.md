# FIX-SY-01.01 — Immutable reservation identity

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

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Reservation_id/value неизменны. Для shared git backend allocator использует git ref CAS, retry ограничен; offline IDs составные, без fake global sequence.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Два concurrent reserve дают разные IDs, ранее выданное не перенумеровывается.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-01.01.json), [parent](../parents/FIX-SY-01.json). Полный audit не required prompt input.
