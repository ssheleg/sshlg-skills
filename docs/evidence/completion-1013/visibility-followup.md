# C04 follow-up: active profiles and unknown visibility policy

Objective: apply and undo visibility in the selected host profile without turning a
failed policy read into permission to remove existing hidden-skill settings.
Base: `ab377787` (parent completion integration). This receipt belongs to the
bounded follow-up branch; it is not an installed/native acceptance claim.

## Changes and source contract

- `bin/sshlg-skills.js` resolves Claude and Codex roots with the existing
  `apply.hostRoot`/`TARGETS` contract. Claude's plain/plugin inventory, instruction
  file and usage source use the same selected profile. The shared skills root
  remains the machine's `.agents/skills`; pack marks remain hub-owned under
  `.sshlg-skills`, independent of host profiles.
- Claude documents [configuration directory overrides](https://code.claude.com/docs/en/settings#find-or-create-your-settings-files)
  and [the relocated `.claude.json`](https://code.claude.com/docs/en/mcp-quickstart#find-your-configuration-on-disk):
  when `CLAUDE_CONFIG_DIR` is set the latter lives inside that directory. Read
  2026-10-13. Codex root selection reuses this repository's existing `CODEX_HOME`
  resolver rather than adding a second path convention.
- `lib/conflicts.js` accepts an explicit `claudeRoot`; its registry, plain skill
  roots and effective enablement share it. `lib/enablement.js` retains the test
  filesystem third parameter and accepts the explicit root as a fourth parameter.
  The concurrent C05 follow-up is coordinated to preserve this interface.
- `visibility.json.files` records absolute settings paths with ownership.
  Switching profiles while entries/created containers are owned refuses both
  apply and revert before changing settings or the receipt. Reapply also binds
  consent to the recorded profile, even if its entry list is empty. Legacy
  Claude/Codex receipts can only belong to the former hard-coded default roots;
  select those roots and revert before changing profiles. Legacy receipts for
  other hosts lacked provable path binding and now refuse to mutate until a
  verified original `files.<host>` path is restored from prior apply evidence.
  Newly written receipts bind those hosts too; a default path is not guessed.
- Missing policy is distinct from unreadable, malformed or wrong-shaped policy.
  Apply/preview/reapply refuse unknown marks, skill-lock or visibility overrides
  before writing configuration or ownership. Usage/instruction read failure also
  cannot silently remove the usage core. Explicit revert uses ownership and does
  not need marks, the lock or overrides to be readable.
- Unreadable host settings are a per-host degradation. Their ownership remains
  available for a later retry. `visibility marks --init` reports unreadability
  instead of claiming the existing file is absent.

The implementation does not change the existing Codex editor's empty-table
normalization. Profile round-trip fixtures use an existing empty `[skills]` table
so their byte-for-byte assertion checks preservation rather than a new TOML
formatting policy. An unbound legacy non-Claude/Codex receipt needs recovery evidence before any
mutation; this change cannot reconstruct a path an old receipt never recorded.
Preserve the receipt and protected backups. Identify the original settings path
from the original apply trace/backups, restore only that verified `files.<host>`
binding in the receipt, then select that profile and retry undo. Without such
evidence the command refuses, retaining the state for investigation.

## Red/green evidence

`test/visibility_hosts_e2e_test.js` added nine initial regressions. Run against the
untouched `ab377787` implementation: **9 failures out of 46 checks**, exit 1.
Failures cover the wrong default profile write, ownership replay into another
profile, unreadable/malformed marks, lock and config, and misleading marks init.
The earlier interrupted baseline run was discarded after helper edits overlapped
its subprocesses; the complete unchanged-base rerun is the red evidence.

Two more regression cases were added for update reapply preserving consent and
for unreadable host settings during undo. The profile-switch case also checks
wrong-profile revert and legacy default-root ownership. Fixture HOME/PATH values
are synthetic; Hermes and host executables are shims, no provider call or real
home apply occurs. Tests remove only their own temporary trees.

Final focused results are appended after completion below. Whole repository
suite, hosted CI, release, native model/host acceptance and installed hook refresh
are NOT_RUN by this follow-up; the parent owns aggregate gates.

## Handoff

Complete: bounded implementation, source-contract review, failing regression
replay and focused tests listed below. Open: independent review by
`fresh_research`, parent integration including the C05 enablement-interface seam,
aggregate gate, and separately authorized installed/native readback.

Exact next task: the independent reviewer replays both defects plus profile
mismatch, legacy ownership and unknown-policy recovery on the pushed commit.
Then the parent merges the reviewed follow-up, keeps the C05 fourth-parameter
API compatible and reruns affected integration checks. No shared board, DOCMAP,
member pin or production configuration was changed by this branch.

## Focused result

| Command | Observed result |
|---|---|
| `node test/visibility_hosts_e2e_test.js` | `OK (48 checks)`, exit 0; baseline 37 plus 11 new checks |
| `node test/visibility_test.js` | `OK (21 checks)`, exit 0 |
| `node test/visibility_packs_test.js` | `OK (22 checks)`, exit 0 |
| `node test/visibility_e2e_test.js` | `OK (11 checks)`, exit 0 |
| `node test/conflicts_test.js` | `OK (20 checks)`, exit 0 |
| `node test/toolkit_test.js` | `OK (30 checks)`, exit 0 |
| `node --check bin/sshlg-skills.js` | exit 0 |
| `git diff --check` | exit 0 |

An attempted `node test/enablement_test.js` did not run because that file does not
exist (MODULE_NOT_FOUND). No pass is claimed for it; enablement's explicit-root
seam is exercised by the active-profile visibility process test and existing
conflicts/toolkit suites.

## Independent review correction

`fresh_research` found two counterexamples on `4538bb7`: an unbound legacy Gemini
receipt removed a same-name operator entry from a relocated profile, and a lock
with `skills.foreign = null` was accepted as an empty pack mapping. The two added
real-process fixtures were run against that unchanged commit's implementation:
**2 failures out of 2 checks**, exit 1. The runner selected those test names in
`visibility_hosts_e2e_test.js` through a Node module wrapper; it did not substitute
the CLI or persistence implementation.

Correction: unbound legacy non-Claude/Codex ownership now refuses rather than
guessing an original profile. Strict lock reads validate each source entry; null,
missing and non-string sources are unknown policy, not removals. Explicit empty
`skills: {}` remains a known empty mapping. Revert remains independent of lock
policy. The profile fixture verifies both relocated and default unbound refusals,
then successful undo after restoring a verified original binding.

After the review corrections, `node test/visibility_hosts_e2e_test.js` returned
`OK (50 checks)`, exit 0. The separately selected two new fixtures returned
`OK (2 checks)`, exit 0. This supersedes the earlier 48-check result for the final
source. The original 37 checks still run; the total delta is 13 checks, no new
suite. `git diff --check` also returned exit 0 after the corrections.
