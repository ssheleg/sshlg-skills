# Audit — task-pipeline 1.67.0 (skills/task-pipeline, submodule of sshlg-skills)
Read-only. Gate green, versions in sync, hooks and triggers clean; the defects are documentation currency, one over-budget body, and two release-integrity leaks.

## F-task-pipeline-01 — `task-pipeline/SKILL.md` body is 6685 tokens against a <5000 budget, and three sections carry the whole overrun
- **Dimension:** budget
- **Severity:** major
- **Evidence:** Measured, not restated — `python3` over `plugins/task-pipeline/skills/task-pipeline/SKILL.md`, body = everything after the front-matter fence (line 5), `len(body)/3.9`: `body chars 26072 est tokens 6685` (matches the family auditor's figure exactly). Section table, line ranges are file lines:

  | Section heading | Lines | Chars | ~Tokens | Verdict |
  |---|---|---|---|---|
  | (preamble — intro + config contract) | 6–36 | 1908 | 489 | keep |
  | `## Prerequisites — none required` | 37–170 | 9420 | 2415 | see sub-rows |
  | · intro paragraph | 37–45 | 561 | 144 | keep |
  | · Built-in doctrine table (34 rows) | 46–81 | 2487 | 638 | keep — it is the routing index, and `## References` (321–328) says so |
  | · Optional bridge | 82–88 | 477 | 122 | keep |
  | · super-ux paragraph | 89–97 | 614 | 157 | keep — the one gate-stopping dependency |
  | · "The grill is built in and mandatory" | 98–105 | 567 | 145 | **trim** — restates `references/grill.md` |
  | · "Harvest before you ask" | 106–117 | 921 | 236 | **trim** — restates `references/knowledge-sources.md` + `retrospective.md` |
  | · "Three artifacts close a run" | 118–128 | 855 | 219 | **trim** — restates `references/knowledge-graph.md` |
  | · "Documentation is a deliverable" | 129–136 | 596 | 153 | **trim** — restates `references/documentation.md` |
  | · "The run teaches the next run" | 137–152 | 1132 | 290 | **trim** — restates `references/retrospective.md` |
  | · "Three things the grill does" | 153–170 | 1201 | 308 | **split** → `references/grill.md` |
  | `## How to run` | 171–247 | 5568 | 1428 | see sub-rows |
  | · steps 1–4 | 173–212 | 2977 | 763 | keep — this is the run order |
  | · step 5, cross-cutting | 213–247 | 2572 | **659** | **split** → a `references/cross-cutting.md`, or fold each clause into the reference that already owns it (`documentation.md`, `loop-guard.md`, `audit.md`, `residue.md`) |
  | `## Stages (detail in references/stages.md)` | 248–293 | 7304 | 1873 | see sub-rows |
  | · intro | 248–252 | 180 | 46 | keep |
  | · the stage table 0–10 | 253–266 | 5918 | **1517** | **trim** — the heading itself says the detail is in `references/stages.md` (843 lines); row 10 alone (line 265) is 1995 chars / **512 tokens**, row 6 is 195, and every gate cell restates doctrine that already has a single home |
  | · "Stage 10 in a project of several repositories" | 267–293 | 1204 | **309** | **split** → `references/acceptance.md`, which already owns stage-10 close-out |
  | `## Model — ask once, at preflight` | 294–309 | 854 | 219 | keep |
  | `## Bring your own skills` | 310–320 | 662 | 170 | keep |
  | `## References` | 321–328 | 350 | 90 | keep |

  Minimal set that lands under 4750, splitting rather than trimming where possible: compress the stage table to one clause per gate plus the `references/stages.md` pointer it already carries (−1150), move step 5's cross-cutting rules out (−570), move the multi-repo stage-10 block to `acceptance.md` (−309) → **6685 − 2029 = ~4656 tokens**. All 34 reference files are reachable from `SKILL.md` today (verified: `reference files: 34 / named in SKILL.md: 34 / NOT named: []`), so nothing goes dark.
- **Why it matters:** This body loads on every turn in every session that resolves the skill. At 34% over, it is the worst in the family, and the material that is over is duplication of files that already load on demand.
- **Fix:** Edit `plugins/task-pipeline/skills/task-pipeline/SKILL.md`; move step 5 (213–247) and 267–293 into `references/`; compress the 253–266 table. Update `docs/DOCMAP.md`'s propagation matrix if a new reference file is created, and re-run `npm test` (the stage table is compared mechanically against `references/stages.md` and `pipeline.example.json`).
- **Blast:** 3
- **Effort:** 2

## F-task-pipeline-02 — `task-pipeline`'s description does not open with "Use when", against the house rule its sibling obeys
- **Dimension:** budget
- **Severity:** minor
- **Evidence:** `plugins/task-pipeline/skills/task-pipeline/SKILL.md:3` opens `description: "Runs a substantial task through a full delivery pipeline: …"`. The phrase `Use when` appears only mid-string ("Use when work changes the repository"). The sibling in the same plugin, `plugins/task-pipeline/skills/evidence-docs/SKILL.md:3`, opens `"Use when writing or reviewing anything that will be read as true …"` and scores 0 GAP. Description length is 968/1024 chars (measured), so there is 56 chars of headroom.
- **Why it matters:** The family's own routing depends on descriptions being scannable in one shape; the one skill every other member hands work to is the one that breaks it.
- **Fix:** Rewrite the opening clause of `plugins/task-pipeline/skills/task-pipeline/SKILL.md:3` to start "Use when …". Note the trigger contract: `lib/triggers.js` (umbrella) requires all 28 routed phrases to stay verbatim in this description — all 28 currently pass; a reword must keep them.
- **Blast:** 3
- **Effort:** 1

## F-task-pipeline-03 — README's "held to Anthropic's guidance" paragraph restates five numbers, and every one of them is now wrong
- **Dimension:** docs
- **Severity:** major
- **Evidence:** All five recomputed against the tree at HEAD `5c65956`:
  - `README.md:535` — "`SKILL.md` 334/500 lines" → `wc -l SKILL.md` = **327**
  - `README.md:535-536` — "all **23** references linked directly from `SKILL.md`" → `ls references/*.md | wc -l` = **34**
  - `README.md:536` — "**436 KB** against a 30 MB ceiling" → `du -sk` on the skill dir = **828 KB** (whole plugin 884 KB)
  - `README.md:542` — "`stages.md` is 500 lines" → `wc -l references/stages.md` = **843**
  - `README.md:543` — "**13** evaluations across the five dimensions" → `python3 evals/run.py` prints `suite: 28 evals`
- **Why it matters:** This is the section that tells a reviewer the skill was audited against the platform limits. Five stale numbers in the paragraph that claims measurement is the exact failure `evidence-docs` canon 2 ("numbers are computed, never restated") exists to prevent, shipped by the pack that owns the canon.
- **Fix:** Recompute and rewrite `README.md:533-543`, or replace the literals with the commands that produce them. Add the class to `test/validate.py`'s claim registry — the registry has a `reference files` class (truth 34) that is currently `dormant`, i.e. it is not matching this paragraph's wording.
- **Blast:** 3
- **Effort:** 1

## F-task-pipeline-04 — README still says the eval suite "has not been executed" — the exact sentence a 2026-08-08 audit flagged and fixed everywhere else
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `README.md:556` — "…and the eval suite has not been executed." Against it: `python3 evals/run.py` prints `suite: 28 evals · recorded runs: 1`; `evals/RESULTS.md:11` names this very wording as the defect it corrected — *"this file said \"has not been executed\" and \"Dated runs recorded 0\" for five releases while the tool beneath it printed `recorded runs: 1`, which is the self-contradiction canon 2 exists to prevent"*; `CHANGELOG.md:2836` records the fix; `docs/evidence/specs/2026-08-08-audit-followup-brief.md:33` files it as `⚠ self-contradiction`. The fix landed in `evals/RESULTS.md` and never propagated to `README.md`.
- **Why it matters:** A reader of the README is told there is zero behavioural evidence; `SKILL-CARD.md:19` tells the same reader there is one recorded run. The two shipped surfaces disagree about the skill's own evidence, and the disagreement was already diagnosed once.
- **Fix:** Rewrite `README.md:554-556` to match `evals/RESULTS.md` (one run, self-observed, zero blind runs on zero of three models). Add "eval execution status" to `docs/DOCMAP.md`'s propagation matrix so the next correction reaches both homes.
- **Blast:** 3
- **Effort:** 1

## F-task-pipeline-05 — the evals ratchet row says 15 while the command it names prints 28
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `evals/RESULTS.md:42` — `| Evals authored | 15 | \`python3 evals/run.py\` → \`suite: N evals\` | 2026-08-08 |`. Running that exact command: `suite: 28 evals · recorded runs: 1` (exit 0). Independently, `python3 -c` over `evals/task-pipeline.evals.json` gives `count 28`, `Counter({'should_trigger': 10, 'should_not_trigger': 8, 'instruction_following': 7, 'ambiguous': 2, 'coexistence': 1})`. The same file, `evals/RESULTS.md:7-9`, declares: *"The numbers below are computed, not asserted… A value typed here that disagrees with what it prints is the defect, and it is the document that is wrong."*
- **Why it matters:** The one file whose whole job is honesty about evidence carries a number 13 short of what its own named command prints — the second instance of the failure the file's own preamble was written to close.
- **Fix:** Update `evals/RESULTS.md:42` to 28 (and re-date the `As of` column), or delete the literal and leave the command. Add a claim-registry class in `test/validate.py` keyed on the `suite: N evals` pattern so the row is gated rather than remembered.
- **Blast:** 2
- **Effort:** 1

## F-task-pipeline-06 — HOW-IT-WORKS.md declares itself version 1.48.0 and "rewritten with every release" at 1.67.0
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `HOW-IT-WORKS.md:3` — "This file is rewritten with every release." `HOW-IT-WORKS.md:8` — "> **Version 1.48.0.** … Everything above it describes the pipeline as it is *now*, not as it was designed." The shipped version is **1.67.0** (`package.json`, `plugin.json`, `marketplace.json`, `CHANGELOG.md` top heading, `SKILL-CARD.md`, newest tag, npm — all agree). Its "What changed, by version" section (`HOW-IT-WORKS.md:292`) runs v1.48.0 → v1.39.0 and stops: **19 releases** are absent. The file's own history records this as a defect it already repaired once — `HOW-IT-WORKS.md:305-308`, "this file naming a version two releases stale".
- **Why it matters:** It is the file the README points a reader at for "how it thinks", it asserts it is current, and it is nineteen releases behind — including every mechanism shipped in 1.49.0–1.67.0 (ledger axes, exposure command, stage-coverage, the amend rule).
- **Fix:** Rewrite `HOW-IT-WORKS.md` at the next release and add it to the release checklist in `CONTRIBUTING.md` → *Releasing*; the invariant list in `CLAUDE.md` (version sync, five surfaces) does not include this file, which is why nothing caught it. Either gate the `Version X.Y.Z` line in `test/validate.py` against `package.json`, or delete the self-declared version.
- **Blast:** 3
- **Effort:** 2

## F-task-pipeline-07 — CLAUDE.md calls `docs/evidence/` historical and not the source of truth, five lines after telling agents to write the repo's live registers into it
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `CLAUDE.md:144-148` — "`docs/evidence/retro.md` — when a run of the pipeline **on this repo** diverged: stamp the run first … then write the entry". `CLAUDE.md:149-151` — "`docs/evidence/` holds this repo's **historical** design records (v0.1.0). They carry a \"superseded\" banner; do not update them to the current shape and do not treat them as the source of truth." `docs/evidence/` today holds the three most-live registers in the repository: `backlog.md` (45 `B-` rows, last written 2026-08-16), `retro.md` (6 standing instructions, 10 run stamps) and `verification.md` (126 REQ rows) — all three are in `.claude/agent-sync.json` → `guardedFiles`. And the banner claim is false for the historical part too: `grep -il 'supersed'` over `docs/evidence/plans/*.md docs/evidence/specs/*.md` returns **4 of 54** files.
- **Why it matters:** `CLAUDE.md:4-5` says this is the file the pipeline's own stage-0 harvest reads first. An agent obeying line 149 skips the backlog, the retro and the verification ledger as "superseded history" — the three files stage 0 and stage 10 are built around.
- **Fix:** Split the rule in `CLAUDE.md:149-151`: name `docs/evidence/plans/` and `docs/evidence/specs/` as the historical set, and name `backlog.md` / `retro.md` / `verification.md` as live. Either add the banner to the 50 files that lack it or drop the banner claim.
- **Blast:** 2
- **Effort:** 1

## F-task-pipeline-08 — the doc map says the registers are unguarded; the coordination config guards all of them
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `docs/DOCMAP.md:18` (Decisions) `| … | no (single maintainer) |`; `:19` (Open questions) `| … | same |`; `:20` (Lessons, `docs/evidence/retro.md`) `| … | no |`. Against `.claude/agent-sync.json` → `guardedFiles`, which lists `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/evidence/retro.md` (plus `backlog.md`, `verification.md`, `DOCMAP.md`, `CHANGELOG.md`, `package.json`, both plugin manifests, the workflows and two test files). The generated snapshot `docs/AGENT_SYNC.md:30-43` lists the same thirteen under "Guarded files — a live lease is required to write these", and `CLAUDE.md:62-63` states "All three are in `guardedFiles`, so the guard already refuses the edit without one." Coordination was turned on 2026-08-14 (`cfce394`); `docs/DOCMAP.md` was never updated.
- **Why it matters:** An agent that reads the doc map — which is what the pipeline's own documentation doctrine tells it to read — believes it can edit the decision register without a lease, and finds out from a refusal instead of from the map. Two sessions already collided on this repo's release files for the same reason (B-44).
- **Fix:** Update the `Guarded?` column in `docs/DOCMAP.md:16-20` to point at `.claude/agent-sync.json`, or generate it. `docs/DOCMAP.md` is itself a guarded file — take the lease first.
- **Blast:** 2
- **Effort:** 1

## F-task-pipeline-09 — every one of 126 shipped requirements is still unverified by a person, up from 99 when B-29 was filed
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `npm test` disclosure line, verbatim: `verification: 126 shipped REQ · 126 never confirmed by a person  (disclosure — no floor, no target)` and `exposure: 126 unverified · never checked · 15 releases carry one`. Counted independently: `grep -c '^| REQ-' docs/evidence/verification.md` = **126**; `grep -c never` = 128 (126 rows + 2 header lines). The umbrella row `docs/evidence/backlog.md:91` (B-29) recorded 99 and has already been re-derived: "**99 rows → 126**, all still at `never`". So the number **moved, and moved the wrong way** — 27 more requirements shipped unconfirmed since 2026-08-13, and none of the original 99 was closed.
- **Why it matters:** This is the member whose process every other member's release depends on, and it is the only repository in the family where `never` is measurable at all (B-62). Its own `checkup` mode exists to surface exactly this and has never brought it down.
- **Fix:** Not a machine's job by construction — a person opens the list and writes a date. `(REQ, Shipped in)` is unique across all 126 rows (B-29 verified this), so the check-list is addressable. Run `/task-pipeline checkup` and confirm a batch per release cycle; the `Human` column in `docs/evidence/verification.md` is the only field to write.
- **Blast:** 2
- **Effort:** 3

## F-task-pipeline-10 — the graph's own freshness section names a commit 16 behind HEAD while the graph itself was rebuilt at 1
- **Dimension:** graph
- **Severity:** major
- **Evidence:** `graphify-out/GRAPH_REPORT.md:1` — "# Graph Report - … (2026-08-15)"; `:12` — "- Built from commit: `42948c82`"; `:13` — "- Run `git rev-parse HEAD` and compare to check if the graph is stale." `git log -1 42948c8` → `feat: an arrow that carries nothing is not an arrow; v1.56.0`; `git rev-list --count 42948c82..HEAD` → **16**. But `graph.json` (mtime Aug 16 20:50) carries `built_at_commit = ccd03a40835ac49df3ae65925ee0e7b162910382`, and `git rev-list --count ccd03a4..HEAD` → **1**. So the graph was rebuilt and `GRAPH_REPORT.md` — the only human-readable freshness record, 45 KB, mtime Aug 15 16:44 — was not regenerated with it. Same stale report is copied verbatim into the dated snapshot `graphify-out/2026-08-16/GRAPH_REPORT.md` (byte-identical to the top-level one), which pairs a 2026-08-16 `graph.json` with a report headed 2026-08-15. `graphify-out/` is gitignored (`.gitignore:6`, `git ls-files graphify-out` → 0 files), so nothing stale ships — the cost is local. The umbrella's v0.79.0 claim "every one now sits **at HEAD**" (`CHANGELOG.md:5-6`) is true of `built_at_commit` and false of the file that publishes it.
- **Why it matters:** The pack's own doctrine (`SKILL.md:124-125`) says "a stale graph is a false premise **carrying the authority of a machine** — a wrong doc gets argued with, a wrong graph gets believed." An operator who follows the instruction printed at `GRAPH_REPORT.md:13` compares HEAD against a commit eleven releases old and concludes the graph is unusable when it is one commit behind.
- **Fix:** Regenerate `GRAPH_REPORT.md` whenever `graph.json` is rebuilt (the `graphify update` path currently rewrites `graph.json`/`manifest.json` only), and delete or refresh the stale copy in `graphify-out/2026-08-16/`. Consider having the umbrella's `test/graph_staleness.py` — which reads `built_at_commit` and passes today — also compare the report's stated commit against it.
- **Blast:** 1
- **Effort:** 1

## F-task-pipeline-11 — the umbrella pin is behind the submodule's HEAD, which is the exact `+` this skill's own stage-10 gate refuses to close on
- **Dimension:** version
- **Severity:** minor
- **Evidence:** From the umbrella: `git submodule status skills/task-pipeline` → `+5c65956d2e7f875a125712f7bc3df9abce11eea0 skills/task-pipeline (v1.60.0-9-g5c65956)`. The umbrella's committed pointer is `ccd03a40835ac49df3ae65925ee0e7b162910382` (`git ls-tree HEAD skills/task-pipeline`), which is tag `v1.67.0`; the submodule working tree is at `5c65956` (`chore: gitignore .env — a live key sat unignored in a sibling repo`), `git rev-list --count v1.67.0..HEAD` = **1**, tree otherwise clean. `plugins/task-pipeline/skills/task-pipeline/SKILL.md:279` states the rule: "`git submodule status` # no line begins with '+' (a '+' is the missing bump)".
- **Why it matters:** Anyone who clones the umbrella gets a `task-pipeline` whose `.gitignore` does not exclude `.env` — the commit was written because a live API key sat in an unignored `.env` in a sibling repo. The content is unreleased and untagged, so it reaches no consumer at all.
- **Fix:** Either release `5c65956` (tag + `skills.json` + README row + umbrella pin), or `git -C skills/task-pipeline checkout ccd03a4` if the commit is deliberately parked. Per `SKILL.md:290-291`: `git -C <submodule> push` then `git add <submodule> && git commit`.
- **Blast:** 2
- **Effort:** 1

## F-task-pipeline-12 — the last seven release tags are lightweight, so `git describe` and `git submodule status` name v1.60.0
- **Dimension:** version
- **Severity:** minor
- **Evidence:** `git cat-file -t` per tag: `v1.67.0 commit`, `v1.66.0 commit`, `v1.65.0 commit`, `v1.64.0 commit`, `v1.63.0 commit`, `v1.62.0 commit`, `v1.61.0 commit`, `v1.60.0 tag`, `v1.59.0 tag`. Across all 111 tags: **annotated=88 lightweight=23**. Consequence, measured: `git describe --tags` → `v1.67.0-1-g5c65956`, while plain `git describe` (annotated only — what `git submodule status` prints) → `v1.60.0-9-g5c65956`. Everything else agrees at 1.67.0: `package.json`, `plugins/task-pipeline/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md` top heading, `SKILL-CARD.md:15`, newest tag, umbrella `skills.json` pin, umbrella `README.md:37`, and `npm view task-pipeline-skill version` → `1.67.0`.
- **Why it matters:** The umbrella's own submodule readout — the surface a maintainer glances at to decide whether a member is current — reports a version seven releases stale, with no error. Lightweight tags also carry no tagger, date or message, so a release has no signed-off record.
- **Fix:** Create the seven missing releases as annotated tags (`git tag -a -f vX.Y.Z <sha> -m …` then force-push the tag), or standardise on `--tags` everywhere `describe` is used. `CLAUDE.md` → *Branch and commit policy* should say which kind a release tag is.
- **Blast:** 1
- **Effort:** 1

## F-task-pipeline-13 — CHANGELOG carries a v1.5.0 section for a version that was never tagged and never published
- **Dimension:** version
- **Severity:** minor
- **Evidence:** `CHANGELOG.md:4176` — `## v1.5.0 — 2026-08-01`, sitting between `## v1.6.0 — 2026-08-01` (`:4107`) and `## v1.4.4 — 2026-07-30` (`:4216`). `git tag | grep -c '^v1\.5\.0$'` → **0**. `npm view task-pipeline-skill versions --json` → 91 published, `'1.5.0' in v: False`. Diff of headings against tags: `comm -23 <(grep -o '^## v[0-9][0-9.]*' CHANGELOG.md | …) <(git tag | sort -u)` returns exactly one line, `v1.5.0`. CHANGELOG holds 112 version headings against 111 tags.
- **Why it matters:** The changelog is the repo's decision register (`docs/DOCMAP.md:18` names it as one of three homes for decisions). A version heading nobody can check out or install makes the register uncheckable at that point, and every consumer reading "shipped in v1.5.0" finds nothing.
- **Fix:** Either tag `v1.5.0` at the commit that introduced `references/knowledge-graph.md`, or fold the section into `v1.6.0` with a note that it never shipped separately. Add a `test/validate.py` guard comparing `^## vX.Y.Z` headings against `git tag` (skipping outside a checkout, as the existing git-reading guard already does).
- **Blast:** 1
- **Effort:** 1

## F-task-pipeline-14 — `test/validate.py` raises a SyntaxWarning on every gate run and is a SyntaxError under a stricter Python
- **Dimension:** gate
- **Severity:** minor
- **Evidence:** `npm test` (= `python3 test/validate.py`) prints, before its verdict:
  ```
  /Users/sshlg/DATA/sshlg-skills/skills/task-pipeline/test/validate.py:4659: SyntaxWarning: "\s" is an invalid escape sequence. Such sequences will not work in the future. Did you mean "\\s"? A raw string is also an option.
    `^#{1,3}\s`, which stops at a DEEPER heading too. Every section wired to it happened
  ```
  Exit code 0; verdict `PASS: task-pipeline structure valid`. Reproduced as a hard failure: `python3 -W error::SyntaxWarning -c "import py_compile; py_compile.compile('test/validate.py', doraise=True)"` → `SyntaxError: "\s" is an invalid escape sequence` at line 4659. Exactly one such warning in the file. The offending text is inside the docstring of `_section()` (`test/validate.py:4655-4662`) — prose quoting a regex, not code.
  Everything else in the gate is green: `npm test` exit 0; `test/negatives.py` → `PASS: all 351 guards provably reject their planted defect · 9 property check(s)`; `test/probe.py --self-test` → `PASS`; `test/release_gate_test.py` → `OK (43 checks)`; `test/artifact_root_test.py` → `PASS: 7 cases`; `test/migrate_artifacts_test.py` → `PASS: 7 cases`; `templates/docgate.sh` → `OK: documentation gate …` exit 0. `python3 evals/run.py` → exit 0, `suite: 28 evals · recorded runs: 1`, 5 categories. `claude plugin validate` passes for both the marketplace and the plugin manifest.
- **Why it matters:** The gate a family of nine repositories runs before every commit emits a warning on every invocation — noise that trains a reader to skip the lines above the verdict — and Python has announced the escalation to `SyntaxError`, at which point `npm test` stops running at all.
- **Fix:** Make the `_section()` docstring at `test/validate.py:4655` a raw string (`r"""`) or double the backslash. One-character class of change; `npm test` re-run proves it.
- **Blast:** 1
- **Effort:** 1

## F-task-pipeline-15 — SKILL-CARD says "ten gated delivery stages" and then lists eleven
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `SKILL-CARD.md:13` — "Runs a substantial task through ten gated delivery stages — intake grill, docs study, brainstorm, spec, plan, subagent build, tests, lint/deploy, post-deploy, docs+registers, acceptance — refusing to advance until each gate passes". The enumeration holds **eleven** items. Every other surface separates the grill from the ten: `plugins/task-pipeline/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` both read "a mandatory built-in intake grill, then 10 gated stages (docs, …, acceptance)" — ten items; `README.md:8` and `HOW-IT-WORKS.md:17` read "interrogates it into a complete brief, then walks it through ten gated stages". `SKILL.md:253-265` has stage rows 0–10 = eleven rows, of which stage 0 is the grill.
- **Why it matters:** `SKILL-CARD.md` is the one page an enterprise reviewer reads before deploying, and its first field miscounts the thing it is describing. `CLAUDE.md` → *Invariants* records that a count of an enumeration inside one sentence is deliberately **not** gated, so nothing will catch it.
- **Fix:** Rewrite `SKILL-CARD.md:13` to match the manifests: "an intake grill, then ten gated delivery stages — docs study, …, acceptance".
- **Blast:** 2
- **Effort:** 1

## F-task-pipeline-16 — the generated coordination snapshot sends id allocation to the parent repository; CLAUDE.md gives a local procedure
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `docs/AGENT_SYNC.md:25-26` — "### Id registers — reserve before you write / None declared here. **Ids live in the parent repository; reserve them there.**" Against `CLAUDE.md:55-70`, which states allocation for this repo is manual and local and gives the procedure: take the lease, then "Compute the next id from the committed file, never from your working copy. `git show HEAD:docs/evidence/backlog.md | grep -o 'B-[0-9]\{3\}' | sort -u | tail -1`". Both files are current — `.claude/agent-sync.json` has `"idRegisters": {}` and `docs/AGENT_SYNC.md` was regenerated in the same commit that emptied it (`4128b68`, 2026-08-16 01:52) — so this is generated boilerplate that is wrong for this repository, not staleness. The ids in question (`B-055` style, three digits) live in `docs/evidence/backlog.md` **here**; the umbrella's board uses a different scheme (`B-29`, two digits).
- **Why it matters:** `docs/AGENT_SYNC.md:5-6` tells the reader it is generated from the live configuration and to trust it over prose. An agent following it files this repository's board rows in the umbrella's register — the collision CLAUDE.md's procedure exists to prevent (two sessions filed a different `B-073` on 2026-08-15).
- **Evidence caveat:** suspected, not confirmed: the sentence is emitted by `agent_sync.py setup` for any project with empty `idRegisters` — I did not read the generator, which ships with `agent-sync`, not with this repo.
- **Fix:** Either declare the `B` register in `.claude/agent-sync.json` together with a backend that can allocate (CLAUDE.md:47-52 says the `fs` backend cannot, by design), or raise it against `agent-sync` so the empty-register text says "no register is declared" rather than naming a parent. Until then, link `CLAUDE.md`'s procedure from `docs/AGENT_SYNC.md`'s generated marker line is not possible (the file is refused if hand-edited) — so the fix belongs upstream.
- **Blast:** 1
- **Effort:** 1

## F-task-pipeline-17 — `verification.md` states the project has shipped thirty-one versions; it has shipped a hundred and eleven
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `docs/evidence/verification.md:8-10` — "It is what is true: the project has shipped **thirty-one versions** and nobody has ever recorded looking at a shipped requirement afterwards." Present tense, in the file's standing header, not inside a dated quotation. Measured: `git tag | wc -l` → **111**; `grep -c '^## v' CHANGELOG.md` → **112**; `npm view task-pipeline-skill versions --json` → **91 published**. The claim was true when the ledger was seeded (2026-08-09) and has not been recomputed since. `test/validate.py`'s claim registry reads word-form numbers as well as digits (per `docs/DOCMAP.md:56`), and this one is not matched by any class.
- **Why it matters:** The sentence's whole job is to size the exposure — "thirty-one versions with nobody looking" reads as a young project's backlog; a hundred and eleven reads as a systemic gap. Understating it by 3.6× is the number moving in the reassuring direction, which is the direction this repo's own retro says to distrust.
- **Fix:** Recompute the figure in `docs/evidence/verification.md:9`, or replace it with the command. Add a claim-registry class in `test/validate.py` matching "shipped <word-number> versions" against `git tag | wc -l`. The file is guarded — take the lease first.
- **Blast:** 1
- **Effort:** 1

TOTAL: 17 findings (0 blocker, 9 major, 8 minor)
