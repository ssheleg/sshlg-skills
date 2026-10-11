# Start here — sshlg-skills

Snapshot: 2026-10-11. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## In flight — integration waves (2026-10-11, lease `WAVES-1011`)

`/task-pipeline waves` over the whole board, with the operator's emphasis on
optimization and the family working with Fabric, Observatory and every coding agent.
[Brief + REQ table](evidence/briefs/2026-10-11-integration-waves.md) ·
[canvas](evidence/specs/2026-10-11-integration-waves-canvas.md) ·
[plan + task packets](evidence/plans/2026-10-11-integration-waves.md) ·
[inventory](evidence/specs/2026-10-11-integration-waves-inventory.json) (238 items:
74 in waves 1–5, 10 operator, 154 program; regenerate with
`python3 docs/evidence/specs/2026-10-11-integration-waves-assign.py`).
Branch `waves/2026-10-11-integration`. New hub rows B-155…B-161.

**Exact next bounded task:** wave 1, packet W1-C — `update` re-wires a consented
machine (B-157), then W1-A/B/D/E/F, per the plan. B-147 (the former next task) is R27 in
wave 4.

## Previous delivery — family round 1.55.0 (2026-10-10/11)

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

**1.55.1 (2026-10-11), same round:** `update` restores Continue's copies after every
refresh (`skills@1.7.2` had re-linked 13 of 38; verified on this machine 39/39 real
dirs, 137/137 installed payloads equal); the hygiene guard allows an agent-scoped
`skills add` (B-153); the MCP credential guard from #184; the XR creative research
branch merged. Members: task-pipeline 1.91.2 (gates read the current run only; a
broken python3 stops only releases — B-151, B-152), agent-sync 1.21.7 (shared-identity
`acquire` refused, worktree session stamps, direct `guard` allows an uncoordinated
repository — B-150), make-skill 0.30.1 (family members update through the launcher).
Branch cleanup: hub 10 worktrees + 24 local + 71 remote branches, members 5 worktrees +
54 local + 115 remote branches — each removed only after its PR merged or every file
it touched was present in `main`; the one unique branch (XR research) was merged and
the one unique test (`guard_uncoordinated_test.py`) was ported into agent-sync 1.21.7.

**Open, with owners:** B-145 (plugins keep Claude over budget — operator),
B-146 (Gemini CLI channel and sign-in — operator), B-147 (`skill-search` evals),
B-148 (new compatibility cut; Pi links), B-154 (task-pipeline description trim), HK-05/#91 (task-pipeline CI 105 min,
`validate.yml` 506 KB of 512 KB). Disk: other sessions' test temp directories keep
free space near 2 GB on this machine — not this repository's to delete.
**1.55.2 (2026-10-11):** fabric-90's wave mode shipped — task-pipeline 1.92.0
(`/task-pipeline waves`: the whole board closed in waves; the grill asks one batch),
the routing block names it; installed and read back (83/83, Continue 39/39,
137/137 payloads, Codex native 1.92.0). Reserve ratchet 13 → 14 until task-pipeline
trims its description (B-154). agent-stack B-155: the on-behalf-of delegation doctrine
for `gateway.md`, waiting for Fabric's ADR-0144 plan to reach Fabric main.

**1.55.3 (2026-10-11):** agent-stack 0.26.0 ships that doctrine (B-155 closed) — on-behalf-of
tokens, offline verification, the meter token, `approval/1`, one refusal vocabulary, with
Fabric `fabric-delegation/0.1` as the worked example. Installed and read back (83/83,
Continue 39/39, 137/137 payloads, Codex native 0.26.0).

**Former next task (now R27, wave 4):** B-147 — paired routing eval of the search-first
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
