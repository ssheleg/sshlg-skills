# Handoff layers: which mechanism carries what

Five mechanisms move work between agents on this machine. Each answers a different
question. Used in place of one another, they produced a durable record nobody could
resume from, and a write lease nobody knew existed. This page is their single home.
task-pipeline `references/continuity.md` will cite it rather than restate it: that
citation, and the launch-context row of its `references/knowledge-sources.md` named
below, exist on task-pipeline's branch `w2/hygiene-continuity` (`ffa42ab`) and land on
its main with task-pipeline's wave-2 release — until that release is pinned here, no
shipped document cites this page (board `B-160`, open). The routing block does not cite
it either; it has no room in its character budget.

| Layer | Owner | Carries | When | Never |
|---|---|---|---|---|
| **Durable record** | the repository — `docs/HANDOFF.md` and the [repository-handoff rule](repository-handoff.md) | objective, decisions, open work, the exact next task, links to briefs, plans and receipts | every handoff, always — the only layer that survives every other one being down | holds a lease token or a credential |
| **Workflow write-lease** | Observatory `memory.handoff.create` / `.accept` / `.get` (MCP tools `observatory_handoff_create`, `observatory_handoff_accept`, `observatory_handoff_get`) | who may write the workflow now; the pack the successor receives | a **planned** change of executor — a quota running out, a route moving work to another model or account | replaces the durable record; the pack is data, not instructions |
| **Stage checkpoint** | Observatory `memory.checkpoint.write` / `.latest` (MCP tools `observatory_checkpoint_write`, `observatory_checkpoint_latest`); the arguments built by task-pipeline `scripts/stage_checkpoint.py` (`references/continuity.md`, on its main) | the gate just passed, the next stage, the operator's constraints, key names | every returned gate, when the tools are connected; otherwise one `event: memory — unavailable` ledger line | carries a value — keys by NAME only |
| **Launch context** | Fabric / Fabric Dashboards `session-handoff/1` (fabric-agent-contract `docs/specification/session-handoff.md`) | the brief (appended to the system prompt), the task (the first prompt), `context.md`, the host's MCP config | a session a host starts | lives in a repository (SH-1) |
| **Inbound queue** | the hub — `lib/handoff.js`, `lib/handoffprobe.js`, [cross-repository handoff](cross-repo-handoff.md) | pull requests and issues other agents left for this repository | session start, one line | is the place a decision is recorded |

## The order a successor reads them in

1. **Launch context.** If a host started the session, the task and brief are the
   request, and `context.md` is a harvest source (task-pipeline
   `references/knowledge-sources.md`, source 0 — from its wave-2 release).
2. **Write-lease.** If the work was offered by `handoff_create`, accept it before the
   first write, and obey the constraints its answer carries first.
3. **Checkpoint.** The latest checkpoint names the last finished stage and what comes
   next.
4. **Durable record.** `docs/HANDOFF.md` is the tiebreaker. Where it disagrees with a
   checkpoint, the repository wins, and the disagreement is a finding.
5. **Inbound queue.** Other agents' asks join the board, with ids.

## Why five and not one

- The **durable record** must outlive every service, and it does: it is Git.
- A **lease** must be exclusive and short-lived, which Git is not.
- A **checkpoint** must be written in the middle of a run that may lose its quota
  in the next minute, which a commit-and-push is too heavy for.
- A **launch context** belongs to the host's user data, never to the repository.
- The **inbound queue** is somebody else's write, discovered by this repository.

Merging any two of them breaks one of these properties.
