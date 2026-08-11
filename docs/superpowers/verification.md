# Verification ledger — sshlg-skills

One row per shipped REQ, and what confirmed it. `green` in a gate means the
suite passed; **`verified` here means a person or a command looked at the thing
itself.** The two are different, and the gap between them is what this file
exists to keep visible.

`/task-pipeline checkup` counts the rows sitting at `never` when no run is in
flight — which is the only moment accumulated unconfirmed work is invisible.

**Started 2026-08-10.** Rows before that date do not exist: this repository
shipped eleven releases without a ledger, and inventing retrospective
verification statuses for them would be the exact failure the `evidence-docs`
router names. What shipped earlier is confirmed by its own CHANGELOG section
and nothing more, and that is stated rather than papered over.

## 2026-08-10 — v0.29.0

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | README and `SECURITY.md` count eight members, not six | `grep -rniE '\bsix\b' README.md SECURITY.md docs/DOCMAP.md` → three hits, each semantically correct ("six of the eight pins", "the first six route to", "the first six have house rules") | verified |
| R-02 | `package.json` description names all eight | script comparing the description against `skills.json` names → `OK all 8 named` | verified |
| R-03 | `git status` free of graphify noise | `git status --short` shows only intended edits; `git submodule status` has no line starting `+` | verified |
| R-04 | `docs/superpowers/backlog.md` seeded, priorities computed | file exists, 8 open rows, every row carries blast/age/effort and a computed `P` | verified |
| R-05 | this ledger | you are reading it | verified |
| R-06 | umbrella `CLAUDE.md` house rules (closes C-06) | file exists; every command it names runs — `npm test`, `python3 test/check_pins.py` | verified |
| R-07 | `routers` reports authored-vs-packaged drift; `--diff` and `--adopt` | 27 fixtures in `test/drift_test.js`; two data-loss defects planted into `bin/sshlg-skills.js` and watched failing, then restored | verified |
| R-08 | packaged text adopted for `super-ux` and `task-pipeline` on this machine | section-level comparison against the pre-run backup: exactly two sections changed per file, bytes outside the block identical; the planning rule greps in both files; three consecutive runs produce identical hashes | verified |
| R-09 | the `agent-sync` root cause recorded rather than fixed | board rows B-01 and B-02 cite run ids `31287012133` and `31352513346` and the awk in `release.yml`; both closed the same day when the agent holding that repo shipped the fix | verified |
| R-13 | `agent-sync` pinned to 1.7.0 — every pin now matches its release | `python3 test/check_pins.py` → `every pin matches its release (npm where published, git tag everywhere)`; the tag's commit `1f1f7b9` equals `origin/main`, and its `package.json` reads 1.7.0 | verified |
| R-10 | gate green, ratchets up not down | `npm test` → 10 checks green (validate.py + 9 suites), 209 fixtures counted; was 8 suites / 182 | verified |
| R-11 | the release | `validate` run `31378960647` green **before** the tag was pushed — it was the first green on `main` in three commits, and the two red ones failed on the very pin this run moved; release run `31379020333` green in both jobs; `npm view sshlg-skills version` → `0.29.0`; `gh release view v0.29.0` → published | verified |
| R-12 | a router the operator never wrote is no longer recorded as theirs | clean-HOME reproduction recorded all eight before the fix and zero after; both fixtures watched failing first | verified |

**At `never`: 0.** Every row above names a command whose output was read, not a
step that was taken and assumed to have worked.

**Local installs, same day.** `npx --yes sshlg-skills@latest update` brought this
machine's plugins to the released versions — `agent-sync` moved `v1.5.2 → v1.7.0`
— and the shadow invariant prints nothing. Claude Code loads skills at session
start, so the running session still holds the previous set until it restarts.

## 2026-08-11 — v0.32.0, the always-on budget

Measured with `cl100k` via tiktoken, because the canon says budget against a
tokenizer and `claude plugin details` over-reports by ~40%.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| F1 | eight router texts rewritten in English and compressed | per-router counts before/after: 3408 → 1885 tokens, −44%. On the live machine the block went 4384 → 2663 and the always-on budget 8964 → 7243 | verified |
| F1a | the contract survived the rewrite | the 60 fixtures were switched to English markers FIRST and watched failing 35/60 against the Russian texts, then green against the new ones | verified |
| F1b | the weakened whitespace check still catches a real gap | a boundary's negative half deleted from `TASK_PIPELINE` → suite red; restored → green | verified |
| F1c | the operator's file is undamaged | everything outside the block byte-identical to the pre-run backup; 8 router sections and the map present; three runs leave all four channels hash-identical | verified |
| F1d | the drift mechanism earned its place | after the rewrite the report named exactly the six routers still carrying a byte-identical copy of the old packaged Russian — which is why the first write saved only 625 tokens and adoption was needed for the other 1096 | verified |
| F1e | the release | see the row once the workflow conclusion is read | **never** |

**Still open from the same measurement**, each its own repository and release:
four skill bodies over the 5000-token cap (`ad-tracking` 9160/891 lines is the
worst), five descriptions with no 5% headroom (`google-signin` at 1023 of
1024), and 106 reference files over 100 lines with no `## Contents`.

## 2026-08-11 — v0.31.0, the map and two more channels

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| M1 | the entry-point map, generated from `skills.json` | 10 fixtures in `test/inventory_test.js`, one of which checks every declared `entry` against the commands the family actually ships — all six resolve. The rendered map picked up `sheleg-dev`'s new `stripe-billing` skill without an edit, which is the point of generating it | verified |
| M2 | `install` and `update` refresh the block | measured before: neither called `cmdRouters`. After: a real `update` run reports all four targets | verified |
| M3 | Gemini as a third target, and it reaches existing machines | `~/.gemini/GEMINI.md` went from empty to 200 lines carrying the map and 8 routers, via the consent-on-record path — the first run reported `no-block` and that was the defect | verified |
| M4 | Cursor as a fourth channel in its own format | `~/.cursor/rules/sshlg-routing.mdc` created, 205 lines, front-matter carries `alwaysApply: true`; 9 fixtures including the one that refuses to overwrite a foreign file at that name | verified |
| M5 | the operator's file is not damaged | against the pre-run backup: everything outside the block byte-identical, all 8 router sections unchanged, 19 lines added. Three consecutive runs leave all four files hash-identical | verified |
| M6 | the upgrade path for blocks written before the map | hand-built pre-map block: map inserted after the heading, prose above and below preserved, second run byte-identical | verified |
| M7 | gate and ratchets | `npm test` → 13 checks (validate.py + 12 suites), 247 fixtures; was 10/228 | verified |
| M8 | the release | `validate` green on `ea63262` and **read before** the tag; release workflow green; `npm view sshlg-skills version` → `0.31.0`; `gh release view v0.31.0` published 18:53Z | verified |
| M9 | the pin sweep | all eight members measured in one pass rather than chasing the one CI named — only `task-pipeline` was behind (1.39.0 → 1.44.0), and CI was green first try | verified |

## 2026-08-10 — v0.30.0, B-09

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `defaultAgents` gains `kiro-cli` and `goose` | `node bin/sshlg-skills.js agents` prints both in the default set; `test/validate.py` passes | verified |
| R-02 | `update` reconciles instead of only refreshing | `agent-orchestrator` removed from the hub and all six symlink channels, reproducing the state a never-installed member is in. `npx skills update agent-orchestrator` then printed `✓ All global skills are up to date` and restored **nothing** — a false green, watched. `node bin/sshlg-skills.js update --no-claude` restored it to all seven channels | verified |
| R-03 | `update` stays idempotent, and one channel per agent holds | two further runs left the hub and channel listings byte-identical (`93561d912215` / `6aac4cc74298` both times); restored content `diff -rq` identical to the pre-removal backup | verified |
| R-04 | the prune no longer depends on whether the run touches plugins | a shadow planted by hand (`~/.claude/skills/task-pipeline` beside the `task-pipeline` plugin); `update --no-claude` printed `pruned Claude plain copies…` and the invariant check went silent | verified |
| R-05 | docs move in the same change | the README sentence "update targets whatever is already installed, so it takes no `--agent`" greps to 0; `lib/plan.js` is in the file map and DOCMAP's single homes | verified |
| R-06 | gate green, ratchets up not down | `npm test` → 11 checks (validate.py + 10 suites), 228 fixtures counted; was 9 suites / 209 | verified |
| R-07 | the release | `validate` was read **before** the tag and was RED twice — `task-pipeline` cut 1.39.0 and `super-ux` cut 0.34.0 while this release was being built. Green only on `31421342492`; then tag, release run green, `npm view sshlg-skills version` → `0.30.0`, `gh release view v0.30.0` published | verified |
| R-08 | the released artifact behaves, not just the working tree | `npx --yes sshlg-skills@0.30.0 agents` from an empty cwd prints `kiro-cli, goose` in the default set, and its usage block carries the `--agent`/`--all` update flags | verified |

**The cost, stated rather than discovered.** `update` now issues eight `skills
add` calls it did not before, so it is slower than a pure refresh. That is the
price of reconciliation and it is deliberate: a fast command that silently
delivers nothing is worse than a slow one that delivers.

**The code graph** was refreshed at commit `8a02463` — `lib/plan.js` and
`test/plan_test.js` are in it, and both are named in the README file map and
DOCMAP. Its **document half is stale since 2026-08-08**: a full pass needs an
LLM key for eleven doc files, so this run used `--code-only`. Said here rather
than left for a reader to assume the whole graph is current.

**Found by breaking it, and worth the line.** R-04 was not in the brief. Making
`update` call `skills add` handed it the auto-detect side effect `install`
always had, and the prune's condition — *"is this run touching plugins"* — was
a proxy for the real one. The shadow appeared on the operator's own machine at
20:35 during the very run that was proving R-02, and was caught by the
invariant check rather than by a test. The fixture came afterwards.

## 2026-08-10 — family wiring audit

Ran with no task in flight, against the question "does the wiring actually
hold": registry → manifest → disclosure → install → what Claude Code loads.

| Check | Command | Result |
|---|---|---|
| Registry vs submodules vs README | `python3 test/validate.py` | 8 skills, 8 submodules, pass |
| Pins vs releases | `python3 test/check_pins.py` | every pin matches its release |
| Plugin manifests, strict | `claude plugin validate . --strict` in each member | 8/8 exit 0 |
| SKILL.md front-matter | audit script, 19 skills | 0 findings — every `name` matches its directory, every description inside 1024 |
| Progressive disclosure | 281 `references/X.md` mentions resolved against each skill's own `references/` | 0 real findings (2 hits, both the literal placeholder `FILE.md` inside `assets/*.template.md`) |
| Router wiring | 8 routers vs `skills.json` | every required member ships |
| Declared vs shipped | `skillNames` vs directories carrying a `SKILL.md` | 19 declared, 19 shipped, no extras |
| Declared vs installed | plugin cache at each pinned version | 19/19 present; command counts match the repo (15/1/1/1/1/1/0/0) |

**The instrument needed two rewrites before it was worth trusting**, and that is
the finding worth keeping. Version one scanned prose for paths and slash
commands and reported **4221** problems; version two, scoped to the shipped
surface, reported 185. A hand-check of both said essentially all were false: a
skill legitimately names files in the *user's* project (`docs/ux/scenarios.md`,
`src/lib/motion/tokens.ts`) and legitimately quotes Claude Code built-ins
(`/mcp`, `/plugin`), while `</summary>` alone produced forty command findings.
Version three checks only what has exactly one correct answer, and found
nothing — which is a much smaller and much more useful number.

## What is deliberately not verified here

`agent-sync`'s two defects (B-01, B-02) were recorded, not fixed: another agent
held that repository for the whole run. They shipped both fixes while this run
was in flight, which is why the pin moved — but the fixes are theirs and the
evidence cited here is their CI, not work this run did.

Nothing else about that repository is asserted here.
