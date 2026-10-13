<sub>ssheleg skills — task-pipeline · evidence-docs · make-skill · skill-search</sub>

# B-187: Claude native immutable source admission

Status: bounded implementation and focused native evidence; peer review and aggregate pending, 2026-10-13.
Base6bb4a0ffd050f3f2cfed38ef29a1f415d6303e22; native CLI2.1.296.
No operator configuration or cache was changed by these probes. Each process
used synthetic HOME, CLAUDE_CONFIG_DIR, cwd, Git configuration and a local
Git source via process-local URL rewriting. Every owned temporary tree was
removed in finally. No model/provider calls, private credentials or project
contents were used. JSON receipts contain only synthetic data; temporary paths
are replaced with <sandbox>.

## Observed source mechanisms

| Probe | Actual result | Receipt |
|---|---|---|
| Marketplace Git URL#40hex | Fails: clone --branch cannot resolve a commit as a branch | [Raw](probe.json) |
| Marketplace tag, then same-name different tag | First installs; second add refuses settings source mismatch | [Raw](probe-tags.json) |
| Exact git-subdir.sha plugin source | Initial install is exact; same-version update exits0 retaining previous SHA/payload | [Raw](probe-source-sha.json) |
| Settings ref rebind + marketplace add | Native update both upgrades1→2 and downgrades2→1 correctly | [Raw](probe-settings.json) |
| Scoped uninstall --keep-data + install | Same-version source changes successfully; data retained; owned disabled entry becomes enabled | [Raw](probe-reinstall.json) |
| Last-scope reinstall with configured option | Option disappears despite --keep-data | [Raw](probe-options.json) |
| Temporary additional installed scope | Synthetic option survives target reinstall and anchor removal | [Raw](probe-anchor.json) |

Reproduction scripts beside each receipt preserve the exact calls. Their fixture
Git commits are synthetic and intentionally not production pins. The retention
anchor is investigated but excluded from initial production scope by coordinator
decision: extra crash/recovery states are unnecessary for the currently observed
family, whose eleven installed records are user-scope and declare no userConfig.
That metadata observation does not prove absence of every possible saved state.

## Current official contracts, retrieved 2026-10-13

[Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference)
distinguishes catalog sources from plugin sources. Plugin git-subdir supports an
exact sha; catalog refs are branches/tags. Relative plugin paths must resolve
inside the catalog tree. [CLI reference](https://code.claude.com/docs/en/plugins/cli-reference)
documents scope-specific uninstall, data preservation, and deletion of saved
options/secrets when the final installed scope is removed. Update may return
success without replacing an equal-version payload. Current official documentation
and measured native behavior supersede the installed make-skill reference's older
claim that a second marketplace add always replaces the first.

## Frozen bounded plan

1. Generate a shipped immutable plugin inventory from the exact staged member
   gitlinks: resolve each marketplace's matching plugin source, record its safe
   relative path, full file hashes and configuration-surface metadata. Verify
   this inventory against Git objects in the owner gate. Never infer a plugin
   path from its display name or silently advance pins.
2. Build the complete Claude plan before other host mutations. Reject malformed
   registries, conflicting source ownership, unsupported scopes/configured
   repair surfaces and incomplete pin inventory. Preserve --no-claude operation.
3. Emit hub-owned catalogs retaining each existing marketplace/plugin ID, with
   native git-subdir.sha sources. Replace only the owned source declaration
   through protected source-preserving settings edits. No marketplace removal
   and no direct writes into native caches or installed registries.
4. Execute the frozen plan through native CLI. Normal different-version changes
   use update; an eligible same-version source mismatch uses scoped uninstall
   --keep-data and install. Preserve disabled state and unrelated settings.
   Capture backups and durable operation state before mutations; failed or
   interrupted transitions remain explicit and resumable, never exit0 acceptance.
5. Read back installed scope, expected SHA and every plugin payload file against
   the shipped inventory. Exact bytes and source are required for successful
   admission. Pin/rendered version alone is insufficient. Rollback must use
   a verified prior native source and preserve data/settings, or stop with a
   named recovery receipt instead of inventing successful recovery.
6. Test whole-plan refusal before mutation, normal upgrade/downgrade, same-version
   replacement, idempotence, disabled/project override preservation, invalid and
   competing configs, CLI failure/partial rollback, source-path/digest drift,
   and packaged preview/execute parity. Native synthetic probe remains separate
   from deterministic offline fixtures. Independent review precedes any real
   operator update; a published fix is not installed/native task-quality proof.

## Ownership and handoff

Own branch fix/claude-immutable-install in hub-claude-pins, task lease
CLAUDE-PINS-1013. Coordinator owns B-187 board row, versions and production pins.
Next task: implement source inventory generation and failing admission fixtures,
then protected native transaction. No broad suite while disk/serial gate is held.


## Inventory and admission implementation checkpoint

The first bounded source module resolves plugin paths from each pinned Git
marketplace, preserves the original plugin entry, and records662 regular files
across11 members. `sync-claude-pins.js --check --source-root` against the accepted
hub checkout passed. The source-root option is a generation/check input only;
runtime installation uses the shipped inventory, not another worktree.
`claude_plugin_source_test.js` passes20 controls, `claude_pinned_test.js` passes12
admission cases, and runtime closure passes6. Tests use owned synthetic fixtures
and remove them in finally. Initial source test refused with missing module
before implementation; the production floating-source defect is demonstrated by
the native probes above, not inferred from that missing-module failure.

Installed read-only comparison also distinguished native `.in_use/<numeric id>`
regular lease-marker files from shipped plugin payload. Only that narrowly
recognized directory shape is excluded; other unexpected files still fail.
Execution, recovery, launcher integration and final independent review are not
yet implemented by this checkpoint. No real-host installation has occurred.


## Transaction review checkpoint (2026-10-13)

The implementation now routes install/update through one private frozen native
plan before other channel mutations. Public preview carries only member identities,
actions, commit hashes, file counts, profile and journal path; settings snapshots
remain private. Runtime is bounded to Claude 2.1.296+ in the 2.1.x series. Initial
scope is one user installation per owned marketplace; configured same-version
repair and project/local/multi-scope records refuse before mutation.

`python3 -B test/claude_pin_native_probe.py` passed on actual CLI 2.1.296 in an
isolated synthetic HOME and local Git transport: injected installation failure
restored prior SHA/payload through native commands, retry repaired same-version
bytes, verify-only replay passed, disabled=false, foreign settings and persistent
data survived. The packaged launcher preview and execution also passed; preview
used a child-spawn-refusing shim. Synthetic tree removed in `finally`.

Focused checks at this checkpoint: transaction 12 cases, admission 12 cases,
source admission/generation/readback 20 controls, installer pins 6 cases,
operation-result 14 cases, runtime closure 6 cases. These are bounded component
results, not an owner aggregate. The native probe is deliberately opt-in and is
not a provider/model call. Exact shipped inventory re-generation is a blocking CI
step against initialized gitlink trees; final member pin changes require another
`node scripts/sync-claude-pins.js --write` and `--check`.

Open before release: independent transaction review, additional failure/identity
controls, legacy integration fixture adaptation to the stronger native contract,
serialized owner aggregate, and operator installed readback after reviewed release.
No actual operator profile has been changed by this packet. Interrupted journals
or failed settings restoration refuse continuation with the local receipt path;
there is no guessed recovery or direct installed-registry/cache rewrite.


## Independent review corrections and current bound

Root independently reproduced false success at `32defee`: changing a foreign
installed plugin row during a native marketplace command still returned complete.
The correction compares foreign installed-plugin and known-marketplace entries
after each native command and at final readback. Changes are preserved and reported
as failure, never restored over the concurrent writer. Focused controls cover both
registry types. Original lexical profile/home selections are retained; retargeting
a profile alias between planning and execution refuses before commands or writes.
Metadata leaf symlinks/non-regular files refuse during read-only admission.

Protected writes now use exclusive same-directory temporary files, fsync, readback,
compare-before-replace and rename, retaining regular-file permissions. Journal
short-write and rename-failure controls prove that no native command starts and
original settings remain intact. The initial short-write plant first failed:
recovery wrote target settings despite no prior settings mutation. Tracking actual
settings mutation fixed that counterexample. This is atomic replacement evidence,
not an all-files transaction or a power-loss durability claim.

A private operation plan persists desired/prior commit, version and file hash
inventories, catalog paths and repair eligibility; the receipt adds PID/start time
and backup locations. It contains no settings values. Completed prior members may
remain updated after a later member fails: the result is failure with per-member
receipts, not a batch atomicity claim. A completed exit1 may use verified native
rollback. Timeout, signal or spawn uncertainty does not start a competing rollback;
it records uncertainty and blocks another native attempt. Interrupted or unresolved
settings recovery also remains blocked. The next recovery task reads the receipt,
plan and private backups, establishes whether the native operation ended, and
constructs a source-bound supported recovery; deleting the marker is not recovery.
No code writes Claude's installed registry or payload cache directly.

Current focused checks: transaction20, admission12, source20, installer6,
operation-result14, runtime closure6; domain process46, host-target14,
CLI-config24, update-lock30, hook process70. Legacy routing/lock/host-target tests
now explicitly mock the separately tested native transaction boundary rather than
pretend an exit0 shell stub proved installation. The real CLI probe still exercises
the actual native transaction and packaged launcher, including rollback/retry,
preview no-child admission, disabled state and foreign settings/data preservation.
No owner aggregate or real-host apply is claimed at this checkpoint.

Read-only actual-profile admission at this source accepted all11 family members:
6 verify, 4 same-version source repairs, 1 native version update. This is a proposed
plan against the current published pins, not an execution receipt. Final release
pins may change these actions; regenerate and check `claude-plugin-pins.json` from
those exact gitlinks. The inventory is shipped in the npm files allowlist. Runtime
uses that artifact without requiring a Git checkout. Byte readback does not prove
executable-mode parity, native discovery, model invocation or task quality.


## Expanded actual native lifecycle probe

The opt-in actual CLI probe additionally passed fresh-profile installation,
version1→2 upgrade and version2→1 downgrade, preserving disabled state on both
version transitions. All sources were synthetic local Git objects; each installed
record and payload was read back through the production transaction helper.
[Source-hashed result](native-transaction.json) binds the core to `3bcafea` and
records the expanded probe script digest. The packaged CLI arm remains included.
Both synthetic homes and all owned fixture content were removed in `finally`.
This expands local native installation evidence, not agent/model acceptance.

Read-only final-pin planning against parent `dd745bc` found no member manifest
commit changes from this packet's base and all current staged gitlinks matched.
That observation does not waive re-generation after a later release pin change.


## Final bounded numeric and uncertainty correction

Core `a158570` closes two further review findings. A timeout/signal/unknown native
outcome now performs no subsequent settings or catalog restoration, because the
native subprocess may still be active. Only private recovery evidence is written;
settingsRestored remains false and a further native attempt refuses. The focused
partial-native-settings plant was red before this correction and passes after it.
Destructive same-version repair also requires a prior immutable Git SHA before
uninstall, so unsupported rollback identity cannot be discovered only after removal.

Independent review reproduced two precision collisions at the preceding source:
foreign registry9007199254740992→9007199254740993 could pass, and settings
100000000000000000000000001→100000000000000000000000002 could be overwritten.
Native metadata admission now compares exact decimal token values with their
JSON.parse/JSON.stringify round trip, bounded to128-character numeric tokens.
Values that would change, overflow/underflow or lose negative zero refuse before
mutation. Current settings and registry reads use the same guard, so a concurrent
ambiguous value refuses instead of comparing equal after rounding. Safe equivalent
decimal/exponent spellings and escaped numeric strings remain accepted. This is a
native CLI compatibility bound, not a restriction on the independent lossless
JSON editor; that editor still retains arbitrary original numeric bytes.
Earlier raw-number restoration alone was insufficient evidence of concurrent
preservation and is superseded by this explicit admission boundary.

Transaction25 focused cases pass; the independent observer replayed19 additional
numeric controls, including both original counterexamples, against identical
frozen source hashes. Existing admission12 also passes. Actual profile read-only
admission still accepts all11 members, including this new numeric/SHA boundary.
[Final source-hashed actual native result](native-transaction-numeric.json) records
all expanded lifecycle arms passing at `a158570`; two owned synthetic homes were
removed. Full owner aggregate, genuine candidate CI and real-host update remain
separate pending gates. No blanket foreign-process transaction or model-quality
claim is made.


## Bounded native version admission

The preliminary `claude --version` child now has a 10-second timeout and 64-KiB
output cap, and refuses any error, signal or nonzero/null status even when stdout
contains a compatible version. The two new controls first exposed an absent
runtime timeout, then passed with the correction: transaction27 cases exit0.
Actual read-only `runtime()` returned `2.1.296 (Claude Code)` with these limits.
No operator configuration writes or model calls occur in this version probe.
The earlier full native lifecycle receipt remains bound to `a158570`; this delta
changes only version-process admission and does not claim a repeated lifecycle run.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**:
task-pipeline for delivery, evidence-docs for source-bound probes, make-skill for
plugin distribution, skill-search for routing.
