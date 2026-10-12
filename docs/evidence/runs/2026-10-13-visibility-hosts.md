# Receipt — wave L1: the marked packs hidden on every host (2026-10-13)

Plan: [`docs/evidence/plans/2026-10-13-load-optimization.md`](../plans/2026-10-13-load-optimization.md), wave L1.
Branch `feat/visibility-all-hosts` from `origin/plan/load-optimization`. Lease `WAVES-1011`.
Board: B-143 closed. B-148 untouched.

Operator decision (2026-10-13): hide the recommended packs, delete nothing. Design change from
Fabric (RM-23 owner, same day): the marks are a machine-readable file in the hub,
[`pack-marks.json`](../../../pack-marks.json); Fabric's session bundle reads it and owns
visibility in the sessions it starts; `visibility` is the host-wide fallback for the rest.

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

A scratch HOME with two shared skills, `dcf` (lock source `anthropics/financial-services`,
marked hidden) and `docx` (`anthropics/skills`, kept); the real `gemini`, Pi's own loader
(`DefaultPackageManager.resolve()` from the installed package), the real `opencode` and
`hermes` binaries with `HOME`/`HERMES_HOME`/`XDG_CONFIG_HOME` pointed at the sandbox. Never
the operator's HOME.

| Host | Before `--apply` | After `--apply` | After `--revert` |
|---|---|---|---|
| Gemini (`gemini skills list`) | dcf [Enabled], docx [Enabled] | **dcf [Disabled]**, docx [Enabled] | dcf [Enabled], docx [Enabled]; settings.json byte-identical |
| Pi (loader) | dcf enabled, docx enabled | **dcf DISABLED**, docx enabled | settings.json removed (the launcher created it) |
| OpenCode (`opencode debug config`) | no `permission` | `{"skill": {"dcf": "deny"}}` | opencode.json byte-identical |
| Hermes (`hermes skills list`, `config get --json`) | dcf enabled, docx enabled | **dcf disabled**, docx enabled; `["dcf"]` | `skills.disabled` unset (Hermes leaves `{}` in a config.yaml it created itself) |

Three `--apply` runs in that sandbox printed `written` once and `already as planned` twice;
the sha1 of the four files was identical after each run.

## Tests (watched failing first)

- `test/visibility_packs_test.js` (16 checks): marks validation, precedence, `hostHide`,
  overrides, the JSON list/map editors' byte round-trips and refusals. On the base tree:
  16 of 16 fail (`V.marksProblems is not a function` …).
- `test/visibility_hosts_e2e_test.js` (15 checks): preview writes nothing and names every
  host; three applies leave identical bytes; core and keep marks stay listed; an operator
  entry survives `--revert`; `--revert` restores every byte; no SKILL.md changes; a
  `showPacks` override un-hides; `update --agent pi` re-applies on Pi only, and only when
  `--apply` ran before. A fake `hermes` on PATH keeps its state in JSON. On the base
  launcher (`bin/`, `lib/visibility.js`, `lib/config.js` stashed): 8 of 15 fail.
- `test/validate.py` `check_pack_marks`: refused a copy with the revision removed and one
  pack duplicated (both named), then passed on the real file.

## The operator's machine: read-only preview

`node bin/sshlg-skills.js visibility` (no `--apply`) returns before any write — the write
path sits after the `if (!doApply && !doRevert) return 0` line, and the only process it
starts is `hermes config get --json skills.disabled`. Run 2026-10-13:

| Host | Skills in its roots | In hidden packs | Kept by the core | To hide | New entries |
|---|---|---|---|---|---|
| Gemini | 499 | 326 | 5 | 321 | 321 |
| Pi | 499 | 326 | 5 | 321 | 640 (one per root: `~/.agents/skills` and the legacy `~/.pi/agent/skills` links, B-148) |
| OpenCode | 501 | 326 | 5 | 321 | 321 |
| Hermes | 471 | 326 | 5 | 321 | 321 |
| Cursor | — | — | — | cannot hide | — |
| Kimi | — | — | — | cannot hide | — |

Pack marks: revision 1, 34 of the 54 installed packs hidden. Claude: hide 1 more; Codex:
disable 2 more (both by the unchanged usage rule). The modification times of the Claude,
Codex, Gemini, OpenCode and Hermes settings files were the same before and after the
preview, and no Pi settings file appeared. `--apply` on that machine follows the merge; this
branch did not run it there. That machine already holds a `~/.sshlg-skills/visibility.json`
from the 1.55.0 apply, so the first `update` after this release re-applies `visibility` and
hides the marked packs on Gemini, Pi, OpenCode and Hermes by itself.
