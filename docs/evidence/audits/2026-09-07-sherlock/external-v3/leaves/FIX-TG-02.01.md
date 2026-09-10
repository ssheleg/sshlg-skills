# FIX-TG-02.01 — Оmitted allowed_updates ошибочно приравнен к пустому списку

Parent `FIX-TG-02` · implementation · P2

## Что и зачем

Оmitted allowed_updates ошибочно приравнен к пустому списку

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
101:     drop_pending_updates=False,
102: )
103: ```
104:
105: The default — an empty list, and the value you get by not passing the parameter —
106: means *"all update types **except** `chat_member`, `message_reaction` and
107: `message_reaction_count`"*. So a bot that tracks joins and leaves receives
108: nothing, the request returns `ok: true`, and the logs are clean. **Name every
109: type you handle, explicitly**, and re-run `setWebhook` when you add one:
110: `allowed_updates` is set at subscription time, not at handler time.
111:
112: ## Webhook or polling — and never both
113:
114: `getUpdates` **will not work while a webhook is set**. That is the whole
115: migration hazard: a local `getUpdates` run against a production token silently
116: takes over, or fails, depending on which side moved last. One token, one
117: consumer.
118:
119: - **The webhook is the callback, so it needs the same defences as a payment
120:   webhook**: verify `X-Telegram-Bot-Api-Secret-Token` against the value you set
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md`

implementation; exact local source path. SHA256: `4884522094198f9987b4e9f188487205e659750039ee10637e5735579e888cb7`

```text
74:   answers the question outright.
75:
76: ## `allowed_updates`
77:
78: Passing nothing, or an empty list, subscribes to **all types except
79: `chat_member`, `message_reaction` and `message_reaction_count`**. Those three are
80: the ones a moderation or analytics bot most wants, and their absence is silent.
81:
82: - The list is fixed **at subscription time**. Adding a handler does not add a
83:   subscription; re-run `setWebhook`/`getUpdates` with the new list.
84: - Name every type explicitly, including the ones in the default. A written list
85:   is a diff when it changes; an omitted parameter is not.
86: - `my_chat_member` (the bot's own status) is in the default. `chat_member`
87:   (everyone else's) is not — a pair that is very easy to conflate.
88:
89: ## Migrating between them
90:
91: ```
92: poll → webhook:   setWebhook(...)                      # polling stops working immediately
93: webhook → poll:   deleteWebhook(drop_pending_updates=False) → getUpdates(...)
```

Тестовый artifact: `repo://telegram-dev/test/audit_regressions/fix-tg-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Таблица unset/[]/explicit и getWebhookInfo evidence; хранить desired subscription отдельно. Update id использовать как identity, не глобальную гарантию монотонности навсегда.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TG-02.01.json), [parent](../parents/FIX-TG-02.json). Полный audit не required prompt input.
