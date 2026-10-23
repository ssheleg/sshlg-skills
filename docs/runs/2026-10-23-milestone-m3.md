# Milestone M3: gates that cannot lie (2026-10-23)

**Operator, 2026-10-22:** "давай какие решения надо покажи и дальше след этап". After M1 (a
clean baseline, [`2026-10-22-milestone-m1.md`](2026-10-22-milestone-m1.md)) and M2 (subscription
growth, [`2026-10-22-m2-subscription-growth-plan.md`](2026-10-22-m2-subscription-growth-plan.md)),
the next stage takes the open rows where a gate can report something untrue or let a security
defect through, plus the operator's four decisions of 2026-10-22. M3 adds no features.

## The operator's decisions (2026-10-22)

| Row | Decision | Where it lands |
|---|---|---|
| B-247 | Dated records and git history keep their private names; new records are written without them. No history rewrite, no force-push | closed on the board by this decision |
| B-248 | The site's Asset Foundry section is removed, with its table row, llms line, fact and scenario | wave 3 |
| B-180 | The routing block's star line becomes opt-in, off by default | wave 3 |
| B-249 | `codex/harness-acceptance-20261017` lands through a pull request with its test | wave 3 |

Still the operator's: sheleg-design B-004 (`orchard`: the slab stack becomes the signature
element, or the pack stays `core`), B-29 (a person confirms task-pipeline REQ rows), B-146 (sign
in to Gemini CLI, then the discovery readback is repeated).

## The limiter: M3 is done when these exit checks are green

| # | Exit check | How it is read |
|---|---|---|
| X1 | B-223 and B-250 closed, each with a test that was red before the fix | the hub's `npm test` on the released tag; the rows' evidence |
| X2 | B-108, B-109 (hub) and B-152 (task-pipeline, renumbered B-153) closed the same way | B-153 on task-pipeline's released tag; B-108 and B-109 in each member's gate on `main` (a test file, no shipped payload, so no member release; the hub compares pinned copies by hash as members release) |
| X3 | B-248, B-180 and B-249 done as decided; B-150 decided | the site build and `test/site_test.js`; the routing block preview; the merged bridge with its test |
| X4 | `npx --yes sshlg-skills@latest update` reads all green for Claude and Codex after the last pin | its closing lines on this machine |

**Budget:** three waves; at most two sub-agents at once; one release per repository per wave.
Every other finding becomes a board row with its evidence and never extends M3. If the budget is
spent first, M3 stops and hands back what is open, with the numbers.

## The waves

**Wave 1, security (hub):** B-223 (the hygiene guard lets a host self-update run from inside a
command substitution) and B-250 (the labelled-secret detector drops a long token that happens to
spell a placeholder word). One hub release.

**Wave 2, gate honesty:** B-108 (the board-parse check read one board of nine), B-109 (the
tag-reachability guard sits in every member's `release.yml` and in none of their gates), B-152
(task-pipeline's release-gate hook refused a read-only command as an outward act).

**Wave 3, the operator's decisions:** B-248, B-180, B-249, and B-150 (task-pipeline's two fw07
branches: delete once PR #128's links point at `refs/pull/<n>/head`).

## Exit checks, read 2026-10-23 (M3 is done)

| # | Result | Evidence |
|---|---|---|
| X1 | green | B-223 (a host self-update inside a command substitution refused, with its remedy) and B-250 (a long token is not a placeholder by accident: 0 of 130,000 random JWTs missed, 36 of 20,000 before) shipped in 1.75.0, each with tests red before the fix |
| X2 | green | B-153 shipped in task-pipeline 1.101.1; B-108 and B-109: `member-gate/family_gate.py` runs in all eleven members' gates with `--self-test` (the last, task-pipeline, through #147), and the hub compares pinned copies by hash (seo-aeo-audit 0.31.0's copy is identical) |
| X3 | green | B-248, B-180 and B-249 shipped in 1.76.0 as the operator decided; B-150 closed (both fw07 heads equal `refs/pull/123/head` and `refs/pull/124/head`; branches deleted) |
| X4 | green | `npx --yes sshlg-skills@latest update` on 1.76.0: exit 0, "11 of 11 steps, all green", Claude verified, Codex "9 already at it ... 0 deferred ... overall current" after two Codex plugins were moved to their new pins by hand (no Codex process running; config backed up under `~/.sshlg-skills/backups/codex-manual-2026-10-23-1760/`) |

**Budget used:** three waves, at most two sub-agents at once. task-pipeline needed two releases in
M3 waves (1.101.1, and its release run's first attempt failed on B-156, a cleanup race fixed in
#147). Found on the way and filed: B-253 (hub, `executablePart()` drops text the shell would run),
B-155 (task-pipeline, a dated first Closed bullet exempts the section). Another session released
hub 1.75.1 (seo-aeo-audit 0.31.0) in parallel; 1.76.0 carries both. agent-stack #50 was closed as
superseded by its #51.

## After M3

Candidates for M4 are the doctrine rows at the top of task-pipeline's board (priority 7.0: the
run's working language, probes that go stale or report their environment, the stage-10 coverage
template). They are larger and need their own plan.
