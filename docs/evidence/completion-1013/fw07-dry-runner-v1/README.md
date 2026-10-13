# FW07 dry-only harness acceptance packet

Status: specification before implementation. No live transport is implemented or authorized. The immutable [held-out proposal](../fw07-behavioral-holdout-v1/README.md) remains unchanged. Its candidate rebase onto accepted 1.94.1, owner full gate, installer coverage, and separate spending admission remain prerequisites.

This slice builds only an in-process fake adapter and actual owned filesystem materialization. It never invokes Claude, an OS subprocess, a network provider, a shell, or a file tool. It must not promote synthetic tool-result events into observed native behavior. No test uses an LLM judge.

Acceptance controls, fixed before implementation:

1. Freeze initial bytes/population of the proposal, all harness dependencies and both prepared full plugin bundles. Coordinated source+manifest/rubric replacement after initialization must refuse; never adopt a freshly reread manifest.
2. Verify full 121/132-file source inventories and exact fixture hashes before copying. Reject symlinks, path traversal, extra/missing files and changed source. Neutral random cell paths expose only the arm plugin and selected project fixtures, never labels/rubrics/costs.
3. Preserve restrictive settings, four read tools, empty MCP, no hooks/memory/connectors and no live executor. In-memory fake traces only; attempts to select a live adapter or execute mode refuse before STARTED.
4. Save private0600 STARTED before adapter entry, then ordered raw event lines and complete visible text, excluding thinking/tool output. On exceptions/interruption, preserve partial raw bytes, unknown cost and unstarted cells, without retry. Reopening an existing output refuses rather than resumes.
5. Deduplicate token accounting by genuine request identity, not assistant chunk count. Conflicting usage, missing identity, invalid/nonfinite/negative usage, aggregate mismatch, excessive requests/reported turns/input/output/artifact/time/stream bytes all refuse.
6. Enforce exact readiness inventory/model/provider/tools and no readiness tools. Tool calls/results pair chronologically; outside-root reads, forbidden tools, errors and unmatched/replayed identities refuse. Only declared missing-doctrine error is a behavior input. Successful load/read alone does not grade quality; chronology is evidence for independent artifact adjudication, not a semantic PASS.
7. Reserve whole task pairs before first cell, reconcile finite reported costs, stop on unknown cost/overshoot, retain explicit caps. Both clean readiness cells precede any task. Fake costs are synthetic, never charged/subscription observations.
8. Produce masking maps for only explicit plugin root/version identifiers; preserve project evidence and substantive text. Original and masked artifact hashes stay separate. Independent review remains unperformed; do not infer gate quality from synthetic artifacts.
9. Verify unchanged visible file population/bytes before and after every fake event and before result capture; reject adapter modifications. Preserve initial binding on errors. Existing test-error histories stay immutable.

Prior measurement errors informing these controls: [native-v1 request/artifact continuation](../native-quality-v1/README.md), [native-v2 temporal ordering](../native-routing-v2/README.md), [R27 inventory/turn limits](../skill-search-native/README.md), and [paired-reader strict-format stops](../paired-routing-1013/README.md). This harness implements a separately declared stream subset; matching fake events is not evidence that a current CLI emits it. Live schema and actual confinement need separately reviewed admission.

Implementation/check commands and exact measured counts will be appended only after execution. The full plugin input bundles are prepared from local immutable Git objects outside this harness; the runtime accepts only directories matching the proposal's complete arm hashes, not arbitrary source or external commands. Raw fake artifacts and source copies are temporary owned fixtures, not repository deliverables; sanitized test results and source hashes are retained here.
