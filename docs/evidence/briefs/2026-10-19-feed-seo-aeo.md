# Brief: feed review, SEO/AEO upgrade, base-skill rollout (2026-10-19)

Lease `FEED-SEO-1019` (agent-sync), Fabric task `b3acd906`. Branch
`plan/2026-10-19-feed-seo-aeo` from `origin/main` `847d5942`.

## The request (operator, 2026-10-19, translated)

Study the feed for three months, read every post, classify, separate what is useful
for our skills from what is not, with emphasis on mobile development, SEO, AEO,
marketing and interesting tools. Then read research-agent's SEO and traffic research
and, from it, work out a detailed strategy for improving the SEO/AEO skill: a quality
audit, sites and landing pages built right for SEO/AEO from the start, and Copylot set
up correctly. After the skills are updated, set up every project that works with
texts and layouts with the base skills, so this is applied everywhere. Write the plan
and move along it.

## Source ledger

| Source | What it gave |
|---|---|
| Feed export `Feed, 02.09.26-19.10.26.md` | 2900 posts, 83 channels; copied into the private report (below) |
| research-agent `docs/reports/2026-10-08-channel-digest` | earlier triage of 3209 posts up to 2026-10-08: 2432 of today's 2900 posts already have a decision (`post-ledger.jsonl`); 468 posts (ids 78095-78562) are new |
| research-agent `docs/reports/2026-10-09-channel-knowledge-wave2` | full re-read of the 2136 unselected posts, 214 new topics, application decisions |
| research-agent-growth-reports `docs/reports/2026-10-1*-web-growth-daily` | 10 daily SEO/GEO/traffic reports, 2026-10-10..19 |
| research-agent `docs/domains/seo`, `2026-10-09-web-traffic-growth-report`, `2026-10-15-web-growth-source-health` | seo domain pack (18 sections, 44 leaves, 101 sources), report spec, source health |
| research-agent MCP `research.tasks.list` | the daily web-growth task is `paused` in the service; the worker in the growth-reports checkout runs it |
| `skills/seo-aeo-audit` | 0.26.4, ten tracks, 25 references; earlier channel correction `docs/evidence/channel-digest-20261009` |
| Routing block, `~/.claude/CLAUDE.md` | "seo-llmo is a standing rule in no pack": the design-time rule has no home skill |
| `copylot-agent` | the Tone-of-Voice writing service (MCP `copylot.*`) |
| `docs/evidence/retro.md` | standing instructions read in full; #4, #8, #11 bind this run's measurements |
| `docs/evidence/backlog.md` | 28 open rows; `verification.md` 91 rows at `never` |
| Wiki, code graph | wiki present (`~/.obsidian-wiki/config`); `graphify-out/` present in hub and member |

## Grill, closed from sources and the operator's standing rules

The operator's rule of 2026-10-17 is to decide as the operator would and record it.

1. **Where the feed report lives.** The feed is private; this repository and the member
   are public. Decision: the classification and raw corpus go to the private
   `research-agent` repository as `docs/reports/2026-10-19-channel-digest-3/`, the same
   home as the two earlier waves. Public skills receive only general rules verified
   against a primary source, never channel text (rule of the 2026-10-08 digest).
2. **Scope "every post".** All 2900 posts are classified again under today's lens
   (mobile, SEO/AEO, marketing, tools), each record marking whether an earlier wave
   already decided it. DealPad funding announcements (686) are classified mechanically
   as `noise_offtopic`: they carry no skill action.
3. **"к пилоту" means Copylot.** Copylot is the estate's text-writing service with
   saved voices and rule checks; the request is about texts. Recorded as an
   interpretation; if the operator meant another tool the REQ row is re-pointed, not
   dropped.
4. **Evidence bar for a skill change.** A feed claim enters a skill only at the
   member's evidence tier, checked against a primary source; deceptive tactics enter
   only `threats-and-defense.md` as things to detect.
5. **Build-time ownership and rollout mechanism** are decided at stage 2 from the
   synthesis and inventory (both running now), and written into the plan.
6. **Releases** are the agent's (operator, 2026-10-11): member PR, read checks, tag,
   watch the release, pin in the umbrella, update local installs.
7. **Product separation.** PrivatePhoneBot / sms-activate.app and the Appvillis
   products are rolled out separately, with no shared data, text or links.

## REQ table

| REQ | Requirement | Verified by |
|---|---|---|
| R1 | Every post of the export classified (category, usefulness, target skill, action, prior decision) | `classification/*.jsonl` union = 2900 unique ids, script output in the report |
| R2 | Report: useful vs not useful per skill, focus mobile / SEO / AEO / marketing / tools | report README with `report:` header, `reports.py check` exit 0 |
| R3 | Status of every earlier application decision (landed / not / superseded) | `synthesis/prior-decisions-status.md` with commit or file:line per row |
| R4 | SEO research digest and strategy (audit quality, build-time, landings, Copylot) | `synthesis/seo-research-digest.md`, `synthesis/seo-aeo-gap-analysis.md` |
| R5 | seo-aeo-audit: audit quality upgraded with verified findings | member tests green, released tag, umbrella pin, installed bytes |
| R6 | Build-time mode: new sites and landings built right for SEO/AEO from the start, with a home skill | shipped doctrine + test that the route resolves; routing block no longer says "no pack" |
| R7 | One landing-page checklist shared by copywriting, sheleg-design and seo-aeo-audit, one home | DOCMAP single home, cross-references resolve (`doc_refs.py`) |
| R8 | Copylot configured for SEO/AEO texts | Copylot change with its own test; `copylot.check` run on a sample |
| R9 | Other skills updated from the feed (mobile, copy, Telegram, make-skill security, agent tools) | per-target diff and gate output |
| R10 | Every active text/layout project set up with the base skills | inventory + per-project commits + `npx sshlg-skills materialised` / setup check |
| R11 | research-agent seo pack sources adjusted from the evidence | pack diff in research-agent |
| R12 | Handoff, report index, wiki | HANDOFF entry, `reports.py index`, wiki page |

Carry-over ledger: none yet.
