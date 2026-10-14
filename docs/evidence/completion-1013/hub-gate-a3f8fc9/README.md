# Hub gate on a3f8fc9 (backup lock retry)

`npm test` from a clean recursive clone of exact a3f8fc9: every suite passed; the only
failure was DOCMAP fixtures 2270 behind the measured 2271 (one new retention control).
[log](log.txt.gz), [counts](ratchets.json). DOCMAP now states 133/2271/11 and
`--ratchets-from` passes.
