# Native routing v2: proposed diagnostic packet

Status: **RUNNER_PROPOSED_NOT_ADMITTED**. A dry-run-first runner and offline controls are now delivered; no provider execution belongs to this packet yet. Research entry: [native routing report](../../../reports/2026-10-13-native-skill-routing/README.md).

## Frozen task inputs

[cases.json](cases.json) holds three evaluator-only records. Each model receives only its `prompt` and the contents of the corresponding fixture directory, copied to a neutral fresh project root. IDs b7/k2/m9, expected skills, rubric, source hashes, arm labels and this README must remain outside that root and outside model payloads. Filenames describe normal project material, not answer labels. Fixtures are intentionally defective synthetic audit inputs; never execute them against a provider or install dependencies.

| Case | Intent and language | Contract basis | Outcome that a generic answer can miss |
|---|---|---|---|
| b7 | Server identity migration, EN | google-auth: ADC and resolved source/principal | Destination write access is unknown, so removal cannot precede its verification; naming a new identity is insufficient |
| k2 | Billing retry/concurrency review, RU | stripe-billing: claim before work, grant/completion transaction, renewal dedup | A second event ID for the same invoice defeats event-ID-only uniqueness; crash/retry must not grant twice |
| m9 | Conversion mapping review, EN | ad-tracking: stable event pair, authoritative paid state, consent | Matching IDs alone leaves mismatched event names; canceled return and denied browser consent are distinct cases |

All cases require file:line grounding, a concrete offline check plan and truthful runtime limits. [source.json](source.json) hashes all six fixture files and three contract bodies at sheleg-dev `8862fae9a826263f8109626ca257f81c7c43ac86` (0.13.4). They are the same body cut used in native v1. The prior packet's full 62-file plugin manifest remains the materialization authority if reused. Re-verify remote current source before execution and freeze any intentional new source cut in a separately reviewed amendment.

The cases were authored after the v1 findings; they are exploratory, not a hidden holdout. Their main outcomes derive from supplied project facts plus read source contracts, not from the first sentence of each skill description. The family policy may compose other skills in normal operation, but this bounded test exposes only the seven sheleg-dev skills; it cannot certify cross-family routing.

## Measurements

Record four independent fields per cell:

1. `registration`: observed user-invocable init inventory. Exact seven is an anomaly guard, not proof of complete model context or permissions.
2. `native_selection`: the expected namespaced Skill tool call and a successful result. A request denied by permissions or a tool error is not a successful load. A plain file Read, prose mention, slash-like text or init listing is not a Skill invocation.
3. `artifact_quality`: all required case outcomes pass, all forbidden claims absent, checked by a reviewer against all ordered visible assistant text. Keep final.result separately; it may be only the tail. A correct artifact without Skill can pass quality while failing native selection.
4. `cost_and_validity`: unique API-message usage, cached/uncached inputs, output, wall time, reported list estimate, tool errors and limits. Transport/schema/trace errors are TEST_ERROR, never a behavior PASS.

Passive zero-Skill cells are **FAIL_NATIVE_SELECTION**, even with a good artifact. Wrong or additional skills are recorded, not hidden; any claim that an additional skill is acceptable requires a pre-execution rubric amendment. No exact full tool sequence is required. A successful expected Skill call before the delivered audit is the only mandatory loading relation. Read-only tool confinement and absence of external effects are required throughout.

## Proposed sequential phases, not an execution grant

**P0 offline admission.** Reuse v1 materializer/parser invariants only after checking actual source hashes. Fake processes must cover missing and denied Skill results, call-without-result, unexpected inventory, partial output, split final answer, repeated message-ID chunks, invalid usage, unexpected auth, budget exhaustion and reads outside the owned project/plugin roots. Pin CLI version/model/effort/settings/tool order. Do not use `--bare` under the subscription contract. Readiness must not request Skill or project reads.

**P1 passive selection.** Propose two fresh readiness cells and six fresh task cells (three tasks × full/concise), randomized with a recorded seed, paired within task. Only the description fields differ; all plugin and fixture bodies remain byte-identical. Keep the same language per task in both arms. No instruction to use skills, no route hint and no explicit catalogue in task prompts. Sequential execution, no retry. Stop on trace/auth/context errors; record a behavioral zero-call result and continue only within the frozen P1 plan, never auto-create a directed follow-up.

**P2 access diagnostic, separate authorization.** If passive loading is absent, propose at most one fresh directed cell per missed contract, using the full arm and the same task: explicitly request the named Skill tool invocation first. This tests whether invocation works and supplies body evidence under direction; it does not test automatic selection or full/concise quality. A leading slash command is a different dispatch path and may inject content without a Skill tool event, so do not mix it with this tool-call diagnostic or apply the passive grader to it. Successful load provenance must be established before claiming body influence.

P1's proposed maximum is eight CLI invocations; P2 is a later plan, not an automatic reserve. Old A–D used eight already. A reviewer must assign a new bounded list-price budget, per-call reserve and program-level cumulative ledger before either phase; this packet assigns **zero additional authorized calls**. Keep admission/post-request overshoot limits explicit. No judge-model calls: independent human/agent source review uses retained artifacts, not another paid evaluator.

## Interpretation and next owner task

Both arms passing three tasks is insufficient for adoption. Report paired cell outcomes and uncertainty without treating languages, arms or repetitions as independent intents. Zero Skill in both arms leaves compression's effect on skill-body-guided quality unmeasured. Directed success with passive failure narrows the access hypothesis, but does not prove a description-only defect. A no-plugin baseline would be needed to estimate the body's incremental contribution; that is a future separately budgeted design.

The current native `claude plugin eval` command is an alternative runner to assess offline: its default repetitions/baseline/judges and potential report publication do not match this packet's bounds automatically. Do not run `eval init` as reconnaissance: it makes model calls. Any use must explicitly set no-publish, exact runs/arms/tools and reviewed limits, and prove isolation rather than assume it from a feature name.

Next task: independent packet review → implement a dry-run-first runner → freeze hashes and cost/call plan → independent offline runner review → explicit admission. Keep installed descriptions unchanged and all v1 stops immutable. No current board row is closed as native quality acceptance by this preparation.


## P1 runner amendment, 2026-10-13

`run.py` now implements P1 only; `check.py` passes99 offline controls, including
real fake-CLI execution, exact materialization of both arms, preserved body bytes,
missing/denied Skill results, source binding and corruption, output caps,
timeout/unknown-cost stops and passive-zero-load classification. Shared v1 observer
and materializer remain unchanged and are hash-bound in `protocol.json` alongside
all four immutable v1 stops/results. Only new owned synthetic workspaces are written.
Fixture IDs and rubric never enter prompts or workspaces; no directed follow-up exists.

The proposed eight new calls use the remaining USD3.5463678 of the original native
quality USD4 list-estimate envelope. V1 A–D recorded eight CLI calls/USD0.4536322;
P1 would bring the maximum to16 CLI calls. R27's separate USD4 envelope and older
selection pilots are independent costs, not erased or counted as this allowance.
Per-call reserve is USD0.50; a late reported overshoot stops and stays recorded.
This is a subscription diagnostic, not an invoice or a claim about internal retries.

Readiness allows one distinct model request, tasks six; observed reported-turn
ceiling11 for task tool interleaving is separate from the six-request guard.
This ceiling is a conservative reviewed protocol limit, not a documented formula.
Readiness input ceiling24000, task32000 per request; output ceiling1600 per
request and six times that in a task aggregate. Timeout180seconds, model
claude-opus-5-5/low, CLI2.1.296, restricted first-party subscription only, exact
seven-skill/four-read-only-tool inventory. Requests, outputs, successful loads,
workspace integrity and ordered visible artifacts are independently inspected.
A fresh independent source/offline review plus exact runner/source admission is
required before calls. Actual catalogue search and whole-family quality remain open.
