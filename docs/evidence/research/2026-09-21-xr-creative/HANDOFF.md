# Handoff: XR and creative harness strategy

Start with [README](README.md), then [PACKETS](PACKETS.md). Shared ownership and schema decisions are in [ARCHITECTURE](ARCHITECTURE.md). This is a research/planning handoff; all implementation packets remain open.

## Owner index

| Owner / remote | Branch | Source or receipt commit | Status / entry |
|---|---|---|---|
| `git@github.com:ssheleg/sshlg-skills.git` | `codex/xr-creative-research` | report `516e906e6e6ad51ceda0195e30713fa74b69964d`; delivery receipt below | This report; [README](README.md) |
| `git@github.com:ssheleg/asset-foundry.git` (private) | `codex/creative-public-readiness` | `c9ba900ba6d5f57390f557bc8d1559dae36fa810` | [Private source assessment and exact next task](https://github.com/ssheleg/asset-foundry/blob/c9ba900ba6d5f57390f557bc8d1559dae36fa810/docs/research/2026-09-21-creative-public-readiness/README.md) |
| `git@github.com:ssheleg/xr-dev.git` | `main` inspected; no implementation branch created | `7954ba2a884f5a71d7487981b4335c0ecdbc25d4` | P01 proposed; [source inventory](xr-inventory.json) |
| `git@github.com:ssheleg/agent-stack.git` | `main` inspected; no implementation branch created | `20cebb27f2824da6a95ae3f29241c76bb0ef61e6` | Existing harness/interop ownership; no changes |
| `https://github.com/sshlg/heygen-hyperframes-vr` | `main` inspected; no implementation branch created | `952e9228b5cdf4387ecb4b6f220ef8e5d9143a73` | HyperFrames fork, [scope](CREATIVE.md#heygen-distinguish-three-different-products) |

`game-dev` and `creative-dev` are proposed package identities; no repository, release or installed copy was created. The current Foundry remains private. No parent submodule pin was changed; P14 must wait for reviewed member releases.

## Completed

- Measured relevant skill inventory and applied the declared family routes.
- Audited xr-dev and installed metavr/Foundry; separated formal validity from semantic findings and behavior evidence.
- Researched the supplied Meta/Godot/Unity/GitHub/Higgsfield leads plus Unreal, Blender and media production alternatives, with primary sources and pinned upstream metadata.
- Verified the user's HeyGen fork and distinguished hosted generation from open-source composition.
- Defined build/audit coverage, seven initial new skill candidates, shared asset contracts and 15 bounded implementation packets.
- Ran current xr-dev structural checks and Foundry offline tests; reproduced a clean-wheel failure in an isolated environment.
- Saved detailed Foundry source findings in its private owning repository.

## Decisions and open work

Retain xr-dev, existing family routers and useful provider/HyperFrames companions. Add engine and creative specialist owners; Foundry owns managed job/cost/provenance; Blender creates editable derivatives; engines and renderers prove consumption. Use the gateway policy according to transport/auth and editor lifecycle.

Open: P01–P15 implementation/release, behavioral evaluations, public Foundry extraction, live integrations and device/media proof. `realtime-graphics`, standalone audio, ComfyUI and other providers are conditional later candidates. No integration capability is claimed solely from a research entry.

## Exact next task

**Take P01 in xr-dev.** Refresh the repository and read its current rules. Reproduce XR-F01/F02 against the current skill text and official references, correct the budget/performance explanations, then add the missing-companion and gateway-aware paths. Run the existing checks plus the packet's behavioral cases. Save source-addressed findings and execution evidence; commit/push under the owner's policy. Do not start by creating an all-purpose creative router or installing every upstream MCP.

For the Foundry owner, the independent first task is P08/F01: reproduce the wheel failure and fix immutable resource packaging plus external writable config/data roots. A fake/free fixture is sufficient; credentials are not a prerequisite for this task.

## Checks and delivery

See [VERIFICATION](VERIFICATION.md) for commands actually run, results and limits. Before a future release, run member policy and verify parent pins; this planning branch does not authorize silently pinning unfinished member work.

Local-only: provider secrets/accounts, gateway and app configuration, job/catalog state, real project registrations/media, build caches and downloaded upstream trees remain outside the public report. The private receipt contains only task-owned research; it changes no operational settings.

Both report commits were pushed, their remote refs matched, and fresh clones passed the documented checks. Exact remote branch and fresh-checkout evidence is recorded in [delivery.json](delivery.json). A fresh checkout can run `verify_report.py` without submodules or local private paths. The private Foundry receipt requires authorized access; public readers can use the generic architecture and packets independently.
