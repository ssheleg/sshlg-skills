# FW08: independent bilingual description-selection corpus v2

Objective: compare the existing full and concise 39-skill catalogues with a
broader, body-contract-grounded corpus. The coordinator authorized this bounded
artifact on 2026-10-13. No provider calls, description edits, installed changes,
or native-trigger/task-quality conclusions belong to this task.

## Plan and requirements

1. Preserve both arms of `description-screening-fixture.json` verbatim. Read the
   actual owner SKILL bodies at the gitlink commits of its `source_commit`, rather
   than derive labels from the compressed first sentence. Record canonical plugin
   paths, owner SHAs, body anchors and file hashes for all 39 distinct skills.
2. Author an English and Russian primary case for every skill, plus neighboring,
   composition, out-of-catalogue and legitimate-ambiguity cases. Translations share
   an intent group and are not independent observations.
3. Score explicit accepted selection sets; distinguish choosing a specialist from
   executing a mandatory orchestration route. Allow named alternatives only where
   the prompt leaves a real decision unresolved. Do not turn a router into a skill.
4. Validate JSON, catalogue/source coverage, bilingual pairs, labels, unique IDs,
   accepted-set structure and recorded anchors offline. Include a small scorer
   whose negative controls distinguish missed skills from gratuitous selections.
5. Commit/push this isolated branch; hand off the frozen corpus and rationale for
   independent label review before any provider comparison. No broad hub suite.

## Frozen artifacts and scoring rationale

- [Fixture v2](description-screening-fixture-v2.json): **116** cases, with **78**
  primary cases (one English/Russian pair per skill), **12** neighboring contrasts,
  **10** compositions, **6** legitimate ambiguities and **10** negative controls.
- [Body source map](description-screening-sources-v2.json): all **39** canonical
  plugin SKILL files, owner commits, full-blob SHA-256 and resolving body anchors.
  The catalogue arms remain byte-for-byte equal as parsed JSON to the original
  fixture. Their source is hub `ab37778793674efff60b92ed381284c7339420ea`, not moving
  owner main. The duplicate Cursor sheleg-design mirror is not a 40th skill.
- [Offline checker/scorer](description-corpus-v2-check.py): `validate`, `score`,
  source-blob replay and five corrupted-fixture plants. It has no provider client.

Labels were authored from the owner bodies and file responsibilities, including
Google identity versus delegated API access; bot-token versus personal-account
versus Mini App launch data; source/prompt versus execution/eval versus transport;
vision/foundation/flows/scenarios/audit; and native/Spatial/WebXR versus stage,
tooling, performance and store readiness. The source map's anchors are review
entry points, not a claim that one excerpt captures the entire skill contract.
No vendor/API version claim inside a historical body is independently revalidated
by this selection corpus.

The judged object is an unordered **selection set of directly relevant
specialists**, not the entire delivery plan. The rubric deliberately excludes
unrequested generic wrappers: selecting task-pipeline, skill-search or
evidence-docs for every case would otherwise hide an over-selection regression.
Those skills each have their own explicit primary cases. A router label such as
`super-ux` or `agent-stack` is not one of the 39 skill IDs and is invalid output.
This decision must appear verbatim in the comparison system prompt.

Composition cases require all requested specialists. Ambiguous cases list each
permitted set rather than turn a defensible leading owner into a failure. For
example, long-task context loss permits harness, orchestrator, or both because
instruction assembly and runtime trimming are different possible causes. A
negative means no skill **in this catalogue** directly performs the task; it does
not assert that no useful foreign skill exists or waive the host's actual policy.

## Checks actually run

`python3 docs/evidence/completion-1013/description-corpus-v2-check.py --verify-git /Users/sshlg/DATA`
exited **0**: 116 cases, 39 sources, all five corpus-corruption plants rejected,
scorer positive/negative/alternative/composition controls passed, and every
recorded body hash and line excerpt matched its committed owner blob.
`git diff --check` exited 0. No broad suite, paid/provider call, native skill
trigger, installed description edit or downstream task-quality test ran.

## Handoff: exact next task

Independently review the label sets and especially the six ambiguity cases before
running a comparison. Send the model only the selection contract, one catalogue
arm and prompt/ID, never `accepted_sets`, rationale or source labels. Keep each
case in an isolated context; randomize arm order and catalogue order with a
recorded seed. Preserve the returned IDs, raw response, model/version, prompt
hash, latency, usage and transport/parse error separately from FAIL.

Report paired full-versus-concise differences by language, kind, skill and intent
group. Translation pairs and the ten composite tasks are correlated, not 116
independent trials. The old 13-case batch is prior screening, not an independent
holdout for the same descriptions. This new corpus is likewise diagnostic;
if it informs further tuning, reserve new unseen tasks for the final comparison.
The current concise arm must not be adopted from a selection score alone:
separate native discovery/read/load observations and downstream artifact-quality
acceptance remain with the coordinator. Token cost is measured from provider
usage, never inferred from a shorter description or this corpus count.

Skills used: agent-evals (corpus/rubric separation), agent-harness (selection scope),
make-skill (skill contract boundaries), task-pipeline (delivery), agent-sync (task
lease), evidence-docs (commit-addressed source map).
