# Start here: sshlg-skills

This page holds the current entry and the next bounded task, nothing else. Older entries are
frozen, byte for byte, in the archives listed at the end; query them, do not read them whole.
Before editing read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[retrospective's standing instructions](evidence/retro.md#standing-instructions) and the
[repository handoff rule](working-rules/repository-handoff.md).
[skills.json](../skills.json) owns the member inventory and pins;
[backlog](evidence/backlog.md) owns open work.

## Current: 2026-10-20 context diet (CONTEXT-DIET-1020)

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

**Exact next bounded task:** pin every member released by this run in one hub release
(`skills.json`, submodule pointers, README table), lower `description-total` to the measured
sum, change the triggers fixture to look for each hub trigger in the member's whole `SKILL.md`
(descriptions moved trigger lists into the body), then `npx --yes sshlg-skills@latest update`
and read the listing back.

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
