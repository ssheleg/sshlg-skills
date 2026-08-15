# Brief — graph engineering into agent-stack, and a graph audit of task-pipeline

**Date:** 2026-08-15 · **Run:** `r-6e62c4dab` · **Lease:** `GRAPH-ENG`
**Repositories:** `sshlg-skills` (umbrella), `skills/agent-stack`, `skills/task-pipeline`

## The request, as given

> Изучить статью «Graph Engineering with Claude», собрать методичку с оригинальной
> ссылкой, разобрать изображения; доработать агентские скилы — перенести знания,
> удалить нерелевантное и противоречащее современным практикам; проаудировать
> task-pipeline на графовое мышление и принять решение, что менять, а что нет.

## Source ledger

| Source | What it says about this task | Freshness |
|---|---|---|
| The article itself — `https://x.com/Mahaximus_/status/2082442856417956173` | An X long-form article, 130 blocks, 4 images, 4 workflow examples, one comparison table. Fetched as JSON through `api.fxtwitter.com` (`x.com` returns HTTP 402 to WebFetch); raw JSON and rendered markdown kept in the run scratchpad | published 2026-07-29 |
| Claude Code `CHANGELOG.md` (`raw.githubusercontent.com/anthropics/claude-code/main`) | v2.1.154 introduced dynamic workflows · v2.1.157 added the keyword-trigger setting · **v2.1.160 renamed the trigger keyword `workflow` → `ultracode`** · v2.1.178 kept explicit phrases (`run a workflow`, `workflow:`) · v2.1.219 default size guideline "medium, under 15 agents" | read 2026-08-15; local CLI 2.1.223 |
| The Workflow tool contract, as presented in-session | `agent()` / `parallel()` / `pipeline()` / `phase()` / `log()`, `schema`, `isolation: "worktree"`, `resumeFromRunId`, concurrency cap `min(16, cores-2)` | Claude Code 2.1.223 |
| `agent-stack` — 4 SKILL.md + 14 references | Parallelism exists as a *pattern* (`sectioning` / `voting`, `techniques.md`); **absent**: the fake-edge test, the checker node, the static-vs-dynamic decision, and any statement of what Claude Code actually executes | **v0.9.0** |
| — *the harvest was overtaken mid-run* | The ledger first read `v0.8.0` / 12 references. **A concurrent session released `agent-stack` v0.9.0 and committed the umbrella's pin bump (`0f557c5`, PR #8) during stage 0**, adding `agent-harness/references/pi.md` and `pi-sdk.md` and rewriting that skill's References table. Detected at stage 2 by `git submodule status` disagreeing with the reading taken at stage 0 — not by anything in the run. Nothing of this run's was lost: the working tree held only this brief, untracked. Re-based on `d97a17d`; baseline re-measured green (`python3 test/validate.py` → `OK … (10 checks, 4 skill(s), v0.9.0)`). The next release is therefore **0.9.0 → 0.10.0**, not 0.8.0 → 0.9.0 | corrected 2026-08-15 |
| `agent-orchestrator/references/patterns.md:191-202` | `MODEL_CONTEXT_WINDOWS` hardcodes 2024-vintage vendor ids and `DEFAULT_CONTEXT_WINDOW = 16_000` | stale |
| `agent-orchestrator/SKILL.md:243-269` | `PlanStage` carries `depends_on`, and the executor beside it runs `for idx, stage in enumerate(plan.stages)` — declared dependencies, list-order execution | contradiction |
| `task-pipeline/references/planning.md:52-57, 178-199` | The dependency graph, parallel groups, `depends:` tags and exclusive file ownership are already doctrine; self-review item 5 already asks whether a `depends:` is real | v1.55.0 |
| `task-pipeline/references/build.md:265-280` | Fan-out has three named preconditions and a sequential default | v1.55.0 |
| Umbrella `docs/evidence/retro.md` — standing instructions | Read in full. **10 of 10 slots used** → any addition at stage 10 forces a retirement | 2026-08-14 |
| `task-pipeline/docs/evidence/retro.md` — R-002…R-007 | R-003 (sweep the class, not the instance) and R-007 (fill a worktree from `HEAD`, never from the shared tree) bind this run | 2026-08-14 |
| Umbrella board `docs/evidence/backlog.md` | 6 open rows (B-45…B-49 plus two waived) | 2026-08-14 |
| Umbrella verification ledger | 0 rows at `never` | 2026-08-14 |
| Code graph | `graphify-out/graph.json` present in all three repositories; the two submodules' are from 2026-08-08 and will be refreshed at stage 9 | stale by 7 days |
| Wiki | `~/.obsidian-wiki/config` present; sync at stage 9 | — |

**Nothing in the harvest was found stale by this run except the two rows marked
*stale* / *contradiction* above.** Both become REQ rows rather than passing notes.

## Decisions taken in the grill

| # | Question | Answer | Consequence |
|---|---|---|---|
| D-1 | Where does the methodichka live? | A reference inside `agent-orchestrator` — `references/graph-engineering.md`. The umbrella gets a pointer in `DOCMAP.md`, never a copy | One home per fact. An agent building an agent system loads it; a human reads it in the repo |
| D-2 | How far do I go alone? | Full release: commit → push → tag → GitHub release → npm, in every touched repository, then umbrella pins and its own release, then `npx sshlg-skills@latest update` | Stage 7's manual gate is satisfied by this recorded authorization. Preconditions stay hard: lint clean, full suite green, CI resolved **by tag** (standing instruction #9), closure read from the registry rather than the workflow |
| D-3 | Which agent-stack skills are touched? | Three: `agent-orchestrator`, `agent-harness`, `agent-evals`. `agent-interop` is deliberately untouched — it owns wire protocols and has no graph surface | Keeps the change from becoming a sweep for its own sake |
| D-4 | What language is the methodichka in? | English, like the other twelve references and the public MIT package. The Russian walkthrough — including what each image shows — is delivered in chat | No single-language outlier in a published package |
| D-5 | The article's images | **Described in prose and linked, never copied into the repository.** They are the author's work in an MIT-licensed public package; a description plus the source URL carries the meaning without redistributing the asset | Decided here rather than at writing time |
| D-6 | `task-pipeline`'s own rule — gate/stage changes go via a branch and a PR (`CLAUDE.md` → *Branch and commit policy*) | Honored. Accepted findings land on a branch, through a PR I open and merge under D-2's authorization | D-2 authorizes the outward act; it does not license skipping the repository's own invariant |

## Autonomy sweep

| Question | Answer, from the harvest |
|---|---|
| Test command | `agent-stack`: `npm test` (= `python3 test/validate.py`); negatives run in CI. `task-pipeline`: `npm test`, `npm run test:negatives`, `npm run test:all`. Umbrella: `npm test`, plus `python3 test/check_pins.py` outside it (it needs the network) |
| Lint | No separate linter in any of the three — the validator is the lint |
| Branch policy | Umbrella and `agent-stack`: doc/doctrine changes on `main`. `task-pipeline`: a branch + PR for anything touching the stage list, the gates or a public contract (D-6) |
| Deploy target | GitHub release + npm, armed per repository by `RELEASE_ENABLED` / `PUBLISH_NPMJS`; triggered by pushing a `vX.Y.Z` tag |
| Deploy authorization | D-2, specific and recorded |
| Tracker | The board, `docs/evidence/backlog.md`, per repository |
| Model | Opus 5 (1M context) — the most capable tier available. One model for the whole run, no per-stage overrides |
| Subagents | **Forbidden by the operator.** Stage 5 runs in the declared inline mode of `build.md`: same isolation, same ledger, same TDD, self-review against `review.md` — recorded as the weaker evidence a self-review is |
| Graph / wiki | Refresh both at stage 9; neither blocks |
| Coordination | Lease `GRAPH-ENG` held on this machine for the run; released on every path |

## REQ spine

| ID | Requirement | How it is verified | Status |
|---|---|---|---|
| REQ-001 | `agent-orchestrator/references/graph-engineering.md` exists: English, the original article URL, all four images explained, a `**Spec pinned:**` stamp | file exists; `grep -c 'x.com/Mahaximus_'` ≥ 1; four image subsections; `python3 test/validate.py` green | open |
| REQ-002 | Every claim about what Claude Code does carries the CHANGELOG version that establishes it | each such claim shows `v2.1.x`; the quoted lines resolve in `anthropics/claude-code` `CHANGELOG.md` | open |
| REQ-003 | The article's one claim that has since changed is corrected in place rather than repeated: `workflow` → `ultracode`, v2.1.160 | the reference states the article's wording, the correction, and its evidence line | open |
| REQ-004 | `agent-orchestrator/SKILL.md` gains the graph section (node/edge, fake-edge test, diamond, checker node, static vs dynamic) and links the new reference | section present; validator green in both link directions | open |
| REQ-005 | The declared-dependency/list-order contradiction in the body is fixed | `SKILL.md` no longer says stages run sequentially beside a `depends_on` model; a dependency-layer shape is given | open |
| REQ-006 | The stale context-window table is gone, replaced by a rule with no vendor ids | `grep -nE 'gpt-4|gpt-3|claude-3-|claude-sonnet-4' references/patterns.md` → no match | open |
| REQ-007 | `agent-harness` carries the static-vs-dynamic axis and the auditability rule inside *Workflow or agent* | section present; front-matter description still ≤1024 chars; validator green | open |
| REQ-008 | `audit_agent.py` gains one detector for the parallel layer's undetected-bad-node failure, with a planted defect **and** a known-clean fixture | `--self-test` prints `7/7 passed`; the plant asserts it landed; CI step green | open |
| REQ-009 | `agent-evals` records the checker node as the gate between a parallel layer and its convergence point, and what it must catch | section present; validator green | open |
| REQ-010 | The task-pipeline audit is written as findings with `file:line` evidence, each tiered, each priced, ending in an accept/reject decision by the operator | the audit document exists; every cited location resolves | open |
| REQ-011 | Every **accepted** task-pipeline finding is implemented with its own check | `npm run test:all` green in `task-pipeline`; changed surfaces enumerated. *Scope is set by the operator at stage 2* | open |
| REQ-012 | Everything released: each touched repository tagged, CI resolved by tag, the registry serving the new version, umbrella pins moved | `npm view <pkg> version` per package; `git submodule status` shows no `+`; every repo clean and pushed | open |
| REQ-013 | Docs propagated: CHANGELOGs, READMEs, `skills.json` (version **and** `skillNames` **and** `desc`), `DOCMAP.md`, the verification ledgers, the board | umbrella `npm test` green with its ratchet counts printed; `skills.json` `skillNames` equals what the submodule ships | open |

**Frozen.** Adding a row is free; removing one needs the operator.

## Carry-over ledger

| # | What | Raised at | Home |
|---|---|---|---|
| — | *(empty at stage 0)* | | |
