# Repository handoff: standing operator instruction

Recorded on 2026-09-07: the operator asked to put this work in Git so another agent
can resume, and to do this for all repositories going forward.

For every repository task, persist durable reports, decisions, plans, task context,
and the corresponding implementation in the owning Git repository. An app preview,
chat, temporary directory or unpushed worktree is not the sole delivery location.

Before finishing or handing off:

1. Save a tracked handoff entry naming the objective, completed work, open work,
   decisions, prerequisites, checks actually run and the exact next task. Link
   the bounded task packets and their shared module/contracts context.
2. Use repository-relative artifact links and commit-addressed source references.
   For several repositories, keep one central index with remote, branch, commit,
   status and entry point per owner. Validate access from a fresh checkout.
3. Commit task-owned changes and push the working branch to the repository's
   existing authorized remote. This is standing authorization to commit and push
   this operator's requested work; do not ask again merely because the turn ends.
   Verify the remote branch resolves to the commit, then give the entry link.
4. Keep unrelated edits, credentials, caches, private machine configuration and
   third-party dependency trees out of these commits. Preserve an explicit
   local-only instruction. If remote access is unavailable, keep the local commit
   and report that precise blocker, without claiming delivery.
5. A pushed branch is available for handoff; it is not a merge, a package release,
   a deployment, or an installed skill update. Follow the repository's integration
   policy for those actions. Never force-push to make a handoff pass.
6. At a multi-repository release, verify parent submodule pins too. At a planning
   handoff, list pending member branches explicitly instead of silently changing
   production pins to unreviewed work.

Apply this to audits and planning as well as code. Give the next agent one entry
point; make its first task explicit. Do not make it reconstruct the work from chat.
