# Brief — the graph backlog, as a programme

**Date:** 2026-08-15 (second run) · **Lease:** `GRAPH-BACKLOG` in five repositories
**Predecessor:** `2026-08-15-graph-engineering.md`, whose audit produced this list.

## The request, as given

> «Давай подумаем, как граф-инженерию применяем к нашим собственным скилам… дай полный
> список… это будет наш общий бэклог» → «давай делать по таск-пайплайну всё по очереди
> без остановок».

## Source ledger

| Source | What it says about this task | Freshness |
|---|---|---|
| The graph analysis in this session | Eleven findings G-1…G-11, each with `file:line`, priced with the family's own formula. Two carry a recommendation to **reject** | this session |
| `agent-stack/…/references/graph-engineering.md` | The doctrine this list applies. Shipped in 0.10.1; it is the single home and nothing here duplicates it | v0.10.1 |
| Umbrella board | **12 open rows.** B-45, B-50, B-51, B-075 are in scope; the rest are not | 2026-08-15 |
| `task-pipeline` board | **44 open rows.** Only B-075 is in scope | 2026-08-15 |
| Umbrella verification ledger | 23 rows at `never` — unchanged by this run's start | 2026-08-15 |
| Umbrella retro — standing instructions | Read in full. Ten held; #7 (a mechanical rewrite cannot tell a used path from a discussed one) fired **on its author** last run and binds this one hardest, because this programme edits prose across five repositories | 2026-08-15 |
| `task-pipeline` retro — R-002…R-008 | Read. **R-008 is this run's own lesson** and applies before every fix here: enumerate the shapes the defect takes | 2026-08-15 |
| Member tags | agent-stack `v0.10.1-2`, task-pipeline `v1.57.0`, super-ux `v0.40.0-1`, seo-aeo-audit `v0.17.1-1`, sheleg-design `v1.31.0-1` | measured now |
| Working tree | `skills/super-ux` dirty with `graphify-out/` from **another session** — that member tracks its graph deliberately (B-03). Not mine; not touched | measured now |

## Decisions

| # | Question | Answer |
|---|---|---|
| D-1 | Is this a platform? | **Yes** — eleven findings across five repositories, several shipping independently. Decomposed into M1…M9 plus a shared close-out |
| D-2 | Release per module, or once? | **Once.** Eight release cycles at ~30 minutes of CI each buys nothing: the modules are doctrine, not runtime, and no consumer can install between them. Recorded as a deliberate deviation from *stages 3→10 per module* |
| D-3 | The two rows I recommended rejecting | **Stay rejected**, and are recorded as rejections rather than dropped: G-8 (pipeline-vs-barrier, no concurrency to buy it) and the squash-commit subject on `task-pipeline` main (force-pushing `main` after a live collision is the larger risk) |
| D-4 | B-51 (the graph needs an LLM key) | **Human-only.** No code decides it; it leaves this run as the one item in the Human steps block |
| D-5 | Manual gates | **Pre-authorised** — «без остановок». Every gate is still *verified* and its verdict printed; what is skipped is the pause, not the check |
| D-6 | Subagents | Forbidden, as before. Stage 5 is a declared inline run |
| D-7 | Order | By the computed priority in the list, highest first, except that M1's four members are done together because they are one defect in four places (R-008 applied before the fix, not after) |

## REQ spine

| ID | Requirement | How it is verified | Module |
|---|---|---|---|
| REQ-01 | Stage 0's harvest gets a convergence check: sources are compared **with each other**, and a contradiction becomes a line in the brief rather than silence | `knowledge-sources.md` carries it; a plant strips it and the validator refuses | M1 |
| REQ-02 | Stage 3's COPY and VISUAL tracks are a parallel layer after UX, and their convergence has a checker — a label the layout has no room for is the contradiction it catches | `stages.md` states both; a plant removes the checker and the validator refuses | M1 |
| REQ-03 | `seo-aeo-audit`'s ten tracks converge through a cross-track check before the plan | the skill carries it; its own validator green | M1 |
| REQ-04 | `ux-audit`'s parallel batches converge through a cross-batch check before the report | the skill carries it; `/ux-lint` and the super-ux validator green | M1 |
| REQ-05 | Stage 9's three artifacts are named as a convergence and the graph↔docs check as its gate | `stages.md` / `SKILL.md` state it | M1 |
| REQ-06 | The family's composition order breaks the `sheleg-design → copywriting` edge and names the payload on every arrow it keeps | the routing block renders with the new shape; `router_texts_test.js` green | M2 |
| REQ-07 | Whether the launcher's unconditional prune over a failed member layer can strand a skill is **measured**, and the fix is whatever the measurement justifies | a fixture that fails the layer and asserts what the prune does | M3 |
| REQ-08 | Every member states its shape — static or dynamic — and whether its run must be auditable | eight statements, one per member; a check counts them | M4 |
| REQ-09 | Two concurrent runs of `negatives.py` cannot corrupt each other | scratch paths carry a per-run token; two overlapping runs both pass | M5 |
| REQ-10 | The `B-` id register can allocate, or the registers move where they can | `agent_sync.py reserve B` succeeds, or the config no longer claims what it cannot do | M6 |
| REQ-11 | A reference whose body duplicates another file's is caught by a check rather than by reading | a plant duplicates a section and the check refuses | M7 |
| REQ-12 | `audit_agent.py` gains the two detectors it currently declares blind to | `--self-test` count rises and each plant is watched failing | M7 |
| REQ-13 | `agent-orchestrator`'s body is under its 4750-token budget, by splitting rather than trimming | measured with `cl100k_base`, printed | M8 |
| REQ-14 | The two lagging pins move, each verified against its own tag first | `check_pins.py` reports no `BEHIND` | M9 |
| REQ-15 | Everything released, every registry read for content and not only for a version | `npm view` per package; a tarball opened | M10 |

**Frozen.** Adding is free; removing needs the operator.

## Module map — build order

| # | Module | Delivers | Depends on | Carries | REQs |
|---|---|---|---|---|---|
| M1 | The convergence checker | one rule, four applications, one guard | — | — | 01–05 |
| M2 | Fake edges in our own prose | the composition order, and the payload on every arrow | M1 | the checker's wording, so the two doctrines do not contradict | 06 |
| M3 | The launcher's convergence | a measurement, then a fix if it earns one | — | — | 07 |
| M4 | Shape declared per member | eight statements | M1 | the vocabulary M1 settles | 08 |
| M5 | Scratch paths per run | two suites that can overlap safely | — | — | 09 |
| M6 | The id register | reservation that works, or a config that stops claiming | — | — | 10 |
| M7 | The documents' graph | a duplication check, two detectors | — | — | 11, 12 |
| M8 | The orchestrator split | a body under budget | M7 | the duplication check, which is what decides where the split lands | 13 |
| M9 | The lagging pins | two pointers moved | M1–M8 | the final version set the release will carry | 14 |
| M10 | Close-out | release, docs, acceptance, retro | all | green suites and committed docs | 15 |

**The walking skeleton is M1**: it is the only module the other doctrine modules cite, and
if its wording is wrong, M2 and M4 inherit the error.

## Carry-over ledger

| # | What | Home |
|---|---|---|
| C-1 | **B-51** — the code graph needs an LLM key on this machine. No code decides it | Human steps |
| C-2 | **G-8** — barrier versus pipeline. Rejected: no concurrency to buy it | rejected, recorded |
| C-3 | The squash subject on `task-pipeline` `main` says v1.56.0. Rejected: force-pushing `main` after a live collision is the larger risk | rejected, recorded |
