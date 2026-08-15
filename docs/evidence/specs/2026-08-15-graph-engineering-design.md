# Spec — graph engineering into agent-stack, and the accepted graph findings in task-pipeline

Brief: `docs/evidence/briefs/2026-08-15-graph-engineering.md` · Audit:
`skills/task-pipeline/docs/evidence/specs/2026-08-15-graph-audit.md`

**Not a user-facing task.** No interface, no strings, no visual surface, so the stage-3
UX / COPY / VISUAL tracks do not run. Recorded here rather than skipped silently.

## Global constraints

Every task's requirements implicitly include these.

- **No vendor model ids anywhere in shipped skill text.** Name the tier, resolve at runtime.
- **No vendor product keyword becomes a rule in `task-pipeline`.** The pack is
  harness-agnostic; the pinned article proves how fast such a keyword rots.
- `agent-stack`: every `references/*.md` is reachable from its `SKILL.md` **and** every
  link resolves — `test/validate.py` fails in both directions.
- `agent-stack`: front-matter `description` ≤ 1024 chars. Current headroom —
  orchestrator 110, harness 217, evals 113.
- `agent-stack` version surfaces move together: `package.json`,
  `plugins/agent-stack/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
  the top `## [x.y.z]` CHANGELOG heading. **0.9.0 → 0.10.0.**
- `task-pipeline` version surfaces: `package.json`, `.claude-plugin/marketplace.json`,
  `plugins/task-pipeline/.claude-plugin/plugin.json`, the top `## vX.Y.Z` CHANGELOG
  heading, **and** `SKILL-CARD.md`'s `| **Version** |` row. **1.55.0 → 1.56.0.**
- Umbrella: `package.json`, `## vX.Y.Z` CHANGELOG heading, `skills.json` pins, the README
  family table. **0.58.0 → 0.59.0.**
- Prose wraps at ~92 columns in `agent-stack`, ~80 in `task-pipeline` (its `CLAUDE.md`
  → *Style*). No wrapped line may **begin** with `>`.
- Every plant is anchored on structure, asserts it changed something, and is paired with
  a known-clean fixture (umbrella standing instructions #6 and #11).

## 1. The methodichka — `references/graph-engineering.md` · covers: REQ-001, REQ-002, REQ-003

Path: `skills/agent-stack/plugins/agent-stack/skills/agent-orchestrator/references/graph-engineering.md`.

**Locked contract:**

| Element | Requirement |
|---|---|
| Opening | a `**Load this when**` line, then `**Spec pinned:** … · read 2026-08-15` within the first 15 lines — the format `agent-stack/test/validate.py` enforces for its two pinned skills, adopted here voluntarily because this file pins two external sources |
| Source | the article URL in full, its publication date, and a table naming what this file **adds** to it |
| Sections | node/edge · the loop is already a graph · the fake-edge test · the diamond · two silent failures · the checker node · static vs dynamic · when not to build a graph · what Claude Code executes · barrier or no barrier · project defaults · the four diagrams · where this file disagrees |
| Claude Code claims | each carries the `v2.1.x` CHANGELOG entry that establishes it; the renamed keyword is stated as a version-dated fact, not as an error by the author |
| The diagrams | described in prose with the job each one does. **Not copied into the repository** — brief decision D-5 |
| Quotation | the article is paraphrased throughout, never quoted at length; only Anthropic's own changelog lines are quoted, each attributed to its version |

## 2. `agent-orchestrator/SKILL.md` · covers: REQ-004, REQ-005

**2a. A new section, tight.** The body is already 503 lines / 5009 tokens — past the
4750 working budget the v0.8.0 notes recorded. The new section is therefore **decision
rules only**, ≤ 26 lines, everything else delegated to §1's reference. It carries: node
and edge with the payload rule, the fake-edge test in one line, the diamond's two rules,
the checker node's position, and the static/dynamic auditability rule.

**2b. The References table** gains a row for `graph-engineering.md`.

**2c. The checklist** gains three rows.

**2d. The contradiction at §5 is fixed.** `PlanStage` declares `depends_on`
(`references/patterns.md:118-126`) and the executor beside it runs
`for idx, stage in enumerate(plan.stages)` — declared dependencies, list-order execution.
The fix states dependency-layer execution and names the defect so a reader who has the
old shape recognises it.

## 3. `agent-orchestrator/references/patterns.md` · covers: REQ-006

Delete `MODEL_CONTEXT_WINDOWS` and `DEFAULT_CONTEXT_WINDOW = 16_000` (lines 188-211).
Replace with: resolve the window from the provider or from configuration at one boundary;
a table of vendor ids in source is a lookup that is wrong the week after it is written;
keep the estimator, keep the padding rule. **Acceptance is mechanical:**
`grep -nE 'gpt-4|gpt-3|claude-3-|claude-sonnet-4' references/patterns.md` → no match.

Also add, beside `PlanStage`, the one sentence that makes `depends_on` mean something: a
plan carrying dependencies is executed in dependency layers, not in list order.

## 4. `agent-harness` · covers: REQ-007, REQ-008

**4a. `SKILL.md`** gains *Static or dynamic — the second question* immediately after
*The five workflow patterns*: the six-row decision table and the auditability rule, with
a pointer to §1's reference. ≤ 18 lines.

**4b. `scripts/audit_agent.py`** gains one detector, `unguarded-fanout`.

| Property | Locked value |
|---|---|
| Fires on | `asyncio.gather(` where the string `return_exceptions` appears nowhere in the file, **or** `Promise.all(` where neither `allSettled` nor `.catch` appears anywhere in the file |
| Corroboration | the file must already be agent-related (two independent signs), as every other detector requires |
| Finding text | one sibling's failure discards the other N−1 completed results, and the convergence cannot tell a missing branch from an empty one |
| Fix text | capture per-branch outcomes, then gate the convergence on a checker that can see which branch failed |
| Self-test | two plants (one Python, one JS), each asserting it landed; the existing clean fixture must stay silent, and a second clean fixture — `gather` **with** `return_exceptions=True` — is added so the detector is proven not to fire on the correct shape |
| Blind list | gains one entry: whether a fan-out has a checker between it and its convergence at all — which no static pass can see |

Self-test count moves **6/6 → 7/7**.

## 5. `agent-evals/SKILL.md` · covers: REQ-009

A section after §5 *Judges*: a checker node is a gate inside the graph, its five catches
split three code-checks / two judge-calls, and **its own precision is a measurement** —
a checker that has never rejected anything is a finding. One checklist row.

## 6. The accepted audit findings in `task-pipeline` · covers: REQ-011

| id | Surface | Change |
|---|---|---|
| F-1 | `references/planning.md` | the fake-edge test as a numbered procedure under *Before writing tasks*; an `Edges:` computed line in the `## Self-review` template; the stage-4 GATE names it |
| F-7 | `references/planning.md` | the *Execution order* table gains a `Carries` column; an empty cell is stated to be the finding |
| F-3 | `references/planning.md` | one paragraph: this pipeline is a static graph by choice, its two dynamic elements are named, and the auditability rule is stated |
| F-2 | `references/build.md` §4.2 | a group convergence check after a fanned-out group and **before** integration, with its five catches and its ledger line |
| F-6 | `references/build.md` §4.2 | prefer a harness-native fan-out primitive where one exists — stated without naming a product |
| F-5 | `references/stages.md:395-396` | state all three fan-out conditions, matching `build.md` |
| F-1/F-2 | `SKILL.md` stage table, `references/stages.md` stages 4 and 5 | the gate criteria follow their doctrine files, so the three surfaces do not drift |
| F-8 | `test/negatives.py:143-150` | restore `.git` when it is a **file** (submodule / linked worktree) by copying the resolved gitdir and **stripping `core.worktree`** from the copy |

**Not changed:** the stage list, the stage count, any gate *type*, and stage 8 → 9 (F-4,
rejected in the audit with its reasoning).

## 7. Propagation · covers: REQ-013

| Change | Also update |
|---|---|
| `agent-stack` gains a reference | its `README.md`, its `CHANGELOG.md`, its `docs/evidence/verification.md` |
| `agent-stack` version moves | the four version surfaces; umbrella `skills.json` pin + README family table + the submodule pointer |
| `agent-stack`'s `desc` in `skills.json` still omits `agent-harness` | fix it — board row **B-48**, whose remaining half is exactly this |
| `task-pipeline` doctrine changes | its `CHANGELOG.md`, `SKILL-CARD.md` version row, the five version surfaces, umbrella pin |
| The run itself | umbrella `docs/DOCMAP.md` gains one pointer row for the methodichka; both verification ledgers; the board; the wiki; the code graph |

## Self-review

- REQ coverage: 13 in brief, 13 covered, difference ∅
- Named checks: 11 named, 11 resolve, 0 marked `review`
- Decisions: checked against the brief's D-table (D-1…D-6) and the audit's two rejections
  — no contradiction. D-5 (no image copies) and D-6 (branch + PR for task-pipeline) both
  reappear here as constraints rather than being quietly dropped
- Cost: 3 repositories / 11 files / 13 REQ now, versus 3 / ~10 / 13 estimated at stage 2 —
  proportionate; the one growth is `test/negatives.py`, which the baseline measurement
  added (F-8) and which the audit prices
- Hygiene: 6 checks, 0 findings, 0 open
- Placeholders: 0 · Ambiguity: 2 found (where the audit lives; whether F-6 names a
  product), both resolved inline
