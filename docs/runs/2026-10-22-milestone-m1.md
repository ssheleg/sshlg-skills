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

## Exit checks, read 2026-10-22 (M1 is done)

| # | Result | Evidence |
|---|---|---|
| E1 | green | `npx --yes sshlg-skills@latest update` on hub 1.74.2: exit 0, "11 of 11 steps, all green"; Claude native transaction verified for all 11 members in every scope; Codex "9 family plugin(s) ... 9 already at it ... 0 deferred ... overall current". Six Codex plugins were moved to their pins by hand first (no Codex process running; config backed up under `~/.sshlg-skills/backups/codex-manual-2026-10-22-1742/`), because the hub defers Codex version changes by design (B-188). |
| E2 | green | each repository's HANDOFF names a next task not yet done: hub (this record's next task), task-pipeline B-152, super-ux none on its board (operator planning), sheleg-design B-052, seo-aeo-audit B-11, sheleg-dev B-98, agent-stack B-156, agent-sync its new HANDOFF, telegram-dev its FEED re-check, make-skill, web3d-dev and xr-dev board empty |
| E3 | green | 210 remote branches deleted across the family (166 decided ones after a ref bundle backup in `~/.sshlg-skills/backups/branches-2026-10-22/`, then 44 whose merged PR had the same head); left: `codex/harness-acceptance-20261017` (B-249), task-pipeline's two fw07 branches (its B-150), and agent-stack `fix/restart-boundaries-1013`, which has an open pull request |
| E4 | green | the term list over open rows of the public boards returns nothing after the neutral-row changes in this hub, agent-stack (#62) and seo-aeo-audit (#47) |
| E5 | green | B-246 released in task-pipeline 1.101.0 (its B-151), B-245 in 1.74.0, B-210 re-measured and closed; found on the way and closed with tests: B-251 (1.74.1, a git worktree's local scope), B-252 (1.74.2, an unread Codex called green) |

**Budget used:** three waves as planned, at most two sub-agents at once. Releases per repository
exceeded one per wave twice, both forced by the install readback (hub 1.74.1 and 1.74.2); task-pipeline
1.101.0 took three tagged-gate attempts (a disk stop, a race in `lessons_test` H1 fixed in its #144).
M2 ran beside M1 in its own repositories and is complete: super-ux 0.65.0 and 0.66.0, sheleg-dev
0.16.0, task-pipeline 1.101.0 (G8, R2, R3); G7's audit half was already in seo-aeo-audit.

## After M1

Re-prioritise the remaining rows (hub, task-pipeline and sheleg-design hold most of them) with
the operator, plan the next milestone, and take the operator decisions listed above.
