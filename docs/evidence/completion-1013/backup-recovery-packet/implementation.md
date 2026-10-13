<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# MB02b implementation slice: retention and wait-rule recovery

**Implemented in an isolated next-wave branch; independent peer and aggregate are
pending. No current release, installed configuration or model behavior is certified.**
Implementation source: [`ed02df77391309a34991bda7b1947cc4ea96c7af`](https://github.com/ssheleg/sshlg-skills/commit/ed02df77391309a34991bda7b1947cc4ea96c7af).
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
[final-followup.json](final-followup.json) binds historical `aa02a4d` to five affected
suites: retention7, process race1, recovery17, crash7 and emitter21. The preceding 147
receipt remains a historical cut, not silently relabeled as the final source.

[focused-first.json](focused-first.json) preserves the earlier crash fixture failure:
it incorrectly expected recovery after removing only the owner's fixture lock,
while the backup lock correctly remained held. Core was not weakened. The corrected
fixture first proves the refusal and unchanged receipt, then explicitly reconciles
its second owned lock and verifies resolution. [focused.json](focused.json) records
that continuation before the final binding checks.

## Independent ownership-delta finding and correction

Parent reproduced a false metadata success on `aa02a4d`: after a Codex host write,
replacing the valid-shaped `pending.nextRecords` with `{}` let resolution discard
an unrelated Claude ownership record while leaving the Claude file untouched.
The [original observation](ownership-delta-baseline.json) and
[portable probe](ownership-delta-probe.js) preserve this defect. The probe accepts
an optional repository argument; it creates and removes only its synthetic home.

`recoveryRecords()` now reconstructs the one target delta from the verified original
backup, prior ownership and the known renderer. It verifies the resulting exact
existence/content/mode fingerprint, target agent/file/root/canonical root and
previous segment, and requires exact equality with the proposed map. Every sibling
record must survive unchanged. Pending recovery requires the current map to equal
recorded prior ownership; terminal retirement requires it to equal the reconstructed
result. The new `priorRecords` snapshot is evidence within the existing owner
journal, not another authority or registry. Earlier operations missing that proof
refuse resolution without migration. `inspectRecovery`'s `before`/`after` states
classify file snapshots only; they do not grant ownership adoption.

The [baseline replay](ownership-delta-negative-baseline.json) loads the actual old
wait-rules module alongside the unchanged supporting modules and the final tests:
18 passed, 10 failed, exit 1. Nine valid-shaped mutations cover deleted/added/edited
siblings, target root/canonical root/agent/prefix/previous segment and missing target;
the tenth verifies missing prior transition proof. No original host payload is
changed to manufacture these negative cases. The normal removal control preserves
an actual sibling record and foreign text. The
[fixed probe](ownership-delta-probe-fixed.json) refuses the original attack while
retaining ownership. [Ownership-delta focused receipt](ownership-delta-followup.json) binds
`b4acdcf` to recovery28, process-crash7, retention7, process-race1 and emitter21:
64 checks, all exit 0. Earlier 147/53 check receipts remain historical snapshots.
This is still not an aggregate, release or machine recovery acceptance.

A second independent [probe](no-write-retirement-baseline.json) found interrupted
retirement after `recovered-no-write` could not resume: the transition verifier
expected the after map even though retaining prior ownership was correct.
The [portable probe](no-write-retirement-probe.js) now records a successful
[metadata-only retry](no-write-retirement-fixed.json). Two retirement link/unlink
controls watched 28 pass / 2 fail before correction, then passed with original
bytes and the active reference preserved through interruption. Terminal
`recovered-no-write` now requires the prior map; committed outcomes require the
reconstructed after map. [Final affected checks](no-write-retirement-followup.json)
bind `ed02df7` to recovery30 and crash7, both exit 0. The earlier 64-check receipt
remains bound to its original source. No full aggregate has been run for this slice.

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

## Independent composed peer acceptance

Parent reviewer independently accepted the bounded implementation at
`ed02df77391309a34991bda7b1947cc4ea96c7af` on 2026-10-13 after rereading
single-row reconstruction and state-sensitive terminal retirement. The reviewer
replayed the final 30 recovery controls and seven SIGKILL controls, all passing,
and both original portable probes: the ownership-map attack refused while
retaining the sibling record; interrupted no-write retirement resumed successfully.
This records the parent's source-bound judgment and stated replay results, not a
second execution by this author. Acceptance is limited to MB02b; aggregate,
publication, installation, public CLI and lock-resolution admission remain open.

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
