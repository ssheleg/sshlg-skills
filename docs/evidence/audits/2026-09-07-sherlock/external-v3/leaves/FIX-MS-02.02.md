# FIX-MS-02.02 — Optional full parser conformance

Parent `FIX-MS-02` · implementation · P1

## Что и зачем

Самодельный YAML parser теряет типы metadata

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
140:     def gaps(self):
141:         return [r for r in self.results if r["verdict"] == "GAP"]
142:
143:
144: def parse_frontmatter(text):
145:     """YAML subset: top-level scalars, block scalars, one nested map.
146:
147:     Returns (data, line_of_key). A full YAML parser is not in the stdlib and a
148:     skill's frontmatter is a flat map by specification, so this is enough — and
149:     it keeps the script dependency-free, which is the point of shipping it.
150:
151:     A plain scalar may continue on indented lines and YAML folds them into one
152:     value with a space. Dropping those lines is how a description whose real
153:     length was 1392 characters got measured at 180 and passed both the 1024 cap
154:     and the 970 working limit — a clean bill from the family's standard-keeper
155:     for a skill the Skills API rejects on upload (2026-08-16, B-63).
156:     """
157:     data, lines, key, mode = {}, {}, None, None
158:     scalars = set()
159:     for i, raw in enumerate(text.split("\n"), start=2):  # +2: the opening '---'
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ms-02.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Полный YAML parser только уже доступный optional adapter; сопоставить multiline/escapes/quoted scalars с oracle и разнести verdicts.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Отсутствие parser не PASS полноценной YAML проверки; malformed всегда error.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-MS-02.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-MS-02.02.json), [parent](../parents/FIX-MS-02.json). Полный audit не required prompt input.
