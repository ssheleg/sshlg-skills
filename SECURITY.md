# Security

## What this package does on your machine

`sshlg-skills` is a **launcher**. It installs and updates six agent skills by
driving three tools that are already on your system or fetched by `npx`. It has
zero runtime dependencies and no post-install script.

| Component | Runtime behavior |
|---|---|
| `bin/sshlg-skills.js` | Node script. Runs only when you invoke it. Spawns `claude`, `npx skills` and `git` as child processes; writes nothing outside `~/.claude/`, `~/.agents/skills/` and the checkout you ran it in. |
| `install.sh` | POSIX fallback for the same flow. |
| `skills.json` | Data. The registry the launcher reads. |
| `skills/*` | Pinned git submodules — the six skills, each its own repo. |
| `test/validate.py` | Standard-library Python. Reads the repo, writes nothing. |

There is no telemetry, no analytics and no phone-home. The launcher never asks
for, reads or transmits credentials.

## What it executes

Exactly three external commands, always with an explicit argument list — never a
shell string, so nothing in `skills.json` can be interpreted as shell syntax:

- `claude plugin marketplace add|update` and `claude plugin install|update`
- `npx --yes skills add|update … --global --yes --agent <id>`
- `git submodule update --init` (and `--remote --merge` only under `--bump-pins`)

## What it deletes

One thing, deliberately: plain skill copies under `~/.claude/skills/<id>` for the
ids in `skills.json`, after a skills-CLI step recreates them. Those copies shadow
the Claude Code plugin and serve a stale skill. Nothing else is removed, and no
path outside `~/.claude/skills/` is touched.

## Trust boundary

Installing runs code from six GitHub repos — five under the `ssheleg`
organization and `agent-sync` under `appvillis-com` — plus the vercel `skills`
CLI. Pins in `skills.json` and the submodule pointers mean a given hub commit
installs exactly the skill versions it was tested with; review them if you need
reproducibility — every pin is a release tag. Skills are documentation plus small
standard-library scripts; each repo documents its own runtime surface.

## Reporting a vulnerability

Do **not** open a public issue. Report privately through
[GitHub Security Advisories](https://github.com/ssheleg/sshlg-skills/security/advisories/new),
or write to the contacts on [sshlg.me](https://sshlg.me).

Please include the version, your OS and Node version, what you observed, and a
reproduction if you have one. Expect a first response within a few days. Fixes
ship as a normal tagged release with the issue described in `CHANGELOG.md`; if
you want credit, say so and how you would like to be named.

## Supported versions

The latest release on `main` is the supported one. There are no long-term support
branches — fixes go into the next tag.

## Verifying for yourself

```bash
git clone --recursive https://github.com/ssheleg/sshlg-skills && cd sshlg-skills
```

```bash
grep -n "spawnSync\|execSync\|rmSync\|unlink" bin/sshlg-skills.js
```

That is the entire process-spawning and deletion surface of the launcher.
