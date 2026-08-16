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

## 2026-08-16 — v0.60.0, the same defect in four more places

Brief `docs/evidence/briefs/2026-08-15-graph-backlog.md`. Members' own REQ rows are in their
own ledgers (`task-pipeline` 5, `agent-stack` 5); these are the umbrella's.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The composition order breaks its fake edge and names the payload on the arrows it keeps | the block renders with `{ sheleg-design ∥ copywriting }`; `npm test` → `PASS: 29 checks green`. A sweep of all nine router texts for the same order claim found **none** — the fake edge was confined to the one line | verified |
| R-02 | Every member declares `shape` and `shapeWhy`, and both are required and checked | 8 of 8 declared; three plants watched failing — a non-answer (`it depends`), a non-reason (7 chars) and a missing field | verified |
| R-03 | The shadow prune is fed the installed set | **measured before the fix**: `shadowsToPrune([agent-stack], ['agent-stack'], ['agent-orchestrator'])` → `['agent-orchestrator']` with no plugin installed anywhere, and the function takes no argument that could tell it. Now reads `installed_plugins.json`, prunes nothing when unreadable; a test pins the contract and a guard refuses the old argument, watched failing | verified |
| R-04 | Five pins moved, each verified against its own published tag before the pointer | `npm view` per package: task-pipeline **1.58.0**, agent-stack **0.11.0**, super-ux **0.41.0**, seo-aeo-audit **0.20.0**, sheleg-design **1.36.1**. `check_pins.py` reports no `BEHIND` | verified |
| R-05 | Work that landed on a member another session had moved was **rebased**, not pinned past | `seo-aeo-audit` had gone 0.17.1 → 0.19.1 under this run with an uncommitted change on the old base; the change was stashed, the member reset to the published tag, the change re-applied and released as 0.20.0 | verified |

**5 of 5 verified. 0 at `never`.**

### What the checks did not cover

- **The convergence checks are doctrine, and no run has yet been stopped by one.** Four
  skills now compare their branches before consuming them; whether that catches a real
  contradiction is evidence the first audit to use them will supply.
- **`shapeWhy` is checked for length, not for truth.** A reason of the right size that is
  wrong reads as answered — the same failure the field exists to prevent, one level in.
- **The code graph is still not refreshable here** (`B-51`), and it remains the one item
  that needs a person rather than a commit.

## 2026-08-15 — v0.59.0, the shape of the work and the arrow that carried nothing

Brief `docs/evidence/briefs/2026-08-15-graph-engineering.md` · spec
`docs/evidence/specs/2026-08-15-graph-engineering-design.md` · plan
`docs/evidence/plans/2026-08-15-graph-engineering.md`. Members' own REQ rows live in their
own ledgers (`agent-stack` 9 rows, `task-pipeline` 7); these are the umbrella's.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `skills.json` pins `agent-stack` 0.10.1 and `task-pipeline` 1.57.0, and the README family table agrees | `npm test` → `PASS: 29 checks green`. The validator was **watched failing first**, in the shape that matters: with the pins moved and the submodules not yet committed it printed *"pinned at 0.10.0 but the submodule's committed package.json says 0.9.0"* — committed state, exactly as standing instruction #10 requires | verified |
| R-02 | `skills.json`'s `agent-stack` **desc** names all four skills, and so does the README row | before: neither mentioned `agent-harness`; after: both name orchestrator, harness, evals and interop. Closes the open half of board row **B-48** — the half nothing can check, so it is closed by counting at release | verified |
| R-03 | `docs/DOCMAP.md` records the graph doctrine's single home in `agent-stack` and a pointer here, never a copy | the row is present and names the file; no copy of the material exists in this repository. `grep -rl 'fake-edge' --exclude-dir=skills --exclude-dir=.git --exclude-dir=graphify-out .` → **6 files**, every one of them a record *about* this run rather than a second home for the doctrine: `DOCMAP.md` (the pointer), `CHANGELOG.md`, the brief, the spec, the plan and this ledger | verified |
| R-04 | A propagation row for *a member gaining a reference*, whose lesson is that a README's stated count is recounted rather than incremented | `agent-stack`'s README said *eighteen* against nineteen shipped; found by counting at release, which is the failure the row now names | **observed** — the row exists because the miss happened in this run |
| R-05 | Every release closed by reading the **registry**, never the workflow | `npm view @ssheleg/agent-stack version` → `0.10.1`; both release runs resolved by tag SHA (`536cb291…`, `7a94a76f…`), never by `--limit 1`. Closed harder than the version string: `npm pack` of the published 0.10.1, extracted, and the scanner run **from the tarball** printing `9/9 passed` | verified |
| R-06 | A version collision with a concurrent session was resolved by moving, not by overwriting | `task-pipeline` main gained a different **1.56.0** mid-review; this run's work rebased onto it and shipped **1.57.0**, its board row renumbered `B-073` → `B-075`, and **their** CHANGELOG reference to their own row restored after a blind replace had rewritten it | **observed** — the collision is the umbrella's open row B-45 arriving, not a new finding |

**6 of 6 verified. 0 at `never`.**

### What the checks did not cover

- **The code graph could not be refreshed.** `graphify . --update` in `agent-stack` exits 1:
  *no LLM API key found (39 doc/paper/image files need semantic extraction)*, and this
  environment has none. `--code-only` was **not** used — it would index 10 code files and
  drop the 39 documents that are most of this pack, which is a worse graph, not a fresher
  one. Nothing stale ships: `graphify-out/` is gitignored in all three repositories, checked
  with `git check-ignore`.
- **The methodichka is not yet load-bearing anywhere.** It is linked, validated and
  released; no run has yet designed a graph with it.

## 2026-08-14 — v0.55.0, the ninth router and the coordination repair

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | A ninth router declares `sheleg-dev`, fourth in table order, carrying all four required parts | `node test/router_texts_test.js` alone → `OK (60 checks)`; `registry.order()` prints the nine in table order with `sheleg-dev` after `copywriting` | verified |
| R-02 | The router is reachable from a prompt, not only present in the block | `node test/triggers_test.js` alone → `OK (27 checks)`, including `every router in the block can be named by this table`, which is the check that would have caught its absence | verified |
| R-03 | A route may front a pack: `sources` declares one skill per trigger group, and `triggers`/`skill` are derived so every other consumer is unchanged | The new `a pack-fronted route reaches every skill it fronts` asserts each source resolves to a shipped skill **and** that the derived union equals the sources — the first half is what stops a typo in sources 2..N hiding behind a valid first entry | verified |
| R-04 | The advertisement check reads the whole description, not its first line | Measured before and after: `stripe-billing` 74 → 993 chars, `ad-tracking` 85 → 879, `google-signin` 95 → 839, `frontend-performance` 87 → 861. The floor moved 40 → 200, since one line clears forty and that is why the defect was invisible | **observed** — the defect was found by a route whose triggers were real words from real descriptions and were reported missing |
| R-05 | A trigger that wraps across a line in a folded scalar still matches | `"оплата подпиской"` is advertised by `stripe-billing` as `"оплата\n  подпиской"` and failed until whitespace was collapsed, which is the decision `router_texts_test.js` had already made for the same reason | **observed** |
| R-06 | The write to the operator's file is idempotent | `node bin/sshlg-skills.js routers` run **three times** against the real `~/.claude/CLAUDE.md`; SHA-256 identical after each: `19b1f7b5faa0788a…` | verified |
| R-07 | Everything outside the managed block survives byte for byte | The `SSHLG:ROUTERS:BEGIN…END` block stripped from a pre-run copy and from the result: **8749 bytes on both sides, byte-identical**. The block itself grew 208 → 233 lines | verified |
| R-08 | A backup is taken before the write, by the mechanism rather than by hand | Four files in `~/.sshlg-skills/backups` stamped `20260814T151014Z`, one per target; a separate pre-run copy was taken independently and its hash matched the original | verified |
| R-09 | Every pin matches its release | `python3 test/check_pins.py` alone → exit 0, `every pin matches its release`, all eight `ok` | verified |
| R-10 | A member released by another session is pinned deliberately, not blindly | `agent-stack` reported **BEHIND** at 0.7.2 against npm's 0.8.0. Before moving it: `npm view` → `0.8.0`, `v0.8.0^{}` → `078dcb6`, `agent_sync status` → no other run holding anything, and `git merge-base --is-ancestor` confirmed this run's own coordination commit is contained in their `main` | verified |
| R-11 | `skillNames` moved with the version | `agent-stack` ships four skills at 0.8.0 (`agent-harness` is new) and the registry listed three. Both moved in one edit; a version bumped alone would have left the launcher advertising three against four | verified |
| R-12 | Coordination is healthy where it claims to be | `agent_sync.py check` in all nine repositories, before and after: **41 problems → 2**, both remaining in `task-pipeline` and both left on purpose. Umbrella: exit 0 | verified |
| R-13 | The repaired guard actually refuses | It fired on this run's own hands: an `Edit` to `skills/super-ux/test/validate.py` was blocked with `this run holds no lease` before any lease was taken. A guard that has refused is a guard | **observed** |
| R-14 | The umbrella's ten `skills/*` patterns could never have matched | `git ls-files skills/super-ux` returns one entry, `160000 … skills/super-ux` — a gitlink and no files beneath it, while the file exists on disk in another repository's index | verified |
| R-15 | `sheleg-design`'s gitignore negation is no longer inert | `git check-ignore -v --no-index .claude/agent-sync.json` → ignored by `.gitignore:5:.claude/` before, not ignored after; `.claude/probe.json` still ignored by `.gitignore:9:.claude/*` | **planted** — the probe path is the negative half |
| R-16 | The suite stays green through all of it | `npm test` alone → `PASS: 29 checks green`. Its four intermediate failures were each read and fixed rather than silenced: the pin invariant, the router count in two tests, and the trigger-advertisement parser | verified |
| R-17 | Every REQ in the brief is answered, and the ladder walk's own finds are filed before this table was written | Four rows filed at stage 10 from the walk rather than from the plan: `B-45` coordination never checked, `B-46` no CI gate under it, `B-48` `skillNames` unchecked against the submodule, `B-49` `sheleg-design` unreachable by the words an operator uses. Board open count 5 → 10 | verified |
| R-18 | The knowledge reaches an installed plugin, not only a repository | `super-ux@super-ux` at `0.40.0` in the plugin cache: **215** practices, `BP-211..215` all five present, `funnel-research.md` in the shared shelf and in exactly `ux-flows` and `ux-foundation`. `sheleg-dev@sheleg-dev` at `0.5.0` with `provider-concentration.md` present and the purchase-event section in `ad-tracking` | verified |
| R-19 | No plain copy shadows a plugin after the update, and no channel holds a broken link | The provider-aware shadow check → `shadows: 0`; broken symlinks 0 in `.claude/skills`, `.agents/skills`, `.cursor/skills` | verified |
| R-20 | The ninth router reaches all four agent files | `SSHLG:ROUTER:sheleg-dev` in `~/.claude/CLAUDE.md`; `sheleg-dev` present in `AGENTS.md`, `GEMINI.md` and `sshlg-routing.mdc` | verified |
| R-21 | The router is reachable end to end, and its boundary holds in the negative direction too | `подключи stripe checkout к воронке` → `["sheleg-dev"]`, `add a meta pixel purchase event` → `["sheleg-dev"]`, `вход через google на лендинге` → `["sheleg-dev"]`. `сделай paywall красивее` → `[]`, which is correct for this router and **wrong for the family** — filed as `B-49` | verified |
| R-22 | Every repository is clean, pushed, and pointed at | `git submodule status` with no line starting `+` after the pointer commit; every repo `dirty=0 unpushed=0` except `task-pipeline`, deliberately untouched with another session's 18 files | verified |
| R-23 | No lease is left held | `agent_sync.py whoami` → `holds: nothing`, in both projects | verified |

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

## 2026-08-14 — iteration 1 of the audit loop: B-27, B-28, B-32

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I1-01 | One plant guard for the family — `test/plant_guard.py`, `snap`/`verify`, content AND mode | 9 fixtures; the first is the incident (a mode-only change must be seen). Deployed in the umbrella, `make-skill`, `seo-aeo-audit`; `sheleg-dev` and `agent-stack` use per-anchor asserts in Python | verified |
| I1-02 | `sheleg-dev`'s two-day red `main` | `validate pass`, both runs, after the plant was re-anchored on the folded block's shape and proven to produce a 1204-char description | verified |
| I1-03 | Plants run on a developer's machine | 18 `sed -i` plants converted to Python across four repos. BSD sed needs an argument to `-i`, so they errored and changed nothing on macOS — the condition that hid the broken one | verified |
| I1-04 | Every plant proves it landed | run locally: 40 cases in `make-skill`, 9 in `seo-aeo-audit`, 8 in the umbrella, 6 in `agent-stack`, 4 in `sheleg-dev`; every one `OK` | verified |
| I1-05 | The guard that shipped wrong, and what caught it | a content-only comparison announced `PLANT DID NOT LAND` about the `hookexec` plant, whose whole effect is `chmod`. **CI caught it**; the local run had truncated its output before that case. Fixed by making the helper mode-aware, and that case is now fixture #2 | verified |
| I1-06 | `npm test` was green on YAML GitHub cannot parse | `check_workflows_parse()` fails on a workflow that does not parse, or parses with no jobs. Watched failing against the exact defect (a body line at one space), quoting GitHub's own wording. Negative self-test 9 → 10 | verified |
| I1-07 | A check that cannot run says so | the umbrella validator gained an `unlooked:` channel; the parse guard uses a real parser and discloses when pyyaml is absent, rather than passing quietly | verified |
| I1-08 | Six releases, pins in one sweep | sheleg-dev 0.4.2 · agent-stack 0.6.1 · make-skill 0.17.1 · seo-aeo-audit 0.16.2 · sshlg-skills 0.47.1. Each gate green on the commit its tag points at, `bash scripts/check-docs.sh` for `seo-aeo-audit` rather than a narrower one. `check_pins.py` → every pin at its release, all eight | verified |
| I1-09 | The loop guard fired on the run itself | after editing one repo's guards twice and another's step three times, the run stopped, named the conflict and escalated to a shared helper instead of a fourth careful copy. Both red PRs went green on the first attempt afterwards | verified |

## 2026-08-14 — iteration 2: B-26, and the coordination it forced

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I2-01 | A release cannot publish over a red suite | `validate.yml` callable, `release.yml` declares `needs: validate`, in all six repositories that lacked it. Every live release run — selected **by tag**, not by recency — reads `validate / validate=success, release=success, publish=success` | verified |
| I2-02 | No plant is duplicated to achieve it | the reusable call runs the same steps; porting a 258-line negatives runner into six repos was the rejected alternative, and is recorded as rejected rather than unconsidered | verified |
| I2-03 | The connection is guarded | three checks — trigger, call, `needs` — because calling the suite without depending on it lets the jobs run in parallel, which looks gated and is not. Watched failing against the planted removal; negative self-test in CI | verified |
| I2-04 | Closed by the registry, not the pipeline | `npm view` for each of the six, after the run reported success. Instruction #9, written by the concurrent session mid-run and honoured here | verified |
| I2-05 | Coordination is on, with its real scope stated | `agent-sync` local-files backend, six registers guarded, `docs/AGENT_SYNC.md` linked from `CLAUDE.md`; `check` → 7 passed, 1 warning naming the lease as exclusive **on this machine**. B-26 was worked under a held lease and the board row carried the claim | verified |
| I2-06 | Pins moved in one sweep | `check_pins.py` → every one of the eight at its release, run before the umbrella push (instruction #5, which fired twice tonight when members moved mid-flight) | verified |
| I2-07 | What coordination cost to be without | one CHANGELOG written at a version **behind its own tree**; a member moving under the work twice; uncommitted work found sitting on `main` in two repositories. None of it visible without a lease — which is why B-19 stopped being theoretical | verified |

## 2026-08-14 — iteration 3: B-25, the flow that declared no gates

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I3-01 | Eleven real gate criteria in this repository's own `pipeline.json` | drawn from what the run actually does, not generic prose: the graph's **measured** lag at 0, the single `protect()` write path at 5, the verdict read by the ref pushed at 7, the registry at 8, release-then-close at 10 | verified |
| I3-02 | The config satisfies the schema its own family ships | 24 violations → **0** against `pipeline.schema.json`. `version` had held the task-pipeline RELEASE (`"1.50.0"`) where the schema wants the config-format version | verified |
| I3-03 | A gate cannot pass by being unreadable | the guard refuses a criterion that is blank or a placeholder, separately from the schema. Watched failing against a criterion cut to `tests pass` | verified |
| I3-04 | The contract is CHECKED in CI, not skipped | CI installs `jsonschema`; absent, the validator discloses through `unlooked:` rather than going quiet (instruction #1). Negative self-test **10 → 11** | verified |
| I3-05 | The criteria are evidence, not decoration | every file, path and function they name was verified to resolve — `check_pins.py`, `plant_guard.py`, `validate.py`, `lib/apply.js`'s `protect()`, the five `docs/` registers, `graphify-out/graph.json`, and the wiki page in the vault | verified |
| I3-06 | Released and closed by the registry | `validate / validate=success, release=success, publish=success` on the run for the ref pushed; `npm view sshlg-skills` → 0.50.0 | verified |
| I3-07 | The lease released **before** the row was closed | B-35's lesson applied the same night it was learned: the claim tag and the status share a cell, so a close written while holding the claim is reverted by the restore | verified |

### Iteration 4 — B-31, acceptance can refuse a run that skipped a stage it declared

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I4-01 | The defect is real, not inferred | `bash scripts/stage-coverage.sh` against this run's own ledger before the fix: *stage 3 (Spec) — DECLARED BY pipeline.json, NO VERDICT IN THE LEDGER*, same for 4; `stages declared 11 · accounted for 9 · 82%`, exit 1 | verified |
| I4-02 | Detection existed and nothing refused on it | `lib/runledger.js` renders the rail that printed `3· 4·` and 73% on 2026-08-13; no gate read it. Stage 7's release gate asks only about the tests stage and fires before 8, 9 and 10 exist | verified |
| I4-03 | One implementation, seeded not copied | `templates/stage-coverage.sh` ships in task-pipeline v1.54.0 and is listed in `templates/README.md`; the umbrella's `scripts/stage-coverage.sh` is that file. The validator refused the release until the template was listed | verified |
| I4-04 | The gate names it, and the guard requires both halves | `pipeline.json` stage[10] `gate.check` opens with the command; `check_stage_coverage_is_wired()` fails on a missing script AND on a gate that stops naming it | verified |
| I4-05 | The guard was watched failing | negative self-test removes only the naming half from a copy: *the final gate does not name scripts/stage-coverage.sh* → `OK: validator refuses an acceptance gate that cannot see a skipped stage` | verified |
| I4-06 | The incident itself is a fixture | task-pipeline negative plants a five-stage flow whose ledger stamps four and requires the refusal to name stage 3; ran green locally and in CI | verified |
| I4-07 | It refuses rather than approves with no input | second negative asserts exit **2** — not 0 — with no config and no ledger (standing instruction #1) | verified |
| I4-08 | Guard counts moved with the guards | `test/negatives.py` MIN_EXPECTED 313 → 315 and the CHANGELOG count with it; both were caught stale by the repo's own ratchet, not by reading | verified |
| I4-09 | The run's own record was made true | stages 3 and 4 stamped as folded into the module brief, wording naming the fold rather than inventing documents; coverage 9/11 → **11/11** | verified |
| I4-10 | The remaining exit 1 is the check being right | stage 5 is genuinely `pending` while the loop runs; the command still exits 1 and says so, which is the intended behaviour at stage 10, not a defect | verified |
| I4-11 | Released and closed by the registry | task-pipeline CI `completed success` on 8d3ef45 read **before** the tag; umbrella CI success on 70794a7, release workflow success, `npm view sshlg-skills version` → **0.51.0** | verified |
| I4-12 | The lease released before the row closed | `.agent-sync/leases/B-31.lock` removed first, board row closed second (B-35) | verified |

### Iteration 5 — B-30, the two members whose exposure read zero because nothing was measured

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I5-01 | The board row was re-measured, not trusted | one sweep over all nine repositories for `docs/evidence/verification.md`: the row said three members, the sweep found **two** — `agent-stack` had been seeded by the concurrent session that morning (13 rows, 0 `never`). Standing instruction #5 | verified |
| I5-02 | `make-skill` has a ledger keyed to its shipped state | 10 REQ rows against v0.18.1, `main` at `ba01f8f` | verified |
| I5-03 | `sheleg-dev` has a ledger keyed to its shipped state | 10 REQ rows against v0.4.3, `main` at `33bba49` | verified |
| I5-04 | Every row was measured, none back-filled | each row carries the command AND what it printed: `PASS: make-skill structure valid (1 cursor rule(s))`, `OK: sheleg-dev structurally valid (12 checks, 6 skill(s), v0.4.3)`, four version surfaces read back per repo, `npm view` → `0.18.1` / `0.4.3` | verified |
| I5-05 | The negatives' verdict came from the registry, by identity | step-level conclusions of the release's own CI run — `31753479647` → **9/9 `success`**, `31749477902` → **8/8 `success`**, 0 failed steps in either. Not `--limit 1` on a branch (standing instruction #9) | verified |
| I5-06 | `sheleg-dev`'s reference graph is intact | 26 `](references/…)` links across six skills, **0 unresolved**; every `references/*.md` named by its own `SKILL.md`, **0 orphans** | verified |
| I5-07 | Both installer paths exercised against a fresh HOME | `HOME=/tmp/fakehome-sd node bin/sheleg-dev.js` installs six skills; the second run prints `skip:` **6** times | verified |
| I5-08 | Each ledger names what it does NOT cover | closing section per repo: vendor drift for `sheleg-dev` (six integrations, none re-checked against a live vendor), advice-as-advice for `make-skill` (no behavioural eval suite), and the CI-only paths in both | verified |
| I5-09 | The pins stayed honest without version noise | the umbrella requires `skills.json` version == the submodule's `package.json` version, not a tag; a docs-only commit keeps the pin valid, and `python3 test/validate.py` → `PASS: sshlg-skills structure valid (8 skills, 8 submodules)` with both pointers moved | verified |
| I5-10 | The family sweep is the closing number, recomputed | after the work: **nine of nine** repositories carry a ledger; `never` appears in exactly one, `task-pipeline` at 99 — which is B-29, the next row | verified |
| I5-11 | What the iteration found became a row, not a note | **B-41** filed: `make-skill` and `sheleg-dev` both carry an empty `scripts` block, so the family's `npm test` gate does not exist in either | verified |
| I5-12 | The lease released before the row closed | `.agent-sync/leases/B-30.lock` removed first, board row closed second (B-35) | verified |

### Iterations 6–9 — the loop drained to what cannot close here

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I6-01 | B-44's premise was wrong and the row says so | `task-pipeline` DID carry `.claude/agent-sync.json`, committed in v1.53.0. The measured cause is narrower: `guardedFiles` named six doc registers and nothing a release touches — `guard CHANGELOG.md` from inside the member returned *not a guarded file* | verified |
| I6-02 | Coordination now covers what two releases collide on | umbrella gains ten `skills/*/…` patterns; **8 of 8 members carry a committed config**; `task-pipeline`'s own went 6 → 13 patterns (`cfce394`, single-file commit so a concurrent release was not swept in) | verified |
| I7-01 | Eleven macOS-dead plants run anywhere (B-33) | `test/plant_edit.py`, three verbs, literal anchors, each refusing by name. **All fourteen plants in that workflow watched running locally** — none of the eleven ever had | verified |
| I7-02 | The class is closed, not the instance | a validator guard refuses `sed -i` **at command position**; the first draft matched any mention and flagged a step name, a comment and an `echo` — instruction #7 inside its own fix | verified |
| I7-03 | The plant for that guard was watched working | it rewrote its own source text twice first, because every literal it names also exists inside it; it targets the last call site now. seo-aeo-audit v0.17.1, CI success on `2366059`, npm confirmed | verified |
| I8-01 | Adopting the shared guard found real defects (B-37) | two of `agent-stack`'s eight plants were doing **nothing**: `cp -R . /tmp/x` into an existing dir nests the tree, and `touch` on a file left by the previous run changes neither content nor mode. Every copy `rm -rf`'d first now | verified |
| I8-02 | Three claim-cell defects, four fixtures watched failing | `agent-sync` v1.11.0: releasing keeps a close written while held (B-35); a register with no pattern reports instead of raising `IndexError: no such group` (B-34). Run against the pre-fix script: **4 of 6 fail** | verified |
| I8-03 | B-42 was fixed twice, and the better one was kept | the concurrent session shipped v1.10.1 with the same first-cell rule, narrowing **after** the marker so a release still trusts what it wrote. Mine was dropped, kept only as regression case 1 | verified |
| I8-04 | The push-scope refusal was fixed family-wide | hit live on `agent-sync` v1.11.0; SSH push-urls set on the two members that lacked them. Measured after: **8 of 8 fetch urls still HTTPS**, the invariant the validator enforces (B-18) | verified |
| I9-01 | The graph refreshes without a key (B-24) | `graphify update .` → **715 → 930 nodes**, 1094 edges, backup at `graphify-out/2026-08-14/`. Stated in both directions: `document` +161, `code` +76, **`rationale` −22**, 54 labels only a semantic pass can produce | verified |
| I9-02 | The stage-9 hub check ran, for the first time | all 8 god-nodes named across 30 documents scanned — no undocumented seam | verified |
| I9-03 | Instruction ids are stable, and the collision is named (B-23) | `#1` was retired 2026-08-13 and refilled the same day; recorded rather than rewritten, because renumbering either side makes a shipped sentence point at a rule it never meant. Guard watched failing on a plant that refills vacant slot 3 | verified |
| I9-04 | The hook channel is decided once (B-19) | `docs/DOCMAP.md`: the channel follows the **shape** — a plugin has a manifest, a launcher has no alternative. Measured: three events in both channels, six scripts, six jobs. A plugin member also writing `settings.json` is now refused, watched failing | verified |
| I9-05 | A check that reads a working tree was caught by CI | the coordination guard was green locally on configs never committed while CI failed on two of them — same defect as the pin guard written the same afternoon. It asks git now, watched failing on both shapes | verified |
| I9-06 | Closed by the registry, not by recency | five releases, each CI verdict read **before** its tag; `npm view` confirms `task-pipeline` 1.54.0, `seo-aeo-audit` 0.17.1, `agent-stack` 0.7.2, `agent-sync` 1.11.0, `sshlg-skills` 0.54.0 | verified |
| I9-07 | The run's own record is complete | `bash scripts/stage-coverage.sh` → **11/11, exit 0**, using the mechanism this run built in iteration 4 | verified |
| I9-08 | No lease left held, every repo pointed at | leases directory empty; `git submodule status` shows no `+`; every member clean and pushed. `task-pipeline`'s 18 modified files are a concurrent session's unreleased v1.55.0, untouched | verified |

## 2026-08-16 (second) — v0.61.0, the gate we ship running on us

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | CI runs `agent_sync.py check` across every repository declaring a coordination config, and refuses a run that finds fewer than two | the same loop run locally as CI would: **9 configs, all exit 0**. Its first execution found `task-pipeline` unhealthy on two counts, both fixed in v1.59.0 | verified |
| R-02 | A member changing its skill set must reword its `desc` in the same change | token-matching was tried first and **produced four false failures out of eight members**, so it is the co-edit that is checked, not the prose. Watched failing on a planted fifth skill with an untouched description | verified |
| R-03 | `B-17` and `B-52` closed by measurement rather than by assertion | `negatives.py -k "high-water mark lowered"` from the submodule checkout → PASS, where it previously reported `fatal: not a git repository`; the SHA gate watched failing on an amended-away commit | verified |
| R-04 | Every pin matches its release | `python3 test/check_pins.py` → `every pin matches its release (npm where published, git tag everywhere)` | verified |

**4 of 4 verified. 0 at `never`.**

### What the checks did not cover

- **The coordination check is now in CI and has never run there.** It ran locally over the
  same nine configs; the first CI execution is evidence this row cannot supply.
- **`B-51` is still the one human step** — the code graph needs a key on this machine, and
  `--code-only` would index ten code files while dropping the thirty-nine documents that
  are most of the pack.

## 2026-08-16 (third) — v0.62.0, the router nobody could reach by asking

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B49-1 | `sheleg-design` advertises the plain words an operator types (1.37.0) | `description` 1018/1024 chars, and every added trigger is present verbatim — `test/triggers_test.js` asserts it and was watched failing on `фигма в код` before 1.37.1 restored the phrase | verified |
| B49-2 | Fourteen bare words added to `lib/triggers.js` | `T.match()` over eight visual prompts → **8 route**; over nine controls (payment bug, landing-page copy, prod check, test, README, refactor, a question, and both opt-out phrases) → **0 route** | verified |
| B49-3 | `красиво` and `красивее` are both listed because the stemmer cannot bridge them | `stemRu('красивее')` → `красиве`, which is not a prefix of `красиво`; `сделай красиво` missed until the second form was advertised, then hit | verified |
| B49-4 | `дизайн` is excluded and the exclusion is enforced, not remembered | the refusal-clash fixture rejects any trigger inside a refusal; `'без дизайна'.includes('дизайн')` is the clash | verified |
| B49-5 | The consequence of that exclusion is recorded, not guessed | `T.match('сделай дизайн лендинга')` → `[]`, contradicting the first draft of the comment beside it; filed as B-53 | verified |
| B49-6 | Both releases green and published | `sheleg-design` v1.37.1 release + validate → success, `npm view sheleg-design-skill version` → **1.37.1**; umbrella v0.62.0 validate → success | verified |
| B49-7 | A wrong tag reached the remote and was refused by a gate this pack ships | run 31932524054: `tag v1.37.1 does not match 1.37.0`, exit 1, nothing published — `npm view … versions` showed 1.37.0 as the newest at that moment | verified |
| B49-8 | Three findings filed rather than absorbed | B-53 (composition), B-54 (the invariant enforced one repo away), B-55 (`super-ux`'s unignored `graphify-out/`) | verified |
