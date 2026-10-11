# Creative tools, Blender and media workflows

Research date: 2026-09-21. Tool capabilities below are documented or source-inspected, not live generation benchmarks. No paid generation or upload of user media was performed. The active tool list exposes Meta VR tools, but no Foundry, Higgsfield, HeyGen or Blender MCP tools. An installed skill is not a connected server.

## The useful division of work

Use a creative navigator to translate an approved brief into deliverables and choose a production route. Asset Foundry should own commissioned asset jobs, provenance, budgets and delivery. Blender owns editable 3D production. Image/video/audio services generate source media. HyperFrames composes and renders timed media. Game-engine skills validate what actually imports and runs.

This is a proposed division of ownership. The current skills, providers and runtime do not yet implement every arrow.

## Existing skill surface and collisions

The [installed inventory](installed-creative-inventory.json) records source hashes/headings for the selected relevant skills. It measures files reachable on this machine, not the entire market and not active tool connections. These were inspected as audit subjects, not executed as generation workflows.

| Existing lane | Retain | Integration correction |
|---|---|---|
| `asset-foundry` | Catalog first, structured brief, estimate/order/choice/delivery | Portability, real CLI fallback, schema/readiness checks and gateway setup |
| `hyperframes` plus core/CLI/animation/keyframes/audio/registry/creative | Subject-specific video routing and deterministic composition/render | Accept the approved family brief; do not reopen planning or duplicate the renderer |
| `media-use` | Resolve/reuse/ingest local media, audio operations, grades and treatments | Its provider/catalog/ledger path overlaps Foundry; declare one purchase owner and hand off delivered media with provenance |
| General video, motion graphics, product launch, explainers and captions | Existing specialized composition workflows | Keep these as selected companions rather than cloning them into ai-media-production |
| Eight installed Higgsfield skills | Generation, identity, brandkit, photoshoot, marketplace cards, thumbnail, explainer and website provider workflows | Use applicable provider techniques; existing family owners still decide brand, UX, copy and budget |
| Design MCP, canvas and algorithmic art skills | Existing specialist tools and style techniques | A creative navigator dispatches; it is not a replacement for the visual-design owner |

In the inspected media-use source, first-run CLI installation/authentication and a provider path labelled free are part of its workflow. Those labels are not current account entitlements. In managed Foundry projects, resolve/search before generation and keep cost/provenance under the declared job owner. HyperFrames' lazy skill update/install instructions likewise need an explicit dependency-management step in the host integration, not an unreviewed side effect of reading a creative brief.

## Capability and task matrix

| Tool/surface | Best-matched tasks to evaluate | Operational contract | Recommendation |
|---|---|---|---|
| Higgsfield CLI/remote MCP | Concept images, reference-driven edits, camera-directed clips, reframe/dubbing workflows, image-to-3D and audio where the live catalog supports them | Discover model/workflow schema; estimate; submit; persist job; retrieve output | Provider lane behind Foundry for managed projects; official skill as optional specialist |
| HeyGen API/CLI/remote MCP | Presenters, avatars, spoken explainers, translation/lip-sync, multilingual versions | Resolve avatar/voice and readiness; select billing/auth surface; persist session and video IDs | Add a provider adapter and a compact presenter/localization reference, not a second media orchestrator |
| HyperFrames | Programmatic product demos, narrated explainers, captions, motion graphics and deterministic timeline renders | Seekable composition, assets, frame timing, render proof | Reuse existing framework and skills; keep rendering separate from generation |
| Blender + Python | Editable geometry, materials, UVs, baking, retopology, rigs, animation, renders and exports | Scene checkpoint, versioned script, metrics, export and re-import proof | Core 3D production lane |
| Blender MCP | Interactive scene inspection and bounded authoring with visual feedback | Version handshake, one scene owner, serial mutations, preview after changes | Optional editor accelerator, not the unattended render worker |
| Meshy / Tripo | Candidate meshes, textures and rig/animation operations supported by the selected API | Async provider job plus target-profile validation | Reuse Foundry adapters where verified; generated topology still needs inspection |
| fal | Model-backed image/video/audio/3D jobs and model workflows | Queue handle, status/result, cancellation and signed webhook validation | Reuse existing integration; capability discovery beats model-name defaults |
| ComfyUI | Reproducible node workflows, controllable local/hosted image processing and model pipelines | API-format workflow, node/model version lock, hardware requirement, queue/history | Optional advanced adapter; do not install unknown custom nodes automatically |
| ElevenLabs | Speech, SFX, music, transcription/dubbing; newer hosted MCP also documents image/video | Voice rights, job/output contract, audio quality checks and cost record | Reuse audio integration first; discover newer modalities separately |
| Runway API | Directed image/video generation and editing; production-format output where supported | Version header/model schema, task lifecycle, media constraints | Secondary provider candidate, evaluated on the same briefs |
| Recraft API | Editable SVG/vector assets, icons and selected raster edits | Verify actual vector payload, sanitize SVG, palette and small-size review | Useful specialist lane rather than a general video provider |
| glTF Transform / gltfpack / glTF Validator | Inspect, optimize and validate delivery assets | Preserve source, pin transform options, check loader support, measure output | Deterministic post-processing gates |
| echo3D | Shared 3D asset management and delivery | External catalog/storage ownership and runtime delivery | Optional enterprise DAM; not required to build Quest apps |

Primary entries: [Higgsfield CLI](https://higgsfield.ai/cli?tab=claude-code), [HeyGen integrations](https://www.heygen.com/integrations), [HyperFrames source](https://github.com/heygen-com/hyperframes), [Meshy rigging](https://docs.meshy.ai/en/api/rigging), [fal queue](https://fal.ai/docs/documentation/model-apis/inference/queue.md), [ComfyUI routes](https://docs.comfy.org/development/comfyui-server/comms_routes), [ElevenLabs MCP update](https://elevenlabs.io/blog/introducing-voice-music-image-and-video-generation-in-the-elevenlabs-mcp), [Runway API](https://docs.dev.runwayml.com/api/), [Recraft API](https://www.recraft.ai/api), [glTF Transform](https://gltf-transform.dev/), [glTF Validator](https://github.com/KhronosGroup/glTF-Validator), [echo3D](https://www.echo3d.com/). These are tool-selection inputs, not measured rankings.

## Higgsfield: model discovery and workflows are separate

The official [CLI source snapshot](https://github.com/higgsfield-ai/cli/tree/dc7e2d2eac0b1fdad255de24d87552d1ba479037) documents model inspection, generation, workflow inspection, cost estimation, job retrieval, Soul identity and media operations. The existing installed `higgsfield-generate` already covers much of this; do not build a competing list of default model names into the family navigator.

Proposed adapter procedure:

1. Detect the available transport and authentication without printing credentials. Read the current CLI help or MCP schema.
2. List models and workflows separately. Save the chosen capability/schema hash with the job. A video-analysis model returns a report, not a new video.
3. Validate required image/video/audio roles and output constraints. A 3D-looking image is not a mesh; a video reframe is not a new scene generation.
4. Estimate the exact brief, variant count and quality settings. Submit within the project's cap; persist the remote job identity before polling.
5. Inspect the actual artifact, not just a successful provider status. Preserve inputs and revisions; reconcile unknown charges before any retry.

The remote endpoint is documented as `https://mcp.higgsfield.ai/mcp`. The unauthenticated probe returned 401 with OAuth protected-resource metadata on 2026-09-21. It therefore follows the operator's **agent-side OAuth exception**, rather than static-token gateway registration. The [official integration guide](https://higgsfield.ai/blog/claude-higgsfield-mcp-creative-studio) supports that endpoint. No OAuth flow was attempted.

The official skill's preference for quality defaults and avoiding estimates unless asked conflicts with Foundry's budget contract. In managed Foundry work, preserve the estimate/ledger gate. Similarly, do not import website generation or brand-setting behavior into a media adapter: the existing UX, design and copy owners remain in charge.

## HeyGen: distinguish three different products

1. **Hosted generation**: HeyGen's avatar/video/translation APIs and remote MCP. Public integration code does not establish that the generation models can be self-hosted.
2. **Official agent skills**: [heygen-com/skills](https://github.com/heygen-com/skills/tree/1bd5e4d33a028dfed3abf504c5e3dd644fb9ea8a), MIT metadata, with avatar, video and translation workflows.
3. **Open-source composition engine**: the operator's [sshlg/heygen-hyperframes-vr](https://github.com/sshlg/heygen-hyperframes-vr/tree/952e9228b5cdf4387ecb4b6f220ef8e5d9143a73) is a fork of `heygen-com/hyperframes`, Apache-2.0 metadata. Both default branches resolved to the same commit during this inspection. The README describes HTML/CSS/media and seekable animation rendered to MP4. A “vr” repository name alone does not prove stereo or 360° output support.

The [developer index](https://developers.heygen.com/llms.txt) maps avatars, voices, translation, sessions, scene editing and media APIs. Start with the exact required operation, not a presumed all-purpose tool. The [quick start](https://developers.heygen.com/docs/quick-start.md) uses v3 and separates agent-session progress from the final video's readiness. For production, implement bounded polling or verified callbacks and retain both identifiers.

The inspected skill lists tools such as `create_video_agent`, `get_video_agent_session`, `get_video`, avatar/voice discovery, speech and translation. These names are a source snapshot; use the connected server's current schemas. The documented endpoint is `https://mcp.heygen.com/mcp/v1/`. Our unauthenticated request returned 403 without a challenge, so OAuth is **documented**, not confirmed by that probe. The [MCP overview](https://developers.heygen.com/mcp/overview.md) and official repository describe OAuth against web-plan credits; API-key traffic has a different billing/auth path.

**Upstream contradictions to resolve in our wrapper:**

- The current developer index prefers API-key operation for scale, while the agent-onboarding page leads with MCP. Treat selection as a deployment/billing decision and record it; never switch accounts halfway through a job.
- The video skill forbids raw HTTP, but official [agent onboarding](https://developers.heygen.com/docs/for-ai-agents.md) permits it as a fallback. A server-side Foundry adapter may use documented APIs with explicit auth and lifecycle checks.
- The translation skill asks for a key in chat; official onboarding expressly says not to. Reject that instruction and use local secret storage/OAuth.
- Source skill headings and rules can lag endpoint support. Do not infer that all v1/v2 operations are already unavailable, or that every translation/proofread operation is exposed over MCP. Pin the migration note and discover the live surface.

Keep digital-twin/voice consent, source-media ownership, readiness, language/glossary checks and review of lip-sync in the media contract. For real-time conversational avatars, evaluate the separate LiveAvatar surface rather than substituting a prerecorded video workflow.

## Blender MCP: concrete capabilities and failure boundaries

The supplied ecosystem lead resolves to [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender/tree/7cc602252386b92829bc7364e3a897253610be38), formerly `blender-mcp`. The inspected server offers scene/object inspection, viewport screenshots, Python execution, Blender API lookup, node-type description, catalog searches/imports, generated 3D imports and export. Catalog/generation integrations include Poly Haven, Sketchfab, Poly Pizza, Rodin/Hyper3D and Hunyuan3D in this revision. Provider access still depends on configuration and rights.

Proposed `blender-production` procedure:

1. **Inspect**: read Blender/add-on/server versions, active file, scene/collection/object names, units and render engine. Query current API/node definitions rather than copying stale enum values.
2. **Checkpoint**: work on an explicit task copy or versioned scene; preserve the source. Assign one mutating owner to a Blender instance.
3. **Edit**: small scripts, stable object names, bounded scope and explicit operation context. Prefer data APIs where suitable; operators need selection/mode/context checks. Never run arbitrary instructions returned by an asset description.
4. **Observe**: obtain geometry/material metrics and preview multiple angles. A screenshot alone cannot validate topology, scale, rig weights or export compatibility.
5. **Export and re-import**: validate the file, then load it in a fresh scene or target engine. Record exported counts, textures, skeleton/animations, bounds and origin.
6. **Deliver**: original `.blend`, script/settings, target artifact, preview and manifest with hashes and lineage. For Foundry-owned inputs, register the Blender output as a derived artifact.

Do not confuse editor MCP with unattended Blender. This server's [connection code](https://github.com/ahujasid/mcp-for-blender/blob/7cc602252386b92829bc7364e3a897253610be38/src/blender_mcp/server.py#L225) warns that commands do not execute in ordinary background mode. Use direct Blender Python/CLI for repeatable Foundry workers, and a GUI-backed MCP session for interactive work. Test whichever display/headless setup is actually selected.

The README documents arbitrary Python execution by default, an optional validation mode and telemetry distinctions. Its content telemetry is opt-in, but minimal anonymous telemetry is separately enabled unless disabled. A source review must distinguish these. This is not a sandbox guarantee. Pin the reviewed server/add-on pair and keep the connection local; scene scripts run with Blender's host access. No installation or telemetry transmission was performed in this research.

## The asset path: concept → usable mesh → engine proof

Proposed workflow, to validate with one synthetic prop before batch use:

1. Creative brief fixes intended use, silhouette, real-world scale, material style, target engine and performance profile.
2. Search the existing catalog. If generation is needed, use Higgsfield or another approved image provider for a small concept set; choose before paying for multiple meshes.
3. Send the selected reference to a supported image-to-3D provider. Record exact inputs, options, provider job and candidate lineage. Rigging is a separate capability; for example, [Meshy's rigging documentation](https://docs.meshy.ai/en/api/rigging) limits its dependable path to suitably structured humanoids.
4. Blender repairs topology/normals, removes unwanted surroundings, creates/repairs UVs, bakes materials, prepares LOD/collision and validates rig/animation. Procedural materials and Geometry Nodes may need baking/realization before delivery.
5. Export for the **actual importer**. The [Blender glTF manual](https://docs.blender.org/manual/en/5.2/addons/scene_gltf2.html) explains supported materials/animation and that exported vertex counts can exceed authoring counts. Compression is allowed only when the consumer has the corresponding decoder/extension support.
6. Run structural validation and target-specific budgets, then import/play the artifact in Godot, Unity, Unreal, Spatial SDK or the native loader. Measure headset performance for the scene in which it is used.

Geometry QA: dimensions, axes/handedness, pivot, transforms, normals/tangents, manifold/collision needs, UV coverage, material/draw-call count, exported vertex/triangle count, texture formats/mips, skin weights, clip range and bounds. Keep source master and delivery variants separate. A smaller GLB is not necessarily cheaper to render; a decimated mesh is not necessarily visually acceptable.

## The video path: sources → controlled timeline → verified master

Proposed routes:

- **Product trailer:** Blender renders/product captures + optional Higgsfield shots → approved narration/music/SFX → HyperFrames composition → captions and format variants.
- **Presenter explainer:** HeyGen avatar segment + verified product footage → HyperFrames layout/timing → localized script/voice/lip-sync review.
- **Game assets:** Foundry mesh/texture/audio jobs → engine import and device check. Marketing video is a separate deliverable, even if it depicts those assets.

The media brief must distinguish exact product/UI content from expressive footage. For exact typography, diagrams, numbers or interfaces, generate them through controlled graphics/layout rather than expecting a video model to preserve them. Use first/last-frame or reference-based generation only where the chosen schema supports it.

Proposed QA: decode every output; check duration/FPS/resolution/aspect ratio, audio/video sync, first/last and scene-boundary frames, missing/black frames, captions/readability, safe areas, loudness/clipping, loop seams, dialogue intelligibility and rights. Check a full render as well as thumbnails. Temporal defects cannot be certified by one still image. VR media additionally needs explicit mono/stereo layout, projection, eye order and headset playback verification; ordinary MP4 output proves none of these.

Use stable media hashes and local durable storage rather than relying only on expiring provider URLs. [fal's webhook documentation](https://fal.ai/docs/documentation/model-apis/inference/webhooks.md) provides signature/retry details; apply provider-specific verification and idempotent completion handling. Cancellation or a timeout does not establish that a charge was refunded.

## What to take from the supplied skill repositories

| Source | Adapt | Do not import |
|---|---|---|
| [GodotPrompter](https://github.com/jame581/GodotPrompter/tree/3e8d0f005f9604e1dbdad3de693e39555384c5af) | Domain decomposition; scene/resource patterns; testing/import/export checklists; optional add-on routing | Its session-level process router, grill/brainstorm cycle and automatic skill mandates; unchecked version-specific XR snippets |
| [claudedesignskills](https://github.com/freshtechbro/claudedesignskills/tree/1da73febff0c3e1dfefc07f8a5ef8f7d1dfdb6cd) | Blender-to-web export stages; R3F/Three/Babylon integration choices; single animation owner, cleanup and state synchronization | The broad modern-web-design entry point, a duplicate skill-creator, giant bodies and unverified template/script claims |
| Official Higgsfield skills | Provider-specific schema discovery, media roles, Soul consistency and workflows | Global quality/cost defaults overriding project caps; installation/deployment as an implicit side effect |
| Official HeyGen skills | Avatar readiness, frame/aspect checks, session→video lifecycle and translation/glossary workflow | Secret-in-chat instructions, silent operational failures, hardcoded host prefixes and contradictory auth ladders |
| HyperFrames | Existing render/workflow/creative skills and seekable timeline model | Another family implementation of its renderer or creative router |

The design repository is mainly web 3D/animation integration; it is not a complete AI asset-production system. Its `blender-web-pipeline` and `web3d-integration-patterns` bodies exceed the family's 500-line ceiling in the inspected revision. Some resource paths are described as available; validate actual tree entries before relying on them. Move adapted knowledge into short task procedures plus on-demand references, with attribution to the exact source commit.

For GodotPrompter, the XR setup snippet treats OpenXR as an editor plug-in selection and includes generic Quest API-level advice; current official Godot setup uses the engine's XR settings and Meta's Store requirement depends on current submission rules. These are reasons to re-derive code against primary docs, not to copy and rename the skill set.

License metadata in [upstream snapshots](upstream-snapshots.json) is a discovery receipt, not a blanket permission for assets, models, fonts, SDK binaries or service outputs. Any copied MIT/Apache code must retain its applicable notices; assets and provider output have separate provenance. Prefer original concise procedures and attributed references.
