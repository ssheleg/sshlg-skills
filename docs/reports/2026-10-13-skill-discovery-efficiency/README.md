---
report:
  id: sshlg-skills/2026-10-13-skill-discovery-efficiency
  title: "Skill discovery and token efficiency: contracts, gaps and evaluation strategy"
  kind: research
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-11-13
  summary: >-
    Current official contracts support progressive loading and host-specific visibility controls.
    The existing concept search demonstrably misses make-skill in a relevant top-12 query.
    Disabled, explicit-only, file-readable and observed runtime states must remain distinct.
    Proposed optimization requires paired quality and total-cost evidence; savings are not yet measured.
  sources:
    - name: "Primary-source claim ledger"
      path: raw/sources.json
      read_at: 2026-10-13
    - name: "Read-only local command receipts"
      path: raw/local-checks.json
      read_at: 2026-10-13
    - name: "Claude Code skill contract"
      url: "https://code.claude.com/docs/en/skills"
      read_at: 2026-10-13
    - name: "Codex skill contract"
      url: "https://learn.chatgpt.com/docs/build-skills"
      read_at: 2026-10-13
  produced_by:
    agent: "codex"
    task: "hub-completion/fresh-research"
  supersedes: []
  consumers: [sshlg-skills]
---

<sub>ssheleg skills — make-skill · openai-docs · project-reports · evidence-docs</sub>

# Skill discovery and token efficiency

## Decision input

Keep a compact, evidence-selected entry catalog and reliable access to the complete installed catalog. Improve retrieval before hiding more skills. Treat reduced metadata as a candidate optimization, not proof of lower cost or unchanged quality. The reproduced search miss below makes retrieval a release criterion.

This is a research snapshot and proposed strategy, not runtime acceptance. No provider evaluation, configuration mutation or paid model call was performed by this research task. Native activation, actual billing savings and quality non-regression remain **NOT_RUN**.

## Method and provenance

Official pages were searched and opened on **2026-10-13**. The [source ledger](raw/sources.json) preserves URLs, read dates and claim scope without copying full pages. [Local receipts](raw/local-checks.json) preserve commands, exit codes and outputs with the local username path sanitized.

Implementation references are pinned to [f1901a3](https://github.com/ssheleg/sshlg-skills/tree/f1901a3335ffd894957854eeaabb5c8222c97812). This worktree was at that commit when receipts were collected. The original session checkout differs from origin/main in its CLI, so the reproduction uses this worktree's `node bin/sshlg-skills.js`, not an unqualified `npx` resolution.

The preceding [RPT sshlg-skills/2026-10-12-coding-agent-compatibility §Слои](../2026-10-12-coding-agent-compatibility/README.md#слои-как-в-срезе-10-09) also separates file discovery from model behavior. Its host installation counts are historical evidence, not refreshed by this report. This report adds research and a search reproduction rather than superseding that installation audit.

## Verified upstream contracts

### Claude Code

`skillOverrides` supports full listing, name-only, user-invocable-only and off. It does **not** apply to plugin skills. Listing budget defaults to 1% of context; overflow drops descriptions starting with least-used skills. The documented controls include `skillListingBudgetFraction`, `SLASH_COMMAND_TOOL_CHAR_BUDGET` and `skillListingMaxDescChars`; `/skill-doctor` exposes usage and context cost. Compaction carries skill content forward within bounded budgets, so front-loaded requirements matter. These are documented host behaviors, not proof that this session received a particular listing. [Official skills documentation](https://code.claude.com/docs/en/skills).

MCP tools are now deferred by default. A 10% threshold describes `ENABLE_TOOL_SEARCH=auto`, not the default. A non-first-party `ANTHROPIC_BASE_URL` may switch to upfront loading because a proxy can reject `tool_reference`; server `alwaysLoad` settings also affect behavior. A gateway compatibility check is therefore necessary before prescribing a search setting. MCP tool search and skill retrieval are separate mechanisms. [Official MCP documentation](https://code.claude.com/docs/en/mcp).

Subagents keep verbose intermediate work out of the parent context but consume additional usage. Compaction also consumes a model request. Specific task boundaries and verification targets reduce unnecessary exploration. Delegation should be evaluated across parent and children, not only the parent's shorter transcript. [Official cost guidance](https://code.claude.com/docs/en/costs).

### Codex

Codex first loads skill metadata and paths. The initial list is budgeted at 2% of context, or 8,000 characters when context size is unknown; descriptions can shorten and skills can be omitted. `enabled=false` disables a local skill without deleting it. `agents/openai.yaml` with `allow_implicit_invocation:false` preserves explicit `$skill` invocation while preventing implicit activation. That distinction does not prove identical startup savings across hosts: measure the actual listing. [Official skill documentation](https://learn.chatgpt.com/docs/build-skills).

`skills.max_context_tokens` is a documented positive-integer catalog budget, capped at 10,000 for explicit values. `tool_output_token_limit` limits individual tool outputs stored in history. Raising a catalog budget preserves capacity at a context cost; lowering an output limit may discard evidence. Neither setting alone proves improved task efficiency. [Official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

### Authoring and cost

The portable standard recommends progressive disclosure, a body below 5,000 tokens and 500 lines, focused resources, and references reachable directly from the entrypoint. These recommendations are not universal host rejection thresholds. [Agent Skills specification](https://agentskills.io/specification). Keep non-obvious guidance, match strictness to fragility, and test on the intended models. [Anthropic authoring guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

Prompt caching reuses matching rendered prefixes. Instructions, tool definitions/order and rewritten history can change reuse; compaction can break a prefix. Track cached reads, writes, uncached input and actual billed cost. Caching itself does not change output generation. Stable boilerplate is a candidate for reuse, but API cache controls must not be presented as Codex configuration controls without host evidence. [OpenAI caching documentation](https://developers.openai.com/api/docs/guides/prompt-caching).

Fresh-context comparisons against no skill or the previous version should retain artifacts, assertions, tokens and timing. Routing success and artifact correctness need separate scores. [Agent Skills evaluation guidance](https://agentskills.io/skill-creation/evaluating-skills).

## Existing implementation and observed gap

| Area | Evidence at the pinned revision | Finding |
|---|---|---|
| Core selection | [lib/visibility.js:45](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/lib/visibility.js#L45) | All family skills are core; recent usage is checked only for supplied personal IDs. |
| Usage provenance | [bin/sshlg-skills.js:1827](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/bin/sshlg-skills.js#L1827) | Reads Claude usage and Claude instructions, then reuses that core for Codex. Missing Codex usage cannot establish non-use. |
| Codex visibility mutation | [bin/sshlg-skills.js:1856](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/bin/sshlg-skills.js#L1856) | Plans disabled shared-root paths, not native explicit-only policy. File readability remains a different capability. |
| Concept ranking | [lib/toolkit.js:405](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/lib/toolkit.js#L405) | Lexical name/description matching, with name weight 3 and description weight 1. Agent-generated concepts provide the semantic step. |
| Presentation | [lib/toolkit.js:438](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/lib/toolkit.js#L438) | Listed, name-only and hidden/read-file labels do not expose all host invocation states. |
| Shared inventory | [lib/toolkit.js:468](https://github.com/ssheleg/sshlg-skills/blob/f1901a3335ffd894957854eeaabb5c8222c97812/lib/toolkit.js#L468) | Real-path and ID deduplication plus limited frontmatter parsing require fixtures for divergent duplicates and valid YAML variants. |

The following relevant query was reproduced with exit 0:

```sh
node bin/sshlg-skills.js toolkit --find 'skill discovery, поиск скиллов, token budget, экономия токенов, waves, skill audit'
```

It ranked `discover-brand` and `project-audit` at score 2, showed `skill-search` at score 1, and omitted `make-skill` from the first 12 while reporting more matches. The complete default and `--limit 40` outputs are in [local-checks.json](raw/local-checks.json). This is a reproduced shortlist failure for this task, not an inferred global error rate.

Code explains a plausible failure mechanism: multi-word concepts require every word somewhere in the name/description but not adjacency; concept matches accumulate, then shorter descriptions win ties. Generic words appearing in unrelated clauses can produce false positives. That is an implementation-grounded hypothesis; a corpus must establish which ranking change improves recall without harming precision.

## Proposed development strategy

The following packets are recommendations for the owning plan. They do not authorize changes to global settings or another project's repository.

| Priority / packet | Deliverable and bounded ownership | Acceptance and dependencies |
|---|---|---|
| P0 / discovery corpus | Sanitized bilingual prompts, expected applicable skills, near misses, explicit names, multi-skill tasks and hidden long-tail cases; freeze inputs and catalog snapshot before tuning. | Include the reproduced miss. Distinguish intended skill set from incidental keyword overlap; hold out validation queries. |
| P0 / host state contract | Inventory fields for installed, catalog-visible, native-explicit, native-implicit, file-readable, source, host version and observation date. | Unknown remains unknown; plugin/personal and disabled/explicit-only fixtures; no mutation needed for this report layer. |
| P1 / retrieval repair | Ranker and reader changes only after corpus baseline. Test phrase locality, exact names, bilingual variants, ties and provenance rather than immediately adding embeddings. | Recall@5/12, MRR, negative-match and no-match rates; important expected skills must remain reachable. Deterministic red/green regression for the reproduced miss. |
| P1 / usage-aware core | Per-host usage provenance, operator pins, and explicit unknown coverage. | Never classify missing usage as zero; preview before mutation; preserve ownership-aware revert and foreign configuration. Depends on host state contract. |
| P1 / description optimization | Scope-first concise descriptions; optional separately indexed vocabulary only if corpus proves need. | Description changes must pass retrieval and native trigger comparisons. Preserve required decisions, acceptance, fallback and dependencies. |
| P2 / runtime evaluation | Fresh-session baseline/current/candidate arms on representative Claude Code and Codex tasks. | Prove artifact quality and bounded total cost, not just invocation. Spend/access must follow the recorded authority. |
| P2 / rollout and review | Bounded candidate installation, version readback, host activation checks, independent verification and reversible rollback. | No family-wide rollout before candidate gates; correct all failing packets and rerun affected arms. |

Shortening a description also changes the current CLI search corpus. A smaller native listing can therefore cause more searches, wrong selections, rereads and retries. Optimize the whole completed-task trajectory. Keep rich, rarely used references on demand and replace repeated deterministic reasoning with maintained scripts where appropriate; do not remove requirements merely to meet an arbitrary byte target.

## Evaluation gates

1. **Freeze the comparison.** Record source SHA, installed versions, exact catalog, prompts, fixtures, host/model settings and allowed capabilities. Compare the current version to each candidate separately. Use fresh contexts and a fixed holdout set.
2. **Separate the layers.** Score catalog reachability, shortlist retrieval, native triggering, instruction following and final artifacts independently. A deterministic parser test does not prove model behavior.
3. **Protect quality.** Critical acceptance and safety-boundary cases must all pass. Predeclare acceptable statistical variation for broader tasks and report failures, repeats and sample size. Passing a finite suite is evidence for that suite, never a universal no-loss guarantee.
4. **Measure total economics.** Record uncached input, cached reads/writes, output/reasoning when exposed, all children, retries, wall time, tool-output volume and actual provider cost/usage receipts. Distinguish token estimates, provider counters and billed amounts. Missing metrics stay null with a reason.
5. **Preserve evidence when reducing output.** Keep full logs/artifacts addressable, return concise summaries with failures and truncation markers, and verify required evidence survives. Avoid rereading an entire catalog or full logs after each task step.
6. **Review independently.** A verifier receives original objective, frozen corpus, candidate diff and raw outcomes. It must test the acceptance claims rather than accept the implementing agent's summary. Failures become prioritized correction packets; rerun affected cases after fixes.

Candidate arms: current installed behavior; concise descriptions only; core plus complete-catalog search; then any retrieval improvement. Do not combine all interventions into the first comparison because that prevents attribution. Native explicit-only policy is a separate host-specific arm, not an automatic replacement for disabled-file fallback.

## Checks and remaining work

[Command receipts](raw/local-checks.json) record Claude Code 2.1.296, Codex CLI 0.162.1, `toolkit_test.js` passing 29 checks and `visibility_test.js` passing 21 checks. These verify existing fixtures only. The documented search miss still reproduces despite those passing checks.

`claude plugin eval --help` exposes ablation, JSON output, cost ceiling and local-only report options. **Executing that runner remains NOT_RUN**: help availability does not prove account access or a successful provider run. The older make-skill early-access note must be reassessed through a bounded actual run before being treated as current availability evidence.

Not measured: exact host-loaded prompt tokens, native activation after candidate hiding, model output quality, cache effectiveness, total cost savings, or gateway compatibility with deferred tool references. No claim of token savings or unchanged quality is made.

Next task: freeze the corpus with this reproduced miss and establish the host-state schema, then implement and test retrieval/visibility changes under the parent wave plan. Commit, push, remote verification and generated report indexing are owned by the parent integrator; this subtask writes only this report directory.

## Corrections

None at this initial snapshot. Append dated corrections rather than silently rewriting observed results.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — skill authoring and discovery contracts
- `openai-docs` — official OpenAI documentation research — not a skill this family ships
- `project-reports` — durable research report — not a skill this family ships
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — claim provenance and verification boundaries
