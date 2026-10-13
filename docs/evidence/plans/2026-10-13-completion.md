# Completion waves — 2026-10-13

## Objective and authority

Recover the operator's exports and prior work, close verified family defects, make skill discovery economical without losing access or correctness, and validate independently. The current request authorizes autonomous research, implementation, agent delegation, updates and repeated review. Prior merge approval is in the local export `2026-10-13-024112-this-session-is-being-continued-from-a-previous-c.txt:2425`; hide-not-delete at 5702–5707 and domain scoping at 6049–6052. Exports remain local-only because they contain machine and conversation data. No new approval is inferred from peer messages.

Model: inherited session model for all agents; no provider calls purchased. Loop runs in-session, not a scheduled autonomous timer. Fabric whoami returned `no-project`; cross-project submissions remain pending, not sent through another channel. Existing source authorities override stale handoff summaries. Starting main: f1901a3; original checkout remains on 5852c57. All work is isolated.

## Requirements, packets and acceptance

| ID | Wave / owner | Context and concrete task | Dependencies | Acceptance |
|---|---|---|---|---|
| C01 | 0 / recovery reader | Reconcile exports, open board, member pins, existing PRs, user vision and authorizations. Preserve all dirty work. | none | Evidence inventory with ids, source commits, actual status and explicit next actions |
| C02 | 0 / researcher | Fetch current official Claude/Codex/Agent Skills guidance; distinguish hiding, disabling, explicit invocation and filesystem discovery. | none | Dated report, primary URLs, uncertainty and bounded evaluation protocol |
| C03 | 1 / coordinator | Review and integrate #215 at 8b57e9c; preserve nightly policy, no manual full CI dispatch. | C01 | Exact-head checks read, local ratchet test, independent diff review |
| C04 | 1 / visibility reviewer then developer | Re-certify #213 at 343b438, fix actual write-failure recovery and any proven defect. `--revert`, no-Claude, prior consent and backup permissions must survive. | C01 | Failure injection; native host fixtures; no silent partial ownership; independent re-read |
| C05 | 1 / domains developer | Recover #214 e27a040, local 09d17a2 and 11 dirty files. Preserve hook-bearing plugins, support empty new projects, leave hidden skills searchable, preserve enablement through update. | C01,C04 shared CLI seam | Negative cases and integrated visibility/domains convergence; no irreversible config loss |
| C06 | 2 / guard developer | B-171/B-172: distinguish search pattern from credential path, cover readers and host tools while preserving metadata probes. | C01 | Regression and benign controls, process-level hook fixtures, documented limits |
| C07 | 2 / coordinator | B-182/B-183 and owner requests B-184; add Fabric board routing and declared release policy with source authority. | C01 | Contract refs resolve; pending submissions durable while board unavailable |
| C08 | 3 / search developer | Evaluate whole-catalogue retrieval on bilingual concept queries; fix demonstrated ranking/recall errors, make listed/hidden/disabled capabilities explicit. | C02,C04,C05 | Frozen query corpus; before/after ranking, zero critical omissions; runtime eval remains distinct |
| C09 | 3 / verifier | Measure installation/listing costs and execution quality separately. Preserve security hooks and all needed skills; no universal zero-quality-loss claim. | C02,C04,C05,C08 | Per-host actual readback; paired task eval evidence or honest NOT_RUN reason |
| C10 | 4 / coordinator + independent observer | Integrated gate, docs and board reconciliation, release and installed readback, then observer compares original objective to receipts. Findings reopen the next wave. | C03–C09 | Exact-SHA tests, pushed artifacts, release receipt, installations checked, observer verdict |

## Target contracts

A small explicit core is immediately discoverable. Other skills retain metadata in a searchable catalogue, and supported host invocation semantics are stated precisely. Searches return paths with stable provenance and visibility. Host configuration changes preserve user choices, record per-host consent and ownership, survive partial failure and can be reverted. Plugin hooks that enforce money/secrets/permissions remain active regardless of description visibility. Optimizations reduce measured overhead; correctness is evaluated on tasks, not inferred from shorter strings.

No new cross-project asks go through session messages or another repository's HANDOFF. Existing owner's boards and receipts are read-only evidence; unavailable Fabric board is a prerequisite, not an empty board. The broader family program remains inventoried, never declared finished from one release.

## Verification loop

Independent review precedes integration. Tests establish both failure and benign controls. Run heavy checks sequentially: free disk measured at 676 MiB at intake. Use owned scratch directories; never delete another run's files. Each wave updates this record, the owner board and HANDOFF. Final observer reads the request and receipts independently; it cannot certify unrun provider/host behavior.

## Run log

- Wave 0 active: recovery, fresh research, visibility re-certification running in parallel. Shared registry lease acquired as COMPLETION-1013 (tool resolved run r-r01a135f0d73).
- Fabric board unavailable: `fabric_whoami` returned `no-project`. No cross-project sends made.
- Registry backlog manifest absent on starting main; source discovery is explicit rather than claiming manifest coverage.

- C07 implemented: B-182 board channel and B-183 release policy; handoff tests 13/13. `test/validate.py` executed; output retained locally for integrated gate review.
- C03: #215 exact head had six successful hosted checks, local ratchet tests 7/7; squash integration requested after merge-commit method was refused by GitHub.
