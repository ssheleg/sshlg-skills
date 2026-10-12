# Acceptance — integration waves 2026-10-11 (WAVES-1011)

Run: `/task-pipeline waves` over the whole board, operator emphasis on optimisation and on the
family working with Fabric, Observatory and every coding agent. Brief and REQ table:
[briefs/2026-10-11-integration-waves.md](../briefs/2026-10-11-integration-waves.md); plan:
[plans/2026-10-11-integration-waves.md](../plans/2026-10-11-integration-waves.md).

## Releases shipped (each read from its release run and npm)

| Package | Versions | Merge | Certification |
|---|---|---|---|
| sshlg-skills (hub) | 1.56.0, 1.57.0, 1.57.1, 1.58.0 (fabric router, another session), 1.59.0 | #192/#193, #196, #197, #198, #200, #202 | wave 1: three readings, then a final polish re-read on 2026-10-12 (pass, three risks → B-178 and B-163 note); 1.57.0: unit pass, seam+product fail → fixed; #200: two failing readings, then the design changed (loop guard) and was measured with the reviewers' probes |
| task-pipeline | 1.93.2, 1.93.3 (v1.93.0/1.93.1 tags published nothing: their own release gates refused) | #109–#111, #113 | three readings of #109; re-reading of the fix commits failed on evidence wording → 1.93.3 |
| agent-sync | 1.22.0, 1.22.1 | #32, #33 | three final readings of #32; re-reading of the fix commits failed on AS-18 breadth → 1.22.1, whose reading failed once more (opener cut-off) → fixed, three cases watched failing |
| agent-stack | 0.27.0, 0.27.1 | #44, #45 | second reading pass (unit, seam), product pass with risks; 0.27.1's reading failed on the reaper's guards → fixed (13 cases) |
| make-skill | 0.31.0, 0.31.1 | #33, #34 | seam+product failed → fixed; re-reading failed on one validator message → 0.31.1, reading pass |

Installed here: hub 1.58.0 at the time of the observer's reading (fabric-dashboards session, 83/83);
the routing block (with the fabric row) is in all five host files, `~/.pi/agent/AGENTS.md` included.
Codex's native family plugins moved to the pins through Codex's own CLI (B-166, now automated).

## REQ coverage

| REQ | Status | Evidence |
|---|---|---|
| R01–R06 | met | wave-1 receipt `runs/2026-10-12-wave1.md` (simulated notes 45→30, injector lines 10→1, user-prompt-submit 204→80 ms), 1.56.0 |
| R07 | met | task-pipeline temp guard + leak reap; `$TMPDIR` holds 4 `tp-*` entries (observer) |
| R08 | met | `validate.yml` 12,714 bytes; PR runs ~7 min (was 90–111) |
| R09 | met | description 890/1024, body 4646/4750; hub reserve ratchet 13 |
| R10 | met | merged-PR branches deleted in all five repos (2026-10-12) |
| R11 | partially met | `stage_checkpoint.py handoff/accept`, memory nudge, retry semantics (1.93.3); no live Observatory run receipt — Observatory's MCP server in this session was stale |
| R12 | met | `docs/working-rules/handoff-layers.md`, cited by task-pipeline `continuity.md:324` |
| R13 | met | `scripts/backlog_sources.py` + `test/backlog_sources_test.py` (31 cases), 1.93.3 |
| R14 | met | namespaced packet id; bare id still read until B-135's migration |
| R15 | met | `test/fixtures/fabric-pipeline-contract.json` + `fix-pf-06.01.py` |
| R16 | met | `pipeline.schema.json` release.approval + `test/release_approval_test.py` (20 cases), 1.93.3 |
| R17 | met | agent-sync run id per key (1.22.0) |
| R18 | human-gated | `reap --long-expired` is the operator's sweep; whether it satisfies R18 is the operator's decision |
| R19 | met (dormant at Observatory) | held-too-long notice reaches the model; Observatory adds its interval (INB-001) |
| R20 | met (human tail) | vault first; moving the Notion tokens into the vault is the operator's step |
| R21 | met | `references/fabric-coordination.md` pinned to fabric-agent-contract `bcada4a` |
| R22 | partially met / human-gated | AS-07–AS-10 closed; AS-14 awaits the operator's drop/keep decision |
| R23–R26 | met | agent-stack 0.27.0 (tiers DL-25/DL-26, jobs, back-links, 929–939 chars) |
| R27 | not met (date-gated) | skill-search evals authored (make-skill 0.31.0); the model run (W4-C) waits for the Sonnet weekly limit to reset on 2026-10-16 (B-147, B-144) |
| R28 | met | MS-05 (make-skill 0.31.0) and AG-06a/b (agent-stack 0.27.1) |
| R29 | met | make-skill HANDOFF (0.31.1) |
| R30 | partially met | hub plant watched failing; members' own-gate checks owed (B-108/B-109) |
| R31 | met | `docs/reports/2026-10-12-coding-agent-compatibility/` (8 hosts; model layer NOT_RUN by design) |
| R32 | met | DOCMAP `description-total: 32501` |
| R33 | met | graph refreshed (8,219 nodes, `0150822`), pins and releases above, install read back |
| R34 | met | Observatory INB-001…006 accepted (INB-006 fixed in #200), fabric-workspace #169 (`44bc7f2`), wiki `7df878f` |
| R35 | met (budget still exceeded) | plugins scoped; Claude's skill listing 66,371 chars against 30,000 (B-145 / B-143 pack triage is the operator's lever) |
| R36 | human-gated | Gemini CLI 0.63.0 from npm; sign-in is the operator's |
| R37 | met | `lib/pi.js`, `hosts`, block in `~/.pi/agent/AGENTS.md`; Pi's own loader sees 39/39 |

## What only a person can do

Gemini sign-in (R36); AS-14 drop or keep and the R18 age-sweep decision; the Notion tokens into
the vault (R20); B-143 pack-triage marks (the largest listing cut); ownership of the
`SSHLG:REPOSITORY-HANDOFF` block (B-174); the star-line question (Observatory O4).

## Observer

An independent observer read the run on 2026-10-12 (~17:57 CEST) and answered **not yet**: 20 met,
13 partially, 1 not met, 3 human-gated, with ten ordered gaps. Items 1–6 of its list were closed
after that reading (install read back, #200 and B-166 merged, stale docs, the four fix commits
re-read and their findings fixed in patch releases, task-pipeline R13/R16 tests, AG-06a/b, merged
branches). Items 7–9 remain as stated above (human steps, W4-C after 2026-10-16, the listing).
