# Runtime failure and recovery correction — 2026-10-13

Source baseline: `3898236` (independent observer finding; R03/R33, C10,
FIX-UP-05.01 / FIX-UP-05.04). This is an isolated source correction; no installed
runtime or real host settings were changed. Parent owns the full-suite slot.

## Reproduced boundary

[Baseline](baseline.json) runs the original module in owned temporary directories:
second switch rename failed, `lib/a.js` was new and `lib/b.js` old while the return
said "old runtime intact". A malformed journal returned as no recovery, and a
switched introduced file survived a reported successful recovery.

The original CLI interpreted a returned `reason` as skipped; hooks install ignored
the result. [Exact archived CLI baseline](cli-baseline.json) records all four
faulted commands exiting 0, including install rewriting settings. The actual CLI
controls now inject staging and second-switch failures
under isolated HOME, PATH tools and the existing native-boundary shim. Both update
and install return nonzero; install settings remain byte-identical. This proves
local CLI failure propagation, not native/provider operation.

## Implemented contract

- `sync` returns explicit `ok` / `status`; absent refresh is the sole benign skip.
  A failed refresh suppresses hook rewiring and makes update fail; failed install
  leaves settings unchanged and does not claim scripts were synchronized.
- Required hooks/lib source directories and both flat manifests are admitted
  before transaction/recovery writes. Read-only `stale` retains its older best-effort
  discovery behavior. Missing, unreadable, linked or nonregular source input refuses.
- Version-2 journal records each managed relative path, old existence and hash/mode,
  and intended hash/mode. Snapshots and journal are flushed before switching.
  A caught switch failure attempts immediate verified rollback. Introduced files
  are removed only when their bytes/mode match this transaction.
- Recovery preflights the whole journal, backups and current paths before writes;
  malformed/legacy records, missing/changed backups, traversal, symlink parents or
  unrelated current bytes refuse and retain recovery evidence. Retry accepts both
  known old and known new bytes. Legacy journal migration is deliberately unresolved:
  its absent backup cannot distinguish new files from lost recovery data.
- Every sync/recover caller uses an exclusive runtime lock. Existing, malformed or
  stale lock refuses; no automatic dead-holder takeover. A hard crash retains lock
  and journal and is explicitly unresolved until the holder and exact lock are
  inspected/resolved. The owned-child control removes only its known exited child's
  fixture lock, then proves recovery. This does not introduce a production force or
  automatic lock-steal option.

These are process/filesystem failure guarantees. The switch remains per-file:
already-running hook readers can observe it, and no power-loss, hostile-writer
TOCTOU, cross-host locking or atomic directory-generation visibility claim is made.
Unknown user files stay outside the transaction.

## Focused evidence

- [Focused output](focused.txt): `node test/runtime_atomic_test.js`, 40/40, including
  actual CLI faults, caught switch positions, hard child exit, nested writer,
  introduced files, corrupt journal/backup, path kinds, missing source and retry.
- [Existing tests](existing-focused.json): owner runtime/closure and FIX-UP-05.01 /
  FIX-UP-05.04. The recovery fixture now writes the existence-aware version-2
  journal and uses a real managed hook path; its old/mixed/all-new assertions remain.
  Synthetic packages now include the actually required package manifest.
- First implementation replay was 22/24: `runtimeReady` was declared in the plan
  renderer rather than cmdUpdate. Both actual CLI update controls exposed the
  ReferenceError. Declaration was corrected; this failed replay is not acceptance.

Next: independent immutable-source review, parent integration and full owner gate.
A separate recovery-completion packet must provide a safe, supported way to resolve
an interrupted writer's retained lock; this slice provides safe refusal, not that
automatic recovery workflow. The CLI names the exact lock/journal inspection paths;
no operator approval or unsafe force-remove command is introduced.

For an unresolved lock the next agent first preserves lock, journal and previous
snapshot as one receipt, resolves the exact recorded holder (PID alone is not a
portable process identity), and confirms no other sync/install writer can run.
Do not remove an alive, unknown, changed or malformed lock. This version has no
supported lock-retirement command: the next packet must specify ownership proof,
exclusive retirement, recover-only behavior and negative controls before adding it.
A manually inspected environment may restore a preserved complete generation under
exclusive control, but fixture unlink is not offered as a production procedure.
No version, release, installation or overall completion claim.

## Independent-review follow-up: read-only discovery admission

The first frozen candidate f665c532 passed the independent 37-control replay. A
separate self-review then found that update calls `stale()` before `sync()`: an
existing managed FIFO could block that read. The observer confirmed the source
seam; [actual CLI baseline](stale-fifo-baseline.json) timed out after two seconds
in an owned fixture and its child was killed. `stale()` now checks regular-file
kind before reading and reports unsupported files as differing; strict sync then
refuses. Two real CLI controls require prompt failure and preserve the target FIFO and
settings; a separate timed child control proves source FIFO discovery also returns
without opening it. Earlier source acceptance does not cover this subsequent correction.
