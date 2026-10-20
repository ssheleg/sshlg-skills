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
| `gemini` | `~/.gemini/GEMINI.md` (`GEMINI_CLI_HOME`, a HOME replacement: the file is `$GEMINI_CLI_HOME/.gemini/GEMINI.md`) |
| `pi` | `~/.pi/agent/AGENTS.md` (`PI_CODING_AGENT_DIR`) |
| `cursor` | `~/.cursor/rules/sshlg-routing.mdc`, `~/.cursor/rules/sshlg-wait.mdc` |

`blocks` reads all of them. The writer writes the first four only: Cursor keeps one
rule file per block, so there is no shared file to manage. A host directory that is a
symlink (a dotfiles checkout) is read and written through; the link stays a link. The
instruction file itself must be a regular file, never a link. A host directory that is a
link to nothing is refused as `HOST_ABSENT` and says so.

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
- A marker inside a closed Markdown code fence (```` ``` ```` or `~~~`, up to three
  spaces of indent) is an example, not a block: it is not listed and never written. An
  unclosed fence fences nothing, so it cannot hide a real block's `END`; a comment
  opened inside a fence ends with the fence. A `<!--` inside an inline code span on its
  line (CommonMark: a code span is literal) opens no comment at all. Stray, unbalanced fences around a real block
  make it read as an example; the writer's preview then warns, naming the line of every
  `BEGIN` of the selected id that sits inside a fence.
- A duplicate, crossed, unclosed or stray marker, a near-miss spelling (spaces around
  a colon, lower-case `begin`), or invalid UTF-8 makes the whole file malformed. Readers
  report it; writers refuse the file until a person fixes it. Nothing is repaired
  automatically.

## Block names and their owners

| Block | Owner | Writer |
|---|---|---|
| `SSHLG:ROUTERS` (and its subregions) | sshlg-skills | `npx sshlg-skills install` / `update` (`lib/apply.js`) |
| `SSHLG:RULE:wait-is-not-a-stop` | sshlg-skills | `npx sshlg-skills rules` (`lib/wait-rules.js`), opt-in |
| `SSHLG:PROJECT` | sshlg-skills | `npx sshlg-skills enroll` (`lib/enroll.js`), in a project's own `CLAUDE.md` and `AGENTS.md`, never a host's global file |
| `SSHLG:REPOSITORY-HANDOFF` | sshlg-skills, **retired** (B-174, decided 2026-10-20) | removal only: `blocks uninstall SSHLG:REPOSITORY-HANDOFF --owner SSHLG`. The rule now lives in the operator's own rules block, so the hub never writes this block again |
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

Each block the hub writes also gets a `content` state, compared with the hub's own
record of what it wrote: the wait rule against `~/.sshlg-skills/wait-rules.json`,
router sections and the map, protocol and table regions against the hashes in
`~/.sshlg-skills/routers-rendered.json`. `AS_WRITTEN` matches; `NO_RECORD` and
`RECORD_UNREADABLE` say there is nothing to compare with; `FOREIGN_TEXT_INSIDE`
carries a line range and makes the exit code 1. The wait rule's range is the exact
changed lines; a router section's or region's is its inner lines, since only hashes
are recorded. The text itself is never printed.

`npx sshlg-skills blocks diff OWNER:NAME --from FILE --agent HOST` prints the selected
block's current and proposed text. It writes nothing.

## Writing: `blocks install` and `blocks uninstall`

```
npx sshlg-skills blocks install   OWNER:NAME --owner OWNER --agent HOST|all --from FILE [--apply] [--json]
npx sshlg-skills blocks uninstall OWNER:NAME --owner OWNER --agent HOST|all            [--apply] [--json]
npx sshlg-skills blocks resolve   OPERATION-ID [--json]
```

- **`--agent all`** (B-207) runs one operation per installed host, each with its own
  backup and journal line; a host that is not installed is reported `SKIPPED`, never
  created. Its preview is the drift report: `unchanged` on a host means that host already
  carries the source's exact block. The exit code is the worst host's, so one refusal is
  never hidden by the others. This is how one source file of operator rules reaches every
  host: `blocks install OPERATOR:GLOBAL-RULES --owner OPERATOR --agent all --from <file>`.
- **Preview is the default.** Without `--apply` the command prints the diff (or, with
  `--json`, the before/after hashes) and writes nothing at all.
- **Install** takes the block from `FILE`, a local file holding exactly one complete
  block with the same id. If the target has that block, only its bytes from `BEGIN` to
  `END` are replaced. If it does not, the block is appended on its own line right after
  the file's final line ending — no blank-line separator, because none could be taken
  back without guessing whose blank line it was. If the target file is missing but its
  host directory exists, the file is created (mode 644); a missing host directory is
  refused — the writer never installs a host.
- **Uninstall** removes the block and the one line ending after it, nothing else.
- **Every byte outside the selected block is preserved**, and the file keeps its mode:
  install adds exactly the block and its line ending, uninstall takes exactly those away,
  so the pair returns any file that ends with a line ending — blank trailing lines
  included — to its exact bytes. The one exception is a file without a final line ending:
  install adds one before the block, and it stays (`"X"` and `"X\n"` append identically).
- **Line endings follow the file.** In a file whose every newline is CRLF the block is
  written with CRLF; otherwise with LF.
- **The result must parse.** Before writing, the new text is parsed: it must hold the
  same markers as before plus (install) or minus (uninstall) exactly one paired block of
  this id, or the write is refused (`RESULT_WOULD_NOT_PARSE`) — an unterminated `<!--`
  earlier in the file would otherwise swallow an appended block.
- **Edits inside the block are named before they are dropped.** Replacing or removing a
  block whose text differs from what this writer last installed (the journal keeps each
  install's block hash) prints a warning naming that operation; a block this writer never
  installed warns that its text stays only in the backup. The text and JSON output name
  the backup taken.
- **Nothing to do is not an operation:** an install of identical text or an uninstall of
  an absent block exits 0 and writes no backup and no journal line.
- **A read-only file is refused** (`READ_ONLY`): a rename would otherwise replace a file
  the operator made read-only.
- **Exit codes:** 0 done or nothing to do, 1 refused or failed, 2 bad arguments. Every
  refusal and failure answers in one shape (`state` `REFUSED`, `RECOVERY_REQUIRED` or
  `ERROR`, `code`, `reason`, and `operationId` plus the `blocks resolve` command when a
  write may have landed), never as a stack trace — under `--json`, as JSON, bad arguments
  included (`BAD_ARGUMENTS`, exit 2).

### Admission

The writer refuses: the hub's own blocks (they have dedicated writers with their own
consent); any write of the retired `SSHLG:REPOSITORY-HANDOFF` (its owner may only remove it); any other `SSHLG:` name; a call without `--owner`
or whose `--owner` differs from the marker's prefix; an opted-out block; a malformed
target; a symlinked or unreadable target; a source that is remote, unreadable or not
exactly one matching block. `--owner` stops one cooperating tool from writing another's
block by mistake. It is not authentication.

### Backup

Before the write, `apply.protect()` copies the file to `~/.sshlg-skills/backups/`
(directory 0700, copies 0600), the same place and naming as every other hub write
(`lib/backup.js`). The copy is read back and must equal the previewed bytes; a failed
copy cancels the write. The backup's name and hash go into the journal. When the newest
copy of the file already holds exactly the previewed bytes — a retry of a write that
failed before it landed — that copy is reused (`backup.state: reused`) instead of a new
one being taken each time.

### Journal

`~/.sshlg-skills/managed-blocks/journal.jsonl` (directory 0700, file 0600) is
append-only. Each line is one JSON record, `schema: "managed-blocks-journal/1"`:
`operationId`, `sequence`, `state`, `at`, `op`, `owner`, `markerId`, `target` (host, path
alias, canonical path), `before` (exists, sha256, mode), `after` (sha256), `backup`
(state, name, sha256) once taken, `segmentSha256` (the installed block's hash), `reason`
on a refusal, and `previousRecordSha256` —
the hash of the previous line, so an edited or removed record in the middle breaks the
chain. Beside it, `journal.head` (0600) holds the record count and the last line's hash
and is rewritten after every append, so an edited or deleted last record, and whole
trailing records cut off, are detected too. One extra, correctly chained record beyond the head is accepted: that is a crash
between the append and the head update. A missing head counts as zero records, so the
very first record without a head is that same crash window and is accepted; the next
append writes the head. Two or more records without a head means the head was removed. Deleting the journal and its head together is
not detected. No record carries block text or file content.

One operation moves through `PREPARED → BACKUP_VERIFIED → WRITE_INTENT → VERIFIED`.
A refusal before `WRITE_INTENT` ends it `REFUSED`; a failure after it ends it
`RECOVERY_REQUIRED`, because the bytes may or may not have landed. An operation whose
last record is not `VERIFIED`, `REFUSED`, `RECOVERED_NO_WRITE` or `RECOVERED_COMMITTED`
blocks every further write to the same file. A journal whose last line is incomplete,
whose chain is broken, or that disagrees with `journal.head` blocks every write until a
person preserves and fixes it.

### Recovery

`blocks resolve OPERATION-ID` compares the file as it is now with the operation's
recorded hashes: the `before` bytes give `RECOVERED_NO_WRITE`, the `after` bytes give
`RECOVERED_COMMITTED`. Anything else stays open with the backup's name, for a person to
compare by hand. Resolve never writes the host file; a restore is a new install from
the backup's text. Resolve also removes this writer's own leftover temporary files beside
the target (regular files named `.sshlg-block-<24 hex>.tmp`) and leaves anything else.

### Concurrency

All managed-block writes on a machine take one exclusive lock,
`~/.sshlg-skills/managed-blocks/.lock`. A held lock is refused, never waited out or
stolen; if no writer runs, a person removes the file. The file is snapshot-compared
against the preview before the backup and again before the rename, so an edit made in
between is refused (`TARGET_CHANGED`), and so is a backup whose bytes are not the
previewed ones (`BACKUP_FAILED`). This protects against cooperating writers and
operator edits seen in time; it is not a compare-and-swap against an uncooperative
process writing at the same instant.

## A project's block: `SSHLG:PROJECT`

`npx sshlg-skills enroll` writes one block into a repository's own `CLAUDE.md` and
`AGENTS.md` (where each exists; with neither, it creates `CLAUDE.md` holding only the
block). The block lists the routers that apply to that repository, its surface class
and the signals behind it, and the setup commands still owed. It follows this page's
fence and placement rules (`eolOf`, `appended` and the parse-after check are shared with
`lib/blockwriter.js`), takes its backup through `apply.protect()`, and refuses a
malformed file, an `SSHLG:PROJECT:OPTOUT`, a symlinked instruction file and a root
outside a Git work tree. It writes no journal record: the project's Git history is the
record, and `blocks install` refuses the id as a dedicated block. The contract is
`docs/evidence/specs/2026-10-19-enroll.md`.

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
