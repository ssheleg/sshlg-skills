---
report:
  id: sshlg-skills/2026-10-13-native-skill-routing
  title: "Native skill routing: observed non-use and the next evaluation contract"
  kind: research
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-11-13
  summary: >-
    Four completed audit artifacts contain no Skill calls despite an expected init inventory.
    The init inventory covers user-invocable skills, not all model-visible content or permissions.
    Root cause is unresolved; no body defect or quality-preserving compression is established.
    A new source-only packet separates passive routing, directed invocation and concrete outcomes.
  sources:
    - {name: "Primary-source ledger", path: raw/sources.json, read_at: 2026-10-13}
    - {name: "Native artifacts and observation manifest", path: ../../evidence/completion-1013/native-quality-v1/artifact-review-manifest.json, read_at: 2026-10-13}
    - {name: "Local provenance", path: raw/local-checks.json, read_at: 2026-10-13}
  produced_by: {agent: codex, task: FW08-NATIVE-ROUTING}
  supersedes: []
  consumers: [sshlg-skills]
---

<sub>ssheleg skills — agent-harness · agent-evals · project-reports · evidence-docs</sub>

# Native skill routing

## Decision

Keep installed descriptions unchanged. The completed native pilot cannot justify adoption of concise descriptions: all four audit artifacts used project reads but no Skill call; all four also missed a required migration precondition. This is a bounded observation on one English/Russian intent pair, not a general failure rate. The [immutable protocol and receipts](../../evidence/completion-1013/native-quality-v1/README.md) retain original stops and the separately authorized continuation. The corrected C artifact is offline diagnostic, not a retroactive PASS.

This snapshot adds a discovery interpretation correction and a [new evaluation packet](../../evidence/completion-1013/native-routing-v2/README.md). It does not replace [RPT sshlg-skills/2026-10-13-skill-discovery-efficiency §Decision input](../2026-10-13-skill-discovery-efficiency/README.md#decision-input), whose wider host/search recommendations remain separate. No model request, installed configuration change or new skill-body change occurred during this research.

## What is known

At source [6c9b06d](https://github.com/ssheleg/sshlg-skills/tree/6c9b06d0e7169aef53f0b9443620ff08e35457fa), both final readiness cells reported the expected seven user-invocable names. Across four task artifacts, observed tools were project discovery/reads, with zero Skill calls. Eight CLI invocations across attempts A–D reported a cumulative list-price estimate of USD0.4536322; that is not subscription billing. See the [artifact manifest](../../evidence/completion-1013/native-quality-v1/artifact-review-manifest.json) and [second review](../../evidence/completion-1013/native-quality-v1/artifact-second-review.json).

The independent artifact reviewer was root, separate from the runner author. The author's second review was explicitly nonblind. Missing pre-switch target-account access verification and ambiguous credential class-name diagnosis concern these artifacts. Because skill loading was not observed, they are not evidence of defects in the skill body. Source `8862fae` already includes the previously completed safe token-log correction.

## Discovery contracts and limits

Claude documents automatic and direct invocation separately. Default skills support both; `disable-model-invocation` prevents autonomous invocation. Invocation adds the body to context. A leading slash command dispatches directly; a name embedded later merely permits an invocation. Descriptions can be omitted to fit a listing budget, while names remain. Malformed frontmatter can also leave a callable command without usable description metadata. These are documented mechanisms, not diagnoses of our run. [Skills contract](https://code.claude.com/docs/en/skills).

The SDK's `init.skills` array lists user-invocable skills with description metadata. Model-only skills can be absent, and the list remains the same regardless of the SDK's invocation allowlist. Therefore the recorded exact-seven result is an observed user-invocable inventory, not complete model-context or permission attestation. This follows the documented stream contract; it does not assert that we used the SDK's configuration API. [SDK skills contract](https://code.claude.com/docs/en/agent-sdk/skills#confirm-skills-loaded).

The native CLI source is a compiled Mach-O executable on this machine, version 2.1.296; no auditable host implementation was inspected. The three selected source skills have ordinary descriptions and no invocation-restricting frontmatter. The previous run allowed Skill explicitly, but availability alone does not require a call. Managed context and the exact rendered description remain unmeasured. See [local provenance](raw/local-checks.json).

The CLI supports a native plugin evaluation command. Its documented default includes repeated with/without runs and may add judge calls; `tool_used: Skill` measures firing separately from outcome, and default reporting may publish. The local help confirms controls for runs, ablation, cost and no-publish. Merely discovering this command is not permission to execute it. [Plugin evaluation contract](https://code.claude.com/docs/en/plugin-evals).

## Competing explanations

| Hypothesis | Supporting observation | What remains unknown | Bounded discriminator |
|---|---|---|---|
| Model answered from project/context knowledge without choosing the skill | Useful reads and a plausible audit, zero Skill | Why the model chose that path | New natural tasks across distinct contracts; zero-call routing failures remain failures |
| Description was missing, shortened or not matched | Host documents listing budgets; init only exposes names | Actual rendered listing in these sessions | A separately reviewed, redacted context/debug probe if available without extra model calls; never infer text exposure from names |
| Invocation was unavailable or denied despite registration | Registration and permission are different signals | Whether an actual invocation succeeds | Separate directed tool-call control; inspect successful result, not a name in final prose |
| Fixture/effort/output limits encouraged shallow audit | One correlated intent and missing migration precondition | Causality or broader quality | New concrete data-dependent tasks, frozen budgets and complete visible artifacts |

No row is accepted as the root cause. Rephrasing old failed prompts until a skill fires would produce an exploratory success, not independent validation. An explicit instruction to call Skill can diagnose access and body use, but cannot validate passive selection.

## Next packet and decision boundary

The new packet proposes three distinct synthetic tasks: an identity migration with an unknown access cell, concurrent payment reconciliation, and dual-channel conversion deduplication. Expected outcomes are tied to supplied project facts and precise failure schedules. Two languages are represented, but three tasks cannot estimate language parity or broad non-regression. Private evaluator labels never enter model contexts.

Phase 1 is natural full/concise selection with unchanged bodies. Phase 2 is separately authorized, directed Skill invocation only if needed to diagnose phase 1; it is never pooled into the passive metric. Artifact reviewers grade all delivered visible text against frozen requirements, independently of whether a skill fired. No keyword-only score or final-result tail substitutes for this review.

The packet is **PROPOSED_NOT_RUN**. A runner still needs implementation, corruption controls, independent exact-SHA review, a new explicit call/cost budget, and an admission decision. The consumed prior eight-call grant does not authorize another request. Even all three pairs passing would justify a larger held-out experiment, not installed adoption or a claim of quality equivalence.

## Handoff

Owner: `FW08-NATIVE-ROUTING`, branch `docs/native-routing-research-1013`. Next: independently review the fixture facts, rubric and passive/directed distinction, then implement an offline-tested runner on a separate task. Preserve old native receipts. Source bodies remain sheleg-dev 0.13.4 at `8862fae`; no family pin or installed description changes accompany this report.

## Corrections

2026-10-13: clarified the historical readiness interpretation by appending to the native README; raw observations, hashes and original TEST_ERROR classifications remain unchanged.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `agent-harness` — discovery contract research.
- `agent-evals` — evaluation protocol and limits.
- `project-reports` — durable report; not a skill this family ships.
- `evidence-docs` — source and result boundaries.
