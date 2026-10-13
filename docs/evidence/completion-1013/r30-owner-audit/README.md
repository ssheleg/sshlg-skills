# R30: seven remaining owner board gates

Status: **source gaps reproduced; implementation delegated, not complete**. This bounded audit checks two board invariants through real owner structural validators. It does not certify whole repositories or the full Markdown grammar.

## Exact observations

[observed.json](observed.json) retains source commits, board hashes, existing row/line, process status, duration and output. All seven baselines passed. The ordinary plants duplicate an existing ID row verbatim, or insert an unescaped cell after its ID while retaining the original final status. No owner checkout was edited. Disposable shared-object clones were removed.

| Owner / source | Row | Duplicate exit | Extra cell exit | Measured result |
|---|---|---:|---:|---|
| agent-sync `3dbafd82eb635d8e79b65ddc0c3d1fd8205936db` | AS-24:18 | 0 | 0 | Both defects accepted |
| make-skill `78d67651611f50e2af531ab04916e680c2a2680d` | MS-01:23 | 0 | 0 | Both defects accepted |
| sheleg-design-skill `678fe483eea128be0125b033f442934f1ece7c32` | B-001:17 | 0 | 1 | Duplicate accepted; width refused explicitly |
| sheleg-dev `8862fae9a826263f8109626ca257f81c7c43ac86` | B-79:18 | 0 | 0 | Both defects accepted |
| super-ux `f0261f68c1a7222508bd984dc7bac63805dbb76b` | B-033:15 | 1 | 1 | Both refused by intended diagnostics |
| task-pipeline `52fa75dbe1a3d169c02c612516b30028929559f9` | B-106:29 | 1 | 1 | Duplicate refused; first width plant trips numeric-priority validation |
| seo-aeo-audit `dd5319a8935d60d0db7b3649b528d31d0b9ac45f` | B-35:24 | 0 | 0 | Both defects accepted |

A supplemental task-pipeline plant inserts a cell immediately before final status, leaving numeric priority fields intact. It exits **0**, proving its first refusal was not general header-width protection. The primary 21 completed controls and this supplemental control are retained (22 total). A later escaped-pipe attempt returned 1 but receipt writing hit ENOSPC; its full evidence was not persisted, so it is **inconclusive**, not a new finding. The planned design/UX escaped controls never started successfully and are NOT_RUN. The primary matrix remained valid JSON and unchanged by the failed write.

An earlier in-flight agent-sync width attempt was deliberately interrupted to improve plant attribution before it produced a result; [interruption.json](interruption.json) records that event. It is not included among completed controls. After the ENOSPC event the reproducer gained atomic receipt replacement and an owned TMPDIR for future runs; these harness hardening changes are not a claim that old runs used those new mechanisms. No validator process or owned clone remains running.

## Source explanation, not substitute for reproduction

- agent-sync: `test/validate.py:3783` main check sequence does not read this repository's backlog; the runtime coordination-board tests concern different data. Baseline and actual plants establish the omission.
- make-skill: `test/validate.py:520–583` reads backlog for stale release claims, not row identity/shape. No lossless table check intercepted either plant.
- sheleg-dev: `test/validate.py:2198` runs registered checks; backlog references at 614 and 2015 concern other invariants. Both actual plants pass.
- design: `test/validate.py:2976–3002` checks columns, matching its width failure; duplicate rows are accepted.
- UX: `test/validate.py:1071` checks IDs and `1495` checks table shape. Both actual plants fail with the intended diagnostic; no repair is justified by this audit alone.
- TP: `test/validate.py:1561–1572` detects duplicates; `1715` enforces only a minimum column count and later checks numeric priority. An extra cell after those fields passes. Recheck current PR114/119 composition before any owner implementation; this measurement is pinned to the earlier main cut.
- SEO: `test/validate.py:1867–1877` stores statuses in a dictionary keyed by ID, collapsing duplicates; it does not enforce table width.

The structural validators are real entry points named by owner package scripts. This audit did not run every other npm sub-suite, hosted check or release gate. A valid existing baseline is evidence against false positives on the current board, not a full escaped-pipe/summary grammar acceptance proof.

## Reproduction

Run from this hub worktree with the owner Git checkouts available:

```sh
python3 docs/evidence/completion-1013/r30-owner-audit/reproduce.py \
  --owners-root /path/to/owners --output /owned/path/observed.json
```

Use `--owner task-pipeline --kinds tail-width` for the targeted second variant. The script reads remote main, requires that object locally, uses detached disposable clones, and invokes `python3 test/validate.py`. It never resets, stashes or edits owner worktrees. `--resume` requires matching source SHA; do not reuse results after source changes. Fresh local object stores must fetch before replay. Optional escaped controls are available but not all were executed in this snapshot.

## Authorized next wave

Parent authorized bounded fixes after this durable audit. First agent-sync, then make-skill, sheleg-dev and design, each in an isolated owner worktree with its own task claim. Reuse the reviewed table contract from agent-stack 0.27.2 / FW02, adapting only real declaration versus reference-table semantics. Read real existing headers and grouped IDs before choosing a grammar. Keep source/test sharing annotations; do not install a release-YAML checker merely to repair table validation.

Required per owner: red actual plant → bounded table adapter → corresponding intended refusal → nearby healthy/escaped/summary controls → owner source gate → independent exact-SHA review → normal PR admission. A board mentioning another ID is not a duplicate declaration. Missing/unreadable board, missing separator, orphan row and duplicate across declared tables must not disappear silently. Do not fabricate historical ledger verdicts or weaken check-count floors.

SEO is assigned exclusively to recovery_audit; the exact repro and source were sent. TP must first reconcile current PR114/119 changes, and super-ux needs no repair from the two successful checks. Agent-stack and FW02 Telegram/XR/Web3D are outside this remaining-seven replay because their owner gates already have separate accepted evidence. No universal R30 closure, package publication, hub pin change or installed acceptance follows from this report.

Owner: `/root/visibility_review`; branch `audit/r30-owner-gates-1013`. Next concrete task: implement and review agent-sync's table guard before sibling propagation. All owner code remains unchanged at this audit handoff.
