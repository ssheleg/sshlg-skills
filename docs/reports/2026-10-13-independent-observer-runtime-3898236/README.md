---
report:
  id: sshlg-skills/2026-10-13-independent-observer-runtime-3898236
  title: Independent observer followup, hook runtime failure and recovery
  kind: audit
  project: sshlg-skills
  domains: []
  as_of: 2026-10-13
  status: active
  valid_until: 2026-10-14
  summary: >-
    Source review found two uncovered hook runtime failure mechanisms.
    Runtime errors can be treated as successful skips or ignored during installation.
    Interrupted recovery lacks original-existence proof for newly introduced files.
    Focused reproduction and correction are assigned; no final acceptance is claimed.
  sources:
    - {name: Immutable source, url: "https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/", read_at: 2026-10-13}
  produced_by: {agent: codex, task: independent-observer}
  supersedes: []
  consumers: [sshlg-skills]
---

<sub>ssheleg skills — project-audit · evidence-docs · project-reports</sub>

# Two new source findings, interim

This is an independent nonauthor followup to the [first review](../2026-10-13-independent-observer-interim-f77a6c2/README.md). It covers exact source `38982366a67ee619a1183139107a7642d375b134`. No production incident rate is claimed. The observer did not execute new fixtures or author fixes; the coordinator assigned focused reproduction and implementation to `recovery_audit`. These are additional implementation gaps behind R03/R33/C10, not the earlier release-evidence gaps IO01–IO06.

## IO-07: runtime errors can become caller success

[`runtime.sync` catches failures](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/lib/runtime.js#L233) from staging through switching and returns `reason`. [`update` treats that reason as a skip](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/bin/sshlg-skills.js#L635), without setting its failure result. [`hooks install` ignores the return entirely](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/bin/sshlg-skills.js#L3221), then logs synchronized scripts and can write settings. A thrown exception is caught by callers, but this path returns instead. The existing staged-copy fault regression checks the helper's reason and old bytes; it does not prove these callers propagate failure.

**Next task:** distinguish an intended absent-runtime skip from failure and verify both real launcher paths using an owned fake-host profile. A failed fresh install must not newly wire settings; both failures must return nonzero without false synchronized/intact claims. Owner: `recovery_audit`. No actual host mutation is required.

## IO-08: recovery does not establish a coherent previous generation

The [switch performs multiple renames](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/lib/runtime.js#L221). A later rename can fail after earlier new bytes are already installed, but the catch still says the old runtime is intact. [`recover`](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/lib/runtime.js#L115) copies back only paths with previous files, then deletes the journal and previous-generation directory. A newly introduced file has no prior file to restore and remains installed. The [journal records names only](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/lib/runtime.js#L218), so absence of a backup cannot safely mean original absence; it may mean missing evidence. A malformed/unreadable journal is also treated like no journal at line 120.

The [existing crash fixture](https://github.com/ssheleg/sshlg-skills/blob/38982366a67ee619a1183139107a7642d375b134/test/audit_regressions/fix-up-05.04.py#L50) gives every managed file a prior snapshot and computes its coherent-old digest over those fixed paths. It cannot prove the newly introduced-file case. This is a coverage gap attached to a concrete source mechanism, not a measured production outage.

**Next task:** admit existence-aware before/after evidence and return either verified rollback or an explicit unresolved result. Cover second-rename interruption, introduced files, malformed journals, missing prior copies and changed targets; preserve unknown or concurrently changed bytes. Owner: `recovery_audit`. The runtime writer's concurrency boundary also needs checking because `hooks install` is outside `runUpdateLocked`; this design concern is not counted as a separately reproduced finding.

## Scope and handoff

[Machine-readable findings and immutable hashes](findings.json) preserve mechanism, incidence, ownership and next steps. No broad collector was repeated, and no broad suite, provider, release or host mutation was initiated. The R01/R02 hook reset and session-state paths and corrected Codex observer order yielded no further proven finding in this bounded reading.

Exact next task: review the owner's immutable correction and red/green evidence, then admit it to the final hub gate. A passing source correction will not replace actual published/installed acceptance. Historical failed receipts remain intact. The coordinator runs the wiki index because cross-repository writes are outside the observer remit.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `project-audit`: independent read-only seam review.
- `evidence-docs`: immutable source and claim boundaries.
- `project-reports`: owning-repository report and metadata.
