# FIX-UX-03.01 — Advisory humanization contract

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

### Edit `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md`

implementation; exact local source path. SHA256: `949c791580f343dae6bf354c06e5b0e43e393d8170591c2833e2671a8e7513b9`

```text
124:   proper nouns intact; causal direction unchanged; no negation inverted;
125:   quotations untouched; the core claim the same.
126: - Text that already reads naturally is left alone. Editing what is fine to
127:   prove the pass ran is this mode's failure.
128: - **A marker count is not a verdict and never gates anything.** Say which markers
129:   are present at what density; never say a text was AI-written. The false
130:   positives fall hardest on people writing in a second language, and a writer is
131:   not a defect to be edited into fluency they did not ask for. `ai-tells.md`
132:   carries the measurement and what it binds.
133: - **Read `voice.md`'s two fields first.** `Humanization:` is whether the pass
134:   runs and defaults to `on`; `Humanization pass:` names which implementation,
135:   and absent it is `own`. Neither absence stops work: run the default, print the
136:   status line saying it was a default, and offer to record it once. A value naming
137:   a tool that is not installed falls back to `own` and says so — a missing optional
138:   tool must not stop copy being written.
139: - Other implementations exist and two are worth knowing —
140:   `npx sshlg-skills humanizers` lists what this machine has. Reach for one for an
141:   audit with no rewrite, for long-form prose, or when the writer has a sample of
142:   their own writing to match. Stay here for product copy: the brand pack's
143:   registers and canonical facts are the constraint, and a general-purpose
```

### Edit `repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md`

implementation; exact local source path. SHA256: `12360ad29858deb1c7110b45683b890cb566bfe85c9258cacd4471a59d3a8943`

```text
27: ## Severity
28:
29: | Grade | Meaning |
30: |---|---|
31: | **S1** | decisive on its own, so one instance reads as machine-drafted |
32: | **S2** | one or two are fine; three or more is a signal |
33: | **S3** | weak alone, decisive when stacked with others |
34:
35: `B060` warns at any S1 or three S2, and errors at three S1.
36:
37: ## Naturalness grade, applied to the result
38:
39: After the rewrite, not the input:
40:
41: - **A**: no S1, at most two S2. Reads as written by a person.
42: - **B**: one or two S1, or three to five S2. Natural with minor traces.
43: - **C**: three or more S1, or six or more S2. Traces are obvious; another
44:   pass is warranted.
45: - **D**: violations across several categories, or the change-rate guard
46:   fired.
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Humanization advisory, explicit off сохраняет текст. Brand bans отдельная пользовательская политика.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Цитата/термин/off не навязывают rewrite; число markers не доказывает authorship.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-03.01.json), [parent](../parents/FIX-UX-03.json). Полный audit не required prompt input.
