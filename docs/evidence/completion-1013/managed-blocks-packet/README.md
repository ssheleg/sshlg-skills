---
report:
  id: sshlg-skills/2026-10-13-managed-blocks-packet
  title: "Managed blocks inventory and proposed implementation contract"
  kind: research
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: draft
  valid_until: 2026-10-20
  summary: >-
    Read-only six-file marker inventory and B174 implementation contract.
    Ownership of REPOSITORY-HANDOFF remains undecided; no machine writes or B180 changes.
  sources:
    - name: Frozen hub source
      url: https://github.com/ssheleg/sshlg-skills/commit/bca35fb74e05ca4fafba594ca317664285fe8636
      read_at: 2026-10-13
    - name: Exact source manifest
      path: sources.json
      read_at: 2026-10-13
    - name: Read-only metadata snapshot
      path: inventory.json
      read_at: 2026-10-13
  produced_by:
    agent: Codex visibility_review
    task: OBS-05 B174 packet
  consumers: [sshlg-skills finalization]
---

<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# OBS-05 / B-174: managed blocks implementation packet

**Status: proposed contract and read-only evidence, not an implemented command or final closure.**
Prepared 2026-10-13. The next task is MB-01 below. No machine instruction, owner board,
consent setting, existing backup, journal or plugin was changed by this packet.
B-180 is excluded. REPOSITORY-HANDOFF ownership remains an operator decision.

## Objective and source authority

B-174 asks for a common marker, backup and journal convention and a `blocks` preview
that can inspect foreign blocks without writing them. The frozen hub cut is
[`bca35fb74e05ca4fafba594ca317664285fe8636`](https://github.com/ssheleg/sshlg-skills/commit/bca35fb74e05ca4fafba594ca317664285fe8636).
[sources.json](sources.json) binds each reviewed file to a Git object SHA-256.
The original-goal observer's OBS-05 separated this autonomous source work from the
remaining human ownership decision; see [observer-pre-release.md](../observer-pre-release.md).

The Observatory dossier at
[`288486b3`, §3.7–3.8](https://github.com/ssheleg/project-observatory/blob/288486b3b19e2c0d6fac623237d512ed36a0a3e5/docs/runs/2026-10-12-release-iteration-1/dossiers/MN-method-family-public.md#37-managed-blocks--one-convention-either-tool-previews-the-other-inb-005)
is provenance, **not a grant**. It calls renaming handoff to OPERATOR “decided”.
Current hub B-174 explicitly says no tool owns it without the operator's word.
This packet follows the hub/operator boundary: neither rename nor writer adoption
is authorized here. An SSHLG prefix alone does not grant the hub every block.

Two more dossier details are proposals rather than implemented facts: its nested
backup directory layout differs from current flat `lib/backup.js` names; its
`instructions preview/install/uninstall` adapter is absent from the frozen
Observatory `tools/ops/agent_updates.py` source. The local installed adapter's hash
comparison is recorded separately in sources.json; it is not proof of an installed
future adapter. Cross-project delivery must use the reachable authenticated
project board; this packet does not send a board message or edit Observatory.

## Read-only observation

[collect.py](collect.py) reads only six named global instruction destinations,
honoring the four documented host-root environment variables. It records aliases,
file mode/hash/byte count and lexical marker positions, never instruction bodies.
It has no write, recursive scan, policy read, backup, subprocess or network path.
Its lexical inventory is **not** the production parser, Markdown validation,
current consent proof, or a complete inventory of all instruction mechanisms.
Unmarked prose, repository instruction files, settings injections, native skills,
other Cursor files and unsupported hosts are outside this measured scope.

[inventory.json](inventory.json) records five READ files and one ABSENT file:

| Surface | Observed outer marker pairs | Write authority from this observation |
|---|---|---|
| Claude CLAUDE.md | SSHLG:ROUTERS; SSHLG:REPOSITORY-HANDOFF; OBSERVATORY:AGENT-UPDATES | none |
| Codex AGENTS.md | same three | none |
| Gemini GEMINI.md | SSHLG:ROUTERS; SSHLG:REPOSITORY-HANDOFF | none |
| Pi AGENTS.md | SSHLG:ROUTERS | none |
| Cursor sshlg-routing.mdc | SSHLG:ROUTERS | none |
| Cursor sshlg-wait.mdc | file absent | none |

There are ten outer marker pairs and ninety router subregion pairs in this cut.
The subregions (MAP/PROTOCOL/TABLE and fifteen ROUTER entries per file) belong
inside the router document, not to independent competing writers. No marked
wait-rule block was observed; this does not say whether unmarked wait prose exists
or whether `rules.wait` is enabled. Timestamps/hashes are a snapshot, not a lock.

## Existing mechanisms and seams

References below are at the frozen source cut, not a moving working tree.

| Source | What exists / what the new work must preserve |
|---|---|
| lib/routers.js:15–24,79–118 | Legacy marker parser, opt-out and malformed outer-block refusal. Preserve existing spelling and byte ranges. Marker previews must never execute embedded command hints. |
| lib/apply.js:34–91 | Claude/Codex/Gemini/Pi root precedence and capability verdict; Cursor is separate. Use hostRootVerdict, respect selected scope, never create a host to invent installation. |
| lib/apply.js:119–146,159–231 | Backup through protect() before host writes and dry-run. It does not supply the proposed generic journal or filesystem CAS. |
| lib/backup.js:35–180 | Existing flat private backups, byte readback and ten-copy pruning. Reuse protect(), do not create a second competing backup path. Pruning is currently unaware of pending journal references. |
| lib/wait-rule-policy.js:12–72 | Strict snapshots, non-stealing lock, compare-before-rename, temporary-file readback and target readback. Its own comment explicitly disclaims CAS against arbitrary writers. |
| lib/wait-rules.js:12–25,40–71,73–106 | Known rendered segments, profile binding, consent, explicit pending record before host write. Do not weaken these checks when introducing shared journaling. |
| lib/migrate.js:63–64; hooks/post-tool-use.js:126–154 | Other consumers of router markers/backups and restore protection. A protect() change requires compatibility tests here, not only the new command. |
| Observatory tools/ops/agent_updates.py + agent-updates-instructions.md at 71fae892 | Separate instruction source and existing notice tool. New adapter delivery requires that owner's integration, synthetic tests and explicit receipt; no implicit remote acceptance. |

`protect()` also serves settings and hooks outside managed blocks. A change must
retain its return contract (`saved`, `no-file`, `backup-failed`) and existing
callers' behavior. Do not globally require a block ID from legacy callers.

## Proposed managed-blocks/1 contract

[contract.json](contract.json) is a **draft field/state contract**, not a JSON Schema
validator and not a published interoperability version. MB-01 must translate it
into strict executable schemas with unknown-version rejection and duplicate-key
handling before any consumer relies on it. Inspection and operation records are
separate: a successful read is never an authorization receipt.

1. **Recognition versus ownership.** Parse `OWNER:NAME:BEGIN/END` with the existing
   descriptive BEGIN tail supported. Retain legacy plain BEGIN and OPTOUT forms.
   Detect duplicate, crossed, nested-invalid, unpaired and differently formatted
   near-markers; list uncertainty without repairing. Known router subregions are
   one nested grammar. Unknown outer blocks are inspectable, never writable by
   the hub. A foreign block within a hub region must refuse a whole-region rewrite
   unless the owning parser demonstrably preserves it byte for byte.
2. **Preview interface.** Proposed `blocks [--agent <host>] [--json]` lists metadata;
   `blocks diff OWNER:NAME --from <local-file> --agent <host>` prints a local diff.
   These are future syntax, not commands available today. Reject ambiguous multiple
   targets unless selected. Do not fetch URLs, run commands, interpret source
   instructions, create directories, initialize consent, take write locks, copy
   backups or append journals during preview. Missing and unreadable remain
   distinct; partial inspection returns nonzero plus per-target states. Diff text
   stays local and is never automatically committed or sent to analytics.
3. **Admission.** A registered adapter maps a marker to an exact source revision,
   parser and existing consent/ownership policy. Host aliases are not identities:
   bind canonical parent/profile and basename, refuse symlink target/parent
   retargeting and unsupported file kinds, preserve mode. Operator edits,
   unreadable inputs, missing receipts and unknown schema versions refuse writes.
   Existing router consent does not authorize wait rules, foreign blocks or a new
   profile. Automatic update handles only already authorized and owned targets.
4. **Backup compatibility.** Keep `~/.sshlg-skills/backups/` and the existing flat
   files readable. Introduce a collision-resistant canonical target identity and
   exclusive backup creation before adopting a new layout; explicitly test paths
   that sanitize to the same key and concurrent same-second copies. The two-profile aliasing case
   is reproduced in the follow-up below; concurrent creation remains a prospective
   test, not a claim of reproduced corruption. Never move,
   delete or silently rename legacy machine backups. Readback must match before
   mutation. Private directory 0700, files 0600; failure means no target write.
   Pin every recovery-referenced backup before ordinary pruning can remove it;
   remove a pin only after terminal verification or explicit resolved recovery.
5. **Journal.** Proposed `backups/blocks.jsonl` is a private append-only operation
   stream, not a mandatory ownership registry every project must update. Use a
   journal append lock and fixed ordering with per-target locks, unique operation
   IDs, monotonic per-operation sequence, hash-linked records, strict schema and
   durable flush. Do not claim cryptographic authenticity from a plain hash chain.
   Malformed/truncated tail blocks new mutations until explicit recovery; never
   truncate or silently skip it. Record PREPARED before outward effects, then
   BACKUP_VERIFIED, then durable WRITE_INTENT before replacement. After byte/mode/
   profile readback append VERIFIED. A journal failure after write intent remains
   RECOVERY_REQUIRED even if bytes may have landed. Use existence separately from
   empty-file hash. Journal bodies never contain file contents or credentials.
6. **Recovery.** Restart reads pending operation and actual current bytes: exact
   before snapshot permits a no-write resolution, exact after snapshot plus valid
   backup/profile permits committed classification, any third content remains
   unresolved. A request to restore makes a new protected operation on current
   bytes, never an automatic rollback. After operator edits or profile changes,
   refuse and preserve evidence. No replay merely because a subprocess timed out.
   Per-target results expose successful earlier targets and failed/unattempted
   later targets; do not call a multi-file batch atomic or a partial run success.
7. **Foreign interoperability.** Observatory's adapter must obey the same schema,
   private modes, preview/readback, locking and backup retention contract with or
   without the hub installed. It owns only its explicitly admitted marker. The
   hub may list its metadata and local diff; it never installs/uninstalls it.
   REPOSITORY-HANDOFF remains OPERATOR_DECISION_REQUIRED and byte-preserved even
   if another source file says a rename is decided.

## Implementation sequence and independent acceptance

| Task | Context / bounded files | Required evidence before advancing |
|---|---|---|
| MB-01 — read-only first | lib/blocks.js new pure parser + schemas; bin/sshlg-skills.js command adapter; test/blocks_test.js and real CLI fixture. Use current hostRootVerdict/routers parser contracts; no mutation flags. | Healthy mixed-owner and nested-router fixtures; duplicate/crossed/partial markers; unknown Unicode/malformed UTF-8; missing vs EACCES; env roots, symlink retarget, selected-host confinement; byte/mode/mtime proof of zero writes, no backup/journal dir created. Public metadata must not expose fixture secrets; local diff preserves outside bytes. |
| MB-02 — protect/journal substrate | lib/backup.js plus new journal module; protect() compatibility adapter; private state contract docs. Keep non-block callers unchanged. | Disk/write/readback failure plants at every state; same-second/concurrent and same-sanitized-key backups; directory/file modes; non-stealing locks; interrupted/truncated journal; recovery pin survives >10 backups; missing≠empty; restore failure and intervening-edit preservation. One process killed after each durable boundary; readback explains every target effect. |
| MB-03 — owned writers only | Router and wait writer adapters, preserving their different consent models and existing receipts. No blanket rewrite of instruction files. | Before/after entire-file byte diffs prove foreign/unmarked prose intact; malformed/edited/unknown receipt and relocated profile refusal; source/body mismatch; dry-run and --no-claude; automatic update cannot expand target scope. Re-run relevant existing backup, apply, migration, hooks and wait-rule suites; then one aggregate gate. Independent reviewer reproduces at least one interruption and one foreign-edit refusal. |
| MB-04 — foreign adapter | Owner project Observatory implements its instructions preview/install/uninstall against frozen spec. Board request only when authenticated route exists; local packet prep is autonomous. | Exact source/owner branch, synthetic HOME install/revert with preserved foreign blocks, protected backups and journal readback, independent peer, normal owner integration. Not fulfilled by this hub packet or the installed tool's presence. |
| MB-05 — migration/ownership decision | Separate preview of legacy handoff/backup names, no automatic execution. B174 ownership resolution belongs to operator; B180 not included. | Record actual operator choice and its scope, reviewed source, exact local diff, backup/journal proof and post-write byte readback. Until then preserve unknown blocks; MB-01–03 remain independently executable. |

Required synthetic test matrix is a work contract, not a claim that those tests
already passed. Local packet checks only cover collector privacy/scope and source
binding; the implementation remains NOT_RUN. Hosted/package/installed acceptance
will follow the existing release policy, with no new dispatch or release here.

## Handoff and verification

Run `python3 docs/evidence/completion-1013/managed-blocks-packet/check.py` from a
checkout containing the frozen Git objects. Add `--observatory-repo <owner-checkout>`
to verify the three external source hashes; without it those checks explicitly skip.
The recorded [checks.json](checks.json) has 29 passing controls, including all 12 source
hashes with zero skipped sources. The check uses temporary synthetic
HOME fixtures only and validates the stored inventory/source references. Refreshing
inventory is an explicit new evidence snapshot; do not overwrite this historical
file while claiming its old timestamp. Collector stdout may be saved to a new cut.

No production code change, provider call, machine apply, cross-project write,
operator ownership decision or B-174 closure is included. Next agent starts MB-01
in an isolated implementation branch, reads the source map, plants failing real-CLI
controls before implementing, then submits the exact frozen diff for independent
review. Coordinator can adopt this packet without adopting its proposed write API.

---

Skills used: task-pipeline for task context and delivery order; evidence-docs for
source binding and explicit distinctions between proposal, observation and proof.

## Read-only follow-up: backup identity collision reproduced

The initial packet identified sanitized-path aliasing as a prospective test.
The subsequent [frozen-source witness](backup-collision.js) now reproduces it with
two valid profile roots: `~/profiles/a/CLAUDE.md` and
`~/profiles_a/CLAUDE.md`. Both map to `profiles_a_CLAUDE.md` in keyFor().
Using default KEEP=10, one first-profile save plus ten second-profile saves
deletes the first profile's only backup; latest(first-profile) resolves to the
second profile's bytes. Both target files remain unchanged by this experiment.
[backup-collision.json](backup-collision.json) binds the exact source hash and
observations; the test cleans only its owned synthetic directory.

This is a backup isolation defect, not evidence that the real machine lost data
or that a restore ran. MB-02 must give new backups an unambiguous canonical target
identity and make latest/pruning honor it. Legacy ambiguous flat names must not
be guessed into ownership, cross-pruned or silently restored; preserve them as
unknown historical candidates. Test same basename in the two roots, default
retention, concurrent creation and migration compatibility. This packet still
contains no product fix and does not close B-174.
