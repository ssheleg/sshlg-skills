# FIX-MS-01.02 — Tokenizer corpus

Parent `FIX-MS-01` · implementation · P1

## Что и зачем

Приближение chars/3.9 выдаёт PASS токенового лимита

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py`

implementation; exact local source path. SHA256: `a6417a004f7d3d8d68f229bcc9cee5e8a7bfff81a3f360787692da6de63afd1c`

```text
91: BODY_TARGET_TOKENS = 4750
92: # No tokenizer in the stdlib. 3.9 chars/token is measured, not assumed: tokenizing
93: # this skill's own bundle gives 3.78-4.47. `claude plugin details` is far more
94: # pessimistic (~2.8) and will always show a bigger number than this estimate.
95: CHARS_PER_TOKEN = 3.9
96: TOC_MIN_LINES = 100     # Anthropic: longer reference files need a table of contents
97:
98: SPEC_KEYS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
99: # Claude Code reads these too. Legal, ignored by every other agent.
100: HOST_KEYS = {
101:     "when_to_use", "argument-hint", "arguments", "disable-model-invocation",
102:     "user-invocable", "disallowed-tools", "model", "effort", "context", "agent",
103:     "background", "hooks", "paths", "shell",
104: }
105: RESERVED_NAME_WORDS = ("anthropic", "claude")
106: NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
107: XML_TAG_RE = re.compile(r"<[^<>\s][^<>]*>")
108: PERSON_RE = re.compile(
109:     r"\b(?:I can|I will|I'll|I help|I'm|you can use|you should use|you may use|"
110:     r"this skill (?:lets|allows|helps) you)\b", re.I)
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ms-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сравнить optional adapter с независимым oracle на code/Unicode/RU/EN; thresholds пометить house/spec/host.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Одинаковая строка и tokenizer revision дают одинаковый measured count; unsupported tokenizer не fallback PASS.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-MS-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-MS-01.02.json), [parent](../parents/FIX-MS-01.json). Полный audit не required prompt input.
