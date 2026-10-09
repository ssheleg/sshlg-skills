# Post-fix pinned family census

Source parent: `c46496a6d4d2303f1003ae359468012d18244d89`. The immutable parent
supplies both skills.json and all 11 gitlinks. The candidate includes all five
reviewed owner fixes; publication and installation are separate delivery gates.

[summary.json](summary.json) records 38 skills, 542 payload files, all 38 auditor
exits zero and 721 PASS verdicts. There are no escaping symlinks. The complete
[census](census.json) records each source commit and file digest; individual
`*.audit.json` files retain every verdict. No installed skill or source checkout
was changed by collection.

## Link closure and semantic boundary

Of 1,471 Markdown links, 1,466 resolve inside their skill payload. Seven required
payload escapes from the [original snapshot](../portability/README.md) are now
local. The remaining five exceptions in [link-closure.json](link-closure.json):

- `task-pipeline/references/doctrine-map.md:21`: navigational sibling link to
  evidence-docs. Required audit procedures are local to the installed payload.
- `crypto-payments/references/testing-and-local-dev.md:10`: sibling navigation to
  stripe-billing; the method already exists locally and is not a required import.
- `task-pipeline/templates/context.md:74–76`: three explicit example paths in a
  seeded template, not files promised in the installed skill.

Host-pattern hits remain a review shortlist, not automatic defects. The five
owner changes have independent semantic reviews in [delivery.json](../delivery.json).
No native model, provider or hook acceptance is inferred from this census.

## Reproduce as a new snapshot

From the hub root, with Python 3.12+, git, the YAML parser and tiktoken installed:

```sh
python3 docs/evidence/host-compat/portability/collect.py \
  --hub . --repositories . --output /path/to/new-census
```

The collector refuses an existing output directory. It archives exact Git
objects; missing objects are fetched into an isolated temporary bare repository.
Review each audit exit and the semantic exceptions: collector exit alone is not
an acceptance gate. This run used Python 3.14.7 and tiktoken 0.14.0.
