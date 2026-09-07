# FIX-UX-08.01 — Approval оператора может стереть происхождение предположения

Parent `FIX-UX-08` · implementation · P2

## Что и зачем

Approval оператора может стереть происхождение предположения

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md`

implementation; exact local source path. SHA256: `eb1b153f9e520811822c1d27dd418b4c280213190d20798fdf76ea758fef604d`

```text
83: own `templates/foundation.md`.
84:
85: ## Init (interview) — greenfield
86:
87: One question at a time; user's answers are the data:
88:
89: 1. Who will use this? (→ personas; probe until each is concrete enough to
90:    recognize)
91: 2. Per persona: what situation triggers them to reach for the product? What
92:    are they really trying to get done? What outcome tells them it worked?
93:    (→ JTBD + forces)
94: 3. Walk their path end-to-end, before/during/after: where do they start,
95:    what do they touch, where does it hurt today? (→ journeys, emotion + pain
96:    per stage)
97: 4. Derive user stories from journey pains and job outcomes; write
98:    acceptance criteria; prioritize must/should/could against the job's
99:    success metric.
100: 5. Record **Design tooling** when design work is about to start: the Figma
101:    on/off choice (default on) and the project's Figma file URL — the two
102:    fields this file owns. Everything else about the visual layer (design
```

### Edit `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/scenario-format.md`

implementation; exact local source path. SHA256: `9017a498b260aeb5d42c6ada422a4ee663491ab50485c0f6787aba7e220fdc6b`

```text
88: - `P-NN` **Status** — `proposed | confirmed | retired`
89: - `JTBD-NN` **Status** — `proposed | confirmed | retired`
90: - `vision.md` **Status** — `draft | approved`
91:
92: A persona and a job are either an assumption or something an observation has
93: confirmed, and `proposed → confirmed` is the only claim either layer makes about
94: itself. Both had been carrying `confirmed` with no enum anywhere covering them.
95:
96: **Two layers carry no status at all, and that is declared rather than left
97: open.** `FLW-NN` and `JRN-NN` have no `Status` field: a flow's delivery state is
98: *measured* through the screens it traverses — which is what `U057` exists for —
99: so a status declared on the flow is the inherited verdict that rule refuses,
100: written into the record. A journey is a map of what happens and has no delivery
101: state of its own. A `Status` on either is `U075`.
102:
103: This list is the ONE home of every enum `docs/ux/lint.py` matches on, and
104: `validate_status_enums_match_contract` compares it against the linter's own table
105: and fails when either side moves alone. It exists because they had already
106: drifted: this contract declared five screen statuses — `blocked` among them, with
107: a paragraph of rules of its own — while the linter matched four, so a `blocked`
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Развести evidence_kind (brief/owner-belief/interview/telemetry/code-inference), decision_status и validation_status. Approval меняет decision, но не provenance. Для эмоций и Frequency×Severity×Solvability хранить источник, шкалу и unknown вместо обязательного выдуманного балла.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-08.01.json), [parent](../parents/FIX-UX-08.json). Полный audit не required prompt input.
