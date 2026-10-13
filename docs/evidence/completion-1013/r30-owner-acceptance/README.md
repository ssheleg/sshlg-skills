# R30 source acceptance receipts

Scope: owner validator corrections, actual negative controls and normal source integration. Existing published npm payloads are compared byte-for-byte; this packet does not change versions, tags, hub pins or installed state.

The machine-readable `readback.json` records only completed merges whose entire Git tree equals the reviewed candidate and whose npm payload hashes match the prior source. CI identity is an exact candidate `pull_request` run; every returned job and every required context passed before normal `--match-head-commit` squash merge. No administrator bypass or force push was used.

## Owner evidence

Each owner keeps its implementation, baseline plants, focused controls, local full-gate log hashes and payload manifest under `docs/evidence/runs/2026-10-13-r30-owner-gates/README.md` at the source commit recorded in the receipt. Local full gates are bound to their measured implementation SHA; the subsequent receipt-only commit is not misrepresented as a repeated local gate. Hosted candidate checks cover the exact successor head.

Agent-sync, make-skill, sheleg-dev and design adopt the reviewed board/release contract. Task Pipeline composes the accepted feature and source-backed ledger before the guard change. UX changes only release validation; its board validator was already rejecting the actual board plants. The bounded YAML grammar is not an arbitrary YAML/shell interpreter, and annotation guarding is an aggregate runtime-regression claim rather than structural-only enforcement.

## Handoff

Only entries present with completed merge evidence are accepted here. Other owner candidates remain pending their own local/peer/hosted gates. Next: the hub coordinator reconciles these source successors into the later approved pin wave and regenerates its source inventory; do not retag an existing release or claim global installation from source acceptance. Native discovery, model invocation and task-quality evidence remain separate.

## Make-skill native evidence owner delivery

The separate docs-only PR 38 merged as `3740043608a2d2969982ed304eebfd5313c06b19` after genuine candidate run 38359650872 passed all jobs and required contexts. [Merge and byte readback](make-native-owner-merge.json) verifies the entire merged tree equals reviewed candidate 4e56448 and all 34 npm payload files equal the recorded source base. This delivers the bounded native-loading observations to the owner without a version, package payload or installed change.

## Super-ux source acceptance

[PR 44 merge and byte readback](ux-merge.json) records normal merge `5482c4762f648ab33f2f9c3a075f2c2866e4bc17` after genuine candidate run 38360566043 passed every job and required context. The merged tree equals reviewed candidate 580e76e; all 34 npm payload files match the pre-change source. Full local implementation gate at 66abd28 passed; successors record evidence and update the measured current validator count after adding links. No package or installed update is claimed.

## Task-pipeline accepted feature delivery

[PR 120 merge and byte readback](tp-feature-merge.json) binds reviewed candidate eb85233 to normal squash merge `9fb9cfb34d83a1395d1d18dbe191d4135395b986` on `feat/release-iteration`. Genuine candidate run 38362221139 passed every job, including all eight negative-test shards and their aggregate. The feature base had no required branch contexts; the watcher explicitly required all genuine jobs rather than inventing required checks. The complete merged tree equals the candidate and all 144 npm payload files match the reviewed ledger cut. Local validation remains explicitly split; the original failed full run was not relabeled. Parent owns subsequent version metadata, main integration and publication.
