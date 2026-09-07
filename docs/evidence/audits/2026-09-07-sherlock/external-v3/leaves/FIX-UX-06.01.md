# FIX-UX-06.01 — Новый проект Codex получает правило в CLAUDE.md

Parent `FIX-UX-06` · implementation · P2

## Что и зачем

Новый проект Codex получает правило в CLAUDE.md

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/vision/SKILL.md`

implementation; exact local source path. SHA256: `21bb12c216af4a6e9d49b4712ab036731a51fd9e9124f5892dd8274832661f40`

```text
119: - [ ] A stranger could use the alignment test to reject a plausible feature
120:
121: ## Step 4 — install the alignment rule
122:
123: Write the rule into **the project's own instruction file**, the same one
124: `ux-rule` uses: `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex and opencode,
125: `GEMINI.md` for Gemini. Detect which the project already has; create `CLAUDE.md`
126: only if none exists. **Never hardcode one agent's path** — a rule installed
127: where the running agent cannot see it is worse than no rule, because everyone
128: believes it is covered.
129:
130: Idempotent: if the heading is already present, update the block in place rather
131: than appending a second copy.
132:
133: ```markdown
134: ## Vision alignment — hard rule (super-ux)
135:
136: Before planning any new feature, capability or significant change, check it
137: against `docs/ux/vision.md` — specifically the **anti-vision** and the
138: **alignment test**.
```

### Edit `repo://super-ux/plugins/super-ux/scripts/ux_lint.py`

implementation; exact local source path. SHA256: `3747da7d20b806355d96eab1c3e6bb52c28d86d25aa57e7510ad43a697488828`

```text
783:              f"{len(VISION_SECTIONS)} sections are headings with nothing under "
784:              f"them, so the alignment rule is arbitrating against a blank "
785:              f"document. Write it, or delete the file until you do")
786:
787:     root = ux.parent.parent if ux.name == "ux" else ux.parent
788:     present = [root / n for n in INSTRUCTION_FILES if (root / n).is_file()]
789:     if not present:
790:         warn("[U032] vision.md exists but the project has no CLAUDE.md / AGENTS.md / "
791:              "GEMINI.md — the alignment rule has nowhere to live")
792:         return
793:     carrying = [p for p in present if VISION_RULE_HEADING in read(p)]
794:     if not carrying:
795:         warn(f"[U033] vision.md exists but no '{VISION_RULE_HEADING}' block in "
796:              f"{', '.join(p.name for p in present)} — nothing ever reads the vision "
797:              f"(run the `vision` skill's step 4)")
798:         return
799:     for path in carrying:
800:         text = read(path)
801:         start = text.index(VISION_RULE_HEADING)
802:         tail = text[start + len(VISION_RULE_HEADING):]
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-06.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сначала определить host capabilities; default instruction target по текущему host, explicit project target приоритетнее. Проверка должна сверять materialized rule с активным target, не только с существованием любого файла.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-06.01.json), [parent](../parents/FIX-UX-06.json). Полный audit не required prompt input.
