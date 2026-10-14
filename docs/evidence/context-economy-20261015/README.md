# Context economy on the operator machine — 2026-10-15

Measured with `npx sshlg-skills context` (bytes; tokens ≈ characters / 4) before and after.
Operator files were edited under the standing "act, then report" authorization, each with a
private backup in `~/.sshlg-skills/backups/` (`*.compaction-*`) and an atomic replace that
refused if the file changed meanwhile. No rule was deleted: six procedures moved verbatim into
on-demand references (`~/.sshlg-skills/local-instruction-cleanup/2026-10-09/references/global-17.md`
… `global-22.md`, local and unpublished) and each left a short "before X, read Y" trigger.

| Host file | Before | After | Change |
|---|---:|---:|---:|
| `~/.claude/CLAUDE.md` | 44,725 B | 39,002 B | −5,723 B (≈ −1,400 tokens) |
| `~/.codex/AGENTS.md` | 36,464 B | 31,818 B | −4,646 B |
| `~/.gemini/GEMINI.md` | 29,818 B | 25,172 B | −4,646 B |

Moved: release approvals, spending detail, browser setup, LLM model guide summary, Fabric
services (a duplicate of the fabric router), and the wait-rule addendum history.

**Codex instruction cap.** Codex's documentation says it stops adding instruction files once the
combined size reaches `project_doc_max_bytes` (32 KiB by default). `~/.codex/AGENTS.md` alone was
36,464 bytes, so the tail of the global instructions — and any project `AGENTS.md` — was not
reaching Codex sessions. `~/.codex/config.toml` now sets `project_doc_max_bytes = 65536` (backup
kept; parsed config otherwise identical), and the file itself is now under the default too.

After both edits `blocks` reads every host file with valid markers and `routers` reports no drift.
Not measured: the effect on model behaviour or billed tokens. The hub-managed routing block
(~20 KB per host) is unchanged; cutting it needs the paired routing evaluation.
