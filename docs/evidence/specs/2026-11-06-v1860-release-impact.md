# Release impact: sshlg-skills v1.86.0

schema: release-impact/1
release: v1.86.0
users: external
date: 2026-11-06

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher on macOS, Linux or Windows. The operator's machines first: the Fabric board request `36d586e2` (item 5) asked that family members update on a schedule by default.
- **What changes:** `install` and `update` register a nightly job (`lib/updatesched.js`): `~/Library/LaunchAgents/me.sshlg.skills.update.plist` loaded with `launchctl bootstrap gui/<uid>` on macOS, `~/.config/systemd/user/sshlg-skills-update.{service,timer}` enabled with `systemctl --user enable --now` on Linux, a daily `schtasks` task on Windows, at 04:MM local. They also keep a copy of `lib/` under `~/.sshlg-skills/scheduler/` that the job runs. The job asks npm for the latest set and runs `npx --yes sshlg-skills@latest update` only when a newer one is out and no unattended run started in the last day. `update.mode auto|notify|off` is the new switch (`update.auto off` reads as `notify`). A run where only Codex held its plugins back is recorded as `ok: true, deferred: true` instead of FAILED.
- **Breaks for existing users:** none known. A machine that set `update.auto off` gets no job (it reads as `notify`). `update`'s exit codes are unchanged. A file of ours at the job's path that lacks the ownership line is reported and left, and `update` then exits nonzero for that step.
- **Rollout:** all at once through npm `latest`; each machine gets the job at its next `install` or `update`, and the idle updater brings that `update` on its own.
- **Timing:** the board request's deadline is 2026-11-11.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine exits 0 or partial only for Codex, and prints `== Nightly update job ==` with `registered with launchd` the first time; (4) `launchctl print gui/$(id -u)/me.sshlg.skills.update` shows `Hour => 4` and the minute, and after the first night `runs` above 0 with `last exit code = 0`; (5) `state.json` `updateCheck.at` moves forward every day without a session; (6) open issues on ssheleg/sshlg-skills.
- **Baseline:** (1) v1.85.0 release run success; (2) 1.85.0; (3) no schedule step; (4) on 2026-11-06 the job registered from the branch: `launchctl print` shows `Hour => 4`, `Minute => 41`, and a `launchctl kickstart` ran it once with `last exit code = 0`, moving `updateCheck.at` from 1793962679653 to 1794002404820 with `latest` 1.85.0 and no update (the copy was ahead); (5) before the job `updateCheck.at` moved only when a session started; (6) 0 open issues.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output; (4) `launchctl print gui/$(id -u)/me.sshlg.skills.update`; (5) `python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.sshlg-skills/state.json')))['updateCheck'])"`; (6) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 48 hours after the tag, so two nights pass.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner). An unattended run that fails is said at the next session start ("An unattended set update FAILED").
- **Receives:** the repository owner, by GitHub email and the GitHub inbox; the operator in the next session.
- **Seen firing:** the session-start FAILED line fired on this machine for the 2026-10-22 run (`state.json` `ok: false`), which is how the Codex false failure was found.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.85.0 latest` moves new installs back at once; on a machine, `npx sshlg-skills schedule --revert` unregisters the job, deletes its files after a copy and sets `update.mode notify`.
- **Time to roll back:** minutes for the dist-tag or the revert, about an hour for a patch release.
- **Data reversible:** yes: the job files are copied before they are replaced or deleted (`~/.sshlg-skills/backups/`), the record is `~/.sshlg-skills/schedule.json`, and nothing outside `~/.sshlg-skills`, the LaunchAgents directory or the systemd user directory is written.
- **Kill switch:** `npx sshlg-skills config set update.mode notify` (or `off`) removes the job at once; `SSHLG_SKILLS_SCHEDULE=skip` keeps a run away from the OS scheduler.
- **Hotfix path:** a 1.86.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails on the operator machine for a reason other than Codex, the job runs an update while a session is mid-work and breaks it, or two nights pass with `updateCheck.at` not moving.
