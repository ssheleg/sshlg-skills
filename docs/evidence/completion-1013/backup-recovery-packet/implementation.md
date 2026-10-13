<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# MB02b implementation slice: retention and wait-rule recovery

**Implemented in an isolated next-wave branch; independent peer and aggregate are
pending. No current release, installed configuration or model behavior is certified.**
Implementation source: [`aa02a4d0f873d670cd8a2e164a8c60edb4cbd940`](https://github.com/ssheleg/sshlg-skills/commit/aa02a4d0f873d670cd8a2e164a8c60edb4cbd940).
Parent source is `5d19e74b02c507cf59606469b80c5c44b9bc178d`; the accepted
[context packet](README.md) remains the specification snapshot. This file records
what this slice actually implements and what remains outside it.

## Behavior and authority

`lib/backup-retention.js` adds an opt-in reference through the existing
`apply.protect()` call. It records only a private backup identity/hash and exact
owner receipt/operation locator. It cannot authorize host writes or restore.
The first registered owner is wait rules. A provisional immutable reference is
flushed and read back before the backup is published. Failure or interruption
leaves evidence protected. All current ordinary backup saves take the same
cooperative directory lock; pruning excludes referenced copies in addition to
retaining its ordinary history. The supplied race test holds a real child between
reference creation and publication while another child tries ordinary pruning.

References remain subordinate to `wait-rules.json`, the existing operation and
ownership home. There is no additional global transaction or consent registry.
Malformed, unknown, orphan or unreadable reference metadata refuses cleanup;
age, PID and successful later writes do not resolve it. Released references retain
content-bound private retirement evidence. Automatic compaction of these small
metadata files is not implemented. Existing Claude operation directories and
visibility journals have not been migrated.

`lib/wait-rules.js` records existence, exact content hash and mode separately for
before and after, with canonical target/profile, current policy snapshot and
verified reference. [absence-baseline.json](absence-baseline.json) shows the
actual old wait module at the parent source recording the same beforeHash for
absent and empty files without any existence field. Existing legacy pending
records remain `legacy-unresolved`; this implementation does not infer a backup
or rewrite them into its new shape.

The normal writer persists prepared state, obtains the referenced backup, persists
write intent, uses its existing protected writer/current-consent checks, records
verified ownership, then retires that operation's retention reference. Failure
returns a failed per-target result even if the host write already landed; pending
or terminal-finalization evidence remains. Current source and known-segment
ownership checks still apply. A terminal operation whose target later changes
back to the original bytes is not reclassified as though its write never happened.

Two internal module APIs provide bounded recovery, **not new public CLI commands**:
`inspectRecovery(home)` reads evidence only; `resolveRecovery(home)` classifies
before or after into the existing receipt without repeating or restoring a host
write. Resolution requires unchanged policy, profile, admitted target, exact
backup bytes and ownership records. Third content, retarget, changed policy,
legacy pending, unprepared backup, invalid next ownership and an out-of-namespace
reference remain unresolved. Restoration itself is not implemented here.
Repeated completed resolution is a byte-identical no-op.

## Checks actually run

[Six new retention controls](retention-baseline.json) were watched failing on the unmodified backup substrate,
including lost recovery bytes, absent orphan reference, ignored malformed metadata,
unknown owner admission and permissive reference storage. All then passed.
The first six wait-recovery controls initially failed because the old module had
no recovery API; that is new-capability TDD, not six separate historical incidents.
The additional actual baseline absent/empty observation above proves the original
semantic loss directly.

[focused-final.json](focused-final.json) records **10 focused suites / 147 checks**
on core `3bb4f375311fa73f1fc7d402823c3d9feb04f84a`, with source hashes checked around
every suite. It includes backup17, ordinary backup21, wait emitter21, wait policy25,
Claude transaction27, runtime closure6, the new retention6, real process race1,
wait recovery16 and crash7. This is not a full repository aggregate.

The final namespace control then reproduced one additional defect: relocating a
valid reference outside the owner's backup namespace still classified it as before.
The bounded correction adds directory admission to inspection and retirement;
[namespace-followup.json](namespace-followup.json) binds the corrected source and
replays the affected wait recovery, crash and emitter suites. A final bounded
lock hardening uses monotonic time: the previous wall-clock variant timed out
under a frozen Date.now ([clock-baseline.json](clock-baseline.json)); the corrected
real-child control returns a refusal while preserving the lock.
[final-followup.json](final-followup.json) binds the final source to five affected
suites: retention7, process race1, recovery17, crash7 and emitter21. The preceding 147
receipt remains a historical cut, not silently relabeled as the final source.

[focused-first.json](focused-first.json) preserves the earlier crash fixture failure:
it incorrectly expected recovery after removing only the owner's fixture lock,
while the backup lock correctly remained held. Core was not weakened. The corrected
fixture first proves the refusal and unchanged receipt, then explicitly reconciles
its second owned lock and verifies resolution. [focused.json](focused.json) records
that continuation before the final binding checks.

## Locks and durability limits

Order is owner receipt lock, then backup directory lock. The backup lock is released
before writing the owner receipt, since that writer also calls protect. No owner
callback runs under the backup lock. Lock acquisition uses a five-second monotonic wait budget
and an exclusive private file and never steals an existing lock. Removal on a
normal exit checks that the inode is still the one this invocation acquired.

A process crash can leave `wait-rules.json.lock` or `.retention.lock`. There is
**no production API that proves arbitrary owner retirement or automatically clears
those locks**. Such a case is `RECOVERY_REQUIRED`; preserve the locks, receipt,
references and backup bytes for exclusive-ownership review. A PID lookup, elapsed
TTL, timeout or failed subprocess is insufficient authority to remove them. The
SIGKILL fixtures remove locks only after their exact isolated child has ended and
no other fixture process owns that namespace. That test arrangement is not a
machine recovery mechanism.

Seven real child-process crash boundaries cover before/after prepared receipt,
after write intent, before/after host replacement, after terminal receipt, and
after retirement hardlink. Exception controls cover each receipt write, target
write, retirement link/unlink and foreign retirement destination. This is not an
exhaustive syscall fault model, filesystem power-loss proof or atomic multi-file
transaction. Synchronous filesystem calls have no separate hard wall-time guarantee. File fsync/readback is used; no directory-fsync durability claim is
made. Cooperative locks and compare-before-replace cannot guarantee CAS against
an uncooperative writer.

Reference admission rejects permissive existing storage without chmod. Ordinary
legacy unreferenced `save()` retains its pre-existing backup-directory chmod
behavior; this slice does **not** claim all existing foreign directories remain
untouched. Native Windows permission behavior was not tested; POSIX private-mode
checks run in the measured synthetic macOS environment. No operator host files,
provider calls, native install operations or foreign worktrees were changed.

## Exact continuation

Parent independently reviews the composed source and boundary controls before any
integration. Run the serialized aggregate only when its slot is available, and
compute ratchet changes from that run. The current hub publication does not wait
for this separate next-wave slice. Public recovery CLI, safe lock-resolution
admission, reference metadata compaction and restore-as-new-operation remain
explicit follow-ups; none is implied by internal classifier success. MB03 adopts
visibility, Claude and hooks individually with their original journal/uncertainty
contracts preserved. REPOSITORY-HANDOFF ownership remains outside this change.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded implementation and fault gates.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — exact-source acceptance boundaries.
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — isolated task lease.
