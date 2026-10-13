# R30 source acceptance receipts

Scope: owner validator corrections, actual negative controls and normal source integration. Existing published npm payloads are compared byte-for-byte; this packet does not change versions, tags, hub pins or installed state.

The machine-readable `readback.json` records only completed merges whose entire Git tree equals the reviewed candidate and whose npm payload hashes match the prior source. CI identity is an exact candidate `pull_request` run; every returned job and every required context passed before normal `--match-head-commit` squash merge. No administrator bypass or force push was used.

## Owner evidence

Each owner keeps its implementation, baseline plants, focused controls, local full-gate log hashes and payload manifest under `docs/evidence/runs/2026-10-13-r30-owner-gates/README.md` at the source commit recorded in the receipt. Local full gates are bound to their measured implementation SHA; the subsequent receipt-only commit is not misrepresented as a repeated local gate. Hosted candidate checks cover the exact successor head.

Agent-sync, make-skill, sheleg-dev and design adopt the reviewed board/release contract. Task Pipeline composes the accepted feature and source-backed ledger before the guard change. UX changes only release validation; its board validator was already rejecting the actual board plants. The bounded YAML grammar is not an arbitrary YAML/shell interpreter, and annotation guarding is an aggregate runtime-regression claim rather than structural-only enforcement.

## Handoff

Only entries present with completed merge evidence are accepted here. Other owner candidates remain pending their own local/peer/hosted gates. Next: the hub coordinator reconciles these source successors into the later approved pin wave and regenerates its source inventory; do not retag an existing release or claim global installation from source acceptance. Native discovery, model invocation and task-quality evidence remain separate.
