# FIX-SY-05.01 — Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают

Parent `FIX-SY-05` · implementation · P1

## Что и зачем

Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают

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
1580:         between them would cost the key until somebody deleted a file by hand.
1581:         """
1582:         guard = lock.with_name(lock.name + ".steal")
1583:         try:
1584:             if guard.exists() and time.time() - guard.stat().st_mtime > STEAL_GRACE:
1585:                 guard.unlink(missing_ok=True)
1586:         except OSError:
1587:             pass
1588:         try:
1589:             fd = os.open(str(guard), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
1590:         except OSError:
1591:             return False                      # another run is stealing this very lock
1592:         try:
1593:             os.close(fd)
1594:             try:
1595:                 held = json.loads(lock.read_text())
1596:             except (json.JSONDecodeError, OSError):
1597:                 held = {}
1598:             if held and time.time() <= parse_iso(held.get("ts", "")) + int(
1599:                     held.get("ttl", self.ttl)):
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Создание и чтение ownership state сериализовать тем же OS lock либо публиковать уже заполненный объект атомарным no-replace primitive; partial/corrupt lock не считать немедленно stealable. Crash cleanup отличать от активного незавершённого create по арбитражу, не эвристике пустого JSON.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-05.01.json), [parent](../parents/FIX-SY-05.json). Полный audit не required prompt input.
