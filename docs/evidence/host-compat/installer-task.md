# HC-3 — global installer target contract

Read README.md in this directory first. Implements HC-3: fix confirmed installation,
discovery and host-selection defects without treating unsupported targets as success.

Current pinned skills CLI is skills@1.5.25. Its published dist/cli.mjs agent table
has globalSkillsDir undefined for Eve and PromptScript; --agent '*' still selects
those under --global and emits per-skill unsupported errors while wrapper says green.
plan.resolveAgents returns ['*'] for --all and also unnecessarily selects plain Claude
beside the plugin channel. Reproduce with a tiny neutral local fixture in an isolated
HOME if needed, never install experimental fixtures in the real home.

Design: own a dated, reproducible snapshot of upstream agent IDs and global support
bound to the exact package.skillsCli pin; build explicit --all targets from supported
global IDs. Exclude claude-code while plugin channel is enabled; include it only when
--no-claude applies. Display excluded non-global targets honestly. Explicit request of
unknown or non-global target must fail before any mutation, not silently skip. Keep
zero runtime npm dependencies and no guessed fallback to wildcard. Do not change the
CLI pin unless source evidence requires it. Native-plugin update remains separate.

Work in your own isolated worktree from6415e3e. Exclusive code scope: lib/plan.js,
bin/sshlg-skills.js installer target selection/help, a new narrow lib/host-targets.js
and its packaged snapshot, focused test files. Root owns skills.json and general docs;
coordinate any shared changes. Include a reproducible snapshot generator or recorded
upstream digest/source plus verification, but avoid large copied third-party payloads.
Do not call the full real global installer. TDD: witness relevant failures beforefix,
then test both valid and rejection paths, dry-run/no-mutation, stable order and actual
CLI propagation. Existing tests relying on wildcard must be updated intentionally.

Report docs/evidence/host-compat/installer-review.md with commits/tests/facts/limits.
Commit only task files; no release or push until root review. Inherit model/effort.
