# FIX-UX-07.02 — ID-aware linter

Parent `FIX-UX-07` · implementation · P2

## Что и зачем

Язык vision и обязательный формат заголовков не согласованы на входе

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/scripts/ux_lint.py`

implementation; exact local source path. SHA256: `3747da7d20b806355d96eab1c3e6bb52c28d86d25aa57e7510ad43a697488828`

```text
737:     compliance, which is why it is checked rather than trusted.
738:     """
739:     if not vision.strip():
740:         return
741:     for section in VISION_SECTIONS:
742:         if not re.search(rf"^##\s+{re.escape(section)}\s*$", vision, re.MULTILINE):
743:             err(f"[U030] vision.md: missing section '## {section}'")
744:     # Emptiness is a defect only once the document claims to be finished.
745:     # A freshly seeded template is all headings and no content by design, and
746:     # a linter that fails on its own seed teaches people to skip the linter.
747:     approved = bool(re.search(r"\*\*Status:\*\*\s*approved", vision, re.IGNORECASE))
748:     if approved:
749:         for section in ("6. Anti-vision", "9. The alignment test"):
750:             body = re.split(rf"^##\s+{re.escape(section)}\s*$", vision, maxsplit=1,
751:                             flags=re.MULTILINE)
752:             if len(body) == 2:
753:                 tail = re.split(r"^##\s", body[1], maxsplit=1, flags=re.MULTILINE)[0]
754:                 if not tail.strip():
755:                     err(f"[U031] vision.md: approved but '## {section}' is empty — "
756:                         f"the section that settles arguments cannot be blank")
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-07.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сопоставлять required IDs, а не literal heading language; миграция старых headings явная.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Изменение языка title не меняет identity; duplicate ID FAIL.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UX-07.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-07.02.json), [parent](../parents/FIX-UX-07.json). Полный audit не required prompt input.
