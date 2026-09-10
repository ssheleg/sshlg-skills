# FIX-DV-09.01 — Per-principal OAuth client

Parent `FIX-DV-09` · implementation · P1

## Что и зачем

Express OAuth использует общий mutable client и неполную проверку state

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/oauth2-web-server.md`

implementation; exact local source path. SHA256: `44b2ab36141c9732a098e7a390c6a246a85473091dbdf29fd5f4984bfd32be74`

```text
376:
377: const app = express();
378: app.use(session({secret: 'your-secret', resave: false, saveUninitialized: false}));
379:
380: const oauth2Client = new google.auth.OAuth2(
381:   process.env.GOOGLE_CLIENT_ID,
382:   process.env.GOOGLE_CLIENT_SECRET,
383:   'http://localhost:3000/oauth2callback'
384: );
385:
386: const SCOPES = ['https://www.googleapis.com/auth/userinfo.profile'];
387:
388: app.get('/auth', (req, res) => {
389:   const state = crypto.randomBytes(32).toString('hex');
390:   req.session.state = state;
391:
392:   const url = oauth2Client.generateAuthUrl({
393:     access_type: 'offline',
394:     scope: SCOPES,
395:     state,
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-09.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Создавать client per request/principal; не мутировать shared credentials.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Два параллельных login не используют чужие credentials.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-09.01.json), [parent](../parents/FIX-DV-09.json). Полный audit не required prompt input.
