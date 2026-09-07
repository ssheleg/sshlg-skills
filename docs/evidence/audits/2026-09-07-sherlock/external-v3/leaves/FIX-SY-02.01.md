# FIX-SY-02.01 — Общий last-renew позволяет активности одного агента подавлять продление чужих leases

Parent `FIX-SY-02` · implementation · P1

## Что и зачем

Общий last-renew позволяет активности одного агента подавлять продление чужих leases

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
1757:             print(f"note: could not renew {key} ({exc})", file=sys.stderr)
1758:             return False
1759:         return True
1760:
1761:     def renew(self, key: str | None = None) -> bool:
1762:         marker = self.root / STATE_DIR / "last-renew"
1763:         interval = int(self.cfg.get("renewIntervalSeconds") or DEFAULT_RENEW)
1764:         if marker.exists() and time.time() - marker.stat().st_mtime < interval:
1765:             return False
1766:         keys = [key] if key else self.held()
1767:         if not keys:
1768:             self._touch_renew()
1769:             return False
1770:         renewed = [k for k in keys if self._refresh_lease(k)]
1771:         if self.adapter.is_lease_authority and renewed:
1772:             oid = self.log_id("claims")
1773:             for k in renewed:
1774:                 self.adapter.log_append(oid, fmt_line("renew", k, self.rid))
1775:         self._touch_renew()
1776:         return bool(renewed)
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-02.01.json), [parent](../parents/FIX-SY-02.json). Полный audit не required prompt input.
