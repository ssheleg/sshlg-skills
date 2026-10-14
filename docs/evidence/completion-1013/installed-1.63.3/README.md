# Hub 1.63.3 installed and read back (2026-10-15)

Published: release run 38654043071 (validate ×3, release, publish success); npm 1.63.3 gitHead
a9080b8; all 94 tarball files equal the tagged source. Two independent review rounds
(ACCEPT-WITH-FIXES on 60fe0b4, ACCEPT on e180954) preceded the merge.

`npx --yes sshlg-skills@1.63.3 update` on the operator machine: **22 of 22 steps green**; exit1
only because three Codex members stay deferred by design.

- Claude native transaction: all 11 members `verified` — 3 `verify`, 8 `rebind` (payload equal
  to the pin, no install or uninstall). Marketplace sources for all 11 now point at the hub's
  pinned catalogs in both `settings.json` and `known_marketplaces.json` (counted without printing
  values): B-191 holds on the real host.
- `settings.json` is canonical 2-space; hook wiring reports it already matches the package.
- The runtime ownership manifest records 88 files; nothing retired on this first manifest run
  (`lib/router-texts.js` predates the manifest and is not provably the hub's, so it stays).
- No member was blocked here; the blocked path is covered by `test/cli_config_test.js`.
