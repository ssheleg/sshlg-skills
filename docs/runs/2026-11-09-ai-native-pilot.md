# The AI-native pipeline's first executed run: the hub's own CLI (pilot 1 of 2)

report: ai-native-pilot · owner sshlg-skills · cut 2026-11-09 · run `2026-11-09-ai-native`, board rows B-329 and
B-331 · design [`../evidence/specs/2026-11-09-ai-native-pipeline.md`](../evidence/specs/2026-11-09-ai-native-pipeline.md)

## Why this subject

The design's §9 asked for one capability task through the new members on a product with no agent
surface. The hub's launcher is a product other people install (npm `sshlg-skills`), it had no
capability layer (B-07 waived the UX chain for it), and a run on it reaches no person outside the
operator's estate, so it could be run to the end without a production gate. It tests the CLI case
(T12 in the design). A product with a live web UI remains pilot 2 (B-329 stays open for it).

## What ran

| Step | What | Evidence |
|---|---|---|
| Stage 0 actor branch | capability change: yes (four launcher capabilities written down, one behaviour fixed); `agent_surface: public` (a CLI on npm); human surfaces: none for the CLI, the public website keeps its v4 human scenarios | this file |
| v4 → v5 migration | `docs/ux/foundation.md` (P-01, P-02 with `Agent use`; actors A-01 coding agent, A-02 nightly job, A-03 routing hook; JTBD-01, JTBD-02; JRN-01 with `Performed by`; ST-001 to ST-004), `docs/ux/capabilities.md` (CAP-01 to CAP-04), `scenarios.md` header `ux-contract v5` and SCN-012 to SCN-014 with `Channel: agent` | `docs/ux/` |
| Lint before | super-ux 0.67.0 `ux_lint.py` on the v4 tree: 0 errors, 2 warnings (U002 id gap; U050 web-surface question asked of a chain with no `screens.md`) | command output in this run |
| Lint after | 0 errors, 1 warning (U002, a retired id kept on purpose); U050 no longer asked under v5 with no `screens.md`; U014 caught ST-004 without a scenario until SCN-014 was written | command output in this run |
| The v5 rules fire on a real tree | a planted CAP-01 (`Tools` misspelt, `Gate: approval` without evidence) raised U087, U090 and U093; restored, the tree is clean again | command output in this run |
| Doctor | `contract v5`; absent `vision.md`, `flows.md`, `screens.md` named, none required | `ux_doctor.py docs/ux` |
| The CLI readiness checklist (agent-interop `references/agent-surface.md` → *CLI readiness*) against the real commands | see findings | probes below |

## Findings

| # | Finding | Evidence | Disposition |
|---|---|---|---|
| PF-1 | `context --json` threw `TypeError [ERR_INVALID_ARG_TYPE]` on any machine with a host read through its fallback (`file: null` passed to `path.resolve`) | `lib/context.js:102` at `07f63523`; exit 1 with a stack trace | **fixed in 1.87.0**: `claudeProjectFiles` skips a non-string; `test/context_test.js` asserts it, red on the old code and green on the fix (both runs read) |
| PF-2 | `list --json` and `toolkit --find … --json` accept `--json`, ignore it, and print text with exit 0: an agent that asked for data gets prose and no signal that the flag did nothing | probes through `bash -c` on 2026-11-09 | **B-331**: a machine form for `list` and `toolkit`, and an unknown flag refused rather than ignored |
| PF-3 | 8 of the launcher's commands advertise `--json`; the reads an agent needs after an update (`list`, `toolkit`) are not among them | `sshlg-skills --help` | B-331 |
| PF-4 | The migration cost was two new files, one header and three scenarios; the ten existing human scenarios needed no edit (no `Channel` reads as human) | `git diff --stat docs/ux` | the design's BN-33/BN-34 hold for this case |
| PF-5 | A measurement trap: in zsh an unquoted `$cmd` is one argument, so the first probe read "unknown command" for every command (hub retro instruction #4 fired) | first probe of this run | the probes were rerun through `bash -c`; the CLI-readiness recipe should probe with an argument vector, a note for agent-stack's next release (B-331) |
| PF-6 | A hook that refuses a compound command refuses all of it: an edit earlier in the same command never ran, and a regression test passed on the old code because it did not exist yet (hub retro instruction #11 fired: the checker, not the subject) | this run | the edit was re-applied alone and the test proven both ways; a retro entry |
| PF-7 | Integration order: a member's CI clones the hub's `main` for its routed-triggers check, and the hub excuses at most four not-yet-advertised words (`PENDING`); so a member that adds triggers needs the hub's routes on `main` first and must keep to four new words per release | agent-stack PR #73; `test/triggers_test.js` "a PENDING excuse" | recorded in the plan and in B-330 |
| PF-8 | The hub cannot pin a member npm never served (`test/check_pins.py`), so a member whose trusted publisher is not set holds the whole family release | agent-stack run 42630613649, super-ux run 42630731244 | B-325, the operator's two clicks |

## The routing rewording (B-330) and its paired evaluation

The block's super-ux and agent-stack texts and cells changed in 1.87.0 (super-ux: "ALL product work
… capabilities and scenarios first … any user, agent and path", cells "what the product must do" /
"a user or agent uses it"; agent-stack: "an agent SYSTEM or a product's agent surface", cell "the
thing being built is an agent, or what agents call"). The registry total fell from 11,750 to
11,745 (`test/context_test.js`); "Update scenarios in the SAME user-facing change" stays, because
`test/router_compaction_test.js` guards it; the super-ux boundary keeps "interface-free migrations".
Earlier wording stays recognisable: `PREVIOUS_LINES` gained the 1.86 super-ux lines,
`PREVIOUS_CELLS` takes a list of rows per router, and `test/no_em_dash_test.js` names the two
routers reworded since 1.80.0 instead of forbidding every rewording.

Paired evaluation (DOCMAP: "A cut still needs the paired routing evaluation"): the block before and
after, each with its table, judged by four fresh Sonnet agents (two per arm, the same shuffled order
of 21 probes: the 13 of `test/evals/routing.json` and 8 AI-native probes). A probe passes when the
wanted router is named, or nothing is named where silence is wanted.

| Run | Before | After | AI-native probes (8) before / after | Old probes (13) before / after | super-ux named on a backend-only migration or a refactor |
|---|---|---|---|---|---|
| 1 | 16/21 | 17/21 | 6 / 7 | 10 / 10 | never |
| 2 | 18/21 | 19/21 | 7 / 8 | 11 / 11 | never |

The difference is +1 in both pairs, all of it on the AI-native probes; the old probes are unchanged.
Absolute rates are not informative (the judges run on a machine whose own instructions carry the
block, `test/evals/README.md`). The arms, probes and scorer are reproducible from this report's
description; the run's files were in the session scratch directory and are not kept.
