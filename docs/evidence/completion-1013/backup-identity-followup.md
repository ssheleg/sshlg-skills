# MB02: canonical backup identity and exclusive publication

Base: `c69cfa4291175622ff6afb84c38159c36994cf98`. This bounded change repairs the
[B174 collision proof](managed-blocks-packet/backup-collision.json). It does not
settle machine block ownership, apply instructions, or implement a transaction journal.

## Contract

`lib/backup.js` binds new names to the SHA256 of the canonical target path. Aliases
of the same file share history; two profiles that flatten to the same historical
name do not. A moved or retargeted profile cannot inherit the former profile's
restore authority. Native realpath preserves actual filesystem case semantics: two
case spellings of one macOS file bind together without lowercasing distinct paths
on a case-sensitive volume. Lookup of missing targets uses their existing canonical parent. Save admits an
ordinary missing hierarchy as no-file; dangling leaf/parent symlinks are unknown.
Nonregular sources such as FIFOs refuse before a blocking read.

A save writes a private 0600 temporary file, flushes and reads it back, then publishes
complete bytes with an exclusive hard link. A competing same-second writer receives
a different numeric suffix. Allocation starts above the greatest observed suffix,
so retention never makes a formerly pruned slot look newer than the latest copy. The backup directory is 0700; target and directory
identity are rechecked around publication. Unsupported hard links fail backup
admission, without falling back to overwriting a destination. Only complete regular
v2 files with the exact canonical digest are pruning candidates. Legacy names,
unknown files, symlinks and pending files remain untouched. Numeric suffixes sort
numerically beyond nine. The just-created copy survives its own pruning operation. Explicit Infinity
retention preserves every recovery copy, as required by Claude pin transactions.

A private `.unverified-` marker reserves each publication before linking. Only
confirmed final byte/identity readback removes it. A caught failure, foreign inode
replacement or interruption leaving that marker makes lookup refuse automatic
restore for this target. Failed bytes, replacement inodes and markers are retained;
marked copies are excluded from pruning. No stale snapshot is selected as a guessed
recovery. Clearing such a marker requires separate explicit recovery review.

`lookup()` returns bound, absent, or legacy-unbound. `latest()` throws
`BACKUP_LEGACY_UNBOUND` when only legacy candidates exist: historical flattened
names contain insufficient ownership evidence. They are preserved for explicit
review, never guessed as a restore source. A caller retaining a previously verified
`saved.path` and its own ownership binding can still read that existing file.
The post-tool-use restore catches this refusal and reports that automatic restore
was NOT performed; it leaves the current config unchanged. Genuine absence remains
null. This does not add a legacy auto-migration or silently delete old backups.

## Watched failures and checks

The new ten-case suite fails all ten cases against the frozen base with its original
lib/hooks context ([baseline output](backup-identity-baseline.log)). The cases include
real cross-profile pruning/restore corruption and an actual hook process; mechanism
fault plants are regression checks, not ten separate production incidents.

The initial broader receipt records ten passing suites and 240 checks on the
pre-peer implementation. The [final focused receipt](backup-identity-followup.json)
records six passing suites and 179 checks with source fingerprints checked after
every suite. It includes the actual Claude pin transaction consumer (27 cases). New coverage includes twelve real concurrent
Node processes, same-second numeric ordering, stale existence checks, link failure,
profile retarget during publication, legacy refusal and preservation of foreign
entries. Final backup/apply/hooks/wait-policy consumers pass; visibility/domains/skillstore
passed at the earlier implementation cut, not claimed as a final aggregate. Owned synthetic homes and TMPDIRs were cleaned. No machine config was
written. No broad aggregate was run during the parent's serialized TP gate.

Two existing fixtures needed contract alignment: hook backup-name discovery now uses
the public canonical key; the wait-rule short-write plant now targets only its own
`.wait-rule-` file descriptor so it exercises the intended writer, rather than the
new backup descriptor. Its prior failure was an intercepted backup readback, not a
relaxed production assertion. Original incomplete-write preservation still passes.
The existing backup test contains a pre-existing literal NUL, so Git presents its
diff as binary; the source-hash receipt covers the updated file.

## Limits and handoff

Canonical rechecks detect the tested retargets; this is not an OS compare-and-swap
against an uncooperative concurrent writer, nor power-loss recovery for an entire
multi-file update. No generic journal, automatic legacy ownership decision, operator
machine apply or whole-system completion claim is made. Independent review and the
parent aggregate/integration remain next. The measured aggregate ratchet delta is
one new suite and seventeen new fixtures; shared boards/DOCMAP were not edited here.

## Independent-review corrections before acceptance

Watched red then green: default KEEP=10 same-second retention had recycled a low
slot; explicit Infinity was needed by the pinned native recovery consumer; dangling
parent aliases were misclassified absent; FIFO reads could block. Further plants
showed failed final readback left corrupt/replaced bytes eligible for restoration,
and actual macOS case aliases received distinct keys. The adjacent red logs and
final source-hashed receipt retain each boundary. These are corrections to this
candidate, not retrospective claims that its initial focused run covered them.

The admission marker narrows ordinary interruption behavior but does not claim a
power-loss durable journal, directory fsync, cross-file atomicity, or protection
against a hostile concurrent writer after successful verification. Recovery pins,
restore ownership and broader transaction recovery remain the separate MB02b task.
