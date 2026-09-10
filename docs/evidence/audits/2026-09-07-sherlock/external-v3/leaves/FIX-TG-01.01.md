# FIX-TG-01.01 — Durable inbox before ack

Parent `FIX-TG-01` · implementation · P1

## Что и зачем

Crash fixture зелёный, но после реальной redelivery update теряется

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.


## Exact targets и source окна

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/SKILL.md`

implementation; exact local source path. SHA256: `d9b0aebbe4bccd0594a30cce65143aec7a7dd60301a4b062a7f44a4229e8646f`

```text
69:
70: ```python
71: # aiogram 3.x — the shape, not the framework
72: async def handle(update: Update, db) -> None:
73:     if not await db.claim_update(update.update_id):   # INSERT on a primary key
74:         return                                        # already processed
75:     await do_the_work(update)
76: ```
77:
78: - **`update_id` is the only idempotency key you get.** It is sequential and it is
79:   stable across redeliveries. Nothing else in an update identifies it: two
80:   identical messages a second apart are two events, and the same event delivered
81:   twice is one.
82: - **Claim before working**, with an `INSERT` on a primary key, not a `SELECT`
83:   then an `INSERT`. Under a webhook Telegram may open up to `max_connections`
84:   (default 40) simultaneous connections, so two deliveries of one update can be
85:   in flight at once.
86: - **Updates are kept for 24 hours** and no longer. A bot that is down for a day
87:   has lost them, and nothing will say so — reconcile from your own state, never
88:   from the assumption that the queue drained.
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py`

implementation; exact local source path. SHA256: `f41388a6aa35ad04117613bc478d135b91e419ebb52c7c7d75e1fb2480c601e1`

```text
90:
91:     def deliver(self, update: dict, crash_on: int | None = None) -> None:
92:         """One webhook delivery, or one update out of a polled batch."""
93:         uid = update["update_id"]
94:         if self.has("claim") and not self.store.claim(uid):
95:             self.store.log.append(f"{uid}: duplicate")
96:             return
97:         if not self.has("claim"):
98:             self.store.processed.add(uid)
99:         if crash_on is not None and uid == crash_on:
100:             raise SystemError("killed mid-work")
101:         self._work(update)
102:
103:     def poll_batch(self, updates: list[dict], crash_on: int | None = None) -> None:
104:         """A getUpdates batch.
105:
106:         `crash_on` raises DURING the work for that update_id — a deploy, an OOM
107:         kill, a database blip. That is the only moment where the two orderings
108:         differ, so it is the only scenario that measures them.
109:         """
```

Тестовый artifact: `repo://telegram-dev/test/audit_regressions/fix-tg-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Update записать в inbox transaction перед ack; worker lease/retry отделить от request receipt.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Crash после ack сохраняет queued update; redelivery не теряет eventual completion.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TG-01.01.json), [parent](../parents/FIX-TG-01.json). Полный audit не required prompt input.
