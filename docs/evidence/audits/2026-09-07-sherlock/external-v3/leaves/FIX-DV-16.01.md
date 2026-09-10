# FIX-DV-16.01 — Typed health states

Parent `FIX-DV-16` · implementation · P2

## Что и зачем

Правила восстановления дают противоположные действия для отозванной сессии

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/error-tracking/SKILL.md`

implementation; exact local source path. SHA256: `5ccaa51ef3999be20a2faec8c15db27858e5ca97c04822406dc2403f4bc62b53`

```text
219: Observed 2026-08-24: a bot token was rotated, and for ten minutes the platform
220: reported the dyno `up` with a clean log while the API returned `401` to every
221: call and no user was served. Nothing in the system could tell the difference.
222:
223: **Liveness must assert the thing the service exists to do**, not that a process
224: exists. For anything holding a long-lived authenticated connection, check the
225: credential periodically and exit non-zero when it fails — a crash loop is
226: visible, a silent zombie is not. Sentry helps only if something raises; a
227: connection that stopped working without raising produces no event at all. Cron
228: monitors (`sentry monitor`) cover the shape where a job stops running.
229:
230: ## Degradation
231:
232: - **Not Claude Code** (Cursor, Codex, skills CLI, the API container): no MCP, no
233:   `/command`. Everything here is CLI and SDK, both of which work anywhere with a
234:   shell — except the API container, which has no network and no package install,
235:   so treat this skill as Claude Code and Cursor only for the setup half.
236: - **`sentry` CLI absent**: say so once, then use the REST API directly with a
237:   token (`curl https://sentry.io/api/0/…`), or the web UI for the one-off. Do
238:   not loop on the missing binary.
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-userbots/SKILL.md`

implementation; exact local source path. SHA256: `1bbe25fd5c4aa896a0fb7a6aabc96d70c3252ff7c716ce9123415447ee025cc2`

```text
143: Detail in [`references/entities-and-history.md`](references/entities-and-history.md).
144:
145: ## Two accounts, two lifetimes
146:
147: A userbot has a second failure mode a bot does not: **the human logs in
148: somewhere, changes the password, or terminates sessions**, and your process dies
149: holding a session that is no longer valid. Treat it as an expected event —
150: surface it as an alert with the account named, not as a crash loop — and never
151: put a userbot on the critical path of something a bot could serve.
152:
153: ## Before you ship
154:
155: 1. **The reason a user account is required is written down**, and the bot-API
156:    alternative was checked (§ *First: do you actually need one?*).
157: 2. **The session is in a secret store, gitignored, and revocable** (§ *The
158:    session file is the credential*).
159: 3. **`FloodWaitError` is caught, capped and alerted on** — never slept off
160:    unbounded (§ *`FloodWaitError` is the API working*).
161: 4. **The client version is pinned**, and the upgrade is its own change (§ *Pin
162:    the minor*).
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-userbots/references/sessions-and-auth.md`

implementation; exact local source path. SHA256: `2cff0833777a9d5c6f78cde1d3d02ed4dfda4ba163e52e6a7354eb166565b47e`

```text
69: A session ends when the user terminates it in Telegram's **Devices** screen, when
70: the password changes, or when Telegram decides. All three look identical to your
71: code: an `AuthKeyUnregisteredError` or an unauthorised state on the next call.
72:
73: - **Detect and alert, naming the account.** Do not retry: reconnecting with a
74:   dead session in a loop is a good way to draw attention to the account.
75: - **Have the recreation procedure written down** and runnable by whoever is on
76:   call, because it needs the phone.
77:
78: ## Version pinning
79:
80: Telethon minor releases have changed session format and entity-cache behaviour.
81: Four bots in this estate pin `telethon==1.37.0` deliberately while a fifth runs
82: `1.44.0`, and the pin's reason is in the requirements file beside it.
83:
84: Pin the exact version. Upgrade one bot at a time, with a session you can
85: recreate, and verify the two things a minor release touches: that the existing
86: session still opens, and that peer resolution still finds what it used to.
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-16.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить liveness/readiness/degraded_auth; revoked session останавливает работу до fresh auth.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Живой процесс с revoked session не ready; retry не логинит бесконечно.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-16.01.json), [parent](../parents/FIX-DV-16.json). Полный audit не required prompt input.
