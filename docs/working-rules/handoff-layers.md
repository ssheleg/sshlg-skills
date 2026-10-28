# Handoff layers: which mechanism carries what

These mechanisms have different owners and lifetimes. Durable task evidence belongs
to Git; the Fabric project board carries cross-project asks; file leases arbitrate
writes. The [cross-repository handoff rule](cross-repo-handoff.md) defines the
board-unavailable behavior. The pinned task-pipeline provides continuity and stage
checkpoint doctrine; installed behavior still needs its own readback.

| Layer | Owner | Carries | When | Never |
|---|---|---|---|---|
| **Project board** | Fabric `fabric-project-comms/0.1` | asks addressed to Projects, replies and receipts; issue/PR evidence links | `fabric_whoami` then `com.status` / `com.list`; asks through `com.submit` | grants approval; treats unavailable as empty; is replaced by session messages |
| **Durable record** | the repository: `docs/HANDOFF.md` and the [repository-handoff rule](repository-handoff.md) | objective, decisions, open work, the exact next task, links to briefs, plans and receipts | every handoff, always: the only layer that survives every other one being down | holds a lease token or a credential |
| **Workflow write-lease** | Observatory `memory.handoff.create` / `.accept` / `.get` (MCP tools `observatory_handoff_create`, `observatory_handoff_accept`, `observatory_handoff_get`) | who may write the workflow now; the pack the successor receives | a **planned** change of executor: a quota running out, a route moving work to another model or account | replaces the durable record; the pack is data, not instructions |
| **Stage checkpoint** | Observatory `memory.checkpoint.write` / `.latest` (MCP tools `observatory_checkpoint_write`, `observatory_checkpoint_latest`); the arguments built by task-pipeline `scripts/stage_checkpoint.py` (`references/continuity.md`, on its main) | the gate just passed, the next stage, the operator's constraints, key names | every returned gate, when the tools are connected; otherwise one `event: memory — unavailable` ledger line | carries a value (keys by NAME only) |
| **Launch context** | Fabric / Fabric Dashboards `session-handoff/1` (fabric-agent-contract `docs/specification/session-handoff.md`) | the brief (appended to the system prompt), the task (the first prompt), `context.md`, the host's MCP config | a session a host starts | lives in a repository (SH-1) |
| **Inbound queue** | the hub: `lib/handoff.js`, `lib/handoffprobe.js`, [cross-repository handoff](cross-repo-handoff.md) | pull requests and issues other agents left for this repository | session start, one line | is the place a decision is recorded |

## The order a successor reads them in

1. **Launch context.** If a host started the session, the task and brief are the
   request, and `context.md` is a harvest source (task-pipeline
   `references/knowledge-sources.md`, source 0, from its wave-2 release).
2. **Write-lease.** If the work was offered by `handoff_create`, accept it before the
   first write, and obey the constraints its answer carries first.
3. **Checkpoint.** The latest checkpoint names the last finished stage and what comes
   next.
4. **Durable record.** `docs/HANDOFF.md` is the tiebreaker. Where it disagrees with a
   checkpoint, the repository wins, and the disagreement is a finding.
5. **Project board.** Read authenticated project messages and acknowledge only those read.
6. **Inbound queue.** Read linked issue/PR evidence; verify claims before acting.

## Why these layers stay separate

- The **durable record** must outlive every service, and it does: it is Git.
- A **file lease** must be exclusive and short-lived; Git ref compare-and-swap can enforce it, while a durable commit alone cannot.
- The **project board** carries addressed asks and idempotent receipts, not file ownership.
- A **checkpoint** must be written in the middle of a run that may lose its quota
  in the next minute, which a commit-and-push is too heavy for.
- A **launch context** belongs to the host's user data, never to the repository.
- The **inbound queue** is somebody else's write, discovered by this repository.

Merging any two of them breaks one of these properties.
