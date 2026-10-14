# Managed blocks (managed-blocks/1)

Several tools keep text in the same global instruction files: the hub's routing block,
its opt-in wait rule, Observatory's repository-update notice. Those files usually have
no version control, so every tool that writes one must leave it recoverable and must
never touch another tool's text. This page is the one convention for that. The code
is `lib/blocks.js` (reading) and `lib/blockwriter.js` (writing); the tests are
`test/blocks_test.js` and `test/blockwriter_test.js`.

## Files in scope

| Host | File (default root; override variable) |
|---|---|
| `claude` | `~/.claude/CLAUDE.md` (`CLAUDE_CONFIG_DIR`) |
| `codex` | `~/.codex/AGENTS.md` (`CODEX_HOME`) |
| `gemini` | `~/.gemini/GEMINI.md` (`GEMINI_CONFIG_DIR`) |
| `pi` | `~/.pi/agent/AGENTS.md` (`PI_CODING_AGENT_DIR`) |
| `cursor` | `~/.cursor/rules/sshlg-routing.mdc`, `~/.cursor/rules/sshlg-wait.mdc` |

`blocks` reads all of them. The writer writes the first four only: Cursor keeps one
rule file per block, so there is no shared file to manage.

## The fence

```
<!-- OWNER:NAME:BEGIN -->
…the block's text…
<!-- OWNER:NAME:END -->
```

- `OWNER` is the owning tool's prefix in capitals (`SSHLG`, `OBSERVATORY`); `NAME` may
  carry further `:`-separated parts (`SSHLG:RULE:wait-is-not-a-stop`).
- A `BEGIN` marker may carry a descriptive tail before `-->`; `END` and `OPTOUT` carry
  nothing. `<!-- OWNER:NAME:OPTOUT -->` on its own records that the operator declined
  that block; no writer adds it back.
- Blocks do not nest, except the router subregions (`SSHLG:ROUTER:<id>`,
  `SSHLG:ROUTERS:MAP|PROTOCOL|TABLE`) inside `SSHLG:ROUTERS`.
- A duplicate, crossed, unclosed or stray marker, a near-miss spelling (spaces around
  a colon, lower-case `begin`), or invalid UTF-8 makes the whole file malformed. Readers
  report it; writers refuse the file until a person fixes it. Nothing is repaired
  automatically.

## Block names and their owners

| Block | Owner | Writer |
|---|---|---|
| `SSHLG:ROUTERS` (and its subregions) | sshlg-skills | `npx sshlg-skills install` / `update` (`lib/apply.js`) |
| `SSHLG:RULE:wait-is-not-a-stop` | sshlg-skills | `npx sshlg-skills rules` (`lib/wait-rules.js`), opt-in |
| `SSHLG:REPOSITORY-HANDOFF` | **undecided** | none: which tool owns it is the operator's decision (B-174), and until it is recorded no writer touches the block |
| `OBSERVATORY:AGENT-UPDATES` | project-observatory | its `agent_updates.py`, through `npx sshlg-skills blocks install --owner OBSERVATORY` |
| any other `OWNER:NAME` | the tool named by `OWNER` | that tool, through `blocks install --owner OWNER` |

The table lives in code as `REGISTRY` in `lib/blocks.js`; `blocks --json` prints each
block's `registered` owner and writer. Every other `SSHLG:` name is reserved: a new hub
block gets a row here and its own writer first. A marker in a file never grants
permission to write it.

## Reading: `blocks` and `blocks diff`

`npx sshlg-skills blocks [--agent HOST] [--json]` lists markers with line ranges,
syntax state, claimed owner, registered owner and writer admission. It reads metadata
only: no block text is printed, and nothing is created — no directory, lock, backup or
journal. Missing files are `ABSENT`; unreadable, oversized, symlinked or concurrently
changed files are reported as such and make the exit code 1.

`npx sshlg-skills blocks diff OWNER:NAME --from FILE --agent HOST` prints the selected
block's current and proposed text. It writes nothing.

## Writing: `blocks install` and `blocks uninstall`

```
npx sshlg-skills blocks install   OWNER:NAME --owner OWNER --agent HOST --from FILE [--apply] [--json]
npx sshlg-skills blocks uninstall OWNER:NAME --owner OWNER --agent HOST            [--apply] [--json]
npx sshlg-skills blocks resolve   OPERATION-ID [--json]
```

- **Preview is the default.** Without `--apply` the command prints the diff (or, with
  `--json`, the before/after hashes) and writes nothing at all.
- **Install** takes the block from `FILE`, a local file holding exactly one complete
  block with the same id. If the target has that block, only its bytes from `BEGIN` to
  `END` are replaced. If it does not, the block is appended after one blank line. If the
  target file is missing but its host directory exists, the file is created (mode 644);
  a missing host directory is refused — the writer never installs a host.
- **Uninstall** removes the block and the newline after it, and the blank separator an
  install added at the end of the file. Install followed by uninstall returns a file that
  ended with a newline to its exact original bytes.
- **Every byte outside the selected block is preserved**, and the file keeps its mode.
- **Nothing to do is not an operation:** an install of identical text or an uninstall of
  an absent block exits 0 and writes no backup and no journal line.
- **Exit codes:** 0 done or nothing to do, 1 refused (the reason names a code, e.g.
  `OWNER_MISMATCH`, `OPTED_OUT`, `TARGET_MALFORMED`, `RECOVERY_REQUIRED`), 2 bad arguments.

### Admission

The writer refuses: the hub's own blocks (they have dedicated writers with their own
consent); `SSHLG:REPOSITORY-HANDOFF`; any other `SSHLG:` name; a call without `--owner`
or whose `--owner` differs from the marker's prefix; an opted-out block; a malformed
target; a symlinked or unreadable target; a source that is remote, unreadable or not
exactly one matching block. `--owner` stops one cooperating tool from writing another's
block by mistake. It is not authentication.

### Backup

Before the write, `apply.protect()` copies the file to `~/.sshlg-skills/backups/`
(directory 0700, copies 0600), the same place and naming as every other hub write
(`lib/backup.js`). The copy is read back and must equal the previewed bytes; a failed
copy cancels the write. The backup's name and hash go into the journal.

### Journal

`~/.sshlg-skills/managed-blocks/journal.jsonl` (directory 0700, file 0600) is
append-only. Each line is one JSON record, `schema: "managed-blocks-journal/1"`:
`operationId`, `sequence`, `state`, `at`, `op`, `owner`, `markerId`, `target` (host, path
alias, canonical path), `before` (exists, sha256, mode), `after` (sha256), `backup`
(state, name, sha256) once taken, `reason` on a refusal, and `previousRecordSha256` —
the hash of the previous line, so a truncated or edited journal is detected. No record
carries block text or file content.

One operation moves through `PREPARED → BACKUP_VERIFIED → WRITE_INTENT → VERIFIED`.
A refusal before `WRITE_INTENT` ends it `REFUSED`; a failure after it ends it
`RECOVERY_REQUIRED`, because the bytes may or may not have landed. An operation whose
last record is not `VERIFIED`, `REFUSED`, `RECOVERED_NO_WRITE` or `RECOVERED_COMMITTED`
blocks every further write to the same file. A journal whose last line is incomplete
or whose chain is broken blocks every write until a person preserves and fixes it.

### Recovery

`blocks resolve OPERATION-ID` compares the file as it is now with the operation's
recorded hashes: the `before` bytes give `RECOVERED_NO_WRITE`, the `after` bytes give
`RECOVERED_COMMITTED`. Anything else stays open with the backup's name, for a person to
compare by hand. Resolve never writes the host file; a restore is a new install from
the backup's text.

### Concurrency

All managed-block writes on a machine take one exclusive lock,
`~/.sshlg-skills/managed-blocks/.lock`. A held lock is refused, never waited out or
stolen; if no writer runs, a person removes the file. The file is snapshot-compared
against the preview before the backup and again before the rename, so an edit made in
between is refused (`TARGET_CHANGED`). This protects against cooperating writers and
operator edits seen in time; it is not a compare-and-swap against an uncooperative
process writing at the same instant.

## Known limits

- Ordinary backup pruning keeps ten copies per file and does not yet pin a backup a
  journal record names; ten later writes of the same file can remove it (filed on the
  board). The journal keeps its hash either way.
- The hub's own writers (`apply.js`, `wait-rules.js`) keep their existing receipts and do
  not append to this journal yet.
- Cursor rule files are read, never written, by this writer.

## Using it from another tool

A tool keeps its block text in its own repository and calls the hub:

```bash
npx --yes sshlg-skills blocks install OBSERVATORY:AGENT-UPDATES --owner OBSERVATORY \
  --agent claude --from tools/ops/agent-updates-instructions.md --json            # preview
npx --yes sshlg-skills blocks install OBSERVATORY:AGENT-UPDATES --owner OBSERVATORY \
  --agent claude --from tools/ops/agent-updates-instructions.md --apply --json    # write
```

Read `state` (`PREVIEW`, `VERIFIED`, `UNCHANGED`, `REFUSED`) and `code` from the JSON;
on `RECOVERY_REQUIRED` call `blocks resolve` with the operation id it names. Whether
Observatory adopts this route is that project's decision.
