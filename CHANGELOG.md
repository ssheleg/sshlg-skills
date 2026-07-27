# Changelog

## v0.4.1 — 2026-07-27

- **task-pipeline bumped to v0.12.0** in the registry and the submodule pin
  (was 0.10.0). That release makes the intake grill mandatory and **built in** —
  the `grill-me` / `grilling` dependency is gone, the doctrine is ported in-house
  with domain awareness (CONTEXT.md glossary challenges, ADR discipline) and an
  autonomy sweep that pre-resolves every stage-1→9 blocker — and replaces
  per-stage model tiering with one provider-agnostic model confirmed up front.
- Registry `desc` and the README family table updated to match.

## v0.4.0 — 2026-07-25

- **Enforce "one channel per agent" automatically.** The skills CLI auto-detects
  Claude Code and writes `~/.claude/skills/<id>` even when it is never named as a
  target, so every `install`/`update` silently recreated plain copies that shadow
  the Claude plugin. The launcher now prunes those copies after any skills-CLI
  step while the plugin channel is active (skipped under `--no-claude`, where the
  plain copies are the intended channel). Verified live: 7 shadows → 0.

## v0.3.1 — 2026-07-25

- Pin bump: sheleg-design **0.7.0** (style-agnostic build recipe, release
  workflow, RU README). Family now pinned at super-ux 0.19.0, task-pipeline
  0.10.0, make-skill 0.3.0, sheleg-design 0.7.0.

## v0.3.0 — 2026-07-25

Launcher hardening — four defects an adversarial audit proved by execution.

- **FIX: `update` silently moved the pins, even with `--claude-only`.** The
  submodule step ran before any flag branch and used `--remote --merge`, so a
  "Claude-only" run fast-forwarded a submodule to its upstream tip and left the
  superproject dirty — destroying the pinned-snapshot contract. It now runs only
  when not `--claude-only`, uses `--init --recursive` (materialise, don't move),
  and moves pins **only** behind the new explicit `--bump-pins`.
- **FIX: every `claude plugin` failure was swallowed.** Those `run()` results were
  discarded, so a completely failing `claude` still exited 0 (worst with
  `--claude-only`, where nothing else could set the flag). All four calls now feed
  the exit status — verified with a failing stub on PATH: exit 1.
- **FIX: the CI could not catch a bad `skillNames`.** Both workflows checked out
  `submodules: false`, and the cross-check was guarded by `if isdir(...)` — so it
  skipped silently and a bogus id passed green. Workflows now check out
  `submodules: recursive`, and the validator **fails loudly** when a submodule
  isn't materialised instead of skipping.
- **`skills update` now runs one call per skill id** so a single bad id can't fail
  the batch; contradictory `--claude-only --no-claude` and a valueless `--agent`
  now exit 2; `spawnSync` uses `shell` on Windows (npx/claude are `.cmd` shims);
  `list` falls back to versions recorded in `skills.json` when run from an npx
  tarball (it printed `v?` for everything, including the release smoke test).
- README's `update` section now matches the launcher (no `--agent`, adds
  `--bump-pins`).

## v0.2.1 — 2026-07-25

- Pins bumped to the review-pass releases: super-ux **0.19.0** (contracts now ship
  with every skill), task-pipeline **0.10.0** (brief template reachable on every
  channel, current super-ux chain), make-skill **0.3.0** (stopped shipping a
  placeholder skill; validator enforces the canon), sheleg-design 0.6.0.

## v0.2.0 — 2026-07-24

- **Fix: `update` never updated super-ux.** A repo can ship several skills under
  different ids — super-ux ships `ux-foundation`/`ux-flows`/`ux-scenarios`/
  `ux-audit` and there is no skill called `super-ux` — but the launcher passed the
  repo names to `skills update`, which matches INSTALLED SKILL ids. super-ux was
  silently skipped on every update. `skills.json` entries now carry `skillNames[]`
  (the ids actually shipped) and the launcher updates those; the validator
  enforces the field and cross-checks it against the skills each submodule ships,
  so the regression cannot come back.

## v0.1.3 — 2026-07-24

- **Tolerate stray non-flag arguments.** zsh does not treat `#` as a comment by
  default, so `... install # note` passed `#` into the launcher and it hard-failed
  with "unknown option: #". Now only `-`/`--`-prefixed unknowns error; bare stray
  tokens are ignored with a notice, so the intended command still runs.

## v0.1.2 — 2026-07-24

- Bumped submodule pins to the current release of each skill: super-ux 0.18.0,
  task-pipeline 0.9.0, **make-skill 0.2.0** (correct multi-agent + cross-platform
  distribution guidance), sheleg-design 0.6.0.

## v0.1.1 — 2026-07-24

- **Fix multi-agent install.** The vercel `skills` CLI does not split a
  comma/space-joined `--agent` value (it read `cursor,opencode,…` as one invalid
  agent). The launcher now passes one repeated `--agent <name>` flag per agent, so
  `install` reaches the whole default agent set (and `--all`/`--agent a,b`) in one
  `skills add` call per skill.

## v0.1.0 — 2026-07-24

Initial release — the ssheleg skill-family umbrella.

- **Submodules** (`skills/`): super-ux, task-pipeline, make-skill, sheleg-design
  (→ `ssheleg/sheleg-design-skill`), wired via `.gitmodules` (https urls, clonable
  without SSH).
- **Launcher/updater** `bin/sshlg-skills.js` (zero-dep): `install` / `update` /
  `list` / `agents`. A thin orchestrator over the vercel `skills` CLI (70+ agents),
  `claude plugin` (Claude Code), and `git submodule` (pinned snapshots). Non-Claude
  agents via the skills CLI; Claude Code via its plugin to avoid a shadow duplicate.
  Flags: `--agent`, `--all`, `--no-claude`, `--claude-only`.
- **`skills.json`** — source of truth (repos, plugin ids, default agent set).
- **Validator** (`test/validate.py`, stdlib): package/version, bin resolves, files
  whitelist, CHANGELOG version match, and `.gitmodules` ↔ `skills.json` ↔ on-disk
  submodule agreement. CI runs it plus a negative self-test and `node --check`.
- **Distribution:** `npx github:ssheleg/sshlg-skills` (no publish needed),
  `git clone --recursive` + `install.sh`, and (optional) npm `sshlg-skills`.
