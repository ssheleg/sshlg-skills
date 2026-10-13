<sub>ssheleg skills — evidence-docs · task-pipeline</sub>

# Independent merged B187/W175 seam review

Bounded PASS for source `e10467e3ffee6fd07a87b49003874b262ae9491a`, reviewed on 2026-10-13. The later `8e8738e` tree has no change to the reviewed CLI and operation-result files. This is not an aggregate or installed-runtime verdict.

The reviewer read the merged CLI and operation-result seams. Install/update retain `withClaudePlan`; its builder calls `attachWaitPlan` so the same frozen public plan keys both private WeakMaps. Uninstall attaches only the wait plan. Native execution precedes other channel work and wait writes. Both `claude-pins` and `working-rule` operation kinds remain represented. The merge does not restore floating native update loops.

`node docs/evidence/completion-1013/w175-b187-peer.cjs /path/to/integrated/hub` passed four independent actual CLI composition cases: install, update, native failure, and corrupt rule receipt. The first two preview both operation kinds without changes, execute the native boundary, and remove only the owned disabled wait block. Native failure leaves that block unchanged; corrupt rule state refuses before the native boundary is called. All synthetic homes and package copies were removed in `finally`.

The replay substitutes only `claude-pin-transaction.execute` with a recorded synthetic result. It therefore checks merged orchestration, not the native CLI implementation, provider behavior or operator configuration. Parent-reported native transaction27 and wait CLI8 checks are separate evidence, not counted as these four independent cases. No broad suite was run for this review.

The first exploratory fixture expected its bare foreign instruction text to remain byte-identical after the pre-existing router installed an opt-out marker. That expectation tested unrelated router behavior. The corrected fixture starts with an explicit existing router opt-out; all four corrected cases passed. The exploratory failure is not classified as a production defect.

Next acceptance remains the final combined source/pin aggregate and separately authorized installation readback. The B179 peer receipt in this directory retains its old-pin advertised-description failure until the member pin is updated.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**: evidence-docs for source-bound evidence; task-pipeline for the integration boundary.
