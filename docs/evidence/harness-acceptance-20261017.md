<sub>ssheleg skills — agent-harness · agent-interop · task-pipeline · evidence-docs · agent-sync · working-with-fabric · handling-secrets</sub>

# Native harness acceptance — 2026-10-17

Status: **partial estate acceptance; three bounded repairs verified**. This is the
continuation entry for [the preceding health audit](coding-agent-health-20261017.md)
and [instruction-budget repair](kimi-instruction-budget-20261017.md).
No model prompts, paid tool operations, browser consent, service restart or
package release formed part of this cut. Discovery, connectivity, hooks and
model behavior are separate claims.

## Delivered changes

1. Hermes's updater replaced the previously repaired launcher. Native MCP tests
   then reproduced missing credentials for two configured endpoints. The repair
   now uses Hermes's supported `secrets.command` source and the existing
   Observatory vault-only door. It survives replacement of the launcher because
   its configuration and IPC helper are outside that generated file. Five of five
   enabled MCP connections passed after the repair. Only three pre-existing
   credential slots are exposed to Hermes and override inherited values, so a
   caller's unrelated key cannot win. No environment file or copied secret
   value was created. Existing config outside the new secrets section was preserved.
2. Kimi rejected five DigitalOcean 1.5.1 tool output schemas containing valid
   boolean schema nodes. The optional [stdio bridge](../../scripts/host-compat/mcp_schema_bridge.py)
   replaces schema `true` with equivalent `{}` without dropping tools or
   constraints. Its existing credential moved from the host config to its own
   Observatory slot over stdin. Other MCP entries were preserved. A fresh native
   Kimi connection passed twice, including after final installed-byte verification.

3. OpenCode credential injection lived only in an interactive shell function.
   An operator-owned executable now supplies the same named vault slots for CLI
   callers. Fresh login and interactive shells both resolve that entry, while a
   single-command PATH directory preserves precedence for unrelated programs.
   Direct invocation and a fresh login shell each connect all 11 enabled MCP
   servers. One overlapping diagnostic launch exited 1 before inventory;
   sequential repeats passed. Concurrent startup acceptance remains open.
   The vendor executable remains in its update-managed location. Native desktop
   launch through the running application has not been exercised.

Operator configuration, private helpers, backup paths, endpoint identities and
raw host output remain local. The published implementation contains no operator
configuration. Guarded apply scripts retained backups, refused concurrent source
changes, verified readback and produced three real idempotent apply runs.

## Native observations

The family inventory is computed from `skillNames` in [skills.json](../../skills.json):
39 skills ([inventory source](https://github.com/ssheleg/sshlg-skills/blob/07c1baacbae75b346089dc311f7a370b98b0b11d/skills.json)). Counts below are different native inventory surfaces, not quality scores.
Native adapter fixtures are bound to [source commit 3f11544](https://github.com/passioncode-ai/fabric-agent-adapter/tree/3f11544a5e479c54307e1e615a1dd0dcd2e0b3fb/test).

| Host | Native discovery | MCP result | Hook / routing evidence |
|---|---|---|---|
| Codex 0.162.1 | 570 discovered records, zero parse errors; all 39 family names have an enabled native/plugin entry | 14 servers returned tools; 3 deliberately disabled entries returned none | Native app-server inventory; corrected SessionStart JSON fixture passes while the old plaintext negative control reproduces the original error |
| Claude Code 2.1.299 | SDK initialize advertises 547 commands including all 39 family skills | 23 connected, 27 needs-auth, 1 failed in the full native inventory | 9 SessionStart handlers complete; Switchboard's suggestion handler exceeds its 10-second limit, reproduced individually |
| OpenCode 1.19.0 | 537 skills; all 39 family skills, no duplicate names | All 11 enabled servers connect through the existing vault injection; unsupported Fabric registration remains disabled | Native adapter initialization passes; repaired launcher supplies credentials outside interactive shells |
| Hermes, final checked 0.22.2 | 229 skills; all 39 family skills, no duplicate names | 5/5 enabled servers pass native tests after native secret-source repair | Native plugin discovery, prompt-section render and unload pass on 0.22.2 |
| Kimi Code 2.2.0 | 509 skills; all 39 family skills, no hidden family entries | 8/11 initially; repaired DigitalOcean raises this to 9/11 | ACP initialize/session creation pass; checked workspace warning list is empty, not proof about the original unidentified 63.8 KB workspace |
| Pi 1.1.0 / OpenClaw 2026.10.4 | Broader inventory remains in the previous cut | No new provider or Gateway acceptance claim | Native Pi loader and OpenClaw positive/permission-denied cases pass again |

Codex also discovers disabled plain copies; all 39 family skills have enabled
entries, so counting disabled records alone would give a false missing-skill
finding. `authStatus: unsupported` in Codex means unsupported OAuth discovery,
not failed connectivity; returned tools establish the latter independently.

OpenCode's `debug skill` output repeatedly truncated inside JSON near 64 KiB when
captured through a pipe. PTY capture returned a complete 5,701,062-byte JSON
payload. Only names/locations were retained, not skill contents. Parsers must
reject an incomplete dump rather than report a five-skill inventory.

Hermes changed externally during this work: 0.22.0 was followed by 0.22.2. The
final plugin and MCP receipts name the later checked runtime. These are CLI
receipts, not proof that an existing Gateway loaded the new modules.

## Checks

- [Bridge regression suite](../../test/mcp_schema_bridge_test.py): 5 checks pass,
  including real subprocess transport, correlated request handling, preservation
  of non-schema boolean data and upstream failure exit status.
- Hermes helper: allowlist, missing value and three newline-injection rejection
  checks pass; parsed config comparison confirms unrelated configuration preserved.
- Installed bridge bytes equal repository source; parsed MCP config comparison
  confirms unrelated entries preserved. Native Kimi DigitalOcean probe succeeds
  after the final source update. No tool call was issued.
- Adapter OpenCode/Pi native suite: 15 pass, 0 skipped. Native Codex negative and
  positive hook checks pass. OpenClaw's three native cases pass. Hermes 0.22.2
  native plugin loader passes.
- `python3 test/doc_refs_test.py`: 17 cases pass. `node test/backup_test.js`: 21
  checks pass. The scanner found no mechanical finding in the private secret
  helper, but classified zero agent-related files; this is not harness acceptance.
- `npm test`: exit 0, **140 suites, 2620 fixtures, 11 pinned members**. The first
  attempt failed six suites because this isolated worktree lacked submodules;
  materializing the committed pins fixed that test-environment prerequisite.
  The final complete run passed, including the five bridge regressions.
  Hosted nightly CI was not dispatched; this is not hosted CI or a release.

## Open conditions and exact continuation

| Condition | Owner / next task | Watcher |
|---|---|---|
| Switchboard SessionStart suggestion exceeds 10 seconds | Switchboard owner: bound the CLI suggestion/IPC path below the host timeout, test an unresponsive runtime and stdin closure, then ship and rerun the real hook | None; current Fabric identity remains no-project, so no board request is claimed |
| Kimi direct Prowl connection rejects its key; Claude Prowl plugin fails | Credential/capability owner: resolve the host's own credential or route through its authorized owning capability; do not borrow another agent's provider key | None; no key rotation or provider grant was fabricated |
| Kimi Supabase and Claude external connectors need authentication | Complete each intended connector's own auth/consent flow; do not disable it merely to make the inventory green | None; browser consents were not performed |
| Legacy embedded credentials remain in other host entries | Continue per-entry migration to Observatory with host-supported header/stdio injection; never copy raw config or credential URLs into receipts | None; only the bounded DigitalOcean entry was migrated here |
| Running desktop processes may retain an earlier executable path | Fresh shell entry is repaired and checked. Validate an actual desktop session separately; raw vendor-path invocation intentionally bypasses the operator launcher | None; desktop launch acceptance is not claimed |
| Hermes Gateway may retain older modules; optional Google Chat/Teams toolsets warn | Its supervisor/lifecycle owner must reconcile the running generation, then verify Gateway separately | None; no service was killed or restarted |
| Native Fabric admission and OpenCode/Pi runner support | Follow the admission/runner conditions in the previous handoff; registration is not project admission | None; Fabric returns no-project |
| Other installed/uninstalled agents, provider setup and historical Doctor warnings | Continue the explicit conditions in the preceding health cut; this cut does not promote those rows to passed | None |
| Model follows routing under real work | Run a bounded behavior eval separately with the host's own provider and recorded budget; skill discovery and hook output are not a behavior test | None; this run used zero model turns |

**First next task:** the Switchboard suggestion timeout, after its owning project's
board is reachable. The current isolated branch carries the schema bridge and its
checks; integration must use repository policy. The private local handoff is the
recovery entry for operator config, and contains backup/hash receipts. Never
restore a whole old config over another session's changes.

Skills used: agent-harness (native discovery and evidence boundaries), agent-interop
(schema/stdio compatibility), task-pipeline (bounded changes and delivery),
evidence-docs (receipts), agent-sync (exclusive lease and journal),
working-with-fabric (admission), handling-secrets (Observatory injection).
The last two are outside the ssheleg family and were used for their own runtime
and credential domains, not as competing delivery routers.
