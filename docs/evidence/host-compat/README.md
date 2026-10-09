# Host compatibility — execution packet 2026-10-09

Status: IN_PROGRESS. Owner: sshlg-skills. Base: ffa4a72e8d4b56477a00f50902f0ce9786ca0af2.

## Objective and authority

Adapt the family to current Claude Code, Codex, Kimi, Hermes and other coding-agent
hosts. Existing operator authority covers bounded implementation, tests, normal
reviewed delivery and installed family updates. Preserve unrelated work, source
exports, credentials and existing model/permission settings. Inherit this session's
model/effort; no new provider, auth reset or production task execution.

## Requirements and acceptance

| ID | Requirement | Evidence |
|---|---|---|
| HC-1 | Ground each claimed host capability in dated primary docs/source, including the four named hosts | Source ledger and capability matrix with paths, format, commands/hooks/subagents and limits |
| HC-2 | Audit every pinned family skill for portable payload closure and host dependencies | Mechanical census plus semantic fallback review; all advertised skills accounted for |
| HC-3 | Fix confirmed installation, discovery and host-selection defects without treating unsupported targets as success | Regression tests observed failing then passing; supported/unsupported scope explicit |
| HC-4 | Repair confirmed authoring guidance gaps in their owning member rather than copying doctrine | Owner diffs, checks and parent pin receipts if a member changes |
| HC-5 | Verify supported local clients at the strongest available read-only layer | Versioned discovery/file readback; runtime NOT_RUN where absent, no inferred universal acceptance |
| HC-6 | Deliver a resumable report, tested source and installed changes through existing release policy | Reviews, exact source/package/readback receipts, generated wiki index |

## Source ledger and decisions

- User's current request supplies named hosts and adaptation objective.
- CLAUDE.md, docs/HANDOFF.md, docs/DOCMAP.md, docs/AGENT_SYNC.md and the standing
  retrospective instructions were read. Current source delivery is 1.54.6.
- Prior comprehensive-context receipts disclose 76 unsupported global targets and
  separate native Codex lifecycle; these are findings to reproduce, not new PASSes.
- skills.json, lib/plan.js, lib/apply.js and bin/sshlg-skills.js own host delivery.
- make-skill 0.29.1 owns format and host-capability doctrine; task-pipeline 1.90.0
  supplies bounded work, isolated implementation and independent review.
- Report search found no prior dedicated host-compatibility report in this owner.
- Contradictions: generic shared-hub paths are currently printed for multiple hosts
  despite distinct native loading roots; resolve from current source before changing.
- Global metadata catalogue size is separate from this compatibility task; the
  prior VISIBILITY-1 proposal remains separate and is not implicitly executed.

## Plan and resume

1. IN_PROGRESS — Research primary host contracts and inspect pinned CLI adapters.
2. PENDING — Audit all pinned family payloads and propose exact remediation scope.
3. PENDING — Implement failing regression cases and fixes in isolated owners.
4. PENDING — Independent review, full relevant gates and local host readback.
5. PENDING — Normal source integration, release/install if changed, report/index.

No interface design is being changed; retain the existing CLI flow. Documentation
and install evidence must distinguish portable skills from host-specific plugins,
hooks, subagents and actual loaded runtime state. A host being named in an upstream
installer does not imply each extension works there.
