<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# Independent merged-seam review — 2026-10-13

**Bounded verdict: PASS for the reviewed integration seams. The original family-wide
completion goal remains open.** Source snapshot:
[`5427bbbd449cf6c26bc52e84f98bdb90707d5ec6`](https://github.com/ssheleg/sshlg-skills/commit/5427bbbd449cf6c26bc52e84f98bdb90707d5ec6).
Review began at its parent `b1a7507abd7c85bc52863fcdc100d04dafabd2ff`; `git diff
--name-only b1a7507..5427bbb` contained only README, CHANGELOG, package.json and
DOCMAP. The implementation exercised during this review therefore matches the named
snapshot. The worktree was clean after the candidate documentation commit.

The reviewer independently reviewed C04 visibility and C05 profile follow-ups. The
reviewer authored C06 credential matching, so the guard checks below establish merged
compatibility, not independent acceptance of that component. C06's separate reviewer
certified `72e0138473043831b624c9ab1763430a61614e8e`.

## What was inspected and exercised

The only reported merge conflict was `lib/enablement.js`. Inspection confirms the
C05 superset remains: `effective(home, cwd, f, profileRoot)` preserves the test
filesystem parameter and explicit fourth profile root; its default uses
`claudeRoot(home)`. `installed(home, f, profileRoot)` and post-tool registry/plain
skill readers use the same active root. C04 `conflicts.readSkills` supplies that
explicit fourth argument. Project `.claude` settings remain local to the project.

All subprocess controls below used disposable HOME fixtures. No real host settings,
credential contents, provider sessions or installed skills were changed.

| Check | Observed result |
|---|---|
| Selected existing `test/domains_profile_test.js` cases: `retargeting`, `enablement readers`, `post-tool shadow`, `hook inventory` | 4 cases, exit 0 |
| Selected existing `test/visibility_hosts_e2e_test.js` cases: `visibility targets the active`, `Codex directory aliases`, `unreadable inventory roots` | 3 cases, exit 0; unreadable-input case covers seven root/file/registry variants and explicit recovery |
| Additional independent merged search/enablement/hook harness | 12 assertions, exit 0 |

The two selected-test runs loaded the existing test files through Node `vm`, with
`createRequire` bound to each test's path and an early-return name filter inserted
in its `test`/`it` wrapper. No repository test was edited and no whole suite was run
by this reviewer. The independent harness checked:

- A disabled domain plugin from a relocated registry retains its CRLF description
  and remains findable for `realtime browser graphics`.
- A project-local enablement override changes the same registry's inventory to
  loaded, while the explicit profile API returns the same effective state.
- The installed hook matcher includes both `Read` and `Grep`.
- Six actual `pre-tool-use.js` subprocesses deny a synthetic `.env` Read, content
  Grep and `cd -- /synthetic/secrets && cat provider`; count-only Grep, ordinary
  `rg --max-columns 200 /credentials lib/` and a metadata `stat` remain allowed.

C04 implementation hashes match the separately reviewed final branch source for
`lib/conflicts.js`, `lib/hostvis.js` and `lib/visibility-state.js`. Its final source
[`27c63c96bc9e47758c9b4957042c78962983df3d`](https://github.com/ssheleg/sshlg-skills/commit/27c63c96bc9e47758c9b4957042c78962983df3d)
was independently tested for unbound legacy ownership refusal, malformed lock
entries, profile symlink retarget refusal, same-file aliases, unreadable inventory
preservation and recovery. C05
[`b50b7e9a2ba8df96626cf121682e94b10e6dce79`](https://github.com/ssheleg/sshlg-skills/commit/b50b7e9a2ba8df96626cf121682e94b10e6dce79)
independently passed all nine profile fixtures before integration. See the
[C04 receipt](visibility-followup.md) and
[C05 receipt](../runs/2026-10-13-domains-profile.md).

## Documentation and original-goal boundary

The preceding read-only documentation check covered eight current handoff, plan,
evidence and research Markdown entry files: 65 local links resolved, no missing
target; every JSON file in this evidence directory parsed. That link check predates
this new entry and the final ledger refresh; it is not a final report-index or
documentation gate.

The [receipts](README.md) correctly distinguish the successful controlled readiness
probe from failed description-screening attempts. Both screening attempts are
`TEST_ERROR`, with null task verdicts and unresolved provider-error classification.
They do not establish quality loss, quality parity or cost savings. The
[host snapshot](host-measurements.md) and [research](../../reports/2026-10-13-skill-discovery-efficiency/README.md)
remain explicitly bounded to their collection method and dates.

No reproduced integration blocker remains in these reviewed seams. The following
work still prevents a whole-system completion verdict:

1. Record the coordinator's aggregate gate on the final candidate; this reviewer
   did not run or certify that gate.
2. Refresh current HANDOFF, stage ledger and plan run log with final corrective
   commits, aggregate results and remaining work. Preserve the earlier
   [changes-required integration review](integration-review.md) as a historical
   snapshot and link this correction verdict.
3. Complete applicable release and installed-readback gates. A pushed/merged source
   branch does not establish a package release or machine update.
4. Resolve the screening error, obtain a paired baseline/candidate result, then
   evaluate native skill selection, task artifacts and total usage. Shorter metadata
   and one readiness response do not prove quality-preserving savings.
5. Execute and independently accept the remaining [family packets](family-next-wave.md),
   including owner-board requests still pending authenticated Fabric admission.

The credential matcher remains a bounded recognizer, search remains lexical and
filesystem discovery does not prove native activation. This verdict makes no
universal security, bug-free-system or zero-quality-loss claim.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded independent merged-seam verification
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — claims linked to exact source and observed controls
