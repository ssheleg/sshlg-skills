# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-10-22 milestones M1 and M2, the design-review gate (1.74.0 to 1.74.2)

**Objective (operator, 2026-10-22):** a mandatory design-review agent in every pipeline (ten
user portraits, Figma or mockups then the build, a browser the operator chose, load and window
limits, everything it opened closed); agents that move in bounded, checkable iterations; then
bring the family to a clean baseline (milestone M1) and strengthen the product, marketing and
UI/UX skills from GP Bullhound's subscription report (milestone M2).

**Plans and their limiters:** [M1](runs/2026-10-22-milestone-m1.md) (exit checks E1 to E5,
three waves, two sub-agents at most) and [M2](runs/2026-10-22-m2-subscription-growth-plan.md)
(gaps G1 to G10, rules R1 to R4, three waves).

**Done:** task-pipeline 1.100.0 and 1.101.0, super-ux 0.64.0 to 0.66.0, sheleg-dev 0.16.0, all
pinned here; B-245 fixed here; every HANDOFF names a live next task, and agent-sync has one;
166 decided remote branches deleted after a ref bundle backup, three kept with board rows
(B-249 here); merged worktrees removed; private project names out of open board rows. G7's
audit half was already in seo-aeo-audit, so no release was owed there.

**Open:** B-188 (Codex payload retention boundary) stays open; B-210 is re-read on this
release's install. Operator decisions waiting: B-29, B-146, B-180, B-247, B-248, B-249, and
sheleg-design B-004.

**1.74.1 (same day):** the 1.74.0 install failed xr-dev on a linked git worktree's local scope
(B-251, closed); the planner now leaves such a record as recorded.

**1.74.2 (same day):** the 1.74.1 install verified every Claude scope but called an unread
Codex green (B-252, closed): a Codex read now has 120 s and an unread one makes the run PARTIAL.

**Exact next bounded task:** after merge, tag `v1.74.2`, watch the release, `npx --yes
sshlg-skills@latest update`, read the install back (Claude every scope, Codex `overall
current`) and record M1's exit checks in the M1 plan; then re-prioritise the board with the
operator.

## Previous: 2026-10-22 leak sweep and Codex catch-up (1.73.2)

**Objective (operator, 2026-10-22):** no active Codex sessions should hold the family back,
and no private project names may appear in the skills.

**Codex:** no Codex process was running (`ps` showed none), so the nine family plugins were
moved to their pins by hand: `codex plugin marketplace remove`, `add <repo> --ref v<pin>`,
`codex plugin add` (config backed up first under `~/.sshlg-skills/backups/`). The updater now
reports Codex `9 already at it ... 0 deferred ... overall current`.

**Leak sweep:** 12 public repositories scanned for private project, product and repository
names, the operator's paths and addresses. Shipped skills cleaned in five member releases and
this one (see CHANGELOG v1.73.2). Left, each with a board row: dated records and history
(B-247), the site's Asset Foundry announcement (B-248), and two shipped mentions that ride the
next releases of super-ux (Copylot in `copywriting`) and task-pipeline (a comment citing a
private repository).

**Exact next bounded task:** after merge, tag `v1.73.2`, watch the release, `npx --yes
sshlg-skills@latest update`; then the design-review agent (operator, 2026-10-22) in
task-pipeline and super-ux, carrying those two shipped mentions; then the project review.

## Previous: 2026-10-22 pin task-pipeline 1.99.1, retro floor migrated (B-244, 1.73.1)

**Objective (operator, 2026-10-21):** finish the open units to the end: B-244, task-pipeline's
retro migration could not read this repository's retro, so stage 10's byte budget could never pass.

**Done:** task-pipeline 1.99.1 (PR ssheleg/task-pipeline#139, squash `5974fb4`, CI run
39692469477 green; its B-149) reads a numbered-list floor and list stamps. This repository's
retro migrated with it: 103,737 to 6,446 bytes, then 6,621 with this run's stamp (the first live
rotation); `retro_budget.py verify` and `check` exit 0. Pin, `skills.json`, README row and
`claude-plugin-pins.json` at 1.99.1; package 1.73.1. B-244 closed; B-246 filed.

**Released and installed (2026-10-22):** task-pipeline tag `v1.99.1` on `5974fb4` (release run
39699028230, jobs release and publish succeeded; `npm view task-pipeline-skill version` 1.99.1).
Hub PR #252 merged as `cdf74bdb`, tag `v1.73.1`, release run 39708518945 succeeded,
`npm view sshlg-skills version` 1.73.1. `npx --yes sshlg-skills@latest update` verified
task-pipeline at 1.99.1 (`5974fb4`); the installed `retro_budget.py` hashes equal to the tag's and
its `check` exits 0 on this repository's retro (6,621 bytes). The run ends `result PARTIAL`
because Codex still defers 9 plugins (`DEFERRED_ACTIVE_GENERATION_SAFETY`); web3d-dev's alias
record stays at 0.1.4 by design (B-243).

**Exact next bounded task:** B-246 in task-pipeline (merge the rotation pointer lines into one
per archive quarter), then B-237: migrate the over-budget retro floors in the five repositories it
names with task-pipeline 1.99.1's `retro_budget.py migrate --write`.

## Previous: 2026-10-21 pin task-pipeline 1.99.0 (1.73.0)

**Objective:** task-pipeline released 1.99.0 (tag `v1.99.0` on `a33e00b`, release run
[39624036615](https://github.com/ssheleg/task-pipeline/actions/runs/39624036615), npm
`task-pipeline-skill@1.99.0`); `update` installs the hub pin, so the release reaches machines
only through this pin (CONTRIBUTING: a member release lands in two places).

**Done:** submodule `skills/task-pipeline` and `skills.json` at `a33e00b` / 1.99.0, the README
row, `claude-plugin-pins.json` regenerated (`node scripts/sync-claude-pins.js --write`), the
ctx-04.06 receipt re-emitted, package 1.73.0, B-245 filed (an orphaned `<pid>.tmp.<hex>` lease
marker stopped the first `update` of the day; removing the dead pid's files let the second run
verify).

**Exact next bounded task:** after merge, tag `v1.73.0`, watch the release run, read back
`npm view sshlg-skills version`, run `npx --yes sshlg-skills@latest update` and compare the
installed task-pipeline payload with the 1.99.0 tag; then B-244 and B-237 as below.

## Previous: 2026-10-21 multi-scope Claude repair (B-242, 1.72.1)

**Objective (operator, 2026-10-21):** say what is done and what is left, confirm `main`, the
repository pages and the site carry it, and bring installed skills up to the pins.

**State found:** `main` at `2619be84` (v1.72.0) equals npm `sshlg-skills@1.72.0`; the
`pages` run for that commit succeeded and skills.sshlg.me was last modified 2026-10-20 08:45
GMT; all 11 member pins equal each member's latest GitHub release. Installed on this machine:
8 members at their pins, telegram-dev 0.3.0, xr-dev 0.3.4 and web3d-dev 0.1.4 stuck (B-242),
while `npx sshlg-skills@latest update` printed "11 of 11 steps, all green".

**Done (1.72.1):** the native repair moves a member's user and local scopes in one
transaction, reads each step back and rolls moved scopes back on failure; the update summary
prints `result PARTIAL` instead of "all green" when anything was left. See
[CHANGELOG](../CHANGELOG.md) v1.72.1 and the [verification rows](evidence/verification.md).

**Released and installed (2026-10-21):** PR #249 merged as `4acc48a7`, tag `v1.72.1`; the
`release` run 39622112526 (validate, release, publish) and the `pages` run 39622061783
succeeded on that commit; `npm view sshlg-skills version` reads 1.72.1. On this machine
`npx --yes sshlg-skills@latest update` verified telegram-dev, xr-dev and web3d-dev and ended
`result PARTIAL` (exit 1) because Codex still defers 9 plugins. Readback of
`~/.claude/plugins/installed_plugins.json` against `claude-plugin-pins.json`: every scope of
every member at its pin (telegram-dev 8/8, xr-dev 3/3), except web3d-dev's alias record under
`~/DATA/heygen-hyperframes-vr`, left at 0.1.4 as designed (B-243). Two more
`update --claude-only` runs left the registry, catalogue list and settings hashes unchanged.
A session reload loads the new descriptions.

**Exact next bounded task:** B-244 in task-pipeline (its retro migration reads no standing
rows here, so this repository's 103,737-byte floor cannot meet the 12,000 budget), then B-237.

**Still open from earlier entries:** B-230 to B-233 (per-project seeding from the 2026-10-19
feed review); Codex keeps 9 family plugins deferred at older catalog versions
(`DEFERRED_ACTIVE_GENERATION_SAFETY`, receipt under `~/.sshlg-skills/codex-deferred/`).

## Previous: 2026-10-20 context diet (CONTEXT-DIET-1020)

**Objective (operator, 2026-10-20):** audit every skill, hook, routing block and instruction
file for token cost and loops; cut what is duplicated or loaded without need; fold the
insights of every repository's retrospective into the retro doctrine; run to the end.

**Audits** (read-only, numbers measured on the operator machine): the global `CLAUDE.md` was
50.6 KB (~12.4k tokens); the skill listing filled its 30k budget and 81 of 134 skills showed
no description; a session start injected ~2.4k characters of hook text; task-pipeline asked
for ~194k characters of reading before code and looped through three verifier tiers per
round; 54 retrospectives across ~50 repositories, with stage-0 reading floors up to ~76k
tokens.

**Done in this repository (1.70.1):** the routing block's map lost its duplicate roster table
and the protocol was compacted; the Fabric router lost two platforms' paths; the SessionStart
pointer is half as long and skipped on `compact`/`resume`; seven false delivery routes are
silence fixtures; a gate piped into `tail` and chained into `git` is refused;
`blocks --agent all` installs one source into every host (B-207) and the
`SSHLG:REPOSITORY-HANDOFF` block is retired (B-174). See [CHANGELOG](../CHANGELOG.md) v1.70.1.

**Done outside this repository (private, not published):** the operator rules were compacted
into one `OPERATOR:GLOBAL-RULES` source installed into every host; verbatim originals are kept
as on-demand references beside the other `global-NN.md` files.

**In flight (member repositories, each in its own worktree and released by its own run):**
task-pipeline (proportional run, reading diet, verifier tiers by risk, retro byte budget and
new universal rules), make-skill (description target), agent-sync (one-line start), the
description trims of sheleg-dev, telegram-dev, xr-dev, web3d-dev, super-ux, sheleg-design,
seo-aeo-audit and agent-stack; outside the family, switchboard (10 s start), observatory
(Stop-hook noise) and fabric-agent-adapter (start notes).

**1.71.0:** pins ten re-trimmed members (agent-sync 1.23.0 among them); the family's
descriptions fell from 32,495 to 17,601 characters. Released outside the family by this run:
switchboard 0.6.54 (start hook bounded, 3 s timeout), fabric-agent-adapter 0.38.0 (start
notes only where Fabric is used).

**1.72.0:** pins task-pipeline 1.98.0 (proportional run, reading diet, verifier tiers by
risk, retro byte budget). Outside the family the run also released Observatory Log 0.26.0
(Stop hook counts only this turn's tracked changes; passioncode 0.2.16 pins it).

**Next task it named:** B-242 (closed by 1.72.1 above): make the Claude immutable repair upgrade a member in
every scope it is installed in (telegram-dev, xr-dev and web3d-dev are stuck at their old
versions on this machine); then B-237, migrate the over-budget retro floors in other
repositories with `task-pipeline/scripts/retro_budget.py migrate --write`.

**Previous entry, still open:** the 2026-10-19 feed review left B-230 to B-233 (per-project
seeding: `/seo-aeo-audit brief` plus `/brand-init` in one tier-1 public site, then
`npx sshlg-skills@latest enroll`).

## Archives and evidence

- [2026-10-20 archive](HANDOFF-2026-10-20-archive.md): every entry from 2026-10-11 to 2026-10-19,
  frozen as of commit `cb82183c`.
- [2026-10-09 archive](HANDOFF-2026-10-09-archive.md) and its
  [context research](evidence/context-research/README.md).
- [Instruction context](evidence/instruction-context/README.md) ·
  [knowledge wave 2](runs/2026-10-09-knowledge-wave2.md) ·
  [Sherlock external audit progress](evidence/audits/2026-09-07-sherlock/external-v3/progress.json) ·
  [family hooks audit progress](evidence/audits/2026-09-13-family-hooks/progress.json).
