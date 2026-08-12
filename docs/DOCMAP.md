# Doc map — sshlg-skills

Where settled things live in this repository, what each fact's single home is,
and what proves the docs are in sync. Written so the next run does not have to
guess, and so "docs updated" is a command rather than a claim.

## What this repository is

The **umbrella** of the ssheleg skill family: a zero-dependency Node launcher
plus eight skills as pinned git submodules. It ships no doctrine of its own —
each skill carries its own — but it owns the family's **routing block**, the
one piece of the family that edits a file the operator owns and did not write.

The first six members have their own `CLAUDE.md` house rules; the two added on
2026-08-06 (`sheleg-dev`, `agent-stack`) carry a validator and CI but no house
rules yet. This repository grew its own on 2026-08-10, which closed carry-over
C-06.

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
| Which hooks the family wires, and what a conflict means | `lib/hooks.js` | pure planner; `bin/sshlg-skills.js` writes through `protect()`, and a foreign `statusLine` is parked under `displaced:statusLine` so `remove` is an undo |
| The family's map — each member's entry point and what it closes | `lib/inventory.js` + `entry`/`role` in `skills.json` | rendered into the block; a fixture checks every declared entry is a command the family actually ships |
| Cursor's rule file, which is ours end to end | `lib/cursor.js` | a file at that name without our sentinel is someone else's and is not overwritten |
| What the launcher hands the skills CLI, and which plain copies are shadows | `lib/plan.js` | `install` and `update` both build from it; a fixture asserts their `add` commands are identical, because the drift between them was invisible in review |
| The wording adoption replaced | `~/.sshlg-skills/config.json`, key `adopted:<name>` | deliberately not the router's own stash key — the on/off switch must not hand back what adoption replaced |
| The block's format and every rule protecting the operator's file | `lib/routers.js` | it touches no filesystem, so the rules are provable without a HOME |
| Which routers this machine wants | `~/.sshlg-skills/config.json` | not in the repo; deviations only, mode 0600 |
| Recorded consent | `~/.sshlg-skills/state.json` | not in the repo; a file that cannot be parsed is not consent |
| Why a release happened | `CHANGELOG.md` | the release workflow reads the first matching section |
| What a run decided | `docs/superpowers/briefs/…` + `specs/…` | the brief is the record; the spec locks contracts |
| What a run deferred | `docs/superpowers/briefs/…-carryover.md` | read in full at stage 10 |
| What a run learned | `docs/superpowers/retro.md` | standing instructions, capped at ten, read in full at stage 0 |

## The propagation matrix

What a change of each type obliges, in the same change:

| Change | Also update |
|---|---|
| A router added, removed or reworded | `lib/routers-registry.js` (only) → README routing table → `test/router_texts_test.js` → CHANGELOG |
| A new CLI command or flag | `bin/sshlg-skills.js` usage block → README → a fixture asserting its exact output and exit code → CHANGELOG |
| A new trigger word for the prompt hook | `lib/triggers.js` **only** — and it must already appear in the target skill's own `description`, or `test/triggers_test.js` fails. Inventing one here creates a second routing policy nothing else reads |
| A new hook or status line | `lib/hooks.js` (the plan) → `hooks/<name>.js` (thin I/O) → a fixture for the planner → CHANGELOG. Writing to `settings.json` goes through `protect()`; there is no second write path |
| A member's pinned version | `skills.json` → the submodule pointer → README family table (all three checked by the validator) |
| A member changing its npm package name | `npm` in `skills.json` — the validator compares it with the submodule's `package.json` name in both directions, with a two-plant negative self-test in CI |
| A new test suite | nothing — `npm test` discovers `test/*_test.js`. That is deliberate: a list would need updating in two places |
| A member gaining or losing a skill | `skills.json` `skillNames` **and** that member's `desc` **and** its README row — the validator catches the first (both directions), the other two are prose nothing can check. `agent-stack` shipped `agent-evals` and advertised orchestrators only, so `list` and the table hid a whole capability |
| A new validator guard | a negative self-test in `.github/workflows/validate.yml` that plants the defect and requires a failure |
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

**Ratchets.** 16 suites, 303 fixtures, 8 pinned members. A change that lowers
any of these without saying so in the changelog is a regression, not a
simplification. Counted by running `npm test`, not carried across from the
previous edit of this file — the numbers rose from 8/182 when `drift_test.js`
landed, to 10/228 with `plan_test.js`, to 12/247 with the map and Cursor, to 13/267 when the write path gained a backup, to 13/269 with precedence over an injected mandate, and to 16/303 when the family grew hooks of its own.

## What proves a claim here

Numbers are counted by running something, never carried across a document —
the release notes for v0.22.0 said 71 fixtures, its acceptance record said 74,
and the count at that commit is 75. Every named command must be runnable and
every named file resolvable. This is the `evidence-docs` router applied to the
repository that ships it.
