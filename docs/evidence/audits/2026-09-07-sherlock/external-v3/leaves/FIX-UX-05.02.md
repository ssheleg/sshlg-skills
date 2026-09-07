# FIX-UX-05.02 — Observable copy corpus

Parent `FIX-UX-05` · implementation · P1

## Что и зачем

Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/test/evals/run.py`

implementation; exact local source path. SHA256: `f9bfcc63e0878d8edcb56849d53301a2806b5bed20c294db3889c2ebd5a41a72`

```text
50:     for case in cases:
51:         print(f"\n=== {case['id']}: {case['measures']} ===")
52:         try:
53:             out = subprocess.run(
54:                 [binary, "-p", case["brief"]],
55:                 cwd=ROOT, capture_output=True, text=True, timeout=args.timeout,
56:             )
57:         except subprocess.TimeoutExpired:
58:             print(f"  TIMEOUT after {args.timeout}s")
59:             failed += 1
60:             continue
61:         text = out.stdout
62:         missing = [e for e in case["expect"] if e.lower() not in text.lower()]
63:         present = [f for f in case.get("forbid", []) if f.lower() in text.lower()]
64:         if missing:
65:             print(f"  MISSING  {missing}")
66:         if present:
67:             print(f"  FORBIDDEN {present}")
68:         if missing or present:
69:             failed += 1
```

### Edit `repo://super-ux/test/evals/cases.json`

implementation; exact local source path. SHA256: `2d252f4fe5231282c38fa9ba1509e9029fb348227dfebaf2eb938d649a41c1d7`

```text
3:   "_how": "python3 test/evals/run.py [--case EV-NN]. Needs the `claude` CLI on PATH. Every case names the instruction it measures, and `validate_eval_cases` refuses a case whose anchor no longer resolves, so an instruction reworded here cannot leave its eval pointing at nothing.",
4:   "cases": [
5:     {
6:       "id": "EV-01",
7:       "measures": "The humanization pass runs in Write, without being asked for",
8:       "instruction": {
9:         "file": "plugins/super-ux/skills/copywriting/SKILL.md",
10:         "anchor": "**The humanization pass runs by default, in every mode that produces text.**"
11:       },
12:       "brief": "Using the copywriting skill, write a landing hero headline and subhead for a tool that turns meeting recordings into follow-up emails. Deliver the copy.",
13:       "expect": ["Humanization:"],
14:       "forbid": []
15:     },
16:     {
17:       "id": "EV-02",
18:       "measures": "The status line reports the state rather than assuming it is on",
19:       "instruction": {
20:         "file": "plugins/super-ux/skills/copywriting/SKILL.md",
21:         "anchor": "**Every delivery of copy states what happened**"
22:       },
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-05.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Проверять surface count, actual text changes и semantic invariants, включая уже хороший no-op.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Обе mock подмены из audit FAIL, два валидных surface outputs PASS.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UX-05.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-05.02.json), [parent](../parents/FIX-UX-05.json). Полный audit не required prompt input.
