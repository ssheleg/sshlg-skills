# Pipeline retrospective — sshlg-skills

One file per project. Stage 0 of every run reads the standing instructions
below **in full** before its first question.

## Standing instructions

Hard cap: ten. Each carries the run stamp it was written at. Retire an entry
the moment any of its three triggers fires — it became a mechanical check, the
paths or commands it names are gone, or it has not fired in five run stamps —
and log the deletion as one line under *Retired*.

1. **(2026-08-05)** `node --check` proves syntax, not scope. Before trusting a
   Node change, **run the command**, not the checker: `--check` passed a
   `rest[++i]` against a variable that does not exist in that function, which
   would have thrown on first use. *(Fired 2026-08-06: `node --check` was
   removed from CI in favour of running the launcher. Retire when a linter with
   scope analysis runs in CI.)*

2. **(2026-08-06)** **Prove idempotence at the layer that repeats, not the
   layer that is easy to test.** A pure core with nine passing
   round-trip fixtures sat under a command whose second run destroyed the file.
   Purity makes a module the obvious place to test; the filesystem-touching
   layer above it is the one a user actually runs twice. Run the real command
   **three times against a real file** and compare hashes — three, because the
   first→second transition can settle a formatting difference that
   second→third would have caught. *(Retire when every file-writing command in
   this repo has a three-run end-to-end fixture in CI.)*

3. **(2026-08-06)** **A date literal in a fixture that a check compares against
   "now" is a test that schedules its own failure.** `brand_lint_test.py` in
   `super-ux` hardcoded `Last calibrated: 2026-08-05` against a check that reads
   `foundation.md`'s **mtime** — which for a fixture is always today. The suite
   was green on the day it was written and red the next, with no code change,
   and nothing in the suite could report that. Compute the boundary date at
   runtime; keep an explicitly stale literal only in the case that must fire,
   and plant against it. *(Retire when CI runs the suite under a faked future
   clock.)*

## Retired

*(nothing yet — the prune at 2026-08-06 checked all three against their triggers:
#1 fired this run, #2 is one run old, #3 is new.)*

## Run stamps

| Date | Task | Commit | Diverged? |
|---|---|---|---|
| 2026-08-05 | Managed global routing block; v0.22.0 (+ super-ux v0.30.2) | — | yes |
| 2026-08-06 | Router registry, pack settings; v0.23.0 → v0.23.1 | `dccc0e8` | yes — see below |
| 2026-08-06 | Cursor skills ported; family 6 → 8 members; v0.26.0 | `f5591b1` | yes — see below |

---

## 2026-08-06 — the feature was fine; shipping it found two ways to lose data

**Symptom.** Three defects, none in the planned work, none found by a test.
Two of them destroyed or overwrote content in `~/.claude/CLAUDE.md` — a file
with no version control behind it.

1. **The second `routers` run destroyed the block the first one wrote.** The
   block is headed `## Роутинг работы — семья ssheleg`; migration's pattern for
   the hand-written rule is `## Роутинг работы`. Run two read the block's own
   heading as user input and cut from there to the next H1 or EOF, taking the
   closing sentinel and every rule below it. Shipped in v0.22.0; reproduced
   against that tag. Found by running the new end-to-end fixture, which failed
   for a reason it was not written to test.

2. **"Hand-written rules win" was true exactly once.** Migration moves the
   operator's wording in and removes the heading it came from, so from run two
   onward nothing identifies the section as theirs and the packaged default
   regenerated over it. **Observed on the operator's live file**, after the
   agent had run the command three times to prove defect 1 was fixed. Recovered
   only from a backup the agent had taken ten minutes earlier.

3. **`--dry-run` under-reported its own removals** — +361/−1 against the real
   file where the run removes 82 lines, because migration deliberately does not
   write on a preview and `apply` re-read the file from disk. Found by reading
   the two numbers, not by a check.

**Owned by** stage 5 for #1 and #3, and stage 7 for #2 — it appeared only when
the command was pointed at the real file, which is the first moment the run had
a file worth preserving.

**Root cause.** Every one of the three is the same shape: **a mechanism trusted
at a layer where its property was never exercised.** Idempotence proven on a
pure function, not the command. A preview computed from a source the wet path
would have rewritten first. Authorship enforced by a marker the same step
deletes.

**Fix, by grade.**

- *Mechanical (taken):* three end-to-end fixtures against a real file — the
  second run, a hand edit made inside the block afterwards, and a preview that
  must show a `-` line. Each planted and watched failing. Plus a guard on the
  CI entry point that itself shipped wrong (it matched a substring the negative
  self-tests satisfy) and was tightened only after being planted.
- *Standing instruction (taken, #2 above):* prove idempotence at the layer that
  repeats.
- *Carry-over (C-09):* a command that edits an unrecoverable file should take
  its own backup. Today the backup existed because the agent chose to make one,
  which is not a mechanism.
- *Note, expires 2026-08-20:* after fixing a loud failure, re-run the whole
  flow rather than the fixture that just went green. Defect 2 had been sitting
  under defect 1 the entire time and was unreachable while the block was being
  corrupted first.

**The check that catches it next time:** the three-run end-to-end fixture
catches #1 and #2 mechanically. #3 is caught by a fixture now, but was found by
a human reading two numbers — and nothing schedules that. That is the honest
gap, and it is why the standing instruction is about running things rather than
about a particular bug.

**One more, cheap and repeated.** The fixture count was wrong in three
documents before it was right: the v0.22.0 notes said 71, its acceptance record
said 74, the count at that commit is 75. Both restated numbers were wrong; the
counted one was right. The `evidence-docs` router shipped in this release says
exactly that, and the argument for it came from this repository's own
paperwork.

---

## 2026-08-06 (second run) — the port went fine; the thing it found was a test that had already expired

**Symptom.** CI failed on the `super-ux` PR. Two of 38 brand-linter checks, in
code the PR never touched. Reproducing on `origin/main` showed `main` had been
red since the previous day.

`B005` compares `docs/ux/foundation.md`'s **mtime** against the voice pack's
`Last calibrated` header. A fixture's files are written now. The fixture
hardcoded `Last calibrated: 2026-08-05`. So the check was satisfied on
2026-08-05 and violated from 2026-08-06 onward — **the suite scheduled its own
failure on the day it was written, and was green at the moment anyone would have
looked.**

**Owned by** whichever run wrote that fixture, at the stage that reviews tests.
Found by this run only because a red CI on an unrelated PR forced the question
"is this mine?", and answering it honestly meant checking `origin/main` before
assuming.

**Root cause.** Same shape as this file's previous entry: **a mechanism trusted
at a layer where its property was never exercised.** Last time, idempotence
proven on a pure function rather than the command that repeats. This time, a
time-dependent comparison proven on the one day it could not fail.

**Fix, by grade.**

- *Mechanical (taken):* the fixture computes its calibration date at runtime, so
  the baseline cannot expire. The B005-positive case keeps an explicit
  `2020-01-01` and was **planted against** — setting it to today makes the suite
  fail, which is how we know the check is alive rather than merely quiet.
- *Standing instruction (taken, #3 above).*
- *Carry-over (C-13):* B005 reads mtime, not a recorded change date. A fresh
  `git checkout` rewrites mtime, so the check can fire falsely on a clean clone.
  The fixture is fixed; the mechanism is still time-of-checkout sensitive.

**One more, from the same run and worth the line.** A guard I wrote in the new
`agent-stack` validator — "CI must still call the validator" — passed against its
own planted defect on the first attempt, because it grepped for the substring
`test/validate.py`, which the negative self-tests in the same file satisfy with
paths like `/tmp/drift-copy/test/validate.py`. **The v0.22.0 retro records that
exact failure, in this repository, six weeks ago.** Writing the guard did not
protect me from it; planting against it did. That is the argument for planting,
stated better than any rule could: a check nobody has watched fail is not
evidence, and knowing the lesson is not the same as being protected by it.

### Addendum, same run — the url that worked on exactly one machine

`gh repo create --source .` sets an **SSH** remote, and `git submodule add`
inherits it. The six older members are HTTPS; the two I added were
`git@github.com:`. Everything local stayed green — clone, validator, launcher,
`npm test` — because this machine has the key. The release smoke test runs
`npx github:ssheleg/sshlg-skills#<tag>`, which initialises submodules, and it
exited **128**.

**No standing instruction for this one, deliberately.** The grade above a
standing instruction is a mechanical check, and one exists now: the validator
requires every `.gitmodules` url to be HTTPS, planted against, with a negative
self-test in CI. A rule telling a future agent to "remember the url scheme"
would be strictly worse than a check that refuses the commit.

It belongs in this file anyway, because the shape is the same one this document
keeps recording: **a property that holds only where it was created**. Idempotence
on the pure function, not the command. A calibration date true on the day it was
written. A url valid on the machine that typed it.
