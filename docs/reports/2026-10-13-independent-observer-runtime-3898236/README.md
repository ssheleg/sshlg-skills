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

This is an independent nonauthor followup to the [first review](../2026-10-13-independent-observer-interim-f77a6c2/README.md). It covers exact source `38982366a67ee619a1183139107a7642d375b134`. No production incident rate is claimed. At that initial cut, the observer had not executed new fixtures or authored fixes; the coordinator assigned focused reproduction and implementation to `recovery_audit`. These are additional implementation gaps behind R03/R33/C10, not the earlier release-evidence gaps IO01–IO06.

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

## Independent correction review, candidate f665c532

The observer reviewed exact candidate `f665c532104a9ecfd1cb2a3e5831e98c3414a093` without authoring implementation. [Independent replay receipt](raw/runtime-f665c53-independent.json) and [compressed output](raw/runtime-f665c53-independent.log.gz) bind the source hashes and command: `node test/runtime_atomic_test.js` passed **37/37**, exit **0**, from an owned immutable Git archive. The original IO-07/IO-08 findings remain historical evidence; the new code addresses their caught-failure, existence-aware rollback and failure-propagation mechanisms within the documented process-failure boundary.

[Package and existing entrypoint checks](raw/package-f665c53-independent.json) independently show offline `npm pack --ignore-scripts` exit **0**, with all **87** managed runtime paths present among **93** package files. `node test/hooks_e2e_test.js` passed **70 checks**, exit **0** ([output](raw/hooks-e2e-f665c53-independent.log.gz)). The test uses the real source root and isolated homes with fake external tools. Adding the required package manifest to synthetic module fixtures matches the shipped runtime closure; the source admission was not weakened. These checks neither publish nor install a package on the actual host.

The required inventory is admitted before recovery writes. An absent runtime with `create:false` remains the deliberate benign skip; existing runtime errors produce failure and suppress hook rewiring. The whole recovery journal is preflighted before target writes, and unknown bytes or incomplete evidence remain unresolved. This is not atomic visibility for already-running readers or a power-loss guarantee.

**Open recovery boundary:** a hard-crashed writer retains its exclusive lock. The owned-child fixture explicitly removes its known exited child's lock before replay; that is not a supported production lock-retirement procedure. The author's packet correctly retains this limitation. **Next task:** define a recover-only procedure with exact-holder proof, exclusive retirement, changed/unknown-holder refusal and negative controls before claiming complete automatic crash recovery.

**Candidate hold:** source review found `cmdUpdate` calls read-only `stale()` before strict sync admission, and the author then reproduced a managed FIFO blocking that comparison. The author's new correction will have a separate immutable source and replay. The 37/37 result above does not accept that later code. **Next task:** independently review and replay the frozen stale-path correction before integration.


## Bounded source verdict, bb724e5

**ACCEPT for the documented correction only.** Exact source `bb724e5bef2c8af5a5959c3ba6676e81b3835190` replaces the unsafe read-only comparison with regular-file fingerprint admission. The source FIFO and both actual launcher target-FIFO controls are included. The observer independently replayed the full focused file from a fresh immutable Git archive: **40/40, exit 0** ([receipt](raw/runtime-bb724e5-independent.json), [compressed output](raw/runtime-bb724e5-independent.log.gz)). No further blocking source finding was proven within the stated contract. This resolves the preceding candidate hold, not the retained crash-lock limitation.

IO-07 and the caught-failure/existence-aware portion of IO-08 are corrected and independently replayed. Source validation, journal admission, original absence and failure propagation have positive and refusal controls. Earlier red evidence remains useful; no report silently replaces it. The 70-check entrypoint replay and npm inventory check above bind the earlier `f665c532` source, while the later 40-check replay binds the final delta; neither is labelled a complete aggregate gate.

**Exact next task:** the coordinator composes this correction, runs the final hub gate once on its immutable source, and supplies publication, installed readback and the complete requirement/board evidence graph for final observer acceptance. Keep the supported retained-lock recovery procedure open with its separate owner/task. This report remains interim for the original program and actual installed runtime.


## Documentation and guard follow-up, b1da3db

**ACCEPT for this documentation/test-only slice.** Exact source `b1da3db2aa912a7194b82f5aefdb67fcebe4b89d` documents runtime failure, retained-lock refusal and per-file visibility consistently with accepted `bb724e5`. Its production runtime bytes are unchanged. The own-state exemptions name three exact modules: backup-retention writes its sidecars, Codex pending writes its private receipts, and runtime writes its managed copy and transaction metadata. This is not a blanket exemption for other writers; future changes to those destinations need renewed review.

[Independent fixture receipt](raw/guard-docs-b1da3db-independent.json) records `apply_test` passing 19 checks in a fresh immutable archive, an unrelated unprotected-writer plant rejected by **both** existing guards with exit 1, and 19 checks passing again after removing the owned plant. All eight summary changes preserve the fixture body and alter only its final output line. The observer exercised **16** positive/negative formatter controls, including runtime: counts and exit 0/1 remain explicit. The author's broader focused-suite and lint receipts were read as author evidence; this observer replay does not claim a clean whole-project lint or aggregate gate.

## Recovery-admission design review, 6880776

The observer read exact design `6880776dab0efaeafd925ba404b31a387f26f770`, [B190 packet](https://github.com/ssheleg/sshlg-skills/blob/6880776dab0efaeafd925ba404b31a387f26f770/docs/reports/2026-10-13-runtime-recovery-admission/README.md). No initial objection was found to the bounded protocol under cooperating local writers. This is **design review, not implementation acceptance**. A fixed replacement mutex that remains stuck after the reclaimer dies does not complete B190.

The implementation owner received these acceptance cases before source freeze: two contenders for one dead reclaimer's immutable successor slot; reclaimer death before/after original-lock retirement and after recovery-lock acquisition; journal committed but terminal receipt absent; terminal receipt published but fence cleanup incomplete; and a writer admitted between its first fence check and recovery publication. Only the exact attributable predecessor lock may be retired. A historical completed operation must never unlink a later writer's lock. Prepared or partial publication must not create a second authoritative branch. Next task is independent review of the frozen implementation and its process/barrier evidence; no production code was authored by this observer.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `project-audit`: independent read-only seam review.
- `evidence-docs`: immutable source and claim boundaries.
- `project-reports`: owning-repository report and metadata.
