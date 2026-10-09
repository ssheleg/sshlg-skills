# Independent parent release review — instruction budget

Reviewer: `/root/context_review`, 2026-10-09. Candidate `c5d7f3208c7f0f34f31e5a4395603896df3de8e5`, base `402e3d3`, worktree `sshlg-skills-context-audit`.

**Verdict: ACCEPT for normal release, with publication/install receipts still separate gates. No blocking findings.**

Scope independently checked:

- Exactly ten changed paths; one gitlink changes: `skills/agent-stack`, from `07d8fc8` to `7f0c2f942ded0c8922650883db7347d2cc695577`. Other ten member catalogue records are byte-equivalent as parsed objects.
- Catalogue, README and pinned member `package.json` agree on `agent-stack 0.25.4`. Parent package and changelog agree on `1.54.4`.
- No launcher, hook, router or production runtime changes in parent diff; remaining changes are bounded evidence, source metrics and installed-byte verification utility.
- Public evidence contains no private instruction text, secret values or private project identifiers. `operator-before.json` contains only five conventional home-relative instruction paths, two SHA256 digests and a character count per path. The actual private configuration bodies remain local.
- Evidence README explicitly separates source metrics, synthetic CTX release-set simulation, pre-release checks and later installed-host acceptance. It does not prematurely claim hub1.54.4 published or installed. Its next action remains release/install readback.
- Baseline JSON independently counted: 38 skill bodies, maximum 4748 cl100k_base tokens and 413 body lines. These are source-size metrics, not runtime loading/token-use claims.
- `verify-installed.py` obtains committed parent gitlink SHAs, requires member HEAD equality, checks plugin version, hashes every Git-tracked file under each pinned skill against both intended installed channels, checks operator text outside the managed router block, and fails on mismatches. It is a task-specific receipt generator; it does not authenticate MCP or prove active session reload.

Checks run independently: parsed catalogue comparison, exact gitlink/package agreement, baseline bound assertions, public snapshot schema/path/hash assertions, `python3 test/validate.py` (PASS: 11 members/submodules), `git diff --check 402e3d3 HEAD` (PASS). Validator printed its existing “unlooked” diagnostics; this review does not turn them into verified claims.

Accepted upstream evidence supplied by root, not independently repeated in this bounded parent review: member implementation review and native/strict/house acceptance, 14 member synthetic budget controls, published member readback, parent 90 suites/1106 fixtures and all11 published-pin checks. No additional full-suite dispatch requested.

Release boundary: retain annotated-tag/publication/package-byte/installed-byte checks after normal integration; do not present this pre-release review or CTX simulation as those results. No private configuration publication is authorized by this review.
