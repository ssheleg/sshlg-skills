# Superseding release admission correction

Root incorrectly treated CONTRIBUTING.md Releasing as the complete pre-tag
policy. Independent reading found pipeline.json stage7 and retro R-010 require
the complete local release suite on the tagged tree and inspection of unlooked
disclosures. PR CI tree equality is real but does not satisfy those stricter
requirements; CI also omits several tail test:all commands.

The annotated v1.94.0 tag was already pushed before this correction arrived.
Run38386280311 failed at its first structural validator: v1.94.0 was absent from
the run-stamp/no-stamp ledger, a guard visible only once the tag exists.
Cancellation was attempted immediately on learning the stricter rule but the
run had already failed. The publish job was skipped; npm latest remains1.93.3.
[premature-tag-result.json](premature-tag-result.json) preserves full job states.
The public failed tag will not be moved or deleted.

A separate1.94.1 owner correction must synchronize version homes, record the
actual no-stamp disposition without inventing a completed pipeline run, exercise
the tag-visible guard locally, and pass the full suite before a new tag push.
The existing tagged guard and release workflow remain unchanged. This incident
is an execution/admission error by root, not a failure of the guard that blocked
it. The earlier incomplete local gate remains incomplete.
