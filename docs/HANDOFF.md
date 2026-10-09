# Start here — sshlg-skills

Snapshot: 2026-10-09. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## Current context delivery

[Context repair and member integration](evidence/context-research/README.md) owns
this bounded delivery. [Delivery status](evidence/context-research/delivery.json)
separates source, package, installation and fresh-host evidence; read its dated
receipt before acting. [The plan](evidence/context-research/PLAN.md) and
[independent review](evidence/context-research/review.md) retain scope and checks.
**Next action:** resolve the first incomplete gate in that receipt. When all
implementation/release gates are complete, choose a task from the current backlog
and revalidate its owner state; do not restart historical exact-next instructions.

## Most recent completed delivery receipts

- [Instruction context delivery](evidence/instruction-context/README.md): hub 1.54.4
  and agent-stack 0.25.4 publication and installed-byte receipts. This is the latest
  completed delivery in this snapshot, not an assertion about a later release.
  Fresh interactive host loading remains NOT_VERIFIED; existing sessions retain
  earlier context. Unsupported global host targets are disclosed in the receipt.
- [Team evaluation and crawl evidence](runs/2026-10-09-knowledge-wave2.md): 1.54.3
  delivery, source/package/installed-channel comparisons and separate review receipts.
  Installation does not establish model, indexing or business improvements.
- [Channel evidence and SEO correction](runs/2026-10-09-channel-digest.md): the
  preceding bounded delivery and its explicit acceptance limits.

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
