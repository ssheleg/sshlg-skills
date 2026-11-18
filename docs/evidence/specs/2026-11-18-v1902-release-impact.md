# Release impact: sshlg-skills v1.90.2

schema: release-impact/1
release: v1.90.2
users: external
date: 2026-11-18

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher and uses sheleg-design.
- **What changes:** sheleg-design moves from 1.66.6 to 1.67.1: a fortieth style pack, `phosphor` (`styles/phosphor.md`, `styles/tokens/phosphor.css`, `kits/phosphor`), routed from the pack index, the Cursor rule and the command; reciprocal forks in `patchbay` and `instrument-console`. 1.67.1 only records the shipped version in the member's verification ledger. The launcher's own code does not change.
- **Breaks for existing users:** none known. A project that recorded another pack keeps it; `phosphor` is chosen only when a brief routes to it.
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** after sheleg-design v1.67.1 is on npm.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine installs sheleg-design 1.67.1 for Claude Code with `styles/phosphor.md`; (4) open issues on ssheleg/sshlg-skills and ssheleg/sheleg-design-skill.
- **Baseline:** (1) v1.90.1 release run 44222450437 success; (2) 1.90.1; (3) sheleg-design 1.66.6 installed (`b1417bf`); (4) open issues counted at the tag.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and the installed plugin tree under `~/.claude/plugins/`; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on either repository (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** the task-pipeline release workflow fired on 2026-11-07 for its dead `v1.103.0` tag (run 42365245798).

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.90.1 latest` moves new installs back to sheleg-design 1.66.6 at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: a pin moves no project data, and a pack is read only when chosen.
- **Kill switch:** the dist-tag above.
- **Hotfix path:** a 1.90.3 patch through the same gate.
- **Decision trigger:** roll back if the release run fails or `update` fails to install sheleg-design 1.67.1 within 24 hours.
