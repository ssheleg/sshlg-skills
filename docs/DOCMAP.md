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
plus eight skills as pinned git submodules. It ships no doctrine of its own —
each skill carries its own — but it owns the family's **routing block**, the
one piece of the family that edits a file the operator owns and did not write.

**Three of the eight members have their own `CLAUDE.md` house rules** —
`seo-aeo-audit`, `super-ux` and `task-pipeline` — counted with
`git -C skills/<name> ls-files CLAUDE.md` on 2026-08-16. The other five carry a
validator and CI but no house rules. This paragraph said *"the first six"* until
that count was run, which named five repositories as having a file they do not
have. This repository grew its own on 2026-08-10, closing carry-over C-06.

## Single homes

| Fact | Its one home | Everything else must derive or cite it |
|---|---|---|
| Which skills exist, their repos, plugin ids, pinned versions | `skills.json` | README table and `.gitmodules` are checked against it by `test/validate.py` |
| What each member publishes as on npm | `npm` in `skills.json`, cross-checked against the submodule's `package.json` name | declared, never derived: six members publish as `@ssheleg/<name>` and `task-pipeline` as `task-pipeline-skill`, while the bare `task-pipeline` on npm is someone else's |
| What a router is — text, table row, required members | `lib/routers-registry.js` | `lib/router-texts.js` is a façade over it; `ROUTER_ROWS` in `lib/routers.js` is derived |
| Whether the operator's wording has diverged from the packaged one | `lib/drift.js` | pure, like `routers.js`; a fixture asserts it never reaches the filesystem |
| Where the copy of an unrecoverable file goes, and what a failed copy means | `lib/backup.js` | naming, key derivation and pruning are pure; `lib/apply.js` precedes every write with exactly one `protect()`, and a `backup-failed` record means the file was not touched |
| Which prompt asks for which route, and the words that mean a question | `lib/triggers.js` | pure; a fixture reads each member's shipped `description` and fails on any trigger the skill does not itself advertise |
| What the status line reads, and how each number is derived | `lib/runledger.js` | the ledger's grammar belongs to `task-pipeline` (`references/progress.md`); this only parses it, and every count is borrowed |
| Who else speaks at `SessionStart`, and what may be claimed about them | `lib/injectors.js` | pure decision plus ONE impure `readRegistry()` — the hook and `sshlg-skills injectors` had a copy of that walk each for about ten minutes, which is a second home for one fact. It reports what INJECTS, never what competes: a plugin printing its own state and one printing instructions that outrank yours are indistinguishable from here, and the output says so. The session line is silent when nothing else injects; the paths live behind the verb, which prints on a clean machine too |
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
| A router added, removed or reworded | `lib/routers-registry.js` (only) → README routing table → `test/router_texts_test.js` → CHANGELOG |
| A new CLI command or flag | `bin/sshlg-skills.js` usage block → README → a fixture asserting its exact output and exit code → CHANGELOG |
| A new trigger word for the prompt hook | `lib/triggers.js` **only** — and it must already appear in the target skill's own `description`, or `test/triggers_test.js` fails. Inventing one here creates a second routing policy nothing else reads |
| A new hook or status line | `lib/hooks.js` → `WIRED` (the plan, one list) → `hooks/<name>.js` (thin I/O) → a fixture for the planner **and** a process-level fixture in `test/hooks_e2e_test.js` → CHANGELOG. Writing to `settings.json` goes through `protect()`; there is no second write path |
| A hook that can refuse something | the deciding goes in a pure `lib/*.js` with its own fixture; the hook script only moves bytes and touches the filesystem where a backup happens. Every refusal names its remedy in the same sentence, and every script fails **silent** on a malformed payload — a guard that throws breaks every turn in every session, including sessions of packs that never asked for this one |
| A member's pinned version | `skills.json` → the submodule pointer → README family table (all three checked by the validator) |
| A member changing its npm package name | `npm` in `skills.json` — the validator compares it with the submodule's `package.json` name in both directions, with a two-plant negative self-test in CI |
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

```bash
python3 test/check_pins.py --self-test   # pure, offline, in CI's blocking path
python3 test/check_pins.py               # 0 fresh · 1 pin never published · 2 behind
pip install tiktoken && python3 test/audit_bundle.py
```

The network half and the tokenizer half stay outside `npm test`, which must run
offline with no dependencies. **`check_pins` answers two questions and CI treats
them differently**: exit 1 means a pin names a version nobody published, which
makes the commit wrong on its own terms and blocks; exit 2 means every pin is
real but one is not the newest, which means a member released while this was in
flight — a warning and a run-summary note, never a failure. Conflating them made
five runs red in one day for other agents' releases. `classify` is pure and its
five cases run with no network, including an assertion that the verdicts differ
from one another. `audit_bundle.py` **refuses to run without one** rather than falling
back to a chars-per-token ratio — the two disagree by ~40%, and a number from
the wrong instrument gets quoted as if it were a measurement.

It answers what no other gate does: the ALWAYS-ON budget (every description
plus the routing block, paid in every session of every project), bodies against
the 5000-token cap, two skills competing for one trigger phrase, and the
installed block against the registry.

**Ratchets.** 32 suites, 562 fixtures, 8 pinned members. A change that lowers
any of these without saying so in the changelog is a regression, not a
simplification. Counted by running `npm test`, not carried across from the
previous edit of this file — the numbers rose from 8/182 when `drift_test.js`
landed, to 10/228 with `plan_test.js`, to 12/247 with the map and Cursor, to 13/267 when the write path gained a backup, to 13/269 with precedence over an injected mandate, to 16/303 when the family grew hooks of its own, to 23/427 when those hooks learned to refuse, to 24/469 when the progress rail stopped inventing its own denominator, to 32/557 when `apply_test.js` gave the write path fixtures of its own, and to 32/562 when the graph disclosure learned to read the report beside the graph.

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
