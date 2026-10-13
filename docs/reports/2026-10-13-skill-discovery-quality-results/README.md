---
report:
  id: sshlg-skills/2026-10-13-skill-discovery-quality-results
  title: "Skill discovery and native quality: measured results and adoption boundary"
  kind: benchmark
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-11-13
  summary: >-
    R27 native skill-search matched 59 of 60 cells, but did not execute catalogue search.
    A paired router reader retained seven of nine route sets; neither experiment proves task quality.
    Passive specialist selection missed two P1 intents; directed P2 access worked for both,
    but one artifact still missed a required test. Keep descriptions unchanged: NO_ADOPTION.
  sources:
    - {name: "Frozen evidence ledger", path: raw/sources.json, read_at: 2026-10-13}
    - {name: "Computed receipt usage", path: raw/measurements.json, read_at: 2026-10-13}
    - {name: "R27 readout", url: "https://github.com/ssheleg/sshlg-skills/blob/42a8a57aa2a6fee24d496a153734845140b1da70/docs/evidence/completion-1013/paired-routing-1013/readout.json", read_at: 2026-10-13}
    - {name: "P2 quality readout", url: "https://github.com/ssheleg/sshlg-skills/blob/42a8a57aa2a6fee24d496a153734845140b1da70/docs/evidence/completion-1013/native-routing-p2/readout.json", read_at: 2026-10-13}
  produced_by: {agent: codex, task: EVAL-RESULTS-1013}
  supersedes: []
  consumers: [sshlg-skills]
---

<sub>ssheleg skills — project-reports · evidence-docs</sub>

# Skill discovery and native quality: results

## Decision

**NO_ADOPTION.** Keep installed descriptions and neighbouring router paragraphs unchanged. The observations establish bounded loading and explicit access, not unchanged end-task quality after context reduction. No new model call or installed change was made to prepare this report.

This is a new results cut at hub source `42a8a57`; [raw/sources.json](raw/sources.json) records its full commit and receipt hashes. It supplements, without rewriting, [RPT sshlg-skills/2026-10-13-native-skill-routing §Decision](../2026-10-13-native-skill-routing/README.md#decision) and [RPT sshlg-skills/2026-10-13-skill-discovery-efficiency §Decision input](../2026-10-13-skill-discovery-efficiency/README.md#decision-input). The earlier mechanism research and stopped experimental receipts remain historical evidence.

## What each experiment actually measures

| Experiment | Observation | Inference boundary |
|---|---|---|
| R27 native skill-search C | 59/60 matching calls; all20 queries pass the frozen majority-of-three rule. Positive29/30, negative30/30; train35/36 and validation24/24. One valid non-load remains a miss. | Restricted Skill-only invocation, not actual toolkit search or task execution. |
| R27 paired paragraph reader | 18 valid cells, three intents × two paragraph arms × three repetitions; seven of nine paired route sets equal. | Reading supplied router text, not native selection or complete family quality. |
| Native quality v1 | Four complete audit artifacts; zero Skill calls; all four fail the pre-switch permission criterion. | English/Russian translations are correlated. Inventory registration is not body use. |
| Native routing P1 | Six audit cells, three intents × full/concise. ad-tracking loads before both conversion audits; google-auth and stripe-billing do not load in either arm. Four of six artifacts pass the fixed rubric. | Good billing answers without loading do not demonstrate selection. Three exploratory intents cannot establish compression equivalence. |
| Directed access P2 | Both full-arm requested Skill calls succeed before audits. b7 passes3/4 required criteria; k2 passes4/4. No forbidden behavior observed in either. | Access is possible in this exact host setup. Direction changes the task; no passive-selection repair, body-benefit or arm comparison is proved. |

Sources: [R27 native readout](../../evidence/completion-1013/skill-search-native/readout-c.json), [reader readout](../../evidence/completion-1013/paired-routing-1013/readout.json), [v1 independent review](../../evidence/completion-1013/native-quality-v1/artifact-independent-review.json), [P1 readout](../../evidence/completion-1013/native-routing-v2/readout.json), [P2 criterion-level review](../../evidence/completion-1013/native-routing-p2/artifact-review.json).

For the paragraph reader, login-interface wording retains the UX/design/copy/delivery set in all six cells. Current doctrine requires UX, so the older silence label is not current truth. Monitoring/alerts is exploratory: one no-neighbour response omits sheleg-dev. Plugin wrapping keeps make-skill in every cell; one current-paragraph response adds task-pipeline. These are route-set observations, not a scored claim that removing paragraphs is harmless.

P2 b7 still omits an explicit **DENIED-before-switch** test. Its UNKNOWN gate and post-switch rollback test do not substitute for that admission control. k2 passes the predeclared rubric, with separate caveats about persisted event outcome versus delivery outcome, final invariants after retry, and a barrier that must exercise the old unlocked read path. Additional caveats were not used to change the fixed rubric after seeing results. The reviewer froze P2 quality judgments before opening load/cost receipts; the review was directed-full-arm and does not claim formal blinding. Parent independently checked complete text and temporal Skill-result provenance.

## Cost and token bounds

Two distinct accounting programs remain separate:

| Program | CLI invocations, including stopped protocols/readiness | Reported list estimate USD |
|---|---:|---:|
| R27 native A+B+C | 64 | 2.4620616 |
| R27 paragraph reader A+B | 21 | 0.4414536 |
| **R27 combined** | **85** | **2.9035152** |
| Native v1 | 8 | 0.4536322 |
| Native P1 | 8 | 0.7649350 |
| Native P2 | 2 | 0.3005844 |
| **Native v1+P1+P2** | **18** | **1.5191516** |

Each program retained its own USD4 reported-list envelope. Do not call these two program figures, their sum, or unused reservations total project spend. Earlier explicit-catalogue pilots and other project activity are outside this accounting. List metadata is not subscription billing, hidden transport retries or an enforceable first-request invoice cap. Stopped protocol calls remain charged observations rather than disappearing from the denominator. [R27 accounting](../../evidence/completion-1013/paired-routing-1013/readout.json), [native accounting](../../evidence/completion-1013/native-routing-p2/readout.json).

The [computed usage table](raw/measurements.json) sums final input, cache-creation input and cache-read input once per CLI receipt. It does not sum repeated streaming usage blocks or double-count cumulative costs. Selected measurements:

| Comparable bounded P1 phase | Full input across cache modes | Concise input across cache modes | Interpretation |
|---|---:|---:|---|
| One readiness call per arm | 7,640 | 6,069 | 20.56% lower observed startup input in this fixture. |
| Three task calls per arm | 127,443 | 121,492 | 4.67% lower aggregate task input; output and tool paths also vary. |

P1 task output was6,506 versus6,464 tokens; task list estimates were USD0.3676956 versus USD0.3541368. Those are observations from one small run, not a causal savings estimate or quality-preserving adoption. Native P2 used97,041 aggregate input and4,484 output tokens across its two directed full-arm calls; there is no matched concise P2 arm. R27 C's60 task calls used573,077 aggregate input and39,704 output tokens, measuring a different source/tool inventory and task type. Listing character reductions, startup input reductions, repeated task input and actual task success must remain distinct measures.

## Preserved stops and interpretation corrections

R27 A stopped on a startup-inventory prediction that incorrectly included a legacy command. B stopped because reported turn counts were equated to distinct assistant requests. C used the separately reviewed correction; A/B remain TEST_ERROR. Paragraph-reader A's formatting stop remains unchanged; B contributes17 new valid task cells to A's one valid cell, rather than rescoring the rejected output.

Native v1 retains A/B readiness stops and C's parser stop. C's completed artifact was later replayed offline with unique request IDs and **all** delivered text blocks, not merely `result.result`'s final tail. D ran only the three remaining cells. P1/P2 do not retroactively turn those original stops into PASS. See the [v1 chronology](../../evidence/completion-1013/native-quality-v1/README.md), [R27 chronology](../../evidence/completion-1013/skill-search-native/README.md), and [reader protocol](../../evidence/completion-1013/paired-routing-1013/README.md).

`init.skills` is an observed user-invocable inventory, not an attestation of every rendered description, model-visible token or invocation permission. A response saying “skill loaded” is not independent loading evidence; successful tool-result order is. The earlier [source-contract research](../2026-10-13-native-skill-routing/README.md#discovery-contracts-and-limits) owns that distinction. This report draws no new vendor-documentation conclusion.

## Exact next quality-design packet

This is proposed work, not an admitted model run or a request for another operator approval.

1. Freeze a new held-out corpus **before** any wording change: at least six independent intents spanning migration permission gates, retry/concurrency, conversion consent/mapping and overlapping/off-route requests. Rephrase and change fixtures so the observed b7 omission is not merely taught to the same test. Separate train and holdout; do not tune on this report's cells.
2. Predeclare two different experiments. Passive full/concise arms test expected native selection, false-positive loading and complete artifact quality under equal tool permissions. A separate directed full/concise/no-specialist-body diagnostic tests whether loaded doctrine changes outcomes; it cannot repair a passive miss. Randomize arm/session order and verify only intended description bytes differ in the passive comparison.
3. Freeze executable offline artifact tests and criterion-level review first. Include UNKNOWN **and DENIED** before any credential switch, both permissions allow controlled switch, rollback and secret-free source/principal diagnostics. For billing, verify actual credited balance as well as invoice ledger, concurrent deliveries at the relevant old/new decision points, pre-commit rollback, post-commit retry and cross-event invoice uniqueness. Preserve negative and ambiguous cases.
4. Capture complete visible artifacts and successful Skill-result timestamps, source/workspace hashes, final usage by cache mode, unique requests, output tokens, latency and list estimates. Grade artifacts without arm/cost/load metadata; then join the judgments to observed routing. Count trace errors separately from valid misses and retain every admitted/stopped invocation in cost accounting.
5. Set the experiment's call count, per-request input bound and remaining program reservation from the frozen packet. Require all critical safety criteria and no forbidden behavior on every accepted artifact, plus a predeclared statistical precision/non-inferiority plan before claiming “no quality loss.” A small all-pass pilot alone cannot establish that claim. If passive selection or any critical criterion fails, retain **NO_ADOPTION** and open the smallest source-owned correction packet; do not silently simplify the rubric.

Before any further call, the next agent's task is the **source-only held-out corpus/protocol and independent runner review** under the existing standing evaluation authority. No more calls are admitted by the completed R27/native protocols or by this report. Catalogue-search execution/retrieval quality needs its own fixture-driven checks; it is not covered by these native Skill calls.

## Verification and handoff

Report source is frozen in [raw/sources.json](raw/sources.json); usage was recomputed from those JSON receipts. The separate [graph peer receipt](../../evidence/completion-1013/graph-final-peer.json) verifies immutable hub code blobs and structural export counts, not skill quality. Parent owns graph-report integration and its still-uncommitted final raw snapshot. No broad suite, model call, native install or foreign configuration write was performed for this docs packet.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `project-reports` — dated results report — not a skill this family ships
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source and measurement verification
