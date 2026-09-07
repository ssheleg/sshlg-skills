# FIX-DV-02.02 — Monotonic mirror и serialization retry

Parent `FIX-DV-02` · implementation · P1

## Что и зачем

Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md`

implementation; exact local source path. SHA256: `276e15892305979ae04a402971c6632a53c249412d99fbea1cf49b4795dbf622`

```text
211: For a subscription whose state you cannot reconstruct from one event, retrieve
212: the subscription fresh inside the handler. One extra API call is cheaper than a
213: class of ordering bugs.
214:
215: **Proved, not asserted.** `fixtures/invoice-paid-subscription-cycle-next-period.json`
216: delivered *before* `fixtures/invoice-paid-subscription-cycle.json`:
217: `out-of-order-pair-does-not-rewind-state` requires both periods to be granted and the
218: mirrored row to still hold February. The two events carry different ids, so idempotency
219: cannot mask the defect — which is the only reason this fixture measures the ordering rule.
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
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/fixtures/reference-handler.mjs`

implementation; exact local source path. SHA256: `e84caa4a22ff32d172d45ea3f10f030eeca83ba58df215f37cc858bfb085c194`

```text
210:     }
211:     const metadata = invoiceMetadata(invoice);
212:     const userId = metadata.userId;
213:
214:     const granted = await store.readGrantedPeriods(subId);
215:     if (has('grant-marker') && granted.has(period.start)) {
216:       store.log.push({ event: event.id, decision: 'skipped: period already granted' });
217:       return [];
218:     }
219:     store.markPeriodGranted(subId, period.start);
220:     store.addCredits(userId, CREDITS_PER_PERIOD);
221:     store.grants.push({
222:       subscription: subId, userId, periodStart: period.start, source: 'webhook', event: event.id,
223:     });
224:
225:     // The mirror moves FORWARD only. Arrival order is not state.
226:     const mirror = store.subscriptions.get(subId);
227:     if (!has('ordering') || !mirror || period.start > mirror.periodStart) {
228:       store.subscriptions.set(subId, {
229:         periodStart: period.start,
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-02.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Состояние subscription mirror отдельно от grant ledger; reordered events не откатывают period, retry serialization bounded.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Поздний старый event не уменьшает confirmed period; serialization retry не теряет renewal.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-DV-02.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-02.02.json), [parent](../parents/FIX-DV-02.json). Полный audit не required prompt input.
