# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-11-11 the listing estimate and `schedule --json` (1.89.0)

**Objective:** continue the backlog by priority after the audit (operator's standing delegation, relayed by the
fabric-98 coordinator session): B-337, then the next rows, through release and the local update.

**Done:** B-337 closed. Checked against the `skill_listing` attachment of a `claude -p` session from an empty
folder, the estimate's 84 entries are exactly Claude Code's 105 minus its 21 bundled and built-in plugin entries;
five plugin command and skill pairs of one name were counted twice (now one entry, the command's description).
`visibility --measure` takes Claude Code's own count now and prints what the estimate does not see (21 entries,
10,850 characters on this machine). B-340 closed: `schedule --json`, `schedule-status/1`. B-339 closed (agent-stack
0.32.1). Checks: `test/visibility_listing_test.js` (8, 7 fail on 1.88.1), `test/cli_config_test.js` (26),
`python3 test/validate.py` exit 0; the full gate's seven transient failures (disk at 2.4 GB free, load near 90)
pass one by one on the same input.

**Waits:** B-348 (npm sign-in, unchanged); the B-336 requests, re-measured 2026-11-18 with `visibility --measure`.

**Next task:** B-342 (board answers), then B-338.

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
