# Domains profile correction and handoff — 2026-10-13

Objective: close the C05 portion of aggregate finding IR-1 at
`ab37778793674efff60b92ed381284c7339420ea`. The prior launcher ignored
`CLAUDE_CONFIG_DIR`, changed default-profile settings and left the selected profile unchanged.
All verification below uses temporary HOME fixtures; no real host configuration was applied.

## Contract and implementation

- `lib/enablement.js` exports `claudeRoot(home, env?)`, using the existing `apply.hostRoot`
  contract. Both effective plugin settings and installed-plugin registry reads use that
  root. The optional fourth argument of `effective(home, cwd, fs?, profileRoot?)` and third
  argument of `installed(home, fs?, profileRoot?)` provide an explicit root to callers.
  Project `.claude/settings*.json` paths remain relative to the project.
- Domains reads/writes the selected profile's `settings.json`, reads its plugin registry
  when preserving hook-bearing members, and names the selected file in diagnostics.
  The post-tool-use shadow reader uses the same profile registry and plain-skill root;
  a copy in an inactive default profile is not reported as a shadow of an active plugin.
  Its warning names the selected profile.
- The domains ownership receipt remains under `~/.sshlg-skills/domains.json` and stores
  `profile`, the canonical absolute settings-file path. Alias paths resolving to the same
  file are accepted. A different profile or a retargeted symlink refuses all mutations,
  including explicit enable/disable, update reconciliation and revert, before writing.
- A legacy receipt without `profile` belongs to the default `~/.claude/settings.json`.
  It is not silently transferred by changing an environment variable. Restore the owning
  profile and revert before applying a policy for a different profile. One receipt owns
  one profile at a time; simultaneous independent profiles are not claimed here.

## Baseline and verification

The first six-case `test/domains_profile_test.js` run against the original implementation
failed five cases: relocated apply/revert, changing profile during ownership, legacy receipt
mismatch, custom plugin registry, and the missing root helper. The same-profile alias case
already passed. The suite was then extended with relocated update reconciliation and
symlink-retarget refusal.

Focused commands and final results:

- `node test/domains_profile_test.js`: exit 0, 9 checks (including the active-profile shadow-hook seam).
- `node test/domains_test.js`: exit 0, 34 checks.
- `node test/domains_e2e_test.js`: exit 0, 46 checks.
- `node test/hooks_e2e_test.js`: exit 0, 70 checks.
- `node test/toolkit_test.js`: exit 0, 30 checks.
- `git diff --check`: exit 0.

189 focused checks passed. The new suite adds 9 checks to the aggregate gate.

A targeted replay of the final shadow-hook case also passed after checking the warning
path itself.

The profile tests cover unchanged default bytes, active-profile readback, receipt identity,
all mutators refusing a changed profile, legacy recovery, aliases and retargeting, hook-bearing
plugin preservation from a custom registry, local settings precedence, and a newly discovered
project receiving its member through the update step.

## Integration and exact next task

Branch: `fix/domains-profile-1013`, based on aggregate `ab377787`. C04's parallel correction
owns visibility's profile inputs and host receipts, plus the `conflicts.readSkills` reader.
Both developers agreed the optional fourth `effective` argument; when integrating, retain
this branch's exported resolver and default environment handling together with C04's explicit
root call. The profile tests deliberately do not claim that the unmerged C04 inventory change
has already been integrated.

Next: independent review of the pushed correction, merge with C04's profile repair, then run
the coordinator's exact-SHA aggregate gate and replay both directions of profile-switch refusal.
Native host loading, installed runtime readback and model routing/quality remain separate gates.
The full hub suite was not duplicated in this worktree. No release, installation or real-profile
apply was performed. Core changes are confined to domain/profile readers and the related hook.
