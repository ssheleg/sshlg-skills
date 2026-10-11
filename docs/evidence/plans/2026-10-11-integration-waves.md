# Plan — integration waves (2026-10-11)

[Brief and REQ table](../briefs/2026-10-11-integration-waves.md) ·
[canvas](../specs/2026-10-11-integration-waves-canvas.md) ·
[inventory](../specs/2026-10-11-integration-waves-inventory.json) (regenerate with
`python3 docs/evidence/specs/2026-10-11-integration-waves-assign.py`; `--check` exits 1
on drift).

## How the waves run

Stages 0–4 ran once and are recorded here. Each wave runs stages 5–8 and then the close
pass:

1. **Certify.** Three blind readings run as independent agents: `verifier-unit`,
   `verifier-seam` and `verifier-product`.
2. **Fix.** One fix round inside the loop guard.
3. **Document.** Docs move in the same change as the code.
4. **Mark the canvas.** Each node carries its status and the commit.
5. **Re-read the goal.**
6. **Re-cut.** Re-run the assign script and re-cut the remaining waves.

Between waves the run does not ask whether to continue.

**Independent observer.** After the last wave, a separate agent reads the operator's
request (brief, top) and the shipped evidence, never the plan, and answers one question:
does the system now match the goal? A "no" becomes REQ rows and another wave.

**Developer agents.** Each task packet below carries the following, so an agent never
reconstructs the work from chat:
- the objective and the files;
- the contract and its failure behaviour;
- the tests to write first, watched failing;
- the gate command;
- the evidence to return.

Builds that share a seam run sequentially. Packets in different repositories run in
parallel, each in its own worktree from `origin/main`.

**Standing constraints for every packet.**
- Read the repository's `CLAUDE.md` and retro standing instructions first.
- Use TDD, and watch every new guard fail against a planted defect (retro #6: the plant
  asserts on the parsed value).
- Read a command's output, not its exit code (retro #8).
- Put no secrets anywhere.
- An operator file is written only through `protect()`.
- Commit and push on the packet's branch and open a PR; never force-push.
- Return the PR URL, the gate output and the evidence list.

## Wave 1 — hub skeleton (N01, N02) · R01–R06

**Exit criteria, fixed before it starts:**
- `npm test` is green, read from the output.
- New fixtures for R01–R05 each fail on the current `main` and pass on the branch.
- `npx sshlg-skills hooks` on this machine reports no stale entry after `update`.
- Three-run idempotence (hashes) for the `update` re-wire.
- Startup and per-prompt chars are measured before and after, in the receipt.
- The hub release is tagged, its run is read by tag, and `npm view` shows it.
- The new runtime is installed and read back.

### Packet W1-A — once-per-route note (R01)
- **Files:** `lib/triggers.js` (`render`), `lib/turnstate.js`, `hooks/user-prompt-submit.js`,
  `hooks/session-start.js`, `test/triggers_test.js`, `test/hooks_e2e_test.js`.
- **Contract:** `render(prompt, {external, noted})` returns only routes not in `noted`.
  The hook reads `turnstate.noted` and, after printing, writes the union. SessionStart
  with `source` ∈ {`clear`, `compact`} writes `noted: []`. `startup`/`resume`/`fork`
  keep the record; a resumed session is the same session id and its context still holds
  the note. A system turn (`isSystemTurn`) neither prints nor records.
- **Failure behaviour:** unreadable turnstate means print as today (fail open toward
  showing the hint, never toward hiding a route forever).
- **Tests first:**
  - the same prompt twice in a session prints once;
  - a new route on turn 2 prints only the new route;
  - compact resets;
  - an unreadable turnstate prints.

### Packet W1-B — injectors line on change (R02)
- **Files:** `lib/injectors.js`, `hooks/session-start.js`, `test/injectors_test.js`.
- **Contract:** `line(current, recorded)` prints when the sorted injector name set differs
  from `state.json.injectors`, or when nothing is recorded. The hook records the set
  after printing. Drift, update and handoff lines are unchanged.

### Packet W1-C — `update` re-wires a consented machine (R03)
- **Files:** `bin/sshlg-skills.js` (update, about 572–595), `lib/hooks.js` (`plan`,
  `installed`, the diff reason), `test/hooks_e2e_test.js`, `test/hooks_test.js`.
- **Contract:**
  - When at least one family hook entry is present in `~/.claude/settings.json`, `update`
    computes `plan(current, root)`. If `changed` is non-empty and `conflicts` is empty,
    it writes through `protect()` and logs each event with its reason (`matcher`,
    `command`, `order`).
  - With no family entry it does nothing (no consent).
  - `hooks` status prints the reason per event.
- **Proof:** run the real `update` path three times against a real settings file and
  compare hashes (retro #2).
- **Then:** run it on this machine and read `npx sshlg-skills hooks`.

### Packet W1-D — runtime-resolved remedies (R04)
- **Files:** `lib/secrets.js`, `lib/hygiene.js` (if it prints remedies), `test/secrets_test.js`.
- **Contract:** one constant
  `USE_SECRET = '"$(project-observatory full-path)/tools/use_secret.py"'`, used with
  `run --vault-only` / `pipe` everywhere. A test fails if any remedy contains
  `~/DATA/project-observatory` or `/tools/use_secret.py` without the resolver.

### Packet W1-E — state.json interface and update lock (R05)
- **Files:** `lib/updatecheck.js`, a new `lib/updatelock.js`, `bin/sshlg-skills.js`,
  `docs/working-rules/state-json.md` (new; DOCMAP entry), and a test.
- **Contract:**
  - `state.json` carries `schemaVersion: 1`; keys are documented.
  - `update` creates `~/.sshlg-skills/update.lock` exclusively, with
    `{pid, startedAt, host}`.
  - A second `update` with a live lock refuses with exit 2 and names the holder.
  - A lock older than 30 min, or whose pid is dead, is taken over and logged.
  - The lock is released on every exit path.

### Packet W1-F — hook latency (R06)
- **Measure:**
  - wall time of each `hooks/*.js` with `SSHLG_SKILLS_NO_PROBE=1` and a sandbox `HOME`,
    10 runs, median;
  - `post-tool-use.js`'s `ps -Ao` cost.
- **Act:** optimize only what is over 150 ms on a common path. Record the table in
  the receipt.

## Wave 2 — task-pipeline (N06, N03) · R07–R16

The repository is `ssheleg/task-pipeline`; work happens in a worktree from `origin/main`.
There is one release at the end of the wave, and the hub re-pins in wave 5.

**Exit criteria:**
- The member gate is green.
- The planted bare `mkdtemp` fails the new guard.
- After two full suite runs, `$TMPDIR` holds no new `tp-*` tree.
- `validate.yml` is under 400 KB (`wc -c`).
- The validate job, read by run id on the PR, is ≤ 45 min.
- The description is ≤ 900 chars and the body has ≥ 100 tokens spare.
- `fix-pf-06.01` reports PASS.
- `stage_checkpoint_test.py` covers the connected and unavailable cases.
- The release tag run succeeds; npm and the registry are read.

**Packets, run in this order because they share files:**
1. **W2-A residue (R07).** Covers `test/validate.py:3459`,
   `test/stage_checkpoint_test.py:55,199`, `test/residue.py:59` and the 41 bare
   `mkdtemp` calls. Ledger rule per the canvas N06. Add a guard `check_no_bare_mkdtemp`
   with a structural plant. Reap the existing leak by prefix ownership only.
2. **W2-B CI (R08).** Move each negative self-test from a step into a manifest
   `test/negatives.json` with one runner step. Shard the suite with a matrix. Measure
   on the PR. Closes #91, HK-05 and B-100.
3. **W2-C budget (R09).** Trim the description to ≤ 900 chars. Move named body sections
   to `references/` until ≥ 100 tokens spare (B-120). Record before and after.
4. **W2-D continuity (R11, R13, R14, R16).** Covers `references/continuity.md`,
   `scripts/stage_checkpoint.py`, `references/waves.md` (backlog-sources),
   `execution-packet` schema (namespaced id, old id accepted one release), and
   `references/deploy-targets.md` / release stage (approval mode: `checks` |
   `reviewers`; on reviewers, report the waiting-run link).
5. **W2-E Fabric contract (R15).** Add `test/fixtures/fabric-pipeline-contract.json`
   built from Fabric `taskPipeline.ts:36,40` at a pinned commit (read with
   `git -C ~/DATA/fabric show origin/main:…`). `fix-pf-06.01` reads the fixture when no
   checkout is present.
6. **W2-F ledgers (R10).** `verification.md` header, delete the merged branches
   `feat/wave-mode` and `fix/no-stamp-1912` (only after `gh pr list --state merged`
   confirms), and bring HANDOFF current.

R12 (the handoff-layers map) lives in the hub. It is written in this wave on the hub
branch, so task-pipeline cites a file that exists.

## Wave 3 — agent-sync (N04) · R17–R22

The repository is `ssheleg/agent-sync`, in one worktree, with one release.

**Exit criteria:**
- The gate is green.
- Each fixture for the run id, reap, long lease, token order, conformance map and
  AS-07/08/09/10/14 was watched failing on `origin/main`.
- `agent_sync.py status` on this machine counts expired leases, and `reap --expired`
  in dry-run lists only provably finished ones.
- Release tag, run and registry are read.

**Packets:**
- **W3-A identity (R17).**
- **W3-B residue, `reap --expired` and status counts (R18, AS-11).** Dry-run is the
  default; `--apply` journals each removal.
- **W3-C long-lease warning (R19).**
- **W3-D token order (R20).** A stub `use_secret.py` in fixtures; the doc names the
  operator's migration step.
- **W3-E conformance map (R21).** Pinned to the `fabric-agent-contract` commit.
- **W3-F AS-07, AS-08, AS-09, AS-10, AS-14 (R22).**

## Wave 4 — agent-stack + make-skill (N05, N07, N06 residue) · R23–R29

Two repositories run in parallel, each with its own release.

**Exit criteria:**
- Both gates are green.
- The trust-tier text and the fabric-interop example are pinned to commits that resolve.
- Back-link checks are in the gates.
- Residue guards were watched failing.
- The eval report carries run ids, arms, n and cost.
- The releases were read.

**Packets:**
- **W4-A agent-stack (R23–R26, R28 AG-06a/b).** `agent-interop/references/gateway.md`
  carries the tiers, cited per the peer note. `interop.md` carries the fabric-interop
  example. Links go to the `fabric-agent-adapter` skills and `observatory-log`.
  Descriptions get ≥ 30 chars spare.
- **W4-B make-skill (R25, R27 setup, R28 MS-05, R29).** `skill-search` trigger evals in
  `evals/`. HANDOFF current. Residue guard.
- **W4-C eval round (R27).** Paired arms with and without the protocol sentence, per
  hub `test/evals/README.md`, through `claude -p` on the subscription. The result
  decides B-144 and the Codex core list.

## Wave 5 — hub close (N08, N07, N01 ratchet, N09) · R30–R34

**Exit criteria:**
- `npm test` is green.
- The hub board guard fails on a planted defect in a member board.
- The compatibility report has a readback per host.
- The family description ratchet is recorded.
- Pins match the four member releases.
- The hub release has been read from npm.
- The installed runtime has been read back.
- The graph has been refreshed and checked against the docs.
- Asks have been sent with message ids.
- The wiki diff has been committed in the vault's own repository.

**Packets:**
- **W5-A board guard over member boards (R30).**
- **W5-B compatibility cut (R31).**
- **W5-C description ratchet (R32).**
- **W5-D pins, release, install, readback (R33).**
- **W5-E graph refresh and doc check (R33).**
- **W5-F asks and wiki (R34).**

## Close — stage 9, stage 10 and the independent observer

- Stage 9 runs the propagation matrix over everything the waves shipped.
- Stage 10 walks the ladder for every REQ, writes the coverage table, closes the
  ledgers with board ids, and records the retro: the stamp, the prune, and an entry if
  the run diverged.
- The observer's verdict goes into `docs/evidence/acceptance/2026-10-11-integration-waves.md`.

## Revisions

| Date | Change | Why |
|---|---|---|
| 2026-10-11 | initial cut: 238 items — 74 in waves 1–5 (8/21/14/15/16), 10 operator, 154 program | wave-0 survey |
