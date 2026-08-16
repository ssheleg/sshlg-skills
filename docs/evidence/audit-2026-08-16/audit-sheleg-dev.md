# Audit — sheleg-dev v0.5.2 (read-only), 2026-08-16
Gate green (`npm test` → exit 0). 17 findings: 6 major, 11 minor, 0 blocker.

## F-sheleg-dev-01 — `meta-linkedin.md` is truncated: it promises the CAPI `event_id` deduplication contract and contains none of it
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `plugins/sheleg-dev/skills/ad-tracking/references/meta-linkedin.md:3` — "**Load this when** … advanced matching with hashed identifiers **and what must never be sent**, and **deduplication against the Conversions API**"; `:14` — "- [Everything below](#) — LinkedIn conversion detail, deduplication with CAPI". The file is 105 lines (`wc -l` → `105`) and ends at line 104 with a bare `---`. `grep -rn "event_id\|deduplicat\|dedup" plugins/sheleg-dev/skills/ad-tracking/references/meta-linkedin.md` returns only lines 3 and 14 — the two promises, no content. `grep -rn "Conversions API\|CAPI"` over the whole pack returns 6 hits, none of them a contract. The `Firing Events` section (`:31-45`) has no consent gate, and `Advanced Matching` (`:47-76`) never says what must never be sent. `plugins/sheleg-dev/skills/ad-tracking/SKILL.md:237-241` routes the reader here: "Read `references/meta-linkedin.md` for … advanced matching (hashed identifiers, and what must never be sent) and CAPI deduplication." The whole pack's statement of the contract is one clause at `ad-tracking/SKILL.md:319` — "must carry the SAME `event_id` / `transaction_id`". Verified against the vendor (WebFetch, https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events): Meta requires **both** `event_id` **and** `event_name` to match across pixel and server, within a **48-hour** window; the alternative method matches `event_name` + `fbp`/`external_id` and only discards server events when a browser event arrived first. None of that — not the `event_name` requirement, not the 48-hour window — appears anywhere in the pack. `[Everything below](#)` is also a dead in-document anchor (one of two in the pack).
- **Why it matters:** This skill exists to stop a purchase being counted twice. An agent following the SKILL.md link lands on a file that says the contract is "below", finds nothing, and ships browser+server purchase events that dedupe on `event_id` alone — which silently double-counts revenue whenever `event_name` differs between the two sides, and never dedupes at all past 48 hours.
- **Fix:** Write the missing sections into `plugins/sheleg-dev/skills/ad-tracking/references/meta-linkedin.md`: a `## Deduplication with the Conversions API` section stating the `event_id` + `event_name` pair and the 48-hour window, a `## LinkedIn conversion tracking` section, the consent gate on the firing wrapper, and the "never send" list for advanced matching. Replace the `[Everything below](#)` Contents row with real anchors. Add a validator check that every bolded promise in a reference's `Load this when` line has a matching `##` heading in that file.
- **Blast:** 3 = a user of the pack
- **Effort:** 2 = a session

## F-sheleg-dev-02 — two SKILL.md bodies are over the 5000-token budget, and one of them claims in its own text that the tables live in `references/`
- **Dimension:** budget
- **Severity:** major
- **Evidence:** measured (chars ÷ 3.9): `ad-tracking/SKILL.md` body 20565 chars ≈ **5273 tok**; `stripe-billing/SKILL.md` body 20933 chars ≈ **5367 tok**; both against < 5000. The other four are clear: crypto-payments 14677/≈3763, google-auth 8220/≈2108, frontend-performance 7996/≈2050, google-signin 5855/≈1501. `ad-tracking/SKILL.md:24-26` states "The body carries the minimal setup and the traps; the tables, schemas and per-framework wiring live in `references/`" — the body still carries five tables (`:225-235`, `:276-281`, `:387-393`, `:422-432`, `:289-294`). Section maps below (line ranges are 1-indexed in the file, chars measured per section).

  **`ad-tracking/SKILL.md`** — needs ≥ 2040 chars (≈523 tok) removed to reach 4750.

  | lines | heading | chars | tok | verdict |
  |---|---|---|---|---|
  | 16-21 | `# Advertising Analytics & Conversion Tracking Integration` | 303 | 78 | keep |
  | 22-26 | `## What this skill covers` | 248 | 64 | keep |
  | 27-55 | `## Architecture Overview` | 1625 | 417 | **trim** — the ASCII diagram plus "Key principle" restates `## Consent` (56-78) |
  | 56-78 | `## Consent` | 965 | 247 | keep |
  | 79-80 | `## Google Analytics 4` | 22 | 6 | keep |
  | 81-117 | `### Setup` | 984 | 252 | **trim** — the consent-default snippet duplicates the 5-step order at 64-70 |
  | 118-129 | `### Commands and events` | 614 | 157 | keep |
  | 130-142 | `### SPA Page Tracking` | 706 | 181 | **trim** — restates 126-129 |
  | 143-144 | `## Google Ads Conversion Tracking` | 34 | 9 | keep |
  | 145-155 | `### Architecture` | 345 | 88 | keep |
  | 156-171 | `### Enhanced Conversions` | 502 | 129 | **split** → `references/gtag-api.md` |
  | 172-182 | `### user_id (Cross-Device Tracking)` | 268 | 69 | **split** → `references/gtag-api.md` |
  | 183-186 | `### gclid Preservation Through External Redirects` | 282 | 72 | keep |
  | 187-193 | `### Google Ads console setup` | 348 | 89 | keep |
  | 194-195 | `## Meta (Facebook) Pixel` | 25 | 6 | keep |
  | 196-220 | `### Setup` | 770 | 197 | keep |
  | 221-236 | `### Standard Events` | 1060 | 272 | **split** → `references/meta-linkedin.md` (which already advertises "the parameter object per standard event") |
  | 237-241 | `### Deeper Meta and LinkedIn detail` | 219 | 56 | keep |
  | 242-243 | `## LinkedIn Insight Tag` | 24 | 6 | keep |
  | 244-255 | `### Setup` | 420 | 108 | **split** → `references/meta-linkedin.md` |
  | 256-271 | `### Conversion Tracking` | 693 | 178 | **split** → `references/meta-linkedin.md` |
  | 272-273 | `## User Identification` | 23 | 6 | keep (header) |
  | 274-287 | `### Cross-Platform Identification Strategy` | 944 | 242 | **split** — a 4-row platform table |
  | 288-292 | `### Alias vs Identify (Mixpanel)` | 318 | 82 | **split** |
  | 293-306 | `### Timing` | 255 | 65 | **split** |
  | 307-311 | `## Event naming` | 207 | 53 | keep |
  | 312-351 | `## E-commerce` | 2337 | 599 | keep — the webhook-is-the-source doctrine is this skill's own |
  | 352-360 | `## Content Security Policy` | 398 | 102 | keep |
  | 361-374 | `## Next.js` | 663 | 170 | keep |
  | 375-376 | `## UTM Attribution` | 19 | 5 | keep (header) |
  | 377-384 | `### Capture Flow` | 436 | 112 | **split** |
  | 385-394 | `### UTM Parameters` | 376 | 96 | **split** — a 5-row parameter table |
  | 395-405 | `### gclid / fbclid / li_fat_id` | 413 | 106 | **split** |
  | 406-417 | `## Verification` | 600 | 154 | keep |
  | 418-419 | `## Troubleshooting` | 19 | 5 | keep (header) |
  | 420-433 | `### Common Issues` | 1248 | 320 | **split** → `references/performance-security.md` → Debug & Testing |
  | 434-447 | `### Debug Mode` | 246 | 63 | **trim** — duplicates the "Events firing on localhost" row at 432 |
  | 448-456 | `## Official documentation` | 584 | 150 | keep |
  | 457-473 | `## Deep references` | 983 | 252 | keep |

  Minimum set that lands under 4750: split `### Standard Events` (1060) + `### Common Issues` (1248) → 18257 chars ≈ **4681 tok**. Recommended set (adds the three `## User Identification` subsections, 1517, and the three `## UTM Attribution` subsections, 1225) → 15515 chars ≈ **3978 tok**.

  **`stripe-billing/SKILL.md`** — needs ≥ 2408 chars (≈617 tok) removed to reach 4750.

  | lines | heading | chars | tok | verdict |
  |---|---|---|---|---|
  | 20-49 | `# Stripe billing` | 1905 | 488 | keep — thesis + the six-row reference index |
  | 50-79 | `## Start with Stripe's own tooling` | 1371 | 352 | **split** — every command in it is already in `references/stripe-agent-toolchain.md:32-74`, which line 41 already links |
  | 80-105 | `## The two ledgers` | 1149 | 295 | keep |
  | 106-132 | `## The client` | 961 | 246 | keep |
  | 133-152 | `## Products, prices, two modes` | 1004 | 257 | keep |
  | 153-177 | `## Get-or-create customer is a race` | 825 | 212 | keep |
  | 178-217 | `## Checkout session` | 1814 | 465 | keep |
  | 218-265 | `## The webhook is the payment` | 1914 | 491 | keep |
  | 266-283 | `## The redirect proves a browser` | 830 | 213 | keep |
  | 284-310 | `## Renewal: billing_reason decides` | 1148 | 294 | keep |
  | 311-336 | `## Seats and proration` | 1158 | 297 | keep |
  | 337-350 | `## Cancellation` | 685 | 176 | keep |
  | 351-376 | `## Refunds arrive cumulative` | 1029 | 264 | keep |
  | 377-398 | `## Reconciliation` | 1025 | 263 | keep |
  | 399-421 | `## Depending on one provider` | 1244 | 319 | **split** — `references/provider-concentration.md` exists for exactly this and the section closes by pointing at it (`:417-418`) |
  | 422-440 | `## Local development` | 608 | 156 | **split** → `references/testing-and-local-dev.md` |
  | 441-449 | `## Test matrix` | 340 | 87 | **split** → `references/testing-and-local-dev.md` (the section is already only a pointer) |
  | 450-467 | `## Security checklist` | 970 | 249 | **trim** — 13 boxes, every one restating a rule stated in its own section above or in `stripe-agent-toolchain.md:144-158` |
  | 468-483 | `## Common pitfalls` | 934 | 239 | **trim** — 11 rows, every one a second index of a rule already given |

  Minimum set that lands under 4750: split `## Start with Stripe's own tooling` (1371) + trim `## Security checklist` (970) + `## Common pitfalls` (934) → 17658 chars ≈ **4528 tok**. Alternative: split `## Depending on one provider` + `## Local development` + `## Test matrix` (2192) + trim `## Common pitfalls` (934) → 17807 chars ≈ **4566 tok**.

  **Descriptions against the 970 working limit** (measured with the validator's own `scalar()` folding): stripe-billing 967 (**headroom 3**), crypto-payments 884 (86), google-auth 877 (93), ad-tracking 859 (111), frontend-performance 841 (129), google-signin 821 (149).
- **Why it matters:** Both over-budget bodies are the two money skills. Every session that touches Stripe or ad tracking pays ~5.3k tokens before any work starts, and the budget's purpose — keep the body a set of seams and push tables into on-demand references — is already stated in `ad-tracking/SKILL.md:24-26` and contradicted by the same file.
- **Fix:** Move the sections marked **split** into the named `references/` files (each already linked, so the validator's both-directions check stays green) and delete the sections marked **trim**. Add a token-budget check to `test/validate.py` so the ceiling is enforced rather than audited.
- **Blast:** 3 = a user of the pack
- **Effort:** 2 = a session

## F-sheleg-dev-03 — the verification ledger records the shipped state as v0.5.0; two releases have shipped since
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `docs/evidence/verification.md:18` — "## Shipped state — v0.5.0, `main` at `67084bf`"; `:20` — "Released: `@ssheleg/sheleg-dev@0.5.0` (npm), tag `v0.5.0`"; REQ 003 (`:30`) asserts "all four → `0.5.0`"; REQ 009 asserts `npm view … version` → `0.5.0`; REQ 010 asserts "`v0.5.0`, `v0.4.3` — newest tag matches the shipped version". Measured now: `npm view @ssheleg/sheleg-dev version` → `0.5.2`; `git tag --sort=-v:refname | head -5` → `v0.5.2 v0.5.1 v0.5.0 v0.4.3 v0.4.2`; all four version files → `0.5.2`. `grep -n '^#\{1,3\} ' docs/evidence/verification.md` shows three headings and no v0.5.1 or v0.5.2 section (file is 55 lines). `git log --oneline -3 -- docs/evidence/verification.md` → last touched at `2774bf7`, three commits ago; v0.5.1 (`5a08ef3`) and v0.5.2 (`7fa46a6`) shipped without a row. The file's own rule (`:3-5`): "A row sits at `never` until somebody has watched its check pass on the **shipped** artifact."
- **Why it matters:** This is the repository's evidence ledger and its purpose (stated at `:6-9`, citing board row B-30) is that "an absent ledger and a clean one are indistinguishable". A ledger describing an artifact nobody ships is worse than absent: it reads green for a version that no longer exists.
- **Fix:** Add a `## Shipped state — v0.5.2, main at <sha>` section to `docs/evidence/verification.md` with the ten REQ rows re-measured against v0.5.2, and gate the release on the ledger's top heading matching `package.json`'s version — the same four-way check `test/validate.py` already performs, extended to this file.
- **Blast:** 2 = the operator of this machine
- **Effort:** 1 = under an hour

## F-sheleg-dev-04 — three documents say CI runs "eight negative self-tests"; it runs nine, and the ninth arrived in the same commit that restated eight
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `grep -c 'Negative self-test' .github/workflows/validate.yml` → `9`, at lines 30, 53, 78, 104, 124, 144, 156, 168, 181. Against that: `CONTRIBUTING.md:84` "CI runs the same validator plus **eight** negative self-tests"; `CHANGELOG.md:23` "and the **eight** negative self-tests CI really runs"; `docs/evidence/verification.md:53` "**The eight negatives**, one by one, locally", and REQ-002 (`:29`) records "**8 of 8 `success`**, 0 failed steps in the run". `git log --oneline -S'CONTRIBUTING routing to a file we do not have must fail' -- .github/workflows/validate.yml` → `7fa46a6 docs: CONTRIBUTING described a different repository (B-47)` — the commit that added the ninth self-test is the same commit that rewrote CONTRIBUTING.md and wrote the CHANGELOG entry, both saying eight.
- **Why it matters:** The v0.5.2 CHANGELOG entry exists precisely because a document restated a sibling's facts without checking them; it made the same class of error one paragraph later. REQ-002's "8 of 8" now reads as a full pass over a suite that has nine members, so a self-test that silently stopped running would leave the ledger still saying 8 of 8.
- **Fix:** Correct the count in `CONTRIBUTING.md:84`, `CHANGELOG.md:23` and `docs/evidence/verification.md:53` and re-measure REQ-002. Better: stop restating it — have `test/validate.py` count `Negative self-test` steps in `validate.yml` and fail when a document's number disagrees, the same shape as the existing `check_release_gates_on_validate()` guard.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-05 — the shipped installer writes the plain copies that shadow the plugin, and the README offers it beside the plugin with no warning
- **Dimension:** install
- **Severity:** major
- **Evidence:** `bin/sheleg-dev.js:5` — "Installs every sheleg-dev skill into ~/.claude/skills/<name>"; `:91` — `path.join(home, '.claude', 'skills', name)`. `install.sh:2` — "Install every sheleg-dev skill into ~/.claude/skills/<name>"; `:8` `DEST_ROOT="${HOME}/.claude/skills"`; `:21-22` `rm -rf "$dest"; cp -R "$dir" "$dest"`. `README.md:69-80` lists "**Claude Code plugin** (recommended): `/plugin install sheleg-dev@sheleg-dev`" and immediately below "**npm installer** — copies all six skills into `~/.claude/skills/`: `npx @ssheleg/sheleg-dev`", with no note that running the second after the first freezes all six. The umbrella one directory up treats this as a named invariant: `/Users/sshlg/DATA/sshlg-skills/CLAUDE.md` — "A plain copy under `~/.claude/skills/<id>` shadows the plugin of the same name and serves its frozen version forever. `install` and `update` prune those copies after every skills-CLI run" — and ships `lib/shadow.js`, `lib/hygiene.js` and `lib/plan.js` to detect and remove exactly them. Current machine state is clean (no `~/.claude/skills/{stripe-billing,crypto-payments,ad-tracking,google-signin,google-auth,frontend-performance}`), so this is the tool's behaviour, not present damage.
- **Why it matters:** A user who follows the README top to bottom installs the plugin and then runs the npm installer, and from then on gets whichever version was copied — forever, silently, with `/plugin update` appearing to work. The family built a whole module to clean this up after itself; this member's own installer creates it.
- **Fix:** In `bin/sheleg-dev.js` and `install.sh`, detect `~/.claude/plugins/cache/sheleg-dev` (or `installed_plugins.json`) and refuse with a message naming the plugin, or at minimum print the shadowing warning. In `README.md:76-80`, mark the npm installer as for agents that have no plugin channel and state the conflict.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

## F-sheleg-dev-06 — stripe-billing never mentions `billing_mode`, the flexible/classic split that changes the exact proration arithmetic it teaches
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `grep -rn "billing_mode\|flexible billing\|classic billing" plugins/sheleg-dev/skills/stripe-billing/` → no matches (SKILL.md and all six references). Verified against the vendor (`mcp__plugin_stripe_stripe__search_stripe_documentation`, docs.stripe.com/billing/subscriptions/billing-mode and .../billing-mode/compare): "**Flexible** (Recommended) … we recommend creating new subscriptions with flexible billing mode"; "You can't migrate a subscription from flexible billing mode to classic billing mode"; and the behaviour difference is precisely this skill's subject — "When an update to a subscription generates a credit proration, these prorations use the original debited amount instead of current subscription values. If the time period being credited was originally billed across multiple debits, Stripe generates **multiple credit prorations**"; discounts are applied proportionally rather than evenly, "result[ing] in more prorations". The skill's `## Seats and proration` (`SKILL.md:311-336`), `## Refunds arrive cumulative` (`:351-376`) and `references/subscription-lifecycle.md:136-186` all assume the classic single-proration shape.
- **Why it matters:** `billing_mode` is set at subscription creation, is one-way, and Stripe recommends the mode this skill does not know about. An integration built from this skill picks the mode by omission and then meets multiple credit prorations per period where the code expects one — in the refund clawback path, where a wrong number is money.
- **Fix:** Add a `billing_mode` decision to `plugins/sheleg-dev/skills/stripe-billing/SKILL.md` (a one-way choice made at `subscriptions.create` / checkout `subscription_data`) and a section in `references/subscription-lifecycle.md` covering multiple credit prorations and proportional discount application under flexible mode. Note in `SKILL.md:31-34` that the mode choice itself belongs to `stripe-best-practices`.
- **Blast:** 3 = a user of the pack
- **Effort:** 2 = a session

## F-sheleg-dev-07 — frontend-performance calls FCP, TBT and Speed Index "Core Web Vitals"; they are not
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-dev/skills/frontend-performance/SKILL.md:6-7` — "Covers Core Web Vitals (LCP, FCP, CLS, INP, TBT, Speed Index)"; `:28-37` heading "## Core Web Vitals Targets" over a six-row table including FCP, TBT and SI. Verified against the vendor (WebFetch, https://web.dev/articles/vitals): the Core Web Vitals are LCP, INP and CLS only; "FCP, TBT, and Speed Index are NOT Core Web Vitals … they are classified as supplemental Web Vitals." The metric set is otherwise current — FID appears nowhere in the pack (`grep -rn "FID\|First Input Delay"` → 0 hits outside the INP rows), and the thresholds at `:32-34` (LCP < 2.5s / 2.5-4.0 / > 4.0; INP < 200ms / 200-500 / > 500; CLS < 0.1 / 0.1-0.25 / > 0.25) match web.dev exactly.
- **Why it matters:** The description is what routes the skill; an agent asked "are my Core Web Vitals passing?" will be told a Speed Index of 4s is a failing Core Web Vital, which is not a thing Google ranks or reports.
- **Fix:** In `plugins/sheleg-dev/skills/frontend-performance/SKILL.md`, rewrite line 6-7 as "Core Web Vitals (LCP, INP, CLS) plus the Lighthouse diagnostics (FCP, TBT, Speed Index)" and retitle `## Core Web Vitals Targets` (`:28`) to separate the three from the three in the table.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

## F-sheleg-dev-08 — frontend-performance routes to five skills, four of which exist nowhere, and none of which is the family's own router
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-dev/skills/frontend-performance/SKILL.md:18` — "for visual design, see `frontend-design`; for conversion optimization, see `landing-page-design`"; `:141-147` "## Related Skills — `frontend-design`, `landing-page-design`, `next-best-practices`, `seo-audit`, `responsive-design`". Measured: `for n in frontend-design landing-page-design next-best-practices seo-audit responsive-design; do ls -d ~/.claude/skills/$n ~/.agents/skills/$n 2>/dev/null | wc -l; find ~/.claude/plugins -maxdepth 6 -type d -name "$n" | wc -l; done` → `landing-page-design 0/0`, `next-best-practices 0/0`, `seo-audit 0/0`, `responsive-design 0/0`; only `frontend-design` resolves, and to a third party (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design`). The family's own routers for those jobs are `sheleg-design` (visual), `super-ux` (conversion/flows) and `seo-aeo-audit` (SEO) — `/Users/sshlg/DATA/sshlg-skills/skills.json` `skillNames`. This is the only skill in the pack with dangling cross-references: `grep -rnoE '\`(stripe-best-practices|stripe-docs|stripe:upgrade-stripe)\`'` all resolve against `docs.stripe.com/.well-known/skills/index.json`, and the two intra-pack references (`ad-tracking/SKILL.md:350`, `:472`) resolve.
- **Why it matters:** Four of the five names send an agent looking for a skill that does not exist and cannot be installed; the one that resolves points away from the family's own visual router. `seo-audit` is one character-class away from the real `seo-aeo-audit`, so it reads as a typo nobody will question.
- **Fix:** In `plugins/sheleg-dev/skills/frontend-performance/SKILL.md:18` and `:141-147`, replace the five names with `sheleg-design`, `super-ux` and `seo-aeo-audit`, or delete the section. Extend `test/validate.py` to resolve backtick-quoted skill names against `skills.json` `skillNames` plus the pack's own six.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

## F-sheleg-dev-09 — ad-tracking's SKILL.md routes to `event-tracking.md` for two things that reference does not carry
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-dev/skills/ad-tracking/SKILL.md:120-124` — "Read `references/event-tracking.md` → **Recommended Events** for the GA4 names Google Ads can import (`sign_up`, `login`, `begin_checkout`, `purchase`, `generate_lead`, `view_item`) with their required parameters." `grep -rn "generate_lead" plugins/sheleg-dev/skills/` returns exactly one hit — that line. The reference's Recommended Events tables (`references/event-tracking.md:36-69`) list `login`, `sign_up`, `share`, `search`, the nine ecommerce events and three content events; `generate_lead` is absent. Second: `SKILL.md:309-311` — "GA4 reserves a set of names and silently drops events that collide with them; **the reference lists which**." The reference's whole treatment is `references/event-tracking.md:81` — "No reserved names: `ad_click`, `ad_impression`, `app_remove`, etc."
- **Why it matters:** Both are promises the reader spends a file read to discover are unkept, and the second is the more expensive one — an agent told the reserved-name list is one link away will not go and check GA4's actual list before naming an event that GA4 drops without an error.
- **Fix:** Add `generate_lead` (with `currency`, `value`) to the Recommended Events table in `plugins/sheleg-dev/skills/ad-tracking/references/event-tracking.md`, and replace the "etc." at `:81` with the full reserved-name set, or soften `SKILL.md:311` to point at Google's own list.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

## F-sheleg-dev-10 — eight reference files carry two tables of contents that disagree, and one of them links a section that no longer exists
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** Files with both a `## Contents` and a `## Table of Contents`: `ad-tracking/references/{gtag-api,consent-mode,performance-security,event-tracking}.md` and `google-auth/references/{oauth2-web-server,workload-identity,sign-in-with-google,adc-and-service-accounts}.md`. Six of the eight disagree — measured per file (entries only in `## Contents` → entries only in `## Table of Contents`): gtag-api 9 vs 13 (the second splits `Commands` into `config`/`event`/`set`/`get`/`consent`); performance-security 8 vs 6 (second omits `Next.js / React Integration`); oauth2-web-server 14 vs 12 (omits `Scopes Reference`); sign-in-with-google 13 vs 11 (omits `FedCM — mandatory, not a migration you are planning` and `Sign Out`, and adds `FedCM Migration`); workload-identity 11 vs 10; adc-and-service-accounts 11 vs 10; consent-mode 10 vs 8 (omits `Status check — 2026`, `URL Passthrough`, `Ads Data Redaction`). A GitHub-slug anchor check over all 26 markdown files finds exactly two dead in-document anchors, and one is here: `google-auth/references/sign-in-with-google.md:31` — `[FedCM Migration](#fedcm-migration)`, against the actual heading at `:561` `## FedCM — mandatory, not a migration you are planning`. Every `## Contents` list also carries a `- [Table of Contents](#table-of-contents)` row pointing at the second index.
- **Why it matters:** A reference over 100 lines is read through its index. Two indexes that disagree mean the reader following the stale one is told sections exist that do not (`FedCM Migration`) and never learns about the ones that do (`Status check — 2026`, `Ads Data Redaction`) — and the stale `FedCM Migration` name is the pre-cutover framing the correct section exists to refute.
- **Fix:** Delete the `## Table of Contents` block from all eight files, keep `## Contents`, and drop the self-referential `- [Table of Contents](#table-of-contents)` row. Add an anchor check to `test/validate.py`: every `](#…)` link must resolve to a heading in the same file.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-11 — HEAD is one commit ahead of v0.5.2, and the umbrella records the tag rather than HEAD
- **Dimension:** version
- **Severity:** minor
- **Evidence:** Everything agrees at 0.5.2: `package.json` `"version": "0.5.2"`, `plugins/sheleg-dev/.claude-plugin/plugin.json` `"version": "0.5.2"`, `.claude-plugin/marketplace.json` plugins[0] `"version": "0.5.2"`, `CHANGELOG.md:7` `## v0.5.2 — 2026-08-16`, `git tag --sort=-v:refname | head -5` → `v0.5.2 v0.5.1 v0.5.0 v0.4.3 v0.4.2`, umbrella `skills.json` sheleg-dev `"version": "0.5.2"`, umbrella `README.md:42` `| 0.5.2 |`, `npm view @ssheleg/sheleg-dev version` → `0.5.2`. Zero disagreements. But: `git describe --tags` → `v0.5.2-1-g2ac9f0e`; `git rev-list --count v0.5.2..HEAD` → `1` (`2ac9f0e chore: gitignore .env — a live key sat unignored in a sibling repo`). `git ls-tree HEAD skills/sheleg-dev` in the umbrella → `7fa46a6…` (= tag v0.5.2), while `git submodule status skills/sheleg-dev` → `+2ac9f0e…` — the working tree has moved past what the umbrella index pins, and the umbrella's own `git status` lists `M skills/sheleg-dev`.
- **Why it matters:** The unreleased commit is a `.gitignore` change only, so nothing user-facing is unpublished — but the family's release contract is that a checkout of any hub commit installs exactly what `skills.json` advertises, and the umbrella's index and its working tree currently point at different commits of this member.
- **Fix:** Either commit the umbrella's submodule pointer bump alongside the next member release, or tag the `.gitignore` commit as a patch. Nothing in the member itself needs to change.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-12 — the graph was built three commits ago; the umbrella's "every graph is now at HEAD" no longer holds here
- **Dimension:** graph
- **Severity:** minor
- **Evidence:** `graphify-out/GRAPH_REPORT.md:12-13` and `graphify-out/2026-08-16/GRAPH_REPORT.md:12-13` — "## Graph Freshness / - Built from commit: `2774bf76`". `git rev-list --count 2774bf76..HEAD` → **3**; `git log --oneline 2774bf76..HEAD` → `2ac9f0e`, `7fa46a6` (v0.5.2), `5a08ef3` (v0.5.1). So the graph predates both releases, including `7fa46a6`, which rewrote `CONTRIBUTING.md` — a file the graph indexes (`graphify-out/manifest.json` key `CONTRIBUTING.md`), so the graph's node for it is the pre-rewrite version that described a different repository. Tracked: **no** — `git ls-files graphify-out | wc -l` → `0`, and `.gitignore` carries `graphify-out/`. Against `/Users/sshlg/DATA/sshlg-skills/CHANGELOG.md` v0.79.0: "All nine, with semantic extraction: every one now sits **at HEAD**." Side note, measured: the dated snapshot directories are off by one run — `graphify-out/2026-08-15/GRAPH_REPORT.md:1` is headed `(2026-08-08)` and `graphify-out/2026-08-16/GRAPH_REPORT.md:1` is headed `(2026-08-15)` — while `graph.json` and `manifest.json` at the root carry an mtime of 2026-08-16 20:36.
- **Why it matters:** The graph is the first thing `/graphify` answers from. Anyone querying it about this repository's contribution rules gets the document that B-47 was filed to remove, with nothing in the answer to say it is three commits stale.
- **Fix:** Re-run `graphify update .` in `/Users/sshlg/DATA/sshlg-skills/skills/sheleg-dev` (no API cost per the report's own line 15), and correct the v0.79.0 claim's scope in the umbrella — "at HEAD as of <date>" rather than a standing property, since the graph is gitignored and drifts with every commit.
- **Blast:** 2 = the operator of this machine
- **Effort:** 1 = under an hour

## F-sheleg-dev-13 — the CHANGELOG documents a v0.1.0 release that was never tagged
- **Dimension:** version
- **Severity:** minor
- **Evidence:** `CHANGELOG.md:259` — `## [0.1.0] — 2026-08-06`. `git tag -l 'v0.1*'` → empty. Full comparison: CHANGELOG versions `0.1.0 0.2.0 0.3.0 0.3.1 0.4.0 0.4.1 0.4.2 0.4.3 0.5.0 0.5.1 0.5.2` against `git tag` `0.2.0 0.3.0 0.3.1 0.4.0 0.4.1 0.4.2 0.4.3 0.5.0 0.5.1 0.5.2` — `comm -23` → `0.1.0` and nothing else. npm confirms: `npm view @ssheleg/sheleg-dev versions --json` → `["0.4.0","0.4.1","0.4.2","0.4.3","0.5.0","0.5.1","0.5.2"]`.
- **Why it matters:** The v0.1.0 entry is the one that says "Installer CLI and `install.sh`, both installing all **five** skills" — a claim about an artifact that was never cut, in a file whose header says "All notable changes to this project are documented here." Nothing can be checked out at that version to test it.
- **Fix:** Either tag `v0.1.0` at the commit the entry describes, or mark the entry `(unreleased — no tag)` in `CHANGELOG.md:259`. The validator already compares the top heading to `package.json`; extend it to require every heading below the top to have a matching tag when a git checkout is available.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-14 — nothing checks the 970-char working limit on descriptions, and one skill sits three characters under it
- **Dimension:** gate
- **Severity:** minor
- **Evidence:** `test/validate.py:165-169` fails only above **1024** ("description is {len} chars, limit 1024"). Measured description lengths (using the validator's own `scalar()` folding): stripe-billing **967**, crypto-payments 884, google-auth 877, ad-tracking 859, frontend-performance 841, google-signin 821 — headroom against 970 of 3, 86, 93, 111, 129, 149 respectively. `npm test` → `OK: sheleg-dev structurally valid (12 checks, 6 skill(s), v0.5.2)`, exit 0, with stripe-billing at 967.
- **Why it matters:** stripe-billing's description is one word from breaching the working limit, and the gate will stay green for another 57 characters. The failure mode is the one `test/validate.py:11` already names for front matter — silent host truncation — so it will not surface at runtime either.
- **Fix:** Add a second threshold to `test/validate.py`: fail at 1024 as now, warn or fail at 970. Then trim stripe-billing's description (`plugins/sheleg-dev/skills/stripe-billing/SKILL.md:3-16`) — the "Not for choosing between Stripe products (stripe-best-practices) or reading Stripe docs (stripe-docs)" clause repeats what `SKILL.md:31-34` says in the body.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-15 — "Seven skills at the time of writing" — Stripe's index now returns eight
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-dev/skills/stripe-billing/references/stripe-agent-toolchain.md:92-94` — "Seven skills at the time of writing: `stripe-best-practices`, `stripe-docs`, `stripe-apps`, `stripe-projects`, `stripe-directory`, `connect-recommend`, `upgrade-stripe`." Measured against the source the same paragraph names (`https://docs.stripe.com/.well-known/skills/index.json`): `COUNT = 8` → `['connect-recommend', 'connect-required-verification-information', 'stripe-apps', 'stripe-best-practices', 'stripe-directory', 'stripe-docs', 'stripe-projects', 'upgrade-stripe']`. The missing one is `connect-required-verification-information`. The installed plugin agrees: `find ~/.claude/plugins -type d -path '*stripe*/skills/*'` lists it. The file does date its claim (`:8-10`, "Read from `docs.stripe.com/agents`, `/skills`, `/mcp` … on 2026-08-11 … Re-check before quoting a version"), which is the mitigation `CONTRIBUTING.md:23-24` demands.
- **Why it matters:** A reader building a Connect integration is told the skill index has seven entries and none of them covers verification requirements, when one does. The number is the only part of that paragraph that rots, and it rotted in five days.
- **Fix:** Update the list and count in `plugins/sheleg-dev/skills/stripe-billing/references/stripe-agent-toolchain.md:92-94`, or replace the count with "the current list is at `https://docs.stripe.com/.well-known/skills/index.json`" and keep only the two names the paragraph goes on to use.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

## F-sheleg-dev-16 — the gate reports "12 checks", which is not a count of its checks
- **Dimension:** gate
- **Severity:** minor
- **Evidence:** `npm test` → `> python3 test/validate.py` → `OK: sheleg-dev structurally valid (12 checks, 6 skill(s), v0.5.2)`, exit 0. The number comes from `test/validate.py:353` — `checks = 6 + len(skill_dirs)` — a constant plus the skill count. The file actually performs: four-way version sync plus marketplace-source existence and CHANGELOG duplicate detection (`:90-127`), six per-skill front-matter checks and two-directional reference resolution (`:142-186`), a build-artifact and stray-SKILL.md walk (`:190-196`), the CI entry-point check (`:200-211`), three release-gating checks (`:216-248`), the CONTRIBUTING routing-table check (`:255-310`) and the umbrella's advertised-trigger check (`:313-344`) — none of which is 6, and the constant does not move when checks are added. `docs/evidence/verification.md:28` quotes the line as REQ-001's evidence, praising it because "it counts the skills, so a lost one changes the line".
- **Why it matters:** The repository's own rule (`/Users/sshlg/DATA/sshlg-skills/CLAUDE.md`, "Evidence") is that numbers are counted by running something. This one is asserted by the runner, then cited in the ledger as a measurement. Three checks were added since the constant was written and the printed number did not move.
- **Fix:** In `test/validate.py:353`, either count the checks (a counter incremented at each check site or a registry of check functions) or drop the number and print only `6 skill(s), v0.5.2`. Re-quote REQ-001 in `docs/evidence/verification.md:28` against whatever the line then says.
- **Blast:** 1 = a future run
- **Effort:** 1 = under an hour

## F-sheleg-dev-17 — the pinned example API version predates a feature the same file recommends, and is a major release behind current
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/sheleg-dev/skills/stripe-billing/SKILL.md:115` — `client = new Stripe(key, { apiVersion: "2026-01-28.clover", maxNetworkRetries: 2 });`. `SKILL.md:207-209` — "On `2026-03-25.dahlia`+ an `integration_identifier` label lets you compare flows in the Dashboard." Verified against the vendor (WebFetch, https://docs.stripe.com/changelog): the latest version is **2026-07-29.dahlia**; `2026-01-28.clover` is real but sits six monthly releases and one major release train back, and `2026-03-25.dahlia` is the train boundary. So the file's own copy-paste example cannot use the parameter the file recommends two sections later. `integration_identifier` itself is confirmed real (`mcp__plugin_stripe_stripe__search_stripe_documentation`: "use the optional `integration_identifier` parameter to tag each session. This lets you isolate performance metrics by integration context") — **not confirmed:** that it was introduced specifically in `2026-03-25.dahlia`; the per-release changelog URL 404s and I did not verify the introducing version. Other version-sensitive claims in the file check out: `sub.items.data[0].current_period_start` (`:301`) and `invoice.parent.subscription_details.subscription` (`references/webhook-events.md:98`) are the current shapes; `npm install -g @stripe/cli  # v1.43.3+` (`:55`) matches Stripe's own `docs.stripe.com/upgrades` floor, and `npm view @stripe/cli version` → `1.50.1`.
- **Why it matters:** An agent copies line 115 verbatim. It then pins a superseded major release on a new integration and, if it also follows line 208, writes a parameter its own pin does not accept. The surrounding advice (`:123-125`, "Pin `apiVersion`") is right; the constant is the stale part.
- **Fix:** Bump the example in `plugins/sheleg-dev/skills/stripe-billing/SKILL.md:115` to a dahlia version, and add the date the constant was checked — the shape `references/stripe-agent-toolchain.md:8-10` already uses. Add a `references/testing-and-local-dev.md`-style assertion that the pinned string in `SKILL.md` and the version named at `:208` belong to the same train.
- **Blast:** 3 = a user of the pack
- **Effort:** 1 = under an hour

TOTAL: 17 findings (0 blocker, 6 major, 11 minor)
