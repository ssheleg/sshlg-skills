# Board waves, 2026-10-27

Operator, 2026-10-27: «до конца сам делай все» over the open rows of
[the backlog](../backlog.md). Run: `task-pipeline waves` (stages 0 to 4 once, 5 to 8 per wave,
9 and 10 at the release). Retro floor read at stage 0: 6,621 bytes, budget 12,000.

## Out of scope (human or external gate)

| Row | Gate | Owner |
|---|---|---|
| B-29 | confirming shipped REQ rows is the operator's | operator |
| B-146 | Gemini sign-in | operator |
| B-232 | whether partner and employer repositories join | operator |
| B-162 | `claude plugin enable --scope local` writes nothing | Claude Code upstream |

B-258 is not excluded after all: it shares `retro_budget.py` with B-246 and joins wave 4.

## Waves

Each wave lands on `main` through one PR with `npm test` green; the release is tagged after the
last wave. Nodes in one wave own disjoint files, or merge at distinct hunks.

| Wave | Seam | Rows |
|---|---|---|
| 1 | CLI surface, visibility and host reports | B-198, B-214, B-221, B-216, B-243, B-218 (CLI items) |
| 1 | storage retention and concurrent writes | B-224, B-199, B-227, B-228 |
| 2 | hooks | B-236, B-240, B-241, B-218 (hook items), B-209 |
| 3 | instruction text and routing | B-226, B-206, B-217, B-84, B-229 |
| 4 | family members | B-246 and B-258 (task-pipeline), B-211, B-222 |
| 5 | estate and other repositories | B-184, B-230, B-231, B-233, B-238, B-239, B-200, B-185, B-188, B-190 |

Exit criteria per wave: every row closed in the backlog with a receipt (a test name, a command
with its exit code, or a commit), or parked with its owner and reason; `npm test` green; no
regression in the suites the wave touched.

## Outcome

Filled per wave below.
