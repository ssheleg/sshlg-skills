# FIX-PA-02.01 — Отсутствие production измерения запрещает считать доказанный механизм дефектом

Parent `FIX-PA-02` · implementation · P1

## Что и зачем

Отсутствие production измерения запрещает считать доказанный механизм дефектом

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/project-audit/SKILL.md`

implementation; exact local source path. SHA256: `db94e3a51b1477995d267505d5a68a8803ad4e44f5f9a6f3bcb0bd292a18c215`

```text
137: 2. **where the answer is *never*, the row is still worth keeping**, priced as
138:    **latent**: the remedy is weighed against zero rather than against the mechanism's
139:    severity;
140: 3. **where the measurement is impossible, that is a `blind` on the consequence** and
141:    the row says so. A blind consequence is not a finding.
142:
143: Two rules follow from the same place:
144:
145: - **Check a remedy against the population it would touch before proposing it.** Two
146:   rows prescribed releasing an asset class; the measurement showed the asset class was
147:   the product's own inventory, deliberately held.
148: - **An absence is not evidence until the path that would produce the presence has been
149:   walked.** Zero sales means no demand *or* no working path, and those two want
150:   opposite remedies.
151:
152: ## Already decided is not a finding, and it is not nothing either
153:
154: An audit that reads a module and not the places the module is used reports, as
155: defects, the things the project has already decided — **in the project's own words**,
156: because the decision is usually written a few lines from the code the finding cites.
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/project-audit/scripts/audit.py`

implementation; exact local source path. SHA256: `64ce9dc7d2998673004e619864a94e42f54f3ebe8c27d2acf77bee448945cd7d`

```text
894: # ---------------------------------------------------------------------------
895: # the probes that ship with the collector
896: # ---------------------------------------------------------------------------
897:
898: def _finding(probe_id, where, title, severity, blast, effort, remedy,
899:              detail="", evidence=""):
900:     return {
901:         "id": finding_id(probe_id, where, title), "probe": probe_id,
902:         "title": title, "severity": severity, "where": where,
903:         "detail": detail, "evidence": evidence, "remedy": remedy,
904:         "blast": blast, "effort": effort, "runs_open": 0,
905:         "first_seen": datetime.date.today().isoformat(),
906:     }
907:
908:
909: @probe("secrets-tree", "probe", needs=("git",))
910: def _p_secrets_tree(ctx):
911:     rows = scan_secrets(ctx.root)
912:     if not rows:
913:         return Result("clean", "no credential pattern in the tracked tree")
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/audit.md`

External-method enrichment owned by this outcome. SHA256: `8fee313b63fc907aed39506916a64156fb61cb87f7b9ec6b18fd6e895719a28c`

```text
1: # Audit — finding what is missing, cross-cutting
2:
3: Every gate in this pipeline asks *"is this artifact good?"*. Stage 10 asks *"is
4: anything from the list lost?"* ([`acceptance.md`](acceptance.md)). **Neither asks
5: what should have been on the list and never was.**
6:
7: That gap is not an oversight in the gates. It is structural: a gate compares two
8: things, and **a contradiction has two sides while an absence has one.** Comparing
9: the spec against the plan finds a requirement that was dropped. It cannot find the
10: error path nobody specified, the entity nobody gave an owner, the failure mode
11: nobody named — because on both sides of every comparison, it simply isn't there.
12:
13: This file is the method that finds those. It is **cross-cutting**: stage 10 runs it
14: before writing the coverage table, the program loop runs it per module, and a task
15: whose whole job is "audit X" runs nothing else.
16:
17: ## Contents
18:
19: - Three things that are easy to confuse
20: - Why "look again, more carefully" stops working
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/documentation.md`

External-method enrichment owned by this outcome. SHA256: `8a8a3b5b9043c1153469279865dcd8997e7c57adb076d84983e51556ba90f657`

```text
1: # Documentation — the system, not the by-product
2:
3: **One job: make documentation a deliverable with an address, an obligation and a
4: gate.** Not "write docs at the end" — a *system*: every settled thing has an id,
5: every fact has one home, every kind of change names the documents it owes, and a
6: script can say no.
7:
8: This file is the **what and why**. [`gates.md`](gates.md) is how the script that
9: enforces it gets written; [`stages.md`](stages.md) says where each piece binds.
10:
11: **Governance is a by-product here, never a separate step.** The run already
12: produces decisions — the brief's *Decisions locked*, the spec's locked contracts,
13: the ADRs the grill writes. Recording one is **transcription plus a stable id**, not
14: new thinking. Anything below that feels like ceremony is a sign the register is
15: being written twice; write it once, here.
16:
17: ---
18:
19: ## Contents
20:
```

### Create `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/templates/finding-evidence.json`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-pa-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Отдельно mechanism status, exploit/reproduction, exposure, observed incidence и impact uncertainty. Доказанный defect может иметь incidence unknown. UNKNOWN не равно 0; отсутствие телеметрии не понижает техническую истинность.

Уточнение PXS-04: ENRICH_EXISTING_AUDIT_FIXES; Не превращать отсутствие production/logs в запрет finding Не навязывать интервью; спросить только если неизвестное меняет действие Не копировать threat model quota или требование report always waits
Добавить minimal finding-evidence schema и отобразить distinction code mechanism/deployment observation/assumptions.
Согласовать audit.md/documentation.md с этой схемой без mandatory interview.
Проверить три контрпримера: local defect/no production, documented exception, unknown attacker control.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Race reproduced/production unknown остаётся finding; нулевая выборка не превращается в нулевой риск; JSON хранит scope и время наблюдения.
Confirmed local crash + no production logs остаётся code defect, external incidence UNKNOWN
Documented exception не меняет failed invariant в PASS
Unknown attacker control понижает уверенность exploitability, не стирает observed behavior
Confirmed local crash + no production logs остаётся code defect, external incidence UNKNOWN
Documented exception не меняет failed invariant в PASS
Unknown attacker control понижает уверенность exploitability, не стирает observed behavior

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-PA-02.01.json), [parent](../parents/FIX-PA-02.json). Полный audit не required prompt input.
