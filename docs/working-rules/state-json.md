# `~/.sshlg-skills/state.json` and `update.lock` — the interface

Written 2026-10-12 (R05, board B-159). `state.json` was an implementation detail until an
external program began reading it. This page is its single home: the keys, who writes
them, who reads them, and the lock that keeps two `update` runs from racing.

## The file

`~/.sshlg-skills/state.json`, JSON object, mode 0600. Every writer **merges** into the file
(read, set its own keys, write back) and stamps `schemaVersion`. Readers must tolerate a file
without `schemaVersion` (written before 1.56.0) and keys they do not know.

| Key | Meaning | Writers | Readers |
|---|---|---|---|
| `schemaVersion` | `1` since 1.56.0 (`STATE_SCHEMA`, `lib/store.js`). Bumped only for a change old readers cannot survive | every writer below | external consumers, to detect the contract |
| `routers` | `"yes"` / `"no"` — recorded consent to edit instruction files (`lib/consent.js`) | `lib/consent.js` (`writeState`) | `lib/consent.js`, `bin/sshlg-skills.js` |
| `updateCheck` | `{checkedAt, latest, ranAt, from, to, ok, ...}` — the set-update cache: the last registry probe and the last unattended update | `lib/updateprobe.js` (probe), `lib/updaterun.js` (unattended run) | `hooks/session-start.js` via `lib/updatecheck.js`; **Fabric Dashboards** |
| `inbound` | the open issues/PRs another agent left for the current repository | `lib/handoffprobe.js` | `hooks/session-start.js` via `lib/handoff.js` |
| `injectors` | sorted spec names of the enabled plugins that speak at `SessionStart` — what the session line last told | `hooks/session-start.js` | `hooks/session-start.js` (`lib/injectors.js` `changed`) |

Other keys may exist (the router stash lives in `config.json`, not here). A writer owns its keys
and must not drop the ones it does not own.

## External consumer: Fabric Dashboards

Fabric Dashboards (FD-30, FD-34) runs `npx sshlg-skills update` in the background and reads
this file and `~/.sshlg-skills/runtime/package.json`:

- `updateCheck` — whether a newer set exists and what the last update did;
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
- A live lock (younger than 30 minutes, pid alive on the same host) makes the second `update`
  print who holds it and how long ago it started, and exit **2**. A caller that sees exit 2 should
  retry later, not treat it as a failed update.
- A lock older than 30 minutes, or whose pid is gone, is **taken over** and the takeover is
  logged (`update: took over update.lock — ...`). A lock written by another host is judged by
  its age alone: its pid means nothing here. An unreadable lock is refused while fresh and
  taken over once it is 30 seconds old.
- Released on every way out: normal return, a thrown error, `process.exit` elsewhere in the
  run, SIGINT/SIGTERM/SIGHUP. Only a lock that is still ours is deleted.
- `update --dry-run` writes nothing and takes no lock.
- If the lock file cannot be created at all (read-only home), `update` runs without it and says so.

## Proof

`test/updatelock_test.js`: `decide()` unit cases, the filesystem wrapper, the real launcher
refused / taking over stale and dead locks / releasing after normal and failing runs, and every
writer stamping `schemaVersion` over an older file.
