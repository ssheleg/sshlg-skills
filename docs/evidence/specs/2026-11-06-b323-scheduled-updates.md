# B-323: family members update on a schedule by default (design brief)

Source: Fabric board request `36d586e2` (thread `f7758225`, capability `updates.auto-default`,
item 5, the operator's words approved), 2026-11-04, deadline 2026-11-11. Backlog row B-323.
Read-only reconnaissance of `origin/main` at `b93b9031`, 2026-11-06; addresses below are that
revision's.

## What exists

- No scheduler anywhere in the hub: `grep` for `launchd`, `LaunchAgents`, `systemd`, `schtasks`,
  `plist` in `lib/`, `bin/`, `hooks/` returns nothing.
- The unattended update on idle: `hooks/notification.js:35-56` starts a detached
  `lib/updaterun.js` when `updatecheck.shouldAutoUpdate` (`lib/updatecheck.js:157`) says so.
  `updaterun.js` stamps a start, runs `npx --yes sshlg-skills@latest update` with a 10-minute
  limit, treats exit 75 as busy and records the result in `state.json` `updateCheck`.
- The lock: `lib/updatelock.js` (`~/.sshlg-skills/update.lock`, exit 75 on a live holder). Its
  header names three starters (terminal, idle hook, Fabric Dashboards); the scheduler is a fourth.
- The config key `update.auto` on|off (`lib/config.js:86-100`, CLI `bin/sshlg-skills.js:2221-2237`).
- The write pattern to copy: `lib/hostgate-install.js` (owned files carry a header; pure
  `plan`/`planRemoval` apart from `write`; every write through `apply.protectedWrite`).
- Codex deferral is unconditional (`lib/codexplugins.js:175`), and a deferred Codex makes
  `update` exit 1, which `ranLine` reports as FAILED.

## Decisions (taken by the rule: operator's recorded words, then the project's goal, then the
## safest reversible option)

1. **On by default, for new and existing installations.** The operator asked for exactly this
   (board item 5). `update` and `install` install the job; the consent doctrine ("update is not
   the moment to ask", `bin/sshlg-skills.js:816`) is kept by making the job removable in one
   command and announced once in the closing note, not by asking.
2. **One key, compatible with the old one:** `update.mode = auto | notify | off`, default
   `auto`. `update.auto off` (existing) maps to `notify`; if both are set, `update.mode` wins.
3. **Daily**, at a fixed local time with a random minute (spreads load), and at login if the
   last run is older than 24 hours.
4. **The job runs `lib/updaterun.js --scheduled`** from a stable copy under `~/.sshlg-skills/`
   with the absolute node path recorded at install and re-checked on every `update` (launchd
   and systemd do not see nvm or Homebrew PATH). It refreshes `latest` first, as
   `updateprobe.js` does, so it works on a machine where no session has run.
5. **The idle-hook updater stays**; the lock keeps the two apart, and both write the same
   `updateCheck` record.
6. **notify mode** shows «доступно обновление» at session start (the existing `updatecheck.line`)
   and nothing else; no OS notification in the first cut.
7. **A deferred Codex is a partial success**, a new outcome `deferred`, not FAILED.
8. **Revert:** `npx sshlg-skills schedule --revert` unregisters (launchctl bootout, systemctl
   --user disable, schtasks /Delete) and restores the files from backup; the ownership record is
   `~/.sshlg-skills/schedule.json`. `uninstall` removes the job.

## Files

- New: `lib/updatesched.js` (pure plan for macOS `~/Library/LaunchAgents/me.sshlg.skills.update.plist`,
  Linux `~/.config/systemd/user/sshlg-skills-update.{service,timer}`, Windows a task XML under
  `~/.sshlg-skills/`), `test/updatesched_test.js` (fixtures, no HOME).
- Changed: `bin/sshlg-skills.js` (`schedule` command, install step after `refreshBlock`, refresh
  in `update`, removal in `planUninstall`), `lib/config.js`, `lib/updatecheck.js`,
  `lib/updaterun.js`, `lib/updatemodel.js`, `lib/updatelock.js` header, README "## Update",
  `usageText`, `docs/working-rules/state-json.md`, `CLAUDE.md` "Writing to operator files",
  CHANGELOG.

## Risks to test

The job's PATH; a runtime path that disappears; a false FAILED from Codex deferral; system state
(`launchctl`, `systemctl`, `schtasks`) that `protect()` cannot copy, so revert is unregister plus
file restore; two writers of `updateCheck`.

## Next action

Build on a branch from `origin/main` through `/task-pipeline` (stages 5-10), with the release
and the board reply (`com.reply` on `36d586e2`) at the end.
