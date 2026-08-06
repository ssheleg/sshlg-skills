# Doc map — sshlg-skills

Where settled things live in this repository, what each fact's single home is,
and what proves the docs are in sync. Written so the next run does not have to
guess, and so "docs updated" is a command rather than a claim.

## What this repository is

The **umbrella** of the ssheleg skill family: a zero-dependency Node launcher
plus six skills as pinned git submodules. It ships no doctrine of its own —
each skill carries its own — but it owns the family's **routing block**, the
one piece of the family that edits a file the operator owns and did not write.

The six members have their own `CLAUDE.md` house rules; this repository does
not yet (carry-over C-06).

## Single homes

| Fact | Its one home | Everything else must derive or cite it |
|---|---|---|
| Which skills exist, their repos, plugin ids, pinned versions | `skills.json` | README table and `.gitmodules` are checked against it by `test/validate.py` |
| What a router is — text, table row, required members | `lib/routers-registry.js` | `lib/router-texts.js` is a façade over it; `ROUTER_ROWS` in `lib/routers.js` is derived |
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
| A member's pinned version | `skills.json` → the submodule pointer → README family table (all three checked by the validator) |
| A new test suite | nothing — `npm test` discovers `test/*_test.js`. That is deliberate: a list would need updating in two places |
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
python3 test/check_pins.py
```

Deliberately outside `npm test`: it queries the npm registry, and everything
in `npm test` must work offline.

**Ratchets.** 8 suites, 182 fixtures, 6 pinned members. A change that lowers
any of these without saying so in the changelog is a regression, not a
simplification.

## What proves a claim here

Numbers are counted by running something, never carried across a document —
the release notes for v0.22.0 said 71 fixtures, its acceptance record said 74,
and the count at that commit is 75. Every named command must be runnable and
every named file resolvable. This is the `evidence-docs` router applied to the
repository that ships it.
