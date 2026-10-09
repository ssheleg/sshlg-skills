# Pinned family portability audit — 2026-10-09

Scope: HC-2 and HC-4; audit only at the recorded input pins. Source owner payloads are unchanged by this commit.

## Coverage and reproducibility

- All 38 advertised skills from all 11 members at hub `6415e3e652da36ce5bd4d9638b1fdad90d76c1ce`, extracted with `git archive <pin>`; original dirty submodule contents were never inputs. One unavailable local object (agent-sync) was fetched by exact SHA into an isolated bare repository.
- 537 files hashed in [census.json](census.json); no symlink escapes. SHA-256 identifies the exact make-skill 0.29.1 auditor. Each row names its full member commit and relative skill path.
- `python3 <pinned make-skill>/scripts/audit_skill.py <pinned skill dir> --house --json`: 38/38 exit 0. Per-skill complete JSON receipts are beside this file. This is mechanical conformance, not runtime/semantic acceptance.
- [link-closure.json](link-closure.json): 1471 Markdown links inspected: 1459 exist inside the skill, 9 exist only outside its portable directory, 3 missing paths are intentional target-project examples in `templates/context.md:74–76`.
- [host-pattern-hits.json](host-pattern-hits.json): 164 candidate occurrences; these are a review index, not 164 defects. [semantic-review.json](semantic-review.json) accounts for every advertised skill.

## Confirmed findings and minimal owning changes

| ID | Owner and pinned address | Finding / minimal remedy |
|---|---|---|
| P-1 | make-skill `references/host-capabilities.md:27,51,157,182,250` | Contradicts correct SKILL.md capability detection: blanket Claude-only claims and copyable fallback erase real non-Claude subagents/MCP/commands/hooks. Scope adapter contracts; detect runtime feature and use same procedure inline only if absent. |
| P-2 | make-skill `references/agent-skills-spec.md:148`; `distribution.md:86,104,256`; `SKILL.md:90,183`; `surfaces.md:58`; `retrofit.md:128` | Stale negative matrix, all-non-Claude payload claim, Claude-only plugins/network claims and manifest-only validation contradict current host docs or this same pin. Separate portable format, actual distribution channel and versioned host extensions; keep Anthropic API restrictions scoped to its execution container. |
| P-3 | sheleg-dev `error-tracking/SKILL.md:260–263` | MCP/commands and shell setup falsely excluded on Codex/Kimi/Hermes. Branch on discovered MCP, shell/network and auth instead of host name. Other six pack-specific PreToolUse caveats correctly describe a shipped Claude adapter; do not erase them. |
| P-4 | agent-sync `SKILL.md:47,188,252`; `references/hooks.md:16` | Non-Claude hook capability denied universally and shared-root path assumed. Resolve directory containing active SKILL.md; state this shipped adapter is Claude-specific, other adapters require their own installation/validation and otherwise self-check/ungated. |
| P-5 | task-pipeline and evidence-docs `references/hooks.md:26,274` | Same false universal hook statement; correct both generated/identical doctrine copies through owning source, preserve manual checks and enforcement uncertainty. |
| P-6 | task-pipeline `references/certification.md:62–65`; project-audit `SKILL.md:34,119,122` | Four verifier procedures live outside portable skill payload; three project-audit doctrine links require an absent sibling. Bundle needed procedures/references inside each independent skill, keep canonical copies synchronized by checks; prove each skill works alone. |
| P-7 | super-ux brand-voice `SKILL.md:78`; ux-scenarios `SKILL.md:107`; ux-audit `SKILL.md:171` | Explicit delegation instructions need a same-batches sequential branch when no host-native delegate exists. Workflow remains understandable inline, but missing fallback is not a claimed native runtime failure. |

## Non-findings / boundaries

`$ARGUMENTS` is supported by Kimi too. Claude-specific `${CLAUDE_PLUGIN_ROOT}` hook examples are legal host extensions, not universal script dependencies. task-pipeline `references/build.md:33` already has an explicit no-subagent path. Two additional escaped links (task-pipeline doctrine-map to evidence-docs, crypto testing to Stripe testing) are navigational: required procedure is available locally. No package contents were deleted or host configuration/model/provider modified.

All four named hosts and other targets still require separate discovery/adapter evidence; 38 clean auditor exits do not prove their loaded runtime state. No provider calls, GUI reload or model outcome acceptance ran in this packet.

## Primary sources checked 2026-10-09

- [Kimi skills](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html): directory payloads, argument substitution, manual slash invocation and configurable roots.
- [Kimi agents](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html): native subagents.
- [Hermes toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/): delegation, shell, file tools, gated per session/toolset.
- [Cursor hooks](https://cursor.com/docs/hooks): host hooks and compatibility loading exist; this is not proof of our adapter installation.
- Root HC-1 research owns current Claude/Codex sources and the comprehensive host capability ledger; do not create a second universal matrix here.

## Per-skill disposition

| Member | Skill | Disposition |
|---|---|---|
| super-ux | vision | NO_CONFIRMED_HOST_DEFECT |
| super-ux | ux-foundation | NO_CONFIRMED_HOST_DEFECT |
| super-ux | ux-flows | NO_CONFIRMED_HOST_DEFECT |
| super-ux | ux-scenarios | FALLBACK_CLARITY_GAP |
| super-ux | ux-audit | FALLBACK_CLARITY_GAP |
| super-ux | brand-voice | FALLBACK_CLARITY_GAP |
| super-ux | copywriting | NO_CONFIRMED_HOST_DEFECT |
| task-pipeline | task-pipeline | GAP |
| task-pipeline | evidence-docs | GAP |
| task-pipeline | project-audit | GAP |
| agent-sync | agent-sync | GAP |
| make-skill | make-skill | GAP |
| sheleg-design | sheleg-design | NO_CONFIRMED_HOST_DEFECT |
| seo-aeo-audit | seo-aeo-audit | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | stripe-billing | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | crypto-payments | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | error-tracking | GAP |
| sheleg-dev | ad-tracking | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | google-signin | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | google-auth | NO_CONFIRMED_HOST_DEFECT |
| sheleg-dev | frontend-performance | NO_CONFIRMED_HOST_DEFECT |
| agent-stack | agent-orchestrator | NO_CONFIRMED_HOST_DEFECT |
| agent-stack | agent-evals | NO_CONFIRMED_HOST_DEFECT |
| agent-stack | agent-interop | NO_CONFIRMED_HOST_DEFECT |
| agent-stack | agent-harness | NO_CONFIRMED_HOST_DEFECT |
| telegram-dev | telegram-bots | NO_CONFIRMED_HOST_DEFECT |
| telegram-dev | telegram-userbots | NO_CONFIRMED_HOST_DEFECT |
| telegram-dev | telegram-miniapps | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-lifecycle | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-native | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-spatial | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-perf | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-tooling | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-store | NO_CONFIRMED_HOST_DEFECT |
| xr-dev | quest-webxr | NO_CONFIRMED_HOST_DEFECT |
| web3d-dev | web3d-runtime | NO_CONFIRMED_HOST_DEFECT |
| web3d-dev | web3d-assets | NO_CONFIRMED_HOST_DEFECT |
| web3d-dev | web3d-animation | NO_CONFIRMED_HOST_DEFECT |

## Handoff

Next: implement and review bounded owner fixes P-1 through P-6; explicitly decide P-7; run isolated payload checks and owning gates before changing family pins or claiming installation. This census remains an immutable pre-fix snapshot; post-fix verification gets a separate receipt.

## Re-run after the family pins move

`collect.py` uses Python 3.12+ and git, with no Python packages. Run:

```sh
python3 docs/evidence/host-compat/portability/collect.py --hub /path/to/final-hub-checkout --repositories /path/to/existing-hub-with-member-git-repositories --output /path/to/new-post-fix-snapshot
```

The output directory must not exist. The collector reads committed skills.json
and gitlinks, extracts exact Git archives, and fetches missing objects into temporary
bare repositories. It does not read dirty member payloads, update submodules or
modify installed skills. The auditor comes from that hub's make-skill pin.
A replay of the original pins produced identical 38 skill rows, 38 auditor results
and pattern hits; link rows are equivalent after sorting by file/line/target.
See `collector-replay.json`. Post-fix snapshots remain separate. The collector
makes no semantic verdict from a pattern hit or an escaped link.
