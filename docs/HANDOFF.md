# Start here — sshlg-skills

Snapshot: 2026-10-11. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## Current delivery — family round 1.55.0 (2026-10-10/11)

[Brief](evidence/briefs/2026-10-10-family-round.md) · [plan](evidence/plans/2026-10-10-family-round.md) ·
[delivery receipt](evidence/family-round-1010/DELIVERY.md). Lease `FAMILY-ROUND-1010`.

The review of 1.54.7 measured what its readback could not: Claude Code's skill
listing was 274,398 characters against a 30,000 budget and Codex dropped 220 skills
(`task-pipeline` among them) from its model list. Operator decisions: a small core
stays listed, the rest is hidden and reached by a search that is now every task's
first step (`toolkit --find`, the routing protocol, make-skill's `skill-search`).
`npx sshlg-skills visibility --apply` writes Claude `skillOverrides` and Codex
`skills.config` through backups; `--revert` removes only what it added.

Eleven members released with annotated tags and a release gate that refuses a
lightweight tag; `skills@1.7.2` pinned. Installation and the post-apply listing
readback are recorded in the receipt's last section.

**Open, with owners:** B-145 (plugins keep Claude over budget — operator),
B-146 (Gemini CLI channel and sign-in — operator), B-147 (`skill-search` evals),
B-148 (new compatibility cut; Pi links), B-149 (merged branches — operator),
HK-05/#91 (task-pipeline CI 105 min, `validate.yml` 506 KB of 512 KB).
A peer session (fabric-90) holds the next change: "wave mode" doctrine across
task-pipeline, routing and pointers, built on 1.55.0.

**Exact next bounded task:** B-147 — paired routing eval of the search-first
protocol and `skill-search` (arms with/without the protocol sentence, per
`test/evals/README.md`), then decide whether Codex needs its own core list.

The previous [host compatibility delivery](reports/2026-10-09-coding-agent-compatibility/README.md)
(1.54.7, [delivery.json](evidence/host-compat/delivery.json)) is now a historical receipt.

## Most recent completed delivery receipts

- [Context research 1.54.5](evidence/context-research/README.md),
  [delivery receipt](evidence/context-research/DELIVERY.md): agent-stack 0.25.5,
  source/package/installed-byte receipts. The new follow-up owns later host tests.
- [Instruction context 1.54.4](evidence/instruction-context/README.md): earlier
  compaction and installation slice; its NOT_VERIFIED labels describe that date.
- [Team evaluation and crawl evidence](runs/2026-10-09-knowledge-wave2.md): 1.54.3.
- [Channel evidence and SEO correction](runs/2026-10-09-channel-digest.md): preceding delivery.

## Historical work and unresolved follow-ups

The [Sherlock progress snapshot](evidence/audits/2026-09-07-sherlock/external-v3/progress.json)
records all its leaves done, including FIX-SY-01.01; the
[debt snapshot](evidence/audits/2026-09-10-debts/progress.json) records all its rows done.
Those implementation statuses do not independently prove present deployment or
host acceptance. Do not start their old exact-next instructions or reapply prepared
September patches. Use [the bundle entry](evidence/audits/2026-09-07-sherlock/README.md)
only when investigating that dated work.

The [family-hooks snapshot](evidence/audits/2026-09-13-family-hooks/progress.json)
still records HK-05 as planned and HK-13 as open for the operator. Their present
owner/release state has not been revalidated by this context repair. Reconcile that
state before selecting work from the [dated plan](evidence/audits/2026-09-13-family-hooks/plan.md);
neither item is a universal next instruction for every new task.

**Archive boundary:** the [previous handoff](HANDOFF-2026-10-09-archive.md) is frozen
historical evidence, not operational instructions. It is a verbatim copy of
[this source revision](https://github.com/ssheleg/sshlg-skills/blob/a4c65581787b5ddcb3df1e36a8cae1c89c066479/docs/HANDOFF.md).
Its old status claims and exact-next headings describe their own dates. The same
directory depth preserves relative links; [archive metadata](evidence/context-research/navigation.json)
records its source and hash. Earlier release and workstream links remain there.
