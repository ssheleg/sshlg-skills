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

The actual CLI and pure parser tests in test/blocks_test.js cover13 grouped cases:
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
