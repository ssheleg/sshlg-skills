# Graph engineering — implementation plan

> **For agentic workers:** execute under task-pipeline stage-5 build doctrine. This run is
> a **declared inline run** — the operator forbade subagents — so the same isolation,
> ledger, TDD and review discipline apply with the orchestrator doing the work and
> reviewing its own diff against `review.md`. A self-review is the weaker evidence and is
> recorded as such.

**Goal:** put the graph-shape material into `agent-stack` where an agent will load it, and
implement the seven accepted findings of the task-pipeline graph audit.

**Architecture:** one new reference in `agent-orchestrator` is the single home for the
material; three `SKILL.md` bodies gain decision rules only and point at it; one scanner
detector and one test-runner fix make two of the claims mechanical.

**Tech stack:** markdown doctrine, Python 3 (`audit_agent.py`, `negatives.py`, two
validators).

**Spec:** `docs/evidence/specs/2026-08-15-graph-engineering-design.md`

## Global constraints

Copied verbatim from the spec's *Global constraints* — no vendor model ids in shipped
skill text; no vendor product keyword as a rule in `task-pipeline`; `agent-stack`
references reachable in both directions; `description` ≤ 1024 chars; version surfaces move
together (agent-stack 0.9.0 → 0.10.0, task-pipeline 1.55.0 → 1.56.0, umbrella
0.58.0 → 0.59.0); wrap ~92 cols in agent-stack, ~80 in task-pipeline; no wrapped line
begins with `>`; every plant structural, asserting, and paired with a clean fixture.

## Execution order

The `Carries` column is this plan dogfooding the change it ships (F-7): an edge with an
empty `Carries` cell is a fake edge and must be deleted before the plan is executed.

| Group | Tasks | Runs after | Carries |
|---|---|---|---|
| A | 0, 1, 2, 3, 4, 5, 6, 7 | — | — (no incoming edge; every one of the eight may start immediately) |
| B | 8, 9 | 1 | the reference's final path and section names — the References row and the body pointers must resolve to them |
| B | 6, 7 | 0 | the accepted findings and their verdicts — a task may not implement a finding the audit rejected |
| B | 10 | 6, 7 | the exact gate and fan-out wording the three summary surfaces must match |
| C | 11 | 0–10 | the changed file set the suites read |
| C | 12 | 0–11 | the final file list, the counts, and the three version numbers the CHANGELOGs state |
| D | 13 | 11, 12 | green suites and committed docs — the preconditions the release gate reads |

**File ownership is exclusive within every group.** Group A's eight tasks touch eight
disjoint files.

**Task 0 sits in two rows on purpose.** It has no incoming edge, so it starts immediately;
tasks 6 and 7 consume its verdicts, so they wait. That is the shape the `Carries` column
exists to make visible — before this column, 6 and 7 read as group-A siblings of 0 and the
dependency was invisible.

---

### Task 0: the graph audit of task-pipeline

**Depends:** —
**Implements:** REQ-010

**Files:**
- Create: `skills/task-pipeline/docs/evidence/specs/2026-08-15-graph-audit.md`

**Interfaces:**
- Produces: eight findings F-1…F-8, each with `file:line` evidence, an evidence tier, a
  computed priority and an accept/reject verdict. Tasks 5, 6, 7 and 10 implement only the
  accepted ones.

**Definition of done:** every cited location resolves; every finding carries a tier and a
verdict; both rejections carry their reasoning; a *Verification* row exists per accepted
finding.

- [ ] **Step 1:** walk the macro stage graph 0→10 with the fake-edge test and record the
      result, including that nine edges of ten carry data.
- [ ] **Step 2:** walk the fan-out surfaces for an unguarded convergence.
- [ ] **Step 3: verify every citation.** Run, for each `file:line` in the table:
      `sed -n '<line>p' <file>` and confirm the line says what the finding claims.
- [ ] **Step 4:** commit.

### Task 1: the methodichka

**Depends:** —
**Implements:** REQ-001, REQ-002, REQ-003

**Files:**
- Create: `skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md`

**Interfaces:**
- Produces: the path above, and the section anchors Task 8 and Task 9 link to.

**Definition of done:** the file exists with every element of spec §1's locked contract;
`grep -c 'x.com/Mahaximus_'` ≥ 1; a `**Spec pinned:** … · read 2026-08-15` line inside the
first 15 lines; each Claude Code claim carries its `v2.1.x`; all four diagrams described;
no verbatim article quotation.

- [ ] **Step 1:** write the file to the contract.
- [ ] **Step 2:** verify. Run: `grep -c 'x.com/Mahaximus_' <file>` → `≥1`;
      `sed -n '1,15p' <file> | grep -c 'Spec pinned'` → `1`;
      `grep -c 'v2\.1\.' <file>` → `≥5`.
- [ ] **Step 3:** commit.

### Task 2: the stale model table

**Depends:** —
**Implements:** REQ-006

**Files:**
- Modify: `…/agent-orchestrator/references/patterns.md:188-211` (the *Context Window Sizes*
  section) and the `PlanStage` block at `:118-126`.

**Definition of done:** no vendor model id remains in the file; the estimator and the
padding rule survive; one sentence beside `PlanStage` states dependency-layer execution.

- [ ] **Step 1: the failing check.** Run: `grep -nE 'gpt-4|gpt-3|claude-3-|claude-sonnet-4' patterns.md`
      Expected **before**: 6 matching lines — this is the check watched failing.
- [ ] **Step 2:** replace the section.
- [ ] **Step 3: the same check.** Expected **after**: no output, exit 1.
- [ ] **Step 4:** commit.

### Task 3: the checker node in `agent-evals`

**Depends:** —
**Implements:** REQ-009

**Files:**
- Modify: `…/agent-evals/SKILL.md` — a section after §5, one checklist row.

**Definition of done:** the section states the checker's position in the graph, the
five catches split three code-checks / two judge-calls, and that a checker which has
never rejected anything is a finding; `python3 test/validate.py` green.

### Task 4: the `unguarded-fanout` detector

**Depends:** —
**Implements:** REQ-008

**Files:**
- Modify: `…/agent-harness/scripts/audit_agent.py` — one detector, its `CHECKS` entry, one
  `BLIND` entry, two plants and one extra clean fixture in `self_test()`.

**Definition of done:** `python3 audit_agent.py --self-test` prints `self-test: 8/8 passed`
(five existing detectors + the new one + two clean fixtures); every plant asserts it
landed; the correct shape (`return_exceptions=True`) is proven silent.

- [ ] **Step 1: watch it fail.** Add the two plants **before** the detector.
      Run: `python3 audit_agent.py --self-test`
      Expected: `FAIL unguarded-fanout: NOT detected`.
- [ ] **Step 2:** add the detector and register it.
- [ ] **Step 3: watch it pass.** Expected: `self-test: 8/8 passed`.
- [ ] **Step 4:** run it against this repository and one unrelated one; confirm no false
      positive on either.
- [ ] **Step 5:** commit.

### Task 5: F-8 — `negatives.py` in a submodule checkout

**Depends:** —
**Implements:** REQ-011

**Files:**
- Modify: `skills/task-pipeline/test/negatives.py:143-150`

**Definition of done:** `python3 test/negatives.py` from this submodule checkout exits 0
with `0 guard(s) did not fire`; the copied `.git` has no `core.worktree`.

- [ ] **Step 1: watch it fail.** Run: `python3 test/negatives.py`; read the exit code
      directly, never through a pipe (standing instruction #8).
      Expected **before**: exit `1`, `FAIL: 2 guard(s) did not fire`.
- [ ] **Step 2:** handle the `.git`-as-a-file case; strip `core.worktree` from the copy.
- [ ] **Step 3: watch it pass.** Expected **after**: exit `0`, `0 guard(s) did not fire`.
- [ ] **Step 4: prove the fix is load-bearing.** Restore the `isdir`-only branch, re-run,
      require the red back, then restore the fix.
- [ ] **Step 5:** commit.

### Task 6: F-1, F-3, F-7 in `planning.md`

**Depends:** —
**Implements:** REQ-011

**Files:**
- Modify: `skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/planning.md`

**Definition of done:** the fake-edge procedure is numbered under *Before writing tasks*;
the *Execution order* table has a `Carries` column with the empty-cell rule; the
`## Self-review` template has an `Edges:` line; the static-graph paragraph names both
dynamic elements and the auditability rule; the GATE names the edges check.

### Task 7: F-2, F-6 in `build.md`

**Depends:** —
**Implements:** REQ-011

**Files:**
- Modify: `…/task-pipeline/references/build.md` §4.2

**Definition of done:** a group convergence check with its five catches, its position
(after the group, before integration) and its ledger line; the harness-native fan-out
preference stated without naming a product; the Rationalizations table gains its row.

### Task 8: `agent-orchestrator/SKILL.md`

**Depends:** [1]
**Implements:** REQ-004, REQ-005

**Files:**
- Modify: `…/agent-orchestrator/SKILL.md` — a new section ≤ 26 lines, the References row,
  three checklist rows, and the §5 executor fix.

**Interfaces:**
- Consumes: Task 1's path and section anchors.

**Definition of done:** `python3 test/validate.py` green (the reference is linked, so the
orphan check passes); the body no longer describes list-order execution beside a
`depends_on` model; the section is ≤ 26 lines.

### Task 9: `agent-harness/SKILL.md`

**Depends:** [1]
**Implements:** REQ-007

**Files:**
- Modify: `…/agent-harness/SKILL.md` — *Static or dynamic* after *The five workflow
  patterns*, one checklist row.

**Definition of done:** section present, ≤ 18 lines; `description` still ≤ 1024 chars;
validator green.

### Task 10: the three summary surfaces in `task-pipeline`

**Depends:** [6, 7]
**Implements:** REQ-011

**Files:**
- Modify: `…/task-pipeline/references/stages.md` (stage 4 GATE, stage 5 fan-out sentence),
  `…/task-pipeline/SKILL.md` (the stage table's rows 4 and 5).

**Definition of done:** all three fan-out conditions appear in `stages.md`; the stage-4
gate criteria agree across `planning.md`, `stages.md` and `SKILL.md`;
`python3 test/validate.py` green.

### Task 11: the suites

**Depends:** [0,1,2,3,4,5,6,7,8,9,10]
**Implements:** REQ-011

**Definition of done:** `agent-stack`: `python3 test/validate.py` exit 0.
`task-pipeline`: `npm run test:all` exit 0 — read from the command, not from a wrapper.
Umbrella: `npm test` exit 0 and `python3 test/check_pins.py` classified.

### Task 12: propagation

**Depends:** [0,1,2,3,4,5,6,7,8,9,10,11]
**Implements:** REQ-013

**Definition of done:** every row of spec §7 done, including `skills.json`'s
`agent-stack` **desc** naming all four skills (closes the open half of board row B-48).

### Task 13: release

**Depends:** [11, 12]
**Implements:** REQ-012

**Definition of done:** three tags pushed, each CI run resolved **by tag** and read
(standing instruction #9), each registry queried for the new version (never the workflow's
own verdict), `git submodule status` with no `+`, every repository clean and pushed.

## Self-review

- REQ coverage: 13 in brief, 13 covered across tasks 0–13, difference ∅.
  **The first draft of this plan failed here and the number is why.** Tasks 1–13 covered
  twelve of thirteen; **REQ-010 had no task**, because the audit was written at stage 2 and
  a thing already done reads as a thing already covered. The set comparison does not know
  that, which is the entire reason it is mechanical. Task 0 was added rather than the
  number adjusted
- Named checks: 18 named, 18 resolve, 0 marked `review`
- Decisions: checked against the brief's D-1…D-6 and the audit's F-4/F-6 rulings — no
  contradiction
- Cost: 14 tasks / 12 shipped files / 3 repositories now, versus 13 / ~10 / 3 at stage 3 —
  grown by one task and one file, both from the same cause: the baseline measurement found
  F-8, which the audit prices and Task 5 fixes
- Hygiene: 6 checks, 0 findings, 0 open
- Placeholders: 0 · Ambiguity: 0 · **Edges: 8 declared, 8 carry data, 0 removed** — the
  fake-edge test run on this plan itself. Group A's eight tasks were checked for false
  ordering and none was found, which is why they are one group rather than eight steps;
  the one edge the first draft *missed* (0 → 6, 7) was found by filling in the `Carries`
  column, not by reading the list
