# B190 independent review and corrections

Reviewer: a separate non-author agent, read-only, fresh clones, focused suites only
(no aggregate; the shared negatives lock untouched). Source, not installed or Linux
acceptance.

## Round 1 — exact3bd8050: ACCEPT-WITH-FIXES

Reran: `runtime_recovery_test.js` 33, `runtime_atomic_test.js` 40/40,
`runtime_test.js` 8, `runtime_closure_test.js` 6, all exit0; sources matched
`checks.json`. Findings, each reproduced by a scratch script:

1. MEDIUM — after the worker retired the dead lock and rollback refused (a managed
   file changed outside the transaction), the parent returned a generic
   "capability refused" with empty detail; the real reason and the retirement
   were lost while inspect then read `PENDING_JOURNAL`.
2. LOW-MEDIUM — writers bind the resolved root, inspection required the given
   path: a home through a symlink (`/var`→`/private/var`) was permanently UNKNOWN.
3. LOW — `snapshot()` opened without `O_NONBLOCK`: a lock swapped for a FIFO after
   the type check hung `inspect` (killed by an 8s alarm).
4. LOW — refusals without a next step (group-writable root, no runtime,
   BUSY/stale/UNKNOWN sharing one message, missing python3 or the CLT stub).
5. LOW — unstable result shape; usage errors and refusals both exit1; JSON printed
   without `--json`; SCN-011 omitted `PENDING_JOURNAL`.

Confirmed safe: no path retires a live writer's lock; PID reuse can only yield a
false BUSY; no operator-file write bypasses `protect()`.

## Correction0ded7da

Seven new checks, red before the change (one passed only through loose
`assert.equal(undefined, null)` and was made strict). The parent passes the worker's
own JSON through only for exit0+ok or exit2+!ok; otherwise recovered, retired and
restored are `null`. The worker reports `retired` from its catch too. Roots resolve
once; `O_NONBLOCK` plus an `fstat` file check; named remedies; `NOT_INSTALLED`;
usage errors exit2 with state `USAGE`. Result: recovery 40, atomic 40/40, hooks e2e
70, `wait_recovery_cli_test.js` 33, runtime 8, closure 6 — all exit0.

## Round 2 — exact0ded7da: ACCEPT

All four reproduced findings fixed by rerunning the repros (lost reason now
`retired:true`, exit2 and `runtime changed outside transaction: lib/b.js`; also with
the coordinator removed after retirement; symlinked home recovers via the CLI;
FIFO swap refused in 24ms). Same five suites green. Three LOW findings remained,
fixed in dc320c5 with one new check (41 total): an unbound lock from a crashed
writer is never released, so the advice no longer says to wait; a dangling runtime
symlink is UNKNOWN, not "run hooks install"; `hooks recovery --json` without an
action prints JSON.

## Not established

Linux boot identity and PID namespaces, network filesystems, power loss, the real
Command Line Tools stub, a mixed installed/older-npx generation, and the full hub
aggregate on the merged source.
