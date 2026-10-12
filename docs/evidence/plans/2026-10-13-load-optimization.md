# Plan — load only what a session needs: skills and MCP servers (2026-10-13)

Run: `/task-pipeline` on the operator's request of 2026-10-13 — mark the packs, work out how
MCP servers load per project so only the needed ones load, keep skills optimised, call the
agents who worked on this and on pipelines/waves, check it all fits the skills, plan in
detail, execute. Lease for guarded files: `WAVES-1011`.

## Operator decisions (2026-10-13, one batch)

- **Packs (B-143): hide, do not delete.** The recommended set is hidden from every host's
  listing; nothing is removed from disk or from the skills lock.
- **MCP: design a system that does not load servers a session does not need** — for
  example an on/off switch at Observatory's level. Design first, then build with the owners.

## What was measured (aggregates; per-project data stays local, the repository is public)

| Measure | Value | How |
|---|---|---|
| Skills in the shared root `~/.agents/skills` | 531 (512 directories with a SKILL.md) | `~/.agents/.skill-lock.json`; `find` |
| Of them invoked in Claude Code, 60 days | 46 (25 family, 21 third-party) | `"name":"Skill"` tool calls in `~/.claude/projects/**/*.jsonl` |
| Description characters in that root | ~173,000 | front matter `description:` summed |
| Hosts that read the whole root | Codex, Gemini, Cursor, OpenCode, Pi, Kimi (Hermes via its own copies) | compatibility cut 2026-10-12 |
| Claude Code listing after `visibility` | 115 skills / 66,371 chars vs a 30,000 budget | B-145 |
| Hosts `visibility` can hide in | Claude (`skillOverrides`), Codex (`enabled = false`) | `lib/visibility.js` |
| MCP servers in Claude Code user scope (start in every session) | 23 | `~/.claude.json` `mcpServers` |
| Their 60-day use | 5 used in ≥ 15 projects; ~10 in 1–3 projects; 4 never | `mcp__<server>__` tool calls per project directory |
| stdio MCP processes | one per session per server (one server: ~14 processes × 32–56 MB) | fabric-dashboards session, FD-61 |

Twelve packs hold ~400 of the 531 skills and none of the 46 invoked ones except two from
`knowledge-work-plugins`. The marks are in [the pack triage](../../audit/2026-09-06-pack-triage.md).

## Records this plan builds on (owners answered on 2026-10-13)

- Fabric `knowledge/lifecycle.md` **LC-19** (fabric-workspace): an MCP server is declared at
  project scope; a tool without per-session state runs once as a shared local service under
  the lifecycle broker; `fabric-mcp` at user scope is the one recorded exception.
- Fabric **RM-23**: per-agent skill layers through `--plugin-dir` in Fabric's session bundle
  (measured 589 skills, ~63k tokens a session), writing nothing to `~/.claude`.
- Fabric Dashboards **FD-61**: its MCP becomes one shared local service (broker-served, or an
  ADR on the app's no-port rule); until then it stays user scope.
- Observatory: `machine.mcp.inventory` reports what is configured per host and scope (not
  per-project usage); the transcripts are the usage source.
- Fabric principles **§10** (a free agent takes the next task) and **§11** (a project moves in
  releases), which task-pipeline's `references/iteration.md` (#112) implements.

## Waves

### L1 — hide the marked packs on every host (hub; `visibility`)

1. **Marks as data.** Write the operator's 2026-10-13 marks into `docs/audit/2026-09-06-pack-triage.md`
   (a "Marks — 2026-10-13: hide" column) and into the launcher as a pack list, so `visibility`
   hides by pack as well as by usage. Family skills, `anthropics/skills` (documents),
   `heygen-com/hyperframes`, `emilkowalski/skills`, `vercel-labs/agent-skills`,
   `meta-quest/agentic-tools`, `stablyai/orca`, `kepano/obsidian-skills`, `anthropics/claude-code`,
   `conorbronsdon/avoid-ai-writing` and every skill invoked in 60 days stay listed.
2. **Each host's own switch, never a file deletion:** Gemini `gemini skills disable <name>`;
   Pi through its settings (resource filters) — never by editing a third-party SKILL.md;
   Hermes `skills config`/`opt-out`; OpenCode and Cursor/Kimi: research the switch — where
   none exists, report "cannot hide on <host>" rather than move files. Every write through
   `protect()` or the host's CLI, recorded in `visibility.json`, revertible (`--revert`).
3. **Readback per host:** listing size before/after (`gemini skills list`, Pi's loader,
   `codex` debug), recorded in a dated receipt. Re-applied by every `update`.

### L2 — the MCP switch: design, then build with the owners

Observatory took it as board row **PB-159** (passioncode-ai/org-index #69, `c28598b`; wave E, iteration 2), with the review's points (a)–(e) as acceptance.
Decision input: [specs/2026-10-13-mcp-loading.md](../specs/2026-10-13-mcp-loading.md). It is
sent to Observatory (switch and inventory owner), Fabric (LC-19, the broker) and Fabric
Dashboards (FD-61) for review; what each builds becomes a row on its own board, and the hub's
part (profiles read by `update`/`hosts`, the doctrine in agent-stack) becomes hub rows.

### L3 — pipelines and waves agree with the skills

1. task-pipeline: `references/waves.md` and `iteration.md` (#112) against Fabric principles
   §10/§11 — a wait is a watcher, never a stop; releases, the hotfix lane, lessons. Gaps
   become task-pipeline rows; B-179 (hub triggers for `iteration`) at the pin.
2. The lessons index `~/.sshlg-skills/lessons/` (task-pipeline) gets its hub row and its
   `state-json.md` entry when it ships.
3. The routing block's task-pipeline text names `waves` and, after #112, `iteration`.

### L4 — measure and hold

Per-host listing size and MCP processes per session, measured after L1/L2 and held by a
ratchet where the hub can compute it (`description-total` exists for family skills).

### L5 — family members by domain, per project (proposal; operator decision)

Measured 2026-10-13 (read-only): Claude Code's listing is ≈ 61,000 characters after
`visibility`; enabled plugins carry ≈ 44,700 of them, and family plugins ≈ 38,000 — the
largest share. Domain members are expensive and rarely used: `xr-dev` 6.2k characters (5 calls
in 60 days), `sheleg-dev` 6.4k (8), `telegram-dev` 2.8k (5), `web3d-dev` 2.7k (0). Proposal:
the core members stay machine-wide (`task-pipeline`, `agent-sync`, `make-skill`, `super-ux`,
`sheleg-design`, `seo-aeo-audit`, `agent-stack`); domain members (`xr-dev`, `web3d-dev`,
`telegram-dev`, `sheleg-dev`) are enabled per project — by the project's declared domain, or by
use — through the same per-project plugin scope used for figma/stripe/cloudflare (wave 1, W1-G).
Estimated listing ≈ 61k → ≈ 43k in a project outside those domains. In Fabric-started
sessions RM-23 does the same from `pack-marks.json`. Needs: the operator's decision; the routing
block keeps naming the domain routers (they say "if … is installed"); a `hosts`/`update` check
that a project which uses a domain has its member enabled.

**Decided 2026-10-13: "Yes, by domain".** Built as `npx sshlg-skills domains` (B-185, branch
`feat/domain-members`). It detects a project's members from what the repository declares,
plus 60-day usage. It writes the project entries before the user-scope removal and reads
each back, and it refuses a project whose git does not ignore the file. `update` and `hosts`
keep it current. The read-only preview on this machine found 62 of 188 repositories with
evidence: 71 project entries, 0 refused, 4 user-scope removals. `--apply` on the operator's
machine and the listing measurement (L4) are the remaining steps.

## Order

L1 and L3 run now (independent). L5 waits on the operator's decision. L2's design goes out for review now; its build waits on the
owners' answers and runs as their rows. L4 closes after L1.
