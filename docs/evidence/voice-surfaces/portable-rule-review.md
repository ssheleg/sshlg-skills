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
The block measures18395characters within the explicit18400budget.
`super-ux@0.61.0` is published; its manifest and gitlink name
`e7ad4e703949382eb55041f496c7c475b0f39c5c`.

These are focused review results on the pending source, not a released hub or a
full integration pass. The combined final tree still requires its own gates.

## Pending ownership condition

Owner: `r-c8d11e357525`, task `NO-EM-DASH-1018`.
Source: remote `refs/agent-sync/leases/NO-EM-DASH-1018`, observed at
`920e7f0f97a77f31c77a9cbc612a3e096e970efc`, timestamp2026-10-18T01:56:20Z,
TTL2700seconds. It expires at02:41:20UTC unless renewed.
Watcher: active-session observer `portable-rule-1018`, reads the local lease
on a30second cadence. It is a session process, not a durable scheduler.

Exact next action: recheck remote lease and main. If the owner delivers, consume
that release. If the lease expires, acquire with this run's own identity, compare
the source diff again, integrate the preserved changes on this isolated branch,
run the combined gates, merge, tag and verify publication, then update installs.
Do not impersonate the old owner or clear its lease manually.
Fallback after session loss: this packet and the main HANDOFF identify the source
and continuation; no watcher survival is claimed.
