# Release impact: sshlg-skills v1.83.0

schema: release-impact/1
release: v1.83.0
users: external
date: 2026-10-28

## 1. Who is affected and how

- **Segments:** everyone who installs or updates the family through the launcher, the operator's machines included.
- **What changes:** the prompt hook routes Quest-named and 3D-model phrases and stops naming web3d-dev for an ML model; the discard guard ignores redirect targets and counts `git clean -e` exclusions; `hosts` reports Pi's undecided trust in its counts; two members move (web3d-dev 0.2.6, xr-dev 0.4.5). No routing block, hook wiring or settings write changes shape.
- **Breaks for existing users:** a prompt that said "the model is too heavy" without "3D" no longer routes to web3d-dev, which is the intended change. Route probe: 0 false positives over 158 prompts.
- **Rollout:** all at once through npm `latest` and the next `update` on each machine.
- **Timing:** 2026-10-28, after the gate is green; no dependent release waits on it.

## 2. Tracking

- **Signals:** (1) the tag's release workflow conclusion; (2) `npm view sshlg-skills version`; (3) `npx --yes sshlg-skills@latest update` on the operator machine exits 0 and verifies all members; (4) open issues on ssheleg/sshlg-skills; (5) no hook refusal of an ordinary command reported in a session.
- **Baseline:** (1) v1.82.0 release run 40638000970 success; (2) 1.82.0; (3) `update` 33 of 33 steps with all members verified, Codex partial while Codex runs; (4) 0 open issues; (5) none reported since 1.82.0.
- **Where:** (1) `gh run list -R ssheleg/sshlg-skills --workflow release.yml -L 1`; (2) `npm view sshlg-skills version`; (3) the command's output; (4) `gh issue list -R ssheleg/sshlg-skills --state open`; (5) the session's hook output.
- **Watch window:** 24 hours after the tag.

## 3. Alerting

- **Fires when:** the release workflow fails, or an issue is opened on the hub (GitHub notification to the owner).
- **Receives:** the repository owner, by GitHub email and the GitHub inbox.
- **Seen firing:** never for this repository's release workflow; the watcher of this card reads signals (1) and (4) itself during the window.

## 4. Rollback or hotfix

- **Rollback:** `npm dist-tag add sshlg-skills@1.82.0 latest` moves new installs back at once; a 1.83.1 revert follows if needed.
- **Time to roll back:** minutes for the dist-tag, about an hour for a patch release.
- **Data reversible:** yes: every write to an operator file takes a backup first; this release adds no new write.
- **Kill switch:** `SSHLG_DISCARD_OK=1` on a command bypasses the discard guard; `hooks remove` takes the family hooks out.
- **Hotfix path:** a 1.83.1 patch through the same gate.
- **Decision trigger:** roll back if the release run fails, `update` fails, or a hook refuses an ordinary operation on a real machine within 24 hours.

## Outcome

- **Read:** 2026-10-29T11:12Z, after the 24-hour window: (1) release run 40644059961 success; (2) `npm view sshlg-skills version` 1.84.1 (later releases replaced it as planned); (3) `npx --yes sshlg-skills@latest update` on the operator machine on 2026-10-29: all 11 Claude members verified; the Codex step read PARTIAL because `codex plugin list` waited past the 120 s read limit on a remote catalog request (a Codex network wait, filed as B-317, not caused by this release); (4) 0 open issues on ssheleg/sshlg-skills; no hook refusal of an ordinary command reported; no alert fired; the decision trigger did not fire
- **Result:** held
