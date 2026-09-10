# FIX-DV-06.01 — Typed amounts

Parent `FIX-DV-06` · implementation · P2

## Что и зачем

Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/SKILL.md`

implementation; exact local source path. SHA256: `d2fb267b6bfe44d80de862bbe9a69d348e81cadd506bedc35f605a81be6464b6`

```text
231: ```
232:
233: Two rules:
234:
235: - **Buffer the invoice, credit the intent.** Charge the buffered amount, credit
236:   the user for what they meant to buy. The buffer covers drift; it is not
237:   revenue and should not appear in what the user is told they bought.
238: - **Store both numbers.** `amountUsd` (intent) and `invoicedAmount` (what you
239:   asked for) are different, and support questions are unanswerable without both.
240:
241: Pick the buffer from observed rate volatility for the coins you accept, not from
242: this document.
243:
244: ---
245:
246: ## Reconciliation fields
247:
248: Six months later someone asks "did this payment actually arrive, and how much
249: did we net". Store enough to answer it **at webhook time** — the gateway's
250: retention is not your retention:
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md`

implementation; exact local source path. SHA256: `83efcc58634f1bbc34c94c030388d0dfd43f69e7b5a5843ea732497e1a3818ff`

```text
873:   // 4. Compute amounts (1% buffer for crypto slippage)
874:   const orderId = `crypto_${userId.slice(0, 8)}_${Date.now()}_${randomUUID().slice(0, 8)}`;
875:   const bufferAmount = Math.ceil(amountUsd * CRYPTO_BUFFER_RATE * 100) / 100;
876:   const invoiceAmount = Math.round((amountUsd + bufferAmount) * 100) / 100;
877:   const tokenAmount = invoiceAmount;     // user gets the buffer back as balance
878:
879:   // 5. Build callback / success / return URLs (same-origin only)
880:   const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
881:   const isSameOrigin = (url?: string) => {
882:     if (!url || !appUrl) return false;
883:     try { return new URL(url).origin === new URL(appUrl).origin; } catch { return false; }
884:   };
885:   const successUrl = isSameOrigin(customSuccessUrl)
886:     ? `${customSuccessUrl}${customSuccessUrl!.includes("?") ? "&" : "?"}crypto_success=true&orderId=${orderId}`
887:     : `${appUrl}/billing?crypto_success=true&orderId=${orderId}`;
888:   const returnUrl = isSameOrigin(customCancelUrl) ? customCancelUrl! : `${appUrl}/billing`;
889:   const callbackUrl = `${appUrl}/api/billing/crypto/webhook`;
890:
891:   // 6. Build metadata (echoed back via additional_data, max 255 chars)
892:   const metadata = { userId, context, ...extra,
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Отдельные Money minor/decimal, Asset network/amount, Entitlement units и dated FX quote; без implicit unit conversion.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

USD minor не складывается с crypto decimals; unknown FX source блокирует conversion.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-06.01.json), [parent](../parents/FIX-DV-06.json). Полный audit не required prompt input.
