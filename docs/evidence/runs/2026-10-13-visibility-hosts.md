# Receipt — wave L1: the marked packs hidden on every host (2026-10-13)

Plan: [`docs/evidence/plans/2026-10-13-load-optimization.md`](../plans/2026-10-13-load-optimization.md), wave L1.
Branch `feat/visibility-hosts-main` (PR #213; the first cut, #212, is closed). Lease `WAVES-1011`.
Board: B-143 closed. B-148 untouched.

Operator decision (2026-10-13): hide the recommended packs, delete nothing. Two design
changes the same day. From Fabric (RM-23 owner): marks are a machine-readable pack-marks/1
file that RM-23 (open on the fabric-workspace roadmap) is to read. From the main session
(public package vs one operator's machine): the marks are machine-local,
`~/.sshlg-skills/pack-marks.json`, written by `visibility marks --init`. The package ships
only [`pack-marks.example.json`](../../../pack-marks.example.json). `visibility` is the
host-wide fallback for sessions Fabric does not start.

## Per host: the mechanism and where it was read

| Host (version here) | Mechanism | Read in | Status |
|---|---|---|---|
| Gemini CLI 0.63.0 | `skills.disabled` in `<gemini dir>/settings.json` (user scope) — `skillStrategy.disable` in `packages/cli/src/utils/skillSettings.ts` (bundle `chunk-ED56GFWH.js`) appends the name; `SkillManager.setDisabledSkills` marks by name, case-insensitive, and `getSkills()` drops disabled skills (bundle `chunk-RWBXO4OP.js`) | `gemini skills disable --help`; the bundled source | implemented (direct edit through `protect()`, same value the CLI writes; one write instead of ~320 CLI processes) |
| Pi 1.1.0 | `skills` array in `<agent dir>/settings.json`, `-<path>` = exact exclusion; for an auto-discovered `SKILL.md` the parent directory's absolute path matches (`matchesAnyExactPattern`, `isEnabledByOverrides`, `addAutoDiscoveredResources` in `dist/core/package-manager.js`; `docs/settings.md` § Resources). `pi config` is interactive only | the installed package | implemented; the file is created when absent (Pi writes it with no final newline) and removed by `--revert` |
| Hermes 0.21.4 | `skills.disabled` (list) in config.yaml — what `hermes skills config` saves (`hermes_cli/skills_config.py` `save_disabled_skills`); `tools/skills_tool.py` `_find_all_skills` skips disabled names. `opt-out` only stops bundled-skill seeding | `hermes skills --help`, `hermes config set/get/unset --help`, the installed package | implemented through `hermes config set skills.disabled '<json>'` / `unset`, read back with `hermes config get --json` |
| OpenCode 1.18.10 | `permission.skill.<name> = "deny"` in `~/.config/opencode/opencode.json`; `Skill.available` filters by the `skill` permission, a denied call is refused | opencode.ai/docs/skills; the binary's bundled source | implemented (direct edit through `protect()`); an `opencode.jsonc` is refused |
| Cursor agent CLI 2026.09.02 | none: the only model-side filter is the skill's own `disable-model-invocation` front matter (`filterModelDisabledSkills` in the bundled `index.js`); a third-party SKILL.md is not edited | the bundled source | **cannot hide on cursor** — printed by `visibility` |
| Kimi 2.1.1 | `[[permission.rules]] decision = "deny"`, `pattern = "Skill(<name>)"` in `~/.kimi-code/config.toml` refuses the call; the skill catalog keeps the skill listed | the `kimi` bundle | **cannot hide on kimi** (call refusal only, not applied) — printed by `visibility` |
| Claude Code, Codex | unchanged since v1.55.0: everything outside the usage core is hidden; the pack marks are a subset there | `lib/visibility.js` | unchanged |

## Readback with the real host CLIs, in a sandbox HOME

The sandbox, never the operator's HOME:
- A scratch HOME with two shared skills: `dcf` (lock source `anthropics/financial-services`)
  and `docx` (`anthropics/skills`).
- Machine marks written there by `visibility marks --init --show anthropics/skills --apply`.
- The real `gemini`, Pi's own loader (`DefaultPackageManager.resolve()` from the installed
  package), and the real `opencode` and `hermes` binaries, with `HOME`, `HERMES_HOME`,
  `XDG_CONFIG_HOME` and `PI_CODING_AGENT_DIR` pointed at the sandbox.
- Gemini, OpenCode and Hermes files already existed before the run. OpenCode's file held an
  empty `permission.skill` map the operator wrote.

Re-run on the fix-round code:

| Host | Before `--apply` | After `--apply` | After `--revert` |
|---|---|---|---|
| Gemini (`gemini skills list`) | dcf [Enabled], docx [Enabled] | **dcf [Disabled]**, docx [Enabled] | dcf [Enabled], docx [Enabled]; settings.json sha256 identical to before |
| Pi (loader) | dcf enabled, docx enabled | **dcf DISABLED**, docx enabled | settings.json removed (the launcher created it) |
| OpenCode (`opencode debug config`) | `permission.skill` = `{}` | `{"skill": {"dcf": "deny"}}` | sha256 identical to before (`d9c8e88ec9ca…`); the operator's empty map kept |
| Hermes (`hermes skills list`) | dcf enabled, docx enabled | **dcf disabled**, docx enabled | config.yaml sha256 identical to before (the file existed; if Hermes creates it during the write, it keeps `{}` after the unset) |

Three `--apply` runs printed `written` once and `already as planned` twice. The sha256 of
all four files was identical after each run. The backups were 0600 in a 0700 directory.

## Tests (watched failing first)

First cut:
- `test/visibility_packs_test.js`: 16 of 16 failed on the base tree.
- `test/visibility_hosts_e2e_test.js`: 8 of 15 failed on the base launcher.
- `test/validate.py` `check_pack_marks`: refused a broken copy (revision removed, a pack
  duplicated), then passed.

Fix round, after the unit, seam and product readings failed:
- `test/visibility_packs_test.js`, now 22 checks. Before the fix, 8 of the 22 failed:
  - the example file (no shipped marks);
  - case-insensitive packs;
  - `marksFromLock`;
  - an operator's empty `skills.disabled` list, empty `skills` object and empty
    `permission.skill` map surviving apply + revert;
  - Claude's `prune: false`.
- `test/visibility_hosts_e2e_test.js`, rewritten to 27 checks. Before the fix, 20 of the
  27 failed. It covers:
  - no machine marks means nothing is hidden, and Hermes is not even called;
  - the first line words RM-23 as planned;
  - `marks --init` previews, writes only with `--apply`, and replaces only with `--replace`;
  - the record carries `applied: true` and the host list;
  - backups are 0600 in a 0700 directory;
  - the override reply names Claude/Codex and `--keep`;
  - `update --agent pi` writes Pi only;
  - `update --no-claude` and `update --agent claude-code` leave Claude alone;
  - `--revert` restores the operator's empty map byte for byte and withdraws consent;
  - after `--revert`, update re-applies nothing (this inverts the first cut's assertion);
  - a 1.55-era record is not extended and update prints the re-arm line;
  - with nothing to hide, unwritable hosts are skipped and the run exits 0;
  - with marks, they are DEGRADED and the run exits 0;
  - a degraded host does not fail update;
  - uninstall names the leftovers and `--revert`.
- `test/backup_test.js`: a new check that copies are 0600 and the directory is tightened
  to 0700, never loosened. It failed with the old `lib/backup.js`.
- `test/validate.py` `check_pack_marks` refused a root `pack-marks.json` and an example
  that names a real pack, then passed.

## The operator's machine: read-only preview

`node bin/sshlg-skills.js visibility` (no `--apply`) returns before any write. The only
process it starts is `hermes config get --json skills.disabled`, and only when Hermes has
something planned.

The machine has no `~/.sshlg-skills/pack-marks.json`, so a plain preview hides nothing by
mark. To measure the operator's marks without writing to the real HOME:
- A temporary HOME held symlinks to the real host directories. Only its own `.sshlg-skills`
  was a real, writable directory.
- `visibility marks --init --show <the nine kept packs> --apply` wrote the marks there:
  54 packs, 34 hidden.
- `visibility` previewed.
- The real settings files' modification times were the same before and after, and neither
  `~/.pi/agent/settings.json` nor `~/.sshlg-skills/pack-marks.json` appeared.

Results, run 2026-10-13:

| Host | Skills in its roots | In hidden packs | Kept by the core | To hide | New entries |
|---|---|---|---|---|---|
| Gemini | 499 | 326 | 5 | 321 | 321 |
| Pi | 499 | 326 | 5 | 321 | 640 |
| OpenCode | 501 | 326 | 5 | 321 | 321 |
| Hermes | 471 | 326 | 5 | 321 | 321 |
| Cursor | — | — | — | cannot hide | — |
| Kimi | — | — | — | cannot hide | — |

**Pi: 640 entries, not 642.** Pi gets one `-<path>` entry per folder that holds a hidden
skill. Of Pi's 499 skills, 455 are in both `~/.agents/skills` and the legacy
`~/.pi/agent/skills` links (B-148), and 44 are in `~/.agents/skills` only. Of the 321
hidden skills, 319 have both folders and 2 have one: 319 × 2 + 2 = 640.

The machine's `~/.sshlg-skills/visibility.json` is from the 1.55.0 apply and carries no
consent. So **no `update` hides anything on Gemini, Pi, OpenCode or Hermes there** until
someone runs `visibility --apply` with this release. The commands are in HANDOFF's next
task. This branch wrote neither the machine marks nor any host setting there.


## Independent review fix: interrupted and unavailable writes

The independent review of `343b438` reproduced a real permission failure, rather than
only malformed JSON: with readable Pi settings at mode 0400, `visibility --apply`
wrote Gemini, then threw EACCES before saving `visibility.json`. The successful write
was no longer known to `--revert`. This is the bounded recovery follow-up, under
lease `VISIBILITY-RECOVERY-1013`; the parent completion wave owns integration.

Scope and decision: `lib/visibility-state.js` journals one host at a time. Before a
host changes, a protected, atomically replaced mode-0600 receipt records the before
and expected-after SHA-256 and the next ownership state. Settings bytes are never
copied into the receipt. Every host file replacement preserves its original mode
and symlink target, checks that the target permits writing, and first calls
`apply.protect()`. A host's permission or backup failure is degraded and leaves its
previous ownership; successful earlier hosts remain recorded. A receipt failure
stops before another host mutation. A later invocation resolves a pending write by
its fingerprint; a third fingerprint is explicitly ambiguous, preserves evidence,
and refuses to guess. Hermes is compared through its CLI's disabled list, including
a readback after a write command reports failure.

`--revert` persists withdrawn consent before its first undo. Direct apply/revert
share `update.lock` with updates; a terminated process's lock is recovered by the
existing dead-pid protocol. Preview only computes pending recovery and writes
nothing. Machine marks, consent scope and the 1.55-record boundary remain as above.

Checks in `test/visibility_hosts_e2e_test.js` grow from 27 to 37. Four new cases were
watched failing on `343b438` before implementation: real EACCES, termination just
after a host write, termination during revert, and an unwritable ownership record.
The focused suite now also covers termination before a host mutation, checkpoint
failure after a host mutation, and an externally changed file with a third
fingerprint, retry after an unwritable revert, mutual exclusion with update, and
symlink/mode preservation. The suite passes all 37 checks; the existing pack (22), pure visibility
(21), original visibility e2e (11) and backup (21) suites pass too. These are scratch
HOME checks, not a new live-host acceptance claim. Every test temporary directory
owned by this run was removed. The full gate is deferred to the parent integration
run; the fixture delta is +10 with no new suite.

**Exact next task:** independently re-read the recovery code and run the final
integration gate after applying that fixture delta to DOCMAP. Search over host-only
skill roots and domain-disabled plugins is a separate completion-wave task; this
recovery fix does not claim it is closed.
