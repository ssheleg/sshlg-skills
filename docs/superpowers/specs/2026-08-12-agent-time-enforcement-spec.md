# Spec — agent-time enforcement

Contracts this build locks. Every one is grounded on the hooks reference fetched
raw this run (`code.claude.com/docs/en/hooks`), never on recall, and each names the
REQ it answers.

## The shape, and why it is this shape

Seven pure cores decide; six thin scripts move bytes. That split is this
repository's own (`lib/routers.js`, `lib/drift.js`, `lib/hooks.js` are all pure and
fixtured without a `HOME`), and it is what makes a guard provable: the decision is a
function of a payload, and the filesystem appears only where a backup is actually
taken.

| Core | Decides | Script | REQ |
|---|---|---|---|
| `lib/guard.js` | does this tool call write to an operator instruction file | `hooks/pre-tool-use.js` | 001, 002 |
| `lib/hygiene.js` | is this a bare skills-CLI update / an `obsidian-wiki setup`; and which config keys must return | `hooks/pre-tool-use.js`, `hooks/post-tool-use.js` | 005, 007 |
| `lib/shadow.js` | which plain copies shadow a plugin, given listings | `hooks/post-tool-use.js` | 006 |
| `lib/triggers.js` | which route a prompt asks for, inflection included | `hooks/user-prompt-submit.js` | 008 |
| `lib/notify.js` | the terminal sequence for a notification | `hooks/notification.js` | 012 |
| `lib/displace.js` | which of our entries someone else overwrote | `hooks/config-change.js`, `hooks/session-start.js` | 013 |
| `lib/repogate.js` | may this commit proceed; is this front matter legal | `hooks/repo-gate.js` | 003, 004 |

## Contract 1 — the guard (REQ-001, REQ-002)

**Event** `PreToolUse`, matcher `Edit|Write|MultiEdit|NotebookEdit|Bash`.

**Why the matching happens in the script and not in `if`.** The reference is
explicit that the `if` filter is *best-effort* and **fails open** when a Bash command
cannot be parsed, and that it is only evaluated on tool events. A guard whose
correctness depended on it would be a guard with a documented bypass. `if` is
therefore not used at all here; the script matches.

**Protected set** — four files, resolved against `home`:
`.claude/CLAUDE.md`, `.codex/AGENTS.md`, `.gemini/GEMINI.md`,
`.cursor/rules/sshlg-routing.mdc`.

**Decision table.**

| Situation | Decision | Reason text |
|---|---|---|
| tool writes a protected file, backup taken and byte-verified | `allow` | names the copy's path |
| tool writes a protected file, backup could not be taken | `deny` | names the failure and that the file was not touched |
| tool writes anything else | silence (exit 0, no JSON) | — |

`allow` is deliberate rather than silence: it records in the transcript that the
write was seen and covered. Silence would be indistinguishable from a guard that
did not run.

**File-path tools.** `tool_input.file_path` is documented as always absolute, with
`~` and relative spellings expanded before hooks run, so the guard compares
resolved paths and does not attempt to re-expand.

**Bash forms that must be caught**, because they write without a file tool:
`>`, `>>`, `tee`, `sed -i`, `cp`, `mv`, `install`, `truncate`, `dd of=`, and any
`~`-spelled or `$HOME`-spelled variant of the four paths. Near misses that must stay
silent: reading the file (`cat`, `grep`, `head`), a path that merely contains the
name as a substring, and a write to a backup of it.

## Contract 2 — the repository gate (REQ-003, REQ-004)

**Where it lives.** A committed `.claude/settings.json` in this repository, so a
clone arrives with the gate. Machine-level guards stay in `~/.claude/settings.json`,
wired by `hooks install`.

**Commit gate.** `PreToolUse` on `Bash`: a command containing a `git commit`
subcommand runs `npm test`; a non-zero exit denies the call and the reason carries
the failing tail. `--dry-run`, `--no-verify` and `git commit --amend` are all still
commits and are all gated. `npm test` measured at 3.3 s on this machine, which is
what makes a synchronous gate honest here and would not be at 3 minutes.

**Front-matter check.** `PostToolUse` on `Edit|Write`: when the written path ends in
`SKILL.md`, the front matter is parsed and checked against the Agent Skills limits
(`name` ≤ 64 chars, `description` ≤ 1024). A violation returns
`decision: "block"` with `reason`, which the reference defines as *feedback placed
next to the tool result* — the file has already been written, so this is a report,
not a prevention, and the wording says so.

## Contract 3 — machine hygiene (REQ-005, REQ-006, REQ-007)

**Bare skills-CLI update.** `PreToolUse` on `Bash`. A command that invokes the
`skills` CLI with `update`/`add` naming a **family member** is denied; the reason
carries `npx --yes sshlg-skills@latest update`. The family list is read from the
runtime copy of `skills.json`, so it cannot drift from what is installed. The
launcher itself (`npx sshlg-skills …`) and non-member skills are untouched.

**Shadow check.** `PostToolUse` on `Bash`, after any skills-CLI invocation.
Reports through `additionalContext`, which the reference confirms is available on
`PostToolUse`. **It must not fire while the launcher is mid-run** — the machine's own
`CLAUDE.md` records that the launcher installs into every agent first and clears the
shadowing copies last, so a check in that window reports shadows that vanish
seconds later. Detection is the documented one: a running `sshlg-skills` launcher
process, matched on the launcher's own argv shapes rather than the bare name, which
also matches any session whose cwd is this repository.

**`obsidian-wiki setup`.** `PreToolUse` snapshots `~/.obsidian-wiki/` into the
backup directory. `PostToolUse` reads the snapshot, re-applies exactly the keys that
`write_config()` drops (`CLAUDE_HISTORY_PATH`, `CURSOR_HISTORY_PATH`,
`OBSIDIAN_SOURCES_EXCLUDE`, and the QMD block), and reports which returned. Keys the
new file already carries win — the restore adds what was lost and never overwrites
what setup deliberately wrote.

## Contract 4 — inflection (REQ-008)

Matching becomes stem-based: a trigger matches when the prompt contains the
trigger's stem followed by a word boundary **or a Russian inflectional ending**.
The derivation invariant is preserved and tightened: `test/triggers_test.js` still
reads each member's shipped `description` and fails on any trigger the skill does
not advertise — the comparison moves to stems on both sides, so it cannot be
satisfied by a stem the skill never claims.

Two properties the fixture asserts, because both were nearly lost:
- a refusal phrase still silences the hook — «без дизайна» contains `дизайн`, and a
  stem matcher makes that collision easier, not harder;
- a question still produces silence.

**Target:** the 20-prompt corpus rises from 11/20 to ≥18/20 with zero new hits on
the question and refusal corpora.

## Contract 5 — session wiring (REQ-011)

`SessionStart` returns `hookSpecificOutput` with:
- `additionalContext` — the existing ~90-token pointer, unchanged;
- `sessionTitle` — the open run's topic, only when a ledger exists. The reference
  states `sessionTitle` is ignored on `clear` and `compact`, so it is emitted only
  on `startup`, `resume` and `fork`;
- `watchPaths` — the absolute path of `.task-pipeline/run.md` when it exists.

`FileChanged` (matcher `run.md`) reports a stage advance through `systemMessage`,
which the reference says this event delivers as a brief terminal notification. The
event has no decision control and cannot block anything, which is correct for it.

## Contract 6 — notification (REQ-012)

`Notification`, matchers `idle_prompt|agent_completed`. Input carries `message`,
optional `title`, and `notification_type`. The event discards `systemMessage` and
`continue` and emits only `terminalSequence`, so that is the whole output. The
sequence is OSC 777 (`notify`), inside the documented allowlist (OSC 0/1/2, 9, 99,
777, BEL); anything else is rejected by Claude Code and the field ignored, so
`lib/notify.js` refuses to build a sequence outside it rather than shipping one that
is silently dropped.

## Contract 7 — displacement (REQ-013)

**The honest limitation, and it changes the design.** `ConfigChange` can block a
change or do nothing; the reference states it discards `systemMessage` and
`continue`, and the event is absent from the list of events that deliver
`additionalContext`. A blocked change surfaces **no message to anyone** and writes
only a debug-log line. So this hook cannot report at the moment it fires.

Therefore: `ConfigChange` on `user_settings` **records** displacement into
`~/.sshlg-skills/state.json`, blocks nothing, and the **next `SessionStart` reports
it** in the context it already emits. Detection is a comparison against what
`lib/hooks.js` says we wired — the same single home, so a rename cannot desynchronise
the detector from the plan.

## Contract 8 — frontmatter hooks in members (REQ-009, REQ-010)

Scoped to a skill's lifetime, declared in `SKILL.md` front matter under `hooks:`,
which the reference documents for skills and subagents with the same schema as
settings files.

- **`task-pipeline`** — `PreToolUse` on `Bash`: an outward release act (`git push`
  of a tag, `git tag`, `gh release create`) is denied while the run ledger records no
  `stage: 6` with `verdict pass`. It gates the irreversible act, not ordinary
  commits: stage 5 commits per task by design, and a gate that fought its own build
  loop would be removed within a day.
- **`agent-sync`** — `PreToolUse` on `Edit|Write`: writing a guarded register
  declared in `.claude/agent-sync.json` is denied when no lease is held. This is that
  skill's central invariant and today it is enforced by the agent remembering to
  take a claim.

Both are verified in their own repositories' suites, and both are re-verified live
at stage 8 — assumption A-02 in the brief says plainly that frontmatter hooks
arriving from a plugin are documented but unproven on this machine, and an unproven
mechanism ships described as unproven.

## Failure posture, for every hook here

- A malformed payload produces **silence and exit 0**. A guard that throws breaks
  every prompt in every session, including sessions of packs that never asked for
  this one.
- A `deny` always names its remedy in the same sentence. A refusal with no next step
  is how an operator learns to switch a hook off.
- No hook writes to a file the operator owns except through `protect()`
  (`lib/apply.js`), and no second write path is created.
