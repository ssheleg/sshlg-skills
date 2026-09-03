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

- **2026-09-03 — two findings the ladder walk produced and no gate could have** (base `8993a3d`, umbrella v1.32.0 → v1.32.1, sheleg-design 1.59.0 → 1.59.1). Both repositories were green when the walk started, which is the point of walking. (1) **The director's Act 2 mandated `pack design --lane <lane>` with no fallback**, while that skill's own front matter promises every optional sibling *"has an in-text fallback when absent"* and `shadcn`'s and `dataviz`'s honour it. Nothing checks that convention because it is a claim the skill makes about ITSELF — the validator holds the companion, its link, its mirror and its derived contents list, and has no notion of a sibling. The fix names which of the command's answers survive by reading (the lane table is local; the harness lists installed skills) and which cannot (**what is missing, and what was declined**), and requires the cast to say the roster was unmeasured. (2) **`design-system` was already correctly absent from `ui-ux-pro-max`'s `provides` and the reason lived nowhere** — it is one of the seven that marketplace ships and also a skill many machines carry from `anthropics/knowledge-work-plugins`, so listing it would have reported the entry present on a machine that never installed it. The rule is now written at the declaration: **a `provides` id has to be one only that entry could have put there.** **Divergence recorded, one, and it is about my instruments rather than the work:** a release run was polled through `until [ "$(gh run view "$RUN" …)" = completed ]` with `$RUN` **empty**, because the run was listed in the same breath as the tag push and did not exist yet — the loop then compared an empty string forever and burned a nine-minute timeout without ever looking at anything. Third wrapper-shaped failure of the day after `git tag -l` and the backgrounded gate, and the same remedy each time: **make the step print the value it found before anything depends on it.** Ledger edits under lease `PACKS-DESIGN`; nothing retired — no cold trigger hit.

- **2026-09-03 — the pin that closes the pair, and two instruments that lied about their own success** (base `dffca2b`, umbrella v1.31.0 → v1.32.0, sheleg-design 1.58.4 → 1.59.0). The member's new `CREATIVE_DIRECTOR.md` casts its tools by running `pack design --lane <lane>`, so the two halves had a forced release order: the director cannot measure with a command that is not published yet. **Divergence recorded, two, and both are the same class as instruction #8 rather than new** — which is why they are logged here instead of becoming an eleventh instruction. (1) **`git tag -l <name>` exits 0 when it finds nothing**, so a check written as `git tag -l v1.59.0 && echo exists || echo missing` printed *exists* against a repository with no such tag; `git ls-remote … | head -1` has the same property. Both were re-measured as `| wc -l`, which returns the fact rather than the command's mood, and both said 0 — correctly, because the compound that would have created the tag had been killed by a timeout one step earlier. (2) **A background job's exit code belonged to its wrapper.** `(npm test > log) & sleep 5; echo started` exited 0 five seconds in, while the gate was still running, and the notification reported that 0 as the task's result. Re-run in the foreground with its own `RC=$?`: `rc=0`, `FAIL lines: 0`, `self-tests: 3`, `OK (5633 checks)`. **The pattern across both: I asked a wrapper how the work went instead of asking the work.** The counter-measure that actually worked each time was cheap — make the command print the NUMBER it found. Ledger edits under lease `PACKS-DESIGN`; nothing retired — no cold trigger hit.

- **2026-09-03 — the command that can answer about absence** (base `53ec452`, umbrella v1.30.0 → v1.31.0). The operator handed over two published listicles of design skills and asked for a recommendation pack plus routing. **The premise did not survive measurement, which is the finding rather than a detour**: five of the eight skills in the first table were already installed and four of them had been updated that morning, so the gap was never availability — it was that nothing routed to them, and `toolkit` cannot name what is absent. `lib/packs.js` + `pack` closes that; `B-140` files the lane it exposed. **Divergence recorded, four**: (1) **my own measuring instrument failed silently and uniformly** — a sweep of five candidate repositories returned 404 for all five, and only the known-clean control returning 404 too gave it away: the unauthenticated GitHub API rate-limits to 60 an hour and answers **403 with a JSON body** that a default-valued parser renders as *missing*. Standing instruction #4 caught before the numbers were believed, and `--check` now reports `unreachable`, never `gone`. (2) **The guard I wrote against the articles' own bad install line had the same hole the line exploits.** Keyed on the flag cluster it demanded a lowercase `r`, so `cp -R … ~/.claude/skills` — as ordinary as `cp -r` — walked past it. Its own fixture caught it before it shipped; keyed on the DESTINATION now, with the copying-out case asserted so the widening buys no false positive. (3) **A hardcoded column width is a claim about the data.** `pad(id, 28)` printed `vercel-react-view-transitionsmotion` for a 29-character id — the same defect `lib/toolkit.js` records against its own shortlist row and patched with an unconditional space, which hides the overflow instead of removing it. Widths are measured from the rows here. (4) **Two of the operator's three grill answers were already settled by his own brief and I nearly asked them anyway** — *use the ready-made ones* and *give the command* were both in the request. The three that were genuinely open (impeccable's collision, how much of a 107-skill marketplace to take, whether the pack may write) were the only ones asked. Ledger edits under lease `PACKS-DESIGN`; nothing retired — no cold trigger hit.

- **2026-09-03 — three member releases to move one string, and a ratchet that fired downward** (base `e3f201a`, umbrella v1.29.0 → v1.30.0, super-ux 0.52.5, sheleg-design 1.58.4, sheleg-dev 0.11.5). `B-131` and `B-118` close together because they are the same coupling from two directions: a role cell feeds the card render, and the card pixels live in the member. **Divergence recorded, four**: (1) **`B-138`'s number was met in practice and it is worse than on paper** — the same release in three repositories took a CHANGELOG heading with `v` and without, Keep-a-Changelog with `### Fixed`, a version surface in `SKILL.md` two of them do not have, a mandatory run stamp, a mirrored `.cursor/` copy, and a ledger block quoting its own validator's output line. I took the wrong heading convention into the first member and its gate caught me; every subsequent shape was found the same way. (2) **The B-98 ratchet refused the tree for being too GOOD**, which is the half a one-way ratchet never has: two members lagged where the floor said three, and the run stayed red until the smaller number was written down in the same change. (3) **The submodule checkouts held my own uncommitted pixels** and blocked the pin until they were reset — the umbrella's `skills/<m>/` working trees are not the member repositories, and writing to both is how a pin pass ends up comparing a tree against itself. (4) The pin gate refused the first attempt outright: `pinned at 0.52.5 but the submodule's committed package.json says 0.52.4`, before anything could be committed. Ledger edits under lease `B76-REDERIVE`; nothing retired — no cold trigger hit.

- **2026-09-03 — ten board rows, and three of them were already closed or closed themselves** (base `6f105d9`, umbrella v1.28.0 → v1.29.0). The operator asked to close 21 open rows in one pass; ten closed here, four were named as theirs to decide and they decided, and seven need member releases. **Divergence recorded, five**: (1) **my own open count was wrong before any work started** — a grep said 19, the file's published recipe says 21, and the recipe exists because this board has carried two contradicting open counts before. Measured before acting, which is the only reason the rest of the pass counted anything correctly. (2) **`B-99` needed no code**: its guard has been in the validator since it was written, names the row in its own refusal text and has a CI plant — the row was simply never marked, and `B-127`'s cell was carrying `**open.**` and `**Closed 2026-09-01**` at once, the exact class `B-99` refuses, inside the board that guard reads. A board that carries shipped work as open is a board a reader stops trusting. (3) **Two fixes were found by probing rather than by reading.** `B-92`'s new pin check sat behind an early return about the member's upstream, so a plant walked straight past it; `B-106`'s `cd` parser turned out to read the ordinary subshell form `(cd skills/x && git commit …)` as no `cd` at all, which made the umbrella claim a member's commit on a LITERAL path — a defect one step earlier than the row's own subject and never noticed. (4) **A rename exposed a counter that had been wrong for longer than the thing it counted.** Disambiguating three colliding ids dropped the ledger count by three; widening the counter's id grammar to the one the file actually uses raised it by seven, so the stated 576/502 had been false independently of this pass. (5) **I read an exit code from the wrong process**: `timeout 900 graphify update .` never ran — macOS has no `timeout` — and the `rc=0` I printed belonged to the shell, not the tool. The graph was unchanged and the validator said so. That is the same shape `v1.82.1` burned a tag on, caught here by checking the subject instead of the report. (6) **The pass was caught by the gap it was closing.** Moving the lease to `git` dropped the `backend` key and staled the generated snapshot; `npm test` stayed green and CI refused a round trip later, because the coordination check ran only in CI. Four `task-pipeline` tags burned on that exact shape this week, and it arrived here on the run closing board rows about it. The check now runs locally from whichever `agent_sync.py` the machine resolves, with a plant watching the LOCAL gate refuse the config that actually broke. Ledger edits under lease `CLOSE-21`; nothing retired — no cold trigger hit.

- **2026-09-03 — the fifth burn that did not happen, and a sentence that quoted a checked number** (base `1c23d56`, umbrella v1.27.0 → v1.28.0). One pin: `task-pipeline` 1.81.1 → **1.82.4**, closing the exclusion two waves carried. Getting the member releasable meant landing a green PR abandoned for twenty hours and then catching what it would have burned: the release-gap check lives on the tag's own tree, `validate.yml` ignores tag pushes, and **a PR repairing burn N is structurally blind to burn N+1**. The tag was cut locally, `npm run test:all` ran against its tree, the failure was read from the suite's exit code, and the tag was deleted — the first round of five that cost no version. `B-134`'s remedy was corrected in the member: it asked for a preflight running the plant harness beside `npm test`, and that remedy would have burned this tag too; the preflight already exists as `test:all`, on a tree the branch never has. **Divergence recorded, three**: (1) **this repository's own ratchet sentence was stale — 780 against a measured 799 — inside its own claim that the figures are derived**, because the marker is checked and the sentence quoting it never was; closed with a derivation in `test/run.js` and two watched refusals rather than an edit, since an edit is what the four previous restatements also were. (2) **The change was caught by the repository it changed**: adding the plant made the README's `28 negative self-tests` false, and `validate.py` refused the tree until it was recomputed to 29 — the guard working on the run that wrote it. (3) A background waiter of mine exited 8 and was reported as a failure while CI was green; `gh pr checks` returns 8 for *pending*, so the shell's code was read as the subject's. Checked against the run before saying anything, which is the habit the previous stamp's false alarms bought. **The lease TTL is shorter than the gate**: 2700 s against a `validate` job that took 1 h 33 m, so the lease was renewed on a timer through both waits — measured here rather than assumed. Ledger edits under leases `LAND-71` (member) and `PIN-TP-1824` (umbrella); nothing retired — no cold trigger hit.

- **2026-09-01 — six pins, and the coupling paid from the side that owns the cell** (base `d836a79`, umbrella v1.13.0 → v1.14.0). Wave 4 closed the family's last audit tails and `B-113`, the highest-priority row it carried; this pass pins what shipped, reading every version from the registry at cut time. **B-127 closed** by doing what B-118's plan asked of the umbrella and the row had declined: shortening the `agent-stack` role cell, then dropping the member from `LEGACY_FIT` at the retirement moment `scripts/site.js` already predicted. **Divergence recorded, two**: (1) the row states "neither `LEGACY_FIT` setting reconciles them" — true of what it tested, the v0.19.1 submodule against the *unshortened* cell, and false of this pass, so the row is closed with what changed rather than corrected as if it had been wrong; (2) a coordinator's cross-repo defect report — `acquire` printing `won` on an expired lock without refreshing it — was **investigated and not confirmed**: `_steal_expired()` unlinks and recreates inside an `O_EXCL` section with a fresh timestamp, and a scratch-repo reproduction won and rewrote the lock correctly. The coordinator's own first attempt planted `REPRO.json` where the tool reads `REPRO.lock`, so it proved nothing until the path was checked — recorded because the false start is the lesson. No row filed for an unproven defect. Ledger edits under lease `PIN-PASS-W4`; nothing retired — no cold trigger hit.

- **2026-08-31 — a measurement that stopped its own change** (base `37d6b93`, umbrella v1.12.2 → v1.13.0). B-125: this package writes a routing block into an operator's file and nothing asked whether the block routes — `route_coverage.js` reads like that check and calls `lib/triggers.js`, a regex over the prompt that never opens the block. `test/evals/` is now the instrument, with the artefact guarded in the gate and the model-calling run deliberately outside it. **Divergence recorded, four**: (1) **the operator approved a trim under measurement and the measurement did not exist in the form the approval assumed** — the instrument named in the recommendation measures the trigger layer, so it would have returned an identical number before and after and been reported as a safe green. Building the missing instrument was the faithful execution of the decision, not a substitute for it. (2) **The mechanism hypothesis was falsified by the arm built to confirm it.** The widening was attributed to compressing the boundary; the `no-among` arm leaves every boundary intact and widened identically on the same three probes. The third arm existed only because `agent-evals/references/statistics.md` — shipped that morning — says to change one variable per round, and it earned its place by refuting the round before it. (3) **A plant passed for being ineffective**: `Refusal phrase:` → `Refusal phrasex:` still contains the substring the check counts, so the guard was right and the plant was wrong; re-planted as a deletion, it refused. The same class as the previous stamp's line-anchored matcher, caught this time before it was believed. (4) **Two size estimates of mine were wrong in the operator's favour to correct**: the block trim was offered as ~25 KB across four files and measures ~14.5 KB, because the router texts are only part of the block. **The result stopped the change**: recall 11/11 in all three arms, both trims routing wider with every extra hit on a silence probe, and 3-wider-1-tighter giving p=0.625 at one run per cell — evidence for the next experiment, not for the edit. Ledger edits under leases `B-125-routing-eval` and `B-125-retro`; nothing retired — no cold trigger hit.

- **2026-08-31 — how many runs before a difference is real, and a row a sibling's gate refused** (base `b454641`, umbrella v1.12.0 → v1.12.1, agent-stack v0.17.1 → v0.18.1). B-124, the harvest's third packaged finding and its first *absence* rather than a falsehood: `agent-evals` shipped 315 lines about what to assert with **no `references/` directory at all** and no statistics anywhere — a grep of its own text for the vocabulary of repetition and variance returned one hit, about escalation. Four of the twenty harvest agents reported that gap independently. `references/statistics.md` answers it with every figure recomputed rather than quoted, and §5's trajectory rule moved **between** its two measured edges instead of flipping to the other extreme. **Divergence recorded, four**: (1) **I shipped a malformed board row in a release.** B-124's row was appended to the member's board and landed in the three-column *Open, and why* table rather than the eight-column ledger, carrying an unescaped `|` inside a grep pattern — and `agent-stack`'s own gate was **green** on it. The umbrella's validator refused it during the re-pin, which forced v0.18.1. A member's board is checked here, not there, and that asymmetry is how a documentation defect reached a tag; the finding is larger than the row and is recorded in both changelogs. (2) **A sibling session released v1.12.0 mid-run**, so the version arithmetic done at the start (1.11.4) was wrong by the time it was used and became 1.12.1 — instruction #9's shape: the registry outranks the plan. (3) **My own column counter reported two more broken rows and both were false** — `AG-06` and `AG-06b` escape their pipes as `\|`, which the counter did not model. Instruction #11 applied to a throwaway instrument: the checker was wrong and the subject was clean, and the convention the counter could not see was the one the fix should have followed from the start. (4) `git checkout -B <branch> origin/main` carries uncommitted edits onto the new base rather than discarding them; here it happened to be what was wanted, and the diff against `origin/main` was read before believing it. **The pin gate and the ledger guard both fired again** — the stale row counts 493/487 against a measured 495/489. Ledger edits under leases `B-124-evals-statistics`, `B-124-table-fix`, `B-124-repin` and `B-124-retro`; nothing retired — no cold trigger hit.

- **2026-08-31 — eight pins after the tails wave, and the first evals the family ever ran** (base `34e7ef8`, umbrella v1.11.3 → v1.12.0). Wave 3 closed every remaining audit tail across nine members and executed the eval suites each had authored and never run; this pass pins what they shipped, reading every version from the registry at cut time rather than from any report. **Divergence recorded, two**: (1) a concurrent operator session released members and the umbrella throughout the wave — make-skill arrived at 0.25.3 and super-ux's 0.52.1 was cut from another agent's working tree with its uncommitted edits aboard (shipped byte-identical, documented in that member's own CHANGELOG), so this pass re-read every version instead of trusting the wave ledger; (2) the coordinator's own `B-124` was filed at `P 4.0` and the board's formula guard refused it — recomputed to 2.0, which is the guard working on the person who wrote it. Ledger edits under lease `PIN-PASS-W3`; nothing retired — no cold trigger hit.

- **2026-08-31 — the guard knew the class and fixed it one token too late** (base `27aa9be`, umbrella v1.11.2 → v1.11.3). B-123, the harvest's second packaged finding: four bypasses of `lib/hygiene.js`, all one shape — a parser that does not know which token is the subcommand. A flag's value and a line-continuation backslash both stood where `skillsCli` reads the verb; `--vault`'s argument stood where `isObsidianSetup` reads the subcommand, which is the guard for the command that truncates the operator's config. Fixed with a verb vocabulary that belongs to us rather than a flag table that would track someone else's CLI and rot. **Divergence recorded, three**: (1) **the finding was aimed wrong and was re-aimed before it was believed** — as written it claimed the guard would miss `find … -exec rm` and `curl -o /etc/crontab`, which is true and is not a defect, because this guard's threat model is three named machine habits and not destructive commands. Checking it against the guard that actually exists is what turned one wrong claim into four real bypasses, in a different place. An agent's report is a lead, not a verdict, and the previous stamp's B-122 arrived from the same harvest correctly aimed — so the harvest is neither trusted nor discarded wholesale. (2) **The guard refused this run's own probe**, exactly as B-59 describes: the `node -e` payload carried a real-looking invocation and nothing can distinguish it from one, so the probe was rewritten into a file through a heredoc fed to `cat` — a non-shell, whose body `executablePart` drops by design. The guard demonstrating its own documented trade-off on the run that was auditing it. (3) The board row insert assumed the file ends with a table row; the umbrella's board ends with prose, and the assertion caught it before anything was written — the same habit that stopped a plant from silently changing nothing in the previous stamp. **The ratchet earned its keep**: the run went red on `fixtures=764` against a measured 768 and the figure was recomputed rather than carried, which is the rule `CLAUDE.md` states for exactly this. Ledger edits under lease `B-123-hygiene-grammar`; nothing retired — no cold trigger hit.

- **2026-08-31 — the runner we said did not exist, found by a reader who is not us** (base `27aa9be`, umbrella v1.11.1 → v1.11.2, make-skill v0.25.2 → v0.25.3). A 20-agent harvest of `awesome-harness-engineering` (459 links) and `bojieli/ai-agent-book` (1.2 MB) returned 375 findings; the first one packaged was B-122, a **false statement in a shipped skill**: `make-skill`'s `references/authoring.md` had told authors for four weeks that *"there is no built-in runner, so keep them in the repo as data and run them yourself"* while `claude plugin eval` had shipped — a sentence violating that same file's own rule *"No time-sensitive statements"* written 100 lines above it. Replaced with a dated measurement rather than a second absence, plus `THIRD_PARTY_CLAIMS`, which makes a registered claim about someone else's tool carry the command that re-checks it. **Divergence recorded, five**: (1) **instruction #8 fired twice, against me** — `| head` in a pipeline masks the real exit status, so companion detection reported every absent plugin as present, and `claude plugin eval` was reported to the operator at `rc=0` when it exits 1; both were stated before being corrected, and the instruction that names this class was already on the list. (2) The guard's three plants **passed for the wrong reason** on their first run: the claim wraps a line break, the matcher was line-anchored, and all three tripped the registry-rot branch instead of their own — caught only because the house CI pattern asserts each case's *expected message* rather than merely that the validator failed. A plant that passes for the wrong reason is indistinguishable from a working guard. (3) The operator chose full migration to the runner's case format; probing it afterwards showed **every** `claude plugin eval` path gated behind early access (`rc=1`, nothing written, no settings/env/GrowthBook key), so the re-run half was impossible — the choice went back with the measurement rather than being narrowed silently or completed blind, which would have re-opened MSK-01, closed the day before. (4) A generic absence-claim detector was built **first**, measured at 10 hits over the shipped doctrine with roughly half legitimate (the `host-capabilities.md` fallback rows are that sentence shape by design), and rejected as over-defense with the number kept in the code beside the registry that replaced it. (5) The umbrella pin was committed while its gate was red, because the commit was chained after an `echo` rather than gated on the test's exit status — instruction #8's shape a third time, amended before push. **The pin gate earned its keep twice**: `git submodule update --init` silently restored the pointer to 0.25.1 under a `skills.json` already at 0.25.3 and the validator refused the pair; and adding one ledger row left the ledger's own stated counts (485/479) one behind the tree. Ledger edits under leases `MSK-05-eval-runner-truth`, `B-122-repin-make-skill` and `B-122-retro`; nothing retired — no cold trigger hit, and #8 fired rather than aged.

- **2026-08-31 — the card metric counts what it paints, gated so no committed byte moves** (base `e142f48`, umbrella v1.10.0 → v1.11.0). B-105 (filed on sheleg-dev's board, upstream home here) plus three cross-family text findings (XF-06/09/13) landed as one release: `fitScale` gains the tracking its `drawText` counterpart always painted with, gated per card through `LEGACY_FIT` so the three member cards whose committed pixels the corrected metric would repaint stay byte-stable (B-118 files the member-side regeneration, including agent-stack's eyebrow measured clipped at the canvas — 11 characters lost today); the `seo-llmo` rule states its two names; `sheleg-dev`'s rule drops "paid"; the «аудит проекта» double-fire comment stops contradicting project-audit's read-only contract. The metric fix was **proven free before it shipped** — site built from pre-fix and post-fix trees, every PNG byte-identical — which is what let it ride a text release instead of a coordinated nine-repo card regeneration. **Divergence recorded, two**: (1) the brief cited `lib/og-card.js:216`; the file lives at `scripts/og-card.js` — the line number held, the path was re-measured rather than carried. (2) Instruction #11 fired twice, both times the instrument: the first full-gate run went red on `residue_test.py` and both the suite alone and the gate rerun passed — an overlap/leftover of this session's own scratch builds, not the subject; and the eyebrow-band fixture's pre-fix red partly measured a stashed export (`og.PAD` left the stash with the fix, so the scan bounds were NaN) rather than only the defect — the companion fixture's `1115px in 1032px` red is the one that testifies. Ledger edits under lease `WAVE3-UM`; nothing retired — no cold trigger hit.

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
