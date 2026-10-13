# Complete fixture-count summaries

The first composed aggregate executed checks omitted by `test/run.js`'s documented summary parser. The source correction `b33a8e9` adds an executed-case counter to 29 audit scripts, prints the actual unittest result count for `queue_test.py`, and normalizes the existing mcpsecrets count. The nine separately corrected JavaScript suites retain their original counters and fixtures. No runner expression or assertion is weakened.

[Actual focused execution](focused.json) ran all 31 affected suites: 30 passed and 165 executed cases were recognized; `ctx-04.06.py` correctly still failed its stale current-pin receipt. Its counter prints no success summary on failure. [Output](focused.log.gz) is retained. Every audit-script edit reverses exactly to the prior source by removing only the counter and restoring the success string. The queue result restores exit1 for any unittest failure; positive/negative independent verification follows.

These observations do not establish a new aggregate total. The complete run after final pins and source freeze must produce `SSHLG_RATCHETS_OUT`, and DOCMAP must match that result.

The fixture total counts executed cases, not independent assertions or universally
verified capabilities. Existing NOT_RUN branches retain their disclosures; the
creative-director case can return after a missing cross-repository source notice.
That path remains distinct from substantive source acceptance. This focused run
had no creative-director missing-source notice.
