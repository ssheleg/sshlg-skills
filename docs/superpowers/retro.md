# Pipeline retrospective — sshlg-skills

One file per project. Stage 0 of every run reads the standing instructions
below **in full** before its first question.

## Standing instructions

Hard cap: ten. Each carries the run stamp it was written at. Retire an entry
the moment any of its three triggers fires — it became a mechanical check, the
paths or commands it names are gone, or it has not fired in five run stamps —
and log the deletion as one line under *Retired*.

1. **(2026-08-13) A component that never receives its input fails OPEN, and from
   the outside it is indistinguishable from one that approves.** The stage-7
   release gate shipped its first draft feeding its own python source to
   `python3 -` through a heredoc **and** reading the hook payload from stdin. The
   heredoc *is* stdin, so the payload came back empty, every act classified as
   "not a release", and the gate allowed `git tag`, `npm publish` and `gh release
   create` — while `/hooks` listed it, the process exited 0, and nothing anywhere
   said a word. Eight fixtures caught it; no amount of reading would have.
   **Assert the input arrived** before deciding on it, and let a guard that
   received nothing refuse rather than pass. *(Retire when every guard in the
   family asserts a non-empty payload, or after five run stamps without firing.)*

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

5. **(2026-08-10) A gate that reads repositories you do not control is racy,
   and fixing the one item it named is a loop.** `check_pins.py` requires every
   member pinned at its latest release. Two CI runs failed in a row while this
   release was being built — `task-pipeline` cut 1.39.0, then `super-ux` cut
   0.34.0 — and each fix addressed exactly the member the log named. The second
   failure is the tell: re-measure **every** member in one sweep before pushing
   again, and if the sweep is still moving, say so instead of pushing a third
   time. *(Retire when the release workflow bumps pins itself, or after five
   run stamps without firing.)*

6. **(2026-08-12) A negative self-test anchored on prose stops planting the
   moment the prose is reworded, and then reports the guard it can no longer
   disarm as broken.** Three times in one session: `make-skill`'s plant rewrote
   the literal *the fourteen asked for most often* and no-oped against `ten`;
   `agent-sync`'s searched the old awk pattern and no-oped once B-11 widened it;
   `agent-stack`'s replaced `"token wallet".` and no-oped once the description
   was compressed — that one turned **every push red for a validator that was
   fine**. Anchor a plant on the file's SHAPE (a front-matter key, a JSON field,
   a structural marker), and make it `assert` that it changed something, so a
   layout change fails there saying so instead of quietly testing nothing.
   Corollary for any plant: verify the file actually changed before believing
   the result — a green suite after a no-op plant is the same output as a green
   suite after a real one. *(Retire after five run stamps without firing, or
   once every plant in the family is structural.)*

## Retired

- **#1 (2026-08-05) — `node --check` proves syntax, not scope.** Retired
  2026-08-13 on its cold trigger: it last fired on 2026-08-06 and has now missed
  far more than five run stamps. The mechanical check that replaced it is real —
  CI runs the launcher rather than the checker — which is the grade above a
  standing instruction, and the slot is worth more than the reminder.

*(prune at 2026-08-13: #1 retired above on its cold trigger. #2 fired — the
three-run end-to-end fixture is what found the same-second backup collision.
#4 fired twice — "the gate allows everything" and "eight fixtures fail identically"
are both uniformity readings. #5 fired: the pin sweep found three members released
mid-flight rather than the one a log named. #6 fired: two CHANGELOG plants reported
PLANT DID NOT LAND against a new section that stated no guard count. **#3 did not
fire and is NOT retired**, deliberately — its cold trigger is five run stamps, and
between v0.32.0 and v0.41.1 nobody stamped a run, so the counter it would be judged
by was stopped. Retiring on a stopped clock is not a retirement. Six of ten slots
used.)*

*(superseded — the prune at 2026-08-10 (second run) checked all five against
their triggers: #1 has now missed four stamps of its five; #2 fired this run
(the planted removal proved reconciliation at the command layer, and three runs
proved idempotence); #3 did not fire and is three runs old; #4 fired twice —
a probe that returned "absent" for four files including two that predate this
run, which was the node schema and not the graph; #5 is new. Five of ten slots
used.)*

*(superseded — the earlier prune note from this date:
#1 last fired at stamp 2 of 4; #2 fired twice; #3 did not fire; #4 was new.)*

## Run stamps

| Date | Task | Commit | Diverged? |
|---|---|---|---|
| 2026-08-05 | Managed global routing block; v0.22.0 (+ super-ux v0.30.2) | — | yes |
| 2026-08-06 | Router registry, pack settings; v0.23.0 → v0.23.1 | `dccc0e8` | yes — see below |
| 2026-08-06 | Cursor skills ported; family 6 → 8 members; v0.26.0 | `f5591b1` | yes — see below |
| 2026-08-10 | Repo actualised: pins, docs, drift report; v0.29.0 | `709b017` | yes — see below |
| 2026-08-10 | B-09: update reconciles; defaultAgents +2; v0.30.0 | `8af291d` | yes — see below |
| 2026-08-11 | The map, four channels, auto-refresh; v0.31.0 | `ea63262` | no — the plan held |
| 2026-08-11 | The block was the most expensive thing we shipped; v0.32.0 | `810a0e1` | **not recorded** |
| 2026-08-12 | The audit becomes a gate; the validator looks both ways; v0.33.0 | `c8f2495` | **not recorded** |
| 2026-08-12 | A member grew a capability the catalogue never mentioned; v0.34.0 | `993fcae` | **not recorded** |
| 2026-08-12 | The backup stopped being a habit; v0.35.0 | `c370e37` | **not recorded** |
| 2026-08-12 | The map outranks doctrine another pack injects; v0.36.0 | `2549513` | **not recorded** |
| 2026-08-12 | The pin gate stopped failing for other people's releases; v0.37.0 | `c17c327` | **not recorded** |
| 2026-08-12 | The npm half of the pin check had been inert for six members; v0.38.0 | `33283ef` | **not recorded** |
| 2026-08-12 | Four installers stop leaving their skill unrouted (B-06); v0.39.0 | `526b5aa` | **not recorded** |
| 2026-08-12 | task-pipeline 1.49.2, sheleg-design 1.19.0; v0.40.0 | `3aa560e` | **not recorded** |
| 2026-08-12 | The family engages by itself, through three hooks; v0.41.0 → v0.41.1 | `2a4c68a` | **not recorded** |
| 2026-08-13 | Agent-time enforcement: hooks that hold; v0.42.0 (+ task-pipeline 1.50.0) | `d23ee2f` | yes — see below |

**The eleven rows above were reconstructed, and one column is deliberately
empty.** Between v0.32.0 and v0.41.1 nobody stamped a run; the dates, titles and
commits are computable from `git log` and are therefore stated, but *did this run
diverge* is not computable from a commit, and answering it would be inventing the
answer this table exists to preserve. `not recorded` is the true value.

The cost is exact and worth naming: the cold-retirement trigger for a standing
instruction is *five run stamps without firing*, and for ten days that counter
could not advance. Every prune in that window compared instructions against a
clock that had stopped.

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

---

## 2026-08-10 (second run) — the command that reported success for work it had not done

**Symptom.** `update` could not deliver a family member that had reached no
channel, and it said it had. `skills update <id>` is a no-op for a skill
installed nowhere — but not a silent one: it prints
`✓ All global skills are up to date` about a skill that does not exist. The
launcher issued only that verb, once per declared id, so the run scrolled
nineteen confident lines while seven of those nineteen skills were absent from
the hub entirely.

Watched, not inferred: `agent-orchestrator` was removed from the hub and from
all six symlink channels to reproduce the state a never-installed member is in,
`skills update agent-orchestrator` was run against it, and it reported the
green line and restored nothing.

**Owned by** the stage that reviews a contract. `install` and `update` built
their skills-CLI argv in two independent places. Each read correctly on its
own; they disagreed only about a case neither of them mentioned, which is
precisely the case no reviewer looks for.

**Root cause.** **A verb chosen for the common case, applied as if it covered
the boundary.** `update` is the right word when the thing exists. Nothing in
the code said what it meant when the thing did not, so the answer was inherited
from a dependency — and the dependency's answer was to congratulate the caller.

**Fix, by grade.**

- *Mechanical (taken):* one builder, `lib/plan.js`, for both commands, with a
  fixture asserting their `add` commands are byte-identical. `update` now
  reconciles: refresh, then add.
- *Mechanical (taken):* the shadow prune no longer hangs off "is this run
  touching plugins" — it matches a plain copy against an installed plugin of
  the same **member**, by marketplace rather than skill id.
- *Standing instruction (taken, #5):* a gate reading repositories you do not
  control is racy; re-measure all of it at once rather than fixing the item the
  log named.

**The one this run created itself.** Teaching `update` to call `skills add`
handed it the auto-detect side effect `install` always had: the skills CLI
writes `~/.claude/skills/<id>` for an agent nobody asked for. `install` prunes
that; `update --no-claude` did not, because the prune's condition was a proxy.
A `task-pipeline` copy appeared beside the `task-pipeline` plugin **during the
very run that was proving the fix**, and it was caught by the invariant check
at the end of a verification block — not by a test, which did not exist yet.

That is the same shape this file keeps recording, arriving from a new
direction: **a condition that stands in for the real one holds until something
changes on the other side of it.** Idempotence proven on the pure function.
A calibration date true on the day it was written. A url valid on the machine
that typed it. And now: a prune guarded by a flag about intent, protecting
against a side effect that has nothing to do with intent.

**Two failed CI runs before the tag, and both were right.** `task-pipeline` cut
1.39.0 and `super-ux` cut 0.34.0 while this release was being assembled, each
invalidating the pin gate. Reading the verdict **before** tagging is what kept
a broken release from being published twice; fixing only the member the log
named is what made it happen twice. Instruction #5 exists so the third time is
a sweep.

---

## 2026-08-11 — the run that did not diverge, and the one measurement that made it possible

**No entry is owed here**: the plan held, nothing was undone, and the two
defects the build produced were both predicted by the design and closed inside
it. Recorded anyway, because *why* it held is reusable.

The task arrived as "package it into one architecture so agents understand it".
The tempting build was a catalogue — nineteen skills and twenty commands
written into the operator's global instructions. What stopped it was one
measurement taken before any design: the block named 6 of 20 commands, 8 of 19
skills and 6 of 8 members. That number showed the gap was real, and a second
look showed the catalogue would have been the wrong fix — the runtime already
supplies every description, so the copy would have been a second home for one
fact, stale by the next release and charged to context in every session of
every project.

**The generalisation worth keeping: measure the gap before choosing the fix,
because the size of a gap and the shape of its fix are different questions.**
Had the block named 0 of 20, a catalogue would still have been wrong. Had it
named 20 of 20, there would have been no task. The number justified acting; it
did not choose the action.

Two things the design predicted and the build confirmed, both of the same
shape — *a new artifact has nowhere to land on a machine that predates it*:

- a block written before the map carries no MAP sentinels, so a refresh finds
  nothing to replace. Insert after the heading instead.
- a target added in a later release is never created by `update`, which
  refuses to create blocks. Where consent is **on record** that refusal was
  protecting nobody: Gemini would have been refreshed on zero machines and
  reported as shipped.

The second one is the more valuable, because it is the general form of a defect
this repository has now seen three times: **a rule written to protect a first
run, still applied on the hundredth.** "Never create without consent" is right;
"consent means this file" was the unexamined half.

**And standing instruction #5 paid for itself the first time it fired.** CI went
red on the pin gate; instead of bumping the member the log named, the sweep
measured all eight — `task-pipeline` had moved 1.39.0 → **1.44.0**, five
releases in a day, and it was the only one behind. One push, green first try,
where the previous release took three.

---

## 2026-08-13 — the run that nearly built a second lock, and the gate that approved everything

**Symptom.** Three defects, none in the planned work, and every one found by a
fixture written to test something else. Plus one whole requirement that turned
out to be finished before the run started.

1. **The stage-7 release gate allowed every release, silently.** Its first draft
   fed its own python source to `python3 -` through a heredoc and read the hook
   payload from stdin. The heredoc *is* stdin. `sys.stdin.read()` returned empty,
   an empty payload classified as "not a release", and `git tag`, `npm publish`
   and `gh release create` all sailed through — while the hook was listed,
   exited 0, and said nothing. Eight of sixteen fixtures failed on the first run.
2. **Two backups of one file inside the same second were one backup.** The stamp
   resolves to the second and an agent edits faster than that, so the second copy
   took the first one's name. Found by the end-to-end fixture *while it was
   failing for an unrelated reason* — the plant it used (an unwritable backup
   directory) did not work, because rewriting an existing file needs no directory
   permission, and the existing file was the copy taken one second earlier.
3. **`cp FILE FILE.2026-08-12` read as overwriting FILE.** The guard treated
   every argument of every write verb alike, so an agent taking a backup by hand —
   the exact habit this pack replaces — was classified as destroying the file.

**And the requirement that was already met.** REQ-010 asked for lease enforcement
in `agent-sync`. Opening that repository showed
`plugins/agent-sync/hooks/hooks.json` already wiring a `PreToolUse` guard, doing
it more thoroughly than the spec proposed: it tokenises `git commit` so
`git -C dir commit` cannot slip past — a spelling that once skipped that guard for
a full day — and exits 2 on internal failure so it cannot fail open. Building the
frontmatter version would have created a second enforcement path for one
invariant.

**Owned by** stage 5 for the three defects and stage 0 for the fourth: the
harvest read this repository's docs and the machine's, and never opened the
member that owns the invariant a requirement was written about.

**Root cause.** Two, and they are different.

The three defects are the shape this file keeps recording — *a property proven at
a layer where it was never exercised*. Uniqueness of a backup name was proven by
fixtures that each passed their own distinct stamp. The write-verb table was
proven against commands with one path in them.

The fourth is new and worth its own sentence: **a requirement can be written
against a gap that no longer exists, and the brief will carry it to the end of
the run.** The REQ spine is frozen so scope cannot shrink silently; nothing in it
asks whether the gap is still there. Freezing protects against forgetting, not
against being out of date.

**Fix, by grade.**

- *Mechanical (taken):* the payload travels in the environment, with a CI negative
  self-test that blanks the handoff and requires the suite to notice; `save()`
  suffixes a colliding name and a fixture proves two copies in one second are two
  copies; write verbs are split into "writes every argument" and "writes the last
  one", with `cp X X.dated` as a fixture.
- *Standing instruction (taken, #1 above):* a component that never receives its
  input fails open and looks installed.
- *No instruction for the fourth, deliberately.* The grade above one is a check,
  and the honest check is procedural: stage 0's harvest already says to read what
  the project knows — the gap was that "the project" meant this repository. The
  brief's source ledger now carries a row per member repository consulted, which
  is a change to the artifact rather than a rule to remember.

**The check that catches it next time.** The first three are caught mechanically
now. The fourth is caught by the ledger only if someone reads it, and that is
stated rather than papered over.

**One more, cheap and repeated — the count that was wrong in a document again.**
The ratchet line was written as 422 fixtures from a count taken before five more
were added, and corrected to 427 by re-running `npm test`. That is the third time
this repository has recorded the same class, and the rule it keeps proving is its
own: a number is computed at the moment it is written, or it is a recollection.
