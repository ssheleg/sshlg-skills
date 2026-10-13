# Delivery snapshot (synthetic)
Only already signature-verified `invoice.paid` renewal events enter deliver().
Raw-body verification and customer authorization happen in upstream code outside this fixture.
Database grant and mark_seen are independent commits. seen() is an unlocked read.
Two workers can concurrently deliver evt_a (invoice inv_9, units 30).
Provider reconciliation can also deliver evt_b for the SAME inv_9, units 30.
If a worker crashes after grant but before mark_seen, delivery will be retried.
The business contract is exactly one grant of 30 units for inv_9 across all these paths.
No email/external side effects exist here. Propose database keys, commit boundaries
and a test schedule; do not claim that a lock around one process covers both workers.
