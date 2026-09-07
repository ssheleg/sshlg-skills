# FIX-DV-02.01 — Unique subscription grant

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

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md`

implementation; exact local source path. SHA256: `0093365f0f96250c5acfb38d32186f9667eab57bf254d6339fa63659a724ea4a`

```text
142:
143: ```ts
144: if (invoice.billing_reason !== "subscription_cycle") return;   // see webhook-events.md
145:
146: await db.$transaction(async (tx) => {
147:   const sub = await tx.subscription.findUnique({ where: { id }, select: { lastGrantedPeriodStart: true } });
148:   if (sub?.lastGrantedPeriodStart && sub.lastGrantedPeriodStart >= periodStart) return;  // replay
149:
150:   await tx.subscription.update({ where: { id }, data: { lastGrantedPeriodStart: periodStart } });
151:   await tx.wallet.update({ where: { userId }, data: { credit: { increment: allowance } } });
152:   await tx.auditLog.create({ data: { userId, action: "grant", amount: allowance,
153:     source: "subscription-renewal", metadata: { invoiceId: invoice.id } } });
154: });
155: ```
156:
157: Marker and grant in **one** transaction. Two statements outside a transaction is
158: the same bug as read-then-write, one level up.
159:
160: ## Seat and quantity changes
161:
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

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Grant key включает subscription/item/invoice/period; выдача атомарна с записью key.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Concurrent renewal одного period создаёт один grant; новый period не подавляется.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-02.01.json), [parent](../parents/FIX-DV-02.json). Полный audit не required prompt input.
