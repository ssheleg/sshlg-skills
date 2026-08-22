# sshlg-skills

[![validate](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml)
[![npm](https://img.shields.io/npm/v/sshlg-skills)](https://www.npmjs.com/package/sshlg-skills)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Eight agent skills, one command, every agent.**

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
site no search engine or answer engine can read. It reaches for a payment
webhook or an agent's tool-calling loop and writes the version that holds until
it meets real traffic. And the moment you want it to remember how *you* work,
you are writing a skill — and packaging one correctly is its own afternoon.

Each of these eight takes one of those gaps and gives the agent a contract it
has to follow. They are documentation, validators and small standard-library
scripts. No services, no telemetry, no API keys.

| Skill | Version | What it does |
|---|---|---|
| **[super-ux](https://github.com/ssheleg/super-ux)** | 0.48.0 | Scenario-driven UI development. A versioned design chain in `docs/ux/` — the product vision → personas and jobs → user flows → a screens-and-states map with Figma frames → traced scenarios → evidence-backed audits → fix plans, plus `docs/brand/` for how the product speaks. One `/ux` entry point that reaches every skill, two doc-drift linters and a contract doctor. |
| **[task-pipeline](https://github.com/ssheleg/task-pipeline)** | 1.74.0 | Full-cycle delivery orchestrator. An intake grill interrogates the request into a complete brief, then **ten gated stages** carry it — docs, brainstorm and decompose, spec, plan, build, tests, deploy, post-deploy, wiki, acceptance — refusing to advance until each gate passes. Documentation is a deliverable with its own portable gate, and the retrospective it leaves behind is traceable to the commit that earned each lesson. |
| **[agent-sync](https://github.com/ssheleg/agent-sync)** | 1.15.0 | Several agents, one repository, no collisions. Leases with a TTL so two agents cannot claim the same work, race-free id reservation, a run journal and a generated board — over a pluggable knowledge cloud. The answer to "two sessions just committed over each other". |
| **[make-skill](https://github.com/ssheleg/make-skill)** | 0.23.0 | A skill that builds skills. Create, retrofit, audit and publish agent skills and Claude Code plugins: conformance to the [Agent Skills](https://agentskills.io/specification) open standard, [Anthropic's platform rules](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (per-surface runtime limits, the Skills API, evals) and the [Claude Code plugin reference](https://code.claude.com/docs/en/plugins-reference), marketplace layout, version sync, validator + CI, every distribution channel, the review checklist for third-party skills, and what a *skill author* must know about MCP and A2A — the protocols themselves live in `agent-stack`. |
| **[sheleg-design](https://github.com/ssheleg/sheleg-design-skill)** | 1.46.0 | The taste layer. Cinematic scroll-driven landing pages — one scroll clock, motion that degrades to calm, WebGL particle formations — plus product-UI style packs each shipping a ready token layer, and the Figma border: tokens as variables, design to code without hand-copied values. |
| **[seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)** | 0.24.0 | Evidence-first website audit for search **and** answer engines. Ten tracks from crawl access to AI citation mechanics; every finding carries an observation, every recommendation an evidence tier, and the output is a prioritized change plan plus a link-building brief — not a score. |
| **[sheleg-dev](https://github.com/ssheleg/sheleg-dev)** | 0.8.0 | The integration layer a product reaches once it has users: **money in, tracking, sign-in, speed**. Stripe subscription billing reconciled into your own database — webhook idempotency, renewals, seats and proration, refunds, price drift; crypto payments that survive under-payment, duplicate webhooks and rate drift; GA4, Google Ads, Meta and LinkedIn under Consent Mode v2; Google sign-in with the account pre-hijacking guard, and the server-side auth surface behind it; Core Web Vitals work that moves the score rather than the report. |
| **[agent-stack](https://github.com/ssheleg/agent-stack)** | 0.13.0 | Production patterns for agent systems, in four skills. **The orchestrator** — tool-calling loops that survive their own context pressure, pipelines with human checkpoints and resume, provider routing with fallback and health checks, four memory layers with confidence decay and conflict resolution, and **the shape of the work decided before the work**: an edge that carries no data is no edge, a plan that declares its dependencies is executed in layers rather than in list order, and a parallel layer gets a checker before the node that consumes it. **The harness** — what the agent is *told*: system prompts at the right altitude, tool descriptions the model can act on, technique choice with a verdict each, workflow versus agent and static versus dynamic, plus a seven-track audit of an agent somebody else built and a scanner for the defects that are mechanically visible. **The evals** — suites that measure whether it actually works: judging trajectories, regression fixtures grown from production, judges calibrated before they are trusted. **The interop layer** — MCP at revision 2026-07-28 and the four features it deprecated, running many servers at once, the registry, A2A 1.0, and the gateway, every reference carrying the spec revision it was read against. Plus the wallet side of reselling LLM access: tiered balances, one markup boundary, two-phase commit against a provider API. |

They compose. `task-pipeline` hands user-facing work to `super-ux` and takes its
leases from `agent-sync`; `make-skill` encodes the repo layout the others are
built on; `sheleg-dev` and `agent-stack` are the reference layer the first six
route *to* rather than doctrine of their own; everything installs through the one
launcher in this repo.

## The manifesto this pack implements

These skills are the reference implementation of
**[Proof of Done: The Agentic Software Development Manifesto](https://github.com/ssheleg/pod-manifesto)**
by Sergey Sheleg — *a foundation for building software when agents write the code.*
The manifesto lives in its own repository; this one is where it stops being an argument.

The manifesto's claim is that the unit of progress is not generated code but an
**evidence-carrying change**: one that carries the intent it implements, the evidence
that verifies it, the limits of that evidence, and the decision that accepts it. This
repository is where that stops being an argument. Each idea below resolves to a file
you can open and a command you can run:

| The manifesto says | Here it is |
|---|---|
| Evidence over confidence — a green nobody watched fail is not evidence | [`validate.yml`](.github/workflows/validate.yml) — **25** negative self-tests, each planting the defect its guard exists for and requiring the refusal; [`test/plant_guard.py`](test/plant_guard.py) fails the step when the plant did **not** land, so a guard nobody disarmed cannot report as one that held. `npm run test:plants` is the half you can run here — every member's own gate, fed a dropped trigger |
| Done is a coverage relation, not a status on a task | [`references/acceptance.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/acceptance.md) — the ladder walk, seam by seam |
| An edge with no named payload is chronology drawn as architecture | [`graph.schema.json`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json) refuses an edge whose `payload` is empty |
| The queue is an artifact, not the agent's recollection | [`scripts/graph.py`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/graph.py) — the model never reads the graph; a 400-node graph and a 4-node graph print the same 27-byte frontier |
| Never resolve a higher-layer conflict inside a lower-layer loop | [`references/loop-guard.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/loop-guard.md) |
| When an audit starts finding its own last pass's damage, rotate the axis | [`references/audit.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/audit.md) |
| Completion includes residue | [`references/residue.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/residue.md) — eight classes, three owners, teardown verified by re-reading state rather than by trusting the reply |
| A repeated failure becomes a mechanism, not another paragraph | [`references/retrospective.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/retrospective.md) — three grades, retirement triggers, a list capped at ten |
| Durable truth over conversational state | [`references/continuity.md`](skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/continuity.md) |

Two of the manifesto's evidence notes (`E1`, `E4`) are incidents from this repository's
own runs — it is describing measurements taken here. The four requirements it named as
**not built yet** have since been built, each with its commit:
[`9d8695d`](https://github.com/ssheleg/task-pipeline/commit/9d8695dc4b73da5b65f2dde6894d351f2e738612)
a judgment gate the schema distinguishes from a measurement,
[`fbd8a67`](https://github.com/ssheleg/task-pipeline/commit/fbd8a67e6988a0893f273eb37bd9a075a036c223)
a `serves` edge that must resolve,
[`0bc5eb6`](https://github.com/ssheleg/task-pipeline/commit/0bc5eb632e6c94181c528cf8cff315e2b7c5a2a9)
expiring verification, and
[`8b7de18`](https://github.com/ssheleg/task-pipeline/commit/8b7de18eceb8b3f58ceea35410201344bf470f49)
a node that states its own completion check. What is still owed is filed as open rows in
the member's board ([`skills/task-pipeline/docs/evidence/backlog.md`](skills/task-pipeline/docs/evidence/backlog.md))
and in this repository's own ([`docs/evidence/backlog.md`](docs/evidence/backlog.md)),
rather than described as shipped — which is the manifesto's rule applied to the manifesto.

That sentence was wrong for three days after the manifesto stopped saying it, and its own
receipt pointed at a different row than the one it named. `pod-manifesto` now checks the
claim from its end (`tools/check-currency.py`), and this end is where it is written.

If the ideas are useful to you, a ⭐ on this repository helps other people find them.

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

**`update` reconciles — it does not only refresh.** It updates every skill that
is already there, then adds the ones that are not. That second half exists
because `skills update <id>` is a no-op for a skill installed nowhere: it
prints `✓ All global skills are up to date` about a skill that does not exist,
so a member added to the family after your last `install` would never arrive,
and nothing would say so. Reconciling uses the same agent set `install` does,
which is why `update` takes `--agent` and `--all` too.

Flags: `--no-claude`, `--claude-only`, `--agent a,b`, `--all`, and
`--bump-pins` — off by default so a checkout stays reproducible; pass it when
you deliberately want the submodules fast-forwarded to their upstream tips.

> **Update through the launcher, not through a bare `npx skills update <id>`.**
> Without an explicit `--agent` list the skills CLI auto-detects Claude Code and
> re-creates `~/.claude/skills/<id>` — a plain copy that then shadows your
> plugin. The launcher passes the agent list explicitly and prunes those copies
> after every run — including under `--no-claude`, because the copy appears
> whether or not the run was asked to manage plugins.

## Routing — making the family engage by default

A skill's `description` influences whether a model reaches for it. It does not
oblige. So the pack writes a **managed routing block** into your global agent
instructions, and the rules engage in every project instead of only when
someone remembers to ask.

The block opens with the **map**: eight members, the single command that starts
each, and one line saying what it closes. It is generated from `skills.json`,
so a release moves it — and `install` and `update` refresh it, which is what
makes "the instruction your agents read is current" a mechanism rather than a
habit.

**A map, not a catalogue.** Your agent already gets every skill's name and
description from its own runtime; copying those here would put one fact in two
homes and cost context in every session of every project. What no runtime can
derive is the shape — where to start, and in what order the members compose.

Four channels get it, and each only where that agent is actually installed:

| Agent | Where |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` |
| Cursor | `~/.cursor/rules/sshlg-routing.mdc` — one file per rule, `alwaysApply: true` |

Cursor's file is ours end to end rather than a block inside yours, so it
carries the same sentinel and a file at that name **without** it is left alone:
someone else's rule is not ours to overwrite.

```bash
npx sshlg-skills routers              # write it (asks once)
npx sshlg-skills routers --dry-run    # show the diff, change nothing
npx sshlg-skills routers --update     # refresh an existing block, never create one
npx sshlg-skills routers --diff <name>            # your wording vs the packaged one
npx sshlg-skills routers --update --adopt <name>  # take the packaged wording for it
```

Ten routers, and they are **different axes rather than competing
priorities** — a landing page passes several, an internal script passes none:

| Router | Answers | When | Needs installed |
|---|---|---|---|
| `super-ux` | what the interface must do | there is user-facing behaviour | super-ux |
| `sheleg-design` | how it looks and moves | there is a visual layer | sheleg-design |
| `copywriting` | how it sounds | text a product user will read | super-ux |
| `sheleg-dev` | what it runs on to charge, track and sign in | money, tracking, sign-in or speed is being wired | sheleg-dev |
| `agent-stack` | how an agent system is built, judged and metered | the thing being built is an agent | agent-stack |
| `seo-llmo` | whether a machine will find it | a logged-out reader can see it | — |
| `evidence-docs` | what proves it | something is stated as true | — |
| `task-pipeline` | how the change reaches the repo | the repository changes | task-pipeline |
| `make-skill` | how the skill itself is built | a skill or plugin changes shape | make-skill |
| `agent-sync` | who is holding this file | the project has coordination on | agent-sync |

Two of them need no skill behind them. `seo-llmo` and `evidence-docs` are
rules, not tools, so they hold whether or not anything is installed.

**Your own wording wins.** Where you already wrote a rule by hand, migration
moves *your* text in verbatim — asides included — and the packaged default is
used only for a router you never wrote.

**And it keeps winning, which is the part that needs a report.** Because your
text always takes precedence, a router reworded in a later release never
reaches your machine — the update lands in the package and stops at your
config file. So `routers` now *names* the routers whose wording has diverged,
every run. Nothing is applied: `--diff <name>` shows both sides, and
`--adopt <name>` takes the packaged one for that router only, parking the
wording it replaces under `adopted:<name>` so an on/off toggle can never hand
back the wrong text. Your word still wins; silence stops being the decision.

**Consent is asked once**, recorded, and never asked again. Declining leaves an
`SSHLG:ROUTERS:OPTOUT` marker, which the block's own header names as the way
out and which survives a reinstall and a restored dotfile. Everything outside
the sentinels is preserved byte for byte.

### Turning routers off

```bash
npx sshlg-skills config                                  # what this machine wants
npx sshlg-skills config set routers.seo-llmo off
npx sshlg-skills routers --update                        # apply it
```

Switching a router off **removes its section** and drops its table row.
Switching it back on restores the exact bytes that were there — including
wording of yours that migration had moved in. Settings live in
`~/.sshlg-skills/config.json` (mode 0600) and store deviations only, so a
router added in a later release arrives switched on rather than silently off.

### Making it engage by itself — hooks

The routing block loads in every session and is still routed around, because
prose in a long file loses to whatever spoke last. Hooks are what speak first —
and, since v0.42.0, what **holds**:

```bash
npx sshlg-skills hooks                    # what would be wired, and what holds it now
npx sshlg-skills hooks install            # wire it (refuses to take someone else's status line)
npx sshlg-skills hooks install --force    # take it anyway, parking what it displaced
npx sshlg-skills hooks remove             # unwire, and give the displaced one back
npx sshlg-skills injectors                # who else speaks at SessionStart, and from which file
npx sshlg-skills conflicts                # installed skills that land on a router's ground
```

| Hook | What it does | What it costs |
|---|---|---|
| `SessionStart` | one note saying the block is not advisory; the session's title and the ledger to watch; **and, since v0.48.0, one line naming any other enabled plugin that also injects here** — silent when there is none | ~90 tokens per session |
| `UserPromptSubmit` | names the route this prompt asks for | nothing on the turns that don't need it |
| `PreToolUse` | **copies before any write** to `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.cursor/rules/sshlg-routing.mdc` and `~/.claude/settings.json` — and **refuses the write** if the copy cannot be taken. Also refuses a bare `npx skills update <member>` | nothing until one of those files is touched |
| `PostToolUse` | after any skills-CLI run, names the plain copies shadowing a plugin; after `obsidian-wiki setup`, puts back the config keys it truncates | nothing on any other command |
| `Notification` | a desktop ping when a long run goes idle or a background agent finishes | nothing — it emits a terminal sequence |
| `ConfigChange` | notices when something else overwrites these entries | nothing — it records; `SessionStart` reports |
| `FileChanged` | says when the run ledger advances a stage | nothing — one line, when it moves |
| `statusLine` | where the pipeline is, always visible | nothing — it prints, it doesn't inject |

**The guard is the reason this pack exists at all.** `~/.claude/CLAUDE.md` has no
version control behind it, and two defects in this repository's own history
destroyed or overwrote it — both times the copy that saved it was made by hand.
`lib/backup.js` has ruled since v0.35.0 that a copy which cannot be taken cancels
the write; until v0.42.0 that rule only covered writes **this pack** performed.
An agent editing the file with `Edit`, or redirecting into it from a shell, went
nowhere near it. Now every route is covered, and a denial says which copy failed
and that the file was not touched.

The matching is done inside the hook rather than by the entry's `if` filter,
because the hooks reference states that filter is best-effort and **fails open**
on a command it cannot parse. A guard with a documented bypass is not a guard.

The status line reads `.task-pipeline/run.md`, the ledger a pipeline run already
keeps:

```
0✓ 1✓ 2✓ 3✓ 4✓ 5· 6· 7· 8· 9· 10· · 45% · ▶ 4 Plan auto · gates 5/11 · iter 0 · holds — · 40m
```

**The denominator comes from your `pipeline.json` → `stages[]`, and from nowhere
else.** Until v0.43.0 both numbers came from how many `stage:` lines the ledger
happened to hold, so a run at stage 4 of ten printed `gates 5/5` — a finished run,
at a glance, every time. With no stage list declared, the line prints `5 gates
passed`: a count claims nothing about what is left, and the example flow's eleven
are not a fallback.

Glyphs are `✓` passed · `▶` in flight · `·` not entered · `✗` failed · `⊘` skipped
— a failed gate and a skipped stage must not look like a passed one. When a
**manual** gate has no verdict the line says `⏸ waiting on you`, because that is
the only moment nothing advances until you act.

Beside the line, two things you do not have to be looking at the terminal for: the
run's position on the **taskbar or dock** (OSC `9;4`), and a desktop ping the
moment a manual gate is reached. The four-line progress block is printed by the
hook rather than by the agent — the doctrine requires every glyph to come from the
verdict the gate wrote and from nothing else, and a process with no memory cannot
write one from memory.

Every number is borrowed rather than computed — the iteration count is the
number of `iter:` lines, the gates come from `stage:` verdicts — and an
**unreported** `holds:` prints `holds —`, not `holds 0`, because a silent stage
must not look like a clean one. In a directory with no run it prints nothing.

### Routing that acts, not only reminds

The prompt hook names the route. Naming is a hint a model may ignore, so since
v0.43.0 the un-routed path is escalated instead: when a prompt reads as work the
family routes **and no run is open**, the first `Edit` or `Write` of that turn asks
— naming the route, what it owns, and the phrase that declines it.

- **`ask`, never `deny`.** The routing block's own boundary says a typo, a one-line
  edit or a mechanical rename does *not* go through the pipeline, and no hook can
  tell a typo from a feature. You answer once.
- **Once per turn.** A turn that edits forty files asks once.
- **`Bash` is never gated** — that would put a permission prompt in front of
  running the tests rather than in front of the change.
- **A refusal phrase silences the whole session**, not the turn. Someone who said
  «без пайплайна» has decided.

**A hook cannot make a model invoke a skill.** It can refuse the un-routed path
and name the route; that is the whole of it, and claiming more would be the false
guarantee `task-pipeline`'s own hook doctrine warns about.

**The prompt hook is deliberately quiet.** A question beats any trigger — with one
derived exception: a trigger that is *itself* phrased as a question wins, because
`seo-aeo-audit` advertises «почему упал трафик» and the generic filter was
silencing it on the words it owns. Saying a router's refusal phrase silences it,
and a prompt with no signal costs nothing.
Every word it fires on must already appear in the target skill's own
`description`; a fixture reads the shipped descriptions and fails on any trigger
the skill does not itself advertise, so this cannot become a second routing
policy that drifts from the skills it routes to.

**It will not quietly take a `statusLine` it did not set.** One held by another
tool is reported and nothing is written. `--force` takes it and parks the
displaced value in `~/.sshlg-skills/config.json`, so `hooks remove` restores it
and the settings file round-trips byte for byte. Every write goes through the
same backup path the routing block uses.

Restart Claude Code after installing — hooks are read at session start.

### Working *on* this repository — the gate arrives with the clone

`.claude/settings.json` is committed, so a checkout brings two project hooks with
it. They apply only here and only in Claude Code:

| Hook | What it does |
|---|---|
| `PreToolUse` on `Bash` | a `git commit` runs `npm test` first and is **refused** while it is red, with the failing tail in the reason |
| `PostToolUse` on `Edit\|Write` | a `SKILL.md` breaking the Agent Skills front-matter limits is reported in the turn it was written |

The commit gate is honest only because of a number: the suite costs **~8.5 s**
here. At three minutes it would be a gate people route around, and a gate people
route around is worse than none — it teaches that gates are noise.

Neither hook runs for any other agent (hooks are a Claude Code feature), so the
same rules stay a self-check elsewhere. Working with a different agent, or want
them off? Delete the file — nothing else reads it.

## Other commands

```bash
npx sshlg-skills list       # the family, versions and descriptions
npx sshlg-skills agents     # supported agent ids
npx sshlg-skills conflicts  # installed skills that land on ground a router owns
```

`conflicts` is the machine-specific half of the map's arbitration rule. The rule
ships — *the router decides the route, a competing skill is never a second entry
point* — but **which** packs collide is a fact about one laptop, so it is read here
instead of written into everyone's block. It reports candidates, not offenders:
most of what it finds answers HOW where a router answers WHEN, and a router
reaching for one as a tool is the system working.

## How it works

A thin, zero-dependency Node launcher over the three mechanisms that already
reach these agents — the `skills` CLI (70+ agents), `claude plugin` (Claude
Code), and `git submodule` (pinned snapshots). It invents no new install path. It
curates the family, drives those three, and encodes the rules that are easy to
get wrong: one channel per agent, exact agent ids, repeated `--agent` flags, full
`<name>@<name>` plugin ids, and pruning shadow copies.

```
skills.json                  registry — repos, plugin ids, skill names, pins
skills/*                     the eight skills as pinned git submodules
bin/sshlg-skills.js          the launcher (install / update / routers / config / hooks /
                             injectors / conflicts / list / agents)
lib/routers-registry.js      the ten routers — text, table row and required members, in one entry
lib/routers.js               block parsing and rendering; touches no file, by construction
lib/drift.js                 your wording vs the packaged one; pure, like routers.js
lib/plan.js                  the argv handed to the skills CLI — one builder for install and update
lib/inventory.js             the family's map — entry points, not a catalogue
lib/conflicts.js             installed skills on a router's ground — candidates, not offenders
lib/cursor.js                Cursor's channel, which is one file per rule rather than a block
lib/apply.js                 the only module that writes to the instruction files
lib/migrate.js               moves hand-written rules in; never reads inside the block
lib/config.js, lib/store.js  the pack's settings, and the 0600 discipline they share
install.sh                   POSIX fallback (macOS/Linux; use npx on Windows)
test/run.js                  `npm test` — the validator, then every discovered suite
test/validate.py             registry / submodules / version validation
.github/workflows            validation on push and PR + tag-driven release
```

`skills.json` is the source of truth — repos, submodule paths, plugin ids, skill
names, default agents and each skill's pinned version. The validator keeps it in
sync with `.gitmodules` and with the submodule pointers, so checking out any hub
commit installs exactly the skill versions that commit was tested with.

## Development

```bash
npm test
```

One entry point: it runs the structural validator, then **discovers** every
`test/*_test.js` rather than listing them — a list would live in
`package.json` and in the workflow at once, and drift the first time a suite
was added to one side. An empty run fails rather than reporting green, and
`validate.py` fails if CI stops calling `npm test`.

```bash
python3 test/check_pins.py
pip install tiktoken && python3 test/audit_bundle.py
```

Both kept out of `npm test` on purpose — it must work offline and dependency-free.
`check_pins.py` queries the npm registry — every member's pin, and since v0.87.0
**this repository's own newest tag**, because a tag that never published is silent
everywhere else; `audit_bundle.py` needs a tokenizer and
refuses to estimate without one. The audit reports the always-on token budget,
bodies against their cap, trigger-phrase collisions and the installed routing
block against the registry.

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
