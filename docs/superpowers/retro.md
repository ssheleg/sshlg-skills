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

4. **(2026-08-10) A measurement that returns the same answer for every input is
   a broken measurement, not a finding.** Five CLI invocations were checked for
   their exit codes and all five returned 2 — including the one that had just
   printed a success message. The tempting reading was five bugs; the real one
   was that zsh does not word-split an unquoted `$args`, so every case ran as a
   single unknown command. Uniformity across inputs that should differ is a
   fact about the instrument. *(Retire when a fixture harness makes ad-hoc
   shell measurement unnecessary, or after five run stamps without firing.)*

## Retired

*(nothing yet — the prune at 2026-08-10 checked all four against their triggers:
#1 last fired at stamp 2 of 4, so its five-stamp clock has not run out; #2 fired
this run, twice (the three-run hash comparison, and testing the command rather
than only the pure core); #3 did not fire and is two runs old; #4 is new. Four
of ten slots used.)*

## Run stamps

| Date | Task | Commit | Diverged? |
|---|---|---|---|
| 2026-08-05 | Managed global routing block; v0.22.0 (+ super-ux v0.30.2) | — | yes |
| 2026-08-06 | Router registry, pack settings; v0.23.0 → v0.23.1 | `dccc0e8` | yes — see below |
| 2026-08-06 | Cursor skills ported; family 6 → 8 members; v0.26.0 | `f5591b1` | yes — see below |
| 2026-08-10 | Repo actualised: pins, docs, drift report; v0.29.0 | `709b017` | yes — see below |

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

---

## 2026-08-10 — the update that could never arrive, and the map that answered the wrong question

**Symptom.** The task was housekeeping: move stale pins, fix a member count,
tidy the docs. Two of the three named defects were real and small. The third —
"the routing block on this machine is out of date" — turned out not to be a
content problem at all.

`bin/sshlg-skills.js` recorded **every** router as the operator's own work, on
the first run of any machine. `migrate()` returns
`Object.assign({}, fallbacks, extracted)`, because its job is to supply a body
for each section; the command read that map as *"which of these did a person
write"* and called `authoredSet` on all eight keys. An authored entry beats the
packaged text on every later run, so one `routers` run froze the block forever.
The pack could ship a reworded router in every release from then on and it
would never reach a single machine.

Reproduced on a clean `HOME`: eight authored entries after one
`routers --update`, on a file that had never contained a hand-written rule.

**Owned by** the stage that reviews a contract — the function's own doc comment
says the two halves are different, and the caller's comment asserts they are the
same ("whatever migration just moved is the operator's"). Both were written in
the same release. Found only because the drift report added this run named two
routers, and the obvious next question — *why can I not adopt them?* — had no
answer that fit the code as documented.

**Root cause.** The shape this file keeps recording, in a new place: **a
property that holds only where it was created.** `routers` is authoritative for
*what body goes in this section*. Nothing about it is authoritative for *who
wrote it*, and the merge that makes it useful for the first question is exactly
what makes it wrong for the second.

**Fix, by grade.**

- *Mechanical (taken):* `migrate()` also returns `migrated` — the names it
  actually cut out of the file — and the command iterates that. Two fixtures:
  a clean `HOME` must record zero, and a genuinely hand-written heading must
  still be recorded. Both watched failing first.
- *Mechanical (taken):* adoption is write-once. `adopted:<name>` is the only
  surviving copy of what the operator wrote, and the over-recording defect
  proved an authored entry can reappear by a route nobody planned — so a second
  adoption must not park today's text over yesterday's. Planted against.
- *No standing instruction, deliberately.* The grade above one is a check, and
  two exist now. A rule saying "think about what a map means" would be strictly
  worse than a fixture that refuses the commit.

**Two smaller ones from the same run, both about instruments.**

The no-filesystem guard for `lib/drift.js` failed on its first run — against
the doc comment that **explains the rule**, which contains the literal
`require('fs')`. A guard firing on its own prose. This repository has recorded
the substring-grep failure twice already, and the tempting fix both times is to
reword the prose; the right one is to strip comments before scanning, because
the check is supposed to read code. Then plant a real require and watch it fire.

And the exit codes: five invocations, five identical results, including for a
case that had just printed success. Standing instruction #4 came from that. The
uniformity was the tell, and it was nearly read as five bugs instead of one
broken shell loop.

**What the run got for free, and did not take.** `agent-sync`'s three failed
releases traced to one letter — `awk '$0 ~ "^## " v'` against a CHANGELOG
writing `## v1.5.2`. Another agent held that repository, so this run wrote the
diagnosis down with run ids instead of fixing it. They shipped the same fix
ninety minutes later, and the pin moved here as a result. **Recording a finding
you are not allowed to act on is not a consolation prize** — it is what let the
umbrella close its last red pin the moment there was something to point at.
