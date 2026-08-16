# Audit — seo-aeo-audit 0.20.2 (router `seo-llmo`)
Read-only. Every claim below was produced by running the named command in `/Users/sshlg/DATA/sshlg-skills/skills/seo-aeo-audit` unless a fuller path is given.

## F-seo-aeo-audit-01 — `npm test` does not exist here, so the family's stated gate verb hard-errors on this member
- **Dimension:** gate
- **Severity:** major
- **Evidence:** `package.json` has no `scripts` key at all (verified: `python3 -c "import json;print('scripts' in json.load(open('package.json')))"` → `False`). Running the family gate:
  ```
  $ cd /Users/sshlg/DATA/sshlg-skills/skills/seo-aeo-audit && npm test; echo "EXIT=$?"
  npm error Missing script: "test"
  npm error
  npm error To see a list of scripts, run:
  npm error   npm run
  EXIT=1
  ```
  The real entry point is `bash scripts/check-docs.sh` (named at `CLAUDE.md:20`), and it passes:
  ```
  $ bash scripts/check-docs.sh; echo "EXIT=$?"
  PASS: seo-aeo-audit structure valid (1 cursor rule(s), 23 reference(s))
  PASS: plant_guard — 9 cases
  PASS: page_audit behavior (3 fixtures, markdown + json + scheme guard + headers, gzip, url-list and error paths, blindness caveat, schema completeness, directive parsing, price provenance, truncation honesty, per-finding tiers)
  PASS: url_inspection behavior (documented field names, canonical verdicts, blockers, error rows, visible cap, every excluded state, tier scoped to answers)
  PASS: collector behavior (psi field/lab separation, CLS rescale, absent-CrUX honesty, sitemap template families, orphan refusal, sitemap cap in the report, preflight/psi CrUX agreement, gsc text parity with json)
  PASS: agent_surface behaviour
  PASS: output contracts (flattening in 5 renderers, preflight table + stable denominator, exit status from the same predicate the report uses, every emitted severity orderable)
  OK: structure, doctrine guards and behaviour tests all pass
  EXIT=0
  ```
  Three of eight members lack the script (loop over `skills/*/package.json`): `agent-stack` MISSING, `seo-aeo-audit` MISSING, `super-ux` MISSING; the other five HAVE it. The umbrella treats `npm test` as *the* gate (`/Users/sshlg/DATA/sshlg-skills/docs/DOCMAP.md:99`, `:131`; `/Users/sshlg/DATA/sshlg-skills/lib/repogate.js:5`).
- **Why it matters:** any family-wide runner, pre-commit gate or contributor following the umbrella's documented verb gets a hard error that reads as a broken repository, and the honest signal — that this member gates through a different command — is available nowhere in `package.json`.
- **Fix:** add `"scripts": {"test": "bash scripts/check-docs.sh"}` to `/Users/sshlg/DATA/sshlg-skills/skills/seo-aeo-audit/package.json`; keep `scripts/check-docs.sh` as the implementation so `CLAUDE.md:20`, `CONTRIBUTING.md` and `.github/workflows/validate.yml` stay true. Same edit is owed by `agent-stack` and `super-ux`.
- **Blast:** 2
- **Effort:** 1

## F-seo-aeo-audit-02 — `SKILL.md` body is 5885 tokens against a <5000 budget, and one section carries 29% of it
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md` — 379 lines, 24323 chars total; front matter lines 1–5 = 1013 chars; body = **22953 chars → ~5885 tokens** at 3.9 chars/token, **18% over the 5000 budget** (needs ≥1135 tokens / ≥4427 chars removed to reach 4750). Fence-aware section table (`python3` walk over the file, code-fence lines excluded from heading detection):

  | Lines | Chars | ~Tokens | Heading | Verdict |
  |---|---:|---:|---|---|
  | 7–16 | 475 | 122 | `# seo-aeo-audit — audit search + answer-engine visibility…` | keep |
  | 17–56 | 2584 | 663 | `## Non-negotiables` | keep — this is the doctrine the skill exists to enforce |
  | 57–111 | 3035 | 778 | `## Step 0 — Detect mode, never ask twice` | **split** — lines 91–111 (829+128+76 = 1033 chars / ~265 tok) are the `SKILL_DIR` resolution boilerplate; `references/scripts.md` already documents every invocation |
  | 112–142 | 1769 | 454 | `## Step 1 — Baseline before opinions` | keep |
  | 143–237 | **6701** | **1718** | `## Step 2 — The ten tracks` | **split** — 2.2× the next-largest section; every track already has a declared single home (`technical-checks.md`, `architecture-and-equity.md`, `intent-and-content.md`, `aeo-geo.md`, `agent-readiness.md`, `entity-and-brand.md`, `experience-signals.md`, `threats-and-defense.md`, `measurement.md`) |
  | 238–289 | 2775 | 712 | `## Step 3 — Triage` | **trim** — the tier weights and the `priority = (impact × confidence) / effort` formula duplicate `references/evidence-tiers.md`, the declared single home |
  | 290–313 | 1264 | 324 | `## Step 4 — Deliverables` | **trim** — the three skeleton names duplicate `references/deliverable-templates.md` |
  | 314–325 | 669 | 172 | `## Step 5 — Verify, then follow up` | keep |
  | 326–354 | 1767 | 453 | `## Myth guard — do not put these in a plan` | **trim** — its own text says the full list "is in [references/myths.md]"; the 14-item inline restatement and the two-paragraph `llms.txt` boundary are a second copy of `myths.md` + `agent-readiness.md` K3 |
  | 355–380 | 1904 | 488 | `## References` | **trim** — 23 bullets each carrying a prose gloss; a bare filename list halves it |

  Named combination that clears 4750: **split Step 2's per-track prose into `references/tracks.md`, leaving the 10-row index** (−~1200 tok → 4685, already under) — or, with margin, **that plus trimming the Myth guard to a pointer** (−~1580 tok → **~4305 tok**).
  Description: `description:` value is **959 chars** — **11 chars of headroom** against the 970 working limit (65 against the 1024 hard limit).
- **Why it matters:** the whole body loads into every session that triggers the skill; 885 tokens of overrun is paid on every invocation, and the 11-char description headroom means the next trigger phrase added by the umbrella cannot be advertised without a compression pass first.
- **Fix:** in `plugins/seo-aeo-audit/skills/seo-aeo-audit/SKILL.md`, move lines 143–237 into a new `references/tracks.md` (add it to `REQUIRED_REFERENCES` in `test/validate.py` and to the `## References` list), and replace lines 326–354 with a three-line pointer at `references/myths.md` + `references/agent-readiness.md` K3.
- **Blast:** 3
- **Effort:** 2

## F-seo-aeo-audit-03 — the Cloudflare Content Signals rows say "stalled" and "little uptake", tagged CONFIRMED, four weeks before a dated default that blocks Googlebot
- **Dimension:** docs
- **Severity:** major
- **Evidence:** two homes assert it:
  - `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/algorithm-updates.md:89` — "*Cloudflare's Content Signals initiative stalled; the industry push for Google to split Googlebot into separate search and AI-training crawlers went unanswered | 2026-07-06 | There is still no way to opt out of Google's AI use while keeping Search.*"
  - `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/technical-checks.md:141` — "*Cloudflare's Content Signals initiative (launched 2025) had little uptake as of Jul 2026 — that part is documented (`CONFIRMED`).*"

  Verified against the live record (WebFetch of `https://www.searchenginejournal.com/cloudflares-ai-crawler-rules-can-block-googlebot/581385/`, HTTP 200): Cloudflare announced the Search/Agent/Training taxonomy on **2026-07-02** — four days *before* the row's own date — with controls "*live now for all customers, including the free tier*"; and on **2026-09-15** two defaults take effect: Training and Agent blocked by default on ad-supported pages for new customers and sites, and "*a crawler that performs both Search and Training will be blocked if a site blocks Training*", with Googlebot/Bingbot/Applebot named as exactly those multi-purpose crawlers. Free users who do not change settings by 2026-09-15 are moved to those defaults automatically. Corroborated by WebSearch (`blog.cloudflare.com/content-independence-day-ai-options/`, `playwire.com/blog/cloudflares-ai-bot-blocker-is-also-blocking-googlebot`).
  Grep confirms no reference file carries the September date or the default flip: `grep -rniE "cloudflare|content signals" references/` returns only the two rows above plus `agent-readiness.md:135` (the header syntax) and `technical-checks.md:45,:57,:84` (unrelated error/WAF notes).
- **Why it matters:** this is the one row an auditor reads before telling a client whether the Googlebot/AI-training trade-off is actionable. As written it says the mechanism stalled and nothing needs checking, while a dated default 30 days out can block Googlebot on a site that never touched a setting — the highest-cost false negative this skill can emit, and it is carried at `CONFIRMED`, the tier non-negotiable #2 forbids anything from out-ranking.
- **Fix:** rewrite `references/technical-checks.md:140-147` and the `references/algorithm-updates.md:89` row with the 2026-07-02 announcement, the 2026-09-15 default, and the multi-purpose-crawler rule; add a check to `references/technical-checks.md` §A for "is this origin behind Cloudflare, and what is its Training setting"; add the row to `growth-plays.md` B9, whose "WAF or CDN bot rules" line is where an auditor would look.
- **Blast:** 3
- **Effort:** 1

## F-seo-aeo-audit-04 — "Twenty-three reference contracts ship" is stated in three places while 25 ship, and the validator cannot see it
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `ls plugins/seo-aeo-audit/skills/seo-aeo-audit/references/*.md | wc -l` → **25**. All 25 ship: `npm pack --dry-run --json` puts 25 files under `/references/` in the tarball; `ls ~/.agents/skills/seo-aeo-audit/references/*.md | wc -l` → 25; `ls ~/.claude/plugins/cache/seo-aeo-audit/seo-aeo-audit/0.20.2/skills/seo-aeo-audit/references/*.md | wc -l` → 25. The three restatements:
  - `README.md:124` — "Twenty-three reference contracts ship *inside* the skill, so they travel to every agent"
  - `README.md:310` — "`references/*.md            23 contract files (shipped on every channel)`"
  - `CONTRIBUTING.md:3` — "This skill is mostly **knowledge** — twenty-three reference contracts"
  (also `CONTRIBUTING.md:73` "that all twenty-three references exist" and `README.md:147` "across the twenty-three contracts")

  The gate stays green because `test/validate.py:680-694` compares those sentences against `len(REQUIRED_REFERENCES)`, and that tuple holds **23** entries (`test/validate.py:20-42`) — `preflight.md` and `scripts.md` are absent from it while sitting in the directory and in every tarball. `bash scripts/check-docs.sh` prints `PASS: seo-aeo-audit structure valid (1 cursor rule(s), 23 reference(s))` while 25 are on disk.
- **Why it matters:** this is the fourth occurrence of the class the validator's own comment says it stopped being a review item over (`test/validate.py:670-675`: "*CONTRIBUTING said nineteen while the validator enforced twenty-one… It went stale again the moment a twenty-second reference shipped*"). The guard reconciles prose against a tuple instead of against the directory, so the number can drift exactly as far as the tuple does and never go red.
- **Fix:** derive the count from the directory — replace the `REQUIRED_REFERENCES` tuple as the source of truth in `test/validate.py:680-694` with `len(glob(references/*.md))`, and add a check that every file on disk is in `REQUIRED_REFERENCES`. Then update `README.md:124`, `README.md:147`, `README.md:310`, `CONTRIBUTING.md:3` and `CONTRIBUTING.md:73` to 25 / twenty-five.
- **Blast:** 2
- **Effort:** 1

## F-seo-aeo-audit-05 — `graphify-out/GRAPH_REPORT.md` describes a different graph from the `graph.json` beside it
- **Dimension:** graph
- **Severity:** major
- **Evidence:** in `/Users/sshlg/DATA/sshlg-skills/skills/seo-aeo-audit/graphify-out/`:
  - `GRAPH_REPORT.md` (mtime **2026-08-15 16:41**) header: "`# Graph Report - seo-aeo-audit  (2026-08-15)`", "`- 764 nodes · 808 edges · 106 communities`", "`## Graph Freshness / - Built from commit: 8a14529c`"
  - `graph.json` (mtime **2026-08-16 20:45**): `built_at_commit = 2b02f428f35aa3809bc0cdce566a218632c299ce`, **745 nodes, 839 links** (`python3 -c "import json;g=json.load(open('graphify-out/graph.json'));print(len(g['nodes']),len(g['links']),g['built_at_commit'])"`)
  - `8a14529c` resolves to `chore(coordination): a guard that guards nothing is not coordination` — not the commit the graph beside it was built at.
  - `cmp graphify-out/GRAPH_REPORT.md graphify-out/2026-08-16/GRAPH_REPORT.md` → identical, and both carry the 2026-08-15 mtime: the 2026-08-16 rebuild wrote `graph.json`, `manifest.json` and `.graphify_analysis.json` but **did not regenerate the report**.
  - Supporting, cause not confirmed: the root `graph.json` (20:45, 745 nodes) and `graphify-out/2026-08-16/graph.json` (18:28, **793** nodes) both declare `built_at_commit = 2b02f42` while disagreeing on node count.
  - `graphify-out/` is untracked: `git check-ignore -v graphify-out` → `.gitignore:5:graphify-out/`, `git ls-files graphify-out` → 0 files.
- **Why it matters:** the report is the human-readable half and it is the half a reader opens. The umbrella's own doctrine (`/Users/sshlg/DATA/sshlg-skills/test/graph_staleness.py:11-13`) is that "*a stale graph is a false premise carrying the authority of a machine — a wrong doc gets argued with, a wrong graph gets believed*"; here the report states a node count, an edge count and a build commit that are all wrong against the artefact it sits next to.
- **Fix:** re-run graphify so `GRAPH_REPORT.md` is regenerated with `graph.json` (or delete the stale report rather than serve it), and add the report's own `Built from commit` to whatever `/Users/sshlg/DATA/sshlg-skills/test/graph_staleness.py` reads, so a report that disagrees with its `graph.json` is a disclosed state rather than an invisible one.
- **Blast:** 1
- **Effort:** 1

## F-seo-aeo-audit-06 — the OpenAI crawler inventory is missing `OAI-AdsBot`, documented since ~April 2026
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/seo-aeo-audit/skills/seo-aeo-audit/scripts/agent_surface.py:128-160` declares `RETRIEVAL_UAS` (`oai-searchbot`, `chatgpt-user`, `claude-searchbot`, `claude-user`, `perplexitybot`, `perplexity-user`), `TRAINING_UAS = ("gptbot", "claudebot", "ccbot", "bytespider")`, `GROUNDING_UAS`, and `OTHER_AI_UAS` — none contains `oai-adsbot`. `grep -rniE 'adsbot' plugins/` returns nothing. `references/agent-readiness.md:58-60` and `:109-111` enumerate the same set.
  WebFetch of `https://developers.openai.com/api/docs/bots` (HTTP 200, the current home of the old `platform.openai.com/docs/bots`) lists **four** bots: `OAI-SearchBot`, **`OAI-AdsBot`** ("*used to validate the safety of web pages submitted as ads on ChatGPT*"), `GPTBot`, `ChatGPT-User`. WebSearch corroborates it was added to the public crawler docs in **April 2026**; the skill's comment at `agent_surface.py:124-127` says the vendor docs were "*read from the vendor's documentation on 2026-08-14*". The three quoted sentences the script does carry match the live doc verbatim; the fourth bot was missed.
- **Why it matters:** `agent_surface.py` is sold as the one pass that reports the agent surface "per bucket" and reports a blocked bot as a named consequence. A site running ChatGPT ads behind a blanket `OAI-*` or managed-bot block gets a clean report from this script while its ad landing pages fail validation.
- **Fix:** add `oai-adsbot` to `OTHER_AI_UAS` in `plugins/seo-aeo-audit/skills/seo-aeo-audit/scripts/agent_surface.py` (it is neither retrieval nor training — OpenAI does not state that it honours robots.txt, so an unverified purpose must not support a retrieval-loss claim, per the file's own rule at `:157-159`), and add the row to `references/agent-readiness.md:109-111` with the vendor sentence and its read date.
- **Blast:** 3
- **Effort:** 1

## F-seo-aeo-audit-07 — README's "Roughly 5,000 lines" of reference material is 34% under the count
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `README.md:147` — "**Verified as of 2026-08-10.** Roughly 5,000 lines of distilled reference material across the twenty-three contracts." Computed: `cat plugins/seo-aeo-audit/skills/seo-aeo-audit/references/*.md | wc -l` → **6681**. `grep -n "5,000\|Roughly" test/validate.py` returns nothing — the number has no guard. The same paragraph carries the parenthetical "(*An exact line count used to sit here. It was wrong four edits later, which is the same defect class this skill refuses everywhere else — a number about a thing, kept next to the thing, with nothing reconciling them.*)" — the replacement is the same defect at lower precision.
- **Why it matters:** the README is the shop window for a skill whose first non-negotiable is "evidence or silence"; a restated volume figure that is out by 1,681 lines undercuts the claim the paragraph exists to make.
- **Fix:** in `README.md:147` either state ~6,700 and add a reconciler to `test/validate.py` beside the existing count guards, or drop the figure entirely as the exact count was dropped.
- **Blast:** 1
- **Effort:** 1

## F-seo-aeo-audit-08 — `deliverable-templates.md` says two skeletons are mirrored to `templates/`; three are, and the validator checks all three
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/deliverable-templates.md:3-5` — "*Copy these skeletons verbatim into the target project; **the first two** are duplicated at `templates/*.template.md` in the repo for non-agent use, and the validator keeps those copies identical.*" On disk: `ls templates/` → `action-plan.template.md`, `audit-report.template.md`, `experiments.template.md` (three). `test/validate.py:16-17` — `REQUIRED_TEMPLATES = ("audit-report.template.md", "action-plan.template.md", "experiments.template.md")` and `test/validate.py:1001-1008` loops over all three, failing on any that has drifted from the embedded copy. The same file's own Contents block at `:9-11` lists three deliverables and its body at `:16-23` argues that the third exists precisely so the deliverable does not "become optional by accident".
- **Why it matters:** a document describing behaviour the code no longer has — a contributor reading it believes `experiments.template.md` is unguarded and free to diverge, when editing it without regenerating the embedded copy fails the gate.
- **Fix:** change "the first two" to "all three" at `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/deliverable-templates.md:4`.
- **Blast:** 1
- **Effort:** 1

## F-seo-aeo-audit-09 — the refresh protocol instructs updating a "Verified as of" line that does not exist in the file it governs
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/algorithm-updates.md:154` — "*5. Update the **Verified as of** line at the top and note the refresh in the repository CHANGELOG.*" The top of that file (`:3-4`) carries two different lines: "*Sources last re-fetched: 2026-07-28.*" and "*Newest row in this file: 2026-07-30.*". `grep -c "Verified as of" references/algorithm-updates.md` → **1** (the protocol line itself); `grep -rn "Verified as of" plugins/` returns only that line. The file's own preamble at `:12-19` explains that the single stamp was deliberately *replaced* by the two-date pair — the protocol step was not updated with it.
- **Why it matters:** the file names itself as "part of the skill's Definition of Done" and this is the step that keeps a fast-moving timeline honest; an agent following it looks for a line that is not there and, per the file's own history, updates one date while the other goes stale — the exact failure the two-date split was introduced to stop.
- **Fix:** rewrite step 5 at `plugins/seo-aeo-audit/skills/seo-aeo-audit/references/algorithm-updates.md:154` to name both lines ("*Sources last re-fetched*" and "*Newest row in this file*") explicitly.
- **Blast:** 1
- **Effort:** 1

## F-seo-aeo-audit-10 — ten tagged versions carry CHANGELOG release entries but were never published to npm, and only one non-release is disclosed
- **Dimension:** version
- **Severity:** minor
- **Evidence:** cross-check of `git tag`, `^## v?<semver>` headings in `CHANGELOG.md`, and `npm view @ssheleg/seo-aeo-audit versions`:
  ```
  CHANGELOG: 40   tags: 39   npm: 30
  in CHANGELOG, no tag: ['0.18.0']
  tagged, not on npm: ['0.1.0','0.1.1','0.12.0','0.3.0','0.3.1','0.4.1','0.5.0','0.6.0','0.8.1','0.9.0']
  ```
  Confirmed for one of them: `npm view @ssheleg/seo-aeo-audit@0.12.0 version` → `npm error code E404 / 404 No match found for version 0.12.0`. `0.18.0` is handled exemplarily — `CHANGELOG.md:195-199` states "*Never released on its own. There is no `v0.18.0` tag and no `0.18.0` on npm… `npm install @ssheleg/seo-aeo-audit@0.18.0` fails.*" No equivalent note exists for `0.12.0` (`CHANGELOG.md:863`) or the other nine, which read as ordinary releases.
- **Why it matters:** the CHANGELOG is the document a user consults to pick a version; ten of its forty entries name a version `npm install` cannot resolve, and the one place it *does* warn about this proves the repository knows the disclosure is owed.
- **Fix:** append the `v0.18.0`-style blockquote note to the `## v0.12.0` heading at `CHANGELOG.md:863` and to the nine other headings listed above; add a check to `test/validate.py` that every `^## v<semver>` heading has either a matching tag or an explicit non-release note.
- **Blast:** 2
- **Effort:** 1

## F-seo-aeo-audit-11 — the CHANGELOG says the stray `v0.11.3` was deleted, but 0.11.3 is still installable from npm
- **Dimension:** version
- **Severity:** minor
- **Evidence:** `CHANGELOG.md:685-691` — "*This work was written against `v0.11.2` and released as `v0.11.3` before `origin/main` was fetched… The stray `v0.11.3` tag is deleted.*" The tag is indeed gone (`git tag -l 'v0.11.3'` → empty), but the package is not: `npm view @ssheleg/seo-aeo-audit@0.11.3 version` → `0.11.3`, published `2026-08-10T02:55:01.445Z` — after `0.11.2` (2026-08-05) and in a registry where `0.12.0` never appeared at all. There is no `## v0.11.3` heading in the CHANGELOG, so the version a user can install has no entry describing it.
- **Why it matters:** the disclosure is true about the tag and silent about the artefact, so a reader concludes 0.11.3 does not exist while `npm install @ssheleg/seo-aeo-audit@0.11.3` succeeds and serves code the repository has documented as a mistake.
- **Fix:** either `npm deprecate @ssheleg/seo-aeo-audit@0.11.3 "released in error — use 0.13.0 or later"` (an ops step, not a file edit), or extend the note at `CHANGELOG.md:691` to say the tag was deleted and the npm publication remains.
- **Blast:** 2
- **Effort:** 1

## F-seo-aeo-audit-12 — the graph is one commit behind HEAD, so the umbrella's v0.79.0 "every one now sits at HEAD" no longer holds here
- **Dimension:** graph
- **Severity:** minor
- **Evidence:** `/Users/sshlg/DATA/sshlg-skills/CHANGELOG.md:5-7` claims "*All nine, with semantic extraction: every one now sits **at HEAD**, where this repository's was 31 commits behind, `super-ux` 33, `seo-aeo-audit` **19**…*". Measured now:
  ```
  $ python3 -c "import json;print(json.load(open('graphify-out/graph.json'))['built_at_commit'])"
  2b02f428f35aa3809bc0cdce566a218632c299ce
  $ git rev-list --count 2b02f428f35aa3809bc0cdce566a218632c299ce..HEAD
  1
  ```
  The 19-behind figure and the rebuild are both corroborated — `graphify-out/2026-08-16/` exists with `graph.json` at 18:28 and the root copy rewritten at 20:45 — but commit `a6b5a3d` ("*chore: gitignore .env*") landed at **2026-08-16 20:55:51 +0200**, after the last build. By `/Users/sshlg/DATA/sshlg-skills/test/graph_staleness.py`'s own `resolve()` the state is `behind`, not `current`.
- **Why it matters:** a released note that says "at HEAD" without naming the commit it was measured at reads as a standing property rather than a timestamped measurement; the next reader who quotes it is quoting a number that was true for ten minutes.
- **Fix:** in `/Users/sshlg/DATA/sshlg-skills/CHANGELOG.md:5-7`, pin the claim to the commit each graph was built at rather than to "HEAD"; the disclosure machinery for the live number already exists in `test/graph_staleness.py` and should be what a reader is sent to.
- **Blast:** 1
- **Effort:** 1

## F-seo-aeo-audit-13 — HEAD is one commit ahead of `v0.20.2` and the umbrella's submodule pin does not include it
- **Dimension:** version
- **Severity:** minor
- **Evidence:** every manifest agrees on `0.20.2` — `package.json` `"version": "0.20.2"`; `plugins/seo-aeo-audit/.claude-plugin/plugin.json` `"version": "0.20.2"`; `.claude-plugin/marketplace.json` `plugins[0].version = "0.20.2"`; `CHANGELOG.md:3` `## v0.20.2 — 2026-08-16`; newest tag `v0.20.2` (`git tag --sort=-v:refname | head -5` → `v0.20.2 v0.20.1 v0.20.0 v0.19.1 v0.19.0`); umbrella `skills.json` pin `"version": "0.20.2"`; umbrella `README.md:41` row `| 0.20.2 |`; npm `latest = 0.20.2`. **No disagreement on the number.** But:
  ```
  $ git describe --tags
  v0.20.2-1-ga6b5a3d
  $ git -C /Users/sshlg/DATA/sshlg-skills ls-tree HEAD skills/seo-aeo-audit
  160000 commit 2b02f428f35aa3809bc0cdce566a218632c299ce  skills/seo-aeo-audit
  $ git -C /Users/sshlg/DATA/sshlg-skills submodule status skills/seo-aeo-audit
  +a6b5a3d841fd6bdfa8d0d3e9ba4841bb24d1c656 skills/seo-aeo-audit
  ```
  HEAD `a6b5a3d` (the `.gitignore`/`.env` hardening) is tagged nowhere and the umbrella's committed pointer is `2b02f42`; the `+` marks the working tree ahead of the recorded pin. The installed plugin is at the pinned commit too (`~/.claude/plugins/installed_plugins.json` → `"gitCommitSha": "2b02f428…"`).
- **Why it matters:** the `.env` gitignore hardening that `/Users/sshlg/DATA/sshlg-skills/CHANGELOG.md` v0.79.0 says was applied "in **all nine** repositories" is, for this member, in no tag, no release and no umbrella pin — so a fresh clone at `v0.20.2` or an install from the marketplace does not have it.
- **Fix:** cut the pointer forward — either fold `a6b5a3d` into the next release of `/Users/sshlg/DATA/sshlg-skills/skills/seo-aeo-audit` or commit the submodule bump in the umbrella so `skills.json`'s pin and the recorded commit describe the same tree.
- **Blast:** 1
- **Effort:** 1

TOTAL: 13 findings (0 blocker, 5 major, 8 minor)
