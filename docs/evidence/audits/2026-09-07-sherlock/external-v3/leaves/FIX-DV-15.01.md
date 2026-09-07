# FIX-DV-15.01 — URL credential scrubber

Parent `FIX-DV-15` · implementation · P1

## Что и зачем

Эталонный string scrubber пропускает распространённый Redis password и bot-token URLs

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Оплата, OAuth/sign-in, telemetry, attribution, performance.

Вход: product decisions и provider contracts. Выход: рабочие интеграции и воспроизводимые failure-path tests. Ссылка на redirect не подтверждает оплату.

Граница: Receipt != completion, amount units явны, ambiguous network outcome требует reconciliation. Секреты остаются server-side.


## Exact targets и source окна

### Edit `repo://sheleg-dev/plugins/sheleg-dev/skills/error-tracking/references/scrubbing.md`

implementation; exact local source path. SHA256: `0aa58be5f0bc75bb8b987b03e6f3c4ac3c8a34e92e333f75fbdb59749e86a209`

```text
82: list knows Sentry's world, not your variable names.
83:
84: ## Layer 2 — values, by you
85:
86: Match the shape, not a list of known names — a newly added secret is then
87: covered by default instead of leaking until someone updates a list.
88:
89: ```python
90: import re
91:
92: _URL_CREDENTIALS = re.compile(r"(?P<scheme>[a-zA-Z][a-zA-Z0-9+.-]*://)(?P<user>[^:/@\s]+):(?P<pw>[^@/\s]+)@")
93: _REDACTED = "<redacted>"
94:
95: def scrub_text(value):
96:     if not isinstance(value, str):
97:         return value
98:     return _URL_CREDENTIALS.sub(rf"\g<scheme>\g<user>:{_REDACTED}@", value)
99:
100: def scrub_values(event, _hint=None):
101:     def walk(node):
```

Тестовый artifact: `repo://sheleg-dev/test/audit_regressions/fix-dv-15.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разбирать URL userinfo/query/path, включая пустой username и encoded password; secrets заменять до logging.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Redis :password@ и bot token URL из audit очищены; безопасный URL сохраняет полезный shape.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DV-15.01.json), [parent](../parents/FIX-DV-15.json). Полный audit не required prompt input.
