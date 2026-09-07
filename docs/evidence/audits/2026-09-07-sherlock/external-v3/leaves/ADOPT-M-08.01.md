# ADOPT-M-08.01 — Добавить сравнениеbehavioralconcepts

Parent `ADOPT-M-08` · implementation · P2

## Что и зачем

Добавить сравнениеbehavioralconcepts

Конкретная реализация приведена в шагах ниже.

## Решения

До сравнения behavioral concepts фиксировать критерии и hard constraints. Сравнивать открытые flow choices; принятую структуру не размывать новой развилкой. Для отвергнутого варианта сохранять причину, locator и условие пересмотра.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md`

reviewed adoption target. SHA256: `08fee3fa580918356d6d3c398948413144cf60e45274ec78d50a0e44500b6d58`

```text
1: ---
2: name: ux-flows
3: description: Use when designing or improving HOW users move through the product - task analysis, user flows (screens, branches, error paths), screen states, low-fi wireframes, Figma mockups, heuristic UX evaluation and redesign proposals. A paid-acquisition funnel is one of these flows - its step chain and branches, onboarding, the paywall step and the activation funnel, read against reference screens from the same category. Maintains docs/ux/flows.md between foundation (stories) and scenarios. Triggers - "user flow" / "юзер флоу", "screen flow" / "флоу экранов", "user path" / "поток пользователя", "improve UX" / "улучши UX", "fix UX" / "почини UX", "wireframe" / "вайрфрейм", "design a screen" / "нарисуй дизайн", "mockup" / "мокап", "task analysis", "redesign flow", "reference screens" / "референсы", "funnel" / "воронка", "onboarding" / "онбординг", "paywall" / "пейволл", "activation funnel" / "активация". Visual system and Figma variables belong to sheleg-design.
4: compatibility: Any agent with file read/write - flow diagrams are mermaid text and need no renderer. Optional MCPs are used only when present in the session - Figma for mockups, Refero/Mobbin/Lazyweb for reference screens; absent, the skill proceeds without them and says so. The closing lint (python3 docs/ux/lint.py, seeded by this pack) needs python3 3.9+, stdlib only.
5: license: MIT
6: ---
7:
8: # ux-flows — Design HOW Users Move
9:
10: > Part of **super-ux** — see [system-map.md](references/system-map.md)
11: > for the whole pipeline and the four sync rules. After changes, run the
12: > linter (`python3 docs/ux/lint.py`).
13:
14:
15: Turns user stories into user flows AND maintains the UI map: task analysis →
16: flow diagram (mermaid) → the screen registry `screens.md` (every screen and
17: state with Figma frame, wireframe, coverage, resources) → optional
18: wireframes/Figma mockups. Also the home of UX improvement: heuristic
19: evaluation of existing flows and traced redesign proposals.
20:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/adopt-m-08.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверить текущую базу target и уже подготовленные doctrine patches; прочитать указанные source_evidence как данные.
Реализовать ровно этот контракт в указанном target: До сравнения behavioral concepts фиксировать критерии и hard constraints. Сравнивать открытые flow choices; принятую структуру не размывать новой развилкой. Для отвергнутого варианта сохранять причину, locator и условие пересмотра.
Проверить конкретные acceptance cases; записать PASS/FAIL/NOT_RUN и доступность инструментов.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Two options have discriminatingbehavior; rejectedoption containswhy/revisit/locator; no mandatoryextraapproval.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](ADOPT-M-08.01.json), [parent](../parents/ADOPT-M-08.json). Полный audit не required prompt input.
