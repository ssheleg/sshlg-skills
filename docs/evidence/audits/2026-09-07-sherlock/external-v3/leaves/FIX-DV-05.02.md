# FIX-DV-05.02 — Refund and hold lifecycle

Parent `FIX-DV-05` · implementation · P1

## Что и зачем

Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md`

implementation; exact local source path. SHA256: `83efcc58634f1bbc34c94c030388d0dfd43f69e7b5a5843ea732497e1a3818ff`

```text
1094:     // Return 200 to stop Heleket retrying a permanently unknown payment.
1095:     return NextResponse.json({ status: "ok" });
1096:   }
1097:
1098:   const FINAL: CryptoPaymentStatus[] = ["paid", "paid_over"];
1099:   if (FINAL.includes(payment.status)) {
1100:     return NextResponse.json({ status: "ok" });    // already credited, ignore
1101:   }
1102:
1103:   const mappedStatus = mapHeleletStatus(webhookStatus);
1104:   const meta = { paymentAmountUsd: paymentAmountUsd ?? undefined, txid, payerCurrency,
1105:     network, merchantAmount, fromAddress, commissionAmount };
1106:
1107:   if (isPaidStatus(webhookStatus)) {
1108:     // Credit waterfall: trust Heleket's USD figure first, then our buffered total,
1109:     // finally the user's base amount as a last resort.
1110:     const creditAmount = paymentAmountUsd ?? payment.tokenAmount ?? payment.amountUsd;
1111:
1112:     const claimed = await db.$transaction(async (tx) => {
1113:       // Idempotency — only the first paid webhook flips the status.
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-05.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Refund/hold events обрабатывать отдельным ledger, не отбрасывать после paid как duplicate.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Paid→refund корректирует ledger, repeated refund не дублируется.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-DV-05.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-05.02.json), [parent](../parents/FIX-DV-05.json). Полный audit не required prompt input.
