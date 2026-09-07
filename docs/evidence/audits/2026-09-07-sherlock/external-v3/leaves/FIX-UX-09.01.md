# FIX-UX-09.01 — Воронки конкурентов из proxy превращаются в «proven base»

Parent `FIX-UX-09` · implementation · P2

## Что и зачем

Воронки конкурентов из proxy превращаются в «proven base»

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md`

implementation; exact local source path. SHA256: `21db211ef0bd9f11bd09bb7d234cc976d00686ea1aeb085ac57c676e3c53a802`

```text
77: strongest inference available and it is still an inference.
78:
79: | Signal | Read | Why it carries information |
80: |---|---|---|
81: | **How long the ad has been running** | Libraries publish the launch date | Nobody keeps paying to run an ad at a loss for months. Longevity is the cheapest signal and the hardest to fake |
82: | **How many creatives are in rotation on one offer** | Count the variants pointing at the same funnel | Variant count is production spend, and production spend follows return. A dozen creatives on one offer is a team that has decided this funnel earns |
83: | **How fast reviews are growing** | The rate, never the count | Count is mostly age. Rate is current traffic, which is what you want and what the sort in FR-01 gets wrong |
84: | **Recurrence across independent players** | The same move in several unrelated funnels | Once is taste, three times is a pattern. This is the only one of the four that is about the *mechanic* rather than the advertiser |
85:
86: **The shared failure mode:** a well-funded funnel that is losing money looks
87: identical to a profitable one on all four signals, for as long as the budget
88: lasts. Treat a single funnel's evidence as weak and the recurrence signal as the
89: only strong one.
90:
91: **Output:** each funnel in the list marked kept or dropped, with which signals
92: it showed. A funnel kept on no signal is a funnel you liked the look of, and
93: that is worth writing down as such rather than laundering into evidence.
94:
95: ## FR-03 — Record the same fields for every funnel
96:
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-09.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Все market signals маркировать как observed exposure; вывод о механизме как hypothesis с альтернативными объяснениями. Частоты считать скриптом по corpus с denominator/дубликатами; adoption через локальный эксперимент, не «proven» из частоты.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-09.01.json), [parent](../parents/FIX-UX-09.json). Полный audit не required prompt input.
