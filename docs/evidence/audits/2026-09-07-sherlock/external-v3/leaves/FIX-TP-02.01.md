# FIX-TP-02.01 — Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»

Parent `FIX-TP-02` · implementation · P1

## Что и зачем

Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`

implementation; exact local source path. SHA256: `f8876b8eb0b20169e7ca037869c4eb83164754c9bc271da52895fc27c1d0dc8a`

```text
92:
93: **super-ux — recommended for ANY user-facing task**, and the one thing that can stop a
94: gate. The moment a task implies an interface (web / mobile / CLI / TUI), the
95: WHY→UI→scenario chain runs through `/ux` and its linter, which belongs in the host's
96: CI so UX drift cannot merge. **Not installed on a UI task? The stage-3 spec gate
97: stops** — offer the install and wait (`references/companion-skills.md`).
98:
99: **The grill is built in and mandatory** (`references/grill.md`). No "clear enough task"
100: exemption and no stage 1 without a committed, operator-confirmed brief. It produces the
101: **REQ spine** — the request as an addressable list, each row naming how it is verified —
102: which stages 3–5 trace to, stage 4 set-compares against, and **stage 10 accounts for
103: every one of**, turning the pipeline from a funnel into a circle.
104:
105: **Harvest before you ask** (`references/knowledge-sources.md`). Stage 0 opens by
106: pulling what the project already knows about *this* task, writes the source ledger
107: into the brief, and then interviews **against** it — so the operator outranks any
108: document, **but only out loud**, and an override is a recorded decision rather than
109: an undetected divergence. That ledger is also stage 9's work list. Which sources,
110: and the two ways the retro is read — standing instructions in full because they
111: bind this run, the log queried because nothing caps it — are in
```

### Edit `repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/companion-skills.md`

implementation; exact local source path. SHA256: `50e79d6b28dbb9a6ed0db07d960ec8251c2de3f2044413bc2e1cfbbd27c636f4`

```text
49:
50: | Skill / tool | Needed for | Required? | Install |
51: |---|---|---|---|
52: | **super-ux** (`ux-foundation`, `ux-flows`, `ux-scenarios`, `ux-audit`, `/ux`, `/ux-lint` — **and the copy half**: `copywriting`, `brand-voice`, `/brand-init`, `/copy`, `/brand-lint`, plus `/vision`) | stage 3 — the **UX track** *and* the **COPY track**. This row named six surfaces until 2026-08-10 while super-ux shipped eight skills and fifteen commands: the whole brand-and-copy half was invisible to this pipeline, so a run built scenarios and screens and then wrote the interface strings by taste | **Required for any user-facing task** | `/plugin marketplace add ssheleg/super-ux` → `/plugin install super-ux@super-ux` (or `npx skills add ssheleg/super-ux`) |
53: | **sheleg-design** (`/sheleg-design`) | stage 3 — the **VISUAL track**: tokens and themes, typography and rhythm, motion and how it degrades to rest, the visual language a brand is recognised by. It answers *how it looks*, which no other companion here answers — `super-ux` decides what the interface must do, `copywriting` how it sounds. Before 2026-08-10 this skill appeared once in the whole bundle, as a name in a list | **Recommended** on any task with a visual surface; never a gate. Absent → the run says the visual layer shipped **undesigned**, which is the honest name for picking values at the keyboard | `/plugin marketplace add ssheleg/sheleg-design` → `/plugin install sheleg-design@sheleg-design-skill` |
54: | **context7** (MCP — call tools fully qualified: `context7:resolve-library-id`, `context7:query-docs`) | stage 1 docs study | Recommended (web-search fallback) | connect the context7 MCP server |
55: | **Figma** (MCP) | stage 3 UX track, when the project designs visually — super-ux mirrors each `SCR-` screen/state into a frame | Optional, **UI + Figma-on only**. Absent → super-ux degrades to text-only *by itself and never blocks*, so shipping a UI feature with no mockups becomes a silent scope call — which is why the stage-0 sweep decides it | connect the Figma MCP server (`/mcp`, or your claude.ai connectors) |
56: | **[obsidian-wiki](https://github.com/ar9av/obsidian-wiki)** (`wiki-query`, `wiki-update`) | **stage 0 harvest** (query what's already known) **+ stage 9 sync** | **Recommended** — never a gate; absent → harvest runs on repo docs alone | `pip install obsidian-wiki` → `obsidian-wiki setup --vault /path/to/your/vault` |
57: | **[graphify](https://github.com/Graphify-Labs/graphify)** (`/graphify`, `graphify query`, `graphify affected`, `graphify god-nodes`) | **stage 0 harvest** (reach: what calls this, what breaks if it moves) **+ stage 9 refresh + the graph↔docs divergence check** ([`knowledge-graph.md`](knowledge-graph.md)) | **Recommended** — never a gate; absent → the harvest greps instead, and the divergence axis is unavailable | `uv tool install graphifyy` → `graphify install` → `/graphify .` |
58: | **playwright** (CLI — `playwright-cli open`, `snapshot`, `click`, `type`, and the two this pipeline actually asks for: `console` and `requests`; or MCP — `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_console_messages`, `browser_network_requests`) | **stages 5–6 on any project with a web front end**, and **stage 8** on a deployed target — the same job as the row below: open the surface, snapshot it, read the console and the network log. Its own difference is **the channel a look arrives on**: the CLI is a shell command, so it does not put a tool schema in the context window the way an MCP channel does — that is upstream's own comparison and it is *CLI against MCP*, which makes it a claim about this row's own two halves before it is a claim about the row below. Both channels default to an **accessibility-tree snapshot rather than pixels**, so the ordinary look costs a page of text and no vision model; `screenshot` exists in both and costs one when you ask for it | **Recommended** — never a gate; absent → say the surface was verified **by reading the diff** and treat that as the weaker claim it is | CLI: `npm install -D @playwright/cli@latest` → `npx playwright-cli --help` (or `npm i -g` for the global binary; `playwright-cli install --skills` adds its agent skills, `--global` to the home directory). MCP: `claude mcp add playwright npx @playwright/mcp@latest` |
59: | **chrome-devtools** (MCP — `list_pages`, `navigate_page`, `take_snapshot`, `take_screenshot`, `evaluate_script`, `list_console_messages`, `list_network_requests`, `lighthouse_audit`, `performance_start_trace`, `take_heapsnapshot`) | **stages 5–6 on any project with a web front end** — verify the **rendered** surface rather than the diff: computed layout, console errors, failed requests. **Stage 8** on a deployed web target: load the page and read what the browser did, not what the deploy said. Its own difference is **reach past the page**: a Lighthouse category (`lighthouse_audit`, which `seo-aeo-audit` builds on) and a heap snapshot have no equivalent in the row above. A performance trace has one — `playwright-cli tracing-start` records one — but only this row's arrives with `performance_analyze_insight` over it | **Recommended** — never a gate; absent → say the surface was verified **by reading the diff** and treat that as the weaker claim it is | `/plugin install chrome-devtools-mcp@claude-plugins-official` (or connect the MCP server directly) |
60: | **[agent-sync](https://github.com/ssheleg/agent-sync)** (`/agent-sync`, **≥ 1.3.0** — `finish` did not exist before it, so an older install turns the stage-10 close-out into a command that is not there) | **guarded registers** — a lease before writing one, `reserve` before minting an id, `reconcile`/`record` for intent vs as-built, and `finish` for the stage-10 multi-repository close-out ([`documentation.md`](documentation.md)) | **Recommended** — never a gate. Absent → the run is **`ungated`** and must say so out loud; the discipline still applies, only the arbitration is missing | `npx sshlg-skills install` |
61: | **sheleg-dev** (`stripe-billing`, `crypto-payments`, `error-tracking`, `ad-tracking`, `google-signin`, `google-auth`, `frontend-performance`) | **stage 5 when the task wires money, tracking, sign-in or page speed** — the seams a generated integration gets wrong in ways no screen shows: the webhook is the payment, a thank-you-page event cannot know the charge cleared, a duplicated `event_id` counts revenue twice | **Recommended** — never a gate; absent → the integration ships on the host's own doctrine and the close-out names the seam nobody checked | `/plugin marketplace add ssheleg/sheleg-dev` → `/plugin install sheleg-dev@sheleg-dev` |
62: | **agent-stack** (`agent-orchestrator`, `agent-evals`, `agent-interop`, `agent-harness`) | **stage 5 when the thing being BUILT is an agent system** — the orchestrator's loop, evals that say whether it got better, the protocols it speaks (MCP/A2A), the wallet under LLM resale. Not for coordinating the agents editing this repository (that is agent-sync, above) | **Recommended** — never a gate; absent → the agent layer ships unevaluated and the close-out says so | `/plugin marketplace add ssheleg/agent-stack` → `/plugin install agent-stack@agent-stack` |
63: | **telegram-dev** (`telegram-bots`, `telegram-userbots`, `telegram-miniapps`) | **stage 5 when Telegram is the platform, not the transport** — `update_id` as the only idempotency key, a session file that is a logged-in person, a Mini App authenticated by one signed query string | **Recommended** — never a gate; absent → the surface ships on the Bot API docs alone and the close-out names the dedup and auth seams unverified | `/plugin marketplace add ssheleg/telegram-dev` → `/plugin install telegram-dev@telegram-dev` |
64: | **seo-aeo-audit** (`/seo-aeo-audit`) | **stage 8 when a logged-out reader or a crawler will see the shipped surface** — the check that a machine will find it; the design-time rule lives with the host, this is the audit after | **Recommended** — never a gate; absent → visibility ships undesigned and unaudited, said in those words | `/plugin marketplace add ssheleg/seo-aeo-audit` → `/plugin install seo-aeo-audit@seo-aeo-audit` |
65: | ~~superpowers~~ | — | **Not a dependency.** Stages 2/4/5/6 run on the built-in doctrine above. See *Optional bridge* | — |
66: | ~~grill-me / grilling~~ | — | **Not a dependency.** The stage-0 grill is built in (`references/grill.md`) | — |
67:
68: ## Optional bridge — substituting an external skill set
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-tp-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Гейт проверяет обязательные артефакты/поведение и их качество. Preferred provider из семейства, альтернативный provider с тем же контрактом или inline fallback допустимы. При отсутствии инструмента писать, какая именно проверка не сделана.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-TP-02.01.json), [parent](../parents/FIX-TP-02.json). Полный audit не required prompt input.
