# Cross-repository handoff: the two roles, and what each owes the other

A finding often belongs to a repository the agent is not working in. The rule for
that is: **one agent does not carry work across a repository boundary.** The one
who found it writes it down where it belongs; an agent working in that repository
picks it up and carries it to release.

`docs/working-rules/repository-handoff.md` says how to leave durable work behind.
This says how work crosses a boundary, and it is written for BOTH sides — because
until 2026-09-10 every sentence the family had on the subject addressed the writer.

## What that cost, measured

Four pull requests, each titled *"…cross-agent handoff"*, sat open for **three
days** across `super-ux`, `task-pipeline`, `sheleg-design-skill` and `make-skill`.
A fifth item — an issue proposing a rules change — sat a day. Nothing was lost.
Nothing was read either: they were found because an unrelated task happened to
enumerate open pull requests. The write side worked; there was no read side.

So both halves are stated, and both are surfaced by machinery rather than by
memory: `lib/handoffprobe.js` reads the queue of the repository a session is in,
and the session says one line about it.

## If you are WRITING one

**Choose the artifact by what you are asking for.**

| You have | File | On |
|---|---|---|
| A finding a rules change would close | an **issue** | the repository that owns the rule |
| A change you can describe but must not make | an **issue** | the repository that must make it |
| A change you carried far enough to show | a **pull request** | the repository it belongs to |

**Label it `handoff`.** Without the label it is ordinary open work: still counted,
never claimed to be addressed to anybody. The label is what makes a receiving
agent's surface name it, and a title convention was rejected because it rots the
first time somebody writes a good title.

**Five things a receiving agent cannot proceed without**, and an issue missing any
of them is a wish rather than a handoff:

1. **What is wrong**, as behaviour — not as a preference. Name the file and line
   or the command and its output.
2. **Why it is theirs.** The boundary that stopped you: a different repository,
   a release you must not cut, a decision that is not yours.
3. **The exact next task.** Not the goal — the first action, small enough to
   start without a plan.
4. **How to know it worked.** A command, a test name, an observable. "It should
   be better" cannot be closed.
5. **What would make it wrong.** The counter-case, so the receiver can tell a fix
   from a coincidence.

**Do not cross the boundary yourself**, even when it looks like one line. Two
agents editing one repository is what `agent-sync` exists to prevent, and a
release you cut in somebody else's repository is a release nobody reviewed.

## If you are RECEIVING one

**Read the queue before changing what it is about.** The session says how many
handoffs are waiting and names up to three. An item about the file you are about
to edit is not a distraction from your task; it is a fact about your task.

**A handoff is a claim, not an instruction.** Verify it against the tree first —
this family has filed rows found already closed, and rows whose text was true
while the thing they described had moved. Check its five parts resolve: the
`file:line` still says that, the command still prints that. A handoff that no
longer reproduces is closed with what you found, not silently.

**Carry it to release, or say why not.** The writer stopped at a boundary you do
not have. Finishing means the change, the check that proves it, and the release —
and where you cannot finish, a comment saying which of the five parts failed, so
it goes back as a smaller question rather than dying as a stale row.

**Close with what changed.** Issues are resolved, never deleted: a deleted issue
takes its number — the one a CHANGELOG points at — with it. Closing names the
commit and what the behaviour does now.

## The one asymmetry worth stating

The writer is asking for work from an agent who has other work. That makes
**precision the writer's debt, not the reader's favour**: five parts, filled in,
in the repository that owns the change. The reader owes the queue a reading and an
honest answer — including "this no longer reproduces" — and owes nothing to a
handoff that never said what would make it wrong.
