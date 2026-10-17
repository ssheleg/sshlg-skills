# Coding-agent health follow-up, 2026-10-17

Objective: check the previously requested host set for additional local errors,
repair reproducible configuration faults, and preserve the distinction between
installed, configured, native-loader acceptance and provider/model acceptance.
Local repairs and the bounded diagnostic pass are complete. The open conditions
below are not asserted fixed. No model prompt or package release was made.

## Scope, sources and delivery

The scope is the 30 entries in Switchboard's existing
[catalogue](https://github.com/passioncode-ai/fabric-switchboard/blob/d01a453948bd54232b5608c7f58de55923ba2475/catalog/agents.json)
plus Tabby from the operator's list. The prior
[native-hook handoff](https://github.com/passioncode-ai/fabric-agent-adapter/blob/v0.35.0/docs/handoffs/2026-10-16-faa-48-host-hooks.md)
and its compatibility matrix supplied the probe contracts, not current pass results.
The previous [instruction-budget repair](kimi-instruction-budget-20261017.md)
is the local configuration baseline. This follow-up supersedes its shared-entry
byte count and MCP-routing paragraph, not its historical before-state.

The source checkout for the backup helper is hub baseline
`b0f828dc78cb27166942035a2800d6e943e51a27`; the handoff branch starts after
`8b578074010c1427cd81296fed82df87b0537e2f`. Private configuration, credential values,
machine identities, local receipts and raw diagnostics are excluded from Git.
The operator-local instruction-cleanup unit `2026-10-17-coding-agent-health` holds
the repair script, version inventory, native receipts and verified backups.
Resolved-config output was reduced to metadata rather than retained as a copy of
credential-bearing configuration. Use that unit locally; never publish its contents.

## Applied fixes

1. **Hermes CLI credential path.** Reproduced `hermes doctor` reporting no key for
   its selected provider when invoked through PATH. The interactive shell function
   previously supplied the agent's existing vault slots, but the executable did not.
   The operator-owned executable wrapper now invokes the same Observatory `serve`
   door with vault-only policy; the shell function delegates to it without double
   injection. Version/help remain usable without opening the vault. After repair,
   Doctor no longer reports the provider-key failure and its OpenRouter connectivity
   check passes. This is not a paid model-generation acceptance test.
2. **OpenCode runner identity.** Its Fabric registration incorrectly identified it
   as Claude Code. The actual installed Fabric MCP executable rejects unknown
   runners and lists only Claude Code, Codex, Kilo, Hermes, Cline and Kimi Code.
   The OpenCode registration is now disabled and names its own runner for future
   support. Native OpenCode configuration loading passes; other MCP settings and
   permission values are semantically identical. This removes false identity;
   it does not create OpenCode admission support in Fabric.
3. **Current MCP instructions.** The compact shared entry now follows the operator's
   replacement instruction: new servers belong in their agent's configuration,
   not the retired main gateway. Scoped supervised gateway instances remain alone.
   The shared entry is now 8,603 bytes; together with Kimi's own file it is 10,093
   bytes. The earlier dated apply script is historical: its hash fence will refuse
   the amended content. Use this unit's amendment receipt for current recovery.

These changes affect four local files: the executable wrapper, shell function,
shared instruction source and OpenCode configuration. Each write went through
[protect()](../../lib/apply.js) and verified [backup](../../lib/backup.js), with
stale-content checks and atomic replacement. Three real apply runs gave one change
then unchanged results; OpenCode's later addition was independently applied three
times. Shell syntax checks passed. Readback verified every final hash and backup,
and semantic comparisons proved unrelated OpenCode settings and shell text intact.

## Current host results

All 11 discovered CLI binaries returned version exit 0 with empty stderr.

| Host | Version | Additional evidence / limit |
|---|---|---|
| Claude Code | 2.1.299 | Native SDK initialization accepted SessionStart; plugin list parses, 64 entries |
| Codex | 0.162.1 | Native old-output negative control reproduces the JSON failure; corrected output completes with context; Doctor has 0 failures, history warnings remain |
| Hermes | 0.21.5 / 2026.9.24 | Current runtime plugin discovery, registration, prompt rendering and unload pass; provider-key path fixed; Doctor dependency warnings remain |
| OpenCode | 1.19.0 | Actual native loader and resolved-config checks pass; false Fabric identity disabled |
| Pi | 1.1.0 | Actual native extension loader passes; resource loader discovers 179 skills, one description-length warning; OpenRouter auth check says not_ready |
| OpenClaw | 2026.10.4 | Enabled and two permission-negative native cases pass; read-only Doctor reports five warnings despite exit 0 |
| Kimi Code | 2.2.0 | Doctor validates config and TUI config; shared budget remains below 32 KiB; original project's aggregate warning is not reproduced |
| Gemini CLI | 0.63.0 | Settings JSON and native help pass; no selected local OAuth type/cache observed; provider request not tested |
| Kilo | 7.4.17 | Resolved configuration loads; native config check reports no warnings |
| Goose CLI | 1.44.0 | Native info and YAML parsing pass; no provider/model selection in this CLI config; desktop is separately 1.50.0 |
| Cursor CLI | 2026.09.02-c22c1a3 | Native status reports authenticated; no model request made |
| Warp | 0.2026.09.09.08.26.02 | Desktop installation/version observed; GUI session not launched |

No CLI was found for Cline, Freebuff, omp, Command Code, DeepSeek Harness,
OpenHands, ZCode, Auggie, Aider, Continue, Qwen Code, Crush, Zed, Amp, Copilot CLI,
Factory Droid, Kiro CLI, Devin or Tabby (19 catalogue entries). This is an absence
finding, not a passing runtime test. Copilot IDE extensions were separately found
in VS Code; that does not establish Copilot CLI availability. OpenCode desktop
1.18.4 and Goose desktop 1.50.0 differ from their CLI versions; GUI behavior was
not inferred from the CLI tests.

## Check evidence and non-claims

- `sshlg-skills hosts`: no duplicate Codex TOML tables; eight enumerated local
  Claude MCP ports accept TCP. TCP acceptance is not an MCP authentication test.
- `sshlg-skills hooks status`: family hook definitions match installed settings.
- Parsed ten existing principal JSON/TOML configurations; absent optional Pi MCP
  file is separate from invalid syntax. No missing script target among the 42
  parsed command hooks in Claude, Codex, Kimi and Gemini settings.
- No dangling links in the seven checked host skill roots.
- Adapter [Claude probe](https://github.com/passioncode-ai/fabric-agent-adapter/blob/v0.35.0/test/native/claude_hooks.py),
  [Codex probe](https://github.com/passioncode-ai/fabric-agent-adapter/blob/v0.35.0/test/native/codex_hooks.py),
  [OpenClaw probe](https://github.com/passioncode-ai/fabric-agent-adapter/blob/v0.35.0/test/native/openclaw_hooks.py): exit 0 on the installed runtimes.
- Adapter [OpenCode/Pi native tests](https://github.com/passioncode-ai/fabric-agent-adapter/blob/v0.35.0/test/host-hooks-opencode-pi.test.mjs) with both native-loader variables:
  15 passed, 0 skipped. Hermes used the interpreter selected by the native Doctor
  and the installed checkout import root with the same native probe contract:
  discovery/rendering/unload passed, empty stderr, zero model calls.
- `node test/backup_test.js`: exit 0, 21 checks.
- `python3 test/doc_refs_test.py`: exit 0, 17 cases. An initial accidental Node
  invocation of this Python file failed; the corrected interpreter passed. This
  was a probe invocation error, not an agent-host defect.
- Round one reproduced faults and exercised native loaders. Round two verified
  repaired native configuration, credential readiness, preservation, backup hashes,
  idempotence and references. No new blocker for these bounded local fixes remained.
- No full hub suite or hosted CI was run: this commit carries only the sanitized
  handoff. It is not evidence for a new package release.

## Open conditions and exact next actions

| Condition | Owner / next action | Watcher |
|---|---|---|
| Installed Fabric has no OpenCode or Pi runner | Fabric owner must add and ship genuine runner support; then verify native identity/admission before enabling OpenCode registration | None; current Fabric MCP session returns no-project, so no board delivery is claimed |
| Pi provider credentials absent; Goose CLI provider/model unset; Gemini local OAuth setup absent | Observatory name lookup for each of pi/goose/gemini returned no vault or inventoried environment slots. Complete each host's own provider setup; do not reuse Hermes's key or interpret absent OAuth as proof no alternative auth exists | None; no new provider enrollment or model selection was performed |
| OpenClaw Gateway not configured | Select intended Gateway deployment before configuring/starting it; current task only validated coding hooks | None; no Gateway service was started |
| Codex history inventory differs | Native redacted Doctor reports 101 missing active rows, 164 stale rows, 78 duplicate rollout IDs at the second snapshot, while DB integrity is healthy. Investigate compressed/archive history and supported reconciliation; do not delete live history or edit SQLite blindly | None; no supported repair was advertised by Doctor |
| Hermes dependency advisories | Doctor's post-fix snapshot reports 3 browser-tool, 8 web-workspace, 6 TUI-workspace vulnerabilities; investigate exact upstream advisories and compatible lockfile release. Do not equate package counts with independently verified exploitability | None; no unreviewed package upgrade or audit-fix was run |
| Remaining instruction overhead | Claude guidance warning: 647 lines; Pi resource loader warns on one 1,068-character description. Preserve canonical rules and upstream skill ownership before further compaction | None; nonblocking follow-up |
| Original Kimi 63.8 KB project total | Once its project directory is supplied, calculate all effective inputs and verify a fresh session there | None; missing text input |

First continuation: resolve native Fabric runner support with its owner when the
project board is reachable; keep the incorrect identity disabled until then.
No approval was fabricated, no existing service was killed/restarted, and the
probe processes that completed were not left as background services.

Skills used: task-pipeline (bounded delivery), evidence-docs (evidence boundaries),
working-with-fabric (admission and runner boundaries), handling-secrets
(Observatory-owned credential injection). The installed handling-secrets version
check reported older-but-compatible text; no alternate credential store was used.
