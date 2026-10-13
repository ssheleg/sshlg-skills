# Independent aggregate seam review — 2026-10-13

Reviewed implementation snapshot: `ab37778793674efff60b92ed381284c7339420ea`.
Merged inputs: visibility `18a2a77`, domains `ff33a3b`, secret-reader guard `72e0138`,
search `7d49b3e`. Reviewer authored the domains work, so this is an independent integration
review and an independent review of visibility/search/guard, **not** independent acceptance
of the reviewer's own domains implementation. That component's separate verifier reviewed
`ff33a3b` and reported 24 process assertions plus five malformed-global scenarios.

**Verdict at this snapshot: changes required.** Two reproducible C04 defects below were
sent to the coordinator and assigned to the visibility author. No core implementation,
real HOME settings, provider session or registry was modified by this review. Only temporary
HOME fixtures were used, and those were removed. The coordinator owns the full `npm test`
run; this reviewer did not duplicate it or claim its result.

## Reproduced findings

### IR-1 / P2 — relocated Codex profile is ignored by visibility writes

Source: [launcher at the reviewed commit](https://github.com/ssheleg/sshlg-skills/blob/ab37778793674efff60b92ed381284c7339420ea/bin/sshlg-skills.js#L2015).
`runVisibilityUnlocked` constructs `~/.codex/config.toml` directly, although the existing
`apply.hostRoot` contract recognises `CODEX_HOME`. Its Claude settings/instructions paths
are similarly fixed under `~/.claude` (lines 1984 and 1990). Search's new filesystem roots
honour these environment roots, so search and the writer disagree about the active profile.

Exact sandbox setup and result:

1. Create `.agents/skills/foreign/SKILL.md` with name `foreign`, and a skills lock mapping
   `foreign` to `example/foreign`.
2. Create `~/.codex/config.toml` containing `# default\n` and
   `$HOME/active-codex/config.toml` containing `# active\n`.
3. Set `CODEX_HOME=$HOME/active-codex`; run `visibility --apply`.
4. Observed: exit 0; default config changed; active config unchanged.

A separate domain fixture confirmed the same mismatch with `CLAUDE_CONFIG_DIR`: create
both default and active settings with web3d enabled, plus a Git project depending on three;
`domains --apply` exits 0, changes the default file, and leaves the active file unchanged.
The coordinator assigned a separate C05 profile correction after this read-only finding.

Required correction: derive the settings and discovery inputs from the same documented
host-root resolver. Retain hub state and pack marks under `~/.sshlg-skills`. Bind ownership to its source
profile path, so a later environment change cannot redirect a revert. Verify apply,
reapply and revert against relocated profiles and preserve unrelated default-profile bytes.

### IR-2 / P2 — unreadable pack marks become an instruction to unhide

Sources: launcher soft reader line 1961, marks read lines 2026–2033, absence claim
lines 2051–2055, host `want`/`drop` planning lines 2080–2092 at the same commit.
An I/O error becomes `null`; the missing-policy fallback produces an empty hide set.
Existing ownership then causes the prior host setting to be removed.

Exact sandbox setup and result:

1. Use the shared skill and lock above; create `.gemini/settings.json` containing
   `{"skills":{"disabled":[]}}`.
2. Run `visibility marks --init --apply`, then `visibility --apply`.
   Gemini's disabled list becomes `["foreign"]`.
3. Set `pack-marks.json` mode to `000`, then run `visibility --apply` again.
4. Observed: exit 0; output claims there are no pack marks; Gemini's disabled list becomes
   `[]`. Restore mode `0600` before cleaning up.

Required correction: distinguish absent inputs from unreadable/invalid policy. Do not
unhide or discard ownership on unknown policy; explicit revert can use the existing receipt.
The related fail-soft skills-lock reader (`lib/hostvis.js:61–69`) was flagged for the same
review, but this report's reproduced result is specifically the pack-marks case.

## Passing integration evidence

One independent Node sandbox harness made **16 passing assertions** on this snapshot:

- A disabled domain plugin with CRLF metadata remains searchable; its description survives
  the merged `conflicts`/`skillmeta` reader and the result names `domains --enable`.
- Enabling that plugin in project-local settings makes `enablement.effective` and the
  inventory agree; the result no longer prints an enable hint.
- The installed `PreToolUse` matcher covers both `Read` and `Grep`. The real hook denies
  a content read of a synthetic `.env` path, while a `.env` search pattern against a safe
  README path is not mistaken for a file operand.
- Holding `update.lock` makes both direct `visibility --apply` and `domains --apply`
  return 75. Their previews still return 0. Neither creates an ownership record.

Static integration inspection also found:

- `cmdUpdate` returns from its dry-run branch before any reapplication (lines 566–568).
  Visibility is reapplied only on consented hosts intersecting `visibilityScope`;
  domains reconciliation is guarded by `claudeScope` (lines 680–750).
- Real update holds the shared lock. Its internal visibility reapply and domains step
  deliberately avoid reacquiring their own lock. Direct mutators use the shared lock.
- The merged result-rendering loop retains both unloaded-domain hints and compact identical
  entry-copy grouping (`lib/toolkit.js:471–489`). Cache/filesystem rows remain explicitly
  unverified for native availability.
- Runtime packaging copies the JavaScript files in both `hooks/` and `lib/`
  (`lib/runtime.js:30–31`), so `secretreaders.js` and `skillmeta.js` are in that closure.
  This is source packaging evidence, not a readback of the user's installed runtime.

## Evidence limits and next action

These fixtures check configuration transitions, module composition and real hook-process
outputs. They do not prove model skill selection, native host loading, provider execution,
production installation, cost savings or quality parity. The secret-reader matcher remains
a bounded recognizer, not a general shell interpreter or a security boundary. Search recall
claims remain limited to its frozen synthetic corpus.

Next: independently replay IR-1 and IR-2 on the corrective commit, check the merged diff,
then record the coordinator's exact-SHA full-gate result separately. Native-host acceptance
and task/quality evaluation remain separate gates.

Skills used: task-pipeline for the bounded review/delivery route; agent-sync for ownership
awareness. This review file was assigned exclusively; guarded registries were not edited.
