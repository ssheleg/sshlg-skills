<sub>ssheleg skills — task-pipeline · evidence-docs · ux-scenarios · copywriting · agent-sync</sub>

# MB02c implementation and handoff

Source: [`8d5b63ab07c8bb1e450915d1c0c5d4950c74dfa7`](https://github.com/ssheleg/sshlg-skills/commit/8d5b63ab07c8bb1e450915d1c0c5d4950c74dfa7).
Status: implemented and focused checks passed; independent peer, aggregate,
release and installation remain pending. This is a source CLI, not an installed
command availability claim. The [context packet](README.md) is the bounded brief.

## Observable interface

Run from the source checkout with `node bin/sshlg-skills.js` followed by:

- `rules recovery inspect --json`: inspect the existing wait-owner operation without
  writing a receipt, lock, directory or backup. No operation is `none`; that does
  not certify that the whole backup store contains no orphan evidence.
- `rules recovery finalize --operation <id> --json`: preview only. The identifier
  is the exact operation reported by inspection, never a path.
- Add `--apply` to finalize admitted ownership/retention metadata. `--dry-run`
  overrides apply. A matching completed operation is a byte-identical no-op.

Output is an allowlisted `wait-recovery-inspection/1` projection plus the existing
operation-result status contract. It reports safe phase/reference fields when
those have passed schema admission, a fixed reason code on refusal, and explicitly
scoped evidence. Original instructions, segments, config values, raw exceptions
and arbitrary keys are never serialized. Human output has no private paths;
its printed operation is lowercase hexadecimal and is not shell-interpreted.

`lib/wait-recovery-cli.js` owns strict grammar, fixed-home/private namespace admission,
current host-profile binding, safe projection and terminal proof field checks.
`lib/wait-rules.js` exposes read-only eligibility using one captured owner snapshot;
finalization also checks the expected operation and exact snapshot under its owner
lock. This supplements MB02b's current policy, profile, payload and exact single-row
ownership transition checks. The command never rewrites/restores a host file or
removes a held lock. If metadata finalization itself fails after a write, output
remains unknown and retained evidence is inspected on the next invocation.

Legacy pending, missing prior proof, malformed state, permissive/symlink storage,
forged transitions, outside reference namespace, reassigned retired proof and held
locks return nonzero. Current profile, policy and target admission protects unfinished
operation finalization. A previously terminal operation can still inspect as complete
after the operator changes policy or target bytes: that state describes historical
metadata completion, not current host health. The [independent terminal-state probe](../mb02-composition-peer.json)
records this boundary without modifying the target. Existing helpers retain
their internal API compatibility. Other owners, automatic lock retirement, host
restore, native installation, active session retirement and model behavior remain
outside this slice.

## Checks and findings

[focused.json](focused.json) records exact source hashes around six sequential checks:
new real-process CLI33, existing recovery30, SIGKILL7, existing rules CLI8, packaged
runtime closure6 and operation-result14. **98 checks, every process exit 0.** No
full repository aggregate or provider/native calls were run.

[baseline.json](baseline.json) preserves 0/27 on the old unsupported command entry.
That is absence of the new capability, not 27 historical incidents. New controls
include empty read-only state, before/after preview, exact metadata-only finalization,
three repeated actual CLI calls, strict arguments, private modes, policy/profile and
payload drift, locks, legacy/invalid bytes, missing transition proof, outside reference
namespace, terminal interruption and changed receipt between inspection and lock.

A separate working-source negative found a released proof could be reassigned to
another operation while the inspector reported complete. The
[31/1 observation](retired-proof-negative.json) is labelled working-source evidence,
not an immutable historical release. The final implementation compares all released
record fields to the admitted reference and refuses that actual CLI plant.

[ux-check.json](ux-check.json) records exit 0, no errors and one inherited U050
warning about the wider website declaration. SCN-010 is implemented with product
outcome unobserved; it is not marked independently validated.
[brand-check.json](brand-check.json) compares parent and candidate: both exit 2 on
missing generated `_site` marketing files (B009) and the uninitialized member README
(B023). These inputs were not fabricated or source exclusions weakened. New B011
terminology drift was corrected before freeze. Missing new source-string registry
entries were then added; [brand-registry-followup.json](brand-registry-followup.json)
retains the final advisory count, including the source literal's escaped newline
being reported separately from its already registered visible sentence. This is not
a passing global brand audit. Humanization: on, own technical-copy pass; no marketing
brief or visual layer applies. No additional model/provider calls were made.

## Exact next task and delivery boundaries

Parent independently reviews parser/projection, exact-state locking and private
namespace admission before integration. Then run the serialized owner aggregate
when its slot is available and bind any count changes to that run. Release and
installed readback are separate gates; the current 1.63 publication is unaffected.
The scenario/string additions travel with the implementation. The existing owner
receipt remains the only recovery authority; no additional global registry was added.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded delivery.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — exact-source checks.
- [`ux-scenarios`](https://github.com/ssheleg/super-ux) — recovery behavior.
- [`copywriting`](https://github.com/ssheleg/super-ux) — technical CLI messages.
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — exclusive task lease.
