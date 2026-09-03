<!-- agent-sync:generated source=sshlg-skills@2e4c36a cfg=368d627c49d4 at=2026-09-03T10:18:17Z — regenerate with `agent_sync.py setup`, do not hand-edit -->

# How documentation and coordination work in sshlg-skills

This file is **generated** from the live configuration. If it disagrees with
what the tool does, the tool is right and this file is stale — regenerate it.

## Two documentation sources

| Source | Answers | Where |
|---|---|---|
| Git documents | *how it should be* — intent, decisions, contracts | this repository |
| As-built record | *how it actually is* — what agents wrote, with commits | the coordination plane |

Neither outranks the other; they answer different questions. **The gap between
them is the finding.** Reconcile before starting a task and after finishing it.

## This project's wiring

- record plane: **fs** · lease: **git** — exclusive across machines · runs recorded **gated**
- lease TTL 2700s, renewed every 300s
- credentials read from `.env.agent-sync` — gitignored, never committed

### Id registers — reserve before you write

None declared here. Ids live in the parent repository; reserve them there.

### Guarded files — a live lease is required to write these

- `docs/evidence/backlog.md`
- `docs/evidence/verification.md`
- `docs/evidence/retro.md`
- `docs/evidence/manifesto-conformance.md`
- `skills.json`
- `README.md`
- `skills/*`
- `pipeline.json`

### Gates run before a change is considered done

- none configured

### Mirrored into the plane (read-only rendering of git)

- disabled

## What is written where, and what is never deleted

| Information | Home | Lifetime |
|---|---|---|
| Decisions, specs, contracts, user-facing behaviour | git | permanent, append-only register |
| What was actually built, with its commit | as-built log | permanent, append-only |
| Cross-repo dependency state | signal log | permanent, append-only |
| Who holds a task right now | claims log | expires by TTL |
| A lock left by a run that stopped | the lease directory | until it is reported and reaped |
| Per-run narrative | that run's journal | permanent |
| The board and these pages | generated | replaced on every regeneration |

**Nothing in a log is edited or deleted.** A mistake is corrected by appending
the correcting entry, because the logs are replayed in order and a deletion
would silently rewrite a decision every other agent already read. A lease is
released, never removed. A reserved id that is not used is returned with
`release-id`, which appends — it does not erase.

Generated pages are the exception: they are rewritten wholesale, and a page
whose first line lost its generated marker is **refused**, not overwritten.

## The cycle, per task

```
merges      → what landed while you were away
status      → who else is working, and what changed since you last looked
reconcile   → resolve every divergence BEFORE writing code
branch      → work happens on one; the integration branch is somebody
              else's stable base
acquire ID  → take the lease. On the integration branch the claim tag is
              written through to git; on any other branch the holder stays
              in the coordination plane, where `status` shows it to everyone
   … work …
record      → what you ACTUALLY built, with the decision id and files
   … update the git documents in the same change …
reconcile   → check both sides again
board       → regenerate the shared view
merge --key → land the branch: conflicts checked first, the merge recorded,
              that lease released. Without a branch, `release ID` by hand
              — on every path, including failure
residue     → what this run leaves on disk. Expiry ends a lease and leaves
              the file, so `status` and `finish` enumerate them; `reap`
              clears only what THIS run can prove it owns and has spent,
              and reports foreign or ambiguously owned locks untouched
```

This project's integration branch is `main`.

Full doctrine ships with the skill: `references/two-sources.md`,
`references/lease-protocol.md`, `references/branching.md`,
`references/roadmap.md`, `references/pipeline-binding.md`.
