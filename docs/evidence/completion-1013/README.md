# Completion receipts — 2026-10-13

[Plan](../plans/2026-10-13-completion.md) · [research](../../reports/2026-10-13-skill-discovery-efficiency/README.md)

## Search ranking

The initial multi-concept audit query ranked make-skill 19th on the installed catalogue; an exact multiword phrase bonus raises it to first. This is lexical ranking, not semantic retrieval. Existing single-word behavior remains covered by `node test/toolkit_test.js` (29 checks).

The frozen bilingual synthetic corpus in `test/skill_search_recall_test.js` covers multi-skill queries, hidden skills, uncallable entries, negative queries and phrase boundaries. [Before/after receipt](search-recall.json) executes the same corpus against f1901a3 and the candidate. The test was observed failing before the edit. These checks do not establish model selection quality, runtime invocation, actual cost savings or universal non-regression.

## Filesystem discovery

`lib/catalogue.js` extends `toolkit --find` beyond Claude and the shared root to the roots already described by `apply.TARGETS` and `hostvis.hosts`, plus Cursor, Continue, Kimi, every registered Claude plugin installation (including disabled foreign plugins at custom paths) and Codex's native plugin cache. Documented environment roots are respected. Traversal follows directory aliases, stops cycles and stops at each SKILL.md; it is bounded to four directory levels and excludes assets, scripts, references and dependency trees. Missing roots are absent, other read failures and depth limits are printed as incomplete coverage. Remote-only skills with no local SKILL.md are outside this filesystem index.

Host-specific files and cached plugin versions are labelled as filesystem discoveries with native availability unverified. Cache presence does not establish activation, current version, tool permission or session refresh. CRLF, quoted and block scalar metadata are supported by a bounded parser, not a general YAML evaluator. Byte-identical id+digest entries take one ranking slot, with all alternate locations available through `--copies`; different bodies under the same name remain separate. Relative reference files may differ even when entry text matches.

Validation: `node test/catalogue_test.js` 15 checks; `node test/toolkit_test.js` 29; `node test/skill_search_recall_test.js` 12. The host-only Gemini fixture failed before the implementation with no search result. Failure injection covers unreadable SKILL.md, plus symlink cycles, same-name divergence, aliases, relocated roots, Codex system skills/cache and retained alternate paths. Independent review found two omissions: CRLF metadata in the pre-existing Claude reader and disabled foreign plugin registry paths. Both now have regressions; the same scalar parser serves both inventories, and `node test/conflicts_test.js` passes 20 checks. No native invocation success is inferred.

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

[Provider probe](provider-probe.json) records a one-turn Claude readiness request. It ended with error_max_budget_usd: the CLI's list-price estimate was $1.50376 despite a $0.10 argument, after 187709 cache-creation input tokens. The cap is checked after the first request and is not proof of a pre-request spending ceiling. This is list-price usage, not verified subscription billing. No routing/quality result was returned from this first probe.


## Controlled context and description screening

A second [readiness probe](controlled-probe.json), using normal subscription authentication with an explicit empty MCP/tool/skill context and a synthetic system prompt, returned the requested JSON. It reported 2237 input tokens including cache creation, 9 output tokens and USD0.018068 list-price usage. Four registered plugins and five agents still appeared in initialization metadata; registration does not prove execution. This isolated context is an experiment, not a replacement for the operator's normal safety hooks and workflow.

The [frozen description fixture](description-screening-fixture.json) contains full and concise candidate descriptions for 39 family skills and 13 synthetic selection cases. No installed description was changed. [Attempt 1](description-screening-full.json) and one explicit [diagnostic retry](description-screening-full-attempt2.json) both returned exit 1, `is_error: true`, zero usage and no selections. They are **TEST_ERROR**, with null task verdicts, not 0/13 quality. The first sanitizer omitted error text; the retry retained a hash and could only classify it as `provider_error_unclassified`. Its cause is unresolved. No concise arm was called because a usable paired baseline was absent.

[The replay script](run-description-screening.py) refuses existing receipts and automatic retries; its default is a no-call preview. Next evaluation task: obtain a diagnosable successful baseline, then the paired concise arm, preserving error evidence safely. Even a successful single batch would only screen synthetic explicit-catalogue selection; native triggering, task artifacts and repeated quality/cost acceptance remain open under B-144/B-147.


## Aggregate candidate gate

The combined implementation at `5427bbbd449cf6c26bc52e84f98bdb90707d5ec6`
passed `npm test`: **113 suites, 1695 fixtures, 11 pinned members**.
[Machine receipt](aggregate-final.json) and [complete compressed log](aggregate-final.log.gz)
preserve the exact count and output hash. [Independent merged-seam review](merged-seam-review.md)
checks the interaction of visibility, domains, search, profiles and credential guards.
C04's final source is `27c63c96bc9e47758c9b4957042c78962983df3d`;
C05 is `b50b7e9a2ba8df96626cf121682e94b10e6dce79`.
The earlier [integration review](integration-review.md) remains the historical finding
that led to these fixes. This local gate does not replace hosted release checks,
installed readback or native task-quality evidence.


## Explicit candidate CI

The repository's GitHub rules require a genuine `validate` result before merging
PR #216. A nightly job can only see the default branch, so nightly-only triggering
would strand an unmerged candidate. The operator update policy explicitly permits
manual hosted CI for an urgent or explicit candidate while forbidding per-push full
runs. This accumulated 1.62.0 candidate uses that exception: `workflow_dispatch`
requires a recorded reason, with nightly and release `workflow_call` retained.
No push/PR trigger is restored. A run's `headSha` must match the frozen candidate;
its result cannot certify a later squash commit or an installed release.

GitHub's [workflow_dispatch documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)
allows an existing, previously run workflow to be dispatched against a branch by
CLI/API. The workflow already exists on the default branch. Full execution and
conclusion are separate receipts, not inferred from successful dispatch.


### Correction: dispatch success does not satisfy PR protection

The explicit dispatch [38334548878](https://github.com/ssheleg/sshlg-skills/actions/runs/38334548878)
passed all three jobs on `d8211583930d9f763da79bf3027be0503d7ade4f`, but GitHub
refused merge and the PR's check rollup remained empty. Current [required-check
troubleshooting](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
explicitly excludes `workflow_dispatch` job checks from PR-required checks.
The successful run remains real test evidence, not merge admission.

The manual candidate path is therefore `pull_request: types: [ready_for_review]`:
freeze and locally validate the accumulated candidate, then deliberately move its
own draft PR to ready. The full genuine workflow runs on that one promotion.
`opened`, `reopened`, `synchronize` and `push` remain absent; ordinary pushes do not
run the full suite. No synthetic passing statuses or protection bypass are used.
A later candidate needs another deliberate promotion. Nightly default-branch runs
and release workflow_call remain available. [Supported event activity types](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).

## Follow-up observations after publication

v1.62.1 is published and its runtime bytes match the installed copy; see
[release/installation handoff](../../HANDOFF.md). The [native visibility cut](../../reports/2026-10-13-native-visibility-rollout/README.md) records host readback,
Pi text reduction and retained quality limits. The later [paired screening](description-screening-readout.md) obtained13/13 expected selections in both arms;
earlier provider errors remain preserved and unexplained. This supersedes only the
older statement that no concise arm had run, not its historical error evidence.

B-186 corrects the production immutable plain-skills contract; native-plugin channels
have separate source/version guarantees. A complete family acceptance is still open.
