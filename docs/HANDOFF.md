# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-11-11 skill memory review (no release)

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

**Audit fixes (2026-11-11, branch `fix/hub-audit-1111`, no version bump: the next pin and release PR ships them):**
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
