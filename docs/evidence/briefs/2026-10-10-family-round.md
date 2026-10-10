# Brief — family improvement round after 1.54.7 (2026-10-10)

Run: `task-pipeline`, lease `FAMILY-ROUND-1010`, base `6b3a9b8` (hub 1.54.7).
Operator request (verbatim intent): review what the 2026-10-09 round did, research,
find what is unfinished or broken, run one more improvement round, release every
skill and update the installation.

## Source ledger

| Source | Read | What it contributed |
|---|---|---|
| `docs/HANDOFF.md` | full | 1.54.7 delivered; next bounded task VISIBILITY-1; P2 lightweight tags |
| `docs/reports/2026-10-09-coding-agent-compatibility/README.md` | limits section | model runtime NOT_RUN; P2 names three lightweight tags |
| `docs/evidence/retro.md` | standing instructions in full | #4, #5, #8, #9, #10, #11 bind this run (zsh splitting, whole pin sweep, read output not exit, select run by tag, committed state, suspect the checker) |
| `docs/evidence/backlog.md` | open rows | 8 open of 142: B-29, B-78, B-84, B-94, B-108, B-109, B-143, B-144 |
| `docs/evidence/verification.md` | `never` count | 4 rows at `never` |
| `graphify-out/graph.json` | presence | stale: 2026-09-03 — refresh at stage 9 |
| wiki `projects/sshlg-skills/` | presence | exists; updated at stage 9 |
| `npm test` at `6b3a9b8` | run | 93 suites, 1136 fixtures, exit 0 |
| `python3 test/check_pins.py` | run | all 11 pins + hub on registry |
| host probe (scratch `hostprobe/results.json`) | run | Codex hides 220 skills incl. task-pipeline; OpenCode/Hermes/Kimi activate make-skill; Gemini not authenticated |
| host contract delta research (scratch) | run | `skills` 1.7.2 moves Codex/Pi global dirs; make-skill plugin reference lags 2.1.296 |
| Claude Code docs (skills, settings-reference) | fetched | listing budget 1% of context, `skillOverrides` on/name-only/user-invocable-only/off; plugin skills not covered |
| `claude -p --debug` | run | `Skill listing over budget: 634 skills, 274398 chars > 30000 budget` |
| member audit | run | see REQ-7 rows |

## Decisions (operator, this run)

- D1 — Visibility: a small CORE keeps full descriptions; everything else is hidden
  from the model listing and found by search. Claude: `skillOverrides`
  `user-invocable-only` (operator first chose `name-only`, then switched after the
  measurement that names alone cost ~13.6k of the 30k budget). Codex: `enabled = false`.
  Nothing is deleted; every write is backed up and reversible.
- D2 — The first step of every agent is: restate the meaning of the request → decide
  whether any skill applies → search the whole catalogue by concepts → open the
  matching SKILL.md → proceed. Only questions/explanations/one-line edits skip it.
- D3 — The search step ships in two places: the routing block's protocol section
  (always loaded wherever the hub writes the block) and a small `skill-search` skill
  for hosts that never receive the block.
- D4 (run, recorded) — `skill-search` is owned by `make-skill` (the member that already
  owns skill channels, shadowing and installation facts). The hub owns the command.

## REQ table (frozen; adding is free, removing needs the operator)

| REQ | Requirement | Verified by |
|---|---|---|
| REQ-1 | `sshlg-skills visibility` reports listing budget, catalogue size, core set and per-host plan; `--apply` writes Claude `skillOverrides` and Codex `skills.config` through `protect()` backups; `--revert` removes only entries the hub wrote | unit fixtures; 3-run hash idempotence on a temp HOME; real apply here; `claude -p --debug` warning shrinks |
| REQ-2 | `toolkit --find "<concepts>"` ranks by concepts (name weighted), covers hidden and `~/.agents/skills` entries, prints SKILL.md paths | fixtures incl. the measured `pdf/xlsx` miss |
| REQ-3 | Routing block protocol section states D2 and names `toolkit --find` | `router_texts_test.js`/compaction budget; `routers --update` 3-run idempotence on the operator file |
| REQ-4 | `make-skill` ships `skill-search` skill; hub inventory counts it | make-skill gate; hub `npm test`; `--house` audit |
| REQ-5 | «баг» in task-pipeline description; hub `PENDING` entry removed | triggers soundness fixture; route probe «почини баг» |
| REQ-6 | Every member release workflow refuses a lightweight tag | step present in 11 `release.yml`; planted lightweight tag refused locally |
| REQ-7 | Member audit defects (filled after the audit returns) | per row |
| REQ-8 | `skillsCli` pinned to `skills@1.7.2` with a verified snapshot | `node lib/host-targets.js --verify-source`; `host_targets_test.js` |
| REQ-9 | make-skill plugin reference current to Claude Code 2.1.296; `/skill-audit` with no argument says what it audits | make-skill gate; rendered command text |
| REQ-10 | #154 closed with evidence; PR #102 closed as superseded | `gh issue view`/`gh pr view` state |
| REQ-11 | Changed members released (annotated tags, registry read), hub re-pinned and released, `npx --yes sshlg-skills@latest update` run, installed bytes match | `check_pins.py`; registry; installed payload comparison |
| REQ-12 | Handoff, receipts, wiki, graph refreshed; `git submodule status` clean | files + push |

## Carry-over ledger

| Item | Home |
|---|---|
| Gemini CLI from deprecated Homebrew formula (disabled 2026-12-18), not authenticated | operator step — HANDOFF |
| OpenCode v2 / Hermes 0.21.6 rows for the compatibility matrix | next report cut |
| B-143 pack triage marks | operator, unchanged |
