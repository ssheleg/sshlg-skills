<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# Fixed-candidate release continuation — 2026-10-13

This is an operational receipt and bounded implementation, not a released version.
Base: `6113a8fa2642b7b1be2af0e4e5b7b5d6f9c2f34b`. Work is isolated on
`fix/release-watch-1013`; the completion candidate is not edited by this branch.

## Policy reconciliation

The operator's current rule moves routine complete hosted tests to 23:00
Europe/Warsaw, retaining an explicit-candidate exception. Required checks must not
be bypassed or fabricated. At the read-only remote snapshot, PR216 had no associated
checks and was blocked: main ruleset 21598267 required `validate` with strict
up-to-date behavior. Main was `022356d3479d351ccdf39135a44914be6de73ad7`.
Validate workflow ID319624917 existed and had previously executed. The candidate
had schedule plus `workflow_call`, while main still had push/PR events.

The initial recommendation to add `workflow_dispatch` correctly identified how to
run an explicit branch, but was incomplete for PR admission. Current GitHub docs
say manually dispatched workflow-job checks do not satisfy PR required checks,
even when the head SHA matches. The coordinator observed that restriction after
one accumulated candidate dispatch; this receipt does not call it a passing merge
gate. [GitHub: checks not evaluated for a PR](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#checks-from-some-workflow-jobs-are-not-evaluated),
read 2026-10-13.

The compatible explicit-candidate route is a narrow `pull_request` trigger with
`types: [ready_for_review]`, then one intentional draft-to-ready transition of a
frozen candidate. This uses an eligible genuine PR event while leaving routine
opened/synchronize/push events disabled. The coordinator owns that workflow change,
transition and exact-head merge. A main/base change requires a new candidate check;
a missing, skipped or billing-blocked run is not certified by this watcher.

After a squash merge the main commit M differs from the PR head H. Neither local
nor hosted evidence for H is reused as proof for M. The existing Pages workflow
calls the complete validate workflow on relevant main pushes (including package
and DOCMAP changes), so its natural exact-M run may provide hosted evidence. If no
eligible exact-M run exists, use the next scheduled run or a separately justified
explicit-candidate run. Scheduled work checks a default-branch snapshot and can be
delayed; it does not test unmerged branches or later commits.
[GitHub: scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
read 2026-10-13.

The remote snapshot had `RELEASE_ENABLED=true` and `PUBLISH_NPMJS=true`; only a
`github-pages` environment was returned, with a branch policy and no reviewer
rule. These are dated observations, not a guarantee against future human gates.
`pipeline.json` stage7 still requires an exact-commit local npm test, a read CI
verdict, fresh member-pin measurement and aligned submodules before tagging.

## Implemented boundary

`scripts/release-watch.js` is read-only by default. It does not dispatch workflows,
merge PRs, check out/reset branches, edit another worktree, create releases through
the API, change permissions or force-push. Execution requires both `--execute`
and an explicit plan containing `allow_tag_push: true`. No production plan was
armed or run by this implementation task.

The plan freezes repository, 40-character commit SHA, tag, run ID, workflow ID,
event, required validate job names and an exact local npm receipt. The watcher:

1. Checks both origin fetch/push URLs, clean tracked HEAD and initialized aligned
   submodules; reads the candidate's declared release-by-checks policy.
2. Re-reads the named run and jobs from its current attempt, then requires exact
   run/workflow/event/SHA identity and successful named validation jobs. It accepts
   only the existing validate or Pages workflow paths. Pending is WAIT; failure,
   skip, unknown status or wrong identity refuses.
3. Requires current remote main to equal the fixed SHA. Docs-only commits do not
   waive this equality. Any later candidate needs new exact evidence.
4. Reads a local `npm test` receipt with source commit and exit0, and verifies its
   sibling plain/gzip log against the recorded SHA256. This checks integrity and
   binding of a coordinator-owned receipt; it is not cryptographic proof that an
   untrusted caller actually executed npm.
5. Before mutation runs `python3 test/check_pins.py --strict`. Missing/unreachable
   pins and unknown exits refuse; exit2 (published but behind) and exit3 (own tag
   not yet published) remain explicit warnings, as in the existing CI contract.
6. Records intent, rechecks candidate readiness immediately before tag creation
   and push, creates one annotated tag at the fixed SHA, and pushes normally.
   Readback verifies both the annotated object and peeled target.

The state file uses a sibling exclusive lock and atomic replacement. An existing
lock is never stolen. A changed plan is refused, including while waiting. Success
is idempotent for the same annotated object. Errors after intent are recorded as
`NEEDS_RECONCILIATION`; the watcher exits rather than blindly retrying a write.
Existing local/remote lightweight tags, different targets and differing annotated
objects are never replaced or deleted. All existing refs remain available for
investigation. A retry re-reads the remote before considering another normal push.

`scripts/tag.sh` previously deleted lightweight tags and used `git push --force`.
It now delegates to the same non-rewriting helper and reads version/changelog from
the committed SHA. The helper alone does not establish CI acceptance; the watcher
adds that contract.

## Arming an exact post-merge candidate

The coordinator prepares an owned checkout at M and an external evidence directory.
Receipt shape: `source_commit`, `command: "npm test"`, `exit_code: 0`,
`stdout_sha256`, and `stdout_artifact` naming a sibling log. Do not commit a new
receipt into M and then tag its untested docs descendant.

An illustrative plan, **not an executable authorization or actual run identity**:

```json
{
  "schema": "release-watch/1",
  "repository": "ssheleg/sshlg-skills",
  "sha": "REPLACE_WITH_EXACT_POST_MERGE_SHA",
  "tag": "v1.62.0",
  "run_id": 0,
  "workflow_id": 319624917,
  "event": "schedule",
  "required_jobs": ["validate"],
  "local_receipt": "npm-receipt.json",
  "allow_tag_push": false
}
```

First run `node scripts/release-watch.js --plan /owned/plan.json --repo
/owned/candidate` and inspect its JSON result. Once the coordinator supplies real
identifiers and arms the plan, run the same command with `--execute --state
/owned/watch-state.json --watch 90` as a supervised/background task. The watcher
continues at 90-second intervals while the exact hosted run is pending; it exits
after readiness, successful tag readback or refusal. A supervisor may restart a
stopped process only after inspecting its state and any surviving lock. It does
not install its own launchd service or claim persistence across host shutdown.

Main can change concurrently between GitHub API reads and Git push. There is no
server-side transaction spanning those systems. The watcher checks before mutation
and records `main_after_push`/`main_unchanged` afterwards; it never rewrites a tag to
hide that race. A false readback requires reconciliation, not a completion claim.
The tag push starts existing release automation; package publication and installed
readback still require separate exact-tag receipts.

## Verification and handoff

Focused `node test/release_watch_test.js`: **35 checks**, exit0. Initial tests failed
with the implementation absent; the first implemented run exposed and drove a
changelog-section parser correction. Cases include wrong CI identity, old SHA even
for docs-only changes, missing/skipped jobs, pending status, malformed plan, exact
receipt hash, unarmed/default read-only CLI, moving main, existing lock, strict pin
exit handling, real annotated tag/push into a disposable local bare remote,
idempotency, unchanged lightweight/conflicting tags, pre-push state change,
remote rejection and recovery reusing the original tag object. GitHub responses
were fixtures; no real tag or hosted workflow was created.

`node --check lib/releasewatch.js`, `node --check scripts/release-watch.js`,
`bash -n scripts/tag.sh` and `git diff --check`: exit0. Whole-repository/hosted gates
were not duplicated here. This adds one discovered Node suite and 35 checks; the
coordinator owns aggregate ratchet regeneration. Next: independent review, then
integration of the helper separately from the frozen completion candidate, and
arming only when exact post-merge local/hosted evidence is available.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded release continuation implementation
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — policy sources, exact identities and observed controls
