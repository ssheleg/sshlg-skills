# Routing coverage — word forms, the chain, declared routes, MCP instructions

Owner: sshlg-skills. Source: the family routing audit of 2026-10-08, run against the
installed runtime 1.53.0. Branch `feat/routing-coverage`, base `4374ffe` (v1.53.1).

## What the audit measured

| | Finding | Measured |
|---|---|---|
| a | Trigger matching is lexical: «телеграм-бота», «Telegram-бота», «макеты», «иконку», «ролик», «сделай дашборд в админке», "fix this bug", "promo video" reach nothing | 6 of 12 sampled Russian tasks printed no routing line, so the `PreToolUse` escalation had nothing to escalate |
| b | The hook names facets, not the chain: «сделай редизайн лендинга» classifies as change + write and prints sheleg-design + copywriting, no task-pipeline line | one prompt, reproduced on `4374ffe` |
| c | Media has no route: no hook route, no conflicts lexicon, no toolkit priority, so foreign skills win "make a promo video" | — |
| d | `injectors` does not read MCP server `instructions`, which load into every session and carry routing language | Figma's "even if Figma isn't named" |
| e | `toolkit --for` printed NOTHING for 6 of 14 tasks and dropped a family skill's own advertised term as non-discriminating | payment bug, icon, Telegram bot, animations, orchestrator, "add Stripe checkout" |
| f | `xr-dev` and `web3d-dev` have rows in the map table and no router paragraph | the operator's block on this machine |

## Requirements and evidence

Every evidence cell is a command run on this branch. "At base" means the same new test run
against the `lib/`, `bin/` and `hooks/` of `4374ffe`, extracted with `git archive`. That is
how each new check was watched failing before the implementation existed.

| REQ | Requirement | Evidence |
|---|---|---|
| REQ-01 | A three-letter Cyrillic consonant-final word inflects (`бот` → «бота»); a declared Cyrillic brand stem also matches its Latin spelling inside Russian text (`телеграм` ↔ "Telegram", `фигма` ↔ "Figma"); a route may declare OBJECTS that route only behind an action verb | `node test/triggers_test.js` → `OK (61 checks)`; at base `10 failure(s) out of 61 checks` (word forms, brand alias, objects, chain, xr/web3d, external) |
| REQ-02 | The 12 audit tasks, their EN variants and the controls run in `npm test` with exact route sets, and the harness refuses planted defects | `node test/hook_routing_eval_test.js` → `OK (8 checks)` over 38 cases; at base it dies on `T.externalRoutes is not a function`; three plants inside the suite (no declared route, telegram-dev removed, chain off) each fail at least the asserted number of cases |
| REQ-03 | A subject route on a prompt that writes also names task-pipeline; a question, an explanation and an audit do not | triggers fixtures "a subject route on a prompt that writes also names the pipeline" and "a question, an explanation and an audit do NOT gain the pipeline"; eval cases `quiet-03` («проверь дизайн лендинга» → `sheleg-design` only) and `3d-01` |
| REQ-04 | `config set routes.external.<name>.*`; the hook prints it; the escalation names it; `conflicts` flags foreign skills; `toolkit --for` ranks it first; neutral `example-media` only | `node test/external_routes_test.js` → `OK (12 checks)`; at base exit 1; plant: the declared-skill exclusion removed from `lib/conflicts.js` → its fixture fails. Running `sshlg-skills conflicts` on a real machine after the PR opened showed the command never handed the declaration to the library while every library fixture passed; the process-level fixture "the COMMANDS read the declaration" was added, watched failing on `8b7d5cc`'s launcher, and the wiring fixed |
| REQ-05 | `injectors` reads MCP declarations (global, project, enabled plugins) and delivered instructions, flags routing language as candidates, and stays read-only | `node test/injectors_test.js` → `PASS: injectors — 20 checks`; at base `6 of 20 failed`; plant: one `writeFileSync` inside `readMcp` → the READ-ONLY fixture fails. Live: `node bin/sshlg-skills.js injectors` lists `plugin:figma:figma` ("whenever", "MANDATORY", "even if … isn't named") and `context7` ("whenever", "prefer this over"); 40 declared, 19 read, 24 not read; 0.3 s |
| REQ-06 | `toolkit --for` seeds from `triggers.match()`; a word a family trigger carries is never dropped | `node test/toolkit_test.js` → `OK (21 checks)`; at base `3 failure(s)`; plant: `isProtected` returning false → "still dropped: payment, checkout". Live on this machine, all six audit tasks lead with a `>` routed row |
| REQ-07 | Router paragraphs, routes and refusals for xr-dev and web3d-dev; `routers --update` keeps authored wording and is idempotent over three runs | `node test/router_texts_test.js` → `OK (90 checks)`; `node test/install_routers_test.js` → `OK (17 checks)`, including the three-run fixture: run 1 differs from the seeded file, runs 2 and 3 equal run 1, the authored super-ux text survives, the drift is reported, a backup is taken. At base: "xr-dev never arrived" |
| REQ-08 | `PENDING` in `lib/triggers.js`, read by the soundness fixture and by `test/advertised_check.js`; a stale excuse fails | triggers fixtures "every trigger is a word the skill itself advertises" (the stale branch) and "a PENDING excuse names its skill…"; `node test/advertised_check.js --member super-ux --root skills/super-ux` → `pending: … "макет" …`, exit 0 |
| REQ-09 | README, DOCMAP ratchets, CHANGELOG, a minor bump | `npm test` → `COUNTED: 90 suites, 1106 fixtures, 11 pinned members`, agreeing with the ratchet marker; `package.json` 1.54.0 (remote tags end at v1.53.1) |
| REQ-10 | The operator's real route is written to the LOCAL config only, after the PR opens | recorded in the run report, not in this repository |

## Decisions

- **Objects, not bare nouns.** `дашборд`, `баг`, `app store`, `animation` and `screen`/`экран`
  occur in reports and questions as often as in requests, so they route only behind an
  action verb. `оплата`/`payment` and `figma`/`фигма` route bare: they carry no second
  trade here.
- **The chain reads a subject list, not every route.** `project-audit`, `evidence-docs`,
  `seo-llmo`, `make-skill` and `agent-sync` already say what kind of act it is. Declared
  external routes do not chain either: making media changes no repository.
- **Refusals by member name** («без xr», «без web3d»), not by subject. «лендинг без 3d» is
  something an operator says about a design, and it would silence every router.
- **`injectors` never asks a server.** The delivered text comes from what Claude Code
  recorded. Calling `initialize` would run other people's code with this machine's
  credentials.
- **The model-run routing eval declares its unprobed routers by name** (`telegram-dev`,
  `xr-dev`, `web3d-dev`) instead of allowing a count of two.

## Handoff

- Objective: the six findings above, as one PR on `feat/routing-coverage`.
- Open: the two `PENDING` words wait on member changes. super-ux `ux-flows` must advertise
  «макет», and task-pipeline must advertise «баг». Each re-pin deletes its entry in the same
  change, or `test/triggers_test.js` fails it as stale. telegram-dev PR #10 (advertising
  «Telegram-бота») needs no entry, because the brand alias already routes that form.
- Open: xr-dev's and web3d-dev's own `test/validate.py` do not call
  `test/advertised_check.js` yet, so `npm run test:plants` declares both in
  `AWAITING_MEMBER_GATE` (`test/advertised_plants.py`) rather than planting there. Each
  entry fails as stale once its member's validator names the check.
- Not done here, by instruction: merge, tag, release, `sshlg-skills update`.
- Next task: after the merge and release, run `npx sshlg-skills routers --update` on the
  operator's machine to add the two router paragraphs to the live block.
