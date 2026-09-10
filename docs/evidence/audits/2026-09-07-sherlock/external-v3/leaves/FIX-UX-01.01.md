# FIX-UX-01.01 — Claim provenance schema

Parent `FIX-UX-01` · implementation · P1

## Что и зачем

B030 не доказывает происхождение утверждения

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md`

implementation; exact local source path. SHA256: `f2bef5e66047c516fe183448b8d5aa862c0478a32534fb5cd075855b33feb5f6`

```text
214: | tools in the catalog | 448 | api/catalog.json | 2026-08-05 | 2026-11-05 | yes |
215: | median run cost | $3.10 | internal billing export | 2026-07-30 | 2026-10-30 | no |
216: ```
217:
218: **This is the only source of any figure in public copy.** A number in a
219: public surface with no row here is `B030` and blocks. `Public: no` marks
220: internal figures that must never be quoted. A row with no `Source`, or past
221: its `Review by`, is `B031` and warns.
222:
223: A missing fact is reported, never invented to close a gap.
224:
225: ---
226:
227: ## `channels.md`
228:
229: One record per surface, in this shape:
230:
231: ```markdown
232: ### landing hero
233:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Связать claim-id/fact-id/subject/unit/population/date и допустимые transformations; числовое совпадение не доказательство.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

500 integrations и 500 million customers различаются; unknown claim остаётся unresolved.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-01.01.json), [parent](../parents/FIX-UX-01.json). Полный audit не required prompt input.
