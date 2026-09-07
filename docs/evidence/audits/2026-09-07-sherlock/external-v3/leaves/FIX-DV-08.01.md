# FIX-DV-08.01 — ADC precedence написан в обратном порядке

Parent `FIX-DV-08` · implementation · P1

## Что и зачем

ADC precedence написан в обратном порядке

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/SKILL.md`

implementation; exact local source path. SHA256: `866cd92bececa1e6e4e5388c5b692347097010aff9478ebe1f776649eacb57da`

```text
85: request = google.auth.transport.requests.Request()
86: credentials.refresh(request)
87: ```
88:
89: ADC search order: attached service account → `gcloud auth application-default login` file → `GOOGLE_APPLICATION_CREDENTIALS` env var.
90:
91: For detailed ADC setup and service account usage, see [references/adc-and-service-accounts.md](references/adc-and-service-accounts.md).
92:
93: ### 2. OAuth 2.0 Web Server Flow
94:
95: **Node.js**
96:
97: ```js
98: const {OAuth2Client} = require('google-auth-library');
99:
100: const client = new OAuth2Client({
101:   clientId: CLIENT_ID,
102:   clientSecret: CLIENT_SECRET,
103:   redirectUri: REDIRECT_URI
104: });
```

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/google-auth/references/adc-and-service-accounts.md`

implementation; exact local source path. SHA256: `36892bdc4b051ad27c236bef6f502c2cad848f539db992fe63ed13634dd37537`

```text
20:
21: ## ADC Search Order
22:
23: 1. **Attached service account** — via GCP metadata server (Compute Engine, Cloud Run, GKE, etc.)
24: 2. **`gcloud auth application-default login`** — local credential file
25: 3. **`GOOGLE_APPLICATION_CREDENTIALS`** — env var pointing to a credential JSON file
26:
27: Credential file locations from `gcloud auth application-default login`:
28: - **macOS/Linux**: `$HOME/.config/gcloud/application_default_credentials.json`
29: - **Windows**: `%APPDATA%\gcloud\application_default_credentials.json`
30:
31: ## Setting Up ADC
32:
33: ### Local Development
34:
35: ```bash
36: # Login with user credentials (generates local ADC file)
37: gcloud auth application-default login
38:
39: # With specific scopes
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Исправить оба места из одной canonical таблицы; сначала показывать фактически resolved principal/source без секрета, затем настраивать.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

В изолированном test env доступны три fake sources; resolver выбирает env, затем local, затем metadata, и отчёт называет именно выбранный.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-08.01.json), [parent](../parents/FIX-DV-08.json). Полный audit не required prompt input.
