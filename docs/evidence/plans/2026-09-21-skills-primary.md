<sub>ssheleg skills — task-pipeline · ux-scenarios · copywriting · brand-voice · sheleg-design · agent-sync</sub>

# Skills first, harness as a separate section

Status: deployed and verified. See the [release receipt](2026-09-21-skills-primary-release.md). Base: `5e3be02` on `origin/main`.
Branch: `codex/skills-primary-harness-20260921`.

## Brief and authority

The operator explicitly requested that skills.sshlg.me remain a skills website,
with a separate Harness section describing the skills and related projects.
Project Observatory stays separately installed. Asset Foundry may be named with
its purpose and an “In development” state; no public release or private source
link is implied. The operator authorized autonomous implementation and review.
The parent task bounds this packet to a pushed draft PR, with no merge or deploy
from this agent. Existing Quest/Godot work, versions and submodule pins are out
of scope. These explicit instructions resolve the pipeline's intake and design
approval questions; no new user confirmation is needed.

## Sources and route

- `AGENTS.md` → `CLAUDE.md`; `docs/AGENT_SYNC.md` and the standing handoff rule.
- `docs/evidence/retro.md` standing instructions; `docs/DOCMAP.md`.
- `scripts/site.js`, `test/site_test.js`, `.github/workflows/pages.yml`.
- `docs/ux/scenarios.md` and `docs/brand/{voice,terminology,facts,channels,strings}.md`.
- `docs/harness/README.md`: existing architecture and installation boundaries.
- Parent's verified Asset Foundry inventory: private project, asset workflows
  for agents across 3D, image and audio; provider acceptance not established.

Contradictions: the prior home brands the site as “ssheleg harness” and hides
Skills from the narrow navigation. That conflicts with the operator's correction.
The narrower site identity changes; the harness architecture remains valid.

Skills used: task-pipeline (bounded delivery/evidence), super-ux ux-scenarios
(scenario update), copywriting (landing/navigation wording), brand-voice
(canonical identity and development-status facts), sheleg-design (preserve the
existing visual system while checking navigation fit), agent-sync (isolated
branch and shared-work lease). No model or package version change is required.

## Requirements, plan and evidence

| ID | Requirement | Planned check |
|---|---|---|
| REQ-01 | Home, brand, metadata, llms.txt and home preview identify the Skills site | generated-site assertions; home preview render |
| REQ-02 | Skills remains reachable in narrow navigation; Harness has its own route | desktop/mobile browser walkthrough and generated link checks |
| REQ-03 | Member pages retain harness affiliation and independent installation | existing site suite over every member page |
| REQ-04 | Harness covers skills, Observatory and in-development Asset Foundry without private links or release claims | page assertions and scenario review |
| REQ-05 | Durable, isolated delivery preserving versions and pins | task-owned diff, npm gate, pushed draft PR; no merge |

Execution order: scenarios and canonical terms → home/navigation/metadata →
Harness component section → generated preview → automated gates and browser
walkthrough → evidence and draft PR.

## Visual and copy contract

Surface: existing public landing and Harness pages. Job: SCN-001 visitors find
and install a skill pack, then choose whether to read the wider architecture.
Keep the current palette, type, receipt panel and card vocabulary. No new visual
direction or animation. Failure conditions: the first screen identifies a
harness rather than skills; the Skills link disappears on mobile; a component
looks generally available without evidence; or the viewport scrolls sideways.
The heading and first CTA lead to skills; Harness remains a visible secondary
navigation item. Humanization uses the brand pack's default own pass.

## Deployment boundary

`.github/workflows/pages.yml` deploys GitHub Pages after a matching push to
`main`, following the reusable validation workflow, build and artifact checks.
This branch does not deploy. After parent review/merge, verify the Pages run for
that exact head SHA, then open the deployed home, Harness and a member page on
desktop/mobile. No npm release or version bump is needed for this site packet.

## Actual verification and limits

- `node test/site_test.js`: PASS, 44 checks over 15 pages, 10 members, 12 routers.
  Two added cases check Skills identity/navigation and Foundry's availability.
  Existing checks cover internal paths/fragments, cards, runtime dependencies,
  every member and its standalone/harness boundaries.
- `npm test`: PASS, 88 suites, 1030 fixtures, 10 pinned members. The ratchet in
  [DOCMAP](../../DOCMAP.md) was updated from the computed count.
- `git diff --check`: clean.
- Browser: desktop home/Harness 1440×900; home 390×844 and 320×740; all ten
  members 320×740. Skills and Harness are visible at 320px. Document widths
  equal viewport widths. Catalogue overflow found and corrected from 336px to
  320px by allowing its grid minimum to shrink to available width. Console:
  no errors. See [scenario receipt](../../ux/scenarios.md#verification-receipt).
- UX lint: no errors, one pre-existing warning for the absent Web surfaces
  declaration.
- Brand contract compatibility: corrected all nine original path/source/entity
  errors: supported source keys, whitespace-separated globs, actual file paths,
  exact entity heading, explicit Humanization default. Retired the purported
  shared “Where it stops” label because no current source contains it; existing
  voice, facts and shipped labels otherwise remain intact.
- Full brand lint **is not green**. The marketing glob is `_site/**/*.html` and
  was run after generating all 15 pages. Current result: 976 B030 numeric-claim
  errors, 124 B062 punctuation errors, one B021 source-context error, 519 B022
  literal-registration warnings and one B003 draft-voice warning. Exact parser
  limitations: `brand_lint.py:1209` scans raw HTML numbers without removing style,
  SVG or data URIs (examples include `2000%`, `2224%` from markup);
  `brand_lint.py:1752` sends raw HTML to punctuation checks; and
  `brand_lint.py:745` compares a README label (“Update”) against pooled rendered
  pages instead of the declared README. The original B006/B023/B024 errors no
  longer occur. No markup values were added as public facts, and no findings
  were filtered out of the run. See [brand source contract](../../brand/README.md).
  Root explicitly bounded this to reporting parser limitations rather than an
  unrelated super-ux parser rewrite. Rendered website copy was separately
  reviewed, and generated numbers/metadata/links are covered by the site suite.
- Humanization: on, own pass. New copy reviewed against the existing bans and
  ai-tells reference. Foundry has no launch promise, public code link, counts
  or accepted-provider claim. Skills retain their own install paths.

## Resume and delivery

This file is the entry point. Website implementation commit: [0c3fe8c](https://github.com/ssheleg/sshlg-skills/commit/0c3fe8c04401b8f3c32f7061bebada3e6397d713). Implementation: [site generator](../../../scripts/site.js),
[regression tests](../../../test/site_test.js), [scenarios](../../ux/scenarios.md),
[brand](../../brand/README.md), [harness architecture](../../harness/README.md),
[home social card](../../assets/social-preview.png).

Next owner: parent release task. Review the draft PR, retain the documented raw-HTML parser limitation for a super-ux follow-up,
integrate against
fresh main, and deploy using the GitHub Pages workflow above. Verify its exact
commit and the production home/Harness/member routes. [Draft PR #146](https://github.com/ssheleg/sshlg-skills/pull/146) is a pushed
handoff, not a deployment or npm release. No version or submodule pin changed.

Keep local-only browser previews, test logs, lease state and private project
inventory out of Git. Preserve concurrent Quest/Godot worktrees.

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
