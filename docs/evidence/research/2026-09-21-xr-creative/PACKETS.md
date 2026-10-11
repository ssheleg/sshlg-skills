# Implementation packets

Status: implementation plan. P01 has an initial source implementation on the member branch linked by [XR-COVERAGE](XR-COVERAGE.md); behavioral/device verification and release remain open. Other packets are proposed work. the shared design is [ARCHITECTURE](ARCHITECTURE.md), the source assessment is [XR](XR.md) and [CREATIVE](CREATIVE.md). Every owner must refresh its base and read its own repository rules before editing. Paths below are proposed outputs unless explicitly identified as existing.

## Sequence and common acceptance

1. Correct current XR guidance (P01) and settle media ownership/contracts (P02).
2. Establish portable Foundry distribution and truthful readiness (P08–P09). Build engine skills P03–P06 and Blender P07 against those contracts; these need no paid API.
3. Add managed Higgsfield and HeyGen paths (P10–P11), then media production P12 using real adapter contracts.
4. Run behavioral acceptance and package release gates (P13). Integrate reviewed member releases into the harness (P14). Add observation only if its enrollment/export contract is implemented (P15).

The ordering describes dependencies, not an instruction to launch concurrent agents. The work owner chooses execution under its coordination rules.

Each skill packet includes: concise `SKILL.md` with EN/RU triggers and exclusions; build and audit procedures; prerequisite discovery and fallback at the relevant step; on-demand references with dated primary sources; an original minimal fixture; trigger and behavioral cases; package metadata, license/attribution, installer and CI through make-skill. Do not load every reference on every invocation. Do not copy third-party process routers or publish an asset without its license/provenance.

For each packet, save commands, exit codes, source revisions, artifacts and NOT-RUN reasons. At least one normal case, one failure case and one unavailable-tool case must be exercised. Metadata validators alone cannot mark behavior complete. Refresh sources at implementation time; release engines/SDKs are target-specific choices, not one global version table frozen here.

## P01 — Correct and extend existing xr-dev

- **Owner:** existing `ssheleg/xr-dev`; base in [inventory](xr-inventory.json). Dependencies: none.
- **Files:** existing `plugins/xr-dev/skills/quest-{native,spatial,perf,tooling,store,webxr}/SKILL.md` and their references; existing `test/evals/` and validation coverage. Keep six current owners.
- **Change:** resolve the six semantic findings in XR.md; add documented no-companion fallback, engine delegation, target/capability contract, tracking/session recovery, comfort/accessibility, measured render budgets, and the Store release evidence record. Refresh metavr command references from installed help; retain CLI discovery instead of assuming a version.
- **Cases:** (1) Spatial panel/object budget report labels measured recommendations correctly; (2) a CPU/GPU overlap trace does not sum independent times into a false failure; (3) missing Meta tool/skill yields source/build audit and explicit device NOT-RUN. Add a historical App Lab query that routes to current Store guidance and a gateway-policy routing case.
- **Acceptance:** current package/strict/installer/negative checks pass; affected behavioral cases run; source links resolve; no production SDK upgrade or Store submission is implied.

## P02 — Creative navigation and shared handoff

- **Owner:** proposed `creative-dev` pack, repository identity to be resolved before creation. Dependencies: none.
- **Files:** `plugins/creative-dev/skills/creative-production/{SKILL.md,references/}`; `contracts/` within distributable skill resources or a generated shared resource; original fixtures and evals.
- **Change:** classify deliverable → reuse/search → choose production recipe → dispatch to domain owner → artifact QA. Consume existing scenario, visual and copy decisions. Implement `creative-brief` and links to target/manifest contracts from ARCHITECTURE; keep proposed fields clearly versioned until consumers support them.
- **Cases:** (1) one Quest prop routes through Foundry/Blender/engine import; (2) an exact UI demo routes to captured/rendered UI, not unconstrained video generation; (3) no paid provider returns validated brief and free/local path rather than fabricated output. A supplied complete brief must not restart the family planning interview.
- **Acceptance:** route collision cases cover media-use, HyperFrames, Higgsfield, design, asset-foundry and game skills; no duplicate payment/job owner; README and tool matrix distinguish installed, callable and documented.

## P03 — Godot development

- **Owner:** proposed `game-dev`, `godot-development`. Dependencies: P02 contract names only; can use a versioned draft contract until settled.
- **Files:** skill body; references for project/scenes/resources, GDScript/C#, import/export, testing, performance, GDExtension and compiling; small synthetic Godot project and test driver.
- **Change:** inspect `project.godot`, import state, engine version, renderer and export presets; establish typed script/resource patterns and signal/scene ownership; produce a working slice. Source compilation is an opt-in path for native extensions/custom builds, not the default installation method. Use primary Godot docs and re-derived examples, with GodotPrompter attribution for adapted structure.
- **Cases:** (1) create/open/run/export a small scene; (2) broken resource UID/import/export dependency produces actionable evidence; (3) missing engine gives file-level audit and exact install/build prerequisites. Exercise headless checks separately from visual rendering evidence.
- **Acceptance:** fixture imports after a clean checkout; selected export can run; script check logs and visual evidence are retained; source compile instructions are version-scoped and either executed or marked NOT-RUN.

## P04 — Godot XR

- **Owner:** proposed `game-dev`, `godot-xr`. Dependencies: P01 and P03.
- **Files:** skill, renderer/vendor-plugin/interaction/MR references; XR fixture and target-profile examples.
- **Change:** built-in OpenXR setup, XR origin/camera/action mapping, tracking state and reference spaces; optional XR Tools/OpenXR vendors compatibility; Android packaging/signing through current official guidance; explicit renderer decision experiment for the conflicting docs.
- **Cases:** (1) controllers or hands interact in an exported scene on the selected device; (2) denied MR capability or tracking loss degrades coherently; (3) no headset produces build evidence with device comfort/performance NOT-RUN. Include imported asset scale, collision and material verification.
- **Acceptance:** versioned target contract, APK/build receipt, device logs when available, no generic hardcoded Store target API. Reuse quest-store/perf rather than copying them.

## P05 — Unity 3D and VR

- **Owner:** proposed `game-dev`, `unity-3d-vr-games`. Dependencies: P01 and target contract.
- **Files:** skill; references for Unity project/package inventory, scene/prefab lifecycle, EditMode/PlayMode/batch builds, URP/OpenXR/Meta interoperability, profiling and assets; original minimal fixture.
- **Change:** choose compatible Unity/Meta/OpenXR versions from the actual project; delegate SDK-specific implementation to available Meta companions; retain a docs-based fallback. Address input, rig ownership, locomotion, scene lifecycle, pooled allocations and release-build profiling. Optional community editor MCP is a transport, not the project source of truth.
- **Cases:** (1) build a small VR interaction; (2) detect duplicate rigs/loaders or incompatible package configuration; (3) absent MCP continues through source/CLI/editor steps. Platform/device assertions remain conditional on executed checks.
- **Acceptance:** package lock and build target retained; EditMode/PlayMode results appropriate to behavior; headset evidence or explicit NOT-RUN; no universal claim that a simulator proves thermals or comfort.

## P06 — Unreal development and Quest profile

- **Owner:** proposed `game-dev`, `unreal-development`. Dependencies: P01 and target contract.
- **Files:** skill; C++/Blueprint, editor automation, asset import, cook/package, mobile/XR compatibility and profiling references; minimal project fixture.
- **Change:** distinguish Epic versus Meta engine/plugin tracks; inspect `.uproject`, plugins, target and cook configuration. Use mobile render constraints on Quest. Document the experimental Unreal MCP only for supported editor versions, with Python/commandlet/manual fallback.
- **Cases:** (1) import and cook a small level; (2) desktop renderer/material feature unsupported by target is identified before device deployment; (3) older editor without MCP uses available automation. For supported MCP, serialize game-thread tool calls and check editor lifecycle.
- **Acceptance:** supported-version source receipt, reproducible cook/package log, input and scene test, clear distinction between desktop fidelity and standalone headset evidence.

## P07 — Blender production

- **Owner:** proposed `creative-dev`, `blender-production`. Dependencies: P02; P08 target/manifest contract for managed delivery.
- **Files:** skill; authoring/MCP/UV-bake/rig-animation/export/headless references; original Blender Python fixture and a consumer import fixture.
- **Change:** implement the six-step CREATIVE.md procedure, one scene writer, source checkpoints and derived manifests. Separate GUI MCP from direct background workers. Measure exported counts/materials rather than trusting authoring counts. Add glTF/FBX or other format profiles only for real consumers.
- **Cases:** (1) a procedural prop exports/re-imports with correct units/materials; (2) unsupported compressed texture/mesh extension fails delivery with a usable alternative; (3) no MCP uses direct Blender Python or a source audit. Include a rig/animation round trip before claiming character support.
- **Acceptance:** master `.blend`, script, preview, manifest, structural validation and target import all agree. Missing upstream templates are replaced by original tested fixtures, not phantom links. No upstream code execution during research is implied.

## P08 — Portable Foundry and clean public edition

- **Owner:** existing private Asset Foundry first; future public repository selected explicitly at extraction. Dependencies: shared contract decisions from P02, no live providers required.
- **Files:** `pyproject.toml`, runtime resource/config/state resolution, package data/bootstrap, fixture installation tests, `skills/asset-foundry/` distribution, public README/license/security/contribution/CI, explicit extraction allowlist. Private evidence is in the owner receipt linked by HANDOFF.
- **Change:** fix the reproduced wheel registry failure; package immutable resources or initialize them reliably; put writable state/config outside installation. Keep generic profiles separate from operational project registrations. Generate a new-history public tree from an audited allowlist; leave private remote/state unchanged.
- **Cases:** (1) build/install wheel in a clean environment and run a free synthetic job; (2) read-only installation with writable external data directory works; (3) missing configuration gives a useful initialization path. Test upgrade without losing jobs/catalog and uninstall without deleting user assets.
- **Acceptance:** source scan, allowlist/history review, clean install fixture and public docs all pass. Public visibility change is a distinct action; no secret/provider account/production project is copied. Repository URL is entered in family metadata only after verified existence/access.

## P09 — Truthful capability and skill transport

- **Owner:** Asset Foundry. Dependencies: P08 for public acceptance; implementation can start against current source.
- **Files:** provider construction/readiness, CLI/MCP schema docs, `skills/asset-foundry/SKILL.md` and references, contract/schema regression tests.
- **Change:** distinguish catalog/adapter/dependency/authentication/live-probe states; unify readiness with actual adapter construction results; document ten current tools from code/schema. Make the skill transport-neutral and gateway-aware. If MCP is absent, use the actual Foundry CLI where it preserves the ledger; do not bypass the service by calling providers from a managed consumer.
- **Cases:** (1) configured provider with successful construction reports that precise state; (2) import/constructor failure cannot be reported as built; (3) no MCP still permits supported catalog/job CLI use. Never print secrets; no live check without the explicit live/budget context.
- **Acceptance:** schema snapshots match advertised arguments; machine-readable readiness has tested semantics; unsupported refund/cancel claims removed; protocol features negotiated instead of hardcoded as global requirements.

## P10 — Higgsfield managed adapter

- **Owner:** Asset Foundry, provider adapter and creative-dev reference. Dependencies: P08–P09; P02 brief.
- **Files:** provider module, capability registration, secret/auth integration, schema fixtures, mocked transport tests, provider reference.
- **Change:** inspect approved API/CLI capability → estimate exact operation → submit/store ID → poll/result → QA/reconcile. Keep model and workflow discovery separate. Preserve provider/model/schema version and input roles. OAuth remote MCP follows agent-side exception; a Foundry service adapter needs its own supported unattended credential path.
- **Cases:** (1) synthetic submit/result maps to manifest; (2) timeout after submit reconciles instead of duplicate charge; (3) expired auth/unknown model returns actionable unavailable state. A tiny live job requires a recorded budget and approved input.
- **Acceptance:** retry/cancel/unknown-charge tests, artifact decode test, live result only if actually run. Installed official skill cannot override Foundry cost gates.

## P11 — HeyGen managed adapter

- **Owner:** Asset Foundry, provider adapter and creative-dev localization reference. Dependencies: P08–P09; P02 brief.
- **Files:** provider module, avatar/voice/session/video schemas, auth/billing metadata, polling/callback fixtures, translation QA reference.
- **Change:** distinguish web-plan OAuth MCP and production API-key operation; discovery/readiness; agent session and final video status; language/glossary/caption/lip-sync checks. Keep HyperFrames composition outside this adapter.
- **Cases:** (1) completed session waits until video artifact is ready; (2) duplicate callback or timeout does not duplicate job/charge; (3) translation/proofread endpoint absent from chosen transport yields an explicit supported alternative. Digital twin/voice inputs retain rights/consent metadata.
- **Acceptance:** auth surface cannot switch silently; no secret-in-chat instruction; final media checked; hosted-model self-hosting is never inferred from an open-source SDK/skill/fork.

## P12 — AI media production and HyperFrames seam

- **Owner:** proposed `creative-dev`, `ai-media-production`, with existing HyperFrames/media-use companions. Dependencies: P02, P09; P10/P11 only for those provider routes.
- **Files:** skill; image/vector/video/audio, localization, provider discovery, timeline handoff and QA references; free media fixtures.
- **Change:** keep one budget/job owner per deliverable. In a Foundry-managed project, media-use receives delivered assets/manifest instead of independently purchasing duplicates. For standalone HyperFrames work, preserve its supported route with declared ownership. Audio includes speech/SFX/music/transcription/mixing, not just text-to-speech. Use a deterministic timeline for exact layout and typography.
- **Cases:** (1) product clip combines source assets, narration and captions into a checked render; (2) missing last frame, wrong duration or clipped audio fails QA; (3) absent paid provider uses local fixture source and retains limitations. Stereo/360 output requires a separate projection contract and headset proof.
- **Acceptance:** complete render decoded/reviewed, provenance and costs preserved, no duplicated library/renderer or conflicting mandatory interviews. Split audio into its own skill only when evals show the combined entry becomes ambiguous or too large.

## P13 — Behavioral evals and member releases

- **Owner:** each member; shared evaluation design may reference agent-stack. Dependencies: packet under release.
- **Files:** per-skill fixtures/cases/results, installer/package/strict validation, attribution and release evidence.
- **Change:** run the same prompts/fixtures against baseline and candidate with actual neighboring skills; record model/runtime/source versions. Include adverse cases above and user corrections. Separate trigger selection, procedure correctness and actual artifact quality.
- **Acceptance:** no invented scores; missing hardware/paid calls are NOT-RUN, not passes. Report unresolved limitations before release. Run member integration policy and validate installed footprint/shadowing. A pushed work branch alone is not a published skill.

## P14 — Harness catalog and distribution integration

- **Owner:** `ssheleg/sshlg-skills`; dependencies: reviewed P13 releases and public Foundry access.
- **Files:** actual family catalog/installer/companion-tool schema discovered at implementation, routing map, harness documentation and site source, installation tests.
- **Change:** add game-dev and creative-dev under their final identities; expose asset-foundry skill and separately installed service; show verified source/install/update links and prerequisites. Preserve existing UX/design/copy/project-audit ownership. Add only released member pins.
- **Cases:** (1) clean user sees correct optional prerequisites; (2) skill family installs without silently installing Blender/GPU/providers; (3) missing companion service routes to a useful discovery/setup path. Validate Claude/Codex discovery and duplicate-name diagnostics.
- **Acceptance:** fresh install/update/uninstall and link checks; parent pins match released commits; existing harness/Observatory relationships remain accurate; publication has its own normal pipeline.

## P15 — Optional Observatory adapter

- **Owner:** public Observatory edition plus Foundry export contract; dependencies: P08–P09 and redacted `observation-event` schema.
- **Files:** explicitly enrolled project exporter/reader, schema and redaction tests, opt-in docs.
- **Change:** read job outcome/cost/QA summaries and source receipt links; preserve opaque IDs. No prompts, biometric inputs, signed URLs or credentials are needed for the first version.
- **Cases:** (1) failed job appears with actionable source link; (2) sensitive fields are removed before export; (3) unavailable Foundry yields stale/unavailable observation, not invented health. Observation cannot create/retry jobs or increase budget.
- **Acceptance:** offline fixture import plus redaction/permission tests. Keep optional until a real consumer needs it; do not claim this integration ships with today's research.

## P16 — Optional self-hosted multimodal inference

- **Owner:** Asset Foundry adapter; infrastructure/deployment reference under the chosen service owner. Dependencies: P02, P08 and P09. Sources and decisions: [VLLM-OMNI](VLLM-OMNI.md).
- **Files:** provider implementation and task schema fixtures, versioned deploy example, readiness/compute budget integration, operating/benchmark reference, output and recovery tests.
- **Change:** pin compatible Omni/vLLM/backend/model revisions; implement one image or speech operation first. Discover the actual loaded model/task; preserve Foundry job intent, uncertain outcomes, provenance, compute cost and QA. Existing API routes and in-memory video jobs do not establish durable recovery.
- **Cases:** (1) task fixture yields a decoded artifact with complete manifest and measured GPU cost; (2) timeout/restart/cancel/OOM produces a reconciled bounded outcome without duplicate submission; (3) no GPU/auth or unsupported model reports unavailable/NOT-RUN while preserving local brief and existing service paths. Compare one hosted or simple local baseline on identical accepted-output criteria.
- **Acceptance:** explicit model/weight license, deployment lock, read-only readiness, synthetic contract tests and an actually executed separately budgeted GPU benchmark. Runtime NPC/camera use additionally needs data/latency/offline/frame-budget tests; it is not implied by a successful offline image. No automatic GPU purchase, provider installation or new global MCP registration.

## Later candidates, deliberately outside the first release

`realtime-graphics` after a tested web-3D fixture and design/WebXR collision audit; ComfyUI adapter after controlled workflow/node/model provenance and hardware budget; Recraft vector lane after SVG sanitization/consumer proof; additional Runway/ElevenLabs modalities after capability and cost comparison on the same brief; Horizon Worlds only after a concrete Worlds authoring task. These are a research backlog, not missing prerequisites for P01–P14.
