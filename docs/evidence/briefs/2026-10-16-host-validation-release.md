# Brief — family release from the 2026-10-16 host validation

Run: `/task-pipeline iteration`, lease `ITER-1016`, branch `iter/2026-10-16-host-release`,
base `2f16876` (main after #231). Operator, 2026-10-16: «давай самое важное решай всё по
порядку до конца сам» and, the same evening, the Safari rule: «все работаем с Safari, наш
основной агентский браузер … Safari не дефолтный … в скиллах, чтобы всё это жёстко было
написано». Standing authority: «No approval questions — act, then report» (operator
2026-10-13) and «Releases are the agent's» (operator 2026-10-11).

## Source ledger

| Source | What it gave |
|---|---|
| [host-compat report 2026-10-16](../../reports/2026-10-16-coding-agent-compatibility/README.md) + `raw/findings.json` | the hub defects behind B-201…B-218 with file:line evidence |
| board `docs/evidence/backlog.md` | Open: 37 at base; rows B-195, B-201…B-221 |
| verification ledger `docs/evidence/verification.md` | 4 rows at `never` at base |
| retro standing instructions (read in full) | #2 three-run idempotence, #8 read the output not the wrapper's exit, #9 select a release run by its tag and close on the registry, #10 ask git what is committed |
| host-config review (operator-local dossier, not in Git) | B-219 (OpenClaw), B-220 (stray `~/.claude/.claude.json`), B-221 (Pi precedence) |
| operator rule «Browser work — Safari is the agent browser» (`~/.claude/CLAUDE.md`, updated 2026-10-16) | the doctrine the members must carry |
| PR #224 | B-195 labelled-secret detector; checks green; conflict only in `docs/evidence/backlog.md` |
| code graph | `graphify-out/` 7 commits behind (B-200); not used for reach — grep + tests instead |
| wiki | `reports.py` catalog; no design input for this run |

## Grill — closed from the sources and the operator's «решай сам»

| Question | Resolution (recommended answer taken) |
|---|---|
| Safari doctrine in public member skills, which binds every user of the family? | The family default becomes **WebKit/Safari first**: it is the engine with the narrowest support envelope among the big three, so a surface checked there is the stricter claim. Chromium stays a named, stated fallback (Chrome-only API, Lighthouse, CDP trace). No operator-specific paths in public text. |
| Remove OpenClaw from the default targets? | Yes (B-219): the host is not installed here; explicit `--agent openclaw` keeps working. |
| Claude version gate | Accept any `2.x ≥ 2.1.296` (semver compare); the per-plugin readback already guards a format change (B-203). |
| Foreign text inside a managed block | Never abort the whole run; refuse that block on that host, name file and line, keep the text; a router-section edit is kept and warned, never silently deleted (B-201, B-202). |
| Inline MCP tokens → `use_secret.py header` | Not in this release: the slot binding is the operator's one-time act by design (`use_secret.py` header door). Prepared as operator steps in the local dossier. |
| Releases | One family release: changed members first (annotated tags), then hub pins and the hub tag; install with `npx --yes sshlg-skills@latest update`; read back. |

## REQ table

| REQ | Request | Verified by |
|---|---|---|
| R1 | B-203: Claude pin transaction accepts Claude Code ≥ 2.1.296 including 2.2.x and 3.x; refuses below and on unparsable output | `test/claude_pin_transaction_test.js` cases 2.1.295 refuse / 2.1.296 / 2.2.0 / 3.0.1 accept |
| R2 | B-204: Gemini relocation follows `GEMINI_CLI_HOME` (`<home>/.gemini`); `GEMINI_CONFIG_DIR` no longer read | tests over `lib/apply.js`, `lib/blocks.js`, `lib/guard.js`, `lib/hostvis.js`; docs `managed-blocks.md` |
| R3 | B-219: `openclaw` not in `skills.json` `defaultAgents`; README marks it opt-in | `test/validate.py`; `install --dry-run` argv |
| R4 | B-220: no `CLAUDE_CONFIG_DIR` passed for the default profile | test asserting the env of `claude plugin` calls |
| R5 | B-213: Continue `--copy` pass only when Continue is installed **and** in the requested scope | `update --dry-run --agent codex` plans no Continue step (test) |
| R6 | B-208: with `rules.wait=on`, `update` applies the wait rule to a supported host that has no receipt (or names the gap) | e2e fixture: new Pi host gets the block |
| R7 | B-201: foreign text inside an owned block refuses that block only, names file:line, exits non-usage; other steps run | e2e fixture under a scratch HOME, 3-run hashes |
| R8 | B-202: operator text inside a router section is kept and warned, never deleted | `test` fixture: `routers --update` keeps the line |
| R9 | B-215: README claims corrected (five channels + `~/.agents/AGENTS.md` note, hooks reach Cursor/Continue via import, Cursor rules by ancestor walk, Kimi target, universal adapters, `skills.json` upstream 1.7.2, Codex `$name`) | `test/doc_refs.py`, `validate.py` |
| R10 | B-195 / PR #224 merged with the backlog conflict resolved | PR merged; its tests green on main |
| R11 | Safari/WebKit-first doctrine in task-pipeline `references/browser.md` + `companion-skills.md` | member validator + text check |
| R12 | the same doctrine in sheleg-design visual review | member validator |
| R13 | the same doctrine in seo-aeo-audit tooling (Lighthouse remains a stated Chromium exception) | member validator |
| R14 | the same doctrine in sheleg-dev frontend-performance | member validator |
| R15 | the same doctrine in super-ux ux-audit | member validator |
| R16 | members released (annotated tags, release runs selected by tag, registry read) | `npm view <pkg> version` |
| R17 | hub pins + release; `npx --yes sshlg-skills@latest update` installs it; readback (plugins = pins, hooks status, blocks valid, wait rule on Pi) | installed readback |

## Finish line

- **Objective:** the fixes and the Safari doctrine are published and installed on this machine,
  and the installed hub no longer aborts on foreign text, no longer deletes router edits,
  and no longer targets OpenClaw.
- **Exit checks:** R16 (`npm view`), R17 (installed readback), plus R1–R8 tests in the released tree.
- **Scope:** hub `lib/`, `bin/`, `hooks/` (via #224), `skills.json`, README, docs; members
  task-pipeline, sheleg-design, seo-aeo-audit, sheleg-dev, super-ux (doctrine text + release files).
- **Budget:** 3 rounds, 2 releases.
- **Base:** `2f16876`.

## Carry-over

| Item | Home |
|---|---|
| Inline MCP tokens → header door (needs the operator's `vault.py bind`) | operator dossier; board row at close |
| Hub instruction targets for Kimi/Goose/Hermes/ZCode (B-206), guard adapters (B-209) | stay on the board (own runs) |
