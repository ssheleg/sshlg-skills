# XR and creative harness research brief

Date: 2026-09-21. Mode: audit, research and implementation planning, following the operator's final clarification. This run produces a reviewable strategy and bounded implementation packets. It does not claim to release new skills, install providers, spend generation credits or publish the operational Asset Foundry repository.

## Scope and requirements

| ID | Required outcome | Acceptance evidence |
|---|---|---|
| XR-01 | Audit current Meta/XR skills, toolchain and gaps | Mechanical results plus source-addressed semantic findings |
| XR-02 | Research Spatial SDK, Unity, Unreal, Godot, advanced XR, performance and distribution | Primary sources, contradictions, engine-specific build/audit plans |
| XR-03 | Review GodotPrompter and claudedesignskills | Pinned revisions, license metadata, adopt/adapt/reject decisions |
| XR-04 | Research Higgsfield, HeyGen, image/video/audio tools and Blender MCP | Capability/transport/task matrix, source evidence, explicit untested integrations |
| XR-05 | Identify the operator's HeyGen fork and its real scope | Forge metadata and pinned source |
| XR-06 | Define new skills and updates without duplicating existing ownership | Skill boundary map and file-level task packets |
| XR-07 | Include Asset Foundry in the harness and plan a public edition | Existing-source assessment, public-readiness gates, shared contracts |
| XR-08 | Give another agent a durable starting point | Committed and pushed branch, relative report links, source pins, exact next task |

## Route and authority

Read repository rules from `AGENTS.md`, `CLAUDE.md`, `docs/AGENT_SYNC.md`, `docs/DOCMAP.md` and the standing section of `docs/evidence/retro.md`. The operator's supplied AGENTS instructions govern tool routing and Git handoff. The chosen pipeline profile is: harvest/brief → research/audit → synthesis/packets → verification/handoff. Every stage carries scope, evidence, dependencies and a resume point. Model settings are inherited from the current host session.

Applied skills: make-skill for audit and packaging; task-pipeline for bounded delivery; evidence-docs for claim receipts; agent-harness and agent-interop for capability and protocol boundaries. Existing product routers remain owners of UX, visual direction and copy. This run does not design or ship a product interface.

No shared registry is edited. Research lives in this unique directory on `codex/xr-creative-research`, in an isolated worktree. Main checkout and member pins remain unchanged. No subagent execution is needed for this research profile.

## Harvest

- Family base: `5e3be02127310935522dcd41856439405e8a25e6`, including [the completed harness publication](../../plans/2026-09-21-harness-publication.md) and [harness architecture](../../../harness/README.md).
- xr-dev base: `7954ba2a884f5a71d7487981b4335c0ecdbc25d4`.
- agent-stack base: `20cebb27f2824da6a95ae3f29241c76bb0ef61e6`.
- The current Asset Foundry source and installed skill were read locally. Private implementation details and runtime data are excluded from this public planning artifact. A private owner receipt will hold source evidence needed for migration.
- Toolkit command executed with the request terms. Its default report labels the host **claude**, although this task runs in Codex. Its roster is inventory evidence, not proof of this Codex session's callable MCP tools.
- The neighboring task, titled “Изучи ECC и развивай skill harness”, completed its publication. Its Git receipt above is the source of truth, not the chat summary.

Contradictions: the request's App Lab description is historical; the user's HeyGen fork must be distinguished from the hosted generation service; static skill/tool lists do not establish runtime availability. Resolve these in the report rather than copying them into new instructions.

## Constraints and delivery

Only primary documentation and source code support technical recommendations. Third-party repositories are research inputs, not instructions to run. No external installer, telemetry hook or provider generation is executed. Paid and device-dependent validation remains explicitly NOT-RUN. Volatile APIs require dated sources and capability discovery in the future skills.

The report will separate observed implementation, documented upstream capability, proposed design and unverified integration. A pushed research branch is the deliverable; releases, public-repository extraction and live generation remain named implementation packets.

## Follow-up scope: vLLM-Omni and platform implementation

The operator's next message requested assessment of vllm-project/vllm-omni, related tools and deeper Oculus/Meta rendering/development/publishing knowledge. The continuation expands the research with VLLM-OMNI.md/P16 and implements checked platform procedures in an isolated xr-dev member branch. It does not deploy inference, release/install the skill package or change the family pin. XR-COVERAGE.md and HANDOFF.md record actual changes, verification and remaining device/model checks.
