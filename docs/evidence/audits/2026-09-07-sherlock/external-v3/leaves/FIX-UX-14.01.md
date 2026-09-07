# FIX-UX-14.01 — BP-212 ошибочно объявляет локальное тестирование оплаты невозможным

Parent `FIX-UX-14` · implementation · P2

## Что и зачем

BP-212 ошибочно объявляет локальное тестирование оплаты невозможным

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md`

implementation; exact local source path. SHA256: `e0dcfdb6bf395662b2c81c32b8ecaad6c2059bebe62e6a8c75537834d790ff91`

```text
2014: - **Tags:** personalization, paywall, conversion, trust, pricing, forms
2015: - **Source:** [FFox26]/[48Laws]
2016: - **Checked:** 2026-08-14
2017:
2018: #### BP-212: Publicly addressable before it takes money, instrumented before it takes traffic
2019: - **Do:** order the build so the funnel has a real public address before a payment provider is wired to it, and so product analytics and the ad-platform pixel are live before the first paid click. Treat each as a gate on the next step, not as a task to catch up on.
2020: - **Why:** both orderings are forced rather than tidy. A provider confirms a charge by calling an address on the public internet, so the whole post-payment path — entitlement written, success screen shown, access delivered — is untestable while the funnel exists only on a laptop, and the usual way to find that out is the first real card. Traffic bought before instrumentation cannot be read afterwards either: the sessions are spent, the step that was losing people was never recorded, and the campaign gets judged on a total that names nothing. BP-039 orders lifecycle after the funnel for the same reason one level up.
2021: - **Apply when:** standing up any web funnel, or adding a payment step to one that had none.
2022: - **Tags:** checkout, analytics, web2app, conversion, testing, web
2023: - **Source:** [FFox26]/[CRO26]
2024: - **Checked:** 2026-08-14
2025:
2026: #### BP-213: A collected answer carries three decisions no screen shows
2027: - **Do:** for every field the funnel stores — quiz answers, email, payment status — decide and record three things: who may read the row, when the person was told what is collected and why, and how they get it deleted. Default the datastore to deny and reach it only through your own server path; put the notice and consent **before the first write**, not on the paywall; give the deletion request a real route rather than an address nobody reads.
2028: - **Why:** not one of the three is visible from the front end, so a funnel that renders correctly and takes money looks finished while its answers table is readable by anyone who guesses the endpoint — hosted datastores are open until a row policy is written, and a generated funnel does not write one unless told to. The timing is not a preference: `[GDPR]` Art. 13 requires the identity, the purposes and the legal basis to be given *at the time the data is obtained*, and Art. 17 gives the person erasure without undue delay, so a funnel with no deletion route has promised something it cannot do.
2029: - **Apply when:** the funnel stores anything about a person — every funnel with a quiz or a checkout.
2030: - **Tags:** legal, trust, forms, error-recovery, web
2031: - **Source:** [FFox26]/[GDPR]
2032: - **Checked:** 2026-08-14
2033:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-14.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Развести local sandbox, staging и production. Локальный webhook forwarding или официальный emulator допустим для wiring/tests; публичный HTTPS endpoint обязателен для production delivery. Provider capability определяет dependency, а не универсальная UX практика.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-14.01.json), [parent](../parents/FIX-UX-14.json). Полный audit не required prompt input.
