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
