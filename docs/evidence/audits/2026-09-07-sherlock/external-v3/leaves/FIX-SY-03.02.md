# FIX-SY-03.02 — Fence-aware renewal

Parent `FIX-SY-03` · implementation · P1

## Что и зачем

Local renew перезаписывает уже завершённый steal

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
1735:                 print(f"note: could not renew {key} on the remote: {r.stderr.strip()[:160]}",
1736:                       file=sys.stderr)
1737:                 return False
1738:             self._note_local(key, payload)
1739:             return True
1740:
1741:         lock = self._local_lock(key)
1742:         if not lock.exists():
1743:             return False
1744:         try:
1745:             held = json.loads(lock.read_text())
1746:         except (json.JSONDecodeError, OSError):
1747:             return False
1748:         if held.get("run") != self.rid:
1749:             return False
1750:         held["ts"] = now_iso()
1751:         tmp = lock.with_name(f"{lock.name}.{os.getpid()}.tmp")
1752:         try:
1753:             tmp.write_text(json.dumps(held))
1754:             tmp.replace(lock)
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-03.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Renew проверяет owner/generation/expiry; expired owner должен acquire заново, unconditional replace убрать.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Old owner после steal не продлевает новый lease; valid current renew проходит.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-SY-03.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-03.02.json), [parent](../parents/FIX-SY-03.json). Полный audit не required prompt input.
