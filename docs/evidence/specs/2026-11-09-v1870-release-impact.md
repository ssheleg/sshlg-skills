# Release impact: sshlg-skills v1.87.0

schema: release-impact/1
release: v1.87.0
users: external
date: 2026-11-09

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher and runs super-ux, task-pipeline or agent-stack.
- **What changes:** three members move together for the AI-native design ([design](2026-11-09-ai-native-pipeline.md)): agent-stack 0.31.4 to 0.32.0 (a product's agent surface and operability evals), super-ux 0.66.3 to 0.67.0 (contract v5: actors, capabilities, channels, why a person is needed; opt-in by marker), task-pipeline 1.103.1 to 1.104.0 (the actor branch, capabilities and the contract before screens, the `agent` certification reading). The hook routes "agent surface", «агентная поверхность», "AI-native" and «API для агентов» to agent-stack.
- **Breaks for existing users:** none known: a `docs/ux` chain without the `ux-contract v5` marker lints exactly as before (a v4 fixture exits 0 under `--strict`); a work graph without `agent_surface` certifies as before; a task with no capability or contract change owes nothing new. Each member's own card lists its edges (`skills/task-pipeline/docs/evidence/specs/2026-11-09-v11040-release-impact.md`).
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** after agent-stack 0.32.0 and super-ux 0.67.0 are on npm (B-325) and task-pipeline 1.104.0 is.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` installs the three member versions for Claude Code; (4) open issues on the hub and the three members; (5) the first executed run of the new pipeline (B-329).
- **Baseline:** (1) v1.86.1 release run 42388089144 success; (2) 1.86.1; (3) agent-stack 0.31.4, super-ux 0.66.3, task-pipeline 1.103.1 installed; (4) as read at the tag.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and `claude plugin list`; (4) `gh issue list -R ssheleg/<repo> --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on any of the four repositories (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** yes: the agent-stack and super-ux release workflows failed their publish jobs on 2026-11-09 (runs 42630613649, 42630731244) and were read the same hour.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.86.1 latest` moves new installs back to the previous member set at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: pins move no project data; a project that adopted contract v5 keeps valid files that v4 tooling ignores.
- **Kill switch:** the dist-tag above; a project stays on v4 by not writing the marker.
- **Hotfix path:** a 1.87.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails to install a member, or within 24 hours a run is blocked by the `agent` tier on a node that never declared `agent_surface`.
