# Release impact: sshlg-skills v1.81.0

schema: release-impact/1
release: v1.81.0
users: external
date: 2026-10-27

## 1. Who is affected and how

- **Segments:** everyone who installs or updates the family through the launcher, the operator's machines included.
- **What changes:** the next `update` rewrites the routing block in every host's instruction file with the same words and no em dash (B-226), writes it for newly supported hosts that are installed (B-206; on the operator machine only `~/.zcode/AGENTS.md`), writes operator files atomically (B-260), retires old Claude pin transactions and Codex receipts (B-224), and installs Hermes' family skills as a copy (B-217). The PreToolUse hook refuses git commands that would lose uncommitted work (B-240) and answers Cursor in its own shape (B-209). Four members move: task-pipeline 1.102.3, agent-sync 1.23.3, make-skill 0.33.4, seo-aeo-audit 0.32.4.
- **Breaks for existing users:** an agent that runs `git checkout -- <path>`, `restore`, `reset --hard`, `stash` or `clean -f` over uncommitted changes is now refused and told to commit or prefix `SSHLG_DISCARD_OK=1`; that is the intended change. A launcher older than 1.81.0 that runs `update` after it puts the 1.80.0 wording back (no damage; the next new `update` rewords again) and refuses a `wait-v3` record, naming `npx --yes sshlg-skills@latest`. A hand-edited router section is kept and reported, not rewritten.
- **Rollout:** all at once through npm `latest` and the next `update` on each machine.
- **Timing:** 2026-10-27, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine exits 0, verifies all members and leaves `~/.claude/CLAUDE.md` with no em dash in its routing block; (4) open issues on ssheleg/sshlg-skills; (5) the PreToolUse hook does not refuse an ordinary read or commit in a session on the operator machine.
- **Baseline:** (1) v1.80.0 release run 40270413186 success; (2) 1.80.0; (3) `update` 11 of 11 steps green on 2026-10-27 03:31Z; (4) 0 open issues; (5) no refusal reported since 1.80.0.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output and `grep -c "$(printf '\342\200\224')"` on the block; (4) `gh issue list -R ssheleg/sshlg-skills --state open`; (5) the session's hook output.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.80.0 latest` moves new installs back at once; a 1.81.1 that reverts the offending change follows. The routing block rewording reverses by running the 1.80.0 launcher's `update` (its wording is a recorded render).
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: every write to an operator file takes a backup first (`~/.sshlg-skills/backups/`), and retired transactions keep their file copies in those backups.
- **Kill switch:** the discard guard is bypassed per command with `SSHLG_DISCARD_OK=1`; `hooks remove` takes the family hooks out.
- **Hotfix path:** a 1.81.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails, or the hook refuses an ordinary operation on a real machine within 24 hours.
