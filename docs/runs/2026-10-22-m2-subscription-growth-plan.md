# Milestone M2 (draft): subscription growth in the product, marketing and UI/UX skills

**Operator, 2026-10-22:** strengthen the family's product, marketing and UI/UX skills for mobile
and web, and the system rules and recommendations, from GP Bullhound's *Consumer Subscription
Software* report (October 2025, 80 pages; read pages 1-50 and 63-72). Planned after M1; M1 adds
no features (`2026-10-22-milestone-m1.md`).

## What the skills already cover (measured 2026-10-22 on each member's `main`)

| Report theme | Where it already lives |
|---|---|
| Self-serve, honest cancel; one save offer | super-ux BP-123 |
| Win-back at every lapse point | super-ux BP-035 (tag `winback`: 7 practices) |
| Web2app and US external purchase links | super-ux BP-124 to BP-129 and the anti-steering note in `best-practices.md` |
| Legal: auto-renewal and consent rules | super-ux tag `legal` (9 practices) |
| What makes a page cited by AI answers | seo-aeo-audit `references/aeo-geo.md` F2 |
| Cancellation and the retention coupon in code | sheleg-dev `stripe-billing/references/cancellation-and-retention.md` |

## The gaps (zero or one match in the owning references)

| # | Gap | Report evidence | Owner |
|---|---|---|---|
| G1 | Subscription unit economics with benchmark bands: LTV/CAC (3x to 6x), CAC payback under 3 months, first-period annual retention (30% to 60%+), free-to-paid (2% to 10%+), organic share (20% to 50%+), renewal of 60%+ of an annual cohort and 40% of year 2 | pp. 65-67 | super-ux `ux-foundation/references/funnel-research.md` |
| G2 | Cohort model (new, current, reactivated, resurrected) and the locals/tourists split: LTV per segment, acquisition optimised for locals, not ROAS | pp. 39, 71 | super-ux funnel research and the test panel template |
| G3 | Trial design: length, card at trial start, upgrade prompts at decision points | p. 37 (12 to 6 months raised conversion) | super-ux BP catalog |
| G4 | One simple plan; complexity as a growth cost | p. 41 | super-ux BP catalog |
| G5 | Bundles across a portfolio (churn down by up to half) and the portfolio operating model | pp. 19, 26 | super-ux BP catalog and `product-frameworks.md` |
| G6 | The aha moment framed positively (retention 10% higher after a win; positive framing +20% subscriptions to the feature) | p. 40 | super-ux BP catalog (`activation`) |
| G7 | AI answers as a channel: zero-click share (40%), LLM referrals tracked as a source, citation sources beyond the own site (Wikipedia, comparison portals, Reddit, YouTube creators) | pp. 21-22, 39, 49-50 | seo-aeo-audit (sources and monitoring); super-ux funnel research (attribution) |
| G8 | Cancel parity as a checked rule: cancelling is as easy as subscribing (California law from 2025-07-01), pause offered | p. 18 | task-pipeline design-tester checklist; sheleg-dev `stripe-billing` (pause) |
| G9 | Creator and micro-influencer programs per market; a public figure only when their values match | pp. 29, 39, 42-44 | super-ux `copywriting` channel playbooks |
| G10 | Invisible AI: personalised paywalls, triggers and onboarding that adapt per user, AI that removes friction rather than adds features | p. 23 | super-ux BP catalog (`personalization`) |

## System rules and recommendations

- **R1.** A change to a subscription surface (paywall, trial, pricing, cancel) states which G1
  metric it moves and the band it targets, in its brief.
- **R2.** The design review checks cancel parity and the paywall's single clear offer on every
  subscription surface (task-pipeline `design-tester` checklist gains `cancel_parity`).
- **R3.** Every test panel carries at least two "locals" and two "tourists" among its ten portraits.
- **R4.** Public surfaces are audited for AI citation sources, not only for their own markup
  (seo-aeo-audit), and the product's analytics count LLM referrals as a channel.

## The plan, in waves (budget: three waves, two sub-agents at most, one release per member per wave)

| Wave | Work | Releases |
|---|---|---|
| 1 | G1, G2 in `funnel-research.md`; G3, G4, G6, G10 as new BP entries with the report as their source; R3 in the test panel template | super-ux minor |
| 2 | G7 in seo-aeo-audit (citation-source checks, LLM referral note); G8 and R2 in task-pipeline (`cancel_parity` in the design-review checklist and `design_gate.py`); pause in `stripe-billing` | seo-aeo-audit, task-pipeline, sheleg-dev minors |
| 3 | G5 and G9 (bundles and portfolio model; creator programs); R1 and R4 in the routing and operator guidance; hub pins | super-ux, hub |

**Measured during wave 2 (2026-10-22).** seo-aeo-audit already carries G7's own half: AI
referrals hidden in direct and search (`references/demand-and-conversion.md:113`), zero-click
demand (`:116`), AI referrers in analytics (`references/measurement.md:30-33`), and Wikipedia,
YouTube and Reddit as citation sources (`references/aeo-geo.md:93-106`,
`references/entity-and-brand.md:283-287`). No seo-aeo-audit release is owed for G7; its
attribution half (LLM referrals as a channel in the funnel) moves to super-ux in wave 3 with R4.
G8 and R2 ship in task-pipeline 1.101.0 together with M1's B-246, one release instead of two.

**Exit checks:** each gap has its reference text with the report cited by page; the
design-review gate refuses a subscription surface without `cancel_parity`; every member's gate
is green on the released artefact; hub pins and the install readback match. Anything else
becomes a board row.
