# sheleg-dev

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.

Source checkout: `repo://sheleg-dev`; HEAD `42dfb5df929897f5cf39c72c0c69725f6bb664e2`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [integration](../contracts/integration.md), [evidence](../contracts/evidence.md).

Связанные находки:

- [DV-01: Claim фиксирует получение, но ошибочно считается завершением работы](../../packets/FIX-DV-01.md)
- [DV-02: Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant](../../packets/FIX-DV-02.md)
- [DV-03: Компенсация количества не компенсирует уже снятые деньги](../../packets/FIX-DV-03.md)
- [DV-04: Refund CAS проигрыш молча теряет больший cumulative refund](../../packets/FIX-DV-04.md)
- [DV-05: Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID](../../packets/FIX-DV-05.md)
- [DV-06: Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера](../../packets/FIX-DV-06.md)
- [DV-07: OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie](../../packets/FIX-DV-07.md)
- [DV-08: ADC precedence написан в обратном порядке](../../packets/FIX-DV-08.md)
- [DV-09: Express OAuth использует общий mutable client и неполную проверку state](../../packets/FIX-DV-09.md)
- [DV-10: Nonce равен присланному клиентом значению, а не ожидаемому сервером](../../packets/FIX-DV-10.md)
- [DV-11: Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом](../../packets/FIX-DV-11.md)
- [DV-12: Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract](../../packets/FIX-DV-12.md)
- [DV-13: Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты](../../packets/FIX-DV-13.md)
- [DV-14: Безусловный noscript pixel противоречит consent-gated архитектуре](../../packets/FIX-DV-14.md)
- [DV-15: Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs](../../packets/FIX-DV-15.md)
- [DV-16: Правила восстановления дают противоположные действия для отозванной сессии](../../packets/FIX-DV-16.md)
- [DV-17: FCP ошибочно объявлен неизмеримым в поле](../../packets/FIX-DV-17.md)
- [DV-18: Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев](../../packets/FIX-DV-18.md)
- [DV-19: Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](../../packets/FIX-DV-19.md)
- [DV-20: Ошибка окружения классифицируется как доказанный пропуск валидатора](../../packets/FIX-DV-20.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
