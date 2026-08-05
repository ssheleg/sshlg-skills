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
   would have thrown on first use. *(Retire when a linter with scope analysis
   runs in CI.)*

## Retired

*(nothing yet)*

## Run stamps

| Date | Task | Diverged? |
|---|---|---|
| 2026-08-05 | Managed global routing block; v0.22.0 (+ super-ux v0.30.2) | yes — see below |

---

## 2026-08-05 — the build kept correcting the design

**Symptom.** Four divergences, none of them coding mistakes in the ordinary
sense; each was a document that was wrong and only proved wrong by execution.

1. **The spec contradicted itself.** It promised both "a recorded answer is
   never re-asked" and "deleting the block is opt-out forever". An operator who
   consented once and later deleted the block would be silently rewritten by
   one rule and permanently silenced by the other. Surfaced at task 7, when the
   two rules had to be implemented in one function.
2. **The plan understated task 10.** It said "modify the member's installer",
   which hid an architectural fork: the writer lives in the launcher and the
   member is a separate zero-dependency package. Vendor and drift, or depend
   and lose the zero-dep property, or delegate. Surfaced only when the file was
   opened.
3. **Two fixtures were weaker than they read.** One asserted a section's index
   was below the table's — true even when the section had been written outside
   the block entirely. One suite reported green on a code path that had never
   executed, because every fixture created only one of the two agent homes.
4. **A REQ row outlived its decision.** R-07 kept promising behaviour that
   iteration 9 had deliberately replaced.

**Owned by** stages 3 and 4. A spec's internal contradiction and a plan's
hidden fork are both findable by reading, and neither was found by reading.

**Root cause.** Prose can hold two incompatible rules without discomfort;
code cannot. Every one of these survived review and died at the first line
that had to satisfy both halves at once.

**Fix, by grade.**

- *Mechanical (taken):* the ladder walk at stage 10 now has two more fixtures
  behind it — R-11's untested target and R-07's amended row are both closed by
  executed checks rather than by a note.
- *Standing instruction (taken, #1 above):* run the command, not the checker.
- *Note, expires 2026-08-19:* when a fixture asserts an index or an ordering,
  ask what it would still pass with the artifact removed entirely. Position is
  not containment.

**The check that catches it next time:** none of the four would have been
caught by a check. Three were caught by writing the code and one by walking
the ladder — which is the argument for both, and the reason the ladder walk is
not optional.
