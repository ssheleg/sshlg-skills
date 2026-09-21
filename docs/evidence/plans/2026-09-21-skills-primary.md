# Skills first, harness as a separate section

Status: implementation in progress. Base: `5e3be02` on `origin/main`.
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

## Resume

Next task: implement the requirements, replace this section with actual checks,
and hand the draft PR to the parent for integration with its publication work.
