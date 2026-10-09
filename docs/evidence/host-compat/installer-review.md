# HC-3 installer target repair — 2026-10-09

Status: IMPLEMENTED; focused checks PASS; independent integration review ACCEPT.
Reviewer `/root/host_contracts` independently reran 38 focused checks and verified
both upstream hashes and all 79 target pairs. Full combined gate belongs to the
parent delivery receipt.
Implementation: `aea8f002829350bcde2f6a90c6007349a676d3d0`.
Base: `d31e3cd948eb55f96beee9370e8b751073b867bf`.
Owner/worktree branch: `codex/hc3-installer-targets`.

## Problem and resulting behavior

The old `resolveAgents` returned the upstream wildcard for `--all`. Upstream
skills@1.5.25 contains 79 host IDs, but Eve and PromptScript explicitly lack a
`globalSkillsDir`. Asking the upstream installer for every agent under `--global`
therefore selected unsupported destinations. It also selected plain Claude Code
while the wrapper was managing Claude through plugins.

The new packaged snapshot resolves `--all` into 76 explicit IDs when the plugin
channel is enabled, or 77 with `--no-claude`. It prints the two excluded project-only
targets. Explicit unknown/project-only IDs and a literal wildcard fail with status
2 before any subprocess or HOME write, including requests combined with `--all`,
`--claude-only`, repeated `--agent`, or dry-run. Repeated valid flags accumulate;
selected IDs retain caller order and are deduplicated. Known explicit requests
remain subordinate to `--all`, as before.

The snapshot must match the exact `package.json` skillsCli pin. A missing/mismatched
pin refuses installation instead of falling back to a wildcard. Both the module
and inert snapshot use `.js`: the wired-runtime copier intentionally carries JS
modules, so a separate JSON dependency would be absent from the installed runtime.
The copied-runtime fixture verifies the actual closure can resolve the same plan.

## Primary source and reproducibility

- Published package: [skills 1.5.25 tarball](https://registry.npmjs.org/skills/-/skills-1.5.25.tgz),
  member `package/dist/cli.mjs`.
- Bundle SHA-256: `8409e4055ea6753255f1439eddf3fbc2f9989bc54e08708bc00ad0a00bfbed0d`.
- [Upstream agents table at v1.5.25](https://github.com/vercel-labs/skills/blob/v1.5.25/src/agents.ts).
  Its raw file SHA-256 was
  `740f6a7498262266cef5e98779452753fe1006ba1f61522fb1c811891f5a9873`.
- The 79 sorted `(id, global-support)` pairs independently extracted from the
  published bundle and upstream TypeScript agree exactly. The downloaded canonical
  tarball bundle hash agrees with the existing local npm cache source.
- [Packaged snapshot](../../../lib/host-targets.snapshot.js) records source addresses,
  hashes and observation date; [resolver](../../../lib/host-targets.js) includes a
  verifier. Run `node lib/host-targets.js --verify-source` with the locally extracted
  bundle path as its final argument. It checks the digest and every pair without
  evaluating third-party source. Observed output: `Verified skills@1.5.25: 79 host
  targets, source digest and table match` (exit 0).

No CLI version change was needed. A future pin change must carry a new verified
snapshot; this snapshot asserts installer destinations, not native runtime support.

## Red-to-green evidence and focused checks

The two regression groups were introduced before implementation and the existing
plan suite exited 1: old `--all` did not return explicit supported IDs and an
explicit unsupported request did not throw. The first test draft used shortened
Kimi/Hermes names; these were corrected to the exact upstream IDs `kimi-code-cli`
and `hermes-agent`. Both corrected regressions were then replayed against the
unchanged base module via a VM: both still failed as expected. The final plan suite
passes with those exact IDs.

| Command/check | Result |
|---|---|
| `node test/plan_test.js` | Exit 0, 25 checks |
| `node test/host_targets_test.js` | Exit 0, 13 checks |
| `node test/cli_config_test.js` | Exit 0, 24 checks |
| `node test/skillstore_test.js` | Exit 0, 9 checks |
| `node test/runtime_test.js` | Exit 0, 8 checks |
| Source verifier against canonical-matching bundle | Exit 0, 79 pairs |
| `npm pack --dry-run --json` plus payload assertions | Exit 0, 60 packaged files; both new modules included |
| `git diff --check` | Exit 0 |

[Target fixtures](../../../test/host_targets_test.js) execute the actual launcher
in a disposable HOME/cwd and intercept its child-process boundary. They prove
pre-mutation rejection, zero-child/zero-HOME-write dry runs, actual install/update
argv propagation, exact pin use, repeated flags, caller order and runtime closure.
The subprocesses themselves are deliberately stubbed: these fixtures do not prove
that all 77 upstream adapters install or load successfully.

## Limits and integration notes

- No real global installation, release, push, model call or provider invocation was
  performed by this task. Native plugin lifecycle remains separate.
- Broader host-capability tables, native loading roots, front matter and family
  portability are owned by the parent HC task, not inferred from this snapshot.
- `skills update` still refreshes shared installed storage before reconciliation;
  target selection does not imply isolation from other shared-store consumers.
- Existing `--all` plus explicit-agent routing-file scoping is unchanged; this task
  changes skills-CLI destinations and rejects invalid target input.
- Full family/structural gates and DOCMAP ratchet updates belong to integration:
  this branch adds one suite and 14 counted checks compared with its base (13 new
  checks plus one additional existing-suite check). Do not call the full gate PASS
  from these focused receipts.
- Integration should cherry-pick this implementation and report commits, review
  their diff, then run the full gate on the combined owner tree. No foreign worktree
  or operator configuration was modified.
