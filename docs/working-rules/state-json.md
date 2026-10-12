# `~/.sshlg-skills/state.json` and `update.lock` — the interface

Written 2026-10-12 (R05, board B-159). `state.json` was an implementation detail until an
external program began reading it. This page is its single home: the keys, who writes
them, who reads them, and the lock that keeps two `update` runs from racing.

## The file

`~/.sshlg-skills/state.json`, JSON object. **One writer:** `writeJson` in `lib/store.js` merges
the caller's keys into the file, writes a temp file beside it at mode 0600 and renames it over
the old one, so a reader sees the old file or the new one, never half of one, and the file is
0600 whoever wrote it last (since the 1.56.0 fix round; before it, three writers wrote in place
and a file they created was 0644). Every writer stamps `schemaVersion`. Readers must tolerate a
file without `schemaVersion` (written before 1.56.0) and keys they do not know.
`test/updatelock_test.js` runs every writer against a 0644 file and refuses a `writeFileSync`
of `state.json` outside `lib/store.js`.

| Key | Meaning | Writers | Readers |
|---|---|---|---|
| `schemaVersion` | `1` since 1.56.0 (`STATE_SCHEMA`, `lib/store.js`). Bumped only for a change old readers cannot survive | every writer below | external consumers, to detect the contract |
| `routers` | `"yes"` / `"no"` — recorded consent to edit instruction files | `lib/consent.js` (`writeState`) | `lib/consent.js` (`askConsent`), `bin/sshlg-skills.js` (`consentRecorded`) |
| `updateCheck` | `{at, latest, ranAt, from, to, ok, busyAt, reportedRanAt}` — the set-update cache, one object, every writer merging its own keys into it. `at` and `latest`: the last registry probe (`record()`). `ranAt`, `from`, `to`, `ok`: the last unattended update (`ranRecord()`; `ranAt` is stamped before the run starts). `busyAt`: that update found `update.lock` held — exit 2, not a failure, `ranAt` put back so the next idle retries (`busyRecord()`). `reportedRanAt`: the run SessionStart has already reported, so it is said once (`reportedRecord()`) | `lib/updateprobe.js` (`at`, `latest`), `lib/updaterun.js` (`ranAt`, `from`, `to`, `ok`, `busyAt`), `hooks/session-start.js` (`reportedRanAt`) | `hooks/session-start.js` via `lib/updatecheck.js` `plan()` (the notice and the "updated while you were away" line); `hooks/notification.js` via `shouldAutoUpdate()` (whether the idle updater runs); **Fabric Dashboards** `launcherLatest()` (`at`, `latest`) |
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
  `lib/runtime.js` `sync`, the same copy the hooks execute).

That consumer is why the file carries `schemaVersion`. A key may be added without a bump; a
key renamed, removed or re-typed bumps it, and this page changes in the same commit.

## The update lock

`npx sshlg-skills update` takes `~/.sshlg-skills/update.lock` (`lib/updatelock.js`) before it
touches anything, because three callers start it — the operator, the idle hook
(`lib/updaterun.js`) and Fabric Dashboards — and two at once race on `settings.json`, the
runtime copy and this file.

- Created exclusively (`wx`) with `{"pid", "startedAt", "host"}`, mode 0600.
- A live lock makes the second `update` print who holds it and how long ago it started, and exit
  **2**. A caller that sees exit 2 should retry later, not treat it as a failed update; the idle
  updater (`lib/updaterun.js`) records it as `busyAt`, never `ok: false`.
- Who is live: on **this host**, a lock whose pid is alive is a running update **however old it
  is**, and one whose pid is gone is taken over at once. A lock written on **another host** is
  judged by its age alone (its pid means nothing here): taken over after 30 minutes. An
  unreadable lock is refused while fresh and taken over once it is 30 seconds old. Every takeover
  is logged (`update: took over update.lock — ...`).
- A takeover re-reads the lock before deleting it and deletes only the lock it judged; if another
  update replaced it in between, that one is judged again instead.
- Released on the normal return, a thrown error and `process.exit` elsewhere in the run. **No
  signal handlers**: the run is synchronous, so a handler could only run after every step had
  finished and replaced Node's terminate-on-signal (Ctrl-C and SIGTERM stopped nothing). A run
  killed by a signal leaves its lock behind with a dead pid, and the next `update` takes it over
  by the rule above. Only a lock that is still ours is deleted.
- `update --dry-run` writes nothing and takes no lock.
- If the lock file cannot be created at all (read-only home), `update` runs without it and says so.

## Proof

`test/updatelock_test.js`: `decide()` unit cases (same host live refused at any age; foreign
host by the clock), the filesystem wrapper (a takeover never deletes a lock that changed after it
was judged), the real launcher refused / taking over stale and dead locks / releasing after normal
and failing runs / stopped within 2 s by SIGTERM and by SIGINT to its group, the idle updater
recording a held lock as busy, the probe keeping the updater's keys, an unattended run reported by
the next SessionStart, every writer at 0600 by rename, and the documented `updateCheck` keys.
