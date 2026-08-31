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
   suite after a real one. **And "changed something" is not the assertion — the
   assertion is that the thing the guard READS changed, read the way the guard
   reads it.** (2026-08-24) The two-verdicts plant computed its column index from
   a header list whose `[0]` is the empty cell before the leading pipe, then wrote
   at `index + 1`: into the empty tail after the final pipe. `"" != " open "` is
   true, so the byte-level assert passed, `plant_guard verify` saw a tree that
   differed from its snapshot and agreed, and the validator correctly passed a
   register nobody had damaged — which the step reports as the guard being
   broken. Three failed tags on one step. A plant asserts on the parsed value,
   never on the diff. *(Retire after five run stamps without firing, or
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
   subject.

   **(2026-08-26) The same rule holds for a check that goes quiet, and it is the
   half that ships.** A red gets read; a zero gets recorded. Twice in one day the
   zero was the instrument: a post-deploy probe reported the author entity missing
   from all four templates because its pattern carried a space the minified JSON
   does not, and — after that was fixed — reported `refs=0` on five pages that each
   emit two references, because the walker keyed on `@type` and a reference is
   `{"@id": …}` with no type. Neither was the site. **A probe reporting zero is a
   claim about the probe until the probe has been shown finding one**, so every
   count assertion gets a companion that fails when the collector sees nothing —
   the `refsSeen > 0` line in `test/site_test.js` exists only for that. And a check
   that greps rendered output for a formatted substring is testing the formatter:
   parse the structure instead. *(Retire when every check in this family ships with
   a known-clean fixture beside its planted one, or after five run stamps without
   firing.)*

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

- **2026-08-30 — nine pins, one pass; the pin gate earned its keep twice** (base `6828d3f`, umbrella v1.9.1 → v1.10.0). The audit waves' releases pinned in one commit (make-skill 0.25.1, telegram-dev 0.1.9, agent-stack 0.17.0, seo-aeo-audit 0.25.7, sheleg-dev 0.11.0 + the role cell its card encodes, super-ux 0.50.0, sheleg-design 1.58.1, agent-sync 1.18.6, task-pipeline 1.79.1); B-113's residue closed — `react loop`/`react pattern` route now that agent-stack v0.17.0 advertises them, fixtures in both directions. **Divergence recorded, three**: (1) the pass first pinned sheleg-design 1.58.0 and the umbrella's own YAML gate refused it — the member's front matter was not valid YAML (`Triggers: "` in an unquoted scalar), invisible to its 5598-check house gate that reads front matter with a regex; the member hotfixed to 1.58.1 and grew a fail-closed YAML parse. The gate that exists for exactly this fired for exactly this. (2) task-pipeline's v1.79.1 cost three CI rounds: a rebase-merge killed the SHA its run stamp cited, then the repair's prose kept the dead hex as a backticked reference the docgate resolves in clones — both now in that repo's retro; the coordinator's own miss was running validate.py locally but not test:docs before the first repair. (3) two background-shell watchers were killed mid-wait; the Monitor tool replaced them and held. Ledger edits under lease `PIN-PASS-W2`; nothing retired — no cold trigger hit.

- **2026-08-30 — the retro readable in full, the last write outside the gate** (base `31da89d`, umbrella v1.9.0 → v1.9.1). Three audit findings: UM-01 — the 30 dated run records (121,420 bytes, 78% of this file) rotated verbatim into `docs/evidence/retro/2026-Q3.md`, hash-proven, archive added to `LEDGER_DOCS`, because a "read in full at stage 0" contract over 155 KB could not complete in one read; UM-06 — the `obsidian-wiki setup` restore in `hooks/post-tool-use.js` routed through `protect()`, the one write to an operator-owned file that bypassed it, two e2e fixtures watched failing against the pre-fix hook; UM-07 — B-07's waiver re-stamped at 12 commands against a stated 8. **Divergence recorded, two**: (1) the audit counted *29* dated records — the cut counted **30 headings**, measured rather than carried (the B-60 rule, applied to the brief itself); (2) instruction #11 fired — the two new fixtures' first red was the checker, not the subject: the e2e HOME sat behind macOS's `/var → /private/var` symlink, so the fixture derived a different backup key than the hook's `realpathSync`, proven by walking the hook's steps against a known-good setup before touching the hook. Ledger edits under lease `WAVE2-UM`; nothing retired — no cold trigger hit.

- **2026-08-29 — the audit's routing wave: refusals the block advertised and the hook never parsed** (base `305d58e`, umbrella v1.8.0 → v1.9.0). Four findings from the 2026-08-29 family audit landed: `sheleg-dev`'s refusal renamed to «без обвязки»/"no wiring" because the stemmer fires `интеграция` inside «без интеграций» (a stem-level clash the raw-containment fixture cannot see — a match-level check now runs beside it); twelve advertised English refusal aliases plus both telegram forms and the toolkit pair added to `REFUSALS`, held to the block mechanically by a fixture that parses the registry's own refusal lines; `error-tracking` routed (the B-81 shape on one skill, zero description edits, probe 71/85 → 74/88); the bare `react` homograph removed. **Divergence recorded, two of them**: (1) the wave brief said v1.8.0 was unreleased at HEAD — the tag, the registry and npm all said otherwise (a concurrent session had cut it), so the release was retargeted to v1.9.0 by reading the registry rather than the brief, which is instruction #9 applied before it could fire; (2) the planned `skills.json` role-cell edit was made and then **reverted**: the role is the member card's eyebrow, the card's exact pixels are committed inside the `sheleg-dev` submodule and byte-checked by `test/site_test.js`, and this wave may not touch submodules — the edit rides the member's own release. Instruction #11 fired twice, both on the new block-vs-list fixture's own scaffolding (a `members` list of names where `upsert` wants the manifest objects; an empty-block skeleton missing the heading the parser keys on) — both times the checker was wrong and the subject clean, proven in that order. Ledger edits under lease `WAVE1-ROUTING`; no retirement — nothing hit a cold trigger.

- **2026-08-26 — the SEO/AEO pass, and three instrument defects** (`289cc0c`, umbrella v1.3.0 → v1.3.3). One task, four releases, because each fix made the next thing visible. **Divergence recorded**: the pass shipped the defect it was written to fix — v1.3.0 closed the entity gap and emitted two unlinked `Person` nodes doing it — and `test/site_test.js` had 30 checks over a site whose subject is structured data with **none of them parsing it**. Then twice the probe was wrong and the site was not (a grep pattern with a space against minified JSON; a walker keyed on `@type` against references that carry none), and only the third `refs=0` was real. Standing instruction 11 extended rather than a twelfth added: it already covered a check going red, and every finding here was a check going **quiet**. One coordination miss, mine: `docs/evidence/retro.md` is a guarded file and I edited it after releasing the lease.


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
| 2026-08-26 (twenty-first) | The site is built from a pack it sells: workbench applied, field-notes refused on its own dark-hero ban, signature element authored; v1.2.0 | `f17c7ba` | no — the plan held |

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

**End of the in-force file — the dated run records live in the archive.**
Everything below this line used to be the dated run records: 30 `##` headings,
2026-08-06 through 2026-08-17, 121,420 bytes — 78% of a file whose header
promises it is read **in full** at stage 0, which at 153 KB no single read
could complete. On 2026-08-30 (UM-01) they were moved **verbatim** to
`docs/evidence/retro/2026-Q3.md`: no id changed, no sentence was reworded, and
the moved bytes' SHA-256 is recorded in the verification ledger row that shipped
the move. The Run stamps table above is the index; where a row says
*"yes — see below"*, below is now the archive. The archive is counted in
`test/validate.py`'s `LEDGER_DOCS`, so its dead citations stay disclosed on
every run instead of vanishing with the move.
