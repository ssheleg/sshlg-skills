# Audit — sshlg-skills (umbrella), working tree at v0.79.0 uncommitted, HEAD 466a364
Read-only. Every claim below was produced by running the named command in this checkout on 2026-08-16.

## F-umbrella-01 — `routers` writes the migrated `~/.claude/CLAUDE.md` before any backup, so a refused write still destroys the file and reports "Файл не изменён"
- **Dimension:** safety
- **Severity:** blocker
- **Evidence:** `bin/sshlg-skills.js:493` — `fs.writeFileSync(file, moved.text, 'utf8')` inside the `for (const t of apply.TARGETS)` loop (lines 486–496). It is the only write to a protected file in the repo that is not preceded by `apply.protect()`; `grep -rn 'protect(' lib/ bin/ hooks/` returns exactly three call sites (`lib/apply.js:64,166,243`) plus two in `bin/sshlg-skills.js:766,808` — none of them covers line 493. Reproduced against a scratch HOME with the backup directory made unwritable (`chmod 500 $H/.sshlg-skills/backups`):

  ```
  BEFORE sha=5f11d431d1de9609d1817438709c6b0b7b6e83dfee03b023eb5824c670d13551
  routers: …/.claude/CLAUDE.md — backup-failed
  routers: …/.claude/CLAUDE.md — НЕ записан: не удалось сделать резервную копию
           (EACCES: permission denied, open '…/backups/claude_CLAUDE.md.20260816T191931Z'). Файл не изменён.
  AFTER  sha=a97a1396de164dccf1e9b10312542fcc73afe706b79be21be8a07667c6076c6f
  RESULT: file CHANGED despite backup failure
  --- backups dir contents ---   (empty)
  ```

  The file went from four sections to `# Мои правила\n\nПроза сверху.` — the whole hand-written routing section was deleted with no copy anywhere on disk, while the run printed *the file was not changed*. The `PreToolUse` hook is no mitigation: `node -e "require('./lib/guard.js').decide({tool_name:'Bash',tool_input:{command:'npx sshlg-skills routers'}}, '/Users/sshlg')"` → `null (NO BACKUP TAKEN)`, because `lib/guard.js` matches only payloads that name the path (`echo x > ~/.claude/CLAUDE.md` → matched).
- **Why it matters:** this is the exact defect `lib/backup.js` and `protect()` were built for after `~/.claude/CLAUDE.md` was destroyed twice (B-05). `CLAUDE.md:75-76` and `docs/DOCMAP.md:84` both assert "there is no second write path"; there is one, it has been there since migration was added, and it fails in the one direction that costs the operator an unrecoverable file — and lies about it in the same breath.
- **Fix:** route line 493 through `apply.protect(file, {home, backupDir, stamp, keep})` and abort the whole target on `backup-failed` (return the record, do not fall through into `apply.apply`); add `test/apply_test.js` (or extend `test/cli_config_test.js`) with a fixture that makes the backup directory unwritable, runs the real `routers` command, and asserts the operator file is byte-identical afterwards — the class of fixture `test/hooks_e2e_test.js:78` already has for the hook path and nothing has for the CLI path.
- **Blast:** 2
- **Effort:** 1

## F-umbrella-02 — v0.79.0 is a half-release: version bumped and CHANGELOG written, nothing committed, no tag, no ledger row, no run stamp
- **Dimension:** version
- **Severity:** major
- **Evidence:** `package.json:3` → `"version": "0.79.0"`; `CHANGELOG.md:3` → `## v0.79.0 — the graphs are current…`. `git status --short` shows 14 modified paths, all unstaged/uncommitted. `git tag --list 'v0.79*'` → empty. `grep -rn '0\.79' README.md docs/ CLAUDE.md` → **no matches**: `docs/evidence/verification.md`'s last section is `## 2026-08-16 (eighteenth) — v0.78.0` (line 671) and `docs/evidence/retro.md`'s last run stamp is `| 2026-08-16 (twentieth) | … v0.78.0 | c8167df…e062180 |` (line 274). `docs/evidence/backlog.md` closes B-51 only in the working tree (`git diff docs/evidence/backlog.md` is one changed line). The eight submodule pointers moved (`git diff -- skills/`) but the CHANGELOG section names no pin move, unlike v0.78.0 which ends with `**Pins: sheleg-design 1.37.4 → 1.37.5, super-ux 0.41.4 → 0.41.5.**`.
- **Why it matters:** the release workflow is tag-driven and gates on `package.json` matching the tag (`.github/workflows/release.yml:57-63`); nothing here can be released until it is committed. Meanwhile the tree advertises 0.79.0 to anything that reads `package.json`, and the two evidence ledgers this repo's doctrine treats as the record of what shipped have no row for it — so if the session ends here, v0.79.0's work is undocumented in the two files designed to survive it.
- **Fix:** to close it — commit the 14 paths (with `skills/super-ux` resolved first, see F-04), add a `## 2026-08-16 (nineteenth) — v0.79.0` section to `docs/evidence/verification.md`, add the run stamp row and prune note to `docs/evidence/retro.md`, name the eight pointer moves in `CHANGELOG.md`'s v0.79.0 section, then `git tag v0.79.0` and push.
- **Blast:** 2
- **Effort:** 1

## F-umbrella-03 — the v0.79.0 notes and B-51's close both claim "every one now sits at HEAD"; the repo's own gate reports eight of nine one commit behind
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `CHANGELOG.md:5-7` — *"All nine, with semantic extraction: every one now sits **at HEAD**"*; `docs/evidence/backlog.md:106` (B-51 close) — *"every one now **at HEAD**"*. `python3 test/validate.py` in this checkout prints, for all eight members:

  ```
  unlooked: super-ux: graph is 1 commit behind HEAD (built at 8f924dbb) — stage 0 queries it for reach…
  unlooked: task-pipeline: graph is 1 commit behind HEAD (built at ccd03a40) — …
  … (agent-sync 45a3ffd1, make-skill 5e5d1fd4, sheleg-design de09f9e1,
      seo-aeo-audit 2b02f428, sheleg-dev 7fa46a6f, agent-stack ece85b50)
  ```

  Confirmed independently: for each member, `built_at_commit` equals the pre-`.gitignore` commit and `git rev-list --count $built..HEAD` = 1. Only the umbrella's own graph is at HEAD (`built_at_commit: 466a364d…` = `git rev-parse HEAD`, behind = 0) — and only because `graphify-out/` is in the umbrella's `.gitignore:4`, so committing it does not advance HEAD. Every member that commits its `graphify-out` structurally cannot read "at HEAD" once the rebuild is committed.
- **Why it matters:** the release note and the closed board row are the two documents a future run reads to decide whether the graphs need rebuilding, and both state the opposite of what `npm test` prints in the same tree. B-60 was closed one cycle ago precisely for board rows whose facts have expired; this one shipped expired.
- **Fix:** reword `CHANGELOG.md:5-7` and `docs/evidence/backlog.md:106` to the measured state ("every graph rebuilt at the commit preceding its own graph commit; the umbrella reads at HEAD, the eight members read one behind by construction"), or make the disclosure in `test/graph_staleness.py` treat "behind only by the commit that carries the graph" as `current`.
- **Blast:** 2
- **Effort:** 1

## F-umbrella-04 — `super-ux`'s rebuilt graph is uncommitted, so the pinned commit still carries the old graph and the totals quoted in the release were computed from a state no clone reproduces
- **Dimension:** graph
- **Severity:** major
- **Evidence:** `git submodule status` prints `+107bc38f42e4d02beafeacfcd0fb5ed1903e19be-dirty skills/super-ux`. `git -C skills/super-ux status --short` → `M graphify-out/graph.json`, `M graphify-out/manifest.json` (`git diff --stat`: 19882 insertions, 26897 deletions). Committed vs working tree in that submodule:

  ```
  HEAD     nodes=1206 links=2181 built_at=b606989c
  WORKTREE nodes=1036 links=1632 built_at=8f924dbb
  ```

  `super-ux` deliberately tracks `graphify-out` (B-03, B-55), so this is not gitignored churn — the rebuild exists only on this disk. Summing the nine `graph.json` files on disk gives **10140 nodes, 11894 links**; `docs/evidence/backlog.md:106` and `CHANGELOG.md` claim **10,140 nodes and 11,884 edges** — the node total matches only because it was computed over the uncommitted file, and the link total is wrong by 10 either way. `test/validate.py:1090` reads `graphify-out/graph.json` off disk rather than through git, so the umbrella's gate is also reporting `super-ux`'s staleness from bytes no clone has — retro standing instruction #10 verbatim.
- **Why it matters:** committing the umbrella's pin at `107bc38` publishes a hub commit whose `super-ux` submodule serves the *old* graph, while every document in this release says the graph was rebuilt. A `git checkout` or `git submodule update` in `skills/super-ux` silently discards the rebuild.
- **Fix:** commit `graphify-out/graph.json` + `manifest.json` in `skills/super-ux`, move the umbrella pin to that commit, then recount the node/link totals and correct `docs/evidence/backlog.md:106` and the `CHANGELOG.md` v0.79.0 section.
- **Blast:** 2
- **Effort:** 1

## F-umbrella-05 — the DOCMAP ratchet says 24 suites / 469 fixtures; `npm test` counts 26 node suites (31 total) and 542 fixtures
- **Dimension:** gate
- **Severity:** major
- **Evidence:** `docs/DOCMAP.md:129` — *"**Ratchets.** 24 suites, 469 fixtures, 8 pinned members."* Counted by running the command the same line says to count with: `npm test` ends `PASS: 32 checks green (validate.py + 5 python + 26 node suites)`; summing every `OK (N checks)` / `PASS: … N cases` line gives **542 fixtures** (node 502 across 26 suites, python 40 across 5). `ls test/*_test.js | wc -l` → 26; `ls test/*_test.py | wc -l` → 5. Whichever definition the line uses (26 vs 24 node suites, or 31 vs 24 total), neither number reproduces.
- **Why it matters:** the ratchet exists so a change that lowers coverage is caught. A ratchet 73 fixtures below the true count cannot detect the loss of two whole suites, and `docs/DOCMAP.md:131-132` explicitly says the numbers are *"counted by running `npm test`, not carried across from the previous edit of this file"* — this is the failure that rule was written against, in the file that carries the rule.
- **Fix:** update `docs/DOCMAP.md:129` and its history sentence at :133 with the counted values, and add the count to the release checklist alongside the pin sweep.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-06 — `lib/apply.js`, the only module allowed to write to the operator's files, has no `test/*_test.js` of its own
- **Dimension:** gate
- **Severity:** major
- **Evidence:** `ls lib/*.js` → 26 modules; `ls test/*_test.js` → 26 suites. Diffing the two name sets, three modules have no matching suite: **`lib/apply.js`**, `lib/turnstate.js`, `lib/routers-registry.js`. `grep -rn 'backup-failed' test/` returns **zero hits** — no fixture anywhere asserts that a failed backup cancels a write from the CLI path. The one assertion of that invariant, `test/hooks_e2e_test.js:78` *"a write whose copy cannot be taken is DENIED, and the file is untouched"*, exercises `hooks/pre-tool-use.js`, not `lib/apply.js` or `bin/sshlg-skills.js`. (`lib/turnstate.js` is exercised indirectly by `test/routegate_test.js:92-114`; `lib/routers-registry.js` by `test/router_texts_test.js`. `lib/apply.js` is exercised only end-to-end through `test/cli_config_test.js`, which never makes a backup fail.)
- **Why it matters:** this is exactly the gap F-umbrella-01 lived in. `CLAUDE.md:72-78` names `protect()` in `lib/apply.js` as the mechanism, and the module holding it is one of three with no direct suite and the only one whose failure mode is an unrecoverable file.
- **Fix:** add `test/apply_test.js` covering `protect()` refusing without `home`, `applyOne` returning `backup-failed` without writing, `writeOptOut` on a failed backup, and `applyCursor`'s `foreign-file` path; add a `turnstate_test.js` for the pruning/path-escape logic currently only reachable through `routegate_test.js`.
- **Blast:** 1
- **Effort:** 2

## F-umbrella-07 — "the suite costs 3.3 s" is stated in four places; `npm test` measures 19.6–30.5 s, and `advertised_plants.py` measures 106 s against its stated 21 s
- **Dimension:** docs
- **Severity:** major
- **Evidence:** the claim appears at `README.md:338` (*"the suite costs **3.3 s** here"*), `hooks/repo-gate.js:17` (*"`npm test` costs 3.3 s here"*), `test/advertised_plants.py:20-22` (*"costs ~21 s; `npm test` … costs about three seconds"*) and `docs/evidence/backlog.md:109` (*"21 s against a per-commit gate whose honesty is 3.3 s"*). Measured in this checkout:

  ```
  $ for i in 1 2; do /usr/bin/time -p npm test >/dev/null; done
  real 30.53
  real 19.56

  $ time python3 test/advertised_plants.py
  PASS: advertised plants — 7 member(s) refuse a dropped trigger in their own gate
  python3 test/advertised_plants.py  30.69s user 12.44s system 40% cpu 1:46.33 total
  ```
- **Why it matters:** the whole justification for wiring `npm test` synchronously into a `PreToolUse` hook is that number — `hooks/repo-gate.js:18-19` says *"A synchronous gate at three minutes is a gate people route around, and this file would then be teaching the habit it exists to prevent."* At 20–30 s the argument still holds but is no longer the argument that was made, and the same stale figure is the stated reason `advertised_plants.py` sits outside `npm test` (its own cost is 5× what it claims). Four copies of one number, none of them recomputed.
- **Fix:** recompute once and update `README.md:338`, `hooks/repo-gate.js:17-19`, `test/advertised_plants.py:20-22`; leave `docs/evidence/backlog.md:109` alone (it is a closed row narrating what was true then) or annotate it in place.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-08 — the board's own open count says "Open: 4" and names two rows that are closed; a second, contradicting "Open: 8" sits three lines below it
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `docs/evidence/backlog.md:119-121` — *"**Open: 4** — B-07 and B-08 (both waived deliberately) plus B-17 and B-18. … Counted by reading the Status column of the table above, not carried across from the previous edit of this file."* and `:123` — *"**Open: 8.**"* Neither is marked superseded. Parsing the table (`| B-\d+ |` rows, 62 of them, ids unique) gives **one** open row: B-29. `docs/evidence/backlog.md:74` shows B-17 `closed 2026-08-16`; `:75` shows B-18 `closed 2026-08-14`; B-07 and B-08 are `waived`, which the file's own header at `:35-36` defines as **not counted open**.
- **Why it matters:** the two summary lines are the only place a reader gets a count without parsing 62 rows, they contradict each other, and the higher one asserts it was counted. The doctrine at `:20-25` and the `evidence-docs` router both name restated counts as the failure mode; this is one, in the file the family seeds into every host project.
- **Fix:** replace `docs/evidence/backlog.md:119-128` with a single counted line (`**Open: 1** — B-29; B-07 and B-08 waived`), or mark the historical paragraphs `*(superseded — …)*` the way `docs/evidence/retro.md` marks its old prune notes.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-09 — the verification ledger's preamble still says 322 rows / 295 verified after two releases added 15 rows and removed none
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `docs/evidence/verification.md:10-11` — *"Of the **322** rows below, **295** read `verified`"* — and the same 322 restated at `:21`. `git log -S'322' -- docs/evidence/verification.md` shows the number was written at `5302a8b` (v0.76.0). Since then, definition-independently:

  ```
  $ git diff 5302a8b..HEAD -- docs/evidence/verification.md | grep -c '^+|'   # 19
  $ …| grep '^+|' | grep -cE '^\+\| *(REQ|---|:?-)'                          # 4  (headers/separators)
  $ …| grep -c '^-|'                                                          # 0  (nothing removed)
  ```

  15 data rows added, 0 removed → the true figure is 337 rows, not 322, and the v0.79.0 section is not written yet (F-02), so it will grow again.
- **Why it matters:** these two numbers are the ledger's own statement of its exposure — the thing B-62 was closed to make honest one cycle ago — and they went stale the moment the next release landed. Nothing recomputes them.
- **Fix:** recompute both figures in `docs/evidence/verification.md:10-11,21` when the v0.79.0 section is added, and add the recount to the same release step that recounts the DOCMAP ratchet (F-05).
- **Blast:** 1
- **Effort:** 1

## F-umbrella-10 — "the first six members have their own CLAUDE.md house rules" is false: three of eight members have one
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `docs/DOCMAP.md:35-38` — *"The first six members have their own `CLAUDE.md` house rules; the two added on 2026-08-06 (`sheleg-dev`, `agent-stack`) carry a validator and CI but no house rules yet."* Measured with `git ls-files` inside each submodule (committed state, not the working tree):

  ```
  agent-stack      <none>      agent-sync    <none>      make-skill    <none>
  seo-aeo-audit    CLAUDE.md   sheleg-design <none>      sheleg-dev    <none>
  super-ux         CLAUDE.md   task-pipeline CLAUDE.md
  ```

  Widening the search to `AGENTS.md` and `GEMINI.md` finds nothing extra. So `agent-sync`, `make-skill` and `sheleg-design` — three of the "first six" — have no house rules, and the two named as the exception are not the only exceptions. The same claim is restated at `docs/evidence/backlog.md:131` (*"the thing every member already had"*).
- **Why it matters:** `docs/DOCMAP.md` is the file the repo points at for "where settled things live"; a reader planning a member change is told house rules exist in five repositories where they do not. Whichever half is wrong — the sentence or the three missing files — nothing in the gate can tell.
- **Fix:** either correct `docs/DOCMAP.md:35-38` to the measured 3-of-8, or add the missing `CLAUDE.md` files; annotate `docs/evidence/backlog.md:131` as historical. Cheap mechanical check: a validator guard asserting the sentence's count equals `sum(os.path.isfile(dir/'CLAUDE.md'))`.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-11 — three of the nine hooks are excluded from the fail-silent fixture that CLAUDE.md says asserts the invariant
- **Dimension:** hooks
- **Severity:** minor
- **Evidence:** all nine scripts in `hooks/` are wired — seven plus `statusline` through `lib/hooks.js:43-57` + `:95`, and `repo-gate.js` through the committed `.claude/settings.json` (both `PreToolUse` on `Bash` and `PostToolUse` on `Edit|Write`) — and all nine exist and carry a top-level `try { … } catch (e) { /* silence */ } process.exit(0)`. They are invoked as `node "<path>"`, so the `rw-r--r--` mode is not a defect. But `test/hooks_e2e_test.js:142-149`, the loop that asserts *"a malformed payload is silence and exit 0, never a broken turn"*, iterates exactly six: `pre-tool-use.js, post-tool-use.js, notification.js, config-change.js, file-changed.js, session-start.js`. **`statusline.js`, `user-prompt-submit.js` and `repo-gate.js` are not in it.** No live failure: driven by hand, all three exit 0 on `not json at all` and on closed stdin (`statusline` still prints its ledger line, `user-prompt-submit` and `repo-gate` print nothing). Refusals do name remedies — `hooks/pre-tool-use.js:99-103` gives the launcher command, `:127-131` names `~/.sshlg-skills/backups`, `hooks/repo-gate.js:81-83` names `docs/DOCMAP.md → The gate`. No hook entry uses the best-effort `if` filter (`grep -n "\bif:\|'if'" lib/hooks.js hooks/*.js .claude/settings.json` → empty), and `lib/guard.js`, `lib/hygiene.js`, `lib/repogate.js`, `lib/routegate.js` are pure (`guard.js` requires only `path`; the other three require nothing).
- **Why it matters:** `CLAUDE.md:61-65` says the fail-silent property is *"asserted in `test/hooks_e2e_test.js`, which runs the real scripts as processes"* — for six of nine it is, and the three left out include `repo-gate.js`, the one wired from a committed settings file into every clone of this repository, where a throw would break every Bash call in the project.
- **Fix:** add `'statusline.js'`, `'user-prompt-submit.js'` and `'repo-gate.js'` to the array at `test/hooks_e2e_test.js:143-144`, or derive the array from `fs.readdirSync(ROOT/'hooks')` so a new hook joins it automatically (the same "discover, never list" rule `test/run.js:33-40` already applies to suites).
- **Blast:** 1
- **Effort:** 1

## F-umbrella-12 — the README file map names six of the eight CLI commands
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `README.md:365` — ``bin/sshlg-skills.js          the launcher (install / update / routers / config / list / agents)``. The usage block printed by `node bin/sshlg-skills.js --help` lists **eight**: `install, update, routers, config, hooks, injectors, list, agents` — `hooks` and `injectors` are absent from the file-map line, and the `## Other commands` block (`README.md:349-354`) lists only `list` and `agents`. `docs/evidence/backlog.md:59` (B-07's waiver) independently states the surface is 8 commands. `docs/DOCMAP.md:82` requires README to move with every new CLI command.
- **Why it matters:** the file map is the README's one-glance answer to "what does the launcher do", and a reader who trusts it does not learn that `hooks` and `injectors` exist — `injectors` is the command `docs/DOCMAP.md:20` tells an operator to run when debugging which hook fired.
- **Fix:** update `README.md:365` to name all eight, and add `injectors` (and a pointer to the `hooks` section) to the `## Other commands` block.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-13 — all eight pins now sit one commit past their release tags, and nothing in the gate says so
- **Dimension:** version
- **Severity:** minor
- **Evidence:** for every member, `git -C skills/<name> tag --points-at HEAD` is **empty** and `git describe --tags` returns a `-1-g<sha>` suffix: `v0.11.1-1-gdf3c9a8` (agent-stack), `v1.11.1-1-ge311c87`, `v0.19.1-1-gcbb8851`, `v0.20.2-1-ga6b5a3d`, `v1.37.5-1-g15c9ba1`, `v0.5.2-1-g2ac9f0e`, `v0.41.5-1-g107bc38`, `v1.67.0-1-g5c65956`. Each extra commit is `chore: gitignore .env — a live key sat unignored in a sibling repo`. `python3 test/check_pins.py` prints `every pin matches its release (npm where published, git tag everywhere)` and exits 0 — because it compares the **version string** in `skills.json` against published versions (`classify()` at `test/check_pins.py:55`), never the pinned commit against the tagged commit. `test/release_lag.py` is silent for the same reason it should be: the pin *is* the tip of `main`, so `resolve()` returns `current`. Yet `test/release_lag.py:4` states the model as *"The pin is a **tag**; the skills-CLI channels install from the **branch**."*
- **Why it matters:** `git clone --recursive` at hub v0.79.0 gives eight submodules at commits no published release corresponds to, while npm and the plugin marketplace serve the tags. That is the inverse of the `seo-aeo-audit` incident `release_lag.py` exists to disclose, and both gates report green. The advertised versions do match, so the named "pin is the promise" invariant survives — the documented model does not, and nothing detects the divergence.
- **Fix:** either tag the eight `.gitignore` commits as patch releases before pinning them, or add a disclosure to `test/validate.py` alongside the release-lag one: report when `git tag --points-at <pin>` is empty, naming how many commits past the tag the pin sits.
- **Blast:** 1
- **Effort:** 1

## F-umbrella-14 — the v0.79.0 notes say `gpt-4.1-mini` is the pinned model; the file they point at pins `deepseek-v4-pro`
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `CHANGELOG.md:28-31` — *"`deepseek/deepseek-chat` … returns *empty or filtered* … while `openai/gpt-4.1-mini` completed the same corpus; **the model is pinned with that reason next to it**"* — and `CHANGELOG.md:22` names the pin's home as `~/.config/graphify/env`. That file (mode 600, verified; values redacted here) reads:

  ```
  # ACTIVE — configured 2026-08-16 …
  export OPENAI_API_KEY=…
  export OPENAI_BASE_URL=…
  # MODEL: deepseek-v4-pro, chosen by the operator 2026-08-16.
  # THE FLAG BELOW IS NOT OPTIONAL FOR THIS MODEL. … `GRAPHIFY_DISABLE_THINKING`
  # OpenRouter rates for this route: $1.17 / 1M in, $2.34 / 1M out.
  export OPENAI_MODEL=…
  export GRAPHIFY_DISABLE_THINKING=…
  ```

  The pinned model is `deepseek-v4-pro` with a different reason (reasoning-on by default) and different rates; `gpt-4.1-mini` appears only in that file's reference list at `$0.40 / $1.60`. File mtimes: `CHANGELOG.md` 20:56, `~/.config/graphify/env` 21:28 — the pin changed after the note was written, and the note is still uncommitted.
- **Why it matters:** the release note is the record of which model produced the graphs and why, and it names a model the machine is not using. The next run that needs to reproduce or re-price a rebuild will read a rate ($0.40/$1.30) that belongs to neither the model in the note nor the model in the file.
- **Fix:** before committing, reconcile `CHANGELOG.md:26-31` with `~/.config/graphify/env` — state which model actually produced the 2026-08-16 rebuild, its real OpenRouter rate, and the `GRAPHIFY_DISABLE_THINKING` requirement.
- **Blast:** 2
- **Effort:** 1

---

### Verified clean (no finding raised)

- **Pin invariant, all three places, all 8 members.** `skills.json` version, the version read out of the submodule's own `package.json`, and the `README.md:36-43` table agree for every member: super-ux 0.41.5, task-pipeline 1.67.0, agent-sync 1.11.1, make-skill 0.19.1, sheleg-design 1.37.5, seo-aeo-audit 0.20.2, sheleg-dev 0.5.2, agent-stack 0.11.1. All eight new pointers are reachable from `origin/main` in their own repos. `python3 test/check_pins.py` → exit 0, output quoted verbatim in F-13. `.gitmodules` urls are HTTPS 8/8.
- **`npm test`** → `PASS: 32 checks green (validate.py + 5 python + 26 node suites)`, exit 0. `test/check_pins.py --self-test` → exit 0. `test/advertised_plants.py` → exit 0. `test/audit_bundle.py` → exit **2** with `tiktoken is required and will not be approximated` (it refuses rather than failing open — the exit code is correct; a piped `$?` reads 0 and lies, per retro #8). Both exclusions' stated reasons still hold in kind: `check_pins` genuinely hits the network (7.4 s), `advertised_plants` genuinely runs seven member validators (106 s).
- **Routing block vs the machine.** Mirroring `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.cursor/rules/sshlg-routing.mdc` and `~/.sshlg-skills/` into a scratch HOME and running `node bin/sshlg-skills.js routers --dry-run` reports **`unchanged` on all four targets** and no drift line. `~/.sshlg-skills/config.json` holds `authored: {}` — every router has been adopted (nine `adopted:<name>` stash keys), so there is no deliberate divergence left for `routers` to report and none to report.
- **Install surface.** Both shadow checks from `/Users/sshlg/CLAUDE.md` are clean: the marketplace-name loop prints nothing, and the provided-skill-names Python check prints `(0 shadow(s))`; `pgrep -f 'sshlg-skills@latest|bin/sshlg-skills'` confirms no launcher was running. Broken symlinks across all 21 discovered `*/skills` directories: **0**.
- **The `.env` claims of v0.79.0.** `git check-ignore -v .env` resolves in all nine repositories; `git log --all -- .env` is empty; `git ls-files | grep '^\.env'` returns 0 in all nine. The repo's `.env` is now an mode-600 explanatory stub with no key in it.
- **Board parses.** 62 `| B-\d+ |` rows, ids unique, no malformed row. Recomputing `P = blast × (1 + age) / effort` matches every **open and waived** row (B-29 → 2.67 from 2×(1+3)/3); the 11 mismatches are all **closed** rows, which `test/validate.py`'s own docstring excludes by design. Both waived rows carry a mandatory `revisit:` clause and both conditions were re-derived on 2026-08-16 and still hold (8 CLI commands / 0 without a fixture; the `seo-llmo` router still carries the design-time rule).
- **Graph staleness message.** Run with the six keys unset, `test/validate.py` prints the new tail verbatim: *"…and no LLM key is set in THIS shell, so `graphify extract` cannot run (set one of GEMINI_/GOOGLE_/OPENAI_/ANTHROPIC_/DEEPSEEK_/MOONSHOT_API_KEY)"*, and it disappears with a key present. `graphify extract <path>` is a real verb (`graphify --help`). `graphify-out/` is untracked and gitignored at the umbrella (`git ls-files graphify-out` → 0).
- **Guard purity and the `if` filter.** No hook entry written by `lib/hooks.js:83-97` or present in `.claude/settings.json` uses an `if` field; `lib/guard.js`, `lib/hygiene.js`, `lib/repogate.js`, `lib/routegate.js` reach no filesystem.
- **Idempotence at the layer that repeats** is proven: `test/cli_config_test.js:240-256` runs the real `routers` command three times against a real file and asserts byte-equality on runs 2 and 3, and `test/hooks_e2e_test.js:204` does the same for `hooks install` with SHA-256. The preview shows removals (`test/cli_config_test.js:209-229`).

TOTAL: 14 findings (1 blocker, 8 major, 5 minor)
