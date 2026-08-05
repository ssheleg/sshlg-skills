# Design — the managed global routing block

Date: 2026-08-05 · Status: approved (autonomous run) · Brief:
`briefs/2026-08-05-global-routing-block.md`

## Problem

A skill's `description` influences whether a model reaches for it; it does not
oblige. The operator's own global instructions say so, and carry two
hand-written routers as a result. Nothing automates them, so a new machine
starts with none, and the third router (`copywriting`) does not exist at all.

The artifact being edited is the operator's **global** instruction file. It
governs every project and every session. That is the whole risk profile: the
feature is a dozen lines of text, and the engineering is entirely about not
damaging a file the writer does not own.

## Locked decisions

D1 shared format, per-member sections · D2 consent once at `install`, `update`
never creates, deletion is permanent · D3 `copywriting` covers text shipped to
the product's user · D4 three axes, not priorities · D5 both the bundle and an
individual member's installer can write.

## The block format

One sentinel pair. Inside it, one independently-marked section per member, and
a generated precedence table.

```markdown
<!-- SSHLG:ROUTERS:BEGIN — managed by sshlg-skills; delete this block to opt out -->
## Роутинг работы — семья ssheleg

<!-- SSHLG:ROUTER:super-ux:BEGIN -->
…router text…
<!-- SSHLG:ROUTER:super-ux:END -->

<!-- SSHLG:ROUTER:copywriting:BEGIN -->
…router text…
<!-- SSHLG:ROUTER:copywriting:END -->

<!-- SSHLG:ROUTERS:TABLE:BEGIN -->
| Скил | Отвечает на | Когда |
…generated from the sections present…
<!-- SSHLG:ROUTERS:TABLE:END -->
<!-- SSHLG:ROUTERS:END -->
```

**Why sections rather than one body.** D5 lets two writers touch the block —
the bundle and a member's own installer. A monolithic body means the second
writer overwrites the first. Independent sections let each writer upsert only
its own and leave every byte of the others alone.

**Why the table is generated.** It must describe the routers that are actually
present. A hand-kept table drifts the moment a member is installed alone.

## The upsert algorithm

`upsertRouters(filePath, routers, opts) -> {action, diff}`

1. **Read.** File absent → `action: "absent"`. Nothing is created outside
   `install` with consent.
2. **Opt-out check.** If the file contains `SSHLG:ROUTERS:OPTOUT`, return
   `action: "opted-out"` and write nothing, ever. This is what a user leaves
   behind when they delete the block; see below.
3. **Locate.** Find `ROUTERS:BEGIN` / `ROUTERS:END`.
   - Absent, and mode is `update` → `action: "no-block"`, write nothing (R-06).
   - Absent, and mode is `install` with consent → append at end of file,
     preceded by exactly one blank line.
4. **Per-router upsert.** Inside the block, for each router given: replace
   between its own `ROUTER:<name>:BEGIN`/`:END` if present, else insert before
   the table. Sections not named in `routers` are copied verbatim, byte for
   byte.
5. **Regenerate the table** from every `ROUTER:<name>:BEGIN` marker present
   after step 4, in the fixed order `super-ux`, `copywriting`, `task-pipeline`.
6. **Compare.** Rendered output identical to input → `action: "unchanged"`,
   no write (R-09).
7. **Write** unless `dryRun`, in which case return the unified diff and write
   nothing (R-10).

**Failure behavior.** Any unreadable file, unbalanced sentinels, or a
`ROUTERS:END` before its `BEGIN` → `action: "malformed"`, write nothing, print
the reason and the file path. A malformed block is never repaired
automatically: the file belongs to the user, and a repair is a guess about
text we did not write.

## Consent

Asked once, at `install`, only when no block and no opt-out marker exist.
Recorded in `~/.sshlg-skills/state.json` as `{"routers": "yes"|"no"}`.

- `yes` → write, and never ask again.
- `no` → record it, write nothing. `install` never asks a second time.
- Non-interactive stdin (CI, piped) → treat as `no`, print one line saying so.
  Silence is not consent.

**Opting out after the fact** is deleting the block. To make that permanent
without a state file the user may not know about, the deletion leaves nothing
behind — so `install` re-asks once and, on `no`, writes
`<!-- SSHLG:ROUTERS:OPTOUT -->` at the end of the file. That single line is
what step 2 reads, and it survives everything.

## Targets

`~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, each written only if its parent
directory already exists — the presence of the directory is the evidence that
the agent is installed. Never create an agent's home directory.

## Migration

The two hand-written routers move inside the block **with their existing
wording preserved verbatim**, including the operator's own asides. The
migration reads the current headings (`## UX scenarios — global (super-ux)`,
`## Роутинг работы — по умолчанию через task-pipeline`), moves the text into
sections, and removes the originals only after the block renders identically
to what was read. If either heading is absent, migration is skipped for that
router and the packaged default is used instead.

## The copywriting router text

Carries the D3 boundary and the refusal phrase, in the shape the other two
already have: the rule, the boundary in both directions, the refusal phrase,
and the precedence sentence.

## Out of scope

Per-project rules (`/ux-rule` already owns those). Any agent whose home
directory is absent. Repairing a malformed block. Editing anything outside the
sentinels, under any circumstance.
