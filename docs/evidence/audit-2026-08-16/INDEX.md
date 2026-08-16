# Family audit — 2026-08-16

Nine parallel read-only audits, one per repository, against a fixed eight-dimension
brief: gate, budgets, version/release integrity, documentation currency, graph,
hooks/plugin wiring, triggers, installed-vs-source drift. Every finding in the nine
files beside this one carries `file:line` or a command and its verbatim output.

**131 findings — 3 blocker, 60 major, 68 minor.** Counted by
`grep -h '^TOTAL:' docs/evidence/audit-2026-08-16/*.md`, not carried across.

| Repository | Findings | Blocker | Major | Minor |
|---|---:|---:|---:|---:|
| umbrella (`sshlg-skills`) | 14 | 1 | 8 | 5 |
| `super-ux` | 15 | 1 | 5 | 9 |
| `make-skill` | 14 | 1 | 7 | 6 |
| `task-pipeline` | 17 | 0 | 9 | 8 |
| `agent-sync` | 17 | 0 | 9 | 8 |
| `sheleg-dev` | 17 | 0 | 6 | 11 |
| `sheleg-design` | 15 | 0 | 6 | 9 |
| `seo-aeo-audit` | 13 | 0 | 5 | 8 |
| `agent-stack` | 9 | 0 | 5 | 4 |

## The three blockers

- **`F-umbrella-01`** — `routers` writes the migrated `~/.claude/CLAUDE.md` at
  `bin/sshlg-skills.js:493` **before any backup**, the only write to a protected file
  that does not go through `apply.protect()`. Reproduced against a scratch `HOME` with
  the backup directory unwritable: the file was rewritten from four sections to three
  lines, no copy existed anywhere on disk, and the run printed *«Файл не изменён»*.
  This is the defect `lib/backup.js` was built for after `~/.claude/CLAUDE.md` was
  destroyed twice (B-05), and `CLAUDE.md:75-76` asserts «there is no second write path».
- **`F-super-ux-01`** — `npx super-ux --cursor` deletes seven of the nine router blocks
  from `~/.cursor/rules/sshlg-routing.mdc`. Same module: `lib/apply.js:227` builds the
  Cursor target from the `EMPTY_BLOCK` **constant** instead of from the file on disk, so
  a `--member`-scoped run rebuilds the file containing only that member's routers.
  `applyCursor` returns no `removed` key, so nothing is stashed either. **Observed live
  during this audit** and restored byte-for-byte from the backup the write itself took
  (`md5 c89df5371fc69722be84fc28f79e94ba`, 9 blocks, 13743 bytes — verified twice).
- **`F-make-skill-01`** — both of the family's checkers drop the continuation lines of a
  multi-line YAML description, so a description whose real length is 1435 chars is
  measured as 200 and passes. The standard-keeper hands a clean bill to a skill the
  Skills API rejects on upload, and its own gate cannot catch it either.

## What the mechanical auditor found first

`scripts/audit_skill.py --house` over all 24 shipped skills: **11 gaps**.
Five `SKILL.md` bodies are over the 5000-token budget —

| Skill | Body | Over |
|---|---:|---:|
| `task-pipeline` | ~6685 | 34% |
| `sheleg-design` | ~6203 | 24% |
| `seo-aeo-audit` | ~5885 | 18% |
| `stripe-billing` | ~5367 | 7% |
| `ad-tracking` | ~5273 | 5% |

and `agent-sync` sits at ~4996 of 5000 — **four tokens of headroom**. Descriptions with
no room for another routed trigger: `sheleg-design` 1021/1024, `agent-orchestrator`
1019/1024, `agent-evals` 986, `agent-interop` 983, `stripe-billing` 967/970,
`seo-aeo-audit` 959/970.

## Patterns that cross repositories

Each of these is one cause with many symptoms, and each is cheaper to fix once.

1. **`npm test` does not exist in three of nine members** — `super-ux`, `agent-stack`,
   `seo-aeo-audit` have no `scripts` block at all, while the family's stated gate is
   `npm test` and `hooks/repo-gate.js` denies a commit whose `npm test` is red.
2. **`GRAPH_REPORT.md` is never regenerated with `graph.json`** — seven members ship a
   report naming a different build commit from the graph beside it, off by 1, 3, 14, 16
   and 35 commits. Every one tells the reader to trust the number it prints.
3. **The verification ledgers have gone stale in five of nine** — pinned to versions two
   to four releases behind, while asserting they describe the shipped artifact.
4. **Release tags are lightweight where they used to be annotated** — `task-pipeline`
   (last 7), `sheleg-design` (all of 1.37.x), `agent-sync` (1.11.1), so
   `git submodule status` reports members as v1.60.0, v1.36.1 and v1.11.0.
5. **CHANGELOG entries for versions that were never tagged or never published** — in six
   members, twenty-two versions in total, plus one version published to npm that the
   CHANGELOG says was withdrawn.
6. **All eight pins sit one commit past their release tags** — the `.gitignore .env`
   chore of v0.79.0 is in no tag, no release and no umbrella pin, so the hardening the
   release announces does not reach a fresh clone.
7. **A restated number that no longer computes** is the single most common finding class
   across all nine repositories.
