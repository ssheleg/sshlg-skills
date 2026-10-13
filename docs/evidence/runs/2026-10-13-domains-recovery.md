# L5 recovery receipt — project-scoped domain members

Objective: finish the preserved fixes after unit, seam and product certification of
`e27a040` failed. Base `09d17a2` already supplied explicit project choices, root checks,
symlink handling and additions-only unattended updates. The subsequent uncommitted
changes were recovered in the existing `feat/domain-members` worktree.

## Changes and evidence

- `lib/domains.js` keeps sheleg-dev globally enabled independent of member checkout or
  installed-plugin metadata. Other plugins with `hooks/hooks.json` are also retained by
  the launcher. Old ownership records that turned a protected member off are repaired.
  Test: `plan: a member whose plugin ships hooks is never scoped (S1)`.
- `lib/domainscan.js` treats malformed, oversized, unreadable manifests and source-search
  failures as incomplete evidence. `lib/domains.js` restores global coverage where a
  previously scoped member cannot be ruled out. Tests: `a previously scoped member returns
  globally when a later scan is incomplete`, `invalid or oversized manifests cannot become
  proof that a member is unnecessary`.
- `lib/enablement.js` merges user and project settings for search and hook readers.
  Disabled domain skills remain in the catalogue with an enable hint. Hooks do not arm an
  unavailable route. Tests in `test/toolkit_test.js` and `test/hooks_e2e_test.js`.
- Repeated install updates existing plugins instead of reinstalling and re-enabling them.
  The sandbox CLI dry-run proves the selected command in `test/domains_e2e_test.js`.
- `domains --enable` bootstraps a new repository before dependencies exist. Root refusals,
  symlink deduplication, three-run idempotence, operator edits and reversibility are exercised
  through the real launcher in a temporary HOME.
- Usage snapshots expire without a calendar-dependent test fixture. Future or invalid dates
  are rejected. New local settings and ownership records use mode 0600.

## Checks actually run

| Command | Result |
|---|---|
| `node test/domains_test.js` | exit 0, 34 checks |
| `node test/domains_e2e_test.js` | exit 0, 34 checks |
| `node test/toolkit_test.js` | exit 0, 30 checks |
| `node test/triggers_test.js` | exit 0, 68 checks |
| `node test/hooks_e2e_test.js` | exit 0, 70 checks |
| `node test/conflicts_test.js` | exit 0, 20 checks |
| `node test/plan_test.js` | exit 0, 28 checks |
| `git diff --check` | exit 0 |

284 focused checks. The preserved initial tree's domains e2e suite first failed seven
checks, primarily old expectations that required disabling the money gate. The corrected
suite asserts the new safety invariant and retains non-hook member coverage.

A direct comparison loaded `09d17a2:lib/domains.js` into a separate Node module and checked
identical inputs against it and the recovered module. Confirmed red/green: the old module
planned sheleg-dev off without installed metadata; it failed to restore xr-dev for an
incomplete rescan. The new module retained/restored the global entries (two defects).

## Remaining work and boundaries

The full hub suite was NOT_RUN in this worktree; the coordinator runs it after integrating
L1 and L5. DOCMAP fixture counts remain for that measured run. Independent final-head
unit/seam/product certification is pending. No release or real machine configuration apply
was performed. Sandbox file/CLI evidence does not prove the actual model-visible listing.

Next: independent certification, integrate with L1, full gate, release and installed
readback; then preview/apply the authorized domain policy and measure L4 per-host visibility.
Keep usage tables, project paths and machine marks local. The hub does not implement
Fabric's planned per-session skill layer or Observatory's MCP profile writer.
