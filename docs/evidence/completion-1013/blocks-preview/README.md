# MB-01 read-only blocks preview

Adopts the independent [B174 packet](../managed-blocks-packet/README.md) for a
read-only command only. The proposed write/journal APIs and ownership migration
remain unimplemented. Router/wait consent and foreign ownership do not change.

Implementation: lib/blocks.js parses paired markers and the known nested router
grammar, reports uncertain syntax, reads at most1MiB plus one byte, compares
file identity before/after reading and canonical parent identity, refuses target
symlinks and unsupported file kinds. Metadata omits bodies and override paths.
Local diff requires an explicit source and one host, selects one matching outer
block, and makes no changes. This is a lexical marker inspection, not Markdown
semantic ownership, a lock, a snapshot across files or comprehension proof.

The actual CLI and pure parser tests in test/blocks_test.js cover 14 grouped cases:
mixed owners/nested routers, duplicate/crossed/unclosed/near markers, malformed
UTF8, optout, missing/permission/size states, real target replacement and parent
retarget, no-write byte/mode/mtime observation, confined override scope and local
diff privacy. Before implementation the suite failed because the module was
absent. Focused after-run passes; aggregate/independent/installed remain pending.
The real Codex metadata preview reads21 markers with valid syntax; this does not
authorize any of them or establish a runtime writer receipt.

Next: independent review including adversarial parser/selection controls; then
compose with the hub candidate, run aggregate and publication/installed gates.
No machine instructions or metadata were changed.


## Independent bounded review

Reviewed exact `3d0bb361385474f2123aeb599fbb7f4565eac673` after two findings at
initial source `878ae3f3c38d48b080d35ae744827c623c2ae4c6`:

- Actual isolated CLI input `<!-- SSHLG:ROUTERS: BEGIN -->` (and whitespace
  before and after the colon) initially exited 0 with no markers/issues. The
  correction recognizes bounded whitespace/lowercase near-markers as uncertainty,
  preserving ordinary non-marker comments. Actual CLI negatives now exit 1.
- Prefix line rescanning made 10,000 unique valid pairs (437,780 bytes) take
  8,303ms in the reviewer run. Indexed newline positions preserve exact ranges;
  the same input took 143ms in the subsequent reviewer run. These are local
  observations, not a timing threshold or general benchmark.

The reviewer read the implementation and both corrections, reran the final 14
focused groups, and passed 16 extra controls covering whitespace BEGIN/END/OPTOUT,
ordinary comments, LF/CRLF ranges and the 10,000-pair inventory. Profile selection,
metadata privacy, source/target selected-block boundaries and replacement/parent
retarget refusal were reviewed; the suite's actual no-write CLI cases passed.
No remaining bounded blocker was identified. No full suite was duplicated.

This verdict covers the read-only lexical interface. It does not authorize a writer,
prove atomic multi-file snapshots, consume future journal schemas, or establish
installed/native behavior. The original two findings remain recorded above.
