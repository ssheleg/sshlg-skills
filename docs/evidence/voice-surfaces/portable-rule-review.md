# Portable punctuation rule integration packet

## Bounded source and review

The pending packet is based on `b594d04302c97e58caca03047c35ba3c852caa22`.
Its working diff SHA-256 at review is `be8b18e8bbcde9a8240c4c628c382de5e1e21c12a87cd239ea59ceabe7913a25`.
The source remains untouched while its owner holds the task.

Independent read-only review found no objective blocker. Checks actually run:
`node test/protocol_test.js` (19), `node test/routers_test.js` (44),
`node test/router_compaction_test.js` (8), and both pin checks passed.
The reviewer loaded the actual protocol module from the base commit and verified
refresh with no rendered record and with its matching record, preservation of
outside bytes and a custom operator line, and idempotence.
The block measures 18,395 characters within the explicit 18,400 budget.
`super-ux@0.61.0` is published; its manifest and gitlink name
`e7ad4e703949382eb55041f496c7c475b0f39c5c`.

These are focused review results on the pending source, not a released hub or a
full integration pass. The combined final tree still requires its own gates.

## Pending ownership condition

Owner: `r-c8d11e357525`, task `NO-EM-DASH-1018`.
Source: remote `refs/agent-sync/leases/NO-EM-DASH-1018`, observed at
`920e7f0f97a77f31c77a9cbc612a3e096e970efc`, timestamp 2026-10-18T01:56:20Z,
TTL 2,700 seconds. It expires at 02:41:20 UTC unless renewed.
Watcher: active-session observer `portable-rule-1018`, reads the local lease
on a 30 second cadence. It is a session process, not a durable scheduler.

Exact next action: recheck remote lease and main. If the owner delivers, consume
that release. If the lease expires, acquire with this run's own identity, compare
the source diff again, integrate the preserved changes on this isolated branch,
run the combined gates, merge, tag and verify publication, then update installs.
Do not impersonate the old owner or clear its lease manually.
Fallback after session loss: this packet and the main HANDOFF identify the source
and continuation; no watcher survival is claimed.

The release workflow title template now uses a colon, so the new GitHub release itself follows the punctuation rule. Historical release titles are not rewritten.

## Source refresh before integration

At 02:36 UTC the source also carried a DOCMAP ratchet update. Its new diff
SHA-256 is `34f098f854f8f99d173a7aec3277b6e498b04749469deee194b1ca8b719b4953`.
Independent read-only review confirms its marker and prose both name 2,619
fixtures, the source base plus four protocol fixtures. The site integration
base measures 2,618, so the combined expected count is 2,622; the final runner
must measure it. The source backlog attribution contains a private session
identifier; remove that attribution before public integration. No other
introduced objective blocker was found in this delta. These are review
observations, not a claim that the source owner has delivered or released it.

## Integrated candidate

The source owner published `0995a178905cfc7fe355809f745f2370cbc07fb6`
while the old lease expired. This run acquired `NO-EM-DASH-1018` through the
remote compare-and-swap and integrated that published commit into
`324d067857aaa2b8f763ea9e68cba2eec581114e`. Source PR238 is superseded by
combined PR239. The original working copy was preserved.

Final independent review found two documentation issues: a second private
attribution and an ambiguous source-only test total in `verification.md`.
Both are corrected in the combined receipt. Protocol, tests and pins match the
reviewed source; exact member release and focused 206-case member validation
passed. PR239 receives one full candidate CI run after focused local validation.
The slower aggregate local run continues in parallel and is not asserted green.
The first local pass found two issues: a stale ledger count and a residual
fixture from this run's interrupted preparation. Both were corrected; the
structural validator and residue suite then passed. The fixture was removed
only after source identity and absence of open holders were checked.
