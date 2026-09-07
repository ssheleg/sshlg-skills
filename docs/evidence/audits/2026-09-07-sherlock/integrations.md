# Аудит интеграционного слоя ssheleg — 7 sheleg-dev + 3 telegram-dev

> Дополнение сводного аудита: после восстановления места повторный `sheleg-dev npm run test:all` завершился exit 0; все 48 negative guards отклоняют planted defect. [Итоговый лог](sheleg-dev-final.log). Упомянутый ниже TEST_ERROR — первоначальный запуск; DV-20 сохраняется как ошибка классификации сбоя setup.

Дата: 2026-09-07. Исходники: repo://sshlg-skills/skills, sheleg-dev 0.11.8 и telegram-dev 0.1.11. Режим — аудит/план; без изменения source/release, live payments, сообщений Telegram и изменений auth.

Проверенные commits: sheleg-dev `42dfb5df929897f5cf39c72c0c69725f6bb664e2`; telegram-dev `0263b899e5827c65d366d2bbac73557a56045235`. `git status --short` у обоих после аудита пустой. Offline reproduction: [reproduce.py](integrations-logs/reproduce.py), запустить Python 3; 83 ссылки на file:line в JSON разрешаются и находятся внутри файлов.

10/10 SKILL.md прочитаны полностью, суммарно 2566 строк. 25 findings. P0 не выставлялся: production deployments и активные инциденты не обследованы. P1 означает дефект безопасности/денег в инструкции или runnable template, P2 — точность, восстановление и качество измерений.

Зелёные structural suites соседствуют с воспроизводимыми дефектами: Telegram HMAC отвергает all-fields vector; bot теряет update после restart; string scrubber пропускает Redis password. В OAuth примерах client_secret помещается в читаемую signed cookie. Приоритет — исправить эталоны и oracle, затем переизмерить model behavior.

## Покрытие и пределы

- Полностью прочитаны все 10 SKILL.md, все 10 Telegram reference-файлов и две Telegram Python fixtures.
- sheleg-dev полностью: Stripe webhook-events/subscription-lifecycle, Google sign-in full-guide, Sentry scrubbing, ads reference-emitter; подробно: Stripe reference-handler 1–290, OAuth full examples 365–600, ADC precedence, duplicate sign-in nonce, consent-mode 1–160. Heleket reference (1697 строк) просмотрен поиском money/signature/status полей, подробно settlement 1040–1165, buffer/credit и transaction passages. Это risk-oriented reference audit, **не утверждение полного построчного чтения всех 9428 строк references**.
- Прочитаны npm scripts, fixture integration runner, eval scenarios/results, основные части negatives.py и money-gate. Mechanical make-skill/strict manifests — проверка родителя, здесь не повторялась.
- Проверены первичные web-источники для ADC, email authority, cookie sessions, FCP, consent, Telegram HMAC/launch/update semantics. Все version pins, юридические политики каждой страны, коммерческая доступность провайдеров и настоящий телефон **не проверены**.
- Generated app E2E, реальная DB concurrency и новый model behavior eval **не запускались**. Acceptance ниже — будущие проверки, а не объявленные PASS.

## Выполненные проверки

| Команда | Результат | Содержание |
|---|---|---|
| sheleg-dev: npm run test:all | TEST_ERROR, exit 1 в negatives | validate 27 PASS; moneygate 65 fixtures PASS; money fixtures 16 PASS; installer 11 PASS; negatives 8 PASS и 40 cp ENOSPC, не доказанные validator bypass |
| telegram-dev: npm test | PASS, exit 0 | validate 14; initData 9; update-delivery 4 invariants/mutants; installer 11 |
| telegram-dev: npm run test:negatives | PASS, exit 0 | 15 planted structural defects rejected |
| offline counterexamples | дефекты воспроизведены | HMAC signature field; crash+restart; scrubber. Future timestamp +24h принимается verifier |

Логи: [sheleg-dev](integrations-logs/sheleg-dev.txt), [Telegram](integrations-logs/telegram-dev.txt), [Telegram negatives](integrations-logs/telegram-negatives.txt), [контрпримеры](integrations-logs/counterexamples.txt). Использованы только fake secrets. negatives.py очистил scratch copies; source git status чистый.

## stripe-billing

**Что сохранить.** Правильное разделение денег Stripe и локального entitlement, paid/unpaid controls, cumulative refunds, async payments и out-of-order cases. Слабое место — расхождение in-memory fixture и копируемых DB-примеров.

### DV-01 · P1 · Claim фиксирует получение, но ошибочно считается завершением работы

**Наблюдение.** INSERT processed_event фиксируется до handle; удаляется только при пойманном исключении. SIGKILL после INSERT не вызывает catch. Эффекты после commit не имеют durable outbox.

**Влияние.** Повтор отвечает duplicate, хотя entitlement или уведомление не выполнены; ошибка эффекта после commit может повторить ранее выполненные эффекты.

**Доказательства:**

- [skills/stripe-billing/SKILL.md:200](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/SKILL.md#L200)
- [stripe-billing/references/webhook-events.md:224](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md#L224)
- [skills/stripe-billing/SKILL.md:225](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/SKILL.md#L225)

**Исправить.** Разделить received/processing/completed; claim с lease и восстановлением; entitlement + business dedup + outbox в одной транзакции; consumer эффектов с собственной идемпотентностью.

**Приёмка.** Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.

### DV-02 · P1 · Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant

**Наблюдение.** Пример отбрасывает periodStart <= lastGrantedPeriodStart; fixture требует выдать оба периода при February→January. SELECT→UPDATE внутри транзакции сам по себе не задаёт isolation/row lock; reconciliation не несёт event.id.

**Влияние.** Оплаченный старый период теряет allowance; два независимых входа могут начислить один период дважды при обычной изоляции БД.

**Доказательства:**

- [stripe-billing/references/subscription-lifecycle.md:146](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L146)
- [stripe-billing/references/webhook-events.md:215](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/webhook-events.md#L215)
- [stripe-billing/fixtures/reference-handler.mjs:214](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/fixtures/reference-handler.mjs#L214)

**Исправить.** Уникальная запись grant по subscription/item/invoice/period и атомарная выдача; отдельно monotonic mirror состояния. Определить isolation и retry serialization failures.

**Приёмка.** Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.

### DV-03 · P1 · Компенсация количества не компенсирует уже снятые деньги

**Наблюдение.** Upgrade использует always_invoice; при сбое БД возвращает oldQuantity с proration_behavior:none. Эта операция не возвращает начисление первой invoice.

**Влияние.** Клиент платит за upgrade и получает старое число seats; текст называет это компенсирующим revert, создавая ложное ощущение восстановления.

**Доказательства:**

- [stripe-billing/references/subscription-lifecycle.md:165](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L165)
- [stripe-billing/references/subscription-lifecycle.md:178](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L178)

**Исправить.** Durable operation intent с idempotency key; предпочесть восстановить БД из подтверждённого Stripe состояния. Если бизнес выбрал rollback, отдельно оформить подтверждённую финансовую компенсацию и её статус.

**Приёмка.** Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.

### DV-04 · P1 · Refund CAS проигрыш молча теряет больший cumulative refund

**Наблюдение.** Два обработчика с одинаковым stored.refundedTotal для cumulative 4000 и 9000: если 4000 выиграл, 9000 возвращает без перечитывания. Marker и clawBack разделены; rollback marker без CAS способен затереть более новый total.

**Влияние.** Недостаточное clawback и расхождение ledger; при падении между marker и clawBack retry пропускается.

**Доказательства:**

- [stripe-billing/references/subscription-lifecycle.md:257](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L257)
- [stripe-billing/references/subscription-lifecycle.md:265](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L265)
- [stripe-billing/references/subscription-lifecycle.md:270](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/stripe-billing/references/subscription-lifecycle.md#L270)

**Исправить.** Под row lock/serializable transaction вычислять max(total_seen), delta и обновлять ledger вместе; CAS loser перечитывает и повторяет. Денежные значения хранить в minor units, а не /100 float.

**Приёмка.** Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.

## crypto-payments

**Что сохранить.** Выделены under/overpayment, settlement valuation, signature/proxy/CSRF и отдельная test/live декларация. Business policy и разные версии алгоритма в body/reference надо унифицировать.

### DV-05 · P1 · Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID

**Наблюдение.** В body creditUser следует после любого успешного updateMany(mapped), без проверки PAID и общей транзакции. Reference улучшает paid gate и транзакцию, но return при paid/paid_over отбрасывает refund/hold updates.

**Влияние.** Если копировать body, pending/AML/failed могут кредитовать, crash теряет credit; если копировать reference, refund после paid не записывается. Это дефекты примеров, не доказательство активного продового ущерба.

**Доказательства:**

- [skills/crypto-payments/SKILL.md:93](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L93)
- [skills/crypto-payments/SKILL.md:183](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L183)
- [skills/crypto-payments/SKILL.md:196](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L196)
- [crypto-payments/references/heleket-provider.md:1098](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L1098)

**Исправить.** Один исполняемый эталон; разделить payment status, immutable settlement grant и refund ledger. Only confirmed settlement credit; атомарный business dedup; refunds и holds не отбрасывать как duplicate.

**Приёмка.** pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.

### DV-06 · P2 · Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера

**Наблюдение.** Body: buffer не выдаётся пользователю, credit intent; waterfall: paidAmountUsd ?? tokenAmount (описан как plan units) ?? amountUsd. Heleket reference: tokenAmount=invoiceAmount, buffer возвращается в баланс. Единого dimensional contract нет.

**Влияние.** В разных generated integrations одинаковая оплата создаёт разные балансы; tokens могут трактоваться как USD. Бизнес-политика незаметно выбирается скиллом.

**Доказательства:**

- [skills/crypto-payments/SKILL.md:235](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L235)
- [skills/crypto-payments/SKILL.md:272](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/SKILL.md#L272)
- [crypto-payments/references/heleket-provider.md:877](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L877)
- [crypto-payments/references/heleket-provider.md:1257](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/crypto-payments/references/heleket-provider.md#L1257)

**Исправить.** Ввести Money(currency, minor/decimal), Asset(network, amount), Entitlement(units), FX quote с источником/временем. Выбор refund excess/credit excess/buffer fee оформлять явной политикой проекта.

**Приёмка.** Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.

## google-auth

**Что сохранить.** Полезная карта ADC/OAuth/WIF/service accounts и переход к отдельному sign-in контракту. Security prose существенно сильнее приведённых full examples.

### DV-07 · P1 · OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie

**Наблюдение.** Flask default session и Starlette SessionMiddleware подписывают, но не шифруют cookie. В credentials положены client_secret, token, refresh_token. Body также прямо console.log(tokens.access_token). Официальные docs подтверждают читаемость session contents.

**Влияние.** Любой пользователь с такой сессией получает OAuth client_secret; credential replication в браузер и логи увеличивает поверхность утечки. Дефект шаблона подтверждён, реальные deployment не обследованы.

**Доказательства:**

- [google-auth/references/oauth2-web-server.md:486](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L486)
- [google-auth/references/oauth2-web-server.md:527](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L527)
- [google-auth/references/oauth2-web-server.md:569](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L569)
- [skills/google-auth/SKILL.md:238](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/SKILL.md#L238)

**Исправить.** В cookie только случайный opaque session id; Google credentials хранить server-side encrypted store, доступ по session+principal. Удалить token logging; production secret без dev fallback; HTTPS guard.

**Приёмка.** Локальный HTTP client выполняет stubbed OAuth callback, декодирует Set-Cookie: ни client_secret, ни access/refresh token отсутствуют; stdout/stderr также чисты.

Первичные источники: [flask.palletsprojects.com · 1](https://flask.palletsprojects.com/en/stable/quickstart/#sessions), [raw.githubusercontent.com · 2](https://raw.githubusercontent.com/encode/starlette/master/docs/middleware.md).

### DV-08 · P1 · ADC precedence написан в обратном порядке

**Наблюдение.** Body и reference говорят attached service account → local ADC → env. Google документирует env → local ADC → attached service account.

**Влияние.** Оператор может считать workload identity фактическим principal, хотя старый env JSON подменяет его; ошибочные разрешения и доступ не к тому проекту.

**Доказательства:**

- [skills/google-auth/SKILL.md:89](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/SKILL.md#L89)
- [google-auth/references/adc-and-service-accounts.md:24](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/adc-and-service-accounts.md#L24)

**Исправить.** Исправить оба места из одной canonical таблицы; сначала показывать фактически resolved principal/source без секрета, затем настраивать.

**Приёмка.** В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.

Первичные источники: [docs.cloud.google.com · 1](https://docs.cloud.google.com/docs/authentication/application-default-credentials).

### DV-09 · P1 · Express OAuth использует общий mutable client и неполную проверку state

**Наблюдение.** Один OAuth2 client на весь процесс; каждый /profile меняет его credentials. Сравнение state допускает undefined===undefined; state не consume, отсутствует TTL.

**Влияние.** Конкурентные запросы разных пользователей разделяют credential state; сессия без ожидаемого state не отвергается до code exchange.

**Доказательства:**

- [google-auth/references/oauth2-web-server.md:380](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L380)
- [google-auth/references/oauth2-web-server.md:403](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L403)
- [google-auth/references/oauth2-web-server.md:412](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md#L412)

**Исправить.** Client на запрос/пользователя, credentials не мутировать глобально; required cryptorandom state привязать к server session, TTL, atomic consume; validation до token exchange.

**Приёмка.** Интерливинг A/B с задержкой между setCredentials и transport использует разные Authorization; missing/expired/reused state не вызывает token endpoint.

### DV-10 · P1 · Nonce равен присланному клиентом значению, а не ожидаемому сервером

**Наблюдение.** Клиент генерирует nonce и POSTит вместе с credential; backend сравнивает их и даже пропускает проверку если nonce отсутствует. Серверного challenge/consume нет. Утверждение 'stolen token cannot be replayed' не следует из кода: nonce читается из JWT.

**Влияние.** Перехваченный ещё действующий token повторно обменивается на новую app session; заявленная replay defense отсутствует.

**Доказательства:**

- [skills/google-signin/SKILL.md:37](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L37)
- [skills/google-signin/SKILL.md:47](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L47)
- [google-signin/references/full-guide.md:264](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L264)
- [google-signin/references/full-guide.md:380](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L380)
- [google-auth/references/sign-in-with-google.md:294](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-auth/references/sign-in-with-google.md#L294)

**Исправить.** Server-issued nonce связан с pre-auth HttpOnly session, TTL и one-time consume; обязательное точное совпадение token nonce с server expectation, а не body nonce.

**Приёмка.** Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.

## google-signin

**Что сохранить.** Правильные sub, официальная verification, pre-hijacking concern, собственная session и CSRF. Replay и linking требуют исправления исполняемого контракта.

Связанный finding **DV-10** описан выше: Nonce равен присланному клиентом значению, а не ожидаемому сервером.

### DV-11 · P1 · Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом

**Наблюдение.** email_verified=true используется как доказательство inbox ownership для auto-link. Google отдельно исключает non-Gmail без hd: владение сторонним email могло измениться с момента первоначальной верификации.

**Влияние.** Возможна привязка Google identity прежнего владельца стороннего адреса к локальному аккаунту нынешнего владельца.

**Доказательства:**

- [skills/google-signin/SKILL.md:59](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L59)
- [google-signin/references/full-guide.md:188](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L188)
- [google-signin/references/full-guide.md:193](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L193)

**Исправить.** По умолчанию linking после fresh re-auth текущего локального аккаунта; если auto-link нужен, явно учитывать Google authoritative conditions и независимый challenge для прочих адресов. Unverified pre-registration направлять в безопасное recovery, не только в чужой password.

**Приёмка.** JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.

Первичные источники: [developers.google.com · 1](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

### DV-12 · P1 · Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract

**Наблюдение.** Endpoint принимает Pydantic JSON body, хотя заявляет поддержку GIS form POST; missing Sec-Fetch-Site считается same-origin, Origin fallback отсутствует, none разрешён.

**Влияние.** Form flow получает 422; отсутствующий metadata header становится разрешением. Конкретный browser exploit зависит от delivery/content type, поэтому он не объявлен воспроизведённым.

**Доказательства:**

- [skills/google-signin/SKILL.md:70](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/SKILL.md#L70)
- [google-signin/references/full-guide.md:359](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L359)
- [google-signin/references/full-guide.md:365](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L365)
- [google-signin/references/full-guide.md:371](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/google-signin/references/full-guide.md#L371)

**Исправить.** Раздельные явно типизированные form/JSON paths; form требует оба g_csrf_token, JSON требует trusted same-origin или точный Origin fallback; отсутствие обоих fail closed.

**Приёмка.** TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.

## ad-tracking

**Что сохранить.** Полезные duplicate-revenue controls и server-authoritative purchase. Учёт не доказывает GDPR/DMA compliance; policy и snippets надо отделить от технической механики.

### DV-13 · P2 · Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты

**Наблюдение.** Basic ошибочно 'No conversion modeling' (Google: general model), certified CMP объявлен обязательным всем Google ad products (официальный scope publisher AdSense/AdManager/AdMob); 'always Advanced', '65–70%' и 'no banner needed' вне EEA представлены универсально.

**Влияние.** Генерация необязательной CMP миграции, неверных прогнозов recovered revenue и отправки данных без выбранной политики consent.

**Доказательства:**

- [skills/ad-tracking/SKILL.md:61](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L61)
- [skills/ad-tracking/SKILL.md:77](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L77)
- [ad-tracking/references/consent-mode.md:22](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L22)
- [ad-tracking/references/consent-mode.md:31](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L31)
- [ad-tracking/references/consent-mode.md:74](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/references/consent-mode.md#L74)

**Исправить.** Развести product policy, geography/legal decision и технику. Scope+source+checked_at у требований; Basic general vs Advanced advertiser-specific model; процент только как dated measured study, не обещание. Режим выбирается политикой проекта.

**Приёмка.** Near-miss advertiser-only GA4/Ads без publisher inventory не требует certified CMP автоматически; Basic проходит; неизвестная юрисдикция не автоматически granted.

Первичные источники: [developers.google.com · 1](https://developers.google.com/tag-platform/security/concepts/consent-mode), [support.google.com · 2](https://support.google.com/admob/answer/13554116?hl=en).

### DV-14 · P1 · Безусловный noscript pixel противоречит consent-gated архитектуре

**Наблюдение.** Meta noscript img дан без server consent gate, хотя перед этим обещано не рендерить Meta до consent. В том же body GA4 G-tag snippet всё ещё несёт allow_enhanced_conversions, который ниже запрещено помещать на G-tag.

**Влияние.** При отключённом JS копия noscript отправляет PageView без получения согласия; исправления текста не исправили копируемые примеры.

**Доказательства:**

- [skills/ad-tracking/SKILL.md:53](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L53)
- [skills/ad-tracking/SKILL.md:233](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L233)
- [skills/ad-tracking/SKILL.md:115](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L115)
- [skills/ad-tracking/SKILL.md:161](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/ad-tracking/SKILL.md#L161)

**Исправить.** Генерировать snippets из исполняемых templates; noscript разрешать только по ранее сохранённому server-verifiable consent либо убрать. Исправить G/AW конфигурацию синхронно с prose.

**Приёмка.** Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.

## error-tracking

**Что сохранить.** Удачная граница DSN/auth token, secret-in-string, единый release id и нефатальное release bookkeeping. Scrubber coverage ограничено и должно измеряться отдельно.

### DV-15 · P1 · Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs

**Наблюдение.** Выполнен код из reference. redis://:AUDIT_FAKE_PASSWORD@host:6379 не изменился (regex требует непустого user); Telegram /bot<TOKEN>/ и ?access_token также не изменились. postgres://user:pw@ редактируется.

**Влияние.** Добавление Sentry по инструкции может передавать секреты в messages/exceptions несмотря на обещание scheme-agnostic покрытия.

**Доказательства:**

- [error-tracking/references/scrubbing.md:86](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L86)
- [error-tracking/references/scrubbing.md:92](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L92)
- [error-tracking/references/scrubbing.md:119](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md#L119)

**Исправить.** Парсер/редактор URL поддерживает пустой username, encoded credentials, token query/path; отдельные application secret shapes; ограничить обещание покрытия и также проверять attachments/transactions/logs по используемым SDK hooks.

**Приёмка.** Canary matrix fake Redis/AMQP/Postgres URLs, encoded credentials, Telegram path, access-token query, nested events; ни один fake secret не доходит до test transport.

### DV-16 · P2 · Правила восстановления дают противоположные действия для отозванной сессии

**Наблюдение.** error-tracking называет exit non-zero/crash loop видимым решением credential failure; telegram-userbots требует alert и запрещает restart loop для dead session.

**Влияние.** Результат зависит от последнего прочитанного skill; автоматический restart не восстанавливает credential и засоряет сигнал.

**Доказательства:**

- [skills/error-tracking/SKILL.md:223](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/error-tracking/SKILL.md#L223)
- [skills/telegram-userbots/SKILL.md:147](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/SKILL.md#L147)
- [telegram-userbots/references/sessions-and-auth.md:73](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/references/sessions-and-auth.md#L73)

**Исправить.** Единый typed health contract: liveness процесса, readiness способности служить, degraded_auth с остановкой работ + alert, recovery только после новой auth. Exit/restart допустимы для recoverable failure и контролируемой политики supervisor.

**Приёмка.** Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.

## frontend-performance

**Что сохранить.** Хорошее measure→diagnose→fix→remeasure и разграничение visual/UX owners. Требуется переход от score к field cohorts и от blanket bans к причинному профилированию.

### DV-17 · P2 · FCP ошибочно объявлен неизмеримым в поле

**Наблюдение.** Skill говорит, что только три CWV field-measurable, и помещает FCP в lab-only diagnostics. web.dev прямо перечисляет FCP lab и field инструменты.

**Влияние.** Аудит может отбросить полезные RUM данные, приравнять lab score к реальному UX или дать заказчику неверную классификацию.

**Доказательства:**

- [skills/frontend-performance/SKILL.md:31](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L31)
- [skills/frontend-performance/SKILL.md:44](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L44)

**Исправить.** Разделить две независимые оси: CWV/not-CWV и lab/field availability. Обязательные p75, device/cohort, period, sample size; TBT как диагностическая корреляция, не замена доказательства INP.

**Приёмка.** Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.

Первичные источники: [web.dev · 1](https://web.dev/articles/fcp).

### DV-18 · P2 · Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев

**Наблюдение.** Only hero+nav initial; named imports only; allow all loaded CSP origins ради score; footer headings заменять p; modern last-two targets без user support policy. Это предписания, не условные диагностики.

**Влияние.** Риск убрать нужную семантику/поддержку устройств, расширить CSP и увеличить waterfall ради Lighthouse. Конкретные регрессии на сайте не воспроизводились.

**Доказательства:**

- [skills/frontend-performance/SKILL.md:66](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L66)
- [skills/frontend-performance/SKILL.md:72](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L72)
- [skills/frontend-performance/SKILL.md:101](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L101)
- [skills/frontend-performance/SKILL.md:114](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/plugins/sheleg-dev/skills/frontend-performance/SKILL.md#L114)

**Исправить.** Перед изменением проверить performance trace и сценарии, browser support contract, accessibility owner. CSP origins одобрять по функциональной необходимости; semantic headings по структуре; lazy-load по измеренному waterfall.

**Приёмка.** Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.

## telegram-bots

**Что сохранить.** Чёткие API surfaces, successful_payment vs precheckout, secret header, transport/business keys, очереди. Mutant tests полезны, но crash case пока доказывает вход, не результат.

### TG-01 · P1 · Crash fixture зелёный, но после реальной redelivery update теряется

**Наблюдение.** Выполнен штатный Handler: crash_on=1001, затем poll_batch повторно доставленных updates → work=[1002], processed=[1001,1002], offset=1003. Test проверяет лишь наличие UPDATE_A в still_delivered, не вызывает повторный handle.

**Влияние.** Постоянная потеря работы после durable claim, несмотря на PASS 'crash redelivers rather than loses'; ack-before-process дополнительно требует durable queue.

**Доказательства:**

- [skills/telegram-bots/SKILL.md:73](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L73)
- [skills/telegram-bots/SKILL.md:123](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L123)
- [telegram-bots/fixtures/update_delivery.py:94](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L94)
- [telegram-bots/fixtures/update_delivery.py:183](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/fixtures/update_delivery.py#L183)

**Исправить.** Принять update в durable inbox, ack после commit enqueue; state+lease+retry worker. Business grant keyed charge, outbox для send. Проверять не только redelivery, но eventual completed work.

**Приёмка.** Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.

### TG-02 · P2 · Оmitted allowed_updates ошибочно приравнен к пустому списку

**Наблюдение.** Official API: omission retains previous setting; [] resets to all except три типа. Skill утверждает одинаковое поведение. Также update_id sequential утверждён без оговорки про random после недели без updates.

**Влияние.** Миграция сохраняет старый узкий filter, хотя агент ждёт default; код high-water assumption может не обработать первый update после долгого простоя.

**Доказательства:**

- [skills/telegram-bots/SKILL.md:105](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/SKILL.md#L105)
- [telegram-bots/references/updates-and-delivery.md:78](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md#L78)
- [telegram-bots/references/updates-and-delivery.md:19](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-bots/references/updates-and-delivery.md#L19)

**Исправить.** Таблица unset/[]/explicit и getWebhookInfo evidence; хранить desired subscription отдельно. Update id использовать как identity, не глобальную гарантию монотонности навсегда.

**Приёмка.** Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.

Первичные источники: [core.telegram.org · 1](https://core.telegram.org/bots/api#getupdates), [core.telegram.org · 2](https://core.telegram.org/bots/api#update).

## telegram-miniapps

**Что сохранить.** Правильные raw initData, недоверие initDataUnsafe, auth_date, session и различение HMAC/Ed25519. Конкретная canonicalization ошибка критичнее качества структуры.

### TG-03 · P1 · HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle

**Наблюдение.** Telegram HMAC строится из всех received fields кроме hash; в third-party Ed25519 исключаются hash+signature. Рекомендованный самим skill init-data-golang исключает только hash. Наш all-fields signed vector с signature=... получает bad signature; self-test добавляет signature ПОСЛЕ signing, закрепляя ошибку.

**Влияние.** Валидные payloads с signature отвергаются; убедительный ложный тест провоцирует автора приложения отключить проверку при реальном login.

**Доказательства:**

- [skills/telegram-miniapps/SKILL.md:75](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L75)
- [skills/telegram-miniapps/SKILL.md:98](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/SKILL.md#L98)
- [telegram-miniapps/fixtures/verify_initdata.py:34](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L34)
- [telegram-miniapps/fixtures/verify_initdata.py:154](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/fixtures/verify_initdata.py#L154)

**Исправить.** Разделить HMAC и Ed25519 canonicalization, запретить shared false helper; официальные/независимые golden vectors с signature. Включить строгий parse duplicate fields и upper/lower auth_date window.

**Приёмка.** Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).

Первичные источники: [core.telegram.org · 1](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app), [raw.githubusercontent.com · 2](https://raw.githubusercontent.com/Telegram-Mini-Apps/init-data-golang/master/validate.go).

### TG-04 · P2 · Матрица launch surfaces неверно запрещает menu-button query flow

**Наблюдение.** Reference объединяет direct link/menu: neither, no query. Telegram menu button работает как inline button и может answerWebAppQuery. Inline-query app ошибочно приравнен к inline button. DeviceStorage/SecureStorage перечислены 'all 8.0+', хотя требуется проверять capability для каждого метода.

**Влияние.** Генерация лишних backend обходов и неработающих return paths; функции на старых клиентах вызываются по слишком низкому guard.

**Доказательства:**

- [telegram-miniapps/references/app-to-bot.md:12](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md#L12)
- [telegram-miniapps/references/app-to-bot.md:13](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/app-to-bot.md#L13)
- [telegram-miniapps/references/viewport-and-platform.md:46](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-miniapps/references/viewport-and-platform.md#L46)

**Исправить.** Разделить keyboard, inline keyboard, menu, inline mode, direct/main/attachment surfaces; capability/API floor у каждого метода с первичным source.

**Приёмка.** Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.

Первичные источники: [core.telegram.org · 1](https://core.telegram.org/bots/webapps#launching-mini-apps-from-the-menu-button), [core.telegram.org · 2](https://core.telegram.org/bots/webapps#inline-mode-mini-apps).

## telegram-userbots

**Что сохранить.** Обоснованно сначала проверяет Bot API/local-server alternative, session считает credential, описывает revocation и queue. Estate anecdotes нельзя превращать в универсальные гарантии.

Связанный finding **DV-16** описан выше: Правила восстановления дают противоположные действия для отозванной сессии.

### TG-05 · P2 · Лимит одного FloodWait не ограничивает бесконечную retry sequence

**Наблюдение.** call_with_flood while True проверяет только e.seconds > cap. Бесконечный поток коротких FloodWait никогда не остановится, хотя body запрещает unbounded sleeping. Скрипт быстрого старта также не импортирует os/StringSession (SKILL:68).

**Влияние.** Worker может навсегда удержать job; deadline/cancellation/retry budget не заданы. Связь 'длительный wait ⇒ ban' является эвристикой автора, не измеренной гарантией.

**Доказательства:**

- [telegram-userbots/references/rate-and-flood.md:13](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/references/rate-and-flood.md#L13)
- [skills/telegram-userbots/SKILL.md:159](https://github.com/ssheleg/telegram-dev/blob/0263b899e5827c65d366d2bbac73557a56045235/plugins/telegram-dev/skills/telegram-userbots/SKILL.md#L159)

**Исправить.** Добавить wall-clock deadline, cumulative wait и attempt budget, cancellation и checkpoint queue; max wait трактовать как backpressure, длительные waits как policy choice. Runnable login/session example с явными imports.

**Приёмка.** Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.

## Общие данные и eval

### DV-19 · P2 · Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата

**Наблюдение.** RESULTS честно указывает design intent, coordinator scoring и release 0.11.1, тогда как current package 0.11.8. В s03 ожидается server-side credentials, но copyable Flask/FastAPI этому противоречит; runtime tests охватывают Stripe и ads, не auth/crypto.

**Влияние.** Высокий scenario pass создаёт ложный запас доверия, если его воспринимать как quality gate генерируемого кода; wording-quality не ловит credential cookie и nonce bypass.

**Доказательства:**

- [test/evals/RESULTS.md:17](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/RESULTS.md#L17)
- [test/evals/RESULTS.md:37](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/RESULTS.md#L37)
- [test/evals/scenarios.json:43](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/evals/scenarios.json#L43)

**Исправить.** Сохранить routing eval, добавить generated-artifact eval с offline provider stubs, реальной БД, fault injection, hard security invariants; фиксировать exact model, commit, prompt/tool trace, grader version и raw results.

**Приёмка.** Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.

### DV-20 · P2 · Ошибка окружения классифицируется как доказанный пропуск валидатора

**Наблюдение.** npm run test:all: базовые suites PASS; negatives 40 FAIL с cp: No space left on device, но runner печатает 'validator accepted a planted defect', 'guard does not actually fire'.

**Влияние.** Аудит данных врёт о причине отказа и направляет ремонт на валидатор вместо неисполненного setup. Доказано реальным логом, не симуляцией.

**Доказательства:**

- [sheleg-dev/test/negatives.py:338](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L338)
- [sheleg-dev/test/negatives.py:361](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L361)
- [sheleg-dev/test/negatives.py:377](https://github.com/ssheleg/sheleg-dev/blob/42dfb5df929897f5cf39c72c0c69725f6bb664e2/test/negatives.py#L377)

**Исправить.** Явные стадии fixture_setup→mutation_verified→validator_ran→assertion; TEST_ERROR/BROKEN для setup/copy/timeout, GAP только при состоявшемся validator accept. Resource preflight и cleanup finally.

**Приёмка.** Сымитировать ENOSPC/failed cp и timeout: TEST_ERROR, ноль 'guard bypass' findings; корректно созданный mutant accepted → GAP. Повтор полного negative suite после ресурсов.

## Предлагаемая архитектура

Предложение, не уже реализованное состояние:

1. **Router выбирает primary workflow и экспертов.** Google login + offline Drive: google-signin владеет identity/session, google-auth — API grant. Mini App digital goods: miniapps web/auth, bots Stars ledger. Sentry для userbot: error-tracking наблюдаемость, userbots — credential lifecycle. Не требовать единственного победителя на составной задаче.
2. **Пять минимальных shared contracts:** identity/session, money ledger, inbox/outbox, consent, health. У каждого owner, schema_version, inputs, outputs, invariants. Переносимые skills поставляют локальную versioned копию; CI сравнивает hash/version. Безопасность не должна зависеть от установленного соседа.
3. **Body snippets генерируются из tested source.** У golden inputs независимый источник/provenance. Fixture не должен сам придумывать provider protocol. Формулировка «копируй verify» допустима только при успешных provider vectors.
4. **Событие:** verify → durable inbox → ack → leased worker → transaction(business dedup + domain ledger + outbox) → idempotent effect → reconcile. Received/processed/settled/granted/sent — разные состояния, а не один FINAL флаг.
5. **Host capability matrix.** MCP discovery и недоверие outputs; hook — detector известных команд, не capability-security boundary. Настоящий предел задают secret scope, environment, role/sandbox. Отсутствие hook на copy-install отражать явно, текущую авторизацию пользователя не заменять новой ритуальной просьбой.
6. **Evidence:** PASS/FAIL/TEST_ERROR/NOT_RUN; commit/artifact hash, exact model/tool versions, raw trace, grader version. Ни mean score, ни self-mutants не заменяют независимые security invariants.

## Порядок реализации

| Этап | Результат | Приёмка |
|---|---|---|
| 1. Auth templates | DV-07–12, TG-03: server-side sessions, one-time nonce, canonical HMAC | offline HTTP/JWT vectors, no credential in cookies/logs, regression tests падают на старых templates |
| 2. Ledger/inbox/outbox | DV-01–06, TG-01: отдельно transport, settlement, grant, effect | kill на каждой границе; real DB concurrency; сверка денег и entitlement |
| 3. Consent/telemetry | DV-13–16: scoped policy, no-JS gate, scrubber, health | denied/granted/revoked network matrix; canary secrets отсутствуют; нет auth restart loop |
| 4. Factual/capability tables | DV-08,17–18, TG-02,04–05 | current primary sources; bounded retry; browser/launch matrix без регрессий |
| 5. Честный runner и code eval | DV-19–20 | setup errors=TEST_ERROR; каждый P1 закрыт regression; result привязан к release |
| 6. Composition/routing | primary+supporting experts и host fallback | составные сценарии без takeover, измеренный context/tool budget |
| 7. Release и consumer migration | tested artifact и changelog опасных copy patterns | publish равен проверенному commit; аудит consumer repositories отдельной разрешённой задачей |

«100%» здесь означает выполнение всех согласованных acceptance для конкретной версии и поддерживаемой матрицы, отсутствие открытых P1, явные NOT_RUN с owner/reason. Это не обещание отсутствия неизвестных ошибок или вечной актуальности API.

Composition scenarios: Stripe async paid без return→retry→reconcile; crypto paid→refund; login+offline Drive+Sentry; Stars renewal+duplicate; Mini App keyboard/menu/direct/inline; userbot revoke+FloodWait+restart; deny→grant→revoke с no-JS и server CAPI; плохой Lighthouse при хороших field cohorts; explanation-only; one-shot Telegram alert; missing plugin/MCP; Codex copy-install.

Фактически использовано: make-skill skill-auditor + retrofit — rubric; shell/Python/Node — чтение, штатные suites и offline counterexamples; web — первичные fact checks. Изменений skill sources не делалось.
