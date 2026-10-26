# Release impact: sshlg-skills v1.79.0

schema: release-impact/1
release: v1.79.0
users: external
date: 2026-10-26

## 1. Who is affected and how

- **Segments:** everyone who installs or updates the family through the launcher (npm: 1,909 downloads in the week 2026-10-16 to 2026-10-22), the operator's machines included.
- **What changes:** eleven members ship shorter SKILL.md descriptions (each at most 300 characters); dropped trigger phrases move into each skill's `## Triggers` body section. No script, hook, file format or command changes.
- **Breaks for existing users:** no expected break. The risk is routing: a host that picks a skill by its description could miss a phrase that left it. The hub's route coverage (125 of 140, same misses) and trigger suite (70 checks) held before and after.
- **Rollout:** all at once through npm `latest` and the next `update` on each machine.
- **Timing:** 2026-10-26, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine verifies all members; (4) open issues on ssheleg/sshlg-skills and on the eleven member repositories.
- **Baseline:** (1) v1.78.0 release run success; (2) 1.78.0; (3) all Claude members verified on 1.78.0; (4) 0 open issues on the hub.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's own output; (4) `gh issue list -R ssheleg/<repo> --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub or a member (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** a hub patch release re-pinning the previous member versions (the pins of v1.78.0 in `skills.json`), then `npx --yes sshlg-skills@latest update`; `npm dist-tag add sshlg-skills@1.78.0 latest` moves new installs back in the meantime.
- **Time to roll back:** about an hour (one hub release and one update).
- **Data reversible:** yes: descriptions are text in versioned packages; no user data is touched.
- **Kill switch:** n/a: descriptions have no runtime switch; the rollback above restores them.
- **Hotfix path:** a member patch that restores one description's phrase, then a hub re-pin (1.79.1).
- **Decision trigger:** roll back if the release run fails, if `update` fails for a member, or if a reported prompt stops reaching its skill within 24 hours.
