# FIX-TG-04.01 — Матрица launch surfaces неверно запрещает menu-button query flow

Parent `FIX-TG-04` · implementation · P2

## Что и зачем

Матрица launch surfaces неверно запрещает menu-button query flow

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.


## Exact targets и source окна

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md`

implementation; exact local source path. SHA256: `b08f44bfb242d2c400778d6788563a6a21e9b1ea8dcb32a1d043ee9ce9f9ee99`

```text
8: ## Two ways back, and the button decides which
9:
10: | Opened from | Return with | Shape |
11: |---|---|---|
12: | A **keyboard** button (`web_app` in `ReplyKeyboardMarkup`) | `WebApp.sendData(data)` | closes the app, delivers `message.web_app_data` to the bot |
13: | An **inline** button (`web_app` in `InlineKeyboardMarkup`) or an inline query | `answerWebAppQuery(query_id, result)` | the bot posts the result on the user's behalf |
14: | A direct link / menu button | neither — talk to your own backend | the app has no query to answer |
15:
16: Choosing the wrong one is not a style question: `sendData` is unavailable from an
17: inline context, and `query_id` is absent from `initData` when the app was opened
18: from a keyboard button.
19:
20: ## `sendData` is user input
21:
22: The string arrives as `message.web_app_data.data`, attributed to the user, in a
23: service message. **It is not signed and not privileged.** A user can craft the
24: same message. Validate it exactly as you would validate a typed command, and
25: never carry an amount, a price or an entitlement in it — carry an id your server
26: can look up.
27:
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/references/viewport-and-platform.md`

implementation; exact local source path. SHA256: `294b1a5d82af37332e72a9c2360bc00f5eb07f581a8fa30acdcbe5aa8b16fba3`

```text
42: Every WebApp method has a minimum Bot API version, and `WebApp.version` tells you
43: what the client supports. `WebApp.isVersionAtLeast('8.0')` is the guard;
44: calling a newer method on an older client does nothing and reports nothing.
45:
46: Recent additions worth knowing about, all 8.0+: `requestFullscreen()`,
47: `addToHomeScreen()`, `DeviceStorage` (~5 MB) and `SecureStorage`, `shareMessage()`,
48: `downloadFile()`, `shareToStory()`, and the sensor APIs (`Accelerometer`,
49: `DeviceOrientation`, `Gyroscope`, `LocationManager`).
50:
51: ## The buttons are Telegram's, not yours
52:
53: `MainButton`, `SecondaryButton`, `BackButton` and `SettingsButton` are rendered by
54: the client, sit outside your viewport, and match the user's theme for free. A
55: custom sticky footer duplicates them and loses to the keyboard on iOS.
56:
57: `WebApp.ready()` tells the client the app has painted; `WebApp.expand()` asks for
58: full height. Call `ready()` — until you do, the client may keep showing its
59: loading state over a page that is already interactive.
```

Тестовый artifact: `repo://telegram-dev/test/audit_regressions/fix-tg-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить keyboard, inline keyboard, menu, inline mode, direct/main/attachment surfaces; capability/API floor у каждого метода с первичным source.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TG-04.01.json), [parent](../parents/FIX-TG-04.json). Полный audit не required prompt input.
