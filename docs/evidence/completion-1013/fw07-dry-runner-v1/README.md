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

## Implemented dry interface

`harness.py` has no live executor, auth probe, process launcher, network client or file-tool executor. Its command-line entry prints a dry capability notice with no arguments; any argument, including `--execute`, refuses. `Runner.run` admits only the exact in-process `FakeAdapter` type, whose input is event data, not a command. This is a transport boundary in the shipped code, not a sandbox against someone deliberately editing Python.

`Frozen` pins the reviewed proposal's manifest digest in source, verifies its complete file population, verifies both prepared plugin bundles and captures dependencies once. Every check compares with those initial values. Model-facing roots are random `cell-*` directories with only `project/` and `plugin/`; source/rubric/raw/receipt files stay outside them. Exact populations include empty-directory refusal. The one declared missing-file perturbation removes only the owned source copy. Source files are read inputs; executable mode is unnecessary because no tools or plugin scripts execute in this dry harness.

The private journal records all planned cells and the remaining unstarted indices. Both readiness cells and each task pair reserve their full proposed nominal pair amount before admission. STARTED and private payload are flushed before fake adapter entry. Exceptions preserve partial raw, known reported synthetic cost where a unique finite final value exists, and uncertainty otherwise. Per-cell or total overshoot stops; no retry/resume exists. A completed fake run means only `DRY_ONLY_COMPLETED`, never a model acceptance.

The declared stream subset checks exact init identity/inventory/tools, genuine request IDs, monotonic per-request output counts, aggregate usage reconciliation, chronological paired tool results, path confinement, and the proposal's bounds. Exact UUID replays are ignored only when the full event matches; split text blocks remain ordered. No semantic grader exists. An early audit, no required load, or direct Read-only answer remains unscored with explicit trace evidence; synthetic successful tools never become native observations. All visible text is retained separately from final.result. Masking replaces only the exact plugin root and explicit `task-pipeline@VERSION`/`task-pipeline vVERSION` labels; project evidence and incidental matching version numbers remain unchanged.

A monotonic elapsed-time guard observes the fake stream after each event. This is **not a preemptive timeout for an unresponsive real process**; no such process exists here. Live transport termination, actual CLI-schema compatibility, runtime confinement and current auth/version must be independently implemented/reviewed before any real admission. `claudeMdExcludes` intentionally blocks automatic injection; the q79 host mapping remains explicitly readable. Trace validity and artifact quality are separate, and independent semantic scoring is still NOT_RUN.

## Reproduce without a provider

Prepare two ordinary directories `BUNDLE/control/` and `BUNDLE/candidate/` from the immutable Git objects named in the held-out `source.json`, preserving paths relative to `plugin_prefix`. For control, apply the two exact old→new paragraphs in `common-correction.json` once at their named control paths. Do not use an installed skill cache or a mutable checkout as source. The supplied complete arm manifests reject missing, extra or altered bytes; a shallow clone must first obtain the named historical objects. This preparation is a local Git-data operation outside the harness, not a model subprocess adapter.

```sh
python3 -B docs/evidence/completion-1013/fw07-dry-runner-v1/check.py --bundle /absolute/BUNDLE --result /owned/result.json
```

The test program uses only stdlib Python, an in-memory fake adapter and temporary owned filesystem copies, removed per test. It does not launch Git, Claude, a shell, network tools, or providers. The optional result path is the caller's output receipt; raw synthetic captures stay in the owned temporary fixtures. Do not put actual model transcripts in these source fixtures.

The first development attempt is retained as an **unfrozen instrument failure**, not a negative historical product baseline: three inventory plants accidentally aliased the expected list, one fake stage path was wrong, non-finite JSON errors escaped the expected test class, and editing source while a run was active correctly tripped dependency binding. A later stable62-control run passed. New initial-manifest and readiness-pair guards require a final source-bound run below. No frozen task prompt, rubric or model output was changed.

Next executor: independent review of this dry harness and its fault controls → construct a newly reviewed source cut with the accepted1.94.1/checkpoint/common-prerequisite composition in BOTH arms → retain this proposal and histories as immutable cuts → implement/review any live transport separately → obtain explicit new spend/call admission. The proposed $24 is not approved by this code or by a passing fake suite. Existing GoogleAuth/native NO_ADOPTION and prior TEST_ERROR receipts remain unchanged.

Self-review also watched two explicit boundary failures before correction: the durable STARTED snapshot initially left cost uncertainty false until an exception was caught, and an extremely large JSON integer overflowed numeric validation. The corrected journal marks uncertainty **before** fake adapter entry and clears it only on known terminal cost; numeric admission rejects out-of-range values without an exception escaping recovery. `started-baseline.json` preserves the observations. Root-confined lexical `..` reads remain valid after normalization; symlink aliases and escape outside the two exposed roots refuse.

Final source-bound controls and implementation handoff are recorded in [validation.json](validation.json) and [HANDOFF.md](HANDOFF.md). Those receipts describe offline evidence only.
