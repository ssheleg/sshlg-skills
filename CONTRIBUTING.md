# Contributing

Thanks for taking the time. This repo is the **hub** — a registry, pinned
submodules and a launcher. Most changes belong in a skill's own repo; a few
belong here.

## Where does my change go?

| Change | Repo |
|---|---|
| Anything a skill does, says or ships | that skill's repo ([super-ux](https://github.com/ssheleg/super-ux), [task-pipeline](https://github.com/ssheleg/task-pipeline), [agent-sync](https://github.com/ssheleg/agent-sync), [make-skill](https://github.com/ssheleg/make-skill), [sheleg-design](https://github.com/ssheleg/sheleg-design-skill), [seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)) |
| Install or update behavior across agents | here — `bin/sshlg-skills.js`, `install.sh` |
| Which skills exist, their ids, pins, default agents | here — `skills.json` |
| Adding a new skill to the family | here **after** it exists as its own marketplace repo — it does not have to live under `ssheleg`, only to ship the marketplace layout |

If you are not sure, open an issue here and it will be routed.

## Setup

No dependencies. Node 18+ and Python 3.9+ are all you need.

```bash
git clone --recursive https://github.com/ssheleg/sshlg-skills
```

If you cloned without `--recursive`:

```bash
git submodule update --init
```

## Before you open a PR

Both of these must pass:

```bash
python3 test/validate.py
```

```bash
node --check bin/sshlg-skills.js
```

`validate.py` checks that `skills.json`, `.gitmodules` and the submodule
pointers agree, and that every skill's pinned version matches what its submodule
actually contains. It is the same check CI runs.

## Rules that are easy to get wrong

These are encoded in the launcher and enforced by the validator. Please do not
work around them:

- **One channel per agent.** Claude Code gets skills as *plugins*. Every other
  agent gets them through the vercel `skills` CLI in `~/.agents/skills/`. A plain
  copy in `~/.claude/skills/` shadows the plugin and silently serves a stale
  skill — the launcher prunes those on purpose.
- **Agent ids are exact**, and the skills CLI wants **repeated `--agent` flags**,
  not a comma-joined list.
- **Plugin ids are the full `<name>@<name>` form.**
- **Pins do not move implicitly.** `update` materializes the submodules at their
  recorded commits. Only `--bump-pins` fast-forwards them, and then the moved
  gitlinks must be committed.
- **Version bumps are a set, not a file.** `skills.json`, `package.json` and the
  top `CHANGELOG.md` entry change together, then the `vX.Y.Z` tag.

### The pins here are what the family publishes, whatever npm says

`skills.json` carries a `version` per member and `list` prints it. That number is what every agent
compares its install against, so **a member that ships a release without a pin bump here is a
release nobody can see**: `list` reports the old version, `update` installs it, and both repos look
correct in isolation. It happened on 2026-07-29 with `agent-sync` 1.3.4 — published, installed
everywhere, and absent from `list` until this file caught up.

A member release therefore lands in two places, in this order: publish the member, then bump the pin
here, release this package, and confirm with `npx --yes sshlg-skills@latest list`. The member's own
CONTRIBUTING carries the same rule from the other side.

## Commits and PRs

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`) with an imperative
  subject.
- One concern per PR. A registry pin bump and a launcher change are two PRs.
- Say in the PR what you ran and what it printed. "Tests pass" is not evidence.
- If you changed behavior, the README and `CHANGELOG.md` change in the same PR.

## Reporting problems

Bugs and ideas: [open an issue](https://github.com/ssheleg/sshlg-skills/issues).
Include your OS, Node version, the agent you install for, and the full command
output — install problems are almost always environment-shaped.

Security issues: see [SECURITY.md](SECURITY.md); please do not open a public
issue for those.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
