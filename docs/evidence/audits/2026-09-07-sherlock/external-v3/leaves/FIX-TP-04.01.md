# FIX-TP-04.01 — Неиспользованное правило автоматически считается ненужным

Parent `FIX-TP-04` · implementation · P1

## Что и зачем

Неиспользованное правило автоматически считается ненужным

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/retrospective.md`

implementation; exact local source path. SHA256: `bc56df2d9c2dd9b0d4fddf10b23acd0135c70fadac8ff111359873f1e3ee52a7`

```text
276: | Trigger | Test | Then |
277: |---|---|---|
278: | **It became a check** | the rule is now enforced by a test, lint, gate or hook | delete it — the check is the memory, and keeping both means it is read twice and obeyed once |
279: | **Its surface is gone** | resolve every path, command, stage and tool it names; any that no longer exists | delete it — it now describes a system nobody is running |
280: | **It went cold** | it has not fired in the last **five run stamps** — **or** in the last **sixty days**, whichever comes first | delete it: five runs without firing is the evidence it was situational, and the calendar is the unit that still moves when the stamp counter has stopped |
281:
282: **Each trigger is a command, not a judgement.** A retirement condition nobody can run is a
283: condition nobody applies, which is how a list reaches ten and stops being read:
284:
285: ```bash
286: # became a check — the rule's own words appear in something that runs
287: grep -rl "$RULE_KEYWORD" scripts/ test/ .github/workflows/ Makefile* 2>/dev/null
288:
289: # surface is gone — every path, command and tool it names, resolved
290: grep -oE '`[^`]+`' <<<"$RULE_TEXT" | tr -d '`' | while read -r t; do
291:   [ -e "$t" ] || command -v "$t" >/dev/null || echo "MISSING: $t"; done
292:
293: # went cold — fired in none of the last five stamps
294: tail -n 200 docs/evidence/retro.md | grep -c "$RULE_ID"
295:
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-tp-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Классы rules: permanent safety/contract, situational, temporary. TTL только временным; cold означает review-needed, не автоматическое отключение. У situational хранить exposure opportunities, не только число запусков.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TP-04.01.json), [parent](../parents/FIX-TP-04.json). Полный audit не required prompt input.
