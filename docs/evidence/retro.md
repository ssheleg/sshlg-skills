# Pipeline retrospective — sshlg-skills

One file per project. Stage 0 of every run reads the standing instructions
below **in full** before its first question.

## Standing instructions

**Ids are allocated once and never reused.** A retirement leaves its slot **vacant** —
the list is deliberately non-contiguous — because published CHANGELOGs and merged PR
bodies cite these numbers, and renumbering silently rewrites what they say. The next
instruction takes `max(every id this file has ever held) + 1`, never the lowest gap.

**One collision already exists and is not being rewritten.** `#1` was retired on
2026-08-13 (*"`node --check` proves syntax, not scope"*, 2026-08-05) and the slot was
immediately refilled by *"a component that never receives its input fails OPEN"*. Both
have citations in shipped documents. Renumbering either would make a published sentence
point at a rule it never meant, so the collision is recorded here instead: **a citation
of `#1` dated before 2026-08-13 means the `node --check` rule; after it, the fail-open
rule.** `test/validate.py` refuses any *further* reuse, which is the part that can still
be prevented.


Hard cap: ten. Each carries the run stamp it was written at. Retire an entry
the moment any of its three triggers fires — it became a mechanical check, the
paths or commands it names are gone, or it has not fired in five run stamps —
and log the deletion as one line under *Retired*.

1. **(2026-08-13) A component that never receives its input fails OPEN, and from the outside it is indistinguishable from one that approves.** *(Retire when every guard in the family asserts a non-empty payload, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:087110a2901f

2. **(2026-08-06)** **Prove idempotence at the layer that repeats, not the layer that is easy to test.** *(Retire when every file-writing command in this repo has a three-run end-to-end fixture in CI.)* story: retro/2026-Q4.md sha256:5fdf115018d7

*(3 — retired 2026-08-13 on its cold trigger; see Retired. The number is left
vacant rather than reused: two CHANGELOGs and a merged PR body already cite these
instructions by number, and renumbering would rot every one of those references.)*

4. **(2026-08-10) A measurement that returns the same answer for every input is a broken measurement, not a finding.** *(Retire when a fixture harness makes ad-hoc shell measurement unnecessary, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:2b7305559701

5. **(2026-08-10) A gate that reads repositories you do not control is racy, and fixing the one item it named is a loop.** *(Retire when the release workflow bumps pins itself, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:7528bd535949

6. **(2026-08-12) A negative self-test anchored on prose stops planting the moment the prose is reworded, and then reports the guard it can no longer disarm as broken.** *(Retire after five run stamps without firing, or once every plant in the family is structural.)* story: retro/2026-Q4.md sha256:bb04a1b77ef0

7. **(2026-08-13) A mechanical rewrite over prose cannot tell a path being USED from a path being DISCUSSED, and its exclusion list describes the tree it was written against, not the tree it will walk.** *(Retire when a rewrite tool in this family refuses to write inside a frozen record, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:e6d046096602

8. **(2026-08-13) A wrapper's exit status is not the suite's verdict.** A
   background command reported `exit code 0` while its own output said
   `FAIL: 2 guard(s) did not fire, 24 test(s) broken`, and a piped
   `npm test | tail` printed `[exit ]` because `PIPESTATUS` is not `pipestatus` in
   this shell. Both would have been read as green by anything that trusted the
   number. Read the output, and where a number is needed, get it from the command
   itself rather than from whatever wrapped it. *(Retire after five run stamps
   without firing.)*

9. **(2026-08-14) A verdict belongs to an artifact by identity, not by recency — `--limit 1` answers about whatever finished last.** *(Retire when a release helper in this family resolves its own run by tag, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:b24cedf468c7

10. **(2026-08-14) A check that reads a working tree reports a state no clone can reproduce.** *(Retire when every guard in this family reads through `git ls-files` or `git show`, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:f0e232ea3881

11. **(2026-08-14) When a new check goes red, suspect the checker before the subject — and prove it against a case you already know is clean.** *(Retire when every check in this family ships with a known-clean fixture beside its planted one, or after five run stamps without firing.)* story: retro/2026-Q4.md sha256:0b9a283b8a08

## Retired

- **#3 (2026-08-06) — a date literal in a fixture compared against "now" schedules
  its own failure.** Retired 2026-08-13 on its cold trigger, at the second time of
  asking and the first time the clock was honestly running. The 2026-08-13 prune
  refused to retire it because nine releases had gone unstamped and *"retiring on a
  stopped clock is not a retirement"*. The clock restarted: counting only stamps
  whose divergence is actually **recorded** — the reconstructed `not recorded` rows
  cannot testify about whether an instruction fired during them — it has now missed
  seven. Its mechanical replacement never arrived (CI still does not run under a
  faked clock), and that is stated rather than implied: this is a cold retirement,
  not a solved problem. The original text is in `docs/evidence/retro/2026-Q3.md`.
- **#1 (2026-08-05) — `node --check` proves syntax, not scope.** Retired
  2026-08-13 on its cold trigger: it last fired on 2026-08-06 and has now missed
  far more than five run stamps. The mechanical check that replaced it is real —
  CI runs the launcher rather than the checker — which is the grade above a
  standing instruction, and the slot is worth more than the reminder.

*(prune at 2026-08-13, fourth run: **#3 retired** above on its cold trigger, its slot
left vacant rather than reused — published citations use these numbers (B-23). #1 fired:
the injector check refuses to answer from a registry it could not read, and the refusal
was watched. #2 fired: the three-run fixture found `migrate-artifacts` backing up when
nothing moved. #4 fired TWICE, both in this run's own instruments — a shell loop
reporting `0 0 0` for all seven repositories, and a second reporting an empty `want=` for
all six packages; both were zsh declining to word-split an unquoted variable. #5 fired:
the pin sweep found `sheleg-design` three releases behind, not the one the last sweep
recorded. #6 fired twice — a guard left with no subject and a plant that reported
`PLANT DID NOT LAND`. #7 and #8 are new. Seven of ten slots used, one vacant.)*

*(prune at 2026-08-14: **no retirement**, and the reasoning is stated rather than
implied. Five of seven live instructions fired in this run — #4 twice (a `for` loop
over 21 URLs returned one answer for all of them; zsh again), #5 (the pin sweep was
re-measured whole instead of chasing the member the log named), #6 (both new plants
structural and asserting, and another session applied the corollary to the same files
mid-run), #7 by extension (a guard's own matcher could not tell a path being used from
one being discussed — recorded here as a citation, not a new slot), and #8 (`PIPESTATUS`
empty in zsh). #1 and #2 did not fire and are nowhere near their five-stamp cold
trigger. **#9 is new.** Eight of ten slots used, one vacant.)*

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

Rotated out: 81 oldest run stamps, verbatim in retro/2026-Q4.md sha256:f7e73e0bd98b

Moved out: 14 loose paragraphs, verbatim in retro/2026-Q4.md sha256:b1964f7ebcc7

- **2026-10-27: the hub board closed in waves as 1.81.0; nine parallel nodes, one integrator, four member releases** (instruction #11 fired: a helper I wrote refused a member's real CHANGELOG heading; a member run found it, not my fixture)

- **2026-10-22: B-242 multi-scope Claude repair shipped as 1.72.1; B-244 fixed upstream as task-pipeline 1.99.1 and this floor migrated from 103,737 to 6,446 bytes** (instruction #8 fired: a green summary over a partial run)

- **2026-10-20: the instructions were the cost, and the guard against my own pipe habit is now code** moved: retro/2026-Q4.md sha256:a481c3f7b04b

- **2026-10-19: a feed review became five member releases and a rollout; my own instruments misled me twice** moved: retro/2026-Q4.md sha256:d36e06600826

- **2026-10-17 — two member release gates fired only on the tag, and a reviewer upgraded a host by quoting its command** moved: retro/2026-Q4.md sha256:0d6472ea7044

- **2026-10-11/12 — integration waves: green was not verified until a second reading of every fix, and a release gate burned two tags** moved: retro/2026-Q4.md sha256:aed5fb0e2605

- **2026-10-10/11 — the readback said PASS where the model saw nothing, and my own pin bump broke Continue** moved: retro/2026-Q4.md sha256:41a690568341

- **2026-09-28 — the import I wrote by hand was wrong, and only a snapshot of the release could say so** moved: retro/2026-Q4.md sha256:64c455031dd7

- **2026-09-06 — the audit found the block, and the block was the thing nobody had measured** moved: retro/2026-Q4.md sha256:fc1c57826d72

- **2026-09-06 — the constraint was one layer over from where the split was looking** moved: retro/2026-Q4.md sha256:43d1b716c363
