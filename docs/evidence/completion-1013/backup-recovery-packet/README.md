<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# MB02b: recovery references and journal integration packet

**PROPOSED, NOT IMPLEMENTED.** Owner: hub. Next task: implement the retention
substrate and its first wait-rule adapter, on a branch containing accepted MB02a,
then obtain independent review before connecting other writers. This packet
changes no host file, release, policy, registry, journal or implementation.

Frozen consumer source: `e245e96` (full identity and blobs in [sources.json](sources.json)).
Backup substrate: [`27e2ed015affd4a9774a7309d37abda9f13fdc58`](https://github.com/ssheleg/sshlg-skills/commit/27e2ed015affd4a9774a7309d37abda9f13fdc58).
Its [peer receipt at 501e8f4](https://github.com/ssheleg/sshlg-skills/blob/501e8f45166859434703012736ee4e947cd01cea/docs/evidence/completion-1013/backup-identity-followup.md)
certifies canonical identity and publication only. This packet refines the older
[managed-blocks proposal](../managed-blocks-packet/README.md), especially its
proposed second generic `blocks.jsonl` stream: **do not introduce that competing
operation authority while existing owner receipts already govern these writers**.
No new ownership is inferred for REPOSITORY-HANDOFF, Observatory, or other foreign
blocks. B180 remains outside scope.

## Verified gap and evidence boundary

At the accepted MB02a source, a synthetic file saved with `keep: Infinity`, followed
by eleven ordinary saves of that same target in the same backup directory, loses
the original copy. [reproduce-retention.js](reproduce-retention.js) records the
actual boundary; [retention-observation.json](retention-observation.json) is its
captured output. This is not a claim that Claude's current private operation
namespace has suffered this loss. That caller already isolates its backups.

MB02a also deliberately leaves any failed `.unverified-` publication unresolved,
refusing automatic restore. It cannot establish which legacy flattened backup
belongs to a target. Neither marker age nor a successful later save is resolution.
Recovery classification and retention protection are the next implementation,
not implied by the existing focused green tests.

## Existing owners and compatibility contracts

The line addresses below refer to the frozen consumer source, not a moving main.
[sources.json](sources.json) binds every listed file to its Git blob and SHA256.

| Consumer | Current authority and behavior | Required change / limit |
|---|---|---|
| `lib/apply.js:136` | `protect()` forwards to `backup.guard`; callers expect saved/no-file/backup-failed. Router edits, removals and opt-out use it. | Keep this legacy return/API behavior. New referenced protection is opt-in until an adapter is tested. Ordinary pruning must nevertheless respect durable retention references. |
| `hooks/pre-tool-use.js:233,243` | Obsidian setup copy is best-effort; instruction-file copy failure denies that edit. | Preserve the two actual contracts; do not present the first hook as guaranteed admission. |
| `hooks/post-tool-use.js:129,143` | Sole production `latest()` consumer selects then protects before Obsidian config merge. | MB02a refuses unbound/unverified copies. A later hook adapter needs an operation-linked snapshot; latest-by-time is not proof which invocation owns it. |
| `lib/wait-rules.js:6,16,86` | `wait-rules.json` owns installed segments and a pending record; pending refuses subsequent apply. | Extend this same receipt with existence-aware snapshots, operation ID, exact backup reference and recovery classification. No second ownership home. |
| `lib/wait-rule-policy.js:37,47` | Exclusive non-stealing lock; protected write, compare-before-rename, consent callbacks, readback; lossless UTF-8 admission. | Reuse admission and private lock behavior. Preserve current consent per target and current file mode. Do not recursively reacquire its receipt lock. |
| `lib/visibility-state.js:54,90,100` | `visibility.json` owns before/after pending state; readback classifies even a failed native action. | Reuse this state machine; add backup references through a versioned adapter rather than a second transaction stream. Existing Hermes semantics require separate fixture coverage. |
| `lib/claude-pin-transaction.js:5,83,87,102` | Per-profile operation directory; plan.json, receipt.json, latest.json; private backups with Infinity, native action intent and uncertain result. | Retain its one operation journal and existing uncertainty refusal. Add common reference validation without moving recovery files or reinterpreting timeout as no-effect. |
| `bin/sshlg-skills.js` | Additional protect calls for hooks, domain/settings edits, marks, injectors, lock updates and uninstall. | Do not migrate every caller implicitly in the substrate patch. Inspect the frozen callsite list before MB03 adoption; same return behavior and foreign-byte preservation remain required. |

The CLI callsite inventory is mechanical source data, including comments, not a
count of separate write guarantees. See sources.json for matched lines. Existing
visibility/Claude receipts are separate domain authorities, not interchangeable
records merely because both use the word pending.

## Proposed minimum substrate

1. **Keep operation authority in its current receipt.** An adapter supplies a
   known owner kind, exact receipt locator, schema version, operation ID, canonical
   profile/target, before existence/hash/mode, expected after existence/hash/mode,
   consent binding and the verified backup hash/path. The backup library never
   accepts arbitrary JavaScript, executes a locator, guesses ownership from text,
   or authorizes a host write. Unknown owner/schema refuses recovery mutation.
2. **A retention reference is subordinate metadata, not another registry.** Store
   a private immutable reference beside the backup, bound to its canonical target,
   complete backup name/hash and owner receipt/operation. It only prevents pruning.
   It cannot grant restore, consent, completion or ownership. A missing, malformed,
   unreadable or changed owner receipt keeps the reference unresolved and retained.
   No TTL, PID check, mtime or parent process exit releases it.
3. **Close save-to-reference races.** Under a cooperative backup-directory lock,
   allocate the unique backup, create its provisional retention reference before
   publication can become prune-eligible, verify publication, and finalize the
   immutable binding. If any step fails, preserve the provisional reference and
   refuse outward write. Old protect callers take the same pruning lock and honor
   references. An orphan reference costs space rather than recovery bytes.
4. **Lock ordering is explicit.** Owner-operation/receipt lock precedes backup
   directory lock. Release the backup lock before persisting the owner receipt;
   the provisional reference already protects the file. Receipt writes themselves
   may call protect, so they must not re-enter a held backup lock. Never call an
   owner callback while holding the backup lock. A stale lock is evidence, not
   permission to steal. Inject failures at each lock/reference boundary.
5. **Owner commits intent, then writes.** Attach the reference to the existing
   owner pending record using its protected atomic writer. Persist pending before
   touching the target. Only then recheck current consent/profile/target and use
   the existing exact-byte writer. Return partial per-target results honestly.
   Failure to attach the reference means no target mutation; leave the reference
   as unresolved evidence. No group-atomic or arbitrary-writer CAS claim.
6. **Release only after verified terminal classification.** A registered adapter
   validates the exact owner operation, current canonical profile, backup hash and
   terminal receipt revision, under the owner lock. Then under the backup lock it
   retires that operation's reference with durable evidence. Multiple references
   keep the copy until every reference is resolved. Ordinary KEEP is applied to
   unreferenced history in addition to retained referenced copies. Never delete
   a different operation's reference or unknown legacy files.
7. **Modes and bytes remain contractual.** Private directories 0700 and references
   0600; reject symlinks/nonregular files, unknown versions, duplicate JSON keys,
   invalid UTF-8 and ambiguous numeric metadata before mutation. Do not chmod
   unknown foreign state to make it admissible. Preserve target modes and exact
   bytes outside the admitted segment. Reference hashes are integrity evidence,
   not cryptographic authorization. Specify directory-fsync portability and test
   its supported behavior before making any power-loss durability claim.

This names new *retention metadata* deliberately. A second copy of consent,
ownership state or full operation transition history is forbidden. The referenced
existing receipt remains the only source from which its adapter can classify
terminal state. The draft implementation API names should be chosen in source;
this packet does not advertise unimplemented CLI flags.

## Recovery, first adapter and explicit limits

Start with wait rules: it has a narrow known segment, per-target current-consent
checks, a non-stealing receipt lock and an explicit pending stop. Add an explicit
read-only classifier first. Distinguish absent file from empty file (the current
pending hashes alone collapse those inputs), and deletion from replacement.
Current bytes equal before: classify no-write without repeating the write. Current
bytes equal after plus matching profile, source, consent and verified backup:
classify committed. If before and after are indistinguishable, do not infer which
side effect occurred; classify the no-op explicitly. Any third bytes, retarget,
missing/corrupt backup or uncertain owner state remains unresolved.

Classification is not restore. Restore requires the existing owner's current
operation authority, protects the current file as a new operation, compares again
before replacement, preserves foreign text/mode and records its own readback.
Automatic rollback after timeout or native uncertainty remains prohibited. Legacy
backups require proved ownership; `.unverified-` copies require separate content
and identity review. Neither can be auto-adopted because its filename resembles
an expected name. Implement metadata-only diagnostics before any recovery writer.

Do not auto-migrate arbitrary installed receipts. An old receipt without pending
may be explicitly read through a compatible versioned adapter; old pending state
without an exact backup reference stays unresolved. Preserve its bytes and give
an actionable local evidence location. No secret values enter public receipts.

## Ordered work and acceptance

| Unit / implementer | Owned area | Required observed failures and exit evidence |
|---|---|---|
| MB02b-1 hub backup author | backup/reference core, focused tests | First replay the supplied Infinity/ordinary-writer loss. Then two real processes: reference created while another save prunes; all referenced copies survive and unrelated history still prunes. Orphan/malformed reference and failed journal attachment preserve copies. Unknown schema/foreign mode/symlink refuses without chmod or deletion. |
| MB02b-2 hub wait adapter author | wait receipt/policy adapter and tests | Crash/failure after backup, after pending, before rename, after rename and before final receipt; restart classifier sees before/after/third/absent/empty correctly. Repeated classifier performs zero host writes. Policy turned off between targets, retarget, concurrent target edit and failed readback refuse; earlier targets remain explicitly reported. |
| MB02b-3 independent peer | source + independent process controls | Remove pin honoring to watch race test fail; remove existence from snapshot to watch absent/empty test fail; falsify terminal receipt to ensure no release. Review no recursive locks and no new operation/consent authority. |
| MB03 hub integration author | existing owner adapters, one at a time | Visibility/Hermes, Claude transaction and hooks retain their original semantics. An incomplete native command never releases a recovery reference or rewrites host settings. A hook cannot select a different invocation's newer snapshot. Legacy protect-only callers remain compatible. |
| Parent integration | final merged source and release docs | Run one serialized aggregate after focused/peer gates and final composition; compute ratchet changes, keep prior failures. No installed or whole-system claim from local tests. |

Do not parallelize edits to backup core across units. The parent can assign docs,
source review and synthetic controls independently. An author claims shared
registries only when actually editing them; this packet allocates no new board ID.
A missing machine capability or foreign ownership decision is recorded separately
and must not stop authorized hub substrate work.

## Packet validation

`python3 docs/evidence/completion-1013/backup-recovery-packet/check.py` exited 0:
ten immutable source blobs, the CLI callsite inventory, local links and historical
retention observation checked. `node --check` on the supplied reproduction and
`git diff --check` also exited 0. The checker requires the exact referenced Git
objects; a shallow standalone packet checkout must fetch the named source refs
before verification. This is packet validation, not a production test gate.

## Handoff

Next implementer reads this packet, the exact MB02a peer receipt and the existing
wait/visibility/Claude owners above, then reproduces the supplied retention gap.
Parent reviews the proposed reference format and lock ordering before code is
connected to writers. No broad suite, operator profile mutation, foreign project
edit, release or provider call was performed for this planning packet.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded follow-up decomposition and compatibility gates.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — exact-source findings, negative controls and explicit limits.
