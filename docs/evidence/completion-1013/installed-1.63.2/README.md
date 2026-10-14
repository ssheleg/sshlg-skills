# Hub 1.63.2 installed and read back (2026-10-14)

Published: 1.63.0 (b441550), 1.63.1 (20bbb87), 1.63.2 (0e5ed71); each release run
succeeded and each npm tarball's 94 files equal the tagged source. 1.63.0 and 1.63.1
are not what this machine runs: the [installed attempt](../installed-1.63.0/README.md)
of 1.63.0 refused before any write, and 1.63.1's update degraded hook wiring.

## What each installed update found

1. 1.63.0 preview refused on agent-sync's `__pycache__/*.pyc` and then on telegram-dev's
   user+local scopes; seven members already carried their exact pinned bytes. Fixed in
   1.63.1 (payload-equivalent members need no native action; bytecode caches are not
   payload), after three independent review rounds.
2. 1.63.1 `update` verified three native members, then hook wiring refused: the
   transaction had written marketplace sources as one-line objects inside the 2-space
   `settings.json`. Fixed in 1.63.2 (replaced and inserted JSON take the file's layout),
   after two review rounds.
3. 1.63.2 `npx --yes sshlg-skills@1.63.2 update`: **22 of 22 steps green**; exit1 only
   because three Codex members are deferred by design (overall partial).

## Readback on this machine

- Claude native transaction: [receipt summary](claude-transaction.json) — task-pipeline,
  seo-aeo-audit and agent-stack `verified` at their pins (132, 36 and the agent-stack file
  set); the other eight members payload-equivalent, left installed. `settings.json` is
  in canonical 2-space form again; hook wiring reports it already matches the package.
- Plain skills: [readback](plain-readback.json) at 0e5ed71 — 39 skills, 570 files at each
  of 11 measured destinations, zero issues; Continue uses real directories.
- Hooks: `hooks status` — every entry present and matching. Runtime: 89 files, 88 equal
  to the package; `lib/router-texts.js` is an orphan from an older generation that the
  sync does not retire (B-193).
- `hooks recovery inspect --json` on the live runtime: `NO_LOCK`, no journal.
- Managed blocks: `blocks` reads all five instruction files with valid markers; `routers`
  reports no drift. Both `CLAUDE.md` and `AGENTS.md` were changed by another process at
  09:04:25 local, after this update finished; the update itself reported them unchanged.
  The 1.63.1 update backed up all five files before writing.
- Codex: three members deferred (task-pipeline, seo-aeo-audit, agent-stack). The published
  bounded read-only watcher runs from the stable runtime copy; its
  [first observation](codex-watch-first.json) is `deferred`, `mutationAllowed: false`.

## Not established

Native model use of the installed skills, Linux hosts, the deferred Codex generations'
retirement, and B-191/B-192 limits (equivalent members keep upstream marketplace sources;
a multi-scope member blocks its own future version change).
