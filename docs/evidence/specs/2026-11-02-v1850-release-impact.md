# Release impact: sshlg-skills v1.85.0

schema: release-impact/1
release: v1.85.0
users: external
date: 2026-11-02

## 1. Who is affected and how

- **Segments:** everyone who installs through the launcher. Hermes users who said yes to the routing block get a new plugin; Codex users get a faster read; Windows users get a CI job behind them and a runtime lock a crashed writer can no longer strand (B-316). Gemini CLI, Kimi, Hermes, Pi and OpenCode users can opt in to the family guard (`hooks install --<host>`, B-280); nobody gets it without asking. Contributors running `npm test` with Hermes on PATH no longer fill the temp directory (B-319). The unpublished 1.84.2 rides along (task-pipeline 1.102.4 hooks, Codex read per marketplace).
- **What changes:** on a machine with Hermes and a recorded "yes", `update` writes `~/.hermes/plugins/sshlg-routing/` (block file, `plugin.yaml`, `__init__.py`), backs up `config.yaml` and runs `hermes plugins enable sshlg-routing`; every new Hermes session then carries the map, the protocol and the router table as two prompt sections. The Codex step reads `codex plugin list --json -m <marketplace>` per family marketplace.
- **Breaks for existing users:** none known. On Windows a lock written by 1.84.x or earlier stays `UNKNOWN` and names a manual check; POSIX locks are unchanged. The Hermes plugin shares Hermes' 8,000-character budget for all plugin sections; with another plugin near its own 4,000 (Fabric's context, 349 measured), Hermes skips the router table section and logs it.
- **Rollout:** all at once through npm `latest` and the next `install` or `update`.
- **Timing:** after B-318 (npm trusted publishing) lets the tag publish.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine exits 0, verifies all members and prints `routers: ~/.hermes/plugins/sshlg-routing/routing.md: created` then `unchanged`; (4) `hermes plugins list` shows `sshlg-routing` enabled and a Hermes session log names `id=sshlg.routing` and `id=sshlg.routing.table`; (5) open issues on ssheleg/sshlg-skills.
- **Baseline:** (1) v1.84.1 release run 40666721967 success; (2) 1.84.1; (3) `update` verifies all 11 members; Hermes gets no routing; (4) no `sshlg.routing` section in Hermes logs (`grep -r "id=sshlg.routing" ~/.hermes/logs` prints nothing on 2026-11-02); (5) 0 open issues.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output; (4) `hermes plugins list` and `grep -rh "Session plugin prompt section" ~/.hermes/logs`; (5) `gh issue list -R ssheleg/sshlg-skills --state open`.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1), (4) and (5) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.84.1 latest` moves new installs back at once; on a machine, `hermes plugins disable sshlg-routing` (or an opt-out line in `routing.md`) silences the plugin.
- **Time to roll back:** minutes for the dist-tag or the Hermes switch, about an hour for a patch release.
- **Data reversible:** yes: `config.yaml` is copied before `hermes plugins enable`, and every hub write takes a backup first.
- **Kill switch:** `hermes plugins disable sshlg-routing`; `npx sshlg-skills install --routers no` records a refusal; `npx sshlg-skills hooks remove` takes every host gate out and gives the files back.
- **Hotfix path:** a 1.85.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails, Hermes fails to start a session with the plugin enabled, or a Hermes session loses Fabric's context section within 24 hours.
