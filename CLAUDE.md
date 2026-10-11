# CLAUDE.md — sshlg-skills

House rules for this repository. Global language, quality, autonomy and routing
belong to the host's instruction files; do not duplicate them here.

## Start here

Read [docs/HANDOFF.md](docs/HANDOFF.md) for the current entry and dated receipts.
Apply [the standing repository handoff instruction](docs/working-rules/repository-handoff.md)
to every task. Read [the retrospective's standing instructions](docs/evidence/retro.md)
in full before work and [coordination](docs/AGENT_SYNC.md) before editing a shared
registry. [DOCMAP](docs/DOCMAP.md) owns single homes and propagation rules;
[backlog](docs/evidence/backlog.md) owns outstanding work;
[verification](docs/evidence/verification.md) owns delivery evidence.

## What this repo owns

A zero-dependency Node launcher and the family members as pinned git submodules.
[skills.json](skills.json) is the member inventory; each member owns its doctrine.
The hub owns the routing block that writes into operator-owned instruction files.
Those files may have no version control: every write must be recoverable.

## Gate and evidence

```bash
npm test          # structural validator and discovered test suites
```

DOCMAP's ratchets are computed by that run, never carried from another revision.
`python3 test/check_pins.py` queries npm and stays outside the offline gate.
Numbers are measured; named commands run and named files resolve. Evidence belongs
to the checked artifact, and a historical receipt is not a current runtime claim.

## Invariants

- **One channel per agent.** Plain `~/.claude/skills/<id>` copies shadow plugins
  and freeze their version. `install` and `update` prune them after every skills-CLI run.
- **Live document addresses resolve.** `test/doc_refs.py` extracts and resolves;
  `test/validate.py` owns the live/dated corpus. Live dead commands and paths fail;
  dated records are counted and disclosed, not rewritten. Negative controls cover
  the claim classes and an empty corpus. Quote a dead command as dead, never runnable.
- **Submodule URLs are HTTPS.** An SSH URL works for a key holder and fails for
  other installers. `test/validate.py` rejects it; CI has a negative self-test.
- **The pin is the promise.** The committed member version, `skills.json`, submodule
  pointer and README table agree. A checkout installs the advertised version.
- **The operator's wording wins.** `authored` entries outrank packaged text;
  `routers` reports drift. Only `--adopt` replaces wording, one router at a time,
  retaining what it replaced.
- **Inspect executable input.** The hygiene guard's `executablePart()` removes
  non-shell heredoc bodies and whole-line comments, but retains shell heredocs and
  quoted invocations, including `bash -c`. Quoting must not bypass `bareName` checks.
- **Guards decide in pure modules; hooks move bytes.** `lib/guard.js`,
  `lib/hygiene.js` and `lib/repogate.js` decide from payloads, fixtured without a
  `HOME`; filesystem access is confined to backup boundaries. A hook entry's `if`
  filter is best-effort and fails open on unparsed commands; do not rely on it.
- **Hooks fail silent; refusals name a remedy.** A malformed payload must not break
  other sessions. `test/hooks_e2e_test.js` asserts both through real script processes.
  Claude Code 2.1.295 added `onFailure: "block"`; family hooks keep the default
  `continue` on purpose — adding `block` is not hardening, it breaks this rule.

## Writing to operator files

Applies to `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`,
`~/.cursor/rules/sshlg-routing.mdc`, `~/.obsidian-wiki/config`, and the
`visibility` edits to `~/.claude/settings.json` and `~/.codex/config.toml`,
including the post-tool-use restore.

1. `lib/backup.js` copies before every write; backup failure cancels the write.
   Every new write path goes through `protect()` in `lib/apply.js`. Restore is a
   write too; `test/hooks_e2e_test.js` covers it. No second write path.
2. Prove idempotence where repetition happens: run the real command three times
   against a real file and compare hashes, not just pure round-trip fixtures.
3. Preserve everything outside sentinels byte for byte. Previews show removals
   as well as additions.

Incident narratives remain in the [pre-cleanup source](https://github.com/ssheleg/sshlg-skills/blob/a4c65581787b5ddcb3df1e36a8cae1c89c066479/CLAUDE.md).
The [coverage record](docs/evidence/context-research/README.md) maps this compaction
back to each rule; the retrospective itself is unchanged.
