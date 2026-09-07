# FIX-UB-01.01 — Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса

Parent `FIX-UB-01` · implementation · P2

## Что и зачем

Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/test/audit_bundle.py`

implementation; exact local source path. SHA256: `1ce4928358034080dbef628ec0592172e79818b707a33d5fab94e54c55a01b67`

```text
159:             block = text[i:j]
160:     desc_tok = sum(tok(r['desc']) for r in rows)
161:     cmd_tok = sum(c[1] for c in commands)
162:     print(f"\n  {len(rows)} skills, {len(commands)} commands")
163:     print(f"  ALWAYS-ON  descriptions {desc_tok} + commands {cmd_tok} + block {tok(block)}"
164:           f" = {desc_tok + cmd_tok + tok(block)} tok, every session of every project")
165:     print(f"  ON-INVOKE  sum of bodies {sum(r['body_tok'] for r in rows)} — only the triggered one loads")
166:
167:     # ------------------------------------------------------------ CONFLICT
168:     for skill_id, count in collections.Counter(r['skill'] for r in rows).items():
169:         if count > 1:
170:             note('CONFLICT', f"skill id {skill_id!r} declared by {count} members")
171:     for r in rows:
172:         if r['name'] and r['name'] != r['skill']:
173:             note('CONFLICT', f"{r['skill']}: front-matter name is {r['name']!r}")
174:
175:     phrases = collections.defaultdict(set)
176:     for r in rows:
177:         for phrase in re.findall(r'"([^"]{4,40})"', r['desc']):
178:             phrases[phrase.strip().lower()].add(r['skill'])
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-ub-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Переименовать в raw_catalog_cl100k; отдельно measured_prompt_cost из runtime trace, host version и реально exposed listing. Missing runtime sample → unknown; не оценивать качество по размеру каталога.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Сравнить generated listing и фактически переданный prompt на выбранном host; статический подсчёт и runtime measurement никогда не используют одинаковое поле/подпись.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UB-01.01.json), [parent](../parents/FIX-UB-01.json). Полный audit не required prompt input.
