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

## Umbrella verification

Version1.54.3 changes exactly those two published-member targets and associated
catalogue/README/changelog/handoff receipts. No launcher runtime behavior changes.
The parent claim is KNOWLEDGE-WAVE2 under agent-sync. Earlier90-suite/1106-fixture
checks covered the agent-stack-only candidate. Final two-member native checks also
passed90suites/1106fixtures; [independent two-member review](2026-10-09-knowledge-wave2-review-final.md)
found no content blocker. [Initial review](2026-10-09-knowledge-wave2-review.md)
retains its original scope instead of being silently promoted.

The [release-set receipt](../evidence/acceptance/ctx-04.06.json) is regenerated for
the final pins. It is a simulation, not an installed-host or running-session result.

## Delivered and read back

PR172 merged at `3d888f3933024c7fe5635d9438e0dc08ac5709e2`; annotated tag1.54.3
peels to that exact commit. [Release/registry receipt](../evidence/knowledge-wave2/release-readback.json):
workflow37871403596 attempt2SUCCESS,58 published files match source. Attempt1 passed
full validation but rejected the mistakenly lightweight tag before publication.
The repository tag helper added annotation without changing the target commit;
only failed release jobs were rerun. The redundant automatic run was cancelled.
No branch history or payload changed. Pages workflow37871368177SUCCESS and
[live HTTP checks](../evidence/knowledge-wave2/site-readback.json) show all three versions.

Supported `npx --yes sshlg-skills@1.54.3 update --all` finished with exit0 and71 runner
steps. **That wrapper result is not all-host success:** the upstream CLI reported76
unsupported skill/host pairs for Eve and PromptScript, for which that CLI does not support global
installation. No project-specific installation for those clients is claimed.
[Installed receipt](../evidence/knowledge-wave2/installed-readback.json) preserves this limit.

Actual acceptance: all38 family skill payloads in skills-CLI and Claude plugin channels
match their pinned source,1068file comparisons with0mismatches; all54 managed hook-runtime
files match1.54.3; all34 native Codex agent-stack files match0.25.3, installed/enabled.
[Full family receipt](../evidence/knowledge-wave2/family-payload-readback.json) and
[runtime receipt](../evidence/knowledge-wave2/runtime-readback.json). All four operator
instruction files preserve their text outside managed router blocks.
Reproduce the local skill comparison with
`python3 docs/evidence/knowledge-wave2/verify-installed.py` after initializing the
pinned submodules; the captured operator hashes are specific to this dated update.
The script changes only its receipt file, not installed skills or operator settings.

Delivery is complete for these verified channels. No running conversation was reloaded;
no model, indexing or business uplift is inferred from installation. Next task: use
the updated references in a fresh task/context, retain their source and experiment limits.

Used: task-pipeline for delivery and independent review, agent-sync for repository
claims, make-skill for conformance and agent-evals for team-evaluation guidance.
