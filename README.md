# ssheleg harness · sshlg-skills

[![validate](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/ssheleg/sshlg-skills/actions/workflows/validate.yml)
[![npm](https://img.shields.io/npm/v/sshlg-skills)](https://www.npmjs.com/package/sshlg-skills)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![site](https://img.shields.io/badge/docs-skills.sshlg.me-8ab0ff)](https://skills.sshlg.me/)

**A working method for coding agents, with a skill family and Project Observatory.**

Route the task, preserve its intent, verify the result and leave a handoff another agent can use. The skill family supplies the instructions and checks; Project Observatory is a separately installed tool for observing projects and credential exposures. [How the harness works](docs/harness/README.md).

```bash
npx sshlg-skills install
```

Verify the resolved family: `npx --yes sshlg-skills@latest list`.

**[Detailed docs →](https://skills.sshlg.me/)** · one page per skill,
every routing rule verbatim, and [`llms.txt`](https://skills.sshlg.me/llms.txt)
for the machines. · **[Follow @sshlg93 on X](https://x.com/intent/follow?screen_name=sshlg93)**

Works with **Claude Code** (as plugins) and **DeepSeek Harness** (`dsh`), plus
Cursor, OpenCode, Codex, Kilo, Kimi, Hermes, Gemini CLI, Windsurf, Zed
and other targets among the 79+ agents the vercel `skills` CLI supports.
Kimi gets the skills only: the hub has no instruction target for it, so the
routing block reaches it only through a file you keep yourself
([which](#routing--making-the-family-engage-by-default)). OpenClaw is opt-in (`--agent openclaw`,
[why](#install)). The pinned snapshot has 77 global targets; native extension
support is checked separately in the [compatibility report](docs/reports/2026-10-16-coding-agent-compatibility/README.md).

---

## Why

A coding agent is good at writing code and bad at almost everything around it. It
builds an interface with no idea who uses it. It calls a task done without
checking what was actually asked for. It ships a page that looks generated, on a
site no search engine or answer engine can read. It reaches for a payment
webhook or an agent's tool-calling loop and writes the version that holds until
it meets real traffic. And the moment you want it to remember how *you* work,
you are writing a skill — and packaging one correctly is its own afternoon.

Each skill pack takes one of those gaps and gives the agent a contract it
has to follow. They are documentation, validators and small standard-library
scripts. No services, no telemetry, no API keys.

| Skill | Version | What it does |
|---|---|---|
| **[super-ux](https://github.com/ssheleg/super-ux)** | 0.66.1 | Scenario-driven UI development. A versioned design chain in `docs/ux/` — the product vision → personas and jobs → user flows → a screens-and-states map with Figma frames → traced scenarios → evidence-backed audits → fix plans, plus `docs/brand/` for how the product speaks. One `/ux` entry point that reaches every skill, two doc-drift linters and a contract doctor. |
| **[task-pipeline](https://github.com/ssheleg/task-pipeline)** | 1.102.0 | Full-cycle delivery orchestrator. An intake grill interrogates the request into a complete brief, then **ten gated stages** carry it — docs, brainstorm and decompose, spec, plan, build, tests, deploy, post-deploy, wiki, acceptance — refusing to advance until each gate passes. Documentation is a deliverable with its own portable gate, and the retrospective it leaves behind is traceable to the commit that earned each lesson. Ships `project-audit`: a cold-start audit of a whole project — discovery, probes whose unmet needs read `blind` rather than clean, production evidence including one artefact served under two channels, and an HTML report beside a JSON sidecar that says what moved. |
| **[agent-sync](https://github.com/ssheleg/agent-sync)** | 1.23.1 | Several agents, one repository, no collisions. Leases with a TTL so two agents cannot claim the same work, race-free id reservation, a run journal and a generated board — over a pluggable knowledge cloud. The answer to "two sessions just committed over each other". |
| **[make-skill](https://github.com/ssheleg/make-skill)** | 0.33.1 | A skill that builds skills. Create, retrofit, audit and publish agent skills and Claude Code plugins: conformance to the [Agent Skills](https://agentskills.io/specification) open standard, [Anthropic's platform rules](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (per-surface runtime limits, the Skills API, evals) and the [Claude Code plugin reference](https://code.claude.com/docs/en/plugins-reference), marketplace layout, version sync, validator + CI, every distribution channel, the review checklist for third-party skills, and what a *skill author* must know about MCP and A2A — the protocols themselves live in `agent-stack`. |
| **[sheleg-design](https://github.com/ssheleg/sheleg-design-skill)** | 1.66.3 | The taste layer. Cinematic scroll-driven landing pages — one scroll clock, motion that degrades to calm, WebGL particle formations — plus product-UI style packs each shipping a ready token layer, and the Figma border: tokens as variables, design to code without hand-copied values. |
| **[seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)** | 0.32.0 | Evidence-first website audit for search **and** answer engines. Ten tracks from crawl access to AI citation mechanics; every finding carries an observation, every recommendation an evidence tier, and the output is a prioritized change plan plus a link-building brief, not a score. Before a site is built, `/seo-aeo-audit brief` writes the build-time brief that the audit later verifies. |
| **[sheleg-dev](https://github.com/ssheleg/sheleg-dev)** | 0.16.1 | The integration layer a product reaches once it has users: **money in, tracking, sign-in, speed**. Stripe subscription billing reconciled into your own database — webhook idempotency, renewals, seats and proration, refunds, price drift, and the coupon offered at the cancel step, where a `duration=once` discount leaves `subscription.discounts` the moment its invoice finalizes and the offer can be taken every cycle; crypto payments that survive under-payment, duplicate webhooks and rate drift; GA4, Google Ads, Meta and LinkedIn under Consent Mode v2; Google sign-in with the account pre-hijacking guard, and the server-side auth surface behind it; Core Web Vitals work that moves the score rather than the report; and Sentry error tracking wired so it does not forward your own credentials to a third party and so a stack trace names the commit that caused it. |
| **[agent-stack](https://github.com/ssheleg/agent-stack)** | 0.31.2 | Production patterns for agent systems, in four skills. **The orchestrator** — tool-calling loops that survive their own context pressure, pipelines with human checkpoints and resume, provider routing with fallback and health checks, memory architecture — form, function and dynamics, the four-stage retrieval pipeline, and what a layer table alone cannot say, and **the shape of the work decided before the work**: an edge that carries no data is no edge, a plan that declares its dependencies is executed in layers rather than in list order, and a parallel layer gets a checker before the node that consumes it. **The harness** — what the agent is *told*: system prompts at the right altitude, tool descriptions the model can act on, technique choice with a verdict each, workflow versus agent and static versus dynamic, plus a seven-track audit of an agent somebody else built and a scanner for the defects that are mechanically visible. **The evals** — suites that measure whether it actually works: judging trajectories, regression fixtures grown from production, judges calibrated before they are trusted. **The interop layer** — MCP at revision 2026-07-28 and the four features it deprecated, running many servers at once, the registry, A2A 1.0, and the gateway, every reference carrying the spec revision it was read against. Plus the wallet side of reselling LLM access: tiered balances, one markup boundary, two-phase commit against a provider API. |
| **[telegram-dev](https://github.com/ssheleg/telegram-dev)** | 0.5.3 | Telegram, split by the API each surface actually speaks. **`telegram-bots`** — the official HTTP Bot API: `update_id` as the only idempotency key an update carries, the `allowed_updates` default that subscribes you to everything *except* `chat_member` and the two reaction types while answering `ok: true`, the webhook secret header that is the real check, rate limits as a design constraint (1/sec per chat, 20/min per group, ~30/sec bulk), and Telegram Stars with a **ten-second** pre-checkout window and a grant that belongs to `successful_payment`. **`telegram-userbots`** — MTProto and Telethon: the session file as a credential equal to the password, `FloodWaitError` as the API telling you exactly how long to wait, pinning across minor releases that move session and entity-cache behaviour, and the account-ban risk a bot token does not carry — the skill opens with whether a user account is needed at all. **`telegram-miniapps`** — the web layer, whose entire security model is one signed query string: verifying `initData` server-side, the `auth_date` window, the Ed25519 path for a third party, and the SDK package whose name moved while the organisation's own page still fronts the old one. Both the verifier and the delivery invariants ship as runnable fixtures with their mutants, and a bot under load has its own reference: a poll that never waits on a handler, a queue per chat under one ceiling, payments outside it, guards measured from arrival, a bounded shutdown, with a discrete-event simulation whose nine invariants each go red without their rule. |
| **[xr-dev](https://github.com/ssheleg/xr-dev)** | 0.4.3 | **`quest-lifecycle`** maps the product from platform choice through design, build, testing, Store, monetization, launch and operation. The existing owners cover native OpenXR, Kotlin Spatial/hybrid apps, measured rendering optimization, current-source/tool discovery, commercial and asset readiness, and WebXR/PWA. Every stage names evidence and a next action; Meta engine companions and official Godot XR documentation supply implementation detail. |
| **[web3d-dev](https://github.com/ssheleg/web3d-dev)** | 0.2.3 | Realtime 3D on the web with three.js and React Three Fiber, split by the question. **`web3d-runtime`** — how the scene runs: WebGPURenderer and its WebGL2 fallback, TSL and compute, post-processing, device loss and profiling, led by the failures r186 keeps silent: `render()` before `init()` throws, `positionNode` collapses every instance to a point, `computeAsync` does not wait for the GPU, and about twenty drei components do not run on WebGPU. **`web3d-assets`** — the glTF pipeline from a source to the frame within a written budget: gltf-transform and gltfpack, KTX2 and meshopt, the loader that reads the result, sourcing and the four licence questions; it delegates orders to the asset service when the machine runs one and works by the same principles when not. **`web3d-animation`** — a two-sided animation protocol with a shared clip canon: rig, clips, blending, retargeting, root motion, crowds and vertex-animation textures. Every fact is pinned to three@0.186.1, and the gate checks each code block against that release's exports. |

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
| Evidence over confidence — a green nobody watched fail is not evidence | [`validate.yml`](.github/workflows/validate.yml) — **33** negative self-tests, each planting the defect its guard exists for and requiring the refusal; [`test/plant_guard.py`](test/plant_guard.py) fails the step when the plant did **not** land, so a guard nobody disarmed cannot report as one that held. `npm run test:plants` is the half you can run here — every member's own gate, fed a dropped trigger |
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

Flags: `--agent a,b` picks valid global targets, `--all` selects the pinned CLI’s
77 globally supported targets (76 while Claude uses plugins),
`--no-claude` skips the plugin step, `--claude-only` does nothing else.

**OpenClaw is opt-in:** `--agent openclaw` (or `--all`) installs for it; a plain
`install` or `update` does not. The skills CLI counts OpenClaw as present whenever
a `~/.openclaw` folder exists, so a leftover folder kept a dead host in every run.
And OpenClaw's caps would show only part of the family even where it runs: at most
150 skills and 18,000 characters in the prompt, and 300 candidates and 200 loaded
skills per root. Raise its `skills.limits.*` before you opt in.

### What `install` actually does

- **Claude Code** → each skill as a **plugin** (`claude plugin marketplace add` +
  `claude plugin install`), never as a plain `~/.claude/skills/` copy.
- **Other installer targets** → the vercel
  [`skills`](https://github.com/vercel-labs/skills) CLI, using shared storage, with
  repeated `--agent` flags. A *universal* adapter (Cursor, Gemini CLI, OpenCode,
  Kilo, GitHub Copilot, Droid and the like) installs into `~/.agents/skills` only,
  never into its own declared global folder (skills@1.7.2 `dist/cli.mjs:2337-2341`),
  so such a host sees the family only if it reads `~/.agents/skills`. Other adapters
  get their own global destination; Hermes and Kiro use native roots.
- **Unsupported global targets** → Eve and PromptScript are excluded from
  `--all`; explicit unknown or project-only names fail before installation.
  The [dated compatibility report](docs/reports/2026-10-09-coding-agent-compatibility/README.md)
  separates skill discovery from plugins, hooks, delegation and runtime evidence.
- **Then it prunes** the plain Claude copies the skills CLI recreates on its own.
  That duplicate shadows your plugin and silently serves a stale skill — the one
  failure mode worth automating away.

### DeepSeek Harness

Nothing to install beyond the ordinary `install`, and **no plugin to write.**
`dsh` reads the Agent Skills standard directly: its local provider scans
`<agentsHome>/skills` at rank 500, which is `~/.agents/skills` — the directory
the skills CLI already installs into.

Verified two ways on 2026-08-25 rather than read off a page. The subsystem is in
the **default** profile, not an optional add-on:

```bash
npx @deepseek-ai/dsh --profile web --dump-default-config | grep skill
#   name: '@deepseek-ai/dsh-skill'
#   name: '@deepseek-ai/dsh-skill-filesystem'
#   name: '@deepseek-ai/dsh-tool-skill'
```

and the files are where that provider looks:

```bash
ls ~/.agents/skills/telegram-bots/     # SKILL.md  references/  fixtures/
```

Two things worth knowing, both read from the harness's own
[skills subsystem doc](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md)
on 2026-08-25:

- **Discovery is layered and nearest-wins**, in this order —
  `<projectRoot>/.dsh/skills` (100), `<projectRoot>/.agents/skills` (200),
  `Config.customSkillDirs` (300), `<dshHome>/skills` (400),
  `<agentsHome>/skills` (500), bundled (600). A project-local copy therefore
  **overrides** the installed one, which is the same shadowing trap Claude Code
  has and the same remedy: keep one channel per skill.
- **`disable-model-invocation` and `user-invocable`** are the two front-matter
  keys `dsh` reads, both defaulting to `true`. This family ships neither, so
  every skill is model- and user-invocable there by default.

**A skill is not a `dsh` plugin, and the distinction is worth keeping.** In that
harness a *plugin* is a Cordis module exporting `apply(ctx)`; skills are loaded
*by* one — `dsh-skill-filesystem`. These repositories carry the `dsh-plugin`
topic because that is the discovery channel the project asks for, and
`dsh-skill`, which is what they actually are.

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

**Three commands carry the daily interface**: `install` when nothing is there, `update` when it is
there and behind, `list` to see what the current release of each member is. A member updated on its
own leaves the bundle in a combination nobody tested, which is why `update` takes no member argument.

### The way back

Install had no reverse until v1.47.0 — and clearing an agent's skill store had no recoverable path
at all. Four commands close that:

```bash
npx sshlg-skills uninstall [--no-claude] [--dry-run]   # the reverse of install
npx sshlg-skills backup                                # archive ALL skills of ALL agents
npx sshlg-skills wipe [--dry-run]                      # backup + verify, THEN remove them all
npx sshlg-skills restore [<archive>]                   # bring the newest (or named) backup back
```

`uninstall` removes exactly what install reaches: the family's skill ids out of every discovered
agent channel — provenance-checked, so a foreign skill that merely shares a name is reported and
kept — the Claude Code plugins with their marketplaces, the managed routing block (through the
same backup-first `protect()` every operator-file write uses; bytes outside the sentinels are
preserved), the Cursor rules file, and the hooks. `backup`/`wipe`/`restore` operate on the WHOLE
store, family or not: one `tar.gz` relative to `$HOME` with symlinks kept as symlinks, a manifest
beside it, and one gate — **a wipe whose backup could not be taken and verified against the
archive's own listing does not run.** Restore verifies the counts back against the manifest and
names every channel that came up short.

Updates every skills-CLI install and every Claude Code plugin, and materializes
the pinned submodules in a checkout **without moving the pins**. Restart Claude
Code afterwards.

**Codex native version changes are deferred to preserve running sessions.**
Codex 0.162.1 plugin replacement deletes older cache generations that an open thread
may still use for hooks. `update` inspects installed, enabled family plugins through
`codex plugin list`; a version different from the requested pin returns
`DEFERRED_ACTIVE_GENERATION_SAFETY` before any native removal or installation.
The overall update is partial and exits nonzero while such transitions remain.
A matching catalog version is a catalog observation; the generations loaded by
running threads remain unknown. There is no verified safe retention/retirement
adapter yet. A timer, process count or starting another session does not authorize
this launcher to replace native payloads.

The hub records immutable private pending intent under
`~/.sshlg-skills/codex-deferred/`, bound to the canonical profile, config fingerprint
and desired source. It prints a safely quoted POSIX watcher command. The observer
reads native state and records private observations, with a two-minute cadence,
60-observation limit and two-hour deadline; it never installs or stops Codex.
Catalog agreement ends observation without claiming old threads reloaded. Other
marketplaces, disabled/absent plugins and foreign family-named sources stay outside
the native update scope. `--claude-only`, or an `--agent` list without `codex`, skips
this inspection. See [the native reproduction and acceptance boundaries](docs/evidence/completion-1013/codex-cache-preservation.md).

**Plain skills are reconciled at the release's immutable commits.** Both `install`
and `update` use the member `commit` fields shipped in `skills.json`, through
`skills@1.7.2 add <repo>#<40-character-commit>`. The launcher validates the whole
inventory before starting; missing or malformed pins refuse the run. A pinned add
replaces existing bytes as well as installing missing skills, so no floating
`skills update` runs first. Continue copies are restored as real directories with
`--copy`, including previously installed copies outside the selected default set.
The selected agent list and shared-store effects still apply.

**Claude Code plugins use exact member sources through the native CLI.** The shipped
`claude-plugin-pins.json` records each plugin's commit, relative source and file
hashes. The launcher prepares the full plan, uses owned catalogues with native
`git-subdir.sha` sources, then checks installed scope, source and every payload file.
Same-version repair is limited to supported user-scope, unconfigured plugins with
a verified prior source; it keeps plugin data and restores disabled state. A version
update moves the user scope and every local (per-project) scope together: each local
scope is updated inside its own project, every step is read back record by record,
and a failure rolls the moved scopes back. A local record under an old path that
resolves to another recorded project is left as recorded. Project and managed scopes
and other repair shapes block that member, by name, and the run reports partial. Interrupted or uncertain execution leaves a recovery
receipt and blocks blind retry. Native activation and task quality require their
own observations even after installed bytes match.

Flags: `--no-claude`, `--claude-only`, `--agent a,b`, `--all`, and
`--bump-pins` — off by default so a checkout stays reproducible; pass it when
you deliberately want the submodules fast-forwarded to their upstream tips.
That run still installs the published commit inventory. For the next release, stage
the reviewed gitlinks, run `node scripts/sync-member-pins.js --write`, then
`node scripts/sync-claude-pins.js --write`. The gates compare both inventories with
the staged member sources.
The scope flags scope the Claude host's files too: under `--no-claude`, or any
`--agent` list, neither the routing block in `CLAUDE.md`, nor the hook wiring in
`settings.json`, nor the runtime copy those hooks execute
(`~/.sshlg-skills/runtime`) is touched, nor is `claude plugin update` run, and the run
says `skipped: <flag>` (since v1.56.0). No `--agent` value selects the Claude host — `--agent claude` exits 2
(the pinned skills CLI has no such agent id), and `--agent claude-code` names the
plain-copy target the plugin channel leaves out — so to scope a run to Claude use
`--claude-only`, or no scope flag at all.
`--dry-run` lists the `settings.json` write as its own `hooks-wiring` step, with
the field each entry would change. **`update` never adds a hook entry**: one you
removed stays removed, and an event a later release introduces is wired only by
`npx sshlg-skills hooks install` — `update` and its preview name each family event
not wired here, with that command. `hooks install` re-adds every removed family
entry, not only the new ones, so skip it if you removed an entry on purpose.

If the hook runtime cannot be refreshed, `update` exits with a failure and skips
hook rewiring; other update steps may already have completed. `hooks install`
also exits with a failure and leaves hook settings unchanged. A caught switch
error rolls managed files back when possible and verifies their previous bytes,
permissions and presence. Unresolved journals are preserved for inspection.

A hard stop can leave `~/.sshlg-skills/runtime/.sync.lock` and recovery records.
The next attempt names the paths to inspect and refuses to replace that lock
automatically. Do not delete it by hand. `npx sshlg-skills hooks recovery inspect`
shows whether its writer is provably dead; `hooks recovery recover --expect
<digest>` then retires a dead writer's lock and rolls back through the journal.
Live and unprovable holders are left alone. See the [runtime recovery contract](docs/working-rules/state-json.md#the-runtime-lock-and-failed-refresh).

**Exit codes of `update`:** 0 done, 1 a step failed, **2 a usage error** (an unknown
flag, a flag without its value, contradictory flags), **75 another `update` holds
`~/.sshlg-skills/update.lock`** (EX_TEMPFAIL — retry later, nothing failed; every
published launcher since 1.56.0). Details: `docs/working-rules/state-json.md`.

> **Update through the launcher, not through a bare `npx skills update <id>`.**
> Without an explicit `--agent` list the skills CLI auto-detects Claude Code and
> re-creates `~/.claude/skills/<id>` — a plain copy that then shadows your
> plugin. The launcher passes the agent list explicitly and prunes those copies
> after every run — including under `--no-claude`, because the copy appears
> whether or not the run was asked to manage plugins.

### Domain members load only where a project needs them

Claude Code lists every enabled plugin's skills in every session. Four members serve one
kind of project — `xr-dev`, `web3d-dev`, `telegram-dev` and `sheleg-dev` (money, tracking,
errors, sign-in, speed). Only the first three are scoped: **sheleg-dev and any plugin
shipping hooks stay enabled globally**, because disabling a plugin removes its gates too.
The core members (`task-pipeline`, `agent-sync`, `make-skill`, `super-ux`, `sheleg-design`,
`seo-aeo-audit`, `agent-stack`) stay on everywhere.

```bash
npx sshlg-skills domains            # preview: each project's members and WHY; nothing written
npx sshlg-skills domains --apply    # project entries first, read back; then off at user scope
npx sshlg-skills domains --revert   # undo exactly what --apply wrote, user scope first
npx sshlg-skills domains --enable xr-dev    # start a new project before it has dependencies
npx sshlg-skills domains --disable xr-dev   # undo that explicit project entry
npx sshlg-skills domains --root ~/code --no-usage   # another projects directory; no usage table
```

- **Which projects.** Every git repository directly under the projects root: `~/DATA` by
  default, or `--root` / `$SSHLG_PROJECTS_ROOT` (`:`-separated for several); `--apply`
  records the root, so `update` and `hosts` use it later. Symlinked repositories count once
  by realpath. A missing or empty root refuses application; an incomplete scan retains
  global coverage for members it could not rule out.
- **What counts as evidence.** A project gets a member only from what the repository
  depends on or declares, never from its name or its prose. `web3d-dev`: `three` or
  `@react-three/*` in a `package.json`. `telegram-dev`: `grammy`, `telegraf`,
  `node-telegram-bot-api`, `@telegram-apps/*`, or Python `aiogram`, `python-telegram-bot`,
  `telethon`, `pyrogram`. `xr-dev`: Meta XR, Spatial SDK or OpenXR in Gradle, CMake or a
  Unity manifest, the Quest VR category in an `AndroidManifest.xml`, or `navigator.xr` in
  source. `sheleg-dev`: `stripe` / `@stripe/*`, `@sentry/*` / `sentry-sdk`, `posthog`,
  GA4 `gtag`, Google sign-in libraries, crypto-payment SDKs. Vendored, built and fixture
  directories don't count (`node_modules`, `dist`, `fixtures` and the like); nor do nested
  repositories. Optionally, the newest `~/.sshlg-skills/usage/skill-usage-60d-*.tsv`: a
  project with calls in that dated snapshot gets that member; a snapshot more than 60 days
  old is ignored (`--no-usage`
  turns this off). The preview prints the evidence for every entry. Source scanning reads
  all matching lines; only the displayed explanations are capped.
- **The order is the safety.** `--apply` writes `enabledPlugins["<member>@<member>"]: true`
  into each matching project's `.claude/settings.local.json` and reads it back. Only then
  does it set the member to `false` in `~/.claude/settings.json`. Existing choices in
  `.claude/settings.json` and then `.claude/settings.local.json` take precedence over
  automatic additions: a project `false` stays off, a project `true` is not claimed.
  Every existing file is
  copied through `protect()` before it is written. It does not use `claude plugin enable
  --scope local`, which reports success and writes nothing (B-162).
- **A project it will not write.** It only writes where git ignores
  `.claude/settings.local.json` (`git check-ignore`: the repository's `.gitignore`, its
  `info/exclude` or your global excludes file). If git does not ignore it, or the file is in
  a format other than Claude Code's own, that project is refused and named, and **its
  member stays on at user scope**. A negated rule (`!.claude/settings.local.json`) does not
  count as ignored. If the member was already turned off by an earlier `--apply`, it goes back
  on at user scope, so the refused project still has it.
- **Ownership.** `~/.sshlg-skills/domains.json` records each value `--apply` wrote.
  `--revert` changes only those values, and only while they still hold what `--apply`
  set: a value you changed afterwards is yours. To keep a member off in one project, set
  it to `false` there. If you delete the entry instead, the next `--apply` or `update` adds
  it back, because the project's evidence is still there. A `domains.json` that does not
  parse, cannot be read, or has the wrong shape, stops `--apply`, `--revert` and `update` with a reason;
  the previous copy is in `~/.sshlg-skills/backups/`. Running `--apply` three times leaves
  identical bytes. Ownership intent is saved atomically before each settings change; a
  failed global write stays pending for retry. Unreadable or malformed project settings
  retain their recovery ownership. Explicit `--enable` followed by `--disable` restores a
  pre-existing local `false`. Mutating `domains` commands share the update lock, so another
  launcher writer makes them refuse with exit 75; previews remain available.
- **Claude profiles.** `CLAUDE_CONFIG_DIR` selects the active user settings and plugin
  registry. Ownership records bind to the actual settings path; a different profile or
  retargeted alias refuses mutation rather than reverting another profile. Legacy records
  belong to the default Claude directory. Project `.claude` settings stay project-local.
- **`update` keeps it current.** On a machine where `--apply` has run, `update` gives a
  project that has since gained a domain dependency its member; it never newly disables a
  global member. Reinstalling an existing plugin refreshes it without enabling it.
  On a machine where it has
  never run, `update` prints one line pointing to `domains`. `hosts` prints how many
  projects have evidence for each member and how many have it enabled; it prints no
  project names.

**To start a new domain project**, run `npx sshlg-skills domains --enable xr-dev`
inside its repository (or pass `--project <dir>`), then restart the Claude Code session.
The explicit choice persists without dependency evidence. `--disable` removes only the
entry this command owns. `toolkit --find` still finds installed but disabled domain
skills, labels them “not loaded here”, and names the enable command. Project-local
enablement takes precedence over the global value for search and hook readers.

**Inside Fabric**, per-agent skill layers are planned. Until that capability ships,
`domains` is the host-wide fallback; this command does not implement Fabric's layers.

## Routing — making the family engage by default

A skill's `description` influences whether a model reaches for it. It does not
oblige. So the pack writes a **managed routing block** into your global agent
instructions, and the rules engage in every project instead of only when
someone remembers to ask.

The block is headed `## Work routing — the ssheleg family` (until 1.58.0 the
heading was Russian; a block that still carries it is retitled on its next write).
It opens with the **map**: eleven members, the single command that starts
each, and one line saying what it closes. It is generated from `skills.json`,
so a release moves it — and `install` and `update` refresh it, which is what
makes "the instruction your agents read is current" a mechanism rather than a
habit.

**A map, not a catalogue.** Your agent already gets every skill's name and
description from its own runtime; copying those here would put one fact in two
homes and cost context in every session of every project. What no runtime can
derive is the shape — where to start, and in what order the members compose.

After the map comes the **work protocol**: how a task opens (search the whole
catalogue, print the plan) and closes (the skills used, a signed report). It ends
with the one writing rule every host carries whatever is installed: **no em dash in
text for people** (operator decision, 2026-10-18). Chat answers, messages, mail,
docs, reports, handoffs and PR descriptions carry no U+2014 and no substitute for
one, in any language; the grammatical Russian dash survives only where no rewrite
reads naturally. Product copy gets the same rule from super-ux (`copywriting`,
lint code `B067`).

Five channels get it, and each only where that agent is actually installed:

| Agent | Where |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` (Codex invokes a skill as `$name`; the block's `/name` is Claude's syntax) |
| Gemini CLI | `~/.gemini/GEMINI.md` (or `$GEMINI_CLI_HOME/.gemini/GEMINI.md`) |
| Pi | `~/.pi/agent/AGENTS.md` (or `$PI_CODING_AGENT_DIR/AGENTS.md` — the writer, `uninstall` and the write guard all follow it) |
| Cursor | `~/.cursor/rules/sshlg-routing.mdc` — one file per rule, `alwaysApply: true`. Cursor finds it by walking up from the workspace, so it loads only for workspaces under `$HOME` |

Other hosts read these files without the hub writing for them. OpenCode and VS Code
Copilot read `~/.claude/CLAUDE.md` as a fallback; OpenCode stops as soon as a
`~/.config/opencode/AGENTS.md` exists. `~/.agents/AGENTS.md` is read by Kimi, Goose,
Warp and Droid; the hub does not write it, so today it holds what you put there.

**Pi** (`@earendil-works/pi-coding-agent`, command `pi`) reads skills from `~/.pi/agent/skills`,
`~/.agents/skills` and, per project, `.pi/skills` and `.agents/skills` up to the repository root;
a name found twice keeps the first and warns; it loads no Claude Code plugins, so the family
reaches it as plain skill directories plus the block above. `npx sshlg-skills hosts` reports,
read-only, whether Pi is here, where the 39 family skills are visible to it, and how many names
repeat across its roots — the same realpath twice (a symlink into `~/.agents/skills`) is counted
as harmless, different realpaths are named as conflicts. Nothing is pruned or moved. The sources
are Pi 1.1.0's own documentation (its skills page, lines 59-61 and 85, and its configuration page, lines 9 and 18);
`test/pi_test.js` runs the block through the real writer three times against a real file.

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

Fifteen routers, and they are **different axes rather than competing
priorities** — a landing page passes several, an internal script passes none:

| Router | Answers | When | Needs installed |
|---|---|---|---|
| `super-ux` | what the interface must do | there is user-facing behaviour | super-ux |
| `sheleg-design` | how it looks and moves | there is a visual layer | sheleg-design |
| `copywriting` | how it sounds | text a product user will read | super-ux |
| `sheleg-dev` | what it runs on to charge, track and sign in | money, tracking, errors, sign-in or speed is being wired | sheleg-dev |
| `agent-stack` | how an agent system is built, judged and metered | the thing being built is an agent | agent-stack |
| `telegram-dev` | which Telegram API a surface speaks, and what it costs | the thing being built lives inside Telegram | telegram-dev |
| `xr-dev` | how a Quest product moves from platform choice to launch and operation | the thing being built runs on a Meta Quest headset | xr-dev |
| `web3d-dev` | how a realtime 3D scene on the web runs, ships its assets and moves | a three.js or React Three Fiber scene renders in the page | web3d-dev |
| `seo-llmo` | whether a machine will find it | a logged-out reader can see it | — |
| `evidence-docs` | what proves it | something is stated as true | — |
| `fabric` | what runs on this machine and how its Fabric services are read | the subject is a local agent service or the Fabric network | — |
| `task-pipeline` | how the change reaches the repo | the repository changes | task-pipeline |
| `project-audit` | what is actually true of this project right now | the question is the whole project, not one change | task-pipeline |
| `make-skill` | how the skill itself is built | a skill or plugin changes shape | make-skill |
| `agent-sync` | who is holding this file | the project has coordination on | agent-sync |

Three of them need no skill behind them. `seo-llmo`, `evidence-docs` and
`fabric` are rules, not tools, so they hold whether or not anything is
installed. `fabric`'s condition is the machine instead of a member: the block
carries it, and the hook names its route, only where Fabric's services
directory exists (`$FABRIC_SERVICES_DIR`, else the per-OS default; `lib/machine.js`).
A machine without Fabric gets no `fabric` rule, and a block that already has one
loses it, row included, on the next `update`. The Fabric skills it points at come
from a plugin outside this family.

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

**Text you put inside the block is kept, not refreshed away.** Each write records
a hash of every section and of the map, protocol and table regions it wrote, in
`~/.sshlg-skills/routers-rendered.json`. A later refresh that finds a section or
region matching neither that record nor the new text, and that would drop a
non-blank line, leaves it as it stands and names `file:line` in the preview and
the run. A kept **section** becomes your authored text for that router, so
`routers --diff <name>` and `--adopt <name>` apply to it. A kept **region** is a
refused refresh: the run exits 1 until you move those lines outside the block.
Without a record (a block an older release wrote), any section or region that
would lose a line is kept the same way, so an older packaged wording can stay
until you adopt the current one. `npx sshlg-skills blocks` reports such text as
`FOREIGN_TEXT_INSIDE` with its line range, without printing it.

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

### Continue work while dependencies wait

The wait rule is separate from routers and is off by default. Record the choice,
preview the selected host, then apply it:

```bash
npx sshlg-skills config set rules.wait on
npx sshlg-skills rules --agent codex
npx sshlg-skills rules --apply --agent codex
```

Supported destinations are existing Claude Code, Codex, Gemini, Pi and Cursor
instruction roots. Use `--claude-only` for Claude Code; `--agent` selects other
hosts. A later `update` refreshes only profiles with a prior ownership receipt.
It does not extend the rule to a host added later: with `rules.wait` on, `update`
names each such host's instruction file and the command that applies it there
(`npx sshlg-skills rules --apply --agent pi`; `--claude-only` for Claude Code).
That stays a named gap rather than an automatic write because consent to the rule
is recorded per host, and an update never creates it for a new one.
Set `rules.wait off` and apply the same scope to remove its owned text. Surrounding
content is preserved; malformed, edited or retargeted state stops for recovery.
Text placed inside an applied block refuses that block on that host only:
`install`, `update` and `uninstall` name `file:line` and the remedy (move the text
outside the markers), run every other step and exit 1. An explicit `rules --apply`
still refuses as a whole and writes nothing.
The rule describes continuation and durable handoff. It creates no watcher or job,
and sign-ins, consent, payment and action-specific authority keep their own gates.

### The star line is opt-in

The routing block's request for a star on this repository is off by default
(operator, 2026-10-22). Turn it on, then let the next refresh write it:

```bash
npx sshlg-skills config set rules.star on
npx sshlg-skills update
```

`rules.star off` (or absence) removes it on the next refresh. A block written by an
older release, star included, is the pack's own text and is refreshed, not kept as a
hand edit.

### Inspect an interrupted wait-rule change

A backup referenced by an unfinished wait-rule operation stays protected from
routine pruning. Inspect the local recovery record, then use the operation ID
shown by the command to preview finalization:

```bash
npx sshlg-skills rules recovery inspect --json
npx sshlg-skills rules recovery finalize --operation <id> --json
```

If the preview says `canFinalize: true`, add `--apply` to the second command to
complete the eligible ownership record and release that operation's backup
retention. The copy then becomes eligible for normal pruning; finalization does
not delete it immediately. Unresolved evidence or a held lock stops finalization.

Recovery changes metadata only. It never restores or rewrites host instructions,
clears locks, or recovers other settings writers. A `complete` record describes
that operation's recorded outcome; it does not certify the host's current settings.

### Routes you declare — skills outside the family

The family cannot know what your machine uses for media, data or anything else it
does not ship, and a published package naming one would ship a fact about one
laptop as doctrine. So you declare the route, and it lives only in your settings:

```bash
npx sshlg-skills config set routes.external.example-media.triggers "promo video, ad video, icon, voice-over, ролик, иконка"
npx sshlg-skills config set routes.external.example-media.skill example-media   # defaults to the name
npx sshlg-skills config                                                          # lists what you declared
npx sshlg-skills config set routes.external.example-media off                   # forget it
```

From the next prompt the hook prints the route when its words appear — once per
session, like a family route (`clear` and `compact` re-arm it) — the
`PreToolUse` escalation can name it, `conflicts` lists foreign skills that land on
its ground, and `toolkit --for` puts its skill first. A declaration that could
never work — a family router's name, a trigger inside a refusal phrase, a question
phrase — is refused with the reason, and nothing is written; the hook itself drops
an unusable entry silently, because it must never cost you a turn.

### Hiding the marked packs on every host — `visibility`

**This is the host-wide fallback for sessions Fabric does not start.** Fabric's RM-23 is
open on Fabric's roadmap; it is to read the same machine file and own
visibility in the sessions it starts, writing nothing to host settings. Until it ships,
nothing in Fabric reads the marks; `visibility` writes each host's own setting.

**The marks are the operator's and live on the machine**, in
`~/.sshlg-skills/pack-marks.json` (schema `pack-marks/1`: one row per pack with `hidden`,
`host`, `audience`, `markedBy`, `markedAt` and `reason`). This public package ships no
marks, only [`pack-marks.example.json`](pack-marks.example.json): shipping one operator's
marks as defaults would hide them for everyone who ran `--apply`. With no machine file,
no pack is hidden by mark. Write it from the installed packs (preview first, backup
before the write):

```bash
npx sshlg-skills visibility marks --init --show anthropics/skills,vercel-labs/agent-skills   # preview
npx sshlg-skills visibility marks --init --show anthropics/skills,vercel-labs/agent-skills --apply
npx sshlg-skills visibility marks              # what this machine's file says
```

`--init` lists the family packs (`ssheleg/*`, never hidden) and the `--show` packs and
hides every other installed pack; an existing file is replaced only with `--replace`.

**Which switch each host gets, and what decides it:**

- **Claude Code and Codex** hide every skill outside the usage core, as since v1.55.0,
  with one exception on Claude Code: `skillOverrides` does not apply to plugin skills,
  so a plugin's skills stay listed (switch a foreign plugin off with `enabledPlugins`).
  The pack marks and the overrides below do not change them; `--keep <skill>` keeps a
  skill listed there.
- **Gemini, Pi, OpenCode and Hermes** hide the skills of marked packs, except the usage
  core. Strongest first: a family pack is never hidden; the usage core is never hidden
  (family skills, skills used in the last 60 days by Claude Code usage, skills
  `~/.claude/CLAUDE.md` names in backticks, `--keep`); `visibility.showPacks` in
  `~/.sshlg-skills/config.json`; `visibility.hidePacks`; the machine mark; an unmarked
  pack stays listed.
- **Cursor and Kimi** cannot hide, and `visibility` says so.

```bash
npx sshlg-skills config set visibility.pack.anthropics/financial-services show   # or hide, or default
npx sshlg-skills visibility            # preview: per-host counts, nothing written
npx sshlg-skills visibility --apply    # write each host's own switch, backups first; records consent
npx sshlg-skills visibility --revert   # remove exactly what --apply wrote; withdraws consent
```

| Host | The switch `visibility` writes | Source | A hidden skill can still |
|---|---|---|---|
| Claude Code | `skillOverrides: "user-invocable-only"` in `~/.claude/settings.json`; plugin skills are out of its reach | since v1.55.0; Claude Code settings reference: overrides do not apply to plugin skills | be run from the `/` menu by a person |
| Codex | `enabled = false` entries in `~/.codex/config.toml` `[skills] config` | since v1.55.0 | be read from its SKILL.md path when asked |
| Gemini CLI 0.63.0 | `skills.disabled` in `~/.gemini/settings.json`, the list `gemini skills disable <name> --scope user` writes; read back with `gemini skills list` (`[Disabled]`) | `packages/cli/src/utils/skillSettings.ts`; `SkillManager.getSkills()` drops disabled skills | come back with `gemini skills enable <name>` |
| Pi 1.1.0 | `-<path>` exact exclusions in the `skills` array of `~/.pi/agent/settings.json`, one per folder holding the skill (`~/.agents/skills`, `~/.pi/agent/skills`); the file is created if absent and removed again by `--revert` | Pi's own docs, settings → Resources; `isEnabledByOverrides` in its `dist/core/package-manager.js` | be loaded for one session with `pi --skill <path>` |
| Hermes 0.21.4 | `skills.disabled` in its config.yaml, written by its own CLI (`hermes config set skills.disabled '<json list>'`, read back with `hermes config get --json`); `hermes skills list` shows `disabled`. A config.yaml Hermes created during the write keeps `{}` after `--revert` unsets the key | `hermes_cli/skills_config.py`; `tools/skills_tool.py` `_find_all_skills` | come back through `hermes skills config` |
| OpenCode 1.18.10 | `permission.skill.<name> = "deny"` in `~/.config/opencode/opencode.json`; a denied skill leaves the listing and its call is refused; read back with `opencode debug config`. An `opencode.jsonc` is refused | opencode.ai/docs/skills; `Skill.available` filters by the `skill` permission | be read as a plain file |
| Cursor agent CLI 2026.09.02 | **cannot hide on cursor**: no setting switches a skill off. The only model-side filter is the skill's own `disable-model-invocation` front matter, and editing a third-party SKILL.md is ruled out | the bundled `index.js` (`filterModelDisabledSkills`, `disable-model-invocation`) | (not hidden) |
| Kimi 2.1.1 | **cannot hide on kimi**: `[[permission.rules]] decision = "deny"`, `pattern = "Skill(<name>)"` in `~/.kimi-code/config.toml` refuses the call, but the listing keeps the skill, so it is not applied as hiding | the `kimi` 2.1.1 bundle (`features/skill/catalog` filters built-in skills only) | (not hidden) |

Visibility follows the active host directories, including `CLAUDE_CONFIG_DIR`,
`CODEX_HOME` and `GEMINI_CLI_HOME` (Gemini's HOME replacement: its files sit under
`$GEMINI_CLI_HOME/.gemini`). New ownership records bind to the canonical settings
files; changing a profile or retargeting its symlink refuses apply/revert until the original target is
restored. Malformed or unreadable policy and incomplete skill inventories refuse apply
before writing an ownership journal. Revert can still restore owned settings without a
working discovery inventory. Legacy records without file bindings are accepted only
where the earlier writer's default Claude/Codex paths establish ownership; ambiguous
non-Claude/Codex records are refused rather than applied to a guessed profile.

Every write to an operator file goes through a backup first (`protect()`: 0600 copies in a
0700 directory, because host settings can hold keys) or through the host's own CLI.
Nothing deletes, moves or edits a skill file. The launcher records in
`~/.sshlg-skills/visibility.json` what it added, never an entry the operator already had,
and the containers it created. `--revert` removes only that, so an empty list or map the
operator already had stays. A settings file in a form the host does not write (comments,
another indentation), a missing host CLI or an `opencode.jsonc` makes that host
**degraded**: it is named and skipped, and the run still succeeds. A host with nothing to
hide is not touched at all. Three `--apply` runs leave identical bytes
(`test/visibility_hosts_e2e_test.js`). On Pi, one hidden skill can take two entries (its
`~/.agents/skills` folder and a legacy `~/.pi/agent/skills` link, B-148), so the entry
count can exceed the skill count.

**`update` re-applies only with consent.** `--apply` records `applied: true` and the hosts
it covered; `update`, including the unattended idle run, re-applies only then, only on
those hosts and only within its own scope (`--claude-only`, `--no-claude`, and
`--agent <id>` with the skills-CLI ids `gemini-cli`, `pi`, `opencode`, `hermes-agent`).
`--revert` withdraws consent. A record from before consent was recorded (1.55.x) is
never extended: `update` prints one line asking for one `visibility --apply [--keep …]`.
`uninstall` leaves visibility in place, names what it still holds and gives the
`--revert` command.


### Making it engage by itself — hooks

The routing block loads in every session and is still routed around, because
prose in a long file loses to whatever spoke last. Hooks are what speak first —
and, since v0.42.0, what **holds**.

The hub wires hooks into one target: Claude Code's `~/.claude/settings.json`. Two
other hosts can import them from that file: Cursor (its third-party hooks import,
on by default) and the Continue CLI. Neither is tested here, so the family claims
nothing about how its hooks behave there:

```bash
npx sshlg-skills hooks                    # what would be wired, and what holds it now
npx sshlg-skills hooks install            # wire it (refuses to take someone else's status line)
npx sshlg-skills hooks install --force    # take it anyway, parking what it displaced
npx sshlg-skills hooks remove             # unwire, and give the displaced one back
npx sshlg-skills hooks recovery inspect --json                 # after a hard stop: is the runtime writer provably dead?
npx sshlg-skills hooks recovery recover --expect <digest> --json  # retire only that dead lock, then roll back
# `npx sshlg-skills update` re-wires a machine that already has one of these entries (since v1.56.0), through the
# same backup; with none it writes nothing. It refreshes only entries of ours that are present (one you removed stays
# removed; a NEW event a later release adds arrives only through `hooks install`, and `update` names it), and leaves a
# status line someone else holds alone without blocking the rest. Every path — `hooks`, `hooks install`, `update`
# and the ConfigChange notice — judges an entry by the fields this pack writes, so fields you added to our entries
# (a `timeout`, a `padding`) are kept and never called stale. `hooks` prints why each entry differs (matcher |
# command | the field | order) and lists an absent one apart, as "не подключено здесь", with `hooks install`.
# `update` also takes ~/.sshlg-skills/update.lock: a second one exits 75 naming the holder (docs/working-rules/state-json.md).
# When `update` lists an event as not wired here, keep in mind that `hooks install` re-adds every removed family entry.
npx sshlg-skills injectors                # who else speaks at SessionStart, and which MCP server instructions claim ground
npx sshlg-skills conflicts                # installed skills that land on a router's ground
npx sshlg-skills toolkit                  # every skill this machine can reach, as an index
npx sshlg-skills toolkit --for "<task>"   # ...narrowed to one task, as a shortlist
npx sshlg-skills toolkit --find "pdf, xlsx, отчёт"  # by the concepts YOU read from the task; hidden skills included, with SKILL.md paths
npx sshlg-skills toolkit --find "skill audit" --copies # include alternate paths with identical entry text
npx sshlg-skills visibility               # Claude/Codex: hide all outside the core; Gemini/Pi/OpenCode/Hermes: hide marked packs; Cursor/Kimi: cannot hide
npx sshlg-skills domains                  # scope xr-dev, web3d-dev, telegram-dev; preserve hook-bearing members; --apply, --revert
npx sshlg-skills pack design              # design/front-end/mobile: present, missing, and the install line
npx sshlg-skills pack design --check      # do the declared addresses still resolve?
npx sshlg-skills humanizers               # anti-AI-writing skills here, with the caveat that binds them
```

| Hook | What it does | What it costs |
|---|---|---|
| `SessionStart` | one note saying the block is not advisory; the session's title and the ledger to watch; **and, since v0.48.0, one line naming any other enabled plugin that also injects here** — silent when there is none, and since v1.56.0 printed only when that set differs from the one recorded in `state.json` — a machine-wide record, so a second session with the same set is not told again | ~90 tokens per session |
| `UserPromptSubmit` | names the route this prompt asks for — **once per route per session** since v1.56.0 (a route already named is not repeated; `clear` and `compact` reset the record, `resume` keeps it, a fork is a new session id and starts without one; a payload with no session id keeps no turn record at all — its note always prints and it is never escalated). One exception: a facet route printed for the first time on a prompt that writes brings the `task-pipeline` line with it, even when delivery was named earlier | nothing on the turns that don't need it |
| `PreToolUse` | **copies before any write** to `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.pi/agent/AGENTS.md`, `~/.cursor/rules/sshlg-routing.mdc` and `~/.claude/settings.json` — and **refuses the write** if the copy cannot be taken. Also refuses a bare `npx skills update <member>`, a gate piped into a filter and chained into `git`, and a host self-update (`pi update`, `brew upgrade codex`, `npm i -g @openai/codex`) inside `$(…)` or backticks, even in double quotes or nested, with the remedy (single quotes, escaped backticks or a file); single-quoted text runs nothing and passes | nothing until one of those files is touched |
| `PostToolUse` | on `Bash`, `Read` and `Grep`: names a credential the tool printed — a vendor-shaped key, or a generated-looking value under a label that names one (`x-api-key: …`, `FOO_API_KEY=…`, `Authorization: Bearer …`, `.netrc`, a URL's `user:password@`) — by its label, the tool and the file or program, **never the value**, with the rotation remedy; hashes, ids and fingerprints under neutral names, placeholders, paths and code stay silent. After any skills-CLI run, names the plain copies shadowing a plugin; after `obsidian-wiki setup`, puts back the config keys it truncates | one scan of the output (each field whole up to 1 MiB, else its first 768 KiB and last 256 KiB; it says when a scan was partial), silent when it finds nothing; a local proxy's token (an active loopback `*_BASE_URL` of the same prefix, in the same file, with no other) is not reported; MCP results are not read |
| `Notification` | a desktop ping when a long run goes idle or a background agent finishes | nothing — it emits a terminal sequence |
| `ConfigChange` | notices when something else rewrites these entries (a field this pack writes changed; a field you added is not a change, and an entry that is gone looks like one you removed, so `hooks` lists it on demand instead) | nothing — it records; `SessionStart` reports |
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
- **A refusal phrase silences this escalation for the whole session**, not the turn.
  Someone who said «без пайплайна» has decided. It does not silence the prompt hook's
  note, which prints once per route per context anyway.

**A hook cannot make a model invoke a skill.** It can refuse the un-routed path
and name the route; that is the whole of it, and claiming more would be the false
guarantee `task-pipeline`'s own hook doctrine warns about.

**It names the chain, not only the facets.** When a route that says what a change
contains (`super-ux`, `sheleg-design`, `copywriting`, `sheleg-dev`, `agent-stack`,
`telegram-dev`, `xr-dev`, `web3d-dev`) matched and the prompt writes, the
`task-pipeline` line is printed beside it — «сделай редизайн лендинга» names the
visual layer *and* delivery, and does so even when an earlier prompt in the session
already named delivery (the once-per-session rule does not split the pair). A question, an explanation or an audit does not write,
and gets the facet alone. Words are matched in the forms people type: inflected
(«телеграм-бота»), with a Latin brand inside Russian («Telegram-бота»), and a few
nouns that mean a request only behind a verb («сделай дашборд», «исправь баг») route
only there. `test/hook_routing_eval_test.js` holds twelve real tasks, their English
variants and the silent controls to an exact route set.

**The prompt hook is deliberately quiet.** A question beats any trigger — with one
derived exception: a trigger that is *itself* phrased as a question wins, because
`seo-aeo-audit` advertises «почему упал трафик» and the generic filter was
silencing it on the words it owns. Any refusal phrase drops every note on that
prompt, not only its own route's; later prompts still get the notes not yet given.
A prompt with no signal costs nothing.
Every word it fires on must already appear in the target skill's own
`description`; a fixture reads the shipped descriptions and fails on any trigger
the skill does not itself advertise, so this cannot become a second routing
policy that drifts from the skills it routes to. A word a member is still being
asked to advertise is declared in `PENDING` in `lib/triggers.js`, with the member
change it waits on — and fails as stale the moment the member ships it.

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

These hook adapters are installed through the Claude Code channel. Other hosts
may support hooks, but need separately verified adapters; without one, these
rules remain a self-check. Working with a different agent, or want
them off? Delete the file — nothing else reads it.

## With Fabric and Observatory

The family works on its own; on a machine that also runs PassionCode's agent network it
connects to it at four points, each with its own owner:

- **The `fabric` router** (written only where Fabric is installed — its services directory
  exists) sends questions about this machine's agent services to the Fabric tooling and to
  the `fabric-agent-adapter` skills that build and adapt Fabric agents and services.
- **agent-stack's `agent-interop`** carries the delegation doctrine — trust by machine
  (T0 this machine, T1 an enrolled one, T2 everyone else), Fabric jobs
  (`fabric.job.get` / `cancel`) and the `degraded` envelope — pinned to the
  fabric-agent-contract commit it was read against.
- **agent-sync** maps its operations onto Fabric's coordination contract
  (`references/fabric-coordination.md`), and reads its Notion token from the Observatory
  vault first.
- **task-pipeline** writes workflow memory and planned handoffs through Observatory
  (`stage_checkpoint.py`), and its waves mode reads the task sources a repository
  declares (its own `backlog-sources.json`, checked by `skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/scripts/backlog_sources.py`).

Credentials go through Project Observatory (`observatory_credentials`, `use_secret.py run
--vault-only`); the family's secret guard names an Observatory-free route in every refusal
as well. Observatory: <https://github.com/passioncode-ai/project-observatory-dashboard>.

### What every agent loads — `context`

```bash
npx sshlg-skills context          # per host: bytes, ~tokens, lines, hub-managed vs other text, caps
npx sshlg-skills context --json
```

Read-only. Exits 1 when a host file is over a documented cap (Codex stops adding instruction
files at `project_doc_max_bytes`, 32 KiB by default) and notes a `CLAUDE.md` above Claude Code's
200-line target. The rules behind it: [context economy](docs/working-rules/context-economy.md).

## Other commands

```bash
npx sshlg-skills list        # the family, versions and descriptions
npx sshlg-skills agents      # supported agent ids
npx sshlg-skills conflicts   # installed skills that land on ground a router owns
npx sshlg-skills toolkit     # every skill this machine can reach — the family is a fraction of it
npx sshlg-skills pack        # curated recommendations, measured against this machine
npx sshlg-skills humanizers  # anti-AI-writing skills this machine can reach — and the
                             # false-positive caveat that prints whether or not one is installed
npx sshlg-skills signature --used "<skill>=<what it did>,…"
                             # a report's one-line header and short footer — every
                             # address looked up from the manifest, never typed
npx sshlg-skills enroll      # this repository's routes, written into its own CLAUDE.md
```

`pack` is the one command here that can answer about **absence**. `toolkit`
enumerates what is installed and ranks it by term overlap; by construction it
cannot name a skill that is not here, and that is the whole question when
somebody hands you a list of skills to install. A pack declares the entries,
measures which are already present with the same walk `toolkit` and `conflicts`
use, and prints the exact install command for the rest — cut into **lanes**, so
that choosing a visual direction, animating a hero, re-theming a dashboard and
auditing contrast are four questions with four owners rather than one list. Five
of the `design` pack's seventeen lanes have no owner in this family, and
**accessibility is one of them**; the pack is where that is stated rather than
implied, with a default for each (`a11y-debugging` for accessibility) and a phrase
for declining it out loud. Checking it in a browser is two lanes, not one:
`verify` asks whether it works, `visual-qa` what it looks like across states,
viewports, themes, text sizes and locales — and `references` (the sweep of shipped
products) and `critique` (what is wrong with a render) sit with `sheleg-design`.

It **prints and never installs**: `settings.json` and `known_marketplaces.json`
belong to the operator, which is the refusal `lib/updatemodel.js` already records.
Popularity is deliberately not a field — the first pack was built by measuring two
published listicles, and between them they carried three moved addresses, five
wrong star counts and one install command that does not exist (`claude plugin add`
→ `error: unknown command 'add'`), plus one that copies a marketplace straight into
`~/.claude/skills` and shadows a plugin for ever. Both of those shapes are refused
by `assertPack()` rather than by review, and `--check` resolves every declared
address at the moment it is read.

`conflicts` is the machine-specific half of the map's arbitration rule. The rule
ships — *the router decides the route, a competing skill is never a second entry
point* — but **which** packs collide is a fact about one laptop, so it is read here
instead of written into everyone's block. It reports candidates, not offenders:
most of what it finds answers HOW where a router answers WHEN, and a router
reaching for one as a tool is the system working.

### Enroll a project

```bash
npx sshlg-skills enroll --dry-run          # what it would write, removals included
npx sshlg-skills enroll                    # write it
npx sshlg-skills enroll --root <dir> --surface internal --json
```

The global routing block says what each router owns in general; `enroll` says which
routers apply to one repository. It reads the files Git lists (tracked, plus untracked
files that are not ignored) and classes the surface: `public-web` when it finds a web
framework dependency (next, astro, nuxt, Remix, SvelteKit, gatsby, Eleventy, or vite
with an `index.html`), a Hugo or Jekyll config, `public/index.html`, a `robots.txt` or a
sitemap; `app-text` for store metadata, a Telegram bot or Mini App dependency, a mobile
project or a string catalogue; otherwise `internal`. Three, Telegram, payment, pixel,
Sentry, Google sign-in and XR dependencies add `web3d-dev`, `telegram-dev`, `sheleg-dev`
and `xr-dev`. `--surface` overrides the class and the output says it is an override.

Each route carries its setup state, read from the tree, and the command that seeds what
is missing: the brand pack (`<project>/docs/brand/{voice,terminology,facts}.md`,
`/brand-init`), scenarios with their linter (`<project>/docs/ux/{scenarios.md,lint.py}`,
`/ux-init`), a DOCMAP (`/task-pipeline setup`), an SEO brief or audit
(`/seo-aeo-audit brief`). It writes two things and only two:

- one `SSHLG:PROJECT` block in the project's `CLAUDE.md` and `AGENTS.md` where each
  exists (with neither, a new `CLAUDE.md` holding only the block), listing the routes,
  the surface and its signals, and the setup still owed;
- `.claude/routers.json` entries for routers whose material already exists, so
  `npx sshlg-skills materialised` reports them true. Existing entries and keys are kept
  in their order; an entry `enroll` did not add is never rewritten.

Every byte outside the block is preserved and each file is copied to
`~/.sshlg-skills/backups/` before the write. A malformed file, an
`SSHLG:PROJECT:OPTOUT` line, a symlinked instruction file or a root outside a Git work
tree is refused with its reason and nothing is written. A second run over the same tree
prints `enroll: unchanged`. Exit codes: 0 written or unchanged, 1 refused, 2 usage.

## How it works

A thin, zero-dependency Node launcher over the three mechanisms that already
reach these agents — the `skills` CLI (79 agent IDs; 77 global targets), `claude plugin` (Claude
Code), and `git submodule` (pinned snapshots). It invents no new install path. It
curates the family, drives those three, and encodes the rules that are easy to
get wrong: one channel per agent, exact agent ids, repeated `--agent` flags, full
`<name>@<name>` plugin ids, and pruning shadow copies.

```
skills.json                  registry — repos, plugin ids, skill names, pins
skills/*                     the eleven skill packs as pinned git submodules
bin/sshlg-skills.js          the launcher (install / update / routers / config / hooks /
                             injectors / conflicts / list / agents)
lib/routers-registry.js      the fifteen routers — text, table row and required members, in one entry
lib/routers.js               block parsing and rendering; touches no file, by construction
lib/drift.js                 your wording vs the packaged one; pure, like routers.js
lib/plan.js                  shared skills-CLI argv and Continue copy grouping
lib/installer-pins.js        production immutable member admission and pinned add plan
lib/codexplugins.js          native Codex catalog inspection and unsafe transition deferral
lib/inventory.js             the family's map — entry points, not a catalogue
lib/conflicts.js             installed skills on a router's ground — candidates, not offenders
lib/packs.js                 curated recommendations by lane — what is missing, and the exact command
lib/cursor.js                Cursor's channel, which is one file per rule rather than a block
lib/apply.js                 the only module that writes to the instruction files
lib/enroll.js                a project's routes: detection and the SSHLG:PROJECT plan; pure
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

### The site

```bash
node scripts/site.js --out _site
```

One page per member plus the routing page, built from
[`skills.json`](skills.json) and [`lib/routers-registry.js`](lib/routers-registry.js) —
the same two files the launcher and the operator's routing block are generated from. The
site restates nothing: a version, an install identifier or a routing rule on a published
page is read at build time, so it cannot drift from the manifest.

**The built site is never committed.**
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) gates on the whole
`validate` suite through `workflow_call`, then builds and deploys — a generated page in
git drifts from the data it claims to render, and a page built from the tree cannot.
[`test/site_test.js`](test/site_test.js) is the half that runs here: it builds into a
temp directory and fails when a stated version is not the pinned one, when an internal
address does not resolve, when a page hands the reader a launcher command
`bin/sshlg-skills.js` does not dispatch, or when anything on the page would be fetched
from another host.

Releases are tag-driven: bump `skills.json`, `package.json` and the top
`CHANGELOG.md` entry together, tag `vX.Y.Z`, and the release workflow cuts the
GitHub release from the matching changelog section.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). To report a
vulnerability, see [SECURITY.md](SECURITY.md).

### Inspect instruction blocks

`npx sshlg-skills blocks --agent codex --json` reads marker metadata from the
selected global instruction file. Supported hosts are `claude`, `codex`, `gemini`,
`pi` and `cursor`; without a host it inspects six named files. Existing profile
overrides are honored. Missing files remain absent. Unreadable, malformed, oversized
or concurrently changed files make the result partial and exit1. No file, backup,
policy or journal is written, and a marker never grants write permission.

For an explicit local comparison, run
`npx sshlg-skills blocks diff SSHLG:ROUTERS --from ./proposed-block.md --agent codex`.
The source must contain one complete matching outer block. Output contains only
the selected block's before/after text, so treat that output as local material.
The command does not apply the diff. Unknown/foreign blocks remain inspectable;
`SSHLG:REPOSITORY-HANDOFF` is retired (1.70.1): keep its rule in your own block.

### Write another tool's block (managed-blocks/1)

A tool that keeps its own block in a host instruction file — Observatory's
`OBSERVATORY:AGENT-UPDATES`, for one — can let the hub write it:

```bash
npx sshlg-skills blocks install OBSERVATORY:AGENT-UPDATES --owner OBSERVATORY --agent claude --from ./block.md
npx sshlg-skills blocks install OBSERVATORY:AGENT-UPDATES --owner OBSERVATORY --agent claude --from ./block.md --apply
npx sshlg-skills blocks uninstall OBSERVATORY:AGENT-UPDATES --owner OBSERVATORY --agent claude --apply
# one source, every installed host; the preview is the drift report
npx sshlg-skills blocks install OPERATOR:GLOBAL-RULES --owner OPERATOR --agent all --from ./rules.md
```

Without `--apply` it previews and writes nothing. With it, the file is copied to
`~/.sshlg-skills/backups/` first, only the named block changes, and each step is
recorded in `~/.sshlg-skills/managed-blocks/journal.jsonl`. It writes `claude`,
`codex`, `gemini` and `pi` files, never installs a host, and refuses the hub's own
blocks (they have their own writers), any write of the retired
`SSHLG:REPOSITORY-HANDOFF` (`blocks uninstall ... --owner SSHLG` removes an old copy)
and any block whose owner prefix differs from `--owner`. An interrupted write is
classified with `npx sshlg-skills blocks resolve <operation-id>`. The convention:
[docs/working-rules/managed-blocks.md](docs/working-rules/managed-blocks.md).

## Author

Built by ssheleg — [sshlg.me](https://sshlg.me)

- X / Twitter — [@sshlg93](https://x.com/sshlg93) ·
  [follow in one click](https://x.com/intent/follow?screen_name=sshlg93)
- Telegram — [@sshlg](https://t.me/sshlg)

## License

MIT © 2026 ssheleg.
