# FIX-VD-07.01 — Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит

Parent `FIX-VD-07` · implementation · P2

## Что и зачем

Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/packs.js`

implementation; exact local source path. SHA256: `0f8ffe8e513e6ac996b57157e0963862659b683eccb2d5f9497c25380999c75f`

```text
148:         provides: ['frontend-design'],
149:         lane: 'style',
150:         source: 'anthropics/skills',
151:         install: ['npx --yes skills add anthropics/skills --skill frontend-design'],
152:         why: 'refuses the default look before a line is written — bans Inter/Roboto/Arial, forces one committed aesthetic direction',
153:       },
154:       {
155:         id: 'web-design-guidelines',
156:         provides: ['web-design-guidelines'],
157:         lane: 'implement',
158:         source: 'vercel-labs/agent-skills',
159:         install: ['npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines'],
160:         why: 'audits built markup against the Web Interface Guidelines — the lane no family router owns',
161:       },
162:       {
163:         id: 'vercel-react-best-practices',
164:         provides: ['vercel-react-best-practices'],
165:         lane: 'implement',
166:         source: 'vercel-labs/agent-skills',
167:         install: ['npx --yes skills add vercel-labs/agent-skills --skill vercel-react-best-practices'],
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`

implementation; exact local source path. SHA256: `245951a4a3adc9f52566b13cbb35b7e9548200e6d04fbf59a857502c4a442bf2`

```text
100: implementation, verification and **accessibility**. Nothing here asks whether the
101: interface can be used at all; that lane is delegated, and delegation only works
102: if somebody actually casts for it.
103:
104: **Ours versus theirs is not a loyalty question.** Where an outside skill answers
105: the lane better, cast it. The one rule that does not bend: **this skill decides
106: the route, and everything cast is a tool inside a lane — never a second entry
107: point.** Some of them advertise themselves as one; a broad `user-invocable`
108: design skill will fire on the same prompt you did. That is not a reason to avoid
109: it. It is a reason to say, out loud, which one is directing.
110:
111: ---
112:
113: ## Act 3 — Fork, but only when the fork is real — and write the rubric first
114:
115: Two variations built by two subagents with **different casts** is the strongest
116: move in this document and the easiest one to turn into theatre.
117:
118: ### The rule that makes it honest
119:
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-vd-07.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Указывать resolved path/digest/version/provenance и обновлять why по достигнутому descriptor либо помечать как generic upstream description. Для каждого cast tool давать scoped input: что fixed, что open, какие deliverables нужны, чьи инструкции о copy/implementation применимы. frontend-design использовать для concept hypotheses/visual critique внутри согласованных границ, а не второй end-to-end router.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Fixture с двумя разными frontend-design реализациями одного имени показывает оба источника, выбирает actual resolved file и не печатает отсутствующие bans. Cast handoff для preserve-brand передаёт palette invariants, но оставляет composition exploration; для exact-Figma reproduction отключает aesthetic risk. Route trace хранит digest прочитанной версии.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-07.01.json), [parent](../parents/FIX-VD-07.json). Полный audit не required prompt input.
