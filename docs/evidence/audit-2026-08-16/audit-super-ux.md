# Audit — super-ux 0.41.5 (repo HEAD 107bc38, 1 commit ahead of v0.41.5)
Read-only audit run 2026-08-16. Every number below was computed by running the command shown; nothing is restated from a document.

## F-super-ux-01 — `npx super-ux --cursor` deletes seven of the nine routers from the operator's Cursor rules file
- **Dimension:** install
- **Severity:** blocker
- **Evidence:** Observed live during the CONTRIBUTING.md smoke test (`node /tmp/.../package/bin/super-ux.js --cursor <tmpdir>`). Before the run `~/.cursor/rules/sshlg-routing.mdc` was 13743 bytes carrying 9 router blocks; after it, 3233 bytes carrying 2. `grep -o 'SSHLG:ROUTER:[a-z-]*:BEGIN'` on the backup the write itself took (`~/.sshlg-skills/backups/cursor_rules_sshlg-routing.mdc.20260816T191954Z`) → `super-ux, sheleg-design, copywriting, sheleg-dev, seo-llmo, evidence-docs, task-pipeline, make-skill, agent-sync`; the same grep on the file afterwards → `super-ux, copywriting`. The family map table and 7 router bodies were gone. **I restored the file byte-for-byte from that backup (`md5 c89df5371fc69722be84fc28f79e94ba` on both) before writing this report — it is back to its pre-audit state.** Mechanism, exact: `skills/super-ux/bin/super-ux.js:359-372` `offerRouters()` runs `npx --no-install sshlg-skills routers --member super-ux` on every install (both doors); in the umbrella, `lib/apply.js:227` builds the Cursor target with `R.upsert(EMPTY_BLOCK, opts.routers, …)` — from a **constant**, not from the file on disk — while the three markdown targets at `lib/apply.js:150-172` upsert into `onDisk` and therefore keep every other member's router (all three reported `unchanged` in the same run). Under `--member super-ux`, `opts.routers` holds only that member's two routers, so the Cursor file is rebuilt containing only those two. `applyCursor` also returns no `removed` key, so the stash loop at `bin/sshlg-skills.js:531-535` parks nothing — the only surviving copy is `lib/backup.js`'s file backup. `grep -rn 'applyCursor' test/` in the umbrella returns nothing: the whole path is untested.
- **Why it matters:** Any user who installs or re-installs super-ux on a machine that has the rest of the family loses seven routing rules from Cursor, silently — the CLI prints no warning and the next run then reports `unchanged` because the damage is already done. This is precisely the failure class the umbrella's CLAUDE.md names as its whole risk profile ("writes into a file the operator owns and did not write"), and the guard that saved it was the file backup, not the logic.
- **Fix:** In `/Users/sshlg/DATA/sshlg-skills/lib/apply.js`, make `applyCursor` read the existing `~/.cursor/rules/sshlg-routing.mdc` and upsert into it (as `applyOne` does) instead of into `EMPTY_BLOCK`, and return `removed` so removals are stashed. Add a fixture in `/Users/sshlg/DATA/sshlg-skills/test/cursor_test.js` (or a new `apply_cursor_test.js`) asserting that `--member` scope preserves foreign router blocks. Until that lands, `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/bin/super-ux.js:361-364` should not call `routers --member` on a machine that may hold other members.
- **Blast:** 3
- **Effort:** 2

## F-super-ux-02 — the family's stated gate does not exist in this repo: `npm test` exits 1 with "Missing script"
- **Dimension:** gate
- **Severity:** major
- **Evidence:** `cd skills/super-ux && npm test` → `npm error Missing script: "test"`, exit 1. `package.json` (42 lines) has **no `scripts` block at all**. Across the family: `agent-sync`, `make-skill`, `sheleg-design`, `sheleg-dev`, `task-pipeline` define `scripts.test`; `agent-stack`, `seo-aeo-audit` and `super-ux` print `<NO scripts.test>`. The umbrella's `docs/DOCMAP.md:96-99` names `npm test` as the gate, and `/Users/sshlg/DATA/sshlg-skills/hooks/repo-gate.js:78-84` denies a `git commit` whose `npm test` is red — but at `hooks/repo-gate.js:72-77` it exits 0 when nothing is staged in `CLAUDE_PROJECT_DIR`, so a commit made inside `skills/super-ux` is gated by nothing at all. super-ux has no `.claude/settings.json` of its own (`ls skills/super-ux/.claude/` → `agent-sync.json` only). The real gates all pass when run by hand: `python3 test/validate.py` → `OK (3500 checks)` exit 0; `python3 test/brand_lint_test.py` → `OK (77 checks)` exit 0; `python3 test/ux_lint_test.py` → `OK (43 checks)` exit 0; `python3 docs/ux/lint.py` → `OK — docs/ux is consistent` exit 0; `python3 docs/brand/lint.py` → `brand pack is clean` exit 0; `claude plugin validate . --strict` and `claude plugin validate ./plugins/super-ux --strict` → `✔ Validation passed`. `python3 test/release_preflight.py` → `BLOCKED: working tree is not clean` (see F-05).
- **Why it matters:** The pre-commit hook the family ships is a no-op for this member, so a red suite reaches the remote and is only caught by CI minutes later — the exact sequence `hooks/repo-gate.js:9-12` says it exists to prevent. An agent told "the gate is `npm test`" runs it here, gets exit 1, and has no way to tell a missing script from a failing suite.
- **Fix:** Add to `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/package.json` a `scripts.test` chaining the five commands CI already runs (`.github/workflows/validate.yml:26-42`): `python3 test/validate.py && python3 test/brand_lint_test.py && python3 test/ux_lint_test.py && python3 docs/ux/lint.py && python3 docs/brand/lint.py`. Then commit a `.claude/settings.json` wiring `hooks/repo-gate.js`, or state in `CLAUDE.md` that the hook does not cover this repo.
- **Blast:** 1
- **Effort:** 1

## F-super-ux-03 — CHANGELOG ships release notes for 0.41.1 and 0.41.2, which were never tagged and never published
- **Dimension:** version
- **Severity:** major
- **Evidence:** `CHANGELOG.md:145` `## 0.41.1 — 2026-08-16` and `CHANGELOG.md:91` `## 0.41.2 — 2026-08-16`, both full release sections. `git tag --sort=-v:refname | head -5` → `v0.41.5, v0.41.4, v0.41.3, v0.41.0, v0.40.0` — no `v0.41.1`, no `v0.41.2`. `npm view super-ux versions --json` → `… "0.41.0","0.41.3","0.41.4","0.41.5"` — neither is on the registry. Set difference computed in one pass: CHANGELOG headings with no git tag = `['0.25.0', '0.41.1', '0.41.2']`. `CHANGELOG.md:85-89` explains only that *0.41.3's* tag landed on the tip; it says nothing about 0.41.1 and 0.41.2 never existing as releases. `npm view super-ux version` → `0.41.5`; `package.json`, `plugins/super-ux/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the top CHANGELOG heading, the newest tag, the umbrella's `skills.json` pin and the umbrella README row all agree on 0.41.5 — the version sync itself is clean.
- **Why it matters:** `npm install super-ux@0.41.2` fails against a version the project's own changelog documents, and an operator reconciling "which version am I on" against the changelog is shown two numbers that never shipped, with nothing in the file saying so. `docs/evidence/verification.md` and the family catalogue both key off released versions.
- **Fix:** In `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/CHANGELOG.md`, either fold the 0.41.1 and 0.41.2 sections into 0.41.3 (which is the tag that actually contains their commits) or mark both headings as unreleased-and-superseded-by-0.41.3. Add a check to `test/validate.py` (or `test/release_preflight.py`) that every `## X.Y.Z` heading at or below the current version has a matching `git tag vX.Y.Z`.
- **Blast:** 2
- **Effort:** 1

## F-super-ux-04 — two CHANGELOG sections lost their version heading, so 0.30.0 and 0.30.1 are published with no readable release notes
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `grep -n '^ — ' CHANGELOG.md` → `842: — 2026-08-05` and `867: — 2026-08-05`. Both lines begin with a space and an em-dash: the `## 0.30.1` and `## 0.30.0` heading text is gone, so neither is a heading at all and both sections render as body text of the 0.30.2 section above them. That the two are 0.30.1 and 0.30.0 is fixed by their own content — `CHANGELOG.md:849` reads "Shipped in 0.30.0". Both versions are real: `git tag` contains `v0.30.0` and `v0.30.1`, and `npm view super-ux versions --json` contains both. A set difference over the file computes `npm versions with no CHANGELOG entry: [… '0.30.0', '0.30.1' …]`. `test/validate.py` checks only that headings are not *duplicated*; a heading whose version was eaten passes. `.github/workflows/release.yml:79-80` extracts the section for a tag and does `test -s /tmp/notes.md || exit 1` — with the comment at `:69-71` recording that this failure lands **after** the tag is public.
- **Why it matters:** Two published versions have no release notes anyone can find, and the same malformation on a future release would tag first and fail the release job second, leaving a tag that looks delivered while nothing shipped — the exact scenario `release.yml:69-71` documents.
- **Fix:** Restore `## 0.30.1 — 2026-08-05` at `CHANGELOG.md:842` and `## 0.30.0 — 2026-08-05` at `CHANGELOG.md:867`. Add a check in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/test/validate.py` that every line matching `^ *— \d{4}-\d{2}-\d{2}$` is a failure, and that every `git tag` at or below the current version has a matching heading.
- **Blast:** 2
- **Effort:** 1

## F-super-ux-05 — the committed graph is 35 commits stale while a fresh one sits uncommitted, permanently dirtying the tree and blocking the release preflight
- **Dimension:** graph
- **Severity:** major
- **Evidence:** `graphify-out/manifest.json` carries no commit field (120 keys, all per-file mtime/hash), but `graph.json` does: `built_at_commit` in the **committed** blob is `b606989c23c…` — `git show -s b606989` → `2026-08-10 feat(lint): the UX linter gets codes, fixtures and a coverage gate` — and `git rev-list --count b606989..HEAD` → **35**. The repo has shipped 19 tags since (`v0.34.0 … v0.41.5`). `git ls-files graphify-out/` → `GRAPH_REPORT.md`, `graph.json`, `manifest.json` — **tracked**, and `git check-ignore -v` on all three returns nothing, so nothing ignores them. Meanwhile the working tree holds a *newer* graph nobody committed: `built_at_commit` in `graphify-out/graph.json` on disk is `8f924db` (1 commit behind HEAD), 1036 nodes against the committed 1206, and `git status --porcelain` → ` M graphify-out/graph.json` / ` M graphify-out/manifest.json`. That dirt is what makes `python3 test/release_preflight.py` print `BLOCKED: working tree is not clean: M graphify-out/graph.json / M graphify-out/manifest.json` — the tag gate is red for a reason that has nothing to do with the code. The tracked `GRAPH_REPORT.md` still describes the 1206-node build, so the tracked report and the on-disk graph disagree by 170 nodes. `.gitignore:15-19` records that a dated run directory was ignored precisely because "`git status` in the umbrella read this submodule dirty permanently"; the same false positive is back through the two files the fix left tracked.
- **Why it matters:** The `graphify` skill treats `graphify-out/` as a query source, so an agent asking this repo a structural question is answered from a tree 35 commits and 12 releases old. And every local graph run re-dirties the repo, so `release_preflight.py` refuses to let anyone tag until someone commits a 1.4 MB generated blob — which trains the operator to bypass the preflight.
- **Fix:** Decide one way in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/.gitignore`: either commit the refreshed `graphify-out/graph.json`, `manifest.json` and a regenerated `GRAPH_REPORT.md` in the same change and add a staleness gate to `test/validate.py` (the umbrella already has `test/graph_staleness.py`), or ignore all three and stop tracking them. Update the open board row `docs/evidence/backlog.md:16` (B-022), whose sentence "`graph.json` was left byte-identical, which `git status` confirms" is now false.
- **Blast:** 1
- **Effort:** 2

## F-super-ux-06 — the only always-on Cursor rule describes a four-workflow system; the plugin ships seven skills
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `cursor/rules/super-ux.mdc` is the sole `alwaysApply: true` rule (`grep -m1 alwaysApply cursor/rules/*.mdc` → true for `super-ux.mdc`, false for the other seven). `cursor/rules/super-ux.mdc:39-41` reads `- Workflows: \`ux-foundation\` rule (WHY), \`ux-flows\` rule (flows + Figma mockups + style pack), \`ux-scenarios\` rule (scenario base), \`ux-audit\` rule (evidence-backed audits).` and `:30` describes the chain as `foundation → flows → screens → scenarios`. `grep -c 'vision\|brand-voice\|copywriting' cursor/rules/super-ux.mdc` → 0 for each of the three. The plugin ships seven skills (`ls plugins/super-ux/skills/` minus `references`), and `plugin.json`, `marketplace.json`, `README.md:36` and `CLAUDE.md:99-103` all put `vision` at the top of the chain. Self-filed as the board's highest-priority open row (`docs/evidence/backlog.md:22`, B-013, `3×3×3 = 27`, sourced "audit 2026-08-10") and still live 13 releases later. `test/validate.py` cannot catch it: `validate_cursor_rules()` at `test/validate.py:264` reads front-matter only, which `docs/evidence/backlog.md:23` (B-014) records.
- **Why it matters:** A Cursor user gets the always-on rule and three agent-requested rules (`vision.mdc`, `brand-voice.mdc`, `copywriting.mdc`) that nothing in the always-on text points at, plus a chain description missing its top layer. On that channel the three newest skills are effectively unshipped.
- **Fix:** Update `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/cursor/rules/super-ux.mdc:30` and `:39-41` to the seven-skill chain, and add a body check to `validate_cursor_rules()` in `test/validate.py` asserting the always-on rule names every skill — the same shape `validate_skill_parity()` already uses for `commands/ux.md`.
- **Blast:** 3
- **Effort:** 1

## F-super-ux-07 — three documents state three different counts for the same "a skill exists in N places" rule, and none equals the six it enumerates
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `CONTRIBUTING.md:100` — "a skill exists in **five** places or it does not exist: its directory, `cursor/rules/<name>.mdc`, the system map's skill list, both manifest descriptions, and `commands/ux.md`". `CLAUDE.md:47` — "A skill exists in **seven** places" followed by the identical list. `test/validate.py:533` docstring — "A skill exists in **seven** places". The list enumerates six items (directory, `.mdc`, system map, plugin.json description, marketplace.json description, `commands/ux.md`), and `validate_skill_parity()` at `test/validate.py:556-573` asserts exactly five of them per skill (the directory is the loop variable). Separately, `CONTRIBUTING.md:12` labels the skills directory "the **four** agent skills" — seven ship. `validate_stated_numbers()` at `test/validate.py:522` matches `\b(one|…|ten) skills\b`, which "four agent skills" evades because "agent" sits between the number and the noun; `CLAUDE.md` is not in `_prose_files()` at all (`test/validate.py:456`).
- **Why it matters:** This repo's own canon is "one owner per fact" (`CONTRIBUTING.md:59`) and "a figure nobody can recompute is a claim" (`test/validate.py:477`). A contributor adding a skill reads whichever of the three they open and adds it to the wrong number of places.
- **Fix:** Settle on six in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/CONTRIBUTING.md:100`, `CLAUDE.md:47` and `test/validate.py:533`; correct `CONTRIBUTING.md:12` to seven; and widen the regex at `test/validate.py:522` to `\b(one|…|ten) (?:agent )?skills\b` so the phrasing that slipped through is covered.
- **Blast:** 1
- **Effort:** 1

## F-super-ux-08 — GRAPH_REPORT.md's staleness banner states a commit count that was wrong when written and is now 4× off
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `graphify-out/GRAPH_REPORT.md:6` — "**Eight** commits have landed since it was built." The banner was introduced in one commit: `git log -S'Eight commits have landed' -- graphify-out/GRAPH_REPORT.md` → `efb7fc7` (2026-08-14, the only hit). The graph's own `built_at_commit` is `b606989`; `git rev-list --count b606989..efb7fc7` → **23** at the moment the sentence was written, and `git rev-list --count b606989..HEAD` → **35** today. The banner's other two numbers still hold: it says the catalog is 215, and `grep -c '^#### BP-[0-9]' plugins/super-ux/skills/references/best-practices.md` → 215; it says `funnel-research nodes: 0`, and `grep -c funnel-research graphify-out/graph.json` → 0.
- **Why it matters:** The banner exists to make a stale artifact honest — "a stale graph is a false premise carrying the authority of a machine" (`GRAPH_REPORT.md:21-22`). A reader who trusts "eight" treats the graph as nearly current when it is 35 commits and 12 releases behind, which is the belief the banner was written to prevent.
- **Fix:** In `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/graphify-out/GRAPH_REPORT.md:6`, replace the literal with the computed count, or drop the sentence and let a staleness check own it — the umbrella already ships `test/graph_staleness.py`, which computes `built_at_commit..HEAD`.
- **Blast:** 1
- **Effort:** 1

## F-super-ux-09 — the installer's routers step contradicts SCN-012, and its output is covered by no screen row
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `docs/ux/scenarios.md:148-156` (SCN-012, `Status: implemented`) states: "When the launcher is unavailable, both print the same one-line command, in English, **matching the rest of the CLI**." Observed on the first smoke run, where `sshlg-skills` was not in the npx cache: the CLI emitted the child's raw npm output before its own line — `npm error npx canceled due to missing packages and no YES option: ["sshlg-skills@0.78.0"]` and `npm error A complete log of this run can be found in: /Users/sshlg/.npm/_logs/2026-08-16T19_18_54_511Z-debug-0.log` — then the intended fallback text. Cause: `bin/super-ux.js:364` passes `stdio: 'inherit'`, so the child's stderr reaches the terminal on the very path the doc-comment at `bin/super-ux.js:356-357` calls the graceful one. Not reproducible on the second run in the same session (the launcher had entered the npx cache by then), but it is the first-run state of any new user. Separately, `docs/ux/screens.md:15-21` lists seven `SCR-` rows whose coverage ranges are `bin/super-ux.js:27-44, 51-135, 143-147, 149-166, 223-284, 286-294, 322-326` — none covers `offerRouters()` at `bin/super-ux.js:359-373`, and SCN-012's `Traces:` line names no `SCR-`.
- **Why it matters:** A user reading two `npm error` lines during an install reasonably concludes it failed. This is the plugin that requires every user-facing output to have a screen record, applied to its own CLI — `CLAUDE.md:5-9` says the installer "is bound by its own rules".
- **Fix:** In `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/bin/super-ux.js:361-365` capture the child's output (`stdio: 'pipe'`) and print it only on success; add an `SCR-` row for the routers offer to `docs/ux/screens.md` and reference it from SCN-012 in `docs/ux/scenarios.md:149`.
- **Blast:** 3
- **Effort:** 1

## F-super-ux-10 — the umbrella's catalogue description for super-ux states a check count two behind the linter
- **Dimension:** version
- **Severity:** minor
- **Evidence:** `/Users/sshlg/DATA/sshlg-skills/skills.json:33` — `"… a string registry and a 35-check copy linter."` The linter emits 37: `python3 -c` over `plugins/super-ux/scripts/brand_lint.py` counting `"(B\d{3})"` → `n= 37 min B001 max B073`. super-ux's own documents are correct and gated — `README.md:132` "37 deterministic checks (`B001`..`B073`)" and `plugins/super-ux/skills/references/system-map.md:66` "37 deterministic checks (B001..B073)", both recomputed by `validate_stated_numbers()` at `test/validate.py:504-507`. The umbrella's `desc` is printed to operators by `bin/sshlg-skills.js:311` (`sshlg-skills list`), and the umbrella's only gate on it, `check_desc_moves_with_skills()` at `test/validate.py:824`, fires on a changed skill set and never recomputes a number.
- **Why it matters:** `sshlg-skills list` is the family's catalogue, and it serves a number the member's own gate proved wrong two releases ago. The member cannot see the file, so nothing on either side will notice.
- **Fix:** Correct `/Users/sshlg/DATA/sshlg-skills/skills.json:33` to 37, and extend `check_desc_moves_with_skills()` in `/Users/sshlg/DATA/sshlg-skills/test/validate.py` (or add a sibling) to recompute any `\d+-check` figure a `desc` states against the member's linter.
- **Blast:** 2
- **Effort:** 1

## F-super-ux-11 — the board reuses three ids, so a citation into it resolves to two different rows
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** Computed over `docs/evidence/backlog.md`: `duplicate ids: {'B-011': 2, 'B-012': 2, 'B-013': 2}` from 25 rows / 22 unique. Lines 23, 24, 25 are in the open table; lines 39, 40, 41 are under `## Closed`, and the pairs carry unrelated content (open `B-013` is the Cursor umbrella row; closed `B-013` is the check-count ratchet). Self-filed as `docs/evidence/backlog.md:11` (B-016) and still open. A second citation defect rides on it: `docs/evidence/backlog.md:24` (B-020) records that `verification.md` files the `AT-` coverage gap as `B-016` while the board files it as `B-017`. Nothing checks id uniqueness — `grep 'backlog' test/validate.py` returns no check.
- **Why it matters:** `docs/evidence/backlog.md:3-4` says stage 0 reads the board and quotes the open count and stage 10 files rows here by id. "Closed in B-013" resolves to two rows, so the register cannot be cited, which is the one thing a register is for.
- **Fix:** Renumber the three open rows in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/docs/evidence/backlog.md` to free ids, then add an id-uniqueness check to `test/validate.py` — in that order, so the renumbering is verified by the thing that keeps it true (the order B-016 itself prescribes).
- **Blast:** 1
- **Effort:** 1

## F-super-ux-12 — the documented gate lists omit a suite CI runs, and the layout block omits three test files
- **Dimension:** gate
- **Severity:** minor
- **Evidence:** `CLAUDE.md:28-34` lists five gates: `test/validate.py`, `test/brand_lint_test.py`, `docs/ux/lint.py`, `docs/brand/lint.py`, `test/release_preflight.py`. `test/ux_lint_test.py` is absent, yet `.github/workflows/validate.yml:30-31` runs it as a required step ("UX linter fixtures") and `test/floors.json:5` carries its ratchet. `CONTRIBUTING.md:36-42` ("The loop") lists only `test/sync_references.py` and `test/validate.py`, and `CONTRIBUTING.md:44` says "`validate.py` is the gate CI runs on every push and PR" while the workflow runs six steps. The repo-layout block at `CONTRIBUTING.md:24-26` names three files in `test/`; the directory holds six plus `floors.json` (`ls test/` → `brand_lint_test.py, floors.json, release_preflight.py, sync_references.py, ux_lint_test.py, validate.py`).
- **Why it matters:** An agent following `CLAUDE.md`'s "Gates" section runs four suites and believes it is green, then CI fails on the fifth. The instruction that says "Run each **alone** and read its own exit code" is undermined by not listing all of them.
- **Fix:** Add `python3 test/ux_lint_test.py` to the gate block in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/CLAUDE.md:28-34`; update `CONTRIBUTING.md:24-26` and `:44` to match `.github/workflows/validate.yml`. Better: define `scripts.test` (F-02) and let both documents name one command.
- **Blast:** 1
- **Effort:** 1

## F-super-ux-13 — the brand-linter ratchet floor is 15 checks below the current count, so a deletion of that size passes silently
- **Dimension:** gate
- **Severity:** minor
- **Evidence:** `test/floors.json:6` sets `"brand_lint_test.py": 62`; the suite reports `OK (77 checks)`. The other two floors are current: `"validate.py": 3500` against `OK (3500 checks)`, `"ux_lint_test.py": 43` against `OK (43 checks)`. `test/floors.json:3` records `"_measured_on": "feat/web-funnel-mechanics, 2026-08-14"`, and `:2` states the mechanism's purpose — "a gate whose check count can fall silently cannot detect a deleted requirement. Raise freely."
- **Why it matters:** The ratchet exists to catch a silently removed requirement. With 15 checks of slack, up to 15 brand-lint fixtures can be deleted and `check_floor()` will still pass — the exact class the file was ported to close.
- **Fix:** Raise `"brand_lint_test.py"` to 77 in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/test/floors.json` and refresh `_measured_on`. Consider having `check_floor()` in `test/validate.py` warn when actual exceeds floor by more than a small margin, so the file cannot drift again unnoticed.
- **Blast:** 1
- **Effort:** 1

## F-super-ux-14 — 1.4 MB of generated graph data is committed and ships in the plugin marketplace clone; super-ux is the only member of nine that does this
- **Dimension:** graph
- **Severity:** minor
- **Evidence:** `git cat-file -s $(git rev-parse HEAD:graphify-out/graph.json)` → **1479160** bytes, tracked. Across the family, `git ls-files graphify-out/` returns 3 for `super-ux` and **0** for `agent-stack`, `agent-sync`, `make-skill`, `seo-aeo-audit`, `sheleg-design`, `sheleg-dev`, `task-pipeline` and the umbrella — all eight have the directory on disk and none tracks it. `.gitignore:6-10` records the choice as deliberate ("the next harvest queries the first two"). The npm channel is clean: `npm pack --dry-run --json` → 32 files, 290980 bytes unpacked, and `[n for n in names if 'graphify' in n]` → `[]`, because `package.json:8-18` `files[]` does not list it. The **plugin** channel is not: `ls -la ~/.claude/plugins/marketplaces/super-ux/graphify-out/` shows `graph.json` at 1479160 bytes plus `GRAPH_REPORT.md`, and `du -sh` on that clone → 6.0M (1.5M of it `.git`). The installed plugin payload itself is clean — no `graphify-out` under `~/.claude/plugins/cache/super-ux/super-ux/0.41.5/`, because `marketplace.json` sources `./plugins/super-ux`.
- **Why it matters:** Every machine that adds the `super-ux` marketplace clones a 1.4 MB generated blob that no consumer reads, and its history grows by roughly that much per refresh. Combined with F-05, the artifact is both large and 35 commits wrong, so the cost buys a stale answer.
- **Fix:** Either keep the choice and say so in `README.md` alongside a staleness gate (see F-05), or move the graph out of the marketplace-cloned tree — e.g. under `plugins/super-ux/` only if consumers need it, or a release asset. The decision belongs in `/Users/sshlg/DATA/sshlg-skills/skills/super-ux/.gitignore:6-10`, where the current rationale lives.
- **Blast:** 2
- **Effort:** 2

## F-super-ux-15 — `ux-flows` has 626 tokens of body budget left, the tightest of the seven; the next contract addition to it will breach
- **Dimension:** budget
- **Severity:** minor
- **Evidence:** All seven skills are clean at 0 GAP per the family auditor; headroom recomputed here with the same constants (`audit_skill.py:32-39`: `DESC_MAX 1024`, house `DESC_TARGET 970`, `BODY_MAX_LINES 500`, `BODY_MAX_TOKENS 5000`, `CHARS_PER_TOKEN 3.9`), body measured after front-matter:

```
skill            lines lines left   ~tok tok left  desc chars  desc left(970)
brand-voice        119        381   1307     3693         575             395
copywriting         94        406   1086     3914         579             391
ux-audit           261        239   3834     1166         332             638
ux-flows           287        213   4374      626         592             378
ux-foundation      147        353   1913     3087         401             569
ux-scenarios       168        332   2074     2926         418             552
vision             160        340   1821     3179         629             341
```

  Against the 1024 spec cap the description headroom is 449 / 445 / 692 / 432 / 623 / 606 / 395 chars respectively. `ux-flows` is at 87.5% of the token budget and 57.4% of the line budget; `ux-audit` is second at 76.7%.
- **Why it matters:** `ux-flows` is the skill the family's trigger table routes 18 of its 29 super-ux phrases to, so it is the one most likely to grow. At 626 tokens left, roughly 2400 characters of new contract text puts it over the level-2 budget and the family auditor turns red.
- **Fix:** No change needed today. When `plugins/super-ux/skills/ux-flows/SKILL.md` next grows, move detail into `plugins/super-ux/skills/references/` rather than the body — `test/sync_references.py` already ships the transitive closure, so a reference costs the body nothing.
- **Blast:** 1
- **Effort:** 1

TOTAL: 15 findings (1 blocker, 5 major, 9 minor)
