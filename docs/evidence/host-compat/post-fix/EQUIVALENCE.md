# Reuse historical audit evidence only after complete payload equivalence

`verify-equivalence.py` compares the captured current hub HEAD with the immutable
census blob at an explicit baseline commit. It reads both hub manifests and
gitlinks from Git, validates every historical census path/hash/size against the
old member commits, then compares complete skill file sets, hashes, sizes and Git
modes with the current member commits. Baseline modes come from Git trees, since
the census does not record them. Missing objects, missing or duplicate identities,
empty payloads, added/deleted/changed files, mode changes and payload symlinks fail.

The scope is the advertised skill directories, including every tracked file
beneath each directory. Plugin manifests outside those directories may differ.
This does not establish plugin equivalence, installation or native runtime
acceptance. The historical 721 audit verdicts are **not rerun**: the receipt emits
`audit_not_rerun: true` and identifies both the historical and current commits.

The helper uses only Git object reads, with replacement objects and lazy fetching
disabled. It performs no checkout, network request, install or auditor execution.
Only the requested output receipt is written, after success; a failure leaves an
existing receipt untouched, so callers must check the process exit and the receipt
identities. Python 3.9+ and Git supporting `--no-lazy-fetch` are required.

From the hub repository root:

```sh
python3 -O docs/evidence/host-compat/post-fix/verify-equivalence.py \
  --hub /path/to/hub --repositories /path/to/hub \
  --baseline 8af76fc67677ad1f3fd0105ea13d2482bf23962d \
  --output /path/to/new-equivalence-receipt.json
python3 docs/evidence/host-compat/post-fix/verify-equivalence-fixtures.py
```

`--repositories` contains repositories under the member `dir` paths recorded in
the hub manifest. Both historical and current member objects must already be
available. Their working trees are irrelevant to the comparison.

Recorded check on 2026-10-10: the first command, using the local host-compat hub
and repository paths, exited 0 at current hub
`a15c855f3849e947e5d629acb8a22e5518e557a1`: 11 members, 38 skills, 542 files.
The census source hub was `c46496a6d4d2303f1003ae359468012d18244d89`; its blob
SHA-256 was `d0421f863df9c5d50816d2dc0ab2e121a4fa77a4fad56453c2f2a7530dec3d3e`.
This is a dated source observation, not a claim about a later HEAD.

The fixture command exited 0: 15 cases, each executed in normal Python and with
`-O`. It creates and removes its own tiny Git repositories. Negative cases cover
added, deleted and changed files, mode changes, symlinks, missing objects or
members, empty/duplicate rows or file lists, and tampered baseline path/hash
coverage. Every failing CLI run also proves an existing receipt remains unchanged.
These focused checks are evidence helpers, outside the npm test discovery tree.
