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

## Bound to the contract's shape (2026-11-27)

fabric-agent-contract proposed the view's skills part in DEC-0199 (draft PR #365, head `a7f5909d`,
`schemas/project-setup.schema.json` `/properties/skills`, `docs/specification/project-manifest.md` PS-4) and asked on
its board (request 7a893a3d, thread 1580e344, due 2026-12-02). This hub's answer is message fbd93666:

| Draft kind above | Contract `hints[].kind` | Field the contract adds |
|---|---|---|
| `duplicate` | `duplicate` | `other`: `global`, `project` or `plugin:<name>`, never a path |
| `shadowed` | `shadowed` | `other`, as above |
| `stale` | `stale` | `latest`: the hub fills it with the pin `update` installs (offline; pins equal releases per `test/check_pins.py`) |
| `unrouted` | `unused` | none: the contract's definition is route-based, which is what Codex, Hermes and Pi allow; `skillUsage` is extra evidence on Claude Code |

Checked on the operator machine the same day: all 658 skill directory names (`~/.claude/skills`, the plugin cache,
`~/.codex/skills`, `~/.agents/skills`) match the item's `name` pattern, and no plugin name repeats across marketplaces
in `installed_plugins.json`, so `other` without a marketplace loses nothing today; synced claude.ai copies (B-365)
are reported as `plugin:<synced plugin>`.

**Asked of the contract:** an optional `runner` (catalogue id) on each hint, and `hints.maxItems` from 4 to 16, because
one skill of one scope can be current in Claude Code and stale in Codex (super-ux 0.68.0 against 0.67.1, B-364).
**Fallback if it does not land by 2026-12-03:** the view's skills part is filled from the Claude Code reading and the
per-runner split stays in this hub's own report.

**Report name, decided here:** format `skills-audit/1`, printed on stdout, no file by default (1.0 is read-only):
`npx sshlg-skills audit skills --json` for the machine, `--project <root>` to add the `project`-scope skills from
`<root>/.claude/skills` and `<root>/.agents/skills`, `--out <file>` when the harness wants a file. Its `skills` array is
item-for-item the `project-setup/1` item with `source: skills-audit`; the profile read, runners and evidence paths sit
in other members the harness does not copy (PS-5). A profile the audit could not read is named, so the harness puts
`skills-audit` in `degraded` rather than show an empty list (PS-1).

## Built, first cut (2026-11-28)

The contract's PR #365 moved to head `6e7c5c5a` and took both asks: each hint has an optional `runner` (catalogue id)
and `hints.maxItems` is 16. The first cut follows that shape:

- `lib/skillsaudit.js`: the pure decision module. Input: per runner the copies it loads (`plugin` or `plain`, scope,
  version, path), the pins, the routed names, `skillUsage`. Output: `skills-audit/1` with `skills` (the contract item and
  nothing else: `name`, `scope`, `version`, `installed`, `hints`, `source: skills-audit`), and beside it `runners`,
  `degraded`, `counts`, `evidence` (copies with paths and the commands a person may run), `skipped`.
- `lib/cli-audit.js`: the walker. Claude Code is read (the same `conflicts.readSkills` roster, versions from
  `installed_plugins.json`, `skillUsage` from `.claude.json`); `--project <root>` adds `.claude/skills` and
  `.agents/skills`. Codex, Hermes and Pi, when their home exists, are listed in `degraded` as "not read by this
  release", never as clean.
- `npx sshlg-skills audit skills [--json] [--project <dir>] [--days 60] [--full]`; nothing is written.
- `test/skillsaudit_test.js`: 17 fixtures with no `HOME` (each kind, the runner on every hint, one item across two
  runners, a runner not read, the contract's item and hint members and patterns, determinism, no em dash in the text).

Measured on the operator machine (Switchboard isolated home, so its `skillUsage` is that home's): 524 skills read in
Claude Code; duplicate 0, shadowed 0, stale 0, unused 485; with a planted project copy of `copywriting`: shadowed 1
(global, by project) and duplicate 1 (project, by `plugin:super-ux`).

Decisions in the first cut: `expected` is left out (it means "the project's manifest names it", and this hub reads no
project manifest); `shadowed.other` names where the HIDING copy is, as the contract's description says ("another copy
hides this one"); a namespaced id (`plugin:skill`) counts as routed when its bare name is.

## Next

1. Done early (2026-11-27, section above); re-read PR #365 when it merges (planned 2026-12-03) for the `runner` answer.
2. Done 2026-11-28 for Claude Code (section above). Next: read Codex (`~/.codex/skills`, its plugin cache and
   `config.toml`), then Hermes and Pi, into the same runner list; then `--out <file>` if the harness asks for one.
3. Hosts: Claude Code, Codex, Hermes, Pi; others deferred past 1.0 as the row says.
