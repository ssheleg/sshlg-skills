<sub>ssheleg skills — evidence-docs · task-pipeline</sub>

# W175-0 router migration scope prerequisite

Status: baseline reproduction only; implementation not yet applied. Owned branch
`fix/wait-rule-scoping`, base `2c322e2`; task lease WAIT-RULE-1013. B187 remains
frozen and is delivered independently before this correction is implemented.

`node test/router_migration_scope_test.js` against the unchanged source exited1:
six negative cases fail, while the selected-host migration positive passes.
Failures cover `--agent codex`, `--no-claude`, `--claude-only`, a shim refusing reads
of unselected instruction files, the same read boundary in dry-run, and a relocated
Codex profile. The process writes synthetic HOME files only; every fixture is
removed in `finally`, including failures. No native CLI or provider is invoked.

Root cause: `cmdRouters` iterates `apply.TARGETS` for migration before it resolves
`scopedRoutingTargets`. The later writer respects scope, but the earlier migration
has already changed unselected instruction files and collected their wording.
A recognized foreign heading is necessary to expose this seam; prior ordinary
handwritten-text scope fixtures did not enter the migration path.

Exact next task, after B187 delivery: resolve the selected host set before any
migration reads/writes and use only that set. Preserve selected migration, custom
roots, backups, authored wording and dry-run semantics. Re-run these seven real
process cases plus existing routing/application scope checks; no broad duplicate
until the coordinator allocates the serialized slot. This receipt does not claim
the opt-in wait rule itself is implemented or installed.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**:
evidence-docs for the red baseline; task-pipeline for prerequisite delivery.
