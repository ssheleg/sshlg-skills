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

## Writing to the operator's file

Anything touching `~/.claude/CLAUDE.md` or `~/.codex/AGENTS.md`:

1. **Take a backup first.** Two defects in this repo's history destroyed or
   overwrote that file, and the copy that saved it was made by hand ten minutes
   earlier (B-05 is the open row asking for a mechanism).
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

`docs/DOCMAP.md` — single homes, the propagation matrix, the gate.
`docs/superpowers/backlog.md` — what this repo owes, with computed priority.
`docs/superpowers/verification.md` — what shipped and what confirmed it.
`docs/superpowers/retro.md` — standing instructions, read in full before work.
