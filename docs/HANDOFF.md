# Start here — sshlg-skills

Snapshot: 2026-10-10. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## Current host compatibility delivery

[Host compatibility report](reports/2026-10-09-coding-agent-compatibility/README.md)
and [execution packet](evidence/host-compat/README.md) own the current work:
29 host-family contracts, all 38 family skills, supported global installer targets,
and bounded fixes in five members. Exact source, release and installed readback
are separate in [delivery.json](evidence/host-compat/delivery.json).
Published hub: **1.54.7**, source [5a12a70](https://github.com/ssheleg/sshlg-skills/tree/5a12a70d2d6c44a73b23a474072b6c3681a56b6e).
Published members: make-skill 0.29.2, task-pipeline 1.90.2, agent-sync 1.21.5,
super-ux 0.59.1, sheleg-dev 0.13.2. All registry payloads match their release sources.
Global update completed; [134 installed payload comparisons](evidence/host-compat/local/installed-payloads.json) match.
Native/disclosed loader checks find all 38 family skills, Continue source-helper
discovery improved from 0 to 38, and all 29 Codex path exclusions remain.
[Local readback](evidence/host-compat/local-readback.json) distinguishes this from
model/provider acceptance, which is NOT_RUN.

[Hook 127 repair](evidence/host-compat/local/stale-cache-repair.json) restored
exact old paths; the operator confirmed no new errors. The final global update
preserved all 2874 prior files in 37 Claude cache versions, adding only five native
.orphaned_at markers. [Preservation](evidence/host-compat/local/protected-preservation.json)
checks retained manual instructions, settings and both original chat exports.
[Config reconciliation](evidence/host-compat/local/config-reconciliation.json)
records MCP drift already present before the last native update; do not restore
stale configuration from the earliest baseline.

The failed unpublished task-pipeline 1.90.1 and ENOSPC attempt remain historical
evidence; recovery 1.90.2 passed source, local, release and registry gates.
Historical post-fix audit evidence is reused only through
[complete payload equivalence](evidence/host-compat/post-fix/EQUIVALENCE.md).
No owner source integration or installed family update is pending.

Exact next bounded task: **VISIBILITY-1** — measure the third-party skill catalog
metadata cost and propose scoped visibility changes. Prerequisite: read the
[previous context delivery](evidence/comprehensive-context/DELIVERY.md) and this
report; retain excluded skills and do not delete collected chat data. Three
lightweight-tag process follow-ups are P2 at their owners' next normal release.

The previous [1.54.6 context delivery](evidence/comprehensive-context/DELIVERY.md)
remains a historical receipt. After current delivery, the proposed next bounded
task is VISIBILITY-1, not a restart of historical exact-next instructions.

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
