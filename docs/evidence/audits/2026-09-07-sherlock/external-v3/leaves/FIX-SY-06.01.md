# FIX-SY-06.01 — Capability fields

Parent `FIX-SY-06` · implementation · P2

## Что и зачем

Одно gated смешивает lease guarantee, видимость и наличие host enforcement

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
1371:         self._identity: tuple[str, str] | None = None
1372:         self._holders: dict[str, str | None] = {}
1373:
1374:     @property
1375:     def gated(self) -> bool:
1376:         """Whether exclusion is real — decided by the lease mode, never by the record.
1377:
1378:         Until 1.2.4 this read the record adapter's capabilities, which stopped deciding
1379:         leases in 1.0.0. Both directions were wrong: `outline` with a local lock reported
1380:         `gated` while exclusion was machine-local, and `fs` with git refs reported
1381:         `ungated` while every lease was a genuine cross-machine compare-and-swap. The
1382:         plane carries the record; `leaseBackend` decides the lease.
1383:         """
1384:         return bool(self.cfg.get("gated", True)) and self.lease_mode in LEASE_GUARANTEE
1385:
1386:     def log_id(self, which: str) -> str:
1387:         """This run's OWN shard. One writer per document, always.
1388:
1389:         Outline's `editMode: append` is not atomic under concurrency: the server reads
1390:         the text, appends and writes it back, so simultaneous requests clobber each
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить lease_scope/enforcement_mode/awareness_scope/identity_strength/backend_health; legacy gated только compatibility summary.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Advisory host не отображается enforced, backend failure не active green.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-07.01` (data): Уровень enforcement объявляется по capabilities текущего host/provider.
- `FIX-UP-07.02` (data): Уровень enforcement объявляется по capabilities текущего host/provider.
- `FIX-UP-07.03` (data): Уровень enforcement объявляется по capabilities текущего host/provider.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-06.01.json), [parent](../parents/FIX-SY-06.json). Полный audit не required prompt input.
