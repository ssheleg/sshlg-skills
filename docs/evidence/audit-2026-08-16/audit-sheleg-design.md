# Audit — sheleg-design 1.37.5 (`/Users/sshlg/DATA/sshlg-skills/skills/sheleg-design`, HEAD `15c9ba1`)
Gate GREEN (`npm test` exit 0, 35.6s, 2657 + 1448 + 531 = 4636 checks); version integrity clean across all eight homes; 15 findings, none blocking.

## F-sheleg-design-01 — `SURFACE_COMPOSITION.md` calls its status-token map "full" while it covers 12 of 22 packs and omits two naming schemes entirely
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `plugins/sheleg-design/skills/sheleg-design/SURFACE_COMPOSITION.md:69-76` — "Status colours are the least uniform thing in the library, so **the full map is here rather than summarised**: the pair `--ok` / `--warn` in `workbench` and `instrument-console`; the pair `--good` / `--warning` in `blueprint`, `cyclorama`, `maquette`, `prism` and `showroom`; `--good` **without** a `--warning` in `atrium` and `briefing-room`; `--danger` alone in `field-notes`; and **nothing at all** in `editorial-luxury` and `orchard`." That is 12 packs. Computed over all 22 token layers (`cd plugins/sheleg-design/skills/sheleg-design/styles/tokens && for f in *.css; do grep -oE '^\s*--(ok|warn|warning|good|danger|success)\s*:' "$f"; done`):
  ```
  awning     danger,good,warn      <- unmapped
  datasheet  danger,success,warning<- unmapped, and `--success` is a naming the doc never mentions
  ledger     danger,ok,warn        <- unmapped (doc says only workbench + instrument-console use --ok/--warn)
  manpage    danger,success,warning<- unmapped
  ora        danger,good,warn      <- unmapped
  paperclip  danger,good,warn      <- unmapped
  pigeonhole danger,good,warn      <- unmapped
  roster     danger,good           <- unmapped (same shape the doc attributes only to atrium/briefing-room)
  scoreboard danger,good,warn      <- unmapped
  tenor      danger,good,warn      <- unmapped
  ```
  Six of the ten (`awning`, `ora`, `paperclip`, `pigeonhole`, `scoreboard`, `tenor`) use the mixed `--good` + `--warn` pair, a combination the "full map" never names.
- **Why it matters:** The paragraph's stated purpose is to stop an agent guessing a token name — "Writing `var(--warning)` in `atrium` is the trap this paragraph exists to prevent" — and the same file (`:83-85`) explains that an undefined custom property fails silently rather than erroring. An agent drawing a chart in `tenor` reads this map, finds `tenor` absent, infers the common `--warning`, and ships a chart with an invalid declaration that renders with no error anywhere. The document is not merely incomplete; it asserts completeness.
- **Fix:** Regenerate the status-token map in `plugins/sheleg-design/skills/sheleg-design/SURFACE_COMPOSITION.md` (and its byte-identical mirror `.cursor/skills/sheleg-design/SURFACE_COMPOSITION.md`) from the 22 files in `styles/tokens/`, adding the `--success`/`--warning` and `--good`/`--warn` schemes. Then add a check to `test/validate.py` beside `validate_pack_enumerations()` that asserts every pack named in `styles/tokens/*.css` with a status token appears in that map — the existing `ENUMERATION_SITES` list does not include `SURFACE_COMPOSITION.md`.
- **Blast:** 3
- **Effort:** 2

## F-sheleg-design-02 — pack counts written as bare numerals are stale in four files, and two of them contradict a correct count in the same paragraph
- **Dimension:** docs
- **Severity:** major
- **Evidence:** 22 packs ship (`ls plugins/sheleg-design/skills/sheleg-design/styles/tokens/*.css | wc -l` → `22`; `ls kits | wc -l` → `22`).
  - `plugins/sheleg-design/skills/sheleg-design/SURFACE_COMPOSITION.md:62` — "the names are not uniform across **the twenty-one**" — while `:66` in the same paragraph says "fifteen of **the twenty-two** packs" (that one is correct: `grep -l '@role non-text' styles/tokens/*.css | wc -l` → `15`).
  - `SURFACE_COMPOSITION.md:63` — "The accent is `--accent` in **eighteen**, `--brand` in `field-notes` and `--cta` in `orchard`". Computed: 20 packs declare `--accent`, 1 `--brand`, 1 `--cta`.
  - `SURFACE_COMPOSITION.md:91` — "| Surfaces | `--bg` for light, the pack's dark field for dark | resolves in **all twenty-one** |".
  - `plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md:77` — "Every one of **the fourteen** was extracted from a web reference" — while `:71` in the same file says "Nothing in **the twenty-two** packs states a value for this".
  - `README.md:139` — "token names are not uniform across **the thirteen**".
  - `plugins/sheleg-design/skills/sheleg-design/styles/tenor.md:325` — "token names are not uniform across **the twenty**".
  The gate cannot see any of these: `test/validate.py`'s `validate_counted_claims()` matches on the `COUNTED` pattern, which requires a noun (`"pack"`, `"kit"`, `"scenario"`, `"heading"`) after the numeral — a bare "the twenty-one" carries none. `npm test` is green with all six present.
- **Why it matters:** Five separate numbers (thirteen, fourteen, eighteen, twenty, twenty-one) are in print for one fact whose true value is twenty-two, two of them one paragraph away from the correct value. A reader who trusts "resolves in all twenty-one" has no way to know which pack was excluded, and the repo's own DOCMAP names "a count of anything" as a fact with a single derived home.
- **Fix:** Correct the six sites listed above in the canonical bundle plus `README.md`, mirror into `.cursor/skills/sheleg-design/`, then widen `COUNTED` in `test/validate.py` to also match a bare numeral preceded by `the |across |in |all ` when the surrounding sentence is inside a file already in `validate_counted_claims()`'s `sources` list, with a planted-defect fixture in `--self-test`.
- **Blast:** 3
- **Effort:** 2

## F-sheleg-design-03 — the installer's post-install banner names 17 of 22 packs, and the gate written for exactly that surface passes it
- **Dimension:** hooks
- **Severity:** major
- **Evidence:** `bin/cli.js:350`:
  ```
  `  ${c("dim", "styles/")}             style packs + token CSS (instrument-console / editorial-luxury / workbench / briefing-room / atrium / orchard / field-notes / cyclorama / showroom / blueprint / prism / maquette / scoreboard / datasheet / manpage / pigeonhole / roster)\n\n`
  ```
  Missing: `ora`, `tenor`, `paperclip`, `ledger`, `awning`. Reproduced live — `node bin/cli.js --dir ./out` printed that exact 17-name list, while `ls out/styles/tokens | wc -l` is 22. `bin/cli.js --help` (the "What it installs" block, line 228 onward) correctly names all twenty-two, which is why `test/validate.py`'s `ENUMERATION_SITES` entry `("bin/cli.js", "the installer's help and banner")` passes: `validate_pack_enumerations()` searches the whole file text, so a pack named anywhere in `cli.js` satisfies the check for every list in it.
- **Why it matters:** This string is the last thing a `npx sheleg-design-skill` user reads, and it is the inventory they will believe. Five packs — including the two newest — are invisible at the moment of install. The check whose declared purpose is "a pack absent here cannot be chosen here" is file-scoped and cannot distinguish the banner from the help.
- **Fix:** Derive the banner list in `bin/cli.js` from the same source the help uses (or from the installed `styles/tokens/` directory) instead of a literal, and split the `ENUMERATION_SITES` entry for `bin/cli.js` so the help block and the banner block are each matched separately in `test/validate.py`.
- **Blast:** 3
- **Effort:** 1

## F-sheleg-design-04 — SKILL.md body is ~6203 tokens against a <5000 budget, 24% over, with 1539 tokens sitting in five sections whose content has a single home elsewhere
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `plugins/sheleg-design/skills/sheleg-design/SKILL.md` — front matter lines 1-7, body lines 8-352, 24193 chars → 6203 tokens at 3.9 chars/token. Section-by-section (measured by splitting on `^#{1,3} ` outside fenced blocks):

  | Lines | Chars | Tok | Heading | Verdict |
  |---|---|---|---|---|
  | 9-10 | 16 | 4 | `# SHELEG Design` | keep |
  | 11-30 | 1121 | 287 | `## Overview` | keep |
  | 31-45 | 909 | 233 | `## When to Use` | keep |
  | 46-59 | 822 | 211 | `## Core Pattern — five principles, in order` | keep |
  | 60-119 | 8357 | 2143 | `## Style packs` | **trim** — the "Choose for" column restates each pack's own opening description; line 64 already says "this table is for choosing, not for reading instead of the pack" |
  | 120-135 | 731 | 187 | `## Calibration — three dials` | keep |
  | 136-156 | 1173 | 301 | `### Reading them off the brief` | keep |
  | 157-187 | 2181 | 559 | `### How they bind` | **split** → a `CALIBRATION.md` reference; needed only after a pack is chosen |
  | 188-205 | 982 | 252 | `## The craft bar — what "done" means, in order` | keep |
  | 206-221 | 1009 | 259 | `## Load on demand — three things the pack layer does not decide` | keep |
  | 222-243 | 1093 | 280 | `## Choosing between packs — mount them, don't imagine them` | keep |
  | 244-259 | 855 | 219 | `## AI-driven product surfaces` | **trim** — `AI_PRODUCT_PATTERNS.md` is the single home (`docs/DOCMAP.md:29`) |
  | 260-273 | 798 | 205 | `## Optional — Figma (design ↔ code)` | **trim** — `FIGMA_BRIDGE.md` is the single home (`docs/DOCMAP.md:27`) |
  | 274-293 | 934 | 239 | `## Optional — Claude Design (design-sync)` | **trim** — `DESIGN_SYNC_BRIDGE.md` is the single home (`docs/DOCMAP.md:28`) |
  | 294-313 | 1229 | 315 | `## Optional — real-world references (Lazyweb, Mobbin, Refero)` | **trim** — `MOBILE_SURFACES.md:87-88` states "The full rule is `DESIGN_SYNC_BRIDGE.md` §4" |
  | 314-328 | 849 | 218 | `## How to Apply` | keep |
  | 329-335 | 256 | 66 | `## Common Mistakes` | keep |
  | 336-352 | 860 | 221 | `### Three looks that are defaults, not decisions` | **split** → `SHELEG_DESIGN.md`; it is craft detail, not routing |

  **Named set that lands it under 4750:** split `### How they bind` (559) and `### Three looks that are defaults, not decisions` (221), and reduce the three `## Optional —` sections plus `## AI-driven product surfaces` to one-line pointers at their declared single homes (205 + 239 + 315 + 219 = 978). Total removed 1758 → **4445 tokens**, 305 under budget, without touching the pack routing table. Trimming the "Choose for" column of `## Style packs` alone would also clear it, but costs routing precision that the split above does not.
- **Why it matters:** Every session that loads this skill pays 6203 tokens before any work starts, and four of the over-budget sections restate material the same bundle already carries in a file the agent is told to load on demand. The repo has no gate on body size, so the number only moves when someone measures it.
- **Fix:** Apply the split/trim set above to `plugins/sheleg-design/skills/sheleg-design/SKILL.md`, mirror to `.cursor/skills/sheleg-design/SKILL.md`, add the new reference to `install.sh`'s file list, the README install table and `docs/DOCMAP.md`'s propagation matrix, and add a body-token ratchet to `test/validate.py` with its floor in `test/floors.json`.
- **Blast:** 3
- **Effort:** 2

## F-sheleg-design-05 — the description is 1021 of 1024 characters, so the next routed trigger cannot be advertised and the B-54 invariant cannot be satisfied
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `plugins/sheleg-design/skills/sheleg-design/SKILL.md:3` — `len(description)` = **1021**, cap 1024, three characters free. Split measured: prose half 519 chars, `Triggers - …` half 502 chars. `lib/triggers.js` routes **32** triggers here and `test/advertised_check.js` requires each verbatim (`node test/advertised_check.js --member sheleg-design --root skills/sheleg-design` → `ok: sheleg-design advertises all 32 routed trigger(s) across 1 skill(s)`, exit 0). A new `"phrase" / "фраза", ` pair costs ~25-35 chars, so any 33rd trigger fails the check on arrival. The routing table already records this squeeze: `lib/triggers.js:96-97` — "`design a landing` replaces `cinematic landing`, and **replaces rather than joins** it because the description has 6 characters of budget left."
- **What has to come out (measured, not proposed blind):** the prose sentence `And the Figma border — tokens as variables, a design without raw values. ` (73 chars, `SKILL.md:3`). Removing it leaves **948/1024** and breaks **no** routed trigger — verified by re-running the substring test over all 32 after the removal — because `figma variables` and `фигма в код` already live in the `Triggers -` half as `"figma variables" / "переменные фигмы, фигма в код"`. That frees 76 characters, roughly two more trigger pairs. Two lower-value alternatives, both also trigger-safe: `Design tokens, light/dark themes, palettes and colours, typography and fonts. ` (78 chars — every term in it is already a listed trigger) and ` and when such a page feels busy or its motion layers drift apart.` (66 chars).
- **Why it matters:** The member releases before the umbrella re-pins, so a trigger added upstream lands on a description with no room for it, and the member's own gate then fails on a green tree — the same shape as B-54, only with no legal fix available inside the cap.
- **Fix:** Delete the Figma prose sentence from `description` in `plugins/sheleg-design/skills/sheleg-design/SKILL.md:3` and its `.cursor/` mirror, and add a headroom check to `test/validate.py` that fails below ~970 chars rather than at the 1024 hard cap.
- **Blast:** 2
- **Effort:** 1

## F-sheleg-design-06 — the routing table's own comment says `сделай лендинг` reaches nothing, twelve lines below the entry that routes it
- **Dimension:** triggers
- **Severity:** major
- **Evidence:** `/Users/sshlg/DATA/sshlg-skills/lib/triggers.js:115` lists `'сделай лендинг', 'build a landing page',` in the `sheleg-design` route. `lib/triggers.js:137-140`, inside the same array, reads: "The unqualified `сделай лендинг` reaches nothing, and is left that way on purpose — see B-57. Routing it would need `лендинг` advertised by two more skills, and the operator who says only "a landing" has named no craft for the hook to point at." Measured against the live matcher:
  ```
  $ node -e "const t=require('./lib/triggers.js'); for (const q of ['сделай лендинг','build a landing page']) console.log(JSON.stringify(q),'->',JSON.stringify(t.match(q)))"
  "сделай лендинг" -> ["sheleg-design","copywriting"]
  "build a landing page" -> ["sheleg-design","copywriting"]
  ```
  The member's own `CHANGELOG.md:7-20` (the 1.37.5 entry) documents the opposite of the comment: "Both phrases now reach `sheleg-design` and `copywriting` together."
- **Why it matters:** This is the file the hook itself calls and the file `test/advertised_check.js` reads; the comment is the only prose explaining *why* each entry exists. A future run reading it will re-remove a trigger that B-57 deliberately added, exactly reversing the fix, and the gate will stay green in both directions.
- **Fix:** Delete or rewrite `lib/triggers.js:137-140` to state the resolved B-57 position (routed to both crafts as verb phrases, bare `лендинг` still excluded and why). Note the paragraph immediately above it, `:127-136`, already states the correct outcome — the stale block is a leftover from the pre-B-57 draft.
- **Blast:** 1
- **Effort:** 1

## F-sheleg-design-07 — `CHANGELOG.md` documents 1.28.0 and 1.30.0 as releases that were never tagged and never published
- **Dimension:** version
- **Severity:** minor
- **Evidence:** reconciling the three registers (66 CHANGELOG headings, 56 git tags, 54 npm versions):
  ```
  in CHANGELOG, no tag AND no npm: ['0.5.0', '0.9.1', '1.4.0', '1.5.0', '1.28.0', '1.30.0']
  tagged, not in CHANGELOG: []
  on npm, not in CHANGELOG: []
  ```
  `git tag -l v1.28.0` and `git tag -l v1.30.0` are both empty; `npm view sheleg-design-skill@1.28.0` and `@1.30.0` both return nothing. `docs/DOCMAP.md:40` states the obligation for "**Any release**": "five-way version sync · CHANGELOG entry · tag · GitHub release · `npm publish` · refresh local installs".
- **Why it matters:** Six CHANGELOG sections describe versions that no user can install and no commit can be recovered from by tag. Anyone bisecting a regression between 1.27.1 and 1.29.0 has two documented versions with nothing behind them, and the propagation matrix that requires a tag has never been enforced by a check.
- **Fix:** Either tag the two commits retroactively (`git tag v1.28.0 <sha>`) or mark those CHANGELOG sections as never-released, and add a release-integrity check to `test/validate.py` that compares CHANGELOG version headings against `git tag` (skippable offline, disclosed rather than passed — the pattern `check_routed_triggers_still_advertised()` already uses).
- **Blast:** 1
- **Effort:** 1

## F-sheleg-design-08 — `CONTRIBUTING.md` describes the behavioral harness as T1–T19; it runs to T29
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `CONTRIBUTING.md:40` — "| `test/scenarios.md` | Behavioral harness (T1–T19) |". Actual: `grep -nE '^##+ T[0-9]+' test/scenarios.md | tail -1` → `1142:## T29 — The operator register, and the fork against the console`. `test/validate.py`'s `validate_counted_claims()` computes `"scenario": max(int(n) for n in re.findall(r"^##+ T(\d+)", scen))` = 29, but only checks strings of the form "N scenarios" — the range notation `T1–T19` matches nothing, so `npm test` is green.
- **Why it matters:** `CONTRIBUTING.md` is the file a contributor reads before touching a pack, and step 7 of "Adding a style pack" tells them to add a scenario. Ten scenarios — every one added since the ranges diverged, including the pack-fork scenarios T24–T29 — are invisible to a reader who trusts the layout table.
- **Fix:** Change `CONTRIBUTING.md:40` to derive the range or state T1–T29, and extend `validate_counted_claims()` to recognise the `T<N>–T<M>` range form against the same computed `scenario` truth it already has.
- **Blast:** 1
- **Effort:** 1

## F-sheleg-design-09 — `docs/DOCMAP.md` describes CI as "a fourteen-kit build matrix"; the matrix is derived and now runs 22
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `docs/DOCMAP.md:91` — "…`claude plugin validate --strict`, and a **fourteen-kit** build matrix." The workflow does not carry a typed list: `.github/workflows/validate.yml:97` — `packs=$(ls -1 kits | jq -R . | jq -sc .)`, consumed at `:107` as `matrix: pack: ${{ fromJSON(needs.discover-kits.outputs.packs) }}`. `ls -1 kits | wc -l` → `22`. The workflow's own comment at `:85-87` records why it was made derived: "the seventh kit proved it isn't: it was built, green and invisible to CI until someone noticed the matrix said six."
- **Why it matters:** DOCMAP is the file that says what proves what, and it now restates a number the CI deliberately stopped restating. The same paragraph is what an operator reads to decide whether CI covers a new kit.
- **Fix:** Replace "a fourteen-kit build matrix" in `docs/DOCMAP.md:91` with "a build matrix derived from `ls -1 kits`" — a phrasing that cannot go stale — and add `docs/DOCMAP.md` to a numeral sweep alongside the fix in F-sheleg-design-02.
- **Blast:** 1
- **Effort:** 1

## F-sheleg-design-10 — the README "What gets installed" table omits `MOBILE_SURFACES.md`, which every installer ships
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `grep -n MOBILE_SURFACES README.md` → no match (exit 1). The file is installed by both installers: `node bin/cli.js --dir ./out && ls out/` →
  ```
  AI_PRODUCT_PATTERNS.md  DESIGN_SYNC_BRIDGE.md  FIGMA_BRIDGE.md  MOBILE_SURFACES.md
  MOTION_DOCTRINE.md  SHELEG_DESIGN.md  SKILL.md  SURFACE_COMPOSITION.md  styles
  ```
  and `install.sh:14` lists `MOBILE_SURFACES.md` in its `for f in …` set. `README.md:133-146` ("### What gets installed") lists SKILL.md, SHELEG_DESIGN.md, SURFACE_COMPOSITION.md, MOTION_DOCTRINE.md, DESIGN_SYNC_BRIDGE.md, FIGMA_BRIDGE.md, AI_PRODUCT_PATTERNS.md, `styles/*.md`, `styles/tokens/*.css`, `styles/STYLE_PACK_TEMPLATE.md` — eight of nine bundle documents. `docs/DOCMAP.md:37` makes this an obligation: "**New file in the skill bundle** | add to `install.sh`'s `for f in …` list · mirror into `.cursor/…` · link it from `SKILL.md` … · **add it to the README install table**".
- **Why it matters:** A reader deciding whether the pack covers mobile surfaces gets no signal from the one table that enumerates what arrives, and the propagation row that exists to prevent this has no check behind it (`validate.py` verifies the `install.sh` list and the mirror, not the README table).
- **Fix:** Add the `MOBILE_SURFACES.md` row to `README.md`'s "What gets installed" table, and extend `test/validate.py`'s installer-sync check to also require every bundle `*.md` to appear in that table.
- **Blast:** 1
- **Effort:** 1

## F-sheleg-design-11 — the chart-ramp claim names two packs; three ship one
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-design/skills/sheleg-design/SURFACE_COMPOSITION.md:87` — "…or a validated `--chart-1…N` set added to the **token layer** in the same change. `field-notes` and `scoreboard` each ship one today". Computed:
  ```
  $ cd plugins/sheleg-design/skills/sheleg-design/styles/tokens && grep -l -- '--chart-1' *.css
  field-notes.css  ledger.css  scoreboard.css
  ```
  `ledger.css` declares `--chart-1` … `--chart-5`.
- **Why it matters:** An agent drawing a multi-series chart in `ledger` is told by this sentence that no sanctioned categorical set exists and is pushed toward small multiples or an invented palette, when the pack already ships a validated five-hue ramp.
- **Fix:** Update the sentence in `SURFACE_COMPOSITION.md` and its `.cursor/` mirror to name all three, and derive the list in `test/validate.py` from `grep -l -- '--chart-1' styles/tokens/*.css` so it cannot drift again.
- **Blast:** 2
- **Effort:** 1

## F-sheleg-design-12 — 27 of 29 shipped reference documents over 100 lines carry no `## Contents`
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** Only `MOBILE_SURFACES.md` and `SURFACE_COMPOSITION.md` have one (`grep -l '^## Contents' plugins/sheleg-design/skills/sheleg-design/*.md plugins/sheleg-design/skills/sheleg-design/styles/*.md`). Without one, at these sizes: `SHELEG_DESIGN.md` 708 lines, `styles/paperclip.md` 784, `styles/tenor.md` 658, `styles/datasheet.md` 544, `styles/ora.md` 536, `styles/pigeonhole.md` 532, `styles/manpage.md` 476, `styles/field-notes.md` 453, `styles/roster.md` 429, `styles/scoreboard.md` 429, `styles/cyclorama.md` 426, `styles/ledger.md` 387, `styles/blueprint.md` 374, `styles/showroom.md` 370, `styles/maquette.md` 331, `styles/atrium.md` 317, `styles/prism.md` 307, `styles/awning.md` 298, `styles/orchard.md` 276, `MOTION_DOCTRINE.md` 270, `styles/workbench.md` 220, `styles/STYLE_PACK_TEMPLATE.md` 204, `DESIGN_SYNC_BRIDGE.md` 198, `AI_PRODUCT_PATTERNS.md` 193, `styles/briefing-room.md` 172, `styles/editorial-luxury.md` 169, `styles/instrument-console.md` 167, plus `SKILL.md` itself at 351.
- **Why it matters:** `SKILL.md`'s "Load on demand" section names `SHELEG_DESIGN.md` and `MOTION_DOCTRINE.md` as on-demand loads; an agent that cannot see a section list must read the whole file to find the one section it needs — 708 lines for the first of them. The two files that do carry `## Contents` show the repo already accepts the convention.
- **Fix:** Add a `## Contents` block to each bundle `*.md` over 100 lines (the pack files share the thirteen-heading contract, so theirs can be generated), mirror into `.cursor/skills/sheleg-design/`, and add the line-count-plus-`## Contents` assertion to `test/validate.py`.
- **Blast:** 2
- **Effort:** 2

## F-sheleg-design-13 — `graphify-out/GRAPH_REPORT.md` names a build commit 14 behind HEAD while the graph beside it was built 1 behind
- **Dimension:** graph
- **Severity:** minor
- **Evidence:** `graphify-out/graph.json` → `built_at_commit = 'de09f9e18dbe5df8dec76580c173dd00b5e7342e'`; `git rev-list --count de09f9e..HEAD` → **1**. `graphify-out/GRAPH_REPORT.md:13` → "- Built from commit: `8dc62935`"; `git rev-list --count 8dc62935..HEAD` → **14** (`8dc6293 docs(evidence): P-17 closes — released as 1.31.0…`). The report was not regenerated with the graph: `graph.json` mtime `Aug 16 18:28`, `GRAPH_REPORT.md` mtime `Aug 15 16:41`. `graphify-out/cost.json` is likewise stale — it records a single run dated `2026-08-08T01:56:56` with `files: 269`, while `manifest.json` now tracks the 08-16 rebuild. `graphify-out/` is gitignored (`.gitignore:17-18`, `git ls-files graphify-out | wc -l` → 0), so this is local operator state, not shipped.
  On the umbrella's v0.79.0 claims: "sheleg-design 12" (CHANGELOG.md:7, cross-checked at CHANGELOG.md:291 as measured 2026-08-16) is consistent with the pre-rebuild graph at `8dc62935`, which was 12 behind that day's HEAD and is 14 behind now. "every one now sits at HEAD" is accurate as of the rebuild; the member has since taken one commit (`15c9ba1`), which the umbrella's own doctrine at CHANGELOG.md:297 pre-concedes ("a graph is behind the moment the next commit lands").
- **Why it matters:** `GRAPH_REPORT.md:14` instructs the reader to "Run `git rev-parse HEAD` and compare" against the number printed one line above it. Following that instruction here returns 14 and reads as a badly stale graph, when the graph is one commit old — the doctrine this pack quotes is "a wrong doc gets argued with, a wrong graph gets believed", and this is the report about the graph being wrong.
- **Fix:** Regenerate `GRAPH_REPORT.md` and `cost.json` whenever `graph.json` is rebuilt, or have the umbrella's `test/graph_staleness.py` read `built_at_commit` from `graph.json` only and state in its output that `GRAPH_REPORT.md` is not authoritative for the build commit.
- **Blast:** 2
- **Effort:** 1

## F-sheleg-design-14 — the machine's cheap shadow check structurally cannot detect a plain copy shadowing this plugin
- **Dimension:** install
- **Severity:** minor
- **Evidence:** The check in `/Users/sshlg/CLAUDE.md` and `~/.claude/CLAUDE.md` is `for d in ~/.claude/skills/*/; do n=$(basename "$d"); [ -e ~/.claude/plugins/marketplaces/"$n" ] && echo "SHADOW: $n"; done`. For this member `n` would be `sheleg-design`, and `[ -e ~/.claude/plugins/marketplaces/sheleg-design ]` is **false** — the marketplace directory is `sheleg-design-skill` (`ls ~/.claude/plugins/marketplaces/ | grep -i sheleg` → `sheleg-design-skill`, `sheleg-dev`). So a plain copy at `~/.claude/skills/sheleg-design/` would be reported as clean. **No shadow exists today** (`[ -e ~/.claude/skills/sheleg-design ]` → false; the cheap check prints nothing). Installed state is otherwise correct and matches source: `installed_plugins.json` → `sheleg-design@sheleg-design-skill` version `1.37.5`, `gitCommitSha de09f9e…`; `enabledPlugins` → `true`; `~/.agents/skills/sheleg-design/SKILL.md` → `version: 1.37.5`; hub symlinked from `~/.kiro/skills` and `~/.openclaw/skills`.
- **Why it matters:** This is the exact trap `~/CLAUDE.md` warns about ("it **under-reports** — a skill shadows when its own name collides, and plugin and marketplace names differ often (`sheleg-design` ships from `sheleg-design-skill`)"), but the cheap one-liner is the version pasted into both CLAUDE.md files and the one an operator will actually run. A bare `npx skills update sheleg-design` would create the copy and the check would stay silent.
- **Fix:** Replace the cheap loop in `~/CLAUDE.md` and `~/.claude/CLAUDE.md` with the python block already in `~/CLAUDE.md`'s skill-ecosystem section, which compares against the skill names each enabled plugin provides rather than against marketplace directory names.
- **Blast:** 2
- **Effort:** 1

## F-sheleg-design-15 — the 1.37.x tags are lightweight while 1.36.x are annotated, so `git submodule status` reports this member as v1.36.1
- **Dimension:** version
- **Severity:** minor
- **Evidence:** All version homes agree at **1.37.5**: `package.json`, `plugins/sheleg-design/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `SKILL.md:6` `metadata.version`, `CHANGELOG.md:7` top heading, newest tag `v1.37.5`, umbrella `skills.json` pin, umbrella `README.md:40`, and npm (`npm view sheleg-design-skill version` → `1.37.5`). The `.cursor/` mirror is byte-identical to the plugin bundle (`diff -rq plugins/sheleg-design/skills/sheleg-design .cursor/skills/sheleg-design` → no output; enforced by `validate.py`'s mirror comparison "in both directions", per `CONTRIBUTING.md:43-45`). Two residues:
  - Tag object types: `for t in $(git tag --sort=-v:refname | head -8); do git cat-file -t $t; done` → `v1.37.5 … v1.37.0` all `commit` (lightweight), `v1.36.1` and `v1.36.0` `tag` (annotated). Consequence: `git submodule status skills/sheleg-design` from the umbrella prints `+15c9ba1… skills/sheleg-design (v1.36.1-7-g15c9ba1)` — `git describe` without `--tags` sees only annotated tags — while `git describe --tags` in the member returns `v1.37.5-1-g15c9ba1`.
  - HEAD **is** ahead of the newest tag by one commit: `15c9ba1 chore: gitignore .env — a live key sat unignored in a sibling repo`, untagged and unpublished. The umbrella's recorded submodule pointer is still `de09f9e` (`git ls-tree HEAD skills/sheleg-design`), which is the `M skills/sheleg-design` in the umbrella's working tree.
- **Why it matters:** The one command an operator runs at the umbrella to see which member commit is pinned reports a version two minor releases stale. Nothing in the repo is wrong; the reading instrument is.
- **Fix:** Tag releases with `git tag -a` (update the release step in `CONTRIBUTING.md:96-106`), and optionally re-tag `v1.37.0`–`v1.37.5` as annotated. Commit the umbrella submodule bump to `15c9ba1` or tag that commit.
- **Blast:** 1
- **Effort:** 1

TOTAL: 15 findings (0 blocker, 6 major, 9 minor)
