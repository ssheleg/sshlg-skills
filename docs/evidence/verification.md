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
| F1e | the release | `validate` green and read before the tag; release workflow green; `npm view sshlg-skills version` → `0.32.0` | verified |

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

## v0.35.0 — the backup stopped being a habit

**B-05, carried since 2026-08-06.** `lib/backup.js` + `protect()` in
`lib/apply.js`, 20 fixtures in `test/backup_test.js`.

What confirmed it, in the order the evidence was taken:

| Claim | What proved it |
|---|---|
| The gate has teeth | The `if (saved.action === 'backup-failed')` return was deleted and the fixture reported *the operator file was modified with no backup behind it*. Restored; 20/20 green again. |
| A real run leaves the pre-run bytes | A copy of the live `~/.claude/CLAUDE.md` was perturbed by one character in a temp HOME; `routers --update` wrote, and `claude_CLAUDE.md.20260812T090037Z` held the perturbation while the live file no longer did. |
| An idempotent run leaves nothing | Three consecutive `routers --update` runs against the real file: hash `cf59cc11` all three times, backup directory empty. Backing up happens after the bytes are known to differ. |
| A failed copy is reported, not swallowed | The backup directory's path was occupied by a file. Output: `НЕ записан: не удалось сделать резервную копию (EEXIST …). Файл не изменён.` — and the file's hash was unchanged. |
| One failed target does not hide another | Two targets, both unbackupable: both appear in the run's records with `backup-failed`. |
| A key cannot escape its directory | `keyFor('/elsewhere/etc/passwd', '/home/x')` — the first attempt returned `_.._elsewhere_etc_passwd`, and the fixture caught the surviving `..`. Separators are sanitised before dot-runs are collapsed, so a traversal is recognisable while it is still a traversal. |

**The decision worth keeping** is where copies do *not* go. The obvious fallback
for a missing `home` is the file's own parent — which puts copies inside
`~/.cursor/rules/`, a directory whose owner loads every `*.mdc` it finds. A
backup that the protected tool can read back as an always-apply rule is a worse
failure than no backup, so a missing `home` refuses to write at all.

## What is deliberately not verified here

`agent-sync`'s two defects (B-01, B-02) were recorded, not fixed: another agent
held that repository for the whole run. They shipped both fixes while this run
was in flight, which is why the pin moved — but the fixes are theirs and the
evidence cited here is their CI, not work this run did.

Nothing else about that repository is asserted here.

## 2026-08-13 — v0.42.0 (+ task-pipeline 1.50.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| REQ-001 | A write to an operator instruction file is preceded by a copy, and a copy that cannot be proven denies the write | `test/guard_test.js` (25 fixtures) + `test/hooks_e2e_test.js` runs the real script as a process: the allow path leaves exactly one copy whose bytes equal the file; the deny path is planted by putting a FILE where the backup directory belongs, and the operator file is byte-identical afterwards | verified |
| REQ-002 | The guard sees every write path, not only `Edit` | `guard_test.js`: eight Bash write forms, `~`/`$HOME` spellings, and six near misses that must stay silent (`cat`, `grep`, `diff`, a write to `…​.bak`, `cp FILE FILE.dated`, a read piped elsewhere). The `cp` case was watched failing — the first draft classified it as overwriting the file | verified |
| REQ-003 | `git commit` is refused while `npm test` is red | `test/repogate_test.js` (13) + an e2e fixture pointing `CLAUDE_PROJECT_DIR` at a throwaway project whose suite fails on demand; the refusal carries the failing output, and a green suite lets the commit through | verified |
| REQ-004 | A `SKILL.md` breaking the front-matter limits is reported in the turn it was written | `repogate_test.js`, including a **folded** `description: >-` block: measured as legal by the first draft because `$` under the `m` flag ends at a line, watched failing, then fixed | verified |
| REQ-005 | A bare `npx skills update <member>` is denied, with the launcher in the reason | `test/hygiene_test.js` (17) + e2e; the launcher itself and non-family skills are asserted **not** denied, because a guard that refuses its own remedy is worse than none | verified |
| REQ-006 | Shadowing plain copies are reported, and not during the launcher's own run | `test/shadow_test.js` (9) — including `sheleg-design` ← `sheleg-design-skill`, the differing-name case the cheap check misses — and `hygiene_test.js`'s false-positive case: a Claude session whose cwd is this repository is not the launcher installing | verified |
| REQ-007 | `obsidian-wiki setup` can no longer silently truncate the active config | `hygiene_test.js`: the four custom keys return, the **commented** QMD block survives, setup's own new values win, and the restore is idempotent. Watched failing: reversing the merge direction (truncated file as the base) loses the QMD block and the header, and four checks report it | verified |
| REQ-008 | Inflection no longer decides whether a route is named | `test/triggers_test.js`: the 20-prompt corpus scores **18/20**, up from a measured 11/20; `аудит` does not fire on `аудитория`; refusals and questions still silence the hook. Watched failing: removing the closing word boundary makes `аудитория` route | verified |
| REQ-009 | `task-pipeline` refuses an outward release act while stage 6 has not passed | `test/release_gate_test.py` in that repository, 16 fixtures run as a process; **eight watched failing** on the first implementation. CI carries a negative self-test that blanks the payload handoff and requires the suite to notice — run locally against a planted copy before it was committed | verified |
| REQ-010 | The `agent-sync` lease invariant is machine-enforced | **Already shipped upstream, and nothing was built.** `plugins/agent-sync/hooks/hooks.json` wires a `PreToolUse` guard on `Edit\|Write\|MultiEdit\|NotebookEdit` and on `Bash(git commit *)`; `hooks/guard.sh` tokenises the command so `git -C dir commit` cannot pass, and exits 2 on internal failure so it cannot fail open | verified — in place, not by this run |
| REQ-011 | `SessionStart` returns `watchPaths` and a `sessionTitle` where one lands | e2e: with a ledger present, `startup` returns the run's topic as the title and the ledger's absolute path in `watchPaths`; `compact` returns **no** title, which is what the reference says it would ignore | verified |
| REQ-012 | `Notification` emits a terminal sequence and nothing else | `test/notify_test.js` (10): the output object has exactly one key; a semicolon in the message cannot split the sequence and a BEL cannot terminate it early; OSC 8, 52, 1337 and CSI are rejected by the allowlist, and every sequence this module builds passes it | verified |
| REQ-013 | Displacement of our entries is noticed and reported | `test/displace_test.js` (11) + e2e: `ConfigChange` is asserted to emit **nothing** (the reference says every channel it has is discarded), the record survives in config, the next `SessionStart` reports it, and a repaired file stops being announced | verified |
| REQ-014 | `hooks install`/`remove` cover every entry, write only through `protect()`, and repeat | e2e: **three real runs** of the real command against a real settings file produce identical hashes; `remove` restores the pre-install bytes exactly; every wired path resolves to a file that exists | verified |
| REQ-015 | The docs moved in the same change | `docs/DOCMAP.md` — seven new single homes, two propagation rows, ratchet **23/427** recounted by running `npm test` (written as 422 first, from a count taken before five fixtures were added, and corrected by re-running); README, CHANGELOG, `CLAUDE.md`, and this ledger | verified |
| REQ-016 | *(appended during the run)* `~/.claude/settings.json` joined the protected set | `guard_test.js` asserts five targets and that a redirect into it is caught. Same class as the other four: no version control behind it, edited by installers that are not this one | verified |

## 2026-08-13 — v0.43.0

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The progress fraction is never built from the ledger's own line count | `test/runledger_test.js`: a five-stage ledger must not render `gates 5/5` or `100%`, and must print `5 gates passed`. The defect was reproduced on this repository's live ledger first — `gates 5/5` at stage 4 of ten — then fixed | verified |
| R-02 | The denominator comes from `pipeline.json` → `stages[]`, and the example flow's eleven are not a fallback | fixture asserting `/11` never appears without a declared stage list, plus `percent(…, null) === null`; end-to-end through the real `statusline.js` in a project with and without the file | verified |
| R-03 | Glyphs distinguish passed, failed, skipped, in-flight and unentered | fixture asserting `✗` and `⊘` differ from `✓` and from `·` — a skipped stage and an unentered one mean opposite things and rendered alike before | verified |
| R-04 | The four-line block is printed by a hook, derived from the ledger | e2e: `file-changed.js` returns the block with the bar and `gates 3/11`; with no stage list it draws no bar at all | verified |
| R-05 | Taskbar progress and a ping at the moment a person is required | e2e: OSC `9;4;1;27` present with a stage list, absent without one; OSC `777` emitted only when a manual gate has no verdict | verified |
| R-06 | Every router in the block can be named by the prompt hook | fixture comparing `lib/triggers.js`'s table against `lib/routers-registry.js` — it listed 8 and 4 before, so half the family was unreachable. Each new trigger is still a word its own skill advertises, checked against the shipped `description` | verified |
| R-07 | A trigger phrased as a question fires; a plain question still does not | fixtures on «почему упал трафик» (routes) versus «почему этот аудит падает?» and «объясни, как работает интеграция» (silent), and a refusal still beating both | verified |
| R-08 | The un-routed path escalates once per turn | `test/routegate_test.js` (15) + e2e: first `Edit` asks and names the route and the refusal phrase; the second `Edit` of the same turn is silent; a run already open, an opted-out session, an unclassified prompt and `Bash` are all silent | verified |
| R-09 | A refusal phrase silences the session, not the turn | e2e across two prompts of one session; `optedOut` is sticky in `lib/turnstate.js` and a fixture plants the un-declining write | verified |
| R-10 | Every sequence in a concatenated `terminalSequence` is validated | fixture: a forbidden OSC 52 hidden behind a legal OSC 9 is rejected in both orders. The ledger hook sends two sequences, and Claude Code drops the whole field if any part is outside the allowlist | verified |
| R-11 | The turn store cannot escape its directory and does not grow forever | fixtures: `../../etc/passwd` sanitises to a flat name with no dot-runs; a 30-day-old record is pruned at session start and a current one is not | verified |
| R-12 | Docs moved in the same change | DOCMAP — three new single homes, ratchet **24/469** recounted by running `npm test`; README's status-line section rewritten around the real render; CHANGELOG | verified |

## 2026-08-13 — v0.44.0 (+ task-pipeline 1.51.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The release gate is no longer keyed to a stage number | `test/release_gate_test.py`: a six-stage project with tests green at stage 4 releases. Reproduced as a defect first — v1.50.0 blocked it, exit 2, with the reason naming stage 6 | verified |
| R-02 | The tests stage resolves from `pipeline.json`, then from the ledger by name | fixtures for a declared `state: "tests"` stage passing and failing; an unresolvable flow still refuses and its reason names `pipeline.json` | verified |
| R-03 | The gate no longer believes the party it constrains | fixtures: the agent's claim alone blocks with *"the claim is the agent's own"*; claim + green observation releases; observed failure blocks even when the claim says pass | verified |
| R-04 | The observer records what ran, and never judges | `gate-observer.sh` run as a process: a green run and a **red** run are both recorded; `npm test --watch`, `echo "npm test"`, `npm run build` and `git status` record nothing; the ledger is appended to, never rewritten | verified |
| R-05 | The gate reads the **last** observation, not any green one | found by dogfooding against this repository's own ledger — an earlier green sat above a later red and the gate waved it through. Both directions fixtured: later red blocks, later green clears | verified |
| R-06 | The repository gate stops judging other repositories' commits | e2e: a commit with nothing staged in this project is not gated; the red-suite case now runs against a real repository with a real index. The deadlock was live — the umbrella red because the submodule had not shipped, the submodule unable to commit the fix | verified |
| R-07 | The ledger's grammar carries the new shape, with a reader | `templates/run.md` documents `gate:` and shows it in the log example; `references/progress.md` names the reader — the validator refuses a shape nobody reads, and refused this one until it was named | verified |
| R-08 | Guards rose with the change | `test/negatives.py` floor 310 → 311; the new CI self-test disarms the corroboration (`if command:` → `if False:`) and requires the suite to notice, watched failing locally before it was committed | verified |

## 2026-08-13 — v0.44.1

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The progress numerator counts distinct stages, not lines | `test/runledger_test.js`: a ledger with a re-entered stage renders `gates 3/4`, never over 100%. Reproduced on this repository's own run first — `gates 12/11 · 109%` | verified |
| R-02 | The last verdict for a stage id is the one that counts | both directions fixtured: a later pass clears an earlier fail, and an earlier pass does **not** outvote a later fail — the same "history satisfies the gate" shape the release gate was fixed for hours earlier | verified |

## 2026-08-13 — the rest of the hook set (task-pipeline 1.52.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The compaction boundary is recorded | fixture: `PreCompact` appends `event: compact — auto`. The ledger's own header says it exists because compaction happens, and that boundary was the one thing it could not show | verified |
| R-02 | A run whose session ended unclosed is recorded; a finished one is not | fixtures both ways — an open run yields `event: session-end … not closed`, a run with a passing acceptance stage yields nothing. The second matters more: filing finished runs as abandoned would make `checkup` useless | verified |
| R-03 | A subagent stopping is observed, and no `hand:` line is fabricated | fixture asserts `hand:` never appears in the hook's output. That shape carries judgements only the agent holds | verified |
| R-04 | Payload text cannot break the ledger's grammar | fixture: an `agent_type` containing an em dash and a newline still produces exactly one line with exactly two separators | verified |
| R-05 | Editing the product before the build stage asks | fixture: a source edit at stage 3 returns `ask`; once the build stage is entered, silence | verified |
| R-06 | The build stage is resolved by role, never by number | fixture: an unresolvable flow is silent rather than gating. The lesson v1.51.0 learned from the release gate, applied before it could repeat | verified |
| R-07 | The pipeline's own artefacts are never gated | fixture over `docs/ux/`, `docs/superpowers/`, `.task-pipeline/`, README and CHANGELOG — the files stages 0–4 exist to write | verified |
| R-08 | Guards rose with the change | floor 311 → 312; the new CI self-test disarms the finished-run check so every closed run would be filed as abandoned, watched failing locally before it was committed | verified |
| R-09 | B-16: three members bumped in one sweep | `super-ux` 0.38.0, `sheleg-design` 1.24.0, `seo-aeo-audit` 0.16.0 — submodule, `skills.json` and README table moved together, and `npm test` reports no skill-declaration drift | verified |

## 2026-08-13 — the artifact root, and who else speaks first (v0.46.0 + six members)

Ten REQ rows from `docs/evidence/briefs/2026-08-13-artifact-root-and-precedence.md`.
Seven repositories, and the row that matters most is the one where a rename could have
gone silently wrong: 29 CI plants anchored on the literal path.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| REQ-01 | `artifactRoot()`: config → an existing `docs/evidence/` → an existing `docs/superpowers/` → the new default, adopting a directory only when it CARRIES A REGISTER | 7 cases as real trees, and **two implementations compared to each other** — `test/artifact_root_test.py` fails on a disagreement, not only on a wrong answer. Watched failing before either implementation existed. **And the proof that mattered: after `git mv`, `npm test` passed with no further path edits** | verified |
| REQ-02 | `paths.artifacts` in `pipeline.schema.json`, any relative path | `jq` resolves `properties.paths` → `definitions.paths`; the `docs/runs/` case is green. This makes real a promise `references/artifacts.md` had carried unenforced since v0.1.0 | verified |
| REQ-03a | task-pipeline's live prose stops hardcoding the path | 105 occurrences in 34 files; `references/` writes `<artifacts>/`, templates and this-repo statements write the resolved name. `grep` outside frozen records and plants → 0 | verified |
| REQ-03b | five members' live prose | 26 occurrences swept, **8 deliberately left** inside dated `docs/audit/` and `docs/research/` reports, which record a measurement taken on a date | verified |
| REQ-03c | the umbrella's live prose | 9 occurrences in 5 files | verified |
| REQ-04a | 28 task-pipeline plants moved **and proven to land** | `npm run test:negatives`: **24 broken → 0**. One plant reported `PLANT DID NOT LAND` because it anchored on a bare `superpowers/` the path sweep never matched; another guard passed with an EMPTY SUBJECT after the sweep rewrote what it matched on, and the negative self-test said `does not actually fire`. Both repaired, the second watched failing against a planted tree drift | verified |
| REQ-04b | `seo-aeo-audit` and `sheleg-design` plants | both repointed; each repo's own gate green, and `seo-aeo-audit`'s full declared gate (`bash scripts/check-docs.sh`, five suites) exits 0 | verified |
| REQ-05 | frozen records untouched; the move recorded | **155 occurrences of the old name survive inside past-run records on purpose**, counted after the sweep. One DOCMAP row per repo names the move and its release. A mid-run mistake rewrote 51 of them and was reverted from the index, then re-verified by count | verified |
| REQ-06 | `migrate-artifacts [--dry-run]` | 7 cases including **three real runs with hashes compared** — which found a real defect: a backup taken when nothing moved made every repeat run change the tree it claimed to leave alone. Refuses a configured root, never overwrites a collision, and **lists mentions elsewhere without editing one of them** | verified |
| REQ-07 | Axis A: the SessionStart injector report | `sshlg-skills injectors` run live — four injectors with exact `hooks.json` paths, where the machine's own recorded audit named three. Run against a `HOME` with no registry, where it **refuses to answer rather than claiming "none"**. 9 fixtures, watched failing by replacing the silence branch with a sentence | verified |
| REQ-08 | `/task-pipeline setup` reports the resolved root and why | all four outcomes written out, including the default landing on an occupied directory — a stop-and-ask, not a write | verified |
| REQ-09a | six members released | task-pipeline 1.53.0 · super-ux 0.38.1 · sheleg-design 1.27.1 · seo-aeo-audit 0.16.1 · agent-sync 1.10.0 · make-skill 0.17.0. Every CI verdict READ before its tag; every tag on a commit whose own gate was green | verified |
| REQ-09b | the umbrella last, pins re-measured in one sweep | `python3 test/check_pins.py` → exit 0, *every pin matches its release*, all eight. `git submodule status` shows no line starting `+`. **`sheleg-design` was three releases behind, not the one recorded after the last sweep** | verified |
| REQ-10 | B-19/C-01 stays open, marked not decided | the board row says so and carries the reason, plus the fact for whoever takes it: `statusLine` cannot move to a plugin at all | verified |

## 2026-08-13 — B-22, the one thing `update` did not update (v0.47.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `update` refreshes the wired hook runtime, printing new files individually | **Verified from the published package on the machine that had the defect.** Before: the runtime was short exactly `lib/runtime.js`. `npx sshlg-skills@latest update` printed *refreshed 36 file(s) — 1 new, 0 changed* and named it; after, `stale()` reports 0 missing and 0 differing | verified |
| R-02 | Refresh, never install — `create: false` | fixture: a runtime that does not exist is NOT created, `created:false`, and the reason is stated rather than left to be inferred from an empty list | verified |
| R-03 | A runtime that cannot be refreshed fails the update rather than passing quietly | the catch sets `ok = false` and prints `NOT refreshed: <reason>`; silence is what made this invisible for five releases | verified |
| R-04 | One home for the copy — both `hooks install` and `update` call it | `bin/sshlg-skills.js`'s `syncRuntime()` is now three lines delegating to `lib/runtime.js`; the closure that only `cmdHooks` could reach is gone | verified |
| R-05 | Idempotent at the layer that repeats | three syncs against a real tree hashed identical (instruction #2), and separately against a **copy of the operator's actual runtime**: 1 missing → 0, 36 copied, `created:false`, second pass no change | verified |
| R-06 | **A guard on the wiring, not the module** | `check_update_refreshes_runtime()` reads `cmdUpdate`'s body and fails when it stops referencing `lib/runtime.js` or drops `create: false`. Watched failing: replacing the require with `null` produces *cmdUpdate() does not refresh the wired hook runtime*. Scoped to that body, since a repo-wide grep is satisfied by the `cmdHooks` call that was always there. Negative self-test in CI, 8 → 9 | verified |
