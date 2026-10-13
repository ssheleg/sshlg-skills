<sub>ssheleg skills — task-pipeline · evidence-docs · ux-scenarios · copywriting</sub>

# MB02c: inspect and finalize wait-rule recovery metadata

Status: implementation delivered for independent review; see [current evidence](implementation.md).
Bounded implementation authorized by parent on 2026-10-13; source base
`8bb7f643d3cab3a05c8d14d00e58c4b977521ce7`, with peer-only successor `bca1015`.
Source and synthetic acceptance are separate from release, installation and native behavior.

## Objective, evidence and boundaries

An operator or coding agent can inspect the existing wait owner after an interrupted
write and explicitly finalize only its metadata. MB02b's owner receipt remains the
single authority. No host restore/rewrite, native command, model call, stale-lock
stealing, guessed legacy migration or new global registry is included.

Source ledger: `lib/wait-rules.js` owns receipt/plan/execute and internal recovery;
`lib/wait-recovery.js` binds before/after/reference; `lib/backup-retention.js`
verifies and retires private references. `bin/sshlg-skills.js` parses rules before
generic flags; `lib/operation-result.js` defines typed statuses and nonzero unknown.
Accepted parent peer is recorded in the adjacent backup-recovery packet.
Contradictions: internal inspection currently classifies snapshots, not eligibility;
the public command must never label `after` alone as permission to finalize.

## Interface and authority

- `rules recovery inspect [--json]`: native-host-read-only; no mkdir, lock, backup,
  mutation or subprocess. Reports an allowlisted projection only.
- `rules recovery finalize --operation <32-lowercase-hex> [--apply] [--dry-run] [--json]`:
  preview by default; dry-run overrides apply. The operation locator binds the
  request to one recorded operation. Revalidation under the owner lock still governs
  actual metadata finalization. A completed matching operation is a byte-identical no-op.
- No receipt, backup, target, home, owner or host-scope positional/path options.
  Unknown/repeated options and malformed/missing identifiers refuse before reading state.
- Supported owner is wait-rules. The current HOME and supported host-profile environment
  select the existing namespace; recorded host root must match that current host binding.
- Existing directory/receipt/reference schema, private modes, canonical namespace and
  exact single-row transition are checked. Legacy pending, missing proof, invalid bytes,
  changed policy/profile/payload, locks or unresolved reference state remain nonzero.
- JSON carries schema, command, status, state, operation, agent, phase, reference state,
  readiness and fixed reason/remedy codes/text. It never carries original instruction
  text, ownership segments, configuration contents, raw exceptions or arbitrary receipt keys.

## Requirements and meaningful checks

| ID | Contract | Focused evidence planned |
|---|---|---|
| C01 | Empty inspection performs no writes | actual CLI absent home metadata snapshot |
| C02 | Read-only before/after/terminal state is not automatic completion | actual pending fixtures; inspect/preview byte equality |
| C03 | Explicit matching operation is required | absent/malformed/stale locator negatives |
| C04 | Existing private storage and schema remain bound | permissive directory/receipt, symlink, invalid UTF-8, unknown schema |
| C05 | Unknown fields/text do not leak | synthetic sentinel in foreign text, legacy metadata and parse errors |
| C06 | Exact metadata-only finalization preserves host bytes | pre/post-write fixtures, existing sibling ownership, triple-repeat real CLI |
| C07 | Policy/profile/transition changes and locks refuse | real CLI negatives preserving full synthetic tree |
| C08 | No arbitrary recovery path accepted | receipt/target/home flags and extra positionals rejected |
| C09 | Packaged CLI reaches source and consistent typed outcomes | real bin processes plus runtime closure test |

Owned implementation files: new `lib/wait-recovery-cli.js`, minimal recovery dispatch
and help in `bin/sshlg-skills.js`, read-only eligibility and exact-operation admission
in `lib/wait-rules.js`, focused tests. Scenario SCN-010 and technical CLI string rows
extend the existing small CLI surface; no visual layer or marketing copy is involved.
Scenario/copy routes use the existing maintainer persona and technical settings channel.

## Ordered tasks and gates

1. Commit this context and scenario contract; plant actual CLI negatives and positives
   against the old unsupported entry point, retain measured baseline separately.
2. Build one sanitized inspection projection and strict parser, then explicit finalize
   using the existing owner lock and current evidence. Do not return raw core objects.
3. Run focused real-process controls and relevant existing recovery/CLI/runtime closure
   checks. Preserve any discovered failures and source identities. No broad suite while
   parent's serial slot is occupied.
4. Independent parent peer before integration; owner aggregate, release and installed
   readback are later gates. Current 1.63 publication is independent of this next wave.

Exact next task: independent parent review of C01–C09 against [implementation evidence](implementation.md),
then a separately scheduled aggregate. Lock retirement admission, actual host restore and other owner
adapters remain separate packets. A successful metadata result cannot close them.

---

Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills): task-pipeline for
bounded delivery, evidence-docs for source-bound claims, ux-scenarios for behavior,
copywriting for technical CLI messages, agent-sync for the MB02C-1013 lease.
