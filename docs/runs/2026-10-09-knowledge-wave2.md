# Team evaluation and crawl evidence delivery

## Members and evidence

Agent-stack0.25.3 at `07d8fc8a6a0ac56ef389e96b093def101367e4f1` adds
`agent-evals/references/multi-agent.md` and its SKILL.md load trigger. Primary research
is scoped to its experimental settings; synthetic cases are proposed, not measured
before/after improvements. [Independent member review](https://github.com/ssheleg/agent-stack/blob/07d8fc8a6a0ac56ef389e96b093def101367e4f1/docs/evidence/knowledge-wave2/review.md)
and release workflow37867706442 passed; npm gitHead matches. All34 native Codex
skill files and41 registry files match [the source receipt](../evidence/knowledge-wave2/member-payload-readback.json).

SEO-aeo-audit0.26.3 at `ba2d319f2d01842e7087ff1ef76185b12067e45d` corrects
robots prefix/wildcard examples, locale headers, empty-read diagnostics and
unsupported causes/guarantees inferred from GSC labels or a patent. Linked reference
copies now preserve the same evidence boundaries, including canonical and retrieval
scope. [Independent member review](https://github.com/ssheleg/seo-aeo-audit/blob/ba2d319f2d01842e7087ff1ef76185b12067e45d/docs/evidence/knowledge-wave2/review.md)
accepted the final follow-up diff; PR25 checks passed at source6bdadc4. Full native
npm gate, strict Claude manifests and house audit0GAP/19PASS passed. Live GSC and
indexing/model outcome trials are NOT_RUN. Release workflow37870451406 completed successfully; npm serves0.26.3 with the exact
merged gitHead. All published package files match the pinned source in the payload receipt.

## Umbrella candidate

Version1.54.3 changes exactly those two published-member targets and associated
catalogue/README/changelog/handoff receipts. No launcher runtime behavior changes.
The parent claim is KNOWLEDGE-WAVE2 under agent-sync. Earlier90-suite/1106-fixture
checks covered the agent-stack-only candidate. Final two-member native checks also
passed90suites/1106fixtures; [independent two-member review](2026-10-09-knowledge-wave2-review-final.md)
found no content blocker. [Initial review](2026-10-09-knowledge-wave2-review.md)
retains its original scope instead of being silently promoted.

The [release-set receipt](../evidence/acceptance/ctx-04.06.json) is regenerated for
the final pins. It is a simulation, not an installed-host or running-session result.

## Delivery

Both members are published and verified. The complete published-pin check passes
for all11 members after SEO publication; its earlier pre-publication attempt correctly
reported the then-missing version and did not authorize a push. Parent CI/release, supported updater and
complete installed-byte readback are pending. Do not infer improved autonomous outcomes or
reload of an already-running session from installation.

Used: task-pipeline for delivery and independent review, agent-sync for repository
claims, make-skill for conformance and agent-evals for team-evaluation guidance.
