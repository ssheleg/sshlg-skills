# FIX-MS-03.01 — Аудит по описанию автоматически превращается в исправление и release

Parent `FIX-MS-03` · implementation · P1

## Что и зачем

Аудит по описанию автоматически превращается в исправление и release

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/SKILL.md`

implementation; exact local source path. SHA256: `9d4b36c72b7f8fcc8bc899694baf130edc73fe6e33ea2b70a142d0707de1c63e`

```text
197: Done = the five VERIFIED facts in that sequence's step 10 — nothing assumed.
198:
199: ## Retrofit (bring an existing skill/repo up to standard)
200:
201: Audit first, fix second, in the same session. Verdict per item: PASS / GAP /
202: NOT-RUN with evidence — a `file:line` or the output of the command you actually
203: ran. "Looks fine" is not a verdict, and neither is a PASS on a check that was
204: reasoned about instead of executed; a check whose tool is absent is **NOT-RUN
205: with the reason**, never a PASS.
206:
207: **Run the bundled auditor first** — it does the mechanical half
208: deterministically, and it never depends on an unset variable:
209:
210: ```bash
211: make-skill-audit <skill-dir> --house    # Claude Code: the plugin's bin/ is on PATH
212: ```
213:
214: Anywhere else, run `scripts/audit_skill.py` from the make-skill directory you
215: just read this from. **Then work the 14-item checklist in
216: `references/retrofit.md`** — spec floor, plugin floor, surfaces, one-job, entry
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ms-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Явные режимы audit / retrofit / release. По «audit» только доказательства и план. Переход к записи/публикации определяется намерением и ранее данной авторизацией, а не выбранным скиллом.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Один fixture и три входа: audit оставляет исходные hashes, retrofit меняет только scratch, release не запускается без scope release; одинаковые findings во всех режимах.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-MS-03.01.json), [parent](../parents/FIX-MS-03.json). Полный audit не required prompt input.
