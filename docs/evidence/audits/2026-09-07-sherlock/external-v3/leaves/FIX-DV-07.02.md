# FIX-DV-07.02 — Secret handling edges

Parent `FIX-DV-07` · implementation · P1

## Что и зачем

OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md`

implementation; exact local source path. SHA256: `44b2ab36141c9732a098e7a390c6a246a85473091dbdf29fd5f4984bfd32be74`

```text
482:         state=session['state']
483:     )
484:     flow.fetch_token(authorization_response=request.url)
485:     creds = flow.credentials
486:     session['credentials'] = {
487:         'token': creds.token,
488:         'refresh_token': creds.refresh_token,
489:         'token_uri': creds.token_uri,
490:         'client_id': creds.client_id,
491:         'client_secret': creds.client_secret,
492:         'scopes': list(creds.scopes or [])
493:     }
494:     return redirect('/profile')
495:
496:
497: @app.route('/profile')
498: def profile():
499:     if 'credentials' not in session:
500:         return redirect('/auth')
501:     creds = Credentials(**session['credentials'])
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/SKILL.md`

implementation; exact local source path. SHA256: `866cd92bececa1e6e4e5388c5b692347097010aff9478ebe1f776649eacb57da`

```text
234: client.on('tokens', (tokens) => {
235:   if (tokens.refresh_token) {
236:     // Store refresh_token — only sent on first auth
237:   }
238:   console.log(tokens.access_token);
239: });
240: ```
241:
242: **Python**
243:
244: ```python
245: from google.auth.transport.requests import Request
246:
247: if credentials.expired and credentials.refresh_token:
248:     credentials.refresh(Request())
249:     # credentials.token is the new access token
250:     # credentials.expiry is the new expiration datetime
251: ```
252:
253: ## Security Best Practices
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-07.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Убрать token logging, dev-secret fallback в production; HTTPS и store failure описать явно.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Missing prod secret fail closed; sanitized logs не раскрывают credential.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-DV-07.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-07.02.json), [parent](../parents/FIX-DV-07.json). Полный audit не required prompt input.
