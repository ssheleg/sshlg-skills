# Acceptance — agent-time enforcement (v0.42.0 + task-pipeline 1.50.0)

## The ladder walk, first

The REQ table finds what was named and lost. It cannot find what was never
named, because a comparison needs two sides. So every row was walked bottom-up —
decision → spec section → contract *and its failure behaviour* → task → change →
executed test → surface and docs — and the seam checked at each step.

**One absence, and it was real.** The repository gate (REQ-003, REQ-004) had a
decision, a spec contract, a pure core, fixtures, a process-level fixture and a
CHANGELOG entry — and **no surface**. `.claude/settings.json` is committed, so a
clone arrives with a hook that can refuse the contributor's commit, and nothing a
contributor reads said so. Filed as REQ-017 and closed in the same pass: README
gained *Working on this repository — the gate arrives with the clone*, naming both
hooks, the 3.3 s that makes the gate honest, and how to remove it.

Three seams were checked and held: every pure core has both a unit fixture and a
process-level one; every refusal names its remedy in the same sentence (asserted,
not assumed); and every number that reached a document was recounted rather than
carried — which is how the ratchet line was caught saying 422 when the count was
427.

## The table

| REQ | Verdict | Evidence |
|---|---|---|
| REQ-001 | ✅ | `guard_test.js` 25 · e2e allow-with-copy and deny-with-untouched-file |
| REQ-002 | ✅ | 8 write forms, 2 spellings, 6 near misses; `cp FILE FILE.dated` watched failing |
| REQ-003 | ✅ | `repogate_test.js` 13 · e2e against a project whose suite fails on demand |
| REQ-004 | ✅ | folded `description: >-` watched failing, then fixed |
| REQ-005 | ✅ | `hygiene_test.js` · the launcher itself asserted **not** denied |
| REQ-006 | ✅ | `shadow_test.js` 9 · the differing-name case · the launcher-mid-run false positive |
| REQ-007 | ✅ | four keys and the commented QMD block · merge direction watched failing |
| REQ-008 | ✅ | corpus **18/20** (was a measured 11/20) · boundary removal watched failing |
| REQ-009 | ✅ | `release_gate_test.py` 16, **eight watched failing** · CI plant run locally first |
| REQ-010 | ✅ | **already enforced upstream** — `agent-sync` `hooks/hooks.json` + `guard.sh`; nothing built |
| REQ-011 | ✅ | title on `startup`, none on `compact`; `watchPaths` carries the ledger |
| REQ-012 | ✅ | one key only; allowlist rejects OSC 8/52/1337 and CSI |
| REQ-013 | ✅ | `ConfigChange` asserted **silent**; record → next `SessionStart` reports → repair clears |
| REQ-014 | ✅ | three real runs, identical hashes; `remove` restores the pre-install bytes |
| REQ-015 | ✅ | DOCMAP (7 homes, 2 propagation rows, ratchet 23/427), README, CHANGELOG, CLAUDE.md |
| REQ-016 | ✅ | appended mid-run: `settings.json` joined the protected set |
| REQ-017 | ✅ | appended by the ladder walk: the project gate is documented where a contributor reads |

**17 of 17.** Two rows were appended during the run and neither was removed or
narrowed; REQ-010 closed without a line of new code, which is a different verdict
from "done" and is written as one.

## Gates

| Gate | Verdict | Beside it |
|---|---|---|
| `npm test` (umbrella) | ✅ 24 checks — validate.py + 23 suites, **427 fixtures** | ratchet raised from 16/303 |
| `npm run test:all` (task-pipeline) | ✅ in CI · locally one guard is broken **in a submodule checkout only**, reproduced on pristine `HEAD` and filed as B-17 | not this change |
| CI `validate` — task-pipeline PR #41 | ✅ pass, read before the tag | 13m55s |
| CI `validate` — umbrella | ✅ success, read before the tag | |
| `check_pins.py` | ⚠️ exit 2 — three members released mid-flight; every pin exists, so v0.42.0 installs what it advertises | B-16 |
| Board | **6 open** — B-07, B-08 (both waived) + B-16…B-19 | counted from the Status column |
| Carry-over | 6 rows: 2 closed by decision, 4 given board ids | |
| Verification ledger | 17 rows added, all `verified` | 4 rows elsewhere still sit at `never` |

*Green is not verified.* Every row above cites the command or fixture that looked
at the thing itself, and where a claim rests on a document rather than a
measurement it says so.
