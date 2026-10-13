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
