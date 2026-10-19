# Plan: feed review, SEO/AEO upgrade, base-skill rollout (2026-10-19)

Brief and REQ table: [briefs/2026-10-19-feed-seo-aeo.md](../briefs/2026-10-19-feed-seo-aeo.md).
Lease `FEED-SEO-1019`. Branch `plan/2026-10-19-feed-seo-aeo`.

Evidence lives in the operator's private research report `channel-digest-3` (2026-10-19),
because the feed is private. Find it with
`reports.py find channel-digest-3`. This public plan carries only what the family's public
repositories will change; no channel text, product name or private path enters a public
skill. A feed claim enters a skill only after its primary source is read (wave 1).

## What the evidence says (counts from the private report, computed by script)

- 2900 of 2900 posts classified, each exactly once: 88 high, 381 medium, 870 low,
  1560 noise. High+medium by target: agent-stack 150, seo-aeo-audit 133, copywriting 49,
  asset-foundry 41, mobile-publisher 32, ux-scenarios 32, telegram-dev 24, task-pipeline 21,
  make-skill 20, ad-tracking 18, stripe-billing 18, sheleg-design 16, mobile-native 15.
- Of the useful posts, 97 topics are new; the rest were decided by the 2026-10-08/09 waves.
  Of 39 named deliveries from those waves 17 landed, 3 partially, 14 did not, 5 superseded.
- seo-aeo-audit 0.27.0 is strong on doctrine and weak on instruments and freshness: it has
  no guard against poisoned rank-tracker data (reported from September 2026), no repeatable
  AI citation panel, no Bing Webmaster instrument, and its update table fell ten dated events
  behind in eleven days.
- The design-time rule ("seo-llmo") has no home skill; super-ux's SEO safety reference
  contradicts the audit (training-crawler block reported as an error, FAQPage/HowTo advice).
- Copylot's `copylot.check` passed an SEO-hostile landing text with cliché notes only
  (live check during the synthesis).
- No project has `.claude/routers.json`; "a project is set up" has no definition and no
  command. 119 of 168 repositories were active in the last 45 days.

## Design decisions (stage 2)

1. **Build-time home: a `brief` mode of seo-aeo-audit**, backed by one reference
   `references/build-time.md` whose every item links the audit check that verifies it.
   Scope sentence: "audit a live site, or brief a site before it is built; never write the
   content or build the pages". The seo-llmo router names it as backing doctrine; hub
   backlog B-08 closes. Rejected: a new member (a router owner for one reference) and a
   home in copywriting or sheleg-design (splits search facts away from their evidence tiers).
2. **Landing checklist: one owner per row** (18 rows): page question and schema in the
   brief, wording in super-ux `landing-pages.md`, visual in sheleg-design, CWV budget in
   sheleg-dev `frontend-performance`. Others link, never restate.
3. **Copylot is the mechanical sweep** for public-web text: a `web-page` format pack and a
   `web` register; copywriting and the audit's E4b pass call it; absent Copylot, they say so
   and fall back to `brand_lint.py`.
4. **Rollout = a hub `enroll` command plus per-project setup runs.** `npx sshlg-skills
   enroll <dir>` detects the surface (public web, app text, internal), writes
   `.claude/routers.json` and one managed "Family skills" block in the project's
   AGENTS.md/CLAUDE.md, through the existing backup path, idempotent, with `--dry-run`.
   Content packs (`/brand-init`, `/ux-init`, `/seo-aeo-audit brief`) are then run per
   project through `/task-pipeline`, tier 1 first.

## Waves

Each wave: build with TDD, one blind reading per fix, member gate green, release by
annotated tag after reading checks (standing rule), umbrella pin, local install readback.

| Wave | Packets | Implements |
|---|---|---|
| 0 | Commit the private report and this plan; push | R1, R2, R3, R4 |
| 1 | **Primary-source verification** of every "verify" row that a P0/P1 change cites (Google docs, vendor crawler docs, Anthropic usage policy, studies) | gate for R5..R9 |
| 2 | **super-ux**: fix B050 crawler classes and `seo-aeo-safety.md` (link the brief, drop FAQPage/HowTo, true keyword rule); landing rows for offer conditions and AI-washing; copywriting calls `copylot.check`; ux-scenarios: synthetic personas are not evidence, the quarterly fresh-user walk | R7, R9 |
| 3 | **seo-aeo-audit 0.28**: poisoned-SERP guard with challenge-page fixture; update table refresh plus a release-time staleness warning; `brief` mode (`build-time.md`, `brief.template.md`, eval s05); GSC freshness check; per-URL sitemap audit; pagination rules; click-economics rows; crawler notes; real bylines; per-engine baseline; index-mass ratio; analytics-to-backend reconciliation; incident and ASN attribution; threat rows | R5, R6, R7 |
| 4 | **Copylot**: `web-page` pack, `web` register, SEO voice overlay, fact-base input, no watermark claims | R8 |
| 5 | **Hub and neighbours**: seo-llmo routes to `/seo-aeo-audit brief`, B-08 closed; `enroll` command; task-pipeline stage 3/4 cites the brief; sheleg-design links the brief rows; frontend-performance rows; umbrella release | R6, R7, R10 |
| 6 | **Other skills from the feed**: make-skill (supply-chain flags for unpinned installers and unknown packs, `claude plugin eval` re-check, Codex AGENTS.md 32 KiB cut), agent-stack (incident checklist, solvable eval tasks, outside forms need approval), telegram-dev (session takeover and gift-scam patterns, Mini App host trust), mobile skills (Android verification inventory, store-side demand measurement), asset-foundry (AI-content labels) | R9 |
| 7 | **Research sources**: seo pack source changes, the daily worker reads the pack, watchlist adds and drops, owed decisions filed in their owners' backlogs | R11 |
| 8 | **Rollout**: tier 1 public sites (10) enrolled and briefed/audited; tier 2 apps with user text enrolled; the two unrelated product groups handled separately | R10 |
| 9 | Handoff, report index, wiki, retrospective | R12 |

Seo-aeo-audit instruments of effort L (AI citation panel scorer, Bing Webmaster collector,
cache-parity probe) ship in 0.29 after 0.28, inside wave 3's tail.

## REQ coverage (stage 4 set comparison)

R1..R4 wave 0 · R5 wave 3 · R6 waves 3, 5 · R7 waves 2, 3, 5 · R8 wave 4 · R9 waves 2, 6 ·
R10 waves 5, 8 · R11 wave 7 · R12 wave 9. Union = R1..R12, equal to the brief.
