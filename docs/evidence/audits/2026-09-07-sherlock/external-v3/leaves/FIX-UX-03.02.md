# FIX-UX-03.02 — B060 semantic safety

Parent `FIX-UX-03` · implementation · P1

## Что и зачем

Humanization «никогда не блокирует» расходится с исполняемым B060

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
1596:         hits = [m for m in S1_MARKERS if m in lowered]
1597:         if not hits:
1598:             continue
1599:         grade = "B" if len(hits) < 3 else "C"
1600:         severity = SEVERITY_ERROR if len(hits) >= 3 else SEVERITY_WARN
1601:         findings.append(Finding(
1602:             "B060", severity, path, 0,
1603:             f"{len(hits)} S1 marker(s) -- {', '.join(sorted(hits))}. "
1604:             f"Naturalness grade {grade}",
1605:         ))
1606:
1607:     # B062 -- the rhetorical dash, in every surface that ships prose.
1608:     for key in ("marketing", "store"):
1609:         for path, fields, body in documents(brand_dir, sources, key):
1610:             text = f"{fields.get('title', '')}\n{body}"
1611:             strict = not grammatical_dash_language(text, primary)
1612:             findings.extend(dash_findings("B062", path, body, strict))
1613:
1614:     for row in registry(brand_dir):
1615:         if row["kind"] == "layout":
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-03.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Убрать severity escalation по count; добавить no-op и semantic-preservation cases для чисел/отрицаний/causality.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Marker-rich корректный текст не blocking; смысл после optional rewrite не меняется.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UX-03.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-03.02.json), [parent](../parents/FIX-UX-03.json). Полный audit не required prompt input.
