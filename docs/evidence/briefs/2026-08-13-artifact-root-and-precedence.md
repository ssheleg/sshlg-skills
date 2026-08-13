# Brief — the artifact root stops carrying another pack's name

**Run** `superpowers legacy: artifact root and precedence` · 2026-08-13 ·
operator-confirmed at stage 0 · model `claude-opus-5[1m]`

Two independent axes that arrived as one request, kept separate because their
mechanisms share nothing.

**Axis A — precedence becomes a mechanism, not only prose.** The routing block
already carries the paragraph that says another pack's always-on mandate does not
outrank the family's map (`lib/routers.js:180-187`). Nothing detects whether such a
pack is *enabled*. `hooks/post-tool-use.js:39-58` already reads `enabledPlugins` and
builds a skill→plugin map, but looks only for shadowing plain copies.

**Axis B — the artifact root is renamed to `docs/evidence/`, and
`docs/superpowers/` becomes supported legacy.** The name was inherited from the
`superpowers` plugin, whose own tests walk the same path
(`~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/tests/`).
`references/artifacts.md:57-61` already calls the name historical convention and
promises a host project *may relocate the root* — a promise no code keeps.

## Source ledger

| Source | Consulted | What it gave |
|---|---|---|
| Code | yes | `hooks/statusline.js`, `lib/hooks.js:95`, `lib/routers.js:180-187`, `lib/routegate.js:3-9`, `hooks/post-tool-use.js:39-58`, `hooks/session-start.js:41-72`, `pipeline.schema.json`, `references/artifacts.md:57-61` |
| Code graph `graphify-out/graph.json` | yes | `built_at_commit a20c402`, signal **exact**, **4 commits / ~1h42m behind `HEAD 06761e6`** — ⚠ not trusted for reach until refreshed |
| `CLAUDE.md` (umbrella) | yes | one write path to the operator's file, through `protect()`; a second is the regression to watch for |
| `skills/task-pipeline/CLAUDE.md` | yes | five version surfaces; **corrupt files in python, never `sed -i`**; every new guard needs a negative self-test in `validate.yml`; `npm test` executes `templates/docgate.sh` over templates-seeded scratch |
| `~/CLAUDE.md`, `~/.claude/CLAUDE.md` | yes | why `superpowers` is disabled: a `SessionStart` hook printed 854 tokens; plugin hooks have no per-hook off switch |
| `docs/DOCMAP.md` | yes | :29 the status line borrows every number; :30 the hooks planner parks a foreign `statusLine`; :48-49 briefs and carry-over homes |
| `docs/superpowers/retro.md` | **read in full** | six standing instructions in force. **#4 fired during this harvest.** #5 and #6 bind this run |
| `docs/superpowers/backlog.md` | yes | 23 open rows; **B-19 is this run's Axis A question** |
| `docs/superpowers/verification.md` | yes | 16 REQ rows, **0 at `never`** |
| Carry-over ledgers (2) | yes | **C-01 = B-19**; C-05 negatives break in a submodule checkout; C-06 `workflow` scope on an HTTPS push |
| Member repositories (6) | yes | occurrence counts below; `evidence-docs/SKILL.md` names no artifact root at all |
| `superpowers` plugin cache 6.3.0 | yes | the path is its own convention |
| Wiki (obsidian-wiki 2026.8) | yes | **none found** for this task's nouns; `projects/sshlg-skills/sshlg-skills.md` never mentions superpowers |
| Companions | graphify ✓ · wiki-query ✓ · context7-docs ✓ · graph ✓ (4 commits stale) | context7 not reached: no third-party runtime dependency |

## The measurement, and the one that was wrong first

The scope was first stated as **1122 occurrences in 241 files** and that number was
wrong. It counted `graphify-out/graph.json` — the generated code graph indexes the
whole tree, and the graph artifacts hold 5086 occurrences of the path by themselves
(`super-ux` 475, `task-pipeline` 729, umbrella 161). Nobody edits those; stage 9
rebuilds them.

Counted again in Python, excluding `graphify-out/`, `node_modules/`, `.git/`:

| Repo | total | frozen | live | files (live) |
|---|---:|---:|---:|---:|
| `sshlg-skills` | 28 | 18 | **10** | 5 |
| `task-pipeline` | 212 | 71 | **141** | 38 |
| `super-ux` | 24 | 20 | **4** | 3 |
| `sheleg-design` | 44 | 34 | **10** | 6 |
| `seo-aeo-audit` | 19 | 6 | **13** | 5 |
| `agent-sync` | 7 | 5 | **2** | 2 |
| `make-skill` | 6 | 1 | **5** | 5 |
| **total** | **340** | **155** | **185** | ~64 |

`sheleg-dev` and `agent-stack` hold **0** and are not touched.

**46% of occurrences sit inside frozen records** — `docs/superpowers/{specs,plans,briefs,retro}/`
and CHANGELOG. `test/validate.py:521` and `:935-939` already call them frozen
point-in-time records and exclude them from live checks; `skills/task-pipeline/CLAUDE.md`
says of its own copies *do not update them to the current shape*. A 2026-08-04 brief
describes where artifacts lived **then**. Rewriting it would falsify the record.

**Markdown links into the directory, family-wide: 1.** The link gate
(`skills/task-pipeline/test/validate.py:184-200`) checks real `[…](…)` links and
strips fenced blocks, so the move breaks almost nothing. The 185 live occurrences are
prose and code strings.

## The finding that shapes the plan — 29 plants anchored on the literal path

| File | plants |
|---|---:|
| `skills/task-pipeline/.github/workflows/validate.yml` | 26 |
| `skills/task-pipeline/test/validate.py` | 2 |
| `skills/seo-aeo-audit/.github/workflows/validate.yml` | 1 |
| `skills/sheleg-design/test/validate.py` | 1 (synthetic fixture body) |

CI copies the repo to `/tmp/bd3-copy/` and damages a file at an exact address. A
`git mv` that leaves those strings behind makes every one of them write to a path
that no longer exists: the plant no-ops, and the negative self-test reports *guard
did not fire* about a guard that is fine. **That is standing instruction #6,
literally, at a scale of 29** — three occurrences in one session were enough to turn
every push red for a healthy validator.

`MIN_EXPECTED = 312` in `test/negatives.py:38` does **not** protect against this. It
catches a plant that stops *parsing*; a plant that parses and writes to a dead path
keeps the count at 312 and says nothing. The check has to be *the plant changed the
file*, which is instruction #6's own corollary.

## REQ table — frozen; adding is free, removing needs the operator

| REQ | Deliverable | Verified by |
|---|---|---|
| REQ-01 | `artifactRoot(cwd)`: `paths.artifacts` → existing `docs/evidence/` → existing `docs/superpowers/` → `docs/evidence/` for a fresh project. A candidate is adopted only when it *looks like* a pipeline root (carries a known register), never on bare existence | five fixtures: old-only → old; new-only → new; both → new + leftover report; fresh → new; an unrelated `docs/evidence/` with no register → **not** adopted. Each watched failing |
| REQ-02 | `paths.artifacts` in `pipeline.schema.json`, any relative path | schema validates; fixture with `docs/runs/` |
| REQ-03a | task-pipeline live prose stops hardcoding the path (141) | `grep` outside frozen and plants → 0 |
| REQ-03b | five members' live prose (34) | same, per repo |
| REQ-03c | umbrella live prose (10) | same |
| REQ-04a | 28 task-pipeline plants moved **and proven to land** | `npm run test:negatives` green; each plant asserts the file changed |
| REQ-04b | `seo-aeo-audit` (1) and `sheleg-design` (1) plants | same, per repo |
| REQ-05 | frozen records untouched; the move recorded once in each `DOCMAP.md` with its SHA | `git log --follow` resolves; the DOCMAP row's SHA resolves under `git rev-parse --verify` |
| REQ-06 | `migrate-artifacts [--dry-run]`: backup before write, preview shows removals, idempotent across three real runs | end-to-end fixture, 3 runs, hashes compared (instruction #2); python, never `sed -i` |
| REQ-07 | Axis A: one report per session naming an enabled plugin that injects at `SessionStart`, its `hooks.json`, and that enablement is the only switch. Plus an on-demand view so the report can be *watched firing* where nothing competes | fixture with a competing plugin enabled → prints; none → silent; unreadable registry → silent, never a wrong claim (instruction #1) |
| REQ-08 | `/task-pipeline setup` reports the resolved root and why | fixture on both resolver branches |
| REQ-09a | six members: gate green, released, `git mv` done | each repo's own `npm test`; CI verdict read before each tag |
| REQ-09b | umbrella released last; every pin re-measured in one sweep before the push (instruction #5) | `python3 test/check_pins.py` green |
| REQ-10 | B-19/C-01 stay open, marked *not decided by this run* | the board row |

## Decisions taken at stage 0

| # | Decision | Why |
|---|---|---|
| D-01 | Axis A goes into the existing `settings.json` channel; B-19/C-01 not resolved | no new write path to the operator's file appears — the hook is already wired, only its output changes |
| D-02 | `git mv` the whole directory in all 7 repos; frozen texts untouched | one root per repo is what the resolver's precedence expects; the move is recorded once in DOCMAP rather than by editing 155 records |
| D-03 | ship `migrate-artifacts` with `--dry-run` | task-pipeline is published; a resolver with no migration path leaves third parties on legacy forever |
| D-04 | one sweep, umbrella last, all seven released | instruction #5: re-measure every pin in one sweep rather than fixing the member a log named |
| D-05 | outward-facing steps authorized in advance for all seven repos | the gate stays *CI green and its verdict read* before each tag |
| D-06 | `docs/evidence/` chosen over `docs/pipeline/` | `evidence-docs` already ships inside the task-pipeline plugin; `.task-pipeline/` and `pipeline.json` already exist and a third *pipeline* would confuse |
| D-07 | the legacy root never warns | a warning every turn is why hooks get switched off; legacy means supported |

## Module map — a platform, cut per repository

Cut this way because the rename and its plants cannot be separated *within* a repo:
the moment `git mv` lands, that repo's plants write to a dead path, so both must move
in one commit or CI is red between them.

| Module | Scope | REQ | Notes |
|---|---|---|---|
| **M1** *(walking skeleton)* | task-pipeline: resolver, schema, prose, 28 plants, `git mv`, setup report, release | REQ-01, 02, 03a, 04a, 08 | holds 141 of 185 live occurrences and 28 of 29 plants — if the shape is wrong anywhere, it is wrong here first |
| **M2** | task-pipeline: `migrate-artifacts` | REQ-06 | new executable code; `bin/task-pipeline.js` currently rejects every unknown argument with exit 2, so its arg contract changes |
| **M3** | super-ux, sheleg-design, seo-aeo-audit, agent-sync, make-skill | REQ-03b, 04b, 09a | 34 live occurrences, 2 plants, five releases |
| **M4** | umbrella: Axis A, prose, `git mv`, pins, board | REQ-03c, 07, 09b, 10 | last, because it points at members that must already be released |
| **all** | | REQ-05 | one DOCMAP row per repo, carrying the move's SHA |

Stages 3→10 run per module.

## Carry-over on entry

- **C-05** (inherited): `npm run test:negatives` in task-pipeline reports one broken
  guard when run from a submodule checkout — the guard reads `git log -p`, the
  harness copies to `/tmp`. CI is green. This run must not read that as its own
  breakage.
- **C-06** (inherited): an OAuth push to `.github/workflows/` over HTTPS is refused
  for want of the `workflow` scope. **This run edits `validate.yml` in two
  repositories**, so C-06 fires by construction.
