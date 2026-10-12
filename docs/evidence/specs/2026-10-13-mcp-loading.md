# Decision input — an MCP on/off system: load only what a session needs (2026-10-13, reviewed by owners)

Asked by the operator: "think through a system so we do not load MCP servers a session does not
need — for example an on/off switch at Observatory's level." This is a design for review by the
owners (Observatory, Fabric, Fabric Dashboards), not a build.

## The problem, measured

- Claude Code starts **every user-scope MCP server in every session** (23 on this machine). An
  `http` server costs a connection and its tool names in the deferred-tool list; a `stdio`
  server costs a process per session (one server: ~14 processes × 32–56 MB).
- Usage over 60 days is narrow: 5 servers are used in ≥ 15 projects, ~10 in 1–3 projects, 4 never.
- A server that refuses at session start leaves the session without its tools for good (hub
  1.61.0 `hosts` now names them; B-177). A server that is never needed still costs startup.
- The same configuration is written by several tools (AGENTS.md instructions, the passioncode
  launcher, Fabric Dashboards repointing its own entry, people). Nothing records why a server
  is where it is.

## Constraints (records)

- Fabric LC-19: an MCP server is declared at project scope; a stateless tool runs once as a
  shared local service under the lifecycle broker. `fabric-mcp` at user scope is the one
  recorded exception.
- The operator's routes that are machine-wide by instruction must stay reachable everywhere:
  media (Asset Foundry), credentials (Observatory), app lifecycle (local-lifecycle), release
  approvals (personal-communicator), Fabric services (fabric-dashboards).
- No tool may print or copy a server's header values or tokens (B-172 class).
- Each host has its own configuration format and scopes (Claude user/project/local; Codex
  `config.toml`; Gemini, Cursor, OpenCode, Kimi, Pi each their own).

## Options

**A. Profiles, materialized.** One declared record — *which servers a project needs* — and
a materializer that writes each host's project/local scope from it, keeping user scope to the
machine-wide minimum. A switch is an edit to the profile (`on`, `off`, `on-demand`), applied by
the materializer with a backup. Cheap, works today, saves process starts and tool names.
Weakness: a server is either started or absent for a whole session.

**B. One lazy MCP broker.** Each session connects to ONE local MCP endpoint. It exposes a small
fixed surface (search tools, describe a tool, call a tool) and starts an upstream server only
on the first call, stopping it when idle. Strongest saving (nothing starts until used; near-zero
context), and a refused upstream is retried at call time instead of lost for the session.
Weakness: a new always-on component; tool schemas reach the model through a meta-tool, not
natively; per-host behaviour must be tested. LC-19's shared local service is this shape for
one server; FD-61 needs a decision on who serves it (the lifecycle broker, or an ADR).

**C. Both, staged (recommended).** A now: the profile is the single record of *what is
allowed where*; the switch lives with the owner of machine inventory. B next, behind the
same profile: a server marked `on-demand` is served by the broker instead of started per
session. The profile stays the one place a person flips a switch.

## Where the switch lives (proposal)

- **Observatory** owns the switch and its record: it already reads every host's MCP
  configuration (`machine.mcp.inventory`/`refresh`), so it can show, per project, what is on,
  what is used (from transcripts) and what it costs, and offer on/off/on-demand. It writes
  nothing behind a host's back: it hands the change to the materializer.
- **The materializer** applies a profile to each host through that host's own API or with a
  backed-up edit (one writer per file; the family's `protect()` for operator files).
- **The lifecycle broker / Fabric** serves `on-demand` servers (B), per LC-19.
- **The family** reads the same profile: `npx sshlg-skills hosts` shows it, the agent-stack
  `agent-interop` doctrine teaches it, and nothing in the family writes MCP configuration.

## Owners' answers (2026-10-13)

- **Observatory takes the switch and the profile** as an engine capability, in its release
  iteration 2 (iteration 1 is mid-release). It files the row on its board citing this spec.
- **The profile is private machine data**, kept in Observatory's per-user workspace config
  (`<workspace>/config/mcp-profiles.json`: one record per project path, plus a `machine`
  profile for the user-scope minimum) — never in a public repository and never in a
  project's checked-in `.mcp.json`, which other contributors share.
- **Observatory materializes through each host's own writer** (Claude `claude mcp add/remove
  -s local|user`; Codex `codex mcp add/remove`; a guarded edit only where a host has no CLI —
  Claude Code rewrites `~/.claude.json` constantly, so a read-modify-write there loses
  updates). Every apply records a before/after manifest; `profile.set --undo` restores it.
  The family writes no MCP configuration; it may call `observatory mcp profile apply`.
- **Fabric** (fabric-workspace): the lifecycle broker belongs to the personal-OS session, not
  to Fabric; whether it serves on-demand MCP servers is its owner's answer. For skills, RM-23
  owns "which skills a session sees" for every session Fabric starts; the hub marks packs
  (metadata) for RM-23 to read, and its host-wide `visibility` is the labelled fallback for
  sessions Fabric does not start. The decision is Fabric's (asked).
- **Fabric Dashboards**: stays user scope until FD-61 makes it one shared local service.

## Rules the materializer keeps (from the review)

- **Secrets:** moving a server copies its definition; a definition whose env or headers carry
  a value is never copied — refused, naming the server, unless the server runs through a
  vault-backed wrapper (`use_secret.py run …`).
- **Running sessions keep their servers:** apply says "takes effect in new sessions" and lists
  the running sessions affected; it never restarts a session, a Fabric service or a gateway.
  Gateway-routed servers are out of scope (their configuration is generated).
- **Add before remove:** project/local entries are added and verified with
  `machine.mcp.refresh` before anything leaves user scope.
- **Zero calls is a candidate, not a removal:** the operator sees the proposed diff before
  the first apply; after that the recorded profile is the authority.
- **Usage evidence** is input to the profile, not the profile: until Observatory's inventory
  gains a per-project usage column, the 60-day measurement lives at a private local path
  (`~/.sshlg-skills/usage/`, mode 600), outside every repository.

## Open questions for the owners

1. ~~Observatory: the switch and the usage column~~ — answered above (iteration 2).
2. Personal-OS (lifecycle broker): does it serve on-demand MCP servers — stdio ones too, or
   only long-running HTTP ones — and with which interface? (asked)
3. ~~Who materializes, where the profile lives~~ — answered above.
4. Fabric: is RM-23 the one owner of a Fabric-started session's skills, with the hub's
   `visibility` the labelled fallback? (asked)
5. The operator: the machine-wide minimum — the first proposed diff is shown before any apply.
