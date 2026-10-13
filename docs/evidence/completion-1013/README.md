# Completion receipts — 2026-10-13

[Plan](../plans/2026-10-13-completion.md) · [research](../../reports/2026-10-13-skill-discovery-efficiency/README.md)

## Search ranking

The initial multi-concept audit query ranked make-skill 19th on the installed catalogue; an exact multiword phrase bonus raises it to first. This is lexical ranking, not semantic retrieval. Existing single-word behavior remains covered by `node test/toolkit_test.js` (29 checks).

The frozen bilingual synthetic corpus in `test/skill_search_recall_test.js` covers multi-skill queries, hidden skills, uncallable entries, negative queries and phrase boundaries. [Before/after receipt](search-recall.json) executes the same corpus against f1901a3 and the candidate. The test was observed failing before the edit. These checks do not establish model selection quality, runtime invocation, actual cost savings or universal non-regression.

## Filesystem discovery

`lib/catalogue.js` extends `toolkit --find` beyond Claude and the shared root to the roots already described by `apply.TARGETS` and `hostvis.hosts`, plus Cursor, Continue, Kimi and Codex's native plugin cache. Documented environment roots are respected. Traversal follows directory aliases, stops cycles and stops at each SKILL.md; it is bounded to four directory levels and excludes assets, scripts, references and dependency trees. Missing roots are absent, other read failures and depth limits are printed as incomplete coverage. Remote-only skills with no local SKILL.md are outside this filesystem index.

Host-specific files and cached plugin versions are labelled as filesystem discoveries with native availability unverified. Cache presence does not establish activation, current version, tool permission or session refresh. CRLF, quoted and block scalar metadata are supported by a bounded parser, not a general YAML evaluator. Byte-identical id+digest entries take one ranking slot, with all alternate locations available through `--copies`; different bodies under the same name remain separate. Relative reference files may differ even when entry text matches.

Validation: `node test/catalogue_test.js` 12 checks; `node test/toolkit_test.js` 29; `node test/skill_search_recall_test.js` 12. The host-only Gemini fixture failed before the implementation with no search result. Failure injection covers unreadable SKILL.md, plus symlink cycles, same-name divergence, aliases, relocated roots, Codex system skills/cache and retained alternate paths. No native invocation success is inferred.

## Integration

PR #215 integrated at 022356d3479d351ccdf39135a44914be6de73ad7 after its exact head 8b57e9c66026fe5a3aad70a42562391af9c48953 showed six successful hosted checks and local `node test/ratchets_from_test.js` passed seven checks. No hosted suite was manually dispatched.

## Pending cross-project asks

Fabric admission returned `no-project`; none of these were submitted in this session. Retry only through the authenticated Project board after admission. Existing issues are evidence, not substitute sends.

| Idempotency key | Owner | Evidence and exact next task | Status |
|---|---|---|---|
| sshlg-skills:B184:task-pipeline-gaps:v1 | task-pipeline | Reconcile TP-1–TP-11 from [L3 spec](../specs/2026-10-13-pipeline-principles-gaps.md) against PR #112 a8ad0d935 before implementation. | pending-submission |
| sshlg-skills:B184:fabric-workspace-gaps:v1 | fabric-workspace | Verify FW-1–FW-3 in the same spec against current contracts; board unavailable fallback must preserve pending asks locally. | pending-submission |
| sshlg-skills:L2:observatory-PB159:v1 | project-observatory | Read PB-159 status and agree read-only profile consumption contract before hub edits any MCP configuration. | pending-submission |

The previous agent-sync filing is merged #34 at 2f149b1. A filed row is not implemented doctrine. The whole family goal remains open while these requirements lack evidence.

## Review corrections

An independent reader found that the existing validate workflow still ran on every push and PR. The completion branch replaces these triggers with 23:00 Europe/Warsaw scheduling; release workflow_call remains. This follows the current operator CI instruction. GitHub documents timezone-aware schedules in its [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule), fetched 2026-10-13. A schedule is not a completed CI receipt; no nightly run is claimed here.

The retrieval metric is named mean relevant-item reciprocal rank (all expected items), not query-level MRR. The research source implementation is f1901a3 while its first command receipt correctly records the docs-only descendant 2367231.

## Bounded native-host probe

[Provider probe](provider-probe.json) records a one-turn Claude readiness request. It ended with error_max_budget_usd: the CLI's list-price estimate was $1.50376 despite a $0.10 argument, after 187709 cache-creation input tokens. The cap is checked after the first request and is not proof of a pre-request spending ceiling. This is list-price usage, not verified subscription billing. No routing/quality result was returned and no further provider batch was started. Model evaluation remains NOT_RUN.
