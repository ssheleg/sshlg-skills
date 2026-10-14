<sub>ssheleg skills — task-pipeline · agent-sync · evidence-docs · ux-scenarios · copywriting</sub>

# B190 — supported runtime crash recovery

Source-only implementation, 2026-10-13. Base `9e667eeaa93f54201c73aa78b542fc26ee297cc2`.
The [design snapshot](https://github.com/ssheleg/sshlg-skills/blob/6880776dab0efaeafd925ba404b31a387f26f770/docs/reports/2026-10-13-runtime-recovery-admission/README.md)
remains historical. This packet selects kernel exclusion rather than a chain of
filesystem reclaimer locks. No real host runtime, settings or public lock was changed.

## User path and admission

The source CLI adds `hooks recovery inspect --json` and
`hooks recovery recover --expect <digest|absent> --json`. Both use only the existing
hooks runtime under the current home; there is no arbitrary-path flag. Inspection
writes nothing and emits metadata, never file contents. `ok` on an inspection
means observation completed, not that recovery is authorized. Pending journal,
dead/live/unknown lock observations exit nonzero; only `NO_LOCK` exits zero.

New ordinary writers record an exact canonical root path/device/inode, UID,
same-boot identity, PID and random nonce. Linux additionally binds the PID namespace.
Only an exact expected record with a current `ESRCH` observation is eligible.
An existing live PID is BUSY even if it might have been reused. Legacy or partial
records, duplicate keys, invalid UTF-8, unknown fields, another root/boot/inode,
unsafe modes/links and unavailable process evidence remain UNKNOWN. There is no
timeout, stale-PID override, force flag or lock-removal advice for unknown state.

Recovery is an **optional POSIX capability** using fixed `/usr/bin/python3`, its
stdlib `fcntl`, and the already running Node executable. It installs no dependency
and never searches PATH for an alternative helper. Ordinary sync remains Node-only;
if process identity is unsupported, its lock cannot be automatically retired later.
Darwin actual execution is covered here; Linux code paths require separate platform
execution before a Linux runtime acceptance claim. Windows recovery is unsupported.

## Exclusion and crash semantics

`lib/runtime-recovery.js` creates or opens a permanent private regular coordinator
inode. Existing mode/UID/link/type failures refuse without chmod or replacement.
The file is never unlinked, pruned or used as a TTL/PID lease. Python acquires a
nonblocking `flock`, marks the descriptor inheritable, and **execs Node at the same
PID**. The worker retains that open description for its entire payload-writing
lifetime. A short Python child explicitly receives that same descriptor and
acquires `LOCK_EX|LOCK_NB` on it; a different description held by another process
refuses. No process calls `LOCK_UN`. Boot probes do not inherit this descriptor.

Under this exclusion the worker checks root/inode/current lock twice, retires only
the observed dead lock, and calls the existing `runtime.recover()`. That function
still owns the v2 journal's complete preflight, before/after fingerprints, original
existence/mode restoration and commit. A normal writer can win the interval before
the new `wx` lock; recovery then refuses and never removes that successor. A killed
recovery worker releases kernel exclusion; if it left a new runtime lock, the next
inspection proves that exact new holder dead before retrying.

If the journal disappeared before the caller received its result, a later call
reports `NO_PENDING_JOURNAL` with `recovered:false`. This is a current observation,
not a fabricated historical commit or rollback receipt. No second payload journal
or terminal-authority registry is introduced. Interrupted helper/worker calls,
nonzero exit with success-shaped stdout, signals and timeout never report success.

The API assumes cooperating same-UID writers and a local filesystem supporting
POSIX flock. It does not defend against a hostile same-UID process replacing the
coordinator after the final check, network-filesystem lock semantics, power loss,
whole-directory visibility to running readers or an installed release not yet
refreshed. Permanent private-inode preservation is part of the protocol. The
outer `update.lock` is a different mechanism and is not reused or repaired here.

## Evidence and corrections

- [Baseline replay](baseline.py), [result](baseline.json): actual SIGKILL under
  accepted `56ca9ea` leaves an UNKNOWN legacy record; current writer leaves DEAD
  identity-bound evidence. Both use isolated temporary directories, removed after
  the probe. This does not migrate legacy records.
- [Root finding before correction](ofd-before.json), [log](ofd-before.log): the
  first worker checked contention on a separately opened path, which proved that
  **some** process held the lock. A direct worker with a different unlocked FD
  incorrectly returned RECOVERED while a legitimate reclaimer was paused. The
  corrected same-open-description acquisition is covered by the actual competing
  worker control. This initial source was never presented as accepted.
- `node test/runtime_recovery_test.js`: 33 checks pass, including actual killed
  writers/reclaimers, two concurrent requests, normal-writer gap preservation,
  coordinator replacement/FIFO refusal, copied dead record in a replaced root,
  strict metadata controls, helper failures and actual fixed-home CLI behavior.
- `node test/runtime_atomic_test.js`: existing 40 controls pass on the composed
  module seam; no broader gate was run while the parent owned that slot.
- UX linter: exit 0, existing U050 missing Web-surfaces declaration remains.
  Brand linter: exit 2, existing marketing-source/other corpus errors and broad
  B022 advisory inventory remain; this is not a clean brand gate. Local wrapper
  paths `docs/{ux,brand}/lint.py` were first attempted and absent; installed scripts
  were then located and run. The UX status `proposed` was corrected to the schema's
  `implemented` before final lint. No site build was added just to hide missing
  generated marketing inputs.

[Source-bound receipt](checks.json) holds exact command exits, hashes and logs.
Initial canonical `/var` test-alias and circular-export startup mistakes were
corrected during development; they are not evidence of successful recovery.
Independent peer and final composed aggregate remain pending.

## Ownership and next task

Owned source: new runtime-recovery module/test, one runtime lock-record call, a
bounded hooks CLI branch, SCN-011 and its string rows. No settings or instructions
are write destinations. The coordinator and lock are runtime-owned metadata;
the existing runtime module remains the only payload writer. The current apply
guard enumerates generic `fs.writeFileSync` writers; the new module does not need
an exemption there, but its Python metadata open and bound lock unlink are explicitly
reviewed here rather than claimed to be detected by that JavaScript-only guard.

Next: independently replay the frozen source and inspect its OFD/process boundary;
then compose the parent's runtime documentation correction and replace its now
superseded “no supported retirement command” statements. Aggregate, graph, release
and installed acceptance remain separate. Preserve all UNKNOWN legacy locks.

Primary references fetched 2026-10-13:
[Python fcntl](https://docs.python.org/3/library/fcntl.html),
[Python descriptor inheritance](https://docs.python.org/3/library/os.html#inheritance-of-file-descriptors),
[flock open-description semantics](https://man7.org/linux/man-pages/man2/flock.2.html),
[Node signal-zero semantics](https://nodejs.org/api/process.html#processkillpid-signal).

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)** — task-pipeline:
bounded delivery; agent-sync: ownership; evidence-docs: receipts; ux-scenarios:
CLI path; copywriting: technical CLI messages. Humanization: manual technical-copy
pass; full brand lint remains nonpassing as disclosed above.
