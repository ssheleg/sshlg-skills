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
| X2 | B-108, B-109 (hub) and B-152 (task-pipeline) closed the same way | each repository's gate on its released tag |
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

## After M3

Candidates for M4 are the doctrine rows at the top of task-pipeline's board (priority 7.0: the
run's working language, probes that go stale or report their environment, the stage-10 coverage
template). They are larger and need their own plan.
