# FIX-TG-03.01 — Separate canonicalizers

Parent `FIX-TG-03` · implementation · P1

## Что и зачем

HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.


## Exact targets и source окна

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md`

implementation; exact local source path. SHA256: `017a09f2edc4c16a8847b97ca153bbddc9048daaedd1fc6737fa9225ebf971eb`

```text
71:     pairs = dict(parse_qsl(init_data, strict_parsing=True))   # already url-decoded
72:     received = pairs.pop("hash", None)
73:     if not received:
74:         raise ValueError("no hash")
75:     pairs.pop("signature", None)                              # third-party field, not in the HMAC
76:
77:     check = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
78:     secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
79:     expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
80:
81:     if not hmac.compare_digest(expected, received):
82:         raise ValueError("bad signature")
83:     if time.time() - int(pairs["auth_date"]) > MAX_AGE:
84:         raise ValueError("stale")
85:     return pairs
86: ```
87:
88: Five ways this goes wrong, each of which still returns "valid" for somebody:
89:
90: - **The key derivation is backwards in half the snippets on the internet.** The
```

### Edit `repo://telegram-dev/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py`

implementation; exact local source path. SHA256: `acb7e04683f380b6a352cfddb7c61597e96fd53ae0d624423a83241c096f5891`

```text
30:     pairs = dict(parse_qsl(init_data, strict_parsing=True))
31:     received = pairs.pop("hash", None)
32:     if not received:
33:         raise ValueError("no hash")
34:     # `signature` is the Ed25519 third-party field. It is NOT part of the HMAC
35:     # check string, and leaving it in fails only for clients new enough to send it.
36:     pairs.pop("signature", None)
37:
38:     check = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
39:     # The constant is the KEY and the token is the MESSAGE. Swapped, this produces
40:     # a stable digest that never matches, and the usual "fix" is to stop checking.
41:     secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
42:     expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
43:
44:     if not hmac.compare_digest(expected, received):
45:         raise ValueError("bad signature")
46:
47:     auth_date = pairs.get("auth_date")
48:     if auth_date is None:
49:         raise ValueError("no auth_date")
```

Тестовый artifact: `repo://telegram-dev/test/audit_regressions/fix-tg-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. HMAC и Ed25519 canonicalization не разделяют ошибочный helper; сохранить/исключить поля по соответствующему protocol.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Независимые golden vectors с signature проходят только правильный verification path.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TG-03.01.json), [parent](../parents/FIX-TG-03.json). Полный audit не required prompt input.
