# Decision input — an MCP on/off system: load only what a session needs (draft, 2026-10-13)

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

## Open questions for the owners

1. Observatory: is the switch a new capability of its engine (`machine.mcp.profile.set`), and
   does its inventory gain a per-project usage column?
2. Fabric: does the broker serve `on-demand` MCP servers (LC-19's shared service, FD-61), and
   with which interface?
3. Who materializes for each host, and in which file is the profile (one per machine, with
   per-project sections)?
4. What is the machine-wide minimum, and who decides a new server's default?
