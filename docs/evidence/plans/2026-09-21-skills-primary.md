<sub>ssheleg skills — task-pipeline · ux-scenarios · copywriting · brand-voice · sheleg-design · agent-sync</sub>

# Skills first, harness as a separate section

Status: implemented and locally verified; draft PR handoff pending. Base: `5e3be02` on `origin/main`.
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
  declaration. Brand lint is **not clean**: baseline 9 errors/2 warnings; this
  change 9 errors/247 warnings. Existing errors are source declarations,
  non-resolving label locations and an entity-heading mismatch. Resolving the
  four new label locations exposes existing unregistered source literals.
  These are explicitly recorded, not counted as a green copy gate. A separate
  brand-contract cleanup is required; rewriting the entire registry is outside
  this navigation/component packet.
- Humanization: on, own pass. New copy reviewed against the existing bans and
  ai-tells reference. Foundry has no launch promise, public code link, counts
  or accepted-provider claim. Skills retain their own install paths.

## Resume and delivery

This file is the entry point. Implementation: [site generator](../../../scripts/site.js),
[regression tests](../../../test/site_test.js), [scenarios](../../ux/scenarios.md),
[brand](../../brand/README.md), [harness architecture](../../harness/README.md),
[home social card](../../assets/social-preview.png).

Next owner: parent release task. Review the draft PR, resolve the existing brand
contract findings as a separately scoped follow-up if needed, integrate against
fresh main, and deploy using the GitHub Pages workflow above. Verify its exact
commit and the production home/Harness/member routes. This branch is a pushed
handoff, not a deployment or npm release. No version or submodule pin changed.

Keep local-only browser previews, test logs, lease state and private project
inventory out of Git. Preserve concurrent Quest/Godot worktrees.

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
