# HC-1: current host contracts

As of 2026-10-09. Research-only slice of the [execution packet](../README.md).
Seventeen named hosts, not a claim to cover every popular agent. The parent
added Claude Code and Codex contracts to the delegated fifteen-host research. No client, permission, model, auth or
profile configuration changed; no paid/interactive model session was opened.

The machine-readable [matrix](host-matrix.json) maps every assertion to the
dated [primary-source ledger](sources.json). Documentation discovery is not
installed-version acceptance. `NOT_ESTABLISHED` is an evidence gap, not a claim
that the host lacks the feature. Hook/subagent compatibility needs native
registration and verification even when the skill markdown is portable.

## Findings for implementation review

1. **Do not create duplicate host-specific skill roots when the shared root is
   native.** Current Kimi, Cursor, Gemini, OpenCode, Roo, Kilo, Goose, Zed, Amp
   and Copilot documents describe shared `.agents/skills` discovery. Gemini
   even gives that alias priority within a scope. A successful generic
   installer run still does not establish which copy the host selected.
2. **Kimi generations must be distinguished.** Current native documentation
   uses `KIMI_CODE_HOME` and `.kimi-code`, while general help still describes
   older locations and optional metadata. Prefer the current CLI contract,
   then test the installed version. The current CLI accepts the shared home
   skills root. Its global instruction root is `$KIMI_CODE_HOME/AGENTS.md`;
   `~/.agents/AGENTS.md` is also documented. Do not use `SYSTEM.md` to append
   routing: that replaces the system prompt.
3. **Hermes is profile-aware.** Native skills live under `HERMES_HOME`; shared
   home skills require `skills.external_dirs`. Project skills need trust.
   Global context is `HERMES_HOME/SOUL.md`; project AGENTS inheritance is bounded
   to Git. There is no evidence that a new `~/.agents/AGENTS.md` alone would
   configure Hermes. Existing persona text must survive any bounded routing
   pointer; do not invent a global AGENTS loader.
4. **Precedence is not universally project-first.** Cline documents global
   skills winning. Amp searches local global roots before project roots.
   Copilot combines applicable instruction files without general precedence.
   Avoid one generic override rule in authoring doctrine.
5. **Version/surface limits matter.** Windsurf docs now redirect to Devin
   Desktop; Kilo uses `.kilo` on its current platform. Zed has a flat skill
   layout and metadata budget. Local skills do not automatically synchronize
   to Cursor/Kiro cloud surfaces, and external agents embedded in Zed keep
   their own loaders.
6. **Native extensions remain separate.** Kimi TOML hooks, Hermes hooks,
   Cursor components and Copilot plugins have different contracts. OpenCode
   ignores unknown skill metadata; this is not enforcement of Claude fields.
   State-sensitive OpenClaw roots and symlink containment need their own
   checks. A plain skill install must not be labelled plugin/hook acceptance.

These are derived from the source IDs on each matrix row. The corrective
candidate is accurate host selection/discovery reporting and explicit fallback
guidance, not copying the entire router block into every possible directory.

## Source conflicts and remaining limits

- Kimi general help conflicts with the current CLI customization pages; the
  current CLI pages were selected and the conflicting help retained in the ledger.
- Kilo's skill page contradicts itself about folder/name matching; matching
  them is the conservative portable choice, not a claim that the conflict is
  resolved in every binary.
- The old Goose documentation URL returned 404. Research continued at the
  primary `aaif-goose/goose` repository and pinned its source to
  `3bd852002903e016ff30947e973f76e2fcfcf90f`.
- Exact same-name skill ordering was not established for Cursor, OpenCode
  stable, or Windsurf; the matrix does not manufacture an ordering.
- This pass does not assert every OS-specific path, remote worker behavior,
  hook event or subagent field. Public upstream prose and source are evidence
  of a contract, not proof of this machine's installation or a provider run.

## Handoff and checks

Completed: dated sources, 17 host contracts, explicit conflict/unknown markers.
Next: parent reviews findings against pinned installer adapters and installed
client versions; implement only reproduced mismatches, then perform native
read-only discovery where available. Keep runtime `NOT_RUN` otherwise.

Validation: JSON parses; exactly 17 unique hosts; every matrix source ID resolves;
all 47 source IDs unique and dated; all source URLs use HTTPS. These checks are
structural, not a native-host or semantic compatibility test.

## Breadth extension, 2026-10-10

[Ten additional families](README-additional.md) extend this slice to 27 families
and 71 source URLs, of which 70 were readable. The original 17-host matrix and
47-source ledger retain their original scope; use both linked slices. Continue
loader reproduction distinguishes single-target success from mixed-target failure.
