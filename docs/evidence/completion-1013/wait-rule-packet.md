<sub>ssheleg skills — evidence-docs · task-pipeline</sub>

# B-175 bounded implementation packet

Status: proposed, read-only source review; no rule implementation or machine apply.
Reviewed hub source `2c322e2` on 2026-10-13. B187 installer aggregate has priority.
This packet does not change B-180, the star line, or any operator instruction.

## Requirement and provenance

- Hub [B-175](../backlog.md) owns an opt-in wait rule, rendered per host.
- Hub [pipeline gap G20](../specs/2026-10-13-pipeline-principles-gaps.md) maps this
  existing row rather than creating a second owner.
- Observatory source reviewed at `288486b3b19e2c0d6fac623237d512ed36a0a3e5`:
  `docs/runs/2026-10-12-release-iteration-1/dossiers/MN-method-family-public.md`
  section3.5 and `questions.md` O3, lines211–212. The proposal names a separate
  `SSHLG:RULE:wait-is-not-a-stop` block, canonical hub
  `docs/working-rules/wait-is-not-a-stop.md`, default-off `rules.wait`, durable
  triggers and a compaction carve-out. That owner record is provenance, not a new
  grant from another agent. The operator's standing instruction in this session
  independently authorizes the wait behavior on this machine. O4/star stays separate.
- Fabric `knowledge/principles.md` section10 supplies the current human-gate,
  polling, durable-wait and compaction clauses. Public installations must receive
  a self-contained rule rather than depend on access to that private repository.

## Source map and concrete gaps

| Existing source | Measured behavior / implementation implication |
|---|---|
| `lib/config.js:61–78` | Routers default on; setting on deletes the key. Reusing `routers.wait` would invert the requested default-off behavior. |
| `lib/routers.js:221` | Protocol renderer has no host input; it is not yet a host-specific text renderer. |
| `lib/apply.js:34–47,251–266` | Destinations exist for Claude, Codex, Gemini and Pi; root overrides/environment and missing-host refusal already exist. The same text/options go to all targets. |
| `lib/apply.js:310–373`, `lib/cursor.js` | Cursor has a separate marked MDC writer with foreign-file refusal. Reuse its ownership conventions, not its router-specific payload. |
| `lib/apply.js:159–231` | Current routing writer supplies malformed/opt-out handling, dry-run diffs and backup-before-write. It does not make a multi-file atomicity guarantee. |
| `lib/consent.js:55–87` | Routing consent is distinct from installation and is persisted; old routing consent must not silently enable the new wait behavior. |
| `bin/sshlg-skills.js:1582–1683` | Existing config syntax is `config set <key> <value>`. The historical proposal's shorter `config rules.wait on` is not an existing command. Prefer canonical `config set rules.wait on`; do not silently accept malformed variants. |
| `bin/sshlg-skills.js:1438–1489` | Migration iterates all host targets before resolving selected scope. Do not reuse this orchestration for the new writer without fixing that ordering. |

The last row is reproduced, not only a code concern: in an owned synthetic HOME,
Claude's file contained `## UX scenarios`, a synthetic foreign body and `## Other`.
With recorded router consent, `routers --update --agent codex` exited0 but removed
Claude's first section, leaving only `## Other`. The selected Codex file was written.
The fixture was removed. Existing backup/stash paths may retain the wording; this
observation proves an unauthorized cross-host write, not irreversible data loss.
It predates B187 and should be a separate bounded regression/fix.

## Proposed contract

1. **Separate working rule, default off.** Keep the canonical wait text in the
   named working-rules document; render a dedicated `SSHLG:RULE:...:BEGIN/END`
   block rather than inventing a task router or duplicating task-pipeline's loop.
   An absent setting is off; only exact explicit `rules.wait = "on"` enables it.
   Invalid/unreadable policy is unknown and must not trigger writes or removals.
   Config changes preserve other settings. The star protocol remains byte-identical.
2. **One explicit opt-in, no repeated permission prompt.** `config set rules.wait on`
   records the intended behavior and describes the affected persistent instructions.
   A separate `rules` command previews by default; `rules --apply` applies the recorded
   setting to the selected hosts. That flag is execution, not a second approval.
   Existing router consent, an installed skill, old text or unattended stdin cannot
   manufacture this opt-in. On this machine the standing instruction is already
   authority; after review the operator is not asked for it again.
3. **Keep consent and ownership concrete.** Successful apply records selected host,
   resolved profile, canonical target, source revision/hash and previous managed
   bytes. A later unscoped `update` refreshes only previously applied profiles;
   retargeted roots or new host directories need explicit application, not guessed
   ownership. `--no-claude`, `--claude-only`, explicit agent selection and dry-run
   retain their current meaning. Never inspect/migrate an unselected host file.
4. **Five supported instruction destinations.** Claude CLAUDE.md, Codex AGENTS.md,
   Gemini GEMINI.md and Pi AGENTS.md use their current host-root resolver. Cursor
   gets an owned, marked wait-rule MDC in an existing rules directory. No host
   directory is created to invent an installation. Continue, OpenCode and Hermes
   are not claimed by this writer until a supported instruction surface is admitted.
5. **Per-host text.** Claude may name `run_in_background` and Monitor only as
   available host capabilities. Other hosts use background process / host scheduler
   wording and never receive Claude-only tool names. Both variants state that a
   session process does not survive session loss: long waits need an existing
   durable trigger or an explicitly installed one within the current authority.
   Writing instructions does not itself create jobs, hooks or background daemons.
6. **Preserve foreign text.** First apply appends only its own well-formed region;
   surrounding bytes remain exact. Off removes only the previously owned region.
   Every changed target is backed up before writing; failed backup means no write.
   Duplicate/malformed markers, edited or unknown-revision owned regions, symlink
   retargeting and foreign Cursor files refuse with a diagnostic rather than guess.
   Idempotent apply writes nothing. Preview and execution derive the same candidate.
   Do not silently absorb or delete the machine's handwritten wait sections; their
   exact, separately reviewed migration is a later operational step with backup/readback.
7. **Authority stays external to the rule.** A watcher may perform only the named
   next act already authorized by the task, repository policy or a specific grant.
   Readiness, generic continue, or enabling this rule never grants merge, publish,
   spend, send, access, reset or force-push authority. Sign-ins, consents, operator
   payments/top-ups and typed secrets remain human. Cite applicable spending limits
   instead of pretending today's per-project limits are automatically computed.
8. **Compact, durable behavior.** Finish a unit, take independent work; record wait
   condition, owner/source, authorized next action, watcher identity and fallback in
   the handoff/board. A missing watcher capability is an explicit pending wait, not
   an invented running job. Poll PR/CI/peer at1–2min, release every few minutes,
   scheduled work once at its time and nightly once after the scheduled run.
   At compaction, preserve the current unit and exact next task for continuation.

This proposal intentionally adds a small rule-specific emitter rather than changes
the generic router's default semantics. Its config read/write must refuse corrupt
input and preserve foreign keys/values; do not inherit `store.readJson`'s
unreadable-means-empty behavior as evidence of consent or permission to reset state.
Implementation should choose a strict, source-preserving policy edit under a bounded
lock, with compare-before-replace, reusing existing JSON spans and backup primitives.

## Decomposition and acceptance

| Packet | Owned changes | Required negative/control evidence |
|---|---|---|
| W175-0 | Fix existing router migration scope ordering, separately | Actual `--agent codex` with recognized foreign Claude heading leaves Claude bytes unchanged; selected target still migrates; no-claude and dry-run controls. |
| W175-1 | Canonical doctrine, rule renderer, strict default-off config API/CLI | Absent/off/invalid all produce no new rule; explicit on persists; malformed command rejected without writes; star bytes unchanged; source text and renderer stay linked by a check. |
| W175-2 | Scoped emitter and ownership receipt using existing host roots/backup | Five-host synthetic matrix; no writes to absent/unselected hosts; correct Claude/generic variant; custom roots and spaces; canonical retarget refusal; preview/execute parity; second run byte-identical. |
| W175-3 | Update/off/uninstall integration | Old router consent alone cannot enable wait; update only previously applied targets; off removes only owned rule; foreign surrounding bytes survive; corrupt policy/receipt, duplicate markers and failed backup refuse; partial multi-host failure is reported, never batch success. |
| W175-4 | Reviewed machine adoption and final readback | After code/CI/release: explicit authorized opt-in, per-host source/byte readback, deduplicate only reviewed handwritten copies with exact preimage/backup. No model-behavior acceptance inferred from installed text. |

For behavioral acceptance, use bounded synthetic authority cases: CI becomes green
but no merge grant; known merge grant with moving-head refusal; a watcher absent
from the host; a human consent gate; a wait that outlives the session; and independent
runnable work. Desired instruction wording alone is not evidence that an agent
actually follows it. This packet creates no provider-call request or new model run.

Root review is required before implementation under this assignment. The next
specific action is to accept/amend the explicit config/apply contract, then implement
W175-0 and W175-1 on isolated branches after B187's source is delivered. No report
here closes B-175, B-180 or whole-system acceptance.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**:
evidence-docs for source/claim separation; task-pipeline for bounded decomposition.
