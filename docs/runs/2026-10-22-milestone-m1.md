# Milestone M1: a clean family baseline (2026-10-22)

**Operator, 2026-10-22:** review what was done and what was left, bring the documentation and
planning up to date, then move in waves (one or two sub-agents at most) to the nearest
milestone, and put a limiter in place so it is clear when to stop and no extra work is done.
After M1 the work is re-prioritised and planned; M1 itself adds no features.

Inputs: the read-only estate inventory of 2026-10-22 (12 repositories, 218 open board rows, 54
unmerged branches without a pull request, every release, pin and HANDOFF), the hub board, and
this session's releases.

## Where the family stands

| Area | State on 2026-10-22 |
|---|---|
| Releases | All 12 repositories: `package.json` = latest tag = npm = GitHub release |
| Hub pins | 10 of 11 pins at their member's latest tag; super-ux 0.64.0 and task-pipeline 1.100.0 are pinned by hub 1.74.0 (wave 1) |
| Installed here | Claude: every scope of every member at its pin, except one alias record (B-243); Codex: 9 family plugins at their pins, `0 deferred` |
| Board | 218 open rows: hub 50, task-pipeline 76, sheleg-design 34, seo-aeo-audit 27, sheleg-dev 13, agent-sync 10, agent-stack 5, telegram-dev 3 |
| Branches | 130 squash-merged; of 54 without a PR: 6 landed, 42 superseded, 5 dated records only, 1 with work main lacks (`codex/harness-acceptance-20261017`) |
| HANDOFF | Most "next task" lines name a release that has happened; agent-sync has no `docs/HANDOFF.md` |
| Waiting on the operator | B-29, B-146, B-180, B-247 (history rewrite), B-248 (site section), sheleg-design B-004 |
| Machine | load average up to 104 on 14 cores during this session; 41 Claude and 45 Switchboard processes |

## The limiter: M1 is done when these exit checks are green, and not before or after

| # | Exit check | How it is read |
|---|---|---|
| E1 | Every member's latest tag = its hub pin = what is installed for Claude (every scope) and Codex | `npx sshlg-skills@latest update` reports Claude verified and Codex `overall current`; registry readback |
| E2 | Every repository's HANDOFF current entry names a next task that is not yet done; agent-sync has a HANDOFF | read in each repository's `main` |
| E3 | Every unmerged remote branch has a decision: deleted (merged, superseded, landed, records only, after a ref bundle backup) or kept with a board row | `git branch -r --no-merged origin/main` lists only kept branches, each named on a board |
| E4 | No open board row on a public repository names a private or partner project | the 2026-10-22 term list over open rows returns nothing |
| E5 | The wave-3 defects are closed with tests | their rows closed, gates green, released |

**Budget:** three waves; at most two sub-agents at once (`run.finish.maxAgents`); one release
per repository per wave. **Out of scope by rule:** every other board row, new features,
refactors not named below. A finding outside the scope becomes a board row with its evidence;
it never extends M1. If the budget is spent before every exit check is green, M1 stops and
hands back what is open, with the numbers.

## The waves

**Wave 1: releases and pins.** task-pipeline 1.100.0 (the design-review gate and the agent
budget); hub 1.74.0 pins it and super-ux 0.64.0, and carries this plan; install readback on this
machine (E1).

**Wave 2: truth and hygiene.** Refresh the stale HANDOFF next-task lines and add agent-sync's
HANDOFF (E2); close hub B-225 with the content comparison; collapse task-pipeline B-044 into
B-040; give sheleg-design's six undefined-state rows a status; neutralise private project names
in open rows of public boards (E4); back up all unmerged refs to a bundle, delete the decided
remote branches, file a row for `codex/harness-acceptance-20261017`, and remove worktrees of
merged work (E3).

**Wave 3: the defects that hit every run.** B-246 (each rotation adds a pointer line to the
retro floor), B-245 (an orphaned lease marker stops `update`), and a recheck of B-210/B-188 now
that Codex reports `0 deferred` (E5).

## After M1

Re-prioritise the remaining rows (hub, task-pipeline and sheleg-design hold most of them) with
the operator, plan the next milestone, and take the operator decisions listed above.
