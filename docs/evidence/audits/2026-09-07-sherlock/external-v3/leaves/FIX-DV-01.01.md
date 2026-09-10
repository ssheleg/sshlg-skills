# FIX-DV-01.01 — Received vs completed state

Parent `FIX-DV-01` · implementation · P1

## Что и зачем

Claim фиксирует получение, но ошибочно считается завершением работы

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/SKILL.md`

implementation; exact local source path. SHA256: `a0dcc36937f50a8da38261c1c39afe6caeb0f31674cdf3baaac48c4c81defe32`

```text
196:   } catch {
197:     return json({ error: "invalid signature" }, 400);    // no detail — it is an oracle
198:   }
199:
200:   const claim = await claimEvent(event.id);              // INSERT on a primary key
201:   if (claim === "duplicate") return json({ received: true, duplicate: true });
202:
203:   try {
204:     await handle(event);
205:   } catch {
206:     await releaseEventClaim(event.id);                   // let the retry back in
207:     return json({ error: "handler error" }, 500);
208:   }
209:   return json({ received: true });
210: }
211: ```
212:
213: - **Raw body.** Re-serializing a parsed body changes bytes and the signature
214:   fails. Disable auto-parsing for this route.
215: - **Exempt this path — and only this path — from CSRF and session auth**, by
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md`

implementation; exact local source path. SHA256: `276e15892305979ae04a402971c6632a53c249412d99fbea1cf49b4795dbf622`

```text
220:
221: ## Idempotency store
222:
223: ```sql
224: CREATE TABLE processed_webhook_events (
225:   id           TEXT PRIMARY KEY,      -- Stripe's evt_… id
226:   source       TEXT NOT NULL,         -- 'stripe' — the table serves every provider
227:   processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
228: );
229: CREATE INDEX ON processed_webhook_events (processed_at);
230: ```
231:
232: - `claimEvent` = `INSERT`; unique violation means duplicate.
233: - `releaseEventClaim` = `DELETE`, called only when processing threw.
234: - Prune older than ~30 days on a schedule. Stripe stops retrying after three
235:   days, so anything older is dead weight — but do not prune to a window shorter
236:   than the retry window, or a late retry reprocesses.
237: - A failure to *claim* (database down) is a 503, never an optimistic "probably
238:   new".
239:
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. В эталоне webhook разделить received/processing/completed; claim имеет expiry и recovery.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Crash после receipt допускает повторный worker; duplicate completed не повторяет grant.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-01.01.json), [parent](../parents/FIX-DV-01.json). Полный audit не required prompt input.
