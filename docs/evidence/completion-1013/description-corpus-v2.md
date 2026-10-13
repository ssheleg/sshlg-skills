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

Current state: plan committed before corpus generation. Next: finish contract
coverage map, author cases, run bounded validation and submit the exact SHA.

Skills used: agent-evals (corpus/rubric separation), agent-harness (selection scope),
make-skill (skill contract boundaries), task-pipeline (delivery), agent-sync (task
lease), evidence-docs (commit-addressed source map).
