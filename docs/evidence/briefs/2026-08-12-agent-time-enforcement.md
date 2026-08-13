# Brief — agent-time enforcement: eight hooks, three repositories

**Run started** 2026-08-12 · **Pipeline** task-pipeline 1.49.2 · **Model** Opus 5 (1M)
· **Coordination** `ungated` (no `.claude/agent-sync.json` in this project; agent-sync
is installed but arbitrates nothing here, and that is said out loud rather than
implied away).

## Scope

The family already wires three hooks (`SessionStart`, `UserPromptSubmit`, `statusLine`,
v0.41.1). All three *speak*; none of them *hold*. This run adds the half that holds —
agent-time enforcement — plus the parts of the current implementation that measurement
showed weaker than advertised.

Eight items, agreed in the grill as one body of work across three repositories:

| # | Item | Repository |
|---|---|---|
| 1 | `PreToolUse` guard over the operator's instruction files | umbrella |
| 2 | Repo gate: `npm test` before `git commit`; validator on `SKILL.md` edits | umbrella |
| 3 | Machine hygiene: deny bare `npx skills update <member>`; shadow check after any skills-CLI run; snapshot/restore around `obsidian-wiki setup` | umbrella |
| 4 | Russian inflection in `lib/triggers.js` | umbrella |
| 5 | Frontmatter hooks scoped to a skill's lifetime | `task-pipeline`, `agent-sync` |
| 6 | `watchPaths` on the run ledger + `sessionTitle` | umbrella |
| 7 | `Notification` → terminal notification | umbrella |
| 8 | `ConfigChange` → displacement detected live | umbrella |

**Not in scope.** Moving the family's hooks out of `~/.claude/settings.json` into each
plugin's `hooks/hooks.json`. It would remove the write to the operator's file entirely,
and it costs the per-hook off switch — which is the exact reason `superpowers` is
disabled on this machine. Raised, deliberately not taken; recorded here so the next run
does not rediscover it as new.

## Users

The operator of this machine, and every agent session that runs under these hooks —
including sessions of other packs, which is why every guard must fail silent rather
than break a turn it was not asked about.

## UI verdict

**No user-facing surface.** A CLI launcher, hook scripts, and settings JSON. The UX,
copy and visual tracks are not armed, and this is a recorded decision rather than an
omission: drawing a scenario for a `PreToolUse` guard is how an agent is taught to route
around the chain.

## Source ledger (phase 1 — read before the first question)

| Source | What it said about this task | Freshness |
|---|---|---|
| `~/.claude/CLAUDE.md`, `~/CLAUDE.md` | one channel per agent; the shadow check and its mid-run false positive; `obsidian-wiki setup` truncating the active config; the ban on bare `npx skills update` | current — three of the eight items are already documented grievances with documented remedies |
| `CLAUDE.md` (this repo) | there is no second write path to an operator file; prove idempotence at the layer that repeats; everything outside the sentinels is preserved byte for byte | current |
| `docs/DOCMAP.md` | single homes for `lib/hooks.js`, `lib/triggers.js`, `lib/backup.js`; the propagation matrix already carries a *new hook or status line* row; ratchets **16 suites / 303 fixtures / 8 pins** | current |
| `docs/superpowers/retro.md` | six standing instructions, read in full. #2 (idempotence at the repeating layer), #6 (anchor a plant on file shape, assert it planted), #4 (uniform answers are a broken instrument) bind this run directly | **run stamps stop at v0.31.0 while HEAD is v0.41.1** — nine releases unstamped; repaired at stage 10 |
| `docs/superpowers/backlog.md` | 2 open rows (B-07, B-08), both waived deliberately | current |
| `docs/superpowers/verification.md` | 4 rows sitting at `never` | current |
| `docs/superpowers/briefs/` | last brief 2026-08-06 — nine releases shipped without one | **stale**; this file begins the repair |
| graphify `graphify-out/graph.json` | built 2026-08-10, before `lib/hooks.js`, `lib/runledger.js` and `lib/triggers.js` existed | **stale**; refreshed at stage 9 |
| Claude Code hooks reference (`code.claude.com/docs/en/hooks`) | fetched raw, 267 KB, not via summary — the summary claimed `UserPromptSubmit` receives `user_input`; the document says `prompt`, which is what the shipped hook already reads | current, fetched this run |
| Measurement, this run | `npm test` → 3.3 s, 17 checks green · `git status` clean · `HEAD..@{u}` = 0 · 8 submodules on tags, none `+` · trigger corpus 11/20 | measured |

## Locked decisions

| # | Decision | Why |
|---|---|---|
| D-01 | All eight items ship; **three releases in sequence** — `task-pipeline`, then `agent-sync`, then the umbrella with moved pins | operator's call in the grill, against the recommendation to park item 5. Standing instruction #5 therefore applies at full force: sweep all eight pins before pushing the umbrella |
| D-02 | Landing policy is **derived from doctrine, not uniform**: `deny` where the repository already says the write must not happen (a backup that cannot be taken; a bare skills-CLI update of a family member); `allow` plus a backup where the write is legitimate; **auto-repair** where the remedy is written down and idempotent (`obsidian-wiki` custom keys) | `lib/backup.js` already rules that a copy that cannot be taken cancels the write; the global ops rule says zero-touch is achieved by engineering, not by memory. A uniform `ask` teaches the operator to stop reading prompts; uniform reporting is the status quo that let a plain copy sit at 1.8.0 under a 1.8.1 plugin |
| D-03 | Deploy authorized for all three repositories, with preconditions: the repository's own full suite green, the CI verdict **read** before the tag, and a sweep of all eight pins before the umbrella is pushed. A breached precondition stops the run rather than being worked around | outward and irreversible acts need a specific authorization; this one names its targets and its gates |
| D-04 | Run mode **on**: item by item with no check-in between items. It collapses no `manual` gate and widens no authorization | operator's call; D-03's preconditions remain the floor |
| D-05 | Work lands on `main` | derived, not asked: nine consecutive releases are linear commits on `main` with no merges, and CI triggers on `push` |
| D-06 | New wiring goes through `lib/hooks.js` (plan) → `hooks/<name>.js` (thin I/O) → `protect()` in `bin/sshlg-skills.js`; no second write path is created | `docs/DOCMAP.md` propagation matrix, and the invariant this repository exists to protect |
| D-07 | The repository gate lives in a **committed** `.claude/settings.json`; machine-level guards are wired by `hooks install` into `~/.claude/settings.json` | the repo gate is a property of the repository and should arrive with a clone; the machine guards are a property of this machine |

## Constraints

- `npm test` must keep running **offline with zero dependencies**; anything needing the
  network stays outside it, beside `check_pins.py`.
- Every hook fails **silent** on a malformed payload. A guard that throws breaks every
  prompt in every session, including sessions that have nothing to do with this family.
- Ratchets may rise, never fall silently: 16 suites / 303 fixtures / 8 pins, recounted
  by running the gate.
- A `deny` must name its remedy in the same sentence. A refusal without a next step is
  how an operator learns to disable a hook.

## REQ table — frozen

| ID | Requirement | How it is verified | Status |
|---|---|---|---|
| REQ-001 | A write to `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md` or `~/.cursor/rules/sshlg-routing.mdc` is preceded by a backup the hook itself takes; the write proceeds only if the copy exists and matches | fixture: happy path leaves a backup and returns `allow`; a backup directory made unwritable returns `deny` and the file is untouched | open |
| REQ-002 | The guard sees every write path, not only `Edit` — `Write`, `MultiEdit`, `NotebookEdit`, and `Bash` forms (`>`, `>>`, `sed -i`, `tee`, `cp`, `mv`) targeting those four files | fixture table of tool payloads → expected decision, including near misses that must stay `allow` | open |
| REQ-003 | In this repository, `git commit` is refused while `npm test` fails, and the refusal names the failing check | fixture invoking the gate script against a planted failing suite; and against a green one, where it must allow | open |
| REQ-004 | Editing a `SKILL.md` in this checkout reports front-matter limit violations inside the same turn | fixture planting an over-long `description`, anchored on the front-matter's shape and asserting the plant changed the file (standing instruction #6) | open |
| REQ-005 | A bare `npx skills update <family member>` is denied with the launcher command in the reason; `npx sshlg-skills update` and non-member skills are unaffected | fixture over a command corpus including `npx --yes skills update super-ux`, `npx skills add …`, and the launcher itself | open |
| REQ-006 | After any skills-CLI run, a plain copy shadowing a plugin is reported by member, and the check does **not** fire while the launcher is mid-run | fixture with a synthetic `~/.claude` layout; plus the mid-run case, which the machine's own `CLAUDE.md` records as a false positive observed 2026-08-12 | open |
| REQ-007 | `obsidian-wiki setup` cannot silently truncate the active config: the custom keys present before the run are restored after it, and the hook reports exactly which returned | fixture: a config carrying `CLAUDE_HISTORY_PATH`, `CURSOR_HISTORY_PATH`, `OBSIDIAN_SOURCES_EXCLUDE` and the QMD block, truncated to the three keys `write_config()` writes, then compared byte for byte after restore | open |
| REQ-008 | Russian inflection no longer decides whether a route is named: the 20-prompt corpus rises from 11/20 to ≥18/20 with no new hit on a question or a refusal phrase | `test/triggers_test.js` extended with the corpus; the existing derivation check still passes — every trigger must still be advertised by the target skill's own `description` | open |
| REQ-009 | `task-pipeline`'s `SKILL.md` carries frontmatter hooks active only while the skill is: a commit is gated on the run ledger's stage | that repository's own suite, plus a watched failure | open |
| REQ-010 | `agent-sync`'s `SKILL.md` carries a frontmatter hook: editing a guarded register with no lease is refused | that repository's own suite, plus a watched failure | open |
| REQ-011 | `SessionStart` returns `watchPaths` covering the run ledger and a `sessionTitle` naming the open run; both absent when no run is open | fixture on the hook's JSON output in both states | open |
| REQ-012 | `Notification` emits a terminal notification for `idle_prompt` and `agent_completed`, restricted to the OSC codes the reference permits | fixture asserting the exact sequence and rejecting any other code | open |
| REQ-013 | `ConfigChange` on `user_settings` reports when the family's own entries were displaced by another writer | fixture: settings mutated out from under us → the hook names the entry | open |
| REQ-014 | `hooks install`, `remove` and `status` cover every new entry, write only through `protect()`, and are idempotent across **three real runs** against a real settings file | three-run end-to-end fixture comparing hashes (standing instruction #2), plus `remove` restoring the pre-install bytes | open |
| REQ-015 | The docs move in the same change: `docs/DOCMAP.md` single homes + propagation matrix + recounted ratchets, `README`, `CHANGELOG`, and this repository's `CLAUDE.md` where an invariant changed | the ratchet line recounted by running `npm test`, never carried across from the previous edit | open |

Frozen. Adding a row is free; removing or narrowing one needs the operator, recorded in
the carry-over ledger.

## Autonomy table

| Stage | Settled |
|---|---|
| run-wide | Opus 5 (1M) throughout; decide alone inside the repositories; escalate anything outward beyond D-03 |
| run-wide pacing | run mode **on** (D-04) |
| 0 harvest | repo docs + machine `CLAUDE.md` + wiki + graph; stage 9 may write to the wiki and refresh the graph |
| 0 duplicates | the consumer of the hook scripts is `~/.sshlg-skills/runtime/`, not the package directory — `lib/hooks.js:36-43` states why, and v0.41.0 shipped the wrong one |
| 0 fixtures | nothing persists between runs; every fixture builds its own `HOME` under a temp dir |
| 0 source | `HEAD..@{u}` = 0, printed before the first edit |
| 0 work-list | `docs/superpowers/backlog.md`, read by `/task-pipeline checkup` |
| 1 docs | the Claude Code hooks reference, fetched raw this run; no other external API |
| 2 decompose | one module per repository; the umbrella's seven items share one module |
| 3 spec | no UX/copy/visual track — recorded, not silent |
| 4–5 dev | `main`, conventional commit subjects as in the existing log |
| 6 tests | `npm test` in each repository; green means every discovered suite passes |
| 7 lint+deploy | release by tag through each repository's CI; D-03's preconditions |
| 8 post-deploy | read the CI verdict, install the released umbrella on this machine, and confirm the wiring from the operator's own settings |
| 9 docs+wiki | DOCMAP, README, CHANGELOG, `CLAUDE.md`; wiki sync **yes**; graph refresh **yes** (it is nine releases stale) |
| 10 acceptance | operator signs off; deferred rows go to `docs/superpowers/backlog.md`; `retro.md` standing instructions are in force and its run-stamp table gets the nine missing rows |

## Done criteria

1. Every REQ row carries evidence, not a description of evidence.
2. Three releases published, each with its CI verdict read before its tag.
3. This machine runs the released umbrella, and its settings show the new entries.
4. `git submodule status` shows no line starting `+`, every repository clean and pushed.
5. The ratchet line in `docs/DOCMAP.md` is a recount, and it rose.

## Open assumptions

- **A-01.** The `Notification`, `ConfigChange` and `FileChanged` events exist in the
  Claude Code build on this machine. The reference documents them; the build is what
  decides. If an event does not fire, the item ships as wired-and-inert with that stated
  plainly, rather than reported as working. Checked at stage 8, against the running
  session, not against the document.
- **A-02.** Frontmatter hooks (`hooks:` in `SKILL.md`) are honoured for plugin-provided
  skills, not only for project-local ones. Same rule: verified live at stage 8, or the
  item ships stated as unverified.
