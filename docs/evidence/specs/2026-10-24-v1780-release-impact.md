# Release impact: sshlg-skills v1.78.0

schema: release-impact/1
release: v1.78.0
users: external
date: 2026-10-24

## 1. Who is affected and how

- **Segments:** everyone who installs the launcher from npm (1,909 downloads in the week 2026-10-16 to 2026-10-22, `api.npmjs.org/downloads/point/last-week/sshlg-skills`, the operator's own machines included); only machines that run `npx sshlg-skills visibility --apply` see a behaviour change.
- **What changes:** `visibility --apply` on Claude Code also writes `skillOverrides: "name-only"` for personal core skills unused for 14 days and not named in `~/.claude/CLAUDE.md`; the ownership record gains `claudeNameOnly` and `fullDays`; the preview's listing estimate counts Claude's entry form and prints the host's last logged count. No file format a user owns changes shape.
- **Breaks for existing users:** no. A name-only skill stays listed and callable; only its description leaves the model's listing. `update` re-applies the tier only after an `--apply` that recorded `fullDays`, so a machine that applied visibility on 1.77.0 or earlier keeps its old behaviour until its operator runs `--apply` again.
- **Rollout:** all at once through npm `latest`; the behaviour itself is opt-in per machine (`--apply`), and `--full-days off` keeps every description.
- **Timing:** 2026-10-24, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine exits 0 and `visibility` previews without error; (4) open issues on ssheleg/sshlg-skills.
- **Baseline:** (1) v1.77.0 release run success; (2) 1.77.0; (3) 1.77.0 update verified 2026-10-24; (4) 0 open issues.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's own output; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails (GitHub notifies the repository owner by email), or an issue is opened on the repository (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window instead of relying on the email.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.77.0 latest` moves new installs back; on a machine that applied the tier, `npx sshlg-skills visibility --apply --full-days off` restores every description, and `--revert` removes everything the launcher wrote.
- **Time to roll back:** minutes.
- **Data reversible:** yes: every settings write is backed up first under `~/.sshlg-skills/backups/` and `--revert` removes only values still as written.
- **Kill switch:** `--full-days off` per machine.
- **Hotfix path:** a patch release through the same PR, tag and release workflow (1.78.1).
- **Decision trigger:** roll back if the release run fails, if `update` exits non-zero on the operator machine, or if an issue reports a lost or wrongly hidden skill within 24 hours.
