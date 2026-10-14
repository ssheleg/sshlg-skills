# Claude continuation — B190 runtime recovery

Operator stop/handoff instruction received 2026-10-13: finish and leave the plan
and context for Claude. No new scope, experiments, graph/index generation or
release follows this handoff.

## Exact state

- Repository: `ssheleg/sshlg-skills`.
- Candidate source: `3bd80503ee6e47ea829b54b822945234a9332f59`.
- Branch: `fix/runtime-recovery-1013`; pushed normally, remote SHA verified.
- Worktree: `/Users/sshlg/DATA/_wt/hub-graph-order` (reused owned worktree; its name
  does not mean a graph extraction is active).
- Base: `9e667eeaa93f54201c73aa78b542fc26ee297cc2`.
- Entry: [implementation packet](README.md); [source/log binding](checks.json).
- No uncommitted implementation remains. This handoff is a docs-only successor.
- The source is **not accepted as a released/installed result**. Independent
  observer review is pending at handoff; check the parent's final entry for a
  later verdict before repeating work or assuming acceptance.

## What is implemented and measured

`lib/runtime-recovery.js` provides metadata-only inspection and optional POSIX
recovery through fixed `/usr/bin/python3`. A permanent private coordinator inode
uses kernel flock. Python execs Node at the same PID; a child explicitly receives
the same open file description and acquires exclusion on it. New runtime writers
bind lock records to canonical root/device/inode, UID, boot/PID namespace, PID and
nonce. Live/unknown/legacy/changed state refuses. Recovery reuses the existing v2
runtime rollback journal, never a second payload authority.

The fixed-home CLI is `hooks recovery inspect --json`, then
`hooks recovery recover --expect <digest|absent> --json`. Pending/unknown inspection
is nonzero. Missing journal after interruption means `NO_PENDING_JOURNAL` and
`recovered:false`, not a reconstructed historical success.

Measured on Darwin in owned fixtures:

- 33 focused controls pass, including real SIGKILL and concurrent processes.
- Existing runtime atomic suite: 40 controls pass.
- Actual original lock record after SIGKILL remains UNKNOWN; new record is DEAD.
- Root's first-draft OFD finding reproduced false success and is retained in
  [ofd-before.json](ofd-before.json). The corrected distinct-descriptor contention
  control refuses. Do not erase the red receipt or use the old path-contention
  probe as evidence of ownership.
- Exact source hashes in `checks.json` were compared against frozen source.
- UX lint exits 0 with existing U050 warning. Brand lint exits 2; its errors and
  broad advisory inventory are retained in [brand.log](brand.log). No clean full
  brand, aggregate, Linux, installed or provider result is claimed.

## Next steps, in order

1. Read the parent's final handoff and any independent observer verdict for exact
   `3bd8050`. Resolve concrete findings in an isolated successor, preserving the
   frozen red/green receipts. Do not repeat the whole project audit.
2. Compose the accepted candidate only after that review. Parent's current root
   was last read at `7762820b9fc852a185156250ed647f652d7b0322`; it already contains
   runtime documentation/apply-guard and audit-counter corrections beyond this
   branch's base. Recheck current Git, do not overwrite those changes.
3. Complete the **not-started docs bridge** against that current parent source:
   README around312, CHANGELOG1.63, and
   `docs/working-rules/state-json.md#the-runtime-lock-and-failed-refresh` around131
   still describe no supported retirement command. Replace only that superseded
   boundary with the actual commands, optional POSIX/Python capability, exact
   identity admission, legacy UNKNOWN and nonhistorical NO_PENDING_JOURNAL result.
   Preserve the distinction from the outer `update.lock` and the absence of
   whole-tree/power-loss atomicity. The runtime admission error can point to the
   inspection command as the next user action. No bridge edits were started.
4. Keep own-state write review explicit: the new module opens its private
   coordinator via Python and unlinks only the bound runtime lock; host settings
   are never destinations. Existing apply-guard source scans generic JavaScript
   writes, so its pass alone cannot certify this new metadata boundary.
5. Follow the parent's serialized gate schedule. No broad suite was run here.
   Run affected focused checks after any correction, then one final composed
   aggregate when admitted. Recompute ratchets from the actual run.
6. Only after accepted code/test/docs freeze, regenerate the final source graph
   and source-aware wiki index. Earlier graph `1abe7b5` is a historical cut, not
   the final B190 source. Retain all prior reports and IDs. Do not publish or
   mutate installed runtime merely because this source branch is pushed.

## Authority and ownership

No real host runtime, settings, public locks or provider calls were used. Unknown
legacy locks must not be manually removed under this task's name. The filesystem
and process protocol assumes cooperative same-UID writers and a local filesystem;
unsupported platforms/capabilities remain refused.

Task lease `B190-IMPLEMENT-1013`, run `r-freshrbc75ae`, is released at handoff after
the docs successor is committed/pushed. Claude must read current coordination and
acquire its own lease before further mutation. Parent owns integration, board,
version/pins, final graph/index scheduling and release admission.
