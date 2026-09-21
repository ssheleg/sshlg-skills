# XR, engines and publishing: audit and proposed coverage

Research date: 2026-09-21. This is an implementation specification, not a claim that the proposed skills have shipped. The [inventory](xr-inventory.json) fixes the audited xr-dev revision; the [mechanical results](mechanical-audit.json) fix the checks actually run. External source pins are in [upstream snapshots](upstream-snapshots.json).

## What already exists

The current xr-dev pack has separate owners for native OpenXR, Spatial SDK, performance, tooling, Store delivery and WebXR. Its own source explicitly delegates Unity implementation to Meta's skills. Keep that useful separation. Add engine expertise as a companion pack, not as another copy of the Quest platform rules.

| Existing owner | Retain | Proposed update |
|---|---|---|
| quest-native | C/C++, OpenXR lifecycle, build and packaging constraints | Extension-support matrix; explicit tracking/session loss tests; assets-to-loader contract; on-device evidence template |
| quest-spatial | Kotlin/Android lane, ECS, panels, sample navigation | Correct the interpretation of measured limits; make build/audit paths self-contained when Meta's companion is absent; add feature-specific lifecycle and capability checks |
| quest-perf | Release build, real headset, timing evidence, thermals | Correct CPU/GPU scheduling explanation; separate throughput, latency and reprojection; profile input/physics/allocations as well as rendering |
| quest-tooling | Tool discovery, one install channel, metavr and simulator | Gateway-aware setup; version-scoped commands; explicit host/tool availability; no automatic all-agent installation |
| quest-store | Release manifest, channels, VRC and submission evidence | Add explicit App Lab migration note; per-build compliance evidence and rollback; distinguish upload, review, approval and release |
| quest-webxr | WebXR, IWSDK, PWA delivery | Browser feature detection, session recovery, asset budgets, context loss and ordinary-screen fallback |

These proposals are derived from the actual [skill sources](https://github.com/ssheleg/xr-dev/tree/7954ba2a884f5a71d7487981b4335c0ecdbc25d4/plugins/xr-dev/skills), not from the names alone.

## Findings requiring correction first

| Finding | Evidence | Consequence and correction |
|---|---|---|
| XR-F01: estimated capacities are presented as hard architectural ceilings | quest-spatial, sections “Step 0” and “Step 2”, calls budgets hard limits; Meta's [runtime guidelines](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-runtime-guidelines/) describe isolated panel estimates and recommended object counts | Preserve useful planning estimates with device/build/content assumptions. They are neither API maximums nor guarantees. Mixed workloads need measurement. |
| XR-F02: CPU and GPU times are described as a simple combined frame budget | quest-perf, “The budget is a deadline”; [Unity profiler markers](https://docs.unity3d.com/6000.0/Documentation/Manual/profiler-markers.html) distinguish queued frames, render-thread work and GPU waits | Explain overlapping pipeline stages. Compare each critical stage, synchronization and compositor deadline in a trace; do not add unrelated CPU/GPU samples as a universal formula. |
| XR-F03: setup examples bypass this operator's gateway policy | quest-tooling, “The MCP server”; supplied AGENTS gateway instructions | For new standalone stdio servers, use the gateway registry. Leave plugin-managed servers with the plugin. OAuth stays at the agent. Examples must state their deployment context. |
| XR-F04: generated CLI skill and family navigation can disagree | installed metavr-cli says `self-update`; quest-tooling says `update`; their log command examples differ | A command table is a dated snapshot. Resolve the executable and inspect that version's help before running mutations. Do not edit generated upstream instructions as the durable fix. |
| XR-F05: behavioral proof is missing | [test/evals/RESULTS.md](https://github.com/ssheleg/xr-dev/blob/7954ba2a884f5a71d7487981b4335c0ecdbc25d4/test/evals/RESULTS.md) explicitly says never executed | Existing trigger and scenario fixtures are useful. Run them against the installed neighbor set and new engine skills; schema validation does not prove routing or project quality. |
| XR-F06: companion absence has an incomplete path | quest-spatial ends by handing implementation to `hz-spatial-sdk`; native/tooling also refer to Meta helpers | Provide a manual documented build/review procedure and an explicit “device check not run” result when hardware is absent. A skill can be useful without its preferred accelerator. |

Mechanical audit: the six family skills pass the bundled auditor. The generated metavr skill returns five findings, including house trigger conventions and allowed-tools portability. The YAML-subset mismatch is an auditor/parser compatibility finding; it does **not** prove that Claude rejects the skill. Do not confuse house conformance with platform validity.

## Engine selection should follow the project

| Lane | Good starting conditions | Evidence to obtain before choosing |
|---|---|---|
| Spatial SDK | Existing Kotlin/Android team; panels, media, hybrid 2D/immersive apps | Required features in the current SDK and samples; panel workload; lifecycle; target OS |
| Unity | Existing Unity assets/team; standalone Quest games and MR | Editor/package lock; Meta SDK compatibility; URP/OpenXR configuration; Android build and device capture |
| Unreal | Existing C++/Blueprint project; complex authoring or simulation | Exact Epic/Meta branch; mobile renderer cost; SDK/NDK compatibility; packaged-device performance |
| Godot | Open engine, GDScript/C#, 2D or 3D project with acceptable extension coverage | Engine/export-template match; renderer/device validation; add-on versions; vendor XR support |
| Native OpenXR | Custom renderer or unusual engine requirements | Runtime extensions, loader, lifecycle, validation layers and target-device evidence |
| WebXR | Browser distribution and ordinary-screen fallback matter | Browser/API feature detection, secure origin, input/session behavior and delivery constraints |

“Unity best overall” and “Unreal high fidelity” are not sufficient selection criteria. An Android standalone build has a mobile rendering budget irrespective of the editor's desktop preview.

## Spatial SDK: expand from navigation to a repeatable method

The user-supplied [development page](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-development/) covers the ECS model, panels, objects, tooling, samples and passthrough camera access. Its machine-readable `.md` representation was usable when the HTML reader mostly returned navigation. Keep both routes in the documentation resolver.

Proposed `quest-spatial` reference modules:

1. **Project facts and build:** read the wrapper, AGP/Kotlin/JDK configuration, dependency catalog and SDK version from the project. Use a matching sample as a scaffold. Keep source-project versions rather than upgrading everything to a table in the skill.
2. **ECS ownership:** component/system registration, queries, entity lifetime, event subscription cleanup, threading boundaries and avoiding per-frame allocation/structural churn. Require a minimal scene that can be opened, closed and reopened.
3. **Panels and hybrid lifecycle:** Compose/View surface lifecycle, focus and input arbitration, density/legibility, audio focus, transitions between panel and immersive activities, background/resume and resource cleanup.
4. **Spatial features:** MRUK scene/room data, tracking availability, persistent anchors, permission refusal, scene changes, camera/depth availability, physics, animation and body/hand input. Keep platform support and user grants in separate fields.
5. **Asset path:** glTF/GLB/glXF roles, supported material extensions, coordinate units, collision representation, animation/skin support, shader variants and target-device import validation.
6. **Advanced samples:** media/DRM/spatial video, custom shaders, reusable SpatialFeature modules and camera/ML examples. These are opt-in paths with explicit dependencies, not the default starter.

The [pinned sample repository](https://github.com/meta-quest/Meta-Spatial-SDK-Samples/tree/f233e2327b95f9871b75bdba867d6fdd726f07cc) is the implementation reference. Its README includes a duplicated sample entry and a count inconsistent with the list; enumerate actual sample directories when generating navigation. Do not propagate prose counts. Toolchain values copied from the sample are tested there, not automatically in every consumer project.

Advanced feature selection should link a feature to an official sample, minimum runtime/device condition, permission, failure behavior and verification scene. [Meta's native sample map](https://developers.meta.com/horizon/documentation/native/native-openxr-sdk-sample/) is useful for hand tracking, spatial entities, colocation and rendering extensions. [Passthrough guidance](https://developers.meta.com/horizon/essentials/horizon-os-passthrough/) distinguishes displayed passthrough from raw camera access. A rendered camera background is not evidence that an app can read camera frames.

## Godot: two skills, with an optional native-build reference

Propose `godot-development` for ordinary 2D/3D projects and `godot-xr` for native OpenXR targets, with a separate WebXR browser path. Do not name the portable skill “Godot Claude Skills”: the runtime can be Claude, Codex or another Agent Skills host.

`godot-development` should cover:

- Detect `project.godot`, `.tscn`, `.tres`, GDScript/C#, import settings and export presets. Pin engine and matching export templates; distinguish the stable docs for that release from `latest`.
- Scene ownership/composition, Resource reuse, typed signals, state machines, input actions, physics versus render updates, save-version migrations, UI/localization and audio buses. These are choices with tradeoffs, not a mandate to add an event bus to every scene.
- 2D/3D import workflows; keep original assets and reproducible import settings. Stable IDs and scene/resource references matter when agents move files.
- Headless parse/import/export, [GUT](https://github.com/bitwes/Gut) or [gdUnit4](https://github.com/godot-gdunit-labs/gdUnit4) when installed, integration scenes, deterministic input playback where practical, and real renderer/device tests where headless cannot prove behavior.
- Profiling CPU/GPU, draw submissions, overdraw, LOD/visibility, texture residency, shader compilation, allocations and threaded loading. Profile a representative scene before choosing an optimization.
- GDExtension for native integration; engine compilation only when the project needs engine changes or custom export templates. The supplied [compilation index](https://docs.godotengine.org/en/stable/engine_details/development/compiling/index.html) is an engine-development path, not a prerequisite for making a game. Use platform-specific SCons/compiler instructions and compile matching templates.

Sources: [best practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/index.html), [performance index](https://docs.godotengine.org/en/stable/tutorials/performance/index.html), [engine source](https://github.com/godotengine/godot). Source-code access does not establish that a local build or export succeeded.

`godot-xr` should cover XROrigin3D/XRCamera3D/controllers, OpenXR initialization failure, action maps, recentering, controller/hand fallbacks, locomotion and comfort, haptics, XR UI, passthrough, spatial anchors and session lifecycle. Evaluate [Godot XR Tools](https://github.com/GodotVR/godot-xr-tools) and the [OpenXR Vendors plugin](https://github.com/GodotVR/godot_openxr_vendors) against the exact engine version instead of reinventing interaction components.

**Resolve the documentation contradiction explicitly.** [XR setup](https://docs.godotengine.org/en/stable/tutorials/xr/setting_up_xr.html) recommends Mobile for Quest 3; [Android deployment](https://docs.godotengine.org/en/stable/tutorials/xr/deploying_to_android.html) still includes a Compatibility warning, while also noting that the vendor plug-in becomes optional but recommended from Godot 4.6. Record both, pin a release, then validate the target renderer and required extensions. Do not turn the older warning into a permanent “never Vulkan” rule. The [official Vendors update](https://godotengine.org/article/godot-xr-update-may-2026/) confirms continued extension work, not universal feature parity across engines.

## Unity: own the project contract, reuse Meta's specialist operations

Propose `unity-3d-vr-games` with build, audit, optimize and upgrade modes. The [current Hello World](https://developers.meta.com/horizon/documentation/unity/unity-tutorial-hello-vr/) starts with Unity 6.1+, Universal 3D/URP, OpenXR, Meta SDKs, setup validation and Building Blocks. It distinguishes macOS build/deploy from Windows-only Link preview. Treat this as the tutorial's version requirement, not a universal compatibility promise for every existing project.

The skill should:

- Read ProjectVersion, package manifest/lock and ProjectSettings before editing; define the target devices, render pipeline, Android architecture and release build profile.
- Choose ownership of interaction: Meta Interaction SDK or XR Interaction Toolkit, documenting any deliberate coexistence. Do not duplicate camera rigs, input providers or event systems.
- Use prefabs and serialized references safely, preserve `.meta` GUIDs, review scene/prefab changes, pool expensive runtime objects, and check allocations and asset-loading lifetimes.
- Map MRUK, hands, passthrough/depth, colocation/shared anchors, avatars, spatial audio and Platform SDK to isolated verification scenes. Meta's [Discover sample](https://developers.meta.com/horizon/documentation/unity/unity-sample-discover/) illustrates the combined system; it is not proof that every feature works in a consumer's version.
- Run EditMode/PlayMode tests and build automation as available, then deploy the exact APK and capture device behavior/performance. Distinguish an editor success from an Android success.
- Delegate narrow operations to pinned `hz-unity-*` companions. If absent, use the same documented procedure. [Unity MCP](https://github.com/CoplayDev/unity-mcp) is a community editor bridge, not the owner of Meta compatibility or shipping quality.

## Unreal: engine workflow plus a distinct Quest profile

Propose `unreal-development` with an on-demand Quest reference. Cover `.uproject`/plugins, C++ modules and reflection, Blueprint/C++ boundaries, asset references/cooking, Enhanced Input, animation/retargeting, replication authority, automated tests, commandlets and packaged build verification.

For Quest, read the [Meta compatibility matrix](https://developers.meta.com/horizon/documentation/unreal/unreal-compatibility-matrix/) before selecting Epic+plugin versus Meta's fork. The matrix has feature differences; “install the latest Unreal” is not a reproducible recipe. Check [OpenXR backend selection](https://developers.meta.com/horizon/documentation/unreal/unreal-openxr/), [mobile forward rendering](https://developers.meta.com/horizon/documentation/unreal/unreal-forward-renderer/) and [Vulkan prerequisites](https://developers.meta.com/horizon/documentation/unreal/os-vulkan-opengl/). Desktop Nanite/Lumen expectations must not silently become the standalone Quest baseline.

[Epic's Unreal MCP documentation](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor) currently presents an experimental editor-local HTTP server, separate toolsets and serial game-thread execution. Prefer evaluating it first on a compatible editor. Keep calls sequential, bind locally and discover enabled tools. Older projects can use [Python/editor automation](https://dev.epicgames.com/documentation/unreal-engine/scripting-and-automating-the-unreal-editor) without introducing an unreviewed MCP. Neither path replaces a cooked Android build.

## Performance and comfort evidence

Proposed report fields: build hash, device/model, OS, engine/SDK/renderer, scene, refresh rate, render resolution, CPU/render/GPU timing distribution, dropped/stale frames, memory, sustained run duration, thermal/power state, input path and capture overhead. Compare before/after under the same workload. Frame deadline is `1000 / Hz` milliseconds; a peak or average FPS alone is insufficient.

Investigate CPU scheduling/physics/GC, GPU overdraw/shaders/shadows, texture memory, bandwidth, asynchronous asset uploads, shader warmup and compositor layers independently. Foveation, dynamic resolution, multiview and SpaceWarp each need support checks and artifact-specific validation. Spatial/renderer claims require headset evidence, not only a simulator.

Include seated/standing play, dominant-hand alternatives, reach and text legibility, optional smooth locomotion, snap turning, tracking loss, reserved system gestures, captions and spatial-audio alternatives. These become project scenarios under the existing UX owner; an engine skill implements and tests them. The entry to current platform guidance is [Meta design](https://developers.meta.com/horizon/design/).

## Publishing and distribution

App Lab is historical: Meta [moved its content into Horizon Store](https://developers.meta.com/horizon/blog/get-apps-ready-app-lab-meta-horizon-store-meta-quest-developers/) starting in August 2024. Early Access is not a new App Lab transport. Separate developer sideloading, invited release-channel testing, store review/release and browser/PWA delivery. SideQuest may aid distribution/discovery, but cannot certify Horizon Store compliance.

The proposed Store evidence bundle should include:

- Release APK identity and versionCode, signature verification, manifest inspection, architecture, install/upgrade/cold-start proof and supported devices. Re-check the [release manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/) for the app's creation date and target SDK requirement.
- A versioned [VRC](https://developers.meta.com/horizon/resources/publish-quest-req/) checklist, one evidence artifact per applicable requirement, and N/A reasons for requirements outside the app type. Never copy an old retired rule as mandatory.
- [Channel](https://developers.meta.com/horizon/resources/publish-release-channels/) audience and build identity, tester entitlement, promotion/rollback process, review status and an explicit public-release decision.
- Platform-service access/DUC, age-rating and privacy requirements checked in the actual dashboard; rights for submitted media; store screenshots from the real build. Confirm current [app configuration](https://developers.meta.com/horizon/resources/publish-overview-appID/) and [review process](https://developers.meta.com/horizon/resources/publish-app-review/) at submission.

Horizon OS is the device operating system; Horizon Store distributes apps; Horizon Worlds is a separate authoring/runtime surface. A Worlds experience is not the same deliverable as a Unity/Godot/Unreal APK. Add a Worlds-specific skill only after a concrete Worlds task and its current official tooling have been evaluated.
