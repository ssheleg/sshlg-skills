# FIX-DV-04.01 — Refund CAS проигрыш молча теряет больший cumulative refund

Parent `FIX-DV-04` · implementation · P1

## Что и зачем

Refund CAS проигрыш молча теряет больший cumulative refund

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
253:
254: ## Refund clawback
255:
256: ```ts
257: const totalRefunded = charge.amount_refunded / 100;
258: const increment = totalRefunded - stored.refundedTotal;
259: if (increment <= 0) return;
260:
261: const { count } = await db.purchase.updateMany({
262:   where: { id: stored.id, refundedTotal: stored.refundedTotal },
263:   data:  { refundedTotal: totalRefunded },
264: });
265: if (count === 0) return;                       // concurrent delivery won
266:
267: try {
268:   await clawBack(stored.userId, increment);    // idempotent, keyed on charge id + total
269: } catch (err) {
270:   await db.purchase.update({ where: { id: stored.id },
271:     data: { refundedTotal: stored.refundedTotal } });   // put the marker back
272:   throw err;
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Под row lock/serializable transaction вычислять max(total_seen), delta и обновлять ledger вместе; CAS loser перечитывает и повторяет. Денежные значения хранить в minor units, а не /100 float.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-04.01.json), [parent](../parents/FIX-DV-04.json). Полный audit не required prompt input.
