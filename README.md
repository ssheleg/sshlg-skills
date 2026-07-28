# sshlg-skills

[![validate](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml)
[![npm](https://img.shields.io/npm/v/sshlg-skills)](https://www.npmjs.com/package/sshlg-skills)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Five agent skills, one command, every agent.**

```bash
npx sshlg-skills install    # install the whole family
npx sshlg-skills update     # update everything already installed
```

Each skill lives in its own repo and is independently installable. This repo is
the hub: a registry, pinned submodules, and a zero-dependency launcher that
installs each agent through **exactly one channel** — so you never end up with a
stale plain copy shadowing a fresh plugin.

Agents covered: **Claude Code** (via its plugin) plus Cursor, OpenCode, Kilo,
Kimi, Hermes, OpenClaw, Codex, Gemini CLI, Windsurf, Zed and the rest of the 70+
the vercel `skills` CLI supports.

---

## The family

| Skill | Version | What it does |
|---|---|---|
| **[super-ux](https://github.com/ssheleg/super-ux)** | 0.19.0 | Scenario-driven UX as a contract: personas → jobs → journeys → flows → scenarios → audits. One `/ux` entry point that reports status and suggests the single next action, plus a linter that catches docs drifting from the code. |
| **[task-pipeline](https://github.com/ssheleg/task-pipeline)** | 0.12.0 | Full-cycle delivery orchestrator. A mandatory intake grill (domain-aware, ADR discipline) expands the request before anything is built, then nine gated stages carry it docs → brainstorm → spec → plan → build → tests → deploy → post-deploy → wiki. |
| **[make-skill](https://github.com/ssheleg/make-skill)** | 0.3.0 | Create, retrofit and ship agent skills and Claude Code plugins the proven way: marketplace layout, four-way version sync, validator + CI, multi-channel distribution, and the npm/packaging gotchas that each cost a debugging round. |
| **[sheleg-design](https://github.com/ssheleg/sheleg-design-skill)** | 0.7.0 | Cinematic, scroll-driven landing and hero design methodology plus product-UI style packs — the taste layer, not a component dump. |
| **[seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)** | 0.4.0 | Evidence-first website audit for search **and** answer engines. Ten tracks, every finding backed by an observation, every recommendation tiered, ending in a prioritized change plan. Ships a dated Google update timeline, 59 tiered growth plays, 29 refuted myths and a stdlib page auditor. |

`skills.json` is the source of truth for all of it — repos, submodule paths,
plugin ids, skill names, default agents and the pinned version of each skill. The
validator keeps it in sync with `.gitmodules`.

## Install

**From npm** (nothing to clone):

```bash
npx sshlg-skills install
```

**From GitHub** (always tracks `main`):

```bash
npx github:ssheleg/sshlg-skills install
```

**Clone with submodules** if you want the pinned snapshots and an offline copy:

```bash
git clone --recursive https://github.com/ssheleg/sshlg-skills
cd sshlg-skills && ./install.sh
```

### What `install` actually does

- **Claude Code** → installs each skill as a **plugin** (`claude plugin
  marketplace add` + `claude plugin install`), never as a plain
  `~/.claude/skills/` copy.
- **Every other agent** → the vercel [`skills`](https://github.com/vercel-labs/skills)
  CLI, installed globally into `~/.agents/skills/`, with the agent list passed as
  repeated `--agent` flags.
- **After each skills-CLI step** it prunes the plain Claude copies the CLI
  recreates on its own — that duplicate is the one failure mode that silently
  serves you a stale skill.

Flags: `--agent a,b` (pick agents), `--all` (every agent the CLI supports),
`--no-claude` (skip the plugin step), `--claude-only`.

### Just one skill?

Every skill installs standalone — see its own README. For example:

```bash
npx skills add ssheleg/seo-aeo-audit          # any agent
claude plugin marketplace add ssheleg/seo-aeo-audit
claude plugin install seo-aeo-audit@seo-aeo-audit
```

## Update

```bash
npx sshlg-skills update
```

Updates every skills-CLI install (one call per skill id) and every Claude Code
plugin, and materialises the pinned submodules in a checkout **without moving the
pins**. Restart Claude Code afterwards.

Flags: `--no-claude`, `--claude-only`, and `--bump-pins` — off by default, so a
checkout stays reproducible; pass it when you deliberately want the submodules
fast-forwarded to their upstream tips. `update` targets whatever is already
installed, so it takes no `--agent`.

> **Update through the launcher, not through a bare `npx skills update <id>`.**
> Called without an explicit `--agent` list, the skills CLI auto-detects Claude
> Code and re-creates `~/.claude/skills/<id>` — a plain copy that then shadows
> your plugin and can serve a stale skill. The launcher passes the agent list
> explicitly and prunes those copies after every run.

## Other commands

```bash
npx sshlg-skills list      # the family, versions and descriptions
npx sshlg-skills agents    # supported agent ids
```

## How it works

A thin, zero-dependency Node launcher over the three mechanisms that already
reach these agents — the `skills` CLI (70+ agents), `claude plugin` (Claude
Code), and `git submodule` (pinned snapshots). It invents no new install path; it
curates the family and drives those, and it encodes the rules that are easy to
get wrong: one channel per agent, exact agent ids, repeated `--agent` flags,
full `<name>@<name>` plugin ids, and pruning shadow copies.

```
skills.json                  registry — repos, plugin ids, skill names, pins
skills/*                     the five skills as pinned git submodules
bin/sshlg-skills.js          the launcher (install / update / list / agents)
install.sh                   POSIX fallback (macOS/Linux; use npx on Windows)
test/validate.py             registry ↔ submodules ↔ versions validation
.github/workflows            validation on push/PR + tag-driven release
```

## Development

```bash
python3 test/validate.py     # registry, submodules, version sync
node --check bin/sshlg-skills.js
```

Releases are tag-driven: bump `skills.json` + `package.json` + the top
`CHANGELOG.md` entry together, tag `vX.Y.Z`, and the release workflow cuts the
GitHub release from the matching changelog section.

---

## По-русски

**sshlg-skills** — зонтичный репозиторий семейства скилов ssheleg. Пять скилов
живут в своих репах, здесь они собраны git-сабмодулями с пинами, а один лончер
ставит и обновляет их **сразу для всех агентов**: Claude Code, Cursor, OpenCode,
Kilo, Kimi, Hermes, OpenClaw, Codex, Gemini CLI, Windsurf, Zed и др.

```bash
npx sshlg-skills install    # поставить всё
npx sshlg-skills update     # обновить всё установленное
npx sshlg-skills list       # семейство и версии
```

**Семейство:** `super-ux` — сценарный UX как контракт (личности → задачи →
джорни → флоу → сценарии → аудиты, один вход `/ux`, линтер расхождений доков и
кода). `task-pipeline` — полный цикл задачи: обязательный интейк-грил, затем
девять гейтов доки → брейншторм → спека → план → сборка → тесты → деплой →
пост-деплой → вики. `make-skill` — как правильно создавать, дотягивать до
стандарта и публиковать сами скилы и плагины. `sheleg-design` — методология
кинематографичных скролл-лендингов и стайл-паки для продуктового UI.
`seo-aeo-audit` — аудит сайта под поиск и AI-ответы: десять треков, каждый вывод
с наблюдением, каждая рекомендация с уровнем доказательности, на выходе
приоритизированный план правок.

**Обновляйся лончером, а не голым `npx skills update <id>`:** без явного
`--agent` skills CLI сам находит Claude Code и заново создаёт plain-копию в
`~/.claude/skills/`, которая потом шэдоит плагин. Лончер передаёт список агентов
явно и подчищает такие копии после каждого прогона.

**Главное правило — один канал на агента.** Claude Code получает скилы
**плагином**, остальные агенты — через `skills` CLI в `~/.agents/skills/`, а
plain-копии в `~/.claude/skills/`, которые CLI создаёт самостоятельно, лончер
подчищает: именно эта копия потом тихо шэдоит свежий плагин. Флаги: `--agent
a,b`, `--all`, `--no-claude`, `--claude-only`, а у `update` ещё `--bump-pins`
(по умолчанию выключен, чтобы чекаут оставался воспроизводимым).

Источник правды — `skills.json`; валидатор держит его в синхроне с
`.gitmodules`, CI гоняет проверку на каждый пуш, релизы режутся по тегу.

## License

MIT © 2026 ssheleg.
