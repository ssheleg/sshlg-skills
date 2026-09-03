# Doc map — sshlg-skills

Where settled things live in this repository, what each fact's single home is,
and what proves the docs are in sync. Written so the next run does not have to
guess, and so "docs updated" is a command rather than a claim.

## Which channel a hook ships through — decided 2026-08-14 (B-19)

Two channels exist and both are correct, because **the channel follows the shape of the
thing, not a preference**:

| Shape | Channel | Why it has no alternative |
|---|---|---|
| A **plugin** (`agent-sync`, `make-skill`, `task-pipeline`) | `plugins/<name>/hooks/hooks.json` | It has a manifest, so it needs no write to the operator's file at all. The cost is that enablement is the only switch — acceptable for a guard that fails silent, and the reason a doctrine-injecting plugin is a different question (`superpowers` is disabled on this machine for exactly that). |
| A **launcher** (`sshlg-skills`, run as `npx`) | `~/.claude/settings.json`, via `lib/hooks.js` | It has no plugin manifest. There is no second channel to prefer. Its `PreToolUse` entry is the backup that exists because `~/.claude/CLAUDE.md` was destroyed twice (B-05), so the write is the mechanism, not a convenience — and it goes through `protect()` like every other write to an operator file. |

Measured the day this was decided: three events (`SessionStart`, `PreToolUse`,
`PostToolUse`) fire in both channels. That is **not** duplication — six different scripts
doing six different jobs — but it is why an operator debugging *which hook fired* has two
places to look, and why `npx sshlg-skills injectors` names the files.

**What is forbidden:** a member that ships a plugin manifest must never also wire itself
into `settings.json`. That would be one mechanism with two homes and two lifetimes, and
uninstalling the plugin would leave the settings entry behind. `test/validate.py` refuses
it.


## What this repository is

The **umbrella** of the ssheleg skill family: a zero-dependency Node launcher
plus nine skill packs as pinned git submodules. It ships no doctrine of its own —
each skill carries its own — but it owns the family's **routing block**, the
one piece of the family that edits a file the operator owns and did not write.

**Three of the nine members have their own `CLAUDE.md` house rules** —
`seo-aeo-audit`, `super-ux` and `task-pipeline` — counted with
`git -C skills/<name> ls-files CLAUDE.md` on 2026-08-16. The other six carry a
validator and CI but no house rules. This paragraph said *"the first six"* until
that count was run, which named five repositories as having a file they do not
have. This repository grew its own on 2026-08-10, closing carry-over C-06.

## Single homes

| Fact | Its one home | Everything else must derive or cite it |
|---|---|---|
| Whether an address this repository's own documents claim actually resolves | `test/doc_refs.py` (the extractor and resolver) + `LIVE_DOCS`/`LEDGER_DOCS`/`ELSEWHERE` in `test/validate.py` (the corpus and its boundary) | the split is the design: the five live documents are gated, the four dated records are counted and disclosed, because their rows cite member repositories and states that were true at a commit |
| Which skills exist, their repos, plugin ids, pinned versions | `skills.json` | README table and `.gitmodules` are checked against it by `test/validate.py` |
| What the public site says about any member | `skills.json` and `lib/routers-registry.js`, rendered by `scripts/site.js` (pages) and `scripts/og-card.js` (the social card, one per page) | the site restates nothing: versions, descriptions, install identifiers and every routing rule are read at build time, and `test/site_test.js` fails when a page's version, address or launcher command disagrees with the source |
| What each member publishes as on npm | `npm` in `skills.json`, cross-checked against the submodule's `package.json` name | declared, never derived: six members publish as `@ssheleg/<name>` and `task-pipeline` as `task-pipeline-skill`, while the bare `task-pipeline` on npm is someone else's |
| What a router is — text, table row, required members | `lib/routers-registry.js` | `test/router-texts.js` is a façade over it; `ROUTER_ROWS` in `lib/routers.js` is derived |
| Whether the operator's wording has diverged from the packaged one | `lib/drift.js` | pure, like `routers.js`; a fixture asserts it never reaches the filesystem |
| Where the copy of an unrecoverable file goes, and what a failed copy means | `lib/backup.js` | naming, key derivation and pruning are pure; `lib/apply.js` precedes every write with exactly one `protect()`, and a `backup-failed` record means the file was not touched |
| Which prompt asks for which route, and the words that mean a question | `lib/triggers.js` | pure; a fixture reads each member's shipped `description` and fails on any trigger the skill does not itself advertise |
| What the status line reads, and how each number is derived | `lib/runledger.js` | the ledger's grammar belongs to `task-pipeline` (`references/progress.md`); this only parses it, and every count is borrowed |
| Who else speaks at `SessionStart`, and what may be claimed about them | `lib/injectors.js` | pure decision plus ONE impure `readRegistry()` — the hook and `sshlg-skills injectors` had a copy of that walk each for about ten minutes, which is a second home for one fact. It reports what INJECTS, never what competes: a plugin printing its own state and one printing instructions that outrank yours are indistinguishable from here, and the output says so. The session line is silent when nothing else injects; the paths live behind the verb, which prints on a clean machine too |
| What a task can reach that is NOT installed here, and the exact command that would install it | `lib/packs.js` | the only member of the `injectors`/`conflicts`/`toolkit` family that can answer about ABSENCE — `toolkit` enumerates what is installed and by construction cannot name a skill that is not, which is the whole question when somebody hands you a listicle. Same split, same reason: the doctrine ships in the block, the roster is read when asked. Pure, plus the imported `readSkills()`. It **reports and never installs** — the refusal `lib/updatemodel.js` records, because `settings.json` and `known_marketplaces.json` belong to the operator. Popularity is deliberately not a field: every star count in the two articles the first pack was built from was wrong, so `--check` resolves the ADDRESSES at read time instead |
| What this machine can actually REACH, before a task picks its tools | `lib/toolkit.js` | the same split as `conflicts.js` and for the same reason — the doctrine that a task looks before it reaches ships in the block, the roster is a fact about one machine and is read when asked. The walk is **not** reimplemented: it imports `conflicts.readSkills()`, because two walks answer "what is installed" identically until somebody fixes one of them. Its `--for` ranking is term overlap and the output says so — a shortlist that reads like a decision is worse than no shortlist |
| How the next version reaches a machine, and whether anyone turned auto-update on | `lib/updatemodel.js` | pure notice plus ONE impure read of `known_marketplaces.json` — the same split as `injectors.js` and `conflicts.js`. It **reports and never writes**: that file belongs to the operator and to Claude Code, and a launcher that flipped somebody's setting to match its own opinion is the class of act that destroyed `~/.claude/CLAUDE.md` twice. `autoUpdate` is deliberately off for this family — the nine are pinned and released as a set, so a per-marketplace clock produces a combination nobody tested |
| The header and footer a report carries, and every address in them | `lib/signature.js` | pure; the caller writes only what each skill DID. Every URL is looked up from `skills.json`, because `evidence-docs` and `project-audit` live in `task-pipeline` and `sheleg-design` in `sheleg-design-skill` — an agent told to "link the skills you used" composes `github.com/ssheleg/evidence-docs` and it 404s. A plant that composes from the member name instead of reading `repo` is refused. An unrecognised id is named with whatever note the operator gave it, never dropped: a footer missing half of what ran reads as "that skill was never used" |
| Which anti-AI-writing implementations exist, what each can do, and the caveat that travels with all of them | `lib/humanizers.js` | data, so a third joins by pull request — the two listed are the two that were asked about, not the field. `pick` reads declared MODES rather than names, because a skill hard-coding one ships a preference disguised as a dependency. The false-positive figure is printed on every run and cannot be switched off: audits found **>60% on non-native English writers** (Liang et al., Stanford, *Patterns*, 2023), so a humanizer advises here and no gate in this family fails because a detector disliked a sentence |
| Which installed skills land on ground a router owns | `lib/conflicts.js` | the same split as `injectors.js` and for the same reason: the map's arbitration rule ships to every operator, but WHICH packs collide is a fact about one machine, so the rule is in the block and the roster is behind `sshlg-skills conflicts`. Pure decision plus ONE impure `readSkills()`. It reports CANDIDATES, never offenders, and its lexicon is hand-kept and says so in its own output — a generated one would be a guess with a machine's authority. Terms match on word boundaries after the first run reported `lease` inside *please* |
| Which hooks the family wires, and what a conflict means | `lib/hooks.js` | pure planner; `bin/sshlg-skills.js` writes through `protect()`, and a foreign `statusLine` is parked under `displaced:statusLine` so `remove` is an undo. `WIRED` is the ONE list of events — it lived in `plan()` and again in `removal()` until 2026-08-12, which is two lists that agree until someone adds an event to one of them and `remove` quietly stops being an undo |
| Which tool call is about to overwrite an unrecoverable file | `lib/guard.js` | pure; the hook takes the copy. The matching is here rather than in the entry's `if` field because the reference states that filter is best-effort and **fails open** on a command it cannot parse |
| The three machine habits nothing enforced — the bare skills CLI, shadowing copies, the truncated wiki config | `lib/hygiene.js` | pure; family ids come from `skills.json` so a member that gains a skill does not gain an unguarded one |
| Which plain copies shadow a plugin | `lib/shadow.js` | pure; compares **skill ids each enabled plugin provides**, never marketplace names — `sheleg-design` ships from `sheleg-design-skill`, and the cheap check reports that machine clean |
| The terminal sequence a notification becomes | `lib/notify.js` | pure; refuses anything outside the documented OSC allowlist rather than emitting a field Claude Code silently drops |
| Whether someone overwrote the entries we wired | `lib/displace.js` | pure; the expectation is read from `lib/hooks.js`. `ConfigChange` records and `SessionStart` reports, because that event discards `systemMessage`, delivers no `additionalContext`, and a change it blocks surfaces no message to anyone |
| Whether the un-routed path should stop and ask | `lib/routegate.js` | pure; `ask` never `deny`, once per turn, and silent where a run is open. A hook cannot make a model invoke a skill — it can refuse the un-routed path and name the route, and the wording says only that |
| What one turn decided, for the next hook of the same turn | `lib/turnstate.js` | `~/.sshlg-skills/turns/<session>.json`, pruned at session start. Deliberately not `config.json`: that file's value is that it persists, and this state is worthless tomorrow |
| Which stages this project has | `pipeline.json` → `stages[]` | the ONLY source for the progress denominator. The example flow's eleven are not a fallback — a host project replaces them, and guessing reproduces the defect with an authoritative-looking number |
| Whether this repository's own gate lets a commit through | `lib/repogate.js` | pure; `npm test` is run by `hooks/repo-gate.js`, wired from a **committed** `.claude/settings.json` so a clone arrives with the gate |
| The family's map — each member's entry point and what it closes | `lib/inventory.js` + `entry`/`role` in `skills.json` | rendered into the block; a fixture checks every declared entry is a command the family actually ships |
| Cursor's rule file, which is ours end to end | `lib/cursor.js` | a file at that name without our sentinel is someone else's and is not overwritten |
| What the launcher hands the skills CLI, and which plain copies are shadows | `lib/plan.js` | `install` and `update` both build from it; a fixture asserts their `add` commands are identical, because the drift between them was invisible in review |
| The wording adoption replaced | `~/.sshlg-skills/config.json`, key `adopted:<name>` | deliberately not the router's own stash key — the on/off switch must not hand back what adoption replaced |
| The block's format and every rule protecting the operator's file | `lib/routers.js` | it touches no filesystem, so the rules are provable without a HOME |
| Which routers this machine wants | `~/.sshlg-skills/config.json` | not in the repo; deviations only, mode 0600 |
| Recorded consent | `~/.sshlg-skills/state.json` | not in the repo; a file that cannot be parsed is not consent |
| Why a release happened | `CHANGELOG.md` | the release workflow reads the first matching section |
| What a run decided | `docs/evidence/briefs/…` + `specs/…` | the brief is the record; the spec locks contracts |
| What a run deferred | `docs/evidence/briefs/…-carryover.md` | read in full at stage 10 |
| What a run learned | `docs/evidence/retro.md` | standing instructions, capped at ten, read in full at stage 0 |
| How the family decides the **shape** of multi-step work — node and edge, the fake-edge test, the diamond, the checker node, static versus dynamic, and what the host actually executes when it fans out | `agent-stack` → `plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md` | this repository keeps a **pointer and never a copy** (2026-08-15, D-1). `task-pipeline` applies it at stages 4 and 5 and cites it; `agent-harness` and `agent-evals` each state their own half and point back. Its own source — an article and a vendor changelog — is pinned inside it with a read date, so a reader can tell a description of last month's behaviour from this month's |

## The propagation matrix

What a change of each type obliges, in the same change:

| Change | Also update |
|---|---|
| A router added, removed or reworded | `lib/routers-registry.js` (only) → README routing table → `test/router_texts_test.js` → CHANGELOG. **The site needs nothing**: `scripts/site.js` renders the registry, and `test/site_test.js` fails if a rule or its refusal phrase is missing from the page |
| A new entry in a recommendation pack | `lib/packs.js` → `assertPack()` accepts it (a dead or shadowing install command is refused there, not in review) → `pack <name> --check` resolves its address, and **CI runs that check on every push as a warning** because an address rots without anyone touching the entry → CHANGELOG. The entry stays in the pack once installed: half the answer is *you already have this* |
| A new CLI command or flag | `bin/sshlg-skills.js` usage block → README → a fixture asserting its exact output and exit code → CHANGELOG |
| A new trigger word for the prompt hook | `lib/triggers.js` **only** — and it must already appear in the target skill's own `description`, or `test/triggers_test.js` fails. Inventing one here creates a second routing policy nothing else reads |
| A new hook or status line | `lib/hooks.js` → `WIRED` (the plan, one list) → `hooks/<name>.js` (thin I/O) → a fixture for the planner **and** a process-level fixture in `test/hooks_e2e_test.js` → CHANGELOG. Writing to `settings.json` goes through `protect()`; there is no second write path |
| A hook that can refuse something | the deciding goes in a pure `lib/*.js` with its own fixture; the hook script only moves bytes and touches the filesystem where a backup happens. Every refusal names its remedy in the same sentence, and every script fails **silent** on a malformed payload — a guard that throws breaks every turn in every session, including sessions of packs that never asked for this one |
| A member's pinned version | `skills.json` → the submodule pointer → README family table (all three checked by the validator) |
| A member changing its npm package name | `npm` in `skills.json` — the validator compares it with the submodule's `package.json` name in both directions, with a two-plant negative self-test in CI |
| A file renamed, moved or deleted that a live document cites | the citation, in the **same** change — `check_every_address_these_documents_claim_resolves` refuses the commit otherwise. Two references rotted this way before it existed: a script name that was never in this tree and an `npm run` belonging to a member (UM-03, M-07) |
| A new test suite | nothing — `npm test` discovers `test/*_test.js`. That is deliberate: a list would need updating in two places |
| A member gaining or losing a skill | `skills.json` `skillNames` **and** that member's `desc` **and** its README row — the validator catches the first (both directions), the other two are prose nothing can check. `agent-stack` shipped `agent-evals` and advertised orchestrators only, so `list` and the table hid a whole capability |
| A member gaining or losing a **reference** (not a skill) | nothing here moves until the pin does — but the member's own README states a **count** of its references, and a count is recounted, never incremented. `agent-stack`'s said *eighteen* while nineteen shipped, found by counting at release rather than by a check. The same applies to any number a README states about a member: detector counts, stage counts, guard counts |
| A new validator guard | a negative self-test in `.github/workflows/validate.yml` that plants the defect and requires a failure |
| The artifact root's name | `docs/evidence/` here and in six members since 2026-08-13 (v0.46.0), following `task-pipeline` v1.53.0 which made the root RESOLVABLE. The records inside moved with `git mv` and were not rewritten — 155 occurrences of the old name survive inside past-run records on purpose, because a brief describes where things were when it was written. A project still on `docs/superpowers/` is not behind and is never warned |
| A new session-start claim about another pack | `lib/injectors.js`, and the honest limit stated in its own OUTPUT rather than only in its source — the check cannot tell doctrine from state, and a reader of the report must be told that by the report |
| The repository layout | README → *How it works* file map → this file |

## The gate

```bash
npm test
```

Runs `test/validate.py`, then every discovered `test/*_test.js`. It is the
same command CI runs, and `validate.py` fails if CI stops calling it — so the
local entry point and the remote one cannot drift.

Two more commands belong to a RELEASE rather than to a commit, and neither is a
gate on purpose:

```bash
npm run convergence            # B-91: pointers mechanically, the seam by record
graphify update .              # B-101: the graph stage 0 queries for reach
```

`convergence` prints `dormant` for a range where no component pointer moved and exits
non-zero for one that moved without a record — run it against the base the release is
cut from, not against `HEAD`. The graph refresh is a release step and **not** a gate,
because a gate on graph freshness fails every commit until somebody rebuilds it, while a
stale graph misleads a run quietly; the validator discloses the drift on every run and
this is the command that clears it.

```bash
python3 test/check_pins.py --self-test   # pure, offline, in CI's blocking path
python3 test/check_pins.py               # 0 fresh · 1 never published · 2 behind · 3 own tag unshipped
pip install tiktoken && python3 test/audit_bundle.py
```

The network half and the tokenizer half stay outside `npm test`, which must run
offline with no dependencies. **`check_pins` answers three questions and CI treats
them differently**: exit 1 means a pin names a version nobody published, which
makes the commit wrong on its own terms and blocks; exit 2 means every pin is
real but one is not the newest, which means a member released while this was in
flight — a warning and a run-summary note, never a failure. Conflating them made
five runs red in one day for other agents' releases.

**Exit 3 is about this repository rather than its members**, and it exists because
`release.yml`'s own *"The registry must actually serve it"* step runs inside
`publish`, which is `needs: release`, which is `needs: validate` — so the case it
was written for, a run that never reaches `publish`, is the one case it cannot
report. v0.82.0 sat tagged and unshipped for a day that way. Exit 3 is deliberately
**not** blocking: a release in flight is indistinguishable from a release that
failed, and the output says so rather than guessing. `classify` and `repo_slug` are
pure and their thirteen cases run with no network, including an assertion that the
verdicts differ from one another. `audit_bundle.py` **refuses to run without one** rather than falling
back to a chars-per-token ratio — the two disagree by ~40%, and a number from
the wrong instrument gets quoted as if it were a measurement.

It answers what no other gate does: the ALWAYS-ON budget (every description
plus the routing block, paid in every session of every project), bodies against
the 5000-token cap, two skills competing for one trigger phrase, and the
installed block against the registry.

<!-- ratchets: suites=48 fixtures=843 members=9 -->
**Ratchets.** 48 suites, 843 fixtures, 9 pinned members — and these three numbers are
now **read out of the marker above by `test/run.js`, which re-derives all three from the
run it just did and fails when a stated figure and the measured one disagree — and this
sentence is checked against the same run, not against the marker.** It quoted the marker
and nothing compared the two, so it drifted: on 2026-09-02 it read *780 fixtures* beside
a marker saying 799, inside its own promise that the figures were derived. Counting
convention: a suite is anything `npm test` runs, `validate.py` included, which is the
same denominator its own `PASS:` line uses; a fixture is a case counted by a suite's own
`OK (n checks)` or `PASS: … — n` line. A figure that DROPS is a suite that stopped
running, and it fails the same way.

The line before this one said *32 suites, 562 fixtures* beside its own sentence
promising the numbers were counted rather than carried. The recount on 2026-08-20 was
**35 and 602**, and the conformance row that corrected it (34/585) was **17 fixtures
stale by the time it was written**. Three restatements of one pair of numbers, each
wrong, each in a document about single homes — which is why the pair is no longer
written by hand. The history of the climb is kept because the shape of it is the
argument: 8/182 when `drift_test.js` landed, 10/228 with `plan_test.js`, 12/247 with the
map and Cursor, 13/267 when the write path gained a backup, 13/269 with precedence over
an injected mandate, 16/303 when the family grew hooks of its own, 23/427 when those
hooks learned to refuse, 24/469 when the progress rail stopped inventing its own
denominator, 32/557 when `apply_test.js` gave the write path fixtures of its own, 32/562
when the graph disclosure learned to read the report beside the graph, and 36/615 when
the repository gate stopped deciding ownership from an index the command could change, the
route gate stopped reading a closed run as an open one, and the suites stopped leaving
temp trees on the machine without saying so, 36/620 for the eleventh router — five
fixtures and no new suite, because `project-audit`'s own 43 cases are a gate in
`task-pipeline`, where the code it exercises ships — 37/648 when the family got a
public site and the site got a suite, 38/661 when the site stopped promising a
social card it did not carry and started encoding one, 38/662 when an
`extraLink` stopped writing a count by hand — a suite that reads the manifest, plus one
fixture in `site_test.js` that reads the built page against the tree, because the label
said 34 while the directory held 35 and only the second reading catches that, and
38/667 for the ninth member — five fixtures across the router, trigger and site
suites, and no new suite, because `telegram-dev`'s own 12 checks and 8 plants are
a gate in `telegram-dev`, where the code they exercise ships, 38/671 with the brand
pack and the social preview (937566a, which moved this marker and left the front
page's own copy of the pair at 667 — the drift below), and 38/678 when the front
page's routing table stopped leaving two rows unclickable and the pack pages'
entry points stopped being pills that do nothing.

**Five fixtures for one unclickable cell, and the reason is the class.** The reported
defect was two rows: `seo-llmo` and `evidence-docs` ship in no pack, so the Router
column had no member page to point them at and rendered them as bare names beside ten
links. No guard could have caught it — every check on this site asks whether an address
RESOLVES, and this was an address never written. What the reading turned up beside it:
`color:var(--dim)` on two pages against a token layer defining `--muted`, so the cell
meant to be played down rendered at full ink brightness; and the evidence panel's
`38 suites, 667 fixtures`, typed in beside the marker above and four behind it since
937566a. The panel now reads the marker, `pages.yml` rebuilds when the marker moves,
and the guards were each watched refusing their own planted defect.

**The second half was a choice, not a finding.** *"What it ships"* rendered its 28 entry
points as pills — bordered, monospace, the shape the web uses for a tag you click — that
did nothing, and a pill is a weaker promise than a cell in a column of links, so it was
put to the operator rather than decided here. Each now links to its own `SKILL.md`
directory, at a path READ from the tree: a name with nothing behind it fails the build
instead of shipping as a link that 404s. One plant written for it did **not** refuse —
composing `plugins/<member>/skills/<name>` produces the same nine URLs today — and that
is recorded rather than quietly dropped; the plant that does refuse composes the
repository name, where `sheleg-design`/`sheleg-design-skill` is a real divergence.

That jump is not eight new suites. **24/469 was wrong when it was written** — the
2026-08-16 audit recounted the same command at 26 node suites and 542 fixtures,
against a line whose own next sentence says the numbers are counted rather than
carried. A ratchet 73 fixtures below the truth cannot detect the loss of two
whole suites, which is the entire point of having one. The count above is
`npm test` with its summary line excluded, since that line reports suites and
would otherwise be counted as fixtures.

## Release tags are annotated — decided 2026-08-17 (B-69)

`git tag -a`, never a bare `git tag`. **`git describe` without `--tags` sees annotated
tags only, and that is what `git submodule status` prints** — the one line a maintainer
glances at to decide whether a member is current. Measured 2026-08-16: `task-pipeline`'s
last seven releases were lightweight and the umbrella reported it as **v1.60.0**, seven
releases stale; `sheleg-design` as v1.36.1, `agent-sync` as v1.11.0. Nothing was wrong in
any of those repositories — the reading instrument was. A lightweight tag also carries no
tagger, date or message, so a release has no signed-off record.

**Re-cutting a published tag is not the remedy.** Force-moving it re-triggers the release
workflow into an `npm publish` npm must reject, painting a red run over a release that
succeeded. `agent-stack` v0.11.1 and `super-ux` v0.41.5 are therefore left lightweight and
correct themselves at their next release; `test/validate.py` names them on every run until
they do.

## What proves a claim here

Numbers are counted by running something, never carried across a document —
the release notes for v0.22.0 said 71 fixtures, its acceptance record said 74,
and the count at that commit is 75. Every named command must be runnable and
every named file resolvable. This is the `evidence-docs` router applied to the
repository that ships it.
