# CLAUDE.md — sshlg-skills

House rules for **this repository only**. Global doctrine (language, quality
bar, ops autonomy, skill routing) already loads from `~/.claude/CLAUDE.md` in
the same session; repeating it here would create a second source of truth that
drifts. What follows is what is true *here* and nowhere else.

## What this repo is

The **umbrella** of the ssheleg skill family: a zero-dependency Node launcher
plus eight skills as pinned git submodules. It ships no doctrine of its own —
each member carries its own — but it owns the family's **routing block**, the
one piece of the family that writes into a file the operator owns and did not
write.

That last sentence is the whole risk profile. `~/.claude/CLAUDE.md` has no
version control behind it. Everything below exists because of it.

## The gate

```bash
npm test          # test/validate.py, then every discovered test/*_test.js
```

Ratchets live in `docs/DOCMAP.md` and are counted by running that command, never
carried across from a previous edit. `python3 test/check_pins.py` is deliberately
outside it: it queries the npm registry, and `npm test` must work offline.

## Invariants — each one has a check, and the check has been watched failing

- **One channel per agent.** A plain copy under `~/.claude/skills/<id>` shadows
  the plugin of the same name and serves its frozen version forever. `install`
  and `update` prune those copies after every skills-CLI run.
- **Submodule urls are HTTPS.** `gh repo create --source .` sets an SSH remote
  and `git submodule add` inherits it; everything stays green on the machine
  that has the key and the release smoke test exits 128 everywhere else.
  `test/validate.py` refuses a non-HTTPS url, with a negative self-test in CI.
- **The pin is the promise.** A checkout of any hub commit must install exactly
  the versions `skills.json` advertises, so the validator reads the version out
  of the submodule rather than trusting `.gitmodules`. Three places move
  together: `skills.json`, the submodule pointer, the README table.
- **The operator's wording wins — and now says when it has diverged.** `authored`
  entries take precedence over the packaged text on every run. Since that means
  a reworded router never arrives, `routers` reports drift and `--adopt` is the
  only path that replaces a person's words, one router at a time, parking what
  it replaced.
- **A guard reads what would RUN, not what a payload contains.** The hygiene guard
  refused any Bash text carrying `skills update <member>` — including a document quoting
  it, which blocked a verification-ledger row from being committed. `executablePart()`
  now drops heredoc bodies fed to a non-shell and whole-line comments, and keeps
  everything else: a `bash <<EOF` body still runs, and quoted strings are still read,
  because `bash -c '…'` is a real invocation. Closing the false positive turned up the
  matching bypass — `bareName` kept the trailing quote, so a genuine quoted invocation had
  been passing untouched.
- **A guard decides in a pure module; the hook only moves bytes.** Every refusal
  this pack can make is a function of a payload (`lib/guard.js`, `lib/hygiene.js`,
  `lib/repogate.js`), fixtured without a `HOME`, and the filesystem appears only
  where a backup is actually taken. Nothing depends on a hook entry's `if` filter:
  the reference states it is best-effort and **fails open** on a command it cannot
  parse, so a guard resting on it ships with a documented bypass.
- **A hook fails silent, and a refusal names its remedy.** A guard that throws
  breaks every turn in every session, including sessions of packs that never asked
  for this one; a refusal with no next step is how an operator learns to switch a
  hook off. Both are asserted in `test/hooks_e2e_test.js`, which runs the real
  scripts as processes.

## Writing to the operator's file

Anything touching `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`,
`~/.gemini/GEMINI.md` or `~/.cursor/rules/sshlg-routing.mdc`:

1. **The backup is a mechanism, not your memory.** `lib/backup.js` copies the
   file before every write, and a copy it cannot take cancels the write. New
   code that writes to one of these files goes through `protect()` in
   `lib/apply.js` — there is no second write path, and adding one is the
   regression to watch for. Two defects in this repo's history destroyed or
   overwrote `~/.claude/CLAUDE.md`; both times the copy that saved it was made
   by hand, once ten minutes before it was needed (B-05, closed 2026-08-12).
2. **Prove idempotence at the layer that repeats.** Run the real command three
   times against a real file and compare hashes — a pure core with passing
   round-trip fixtures sat under a command whose second run destroyed the file.
3. **Everything outside the sentinels is preserved byte for byte**, and a
   preview must show its removals, not only its additions.

## Evidence

Numbers here are counted by running something. The v0.22.0 notes said 71
fixtures, its acceptance record said 74, and the count at that commit was 75 —
both restated numbers were wrong and the counted one was right. Every named
command must be runnable and every named file resolvable.

## Where things live

`docs/AGENT_SYNC.md` — how coordination is wired here, and what it does NOT
guarantee. **Read it before editing a shared registry.** Coordination went on
2026-08-14, after a second session released the umbrella and two members while
this one was mid-run: nothing was lost, but a CHANGELOG got written at a version
behind its own tree, and a member moved under the work twice.
`docs/DOCMAP.md` — single homes, the propagation matrix, the gate.
`docs/evidence/backlog.md` — what this repo owes, with computed priority.
`docs/evidence/verification.md` — what shipped and what confirmed it.
`docs/evidence/retro.md` — standing instructions, read in full before work.
