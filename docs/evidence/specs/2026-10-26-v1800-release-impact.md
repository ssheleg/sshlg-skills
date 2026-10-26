# Release impact: sshlg-skills v1.80.0

schema: release-impact/1
release: v1.80.0
users: external
date: 2026-10-26

## 1. Who is affected and how

- **Segments:** everyone who installs or updates the family through the launcher, the operator's machines included; in practice people who run `npx sshlg-skills context` or `visibility`.
- **What changes:** `context` stops reporting a large global `~/.codex/AGENTS.md` as over Codex's cap (Codex reads it in full) and instead checks the project files of the current directory against `project_doc_max_bytes`; it adds project rows and a note for a Claude memory file above 40,000 characters. `visibility` prints one more line, `cannot hide on goose`, where Goose is installed. No member, hook, routing block or settings write changes.
- **Breaks for existing users:** a script that relied on `context` exiting 1 for a large global `AGENTS.md` now sees 0 there, and may see 1 for an over-cap project chain instead; `context --json` rows gain a `scope` field. No known consumer parses either.
- **Rollout:** all at once through npm `latest` and the next `update` on each machine.
- **Timing:** 2026-10-26, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine verifies all members; (4) open issues on ssheleg/sshlg-skills; (5) `npx sshlg-skills context` exits 0 in this repository on the operator machine.
- **Baseline:** (1) v1.79.1 release run 40263572040 success; (2) 1.79.1; (3) all Claude members verified on 1.79.1; (4) 0 open issues on the hub; (5) exit 0 with the global `AGENTS.md` at 36,375 bytes under a raised 65,536 cap.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's own output; (4) `gh issue list -R ssheleg/sshlg-skills --state open`; (5) the command's exit code.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.79.1 latest` moves new installs back at once; a 1.80.1 revert of the `context` and `hostvis` change follows if needed.
- **Time to roll back:** minutes for the dist-tag, about an hour for a revert release.
- **Data reversible:** yes: both commands are read-only reports; nothing is written by the changed code.
- **Kill switch:** n/a: read-only commands; the dist-tag above is the switch.
- **Hotfix path:** a 1.80.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails, or `context` reports a false error on a real machine within 24 hours.
