# Brief — integration waves (2026-10-11)

Run: `/task-pipeline waves` · lease `WAVES-1011` · branch `waves/2026-10-11-integration`.
[Canvas](../specs/2026-10-11-integration-waves-canvas.md) ·
[inventory](../specs/2026-10-11-integration-waves-inventory.json) ·
[plan](../plans/2026-10-11-integration-waves.md).

## The request, in the operator's words (condensed, translated)

> Go through what we left unfinished or finished with errors. Check the documents and the
> board, update the plan and work it: research, look at the links to other agents, dig
> deeper where needed. Find the best shape of the system, solve every problem in front
> of us and make a step-by-step plan from the current system to the state where they are
> all solved. Decompose each step into tasks for developer agents that carry all the
> context. Close everything in one pass. Then run a verification wave over every task:
> documentation, business logic, implementation, links, the technical solution. Make the
> fixes into a plan and close it in the next wave. Repeat until the system is complete,
> with logs added, documentation updated, no bugs, usable by a person and by an agent.
> An independent verifier confirms that the work matches the goal, and the waves continue
> until it does. **Main emphasis: optimization, and the skills working well together with
> our Fabric, the Observatory and every available coding agent.**

## Source ledger

| Source | Read | Finding |
|---|---|---|
| Code (hub `bin/`, `lib/`, `hooks/`, `test/`) | wave-0 hub survey + direct reads of `lib/triggers.js`, `hooks/session-start.js`, `hooks/user-prompt-submit.js`, `lib/turnstate.js`, `lib/hooks.js`, `lib/secrets.js`, `bin/sshlg-skills.js:560-610` | root cause of the hook drift: `update` refreshes the runtime but never the `settings.json` wiring |
| Code graph | `graphify-out/graph.json` built at `96af3afb`, **86 commits behind** — ⚠ not trusted for reach until refreshed (wave 5) | — |
| `CLAUDE.md`, `docs/DOCMAP.md`, `docs/AGENT_SYNC.md` | read | guarded files need the lease; operator-file writes go through `protect()` |
| `docs/evidence/retro.md` | standing instructions read in full (live #1, #2, #4–#11) | #1 (assert input), #2 (three-run idempotence), #6 (structural plants), #8 (read output, not exit), #9 (verdict by identity) bind this run |
| Board `docs/evidence/backlog.md` | 151 rows: **11 open** (B-29, B-84, B-108, B-109, B-143–B-148, B-154), 135 closed, 3 waived | each verified against the code in raw/survey-hub.jsonl |
| Verification ledger `docs/evidence/verification.md` | **0** rows at `never` in the hub | task-pipeline 149, seo-aeo-audit 7, sheleg-design 4, make-skill 2 |
| Past briefs and plans | `briefs/2026-10-10-family-round.md`, `plans/2026-10-10-family-round.md`, `docs/HANDOFF.md` | HANDOFF names B-147 as the exact next task — kept as R27 |
| Members' registers (11 repos) | raw/survey-members.jsonl, 186 lines | no open PRs; pins match; 3 docs-only commits ahead of pins |
| Fabric, Observatory, wiki | raw/survey-fabric-observatory.jsonl, 29 findings | 9 seams; 4 handoff mechanisms with no map; asks from Observatory and Fabric |
| Coding-agent hosts | raw/survey-hosts.jsonl | listing 107,988 chars vs a 30,000 budget; PreToolUse matcher drift |
| Peer session fabric-workspace-91 | raw/peer-asks.jsonl | trust tiers T0/T1/T2 for agent-stack, cited to fabric-workspace `eb451cf` |
| Wiki `projects/sshlg-skills/`, `synthesis/agent-estate.md` | read by the estate survey | no estate row for the family's domains |

## Decisions resolved from the sources (not asked)

| Decision | Resolution | Source |
|---|---|---|
| Who tags and publishes member and hub releases | the agent: push the tag after green CI, watch the run, confirm the registry | `~/.claude/CLAUDE.md` "Releases are the agent's" (operator 2026-10-11) |
| Does a release need a reviewer's click | no — the hub and members use their release workflows; where a run waits for reviewers, report the link | same, "Release approvals — always with the link" |
| Hooks reinstall on this machine | agent work, through `protect()` | `CLAUDE.md` "Writing to operator files"; routine operation per the global autonomy rule |
| Trust-tier citation | fabric-workspace `eb451cf`; Fabric `19ad05ca` named as the "wave 2 branch" | peer fabric-workspace-91, 2026-10-11 |
| Spend on the eval round | within the project's limit, on the Claude Code subscription | `~/.claude/CLAUDE.md` "Spending and authority" |
| Scope of this release vs program | this release: nodes N01–N09 (74 items); member-local rows outside the emphasis → `program` (154) | `waves.md` "A board bigger than one release" |
| Edits in Fabric or Observatory repositories | none from this run — asks go to their owners | `~/.claude/CLAUDE.md` "Coordinate shared domains … with their owner" |

## Operator answers (2026-10-12, planning gate)

| Question | Answer | Effect |
|---|---|---|
| Planning gate (stages 0, 2, 3) | **approved — start wave 1** | gates 0/2/3 closed by the operator's go |
| B-145 plugins | **disable `huggingface-skills`, `atlassian`, `caveman`, `clickhouse`; scope `figma`, `meta-vr`, `stripe`, `cloudflare` per project** | R35, wave 1 |
| B-146 Gemini | **agent installs `@google/gemini-cli` from npm; the operator signs in** | R36, wave 5 |
| Pi legacy links | **"Pi will soon be used actively"** — do not prune; support Pi as a host | R37, wave 5 |
| Pasted root files, temp-dir reap | not answered | the files stay (deletion is irreversible, never assumed); the temp reap is part of approved R07, by owner prefix only |

## Questions for the operator — one batch, at the end of planning

Asked once (see the plan's planning gate). An unanswered question takes the
recommendation, recorded as **assumed**, and only the waves that name it re-plan if the
answer differs.

1. **B-145 — plugins over the listing budget.** *Recommendation:* switch off globally
   `huggingface-skills`, `atlassian`, `caveman`, `clickhouse`. Move `figma`, `meta-vr`,
   `stripe` and `cloudflare` to per-project enablement in the repositories that use them.
   Saves ≈58k chars per session. Affects no wave.
2. **B-146 — Gemini CLI.** *Recommendation:* the agent installs `@google/gemini-cli`
   from npm (dry-run first), and the operator signs in once. Alternative: retire the
   Gemini channel. Affects wave 5 (the compatibility cut).
3. **Pi legacy links (455).** *Recommendation:* prune them with a backup, since Pi is
   not installed. Affects wave 5.
4. **agent-sync tokens in the vault.** *Recommendation:* wave 3 ships vault-first
   resolution, then the operator moves the 15 Notion tokens into Observatory slots when
   convenient; until then the plaintext fallback is reported as degraded. Affects wave 3
   only as a human step.
5. **Pasted files in the repo root** (`2026-10-07-…-id3f45.txt`, `2026-10-08-…-id1b5f.txt`
   — terminal paste of photo names and a Telegram post). *Recommendation:* delete.
6. **Disk.** Swap is ≈21 GB with 35 Claude sessions; free space has touched 319 MB
   today. *Recommendation:* the operator closes idle sessions — the agent does not
   kill sessions.

## REQ table

Frozen at the planning gate: rows may be added freely; removing one needs the operator.
**Verified by** names the check that proves each row.

| REQ | Requirement | Inventory | Verified by |
|---|---|---|---|
| R01 | The per-prompt routing note names each route at most once per session; `clear`/`compact` reset it | INV-208 | `test/triggers_test.js` + `test/hooks_e2e_test.js` new cases; chars/session measured before/after |
| R02 | SessionStart prints the injectors line only when the injector set changed; drift/update/handoff lines unchanged | INV-209, INV-210, INV-233 | `test/injectors_test.js` + hook e2e; measured startup chars |
| R03 | `update` re-applies the family's hook wiring on a consented machine through `protect()`; `hooks` names the differing field; this machine's PreToolUse repaired | INV-232 | e2e fixture (three runs, hashes equal); `npx sshlg-skills hooks` reads "ok" |
| R04 | Secret remedies resolve the Observatory engine at runtime with `--vault-only`; no checkout path | INV-014, INV-207, INV-229 | `test/secrets_test.js` refuses a checkout path. *Note (wave 1):* the `pipe` remedy has no `--vault-only` — `use_secret.py pipe` does not accept it (`run` does); B-158 |
| R05 | `state.json` is a documented, versioned interface; `update` holds a single-instance lock | INV-221 | lock fixture (second run refused); doc page resolves in `doc_refs` |
| R06 | Hook latency is measured per event, and any hook over 150 ms on a common path is optimized | INV-209 | recorded timings in the wave-1 receipt |
| R07 | task-pipeline test temp trees go through the residue ledger; a guard refuses bare `mkdtemp`; the existing leak is reaped by owner | INV-175–177 | guard watched failing on a planted `mkdtemp`; `$TMPDIR` counts after a run |
| R08 | task-pipeline `validate.yml` < 400 KB and the validate job ≤ 45 min | INV-012, 134, 179, 182 | `wc -c`; the PR run's duration read by run id |
| R09 | task-pipeline description ≤ 900 chars; body ≥ 100 tokens under the limit; hub reserve ratchet back to 13 | INV-011, 172, 178 | the member validator; hub `validate.py` ratchet |
| R10 | task-pipeline ledgers and branches current (verification header, stale branches, HANDOFF) | INV-180, 181 | `gh api` branch list; file diff |
| R11 | Every gate writes the Observatory checkpoint when connected, else ledger line `memory: unavailable`; planned executor change uses `handoff_create/accept` | INV-198, 201, 202, 228 | `stage_checkpoint_test.py` cases; one live run records a receipt |
| R12 | One handoff-layering map, single home in the hub, cited by task-pipeline | INV-203 | `doc_refs` resolves; DOCMAP lists the home |
| R13 | The waves intake reads `docs/backlog-sources.json` when present | INV-216 | fixture repo with the file |
| R14 | Packet id `task-pipeline/execution-packet/1`; old id read for one release | INV-218 | schema test both ids |
| R15 | Fabric pipeline-adapter contract fixture runs in task-pipeline CI | INV-217 | regression `fix-pf-06.01` reports PASS, not NOT_RUN |
| R16 | The release stage reads the project's approval mode and reports the waiting-run link on `reviewers` | INV-224 | doctrine test + fixture products.json |
| R17 | agent-sync run identity is hash-based and unique per key | INV-191, 204 | collision fixture watched failing on old code |
| R18 | Expired leases are counted and reaped only with owner proof | INV-022, 192 | reap fixture; live `status` counts |
| R19 | Long-held lease warning against the declared interval | INV-206 | fixture |
| R20 | Token resolution: vault first, then env, then file (degraded) | INV-193, 205 | fixture with a stub `use_secret.py` |
| R21 | Conformance map to Fabric `coordination.md` at a pinned commit | INV-219 | test maps every operation |
| R22 | AS-07, AS-08, AS-09, AS-10, AS-14 closed with fixtures | INV-021, 023–026, 194 | each fixture watched failing |
| R23 | `gateway.md` states trust tiers T0/T1/T2 cited to fabric-workspace `eb451cf` | INV-197, 213, 214, 238 | member validator; text check |
| R24 | agent-interop teaches fabric-interop jobs + the degraded envelope, pinned | INV-215 | member validator; pin resolves |
| R25 | agent-stack and make-skill link the Fabric adapter skills and `observatory-log:handling-secrets` | INV-226 | grep test in member gate |
| R26 | agent-stack descriptions ≥ 30 chars spare | INV-195 | member validator |
| R27 | `skill-search` trigger evals and the paired routing eval run; B-144 decided from it | INV-006, 009, 183 | eval report with run ids and costs |
| R28 | Residue checks in make-skill (MS-05) and agent-stack (AG-06a/b) | INV-018, 019, 027, 190 | guards watched failing |
| R29 | make-skill HANDOFF current | INV-184 | file diff |
| R30 | The hub board guard reads every member board (B-108); released members' gates check tag reachability (B-109 part) | INV-003, 004 | planted pipe-shifted row in a member board fails the hub |
| R31 | New compatibility report cut superseding 2026-10-09 | INV-010, 199, 235, 237 | report with per-host readbacks; `superseded_by` set |
| R32 | Family description total ratcheted (may fall, never rise) | INV-002 | `validate.py` ratchet line |
| R33 | Graph refreshed; DOCMAP, HANDOFF, README current; pins; hub release; installed and read back | INV-015, 200 | `graphify` report; `npm view`; readback receipt |
| R34 | Cross-product asks delivered to their owners; wiki estate map updated | INV-212, 220, 222, 223, 225, 227 | message ids; wiki diff |

| R35 | Plugins: 4 disabled globally, 4 enabled only in the projects that use them; listing chars measured before/after | INV-007, 211, 230, 231 | `claude plugin list`/settings diff through a backup; `npx sshlg-skills visibility` chars |
| R36 | Gemini CLI from npm (dry-run first); after the operator's sign-in, family discovery read back | INV-008, 234 | `gemini --version`; readback in the compatibility cut |
| R37 | Pi supported: which directories Pi reads is measured from its docs/source; family skills discoverable once, no duplicate listing; Pi in the compatibility cut | INV-236 | readback with Pi installed (installed by the agent if absent) |

Operator-only items (N10): INV-001 (B-29), INV-005 (B-143), INV-013 (HK-13). (B-145, B-146 and Pi became R35–R37 on 2026-10-12.) They
stay out of every wave until answered.
