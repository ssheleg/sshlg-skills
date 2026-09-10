# FIX-DV-11.01 — Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом

Parent `FIX-DV-11` · implementation · P1

## Что и зачем

Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом

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
55: Key the user on `sub` (stable Google user ID; store as `google_id`) — never
56: on email (emails change, `sub` doesn't). On each Google login:
57:
58: 1. Record with this `google_id` exists → login (refresh name/picture).
59: 2. Email matches an existing account without `google_id` → link, BUT apply
60:    the **pre-hijacking guard**: if that account is password-based and its
61:    email was never verified, REFUSE the auto-link ("sign in with your
62:    password instead"). Otherwise an attacker who pre-registered the
63:    victim's email with a known password captures the victim's first Google
64:    login into the attacker's record.
65: 3. No match → create the user with `email_verified=True`, empty password
66:    hash.
67:
68: ## Login-CSRF (cover BOTH delivery flows)
69:
70: - Form-POST flow (`login_uri` auto-POST): GIS double-submits `g_csrf_token`
71:   in body AND cookie — compare constant-time (`hmac.compare_digest`);
72:   reject if either side is missing.
73: - JS-fetch flow: no `g_csrf_token` — enforce same-origin via Fetch-Metadata
74:   (`Sec-Fetch-Site: same-origin`) with an Origin-allowlist fallback.
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md`

implementation; exact local source path. SHA256: `5e3e31e5405d393ae72bd797f951645d4dc61d2458322a0cc050496e435dcaba`

```text
184: Every Google login resolves to exactly one of three cases:
185:
186: 1. **Returning Google user** — a record with this `google_id` (`sub`) exists
187:    → issue session. Refresh `name`/`picture` if they changed.
188: 2. **Existing email/password account, no `google_id`** — link Google to it
189:    (set `google_id`, mark `email_verified=True`) → issue session.
190:    ⚠️ **Pre-hijacking guard** (see §4.3): only auto-link if the existing
191:    account's email ownership was verified. Otherwise refuse with "sign in
192:    with your password".
193: 3. **Brand-new user** — create the account with `email_verified=True` (the
194:    Google token already proved inbox ownership), empty password hash → issue
195:    session.
196:
197: Then issue your own session. Prowl issues an HS256 app JWT (72 h, `ver` claim
198: for global revocation) delivered as an **HttpOnly, Secure, SameSite=Strict
199: cookie** — out of reach of JS/XSS, never sent cross-site.
200:
201: ## 3. Setup from scratch (~10 minutes)
202:
203: ### 3.1 Google Cloud Console
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-11.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. По умолчанию linking после fresh re-auth текущего локального аккаунта; если auto-link нужен, явно учитывать Google authoritative conditions и независимый challenge для прочих адресов. Unverified pre-registration направлять в безопасное recovery, не только в чужой password.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-11.01.json), [parent](../parents/FIX-DV-11.json). Полный audit не required prompt input.
