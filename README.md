# sshlg-skills

[![validate](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

One umbrella for the **ssheleg skill family** — the five skills live in their own
repos, aggregated here as git **submodules**, with a single **launcher/updater**
that installs and updates them across **every agent**: Claude Code, Cursor,
OpenCode, Kilo, Kimi, Hermes, OpenClaw, Codex, Gemini CLI, Windsurf, Zed, and more.

## The family

| Skill | Repo | What |
|---|---|---|
| **super-ux** | [ssheleg/super-ux](https://github.com/ssheleg/super-ux) | Scenario-driven UX: foundation → flows → screens → scenarios → audits, one `/ux` entry, a doc-drift linter |
| **task-pipeline** | [ssheleg/task-pipeline](https://github.com/ssheleg/task-pipeline) | Mandatory built-in intake grill (domain-aware, ADR discipline) + 9 gated delivery stages on the superpowers skills |
| **make-skill** | [ssheleg/make-skill](https://github.com/ssheleg/make-skill) | Create, retrofit, and ship skills & plugins the proven way |
| **sheleg-design** | [ssheleg/sheleg-design-skill](https://github.com/ssheleg/sheleg-design-skill) | Cinematic scroll-driven landing/hero design + product-UI style packs |
| **seo-aeo-audit** | [ssheleg/seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit) | Evidence-first SEO + AEO/GEO site audit: ten tracks, evidence tiers, a prioritized change plan |

Each is independently installable; this repo is the one-command hub.

## Install everything

**No clone needed** (runs straight from GitHub):
```
npx github:ssheleg/sshlg-skills install
```
After npm publish, the short form also works:
```
npx sshlg-skills install
```

**Or clone with submodules** (pinned snapshots + offline reference):
```
git clone --recursive https://github.com/ssheleg/sshlg-skills
cd sshlg-skills && ./install.sh
```

### What `install` does

- **Non-Claude agents** (`cursor, opencode, kilo, kimi-code-cli, hermes-agent,
  openclaw, codex, gemini-cli, windsurf, zed`) via the vercel `skills` CLI, global.
- **Claude Code** via its **plugin** (not a plain copy) — so it never shadows a
  plugin you already run.

Flags: `--agent a,b` (pick agents), `--all` (every agent the skills CLI supports),
`--no-claude` (skip the Claude plugin step), `--claude-only`.

## Update everything

```
npx github:ssheleg/sshlg-skills update
```
Updates every skills-CLI install (one call per skill id) and the Claude Code
plugins, and materialises the pinned submodules inside a checkout **without moving
the pins**. Restart Claude Code to apply.

Flags: `--no-claude`, `--claude-only`, and `--bump-pins` (fast-forward the pins to
their upstream tips — off by default so a checkout stays reproducible). `update`
targets whatever is already installed, so it takes no `--agent`.

## Other commands

```
npx github:ssheleg/sshlg-skills list      # the family + versions
npx github:ssheleg/sshlg-skills agents    # supported agents
```

## How it works

A thin, zero-dependency launcher over the tools that already reach each agent: the
vercel [`skills`](https://github.com/vercel-labs/skills) CLI (70+ agents),
`claude plugin` (Claude Code), and `git submodule` (pinned snapshots). It adds no
new install mechanism — it curates the family and drives those. `skills.json` is
the source of truth (repos, plugin ids, default agents); the validator keeps it in
sync with `.gitmodules`.

## По-русски

**sshlg-skills** — единый зонтичный репозиторий для семейства скилов ssheleg
(super-ux, task-pipeline, make-skill, sheleg-design, seo-aeo-audit). Сами скилы живут в своих
репах и подключены сюда git-**сабмодулями**, а один **лончер/апдейтер** ставит и
обновляет их сразу для **всех агентов**: Claude Code, Cursor, OpenCode, Kilo, Kimi,
Hermes, OpenClaw, Codex, Gemini CLI, Windsurf, Zed и др.

Установить всё: `npx github:ssheleg/sshlg-skills install`. Обновить всё:
`npx github:ssheleg/sshlg-skills update`. Не-Claude агенты идут через `skills` CLI,
Claude Code — через **плагин** (чтобы не дублировать plain-копией). Флаги:
`--agent a,b`, `--all`, `--no-claude`, `--claude-only`. Список семейства и версий —
`… list`, поддерживаемые агенты — `… agents`.

Лончер ничего не изобретает — он тонкая обёртка над тем, что уже умеет достучаться
до каждого агента (`skills` CLI, `claude plugin`, `git submodule`). Источник правды
— `skills.json`, валидатор держит его в синхроне с `.gitmodules`.

## License

MIT © 2026 ssheleg.
