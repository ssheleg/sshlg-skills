# HC-1 final breadth slice — 2026-10-10

This bounded slice adds Factory Droid and Pi coding agent. It closes the requested
breadth extension; it is not a claim to cover every coding product. The
[matrix](extra-hosts.json) uses the existing host schema. The
[source ledger](extra-sources.json) adds 13 readable primary sources; references to
`additional-installer` and `additional-installer-implementation` resolve in the
[previous ledger](additional-sources.json), without duplicating those URLs.

## Findings

- **Droid:** native shared `.agents/skills` discovery is documented. The pinned
  installer ID is `droid`, classified universal through `skillsDir=.agents/skills`;
  its registered `globalSkillsDir=~/.factory/skills` is not proof that the installer
  creates that directory. See `extra-droid-skills` and `additional-installer`.
- **Pi:** native shared discovery is supported alongside `.pi` resources. Current
  primary source is pinned to `earendil-works/pi` commit
  `42a3497d03ad17e308a2299fa824727894f2c0ec`; the old `badlogic/pi-mono` URL redirects.
  The current package name differs from older `@mariozechner` releases. The
  non-universal `pi` installer adapter writes the default Pi home, whereas native
  Pi supports `PI_CODING_AGENT_DIR`. See `extra-pi-readme`, `extra-pi-config` and
  `additional-installer`.
- **Pi precedence requires the full call chain:** the real resource loader calls
  `loadSkills` with `includeDefaults:false`. Package-manager discovery adds project
  Pi, project shared ancestors, user Pi, then user shared roots. Explicit resources
  can precede those defaults; first name wins. Reading the standalone helper's
  user-first default branch would misdescribe the CLI. See
  `extra-pi-resource-source`, `extra-pi-package-source`, `extra-pi-skill-source`.
- **Capabilities remain host-specific:** Droid has native custom droids and hooks;
  Pi exposes executable extension APIs and does not promise built-in subagents.
  Skill copies alone activate neither mechanism. See `extra-droid-subagents`,
  `extra-droid-hooks`, `extra-pi-extensions`, `extra-pi-readme`.

## Symlink evidence boundary

Pi's pinned `package-manager.ts:394,417` and `skills.ts:189,223` explicitly inspect
symlink targets with `stat`, follow directories/files and skip broken links.
This is source evidence from both discovery stages, not a model/runtime test.

Factory's official release notes document `.factory/skills` symlink discovery
fixed in CLI 0.56.0 (2026-01-27), and broken skill symlinks isolated in CLI 0.187.0
(2026-08-04). See `extra-droid-releases`. No proprietary loader was inspected;
shared-root-specific symlink handling and locally installed versions remain
unverified. These findings do not justify another installer copy workaround.

## Checks and handoff

Both JSON files parse; two unique host IDs and 13 new source IDs/URLs; all row
references resolve across the ledgers; both adapter IDs and their project/global
fields match the pinned registry. Pi source URLs are commit-addressed and their
SHA256 digests are recorded. `git diff --check` passes. No configurations,
installations, existing matrices or releases changed; runtime acceptance is
`NOT_RUN` for both hosts.

Next: parent reviews and adds these two rows and source links to the central
index, preserving the installation/source/runtime distinction. No further breadth
expansion is proposed by this slice.
