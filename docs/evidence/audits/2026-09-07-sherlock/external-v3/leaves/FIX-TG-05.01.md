# FIX-TG-05.01 — Лимит одного FloodWait не ограничивает бесконечную retry sequence

Parent `FIX-TG-05` · implementation · P2

## Что и зачем

Лимит одного FloodWait не ограничивает бесконечную retry sequence

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.


## Exact targets и source окна

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-userbots/references/rate-and-flood.md`

implementation; exact local source path. SHA256: `2abe60ae1fe748bc0f3dc676f5d3d31214d152d84c2002154ab6685b4027aacc`

```text
9: `FloodWaitError.seconds` is how long Telegram wants you to wait. It is exact, and
10: it is the only number in the situation that is not a guess.
11:
12: ```python
13: async def call_with_flood(fn, *a, cap=300, **kw):
14:     while True:
15:         try:
16:             return await fn(*a, **kw)
17:         except FloodWaitError as e:
18:             if e.seconds > cap:
19:                 log.error("flood_wait_too_long", seconds=e.seconds)
20:                 raise                      # a limit this long is a decision, not a sleep
21:             await asyncio.sleep(e.seconds + 1)
22: ```
23:
24: - **The `+1` matters**: sleeping exactly `seconds` lands on the boundary and
25:   earns a second wait.
26: - **The cap matters more.** Seconds mean pacing; minutes mean the account is
27:   being limited; hours mean stop and look. Sleeping through an hour-long wait is
28:   how a limited account becomes a banned one.
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-userbots/SKILL.md`

implementation; exact local source path. SHA256: `1bbe25fd5c4aa896a0fb7a6aabc96d70c3252ff7c716ce9123415447ee025cc2`

```text
155: 1. **The reason a user account is required is written down**, and the bot-API
156:    alternative was checked (§ *First: do you actually need one?*).
157: 2. **The session is in a secret store, gitignored, and revocable** (§ *The
158:    session file is the credential*).
159: 3. **`FloodWaitError` is caught, capped and alerted on** — never slept off
160:    unbounded (§ *`FloodWaitError` is the API working*).
161: 4. **The client version is pinned**, and the upgrade is its own change (§ *Pin
162:    the minor*).
163: 5. **A dead session pages a human** rather than restarting forever (§ *Two
164:    accounts, two lifetimes*).
```

Тестовый artifact: `repo://telegram-dev/test/audit_regressions/fix-tg-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Добавить wall-clock deadline, cumulative wait и attempt budget, cancellation и checkpoint queue; max wait трактовать как backpressure, длительные waits как policy choice. Runnable login/session example с явными imports.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TG-05.01.json), [parent](../parents/FIX-TG-05.json). Полный audit не required prompt input.
