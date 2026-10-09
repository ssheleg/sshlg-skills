# Independent delivery review — 2026-10-09

Reviewer: delegated `census_sc2`, independent of the hub verifier and delivery
document implementation. Scope: the receipt-only follow-up to source
`259594eeee630ecdf239756a7c2ac2bc488c16ca`, including
[verify-runtime.py](verify-runtime.py) and [DELIVERY.md](DELIVERY.md).
This is not a new review of every installed skill or a model behavior test.

## Initial review: changes requested

The initial verifier used an assertion for its final failure exit. An isolated
temporary Git repository with four managed files reproduced the following:

| Fixture invocation | Mismatches | Exit |
|---|---:|---:|
| Matching runtime, ordinary Python | 0 | 0 |
| Changed runtime file, ordinary Python | 1 | 1 |
| Changed runtime file, `python3 -O` | 1 | 0 |

`PYTHONOPTIMIZE` can produce the same optimized execution. The last row is a
verification correctness defect: failure must use an explicit nonzero exit,
independent of assertions. The fixture changed only a temporary fake HOME and
repository; it did not modify the installed runtime.

The initial verifier also accepted mutable `HEAD` and recorded it literally as
`source_commit`. Resolve the requested source to one immutable commit before
enumerating and reading files, and record that resolved commit. This prevents a
moving reference from mixing sources and makes the receipt independently usable.

## Coverage and evidence boundaries

- The selected managed set matches [lib/runtime.js](../../../lib/runtime.js):
  recursive JavaScript files under `hooks` and `lib`, plus `skills.json` and
  `package.json`. The runtime intentionally preserves unknown files; this check
  establishes equality of managed files, not equality of the complete directory.
- The initial delivery document labels package publication and installed readback
  pending. Its character counts are not presented as billed-token savings, and
  selected host tests are not presented as universal semantic or GUI acceptance.
- The make-skill release receipts have their own commit-addressed owner and scope;
  their native file equality is not new model execution evidence.
- Historical receipt files must remain unchanged. This reviewer does not change
  the verifier or delivery document, publish packages, or invoke a model.

## Corrected verifier: accepted

The owner replaced the assertion with explicit `SystemExit` and resolves the
source once with `git rev-parse --verify <source>^{commit}`. Independently reviewed
verifier SHA-256:
`4dd00cf619d985c55886c7281540592fb8ade484e2c9262fc7a94062d34e959d`.

Reran five isolated cases against that exact verifier:

| Fixture | Expected and observed |
|---|---|
| Four matching managed files | Exit 0; four comparisons true |
| One changed file, ordinary Python | Exit 1; one comparison false |
| One changed file, `python3 -O` | Exit 1; one comparison false |
| Matching files, source argument `HEAD` | Exit 0; receipt records resolved 40-character SHA |
| One missing managed file | Exit 1; no new receipt written |

All five passed. Each written receipt records the fixture's exact commit. The
temporary fixture repository and fake HOME were removed after the checks.
No installed runtime mutation or model call was needed.

## Independent release and installed readbacks

- Queried GitHub run `37942062863` independently: completed success, all three
  jobs successful, exact head `259594eeee630ecdf239756a7c2ac2bc488c16ca`.
- Reran the canonical registry verifier with `python3 -E`, so environment-driven
  Python optimization cannot disable its checks. All **58 tarball files** match
  that source; registry `gitHead` and SHA-512 integrity match. The complete
  independent result equals [registry.json](registry.json).
- Reran the corrected runtime verifier against that exact commit: **54 managed
  files, zero mismatches**. The complete independent result equals
  [runtime-readback.json](runtime-readback.json).
- After the official updater completed, independently hashed the entire native
  make-skill `0.29.1` plugin: **25 files**, with the same file set and bytes as
  `plugins/make-skill` at source
  `2f5a1ad24c2145bcb72c601b3bd899f942a3acca`. Its canonical tree hash remains
  `c57430bfd1f9c5bce14758bf43c7e1de4762a1147d93f962e81ef5a7485aa2a2`.
- The shared make-skill skill payload contains **19 files**, with the same file
  set and bytes as both the released source skill subtree and native skill
  subtree. Its tree hash is
  `266bb313f1f8879ea9060d103d9ca3fc738876d9de0e5c81dc00d5c6a9138b1e`.
  Both tree hashes use SHA-256 of Python `json.dumps(relative_path_to_sha256,
  sort_keys=True).encode()`, with default separators.
- A fresh read-only native `skills/list(forceReload=true)` returned **566 total,
  537 enabled, zero errors**. The native make-skill `0.29.1` entry is enabled;
  the shared plain entry is disabled. The full set of **29 disabled paths** is
  identical to the original post-exclusion receipt. This is roster evidence,
  not a model turn or GUI refresh test.

The independent installed checks ran after updater completion on 2026-10-09;
make-skill hashing began at 14:22:08 UTC. Full machine paths and roster metadata
remain private. No installed payload or configuration was modified by this
reviewer. The final family, router and delivery-document review follows below.

## Final delivery review: accepted within the recorded scope

Independently reran the owner's family and router readback scripts, directing
output to new private receipts. Both complete results exactly equal the public
[family receipt](family-payload-readback.json) and
[router receipt](router-preservation.json): **38 skills in two channels, 1074
file comparisons, zero mismatches; four exact released router blocks and six
unchanged outside-block regions**. The parent pins and installed Claude plugin
versions were checked. Family comparison covers every tracked source payload
file; it does not assert the absence of unrelated extra installed files.

The installer log SHA-256 matches [install.json](install.json), and the log
contains the reported `71 of 71 steps, all green` completion. The process exit
code is the owner's receipt; this reviewer did not rerun installation. Child
skills-CLI output also records 38 unsupported global installations each for Eve
and PromptScript. Those hosts are outside the measured skills-CLI shared payload
and Claude plugin acceptance; green parent steps do not establish those hosts.

[native-readback.json](native-readback.json) records this reviewer's allowlisted
native/shared readbacks with relative payload hashes, counts and discovery
outcomes. Private helper output is retained by the private report owner. No
machine configuration, absolute machine paths or credentials are copied into
the public receipt.

Reviewed the final DELIVERY, entry README and HANDOFF: source merge, package
publication, installed files, discovery and model behavior remain distinct.
The next visibility-profile task preserves discoverability and the source
corpus. **No unresolved blocking review findings remain.** This acceptance does
not establish GUI refresh, successful unsupported-host installation, semantic
quality of every skill, or model behavior after the final package update.
