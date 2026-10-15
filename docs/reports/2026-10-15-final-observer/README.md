---
report:
  id: sshlg-skills/2026-10-15-final-observer
  title: "Final independent observer: family completion program at hub 1.64.0"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-15
  status: active
  valid_until: 2026-10-22
  summary: >-
    Read-only, non-author check of the completion program at hub 1.64.0 (fc11487) and
    task-pipeline 1.96.0 (2674147). No blocking finding. Both npm tarballs equal their tag
    sources; pins, gitlinks and the README agree for all 11 members; every release run
    succeeded; the installed state reads back as published. Of 37 original
    requirements: 3 MET, 29 MET_BOUNDED, 5 PARTIAL, none NOT_MET. Nine deferred findings
    and two noise findings.
  sources:
    - name: "Hub release 1.64.0"
      url: "https://github.com/ssheleg/sshlg-skills/commit/fc11487d6656ba0df0ff965a5b14bdddd12a12d2"
      read_at: 2026-10-15
    - name: "Hub main after #227 (installed-1.64.0 readback, HANDOFF)"
      url: "https://github.com/ssheleg/sshlg-skills/commit/7b4684b0b656febe9113747256dfef4c3132ce22"
      read_at: 2026-10-15
    - name: "task-pipeline release 1.96.0"
      url: "https://github.com/ssheleg/task-pipeline/commit/2674147ccfc5eab19aab8f9d7334909cc22f64b2"
      read_at: 2026-10-15
  produced_by:
    agent: "Claude Code"
    task: "Final independent observer for the family completion program"
  supersedes: []
  consumers: ["sshlg-skills next iteration", "operator"]
---

<sub>ssheleg skills — evidence-docs · project-reports</sub>

# Final independent observer: hub 1.64.0

**Verdict: no BLOCKING finding.** No exit check is red, no hotfix-class defect turned up,
nothing regressed since the start, and no shipped claim I checked is false. The open work
is deferred and every item has an owner or a human gate. Machine-readable:
[findings.json](findings.json).

Scope: read-only. I made no edits, releases, deletions, provider/model calls or full test
runs. I read `~/.claude/settings.json` only for booleans of eight plugin keys and never
printed it.

## Mechanical checks (re-observed, not copied)

| Check | Result | Evidence |
|---|---|---|
| npm `sshlg-skills@1.64.0` = tag | PASS | gitHead fc11487. 96 files, 0 byte mismatches against `git archive fc11487`, and the tag source packs the same 96 files. `latest` = 1.64.0 |
| npm `task-pipeline-skill@1.96.0` = tag | PASS | gitHead 2674147. 162 files, 0 mismatches |
| skills.json / claude-plugin-pins.json / gitlinks / README | PASS | 11/11 agree on commit and version |
| Pins vs npm payload | PASS_BOUNDED | All 11 are at npm `latest`. The 10 pins ahead of their npm gitHead change only docs, tests and CI |
| 37 requirement texts vs brief | PASS | 6 cuts, 0 text diffs. The latest cut (0e5ed71) predates 1.63.3 and 1.64.0 |
| 177 original board ids | PASS | The same set in all 5 cuts. The latest cut (6dd8ca7) predates 1.64.0 |
| Release runs | PASS | v1.63.0–v1.64.0 runs 38518498679, 38521797421, 38524904441, 38654043071 and 38731555703 succeeded, as did task-pipeline 38722488907 and pages on fc11487. Validate passed on PR head ac7935e, whose tree equals fc11487's |
| `hooks status` (1.64.0) | PASS | 8 entries, all present and matching. Runtime 1.64.0 |
| `blocks`, `routers` | PASS | 6 files READ, syntax valid. 5 router files unchanged. wait-v2 markers present on claude, codex, gemini and cursor |
| `context` | PASS | claude 39,737 B (615 lines), codex 32,553 B (cap 65,536), gemini 25,907 B, pi 17,909 B, cursor 18,090 + 2,814 B. Matches the #227 readback |
| `hooks recovery inspect --json` | PASS | ok, `NO_LOCK`, no journal |
| installed_plugins.json | PASS_BOUNDED | 11/11 at the pinned version. 8 sit at an older commit with an identical payload (rebind) |
| https://skills.sshlg.me | PASS | 200, footer v1.64.0, tp v1.96.0, agent-stack v0.28.2 |
| Fabric board | PASS_BOUNDED | `com.status` ready, 0 unread |

## Requirements by area (37 from the 2026-10-11 brief)

| Area | Rows | Verdict | Why |
|---|---|---|---|
| Hub hooks, secrets, state, latency | R01–R06 | R03 MET, the other 5 MET_BOUNDED | hooks read ok on the host and the tests exist, CI green. Latency and chars were not re-measured after the 1.63.x hook changes |
| task-pipeline | R07–R16 | R11 PARTIAL, the other 9 MET_BOUNDED | validate.yml is 12,810 B. Description is 887 chars. 1.96.0 is installed on Claude, but the Codex generation is deferred. The live Observatory checkpoint was never observed |
| agent-sync | R17–R22 | MET_BOUNDED | 1.22.2 agrees across npm, the pin and the install. Live lease behaviour was not observed |
| agent-stack | R23–R26 | MET_BOUNDED | Tiers T0/T1/T2 are stated, citing Fabric `5bf15e5c` and fabric-workspace `714808ac` (see N-01) |
| Evals, residue, handoff | R27–R29 | MET_BOUNDED | Native protocol 20/20. No quality-equivalence claim |
| Board guard | R30 | PARTIAL | The hub half is done. Members still owe their own-gate check (B-108), and B-109 is open |
| Compatibility, ratchet | R31, R32 | MET | Supersession chain intact. The ratchet passes in CI |
| Graph, docs, release, install | R33 | PARTIAL | Released and installed with readback, and HANDOFF is current after #227. The graph is 7 commits behind (D-03) |
| Cross-product asks, wiki | R34 | PARTIAL | Wiki delivered. The 3 asks are unsent because other project ids are not visible |
| Plugins, Gemini, Pi | R35–R37 | R36 PARTIAL, R35 and R37 MET_BOUNDED | All 8 named plugins are off globally. Gemini 0.63.0 is installed but sign-in is pending (B-146) |

Program-level: release/deploy is **MET**. Installed final updates, docs/site, token
economy and the finish line are **MET_BOUNDED**; Fabric/Observatory integration is
**PARTIAL**.

- **Token economy.** The compaction cut ≈15 KB (≈3.75k tokens). Bounds:
  - the Claude file is still 615 lines against a 200-line target;
  - the ≈23 KB hub routing block is unchanged;
  - the effect on model behaviour and billed tokens was not measured.
- **Finish line.** It shipped in task-pipeline 1.96.0 and wait-v2. This iteration itself
  ran without a recorded finish-line ledger. Five hub releases went out before the
  2-release budget existed, so the budget does not apply to it retroactively.

## Deferred findings

| Id | Finding | Next |
|---|---|---|
| D-01 | Board rows B-187, B-189 and B-190 still say "publication and installed readback pending" though both have happened | Close or re-scope them. B-190 keeps Linux acceptance |
| D-02 | `docs/CLAUDE-CONTINUE.md` §"Состояние 2026-10-15" still calls 1.64.0 unreleased and gives its release as the next step | Mark it done or point to HANDOFF |
| D-03 | The hub graph covers b865635, 7 commits and 14 lib/bin/hooks files behind fc11487 | `graphify update` at the next release |
| D-04 | Observer reports `…interim-f77a6c2` and `…runtime-3898236` are past `valid_until` (2026-10-14) but still `active` | Update their status through project-reports |
| D-05 | README "Inspect instruction blocks" and "Write another tool's block" sit as `###` under `## License` (README.md:1023–1043) | Move them under "Other commands" |
| D-06 | Codex: three members are deferred, so `update` exits 1 on this host by design (B-188) | The next update after the old sessions end |
| D-07 | The Fabric asks are unsent. The live Observatory checkpoint is unverified. Gemini sign-in and the pollSecret re-issue wait on the operator | Owner or operator steps |
| D-08 | task-pipeline B-136…B-140 are finish-line edge cases, e.g. `--operator-go` can be set by the agent | Next task-pipeline iteration |
| D-09 | B-198 reproduces: `rules --help` prints "unsupported rules argument" | Open row B-198 |

Noise:
- **N-01.** The brief says R23 cites `eb451cf`. The source has been re-pinned and the
  re-pin commit `5852c57` exists only on `waves/2026-10-11-integration`.
- **N-02.** Installed commit SHAs differ from the pins for 8 members, but their payloads
  are identical.

## Limits

- I verified the installed state on this host only, by reading.
- Requirement and board cuts were reconciled by the coordinator. I re-checked them for
  identity and wording, not each disposition.
- Member boards were read only for the rows named here.
