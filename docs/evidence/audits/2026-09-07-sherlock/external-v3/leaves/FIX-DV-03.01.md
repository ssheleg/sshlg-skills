# FIX-DV-03.01 — Durable operation intent

Parent `FIX-DV-03` · implementation · P1

## Что и зачем

Компенсация количества не компенсирует уже снятые деньги

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
161:
162: ```ts
163: const item = (await stripe.subscriptions.retrieve(subId)).items.data[0];
164:
165: try {
166:   await stripe.subscriptions.update(subId, {
167:     items: [{ id: item.id, quantity: newQuantity }],
168:     proration_behavior: "always_invoice",
169:     payment_behavior: "error_if_incomplete",     // upgrades only
170:   });
171: } catch (err) {
172:   if (err.type === "StripeCardError" || err.code === "invoice_payment_intent_requires_action") {
173:     return json({ error: "payment failed", code: "payment_failed" }, 402);
174:   }
175:   throw err;
176: }
177:
178: try {
179:   await db.subscription.update({ where: { id }, data: { quantity: newQuantity } });
180: } catch (dbErr) {
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Хранить operation id/key до Stripe effect, unknown remote outcome не считать failed.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Timeout после принятого Stripe effect остаётся unknown и доступен reconciliation.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-03.01.json), [parent](../parents/FIX-DV-03.json). Полный audit не required prompt input.
