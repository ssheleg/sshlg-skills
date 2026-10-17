# Kimi shared instruction budget: local repair handoff

2026-10-17. Scope: repair the operator's shared instruction entry point after a
reported `AGENTS.md total 63.8 KB exceeds the recommended 32 KB` warning.
The local file repair is complete; reproduction in the reporting project remains
unverified because its working directory was not supplied. This is not a hub
release, hook repair, or claim that every host loaded the changed instructions.

## Source and decision

- Baseline: `b0f828dc78cb27166942035a2800d6e943e51a27`.
  The existing [handoff](../HANDOFF.md) records the shared-to-Pi instruction link
  installed during host validation. That link made a full host instruction file
  part of the shared context.
- [Kimi official instruction-file documentation](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html#instruction-files),
  read on the date above, identifies both global shared and Kimi-specific
  instruction locations, plus project instructions.
- Local byte measurement found 41,937 bytes in the shared entry and 1,490 bytes
  in Kimi's own entry: 43,427 bytes before project rules. Thus the global layer
  alone exceeded 32 KiB. The user's full 63.8 KB total was not independently
  reproduced; no project files were changed.
- Replace the shared symlink with a link to a compact local entry. Keep core
  authority, secrecy, privacy, delivery and routing constraints inline; load
  detailed domain procedures only when applicable. Full canonical files remain
  available unchanged. Do not replace SYSTEM.md, suppress warnings or raise limits.

The compact file carries the existing router opt-out marker to prevent full-text
reinjection, while explicitly retaining route discovery and mandatory conditional
reads. This is an operator-specific local configuration, not a distributable
template. Hooks were not edited. Shared-file consumers also see the compact entry;
their native model behavior was not tested by this change.

## Implementation and recovery

Private source, apply script, receipt, symlink metadata and verified backup stay
under the operator's local instruction-cleanup directory, in the dated
`2026-10-17-kimi-budget` unit. They are deliberately excluded from Git. Do not copy
those files into a public repository. No personal paths, rule bodies or credentials
are needed to resume from this handoff.

The apply script uses baseline [protect()](../../lib/apply.js) and
[backup.guard()](../../lib/backup.js). Backup failure prevents mutation. It verifies
the old link and content, writes a private receipt, checks source hashes again,
and atomically replaces the symlink itself rather than writing through it. The
receipt holds the original link target and backup identity for rollback. Restore
only after confirming the current target still matches this receipt; never undo
another session's subsequent change. The script resolves the baseline helper from
this task's isolated checkout, so review that dependency if the checkout is removed.

## Checks actually run

| Check | Observed result |
|---|---|
| Local apply script, three consecutive real runs | replaced-link, unchanged, unchanged; all exit 0 |
| Shared instruction readback | 8,443 bytes |
| Shared plus Kimi-specific instructions | 9,933 bytes; reduction 33,494 bytes; 22,835 bytes remain below 32 KiB for project instructions |
| SHA-256 comparison with before-state | Pi, Claude, Codex and Kimi-specific files unchanged, 4/4 |
| Backup readback and modes | original hash matched; backup 0600, backup directory 0700 |
| Domain reference resolution | all 22 named global reference files exist |
| `node test/backup_test.js` | exit 0, 21 checks |
| `node test/routers_test.js` | exit 0, 44 checks |
| `python3 test/doc_refs_test.py` | exit 0, 17 cases |
| Native `kimi --version` | 2.2.0 |
| Native interactive startup | reached folder-trust screen; exited normally without trusting the broad test folder or submitting a model prompt |
| Fabric admission | no-project; board/status/claim tools unavailable; no fabricated board claim |

Round one checked real application and idempotence; round two checked independent
readback, preservation, references, permissions and focused regressions. No blocker
remains for the bounded local-file repair. These checks do not prove agent compliance
with deferred instructions or disappearance of the warning in the unknown project.
No package code changed, full package CI was not run, and no hosted suite was dispatched.

## Exact continuation

When the reporting project directory is known, inspect its actual instruction
inputs and calculate the complete total. Start a fresh Kimi session in that project
to verify the warning there; do not infer project success from the global byte count.
If project duplication still exceeds the budget, compact only its owned instruction
entry while preserving canonical rules. Future operator-rule synchronization must
preserve this compact shared entry instead of recreating the full Pi alias.

Pending condition: reporting project directory and native startup there. Owner:
operator supplies the directory; next agent performs the check. No background
watcher was installed for a missing text answer. The probe process was closed.

Skills used: task-pipeline for bounded delivery; evidence-docs for measurement and
explicit acceptance limits. No foreign skill route was used.
