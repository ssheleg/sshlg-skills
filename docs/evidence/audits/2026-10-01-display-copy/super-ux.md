# DC-01: super-ux

Owner checkout: sibling super-ux, branch codex/display-copy-guard-2026-10-01,
base 18a4be53cd0f6b0e1a88b9457dda97c58b485a9a (0.56.2).
Read repository AGENTS/CLAUDE, HANDOFF, AGENT_SYNC and make-skill Retrofit.
Acquire a lease before guarded writes; release on all paths.

Fix brand_lint title checking for real HTML h1-h6 (nested inline tags, br-separated
fragments, entities) and Markdown formatted titles. Preserve abbreviations,
versions, URLs, questions, ellipses, ordinary sentence paragraphs; ignore scripts,
styles, hidden text and attributes as user copy. Investigate the HTML quoted-literal
false positives. Do not silently pass an empty declared source glob. Add failing
baseline fixtures first and meaningful negative controls. Keep default advisory
compatibility; add a selective --fail-on CODE CLI option if useful so B063 can be
made mandatory without treating every unrelated warning as a blocker.

Update copywriting SKILL critical gotcha and canonical references: rendered
headings are inspected; project policy may additionally cover hero fragments;
resolve the actual script path rather than claiming absent docs/brand/lint.py;
report coverage and warning status, not merely exit zero. Sync distributed closure
with test/sync_references.py. Do not claim deterministic tests prove model behavior.

Prepare patch release 0.56.3 after confirming no newer registry version. Update
required manifests, changelog, own docs/contracts/scenarios if CLI semantics change.
Run repository required checks, mechanical skill audit and packaged closure checks.
Record exact commands/results in a tracked task report. Commit and push task-owned
branch, return commit, diff review points and evidence. DO NOT merge/tag/publish;
coordinator handles independent review and release. No edits in other repositories.
