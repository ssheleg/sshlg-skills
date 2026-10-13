<sub>ssheleg skills — evidence-docs · task-pipeline</sub>

# W175-0 router migration scope prerequisite

Status: focused correction verified; independent review pending. Owned branch
`fix/wait-rule-scoping`, base `2c322e2`; task lease WAIT-RULE-1013. B187 remains
frozen in its separate worktree and delivery branch.

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

The correction resolves `scopedRoutingTargets(f)` before migration and shares
that selected set with the emitter. It changes no host resolver or migration
algorithm. On the corrected source, the following commands exited0:

- `node test/router_migration_scope_test.js`: seven real-process cases pass.
- `python3 -B test/audit_regressions/fix-up-03.02.py`: all scope controls pass.
- `node test/apply_test.js`: 19 checks pass.
- `node test/cli_config_test.js`: 24 checks pass.

The first red run remains historical evidence at commit `4cd50db`; the seven
fixtures themselves are the durable reproduction. No broad suite has been run
for this bounded correction. No operator instruction file was changed.

Exact next task: obtain independent review of this prerequisite, then implement
W175-1/2/3 from `wait-rule-packet.md` on this isolated branch. The coordinator
accepted that packet at `fd4eb1e` on `plan/wait-rule-1013`. This receipt does not
claim the opt-in wait rule itself is implemented or installed.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**:
evidence-docs for the red baseline; task-pipeline for prerequisite delivery.
