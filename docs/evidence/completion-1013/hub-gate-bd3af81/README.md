# Hub full gate on bd3af81 (1.63.0 candidate after member pins)

`npm test` from a clean recursive clone of exact bd3af81 (task-pipeline 1.95.0,
seo-aeo-audit a6e471e, sheleg-dev 7ced39b pinned), owned TMPDIR,
`SSHLG_RATCHETS_OUT` set: [result](result.json), [log](log.txt.gz),
[counts](ratchets.json). Exit1 in 235s; minimum free space 5.28GB.

Every suite passed. The only failures were DOCMAP's stated Ratchets figures
(suites 118, fixtures 1814) behind the counts this run measured: **133 suites,
2270 fixtures, 11 pinned members**. The marker and its sentence now carry those
measured figures, and `node test/run.js --ratchets-from ratchets.json` passes. The
final full gate is owed on the final source; this run is not a release gate.
