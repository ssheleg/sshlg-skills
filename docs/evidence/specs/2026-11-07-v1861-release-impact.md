# Release impact: sshlg-skills v1.86.1

schema: release-impact/1
release: v1.86.1
users: external
date: 2026-11-07

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher and runs task-pipeline.
- **What changes:** task-pipeline moves from 1.102.4 to 1.103.1. When a request carries several asks, stage 0 now lists them, researches the larger ones in parallel, runs the top one and files the rest on the project's own board, which `backlog_sources.py --discover` finds before anything is filed. A single ask runs as before.
- **Breaks for existing users:** none known; task-pipeline's own card (`skills/task-pipeline/docs/evidence/specs/2026-11-06-v11031-release-impact.md`) lists the plain-CLI changes of `backlog_sources.py` (an unreadable manifest exits 1, a declared source under an unreadable directory reads as missing), and a project with no board found is told what signals to read before anything is seeded.
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** after task-pipeline v1.103.1 is on npm.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine installs task-pipeline 1.103.1 for Claude Code; (4) open issues on ssheleg/sshlg-skills and ssheleg/task-pipeline.
- **Baseline:** (1) v1.86.0 release run 42339935439 success; (2) 1.86.0; (3) task-pipeline 1.102.4 installed; (4) 0 open issues.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and `claude plugin list`; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on either repository (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** the task-pipeline release workflow fired on 2026-11-07 for its dead `v1.103.0` tag (run 42365245798), which is why 1.103.1 carries the payload.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.86.0 latest` moves new installs back to task-pipeline 1.102.4 at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: a pin moves no project data; a board `--discover` seeded stays a plain file in the project.
- **Kill switch:** the dist-tag above; a project can keep its own `docs/backlog-sources.json` to declare its board.
- **Hotfix path:** a 1.86.2 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails to install task-pipeline 1.103.1, or a run seeds a board beside an existing one within 24 hours.
