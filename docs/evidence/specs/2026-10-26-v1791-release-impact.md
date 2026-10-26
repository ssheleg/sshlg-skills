# Release impact: sshlg-skills v1.79.1

schema: release-impact/1
release: v1.79.1
users: external
date: 2026-10-26

## 1. Who is affected and how

- **Segments:** everyone who installs or updates the family through the launcher, the operator's machines included; in practice only authors who build or retrofit a skill with `make-skill`.
- **What changes:** one member, make-skill 0.33.2 to 0.33.3. Its canon states the description target as 300 characters instead of 400 (B-257), matching the budget the family adopted in 1.79.0. The auditor's and validator's WARN message names the new target. Thresholds that decide anything are unchanged: soft cap 500 (WARN), spec cap 1024 (FAIL).
- **Breaks for existing users:** none expected. No skill description, script behaviour, hook, file format or command changes; a check that passed before passes now.
- **Rollout:** all at once through npm `latest` and the next `update` on each machine.
- **Timing:** 2026-10-26, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine verifies all members; (4) open issues on ssheleg/sshlg-skills and ssheleg/make-skill.
- **Baseline:** (1) v1.79.0 release run 40255202605 success; (2) 1.79.0; (3) all Claude members verified on 1.79.0; (4) 0 open issues on the hub.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's own output; (4) `gh issue list -R ssheleg/<repo> --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub or make-skill (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** a hub patch release re-pinning make-skill 0.33.2 (the pin of v1.79.0 in `skills.json`), then `npx --yes sshlg-skills@latest update`; `npm dist-tag add sshlg-skills@1.79.0 latest` moves new installs back in the meantime.
- **Time to roll back:** about an hour (one hub release and one update).
- **Data reversible:** yes: the change is text in a versioned package; no user data is touched.
- **Kill switch:** n/a: documentation text has no runtime switch; the rollback above restores it.
- **Hotfix path:** a make-skill patch, then a hub re-pin (1.79.2).
- **Decision trigger:** roll back if the release run fails or `update` fails for a member within 24 hours.
