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

## 2026-11-27: the hub's answer to DEC-0199 (`project-setup/1`)

The contract asked (board request 7a893a3d, 2026-11-27, answer due 2026-12-02, merge as is 2026-12-03, freeze
2026-12-04) whether the four hint kinds of the `skills` part suffice for ST-18 and what the audit's report is called on
the machine and in the project. Read at fabric-agent-contract PR #365, branch `agent/st-shapes-20261127`, commit
`a7f5909d`: `schemas/project-setup.schema.json` and `docs/specification/project-manifest.md` (PS-1 to PS-8,
`FAC-SEM-194`). Unattended board run: the hub decides its own report format (the page's "Not decided here" leaves it to
sshlg-skills) by the safest reversible option, and asks the contract only for what its schema owns.

### (a) The hint kinds: enough, with three schema changes and two descriptions

The four kinds (`duplicate`, `shadowed`, `stale`, `unused`) cover the four findings of B-368. The item around them does
not yet hold what ST-18 reads:

1. **`runner` on a skill item, and uniqueness per name, scope and runner.** ST-18 reads Claude Code, Codex, Hermes and
   Pi. The same skill sits under two runners at two versions on this machine: Codex reads super-ux 0.67.1 and
   sheleg-design 1.67.1 while Claude Code reads 0.68.0 and 1.68.0 (B-364, [HANDOFF](../../HANDOFF.md) 2026-11-26).
   `FAC-SEM-194` allows "a skill of one scope once", so the second item is refused. Asked: the optional `runner` that
   `mcpServers` and `hooks` already carry (PM-6), with the same uniqueness rule.
2. **`skills.maxItems` above 512.** This machine holds 526 distinct skill names over `~/.claude/skills`,
   `~/.agents/skills`, `~/.codex/skills` and the Claude plugin cache and synced folders (counted 2026-11-27; every
   name fits the schema's `name` pattern), and `toolkit` lists 524 callable on Claude Code (2026-11-26, above). With
   `runner` an item per runner multiplies that. Asked: 2048.
3. **`other` for a copy synced from claude.ai.** Claude Code loads account-synced plugins from
   `<claude home>/plugins/synced/<account>/<plugin>/` beside `installed_plugins.json` (B-365). A synced copy of an
   installed plugin of the same name reads as `plugin:<name>` against itself. Asked: `synced:<plugin>` in the pattern.
4. **`latest` (description only).** For a family member the version the machine should have is the hub's pin, which
   may trail npm (`python3 test/check_pins.py`); for any other skill it is the newest published. Asked: say "the
   version the audit expects (for a family member, the release the hub pins)".
5. **`unused` (description only), and a partial `degraded`.** ST-18's `unused` is: outside every route (the routing
   block and `routes.external`) and, where the runner counts use, no use in the window (Claude Code's `skillUsage`,
   `lib/cli-visibility.js:263`, 60 days as `visibility --days`). Codex, Hermes and Pi count no use, so there it means
   the route alone. When a runner's home cannot be read (a Switchboard isolated home refuses `visibility`, above), the
   audit needs to say which: asked, `skills-audit:<runner>` parts in `degraded`, as `observed:*` (PS-7). Desirable, not
   blocking.

**If the form merges as is on 2026-12-03,** the hub fills `skills` for Claude Code only (the page reads one Claude
configuration folder in 1.0), keeps the other runners, the synced copies and anything over 512 in its own report, and
names nothing it left out as empty. The hints it emits stay inside PS-4.

### (b) The report's name: decided here

- **Format `skills-audit/1`**, the hub's, a superset of the view's part: `view.skills` and `view.degraded` are exactly
  `project-setup/1` values (source `skills-audit`); `detail` adds what the view must not carry (the profile read, the
  evidence path, the reader, the hint's command, which ST-18 prints and never runs).
- **Command:** `npx sshlg-skills skills-audit [--project <root>] [--json]`. Without `--project` it reports the global
  scope; with it, the global scope plus the project's skill folders. Read-only toward skills, hosts and repositories.
- **On the machine:** the last run's copy in the hub's own state folder, `~/.sshlg-skills/skills-audit/machine.json`
  for the global scope.
- **In the project:** nothing is written into the repository (1.0 is read-only, and a file in the tree would dirty
  every repository and carry machine data into Git). The project's copy stays on the machine,
  `~/.sshlg-skills/skills-audit/projects/<key>.json`, `<key>` the first 16 hex characters of SHA-256 over the project
  root's real path. Fabric (ST-19) reads the command's `--json` output, or that file when it is fresher than its own
  build of the view (`at`).

Reversible: the command and the files do not exist yet (B-368 builds them 2026-11-28 to 2026-12-02), so a different
name the contract asks for costs one edit.
