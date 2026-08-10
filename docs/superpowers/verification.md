# Verification ledger — sshlg-skills

One row per shipped REQ, and what confirmed it. `green` in a gate means the
suite passed; **`verified` here means a person or a command looked at the thing
itself.** The two are different, and the gap between them is what this file
exists to keep visible.

`/task-pipeline checkup` counts the rows sitting at `never` when no run is in
flight — which is the only moment accumulated unconfirmed work is invisible.

**Started 2026-08-10.** Rows before that date do not exist: this repository
shipped eleven releases without a ledger, and inventing retrospective
verification statuses for them would be the exact failure the `evidence-docs`
router names. What shipped earlier is confirmed by its own CHANGELOG section
and nothing more, and that is stated rather than papered over.

## 2026-08-10 — v0.29.0

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | README and `SECURITY.md` count eight members, not six | `grep -rniE '\bsix\b' README.md SECURITY.md docs/DOCMAP.md` → three hits, each semantically correct ("six of the eight pins", "the first six route to", "the first six have house rules") | verified |
| R-02 | `package.json` description names all eight | script comparing the description against `skills.json` names → `OK all 8 named` | verified |
| R-03 | `git status` free of graphify noise | `git status --short` shows only intended edits; `git submodule status` has no line starting `+` | verified |
| R-04 | `docs/superpowers/backlog.md` seeded, priorities computed | file exists, 8 open rows, every row carries blast/age/effort and a computed `P` | verified |
| R-05 | this ledger | you are reading it | verified |
| R-06 | umbrella `CLAUDE.md` house rules (closes C-06) | file exists; every command it names runs — `npm test`, `python3 test/check_pins.py` | verified |
| R-07 | `routers` reports authored-vs-packaged drift; `--diff` and `--adopt` | 27 fixtures in `test/drift_test.js`; two data-loss defects planted into `bin/sshlg-skills.js` and watched failing, then restored | verified |
| R-08 | packaged text adopted for `super-ux` and `task-pipeline` on this machine | section-level comparison against the pre-run backup: exactly two sections changed per file, bytes outside the block identical; the planning rule greps in both files; three consecutive runs produce identical hashes | verified |
| R-09 | the `agent-sync` root cause recorded rather than fixed | board rows B-01 and B-02 cite run ids `31287012133` and `31352513346` and the awk in `release.yml`; both closed the same day when the agent holding that repo shipped the fix | verified |
| R-13 | `agent-sync` pinned to 1.7.0 — every pin now matches its release | `python3 test/check_pins.py` → `every pin matches its release (npm where published, git tag everywhere)`; the tag's commit `1f1f7b9` equals `origin/main`, and its `package.json` reads 1.7.0 | verified |
| R-10 | gate green, ratchets up not down | `npm test` → 10 checks green (validate.py + 9 suites), 209 fixtures counted; was 8 suites / 182 | verified |
| R-11 | the release | see the row added when the tag's workflow conclusion is read | **never** |
| R-12 | a router the operator never wrote is no longer recorded as theirs | clean-HOME reproduction recorded all eight before the fix and zero after; both fixtures watched failing first | verified |

**At `never`: 1** — R-11, which cannot be anything else until the release
workflow has run and its conclusion has been read rather than assumed.

## What is deliberately not verified here

`agent-sync`'s two defects (B-01, B-02) were recorded, not fixed: another agent
held that repository for the whole run. They shipped both fixes while this run
was in flight, which is why the pin moved — but the fixes are theirs and the
evidence cited here is their CI, not work this run did.

Nothing else about that repository is asserted here.
