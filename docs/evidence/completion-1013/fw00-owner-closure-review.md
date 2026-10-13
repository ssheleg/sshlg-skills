# FW00: four owner-board rows, checked against accepted source

This bounded review follows the lossless 177-row cut at hub `a8c39a4`.
It neither regenerates that inventory nor closes the whole system. All original
rows remain in their owners; this packet classifies only four requested rows.
The [source/hash map](fw00-owner-closure-review.json) records current owner cuts.

| Owner row | Observed state | Proposed next action |
|---|---|---|
| agent-stack B-159 | Partial: SEO snapshot ledger fixed, whole-repository maker guard still absent | Keep open, link the completed half, implement remaining guard in SEO |
| agent-stack B-160 | make-skill repository-wide source guard accepted; stale referral says open | Docs-only closure with owner source/independent proof |
| super-ux B-025 | Owner field, template, U086 accepted and published 0.59.3; board still says integration pending | Docs-only bounded closure and publication readback |
| super-ux B-026 | Brief fields, voice binding and qualified NN/g reference accepted and published 0.59.3; board stale | Same owner docs-only closure |

## A released package is insufficient evidence for B-159

At SEO main `5e9f6af67f9f01f70250465d63b0bb5f04983229`, the FW01 packet explicitly
covers only the negative snapshot lifecycle. `test/negatives.py` uses
`residue.workspace("negatives-snap")` and records its outcome. That does not
satisfy B-159's second request to port the repository-wide maker source guard.

An owned archive of that exact main was run through the public
`python3 -B test/validate.py`: healthy exit 0. A new, unexecuted
`scripts/fw00_temp_probe.py` containing an aliased `tf.mkdtemp()` call also exited
0. The [actual process receipt](fw00-seo-source-guard.json) retains both outputs;
the fixture and its private TMPDIR were removed. No real repository was planted.
The validator accepting this out-of-test maker proves the requested guard is
still absent for that case, regardless of unrelated green gates or publication.

Next implementation must reuse the reviewed family scanner with exact-path,
exact-count and exact-shape exemptions, retain documented lexical/language limits,
and watch outside-test, alias and exemption-drift controls fail before acceptance.
No source change or SEO board closure is made by this review.

## What supports the three proposed closures

make-skill's current `test/validate.py` walks repository Python sources, has an
any-receiver/from-alias detector and one exact attributed ledger exemption. The
owner FW01 packet retains eight public-entry regression controls, seven independent
boundary cases and its later full source gate. This closes the specific source-lint
referral, not every language, every syntactic encoding or runtime allocation.
The [0.31.2 release receipt](releases/make-skill-0.31.2.json) establishes publication
of its payload; the validator itself is repository-only source, not a shipped CLI.

super-ux's canonical scenario contract defines Owner and preserves unknown rather
than inventing assignment. Its seed and public U086 path match. The copy contract
adds Success metric, Constraints and Voice reference; a known reference binds to
the actual Admired/Refused section. B074/B075 preserve advisory migration and
unknown inputs. The NN/g paragraph identifies the dated duration-based upper bound,
not a current audience measurement. The owner packet retains 18 controls, 31
independent controls, call-removal negatives and the full source gate. The
[0.59.3 release receipt](releases/super-ux-0.59.3.json) records all 33 published files
byte-equal to accepted release source and four successful release jobs.

## Delivery contract

Before owner edits: claim the guarded owner board/ledger in isolated branches.
Preserve original requirement text and historical IDs. Link immutable source and
published proof; update only these dispositions/current publication paragraphs.
Run the relevant owner structural/docs gates, verify unchanged npm payload, obtain
independent diff review, then normal exact-head PR admission/merge. No package bump,
model/provider call, machine installation, automatic ownership assignment, or
closure of human/runtime prerequisites is part of this packet. B-159 remains open
until its missing source mechanism is separately accepted.
