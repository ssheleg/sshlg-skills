# Hub 1.64.0 installed and read back (2026-10-15)

Published: release run 38731555703 (validate ×3, release, publish success); npm 1.64.0 gitHead
fc11487; all 96 tarball files equal the tagged source. Independent reviews: hub changes ACCEPT
after two rounds; task-pipeline 1.96.0 ACCEPT after two rounds (published by release run
38722488907, npm gitHead 2674147, 162/162 files equal). PR #223 from another session merged into
main during the iteration and ships in this release.

`npx --yes sshlg-skills@1.64.0 update` on the operator machine: **22 of 22 steps green**; exit1
only because three Codex members stay deferred by design.

- Claude native transaction: all 11 members `verified`; task-pipeline installed at 1.96.0
  (2674147). `settings.json` canonical; hook wiring already matches; hooks status: all present.
- Wait rule wait-v2 (finish line, B-196, B-197) written in place over wait-v1 on Claude, Codex,
  Gemini and Cursor; Pi had never applied the rule and was left alone.
- `blocks` reads every host file with valid markers; `hooks recovery inspect`: `NO_LOCK`.
- `context`: Claude 39,737 B (615 lines, note: over the 200-line target), Codex 32,553 B under
  its raised 65,536-byte cap, Gemini 25,907 B, Pi 17,909 B, Cursor 18,090 + 2,814 B.
- Site https://skills.sshlg.me shows 1.64.0.
