# Quest lifecycle release — 2026-09-21

[Current XR release handoff](evidence/releases/2026-09-21-xr-lifecycle/README.md) records the member implementation, catalogue/site work, npm authorization boundary and links to the earlier creative strategy. Other workstreams below retain their own scope.

---

# Start here — the active plan

**Done (2026-10-01): agent-sync 1.21.3 — one key, one name.** A dotted git lease key was
reported and released by its dash-slug, so `release --held` printed "released" and left the
ref on the remote (the `SK-AGENT-SYNC-1.21.2` lease here). The ref and the local note now
share one injective name and `release` proves the ref is gone. Released at
[ssheleg/agent-sync#26](https://github.com/ssheleg/agent-sync/pull/26) (`637424e`), tag
`v1.21.3`, npm `@ssheleg/agent-sync@1.21.3`; pinned here in v1.52.5. **Open:** agent-sync
backlog AS-14 — a 1.21.2 and a 1.21.3 run racing one path key before any ref exists push
two refs; every machine should update.

**Done (2026-10-01): agent-sync 1.21.2 — the guard asks the repository that owns the write.**
The `PreToolUse` guard read the SESSION's `.claude/agent-sync.json` and then checked another
repository: a configured session's commit into a repository without a config was blocked,
an edit in another repository was judged by the session's `guardedFiles`, and an
unconfigured session guarded nothing. The owning repository's toplevel now decides.
Released at [ssheleg/agent-sync#24](https://github.com/ssheleg/agent-sync/pull/24) (`6c100d4`),
tag `v1.21.2`, npm `@ssheleg/agent-sync@1.21.2`; pinned here in v1.52.4. **Open:** leases
taken in a second repository are still neither renewed nor released by the lifecycle hooks
(agent-sync backlog AS-07).

**Done (2026-10-01): agent-sync 1.21.1 — registers on a local record plane.** `check`
refused `idRegisters` on `backend: "fs"` + `leaseBackend: "git"` while `reserve` served them
race-free through `refs/agent-sync/ids/*`; one predicate (`id_allocator`) now answers for
both. Released at [ssheleg/agent-sync#23](https://github.com/ssheleg/agent-sync/pull/23),
tag `v1.21.1`, npm `@ssheleg/agent-sync@1.21.1`; pinned here in v1.52.3. **Open:** the
consuming repositories that took register numbers by hand can now declare `idRegisters`.
The first is `passioncode-ai/fabric-vr`, and it waits on that repository's PR #1, which
was still open on 2026-10-01.

**Done (2026-09-28): web3d-dev, the eleventh member.** Realtime 3D on the web —
`web3d-runtime`, `web3d-assets`, `web3d-animation` — at
[ssheleg/web3d-dev](https://github.com/ssheleg/web3d-dev) 0.1.1, pinned here in v1.52.0;
neighbours name it (`sheleg-design` 1.61.1, `xr-dev` 0.3.2); the private `asset-foundry`
skill 0.3.0 now states its real endpoint, health check and animation recipe. Spec, docs
study (120 rows against three@0.186.1) and probes live in the member's `docs/evidence/`.
**npm is live (2026-09-28):** the owner published 0.1.1 and configured trusted publishing;
0.1.2 was published by its tag alone (release run 36359053252, SLSA provenance), and the
member is no longer marked `npmPublished: false`. **Next action:** the member's probe
re-run showed fabricated execution with tools disabled (`test/evals/RESULTS.md` in the
member); 0.1.2 added a rule against it — re-run the candidate probes once more to see
whether the rule changes the behaviour.

**Done (2026-09-27): the Codex SessionEnd clamp.** Codex 0.157.1 printed
`clamping SessionEnd hook timeout to 3s` for agent-sync (20 s) and task-pipeline (10 s) at
every session start. Released: agent-sync **1.21.0** (also fixes the macOS `run_limited`
watchdog that held the caller's pipe for its whole limit), task-pipeline **1.87.1** (hosted
`validate` 1h46m green), and this repository **1.51.2** with `check_member_hooks_fit_every_host`
reading every member's `hooks.json` at its pin. The receipt is in
`docs/evidence/verification.md` (SE-1, SE-2). Open, not fixed here: task-pipeline's negative
plants leave `/tmp/*-copy` trees behind (211 of them, 6.2 GB, on one `test:all`). Codex
reports `Exceeded skills context budget`: 423 hub skills, so 162 are dropped, and which to
prune is the operator's call. **Next action:** the HK-05 line below. The workflow room it
asks for is now 5,950 bytes, after `test/plant_gap_mention.py` moved out.

**Active plan (2026-09-13):**
[Family audit 2026-09-13 — the hook key nobody read](evidence/audits/2026-09-13-family-hooks/plan.md),
state in [`progress.json`](evidence/audits/2026-09-13-family-hooks/progress.json),
routing measured in [`routing-2026-09-14.md`](evidence/audits/2026-09-13-family-hooks/routing-2026-09-14.md).

**13 of 15 tasks are done and released** — ten members, eleven releases: agent-sync
1.20.2, task-pipeline 1.87.0, super-ux 0.56.2, make-skill 0.29.0, sheleg-design 1.61.0,
seo-aeo-audit 0.26.1, sheleg-dev 0.13.0, agent-stack 0.24.3, telegram-dev 0.2.1, and
this repository at 1.48.4. Every pin moved after its registry read; the machine was
verified afterwards (0 shadows, 0 broken symlinks, 0 unknown hook keys installed).

**Exact next action: HK-05** — `task-pipeline`'s validate job takes 105 minutes and its
workflow sits 59 bytes under GitHub's 512,000-byte ceiling, so two regressions in this
wave had to route around it (both went to `test/audit_regressions/` instead of being
workflow steps). Its packet in the plan carries the four-step decomposition, the
measured before/after it must record, and the rule that keeps `Guards: N → M`
derivable. After it, **HK-13** is four decisions only the operator can make.

Read the "Standing rules every task inherits" section before the first commit.

The Sherlock handoff below is complete (255/255 leaves done, debt plan 30/30) and kept
as the record of how the previous programme was run.

---

# Sherlock Skills: start here

The family audit, architecture, source reviews and complete development plan are
now tracked in this repository. This is a planning handoff, not a completed runtime
implementation. The prepared instruction changes live in the four member branches
below; production submodule pins and published package versions remain unchanged.

## Read first

- [Bundle entry and portable-path rules](evidence/audits/2026-09-07-sherlock/README.md)
- [Current audit and vision](evidence/audits/2026-09-07-sherlock/external-v3/report-v3.md)
- [Prioritized development plan: 139 parents, 254 small tasks](evidence/audits/2026-09-07-sherlock/external-v3/development-plan.md)
- [Program and module context](evidence/audits/2026-09-07-sherlock/extension/context/program.md)
- [Publication manifest and checks](evidence/audits/2026-09-07-sherlock/publication.json)

## Exact next action

1. Fetch this branch, read this handoff, then run the bundle's read-only verifier:

   ```sh
   cd docs/evidence/audits/2026-09-07-sherlock
   python3 tools/handoff.py verify
   python3 tools/handoff.py show FIX-SY-01.01
   ```

2. Start implementation with `FIX-SY-01.01` (immutable reservation identity), the
   first agent-sync task in wave 1. It addresses ownership identity needed before
   relying on shared execution. Its primary packet, parent acceptance and linked
   module context are the scope. Other wave-1 outcomes may proceed only with
   independent file ownership. The wave number is an ordering aid, not a deadline.
3. Clone/fetch the owning repository at its recorded base. Where a prepared member
   branch applies, review that commit first; refresh changed source hashes and
   revise the packet before dispatch. A mismatch is expected where instruction
   changes supersede the original audit. Do not blindly apply an old patch twice.
4. Use `repo://name/path` through a local roots map. Materialize prerequisite
   outputs, verify current source contracts, claim the scope where coordination
   is enabled, then implement just the selected leaf and its focused acceptance.
5. Commit and push implementation plus its result/context. Record the updated
   task status and proof without upgrading unrun host checks to PASS. Leave the
   next task and branch/commit in the handoff.

## Prepared member revisions

| Repository | Branch | Commit | State |
|---|---|---|---|
| [super-ux](https://github.com/ssheleg/super-ux/blob/707628c5d73449abf299912a78c382e8678c9116/docs/HANDOFF.md) | `codex/context-ready-skills-20260907` | `707628c5d734` | pushed; not merged/released |
| [task-pipeline](https://github.com/ssheleg/task-pipeline/blob/35e1a1c7ff42b48547f0a5e25bcaccb9da884477/docs/HANDOFF.md) | `codex/context-ready-skills-20260907` | `35e1a1c7ff42` | pushed; not merged/released |
| [sheleg-design-skill](https://github.com/ssheleg/sheleg-design-skill/blob/31938f84a233e808b56f6e6a65030d987ef039b0/docs/HANDOFF.md) | `codex/context-ready-skills-20260907` | `31938f84a233` | pushed; not merged/released |
| [make-skill](https://github.com/ssheleg/make-skill/blob/9316fbb72941b482f858ddcc93646579251608ac/docs/HANDOFF.md) | `codex/dependency-free-knowledge-20260907` | `9316fbb72941` | pushed; not merged/released |

The central branch is `codex/sherlock-audit-handoff-20260907` in `ssheleg/sshlg-skills`.
Use `git rev-parse HEAD` for its exact revision. The bundle's publication manifest
records the member revisions; each remote ref was checked after push.

## What is and is not verified

All four member structural validators passed on the prepared instruction changes.
The bundle verifier checks transported bytes, all primary packets, sidecars,
parent coverage and the dependency graph. The handoff checks include rejecting
bad hashes and a cyclic task graph, plus reading the bundle from a separate Git
checkout. These checks do not establish live Claude/Codex/Fabric handoff, design
quality improvements, release readiness or completion of the 254 implementation
steps. Those remain explicit plan work.

Original audit receipts describe their pinned snapshot. Portable export changes
path spellings and context hashes; `integrity.json` owns final transport hashes.
Foreign source trees, credentials and runtime installations are not in the bundle.

## Standing operator rule

[Persist results and handoff context in Git for every repository](working-rules/repository-handoff.md).
This rule is also saved in the operator's installed global agent instruction files.
Keep unrelated work out of task commits. Branch publication and package release
are separate states, and the successor must be able to see which occurred.

## Review links

- [super-ux](https://github.com/ssheleg/super-ux/pull/24)
- [task-pipeline](https://github.com/ssheleg/task-pipeline/pull/85)
- [sheleg-design-skill](https://github.com/ssheleg/sheleg-design-skill/pull/28)
- [make-skill](https://github.com/ssheleg/make-skill/pull/18)

## Illustrated reading and SEO update

[Latest bounded handoff](runs/2026-09-21-reading-seo.md) records the cross-site article, reading and search work, checks and delivery status.
