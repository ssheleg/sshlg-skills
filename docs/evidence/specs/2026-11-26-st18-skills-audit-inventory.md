# ST-18 (B-368): what the launcher already reports, and a draft of one finding

**Status:** first step of [B-368](../backlog.md), 2026-11-26, read at `origin/main` `ca562d70`. Read only: no
command below was run with a writing flag. The JSON shape is bound to ST-08 (`project-manifest/1`, due
2026-11-28); the draft in the last section is what this hub needs from it, not the final form.

## The four finding kinds against the existing readers

| Kind (B-368) | Reader in the hub today | What it says | Machine-readable | Gap for ST-18 |
|---|---|---|---|---|
| Duplicate: one skill through two channels | `lib/shadow.js:28` `shadows(plain, provided)`; synced claude.ai copies in `syncedPlugins` (`lib/cli-visibility.js:194`, B-365) | a plain copy whose name a plugin also provides; the synced plugins counted for the listing estimate | no: the shadow list feeds `update`'s prune (`lib/cli-install.js:38` `shadowCandidates`, `:100` `pruneClaudeShadows`), which deletes; the synced list only feeds a character estimate | a read-only report of the same pairs, per host, never pruning |
| Shadowed: a plain `~/.claude/skills/<id>` over a plugin | the same `shadows`; `hosts` reports install records that point at a removed folder or a repository root (`lib/cli-hosts.js:142` `reportStaleLocalRecords`) | the pairs `update` would prune; the stale records | no (text from `hosts`) | the same pairs as findings with the command that would remove them as a hint |
| Stale: installed behind its pin | `python3 test/check_pins.py` compares the PINS with npm (published), not what a host installed; `update` reads the installed version and leaves receipts when it defers (B-364, `~/.sshlg-skills/codex-deferred/`) | pin behind release; per-run deferral | `check_pins.py` text; receipts JSON | no read-only "installed vs pin" per host: today only an `update` run learns it |
| Unrouted: no route uses it | `conflicts` (`lib/cli-info.js:173`, `lib/conflicts.js:118` `collisions`) answers the opposite question: skills that land on a router's ground; `visibility` reads use from `<claude home>/.claude.json` `skillUsage[*].lastUsedAt` (`lib/cli-visibility.js:263-265`) | on this machine 526 skills scanned, 118 landings (`conflicts`, 2026-11-26); `toolkit` lists 524 callable on Claude Code | `toolkit --find … --json` only (`lib/cli-info.js:240`); `context --json` (`:412`); `conflicts`, `hosts`, `visibility` print text | a list of installed skills that neither the routing block, `routes.external`, nor `skillUsage` within N days reaches |

## Corrections to the B-368 row

- **No `doctor` here.** `node bin/sshlg-skills.js doctor --help` answers `unknown command: doctor`. The doctor the
  global rules name is the PassionCode launcher's (`npx @passioncode-ai/passioncode doctor`), another project; ST-18
  reuses `toolkit`, `conflicts`, `visibility` and `hosts` only, and asks the launcher on its board if its output is
  wanted beside them.
- **Use comes from `skillUsage`, not transcripts.** The row says unused skills are counted "the way `visibility
  --days` already counts" Skill calls in transcripts; the code reads `skillUsage.lastUsedAt` from `.claude.json`
  (`lib/cli-visibility.js:263`). That covers Claude Code only; Codex, Hermes and Pi have no such counter here, so
  their "unrouted" finding can say only "outside every route", never "unused".

## A trap seen while reading

In a Switchboard isolated home (this session's `CLAUDE_CONFIG_DIR`) `visibility` refuses before reading:
`claude profile differs from ownership at ~/.claude/settings.json; select that profile and revert first; nothing
written`. `hosts` and `conflicts` read the session's home instead of the default one. The audit therefore names the
profile it read in every answer and, when the profile is not the ownership one, reports the profile-bound kinds as
"not read", never as zero.

## Draft of one finding (until ST-08 fixes the shape)

```json
{
  "kind": "duplicate | shadowed | stale | unrouted",
  "skill": "<skill id>",
  "host": "claude | codex | hermes | pi",
  "profile": "<the Claude home or host home read>",
  "channels": ["plugin:<name>@<marketplace>", "plain:<path>", "synced:<plugin>"],
  "evidence": { "path": "<file read>", "reader": "lib/shadow.js shadows | check_pins | skillUsage | routing block" },
  "versions": { "installed": "<x.y.z or null>", "pin": "<x.y.z or null>", "digest": "<per B-378, once the contract answers>" },
  "hint": { "command": "<what a person or agent may run>", "writes": true }
}
```

Every hint is a command the report prints and never runs (1.0 stays read-only). The `digest` field waits for the
contract's answer on how `harness.baseline` computes a skill digest (request 026a47d7, due 2026-11-30, B-378).

## Next

1. 2026-11-28: read ST-08's `project-manifest/1` «Настройка» block and bind the draft to it.
2. 2026-11-28 to 2026-12-02: one read-only command (`audit skills [--json]` or a `--json` on the existing readers),
   pure decision module with fixtures, no `HOME` in tests (house invariant: guards decide in pure modules).
3. Hosts: Claude Code, Codex, Hermes, Pi; others deferred past 1.0 as the row says.
