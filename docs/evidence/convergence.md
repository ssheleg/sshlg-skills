# Convergence — what was observed across components, and at which versions

**Why this file exists.** Stage 10 already required `git submodule status` with no `+` and
every repository clean and pushed. That is a statement about **commits**: the parent points
at the child's newest one. It proves nothing about whether the two versions work *together*
— each side's suite ran against its own side, and no check ran across the pointer. Neither
repository looks wrong alone, which is why the gap survived being written down twice.
Doctrine: `task-pipeline` →
[`references/acceptance.md`](../../skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/acceptance.md)
→ *The pointer is not the path*.

**What demands a record here, and what does not.** The convention is a record whenever a
component pointer **moves** in the range being accepted; a range that crossed no boundary
has no seam to prove. The mechanical form of that demand is the script `task-pipeline`
seeds into a host project —
[`templates/convergence.sh`](../../skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/templates/convergence.sh),
which calls itself `check-convergence.sh` in its own header, checks the pointers
mechanically and the seam by record, and prints `dormant:` for a range where nothing moved.
It is seeded here now as [`scripts/convergence.sh`](../../scripts/convergence.sh) and run
as `npm run convergence` (B-91, 2026-09-03). Watched behaving both ways before it was
believed: over a range where no pointer moved it prints *dormant: no component pointer
moved in this range* and exits 0, and over `1c23d56..HEAD` — where `task-pipeline` moved
1.81.1 → 1.82.4 — it exited **1** naming the missing record, which is the silence this row
was filed about. The sentence that stood here before named a script under `scripts/` as if
it ran, and no such file had ever existed in this tree.

---

## 2026-09-03 · task-pipeline 1.81.1 → 1.82.4 — the only pointer that moved

**Why one pointer.** Two waves deliberately held `task-pipeline` back — *"the registry
still serves 1.81.1 while v1.82.3's stamp half is in flight"* — while the other eight
members moved. This range accepts that one, and it is the first range this repository has
accepted with the mechanical check in place rather than by hand.

**Versions observed.** Umbrella `v1.28.0` against `task-pipeline` **1.82.4** at commit
`7f32d0a`, the version `npm view task-pipeline-skill version` served at cut time. The other
eight pointers did not move in this range. The commit is named as well as the version
because the checker resolves the pointer, not the tag: a version string can be true of two
trees, and the sha is what a clone will actually fetch.

**The seam, and what was run across it.** The umbrella consumes this member two ways: the
routing block it writes into the operator's file, and the pin the launcher installs. Both
were exercised at these two versions — `npm test` → rc=0 with `COUNTED: 47 suites, 802
fixtures, 9 pinned members`, which includes the pin check reading the version out of the
pinned `package.json` against `skills.json` and the README row; and `npx sshlg-skills@latest
update` → `55 of 55 steps, all green`, after which the installed plugin, the registry and
the pin all read 1.82.4. The card check `node test/site_test.js` renders this member's
social preview from the umbrella's own `skills.json` row and compares it byte for byte
against what the member commits, which is the one check that fails when the two sides
disagree about a string.

**What was NOT proved.** No test executes task-pipeline's stages from this repository, and
none exists to run: the composition here is a pin and a text block, not a called contract.
Stated so a green above is not read as more than it is.

---

## 2026-08-20 · all eight members at once — the truth pass

**Why every pointer moved.** The pass had one subject across nine repositories: checks that
reported green over something they had never read. Closing that in one member and not the
rest would have left the family in a combination nobody tested, which is the whole reason
this file exists.

**The component pointers that moved**

| component | pointer before | pointer after |
|---|---|---|
| `skills/super-ux` | `cc4c3eb` | `5e9d8c9` (v0.46.0) |
| `skills/task-pipeline` | `2425bd6` | `8354996` (v1.73.0) |
| `skills/agent-sync` | `f1a66b7` | `77deede` (v1.15.0) |
| `skills/make-skill` | `fc25f4a` | `339d301` (v0.23.0) |
| `skills/sheleg-design` | `30bfbc3` | `0f8fa82` (v1.45.0) |
| `skills/seo-aeo-audit` | `aef3fd3` | `f3bbbd0` (v0.24.0) |
| `skills/sheleg-dev` | `6f66255` | `7e0a6c9` (v0.8.0) |
| `skills/agent-stack` | `7937c35` | `24e4068` (v0.13.0) |

**The order, and it is not negotiable.** Child released → observed on the registry →
parent's pointer committed. This file already records the measurement that made it a rule:
a pin naming a version the registry never served *"is wrong on its own terms and no later
release repairs it"*. So each member was tagged and published first, `python3
test/check_pins.py` was run against the registry, and only then were `skills.json`, the
README table and these pointers committed together.

**One pointer moved twice, and the second move is why.** `skills/sheleg-dev` was pinned at
`7e0a6c9` when this record was first written, and the umbrella's release then went red on
`agent_sync.py check`: that member had fixed its coordination config in v0.8.0 and left
`docs/AGENT_SYNC.md` describing the previous shape. **No member's own gate asks that
question** — the umbrella's does, which is the entire argument for the check living here.
Regenerated and re-pinned at `72662bc`.

**What was observed across the pointer**

| | |
|---|---|
| `python3 test/validate.py` | PASS — 8 skills, 8 submodules, every pin matching the submodule's committed `package.json` |
| `npm test` | 36 suites, 615 fixtures, exit 0 |
| `python3 test/check_pins.py` | every pin matches its release — npm where published, git tag everywhere |
| each member's own gate | run in its own repository before its tag; the counts are in each member's CHANGELOG |

**What this does NOT prove.** The same limit as every record here: the parent's suite and
each child's suite ran on their own side of the pointer, and the family's behaviour *as an
installed set* is exercised only by `npm run test:plants` (each member's gate fed a dropped
trigger) and by the release's own `npx` smoke test. Nothing here ran the eight skills
together in one agent session. Read the scope before quoting the green.

**Two things this pass learned about releasing, both by being bitten.** Four members' own
guards made their version-bump commit impossible, because a tag cannot exist before the
commit that bumps to it — *ahead of the newest tag* is a disclosure now, *behind* it still
fails. And a tag push could cancel its own release through a shared concurrency group,
skipping the publish while the run list showed a green validate beside the tag; three
members carried that shape and one lost the race live.

## 2026-08-17 · task-pipeline 1.68.0 → 1.69.0

**The component pointer that moved**

| | |
|---|---|
| component | `skills/task-pipeline` |
| pointer before | `a6464f1` (task-pipeline v1.68.0) |
| pointer after | `92fc3ea` — **the `v1.69.0` tag's own tree**, not the branch tip |
| the parent's catalogue | `skills.json` → `task-pipeline.version: 1.69.0` |

**The cross-component path observed, and it is not either side's suite.** The parent's
catalogue claims a version; the registry either serves it or does not. Nothing inside
`task-pipeline` can check that, and nothing inside the umbrella's own `npm test` can either
— `test/check_pins.py` is deliberately outside the offline gate for exactly this reason.

```
$ npm view task-pipeline-skill version
1.69.0

$ python3 test/check_pins.py
ok       super-ux         0.41.5
ok       task-pipeline    1.69.0
ok       agent-sync       1.12.0
ok       make-skill       0.20.0
ok       sheleg-design    1.39.0
ok       seo-aeo-audit    0.22.0
ok       sheleg-dev       0.6.0
ok       agent-stack      0.11.1

every pin matches its release (npm where published, git tag everywhere)
```

Exit **0**. Eight pins, eight matches.

**Why the tag's commit and not the branch tip.** `main` had moved two doc commits past the
tag by the time this was written. `skills.json` claims *version 1.69.0*, and the pin has to be
the tree that version names — otherwise «pinned 1.69.0» is true of the manifest and false of
what a clone receives, which is the *pin is the promise* invariant read backwards.

**What this record does not claim.** It proves the parent's catalogue and the registry agree
at these versions. It does **not** exercise the installed skill's behaviour — the release's
own `npx` smoke test does that on the child's side, and it was re-run here from a clean
working directory before this record was written. Read the scope before quoting the green.

**The measurement that made the order non-negotiable.** Before the child was published,
`check_pins.py` said:

> `MISSING task-pipeline — pinned 1.69.0, which task-pipeline-skill never published (newest
> is 1.68.0)` … *this commit is wrong on its own terms and no later release repairs it.*

So the pin could not be committed first. That sentence is why this file's timestamps run
child-release → observation → parent-commit, and not the other way.
