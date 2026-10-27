# `~/.sshlg-skills/state.json` and `update.lock` — the interface

Written 2026-10-12 (R05, board B-159). `state.json` was an implementation detail until an
external program began reading it. This page is its single home: the keys, who writes
them, who reads them, and the lock that keeps two `update` runs from racing.

## The file

`~/.sshlg-skills/state.json`, JSON object. **One writer:** `writeJson` in `lib/store.js` merges
the caller's keys into the file, writes a temp file beside it at mode 0600 and renames it over
the old one, so a reader sees the old file or the new one, never half of one, and the file is
0600 whoever wrote it last (since the 1.56.0 fix round; before it, three writers wrote in place
and a file they created was 0644). **Read-modify-write happens inside the writer** (second fix
round): the patch may be a function of the file as it is at write time, applied while holding
`state.json.lock` (created exclusively, holding the writer's pid). Since B-227 the lock is
judged by that pid: a dead pid's lock is removed at once; a live pid's is waited for up to 5 s
(`LOCK_WAIT_MS`), and then the write is refused with `ELOCKED` rather than written past, because
writing past a live holder, or removing its lock for being older than 2 s, lost a write under
load (`test/store_test.js`, "a live holder past the old wait and stale bounds keeps the waiter's
write"). A lock naming no pid keeps the earlier degrade: older than 2 s it is removed, and at the
deadline the write proceeds unlocked rather than hang a hook. A holder removes only its own lock
(same inode). The deadline is consulted on every retry path, so a lock that cannot be removed (a
read-only directory) or whose age cannot be read is never spun on; the age is `lstat`'s, so a
dangling symlink at `state.json.lock` has one. Every writer of an
`updateCheck` sub-key uses `store.nested('updateCheck', …)`, so the probe, the idle updater and
SessionStart cannot erase each other's keys by merging a copy they read earlier. Every writer stamps `schemaVersion`. Readers must tolerate a
file without `schemaVersion` (written before 1.56.0) and keys they do not know.
`test/updatelock_test.js` runs every writer against a 0644 file and refuses a `writeFileSync`
of `state.json` outside `lib/store.js`.

**`config.json` uses the same writer and its own `config.json.lock`** (final polish). Its
sub-objects — `stash`, `authored`, `routes.external`, `routers`, `update` — are each edited as a
function of the file at write time (`editSub` in `lib/config.js`), never rebuilt from a copy read
before the lock: four processes making 20 `stashSet` calls each on distinct keys kept 20 of 80
before, and keep all 80 now; eight processes making 50 calls each keep all 400, and the fixture
names a writer that failed instead of counting its keys as lost (`test/config_test.js`, B-227).

| Key | Meaning | Writers | Readers |
|---|---|---|---|
| `schemaVersion` | `1` since 1.56.0 (`STATE_SCHEMA`, `lib/store.js`). Bumped only for a change old readers cannot survive | every writer below | external consumers, to detect the contract |
| `routers` | `"yes"` / `"no"` — recorded consent to edit instruction files | `lib/consent.js` (`writeState`) | `lib/consent.js` (`askConsent`), `bin/sshlg-skills.js` (`consentRecorded`) |
| `updateCheck` | `{at, latest, ranAt, from, to, ok, busyAt, reportedRanAt}` — the set-update cache, one object, every writer merging its own keys into it. `at` and `latest`: the last registry probe (`record()`). `ranAt`, `from`, `to`, `ok`: the last unattended update (`ranRecord()`). `ranAt` is stamped before the run starts and the stamp CLEARS `from`, `to`, `ok` and `busyAt` (`startRecord()`), so while a run is in progress there is no outcome to report — the previous one is never read as this attempt's. `busyAt`: that update found `update.lock` held — exit 75, not a failure (exit 2 is a usage error and records `ok: false`); the whole previous `ranAt`/`from`/`to`/`ok` is put back (`busyRecord()`), and the idle updater waits 10 minutes after `busyAt` before trying again (`BUSY_BACKOFF_MS`). `reportedRanAt`: the run SessionStart has already reported, so it is said once (`reportedRecord()`) | `lib/updateprobe.js` (`at`, `latest`), `lib/updaterun.js` (`ranAt`, `from`, `to`, `ok`, `busyAt`), `hooks/session-start.js` (`reportedRanAt`) | `hooks/session-start.js` via `lib/updatecheck.js` `plan()` (the notice and the "updated while you were away" line); `hooks/notification.js` via `shouldAutoUpdate()` (whether the idle updater runs); **Fabric Dashboards** `launcherLatest()` (`at`, `latest`) |
| `inbound` | the open issues/PRs another agent left for the current repository | `lib/handoffprobe.js` | `hooks/session-start.js` via `lib/handoff.js` |
| `injectors` | sorted spec names of the enabled plugins that speak at `SessionStart` — what the session line last told. **Machine-wide**: a fact about which plugins this machine enables, so a second session with the same set is told nothing (route notes, about one context, are per session in `turns/`) | `hooks/session-start.js` | `hooks/session-start.js` (`lib/injectors.js` `changed`) |

`test/updatelock_test.js` holds the `updateCheck` key list above to the keys `record()`,
`ranRecord()`, `busyRecord()` and `reportedRecord()` return, in both directions: a key written
and not listed, or listed and never written, fails the suite.

Other keys may exist (the router stash lives in `config.json`, not here). A writer owns its keys
and must not drop the ones it does not own.

## External consumer: Fabric Dashboards

Fabric Dashboards (FD-30, FD-34) runs `npx sshlg-skills update` in the background and reads
this file and `~/.sshlg-skills/runtime/package.json`:

- `updateCheck.at` and `updateCheck.latest` — `launcherLatest()` in fabric-dashboards
  `src/core/estate-update.ts` (read at fabric-dashboards `908bb6b`): when `at` is fresh enough,
  `latest` is the newest set and the registry need not be asked;
- `runtime/package.json` `version` — the version the installed runtime copy is at (written by
  `lib/runtime.js` `sync`, the same copy the hooks execute). **It moves only on a run with the
  Claude host in scope** — a bare `update` or `--claude-only`; under `--no-claude` or any
  `--agent` list the runtime copy, its `settings.json` wiring and the Claude plugin step are all
  skipped (`claudeScope()` in `bin/sshlg-skills.js`), so the version stays where it was.

Fabric Dashboards runs a bare `update`, so since 1.56.0 its background run also re-wires the
consented Claude hooks in `~/.claude/settings.json` (one entry of ours present), through the same
`protect()` backup as `hooks install`.

That consumer is why the file carries `schemaVersion`. A key may be added without a bump; a
key renamed, removed or re-typed bumps it, and this page changes in the same commit.

## Deferred native Codex updates

The hub's own `codex-deferred/` directory is separate from `state.json` and from
other members' files. `lib/codex-pending.js` writes immutable JSON intent with schema
`sshlg.codex-deferred/v1`: canonical/requested profile, config SHA256, sanitized CLI
version, requested refs and observed catalog versions. Raw config and file bodies
are excluded. The content hash names the file. The task directory is owner-only;
existing unsafe permissions or ownership refuse without chmod or replacement.

A newer receipt supersedes a member's older ones (B-224): each member keeps its newest
receipt (`KEEP_PER_MEMBER`, 1), a removed receipt takes its observations and exhaustion record
with it, and a kept receipt keeps its newest ten observations (`KEEP_OBSERVATIONS`). Saving the
same intent again makes that receipt the newest; its bytes never change. Only names this
namespace writes, as private plain files, are removed (`test/codex_pending_test.js`).

`lib/codex-deferred-watch.js` accepts that private, identity-bound receipt, reads
only the native catalog and writes immutable observations beside it. Profile or
config drift stops observation. Exhaustion preserves intent and records an explicit
pending result. `catalog-matches-thread-generation-unknown` never grants mutation
or proves thread retirement. The launcher exits partial/nonzero on deferred work;
no reader may reinterpret the pending record as an install approval. Source and
real isolated CLI evidence: [Codex cache correction](../evidence/completion-1013/codex-cache-preservation.md).

## Other members' files under `~/.sshlg-skills/`

The directory is the family's; a member may keep its own data here when the family is
installed, and the hub never reads, moves or deletes it.

| Path | Owner | What it is |
|---|---|---|
| `lessons/index.jsonl` | task-pipeline (release iteration, ssheleg/task-pipeline #112) | A cross-project lessons index, one JSON line per lesson, read and written each run (Fabric principle §11). Used only when `~/.sshlg-skills/` exists; a standalone task-pipeline keeps `~/.task-pipeline/lessons/` and migrates once the family directory appears, keeping the old file as `index.jsonl.migrated`. Board B-181. |
| `usage/*.tsv` | the operator's measurements (2026-10-13) | Private 60-day MCP and skill usage per project, mode 600, input to Observatory's MCP profile (PB-159) until its inventory carries usage. Never committed anywhere. |

## The update lock

`npx sshlg-skills update` takes `~/.sshlg-skills/update.lock` (`lib/updatelock.js`) before it
touches anything, because three callers start it — the operator, the idle hook
(`lib/updaterun.js`) and Fabric Dashboards — and two at once race on `settings.json`, the
runtime copy and this file.

- Created exclusively (`wx`) with `{"pid", "startedAt", "host"}`, mode 0600.
- A live lock makes the second `update` print who holds it and how long ago it started
  (`update: refused — …`), and exit **75** (EX_TEMPFAIL, `BUSY_EXIT` in `lib/updatelock.js`).
  A caller that sees 75 should retry later, not treat it as a failed update; the idle updater
  (`lib/updaterun.js`) records it as `busyAt`, never `ok: false`. **Exit 2 is a usage error**
  (an unknown flag, a flag without its value, contradictory flags) — fix the call, do not retry.
  No published launcher ever refused with exit 2 (only pre-release builds of #192 did); the
  idle updater's branch that read exit 2 plus an `update: refused —` line as busy was removed
  in 1.59.1 (B-178).
- Who is live: on **this host**, a lock whose pid is alive is a running update **however old it
  is**, and one whose pid is gone is taken over at once. A lock written on **another host** is
  judged by its age alone (its pid means nothing here): taken over after 30 minutes. An
  unreadable lock is refused while fresh and taken over once it is 30 seconds old. Every takeover
  is logged (`update: took over update.lock — ...`).
- A takeover removes only the lock it judged, atomically: it RENAMES the lock to a name of its
  own, checks that the renamed file is the lock it judged (pid and `startedAt`), and if another
  update had replaced it in between, puts that one back with `link()` and judges again. The one
  race left: a third update creating a lock in the instant the name is free, after which the
  restore's `link()` fails with EEXIST and two runs proceed — narrower than the window it replaced
  (between a check and an `unlink`), not closed. Any other `link()` error (a filesystem without
  hard links) is logged and the lock is renamed back instead of deleted (final polish).
- Released on the normal return, a thrown error and `process.exit` elsewhere in the run. **No
  signal handlers**: the run is synchronous, so a handler could only run after every step had
  finished and replaced Node's terminate-on-signal (Ctrl-C and SIGTERM stopped nothing). A run
  killed by a signal leaves its lock behind with a dead pid, and the next `update` takes it over
  by the rule above. Only a lock that is still ours is deleted.
- `update --dry-run` writes nothing and takes no lock.
- If the lock file cannot be created at all (read-only home), `update` runs without it and says so.

## The runtime lock and failed refresh

`~/.sshlg-skills/runtime/.sync.lock` protects the runtime file writer used by both
`update` and `hooks install`. It is separate from `~/.sshlg-skills/update.lock`,
which covers the wider update command. The runtime lock records its holder PID
and a unique token. Every existing runtime lock is refused, including a stale or
unreadable one; the update lock's takeover rules above do not apply to it.
A runtime refusal fails the command; it is not the update lock's retry-later
exit status.

A runtime sync failure makes `update` skip hook rewiring and finish unsuccessfully;
other update steps can still complete. `hooks install` refuses to write hook
settings after the failure. If a caught error interrupts the file switch, the
writer attempts immediate rollback and verifies the managed files' previous
bytes, permissions and presence. Files introduced by that attempt are removed
only when they still match its recorded content and permissions. Managed files
changed outside the recorded transaction and malformed recovery records are left
for inspection; unknown user files are preserved.

The recovery journal is `runtime/.switch-journal.json`; prior managed files are
kept in `runtime/.prev-generation`. These paths are relative to
`~/.sshlg-skills/`. A journal that can be safely recovered is handled before a
new sync, once writer admission is available. A hard stop can retain the runtime
lock as well as the journal, so restart is not automatic recovery.

For a retained lock, preserve the lock, journal and prior snapshot together.
A PID or the lock's age alone never proves the holder dead, and retrying or
borrowing the update lock's takeover rules does not retire it. The supported
procedure is two commands:

1. `npx sshlg-skills hooks recovery inspect --json` writes nothing and reports
   the resolved runtime root, the lock's SHA-256 (`expected`) and one state:
   `NO_LOCK`, `PENDING_JOURNAL` (no lock, a journal remains), `BUSY` (the holder
   pid is alive), `DEAD`, `UNKNOWN` or `NOT_INSTALLED`, each with its reason.
2. `npx sshlg-skills hooks recovery recover --expect <digest|absent> --json`
   admits only `DEAD`, `NO_LOCK` or `PENDING_JOURNAL` whose lock still has the
   inspected digest. It retires the dead lock, then the existing journal
   verifier decides rollback.

A lock is `DEAD` only when its record binds this boot, this user and the same
runtime root (path, device and inode) and signalling its pid returns `ESRCH`.
Locks from an older launcher, another boot, a copied root, a root writable by
others, or a malformed, linked or changed file stay `UNKNOWN` and are never
retired. A running writer releases its own lock; one left by a crashed older or
unbound writer is not cleared by any supported command. Recovery workers exclude each other with
a POSIX `flock` held on the inherited descriptor of
`runtime/.recovery-coordinator` until the worker exits, including by SIGKILL.
That needs `/usr/bin/python3` (on macOS, the Command Line Tools); without it,
recovery refuses and changes nothing. A normal writer that takes the lock after
retirement is never removed.

`recover` reports `RECOVERED` (rollback verified), `NO_PENDING_JOURNAL` or
`UNRESOLVED`, with `retired` saying whether the dead lock was removed, `null`
when an interrupted worker did not report it. `NO_PENDING_JOURNAL` does not say
how the interrupted transaction ended. Refusals exit 1, usage errors exit 2.
Inspection does not verify every backup byte; that remains the journal
verifier's job during `recover`.

This contract covers caught filesystem errors and explicit refusal after an
interrupted process. Running hook readers can still observe the per-file switch;
it does not promise an atomic whole-runtime view or power-loss durability.
Linux boot identity, other PID namespaces and network filesystems are not
established by these controls. Source: [`lib/runtime.js`](../../lib/runtime.js),
`sync`, `recover`, `withLock`; [`lib/runtime-recovery.js`](../../lib/runtime-recovery.js),
`inspect`, `recover`;
CLI failure propagation: [`bin/sshlg-skills.js`](../../bin/sshlg-skills.js),
`cmdUpdate` and `cmdHooks`. The actual CLI and recovery controls are in
[`test/runtime_atomic_test.js`](../../test/runtime_atomic_test.js) and
[`test/runtime_recovery_test.js`](../../test/runtime_recovery_test.js), with
[source-bound results](../evidence/completion-1013/runtime-atomic/README.md).

## Proof

`test/updatelock_test.js`: `decide()` unit cases (same host live refused at any age; foreign
host by the clock), the filesystem wrapper (a takeover never deletes a lock that changed after it
was judged), the real launcher refused / taking over stale and dead locks / releasing after normal
and failing runs / stopped within 2 s by SIGTERM and by SIGINT to its group, the idle updater
recording a held lock as busy, the probe keeping the updater's keys, an unattended run reported by
the next SessionStart, every writer at 0600 by rename, and the documented `updateCheck` keys.
Second fix round: a successor's lock planted at the last moment before a takeover is restored,
not deleted; a SessionStart while the idle updater runs, and after it exits busy, prints no
outcome line; no writer merges `updateCheck` from an earlier copy. `test/updatecheck_test.js`:
the stamped shape reports nothing, a busy exit restores the whole outcome, the ten-minute busy
back-off. `test/store_test.js`: a function patch sees the file at write time; four processes
interleaving 30 writes each lose none.
Final polish: the lock refusal exits 75 and usage errors still exit 2; the idle updater reads 75,
and exit 2 only with the refusal line, as busy; a `link()` error other than EEXIST renames the
successor's lock back (`test/updatelock_test.js`); a dead writer's lock in a read-only directory
and a dangling-symlink lock each end `writeJson` within the wait, in a child process with a hard
timeout (`test/store_test.js`); parallel `stashSet` keeps every key (`test/config_test.js`).
