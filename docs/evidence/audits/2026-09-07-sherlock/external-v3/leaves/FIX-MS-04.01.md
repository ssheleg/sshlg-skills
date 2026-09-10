# FIX-MS-04.01 — Платформенные ограничения описаны как универсальные и частично устарели

Parent `FIX-MS-04` · implementation · P2

## Что и зачем

Платформенные ограничения описаны как универсальные и частично устарели

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.


## Exact targets и source окна

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/SKILL.md`

implementation; exact local source path. SHA256: `9d4b36c72b7f8fcc8bc899694baf130edc73fe6e33ea2b70a142d0707de1c63e`

```text
128:   `--force`.
129:
130: ### Degradation contract (every skill that touches a host capability)
131:
132: Hooks, subagents, `/commands`, plugin path variables and MCP servers exist only
133: inside Claude Code — a minority of where skills run. **Each is an accelerator
134: with a written fallback; the skill still finishes its job without it, more
135: slowly.** Write the three cases into the body, in the agent's words, at the
136: point it will need them (shapes: `references/host-capabilities.md`):
137:
138: - **Not Claude Code** (Cursor, Codex, skills CLI, API): no hooks, no subagents,
139:   no `/command`. Name the inline procedure; bundled `scripts/` still travel, so
140:   give the path per channel.
141: - **Recommended plugin/skill absent**: say once what is degraded, continue on
142:   the manual path. A stage that refuses to start because an optional companion
143:   is missing is broken, not strict.
144: - **Tool, interpreter or MCP server absent**: state it once, fall back to the
145:   by-hand procedure, never retry in a loop. Interactive auth is a human step.
146:
147: A fallback you know but did not write is not a fallback.
```

### Edit `repo://make-skill/plugins/make-skill/skills/make-skill/references/agent-skills-spec.md`

implementation; exact local source path. SHA256: `067dc156036d6e4d824e5b45f924f1446436ecd8ec614d14909d6311fdaf3612`

```text
133: | Checker | Covers | Note |
134: |---|---|---|
135: | `skills-ref validate ./<skill dir>` | the open standard's frontmatter rules | Python, installed from source out of `github.com/agentskills/agentskills`; not on npm or PyPI |
136: | Skills API upload | Anthropic's extra rules (reserved words, XML tags, dir name, 30 MB) | the only place they are enforced — see `references/surfaces.md` |
137: | `claude plugin validate … --strict` | plugin/marketplace **manifests only**, not SKILL.md frontmatter | `references/claude-code-plugin.md` |
138: | your `test/validate.py` | house rules + everything the three above miss | the only one that runs on every commit |
139:
140: ## Conformance checklist
141:
142: - [ ] `name`: matches dir, ≤64 chars, `[a-z0-9-]`, no leading/trailing/double
143:       hyphen, no `anthropic`/`claude`, no angle brackets
144: - [ ] `description`: 1–1024 chars, no angle brackets, third person, says what it
145:       does AND when to use it, concrete triggers listed
146: - [ ] optional fields legal: `compatibility` ≤500, `metadata` all-string map,
147:       `allowed-tools` a space-separated string
148: - [ ] no frontmatter key outside spec ∪ documented host extensions
149: - [ ] `SKILL.md` < 500 lines and < 5000 tokens
150: - [ ] heavy material in `references/` / `scripts/` / `assets/` INSIDE the skill
151:       dir, one level deep, each linked from the body with a stated load trigger
152: - [ ] reference files >100 lines have a `## Contents` list
```

Тестовый artifact: `repo://make-skill/test/audit_regressions/fix-ms-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Матрица adapter capabilities по версии хоста; native fallback по обнаруженным инструментам. В таблице каждой нормы owner=spec/host/house, required vs recommended и дата последней проверки.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Codex с native subagents/MCP не считается лишённым этих возможностей; Claude version-gated validation; portable body не требует конкретного tool spelling.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-MS-04.01.json), [parent](../parents/FIX-MS-04.json). Полный audit не required prompt input.
