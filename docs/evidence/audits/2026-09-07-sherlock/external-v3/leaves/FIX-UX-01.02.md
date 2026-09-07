# FIX-UX-01.02 — B030 scoped validation

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

### Edit `repo://super-ux/plugins/super-ux/scripts/brand_lint.py`

implementation; exact local source path. SHA256: `02230a1fdead54b9f5dd57a903b6316d6b42a4e7fa45b011b4d065ee0502803d`

```text
839: # not, and B030 read all three as unsourced claims until this project ran the
840: # linter over its own README: `BP-079`, `NIST SP 800-63B` and `Apple HIG 2025`
841: # each produced an error nobody could act on. The check had the right shape
842: # and the wrong meaning, and only a pack pointed at real prose could tell.
843: NUMBER_RE = re.compile(
844:     r"""
845:       \d+\s?%                        # 40%, 40 %
846:     | [$€£]\s?\d[\d,.]*              # $3.10, €1,200
847:     | (?<![A-Za-z]-)                  # not the tail of BP-079, SCN-001, PRN-24
848:       (?<!\.\.)                       # not the far end of a range: BP-079..090
849:       (?<!\d-)                        # not the tail of 800-63B
850:       \b\d{3,}\b
851:       (?![-\d])                       # not the head of 800-63B
852:     """,
853:     re.VERBOSE,
854: )
855:
856: # A bare four-digit year dates a claim; it is not the claim.
857: YEAR_RE = re.compile(r"^(?:19|20)\d{2}$")
858: SUPERLATIVES = (
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверять provenance link/unit/precision/date type; смысловое подтверждение отдельный review.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Три counterexamples audit не PASS; legitimate known claim проходит; год не исключается автоматически.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UX-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-01.02.json), [parent](../parents/FIX-UX-01.json). Полный audit не required prompt input.
