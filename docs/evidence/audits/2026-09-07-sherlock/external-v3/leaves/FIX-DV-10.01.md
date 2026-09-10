# FIX-DV-10.01 — Nonce равен присланному клиентом значению, а не ожидаемому сервером

Parent `FIX-DV-10` · implementation · P1

## Что и зачем

Nonce равен присланному клиентом значению, а не ожидаемому сервером

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-signin/SKILL.md`

implementation; exact local source path. SHA256: `0faad3af070710b140f21939a2cea1d6185fb462696277b7515a4c01d0fbac92`

```text
33:
34: ## Core flow (ID-token)
35:
36: 1. Frontend: `google.accounts.id.initialize({ client_id, callback, nonce })`
37:    + `renderButton()`. Generate a **fresh random nonce per render**
38:    (`crypto.randomUUID()`). The GSI script loads async — retry rendering
39:    (e.g. 20 × 150 ms) instead of silently dropping the button.
40: 2. Callback receives `{ credential }` — a Google-signed ID token (JWT).
41:    POST it with the nonce to your backend. Never treat it as a session.
42: 3. Backend: verify with the official lib — Python
43:    `google.oauth2.id_token.verify_oauth2_token(credential, transport, CLIENT_ID)`,
44:    Node `google-auth-library` `verifyIdToken({ idToken, audience })`. That
45:    checks signature (Google JWKS), `aud`, `iss`, `exp`. Never hand-decode
46:    and trust the payload.
47: 4. Additionally require `email_verified == true` and token `nonce` claim ==
48:    submitted nonce.
49: 5. Find-or-create the user, then issue YOUR OWN session (app JWT) as an
50:    **HttpOnly + Secure + SameSite=Strict cookie**. Google's token is
51:    verified once, never stored, never logged.
52:
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md`

implementation; exact local source path. SHA256: `5e3e31e5405d393ae72bd797f951645d4dc61d2458322a0cc050496e435dcaba`

```text
260:   claim someone else's address.
261:
262: ### 4.2 Nonce — replay defense
263:
264: Generate a fresh random nonce per button render, pass it to
265: `google.accounts.id.initialize({nonce})`, send it alongside the credential,
266: compare server-side with the token's `nonce` claim
267: (`web/auth.py:375-376`). A stolen/logged ID token can't be replayed later
268: because the nonce won't match the new session's nonce.
269:
270: ### 4.3 Account pre-hijacking guard (P3-01 in Prowl)
271:
272: Attack: attacker registers `victim@gmail.com` with a password *before* the
273: victim ever visits. Later the victim clicks "Sign in with Google". Naïve
274: auto-linking attaches victim's Google to the **attacker's** record — attacker
275: keeps password access to the merged account (its data and wallet).
276:
277: Defense (`web/auth.py:392-417`): when a Google login matches an existing
278: **password** account whose email was **never verified**, refuse to auto-link;
279: tell the user to sign in with the password. Link only when email ownership of
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/sign-in-with-google.md`

implementation; exact local source path. SHA256: `68cacdf6008bf7b24d5550c1be9c3fa72e63dcc1d8cb93ea2ea5886843bffde8`

```text
290:
291: **Server-side (Python):**
292:
293: ```python
294: if body.nonce:
295:     token_nonce = payload.get('nonce')
296:     if not token_nonce or token_nonce != body.nonce:
297:         raise ValueError('Nonce mismatch')
298: ```
299:
300: ## ID Token Payload Fields
301:
302: | Field | Description |
303: |-------|-------------|
304: | `sub` | Unique Google Account ID — **use as primary key** |
305: | `email` | User's email address |
306: | `email_verified` | Whether email is verified |
307: | `name` | Full name |
308: | `given_name` | First name |
309: | `family_name` | Last name |
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-10.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Server-issued nonce связан с pre-auth HttpOnly session, TTL и one-time consume; обязательное точное совпадение token nonce с server expectation, а не body nonce.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-10.01.json), [parent](../parents/FIX-DV-10.json). Полный audit не required prompt input.
