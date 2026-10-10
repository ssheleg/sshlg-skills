# Local readback method

These summaries contain family identities, versions, counts and hashes. Raw CLI
outputs and configuration remain private. The collectors do not enable skills,
register hooks or invoke a model.

- Claude: `claude plugin list --json`.
- Codex: `codex plugin list --json`, plus app-server initialize and `skills/list`
  with no thread/turn. Hooks, apps, MCP dependencies and model tools disabled for
  this process only. Disabled path identities are compared before and after.
- Gemini: `gemini skills list --all`, stdout directed to a file.
- OpenCode: `opencode --pure debug skill`, stdout directed to a file; pure mode
  excludes external plugins from the discovery check.
- Hermes 0.21.4: `_find_all_skills()` from its installed Python environment. This
  is its platform/trust-filtered loader, not a recursive filesystem count.
- Kimi 2.1.1: version/help and documented native shared-root presence only. The
  exposed CLI has no standalone roster command; ACP/model acceptance NOT_RUN.

First Gemini/OpenCode subprocess pipes ended with truncated output despite exit
0. They were retained privately as invalid instruments. Direct file capture
returned complete output: 38 family names in each. Only those complete captures
are used by `summarize.py`.

`verify_payloads.py` compares every file from the parent commit’s exact member Git pin under each skill against
shared/Hermes copies, and every pinned plugin blob against registered Claude
and already-installed Codex family plugins. It does not infer activation in an
existing model session. Host restart/reload is separate.

Both scripts require the private receipt directory via `--private` and an output
path via `--output`; `summarize.py` also takes `--phase before|after`. The scripts
publish no credential values or raw configuration. No third-party skill is
removed or deduplicated by these checks.

The before summary reads `client-versions.json`; the after summary requires a
fresh `client-versions-after.json` from the same clients' `--version` commands.
It does not silently reuse initial versions after a long release wait.

Native Codex marketplaces were already pinned to exact source SHAs. `marketplace
upgrade` returned exit 0 with an empty upgradedRoots list and plugin add retained
the old version; these no-op receipts are not treated as updates. Installation
therefore removes and re-adds only each existing pinned marketplace through the
native lifecycle, then uses `marketplace add ssheleg/<owner> --ref <released SHA>` followed
by `plugin add <owner>@<owner>`, verifies the returned version, and compares changed
config sections plus unchanged disabled paths. Updating those existing pin entries
is intentional; model and permission sections must remain identical.

The verifier requires the exact pre-existing Codex family plugin identity set
(nine here); an absent registration is a failure, not a skipped comparison. The
remaining two family owners use their shared skill channel. Source bytes come
from Git blobs at parent gitlinks, not mutable checkout files. Acceptance checks
are explicit errors (also under Python -O), and empty payloads are refused.

Summaries allowlist public fields, count unique family names (duplicates are
separate), name missing IDs, and exit nonzero if discovery or preservation checks
fail. CODEX_HOME and HERMES_HOME overrides are honored; this machine used defaults.

Continue readback additionally requires every family skill directory to be a real
directory, not a symlink, then compares its files against the pinned Git blobs.
This verifies the installed shape required by the pinned loader reproduction;
it is not a full Continue application/model run.

`continue-discovery.mjs --root <explicit-directory>` retrieves and verifies the
immutable upstream source and helper digests, strips only TypeScript annotations,
and runs its directory-selection helper. It emits directory names and relative
paths, not SKILL contents. [Before update](continue-before.json), it found zero of
the 38 family directories because they were symlinks. This is source-helper
replay against the installed tree, not full frontmatter parsing or native runtime.

## Keep version paths valid for sessions that are already open

The operator reported three `Hook failed` messages with exit 127 during the
update. [The repair receipt](stale-cache-repair.json) records a reproducible
cause: the previous make-skill, agent-sync and task-pipeline PostToolUse commands
pointed at absent version directories and returned 127; their current-version
counterparts returned 0 with empty input in an unconfigured temporary directory.
The operator subsequently confirmed that new error messages stopped. The exact
native dispatch trace was not captured; the command-path cause is reproduced.

The old released plugin payloads were restored from the receipt's exact Git
commits into absent old-version directories, including executable modes. Old
paths then returned 0. Current registration and config bytes stayed unchanged.
This is startup/no-op evidence, not proof of each hook's substantive behavior.

Before a native marketplace remove/re-add update, preserve every existing version
directory privately and record its complete byte/mode manifest. If the lifecycle
prunes old directories, restore the exact prior files for open sessions. Do not
redirect old trusted paths to new code, alter hook trust, or disable enforcement.
Keep current registration on the intended new release; a fresh session loads its
new paths. Remove old cache copies only after their consumers have ended, never
as part of an active-session update. The final task-pipeline repin follows this
preservation procedure.
