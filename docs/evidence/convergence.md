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
**This repository has not seeded it into `scripts/`**, so the record below is written by
hand at stage 10 and nothing refuses a range that skipped one. That gap is filed as `B-91`
rather than implied by a path — the sentence that stood here named a script under
`scripts/` as if it ran, and no such file has ever existed in this tree.

---

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
