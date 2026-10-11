# Family round 2026-10-10 — delivery receipt

Brief: [../briefs/2026-10-10-family-round.md](../briefs/2026-10-10-family-round.md) ·
plan: [../plans/2026-10-10-family-round.md](../plans/2026-10-10-family-round.md) ·
lease `FAMILY-ROUND-1010`.

## What the review of the 1.54.7 round found

| Finding | Evidence | Outcome |
|---|---|---|
| Claude listing 274,398 chars vs 30,000 budget; most family descriptions dropped | `claude -p --debug`: `Skill listing over budget: 634 skills, 274398 chars > 30000 budget` | `visibility` + search-first protocol (REQ-1..4) |
| Codex removed all descriptions and 220 skills incl. `task-pipeline` from the model list | `codex exec` warning, host probe 2026-10-10 | Codex half of `visibility` |
| 2026-10-09 "discovery PASS" was loader-level only | host probe: OpenCode, Hermes, Kimi ACTIVATED make-skill; Codex PARTIAL; Gemini NOT_AUTHENTICATED | recorded; B-146 |
| Four lightweight release tags (report named three) | `git cat-file -t` → `commit` for super-ux v0.59.1, make-skill v0.29.2, seo-aeo-audit v0.26.3, sheleg-dev v0.13.2 | release gate in all 11 members; all new tags annotated |
| «баг» never shipped (PR #102 stale) | description had 0 matches | task-pipeline 1.91.0; PR #102 closed as superseded |
| #154 open though fixed | repro: 1.21.0 exit 2, 1.21.5 exit 0 | closed with evidence |
| `skills@1.5.25` four releases old; 1.7.2 moves Codex/Pi to `~/.agents/skills` | `node lib/host-targets.js --verify-source` on 1.7.2: 79 targets match | pin bumped |
| make-skill plugin reference behind Claude Code 2.1.296; `/skill-audit` rendered "at ``" | contract research; host probe | make-skill 0.30.0 |
| agent-sync default gate >58 min | member audit | agent-sync 1.21.6: CI default gate 1,736 s → 64 s |
| super-ux B022 reported line 0 | member audit | super-ux 0.59.2 |
| task-pipeline test file-handle leaks | member audit | task-pipeline 1.91.0 |

## Independent review of the hub change (before release)

Two high-severity defects found and fixed before anything shipped: a Codex config
using `[[skills.config]]` would have received a second `skills` definition (invalid
TOML), and `--revert` would have deleted `enabled = false` entries the operator had
set. Both have fixtures that were watched failing against the original code
(`test/visibility_test.js`, `test/visibility_e2e_test.js`). Also fixed: escaped-path
comparison, control-character escaping, CRLF, missing-file ownership, `--find` exit
code, substring name matches, duplicate shared-root rows.

## Releases

| Member | Version | Tag object | PR |
|---|---|---|---|
| super-ux | 0.59.2 | tag | super-ux#40, receipt #41 |
| task-pipeline | 1.91.0 | tag | task-pipeline#105 |
| agent-sync | 1.21.6 | tag | agent-sync#30 |
| make-skill | 0.30.0 (pin `63a6b27`, preview #31) | tag | make-skill#29, #30, #31 |
| sheleg-design | 1.64.1 | tag | sheleg-design-skill#42 |
| seo-aeo-audit | 0.26.4 | tag | seo-aeo-audit#26 |
| sheleg-dev | 0.13.3 | tag | sheleg-dev#23, #24 |
| agent-stack | 0.25.6 | tag | agent-stack#40, #41 |
| telegram-dev | 0.2.3 | tag | telegram-dev#11 |
| xr-dev | 0.3.3 | tag | xr-dev#4 |
| web3d-dev | 0.1.3 | tag | web3d-dev#4, #5 |

Hub: 1.55.0 — see the release section appended below once published.

## Installed and measured (2026-10-11, hub 1.55.1 at `4eb7383`)

| Readback | Result |
|---|---|
| `npx --yes sshlg-skills@latest update` | 83 of 83 steps green; Continue: 39 of 39 family skills are real directories |
| Installed payloads (`docs/evidence/host-compat/local/verify_payloads.py`) | 137 of 137 comparisons equal (shared, Hermes, Continue copies; 11 Claude plugins; 9 Codex native plugins) |
| Codex native plugins | agent-sync 1.21.7, make-skill 0.30.1, task-pipeline 1.91.2 via marketplace remove/re-add at the pinned SHA; every earlier cache file preserved (manifest 0 mismatches), `config.toml` parses |
| `visibility --apply` (released launcher) | Claude: 417 personal skills `user-invocable-only`; Codex: 429 shared skills `enabled = false`; both files backed up first; a second run wrote nothing (hashes equal) |
| Claude listing after apply (`claude -p --debug`) | `634 skills, 274398 chars` → `222 skills, 114707 chars` against 30,000 — still over budget from plugin skills (B-145) |
| Codex model-visible list after apply (`codex exec`) | task-pipeline, make-skill, agent-sync, ux-scenarios, evidence-docs and skill-search all listed (before: 2 of 5); no context-budget warning. The shared `skill-search` copy was a duplicate of the plugin's and is disabled like the other 29 family paths |
| `python3 test/check_pins.py` | every pin matches its npm release; it now judges npm members by npm alone |

Releases that refused themselves: task-pipeline `v1.91.1` (no no-stamp declaration;
nothing published) — `v1.91.2` ships the same payload. The hub's own `check_pins`
had reported that tag as OK; fixed in 1.55.1.

## Wave mode, hub 1.55.2 (2026-10-11, `0255469`)

| Step | Evidence |
|---|---|
| task-pipeline#108 (fabric-90's wave mode) | CI green (validate, strict conformance, house audit); squash-merged as `47ba011` |
| `v1.92.0` | annotated, cut locally; `python3 test/validate.py` on the tag tree exit 0 **before** the push (R-010); release run 38132891180 success; `npm view task-pipeline-skill version` → 1.92.0 |
| Hub PR #188 | routing paragraph names `/task-pipeline waves` (15,906 / 15,913); pin 1.92.0; `node test/run.js` 96/96, 1179 fixtures; `check_pins.py` every pin matches |
| Reserve ratchet 13 → 14 | task-pipeline's description is 911 of 970, one character inside the 60 reserve; the check failed on it before the change; trim is B-154 |
| `v1.55.2` | `scripts/tag.sh v1.55.2 --push` (annotated); release run 38136733698 success; npm 1.55.2 |
| `npx --yes sshlg-skills@1.55.2 update` | first pass 81 of 83: two steps hit ENOSPC (other sessions' temp files filled the disk); full re-run through the launcher, 83 of 83 green |
| Continue | 39 of 39 family skills are real directories; task-pipeline carries the wave mode |
| Codex native task-pipeline | 1.92.0 via marketplace remove/re-add at `47ba011`; installed tree equals the tag (except `__pycache__`); 1.91.2 cache kept; only `ref` changed in `config.toml` |
| Installed payloads | 137 of 137 equal, after a verifier fix: `claude plugin list` now also returns claude.ai-synced rows (11, `scope: synced`, `version: unknown`) that a same-named local install shadows; keyed by name they overwrote the real rows and the verifier reported `Claude registration mismatch`. It now skips synced rows; it failed on the same snapshots before the fix |
