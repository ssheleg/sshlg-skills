<sub>ssheleg skills — task-pipeline · agent-sync · evidence-docs</sub>

# B185: lossless domain settings edits

2026-10-13. Baseline `01471ca`; branch `fix/domain-lossless-settings`.
This is implementation and read-only host evidence, not an installed rollout.
The preceding [read-versus-write correction](domain-settings-read.md) remains a
historical receipt; this packet closes its valid-JSON write-format limitation.

## Reproduced cause and scope

One private project settings file parses as JSON, has a single root property,
no `enabledPlugins`, LF line endings and a final newline. The outer layout uses
two spaces but one nested array item has seven leading spaces. The previous
editor compared the whole file to two-space `JSON.stringify` output and refused
to add a plugin even though its unrelated content could be preserved exactly.
The test fixture reproduces this layout with synthetic permission text. No
private file contents or project paths are copied into this receipt or Git.

`lib/json-spans.js` first validates JSON syntax, then records object-property
spans. Decoded duplicate keys are refused, including escaped-key collisions and
nested duplicates: last-value-wins parsing is not enough evidence for a safe edit.
Traversal is bounded to depth128; deeper input is unknown/refused. JSONC/comments
are not accepted. The helper changes a named property's value or its immediate
separator, never reserializes an existing document. Strings, unrelated nested
values, raw number spelling, escaped keys, CRLF and the outer trailing newline
remain source bytes. An absent file still uses the established canonical creation
format. Existing empty-object whitespace survives add/remove round trips.

`lib/domains.js` uses that helper for `enabledPlugins` only. The existing boolean
map contract and compare-before-unset ownership rule remain. Unknown/non-boolean
maps refuse; an operator-changed value is kept. An empty map is removed unless
the ownership record says the operator previously had one. Output is parsed and
validated before it is returned to the existing backup/write path. No new write
path, host profile, ownership schema or scanner exclusion was introduced.

## Incomplete Git roots: remain conservative

The two private roots each contain a `.git` file whose `gitdir:` target no longer
exists. They remain nonempty:19 and21 other directory entries respectively.
`git rev-parse --is-inside-work-tree` exits128 for each. Their names, contents,
targets and source logs remain local-only.

These are dangling worktree metadata references, not proof that the retained
projects have no domain dependencies or will never be opened by an agent. The
existing filesystem fallback is bounded and does not replace Git's completeness
contract. There is therefore **no sound automatic exclusion** in this packet.
`domainscan.js` is unchanged; global-off refusal remains until each owner repairs
or explicitly reclassifies its root with evidence. This task neither repairs nor
deletes foreign metadata and does not claim B185's whole rollout complete.

## Red and green evidence

- On unchanged baseline implementation, the expanded pure corpus failed five
  checks: valid compact/noncanonical edits, preserved nested source, ambiguous
  duplicates, and targeted property changes. The original format gate was the
  observed failure for the valid-layout cases.
- `node test/domains_test.js`:40 checks pass. Coverage includes first/middle/last
  removal, protected operator choices, escaped property names, decoy strings,
  raw numeric spelling, duplicate keys, unknown maps and depth refusal.
- A later empty-object round-trip control exposed `{  }` becoming `{}`. It was
  observed failing, corrected by retaining the empty object's original suffix,
  then passed in the same40-check corpus.
- `node test/domains_profile_test.js`:16 checks pass. The new actual CLI case
  applies three times in an isolated HOME, compares the resulting bytes, and
  reverts to the exact synthetic original. Another case preserves unknown
  coverage for a nonempty root with a dangling gitfile. Duplicate settings
  retain global enablement and the original bytes.
- `node test/domains_e2e_test.js`:46 checks pass on final source, retaining
  ownership, backup, profile, ignored-file, interrupted-write and revert coverage.
  Two older fixtures had used valid compact JSON to force the old format refusal;
  they now use ambiguous duplicate keys to retain the intended refusal condition.
  The first transition run failed one obsolete expectation, cascading into the
  next stateful case; after correcting the fixture both pass. No implementation
  success is inferred from those obsolete failures.
- `node test/runtime_closure_test.js`:6 checks; `node test/runtime_test.js`:8
  checks, exit0. Runtime copying includes the new top-level library module.
- Syntax checks for both implementation modules and `git diff --check`:exit0.

The private valid settings file was read and edited **in memory only**. Its
unrelated parsed data stayed equal; add→undo returned every original byte; a
second disk read matched the first. The actual candidate `domains --no-usage`
preview exited0, reported that project without refusal or incomplete status,
and retained the two unknown roots. No `--apply`, foreign edit, provider call or
full aggregate suite was run by this packet.

Net suite delta: no new suite; four added pure checks and two added profile
checks, **six additional checks**. Existing behavior cases were updated, not
counted as extra tests. Parent owns DOCMAP/README counts and the aggregate gate.

## Handoff

Parent independently read the frozen implementation and reports13 preservation
and refusal controls passing, including empty/whitespace/CRLF, raw values,
escaped strings/keys, ambiguity, invalid maps and compare-before-unset. Bind that
review to the pushed commit before integration. This is a bounded source verdict,
not a native or installed acceptance result.

Next: integrate under the parent release candidate, run the coordinated aggregate,
publish, then use the published launcher for owned domain apply/readback. Expect
the format refusal to disappear; expect the two incomplete roots still to retain
globals. Address those roots only through their owners. A result that silently
drops them from coverage is a regression, not successful completion.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded B185 correction.
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — isolated task lease.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — red/green and private-source boundaries.
