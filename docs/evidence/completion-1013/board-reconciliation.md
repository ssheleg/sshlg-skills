# Current board reconciliation procedure

`reconcile-current.py --output <new-file>` reads the committed hub and its
committed gitlinks, then retains every identity in historical `inventory.json`.
It adds newly recorded nonterminal IDs separately. `RECORDED_NONTERMINAL` includes
implemented-but-not-closed rows; it is not an open-defect count. A closed board
claim still requires an acceptance link and release/install evidence.

Independent review found two source-integrity defects in the first generator:
stripping Git output changed board hashes/line addresses, and treating every
cat-file error as absence hid unavailable object databases. Corrected generator
hashes raw bytes and resolves each commit before checking its tree. A failed
source read aborts the snapshot before opening its output. All12 current board
raw hashes matched committed bytes; an injected object-database error refused
instead of becoming an absent board. All177 original identities remained.

The first current observation is a private dry-run while release pins move; no
current completion count is published from it. Exact next task: after the frozen
release pin cut, generate a new dated JSON, reconcile owner acceptance links and
update the one current HANDOFF. Historical inventory remains unchanged.

## Committed cut at 2026-10-13 04:15 UTC

[Current board snapshot](board-current-20261013-0415.json) binds hub
`5092050c0cd52cdedf55615539782cfdd40367a4` and its committed member pins. It preserves
all177 original identities:172 recorded nonterminal and5 documented closed;
7 newly recorded nonterminal rows are separate. These are board states, not a
count of reproduced defects. Owner branches ahead of these pins are not silently
substituted for the committed release set.

[Original requirement dispositions](requirements-current-20261013-0415.json) retain
each R01–R37 verbatim with source evidence, limits and next acceptance work.
The historical observer remains the independent comparison; this later map is
coordinator reconciliation and requires another observer after the delivery cut.

The five documented closures have bounded acceptance links:

| Identity | Acceptance evidence | Remaining boundary |
|---|---|---|
| hub:B-148 | [Compatibility cut](../../reports/2026-10-13-coding-agent-compatibility/README.md) | Model/runtime quality separate. |
| hub:B-171, hub:B-172 | [Guard receipt](../guard-coverage-20261013/README.md), [installed runtime](installed-runtime.json) | Bounded recognizer; no universal program/dataflow guarantee. |
| seo-aeo-audit:B-7, seo-aeo-audit:B-22 | [Exact0.26.5 release/readback](releases/seo-0.26.5.json), owner receipt at committed board links | Local transport/fixture behavior; no live-site acceptance. |

Six new GATE rows still say release pending in their owner boards, while
[member publication/readback](member-release-readback.json) and the three
[header successors](fw02-telegram-dev-merge.json) record later delivery. This is
a stale owner-board state requiring owner reconciliation, not a fresh defect or
a reason to relabel publication as unverified. B186 remains correctly nonterminal
while the hub candidate has not been published and applied.

## Interim committed cut at 2026-10-13 09:23 UTC

[Machine cut](board-current-20261013-0923.json) binds committed source a8c39a4 and
all eleven member pins. All177 original identities survive:9 are documented closed
and168 remain recorded nonterminal;4 newly recorded nonterminal identities are
separate. This is a board-state count, not an implementation or quality verdict.
Some nonterminal rows already say implemented but retain stale integration-pending
text. Reconcile those with exact owner publication receipts before closing them;
never turn the parser's status into acceptance. TP1.94 is not yet pinned in this cut.

## Interim cut at 2026-10-13 10:17 UTC

[Committed board cut](board-current-20261013-1017.json) preserves all 177 original
identities: 12 documented closed and 165 recorded nonterminal, plus four separately
recorded new nonterminal rows. The three new closures have [owner integration and
checks](fw00-owner-merged.json) and [independent disposition review](fw00-owner-dispositions-peer.json).
No remaining-row count is called a reproduced-defect count.

[Updated original requirements](requirements-current-20261013-1017.json) preserve
all R01–R37 verbatim while separating accepted source, publication, installed state
and native outcomes. This is coordinator reconciliation before the final observer.
