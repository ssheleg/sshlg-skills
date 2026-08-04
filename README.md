# sshlg-skills

[![validate](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml)
[![npm](https://img.shields.io/npm/v/sshlg-skills)](https://www.npmjs.com/package/sshlg-skills)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Six agent skills, one command, every agent.**

```bash
npx sshlg-skills install    # install the whole family
npx sshlg-skills update     # update everything already installed
```

Works with **Claude Code** (as plugins) plus Cursor, OpenCode, Codex, Kilo, Kimi,
Hermes, OpenClaw, Gemini CLI, Windsurf, Zed and the rest of the 70+ agents the
vercel `skills` CLI supports.

---

## Why

A coding agent is good at writing code and bad at almost everything around it. It
builds an interface with no idea who uses it. It calls a task done without
checking what was actually asked for. It ships a page that looks generated, on a
site no search engine or answer engine can read. And the moment you want it to
remember how *you* work, you are writing a skill — and packaging one correctly is
its own afternoon.

Each of these six takes one of those gaps and gives the agent a contract it has
to follow. They are documentation, validators and small standard-library scripts.
No services, no telemetry, no API keys.

| Skill | Version | What it does |
|---|---|---|
| **[super-ux](https://github.com/ssheleg/super-ux)** | 0.26.5 | Scenario-driven UI development. A versioned design chain in `docs/ux/` — personas and jobs → user flows → a screens-and-states map with Figma frames → traced scenarios → evidence-backed audits → fix plans. One `/ux` entry point, plus a linter that fails when the docs drift from the code. |
| **[task-pipeline](https://github.com/ssheleg/task-pipeline)** | 1.11.0 | Full-cycle delivery orchestrator. An intake grill interrogates the request into a complete brief, then **ten gated stages** carry it — docs, brainstorm and decompose, spec, plan, build, tests, deploy, post-deploy, wiki, acceptance — refusing to advance until each gate passes. Documentation is a deliverable with its own portable gate, and the retrospective it leaves behind is traceable to the commit that earned each lesson. |
| **[agent-sync](https://github.com/ssheleg/agent-sync)** | 1.4.3 | Several agents, one repository, no collisions. Leases with a TTL so two agents cannot claim the same work, race-free id reservation, a run journal and a generated board — over a pluggable knowledge cloud. The answer to "two sessions just committed over each other". |
| **[make-skill](https://github.com/ssheleg/make-skill)** | 0.9.0 | A skill that builds skills. Create, retrofit, audit and publish agent skills and Claude Code plugins: conformance to the [Agent Skills](https://agentskills.io/specification) open standard, [Anthropic's platform rules](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (per-surface runtime limits, the Skills API, evals) and the [Claude Code plugin reference](https://code.claude.com/docs/en/plugins-reference), marketplace layout, version sync, validator + CI, every distribution channel, the review checklist for third-party skills, MCP and A2A rules. |
| **[sheleg-design](https://github.com/ssheleg/sheleg-design-skill)** | 1.3.4 | The taste layer. Cinematic scroll-driven landing pages — one scroll clock, motion that degrades to calm, WebGL particle formations — plus product-UI style packs each shipping a ready token layer, and the Figma border: tokens as variables, design to code without hand-copied values. |
| **[seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)** | 0.9.3 | Evidence-first website audit for search **and** answer engines. Ten tracks from crawl access to AI citation mechanics; every finding carries an observation, every recommendation an evidence tier, and the output is a prioritized change plan plus a link-building brief — not a score. |

They compose. `task-pipeline` hands user-facing work to `super-ux` and takes its
leases from `agent-sync`; `make-skill` encodes the repo layout the others are
built on; everything installs through the one launcher in this repo.

## Install

**From npm** — nothing to clone:

```bash
npx sshlg-skills install
```

**From GitHub** — always tracks `main`:

```bash
npx github:ssheleg/sshlg-skills install
```

**Clone with submodules** if you want the pinned snapshots and an offline copy:

```bash
git clone --recursive https://github.com/ssheleg/sshlg-skills
cd sshlg-skills && ./install.sh
```

Flags: `--agent a,b` picks agents, `--all` covers every agent the CLI supports,
`--no-claude` skips the plugin step, `--claude-only` does nothing else.

### What `install` actually does

- **Claude Code** → each skill as a **plugin** (`claude plugin marketplace add` +
  `claude plugin install`), never as a plain `~/.claude/skills/` copy.
- **Every other agent** → the vercel
  [`skills`](https://github.com/vercel-labs/skills) CLI, installed globally into
  `~/.agents/skills/`, with the agent list passed as repeated `--agent` flags.
- **Then it prunes** the plain Claude copies the skills CLI recreates on its own.
  That duplicate shadows your plugin and silently serves a stale skill — the one
  failure mode worth automating away.

### Just one skill?

Every skill installs standalone; see its own README. For example:

```bash
npx skills add ssheleg/seo-aeo-audit
```

```bash
claude plugin marketplace add ssheleg/seo-aeo-audit && claude plugin install seo-aeo-audit@seo-aeo-audit
```

## Update

```bash
npx sshlg-skills install              # nothing installed yet — the whole family, any agent
npx sshlg-skills update               # installed but behind — updates everything
npx --yes sshlg-skills@latest list    # what the current release of each member is
```

**The three commands are the whole interface**: `install` when nothing is there, `update` when it is
there and behind, `list` to see what the current release of each member is. A member updated on its
own leaves the bundle in a combination nobody tested, which is why `update` takes no member argument.

Updates every skills-CLI install and every Claude Code plugin, and materializes
the pinned submodules in a checkout **without moving the pins**. Restart Claude
Code afterwards.

Flags: `--no-claude`, `--claude-only`, and `--bump-pins` — off by default so a
checkout stays reproducible; pass it when you deliberately want the submodules
fast-forwarded to their upstream tips. `update` targets whatever is already
installed, so it takes no `--agent`.

> **Update through the launcher, not through a bare `npx skills update <id>`.**
> Without an explicit `--agent` list the skills CLI auto-detects Claude Code and
> re-creates `~/.claude/skills/<id>` — a plain copy that then shadows your
> plugin. The launcher passes the agent list explicitly and prunes those copies
> after every run.

## Other commands

```bash
npx sshlg-skills list      # the family, versions and descriptions
npx sshlg-skills agents    # supported agent ids
```

## How it works

A thin, zero-dependency Node launcher over the three mechanisms that already
reach these agents — the `skills` CLI (70+ agents), `claude plugin` (Claude
Code), and `git submodule` (pinned snapshots). It invents no new install path. It
curates the family, drives those three, and encodes the rules that are easy to
get wrong: one channel per agent, exact agent ids, repeated `--agent` flags, full
`<name>@<name>` plugin ids, and pruning shadow copies.

```
skills.json                  registry — repos, plugin ids, skill names, pins
skills/*                     the six skills as pinned git submodules
bin/sshlg-skills.js          the launcher (install / update / list / agents)
install.sh                   POSIX fallback (macOS/Linux; use npx on Windows)
test/validate.py             registry / submodules / version validation
.github/workflows            validation on push and PR + tag-driven release
```

`skills.json` is the source of truth — repos, submodule paths, plugin ids, skill
names, default agents and each skill's pinned version. The validator keeps it in
sync with `.gitmodules` and with the submodule pointers, so checking out any hub
commit installs exactly the skill versions that commit was tested with.

## Development

```bash
python3 test/validate.py
```

```bash
node --check bin/sshlg-skills.js
```

Releases are tag-driven: bump `skills.json`, `package.json` and the top
`CHANGELOG.md` entry together, tag `vX.Y.Z`, and the release workflow cuts the
GitHub release from the matching changelog section.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). To report a
vulnerability, see [SECURITY.md](SECURITY.md).

## Author

Built by ssheleg — [sshlg.me](https://sshlg.me)

- X / Twitter — [@sshlg93](https://x.com/sshlg93)
- Telegram — [@sshlg](https://t.me/sshlg)

## License

MIT © 2026 ssheleg.
