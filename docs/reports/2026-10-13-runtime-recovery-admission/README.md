---
report:
  id: sshlg-skills/2026-10-13-runtime-recovery-admission
  title: "Runtime crash recovery admission: bounded implementation packet"
  kind: research
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-10-27
  summary: >-
    Current runtime recovery safely refuses an abandoned lock but has no supported
    retirement command. Reusing update.lock takeover is unsafe: a deterministic
    owned fixture reaches its documented successor-loss branch. This packet proposes
    identity-bound inspection and exclusive retirement, with explicit platform,
    legacy-record and interrupted-reclaimer limits. No production implementation.
  sources:
    - name: "Frozen accepted runtime composition"
      url: "https://github.com/ssheleg/sshlg-skills/commit/56ca9ea41e40efa0b2b6240411711c480f091e8e"
      read_at: 2026-10-13
    - name: "Node process API"
      url: "https://nodejs.org/api/process.html#processkillpid-signal"
      read_at: 2026-10-13
    - name: "Node filesystem API"
      url: "https://nodejs.org/api/fs.html#file-system-flags"
      read_at: 2026-10-13
    - name: "Linux process start identity"
      url: "https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html"
      read_at: 2026-10-13
    - name: "Apple boot session kernel source"
      url: "https://github.com/apple-oss-distributions/xnu/blob/main/bsd/kern/kern_sysctl.c"
      read_at: 2026-10-13
  produced_by:
    agent: "Codex fresh_research"
    task: "B190 supported crash-recovery admission design"
  supersedes: []
  consumers: ["sshlg-skills B190"]
---

<sub>ssheleg skills — task-pipeline · evidence-docs · project-reports</sub>

# B190: recover a crashed runtime writer without deleting a successor's lock

**Recommendation:** keep the existing per-file runtime transaction and add an
explicit, identity-bound inspection/retirement protocol. Do not copy the current
update-lock takeover algorithm, introduce a timeout-based force switch, or migrate
all payloads to generations merely to resolve this lock. The first implementation
packet must prove exclusion between reclaimers as well as between writers. B190
is not closed by an inspection command or by a fixture that unlinks a dead child’s
lock.

This is a design packet, not an implemented or accepted recovery procedure. Source
is frozen at `56ca9ea`; [runtime evidence](../../evidence/completion-1013/runtime-atomic/README.md)
is the existing failure-containment contract. Implementation, process-control
concurrency tests, native/installed readback and full gates remain NOT_RUN here.

## Current source and constraints

[`lib/runtime.js`](../../../lib/runtime.js) owns both `sync` and `recover` through
`withLock`. The exclusive `.sync.lock` contains only `pid` and a random `nonce`.
Its version-2 journal binds managed relative paths, prior existence/hash/mode and
intended hash/mode. `recoverUnlocked` validates the complete journal and backups
before rollback, refuses unrelated bytes, then removes the journal as its commit.
There is no public lock-retirement command in
[`cmdHooks`](../../../bin/sshlg-skills.js). The owner test's known-child fixture
unlink is not an available production recovery mechanism.

The package declares Node `>=16`; the [local capability receipt](raw/local-capabilities.json)
observed Node26.10 on Darwin and no `fs.flockSync` API. A bounded read-only call to
`/usr/sbin/sysctl -n kern.bootsessionuuid` succeeded; its value was not retained.
This proves local availability, not a portable identity adapter. No real runtime
lock, profile, settings or process was modified/signalled.

### Existing update lock is unsuitable prior art

[`lib/updatelock.js`](../../../lib/updatelock.js) and
[its documented contract](../../working-rules/state-json.md#the-update-lock)
use same-host PID liveness, foreign-host age and a rename/check/link-back takeover.
The documentation already admits a third-writer race; the source also permits a
lock-creation failure to degrade into an unprotected run. Neither is admissible
for destructive recovery.

The [deterministic owned probe](raw/update-lock-race.js) exercises the existing
`beforeTakeover` and `linkSync` seams: judged lock101 is replaced by successor202;
a third lock303 occupies the public name before restoration. The attempt refuses,
but the displaced successor202 record is discarded while303 remains. The
[result](raw/update-lock-race.json) records exact observations and fixture cleanup.
It is a source-branch counterexample, not an actual concurrent-process benchmark.
[Probe history](raw/probe-attempts.json) retains the initial probe-path error; no
fixture had been created on that failed attempt. This packet does not fix the
separate update-lock mechanism.

## Required admission evidence

Inspection is read-only by default. It emits bounded JSON metadata, not contents:
status, canonical runtime-root binding, private-record schema/version, record
hashes, inode/device identities, holder classification, journal/backup validity,
managed before/after/unknown counts and the exact next supported action. Never
print file bodies, environment, command arguments, host identifiers or secrets.
An explicit saved receipt may live only in the owner's private namespace.

New writer records need: schema, random operation nonce, PID, UID, platform,
**kernel boot identity**, runtime-root binding and source generation. Capture the
process-start identity where the platform can provide it; bind the journal to
this operation rather than infer it from proximity. Store identifiers privately;
public diagnostics use digests and classifications. Publish complete records
before a writer can mutate any payload. Bad UTF-8, duplicate keys, unsafe numbers,
extra/unknown schema fields, links, nonregular files, changed ownership/mode and
root retargeting must refuse, not become absence.

| Observation | Proposed decision |
|---|---|
| Fresh observation says any process currently occupies the recorded PID | BUSY; do not retire, even if a start-time mismatch suggests reuse |
| Signal-zero returns EPERM, a probe times out, parsing is incomplete, or the boot/profile identity differs | UNKNOWN; no retirement |
| Same admitted boot/profile, exact identity-bound record unchanged, and a fresh kernel observation says the recorded PID is absent | DEAD candidate; still needs the retirement election below |
| Legacy current `pid`/`nonce` record lacks boot/profile identity | LEGACY_UNBOUND; inspect only unless separately retained, source-bound process-exit evidence proves the original writer |
| A receipt merely contains an old PID, wall-clock age, or an agent's assertion of exclusivity | Not admission evidence |

The strict absent-PID branch deliberately refuses a currently reused PID instead
of treating a different start time as permission. It combines kernel currentness,
boot/profile binding and immutable operation identity; it is not a PID-only or
age-based steal. Same-boot-only admission is a conscious first-platform bound.
A reboot/moved profile does not inherit authority by comparing wall clocks.

On Linux, `/proc/<pid>/stat` field22 supplies process start ticks; parse its `comm`
field correctly rather than splitting the whole record on spaces. Bind the boot
and PID namespace; missing or inaccessible procfs is UNKNOWN. On Darwin, the
kernel exports `kern.bootsessionuuid`; the bounded absent-PID branch can use that
with `process.kill(pid, 0)`. Human-readable `ps` start strings must not authorize
PID-reuse retirement. More precise Darwin process-start data exists in libproc,
but introducing a native binding/helper is a separate compatibility decision.
Windows, containers with unproven namespace mapping, and network filesystems stay
inspection-only until an equivalent capability is implemented and tested.

## Retirement transaction and its race proof obligation

Proposed CLI names below are **design labels, not existing commands**:
`hooks recovery inspect --json`, `hooks recovery retire --operation <id>
--expect <digest>`, then `hooks recovery rollback --operation <id>`.
No arbitrary path argument, `--force`, age threshold or process-kill option.
Normal `update` remains non-stealing; unresolved state returns nonzero with a
supported next action. Human approval is not invented for these already-authorized
local operations; unknown evidence is a technical refusal, not a consent request.

1. Admit the entire private namespace, exact root/lock/journal/backup identities,
   intended action and dead-writer evidence before mutation. Inspection output is
   advisory; the execution command re-reads everything.
2. Elect **one** reclaimer for the exact abandoned lock identity. The key includes
   canonical root, lock bytes hash, device/inode and operation nonce. Publish a
   fully prepared immutable claim with exclusive destination creation; never
   truncate an existing claim. A second contender refuses/reports the same claim.
   Local-filesystem exclusive publication is the required primitive, not a prior
   existence check. Publication faults cannot produce an apparent valid claim.
3. Every supported writer checks the active recovery fence both before acquiring
   `.sync.lock` and again after acquisition, before any runtime write. This closes
   the writer that inspected before the fence appeared but acquired after the old
   lock was retired. A writer that acquired the name but loses admission releases
   only its own exact token. Old/nonparticipating writers remain outside this proof.
4. The elected, still-current reclaimer rechecks the original lock and holder.
   Only then retire the **original** lock once, preserving its bytes in the
   operation receipt. A changed name is refusal, never rename-and-restore guessing.
   The safety argument requires a proven-dead original holder and a sole elected
   reclaimer; a compare followed by unlink alone is not atomic compare-and-delete.
5. Retirement alone changes metadata, not managed payloads. Rollback is a separate
   explicit action using the existing runtime writer admission and whole-journal
   verification. It must never run `sync(pkgRoot)` or install a new package as an
   incidental recovery action. Keep the fence until that operation has a verified
   terminal state; release only the executing process's exact new lock.
6. Publish an immutable terminal outcome with before/after bindings. A replay of
   the old operation returns its historical outcome and **never unlinks the current
   `.sync.lock`**. A later writer's lock is not an object this operation may retire.
   Malformed/changed/partial receipts remain visible and unresolved.

**Critical unfinished proof:** a reclaimer itself may crash before retirement,
after retirement, during rollback, or before publishing the terminal outcome.
A naive fixed recovery mutex only moves the stale-lock problem. An initial slice
may conservatively retain that claim as RECOVERY_REQUIRED, but that does not finish
B190. Before claiming completion, either implement a kernel-held recovery mutex
with an admitted platform adapter, or specify and prove an immutable claim-successor
protocol: a fresh claim may succeed only a proven-dead exact predecessor, never
replace/delete it, with a single exclusive successor slot and no TTL cleanup.
The live leaf alone authorizes writes; all ancestors and terminal records remain
replay evidence. This is a generation chain for recovery ownership, **not** a
migration of runtime payload paths. Test every publication boundary and process
interleaving before choosing it over the simpler platform mutex.

The packet recommends delivering inspection/identity capture first, then the
exclusive retirement substrate and interrupted-reclaimer continuation as one
reviewed mutating slice. Do not ship a convenient unlink command in between.

## Alternatives and dependencies

| Option | Assessment |
|---|---|
| Existing update-lock takeover | Rejected by the retained counterexample and its age/degraded rules |
| Compare inode/hash then unlink, or rename and restore on mismatch | Insufficient without reclaimer exclusion; can displace a successor |
| Kernel advisory lock on a permanent, never-unlinked coordinator file | Simpler crash-release semantics, but Node16 core provides no accepted flock adapter here; Python, addon or OS helper is an explicit dependency, not silently zero-dependency |
| Node-only immutable recovery-claim successors | Fits standard filesystem APIs, but needs a state-machine proof, bounded scan/replay and crash controls; partial claims must remain inert |
| New immutable runtime payload directories plus pointer switch | Can address readers seeing mixed generations, but does not by itself solve writer/reclaimer admission; broader migration is not required for this packet |

Do not add a second competing restoration registry: the runtime journal remains
payload authority; subordinate recovery claims only decide which process may act.
Keep backup-retention/wait/Claude recovery owners separate. The outer update lock
is not a trusted substitute for runtime exclusion. Namespace/retention pruning is
not automatic: no PID/TTL deletion of claim history or recovery backups.

## Executable next packets and acceptance controls

- **R190-A, inspection and writer identity:** owner `lib/runtime.js`, a small shared
  identity module, CLI recovery route and state-format docs. Add machine-readable
  scenario/error contract before CLI strings. Controls: valid state; legacy state;
  alive/EPERM/ESRCH/unknown; same PID under another boot/namespace; reused live PID;
  duplicate keys, oversized/invalid UTF-8 JSON, unsafe numeric identity, symlink,
  hardlink, mode/UID mismatch, FIFO, root retarget and inaccessible discovery.
  Assert read-only bytes/modes/pathset before and after every refusal.
- **R190-B, retirement election and rollback admission:** run real owned child
  processes with barriers, not sleeps as proof. Two reclaimers inspect the same
  dead writer; exactly one wins. A writer enters before/after fence creation; none
  writes under ambiguous admission. Plant a new writer lock at every pre-unlink
  seam; stale replay must preserve its inode and bytes. Exercise every journal
  before/after mixture, introduced files and corrupt backups through existing
  recovery. Refusal must not partially alter unrelated managed or foreign data.
- **R190-C, interrupted-reclaimer completion:** SIGKILL at every durable transition,
  including prepared-but-unpublished claim, published claim, lock retirement,
  new lock acquisition, each rollback file, journal commit and terminal record.
  Resume or explicitly refuse from an attributable state; never let two leaf owners
  act. Gate B190 closure on the declared supported recovery cases, not just a green
  normal path. A stuck claim must name a real next task, not suggest manual unlink.
- **R190-D, composed acceptance:** source/API compatibility, package closure,
  CLI JSON/privacy, exact installed-runtime readback after release, then the
  coordinator's full suite. Benign controls include no runtime/no journal,
  current alive writer, completed historical operation and unrelated extra files.
  No synthetic result may be relabelled installed recovery.

All mutation tests use isolated owned directories and children. No existing host
lock, real profile, public `/tmp` namespace, provider call or broad suite is needed
for design validation. Current graph/release publication is independent of this
next-wave packet; the retained-lock limitation must remain visible meanwhile.

## Primary documentation read on 2026-10-13

- [Node process.kill](https://nodejs.org/api/process.html#processkillpid-signal)
  documents signal-zero existence probing. It is not a stable process handle.
- [Node filesystem flags](https://nodejs.org/api/fs.html#file-system-flags)
  documents exclusive creation and its network-filesystem caveat; filesystem
  pre-checks do not replace handling the actual operation's result.
- [Linux proc stat](https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html)
  defines boot-relative process start ticks. [pidfd_open](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)
  offers a Linux process handle; using it from Node16 would need an admitted adapter.
- [Apple kernel boot identity](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/kern/kern_sysctl.c)
  and [Darwin process fields](https://github.com/apple/darwin-xnu/blob/main/bsd/sys/proc_info.h)
  distinguish boot/session and process-start data from file mtime.
- [Apple flock documentation](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/flock.2.html)
  describes advisory exclusion among cooperating processes, not hostile-writer safety.

[Source ledger](raw/sources.json) records fetched claims and scope without copying
whole external documents. The candidate algorithm above is design inference;
primary documentation does not certify this repository's proposed protocol.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded recovery packet
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source and safety boundaries
- `project-reports` — dated research record — not a skill this family ships
