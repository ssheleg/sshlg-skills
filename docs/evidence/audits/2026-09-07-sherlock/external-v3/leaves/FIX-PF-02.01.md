# FIX-PF-02.01 — Proof identity

Parent `FIX-PF-02` · implementation · P1

## Что и зачем

Старое доказательство принимается после смены кода и контракта узла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py`

implementation; exact local source path. SHA256: `9627d7e27b0495358a55cd250b48ff39359e3493633ffe23335c783f5900b723`

```text
1202:             % ", ".join("`%s`" % m for m in missing))
1203:
1204:     # The stamp, read here and never accepted from a report — same law as `close`.
1205:     import subprocess
1206:     try:
1207:         r = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True)
1208:         head = r.stdout.strip() if r.returncode == 0 else ""
1209:     except OSError:
1210:         head = ""
1211:
1212:     prior = node.get("certification") or {}
1213:     round_no = int(prior.get("round") or 0) + 1
1214:     tiers_now = {x: reports[x]["verdict"] for x in TIERS}
1215:     history = list(prior.get("history") or []) + [tiers_now]
1216:     node["certification"] = {
1217:         "round": round_no,
1218:         "tiers": tiers_now,
1219:         "at": head or "unavailable — not inside a git checkout",
1220:         "history": history,
1221:     }
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json`

implementation; exact local source path. SHA256: `4082692ee896c4edb96576aa93772046e3a48c9b53944e649af7241774ac7405`

```text
265:           "description": "What this edge carries. Required, and it is `references/planning.md`'s fake-edge test stated in the schema rather than remembered: an arrow whose payload nobody can name is not a dependency, it is a drawing. Naming it is also how the receiving node's brief gets written."
266:         }
267:       }
268:     },
269:     "revision": {
270:       "type": "object",
271:       "additionalProperties": false,
272:       "required": [
273:         "verb",
274:         "node",
275:         "why"
276:       ],
277:       "properties": {
278:         "verb": {
279:           "type": "string",
280:           "enum": [
281:             "add",
282:             "park",
283:             "close"
284:           ],
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pf-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Receipt связывает node/attempt/graph revision/packet/base/candidate tree/checks; текущий HEAD не переписывает старое provenance.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Old proof после code change reject, current matching proof accepted.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-PF-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-PF-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PF-02.01.json), [parent](../parents/FIX-PF-02.json). Полный audit не required prompt input.
