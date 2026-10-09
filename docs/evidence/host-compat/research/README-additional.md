# HC-1 breadth extension — 2026-10-10

Ten additional named host families, not an exhaustive popularity ranking:
Aider, Continue, Qwen Code, Antigravity, Warp, Augment, Junie, TRAE,
OpenHands and Mistral Vibe Code. Surface variants remain inside their family row.

[Additional matrix](additional-hosts.json) separates native documentation/source
from `skills@1.5.25` adapter destinations. The
[24-entry source ledger](additional-sources.json) records read dates and scope.
Twenty-three sources were readable; the international TRAE page returned no
extractable body. Its native contract is NOT_ESTABLISHED; readable CN docs are
scoped to that regional build. No installed host acceptance or model run occurred.

## Decisions supported by this slice

- Aider is absent from the pinned installer registry. `aider-desk` is a different
  product. Explicit convention Markdown is documented; native skill discovery
  was not established. Do not advertise Aider support from AiderDesk's adapter.
- Antigravity has different 2.0/IDE and CLI global roots. The pinned IDE adapter
  uses a documented legacy path; this does not establish current 2.0 acceptance.
- Auggie prioritizes user `.augment` skills above project `.augment` skills.
  Junie natively reads shared `.agents` roots; its foreign-root import offer is
  a different mechanism. OpenHands supports legacy roots but prefers `.agents`.
- Mistral Vibe's `allowed-tools` restricts the skill tool set. Claude's
  turn-scoped preapproval semantics must not be copied into that contract.
- Shared global `.agents/skills` is not established for Aider, Continue, Qwen,
  Antigravity, TRAE or Mistral from the inspected sources. This is an evidence
  boundary, not a blanket assertion that those hosts cannot use shared files.

## Confirmed Continue mixed-target loader mismatch

Pinned Continue source `5522c6f44ca0ac3528b37244818fbfa39b5af470`, CLI helper
`getSkillFilesFromDir`, keeps only `Dirent.isDirectory()` children. The later
`stat(SKILL.md)` occurs after filtering; there is no symlink fallback. Continue
is non-universal in the pinned installer, targeting `.continue/skills`.

The [reproduction](continue-loader-repro.mjs) executes the actual, digest-checked
published skills CLI against one synthetic local skill in a temporary HOME.
It executes the exact Continue helper after stripping TypeScript annotations;
it does not launch Continue, import its application, or invoke a model.
[Observed receipt](continue-loader-repro.json):

| Installer request | Target shape | Helper discovery |
|---|---|---|
| Continue only, default | ordinary directory | 1 skill |
| Continue + Codex, default | symlink | 0 skills |
| Continue + Codex, `--copy` | ordinary directory | 1 skill |

All installer calls exit 0. The single-target exception matters: upstream
selects copy when all targets share one skill directory. The hub's default
agent list excludes Continue; the defect affects `--all` and mixed explicit
requests containing Continue. A narrow remedy is a separate Continue add call;
this does not require copying every other host or changing host configuration.
The parent owns implementation/review; this research makes no repair claim.

Replay (Node with `node:module.stripTypeScriptTypes`, observed v26.10.0):

```sh
node docs/evidence/host-compat/research/continue-loader-repro.mjs /path/to/skills-1.5.25/dist/cli.mjs
```

The bundle digest must match before execution. The helper source is fetched from
its immutable commit and checked by digest. Only temporary HOME/cwd is written,
then removed. The copy phase follows the symlink phase, so its canonical-present
flag records retained shared storage, not creation by copy mode.

## Checks and handoff

JSON parses; 10 unique host IDs; 24 unique source IDs/URLs; every row reference
resolves; each source is dated and HTTPS. Eleven distinct adapter IDs are mapped
across nine families (Antigravity and TRAE have two); Aider has no adapter. All
mapped IDs exist in the pinned installer snapshot. The temporary fixture passed
and was removed. No configuration, installation, release or existing matrix was
changed. Next: parent reviews this additive slice and the bounded Continue repair,
then links it from the central report without converting unknowns to support.
