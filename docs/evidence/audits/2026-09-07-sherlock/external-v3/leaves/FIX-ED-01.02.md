# FIX-ED-01.02 — Closure validation

Parent `FIX-ED-01` · implementation · P2

## Что и зачем

Переносимость зависит от совместной упаковки соседнего task-pipeline

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/scripts/audit_skill.py`

implementation; exact local source path. SHA256: `a6417a004f7d3d8d68f229bcc9cee5e8a7bfff81a3f360787692da6de63afd1c`

```text
497:             if target.startswith(("http://", "https://", "mailto:", "#")):
498:                 continue
499:             if target.startswith("../") or "/../" in target:
500:                 # An escape that lands on a sibling skill in the same tree is a
501:                 # cross-skill link inside one plugin, and every packager measured
502:                 # ships those siblings together — `npx skills add <repo> --skills
503:                 # <one>` installed the sibling too, and all eleven links resolved.
504:                 # An escape that lands nowhere is the defect this check is for.
505:                 out = os.path.normpath(os.path.join(skill_dir, target.split("#")[0]))
506:                 if os.path.exists(out):
507:                     continue
508:                 a.gap("LINK_ESCAPE", "link %r leaves the skill directory and resolves "
509:                       "to nothing — a sibling would ship alongside, this will not"
510:                       % target, rel, i)
511:                 bad = True
512:                 continue
513:             path = os.path.normpath(os.path.join(skill_dir, target.split("#")[0]))
514:             if not os.path.exists(path):
515:                 a.gap("LINK_BROKEN", "link %r does not resolve" % target, rel, i)
516:                 bad = True
```

### Edit `repo://make-skill/test/checker_parity_test.py`

External-method enrichment owned by this outcome. SHA256: `10e0bedb66b2c6d21b36ff821d9c8f83ec859f71fada227733d6224b051fb44d`

```text
1: #!/usr/bin/env python3
2: """The two checkers read the same front matter, and both read it correctly.
3:
4: This repository ships a checker (`scripts/audit_skill.py`, which travels to every
5: agent) and runs a second one on itself (`test/validate.py`). They duplicate a
6: dozen rules. Until 2026-08-16 nothing compared more than one of them, and both
7: carried the same two false negatives:
8:
9:   * a description written as a plain multi-line YAML scalar — legal YAML, folded
10:     into one value — had its continuation lines silently dropped. A description
11:     whose real length was 1392 characters was measured at 180 and passed both
12:     the 1024 spec cap and the 970 working limit. The family's standard-keeper
13:     handed a clean bill to a skill the Skills API rejects on upload.
14:
15:   * `allowed-tools: [Read, Write]`, the inline flow sequence, was read as the
16:     literal string "[Read, Write]". TOOLS_TYPE asks `isinstance(v, str)` and got
17:     yes, so the check written for exactly that form never fired — on the most
18:     common way authors write a tool list, and the one portability defect that
19:     costs a skill its tool grant on every host but Claude Code.
20:
```

### Create `repo://make-skill/test/evals/fixtures/resource-closure.json`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/references/distribution.md`

External-method enrichment owned by this outcome. SHA256: `290c8f51957f24264dfbfb8e10d3bcf4d7d43193253efcaea0f34d0c3e847008`

```text
1: # Distribution matrix — every channel, with the flags that actually work
2:
3: **Load this when:** publishing a skill for the first time, adding a channel, or
4: auditing an existing repo's distribution in a Retrofit. Uploading to the Claude
5: API or claude.ai instead is `references/surfaces.md`.
6:
7: ## Contents
8:
9: - The shadow rule (one channel per agent)
10: - The distributable repo layout (tree, public-repo floor, version sync, gates)
11: - 1. Claude Code plugin
12: - 2. vercel-labs skills CLI
13: - 3. npx installer — npm gotchas; the installer must refuse the shadow it
14:   documents; how updates reach the machine; implementation traps
15: - First publish — the 11-step sequence
16: - 4. Cursor
17: - 5. Ship a FAMILY via an umbrella repo
18: - Platforms
19: - Live-check set (Retrofit)
20: - Release checklist (every version)
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ed-01.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Валидатор проверяет manifest/digests generated refs; external optional reference не становится required.

Уточнение PXS-06: ENRICH_EXISTING_MS_AND_ED; Не копировать quick_validate/package_skill.py и не добавлять PyYAML ради чужого runtime Применить текущий parser improvement из MS-02 Бюджет только actual tokenizer или UNKNOWN; words/lines не становятся tokens
Добавить самостоятельно написанные минимальные негативные corpus fixtures, не копировать foreign runtime.
Расширить checker parity tests на empty metadata и package resource closure.
Уточнить distribution acceptance на external symlink/undeclared secret exclusion.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Удаление required copy проваливает closure; optional unavailable печатается как optional.
Empty name/description rejected and valid nonempty metadata accepted
Missing required reference detected в actual packaged copy, не только whole checkout
Symlink наружу и undeclared secret fixture не попадают в publishable payload

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-ED-01.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-ED-01.02.json), [parent](../parents/FIX-ED-01.json). Полный audit не required prompt input.
