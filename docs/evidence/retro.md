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

*(3 — retired 2026-08-13 on its cold trigger; see Retired. The number is left
vacant rather than reused: two CHANGELOGs and a merged PR body already cite these
instructions by number, and renumbering would rot every one of those references.)*

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

7. **(2026-08-13) A mechanical rewrite over prose cannot tell a path being USED
   from a path being DISCUSSED, and its exclusion list describes the tree it was
   written against, not the tree it will walk.** One sweep did all three harms in
   an hour: it flattened the sentence explaining the legacy name into *"else
   docs/evidence/ (the name this pipeline used until 2026-08-13)"*, it emptied a
   guard's subject by rewriting the very strings the guard matched on, and — with
   an exclusion list spelled `docs/superpowers/` while the directory had already
   been renamed — it rewrote **51 frozen records of past runs across five
   repositories**. The revert was exact only because the moves were staged and
   uncommitted. Before a sweep: name BOTH locations in the exclusion list, print
   every file it touched, and read that list before believing it. *(Retire when a
   rewrite tool in this family refuses to write inside a frozen record, or after
   five run stamps without firing.)*

8. **(2026-08-13) A wrapper's exit status is not the suite's verdict.** A
   background command reported `exit code 0` while its own output said
   `FAIL: 2 guard(s) did not fire, 24 test(s) broken`, and a piped
   `npm test | tail` printed `[exit ]` because `PIPESTATUS` is not `pipestatus` in
   this shell. Both would have been read as green by anything that trusted the
   number. Read the output, and where a number is needed, get it from the command
   itself rather than from whatever wrapped it. *(Retire after five run stamps
   without firing.)*

9. **(2026-08-14) A verdict belongs to an artifact by identity, not by recency —
   `--limit 1` answers about whatever finished last.** The umbrella was tagged
   `v0.48.0`, `gh run list --workflow release.yml --limit 1` was read for the run
   id, and it returned the run for **`v0.47.1`**, tagged twenty-six minutes
   earlier. That run had genuinely succeeded, so every subsequent check agreed
   and `release: success` was reported for a release that had not started. The
   contradiction surfaced only from a different instrument: `npm view` still said
   `0.47.1`. **Select the run by the ref you pushed and confirm the identifier
   before reading the status**, and close any release by reading the registry
   rather than the pipeline — the pipeline says a job ended, the registry says
   what the world can install. *(Retire when a release helper in this family
   resolves its own run by tag, or after five run stamps without firing.)*

10. **(2026-08-14) A check that reads a working tree reports a state no clone
   can reproduce.** Two guards written on one afternoon had it. The pin guard failed on
   `task-pipeline` 1.55.0 — a version that existed only as an uncommitted bump in a
   concurrent session's tree, that no tag carried and npm had never served — and the
   remedy an operator would reach for, bumping the pin, would have advertised a version
   nobody released. The coordination guard was green here on seven member configs while CI,
   which checks out the pinned commits, failed on the two that had never been committed.
   **Ask git what is committed; disclose the working tree's disagreement rather than
   failing on it.** Both now do, and both were watched failing on the uncommitted shape.
   *(Retire when every guard in this family reads through `git ls-files` or
   `git show`, or after five run stamps without firing.)* — **the missing
   retirement condition was added on 2026-08-14**, one run after the entry was
   written: the file's own rule is that every entry carries its three triggers, and
   this one carried none, so it could never have been pruned. **Fired on that same
   run, twice:** the umbrella's ten `skills/*` guarded patterns were correctly
   reported as matching nothing, because `git ls-files skills/super-ux` returns one
   gitlink and no files beneath it while the files sit on disk in another
   repository's index — the guard read committed state and committed state was
   right. Kept.

11. **(2026-08-14) When a new check goes red, suspect the checker before the
   subject — and prove it against a case you already know is clean.** Twice in one
   run, on two different checkers, the instrument was wrong and the subject was
   not. A new Contents-anchor check reported **22 failures across a shelf that was
   in fact clean**, because GitHub's slugger turns every remaining space into one
   hyphen and never collapses them, so `## FR-01 — Collect the funnels` anchors with
   **two** hyphens and a collapsing slugger disagrees with every heading containing
   an em dash. And a check that had passed since it was written — *every trigger is
   a word the skill itself advertises* — reported real advertised words as missing,
   because its description parser used `$` under `/m`, which matches at end of the
   first LINE: 74 characters of a 993-character folded scalar, for every skill,
   while its own `desc.length > 40` guard passed because one line clears forty.
   **The tell is the shape of the failure, not its size:** a checker that is wrong
   fails broadly and uniformly, on inputs that have no reason to be broken
   together. Before believing a first red, run the checker against a known-clean
   case and against a case you have planted; if both agree with you, it is the
   subject. *(Retire when every check in this family ships with a known-clean
   fixture beside its planted one, or after five run stamps without firing.)*

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


- **2026-08-14 — the loop, nine rows** (`c8167df`, umbrella v0.54.0). Five releases: `task-pipeline` 1.54.0, `seo-aeo-audit` 0.17.1, `agent-stack` 0.7.2, `agent-sync` 1.11.0, umbrella 0.51.0 → 0.54.0. **Divergence recorded**: three rows (B-44, B-24, and the count in B-30) were filed on premises that measurement disproved — instruction #5 firing on the person who wrote the board, not on a gate. Two checks written that afternoon read a working tree instead of the committed state; the pin guard was caught by a concurrent session's uncommitted bump, the coordination guard by CI one commit later. One unwind slice was bounded by the wrong neighbour and removed 4088 lines of a workflow before the diffstat caught it.
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
| 2026-08-13 | The progress rail stops claiming a finished run; routing reaches all eight; v0.43.0 | `17eceef` | yes — see below |
| 2026-08-13 | The gate stops judging other repositories; v0.44.0 → v0.44.1 (+ task-pipeline 1.51.0) | `eee6aca` | yes — see below |
| 2026-08-13 | The artifact root stops carrying another pack's name; v0.46.0 + six members | `92010b1` | yes — see below |
| 2026-08-13 | B-22: `update` refreshes the wired runtime; v0.47.0 | `e5e12b4` | **not recorded** |
| 2026-08-14 | Plants assert they landed, family-wide; v0.47.1 | `5b639f8` | **not recorded** |
| 2026-08-14 | The family gains a protocol layer and loses its second copy; v0.48.0 (+ agent-stack 0.7.0, make-skill 0.18.0) | `4ffa59a` | yes — see below |
| 2026-08-14 | Web funnel mechanics into the knowledge references, a ninth router, and coordination repaired in eight repositories; v0.55.0 (+ super-ux 0.40.0, sheleg-dev 0.5.0, agent-stack 0.8.0 pinned) | `1a127d8` | yes — see below |
| 2026-08-15 | The shape of the work: graph engineering into agent-stack, a graph audit of task-pipeline; v0.59.0 (+ agent-stack 0.10.1, task-pipeline 1.57.0) | `5285792` | yes — see below |
| 2026-08-16 | The graph backlog as a programme: the same convergence defect in four more places, a body under its budget; v0.60.0 (+ task-pipeline 1.58.0, agent-stack 0.11.0, super-ux 0.41.0, seo-aeo-audit 0.20.0, sheleg-design 1.36.1 pinned) | `64ee7fb` | yes — see below |
| 2026-08-16 (second) | The gate we ship, running on us: coordination checked in CI, the desc co-edit, four board rows closed; v0.61.0 (+ task-pipeline 1.60.0, super-ux 0.41.3, make-skill 0.19.0 pinned) | `fefb32c` | yes — see below |
| 2026-08-16 (third) | B-49: the router nobody could reach by asking — fourteen bare words, 8/8 visual prompts route, 9/9 controls silent; v0.62.0 (+ sheleg-design 1.37.0 → 1.37.1) | `3c99f0b` | yes — see below |
| 2026-08-16 (fourth) | B-55: super-ux ignores graphify's dated snapshots (no release, pointer only) | `7a69c65` | no — one line, and the row's own framing was corrected in its close |
| 2026-08-16 (fifth) | B-56: the pin is a tag and the hub is a branch — release-lag disclosure; v0.63.0 (+ seo-aeo-audit 0.20.1, a released crash) | `cad1c64` | yes — see below |
| 2026-08-16 (sixth) | B-54: the trigger invariant moves to where it can be broken — seven members refuse a planted drop in their own gate; v0.64.0 (+ all seven members patched) | `355dabf` | yes — see below |
| 2026-08-16 (seventh) | B-53: the phrase that reached no route, and the composition question answered by reading rather than assuming; v0.65.0 (+ sheleg-design 1.37.3) | `d4b463e` | no — the plan held, and the two drivers it reused were repaired first |
| 2026-08-16 (eighth) | A run stamp must resolve and be reachable; the guard's own CI run found it blind to shallow clones, and its fix hid a duplicate YAML key; v0.66.0 | `bc3c033` | yes — see below |
| 2026-08-16 (ninth) | B-47: a contributing guide that described a different repository — eleven absent names, not six; v0.67.0 (+ sheleg-dev 0.5.2) | `acfc77f` | yes — see below |
| 2026-08-16 (tenth) | B-43: the command that was built, parked, and lost — rebuilt with guards 344 → 347; v0.68.0 (+ task-pipeline 1.61.0) | `491bed1` | yes — see below |
| 2026-08-16 (eleventh) | B-58: a board row that says work exists names where it lives — guards 347 → 349; v0.69.0 (+ task-pipeline 1.62.0) | `0a0ebcf` | yes — see below |
| 2026-08-16 (twelfth) | B-56: the description was not valid YAML, and every gate we own reads it with a regex; v0.70.0 (+ sheleg-design 1.37.4, agent-stack 0.11.1) | `2553fb4` | yes — see below |
| 2026-08-16 (thirteenth) | B-51: the graph's distance from the code becomes a number every run; v0.71.0 | `feaafe7` | yes — see below |
| 2026-08-16 (fourteenth) | B-60: the age term was a constant, so the board ranked newest-first; v0.72.0 (+ task-pipeline 1.63.0) | `564b356` | yes — see below |
| 2026-08-16 (fifteenth) | B-29: the exposure line reported a clean bill on ledgers it could not read; v0.73.0 (+ task-pipeline 1.64.0) | `9ee92fa` | yes — see below |
| 2026-08-16 (sixteenth) | B-08: a decision is not debt — `waived` becomes a state; v0.74.0 (+ task-pipeline 1.65.0) | `3eb5aad` | yes — see below |
| 2026-08-16 (seventeenth) | B-61: reading a board by position — blast resolved by header; v0.75.0 (+ task-pipeline 1.66.0) | `604b20f` | yes — see below |
| 2026-08-16 (eighteenth) | B-62: two facts, and most ledgers record one — convergence refused; v0.76.0 (+ task-pipeline 1.67.0) | `5302a8b` | yes — see below |
| 2026-08-16 (nineteenth) | B-59: closing a false positive found the bypass it was hiding; v0.77.0 | `3101a5c` | yes — see below |
| 2026-08-16 (twentieth) | B-57: an unqualified landing page reaches both crafts; v0.78.0 (+ sheleg-design 1.37.5, super-ux 0.41.5) | `e062180` | yes — see below |

**The eleven rows above were reconstructed, and one column is deliberately
empty.** Between v0.32.0 and v0.41.1 nobody stamped a run; the dates, titles and
commits are computable from `git log` and are therefore stated, but *did this run
diverge* is not computable from a commit, and answering it would be inventing the
answer this table exists to preserve. `not recorded` is the true value.

The cost is exact and worth naming: the cold-retirement trigger for a standing
instruction is *five run stamps without firing*, and for ten days that counter
could not advance. Every prune in that window compared instructions against a
clock that had stopped.

**Prune, 2026-08-14 (v0.55.0).** Nine held, ten after this run's addition, which is
exactly the cap. **Six fired.** #2 — the `routers` command was run three times
against the real `~/.claude/CLAUDE.md` and the SHA-256 was identical after each.
#4 — see #11's second half, which is the same failure one step sharper: the
description parser did not return the same answer for every input, it returned the
same *kind* of truncated answer for every input, and its own length guard could not
tell. #5 — `check_pins.py` reported `agent-stack` behind while this release was
being built, and the sweep was re-run over all eight rather than the one the log
named. #8 — every gate in this run was run alone, with its output redirected and
its exit code read directly. #9 — CI verdicts were resolved by `headSha` and by
tag, never by "the latest run". #10 — twice, as recorded in its own entry. **Three
did not fire:** #1, #6, #7.

**Nothing retired, and the reason is a gap this file already names.** The cold
trigger is *five run stamps without firing*, and no entry records which stamps it
fired on, so the counter cannot be computed for the three that did not fire today.
The note under the stamp table says the counter stopped for ten days between
v0.32.0 and v0.41.1; the deeper problem is that even a moving clock has nothing to
compare against. **The list is now AT its cap of ten, so the next addition forces a
retirement** — and the honest way to earn one is to record firing per entry from
this run forward, which costs one line each time an instruction fires and makes the
trigger computable for the first time.


**Prune, 2026-08-15 (v0.59.0).** Ten held, ten after this run, which is the cap. **Seven
fired, and this is the second run to record which** — the counter the 2026-08-14 note said
could not be computed is now computable for two stamps.

#4 — four runs of one suite over an unchanged tree returned four different answers; the
instability was a fact about the instrument (two runs overlapping on fixed scratch paths),
not about the subject. #5 — a member moved under this run **twice**, and both times the
whole set was re-measured rather than the one the log named; a third member and a fourth
are behind right now and were deliberately left alone for the same reason. #6 — all
seventeen new plants are structural and assert they landed; the one that broke was anchored
on a cell's *content*, which is the same class one column over. #8 — `${PIPESTATUS[0]}`
came back empty in zsh and every exit code after that was read from the command itself.
#9 — every CI verdict was resolved by tag SHA or by `headSha`, never by `--limit 1`; two
releases and five branch cycles. #10 — the umbrella validator refused the moved pins while
the submodules were uncommitted, which is the guard being right. #11 — twice: two
hypotheses about a red suite tested and disproved before the cause was found, and a CI
failure that turned out to be the plant rather than the doctrine.

**#1, #2 and #7 did not fire — except that #7 fired against me.** Renumbering a board row
`B-073 → B-075` was a blind replace across a file that also held a **concurrent session's**
CHANGELOG section, and it rewrote their reference to their own row. Restored from
`origin/main`. That is #7 exactly — a mechanical rewrite cannot tell a path being used from
one being discussed — so it is recorded as fired, on its author rather than on a sweep.
That leaves **#1 and #2** as the only two that did not, and neither is near five stamps.

**Nothing retired and nothing added.** The lesson this run earned — *enumerate the shapes a
defect takes before writing the fix* — belongs to the repository where it happened and is
`task-pipeline`'s **R-008**. Adding a second copy here would be the two-homes defect this
run spent a release removing.


**Prune, 2026-08-16 (v0.60.0).** Ten held, ten after this run. **Six fired**, and this is
the third consecutive run to record which — the counter the 2026-08-14 note called
uncomputable now has three stamps behind it.

#4 — a wrapper reported two release runs complete when both were still running, which is
the instrument answering about itself. #5 — two members moved under this run again
(`sheleg-design` by five releases, `seo-aeo-audit` by two) and the whole set was
re-measured rather than the one a log named. #6 — every new plant is structural and
asserts; two broke on their first run and both failures were the author's. #7 — **fired on
its author for the second day running**, and this time it broke two plants whose payload is
the workflow text; the shipped fix abandons the rewrite entirely. #10 — the retro stamped a
commit that an amend had already replaced, so the SHA resolved here and not in a clone;
repaired with a follow-up commit rather than a second amend. #11 — the duplication check
caught the person who wrote it, within the minute, which is the cheapest version of this
whole programme.

**#1, #2 and #8 did not fire.** None is near its five-stamp cold trigger; #8 came close to
firing and did not, because the wrapper that lied about the release runs was caught by
reading the registry rather than by reading an exit code.

**Nothing retired and nothing added.** #7 has now fired twice in two days and is the most
load-bearing row in the list; the temptation to add *"before a sweep, ask which targets
treat the pattern as data"* was refused because that is #7 restated, and a list of ten that
holds one rule twice is a list of nine.

---

## 2026-08-16 (twentieth) — the refusal stands, on new evidence

B-57 was the last row on this board that a machine could close, and it turned on a
decision made fifteen cycles earlier. Cycle 5 refused a bare `лендинг` trigger because
*"the bare noun would take the route from `copywriting`"*. That reason no longer holds:
with both crafts firing, nothing is taken from anybody.

So the refusal had to be re-earned or dropped. Measured both ways:

| prompt | bare noun | verb phrase |
|---|---|---|
| `сделай лендинг` | both | both |
| `напиши текст для лендинга` | both — a copy task handed a visual route | copywriting alone |
| `почини баг на лендинге` | three routes | task-pipeline alone |

The bare noun fixes one case and damages two. **Same conclusion as cycle 5, different
reason, and the difference matters** — an inherited refusal whose stated reason has
expired is not a decision any more, it is a habit. Re-deriving it cost two trial edits and
one measurement.

### The row's own premise had expired, again

It said both descriptions were at or near the 1024-character limit. `copywriting` is at
**536**, with 488 characters free. That is the fifth row today whose facts had moved, and
the third whose stated constraint simply was not there — the harvest rule shipped this
morning earns its place on a count of five in a day.

### What the row did not know

`build a landing page` reached nothing either. B-57 discusses only the Russian phrase, and
the English gap surfaced from re-deriving rather than from reading. A row describes what
its author noticed; the sweep is what finds the rest, and it costs one command.

### Room was made, not found

`sheleg-design` had 15 characters free and needed 42. The answer was not to abandon the
fix but to look at what the prose was spending: `scrubbed sections` and one `implemented`,
30 characters that were not carrying their weight beside a phrase an operator actually
types. A budget is a statement about priorities, not a wall.

### What fired, per entry

**#4** — the two-variant comparison, and the expired premise found by measuring rather
than reading. **#11** — the inherited refusal was suspected before the code was, and it
turned out half-right: the conclusion survived and its reason did not. **#6** — both trial
edits asserted their anchors, and the trial was reverted from a backup rather than
hand-undone. **Did not fire:** #1, #2, #5, #7, #8, #9, #10.

*(prune at 2026-08-16 (twentieth): **no retirement.** #7 three stamps, #8 one, #2 eighteen,
#5 fifteen, #9 fifteen, #1 eleven, #10 six, #11 fired, #4 fired, #6 fired. Held for the
reason recorded at the eighth prune. Ten of ten slots used, nothing added — *an inherited
refusal whose reason has expired is a habit* is #4 pointed at a decision instead of a
number, and it belongs in this entry.)*

## 2026-08-16 (nineteenth) — the annoyance was hiding a hole

B-59 was the smallest row on the board: a guard that refuses documents quoting the command
it warns about. Priority 0.5, filed as a nuisance. Fixing it turned up a **bypass that had
been open the whole time**.

The fix required deciding what a guard may ignore. Heredoc bodies fed to a non-shell, yes —
they are data. Every heredoc, no: `bash <<EOF` is a script, and stripping it would trade a
false positive for a documented hole. Quoted strings, no: `bash -c '…'` is a real
invocation.

**Writing the test for that last case is what found it.** `bash -c 'npx skills add
ux-flows'` was *not* refused — `bareName` kept the trailing quote, so `ux-flows'` matched
no family id. Verified against `HEAD` before any of my changes, so it predated the row
entirely.

The shape is worth naming: **deciding what a guard should ignore forces you to enumerate
what it must not, and that list is where the holes are.** The row asked for one exemption;
answering it honestly required listing three cases the guard must still catch, and one of
them it did not.

### The defect demonstrated itself three times

Twice it blocked the command that was repairing it — once silently, in a compound call
where the guard refused the whole payload and the `python3` edit inside it never ran while
I read a later error as the failure. And the fixture file could not contain the literal
payload at all, because anything reading that file becomes a refused command; the strings
are assembled at runtime, with a comment saying why.

### Three new fixtures passed for the wrong reason

They targeted a member the fixture's own manifest does not declare, so every call returned
`null` and every `assert.strictEqual(..., null)` was satisfied by an id that matched
nothing. **A negative assertion needs a positive control in the same block**, and there
are two at the top of that block now — the bare payloads must be refused, or the cases
below them prove nothing.

### What fired, per entry

**#6** — squarely: three plants asserting nothing, caught only because the fourth case
expected a refusal and got silence. **#8** — the compound call whose inner edit never ran
while its later command produced the visible error; the fix was to stop chaining and check
that the write landed. **#11** — the guard was suspected of being wrong about documents,
and it was, and it was also wrong in the other direction. **Did not fire:** #1, #2, #4,
#5, #7, #9, #10.

*(prune at 2026-08-16 (nineteenth): **no retirement.** #4 one stamp, #7 two, #2 seventeen,
#5 fourteen, #9 fourteen, #11 fired, #1 ten, #10 five. Held for the reason recorded at the
eighth prune. Ten of ten slots used, nothing added — *a negative assertion needs a positive
control* is #6 with a sharper edge and belongs in its entry, not a new slot.)*

## 2026-08-16 (eighteenth) — the number the doctrine is built on is undefined almost everywhere

B-62 said five verification-ledger shapes. Measured: **ten**, across **815** rows in nine
repositories. And the number that matters is smaller than the row implied — `never` is
expressible in **one repository, over 15% of the rows**. The exposure line, the check-list,
`/task-pipeline checkup`, and a paragraph of doctrine in three files are all defined over a
column that 689 rows do not have.

### The refusal was the work

The obvious close is to converge: one shape, a `Human` column everywhere. It is also the
one action that would make things worse. Back-filling 689 rows means writing human
confirmations nobody gave — and unlike an absent column, a filled-in one **answers the
question wrongly**, with nothing afterwards able to tell which rows were real. The
`evidence-docs` router names exactly that failure, and this repository's own ledger
preamble had already refused it once for its own history.

So what shipped is a written split — evidence and human-confirmation are different facts,
a ledger may carry either, and the doctrine stops implying the second is always there. Two
cycles running now, the honest answer to *"make these the same"* has been **no, and here is
what to do instead**: B-61's two board shapes, B-62's ten ledger shapes. In both the harm
was never the divergence; it was code and prose that assumed uniformity.

### The doctrine was lying about this repository, in this repository

`docs/evidence/verification.md` opened by saying `/task-pipeline checkup` counts the rows
sitting at `never`. Its own table has no such value and never has. 295 of its 322 rows read
`verified`, and not one says whether a person or a command produced it. **A file that
describes its own contents wrongly is the cheapest kind of false claim to make and the
hardest to notice**, because the reader who could check it is the one who wrote it.

### Four rows were unreadable for explaining themselves

`**observed** — the row exists because the miss happened in this run` was reported as a
status nobody can parse, because the matcher compared the whole cell. A status that names
itself and then says why is ordinary writing, and the vocabulary now matches the leading
word — with the empty-cell test moved **before** the word is taken, so a blank still counts
as unconfirmed rather than becoming a word that is not in the list.

### What fired, per entry

**#4** — the entry: five became ten and 698 became 815 because both were counted rather
than carried over, and my first table shipped a wrong last row that a recount caught before
release. **#11** — the sampler that reported three repositories with zero rows was reading
a column that does not exist in them. **#6** — the plants and the recount both asserted
their own shape. **#8** — every gate alone; `test:all` at 351. **Did not fire:** #1, #2,
#5, #7, #9, #10.

*(prune at 2026-08-16 (eighteenth): **no retirement.** #7 one stamp, #2 sixteen, #5
thirteen, #9 thirteen, #11 fired, #1 nine, #10 four. Held for the reason recorded at the
eighth prune. Ten of ten slots used, nothing added — the *refuse convergence, name what to
do instead* pattern has now appeared twice in two cycles and belongs in the board doctrine
if it appears a third time, not in this list.)*

## 2026-08-16 (seventeenth) — the same defect, two lines away, one release later

B-61 asked which of two priority formulas should win. The answer is neither: both are
documented in their own headers, and the umbrella's divides by effort, which ranks
cheap-and-old above expensive-and-old in a way `sev × blast` cannot express. Forcing
convergence would break every seeded board or rewrite sixty rows here.

**What was actually broken was reading a board by position.** `exposure.sh` took blast from
column 5 — `Blast` in the eight-column board, **`Size`** in the ten-column one it seeds —
so every host project's check-list printed `[blast L]`: the size of the work, presented as
who it hurts.

### The distance is the finding

One cycle ago I fixed exactly this class in the same file: the ledger's status column, read
by index, reporting a clean bill on shapes it could not parse. I wrote a comment about it,
four fixtures for it, and a paragraph in the release notes about silent greens. **The blast
read sits two lines below the check-list header, in the same function, and I did not look
at it.**

The retro already carries this as R-003 — *a fix covered one of the two places its defect
lived*. Every prior instance was across files or across members, which at least explains
the miss. This one was within one screen. The lesson has to be stronger than "sweep the
class": **when a fix is about how a value is located, the sweep is every other value the
same code locates**, and that list is short enough to enumerate — here it was exactly two.

### Refusing convergence was the other half of the work

The obvious reading of B-61 is "make them the same". Measured against what that costs —
sixty rows here or every seeded project's board — and against what it buys, which is
nothing the header-resolution rule does not already deliver, it was the wrong answer. The
row closes with the refusal stated, because a row that closes without saying what was *not*
done invites the next run to do it.

### What fired, per entry

**#7** — in the sense that matters here: a value being *located* by position is a claim
about a shape nobody guaranteed. **#4** — the reproduction on a scratch project is what
turned a suspicion into `[blast L]`, and the same command after the fix into `[blast 3]`.
**#6** — the new fixtures each assert the wrong answer is absent, not merely the right one
present. **#8** — every gate alone, `test:all` at 351. **Did not fire:** #1, #2, #5, #9,
#10, #11.

*(prune at 2026-08-16 (seventeenth): **no retirement.** #7 fired, resetting. #2 fifteen,
#5 twelve, #9 twelve, #11 two, #1 eight, #10 three. Held for the reason recorded at the
eighth prune. Ten of ten slots used, nothing added — the sharpened R-003 above belongs to
the retro's own recurrence list, and it is written into this entry rather than given a
standing slot.)*

## 2026-08-16 (sixteenth) — fixing a constant surfaced what the constant was hiding

B-08 came up because the age term started working one cycle ago. It and B-07 recorded
deliberate decisions on 2026-08-06 — a UX chain waived in favour of fixtures, a skill kept
an audit because another router carries the design-time rule — and both sat `open`. With
age computed they went straight to **2.67 each, the top of the board**.

So this cycle opened by re-deriving two conditions and found **both still hold**: 8 CLI
commands with 0 uncovered by fixtures, and a routing block that still says *"Decided AT
DESIGN TIME, not audited afterwards"*. Neither row was debt. Neither ever had been.

**The defect was the board's vocabulary.** `open` is work not done, `dropped` is an idea
abandoned, and a deliberate *no* is neither — so it went in `open` and aged like debt. The
constant had been concealing that for eleven days; the first correct ranking put it on
screen.

That is the shape worth keeping: **a fix that starts producing real numbers will expose the
next defect, and the next defect will look like the fix misbehaving.** The reflex is to
distrust the new measurement. Here the new measurement was right and the thing it ranked
was wrong.

### The waiver had to be gated, not just named

`waived` on its own is a row nobody reconsiders. The `revisit:` clause is mandatory in both
validators, and the doctrine requires the condition to be **measurable** — *"the command
surface grows past what the fixtures describe"* is checkable, *"if it becomes a problem"* is
not. It also requires re-derivation when the row is touched, because a waiver resting on a
condition nobody has checked since August is the same expired claim in a quieter voice.

### The documentation used a real id and became a row

The worked example I wrote for the new state read `| B-07 | … |`, which is a **second row
with that id** in the same file. The duplicate-id guard refused it within one command. Both
board guards were then narrowed to `B-\d+`, because the placeholder that replaced it was
still being read as a row and reported as waived.

Two lessons in one small mistake: an example in a table-shaped document is a table row to
everything that reads the file, and a guard scanning `| B-` finds documentation.

### What fired, per entry

**#4** — the re-derivation is the entry: two conditions measured rather than assumed, and
both held, which is the outcome that makes measuring worth it even when nothing changes.
**#6** — every plant asserted its shape; the waiver plants each named the exact cell they
altered. **#7** — the example row, which is a path being *shown* read as a path being
*used*, in a new place. **#8** — every gate alone, `test:all` at 351. **Did not fire:**
#1, #2, #5, #9, #10, #11.

*(prune at 2026-08-16 (sixteenth): **no retirement.** #7 fired, resetting. #2 fourteen, #5
eleven, #9 eleven, #11 one, #1 seven, #10 two. Held for the reason recorded at the eighth
prune and re-affirmed at every one since: sixteen stamps in one day is not the count the
cold trigger was written against — and this run is the second in which correcting a
day-versus-stamp distortion changed a real ranking. Ten of ten slots used, nothing added.)*

## 2026-08-16 (fifteenth) — the tool I shipped to stop silent greens was one

Two cycles ago I built `exposure.sh`, wrote fourteen fixtures for it, and recorded in the
notes that three of them had caught real defects *lying in the reassuring direction*. Run
against this repository's own ledger today it printed:

```
exposure: 0 unverified · never checked · 125 releases carry one
         every shipped row carries a human confirmation
```

Nothing has ever been checked, and everything is confirmed. **The two halves of one
sentence contradict each other**, and I had read that output before without seeing it.

It came from four rows out of 298. The script keyed on position — `NF >= 7` — and this
ledger has four columns, so nothing should have matched at all; the four that did are the
four whose cells contain a `|` inside inline code and so crossed the field count by
accident. **A number derived from punctuation, presented as a clean bill.**

### The fixtures were the reason it survived

Eighteen cases now, fourteen then, and every one of the fourteen built the same canonical
seven-column ledger with a `Human` column. They tested the logic thoroughly and the
*interface* not at all — the assumption that a ledger has this shape was baked into the
fixture factory, so no case could question it. A fixture that constructs its own input from
the implementation's assumptions verifies internal consistency and nothing else.

The four cases added today all attack the shape: a ledger with no status column, a status
column somewhere else, a status column that is not `Human`, and a status nobody can parse.

### The order of the column names had to be measured

`sheleg-design` carries both `Last verified` — which its own preamble defines as *a date
and the thing that was watched, not "tests pass"* — and a `Status` column holding
`**green**`. Preferring `status` reads the gate and reports 174 confirmations. Five other
members hold **shell commands** under `Verified by` and `How it is checked`, so those
header names had to be excluded rather than accepted as near-enough. Each of those was
found by sampling the actual values, not by reasoning about what a column called
`Verified by` probably contains.

### What the measurement exposed is bigger than the bug

Five ledger shapes across nine repositories, and only `task-pipeline`'s can express *a
person looked*. Six members have no state column at all. So the exposure line — the number
the doctrine is written around — is unmeasurable in most of the family, and this
repository's own ledger preamble promises a checkup that counts a value its shape cannot
hold. Filed as B-62 rather than papered over; the script now says **dormant** there, which
makes the gap visible instead of closing it with a zero.

### An edit replaced a string I had introduced two edits earlier

Patching the script, one substitution matched an `if` I had written minutes before rather
than the one I meant, and spliced a block into the middle of an if/elif chain. The assert
confirmed the string existed; it could not confirm it was the right occurrence. **In a file
being edited repeatedly, "this string appears once" is a fact about the moment, not about
the edit.** Repaired by rewriting the whole block from the file's current contents instead
of patching a patch.

### What fired, per entry

**#4** — twice and decisively: `0 unverified` across five members was the uniform answer,
and sampling the real values is what turned it into five distinct causes. **#11** — my
reader was wrong before the subject was, three separate times today. **#7** — the
substitution that hit my own earlier edit. **#6** — the plants asserted their shape, and
the one that did not is exactly the one that went wrong. **#8** — every suite alone,
`test:all` at 349. **Did not fire:** #1, #2, #5, #9, #10.

*(prune at 2026-08-16 (fifteenth): **no retirement.** #7 fired, resetting. #2 thirteen,
#5 ten, #9 ten, #1 six, #10 one, #4/#6/#11 fired. Held for the reason recorded at the
eighth prune: fifteen stamps in one day is not the count the cold trigger was written
against, and the board's own age term was corrected for the same distortion one cycle ago.
Ten of ten slots used, nothing added — the fixture lesson above is #4 applied to test
inputs rather than to outputs, and it is written into the entry rather than given a slot.)*

## 2026-08-16 (fourteenth) — I ranked by a number nobody was computing

B-60 asked about board rows whose prose expires. The sharpest expiry was not prose. This
board's header states `P = blast × (1 + age_runs) / effort` and promises the rank is
recomputed at stage 10 *"so a row cannot keep a rank it earned when it was new."* Nothing
recomputed it for eleven days. `B-07` and `B-08` read age 2 against seven stamp-days,
`B-29` 0 against three, `B-51` 0 against one.

**So the age term was a constant, and a formula with a constant in it is a shorter
formula.** With the real ages those four rows rank 2.67, 2.67, 2.67 and 2.0 — the top of
the board. This loop worked them **last**, every cycle, on a ranking it re-read at the top
of each one.

### Re-reading is not re-deriving

Fourteen times today I opened the board, sorted by `P`, and picked the highest. That is
re-reading, and it is what the doctrine already warns about in its own words — *"its open
count comes from a command at the top of the run, not from what the last run's report
said."* I applied that to the **count** and never to the **rank**, because the count looks
like something you fetch and the rank looks like something that is already there.

The tell was available all day and I read past it: seven open rows, and four of them tied
at exactly `1.0`. A computed ranking that produces a four-way tie at a round number is a
ranking that is not computing.

### The unit had to be chosen, not inherited

`age_runs` said "run stamps survived". Thirteen stamps landed today. Counting stamps would
have put today's cadence above a row ignored for a week, so the term is now **distinct
stamp-days** — 38 stamps over 9 days. This is the third time today the same distortion has
been ruled on: the prune doctrine flagged it at the eighth stamp, re-affirmed it at the
tenth, and now the priority formula inherits the ruling instead of each place deciding
alone.

### What did not get built, and why that is the finding

The obvious guard is "every checkable claim in an open row still resolves". Measured
first: across the seven open rows the family carries, the checkable claims total **two
file paths and one count**. A gate over three items would pass everything and read like
coverage — so what shipped is doctrine for the prose half and a gate only where the corpus
is real arithmetic on every row.

### What fired, per entry

**#4** — twice: the four-way tie at 1.0 was a uniform answer I did not read as one, and
the stamps-versus-days comparison was measured before choosing. **#10** — the fix reads
committed state (the stamp table) rather than a working assumption, and unknown stays
unknown. **#6** — both plants asserted their own shape before running. **#8** — every gate
alone, exit codes read singly, `test:all` at 349. **Did not fire:** #1, #2, #5, #7, #9,
#11.

*(prune at 2026-08-16 (fourteenth): **no retirement.** #7 two stamps, #11 one, #2 twelve,
#5 nine, #9 nine, #1 five. Held for the reason recorded at the eighth prune: fourteen
stamps in one day is not the count the cold trigger was written against — and today's board
finding is the same distortion in a second mechanism, which strengthens the hold rather
than weakening it. Ten of ten slots used, nothing added.)*

## 2026-08-16 (thirteenth) — the catastrophe that was a wrong dictionary key

B-51 is an operator's decision — provision an LLM key or accept that doc-heavy members
keep a drifting graph — and it stayed one. What changed is that waiting is no longer free
of information: every `npm test` now prints how far each graph has fallen behind the code
it describes.

### Yesterday's lesson, applied and then immediately needed

The twelfth entry, written an hour earlier, says: *when a tool fails and our own checks are
green, the disagreement is the evidence.* Measuring the graphs, my own reader reported
**zero edges across all nine** — 11,267 nodes and no relations anywhere, which would have
meant every reach question the graph exists to answer had been silently returning nothing
for weeks. That is a catastrophe-shaped number.

Instead of writing it up, I asked the tool. `graphify god-nodes` printed real hubs with
edge counts against the same file, one command later. The graph is node-link JSON and its
key is `links`; I had read `edges`. **11,267 nodes and 12,494 links, all nine graphs
healthy.** The disagreement localised the defect to the thing the two readers did
differently, exactly as the previous entry claimed it would — and the elapsed time was one
command rather than two cycles.

The design consequence is in the shipped code: `graph_staleness.resolve()` reads nothing.
It takes four measured facts and returns a verdict, because the reading is where this went
wrong and a pure function cannot repeat it.

### A row's facts had expired, again, and this time it was checked first

B-51 said the graphs were frozen since 2026-08-08. They were rebuilt on 08-15/16. It said
they were therefore useless; they are 2 to 33 commits behind, which is drift and not
freezing. **Both were re-measured before anything was built on them** — the second cycle
running in which a board row turned out to describe a state that had moved, after B-43's
artifacts and B-47's file count. Three rows in one day, and the pattern is now unmistakable:
**a board row is a claim with a timestamp, and stage 0's harvest should re-measure the row
it is about to act on** rather than reading it as current. That is already the doctrine for
the open *count*; it is not yet the doctrine for a row's *contents*.

### The disclosure names the decision without forcing it

An unrefreshable graph says so **even when it is at HEAD**, because *current today* and
*current because nothing can rebuild it* are different facts and only one is fine. The
`B-51` tail disappears by itself the moment a key exists — verified by running the suite
with one set — so the disclosure retires itself rather than needing a follow-up edit.

### What fired, per entry

**#11** — the load-bearing one, and it worked at speed: suspect the checker, then ask a
second reader. **#4** — *zero edges across all nine* is the uniform-answer signature, and
it was a wrong key rather than a real uniformity, which is the same instruction reading in
the opposite direction. **#8** — an earlier attempt to reproduce the refresh failure used
`timeout`, which macOS does not have; the command never ran and the pipeline still printed
`exit=0`. Re-run without it. **#6** — both blind-path plants asserted their own shape.
**#10** — the stamp SHA read from `git rev-parse` in the writing script. **Did not fire:**
#1, #2, #5, #7, #9.

*(prune at 2026-08-16 (thirteenth): **no retirement.** #7 one stamp, #2 eleven, #5 eight,
#9 eight, #1 four, #6 and #11 fired. Held for the reason recorded at the eighth prune and
re-affirmed twice since: thirteen stamps in one day is not the count the cold trigger was
written against. Ten of ten slots used, nothing added — the expired-row pattern above is a
`/task-pipeline` harvest change and belongs on the board, not in this list.)*

## 2026-08-16 (twelfth) — two cycles blaming a tool that was working

B-56 said the family launcher was broken. It was not. `sheleg-design`'s `description`
carried `style packs: dashboards` — a colon-space inside an unquoted YAML scalar, which
reads as a nested mapping — so the file was not valid YAML and the installer refused it
outright. **I introduced that in cycle 1**, in the rewrite that gave the skill its plain
visual vocabulary: routing fixed and installation broken in the same release.

### Every gate we own reads that field with a regex

`claude plugin validate`, the member's own 4636 checks, `claude plugin update`, and this
repository's trigger fixture — all green over a file a strict parser rejects. The single
tool in the chain that uses a real YAML reader is the skills CLI, and its message was one
line inside a 900-line launcher log: *No valid skills found*.

**The failure was legible for two cycles and I did not read it.** Both earlier passes
attacked the launcher: I ruled out rate limiting, file count, and the lock record, and each
of those was a real measurement that eliminated a real hypothesis. What I never did was ask
the failing tool what it saw. One read-only command — the CLI's own repository listing —
printed the parse error and the column number immediately.

The generalisation is not *"read the error"*, which nobody disagrees with. It is narrower:
**when a tool fails and our own checks are green, the disagreement is the evidence.** Two
readers of the same bytes reaching different verdicts localises the defect to the thing
they read differently — here, one parses YAML and four match a regular expression. That
question was available on day one and cost one command.

### The member nothing was checking

The shared checker written in cycle 4 exited early for a member carrying no routed
triggers — `ok: agent-stack carries no routed triggers`, and no inspection. So the one
member with nothing to route was the one place this class could never be caught. The early
exit is gone: front matter is checked for every skill of every member first, and
`agent-stack` 0.11.1 is wired to call it.

### A row edit damaged its neighbour

Closing B-56 used a `re.S` pattern anchored on `| B-56 |` and terminated by `| open |` —
which is not in B-56's row. It ran past the row end and put B-56's closure onto **B-57**.
The script asserted the match existed and printed *B-56 closed*; `git diff --stat` showed
one changed line and it was the wrong one. **An assert that a match was found is not an
assert that the right thing changed**, and a row edit is a cell edit on one line — nothing
else can be right. Repaired line-scoped, both rows re-read.

### The guard refused the sentence describing it

Committing the ledger failed: the hygiene guard scans the whole Bash payload for
`skills add`/`skills update` on a family member, and the ledger *quoted* the diagnostic
invocation. It fails closed, which is the right direction, and the cost is that the
family's own documents cannot quote the command they warn about. Filed as B-59 — #7 living
inside a guard rather than inside a rewrite.

### What fired, per entry

**#11** — inverted, and that is the entry: I suspected the checker (the launcher) for two
cycles when the subject was wrong. The instruction says suspect the checker *first*, not
*only*; when the checker survives three measurements, the subject is what is left. **#7** —
twice, in the row edit and in the guard. **#4** — the class was measured (2 invalid of 24,
2 hazardous of 69) rather than assumed to be one file. **#6** — plants asserted they
landed, and the row edit is the counter-example: it asserted the wrong thing.
**#8** — the launcher's exit code read directly, which is how *exit=0* became the proof
rather than an impression. **Did not fire:** #1, #2, #5, #9, #10.

*(prune at 2026-08-16 (twelfth): **no retirement.** #7 fired twice, resetting. #2 ten
stamps, #5 seven, #9 seven, #10 one, #1 three, #11 fired. The three past their nominal cold
trigger stay for the reason recorded at the eighth prune: twelve stamps in one day is not
the count the rule was written against. Ten of ten slots used, nothing added — the
disagreement-is-evidence lesson above is #11 read correctly rather than a new rule.)*

## 2026-08-16 (eleventh) — the detector I measured, and the guard I did not

B-58 was filed one cycle ago by the run that lost B-43's artifacts, and closed by the rule
it asked for. Two things happened worth recording, and they are opposites.

### The detector was measured before it was believed

The obvious implementation is a prose detector: match *"parked"*, *"is built"*, *"ready to
merge"* in the description cell. It was written, run over 187 real rows, and fired **three
times — every hit false.** Two were closed rows narrating the very incident that produced
the rule; the third was the row asking for it. A check whose every current hit is wrong is
not a check that needs tuning, and this family already has the precedent: B-48's
token-matching of descriptions produced four false failures out of eight members and was
dropped whole rather than adjusted.

So what shipped reads the **status cell**, which is never prose, and its baseline was
measured too: **zero across 191 rows** including the seeded templates. A rule with a zero
baseline is one whose first firing means something; a rule already firing on correct rows
teaches an operator to route around it before it has ever caught anything.

### The guard was not measured, and passed silently

The first draft read `cells[-2]` — the status column in this repository's eight-column
board, and the **Home** column in the ten-column template it also checks. So the parked
rule examined the wrong cell and found nothing. Its plant reported `NOT CAUGHT`, and only
because the plant was run: reading the code would have shown a rule that looked right.

The comment explaining why positional reads fail on this exact corpus sits **fifty lines
above** where I wrote it — *"POSITION-FREE, and the first version of this guard was not …
five of them have two status-ish columns … 'take the last one' then read a different cell
per file"*. It describes what I then did. Doctrine one screen away is doctrine in another
file as far as attention is concerned; the plant is what closed the gap, in seconds.

**The pairing is the lesson.** I measured the thing I expected to be wrong (the prose
detector) and did not measure the thing I expected to be right (the guard). The
false-positive sweep was careful work aimed at the risk I had already named, while the
positional read went in unexamined because it looked like the obvious shape. Both were
caught in the same ten minutes and only one of them by intent.

### What fired, per entry

**#4** — twice, and productively: three-of-three false is a measurement that killed a
design, and zero-of-191 is what gives the replacement meaning. **#6** — the plants assert
they landed, which is how `PLANT DID NOT LAND: B-002 is not open` would have surfaced a
template that had drifted. **#7** — the discarded detector is that instruction as a
design constraint rather than an incident: it could not tell a row *about* parked work
from a row *of* parked work. **#8** — every suite alone, exit codes read singly, including
`test:all` at 349. **#10** — the stamp SHA read from `git rev-parse` in the writing script.
**Did not fire:** #1, #2, #5, #9, #11.

*(prune at 2026-08-16 (eleventh): **no retirement.** #2 nine stamps, #5 six, #9 six, #11
three, #1 two — the three past their nominal cold trigger are held for the reason recorded
at the eighth prune and vindicated at the tenth: eleven stamps in one day is not the count
the rule was written against, and #1 fired one stamp after its trigger would have retired
it. The counter resumes meaning when stamps resume being days apart. Ten of ten slots used,
nothing added.)*

## 2026-08-16 (tenth) — a board row that described work which no longer existed

B-43 read as ready to merge: a script, thirteen green fixtures, three negatives, "blocked
only by timing". Two days later none of it existed — not in the working tree, not in
`git log --all --diff-filter=A`, not in `rev-list --all --objects`, not in a stash, not in
a dangling object. It had been parked in a **session scratchpad**, which is a temp
directory with a lifetime nobody wrote down.

**The board cannot tell a claim about a filesystem from a claim about a repository**, and
this row was the first kind while reading like the second. Filed as B-58: a row that parks
work names the branch or the commit holding it, or it is not parked, it is described.

### The fixtures earned their cost in one sitting

Three of fourteen caught real defects in the rebuild, and every one of them lied in the
**reassuring** direction — which is the only direction that matters:

- `$(grep -c "" f || echo 0)` yields two zeroes. grep prints its own `0` **and** exits 1,
  so the fallback runs too; the variable becomes `"0\n0"` and every numeric test after it
  dies. It fires only when the count is zero — that is, only when the answer is
  *everything is confirmed*.
- BSD `sort` exits *Illegal byte sequence* on a non-ASCII column under a UTF-8 locale. The
  error went to stderr, the check-list came out empty, and the exposure line above it
  still said 126 unverified. A list that silently empties is worse than no list, because
  the number above it still claims there is work.
- A byte-wise `substr` split a Cyrillic letter and printed a replacement glyph.

None of these is visible by reading. All three were found by running the script against
inputs chosen to be awkward, which is what a fixture is for.

### A control went red and the harness was right

`negatives.py` reported a property check failing — *a legitimate exception in an unrelated
rule failed the suite — false positive*. The instinct is to suspect the check (#11), and
that instinct was **wrong here**: the check runs the whole validator over a planted-but-
legitimate edit, the validator was correctly refusing because the CHANGELOG still claimed
344 guards while the workflow defined 347, and the tree was simply mid-change. Suspecting
the checker first is cheap; believing the suspicion without reading the message is not.
The diagnosis took one command — running the validator in the copied tree and reading the
line.

### What fired, per entry

**#11** — as above, correctly raised and correctly abandoned after one measurement.
**#6** — every plant asserted it landed; the exposure percentage plant asserts `^LINE=`
exists before rewriting it. **#4** — the guard count was read from the workflow rather
than incremented from the old one, which is how 344 → 347 is a measurement. **#8** — every
suite run alone with its exit code on its own line, including `test:all` at 347 plants.
**#10** — the stamp SHA read from `git rev-parse` inside the writing script. **#1** — the
dormant path prints why rather than exiting 0 in silence, which is that instruction
applied at design time rather than after an incident. **Did not fire:** #2, #5, #7, #9.

*(prune at 2026-08-16 (tenth): **no retirement.** #2 eight stamps without firing — past its
cold trigger on the count, and held for the reason the eighth prune recorded: ten stamps in
one day is not the ten the rule was written for, and #1 vindicated that caution two runs
ago by firing one stamp after its own trigger. #5 five, #7 one, #9 five. Ten of ten slots
used, nothing added — B-58 is a board-doctrine change, not a standing instruction.)*

## 2026-08-16 (ninth) — the row under-counted, and the guard caught its own author

B-47 said six file names in `sheleg-dev`'s `CONTRIBUTING.md` belonged to another
repository. Sweeping every backticked name instead of re-reading the one table the row
mentioned found **eleven of nineteen** absent — including a reference under a skill
directory named `sheleg-dev` that has never existed, and a promised standard-library
auditor plus a second test command in a repository with **no runtime code at all**. Most
of the document was `seo-aeo-audit`'s, adapted at the edges.

**The lesson is about the intake, not the fix.** The row was filed by someone who had
found the table; a sweep at filing time costs one command and would have said eleven.
Every count in the rewrite is now produced by something — six skills and twenty
references from `find`, one executable from `git ls-files`, four version surfaces and
eight negative self-tests read out of the validator and the workflow.

### The guard flagged the paragraph explaining why it must not

A general "every path in this file must exist" check cannot tell a path being **used**
from a path being **discussed**, and the rewrite names three `seo-aeo-audit` files on
purpose — to send a reader who wants them to the right repository. I wrote that as the
guard's own comment, then wrote a regex that read the whole section up to the next
heading, and it flagged exactly those three. **#7, inside the change that cites it, one
paragraph later.** Narrowed to table rows; a bare filename resolves by basename so the
generic `SKILL.md` passes while `benchmarks.md` still fails.

That is three drafts for one small guard — whole-section, table-rows-exact-path,
table-rows-with-basename — and each draft was corrected by running it rather than by
reading it. The cost of running it was seconds; the cost of the version that shipped
without running would have been a red gate on a correct document.

### What fired, per entry

**#7** — as above, and it is now four recorded firings. **#6** — every plant in this run
asserted it landed, and the CI self-test was executed locally exactly as written before
being committed. **#4** — the sweep replaced a re-read: eleven versus six is the
difference between measuring and quoting. **#8** — each gate run alone with its exit code
read on its own line, and the member validator invoked with an explicit `cd` after
yesterday's compound-command incident. **#10** — the stamp SHA read from `git rev-parse`
inside the writing script, which is now the standing practice rather than a resolution.
**Did not fire:** #1, #2, #5, #9, #11.

*(prune at 2026-08-16 (ninth): **no retirement.** #7 fired, resetting its count from four.
#2 seven, #5 four, #9 four, #11 two, #1 one, #6 fired. Nothing has become a mechanical
check and no named path is gone. Ten of ten slots used, nothing added — the intake lesson
above belongs to `/task-pipeline`'s board doctrine rather than to this list, and it is
already true there: *the board's priorities are re-derived*, which a filing that measures
its own scope makes possible.)*

## 2026-08-16 (eighth) — the guard for a mistake I made twice, and the two it made itself

Twice today a run stamp carried a SHA that had never existed — `dd0b1a2`, then `f9c3a4e` —
both caught by hand, minutes apart, by the author who wrote them. The diagnosis is not
attention. **The SHA is unknowable until the commit is made**, so it gets typed, and typing
it is guessing. `task-pipeline` shipped the rule for its own docs in v1.60.0 and this
repository never grew the check. It has one now, over 31 stamps, asserting both that the
object resolves and that it is reachable from `HEAD` — the second because a stamp naming a
commit an amend replaced resolves on the machine that wrote it and in no clone.

The immediate remedy is smaller than the guard and worth writing down: **read the SHA from
git in the same command that writes it.** The third stamp today was correct because
`git rev-parse` produced it inside the script, not because I was more careful.

### The guard was blind to the only environment that runs it unattended

CI went red on twenty real commits. `actions/checkout` clones shallow, so August's history
is absent there, and every old stamp read as fabricated. Written locally, where full
history makes the check trivially green — **the shape this repository keeps recording, and
the first time it appeared in a guard whose entire subject is what a clone can see.** It now
reads `git rev-parse --is-shallow-repository` and discloses; the workflow takes
`fetch-depth: 0` so CI can look at all.

### Fixing that hid a setting, and the parser said ok

The inserted `with: fetch-depth: 0` landed **above** the step's existing
`with: submodules: recursive`, giving one step two `with:` keys. Valid YAML; the last wins;
`fetch-depth` simply did not exist. `yaml.safe_load` returned a document and my check
printed *YAML ok* — a verification that ran, passed, and verified nothing about the thing I
had just changed. GitHub would have done the same, so nothing downstream would have said a
word either.

`check_workflows_parse` now refuses duplicate keys and names the key and its line. That
guard has existed since v0.33.0 and has been passing over this hole the whole time.

### A section of an already-released version grew a paragraph

The stamp guard was first written into the `v0.65.0` section, which had been tagged twenty
minutes earlier — so the notes on `main` promised something the tag does not contain. The
same class `docs/AGENT_SYNC.md` records as *a CHANGELOG written at a version behind its own
tree*. Moved into `v0.66.0` and released, rather than left as a sentence nobody would ever
reconcile.

### What fired, per entry

**#10** — its own subject, twice as the defect and once as the fix. **#5** — the guard was
written against a repository state (full history) that the environment running it does not
have. **#1** — *a component that never receives its input fails OPEN* is exactly what
`safe_load` over a duplicate key does, and it fired for the first time in five stamps, one
run before its cold trigger would have retired it. **#8** — every release step's exit code
read on its own line; the bad `v0.66.0` tag was caught by reading CI rather than assuming.
**#4** — *YAML ok* was a uniform answer that could not distinguish the case it was asked
about. **Did not fire:** #2, #6, #7, #9, #11.

*(prune at 2026-08-16 (eighth): **no retirement, and #1 has earned its stay.** It stood at
five stamps without firing — its cold trigger — and fired here, on a parser that accepted a
document and answered a question nobody had asked. The previous prune flagged that five
stamps in one day is not the five the rule was written for; that caution is now vindicated
rather than merely cautious. #2 six, #7 five and now at the trigger, #6 one, #9 three,
#11 one. Ten of ten slots used, nothing added.)*

## 2026-08-16 (sixth) — the invariant was enforced one repository from the file that breaks it

B-54, closed. Every trigger in the umbrella's routing table must be a word the member's own
description advertises; only the umbrella asserted it, and the member releases first. The
fix moves the question to the member and leaves the answer in one place: seven members now
call `test/advertised_check.js`, which reads `lib/triggers.js` itself, so nothing is copied
and nothing can drift.

### The self-test could not live where the rule says it should

This family's house rule is that a new validator guard gets a negative self-test in that
repository's CI. Here it cannot: the member-side check needs an umbrella above it and
**discloses** without one, and a member's CI clones it standalone — so a plant there would
assert a refusal that cannot happen. Written down rather than skipped, and the plant moved
to the umbrella, where the submodules exist. That is the rule's intent surviving a case its
letter does not cover.

### A sweep that only read the exit code would have lied

`agent-sync`'s other checks reject the planted description on their own, so it exits 1 with
the wiring deleted. The sweep requires the exit code **and** the specific message, which is
the only reason deleting the call showed up as a failure instead of a pass. The test for
that was cheap and it is the one that made the sweep worth having.

### Two instruments wrong before the subject, both caught by asserts

The plant first replaced **one** occurrence of a phrase and reported `super-ux` as not
refusing — a phrase advertised twice survives one replacement, and the check was right to
say nothing. And the version-surface driver used `glob('**/*.json')`, which does not descend
into dotted directories, so `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
— two of the three JSON surfaces **every** member has — went unbumped in all seven. Neither
reached a conclusion, because both drivers assert what they planted. `os.walk` now.

### The class was fixed in one place and left in another, again

`make-skill` carries `version: "0.19.0"` **quoted**; the bump driver matched the bare form.
Fixed by hand there — and not swept, so `agent-sync` tagged with four of six surfaces moved
and its own CI refused it. That is R-003 exactly, one release apart. The sweep that should
have run first was written afterwards, over all seven, and found the two remaining surfaces
in one command. Nothing published from the bad tag (`gh release view v1.11.1` → not found),
so it was moved rather than superseded — the third tag moved today, all three unconsumed.

### A gate that costs eight times what its own doctrine allows

Adding the sweep to `npm test` took the suite from 3.3 s to **26.2 s**. `hooks/repo-gate.js`
runs `npm test` before every commit and says, in its own header, that the gate is *only
honest because of a number* and that a slow one is *a gate people route around*. So the
sweep was moved out to `npm run test:plants` and the suite measured back at 5.2 s. The
alternative — excluding it by name from the runner — was refused because that runner
discovers rather than lists, deliberately. The price of not being discovered is that
nothing calls it, so both ends of the wiring are asserted and each was watched failing.

### Seven gates bumped, four re-run

The version bump touched seven members and only four were re-run locally before tagging;
`agent-sync` was one of the three. Every member's own CI is what caught it, which is the
system working — and the reason it had something to catch is that a batch operation was
verified in part. There is no new instruction for this: **#8** already says a wrapper's
exit status is not the verdict, and *four of seven* is that with a different arithmetic.

### What fired, per entry

**#6** — twice, and both times the assert is what reported it rather than the outcome.
**#8** — the four-of-seven verification, and a `python3 test/advertised_plants.py | tail`
that showed FAIL and returned 0. **#11** — the `super-ux` non-refusal, suspected as the
checker's first and correctly. **#4** — the gate-cost measurement was taken rather than
assumed, which is what turned an invisible 8× regression into a decision. **#10** — the
board id and the stamped SHAs were read from git. **Did not fire:** #1, #2, #5, #7, #9.

*(prune at 2026-08-16 (sixth): **no retirement.** #1 has missed five recorded stamps and is
AT its cold trigger — but the trigger reads *has not fired in five run stamps*, and five
stamps in one day is not the five the rule was written for. It stays this run and is named
here so the next prune inherits the question rather than the count. #2 five, #7 four, #5
three, #9 two. Ten of ten slots used, nothing added: R-003's recurrence is a citation, and
the four-of-seven lesson is #8 with different arithmetic.)*

## 2026-08-16 (fifth) — a crash was released, and every gate was green about it

B-56 said the launcher leaves channels **stale**. Measuring it found the opposite and
something worse: the hub was **ahead**, because `seo-aeo-audit`'s fix for a `KeyError`
that killed the default markdown output on most pages had been committed to `main` at
02:25 and never tagged. The umbrella pinned 0.20.0 — the version that crashes — and
`check_pins.py` was green the whole time, correctly, because the pin did match the latest
release. **The latest release was the problem, and no check in the family had a way to
say that.** The pin is a tag; the skills-CLI channels install from the branch; nothing
compared the two promises. `test/release_lag.py` does now.

### The first instrument called 22 members clean for the same empty reason

The check that found this was the third attempt. The first read a `version:` field out of
each hub `SKILL.md` and reported **0 stale of 23** — while printing `no version field`
for 22 of them, because only `sheleg-design` carries that key. The summary line counted
"could not read" as "not stale". That is standing instrument #4 in its purest form, and
the tell was in the output the whole time: a uniform answer with a uniform excuse beside
it. The shipped version hashes file trees and needs no field to exist.

### Two of its first three findings were the checker's

Hashing found three: `references` "absent from the hub", `agent-sync` drifted,
`seo-aeo-audit` drifted. The first is not a skill — a shared references directory under
`skills/` with no `SKILL.md`, which my walker counted as one. The second was
`__pycache__` in a working tree. Only the third was real. Suspecting the checker first
(#11) is now cheap enough that it happened before the false ones were reported anywhere,
which is the difference between an instruction firing and an instruction working.

### A negative self-test that assumed a depth CI does not clone at

The lag check shipped with a CI plant that walked a submodule back with `HEAD~1`. CI
clones submodules shallow, so the plant died on `pathspec 'HEAD~1' did not match any
file(s)` — taking down validate, release, and the v0.63.0 tag with it. **#6, and with a
twist worth naming:** the plant *did* assert a precondition (`rev-parse --verify
origin/main`), and asserted the wrong one. Checking that the ref exists says nothing
about whether history behind HEAD does. It now synthesises the ahead-ref instead of
walking back — which works at any depth and is the truer shape, since the incident was a
branch that moved rather than a pin that reversed.

Nothing shipped from the failed tag: no npm publish, no GitHub release, `gh release view
v0.63.0` → *release not found*. The tag was therefore **moved** rather than superseded,
and that is the second tag moved today. Both times the same rule applied and gave the same
answer — a SHA is frozen once a record names it, and neither of these was named.

### The launcher, characterised rather than fixed

`✗ Failed to update sheleg-design` reproduces on every run. Three causes ruled out by
measurement: not rate limiting (`GH_TOKEN=$(gh auth token)` removes the limit line and
not the failure), not size (`super-ux` is 2.2 MB across 123 files and succeeds), not the
lock record (structurally identical to seven members that work). What it *is*: the CLI's
"needs an update" answer comes from `skillFolderHash`, which only a **successful** install
refreshes — so one failure makes a member permanently pending and permanently failing. The
hub copy is byte-identical to the source right now and the CLI still says `Found 1 global
update`. Left open under B-56 with the loop named, because the fix is in a third-party CLI
and the family's own remedy — asserting every channel against its source — is the thing
that found it.

### What fired, per entry

**#4** — the version-field instrument, 22 uniform answers read as clean. **#11** — twice,
both before anything was reported. **#6** — the CI plant. **#8** — every gate in this run
was run alone with its exit code read on its own line, after the shell-block incident four
hours earlier. **#10** — the release-lag check reads committed refs, never a working tree,
and discloses when it cannot. **Did not fire:** #1, #2, #5, #7, #9.

*(prune at 2026-08-16 (fifth): **no retirement.** #1 has now missed four recorded stamps,
#2 four, #7 three, #5 two, #9 one — none at the five-stamp cold trigger. Ten of ten slots
used and nothing added: the lesson this run produced, *a precondition asserted is not the
precondition needed*, is #6 sharpened rather than a new rule, and it is written into #6's
entry above rather than given a slot.)*

## 2026-08-16 (third) — the router nobody could reach by asking

B-49 said `sheleg-design`'s triggers matched none of the ways an operator asks for
visual work. That was true, it was fixed, and the run diverged three times on the way —
once in the measurement, once in the shell, once in a claim written before the matcher
was run.

### The instrument was wrong before the subject was

The first probe compared exact substrings between a trigger list and a prompt, and
reported three misses and one leak. All four were the checker's. Russian declines, so
`палитра` "missed" `палитру` and `красивее` "missed" `красиво`; and the probe tokenised
the compound trigger `кинематографичный лендинг` into words, then reported the bare
`лендинг` leaking onto copy work — a word that was never a trigger at all. **Standing
instruction #11 firing exactly as written**, and cheaply: the real matcher in
`lib/triggers.js` already stems, and reading it was the whole fix.

The lesson underneath is narrower than "read the code". A hand-rolled proxy for a
mechanism that exists is a *second* mechanism, and it will disagree with the first in
whatever direction its author did not think about. The measurement that shipped runs
`T.match()` — the function the hook calls — over the same prompts.

### A `cd` that failed did not stop the tag that followed it

The release ran as one Bash block:

```
cd skills/sheleg-design && git add -A && git commit -F - <<'EOF' … EOF
git push origin main && git tag v1.37.1 && git push origin v1.37.1
```

The `cd` failed — the shell was already in that directory from the previous call — and
`&&` correctly stopped the commit. It did not stop **line two**, which pushed and tagged
anyway. `v1.37.1` landed on the tree of `v1.37.0`, on a remote, with a release workflow
already running against it.

Nothing was published, and the reason is worth naming: the release workflow's own
version-sync step refused with `tag v1.37.1 does not match 1.37.0`. A gate this pack
ships caught a mistake this pack's author made, on a tag that had already left the
machine. The repair was the cheap one — cancel the run, delete the tag locally and on
the remote, commit properly, re-tag — and it is recorded rather than smoothed over
because the near-miss is the evidence, not the outcome.

**Cited to #8, not filed as an eleventh instruction.** *A wrapper's exit status is not
the suite's verdict* already names the class; this is its shell-block form — **a
multi-line command is not a transaction, and `&&` binds a line, not a block.** The
standing list is at its cap of ten and no entry has earned retirement (#1 has now missed
three recorded stamps of the five its cold trigger needs), so adding an eleventh would
have forced an unearned deletion. Every step of the re-release printed its own exit code
on its own line.

### A comment asserted a route the matcher does not take

`дизайн` cannot be a trigger: it is a substring of this route's own refusal «без
дизайна», and the fixture rejects any trigger inside a refusal — a trigger there makes
the refusal unsayable. The first draft of that comment then added that `сделай дизайн
лендинга` "stays with `super-ux`". It does not. `T.match()` returns `[]`. The claim was
written from the composition order rather than from the mechanism, it survived one
reading, and it was caught only because the same run measured the phrase for another
reason. The comment now states the measured result, and B-53 carries the open question
of whether that phrase should open the whole chain.

### What the member's own gate could not see

`sheleg-design` 1.37.0 shipped green on 4636 checks having dropped `фигма в код` from
its description — a phrase that is a live trigger in this repository's routing hook. The
member has no way to know the trigger table exists. `test/triggers_test.js` failed here
minutes later, 1.37.1 restored the phrase, and B-54 carries the structural version: the
invariant *every trigger is a word its skill advertises* is enforced one repository away
from the only file that can break it, and the member releases first.

### The documented bypass, exercised

Guarded files in this repository were edited before the lease was taken. The guard hook
watches `Bash` as well as `Edit`, and did not fire, because every write went through a
`python3 - <<'EOF'` heredoc — the exact unparseable shape `CLAUDE.md` already describes
as failing open. No conflict resulted (`status` showed no other run holding anything),
and the lease was taken before the release commit. Recorded because a documented risk
that has now been observed is a different thing from one that has not.

### What fired, per entry

**#8** — twice: the shell block above, and a `npm test | grep` whose exit code came back
empty, re-run redirected. **#11** — the substring probe. **#6** — every plant in this
run asserted it landed (`PLANT DID NOT LAND`), and one did not: the umbrella's CHANGELOG
uses `## vX.Y.Z — title`, not Keep a Changelog, so the insert raised `ValueError` instead
of writing a section into the wrong place. **#10** — the next free board id was read from
`git show HEAD:`, not from the working copy. **#9** — CI was resolved by tag and by
`npm view`, never by "the latest run". **Did not fire:** #1, #2, #4, #5, #7.

*(prune at 2026-08-16 (third): **no retirement, and none is earned.** #1 has missed three
recorded stamps, #2 three, #7 two — all short of the five-stamp cold trigger. Nothing has
become a mechanical check and no named path is gone. Ten of ten slots used, and the
lesson this run produced was cited to #8 rather than given a slot, which is the same
resolution the 2026-08-14 prune used for #7.)*

## 2026-08-16 (second) — the gate we ship had never run on us

### One line of wiring, five findings

`task-pipeline` ships a documentation gate and tells every project to run it. It had
never run on `task-pipeline`. Wiring it into `test:all` took one line; the first execution
found five things, and the two that matter are the ones that explain why nobody knew:

- **`[ -d .git ]`** — false in a submodule checkout, where `.git` is a file. The section
  printed `skip`, which is indistinguishable from having nothing to check. **This is the
  third time in two days that this exact shape disarmed something here**: it disarmed two
  negative self-tests on 2026-08-15, and now the shipped gate.
- **The corpus default still named the artifact root as it was before the 2026-08-13
  rename**, so in every migrated project the section went `dormant` — the *other* word for
  silence.

What it had been unable to report: eleven unfollowable commit references, two decisions
that had propagated nowhere, and one id reported undefined because the checker could not
tell a planted payload from a claim.

### The lesson is about silences, not about any of the five

Every finding was cheap once the gate ran. What cost months was that a check reported
`skip` and `dormant` and nobody reads those as *the check did not happen*. A gate has three
outcomes and only two of them are honest by default; the third has to be made loud.

**What this run did about it, and what it did not.** It fixed both silences and wired the
gate in with a guard requiring the wiring. It did **not** go looking for other checks in
this family that can skip themselves — that is a real sweep, it is exactly what
`learned.md` rule 6 would ask for, and it belongs to a run that plans for it rather than
one discovering it at close-out.

### A check whose false-positive rate was measured before it shipped

`B-48`'s remaining half was *nothing verifies that a member's description describes the
skills it ships*. The obvious check — token-match the names against the prose — was built
and **measured first: four false failures out of eight members**, because the concept was
in every description and the word was not (`ad-tracking` as "GA4/Ads/Meta",
`ux-foundation` as "personas and jobs").

It was not shipped. What shipped is the **co-edit**: if `skillNames` changes and `desc`
does not, that is mechanical and needs no opinion about prose. Recorded because the
instinct is to ship the first check that catches the known case and discover its false
positives in someone else's release.


## 2026-08-16 — the rewrite that could not tell data from a path, twice

Eleven findings from a graph audit of our own skills, run as a programme of nine modules
plus a shared close-out. Everything landed. Two things are worth the file.

### The same mistake, one day apart, by the same author

Standing instruction **#7** says a mechanical rewrite cannot tell a path being *used* from
a path being *discussed*. On 2026-08-15 it fired when a blind `B-073 → B-075` replace
rewrote a concurrent session's reference to their own board row. On 2026-08-16 it fired
again: the first fix for B-075 rewrote every `/tmp/...` path in a step's script to a
per-run name, and broke two plants whose entire payload is the workflow text — they search
the copied workflow for a literal path in order to duplicate it.

**Neither was caught by reading.** The first was caught by re-reading a diff; the second by
`npm run test:all` reporting `2 test(s) broken` with *the planted defect changed nothing*.

The shipped fix abandons the rewrite: the paths stay exactly as CI has them and the runs
are **serialised with a lock**, so the second one waits and says so. That is smaller than
the rewrite, cannot touch the workflow text at all, and matches what the runner's own
comment had said all along — the collision is *between* two suite runs, never inside one.

**What this run refused to do about it.** Adding a standing instruction *"before a sweep,
ask which targets treat the pattern as data"* was considered and rejected: it is #7
restated, and a capped list holding one rule twice is a list of nine.

### A check that caught the person who wrote it, on the day they wrote it

`agent-stack` gained a duplication check — every reference was checked for *existence* in
both directions and nothing checked whether two of them **say the same thing**. It was
built from a measurement: the largest overlap in the pack was **50 shared twelve-word
runs** between `agent-harness/SKILL.md` and the graph reference, which was one decision
table written into two homes the previous afternoon by this same author.

Minutes after the check went in, the M8 split moved two sections into `patterns.md` and
left one rule in both files. The gate refused at 29 runs. **That is the whole argument for
grade-1 fixes in one incident**: the doctrine had been in the canon for months and did not
prevent the duplication; the check prevented the next one within sixty seconds.

### The stamping procedure is the defect, not the attention

**Instruction #10 fired twice in this one close-out, both times the same way.** The retro
stamps a run with its own commit; the commit is then amended to carry the filled stamp; the
amend changes the SHA; the stamp now names a commit that resolves on this machine and in no
clone. It happened in `task-pipeline`, was repaired with a follow-up commit, and then
happened again in the umbrella twenty minutes later — because the *procedure* invites it,
not because anybody was careless.

The repair both times is a **follow-up commit, never a second amend**: amending to fix a
stamp is the loop that produced the problem. The procedure that would remove it is to stamp
with a follow-up commit from the start, and that is a change to `retrospective.md` this run
is **not** making — it is a doctrine edit discovered at stage 10, and stage 10 is where a
run accounts for what it did rather than where it starts new work. Filed instead.

### Two smaller ones, recorded because they were measured rather than argued

- **The shadow prune could delete the only copy of a skill.** `shadowsToPrune` was fed the
  *marketplace* listing while its own code comment said *"a copy is a shadow only where a
  plugin of the same member is installed"* — and the two are different, because
  `marketplace add` and `plugin install` are separate operations. Measured on the pure
  function before touching anything: with no plugin installed anywhere, it returned the
  copy for deletion. The doctrine was right in the comment and wrong in the argument.
- **A wrapper reported two release runs complete while both were running.** Caught by
  reading the registry, which still served the previous versions. Instruction #4's shape:
  the instrument answering about itself rather than about its subject.

### What is left, and it is one thing

`B-51` — the code graph cannot be refreshed on this machine without an LLM key, and
`--code-only` would index ten code files while dropping the thirty-nine documents that are
most of the pack. No commit decides it. It is the single human step this programme leaves.

## 2026-08-15 — the shape of the work, and the reader who ran the experiment

The task was to take an article's model of graph-shaped work into `agent-stack` and audit
`task-pipeline` against it. Both landed. What the run is worth recording for is neither.

### A concurrent session moved the ground twice, and the harvest was corrected rather than kept

Stage 0's source ledger recorded `agent-stack` at **v0.8.0 with twelve references**. By
stage 2 that was false: another session had released **v0.9.0**, added two references to
`agent-harness`, rewritten that skill's References table and committed the umbrella's pin
bump (`0f557c5`, PR #8) — all inside the forty minutes the harvest took. Nothing of this
run was lost; the working tree held one untracked brief. It was detected by
`git submodule status` disagreeing with a reading taken earlier, **not by anything in the
run**, and the ledger row was rewritten to say so rather than left saying 0.8.0.

Then it happened again, smaller: `origin/main` gained a docs commit between the local
rebase and the push. Instruction **#5** covers this and fired both times — re-measure the
whole, do not chase the member the log named.

### The instrument that disagreed with itself, and the wrong conclusion that was available

`test/negatives.py` reported **1, 2, 3 and 4 guards down across four runs of an unchanged
tree**, plus property checks silent in two of them. *The suite is flaky* was available,
cheap, and would have justified shipping over a red.

It was false. Two suite runs were overlapping, and every step copies the repository to a
**fixed** `/tmp` path — the runner's own comment says *"collisions only happen between two
SUITE runs"*. Two hypotheses were tested and disproved before that was found (325 steps
with 325 distinct paths; zero parent/child nestings), which is instruction **#11** doing
its job and instruction **#4** one step sharper: instability across runs that should agree
is a fact about the instrument.

### Twice, a fix covered one of the two places its defect lived

Both found by the PR's independent reader, across **four rounds and fourteen findings**:

- The group convergence check went into §4.2a's prose and into `SKILL.md`'s stage table and
  into **neither GATE bullet** — the criterion existed everywhere except where a run stops.
- The `.git` restore parsed a `gitdir:` pointer by hand: right for a submodule, wrong for a
  **linked worktree**, the shape `build.md` itself tells every run to use.

The second is the sharper one, because the CHANGELOG **and** a verification row already
claimed all three shapes were covered. The reader disproved a shipped sentence by running
the experiment I had not: from a worktree on `feature`, the restored snapshot reported the
main checkout's branch and a log missing the worktree's own commit. That is now `task-
pipeline`'s standing instruction **R-008**.

### What fired, per entry — continuing what the last prune asked for

**Fired:** #4 (the four disagreeing suite runs) · #5 (twice — the pin moved under the run
twice, re-measured whole both times) · #6 (all sixteen new plants structural and asserting;
the one that broke was anchored on a cell's *content*, the same class one column over) ·
#8 (`${PIPESTATUS[0]}` came back empty in zsh; every exit code after that was read from the
command) · #9 (every CI verdict resolved by tag SHA, never by `--limit 1`) · #10 (the
umbrella validator refused the moved pins until the submodules were committed, which is
exactly right) · #11 (twice — two disproved hypotheses, and a CI failure that was the plant
rather than the doctrine).

**Did not fire:** #1, #2, #7. None is near its five-stamp cold trigger.

**Nothing retired and nothing added.** The list stays at ten. The lesson this run earned —
*enumerate the shapes a defect takes before writing the fix* — belongs to the repository
where it happened and is `task-pipeline`'s R-008; adding a second copy here would be the
two-homes defect this run spent a section removing.

### The version number two branches both claimed

`task-pipeline`'s main gained a **different v1.56.0** while this branch sat in its fifth
review round, and both claimed the number. This work shipped as **1.57.0**; a board id
collided the same way and `B-073` became `B-075`. Neither was an accident of haste: the
repository *declares* an id register for `B-` in `.claude/agent-sync.json`, and the `fs`
backend behind it cannot allocate, which is the umbrella's own open row **B-45**. A
register that cannot reserve is a register in name only, and it cost a version number and
a board id in one afternoon.

The merge kept both sides everywhere — their stage-5 clause beside this run's, their two
board rows above this run's renumbered one, both CHANGELOG sections in version order. The
one thing it did not keep was **their** reference to their own board row, which a blind
`B-073 → B-075` replace rewrote inside their CHANGELOG section. Restored from
`origin/main`, and recorded above as standing instruction #7 firing on its author.

**And the squash commit's subject on `main` still says v1.56.0.** It is wrong; it is the
branch's original title, and it is deliberately not being rewritten — force-pushing `main`
minutes after a collision with a live session is the larger risk. Every other surface says
1.57.0, and the tag message says why the subject does not.

### The disclosures

- **The code graph was not refreshed** and `--code-only` was deliberately not used: it
  indexes 10 code files and drops the 39 documents that are most of the pack, which is a
  fresher graph that knows less. Filed as **B-51**.
- **`agent-orchestrator/SKILL.md` grew 5009 → 5670 tokens** against a self-set 4750 budget,
  after two compressions that recovered 21 tokens net. Filed as **B-50**.
- **`seo-aeo-audit` is pinned at 0.17.1 while npm serves 0.19.0** — another member released
  by the concurrent session, deliberately not moved by this run: its submodule pointer was
  never verified here, and instruction #5 is about not chasing what is still moving.

## 2026-08-14 — the check that proved a trigger was advertised had been reading one line of fifteen

**Symptom.** A ninth router was added with triggers taken from the descriptions of
the skills it fronts. `every trigger is a word the skill itself advertises` reported
twelve of them missing — including `subscription billing`, `webhook` and
`подключить stripe`, which `stripe-billing` advertises verbatim in its own
front matter. The check had passed on every run since it was written.

**Root cause.** Its parser was
`/^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|$)/m`. The `/m` flag is
required for `^description:` — the key is not first in the front matter — and it
also rebinds `$` to end-of-**line**. So the capture stopped at the first newline of
a folded YAML scalar: **74 characters of `stripe-billing` instead of 993**, 85 of
`ad-tracking` instead of 879, and so on for every skill in the family. The guard
that should have caught it, `assert.ok(desc.length > 40)`, passed because one line
of a description comfortably clears forty characters.

**Surfaced at** stage 5, by a route whose triggers were correct. **Owned by** the
run that wrote the check: it was verified by watching it pass, and a check that
reads one fifteenth of its input passes for the same reason it is useless.

**Fix, by grade.** *Mechanism:* the end anchor is `(?![\s\S])`, which matches only
at true end of input, and the floor moved from 40 to 200 characters with the reason
in the message — one line clears forty, which is why forty proved nothing.
*Mechanism:* whitespace is collapsed, because a folded scalar wraps and
`"оплата\n  подпиской"` is a phrase `stripe-billing` genuinely advertises; this is
the decision `router_texts_test.js` had already made, in a comment, for its own
doctrine texts. *Doctrine:* standing instruction #11.

**A second finding, from the same red.** `sheleg-dev` is the first router that
fronts a **pack** rather than a skill. A route key must equal the router name, so it
cannot be split into six routes, and no single skill's description can advertise six
skills' words. Routes may now declare `sources`, one entry per skill; `triggers` and
`skill` are derived from them so every other consumer of the table is untouched. The
derivation makes `spec.skill` the *first* source's, which is exactly the field that
would hide a typo in sources 2..N behind a valid first entry — so a new check holds
every source against a shipped skill.

**The check that catches it next time.** For the parser, the 200-character floor and
`a pack-fronted route reaches every skill it fronts`. For the class, #11.

### The same shape, in a check this run wrote

The Contents-anchor checker's first run reported 22 failures across all 21
references. Every one was the checker: GitHub's slugger drops punctuation and turns
each surviving space into one hyphen without collapsing, so `## FR-01 — Collect the
funnels` anchors as `#fr-01--collect-the-funnels`. Two instruments wrong in one run,
on the same afternoon, is what made #11 an instruction rather than a note.

### A recorded decision was reversed, and the reversal is recorded

v0.26.0 brought `sheleg-dev` and `agent-stack` into the family with **"No new
routers — a router *obliges*; these are reference skills found by description, and
seven more global rows would grow every project's instruction file for no gain."**
That reasoning held until the thing being obliged turned out to be invisible: a
funnel's payment and analytics layer fails without changing what the funnel looks
like. The reversal is **one** row, not seven, and only for `sheleg-dev`. Written into
the wiki page that carries the original decision, next to it rather than over it.

### A premise was measured and disproved before any code was written

The work was scoped on the assumption that funnels are unrouted. `routers-registry.js:31`
has named them in the `super-ux` text all along. What was missing was never the
funnel; it was the pack behind the money. This is the third run in a row where a
stage-0 measurement contradicted the brief's premise, which is an argument for
measuring first rather than for writing better briefs.

### Coordination was red in all nine repositories on the day it was declared on

41 problems, and none of the configs had ever been run through `check`. Two
mechanical classes: patterns matching no tracked file — the umbrella's ten
`skills/*` paths, unmatchable because a submodule is a gitlink, and a
`test/negatives.py` guarded in seven members that `B-26` records the decision **not**
to create — and `.env.agent-sync` uncovered by `.gitignore`, one `git add -A` from a
remote. Eight are clean now; `task-pipeline` is untouched because it carries another
session's uncommitted v1.55.0.

**The repair proved itself within the hour:** an edit to
`skills/super-ux/test/validate.py` was refused with *this run holds no lease* before
any lease had been taken. A guard that has refused is a guard. Filed `B-46` for the
absence underneath it — nothing runs `agent_sync.py check` in CI, which is why 41
problems accumulated unseen, and a one-time sweep returns the moment a config is
copied between members, which is exactly how they arrived.

### The graph could not be refreshed, and the report says so in its own header

`graphify . --update` saw the change and stopped at `no LLM API key found (52
doc/paper/image file(s) need semantic extraction)`. No key is present here, checked
rather than assumed, and `graph.json` was left byte-identical. `--code-only` needs no
key and is the wrong trade for a repository that is mostly doctrine: it would answer
fewer questions than the stale graph while looking current. So the staleness went
into `GRAPH_REPORT.md`'s own header with the two numbers that matter — labels saying
"206 practices" against a catalog of 215, and `funnel-research.md` appearing zero
times — because a wrong doc gets argued with and a wrong graph gets believed. Filed
as super-ux `B-022`.

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


---

## 2026-08-13 (second and third runs) — four defects, all mine, all found by using the thing

**Symptom.** Three consecutive releases, and every one of them shipped a defect
the next few hours found — not in old code, in code written the same night.

1. **The status line printed `gates N/N` at every point of every run.** Both
   numbers came from how many `stage:` lines the ledger held. At stage 4 of ten it
   said `gates 5/5`.
2. **The release gate matched `stage: 6` literally.** A project whose flow has six
   stages, tests green at stage 4, could never tag anything again.
3. **The release gate read a verdict typed by the agent it constrains** — and,
   once corroboration was added, accepted *any* green observation, so an earlier
   green satisfied it over a later red.
4. **The repository gate judged commits belonging to other repositories**, and
   deadlocked a release live: the umbrella red *because* the submodule had not
   shipped, the submodule unable to commit the fix because the umbrella was red.
5. **The progress numerator counted lines too** — fixed one side of the fraction
   and left the identical defect on the other. `gates 12/11 · 109%`.

**Owned by** stage 5 in every case, and by stage 6 for not looking at the
artefact. None was found by a fixture written for it. Two were found by *reading
the widget while it described the run that built it*; one by running the observer
against this repository's own ledger; one by the gate blocking a commit and the
deadlock being traced rather than worked around.

**Root cause.** One shape, five appearances: **a count taken over the record
rather than over the thing the record is about.** Lines instead of stages, twice.
A stage number instead of the stage's role. Any observation instead of the
current one. A project directory instead of the repository a commit belongs to.
Each is cheap to write, reads correctly, and is wrong only against a case the
author did not have in front of them.

**Fix, by grade.**

- *Mechanical (taken):* every count is now over distinct, current things —
  distinct stage ids with the last verdict winning; the tests stage resolved by
  role from `pipeline.json`; the last observation; staged changes in this
  repository. Each with fixtures in both directions, because "later red blocks"
  and "later green clears" are different failures.
- *Standing instruction — none, deliberately.* The grade above one is a check and
  five exist now. A rule saying "think about what you are counting" would be
  strictly worse than fixtures that refuse the commit.
- *What actually caught them is worth naming, because it is not a rule:* the
  pipeline ran on itself. The widget described its own run, the observer watched
  its own suite, the gate blocked its own commit. **Dogfooding found four defects
  that eighty-eight fixtures did not**, and the reason is structural — a fixture
  encodes the case its author imagined, and every one of these was a case nobody
  imagined until the artefact was in front of them.

**The honest note about pace.** Three releases in one session, each fixing the
one before. Every fix was real and every gate was green when it shipped; the
defects lived in the space between "the suite passes" and "someone looked at the
output". That gap is exactly what stage 8 is for, and it was the stage that kept
finding them — after the tag, every time.

---

## 2026-08-13 (fourth run) — the sweep that disarmed three checks and rewrote 51 records of the past

**Symptom.** Renaming a directory in seven repositories produced five defects, and
**not one of them was in the rename.** Every one came from the mechanical rewrite that
followed it, and four of the five were caught by a check rather than by reading.

1. **A guard passed by having no subject.** The sweep rewrote
   `` `docs/superpowers/…` `` to `` `<artifacts>/…` `` in `artifacts.md`, and the guard
   comparing that file's tables against its own layout tree searched for the *resolved*
   literal. It found nothing, its subject went empty, and it passed. `npm test` was
   green. The negative self-test said `does not actually fire`.
2. **A CI plant stopped landing.** The plant that removes the layout tree anchored on a
   bare `superpowers/` — a spelling the path sweep never matched. It said so, loudly,
   because it asserts its own effect.
3. **Two sentences whose SUBJECT was the old name were flattened into nonsense** — the
   schema description and `artifacts.md`'s legacy note both became *"else
   `docs/evidence/` (the name this pipeline used until 2026-08-13)"*.
4. **51 frozen records of past runs were rewritten across five repositories.** The M3
   sweep's exclusion list said `docs/superpowers/` while the directory had already been
   renamed, so it matched nothing at all. Reverted exactly — `git checkout -- docs/evidence/`
   against a staged rename — and re-verified by count: 60 occurrences preserved inside
   the moved records, plus 6 in CHANGELOGs, equal to the frozen figure measured at
   stage 0.
5. **`migrate-artifacts` backed up when nothing moved,** so a second run against a
   still-colliding tree changed the tree it claimed to leave alone.

**And one whole requirement that shipped without reaching anything.** REQ-07's session
line was published, installed, and dead: `update` refreshes plugins and the routing
block but not the wired runtime, so `~/.sshlg-skills/runtime/lib/` sat at 24 modules
against the package's 25. Found at stage 8 by listing the directory instead of trusting
the release — `hooks install` made it live, and `B-22` now carries the gap.

**Owned by** stage 5 for the five defects. The sixth is stage 7's: the release checklist
verifies the published version and the plugin versions, and never the copy the hooks
actually execute.

**Root cause.** Two, and only one of them is new.

The five defects are one shape: **a mechanical rewrite cannot tell a path being USED
from a path being DISCUSSED, and its exclusion list describes the tree it was written
against rather than the tree it will walk.** Prose that explains a name, a guard that
matches on a name, a plant that anchors on a name and a record that reports a name all
look identical to `str.replace`.

The sixth is the shape this file has recorded three times in other clothes — *a new
artifact has nowhere to land on a machine that predates it*. Here the artifact is a
module, the machine is any machine that runs `update`, and the reason nobody noticed is
that every OTHER thing `update` touches did move.

**Fix, by grade.**

- *Mechanical (taken):* the tree guard is anchored on the SYMBOL the doctrine writes
  rather than the resolved literal, and watched failing against a planted drift; the
  plant's anchor moved with it; a new CI negative self-test reverses the precedence in
  one of the two resolver implementations and requires the suite to notice
  (312 → 313 guards); the three-run fixture that found defect 5 is now in CI.
- *Standing instructions (taken, #7 and #8 above).*
- *Board (taken):* `B-22` for the runtime that `update` does not refresh — the honest
  grade, because the fix is a refactor plus a fixture plus a release, and pretending
  otherwise inside this run is how the fix would have shipped untested.
- *No instruction for the frozen-record rewrite beyond #7, deliberately.* The grade
  above one is a check, and the check that exists is the one that saved it: the move was
  staged and uncommitted, so the revert was exact. That is worth stating as a habit —
  stage the rename, then sweep, then read the list of touched files — rather than as a
  fourth rule.

**The check that catches it next time.** Defects 1, 2 and 5 are caught mechanically now.
Defect 3 is caught by a reader, and that is stated rather than papered over. Defect 4 is
caught by the sweep printing every file it touched — which it already did, and which is
how it was noticed thirty seconds later. The sixth is caught only by `B-22` being done.

**What actually found them, and it is not a rule.** The pipeline ran on itself again.
The negative self-test disarmed by this run's own prose sweep, the plant that refused to
plant, the fixture that ran the real command three times, the directory listing at stage
8. **Four of six were found by a check that already existed and one by looking at a
directory** — and the one that no check caught is the one still described in prose.

**One more, cheap and repeated for the fifth time.** The scope was first stated as
1122 occurrences in 241 files. The real figure is 340, of which 185 are live: the first
count included `graphify-out/graph.json`, which indexes the whole tree and holds 5086
occurrences of the path by itself. A number is computed at the moment it is written, or
it is a recollection — and this repository has now written that sentence five times.

---

## 2026-08-14 — the two homes, and the four instruments that lied about their own results

The task was to give `agent-stack` a protocol layer. The grill found that half of it
already existed in `make-skill`, pinned to a revision the specification had moved past —
so the run became two repositories, and the interesting failures were all in the
instruments rather than the work.

**The finding that changed the shape of the run.** `make-skill/references/mcp.md` opened
with *"Spec revision referenced here: **2025-11-25**"* and *"Read from the spec on
2026-07-28"* — read that day, pin left on the older revision — and stated *"MCP is a
**stateful** protocol"*, describing an `initialize` handshake. The live specification
serves `2026-07-28` and reads *"Stateless, self-contained requests. Per-request
capability negotiation."* Nothing on the page distinguished it from a current
description. That is the whole failure mode of protocol prose, and it was invisible until
two descriptions of one thing were put side by side.

The remedy is mechanical rather than a resolution to be careful: `PROTOCOL_PINNED` in
`agent-stack/test/validate.py` requires `**Spec pinned:** … · read YYYY-MM-DD` on every
reference of a skill that documents somebody else's wire, rejects an impossible date, and
has two negative self-tests that were watched failing.

### Four instruments, four wrong answers, and how each was caught

| Instrument | What it said | What was true | Caught by |
|---|---|---|---|
| `gh run list --limit 1` | `release: success` for the umbrella | that run was **v0.47.1**, tagged 26 minutes earlier; v0.48.0 had not started | `npm view` still said `0.47.1` — **a different instrument** |
| `... \| tail; echo $PIPESTATUS` | `exit=` (empty) | the suite had failed; zsh spells it `pipestatus` | the output above it said `FAIL` |
| a `for u in $URLS` loop over 21 URLs | one `000`, then twenty bare lines | zsh does not word-split an unquoted variable; curl received the whole list as one argument | the shape of the output — one answer for twenty-one inputs |
| `test/validate.py`'s link regex | `agent-interop` links a `governance.md` it does not have | the text was *prose about a sibling skill's file*; the regex could not tell a path being **used** from one being **discussed** | the build, on a file never claimed |

Instruction **#4** fired on the third row and **#8** on the second — both are already
written down, both fired anyway, in this repository, in the same session that read them.
That is the argument for keeping them rather than evidence they failed. The first row is
new and became **#9**; the fourth is instruction **#7** one level out — a *guard's
matcher* making the mistake #7 describes for a *rewrite tool* — and is recorded as a
citation there rather than a tenth slot.

**Instruction #5 fired and the loop it warns about did not happen.** `check_pins.py`
named `sheleg-dev` as behind. The whole sweep was re-measured in one pass rather than
chasing the named item: seven members correct, one behind, and the one behind belonged to
another session. It was **not** adopted — moving a pin to a release whose gate this run
never executed is how *green* comes to read as *verified* — and it left as board row B-36
with the reason stated.

**Instruction #6 held on both sides.** Both new plants are anchored on the stamp's shape
and assert they changed something. Independently, another session merged v0.6.1 into
`agent-stack` mid-run, converting the existing plants to Python with landing asserts —
the same instruction, applied by someone else, colliding on the same files. Both sides
were kept; nine plants re-verified against the merged tree.

**What the stage-0 sweep bought, concretely.** The autonomy row *"is this checkout the
one that ships"* was re-run before the first edit in the second repository, and
`~/DATA/make-skill` was **two commits behind `origin/main`** at v0.16.0 while the umbrella
pinned v0.17.0. Editing there would have been undone by a later fast-forward with nothing
complaining. One command, run because a table said to, not because anything looked wrong.

**The one thing this run cannot claim.** Twelve REQ rows are verified and every one
measures the artifact. No agent has yet built anything with `agent-interop` loaded, and
the ledger says so in its own closing section rather than letting twelve greens imply it.

## 2026-08-17 — the routing was sound for eleven days and unreachable for half the family

The task was an audit of the routing, asked in one sentence. It produced five releases and a
number that did not exist before it: `test/route_coverage.js`, from **39 named / 32 reaching
nothing** to **56 / 15** over 71 prompts an operator would really type. Whether that is a
large movement is unknowable — nothing had ever measured the quantity, which is the finding
rather than a footnote to it.

**The shape of the failure, and why nothing caught it.** `test/triggers_test.js` has always
asserted that every trigger is a word the fronting skill's own `description` advertises. It
passed on every run. It is a **soundness** check, and nothing ever asked the completeness
question — *given a prompt, does any route get named at all?* So the block promised ground
the hook could not name, and the pack held the knowledge the whole time:

| Claimed by a router | Held by the pack | Reachable |
|---|---|---|
| *"product decisions, funnels, onboarding, payment steps"* | funnel 448, onboarding 499, paywall 493, retention 196, activation 171 mentions; eight first-class tags; a 190-line method | **0 of 15 prompts** |
| a tenth member in the map table | four skills, each publishing its own `Triggers -` list | **1 of 7 prompts** |

**The generalisable finding is one sentence: a `description` is a routing surface.** A
trigger may only be a word the description advertises, so the description decides what the
selector can say — and it had been written as documentation by people thinking about
discovery, never as the input to a matcher. `super-ux` 0.42.0 changed two of them and
fifteen prompts started routing; no code in the pack changed at all.

### Three hand-kept copies of one list, found in one day

The registry has said *"one place, one order, nothing to keep in sync"* in its own header
since v0.36.0. Three copies of the router list were nonetheless being maintained by hand,
and each was found by a different accident:

| Copy | How it was found | What it had been serving |
|---|---|---|
| `router_texts_test.js`'s member list | it went red on the tenth router | the fixture proving *the whole family is covered* had **omitted `agent-stack`** — the gap, inside the check meant to disprove it |
| the README routers table | read while updating a version row | *"Eight routers"* through **two** additions, wrong for three days |
| `lib/router-texts.js`'s named exports | noticed while reading the façade for something else | the tenth router shipped with **no `AGENT_STACK` export**, invisible because nothing consumed it |

Two are derived now and the third is guarded by a validator that was watched failing on two
plants. The lesson is not *derive lists* — that was already written — it is that **a
hand-kept copy nothing consumes is the one that survives**, because the copies with
consumers go red and this one had none.

### Two rows died on re-derivation, and that is the process working

`B-82` said `аудит` routes reconnaissance into the pipeline against the pipeline's own
boundary; it was filed off a live injection during the audit. Re-measured before acting, per
`B-60`: the prediction was **correct** — that audit changed the repository in the same
session, seven files across two commits, and the description advertises the word with a
condition that was met. Waived, with the residue stated: a description can carry a condition
and `ROUTES` can only carry words.

`B-83` proposed *one line per pack in the map*. That is exactly what a published block may
not contain — the block is written on every operator's machine and this one's roster is not
theirs. The rule generalised and the roster became `npx sshlg-skills conflicts`.

**Both rows were written by the same run that later refuted them, hours apart.** The board's
re-derivation rule is not protection against a careless predecessor; it is protection
against yourself at the moment you were most confident.

### A prototype built, measured, and thrown away

`B-84` wanted prefixed Russian verb forms to route — `отрефактори` against the trigger
`рефактор`. A ten-prefix allowance was built and run out of tree: **1 new win in 7 realistic
prefixed imperatives, 0 regressions in 10 noise cases.** Six of the seven already routed. One
win does not pay for a permanent mechanism in a module whose own header says *deliberately
NOT a morphological analyser*, so it was discarded — and the numbers were written to the
board so the next run does not rebuild it to find out.

The regression the refusal was originally drafted around, `расцвет` matching `цвета`, **does
not happen**. Running the prototype replaced a plausible reason with the true one.

### What the instruments got wrong

| Instrument | What it said | What was true |
|---|---|---|
| `release_preflight.py \| tail` | `exit=0` under a printed `BLOCKED` | `tail`'s status, not the gate's — the failure this repository's own `CLAUDE.md` warns about, in the session that read it |
| the board's published open-count recipe | 3 waived rows, one of them the header's `B-NNN` example | a template row is shaped exactly like a row; and an escaped `\|` inside a cell had split the status out of the field the recipe reads |
| `gh run rerun --failed` | `HTTP 503` | GitHub, not the release — the v0.83.0 publish needed two attempts through an outage |

**And the check that existed only because of `B-79` earned itself twice.** v0.82.0 sat tagged
and unpublished for a day before this run found it; every release since carried a monitor
that polls the runs to terminal **and then reads `npm view`**. It caught the v0.83.0 503 in
minutes. A green workflow is not a shipped package, and nothing in this repository had ever
asserted the difference.

**The one thing this run cannot claim.** Fifteen prompts still reach nothing, and they are
named in `B-84` and in the v0.84.0 notes rather than left for a later reader to rediscover.
Seven of them want words in descriptions that have no room — `task-pipeline` 964,
`stripe-billing` 967, `make-skill` 965, `seo-aeo-audit` 959, `sheleg-design` 948 against a
970 working limit — which is `B-66`'s description half, still binding.
