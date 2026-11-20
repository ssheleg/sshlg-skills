# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-11-20 release 1.90.7 prepared for `wait-v4`, tag waits on the operator

**Objective:** the open refactor task on the Fabric board (resumed by the board supervisor, no person in the session):
cut the release that ships `wait-v4`, as the previous entry named. **Done:** branch `release/1.90.7` with
`package.json` 1.90.7 and its `CHANGELOG.md` section (B-338, B-276); local `npm test` exit 0 (174 suites, 3574
fixtures). **Not merged and not tagged:** `package.json` on `main` redeploys skills.sshlg.me (`pages.yml`) and the
`v1.90.7` tag publishes to npm (`release.yml`); both are publication, which this unattended run hands to the operator
through a Fabric effect request. **Waits:** the operator's approval of the publication (then merge the release PR, push
tag `v1.90.7`, watch `release.yml`, `npm view sshlg-skills version`, `npx --yes sshlg-skills@latest update`, read
the installed `wait-v4` rule back and close B-338); a Cursor sign-in for B-276; agent-stack's merge and tag of B-162
for B-346. B-347's "Among the routers" trims are left to the operator (decision in its row: B-256's 2026-10-25 choice
to keep the block unchanged). B-276 re-checked 16:20 UTC: `cursor-agent -p` still answers `Authentication required`.
**Next task:** the release once approved (steps above), then B-346 once agent-stack tags B-162 (PR
ssheleg/agent-stack#76 still open).

## Previous: 2026-11-20 wait-v4 carries the relayed operator rules (B-338), paired evaluation +3

**Objective:** the open refactor task on the Fabric board (resumed by the board supervisor, no person in the session):
B-338 with B-347's paired evaluation, as the previous entry named. **Done:** `wait-v4` in `lib/wait-rule-text.js` and
its canonical copy `docs/working-rules/wait-is-not-a-stop.md`: one paragraph (+675 characters) with the five rules
B-338 lists; `wait-v3` kept in `PREVIOUS` so applied rules upgrade in place; the upgrade fixture in
`test/wait_rules_test.js`. Paired evaluation, four situations, one fresh agent per pair: action A 1 of 4, B 4 of 4;
text support A 0, B 4 ([run](runs/2026-11-20-wait-v4-eval.md)). B-347's W1 part moved; its router trims remain. Merged
to `main`, **not released**: a tag publishes to npm, which this unattended run leaves to a session with the operator.
**Waits:** the release of this change (operator session; then `update` and the read-back close B-338); a Cursor sign-in
for B-276; agent-stack's merge and tag of B-162 (PR ssheleg/agent-stack#76 still open) for B-346. **Next task:** cut
the release that ships `wait-v4` (version bump, tag, read the installed rule back), then B-347's "Among the routers"
trims with their own paired evaluation, then B-346 once agent-stack tags B-162.

## Previous: 2026-11-20 B-276 Codex half proven live; Cursor waits on a sign-in

**Objective:** the open refactor task on the Fabric board (resumed by the board supervisor after the Codex usage reset, no
person in the session): the B-276 Codex probe named by the previous entry. **Done:** two `codex exec` runs on Codex
0.169.0 against a scratch `$CLAUDE_CONFIG_DIR/CLAUDE.md` after `hooks install --codex`: without
`--dangerously-bypass-hook-trust` the untrusted hook did not run (the append went through, no copy taken); with it the
guard ran and took its copy before the write, then emitted no decision, which is the designed behaviour (the row's
expectation «the guard must refuse» was wrong). `~/.codex/hooks.json` is back byte for byte. Evidence in the
[B-276 row](evidence/backlog.md). No code changed, no release. **Waits:** a Cursor sign-in (`cursor-agent login`, the
operator's) for the rest of B-276; agent-stack's merge and tag of B-162 for B-346. **Next task:** B-338 with B-347's
paired routing evaluation (B-330's bar, B-336's budget), then B-346 once agent-stack tags B-162.

## Previous: 2026-11-19 1.90.6 read back on the live site; B-346 and B-276 probed, both wait

**Objective:** the open refactor task on the Fabric board (resumed by the board supervisor, no person in the
session): clear 1.90.6's wait, then the next rows. **Done:** pages run on `26fc9feb` green; the live
`https://skills.sshlg.me/skills/agent-stack/` is byte-identical to `node scripts/site.js` built from `origin/main` and
reads in Safari «two tools, search and execute» and «v0.33.3»; `npm view sshlg-skills version` 1.90.6. B-346: the
pinned agent-stack 0.33.3 still advertises only the bare «аудит агента»; its PR ssheleg/agent-stack#76 (0.32.2) is
open and behind `main`, so the hub keeps both `PENDING` entries; a note went to board thread `aacbf0e8` (message
`6e203dad`). B-276: the live probes ran as far as they can today (row in the backlog: Codex hit its usage limit,
Cursor needs a sign-in). **Waits:** Codex usage reset (2026-11-20 11:42 local); agent-stack's merge and tag of B-162;
a Cursor sign-in (the operator's). **Next task:** the B-276 Codex probe after the reset (both runs named in its row),
then B-338 with B-347's paired routing evaluation, then B-346 once agent-stack tags B-162.

## Previous: 2026-11-19 agent-stack 0.33.3 pinned, the site names the two-door rule, hub 1.90.6

**Objective:** the operator's order of 2026-11-19: collect the session's errors into the retro, close the skill side
of the MCP two-door rule and update the site. **Done:** agent-stack 0.33.3 (ledger guard, Fabric contract
DEC-0182), the pin, `skills.json` and README descriptions, the runner's members note, the retro
(`docs/evidence/retro/2026-Q4.md` "2026-11-19 · MCP two doors"). **Waits:** the pages run after merge, then the live
page read in Safari. **Next task:** B-338.

## Previous: 2026-11-18 an uncertain Claude pin transaction recovers itself (B-361), hub 1.90.5

**Objective:** studio-agent's board finding 3eee0210: an uncertain journal wedged `update` in the Mac Studio's
headless `nicegram` space. **Done:** `lib/claude-pinned.js`, `lib/claude-pin-transaction.js`, two tests, B-361
closed. **Waits:** the release run, then the reply in board thread e4616907 with the version. **Next task:** B-338.

## Previous: 2026-11-18 agent-stack 0.33.2 pinned, hub 1.90.4

**Objective:** the agents database decided R28 for the two doors (board thread 1c1524e4): old tool names leave
`tools/list` as `retired` and stay callable. agent-stack 0.33.2 (PR #79, release run 44382448756) carries it and the
`Mcp-Name` header trap; this hub pins it (submodule `2bfb472`, `skills.json`, README, member and Claude plugin pins,
`ctx-04.06`, CLI golden fixture).

**Waits:** board replies on the threads named below (`com.list {unread: true}`).

**Next task:** B-338, then B-276 and B-320, then B-346.

## Previous: 2026-11-18 agent-stack 0.33.1 pinned (MCP two doors), hub 1.90.3

**Objective:** the operator's order of 2026-11-18 in this repository's session: «чтобы везде, когда мы строим MCP,
всегда было только два endpoints ... Search и Execute ... глобально для всех ... передай всем на доску обновления,
абсолютно всем, у кого есть какие-то MCP».

**Done:** agent-stack 0.33.0 (PR ssheleg/agent-stack#77, tag `v0.33.0`, release run 44356954501, npm 0.33.0):
`agent-interop/references/mcp-two-doors.md`, Rule one, pointers, a regression test. The hub validator refused the 0.33.0 pin (member-ledger ratchet), so agent-stack 0.33.1 (PR #78) recorded
the shipped version. Here: submodule at `26b1f72`, `skills.json` and README at 0.33.1, `scripts/sync-member-pins.js --write`, `scripts/sync-claude-pins.js --write`,
`ctx-04.06.json` re-emitted, the CLI golden fixture rewritten, B-360 (the plist comment) fixed and closed, release
impact [`2026-11-18-v1903-release-impact.md`](evidence/specs/2026-11-18-v1903-release-impact.md). Board: request
3257c650 to fabric-agents-database (thread 1c1524e4; a test request 56a11729 sent there by mistake was cancelled),
ab3ecf7e to fabric-agent-adapter, e6e13934 to fabric-agent-contract, announcements in threads 87ea6cd6, 2bbe0f75,
a53c3048 (Appvillis), 9fed30b9 (PassionCode), 8dc19039 and efa92aec. The board refuses a thread joining two
businesses, so the announcement is split by business.

**Released and installed:** PR #322 (`e6c186b6`, CI run 44371497224 green), tag `v1.90.3`, release run 44372737686
success, `npm view sshlg-skills version` 1.90.3. `npx --yes sshlg-skills@latest update` on the operator machine:
33 of 33 steps, PARTIAL only for the Codex native catalog (`DEFERRED_ACTIVE_GENERATION_SAFETY`, every family member,
as before); Claude Code holds `agent-stack/0.33.1` with `skills/agent-interop/references/mcp-two-doors.md`, and the
rewritten `~/Library/LaunchAgents/me.sshlg.skills.update.plist` parses with `plistlib` (B-360).

**Waits:** replies on the board threads above (read with `com.list {unread: true}`).

**Next task:** B-338, then B-276 and B-320, then B-346.

## Previous: 2026-11-18 sheleg-design 1.67.1 pinned, hub 1.90.2

**Objective:** make sheleg-design's `phosphor` pack (1.67.0, PR #65, release run 44280802407) visible: a member
release is invisible until this hub bumps its pin
([CONTRIBUTING](../CONTRIBUTING.md#the-pins-here-are-what-the-family-publishes-whatever-npm-says)).

**Done:** the validator refused the 1.67.0 pin (`1 member ledger(s) describe a version older than they ship
(sheleg-design)`, ratchet 0): 1.67.0 shipped with its ledger headed by 1.66.6. sheleg-design PR #66 recorded the
shipped version (1.67.1, no skill changes), the same shape as its 1.66.2. Here: submodule moved to the v1.67.1
commit, `skills.json` and README at 1.67.1, `scripts/sync-member-pins.js --write` and
`scripts/sync-claude-pins.js --write`, `ctx-04.06.json` re-emitted, the CLI golden fixture rewritten
(`SSHLG_GOLDEN_WRITE=1`, only the three `list` cases move), release impact
[`2026-11-18-v1902-release-impact.md`](evidence/specs/2026-11-18-v1902-release-impact.md).

**Waits:** this release PR's check, the v1.90.2 tag's release run, then `npx --yes sshlg-skills@latest update` on
the operator machine.

**Next task:** B-338 (operator rules into the routing protocol; needs B-347's paired routing evaluation), then
B-276 and B-320 (live hook probes: Codex and Cursor are signed in here), then B-346 once agent-stack tags 0.32.2.

## Previous: 2026-11-18 update runs from a stable copy (1.90.1)

**Objective:** finish W-D of the 2026-11-17 refactor: the 1.90.0 update on this machine. It failed (B-359): the npx
cache folder it ran from was removed mid-run while the disk was at 0.2 GB free, so a lazy `require` found nothing,
and the same disk pressure failed the web3d-dev clones.

**Done:** `lib/selfcopy.js`: `install` and `update` started from the npx cache run from
`~/.sshlg-skills/launcher/<version>-<digest>`. `test/selfcopy_test.js` (5). 1.90.0 itself is released (tag
`v1.90.0`, release run 44194768090 success, npm 1.90.0).

**Released and read back (2026-11-18):** PR #319, CI run 44221509691 green, tag `v1.90.1`, release run 44222450437
success, npm 1.90.1. `npx --yes sshlg-skills@latest update` on this machine ran from
`~/.sshlg-skills/launcher/1.90.1-0716f656260a`: 33 of 33 skills CLI steps (web3d-dev included), Claude native
transaction `verified` for all eleven members. Result PARTIAL only for Codex: nine plugins deferred while active
sessions hold their payloads (`DEFERRED_ACTIVE_GENERATION_SAFETY`, by design; the deferred-update watcher is
printed in the run).

**Waits:** none in this repository.

**Next task:** B-338 (operator rules into the routing protocol; needs B-347's paired routing evaluation), then
B-276 and B-320 (live hook probes: Codex and Cursor are signed in here), then B-346 once agent-stack tags 0.32.2.

## Previous: 2026-11-17 the launcher cut into command modules; refactor waves W-A to W-D (1.90.0)

**Objective (operator, 2026-11-17, this repository's session):** «Анализируй тот вид, который должен быть в конце,
все функции, которые должны работать корректно … составь план рефакторинга, и волнами все до конца закрой. Не
забудь параллельно решать задачи, которые прилетают.»

**Plan:** [`evidence/plans/2026-11-17-hub-refactor.md`](evidence/plans/2026-11-17-hub-refactor.md) (survey, the
target form, waves W-A to W-D). Branch `refactor/hub-2026-11-17`.

**Done:** W-A: the CLI surface fixture (B-354), the quarantine root and manifest order (B-355), damaged own-state
files kept (B-356). W-B: `bin/sshlg-skills.js` cut into `lib/cli-*.js` (B-357), fixture unchanged. W-C: B-324,
B-326, B-341, B-345 closed; B-323, B-325, B-333 closed with readbacks; agent-stack told on the board (thread `aacbf0e8`)
that the hub side of B-346 is live. W-D: release 1.90.0.

**B-345:** Claude Code 2.1.299 loads `.claude/rules/*.md` and `CLAUDE.local.md` in a project (`claude -p` in an
empty git folder named both planted codewords). `domains` writes a domain member's router text into
`.claude/rules/sshlg-domains.md` where the member is on only in that project.

**Waits:** the release PR's check, the v1.90.0 release run, then `npx --yes sshlg-skills@latest update` on this
machine reads clean.

**Next task:** B-338 (operator rules into the routing protocol; needs B-347's paired routing evaluation for its
protocol paragraph and the exact wording of rule 1 from its board threads), then B-276 and B-320 (live hook probes:
Codex and Cursor are signed in on this machine).

## Previous: 2026-11-17 a home-directory project scope no longer blocks an update (1.89.4)

**Objective:** finish W5 on the operator machine. `npx --yes sshlg-skills@latest update` on 1.89.3 ended PARTIAL:
Claude Code had recorded a `project` scope at the home directory for every plugin (2026-11-17 00:48 UTC), and the
hub admitted only user and local scopes (B-353).

**Done:** `lib/claude-pinned.js` takes a project scope whose `.claude` is the profile as a target; two cases in
`test/claude_pinned_test.js`. The operator machine ran `node bin/sshlg-skills.js update --claude-only` from the fix
branch: `task-pipeline: verified`, both scopes at 1.105.1 `fa3d55e`, installed `SKILL.md`, references and agents
equal to the tag; `~/.agents/skills/{task-pipeline,evidence-docs,project-audit}` equal too. The routing block in
`~/.claude/CLAUDE.md` changed only in the task-pipeline router and the map preamble (B-351 text), against backup
`CLAUDE.md--v2-…20261117T093203Z`.

**Waits:** this PR's check, the v1.89.4 tag's release run, then `npx --yes sshlg-skills@latest update` reads clean.

**Next task:** B-338, then B-345.

## Previous: 2026-11-17 task-pipeline 1.105.1 pinned, hub 1.89.3

**Objective:** wave W5 of the 2026-11-16 prompting review
([spec](https://github.com/ssheleg/task-pipeline/blob/a4eaee0/docs/reports/2026-11-16-anthropic-prompting/SPEC.md)):
release task-pipeline with its prompts rewritten to Anthropic's practices, pin it here with the H0/H1 hub changes,
update the operator machine.

**Done:** task-pipeline PR #170 squash-merged as `a4eaee0`, tag `v1.105.0`, release run 44021491647 success, npm
`task-pipeline-skill@1.105.0`. The hub's validator then read the family's description total at 11522 over its
ceiling 11446: 1.105.0 had lengthened the evidence-docs and project-audit descriptions. task-pipeline PR #171
restored them (`fa3d55e`, tag `v1.105.1`, run 44035689058 success, npm 1.105.1). Here: submodule moved to
`fa3d55e`, `skills.json` and README at 1.105.1,
`scripts/sync-member-pins.js --write` (11 commits match staged gitlinks), `scripts/sync-claude-pins.js --write` (11
pins match; only the task-pipeline record changed), `ctx-04.06.json` re-emitted, release impact
[`2026-11-17-v1893-release-impact.md`](evidence/specs/2026-11-17-v1893-release-impact.md), B-350 closed.
B-352 (board finding `1600efb5` from ania-agent-appvillis: `update` stopped on the family's own marketplace
declaration under another profile hash) fixed in `lib/claude-pinned.js` `ownedSource` with two cases in
`test/claude_pinned_test.js`; the reply on thread `3b07ed51` promises the version. The
merged branch `fix/fixture-isolation-and-router-text` is archived at
`refs/archive/2026-11-17/fix-fixture-isolation-and-router-text` and deleted.

**Waits:** this release PR's check, the v1.89.3 tag's release run, then `npx --yes sshlg-skills@latest update` on
the operator machine, the version posted to Ania's thread `3b07ed51`, and the brand agent's posts (board request to sshlg-brand-agent, capability
`change.request`).

**Next task:** B-338, then B-345.

## Previous: 2026-11-16 fixture isolation and the task-pipeline router text (released in 1.89.3)

**Objective:** waves H0 and H1 of the 2026-11-16 prompting review
([spec](https://github.com/ssheleg/task-pipeline/blob/e11f963/docs/reports/2026-11-16-anthropic-prompting/specs/hub-routing-and-hooks.md)). H0: hub tests wrote fixture router text into the operator's real `~/.claude/CLAUDE.md` through a
Switchboard symlink (B-350). H1: the task-pipeline router, the session note and the map preamble reworded (B-351).

**Done:** branch `fix/fixture-isolation-and-router-text`, PR #315. `test/tmproot.js` `HOST_ENV` (15 variables, `XDG_STATE_HOME` included) is
dropped by the runner and by every suite at load (`isolate()`; `test/hostenv.py` for Python); guard
`test/host_env_leak_test.js` discovers the suites that reach a host root and runs each directly under a
Switchboard-shaped trap (89 checks; 23 fail with the isolation disabled). New `TASK_PIPELINE` text,
`PREVIOUS_LINES['task-pipeline']` back to 1.54.6, `sessionNote`, the per-prompt route line, `MAP_PREAMBLE` with
`MAP_1_89` known lines. Checks: `npm test` from a fresh HOME with the host variables unset, `shasum
~/.claude/CLAUDE.md` equal before and after every run; three `routers --update` runs over a 1.89.2 block in a scratch
HOME end on one hash. The operator's machine was recovered on 2026-11-16 at about 20:28 (`routers --update --adopt`
for task-pipeline, super-ux, copywriting).

**Decisions:** the protocol region's hook-mechanics paragraph was not moved to the README (B-347: wording changes
there need a paired routing evaluation first). The map keeps its stages 2–4 line, which `test/inventory_test.js`
requires.

**Waits:** none; released in 1.89.3.

## Previous: 2026-11-12 five members published and pinned (1.89.2)

**Objective:** B-348, the one human gate left from the 2026-11-11 audit: five member releases tagged but not on
npm because their packages had no npm trusted publisher.

**Done:** B-348 closed. The operator signed in to npm (`npm login`, security key). `npm trust github <package>
--repo ssheleg/<repo> --file release.yml --allow-publish --yes` ran for make-skill, sheleg-design-skill,
sheleg-dev, seo-aeo-audit and telegram-dev; each needs its own 2FA confirmation on a web link that lives about five
minutes. Without a terminal npm prints the link masked and exits, so each ran under `script -q` (a pseudo-terminal),
which prints the link and polls; a local page renewed expired links until all five returned exit 0. The five failed
publish jobs re-ran green; `npm view` reads 0.33.6, 1.66.6, 0.16.4, 0.32.5, 0.5.5. Pinned with
`scripts/sync-member-pins.js --write` and `scripts/sync-claude-pins.js --write` (11 pins match); the family
description total fell to 11446 and was recorded in DOCMAP; `ctx-04.06.json` re-emitted. Checks: `npm test`.

**Board:** request `c52d8576` (B-336, observatory-log descriptions) answered: Observatory engine 0.35.12 holds the
three descriptions at 1,046 characters; the live listing waits on PassionCode taking 0.35.12+.

**Waits:** the B-336 requests, re-measured 2026-11-18 with `npx sshlg-skills visibility --measure`.

**Next task:** B-338 (operator rules into the doctrine; wording changes need B-330's paired routing evaluation,
B-347), then B-345.

## Previous: 2026-11-11 the listing estimate and `schedule --json` (1.89.0, 1.89.1)

**Objective:** continue the backlog by priority after the audit (operator's standing delegation, relayed by the
fabric-98 coordinator session): B-337, then the next rows, through release and the local update.

**Done:** B-337 closed. Checked against the `skill_listing` attachment of a `claude -p` session from an empty
folder, the estimate's 84 entries are exactly Claude Code's 105 minus its 21 bundled and built-in plugin entries;
five plugin command and skill pairs of one name were counted twice (now one entry, the command's description).
`visibility --measure` takes Claude Code's own count now and prints what the estimate does not see (21 entries,
10,850 characters on this machine). B-340 closed: `schedule --json`, `schedule-status/1`, answered in thread `f7758225`. B-339 closed
(agent-stack 0.32.1). B-342 closed: six board announcements answered. Checks: `test/visibility_listing_test.js` (8, 7 fail on 1.88.1), `test/cli_config_test.js` (26),
`python3 test/validate.py` exit 0; the full gate's seven transient failures (disk at 2.4 GB free, load near 90)
pass one by one on the same input.

**Then (1.89.1):** B-349. A Claude local record under a deleted folder held telegram-dev back at every update;
`hosts` now names such records with the B-243 drop, and the block names `hosts`. The three records on this machine
were dropped (backup beside `installed_plugins.json`) and `update` verified all eleven members in Claude; its PARTIAL
is now only the Codex deferral by design (active sessions, watcher installed).

**Waits:** B-348 (npm sign-in, unchanged); the B-336 requests, re-measured 2026-11-18 with `visibility --measure`.

**Next task:** B-338 (operator rules into the doctrine), then B-345.

## Previous: 2026-11-11 family audit and release 1.88.0

**Objective (operator, 2026-11-11):** «пройди по всем и найди проблемы и где можем оптимизировать и убрать старые
легаси неточности и что мешает работе, по всем скилам в семье».

**Done:** seven read-only audits, one fix PR and release per member, hub fixes in PR #308, release 1.88.0 pinning the
six members npm serves (see [CHANGELOG](../CHANGELOG.md) v1.88.0).

**Waits:** B-348, the npm trusted publisher for make-skill, sheleg-design-skill, sheleg-dev, seo-aeo-audit and
telegram-dev (a sign-in with the owner's security key; then `npm trust github <pkg> --repo ssheleg/<repo> --file
release.yml --allow-publish` and a re-run of each failed publish job, run ids in B-348); their pins follow. The seven
B-336 description requests (switchboard and the vault done, observatory in its 0.35.12), re-measured 2026-11-18.

**Next task:** B-348 once the sign-in is done, then B-342 and B-340 (board answers), then B-338.

## Previous: 2026-11-11 skill memory review (no release)

**Objective (operator, 2026-11-11, this repository's session):** «проверь какие есть замечания по скилам и
вопросы и оптимизируй память скилов», then «без потери качества и смыслов».

**Done:**
- Measured what skills cost every session: `claude -p ok --debug-file <f>` logs *Skill listing over budget*:
  121 skills, 43,148 characters here and 105 skills, 35,962 characters in a folder with no project plugins,
  against 30,000. Over budget, rarely used skills reach the model by name only (B-336).
- Figma (0 Skill calls in 30 days of transcripts) left this repository's untracked `.claude/settings.local.json`
  (backup beside it); the listing here fell to 35,962.
- The rest is other projects' descriptions (B-336 names them): seven board requests, deadline 2026-11-18,
  target about 350 characters a skill, triggers and NOT-clauses kept.
- `visibility` under-counts the listing (26,586 against 35,962): B-337.
- Board items for this hub that had no row: B-338 to B-342. Not answered on the board yet.
- No routing block wording changed in the review itself; the audit fixes below change four packaged lines.

**Audit fixes (2026-11-11, PR #308, no version bump: the next pin and release PR ships them):**
- Credential guard: whole-name-part matching (`$PATH`, `$SSH_AUTH_SOCK` pass; `$GITHUB_TOKEN` refused), nested
  substitutions resolved against their own body and an internal error refused with a remedy, recursive searches of
  `~/.claude` and `~/.codex` accepted with an explicit exclusion, `.env.example` and `*.md` exempt, and a value-free
  door `sshlg-skills settings get <key>` named in the refusal.
- Routers: the Claude block carries a member's router only when its Claude plugin is enabled at user scope;
  project-audit, copywriting and fabric texts agree with their members (old lines in `PREVIOUS_LINES`); the protocol
  scopes its first step to substantial work. The hook no longer names the pipeline for a typo, a one-line edit or a
  rename, and routes the two agent-harness audit phrases (`PENDING` on agent-stack B-162).
- `pack design`: Lazyweb retired, Playwright WebKit (webapp-testing) the visual-qa default, chrome-devtools reported
  unusable without its MCP server. `visibility` counts plugin commands and exclusions (B-337 stays open: 27,938
  against 35,962). Previous entries moved to the 2026-11-11 archive; agent-sync guards only the three registries.
- Rows: B-343 (skipped finding, closed), B-344 to B-347.

**Next task:** B-342 and B-340 (board answers), then B-338; B-345 before the next domains change.

**Waits:** the seven B-336 requests (threads in its row), re-measured on 2026-11-18. The unmerged branch
`fix/b326-foreign-settings-write` holds B-323's and B-326's closure; its session owns it.

## Archives and evidence

- [2026-11-11 archive](HANDOFF-2026-11-11-archive.md): every entry from 2026-10-20 to 2026-11-09,
  frozen as of commit `16e1a555`.
- [2026-10-20 archive](HANDOFF-2026-10-20-archive.md): every entry from 2026-10-11 to 2026-10-19,
  frozen as of commit `cb82183c`.
- [2026-10-09 archive](HANDOFF-2026-10-09-archive.md) and its
  [context research](evidence/context-research/README.md).
- [Instruction context](evidence/instruction-context/README.md) ·
  [knowledge wave 2](runs/2026-10-09-knowledge-wave2.md) ·
  [Sherlock external audit progress](evidence/audits/2026-09-07-sherlock/external-v3/progress.json) ·
  [family hooks audit progress](evidence/audits/2026-09-13-family-hooks/progress.json).
