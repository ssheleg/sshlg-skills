# Hub 1.63.0 installation admission and readback

Status: PREPARED, not published or installed. The current published/installed
plain baseline remains 1.62.2. No settings or payloads were changed for this packet.

The [plain readback](verify-plain.py) accepts one full immutable hub commit and a
new output path. It reads each member source from that commit, compares every
expected skill file at the measured skills@1.7.2 destinations and checks Continue
uses real directories. It never overwrites an existing receipt.

[Compatibility replay](verifier-prior-baseline.json) against accepted1.62.2 source
`a17f829e8d652ce7f68423b67e0de00fb89b3693` passed:39 skills/550expected files per
measured destination, zero mismatches. This is verification of the existing
installation and the readback script, not installation of candidate1.63.0.

## Exact remaining sequence

1. Accept/freeze final hub source, complete all genuine gates, normal integration,
   release and registry source/payload verification.
2. Preserve private operator settings, ownership records, managed instructions
   and runtime hashes before the published update; never track raw settings.
3. Review the published update preview, execute under existing recorded consent,
   and retain its real exit/status. Claude must prove pinned source and payload;
   Codex unsafe generation replacement must defer before mutation.
4. Compare plain payloads using the final accepted commit; read back runtime,
   hooks, scoped domain/visibility state and unrelated settings preservation.
   An installed file is not evidence of native model use.
5. If a deferred Codex receipt is produced, actually start its published bounded
   read-only watcher, retain registration/process identity and first observation.
   Catalogue equality or timeout never authorizes deletion of active hook files.
6. Independently reconcile the final original-requirement and board snapshots.
   Retain each unsupported native/provider/human gate explicitly.

## Actual attempt after publication (2026-10-14)

1.63.0 was published (release run 38518498679; npm gitHead b441550; all 94 package
files equal to source). Before the update, hashes of eight operator instruction and
settings files and 149 runtime files were recorded privately (not tracked).

`npx --yes sshlg-skills@1.63.0 update --dry-run` exited2 before any write:
`agent-sync: unknown same-version payload files; preserve before repair`. The only
non-pinned file in that installed cache was `skills/agent-sync/scripts/__pycache__/
agent_sync.cpython-314.pyc`, written by the running hook; `.in_use/<pid>` markers were
already ignored. A fixed preview then refused `telegram-dev: native immutable repair
supports one user-scope install only` — telegram-dev and xr-dev are installed at user
scope plus local project scopes (R35's per-project enablement). Seven of eleven members'
installed payloads were byte-equal to their pins; only the pin commit (docs-only) differed.
Settings hashes were unchanged after both refusals.

The correction is 1.63.1: payload-equivalent members get no native action, and bytecode
caches are not payload. With it, the dry-run on this profile exits0 and plans native
updates only for task-pipeline 1.95.0, seo-aeo-audit 0.26.6 and agent-stack 0.28.2.
1.63.0 is not installed here; the installed readback moves to 1.63.1.
