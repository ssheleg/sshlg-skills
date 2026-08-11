# Board — sshlg-skills

Everything this repository knows it owes, in one place. A carry-over that
leaves a run still open lands here with an id; `/task-pipeline checkup` reads
this file when no run is in flight, which is exactly when accumulated debt is
invisible.

**Priority is computed, not felt.** `P = blast × (1 + age_runs) / effort`,
where *blast* is who is hurt if it stays (3 = a user of the pack, 2 = the
operator of this machine, 1 = a future run of this repo), *age_runs* is how
many run stamps it has survived, and *effort* is rough size (1 = under an hour,
2 = a session, 3 = its own run). Recomputed at stage 10 rather than inherited,
so a row cannot keep a rank it earned when it was new.

| id | What | Source | Blast | Age | Effort | P | Status |
|---|---|---|---|---|---|---|---|
| B-01 | `agent-sync` releases fail on one letter: `release.yml` extracts notes with `awk '$0 ~ "^## " v'` while its CHANGELOG writes `## v1.5.2`, and the terminator `/^## [0-9]/` misses the same prefix. v1.5.0, v1.5.1 and v1.5.2 each tagged and died at `no CHANGELOG section` (run `31287012133`). npm has served 1.4.3 since 2026-08-03 while three tags claim otherwise. | 2026-08-10 run | 3 | 1 | 1 | **6.0** | **closed 2026-08-10** — fixed upstream, run `31374955487` green |
| B-02 | `agent-sync` `main` is red on its own validator: `FAIL: status verdict: 'status' reported normally on a setup 'check' fails` (run `31352513346`, 2026-08-10). No release may be cut from it until this is green, so B-01's fix alone does not ship anything. | 2026-08-10 run | 3 | 1 | 2 | **3.0** | **closed 2026-08-10** — fixed upstream, run `31374949511` green |
| B-03 | `graphify-out/` is neither tracked nor ignored in five members, so a graphify run leaves every one of them dirty and the umbrella reports five modified submodules. | 2026-08-10 run | 2 | 1 | 1 | **4.0** | **closed 2026-08-10** — `graphify-out/` added to `.gitignore` on `main` in all five (`agent-sync` 5df7fe1, `make-skill` 022e9da, `seo-aeo-audit` ea12acd, `sheleg-dev` 5ef953a, `agent-stack` 3a4ee92). `super-ux` deliberately differs and was left alone: it commits `graph.json` and `GRAPH_REPORT.md` so the next harvest can query them, ignoring only `.graphify_*` and `cache/`. The local `.git/modules/skills/*/info/exclude` entries stay until each pin moves past its tag onto a commit that carries the line. |
| B-04 | `sheleg-dev` and `agent-stack` have no release tags at all — `git ls-remote --tags` returns nothing for either — so their pins are commits on `main`, `check_pins.py` has nothing to compare against, and their release workflows have never run once. | 2026-08-06 port | 2 | 2 | 2 | **3.0** | open |
| B-05 | C-09: a command that edits an unrecoverable file should take its own backup. Today the copy of `~/.claude/CLAUDE.md` exists because an agent chose to make one — twice now, once ten minutes before it was needed. That is a habit, not a mechanism. | C-09 (2026-08-06) | 2 | 2 | 2 | **3.0** | open |
| B-06 | C-07: four members do not delegate to `routers --member`; only `bin/super-ux.js:354` does. The bundle writes all eight routers without it, so nothing is broken — but a lone installer for those four writes no router at all. | C-07 (2026-08-06) | 1 | 2 | 2 | **1.5** | open |
| B-07 | C-04: the CLI launcher has no `docs/ux/` chain. Waived at intake (D-09) in favour of REQ rows asserting exact output; the fixtures in `test/cli_config_test.js` and `test/drift_test.js` are what stands in for it. Revisit only if the command surface grows past what fixtures can describe. | C-04 (2026-08-06) | 1 | 2 | 3 | **1.0** | open — waived, revisit on growth |
| B-08 | C-05: no design-time track in `seo-aeo-audit`. Different repository; the `seo-llmo` router carries the rule, and the skill stays an audit. | C-05 (2026-08-06) | 1 | 2 | 3 | **1.0** | open — deliberate |

| B-09 | A channel fed once but absent from `defaultAgents` drifts forever, and no command repairs it. `kiro-cli` and `goose` each carried 12 of the family's 19 skills. | 2026-08-10 audit | 2 | 1 | 2 | **2.0** | **closed 2026-08-10** — both ids added to `defaultAgents`, and `update` now reconciles rather than only refreshing: `skills update <id>` is a no-op for a skill installed nowhere and reports success anyway, so refreshing alone could never deliver a new member. Proven by planting the never-installed state for `agent-orchestrator` and watching the old verb restore nothing and the new one restore all seven channels. v0.30.0. |

| B-10 | `sheleg-dev`'s `npm publish` step fails `ENEEDAUTH` on every release (run of v0.3.0, 2026-08-11). The GitHub release and tag land, so the member ships and `check_pins.py` treats it as GitHub-only and stays green — which is why nobody noticed. Either the package is meant to be on npm and the workflow's auth is wrong, or it is GitHub-only and the publish job should not run. Today the release is reported failed for a step nobody wants. | 2026-08-11 run | 1 | 1 | 1 | **2.0** | open |

**Open: 6.** B-01 and B-02 opened and closed inside the same run: they live in
a repository another agent held throughout, so this run diagnosed them and
wrote down the evidence instead of touching the code. The other agent shipped
both fixes while it was in flight, and `agent-sync` is pinned at 1.7.0 here as a
result. The finding was still the deliverable — it just had a shorter life than
expected.

**Closed by the 2026-08-10 run:** C-06 — the umbrella now has `CLAUDE.md` house
rules of its own, which is the thing every member already had. B-01, B-02 and
B-03 closed the same day.
