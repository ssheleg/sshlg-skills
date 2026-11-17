# Release impact: sshlg-skills v1.89.3

schema: release-impact/1
release: v1.89.3
users: external
date: 2026-11-17

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher and runs task-pipeline; everyone whose instruction file carries the family's routing block.
- **What changes:** task-pipeline moves from 1.104.1 to 1.105.1: its prompts follow Anthropic's current prompting practices (each run states when it is done, the stops it wants and the ones it does not, one list of outward acts that need a go, no history in instructions, pasted text read as data). The hub rewords the task-pipeline router, the session note, the per-prompt route line and the map preamble (B-351), its own tests can no longer write into an operator's instruction file (B-350), and `update` takes the family's own marketplace declaration written under another profile hash instead of stopping (B-352).
- **Breaks for existing users:** none known. An operator who edited the task-pipeline router keeps that wording (`authored`); `routers` reports the drift and `--adopt` replaces it on request. A run that relied on the agent stopping to ask where no human gate exists now continues and records its decision; a decision recorded as the operator's still waits for the operator unless the host delegates it.
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** after task-pipeline v1.105.1 is on npm.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine installs task-pipeline 1.105.1 for Claude Code; (4) open issues on ssheleg/sshlg-skills and ssheleg/task-pipeline.
- **Baseline:** (1) v1.89.2 release run success; (2) 1.89.2; (3) task-pipeline 1.104.1 installed; (4) open issues counted at the tag.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and `claude plugin list`; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on either repository (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** the task-pipeline release workflow fired on 2026-11-07 for its dead `v1.103.0` tag (run 42365245798).

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.89.2 latest` moves new installs back to task-pipeline 1.104.1 at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: a pin moves no project data; a router rewording is a block between sentinels, backed up before every write.
- **Kill switch:** the dist-tag above; an operator keeps any router wording by editing it (`authored`).
- **Hotfix path:** a 1.89.4 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails to install task-pipeline 1.105.1, or a routing block reads text no router wrote within 24 hours.
