## Последовательный план: от текущего состояния до проверенного выпуска

Аудит, воспроизведения и модель архитектуры выполнены. Исправления исходников, миграция контрактов и releases **не выполнялись**. Ни один FIX ниже не объявлен закрытым. Нумерация — последовательность зависимостей; отдельные задачи одной фазы можно выполнять независимо после её входных условий. Граф содержит 90 задач исправления и 9 контрольных вех; циклов и потерянных finding нет.

У каждого FIX критерий приёмки конкретнее общего gate фазы. Исполнитель должен сначала закрепить наблюдение тестом или проверяемым источником, затем исправить канонический рецепт, обновить распространяемые копии и сохранить receipt. PR/CI не обязаны проходить новую общую архитектуру до исправления опасных примеров в M1. Даты и трудозатраты не назначены: состав команды и доступ к реальным host evals пока не заданы.

До закрытия SY-01…SY-05 изменения одного shared resource выполняются одним писателем последовательно; текущая lease не считается доказательством взаимного исключения. Задачи в разных независимых пакетах могут идти параллельно. Эталон проверки хранится отдельно от исправляемого алгоритма: исправить implementation и oracle одинаковым способом недостаточно. Это снимает зависимость ремонта от гарантий самого повреждённого механизма.

| Веха | Предшественник | Задач | Ответственный пакет | Результат |
|---|---|---:|---|---|
| M0 — Зафиксировать базу и границы программы | — | 0 | sshlg-skills | Версии, digests, реестр 90 замечаний, fixtures, список поддерживаемых host/version и определение production evidence. |
| M1 — Исправить примеры с риском потери денег, доступа и блокировок | M0 | 24 | sheleg-dev · telegram-dev · agent-sync · agent-stack | Независимые crash/concurrency/replay fixtures; исправленные алгоритмы и все их копии. Патчи допускаются отдельно от новой общей архитектуры. |
| M2 — Сделать проверку честной и факты типизированными | M1 | 18 | super-ux · task-pipeline · make-skill · agent-stack | Result schema PASS/FAIL/NOT_RUN/TEST_ERROR/N/A; claim/fact provenance; независимые oracle вместо самопроверяющихся примеров. |
| M3 — Заменить принуждение по словам на маршрут по намерению и эффектам | M2 | 12 | sshlg-skills · task-pipeline · make-skill | Раздельные intent/subject/facets/effects; route receipt; scoped waivers; capability adapter; minimal/standard/high-assurance profiles. |
| M4 — Устранить предметные противоречия и устаревшие правила | M3 | 25 | Все предметные пакеты | Исправленные правила дизайна/SEO/UX/телеметрии/OAuth/Telegram; source register с датой и областью применимости; единый источник дублируемых рецептов. |
| M5 — Мигрировать 28 скиллов на совместимые контракты и host adapters | M4 | 8 | sshlg-skills · make-skill · владельцы 28 скиллов | 28 sidecars skill.contract.json; project policy; capability receipts; clean-install матрица заявленных сред; адаптеры токенов и sibling dependencies. |
| M6 — Проверить настоящее применение и пользу семейства | M5 | 3 | Общий eval harness + владельцы доменов | Actual-load end-to-end matrix: baseline, named skill, auto-route, full composition; с инструментами и без optional tools; repeated seeds и независимые grading criteria. |
| M7 — Выпустить и проверить ограниченное развёртывание | M6 | 0 | Member CI + umbrella release | Release candidates с pinned digests, опубликованные member versions, затем umbrella; smoke на чистых профилях, release receipts и проверяемый rollback. |
| M8 — Закрыть программу и закрепить обслуживание | M7 | 0 | Владелец семейства | Матрица 28/28 contracts, 90/90 dispositions, закрытые P1, остаточные ограничения, регламент обновления внешних норм, эталонный eval set. |



### M0. Зафиксировать базу и границы программы

**Вход:** зафиксированный аудит. **Выход:** Версии, digests, реестр 90 замечаний, fixtures, список поддерживаемых host/version и определение production evidence.

**Контроль завершения:** Артефакты этого аудита приняты как исходная точка; каждое замечание имеет owner, статус и приёмку. Решение команды о поддерживаемых средах записано.

**Управление регрессией:** Исходники ещё не меняются; сохранять исходные версии и тестовые receipts.



### M1. Исправить примеры с риском потери денег, доступа и блокировок

**Вход:** M0. **Выход:** Независимые crash/concurrency/replay fixtures; исправленные алгоритмы и все их копии. Патчи допускаются отдельно от новой общей архитектуры.

**Контроль завершения:** Ни один критический counterexample не воспроизводится; старый алгоритм обязан провалить новый тест. Реальные секреты/платежи для проверки не нужны.

**Управление регрессией:** Малые независимые releases; при регрессии отключать опасный рецепт и откатывать пакет, не маскировать повторный FAIL.



- **FIX-DV-01 · P1 · sheleg-dev** — [Claim фиксирует получение, но ошибочно считается завершением работы](report.md#dv-01). Разделить received/processing/completed; claim с lease и восстановлением; entitlement + business dedup + outbox в одной транзакции; consumer эффектов с собственной идемпотентностью. **Приёмка:** Убивать worker после claim, перед commit и после commit до effect; после рестарта ровно один grant, eventual delivery эффекта, completed только после durable перехода.



- **FIX-DV-02 · P1 · sheleg-dev** — [Пример renewal противоречит тесту переупорядоченных периодов и не сериализует grant](report.md#dv-02). Уникальная запись grant по subscription/item/invoice/period и атомарная выдача; отдельно monotonic mirror состояния. Определить isolation и retry serialization failures. **Приёмка:** Реальная БД: webhook + reconciliation одновременно для одного invoice; затем February→January. Два разных оплаченных периода начислены, один период не дублируется, mirror остаётся February.



- **FIX-DV-03 · P1 · sheleg-dev** — [Компенсация количества не компенсирует уже снятые деньги](report.md#dv-03). Durable operation intent с idempotency key; предпочесть восстановить БД из подтверждённого Stripe состояния. Если бизнес выбрал rollback, отдельно оформить подтверждённую финансовую компенсацию и её статус. **Приёмка:** Симуляция successful charge + DB failure: деньги, entitlement, invoice и operation ledger сходятся после recovery; повтор API не создаёт второй invoice.



- **FIX-DV-04 · P1 · sheleg-dev** — [Refund CAS проигрыш молча теряет больший cumulative refund](report.md#dv-04). Под row lock/serializable transaction вычислять max(total_seen), delta и обновлять ledger вместе; CAS loser перечитывает и повторяет. Денежные значения хранить в minor units, а не /100 float. **Приёмка:** Concurrent cumulative 4000/9000 в обоих порядках, crash после marker, retry старого события: total=9000 и суммарное clawback=9000 ровно один раз.



- **FIX-DV-05 · P1 · sheleg-dev** — [Основной idempotency snippet кредитует не только PAID и блокирует жизненный цикл после PAID](report.md#dv-05). Один исполняемый эталон; разделить payment status, immutable settlement grant и refund ledger. Only confirmed settlement credit; атомарный business dedup; refunds и holds не отбрасывать как duplicate. **Приёмка:** pending→confirming→paid→refund_process→refund_paid; repeated pending; paid concurrent; crash до/после commit. Ноль grant до paid, один после, refund отражён.



- **FIX-DV-07 · P1 · sheleg-dev** — [OAuth examples отправляют серверный client_secret и refresh_token в клиентскую cookie](report.md#dv-07). В cookie только случайный opaque session id; Google credentials хранить server-side encrypted store, доступ по session+principal. Удалить token logging; production secret без dev fallback; HTTPS guard. **Приёмка:** Локальный HTTP client выполняет stubbed OAuth callback, декодирует Set-Cookie: ни client_secret, ни access/refresh token отсутствуют; stdout/stderr также чисты.



- **FIX-DV-09 · P1 · sheleg-dev** — [Express OAuth использует общий mutable client и неполную проверку state](report.md#dv-09). Client на запрос/пользователя, credentials не мутировать глобально; required cryptorandom state привязать к server session, TTL, atomic consume; validation до token exchange. **Приёмка:** Интерливинг A/B с задержкой между setCredentials и transport использует разные Authorization; missing/expired/reused state не вызывает token endpoint.



- **FIX-DV-10 · P1 · sheleg-dev** — [Nonce равен присланному клиентом значению, а не ожидаемому сервером](report.md#dv-10). Server-issued nonce связан с pre-auth HttpOnly session, TTL и one-time consume; обязательное точное совпадение token nonce с server expectation, а не body nonce. **Приёмка:** Один подписанный тестовый JWT: первый вход проходит, replay из новой сессии и replay после consume отклоняются; missing nonce отклонён. Оба skills используют один контракт.



- **FIX-DV-11 · P1 · sheleg-dev** — [Auto-link по email игнорирует случаи, где Google не подтверждает текущее владение адресом](report.md#dv-11). По умолчанию linking после fresh re-auth текущего локального аккаунта; если auto-link нужен, явно учитывать Google authoritative conditions и независимый challenge для прочих адресов. Unverified pre-registration направлять в безопасное recovery, не только в чужой password. **Приёмка:** JWT: Gmail; verified Workspace+hd; third-party email без hd; существующий verified/unverified password account. Последний не auto-links только из-за email_verified.



- **FIX-DV-12 · P1 · sheleg-dev** — [Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract](report.md#dv-12). Раздельные явно типизированные form/JSON paths; form требует оба g_csrf_token, JSON требует trusted same-origin или точный Origin fallback; отсутствие обоих fail closed. **Приёмка:** TestClient матрица form/json × valid/missing/mismatched csrf × same-origin/cross-site/none/missing metadata × allowed/disallowed/missing Origin, до verification external calls.



- **FIX-DV-14 · P1 · sheleg-dev** — [Безусловный noscript pixel противоречит consent-gated архитектуре](report.md#dv-14). Генерировать snippets из исполняемых templates; noscript разрешать только по ранее сохранённому server-verifiable consent либо убрать. Исправить G/AW конфигурацию синхронно с prose. **Приёмка:** Browser JS disabled + no consent: zero Meta requests; granted server cookie: допустимый один request; static template check запрещает неверный флаг на G-tag.



- **FIX-DV-15 · P1 · sheleg-dev** — [Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs](report.md#dv-15). Парсер/редактор URL поддерживает пустой username, encoded credentials, token query/path; отдельные application secret shapes; ограничить обещание покрытия и также проверять attachments/transactions/logs по используемым SDK hooks. **Приёмка:** Canary matrix fake Redis/AMQP/Postgres URLs, encoded credentials, Telegram path, access-token query, nested events; ни один fake secret не доходит до test transport.



- **FIX-TG-01 · P1 · telegram-dev** — [Crash fixture зелёный, но после реальной redelivery update теряется](report.md#tg-01). Принять update в durable inbox, ack после commit enqueue; state+lease+retry worker. Business grant keyed charge, outbox для send. Проверять не только redelivery, но eventual completed work. **Приёмка:** Существующий crash fixture дополнить полным restart+replay и assert work includes 1001 exactly once; kill после inbox/claim/work/send; receipt и effect различены.



- **FIX-TG-03 · P1 · telegram-dev** — [HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle](report.md#tg-03). Разделить HMAC и Ed25519 canonicalization, запретить shared false helper; официальные/независимые golden vectors с signature. Включить строгий parse duplicate fields и upper/lower auth_date window. **Приёмка:** Golden real-format initData с hash+signature проходит HMAC; изменение signature не проходит HMAC; Ed25519 исключает оба поля. Differential tests против поддерживаемого независимого verifier; future+24h отказ (сейчас ACCEPTED).



- **FIX-AS-01 · P1 · agent-stack** — [Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ](report.md#as-01). Назвать saga/outbox; хранить operation_id и состояния pending/applied/unknown/compensated. При ambiguous timeout сначала сверять статус по идемпотентному ключу; компенсировать только подтверждённый отказ и только собственную проводку. Ввести сериализацию или CAS на весь tenant transfer state, а не обещать её транзакционным lock до HTTP. **Приёмка:** Fault injection после DB commit, после применения upstream до ответа, во время двух topups и между retry: ledger conservation, не более одного внешнего эффекта на operation_id, unknown остаётся pending до reconciliation.



- **FIX-AS-02 · P1 · agent-stack** — [Нулевой baseline путается с отсутствующим: первый реальный расход теряется](report.md#as-02). Хранить baseline_initialized, observed_at и provider_key_generation отдельно от суммы; ноль — валидное значение. На уменьшение без смены поколения переводить reconciliation в anomaly, не объяснять причину догадкой. **Приёмка:** Последовательности uninitialized→5, initialized(0)→5, 5→8, 8→2 при том же ключе, смена поколения: для каждой заранее заданная запись ledger и состояние, первый расход нового ключа учтён.



- **FIX-AS-03 · P1 · agent-stack** — [Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию](report.md#as-03). Similarity использовать только для поиска кандидатов. Записи хранить с entity/attribute/scope/provenance/validity; contradiction gate до merge. Подтверждение отделить от повторного извлечения, не повышать доверие за self-generated повтор; temporal supersession и reversible history. Verified не освобождает volatile fact от freshness. **Приёмка:** Мультиязычный корпус negation, смены чисел/единиц, исключений, разных субъектов и устаревших verified facts: никаких silent merge противоположностей; correction выигрывает только в своём scope, старый факт остаётся в истории.



- **FIX-AS-04 · P1 · agent-stack** — [Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload](report.md#as-04). Типизировать ребро: data/control/authorization/resource. Для любого ребра требовать rationale и доказательство, но удалять только если нет ни причинного, ни ресурсного, ни разрешительного ограничения. Side-effect footprint и read/write sets проверять перед fan-out. **Приёмка:** Graph negative tests сохраняют backup→migration, approval→charge, lease→edit и сериализацию двух writes; независимые read-only reviews действительно запускаются параллельно.



- **FIX-AS-11 · P1 · agent-stack** — [confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности](report.md#as-11). Для user approval нужен проверяемый grant от trusted control plane, bound to principal/action/arguments/expiry, либо уже существующее разрешение. Булевое поле назвать syntax guard. Trifecta описывать как достаточную конфигурацию конкретного exfiltration риска, не полную модель безопасности. **Приёмка:** Agent-authored confirm:true без grant отвергается; повтор с изменёнными arguments также; заранее авторизованное действие проходит. Сценарий untrusted content→destructive write входит в threat tests независимо от private-data доступа.



- **FIX-SY-01 · P1 · agent-sync** — [Выданные IDs меняются задним числом; два reserve возвращают один номер](report.md#sy-01). Выделение ID перенести в linearizable allocator: CAS/transaction или git ref с compare-and-swap; присвоенный value и reservation_id писать неизменно. Для offline — уникальные составные IDs/ULID с явным последующим mapping. Client clock пригоден для display, не арбитража. **Приёмка:** Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.



- **FIX-SY-02 · P1 · agent-sync** — [Общий last-renew позволяет активности одного агента подавлять продление чужих leases](report.md#sy-02). Throttle хранить по run/key, причём время последнего успешного renewal конкретного lease не заменять временем unrelated acquire. Для heartbeat проверять все leases именно своего run независимо от остальных. **Приёмка:** С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.



- **FIX-SY-03 · P1 · agent-sync** — [Local renew перезаписывает уже завершённый steal](report.md#sy-03). Один OS-backed critical section для acquire/renew/release/steal, revision/fencing token и проверка поколения. Просроченный владелец не продлевает lease без нового acquire. Не использовать unconditional replace для изменения ownership-sensitive state. **Приёмка:** Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.



- **FIX-SY-04 · P1 · agent-sync** — [Task lease не защищает общий файл от владельца другой task lease](report.md#sy-04). Разделить task ownership и resource mutation lock. Для shared registries — краткий file/register transaction lock либо append-only event log с CAS; canonical paths и common repo identity. Изолированные worktrees плюс merge policy — другой честно объявленный режим. **Приёмка:** Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.



- **FIX-SY-05 · P1 · agent-sync** — [Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают](report.md#sy-05). Создание и чтение ownership state сериализовать тем же OS lock либо публиковать уже заполненный объект атомарным no-replace primitive; partial/corrupt lock не считать немедленно stealable. Crash cleanup отличать от активного незавершённого create по арбитражу, не эвристике пустого JSON. **Приёмка:** Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.



### M2. Сделать проверку честной и факты типизированными

**Вход:** M1. **Выход:** Result schema PASS/FAIL/NOT_RUN/TEST_ERROR/N/A; claim/fact provenance; независимые oracle вместо самопроверяющихся примеров.

**Контроль завершения:** Неверные единицы и субъекты не проходят; exit!=0 не становится PASS; отсутствие браузера/данных не становится подтверждением; согласование не меняет происхождение факта.

**Управление регрессией:** Первый запуск новых семантических проверок в report mode; включение gate после разбора ложных срабатываний.



- **FIX-MS-01 · P1 · make-skill** — [Приближение chars/3.9 выдаёт PASS токенового лимита](report.md#ms-01). Подключить реальный именованный tokenizer; без него budget status=UNMEASURED, estimate отдельным полем. House thresholds отделить от требований формата и host policy. **Приёмка:** Unicode, английский, код, смешанный RU/EN; сравнение с независимым tokenizer; отсутствие библиотеки не возвращает PASS измерения.



- **FIX-MS-02 · P1 · make-skill** — [Самодельный YAML parser теряет типы metadata](report.md#ms-02). Разделить полноценный YAML validation и быстрый stdlib precheck. Либо bundle безопасный parser, либо явно ограничить supported subset и не пропускать неподдержанные формы как корректные. **Приёмка:** Двусторонние fixtures: quoted/unquoted numeric, boolean, null, YAML escapes, multiline scalars, duplicate keys; одинаковые вердикты с upstream validator.



- **FIX-PA-01 · P1 · task-pipeline** — [Документированное решение автоматически оправдывает дефект](report.md#pa-01). Decision status и technical validity — разные оси. Accepted trade-off может быть отмечен принятой ценой; документированное нарушение остаётся finding с decision_id, причиной пересмотра и контрдоказательством. **Приёмка:** Фикстура ADR разрешает логирование refresh token: аудитор всё равно обнаруживает раскрытие, связывает с ADR; сознательная поддержка только одного браузера при подходящем контракте — accepted limitation.



- **FIX-PA-02 · P1 · task-pipeline** — [Отсутствие production измерения запрещает считать доказанный механизм дефектом](report.md#pa-02). Отдельно mechanism status, exploit/reproduction, exposure, observed incidence и impact uncertainty. Доказанный defect может иметь incidence unknown. UNKNOWN не равно 0; отсутствие телеметрии не понижает техническую истинность. **Приёмка:** Race reproduced/production unknown остаётся finding; нулевая выборка не превращается в нулевой риск; JSON хранит scope и время наблюдения.



- **FIX-PA-03 · P2 · task-pipeline** — [Опциональная HTML-страница обязательна в критерии выхода](report.md#pa-03). Указать read-only относительно target source/data, разрешённый output dir; условный DoD по requested deliverables. Добавить mode stdout/json/html и не требовать браузер для json-only. **Приёмка:** Без --report HTML не создаётся и run complete допустим; --report требует существующий HTML, безопасные ссылки и inspect/render status.



- **FIX-UX-01 · P1 · super-ux** — [B030 не доказывает происхождение утверждения](report.md#ux-01). Ввести claim-id → fact-id, субъект, единицу, популяцию, дату и разрешённые преобразования. Линтер проверяет ссылку/единицу/точность, семантический аудит проверяет утверждение. До этого сузить обещание B030 до проверки известного числового токена и явно показывать unverified claims. Не исключать год без контекста. **Приёмка:** Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.



- **FIX-UX-02 · P1 · super-ux** — [B051 объявляет спамом текст без единого повторения](report.md#ux-02). Сделать repetition advisory с минимальным count и длиной, учитывать зарегистрированные термины и язык, группировать по реально отрендеренной странице. Удалить универсальное обещание влияния на цитирование. Google описывает unnatural repetition/manipulative intent, а не порог 1%: https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing . **Приёмка:** 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.



- **FIX-UX-03 · P1 · super-ux** — [Humanization «никогда не блокирует» расходится с исполняемым B060](report.md#ux-03). Единый контракт: humanization review всегда advisory, word markers не устанавливают authorship/naturalness grade. Учитывать цитаты/код/термины, разделить редакционный off и явно выбранные brand bans. Удалить severity переход из количества маркеров. **Приёмка:** Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.



- **FIX-UX-05 · P1 · super-ux** — [Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт](report.md#ux-05). Ошибка/timeout/tool refusal = отдельный outcome; изолированный fixture, фиксированный scope tools, запись run manifest/stdout/artifacts. Проверять число surfaces и изменения текста/semantic invariants; не только наличие строки. Отдельно тестировать order sweeps и no-op уже хорошего текста. **Приёмка:** Обе mock-подмены из probes должны FAIL; невалидный exit никогда PASS; успешный artifact с двумя поверхностями и двумя корректными строками проходит; репозиторий до/после одинаков.



- **FIX-UX-08 · P2 · super-ux** — [Approval оператора может стереть происхождение предположения](report.md#ux-08). Развести evidence_kind (brief/owner-belief/interview/telemetry/code-inference), decision_status и validation_status. Approval меняет decision, но не provenance. Для эмоций и Frequency×Severity×Solvability хранить источник, шкалу и unknown вместо обязательного выдуманного балла. **Приёмка:** Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.



- **FIX-UX-12 · P1 · super-ux** — [Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата](report.md#ux-12). Разделить static conformance, executable verification и production observation. Для runtime зависимых критериев PASS только с тестом/браузером/проверенным runtime receipt, иначе BLOCKED/unverified. Сохранить хорошее разделение delivery vs Product outcome. **Приёмка:** Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.



- **FIX-DV-20 · P2 · sheleg-dev** — [Ошибка окружения классифицируется как доказанный пропуск валидатора](report.md#dv-20). Явные стадии fixture_setup→mutation_verified→validator_ran→assertion; TEST_ERROR/BROKEN для setup/copy/timeout, GAP только при состоявшемся validator accept. Resource preflight и cleanup finally. **Приёмка:** Сымитировать ENOSPC/failed cp и timeout: TEST_ERROR, ноль 'guard bypass' findings; корректно созданный mutant accepted → GAP. Повтор полного negative suite после ресурсов.



- **FIX-AS-06 · P1 · agent-stack** — [Первый релиз фактически остаётся без исполняемого eval-корпуса](report.md#as-06). Разрешить curated/synthetic/manual seed corpus до релиза, маркировать источник каждого input; дополнять production regressions. Release gate обязан иметь executed trials, а observable-only — состояние specification-ready, не release-ready. **Приёмка:** Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.



- **FIX-AS-07 · P1 · agent-stack** — [Запрет проверки порядка пропускает подтверждение после действия](report.md#as-07). Запрещать только избыточный exact global sequence. Разрешить temporal assertions и partial order: authorization precedes effect, read fresh precedes write, transaction completes before publish. **Приёмка:** Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.



- **FIX-AS-08 · P2 · agent-stack** — [Статистические правила выдают предположения за универсальные границы](report.md#as-08). Для proportion использовать Wilson/exact и явно описать iid/cluster assumptions; pass@k/pass^k считать по task-level trials. Для clustered/paired результатов применять соответствующий bootstrap/McNemar; unpaired сравнение допускается с его SE. Вместо never/worst case дать условные утверждения. **Приёмка:** Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.



- **FIX-AS-09 · P1 · agent-stack** — [OpenTelemetry: закрытый enum и неверное сложение вложенных token counters](report.md#as-09). Переписать enum как extensible well-known set; token totals и disjoint billing buckets разделить. Для цены вычитать cached portions из total и применять provider-specific rates; не суммировать modalities/reasoning с totals повторно. Прикрепить commit SHA/schema revision и actual observation date. **Приёмка:** Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.



- **FIX-AS-10 · P2 · agent-stack** — [Повтор проверки старого ответа назван проверкой изменения решения модели](report.md#as-10). Три разных операции: regrade old output, execute candidate against frozen fixture, deterministic workflow replay. Хранить candidate version/output и оценку отдельно от старого trace; стоимость model call и stochasticity отражать. **Приёмка:** Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.



- **FIX-AS-14 · P2 · agent-stack** — [Отсутствие evals ошибочно делает весь аудит unfalsifiable](report.md#as-14). Разделить source-level invariant proof, deterministic reproduction и behavioral estimate. No evals — finding о неизвестной надежности, приоритет определяется конкретным вредом; prompt-first оставить диагностической эвристикой с исключениями. **Приёмка:** Synthetic repo без evals, но с demonstrable double charge: аудит сохраняет оба findings, прямой вред не скрывается общим no evals. Неработающий unit invariant не лечится изменением промпта.



### M3. Заменить принуждение по словам на маршрут по намерению и эффектам

**Вход:** M2. **Выход:** Раздельные intent/subject/facets/effects; route receipt; scoped waivers; capability adapter; minimal/standard/high-assurance profiles.

**Контроль завершения:** RU/EN смешанные запросы, цитаты и отказы выбирают ожидаемый scope. Audit не меняет source; согласованная работа не спрашивает повторного разрешения; отсутствие optional tool не создаёт тупик.

**Управление регрессией:** Shadow comparison старого и нового маршрута, затем переключение по host/project. Никакой скрытой автозаписи в shadow mode.



- **FIX-RT-01 · P1 · sshlg-skills** — [Лексический роутер теряет намерение и смешивает аудит с изменением](report.md#rt-01). Классифицировать по отдельным полям intent, subject, effects и facets; regex оставить источником кандидатов. Audit → make-skill/project-audit без исполнения delivery. Отрицания и поясняющая часть не должны выключать самостоятельную часть запроса на действие. **Приёмка:** Набор RU/EN: audit-only, объясни+исправь, обычная работа subagent, опечатки и склонения; проверки ожидаемого набора маршрутов и запрещённых побочных действий.



- **FIX-RT-02 · P1 · sshlg-skills** — [Отказ от одного маршрута выключает всю эскалацию; цитата тоже считается отказом](report.md#rt-02). Хранить waivers по route_id, scope и источнику: явный акт пользователя, не цитата/пример/ответ инструмента. Общесессионный отказ от всех подсказок оставить отдельным осознанным флагом. Изменение нынешней общей политики записать как решение, а не скрытую починку. **Приёмка:** Отказ от design сохраняет billing и UX; обсуждение фразы отказа не меняет state; явно выбранный session waiver переживает следующий ход и может быть отозван.



- **FIX-RT-03 · P2 · sshlg-skills** — [Toolkit объявляет доступность машины по инвентарю только Claude Code](report.md#rt-03). Host adapters: discovered / enabled / exposed / callable отдельно, namespace+provenance+content digest вместо голого id. В отчёте показывать host и недоступные capability; сохранить просмотр других хостов как inventory. **Приёмка:** Синтетические host homes: broken symlink, одноимённый чужой скилл, plugin только в Claude и skill только в Codex; roster active host содержит только реально разрешимые записи.



- **FIX-RT-04 · P2 · sshlg-skills** — [Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута](report.md#rt-04). Использовать receipt выбранного маршрута с task_id, skill_digest и допустимыми эффектами. Проверять нужный маршрут, а не существование чужого run.md. Не превращать это в новое подтверждение каждого обратимого действия. **Приёмка:** Read-only audit с receipt не запрашивает pipeline; старый run не разрешает новую несвязанную публикацию; все bypass/degraded поверхности явно перечислены.



- **FIX-MS-03 · P1 · make-skill** — [Аудит по описанию автоматически превращается в исправление и release](report.md#ms-03). Явные режимы audit / retrofit / release. По «audit» только доказательства и план. Переход к записи/публикации определяется намерением и ранее данной авторизацией, а не выбранным скиллом. **Приёмка:** Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.



- **FIX-TP-01 · P1 · task-pipeline** — [Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе](report.md#tp-01). Intake должен строить brief из запроса и источников, спрашивать только недостающие необратимые/продуктовые решения. Сохранять выбранную пользователем модель; менять уровень по измерению задач, а не универсальному постулату. **Приёмка:** Полный brief → 0 лишних вопросов, задача с реальным неоднозначным контрактом → один содержательный вопрос; отдельно измерить quality/time/tokens с baseline.



- **FIX-TP-02 · P1 · task-pipeline** — [Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»](report.md#tp-02). Гейт проверяет обязательные артефакты/поведение и их качество. Preferred provider из семейства, альтернативный provider с тем же контрактом или inline fallback допустимы. При отсутствии инструмента писать, какая именно проверка не сделана. **Приёмка:** Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.



- **FIX-TP-03 · P2 · task-pipeline** — [Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами](report.md#tp-03). Разделить kernel (effect scope, evidence, dependencies, resume) и default profile (0–10). Сначала компилировать выбранный profile, затем исполнять только его gates. Доктрины называются capability, а не фиксированным номером стадии. **Приёмка:** Трёхстадийный custom profile валиден и не получает дополнительные stage0/7/10; обязательные kernel invariants всё равно проверяются.



- **FIX-TP-04 · P1 · task-pipeline** — [Неиспользованное правило автоматически считается ненужным](report.md#tp-04). Классы rules: permanent safety/contract, situational, temporary. TTL только временным; cold означает review-needed, не автоматическое отключение. У situational хранить exposure opportunities, не только число запусков. **Приёмка:** Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.



- **FIX-UB-01 · P2 · sshlg-skills** — [Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса](report.md#ub-01). Переименовать в raw_catalog_cl100k; отдельно measured_prompt_cost из runtime trace, host version и реально exposed listing. Missing runtime sample → unknown; не оценивать качество по размеру каталога. **Приёмка:** Сравнить generated listing и фактически переданный prompt на выбранном host; статический подсчёт и runtime measurement никогда не используют одинаковое поле/подпись.



- **FIX-UX-11 · P1 · super-ux** — [Figma fallback и provisional flow не доходят до разрешённого build state](report.md#ux-11). Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях. **Приёмка:** Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.



- **FIX-UX-13 · P2 · super-ux** — [Общий precondition требует scenarios даже независимому copy/benchmark scope](report.md#ux-13). Предусловия вычислять после scope: scenario → base, copy → brand, benchmark → observed URLs+receipts. Схема evidence допускает URL+timestamp+capture для внешних данных; file:line только для code claims. **Приёмка:** Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.



### M4. Устранить предметные противоречия и устаревшие правила

**Вход:** M3. **Выход:** Исправленные правила дизайна/SEO/UX/телеметрии/OAuth/Telegram; source register с датой и областью применимости; единый источник дублируемых рецептов.

**Контроль завершения:** Каждое finding из этой фазы закрыто конкретной приёмкой. Универсальные запреты заменены условиями, где источник подтверждает только условное правило.

**Управление регрессией:** Сохранять rationale и предыдущий рецепт; спорная эвристика становится advisory, а не новым обязательным gate.



- **FIX-SE-01 · P1 · seo-aeo-audit** — [Рекомендации Discover превращены в обязательный gate](report.md#se-01). Три отдельные проверки: eligibility, large preview permission (с альтернативой AMP), image selection recommendation. SDK reverse engineering оставить FIELD, без бинарного вывода о допуске. **Приёмка:** Страница без og tags не получает confirmed ineligible; рекомендация изображения сохраняется; every confirmed rule ведёт к точному поддерживающему первоисточнику.



- **FIX-SE-02 · P1 · seo-aeo-audit** — [Любая manual action объявлена обнулением всех улучшений сайта](report.md#se-02). Записывать action type, affected URL patterns, surface, severity и scope. Приоритет устранения нарушения сохранять, блокировать зависимые действия только в затронутой области. **Приёмка:** Partial action /spam/* не блокирует доказанный auth/availability fix на /checkout; sitewide action отражается иначе, чем partial.



- **FIX-SE-03 · P2 · seo-aeo-audit** — [Cross-track проверка объявляет совместимые наблюдения противоречием](report.md#se-03). Сравнивать claim key=(subject,predicate,scope,time,instrument). Противоречие возникает только для несовместимых значений одного predicate; независимые аспекты сохранять. **Приёмка:** Thin+extractable проходит без конфликта; same URL different predicates/tier допустимы; same canonical at same snapshot with different values запускает разбор.



- **FIX-SE-04 · P2 · seo-aeo-audit** — [Тип источника автоматически подменяет силу конкретного утверждения](report.md#se-04). Разнести source quality, directness, population scope, causal support и uncertainty. Политика rollout определяется риском действия и доказательством эффекта; не blanket рангом поставщика. **Приёмка:** Неизвестная vendor estimate не становится STUDY; direct HTTP observation может быть confirmed без GSC; rollout policy едина между таблицей и SKILL.



- **FIX-UX-04 · P2 · super-ux** — [У одного скилла два несовместимых правила владения strings.md](report.md#ux-04). Разделить ownership по файлам: brand-voice владеет voice/terms/facts/channels/locale policy, copywriting пишет strings.md (proposed) и продуктовый текст. Общая схема явно разрешает эти mutations и claim при координации. **Приёмка:** Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.



- **FIX-UX-09 · P2 · super-ux** — [Воронки конкурентов из proxy превращаются в «proven base»](report.md#ux-09). Все market signals маркировать как observed exposure; вывод о механизме как hypothesis с альтернативными объяснениями. Частоты считать скриптом по corpus с denominator/дубликатами; adoption через локальный эксперимент, не «proven» из частоты. **Приёмка:** Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.



- **FIX-UX-10 · P1 · super-ux** — [Loading из существующей задержки превращён в инсценировку вычисления](report.md#ux-10). Loading только при реальной асинхронной работе; показывать фактическую операцию и не задерживать готовый результат. Если narrative pause нужен продукту, назвать его честно без claims персонального анализа и измерить затраты/понимание. **Приёмка:** Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.



- **FIX-DS-02 · P2 · sheleg-design** — [Опрос о значении craft превращён в нормативный порядок разработки](report.md#ds-02). Оставить опрос как контекст с точным смыслом и ссылкой; порядок gates вывести из dependency graph: задача/состояния/доступность/система/polish. Обязательный порядок обозначить как авторское решение, не вывод исследования. Источник: https://www.figma.com/blog/state-of-the-designer-2026/ . **Приёмка:** Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.



- **FIX-DS-03 · P2 · sheleg-design** — [Производительность CSS/API описана абсолютами вместо проверяемых условий](report.md#ds-03). Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide . **Приёмка:** Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.



- **FIX-DS-04 · P2 · sheleg-design** — [Duration table допускает 500ms, общий UI gate запрещает >300ms](report.md#ds-04). Единая таблица по purpose+frequency+platform с explicit exceptions и canonical duration IDs. Разделить interactive feedback, spatial modal transition и marketing entrance, убрать пересечение трактовок. **Приёмка:** 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.



- **FIX-DS-05 · P2 · sheleg-design** — [No-JS критерий применяется ко всем поверхностям, включая внутренние UI](report.md#ds-05). Applicability predicates на каждую проверку: public-web-crawlable → no-JS content, web-internal → loading/error/accessibility, native → platform semantics. В отчёте NOT_APPLICABLE с причиной, а не PASS без запуска. **Приёмка:** Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.



- **FIX-UX-14 · P2 · super-ux** — [BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](report.md#ux-14). Развести local sandbox, staging и production. Локальный webhook forwarding или официальный emulator допустим для wiring/tests; публичный HTTPS endpoint обязателен для production delivery. Provider capability определяет dependency, а не универсальная UX практика. **Приёмка:** Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.



- **FIX-UX-15 · P1 · super-ux** — [BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](report.md#ux-15). Ввести processing-purpose→legal-basis→notice→rights/retention record. Consent gate только когда выбранная basis и применимые нормы требуют именно согласия; не смешивать маркетинговое tracking consent, contractual processing и informational notice. Удалить универсальное обоснование consent через Art.13. **Приёмка:** Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.



- **FIX-DV-06 · P2 · sheleg-dev** — [Универсальный amount waterfall смешивает единицы и взаимоисключающие правила буфера](report.md#dv-06). Ввести Money(currency, minor/decimal), Asset(network, amount), Entitlement(units), FX quote с источником/временем. Выбор refund excess/credit excess/buffer fee оформлять явной политикой проекта. **Приёмка:** Табличные кейсы topup/plan/overpay/underpay/fee/FX; типовая проверка запрещает USD??tokens; reconciliation доказывает gross=net+fees±FX и user entitlement по выбранной политике.



- **FIX-DV-08 · P1 · sheleg-dev** — [ADC precedence написан в обратном порядке](report.md#dv-08). Исправить оба места из одной canonical таблицы; сначала показывать фактически resolved principal/source без секрета, затем настраивать. **Приёмка:** В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.



- **FIX-DV-13 · P2 · sheleg-dev** — [Consent guide смешивает политику Google, юридические решения и неподтверждённые проценты](report.md#dv-13). Развести product policy, geography/legal decision и технику. Scope+source+checked_at у требований; Basic general vs Advanced advertiser-specific model; процент только как dated measured study, не обещание. Режим выбирается политикой проекта. **Приёмка:** Near-miss advertiser-only GA4/Ads без publisher inventory не требует certified CMP автоматически; Basic проходит; неизвестная юрисдикция не автоматически granted.



- **FIX-DV-16 · P2 · sheleg-dev, telegram-dev** — [Правила восстановления дают противоположные действия для отозванной сессии](report.md#dv-16). Единый typed health contract: liveness процесса, readiness способности служить, degraded_auth с остановкой работ + alert, recovery только после новой auth. Exit/restart допустимы для recoverable failure и контролируемой политики supervisor. **Приёмка:** Composition scenario: Telegram session revoked + Sentry installed → один actionable alert, работы остановлены, ограниченные retries и отсутствие бесконечного crash loop.



- **FIX-DV-17 · P2 · sheleg-dev** — [FCP ошибочно объявлен неизмеримым в поле](report.md#dv-17). Разделить две независимые оси: CWV/not-CWV и lab/field availability. Обязательные p75, device/cohort, period, sample size; TBT как диагностическая корреляция, не замена доказательства INP. **Приёмка:** Кейс CrUX FCP + Lighthouse TBT без field INP: FCP=field supported, INP=unknown, не 'passed by TBT'.



- **FIX-DV-18 · P2 · sheleg-dev** — [Оптимизационные эвристики превращены в запреты без измерений и поддерживаемых сценариев](report.md#dv-18). Перед изменением проверить performance trace и сценарии, browser support contract, accessibility owner. CSP origins одобрять по функциональной необходимости; semantic headings по структуре; lazy-load по измеренному waterfall. **Приёмка:** Acceptance включает сценарии low-end/slow network, keyboard+headings, supported browser matrix, no new unapproved CSP origin, несколько сопоставимых замеров без функциональных потерь.



- **FIX-TG-02 · P2 · telegram-dev** — [Оmitted allowed_updates ошибочно приравнен к пустому списку](report.md#tg-02). Таблица unset/[]/explicit и getWebhookInfo evidence; хранить desired subscription отдельно. Update id использовать как identity, не глобальную гарантию монотонности навсегда. **Приёмка:** Mock remembers previous allowed_updates: omit сохраняет, [] меняет. Кейс >7 дней idle с новым random id; нет потери события.



- **FIX-TG-04 · P2 · telegram-dev** — [Матрица launch surfaces неверно запрещает menu-button query flow](report.md#tg-04). Разделить keyboard, inline keyboard, menu, inline mode, direct/main/attachment surfaces; capability/API floor у каждого метода с первичным source. **Приёмка:** Scenario matrix по launch mode с наличием query_id и разрешённым API; menu поддерживает inline-button semantics; capability absent gracefully degrades.



- **FIX-TG-05 · P2 · telegram-dev** — [Лимит одного FloodWait не ограничивает бесконечную retry sequence](report.md#tg-05). Добавить wall-clock deadline, cumulative wait и attempt budget, cancellation и checkpoint queue; max wait трактовать как backpressure, длительные waits как policy choice. Runnable login/session example с явными imports. **Приёмка:** Fake client выдаёт 100×1s waits: bounded timeout/defer, checkpoint сохранён; cancellation работает; dead session не retry. Проверка module parse/import через stubs без Telegram login.



- **FIX-AS-05 · P2 · agent-stack** — [Аудируемость ошибочно приравнена к статическому графу](report.md#as-05). Статический граф оставить предпочтением для предсказуемости. Аудируемость определять через полноту execution record, версии policy и детерминированные границы; динамике поставить budget/depth/node caps и provenance. **Приёмка:** Один static и один dynamic сценарий проходят одинаковый reconstruction audit; удаление события/ребра детектируется в обоих. Наличие design diagram само по себе не даёт PASS.



- **FIX-AS-12 · P2 · agent-stack** — [MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor](report.md#as-12). У каждого executable example назвать distribution, imports, tested version и lifecycle. Дать отдельные v2/current и v1 migration paths, health route с проверенным порядком registration. Проверять localhost protocol call, а не только наличие строки в markdown. **Приёмка:** В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.



- **FIX-AS-13 · P2 · agent-stack** — [Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks](report.md#as-13). Главный dispatch criterion: capability/tool execution против автономного peer outcome. Длительность — второй вопрос о Tasks capability/transport, не выбор протокола. Проверять фактически поддержанные extensions клиента/SDK. **Приёмка:** Routing set включает long-running fixed export→MCP Tasks при поддержке, autonomous outsourced negotiation→A2A, unsupported Tasks→явный fallback. Ни один кейс не решается только словом long-running.



### M5. Мигрировать 28 скиллов на совместимые контракты и host adapters

**Вход:** M4. **Выход:** 28 sidecars skill.contract.json; project policy; capability receipts; clean-install матрица заявленных сред; адаптеры токенов и sibling dependencies.

**Контроль завершения:** Каждый skill объявляет modes, required inputs, outputs, effects, fallbacks, proof. Контракты согласованы на стыках. Установка/удаление/upgrade/rollback не оставляют конфликтующих активных копий.

**Управление регрессией:** Версионирование schema; старые пакеты читаются адаптером в legacy mode с явными ограничениями; migration обратима.



- **FIX-MS-04 · P2 · make-skill** — [Платформенные ограничения описаны как универсальные и частично устарели](report.md#ms-04). Матрица adapter capabilities по версии хоста; native fallback по обнаруженным инструментам. В таблице каждой нормы owner=spec/host/house, required vs recommended и дата последней проверки. **Приёмка:** Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.



- **FIX-ED-01 · P2 · make-skill, task-pipeline** — [Переносимость зависит от совместной упаковки соседнего task-pipeline](report.md#ed-01). Либо объявлять bundle dependency и тестировать package closure, либо собирать автономный skill artifact с канонической документацией внутри references. Одна source-home, generated copies с digest; не править дубликаты вручную. **Приёмка:** Clean install каждого заявленного канала, в том числе одного скилла, разрешает все обязательные ссылки; при недоступной зависимости печатается capability unavailable вместо all links inside.



- **FIX-UX-06 · P2 · super-ux** — [Новый проект Codex получает правило в CLAUDE.md](report.md#ux-06). Сначала определить host capabilities; default instruction target по текущему host, explicit project target приоритетнее. Проверка должна сверять materialized rule с активным target, не только с существованием любого файла. **Приёмка:** Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.



- **FIX-UX-07 · P2 · super-ux** — [Язык vision и обязательный формат заголовков не согласованы на входе](report.md#ux-07). Явно прочитать контракт до записи; использовать устойчивые section IDs с локализуемыми title либо сказать, что машинные headings остаются английскими, а содержание переводится. **Приёмка:** Русский fixture всех 9 секций проходит по canonical IDs; действительно отсутствующая anti-vision fail; изменение языка title не меняет identity.



- **FIX-DS-01 · P1 · sheleg-design** — [Сравнение packs сменой CSS не имеет общего token API](report.md#ds-01). Ввести небольшой semantic role API и per-pack adapter, не переименовывая identity tokens. Harness заменяет весь scope atomically, обнаруживает unresolved var и не наследует старый pack. Проверять совместимость компонентных slots; сравнивать layout отдельно когда pack требует другой композиции. **Приёмка:** Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.



- **FIX-SY-06 · P2 · agent-sync** — [Одно gated смешивает lease guarantee, видимость и наличие host enforcement](report.md#sy-06). Заменить на независимые lease_scope, enforcement_mode, awareness_scope, identity_strength и backend_health. В generated docs брать значения из runtime evidence; временно явно расшифровать legacy gated и убрать противоречащие references. **Приёмка:** Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.



- **FIX-SY-07 · P2 · agent-sync** — [Guard охватывает редактор и некоторые git commit, но не все записи через shell](report.md#sy-07). Чётко объявить advisory protection boundary. Если нужна enforceable гарантия — file writes через trusted mutation API/isolated worktree/OS controls с resource locks; не пытаться считать regex shell parser универсальным sandbox. Host adapters имеют capability matrix. **Приёмка:** Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.



- **FIX-SY-08 · P2 · agent-sync** — [Поиск task-pipeline не учитывает native Codex plugin cache](report.md#sy-08). Использовать host capability inventory или configurable explicit resolved skill path. Plugin dependency detector не должен доказывать отсутствие по одному чужому host layout. Low-level acquire/renew/release отделить от необязательного pipeline binding. **Приёмка:** Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.



### M6. Проверить настоящее применение и пользу семейства

**Вход:** M5. **Выход:** Actual-load end-to-end matrix: baseline, named skill, auto-route, full composition; с инструментами и без optional tools; repeated seeds и независимые grading criteria.

**Контроль завершения:** Все P1-negative fixtures детерминированно проходят. Реальный host подтверждает загрузку выбранной версии. Качество результата, ложные блокировки, лишние вопросы, latency и стоимость измерены. Порог принимается заранее; недоступный native eval честно NOT_RUN.

**Управление регрессией:** Новый route/profile не становится default до достижения заранее записанных порогов; неопределённый результат ведёт к дополнительной выборке, не к выдуманному PASS.



- **FIX-EV-01 · P1 · make-skill, seo-aeo-audit, task-pipeline** — [Проверка выбора названия не доказывает пользу выполнения скилла](report.md#ev-01). Три испытательных слоя: deterministic tools, routing actual-load traces, end-to-end outcome with/without. Одинаковые задачи, изолированные workspaces, зафиксированные host/model/digests, независимые outcome graders и cost/latency. Разрешить синтетические safety/effect contract тесты до production. **Приёмка:** Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.



- **FIX-DS-06 · P2 · sheleg-design** — [Eval-регрессия не покрывает текущий composition/runtime](report.md#ds-06). Сохранить историю, добавить current-version manifest, реальные packaged installs, несколько seeds/repeats на поддержанных host/model, multi-skill route sequence и resource budget. Runtime fixtures вместо только планов; transcript/content hash сохранять за пределами /tmp. **Приёмка:** Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.



- **FIX-DV-19 · P2 · sheleg-dev** — [Eval измеряет узнавание доктрины и дизайн-ответ, не безопасность исполняемого результата](report.md#dv-19). Сохранить routing eval, добавить generated-artifact eval с offline provider stubs, реальной БД, fault injection, hard security invariants; фиксировать exact model, commit, prompt/tool trace, grader version и raw results. **Приёмка:** Для каждого skill минимум positive, near-miss negative, hostile/failure scenario; P1 контрпримеры обязаны падать на старом output и проходить после правки; результаты привязаны к release.



### M7. Выпустить и проверить ограниченное развёртывание

**Вход:** M6. **Выход:** Release candidates с pinned digests, опубликованные member versions, затем umbrella; smoke на чистых профилях, release receipts и проверяемый rollback.

**Контроль завершения:** Каждый опубликованный архив соответствует проверенному digest; registry/source/runtime version не расходятся; canary реальные задачи без новых P1-регрессий; rollback проверен.

**Управление регрессией:** Откат umbrella lock и конкретных member packages на предыдущий проверенный набор; не переписывать опубликованный артефакт.



### M8. Закрыть программу и закрепить обслуживание

**Вход:** M7. **Выход:** Матрица 28/28 contracts, 90/90 dispositions, закрытые P1, остаточные ограничения, регламент обновления внешних норм, эталонный eval set.

**Контроль завершения:** Все условия раздела «100%» выполнены и имеют receipts. Исключение разрешено только с ограничением обещания/поддержки, а не путём переименования ошибки. Нет открытого P1 внутри заявленной области.

**Управление регрессией:** При новом критическом контрпримере открыть конкретный finding/release incident и ограничить затронутый рецепт. Автоматическое наблюдение требует отдельной настройки пользователем.



### Что считать прогрессом

Считать отдельно: findings с доказанным исправлением / 90; контракты, прошедшие host matrix / 28; пройденные критические сценарии / согласованный набор; реально проверенные релизы / выпускаемый набор. Эти четыре знаменателя нельзя свести к проценту качества модели. Изменённый текст без контрпроверки не закрывает задачу. Неисполненный тест — NOT_RUN, сбой окружения — TEST_ERROR.

Только типовые экземпляры этой программы имеют конечный критерий 100%. Обещание безошибочности всех будущих ответов модели в него не входит.
