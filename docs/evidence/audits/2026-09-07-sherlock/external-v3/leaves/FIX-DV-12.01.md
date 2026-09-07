# FIX-DV-12.01 — Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract

Parent `FIX-DV-12` · implementation · P1

## Что и зачем

Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract

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
66:    hash.
67:
68: ## Login-CSRF (cover BOTH delivery flows)
69:
70: - Form-POST flow (`login_uri` auto-POST): GIS double-submits `g_csrf_token`
71:   in body AND cookie — compare constant-time (`hmac.compare_digest`);
72:   reject if either side is missing.
73: - JS-fetch flow: no `g_csrf_token` — enforce same-origin via Fetch-Metadata
74:   (`Sec-Fetch-Site: same-origin`) with an Origin-allowlist fallback.
75:
76: Without this, an attacker's page can force-POST the *attacker's* credential
77: and silently log the victim into the attacker's account.
78:
79: ## Setup (GCP)
80:
81: 1. Cloud Console → APIs & Services → OAuth consent screen (External;
82:    publish it — in "Testing" only allowlisted users can sign in).
83: 2. Credentials → Create OAuth client ID → **Web application** →
84:    **Authorized JavaScript origins** = every origin the button renders on,
85:    incl. `http://localhost:<port>` for dev (scheme+host+port, no path, no
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-signin/references/full-guide.md`

implementation; exact local source path. SHA256: `5e3e31e5405d393ae72bd797f951645d4dc61d2458322a0cc050496e435dcaba`

```text
355: GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
356: _transport = google_requests.Request()
357: app = FastAPI()
358:
359: class GoogleAuthRequest(BaseModel):
360:     credential: str
361:     nonce: str | None = None
362:     g_csrf_token: str | None = None
363:
364: @app.post("/api/auth/google")
365: async def google_auth(req: Request, data: GoogleAuthRequest, response: Response):
366:     # CSRF: double-submit for form-POST flow, Fetch-Metadata for JS flow
367:     if data.g_csrf_token:
368:         cookie = req.cookies.get("g_csrf_token") or ""
369:         if not hmac.compare_digest(cookie, data.g_csrf_token):
370:             raise HTTPException(403, "CSRF token mismatch")
371:     elif req.headers.get("sec-fetch-site", "same-origin") not in ("same-origin", "none"):
372:         raise HTTPException(403, "Cross-site request rejected")
373:
374:     try:
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-12.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Раздельные явно типизированные form/JSON paths; form требует оба g_csrf_token, JSON требует trusted same-origin или точный Origin fallback; отсутствие обоих fail closed.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-12.01.json), [parent](../parents/FIX-DV-12.json). Полный audit не required prompt input.
