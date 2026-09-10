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
