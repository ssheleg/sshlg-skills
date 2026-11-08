# Release impact: sshlg-skills v1.86.2

schema: release-impact/1
release: v1.86.2
users: external
date: 2026-11-08

## 1. Who is affected and how

- **Segments:** everyone who installs Claude Code plugins through the launcher, the nightly job (B-323) included.
- **What changes:** after a Claude transaction fails because another writer changed a setting it does not own, the next `update` plans again instead of exiting 2 with `incomplete Claude transaction`, provided no rollback failed and every key the transaction owned reads as in its first backup (`lib/claude-pinned.js` `settled()`). The refusal that remains names the remedy.
- **Breaks for existing users:** none known. A machine already wedged this way (a `latest.json` with `status: failed` and `settingsRestored: false`) gets unstuck at its next `update` when the condition holds; when it does not, it refuses as before, now with the remedy.
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** 2026-11-08.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine ends with all eleven Claude members verified; (4) open issues on ssheleg/sshlg-skills.
- **Baseline:** (1) v1.86.1 release run 42388089144 success; (2) 1.86.1; (3) on 2026-11-07 the 1.86.1 update wedged after a foreign `cleanupPeriodDays` write and needed a hand-edited `latest.json` (copy `latest.json.pre-manual-20261107`); `settled()` run against that copy and the current settings answers true, and false with one owned key flipped; (4) 0 open issues.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 48 hours after the tag, so two nightly runs pass.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner). An unattended run that fails is said at the next session start ("An unattended set update FAILED").
- **Receives:** the repository owner, by GitHub email and the GitHub inbox; the operator in the next session.
- **Seen firing:** the 1.86.1 update on 2026-11-07 printed `incomplete Claude transaction` and exited 2, which is how B-326 was found.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.86.1 latest` moves new installs back at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: the change only decides whether a run may plan; it writes nothing new, and every transaction keeps its backups.
- **Kill switch:** the dist-tag above is the only switch for this change; `SSHLG_SKILLS_SCHEDULE=skip` only keeps a run away from the OS scheduler and does not turn the new path off.
- **Hotfix path:** a 1.86.3 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, or an `update` after a settled failure leaves an owned key different from the pin.
