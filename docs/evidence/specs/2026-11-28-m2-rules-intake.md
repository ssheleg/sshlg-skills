# Reliability program module 2: this hub's rows, received and bound to the house rules

**Status:** intake of fabric-workspace's board request 343d8a19 (program thread, the Fabric CEO's order 2e12853d), 2026-11-28.
Source read: fabric-workspace `docs/programs/2026-11-28-system-reliability/spec/m02-rules.md` at `origin/main`
`cb62b1e2` (sections 4 and 5, "Builder conditions"). Nothing is built yet; this page records what the hub accepts, the
decisions it took as the builder, and what it needs from other projects. Rows: [backlog](../backlog.md) B-379 to B-387.

## Rows received

| Spec row | Backlog | Due | Size | Depends on |
|---|---|---|---|---|
| M2-02 records, guard, parser, ids, share; inventory, selection, candidate check, write protocol, receipts, incidents, hand-edit deny | B-379 | 2026-12-02 | L | none |
| M2-03 lint, cross-side check, audit, weekly model pass | B-380 | 2026-12-05 | M | M2-02 |
| M2-04 composed budget, organisation delivery, topic hook queue | B-381 | 2026-12-05 | M | M2-02 |
| M2-04r running-session announcements | B-382 | 2026-12-05 | S | M2-04 |
| M2-05 fixture runner and the hub's gates | B-383 | 2026-12-05 | L | M2-02 |
| M2-06 fail-closed fixes | B-384 | 2026-12-05 | S | M2-05 |
| M2-C personal canary | B-385 | 2026-12-05 | S | M2-02p, M2-01s |
| M2-10 plan runner, commit protocol, receipts, reconcile, collision stop | B-386 | 2026-12-05 | M | M2-02, M2-10m |
| M2-12 references folded; routing block checked at start per runtime | B-387 | 2026-12-10 | S | M2-04 |

M2-08 (retired tools, due 2026-11-29) is also this hub's row in the spec but is not in this request; it is not filed
here a second time.

## Builder condition 7, measured on this machine

Question (before M2-04): do runtimes other than Claude support path-scoped rule files and a per-turn hook?

| Runtime | Path-scoped rule file | Per-turn hook | Evidence |
|---|---|---|---|
| Claude Code | yes: `.claude/rules/*.md` | yes: `UserPromptSubmit`, already wired | `lib/domainrouters.js:9`; `lib/hooks.js:89` |
| Codex 0.171.0 | no user-level file scoped by path; `AGENTS.md` is read by directory, inside the checkout | yes: the native binary carries `UserPromptSubmit` (17 occurrences); the hub wires only `PreToolUse` today | `grep -a -c UserPromptSubmit` on `@openai/codex-darwin-arm64/.../bin/codex`; `lib/hooks.js:72` |
| Cursor | not measured for user-level rules | yes: `beforeSubmitPrompt`, read through `additional_context` | `lib/hookpayload.js:34`, `lib/hookpayload.js:174` |
| Gemini, Pi, Kimi, Kiro, Windsurf, Hermes | not measured (not installed here, or no hook wired) | not measured | `which` found none of `gemini`, `kimi`, `pi`, `kiro-cli` |

**Decision (builder's, reversible):** the spec's default holds, with one narrowing. A `projects`-scoped rule in an
organisation space is delivered to Claude by the path-scoped file (as the spec says) and to Codex by its
`UserPromptSubmit` hook keyed on the payload's `cwd` against the inventory's checkout path; every other runtime reads
`undeliverable` until a fixture proves its route. Why: Codex runs in organisation spaces, its hook exists in the
installed build, and writing into a project's own `AGENTS.md` would edit that project's repository. The fixture goes
into M2-04 (B-381); M2-04r (B-382) reuses the same Codex hook for announcements.

## Builder decisions taken at intake

1. **One verb, no collision.** `rules` is already the opt-in wait rule (`bin/sshlg-skills.js:160`: bare `rules
   [--apply]` and `rules recovery`). The new verbs (`export`, `add`, `revise`, `retire`, `rollback`, `share`, `render`,
   `lint`, `audit`, `fixtures`, `topic`, `canary`, `latency`, `reconcile-receipts`) are subcommands beside them; the bare
   form and `recovery` keep their behaviour, and the CLI golden test gains a case per verb.
2. **Zero dependencies stay.** The launcher has none (`package.json`). Records are read by one pure parser of a strict
   YAML subset (block maps and lists, plain and quoted scalars; anchors, tags, multi-document files and flow
   collections refused with `file:line`); `rules add` writes only that subset. `rules export --json` is the one reader.
3. **A view inside a shared file is a block, not the file.** `~/.claude/CLAUDE.md` and the other global files hold the
   owner's own text outside the hub's sentinels, which this repository preserves byte for byte (`CLAUDE.md`, "Writing to
   operator files"). Until M2-02p maps every line of it into the personal home, the rendered view is a managed block:
   its first line names the commits and says "generated, do not edit"; `render --check` hashes the block; the
   PreToolUse deny refuses an edit that touches the block's span and lets edits elsewhere in the file pass. A file the
   render owns whole (organisation space files, path-scoped files) is denied whole.
4. **Every view write is a protected write.** The spec's staged-file protocol (stage, fsync, rename) runs through
   `protect()` in `lib/apply.js` and `lib/atomicwrite.js`, so a backup precedes each write and a failed backup cancels
   it.
5. **Hooks keep the house failure rule.** The topic hook's one refusal names the rule as the remedy; an unreadable
   registry, payload or state file makes the hook pass silently and records the exception, which is the
   `open-declared` mode M2-06 measures.
6. **Fabric's tables through a door.** M2-10 reads and moves `rule_plans` through an operation M2-10m exposes; until it
   exists, through `docker exec supabase_db_fabric psql`, the same route probe 2.6 reads.
7. **Missing inventory sources are red, never guessed.** A source this hub cannot read (Studio spaces, the copy
   registry, `docs/template-repos.json`) leaves its targets `omitted`, and the render reports it.

## Needed from other projects

| From | What | Default if silent |
|---|---|---|
| studio-agent | the shape of `harness_parity.spaces` and the user each space renders as | spaces read `omitted` |
| fabric-agents-database | the copy registry's format (spec condition 6, 10) and the crossing receipt's fields for `share` | `share` refuses every copy |
| fabric (M2-10m) | an operation for `rule_plans` and `rule_receipts` | `psql` route (decision 6) |
| fabric-workspace | the Fabric reminder field `rules-changed {ids}` (module 4 C5) for M2-04r | Codex hears through its own hook only |

## Dates

M2-02 is size L due 2026-12-02 and its check needs the release installed on both machines. The release ships through
the house release path; a machine that is not updated by hand takes it at its nightly update job (B-323,
`lib/updatesched.js`), so the row aims for a release on 2026-12-01 and records each machine's installed version.
