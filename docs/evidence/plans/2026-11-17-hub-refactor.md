# Plan: the hub in its target form (refactor waves, 2026-11-17)

Run `2026-11-17-hub-refactor`, `/task-pipeline waves` over this repository. Branch
`refactor/hub-2026-11-17` from `202a1bf5` (1.89.4). Operator's order, 2026-11-17, this repository's session:
«Анализируй тот вид, который должен быть в конце, все функции, которые должны работать корректно, и в каком
они вида должны быть. Смотри на то, как и сейчас, и как корректно это работает, и составь план рефакторинга, и
волнами все до конца закрой. Не забудь параллельно решать задачи, которые прилетают.»

## 1. The survey (wave 0)

Three read-only surveys of `202a1bf5`, run in parallel on 2026-11-17:

- **The CLI surface.** `bin/sshlg-skills.js` is 5211 lines: 29 commands, their helpers, module state and help
  in one file. Twelve checks read its text by function name or line (`test/validate.py`
  `check_update_refreshes_runtime` and `check_prune_reads_the_installed_set`, `test/cli_help_test.js`,
  `fix-up-04.01/04.02/07.02/08.01`, `updatesched_test.js:326`, `materialised_test.js:155`,
  `packs_test.js:441`, the runtime plant in `.github/workflows/validate.yml`), and six scanners read only the
  top level of `lib/`, `bin/` and `hooks/` (`apply_test.js:383,448`, `conflicts_test.js:260`,
  `person_text_test.js:85`, `host_env_leak_test.js:216`, `updatelock_test.js:563`). `docs/ux/scenarios.md`
  cites `bin/sshlg-skills.js:910`, `:2619` and `:4191`, which already point at the wrong functions.
- **`lib/` health.** Five defects with receipts (below, W-A); duplicated helpers (nine hand-rolled
  temp-and-rename writers beside `lib/atomicwrite.js`, five lock implementations, three Claude-root readers,
  about twenty `process.env.HOME || os.homedir()`); about 120 exports no other file uses.
- **The open board.** 29 rows read as open. Six are closed in their own status cell and were misread by a
  naive `|` split (B-78, B-94, B-195, B-254, B-258, B-313). B-323 and B-325 are done (receipts in their rows).
  B-276's sign-in gate has cleared (Codex and Cursor are signed in on this machine).

The baseline the refactor is measured against: `npm test` on `202a1bf5` in this worktree, 170 suites, 3472
fixtures, exit 0.

## 2. The target form (the canvas)

What must be true when the run ends, for every command a person or an agent calls:

1. **One behaviour, proved unchanged.** Every command answers exactly as on 1.89.4 except where a wave below
   changes it on purpose. `test/cli_surface_golden_test.js` (B-354) holds 61 cases byte for byte: the full
   usage, each command's help, the version, an unknown command, and the read-only and dry-run answers of every
   command deterministic in an empty HOME. A deliberate change rewrites its fixture in the same commit.
2. **The launcher is a dispatcher.** `bin/sshlg-skills.js` keeps the usage text, flag parsing and `main()`;
   each command lives in a flat `lib/cli-<area>.js` module (flat, so every scanner above still reads it, and
   the runtime copy needs no new rule). Shared launcher state (`ROOT`, the manifest, the step counter, the
   frozen plans) lives in one `lib/cli-core.js`; no module reassigns another's state.
3. **One helper per job.** The Claude config root is `enablement.claudeRoot`; atomic writes go through
   `lib/atomicwrite.js`; the update lock's refuse-and-exit-75 pattern is one function.
4. **No write can lose the operator's data.** A delete is preceded by a verified copy and a written record; a
   damaged own-state file is kept before it is replaced; a file that cannot be read is never replaced.
5. **Checks follow the code.** A check that reads source text names the module the code lives in, and a
   document that cites a line cites the right one.

Out of scope: router wording (B-347 needs a paired routing evaluation first), member doctrine, other projects.

## 3. Waves

| Wave | Closes | Proof |
|---|---|---|
| W-A correctness | B-354 the surface fixture; B-355 the quarantine root, bytes, tree digest and manifest-before-delete; B-356 a damaged `config.json`/`state.json` kept before a write, an unreadable one refused | `test/cli_surface_golden_test.js`, five new cases in `test/quarantine_test.js`, two in `test/store_test.js`, red before the fix |
| W-B structure | the launcher split into `lib/cli-*.js`; the twelve text checks repointed; `docs/ux/scenarios.md` line citations corrected; duplicate Claude-root and lock-refusal helpers folded | the golden fixture unchanged; `npm test` green; `bin/sshlg-skills.js` under 1000 lines |
| W-C board | B-324 (`config set update.mode` and `schedule` under the update lock; a loaded job without its plist removed), B-326 (a foreign settings write no longer wedges `update`), B-345 (router text for a domain member enabled per project), B-341 (insight folder), stale rows closed with receipts, B-346 answered on the board | each row's own cases; the rows' status cells |
| W-D release | version 1.90.0, CHANGELOG, HANDOFF, DOCMAP ratchets; tag, release run, npm, `npx --yes sshlg-skills@latest update` on this machine | the release run, `npm view`, the update's verified lines |

No wave builds a shape a later wave undoes: W-A fixes the code where it lives today and W-B moves it as is.

## 4. What stays outside this run, and why

- B-338 (operator rules into the routing protocol): a protocol paragraph is router wording, and DOCMAP
  requires a paired routing evaluation before a cut ships (B-347). The rules' wording for rule 1 sits in board
  threads this project cannot read (`com_get` answers `not_authorized`).
- B-162 (Claude Code upstream), B-231 (fabric-vr), B-232 and B-271 (outbound to people outside the estate),
  B-329 and B-332 (other repositories), B-333 (analytics agent), B-334 (Observatory and PassionCode), B-344
  (agent-sync member): their owners are named in their rows.
- B-294: needs a moment with no Claude Code session running on this machine; sessions are never stopped for it.
