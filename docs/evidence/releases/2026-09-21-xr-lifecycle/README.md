<sub>ssheleg skills — make-skill · task-pipeline · evidence-docs · agent-sync · quest-lifecycle · quest-native · quest-spatial · quest-perf · quest-tooling · quest-store · quest-webxr · ux-scenarios · copywriting · brand-voice</sub>

# Quest lifecycle: research, implementation and release handoff

Objective: turn the operator's Meta documentation leads into a usable full-product workflow, update the family catalogue/site, and verify GitHub/npm delivery. Date: 2026-09-21. This report records delivered skill knowledge and its limits; it is not a claim that an application passed headset or Store acceptance.

## Start here

The member implementation is merged and tagged **xr-dev v0.3.0**, at [6a5053253f45916937bde0972e5cae4bcee57007](https://github.com/ssheleg/xr-dev/commit/6a5053253f45916937bde0972e5cae4bcee57007). Read its [verification entry](https://github.com/ssheleg/xr-dev/blob/6a5053253f45916937bde0972e5cae4bcee57007/docs/evidence/verification/2026-09-21-lifecycle/README.md), then the shipped [quest-lifecycle](https://github.com/ssheleg/xr-dev/blob/6a5053253f45916937bde0972e5cae4bcee57007/plugins/xr-dev/skills/quest-lifecycle/SKILL.md).

The family candidate is **sshlg-skills v1.51.0**, branch `codex/xr-lifecycle-release`. It pins that member commit, carries seven XR entry points and updates descriptions, social cards and the generated website. Final remote/registry/site results belong in [delivery.json](delivery.json); a pending state there is not a completed release.

## What changed

- New `quest-lifecycle`: platform/engine selection, immersive design, milestones, owner/evidence/next-action map, account readiness and operation. It composes with task-pipeline and super-ux instead of introducing another delivery process.
- All six existing owners: native/OpenXR/MR capabilities; Spatial build/audit and hybrid Activity/session transitions; mobile rendering and sustained profiling; current-source/CLI/MCP discovery; submission, data/account tasks, monetization, launch/growth and truthful Store assets; WebXR/PWA delivery.
- Seven skills and 25 references in the member payload. Engines are explicit routes to implementation documentation and available companions, not claims that Godot/Unity/Unreal runtimes are installed or that separate engine skills have shipped.
- The family manifest declares skill names rather than a fabricated slash command: xr-dev ships skills, no `commands/quest-lifecycle.md`. The inventory test caught the initial incorrect entry and it was corrected.
- The release-set staging receipt was regenerated from actual pins. Its synthetic clean/upgrade/rollback test is not evidence of a live agent hot reload.

## Research and decisions

The member [source ledger](https://github.com/ssheleg/xr-dev/blob/6a5053253f45916937bde0972e5cae4bcee57007/docs/evidence/verification/2026-09-21-lifecycle/source-ledger.json) records 42 attempted Meta Markdown documents, including failures/soft-unavailable bodies; 47 published source links returned HTTP 200. HTTP success alone is explicitly insufficient. HTML fallbacks, versioned Spatial API discovery and pinned `meta-quest/agentic-tools` source are recorded separately.

The source research identified conflicting pre-launch durations (180/360 days), conflicting summaries of pre-order revenue timing, changing analytics surfaces, asset-type-specific guidance and unavailable content-rating/design Markdown pages. Skills tell the agent what to verify in the detailed current source and Dashboard. They do not turn a landing-page summary or an old model/device list into an unconditional requirement.

The wider [XR/creative strategy](https://github.com/ssheleg/sshlg-skills/blob/20daa7a114e1602efe5f23db49213a34274d7091/docs/evidence/research/2026-09-21-xr-creative/README.md), [architecture/contracts](https://github.com/ssheleg/sshlg-skills/blob/20daa7a114e1602efe5f23db49213a34274d7091/docs/evidence/research/2026-09-21-xr-creative/ARCHITECTURE.md) and [P01–P16 packets](https://github.com/ssheleg/sshlg-skills/blob/20daa7a114e1602efe5f23db49213a34274d7091/docs/evidence/research/2026-09-21-xr-creative/PACKETS.md) remain the shared context for Godot, Unity, Unreal, Blender, Higgsfield, HeyGen/HyperFrames, Asset Foundry and vLLM-Omni. This release supersedes P01's old source/release status. P02–P16 are still proposals, not released products. Other tasks own active Foundry/Observatory work; no private configuration or unfinished member pin was copied here.

## Checks actually run

Member: structural suite (11 checks); eight planted-defect refusals; installer suite (11 cases); both strict Claude manifest checks; seven house audits with no gaps; payload listing (39 files, seven skills, 25 references); source-link checks; 22 trigger and 18 scenario definitions validated; three paired tool-free model probes with explicit baseline/candidate context. [Probe results and limits](https://github.com/ssheleg/xr-dev/blob/6a5053253f45916937bde0972e5cae4bcee57007/docs/evidence/verification/2026-09-21-lifecycle/planning-probes.json) are not automatic-routing evidence. The candidate was corrected after a probe exposed a premium/entitlement mistake.

GitHub member validation passed at the merged commit: [run 35596683757](https://github.com/ssheleg/xr-dev/actions/runs/35596683757). [Release run 35596956680](https://github.com/ssheleg/xr-dev/actions/runs/35596956680) created the GitHub release and passed validation, then npm publishing failed with ENEEDAUTH. Registry lookup returned 404 for `@ssheleg/xr-dev`; local `npm whoami` returned 401. An operator login is required; no credential was requested in chat or committed. Until publication is verified, `npmPublished: false` suppresses the dead npm link on the site and marks it pending in llms.txt; GitHub/plugin install paths remain available.

Family: site suite initially caught two stale social cards, corrected from the generator; the inventory/staging suites caught the entry and pin-receipt errors described above. The final run results, new temporary unpublished-package regression, browser checks and remote receipts are recorded in delivery.json. The registry-pin checker accepts Git tags for an unpublished member, so its green exit does **not** prove XR is on npm. The nine other member pins and umbrella 1.50.0 were verified on npm before this release.

Browser: local XR page reviewed at desktop and 390×844; seven descriptions, lifecycle link and v0.3.0 visible; mobile document width equalled 390px. SCN-004 records the path. Product adoption/conversion remains unobserved.

Existing documentation debt: brand_lint reports 9 errors/2 warnings in the inherited brand-pack format (source block, string locations, entity heading), reproduced before this change; ux_lint reports no errors/one inherited missing-web-surface warning. This release updates the measured count and reviews its new copy, but does not claim the whole legacy brand pack passed that optional audit.

## Exact next task and boundaries

First resolve XR npm authorization, publish the exact v0.3.0 payload, verify the version and tarball, then remove the pending publication flag in a normal family patch. Use the existing release workflow for future trusted publishing after the operator configures npm authorization; never put tokens in source or move the release tag to hide a failure. If delivery.json records this already completed, proceed to project acceptance instead.

For a real Quest project: start quest-lifecycle from repository evidence, select the platform/engine/device and record the earliest unresolved stage. Run the relevant build and headset/Store checks before claiming readiness. Device capture, rendering, live billing, Meta account tasks and Store review were NOT RUN by this knowledge release.

For the wider strategy: use P02/P03 as the next bounded creative-navigation/Godot tasks after confirming ownership with active work. Keep shared asset contracts from ARCHITECTURE.md. The Foundry owner has its own private packaging/public-readiness handoff; this release does not publish that repository.

Local-only: secrets, account data, gateway configuration, installed-agent caches, generated site directory, downloaded upstream documents and real device/project media stay outside Git. Task-owned source, source receipts, synthetic probes and this handoff are the durable public record.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — validated seven skill packages
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — carried research through release gates
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — recorded source and verification receipts
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — held release file claims
- [`quest-lifecycle`](https://github.com/ssheleg/xr-dev) — defined product stage ownership
- [`quest-native`](https://github.com/ssheleg/xr-dev) — audited native platform coverage
- [`quest-spatial`](https://github.com/ssheleg/xr-dev) — expanded hybrid lifecycle
- [`quest-perf`](https://github.com/ssheleg/xr-dev) — expanded rendering evidence
- [`quest-tooling`](https://github.com/ssheleg/xr-dev) — defined current source discovery
- [`quest-store`](https://github.com/ssheleg/xr-dev) — expanded commercial and launch readiness
- [`quest-webxr`](https://github.com/ssheleg/xr-dev) — separated web delivery
- [`ux-scenarios`](https://github.com/ssheleg/super-ux) — specified the XR catalogue path
- [`copywriting`](https://github.com/ssheleg/super-ux) — reviewed catalogue text
- [`brand-voice`](https://github.com/ssheleg/super-ux) — updated measured brand facts
