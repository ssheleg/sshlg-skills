# Release impact: sshlg-skills v1.90.3

schema: release-impact/1
release: v1.90.3
users: external
date: 2026-11-18

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher and builds MCP servers with agent-stack; every macOS machine with the nightly job.
- **What changes:** agent-stack moves from 0.32.1 to 0.33.1 (0.33.0 plus its ledger row): agent-interop's new reference `mcp-two-doors.md` and Rule one (an MCP server we build lists only `search` and `execute`), pointers in agent-harness `tools.md`, `mcp.md` and `agent-surface.md`. The launcher changes one string: the launchd plist's comment no longer holds `--` (B-360).
- **Breaks for existing users:** none in the launcher. The doctrine asks MCP owners to migrate their servers; the migration path keeps old tool names working for one release.
- **Rollout:** all at once through npm `latest`; each machine at its next `update`, the nightly job included.
- **Timing:** after agent-stack v0.33.1 is on npm.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine installs agent-stack 0.33.1 for Claude Code with `skills/agent-interop/references/mcp-two-doors.md`, and the rewritten plist parses with `plistlib`; (4) open issues on ssheleg/sshlg-skills and ssheleg/agent-stack.
- **Baseline:** (1) the v1.90.2 release run; (2) 1.90.2; (3) agent-stack 0.32.1 installed; (4) open issues counted at the tag.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and the installed plugin tree under `~/.claude/plugins/`; (4) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on either repository (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** the task-pipeline release workflow fired on 2026-11-07 for its dead `v1.103.0` tag (run 42365245798).

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.90.2 latest` moves new installs back to agent-stack 0.32.1 at once; a machine reruns `npx --yes sshlg-skills@latest update`.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: a pin moves no project data; the plist is rewritten again by the older release.
- **Kill switch:** the dist-tag above.
- **Hotfix path:** a 1.90.4 patch through the same gate.
- **Decision trigger:** roll back if the release run fails or `update` fails to install agent-stack 0.33.1 within 24 hours.
