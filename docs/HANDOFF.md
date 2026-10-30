# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-10-28 the board's second pass (1.82.0)

**Objective (operator, 2026-10-27/28, «доделай все сам», «до конца»):** the open rows left after
1.81.0, plus the waits. **Done:** 17 rows closed (B-262, B-263, B-264, B-265, B-266, B-267, B-270,
B-274, B-275, B-277, B-285, B-287, B-288, B-289, B-290, B-299, B-300) with receipts in the
[backlog](evidence/backlog.md); new rows B-291 to B-300 filed. Members released: super-ux 0.66.3,
sheleg-design 1.66.5, sheleg-dev 0.16.3, make-skill 0.33.5, agent-stack 0.31.4, agent-sync 1.23.4.
Machine: disk was 5.6 GB free, so `cleanupPeriodDays` went to 14 (backup in
`~/.sshlg-skills/backups/`), the sweep ran (`~/.claude/.last-cleanup` 2026-10-27T22:05Z) and it
is back at 90; the Linux test image was removed. At the operator's request every active session
(38) and 48 board projects were told on 2026-10-28 03:23 UTC that there are no limits and to
continue (board threads `63a6ff24`, `9704470c`, `86fdf06b`, `3eb48d1c`).

**1.82.0 shipped and read back:** PR #284 (CI 40637629476 success), merge `336afb5b`, tag
`v1.82.0`, release run 40638000970 success, npm 1.82.0. `npx --yes sshlg-skills@latest update`: all
11 Claude members verified; Codex partial because a Codex process was running (its family plugins
deferred, receipt under `~/.sshlg-skills/codex-deferred/`).

**Waits and gates:** Codex catch-up (family plugins deferred while the ChatGPT app's Codex runs;
move them when it is closed, backup of `~/.codex/config.toml` first); B-231 (fabric-vr enrolls
itself, thread `e23891ab`); B-294 (dead Claude local records: the printed remedy needs every
Claude Code session closed); stage 8 of 1.81.0 on or after 2026-10-28T19:40Z and of 1.82.0 24
hours after its tag; human gates B-29, B-146, B-232, B-271, B-276.

**1.83.0 (third pass):** B-200, B-291, B-292, B-293, B-295, B-296, B-297, B-298 closed; members
web3d-dev 0.2.6 and xr-dev 0.4.5; 18 rows open. Card:
[`2026-10-28-v1830-release-impact.md`](evidence/specs/2026-10-28-v1830-release-impact.md).

**1.84.0 (fourth pass):** B-261, B-268, B-286, B-302, B-303, B-305, B-306, B-309 closed; members
xr-dev 0.4.6 and web3d-dev 0.2.7; 15 rows open. Card:
[`2026-10-28-v1840-release-impact.md`](evidence/specs/2026-10-28-v1840-release-impact.md).

**2026-10-29:** stage 8 of 1.81.0 to 1.84.1 read held; task-pipeline 1.102.4 (B-310) and agent-sync
1.23.5 (B-311) released and pinned in 1.84.2, merged to `main`. **Not tagged yet: B-318.** npm rejects
the `NPM_TOKEN` secrets of ten packages (agent-sync 1.23.5's publish failed twice, run 40868769971),
and the hub's own token dates from the same day, so a 1.84.2 tag would publish nothing. Human gate:
npm trusted publishing per package (B-318 lists them). Next action once it is set: delete the
`NPM_TOKEN` secrets, re-run agent-sync's failed publish job, tag `v1.84.2`, watch it, `update`.

**1.84.1 (Windows install report):** B-312 (POSIX checks skipped on Windows) and B-313 (a run
without a terminal decides nothing; `install --routers yes|no`) closed; B-314 to B-316 filed.

**Exact next bounded task:** stage 8 of the 1.81.0 card after 2026-10-28T19:40Z, then of 1.82.0,
1.83.0 and 1.84.0 after their windows; then the highest open board row (B-280, B-284, B-310, B-311).

## Previous: 2026-10-27 the hub board closed in waves (1.81.0)

**Objective (operator, 2026-10-27, «до конца сам делай все»):** close every open board row with
no human gate. Plan and wave cut: [board waves](evidence/specs/2026-10-27-board-waves.md).

**Done:** 31 rows closed (B-84, B-184, B-185, B-188, B-190, B-198, B-199, B-206, B-209, B-211,
B-214, B-216, B-217, B-218, B-221, B-222, B-224, B-226, B-227, B-228, B-229, B-230, B-233, B-236,
B-238, B-239, B-240, B-241, B-243, B-246, B-258) with receipts in the
[backlog](evidence/backlog.md); findings filed as B-259 to B-290, nine closed in the same release.
Members released for it: task-pipeline 1.102.3 (PR #159), agent-sync 1.23.3 (PR #47), make-skill
0.33.4 (PR #50), seo-aeo-audit 0.32.4 (PR #69). Outside this repository: the private app repository
enrolled (`aa32b25e` on its `main`); two orphaned submodule worktrees moved to
`~/.sshlg-skills/orphaned-worktrees/2026-10-27/` (every file in remote history) and
`domains --apply` read back; the shared lesson index rebuilt (0 shareable lessons); the clone list
kept local at `~/.sshlg-skills/reports/2026-10-27-duplicate-clones.json`.

**Decisions:** B-239 removal left to the operator (his cleanup rule forbids deleting Git-tracked
files across `~/DATA`); B-233 seeding handed to the owning projects; Gemini hook adapter parked
until the host (Gemini CLI or Antigravity CLI) is chosen (B-280).

**1.81.0 shipped and read back:** PR #282 (CI 40569905268 success; the first run caught a lock
identity that Linux's inode reuse defeated, fixed in `f2afaf3c`), merge `107d7c1a`, tag `v1.81.0`,
release run 40570684663 success, npm 1.81.0. `npx --yes sshlg-skills@latest update`: 33 of 33 steps,
all 11 Claude members verified; the routing block in `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` and
the new `~/.zcode/AGENTS.md` has 0 em dashes; `lib/router-texts.js` retired; Claude pin
transactions 48 to 6. Result PARTIAL only because Codex was running: task-pipeline, agent-sync,
make-skill and seo-aeo-audit are deferred in Codex (receipt under `~/.sshlg-skills/codex-deferred/`).

**Waits:** Codex catch-up: when no Codex process runs, move the four deferred plugins to their pins
(`codex plugin marketplace remove/add --ref v<ver>`, then `codex plugin add`, backup of
`~/.codex/config.toml` first) and read back; no watcher. B-231, fabric-vr runs `enroll` itself (no JDK here for its pre-push gate; board thread
`e23891ab`, request `3fb622c5`); no watcher. Stage 8 of the 1.81.0 card on or after the tag plus 24
hours. Human gates: B-29 (confirmation), B-146 (Gemini sign-in), B-232 (decision), B-271 (sending
the Orca ask), B-276 (Cursor and Codex sign-in for live probes).

**Exact next bounded task:** stage 8 for
[`2026-10-27-v1810-release-impact.md`](evidence/specs/2026-10-27-v1810-release-impact.md) 24 hours
after the tag; then the highest open board row (B-265, B-268, B-289 and B-200 lead at P 1.0).

## Previous: 2026-10-26 the remaining tails of the context audit (1.79.1, 1.80.0)

**Objective (operator, 2026-10-26, «давай доделаем»):** close what the context audit left open:
the duplicate copylot registration, B-257, and stage 8 of the 1.79.0 card when its window ends.

**Done:** `copylot-cloud` removed from the user-scope Claude Code config
(`claude mcp remove copylot-cloud -s user`, private backup under
`~/.sshlg-skills/backups/claude-json-before-copylot-cloud-removal-*.json`): copylot-agent's own
handoff says the local `copylot` (127.0.0.1:8793) is the cloud's edge with no database of its own,
so both reached one service; `claude mcp list` reads `copylot` Connected and its
`/.well-known/fabric-service` reads ready, degraded []. Answer on board thread 18a30fdb.
B-257 closed: make-skill 0.33.3 pinned here (1.79.1).

**Shipped and read back:** make-skill v0.33.3 tagged on `faabd126`, release run 40262515892
success; hub v1.79.1 tagged on `ee67e1de`, release run 40263572040 success, npm 1.79.1;
`npx --yes sshlg-skills@latest update` verified all 11 Claude members and deferred Codex
make-skill (generation safety), so it was moved by hand with Codex closed (backup
`~/.sshlg-skills/backups/codex-manual-2026-10-26-0429`); the installed `SKILL.md` in Codex and
Claude hashes the same as the tag (`182311e7758c2bee`).

**Then (operator, «доделай»):** the context-related board rows closed in 1.80.0: B-212 (`context`
checks Codex's cap against the project chain, not the global file, read from Codex 0.163's source),
B-205 (Goose named in `visibility`), B-234 (already name-only by B-254), B-235 (`warp` plugin disabled,
Warp not installed; settings backup `~/.sshlg-skills/backups/claude-settings-before-warp-disable-*`).
Card: `docs/evidence/specs/2026-10-26-v1800-release-impact.md`.

**1.80.0 shipped and read back:** tagged on `085ff07f`, release run 40270413186 success, npm 1.80.0;
`npx --yes sshlg-skills@latest update`: 11 of 11 steps green, every Claude member verified, Codex 9 of 9
family plugins at their pins (0 deferred); `npx sshlg-skills@1.80.0 context` in this repository exit 0
with project rows; `visibility` prints `cannot hide on goose`.

**Then B-237 (retro floors):** sheleg-design-skill (58,392 to 8,544 B, PR #61) and super-ux (16,476 to
6,555 B, PR #62) migrated with `retro_budget.py`, rows the tool mis-shortened rebuilt from the verbatim
archive; fabric, research-agent, nicegramappbot and mobile-publisher-agent told on board thread fb5d5d5b;
the tool defect is B-258 (owner task-pipeline).

**2026-10-27 (operator, «проверь пул реквесты и доску»):** stage 8 read for 1.79.0 and 1.79.1, both held
(Outcome sections in their cards). The operator's one-approval decision (board thread `d9cc16e8`, 2026-10-26)
adopted in `docs/working-rules/cross-repo-handoff.md`, the only hub rule that said a board message is never an approval.

Stage 8 for 1.80.0 read at 2026-10-27T04:43Z: held (Outcome in its card).

**Exact next bounded task:** the highest open board row in `docs/evidence/backlog.md` (context-related: B-236,
hook cost; then the P 2.0 rows B-214, B-184, B-162, B-146, B-84). B-258 waits on task-pipeline.

## Previous: 2026-10-26 family descriptions within 300 characters (1.79.0)

**Objective (operator, 2026-10-25):** finish the context audit: move the deferred Codex plugins,
close both release cards, ask copylot-agent about its duplicate registration, trim every family
description to about 300 characters with the trigger suites as the guard; the routing block stays.

**Done:** Codex plugins on their pins (2026-10-25T20:26Z, backup under
`~/.sshlg-skills/backups/codex-manual-2026-10-25-2126`); stage 8 held for task-pipeline v1.102.0
and hub v1.78.0; eleven member patch releases and their pins here (B-255 closed; B-256 closed by
operator decision; B-257 opened for make-skill's canon).

**Open:** copylot-agent has not yet answered why `copylot` and `copylot-cloud` are both
registered (board thread 18a30fdb, asked 2026-10-25T20:28Z); the operator wants the duplicate
removed if nothing depends on it.

**Shipped and read back:** v1.79.0 tagged on `7064d2b3`, release run 40255202605 success, npm
1.79.0; `update` verified all 11 Claude members; Codex moved to the new pins at 2026-10-26T02:52
(backup `~/.sshlg-skills/backups/codex-manual-2026-10-26-0252`); a fresh `claude -p ok --debug`
logged `Skill listing over budget: 131 skills, 47297 chars` (61,725 before 1.78.0, 51,178 after it).

**Exact next bounded task:** on or after 2026-10-27T01:43Z, stage 8 for
`docs/evidence/specs/2026-10-26-v1790-release-impact.md`; the copylot answer on board thread
18a30fdb; then B-257.

## Previous: 2026-10-24 context audit: where always-loaded text exceeds what is needed (1.78.0)

**Objective (operator, 2026-10-24):** check every project, agent, file and skill for text that
costs more tokens than needed, and optimize where we can.

**Measured** (agent-stack `agent-harness/references/instruction-budget.md` and its
`instruction_budget.py`; local budget 40,000 characters for a project's always-loaded chain,
32,768 bytes for an AGENTS.md because Codex truncates project docs above it silently):
- Claude's skill listing: 132 entries, 61,725 characters against a 30,000 budget (debug log
  2026-10-24). Fixed in part here (B-254); the rest is B-255. The routing block, 15,410
  characters in each of five host files, is B-256.
- Project instruction files over budget. Done in the operator's own repositories:
  `ssheleg/nicegramappbot` PR #6 (chain 262,677 to 21,588 characters, lossless line check),
  `ssheleg/x-pay-crypto-processing` PR #61 into the branch of its open PR #56
  (`feat/agent-native-settlement`, CLAUDE.md 155,586 to 34,662 bytes; main was already 8,323
  and gets the split when #56 merges) and `ssheleg/vitrual-phone-number-bot` PR #7 (68,189 to
  19,324 bytes; its size test now caps CLAUDE.md at 40,000 characters). Each moved rules
  verbatim into reference files behind explicit load triggers and passed a line-by-line
  lossless check.
  Given to the owning projects as Fabric board findings (2026-10-24): nicegram-ad-manager-bot
  (CLAUDE.md 181,363 characters), nicegram-business (AGENTS.md 53,428 bytes, Codex truncates),
  sasai (60,405), project-observatory-open-source (AGENTS.md 40,488 bytes), and copylot-agent
  (two MCP registrations repeat 2,400 characters of instructions). Not on the board:
  checkmydata-ai (136,051) and the PROWL-AI repositories (prowl-app 51,904). Third-party
  checkouts (claude-skills, openclaw) are left alone.

**Shipped and read back:** v1.78.0 tagged on `9a9b25bc`, release run success, npm 1.78.0;
`update` verified all 11 Claude members (Codex deferred: a Codex process is running);
`visibility --apply` wrote 22 name-only values; a fresh `claude -p ok --debug` then logged
`Skill listing over budget: 132 skills, 51178 chars > 30000 budget` (was 61,725).

**Stage 8 closed 2026-10-25:** the card's Outcome is `held` (release green, npm 1.78.0, update
verified, no issue, no alert). Codex plugins moved to their pins at 2026-10-25T20:26Z after the
operator closed Codex. nicegram-ad-manager-bot and copylot-agent acted on their findings
(CLAUDE.md 199,620 bytes to 38,380 characters; MCP instructions 2,836 to 1,361 characters).

**Exact next bounded task:** the operator decided on 2026-10-25: B-255 (a) family descriptions
to a budget near 300 characters with the trigger suites as the guard; B-256 as milestone M4
(compress the routing block, each wording change shown before adoption).

## Previous: 2026-10-24 releases with users carry an impact card (1.77.0)

**Objective (operator, 2026-10-24):** work through open pull requests and pending work and ship
updates; and every release in any project assesses its effect on current users, with tracking,
alerting and a rollback or hotfix plan.

**Done:** task-pipeline 1.102.0 (the release impact card; v1.101.2 was not tagged, its content
ships here); member releases of everything merged since their tags; B-253 and #267 fixed here
with tests and probes; agent-stack #56 and seo-aeo-audit #56 closed in their 0.31.x releases.

**Exact next bounded task:** after merge, tag `v1.77.0`, watch the release, `npx --yes
sshlg-skills@latest update`; stage 8 for task-pipeline's v1.102.0 card (read its signals for
24 hours, add the Outcome); move the deferred Codex plugins when Codex is idle.

## Previous: 2026-10-23 milestone M3, gates that cannot lie (1.75.0, 1.76.0)

**Objective (operator, 2026-10-22):** show the decisions that are the operator's, then the next
stage. The operator decided B-247 (keep history), B-248 (remove the site section), B-180 (star
line opt-in, off) and B-249 (land the bridge). [M3 plan](runs/2026-10-23-milestone-m3.md), exit
checks X1 to X4.

**Wave 1 (this release):** B-223 (a host self-update inside a command substitution is refused,
with the remedy) and B-250 (a long token is not a placeholder by accident) closed with tests;
B-247 closed by decision; B-253 filed.

**Waves 2 and 3 (1.76.0):** task-pipeline 1.101.1 pinned (B-153); `member-gate/family_gate.py`
copied into all eleven members' gates (B-108, B-109); the star line opt-in, off (B-180); the
private asset agent off the public site, SCN-004 retired (B-248); the MCP schema bridge landed
(B-249). agent-stack #50 closed as superseded by its #51. Filed on the way: B-155 and B-156 in
task-pipeline (a validator section-date rule, a cleanup race).

**M3 is done** (exit checks X1 to X4 green, read 2026-10-23, recorded in the
[M3 plan](runs/2026-10-23-milestone-m3.md#exit-checks-read-2026-10-23-m3-is-done)).

**1.76.1 (2026-10-23):** the two open issues closed through member releases: agent-stack 0.31.0
(#56, the support quality standard) and seo-aeo-audit 0.31.1 (#56, URL Inspection token refresh);
agent-stack PR #50 closed as superseded. No open PR or issue remains in the family.

**Exact next bounded task:** plan M4 with the operator from the doctrine rows at the top of
task-pipeline's board (priority 7.0) and this board's B-253; operator decisions still open:
sheleg-design B-004, B-29, B-146.

## Previous: 2026-10-22 milestones M1 and M2, the design-review gate (1.74.0 to 1.74.2)

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

**Open:** B-188 (Codex payload retention boundary) stays open; B-210 was re-measured on the
1.74.2 install and closed. Operator decisions waiting: B-29, B-146, B-180, B-247, B-248, B-249, and
sheleg-design B-004.

**1.74.1 (same day):** the 1.74.0 install failed xr-dev on a linked git worktree's local scope
(B-251, closed); the planner now leaves such a record as recorded.

**1.74.2 (same day):** the 1.74.1 install verified every Claude scope but called an unread
Codex green (B-252, closed): a Codex read now has 120 s and an unread one makes the run PARTIAL.

**M1 is done** (exit checks E1 to E5 green, read 2026-10-22, recorded in the
[M1 plan](runs/2026-10-22-milestone-m1.md#exit-checks-read-2026-10-22-m1-is-done)); M2 is complete.

**Exact next bounded task:** re-prioritise the open board rows (hub 49, task-pipeline, sheleg-design
and seo-aeo-audit hold most of the rest) with the operator, take the operator decisions listed
above, and plan the next milestone with its own exit checks.

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
