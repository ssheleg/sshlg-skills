# FIX-UX-12.01 — Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата

Parent `FIX-UX-12` · implementation · P1

## Что и зачем

Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md`

implementation; exact local source path. SHA256: `617713c7a76cbff36c8c9211c93246a1a11068a3aaa02e0b75dcf87eef7dde45`

```text
206: 2. **Batch.** Group scoped scenarios by feature, ~5–8 per batch. List the
207:    batches before starting so progress is visible.
208: 3. **Audit each batch.** For large scopes dispatch parallel subagents — one
209:    batch per subagent, each returning per-scenario verdicts with evidence.
210:    Per scenario check, against the code:
211:    - entry point exists and is reachable;
212:    - every numbered step has a corresponding implementation path;
213:    - every listed UI element exists and is wired to a handler;
214:    - every listed state (loading / empty / error / success) has a rendering
215:      branch;
216:    - every listed error is surfaced to the user honestly (no silent catch,
217:      no fake success) with the described recovery;
218:    - the expected result observably occurs.
219:    Any gap → PARTIAL (or FAIL if the flow is missing/broken) with a finding
220:    `[AUD-YYYY-MM-DD-NN] (severity) description -> suggested fix`.
221: 4. **Check the batches against each other, before the report reads as one answer.**
222:    The batches ran independently — in a large scope, in parallel subagents that
223:    never saw one another — and steps 5 and 6 turn them into a single report and summary. That is a
224:    convergence, and a convergence trusts its inputs because they arrived. Four
225:    things to look for:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-12.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить static conformance, executable verification и production observation. Для runtime зависимых критериев PASS только с тестом/браузером/проверенным runtime receipt, иначе BLOCKED/unverified. Сохранить хорошее разделение delivery vs Product outcome.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `CTX-03.01` (data): Coverage preview и observable implementation outcomes должны быть разными evidence states.
- `CTX-03.02` (data): Coverage preview и observable implementation outcomes должны быть разными evidence states.
- `CTX-03.03` (data): Coverage preview и observable implementation outcomes должны быть разными evidence states.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-12.01.json), [parent](../parents/FIX-UX-12.json). Полный audit не required prompt input.
