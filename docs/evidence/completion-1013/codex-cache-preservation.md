<sub>ssheleg skills — task-pipeline · agent-sync · evidence-docs · openai-docs</sub>

# Codex native cache lifetime correction, 2026-10-13

Objective: preserve payload paths that active Codex threads may still execute while the hub updates its advertised member pins. Base: `bca35fb74e05ca4fafba594ca317664285fe8636`. This is a bounded implementation and native CLI receipt, not a model-quality or installed-machine acceptance claim.

## Reproduced cause

The [native synthetic probe](codex-cache-preservation/native-probe.py) uses a disposable HOME/CODEX_HOME, a tiny local Git repository and an isolated Git URL rewrite. No provider/model request or operator profile write is made. The [command receipt](codex-cache-preservation/native-probe.json) records successful installation at 1.0.0, replacement with 1.1.0 and the old script's failure. The fixture is removed in `finally`.

On local `codex-cli 0.162.1`, marketplace removal preserves the old payload; marketplace addition at the new SHA also preserves it. **`plugin add` then deletes the old generation.** A second isolated profile proves that `marketplace upgrade` with an ephemeral exact-ref override also prunes the old generation and does not persist that override into config. Replacing remove/add with upgrade therefore does not solve this defect.

Pinned upstream source confirms the mechanism:

- [store.rs, activation and pruning](https://github.com/openai/codex/blob/rust-v0.162.1/codex-rs/core-plugins/src/store.rs#L648): the newly installed version activates and the store removes other version directories; see `remove_old_plugin_versions` at line 693.
- [manager.rs, marketplace upgrade](https://github.com/openai/codex/blob/rust-v0.162.1/codex-rs/core-plugins/src/manager.rs#L2941): upgrade refreshes installed plugin caches through force-reinstall.
- [plugin_cmd.rs, CLI listing](https://github.com/openai/codex/blob/rust-v0.162.1/codex-rs/cli/src/plugin_cmd.rs#L245): the readback path lists catalog/plugin state. It does not establish the generations retained by every running host process.

The [source ledger](codex-cache-preservation/sources.json) hashes the retrieved files. Official [App Server documentation](https://learn.chatgpt.com/docs/app-server), retrieved 2026-10-13, describes `thread/loaded/list` as in-memory thread listing and MCP reload as a queued MCP refresh. It does not establish an all-process generation-retirement barrier. Plugin install/list APIs there are marked under development. No supported safe cross-process retirement or retain-old CLI option was verified. This is an evidence boundary, not proof that no future API can exist.

## Implemented boundary

`lib/codexplugins.js` refuses the version-changing native step before any marketplace removal, addition or plugin installation. Direct callers of `refreshOne` meet the same boundary. The result is `DEFERRED_ACTIVE_GENERATION_SAFETY`, and `update` exits nonzero when such work remains. A previously matching catalog version stays a matching **catalog** observation; thread-loaded generations remain unknown.

Dry-run uses a typed `codex-deferred` step and advertises no destructive commands. Plain-skill and Claude channels retain their existing independent behavior. No native cache files are copied, fabricated, removed or replaced by this correction. There is no process-count, timer, arbitrary environment flag or CLI-version bypass.

`lib/codex-pending.js` writes an immutable private receipt in the hub's own `~/.sshlg-skills/codex-deferred/` namespace. It binds canonical and requested profiles, the exact config-byte fingerprint, desired refs and observed catalog versions. Raw config is excluded. Exclusive atomic publication refuses collisions; retrying identical intent reuses its receipt. A changed config requires a fresh inspection. This is not a cross-process lock on Codex or a claim that external writers cannot race.

`lib/codex-deferred-watch.js` is included in the npm `lib` payload. It only reads native state and records immutable observations in that namespace. Default cadence is two minutes, capped at 60 observations; `--once` performs one. Unknown arguments refuse. Profile retarget or config drift stops with a rescan status, without host mutation. A matching catalog ends observation as `catalog-matches-thread-generation-unknown`; it **never** grants an install or proves existing threads reloaded. A two-hour deadline is an observation bound, never update authority.

The updater prints the exact watcher invocation. Automatic background registration and independent review are pending at this snapshot; no real-machine pending receipt or watcher has been created by this task.

## Validation and remaining work

The original focused admission counterexample returned `current` after three mutating commands when the required outcome was deferral with zero commands (exit 1). The native probe independently confirms why those commands are unsafe.

Focused candidate checks:

- `node test/codexplugins_test.js`: 15 cases pass, including direct-call and fake safety-assertion bypass refusal.
- `node test/codex_native_e2e_test.js`: 9 process cases pass. Three repeated real launcher invocations preserve config bytes and an executable old hook path, retain one receipt and return nonzero; already-current, disabled, foreign, absent and dry-run controls remain distinct. Native host calls in these launcher tests are fixture-driven, not proof about the actual CLI.
- `node test/codex_pending_test.js`: 17 cases pass, including partial-write and publish-failure cleanup, collision/symlink refusal, profile/config drift, malformed/error readback, no raw-config journalling, bounded real watcher process and unknown-argument refusal.
- `node test/operation-result_test.js`: 14 cases pass.
- Actual isolated native probe: both replacement and upgrade routes reproduce old-generation deletion. No broad suite or actual-profile adoption has run for this patch.

Next acceptance: independent source/process review; add a safe watcher registration seam; run the coordinated owner aggregate after composition; publish through normal exact-source gates. Native update remains intentionally deferred until a separately reviewed supported retention/retirement adapter exists. That future adapter must prove old paths remain usable without a deletion window, or prove every consumer retired and prevent a new consumer entering during mutation. Starting a new observer process or observing no processes is insufficient.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `task-pipeline`: bounded correction and checks.
- `agent-sync`: isolated task ownership.
- `evidence-docs`: source and native receipts.
- `openai-docs`: official host API research; not a skill this family ships.
