<sub>ssheleg skills — make-skill · task-pipeline · evidence-docs · agent-interop · quest-native · quest-perf · quest-store</sub>

# Quest platform follow-up: coverage and implementation

Date: 2026-09-21. This extends [XR](XR.md) and [PACKETS](PACKETS.md) after the operator requested vLLM-Omni research and deeper Oculus/Meta development, rendering and publishing knowledge. Existing xr-dev skills were edited on `codex/xr-platform-coverage`; these changes are a reviewable branch, not a released/installed package. [HANDOFF](HANDOFF.md) records the exact member revision.

## Knowledge added to the six existing owners

| Owner | New distributable reference | What the agent can do with it |
|---|---|---|
| quest-native | `references/project-playbook.md` | Identify actual runtime/engine, capture a target contract, build a representative slice, audit unfamiliar source and separate runtime AI from the frame loop |
| quest-native | `references/mixed-reality.md` | Select MR features, separate support/grants/tracking, handle room/camera/anchor/input lifecycle, plan shared physical play and data paths |
| quest-perf | `references/rendering-playbook.md` | Choose measured experiments for stereo, fill, bandwidth, geometry, memory, foveation, layers, reprojection and latency |
| quest-store | `references/production-readiness.md` | Verify the exact APK/product/account path, manifest/policy drift, purchases/saves/social/privacy, review states and recovery |
| quest-spatial | `references/build-and-audit.md` | Build/audit without a Meta companion, inspect actual versions, manage ECS/panel lifecycle and validate assets/mixed workloads |
| quest-tooling | `references/research-navigation.md` | Resolve a narrow question through primary docs/sample/runtime evidence, select tools and use gateway-aware or no-tool fallbacks |
| quest-webxr | `references/runtime-delivery.md` | Negotiate browser features and sessions, preserve ordinary-screen behavior, validate asset/hosting/PWA paths |

Bodies link each module at the point of use. No huge model catalog, downloaded documentation tree or third-party installer is embedded in a skill. Platform facts are dated; task procedures produce evidence and explicit NOT-RUN results.

## Additional findings resolved or bounded

1. **Release category:** current Meta native and release pages name `com.oculus.intent.category.VR`; the existing native/store skill taught a generic `IMMERSIVE_HMD` category as the release requirement. Updated the bodies and manifest reference; instruct agents to inspect merged APK output and preserve other SDK-required categories deliberately. [Native source](https://developers.meta.com/horizon/documentation/native/android/mobile-native-manifest/), [release source](https://developers.meta.com/horizon/resources/publish-mobile-manifest/).
2. **Target SDK:** an old all-uploads announcement is superseded by the official February amendment limiting the March-2026 target-34 rule to newly created Dashboard apps. The current skill's creation-date rule is retained and its conflict-resolution evidence made explicit. [Amended announcement](https://developers.meta.com/horizon/blog/meta-quest-apps-android-14-march-1/).
3. **Camera permissions:** overview/component/native pages disagree on either versus both permissions. The skill records that discrepancy and the API/version-specific verification path. It does not resolve it by automatically adding every permission. [Overview](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-pca-overview/), [native guide](https://developers.meta.com/horizon/documentation/native/android/pca-native-documentation/).
4. **Camera release testing:** current docs allow Store publication; the original experimental ban is historical. XR Simulator does not validate this API, and MQDH sideloading can bypass some parental restrictions, so account/release-channel proof is separate. [Public release](https://developers.meta.com/horizon/blog/new-era-mixed-reality-passthrough-camera-api-machine-learning-computer-vision/), [current limitations](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-pca-overview/).
5. **Rendering:** fixed versus eye-tracked foveation, subsampled layout, multiview, layers, symmetric projection and SpaceWarp have different dependencies and tradeoffs. Removed universal CPU+GPU sum, stale-count diagnosis and automatic thermal/rate claims; replaced them with trace-based decisions. [FFR](https://developers.meta.com/horizon/essentials/fixed-foveated-rendering/), [multiview](https://developers.meta.com/horizon/documentation/unreal/unreal-multi-view/), [layers](https://developers.meta.com/horizon/essentials/compositor-layers/).
6. **Platform services:** added purchases/restore, entitlement, attestation, Cloud Backup, invites/presence and account/data review. Cloud Storage V2 is retired; group presence/shared anchors are not a game-state synchronization backend. [Cloud Backup](https://developers.meta.com/horizon/documentation/unity/ps-cloud-backup/), [Group Presence](https://developers.meta.com/horizon/documentation/native/ps-group-presence-overview/).
7. **Agent verification:** XR Operator can support an experimental simulator interaction loop; it cannot certify headset thermals, camera/account restrictions or human comfort. [Official description](https://developers.meta.com/horizon/blog/meta-xr-operator-close-the-build-test-verify-loop-for-vr/).

## Coverage by project phase

| Phase | Questions the skills now require | Output |
|---|---|---|
| Discovery/planning | Which engine, runtime, target device/OS, input, MR features, account/data/offline requirements? | Target/capability contract with sources and unresolved questions |
| Implementation | What is the smallest representative slice? Which lifecycle/resources are owned where? | Buildable slice, explicit module/input/asset contracts |
| Content | What must the target importer actually load? | Master, delivery variant, provenance, import/animation/collision checks |
| Rendering | Which stage misses its deadline and which experiment addresses it? | Paired traces/settings and visual regression evidence |
| MR/social/AI | What is unavailable, denied, stale, disconnected or shared? | Tested fallback and state/permission/network boundaries |
| Release | Which exact signed build, account and rule set were validated? | VRC/product evidence, channel/test/review/release status |
| Operation | Can users upgrade/restore/reconnect, and what triggers recovery? | Monitoring owner, compatibility and rollback plan |

This is coverage of common task classes, not a promise to solve every future SDK feature from memory. The research navigator is the mechanism for unfamiliar work: inspect actual target → authoritative page/API → compatible sample → minimal experiment → durable evidence. New engine-specific game-dev skills remain planned separately; a platform reference does not substitute for their scene/editor/build expertise.

## Validation and limits

Member gates passed after the edits: structure/version/reference checks (6 skills, 17 references), 8 planted negative defects, 11 installer cases, both strict plugin validations, 18 trigger cases/13 behavioral scenarios schema validation, and all six house audits with zero gaps. Seven scenarios were added; existing installation/panel expectations were corrected. These are **not independent executed model evaluations**. No headset, engine build, real GPU generation or Store submission was run.

All 44 external URLs in the seven new references returned HTTP 200 in the link check; [receipt](xr-platform-source-links.json). This proves retrieval, not semantic correctness or continued uptime. The member handoff retains checks and remaining behavioral/device work. Release/version bump/install/pin updates are intentionally pending review.

## vLLM-Omni placement

See [VLLM-OMNI](VLLM-OMNI.md) and P16. First use it for optional off-device source-media production through Foundry. Later NPC/visual-assistance experiments require a distinct latency, consent and offline contract. Do not put generation on a render/physics deadline or treat generated video as a collision-ready world.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — expanded portable XR skills and checked packaging
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — delivered bounded member changes and handoff
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — verified primary sources and recorded test limits
- [`agent-interop`](https://github.com/ssheleg/agent-stack) — assessed the Omni API and Foundry boundary
- [`quest-native`](https://github.com/ssheleg/xr-dev) — structured project and MR coverage
- [`quest-perf`](https://github.com/ssheleg/xr-dev) — structured rendering experiments
- [`quest-store`](https://github.com/ssheleg/xr-dev) — structured product and release readiness
