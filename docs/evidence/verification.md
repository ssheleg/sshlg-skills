# Verification ledger — sshlg-skills

One row per shipped REQ, and what confirmed it. `green` in a gate means the
suite passed; **`verified` here means a person or a command looked at the thing
itself.** The two are different, and the gap between them is what this file
exists to keep visible.

**This ledger has no `Human` column, and that is a decision with a consequence.**
`verified` above means *a person or a command* — the two are not separated here, so the
question *"has anybody actually looked?"* cannot be asked of these rows at all. Of the
**549** id'd requirement rows below, **498** read `verified` and none of them says which
— **recomputed by the run itself** (`test/validate.py`, the counted-claims registry), with
`grep -cE '^\|[[:space:]]*[A-Za-z0-9]+-[0-9]+[[:space:]]*\|'`, a pattern that matches every
id shape this file uses. Three figures have stood here and the first two were both wrong:
*322 / 295*, written at v0.76.0 and never recomputed; then *119 / 113*, counted on
2026-08-16 with `[A-Z]+-[0-9]+`, which was **ten short and blind to 278 rows** whose ids
read `U3-01`, `B29-1` or `I4-3`. A number nothing recomputes is a number that describes
the day it was typed, which is why this pair is now registered rather than written.

`/task-pipeline checkup` counts rows sitting at `never`, and this shape holds no such
value. So the exposure line prints `0 unverified` **and then names the column it read** —
*every shipped row is confirmed in its `status` column, which does not separate a person
from a command*. That is the honest form: a zero in this file's own vocabulary, with the
vocabulary's limit attached. The sentence that used to stand here promised a `never` count
its own table could never produce.

**Adding the column later would not reach backwards.** New rows would start at `never`;
writing retrospective human confirmations for rows nobody actually reviewed is the
failure the `evidence-docs` router names, and a back-filled ledger is worse than an absent
column because it answers the question wrongly instead of not at all.

**Started 2026-08-10.** Rows before that date do not exist: this repository
shipped eleven releases without a ledger, and inventing retrospective
verification statuses for them would be the exact failure the `evidence-docs`
router names. What shipped earlier is confirmed by its own CHANGELOG section
and nothing more, and that is stated rather than papered over.

## 2026-09-01 — v1.22.0, `list` answers the two questions it was offered for

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| LST-1 | Every member's entry point and role appear in `list` | fixture reads `skills.json` and asserts each `role` and each non-null `entry` is in the output; against the previous commit it reports `list never prints super-ux's role` | v1.22.0 | a member gaining a role the roster does not render — the fixture reads the manifest, so it fails in the same change | 2026-09-01, main thread |
| LST-2 | A member with no entry point says so | three of nine genuinely have none, and the roster prints `—` rather than a blank cell, because an empty column reads as an omission rather than a fact | v1.22.0 | the placeholder being dropped | 2026-09-01, main thread |
| LST-3 | The default output is a roster, not a wall | 22 lines / **5,398 bytes** → 15 lines / **984 bytes**; the nine descriptions moved behind `--verbose`, asserted in both directions so the flag cannot quietly become a no-op | v1.22.0 | the descriptions returning to the default output | 2026-09-01, main thread |
| LST-4 | The roster and the routing block's map table cannot drift | both render `skills.json`'s `role` cell, so a member's role has ONE home and no second consistency check is needed | v1.22.0 | either surface starting to carry its own copy of the role | 2026-09-01, main thread |

## 2026-09-01 — v1.21.0, three pins after the registry-card wave

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| PIN6-1 | Three members sit on their release tags and all three pin surfaces agree | `git -C skills/<m> checkout v0.52.4 / v1.58.3 / v0.11.4`, `package.json` read back → 0.52.4, 1.58.3, 0.11.4; `skills.json` and README rows 42, 46, 48 moved in the same change; `npm test` → `rc=0`, `COUNTED: 46 suites, 793 fixtures, 9 pinned members` | v1.21.0 | any of the three releasing again | 2026-09-01, main thread |
| PIN6-2 | The wave closes ONE finding across four members | `SKILL-CARD.md` was behind in four of nine — agent-stack by ten minor releases, sheleg-design by six, super-ux by four, sheleg-dev by one — and each now carries the same check, refusing a disagreeing `Version` row and a card that states no version at all | v1.21.0 | a fifth member gaining a card without the check | 2026-09-01, main thread |
| PIN6-3 | Porting one check into four members took four different shapes, and it is on the board | four registration idioms (direct call, `@check` decorator, a `CHECKS` list, a call from `main()`), three CHANGELOG heading formats, three to six version surfaces. `B-138` carries the measurement: `installer_test.js` in seven members at 0.918–0.977 similarity, zero declaring the seam, invisible to a guard that reads `test/*.py` only | v1.21.0 | the guard's extension landing, which closes B-138 | 2026-09-01, main thread |
| PIN6-4 | `task-pipeline` is deliberately out of this wave too | the registry still serves 1.81.1 while v1.82.3's stamp half is in CI. Pinning a version npm does not serve would advertise an install that cannot happen | v1.21.0 | v1.82.3 publishing | 2026-09-01, main thread |

## 2026-09-01 — v1.20.0, the copy is the value and the decision was never ours

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| ALW-1 | The happy path emits no permission decision | scratch HOME, `Edit` on `~/.claude/CLAUDE.md` → `exit 0`, **stdout empty**, one copy on disk, and stderr carries `copy taken before the write: <path>`. Against the previous commit stdout carried `permissionDecision: "allow"` | v1.20.0 | any branch answering `allow` on a successful copy | 2026-09-01, main thread |
| ALW-2 | `deny` still fires, which is the whole value | same probe with `~/.sshlg-skills/backups` made impossible (a regular file at that path) → `decision: deny`, naming the directory to fix. The refusal half is untouched | v1.20.0 | the deny branch being softened to a warning | 2026-09-01, main thread |
| ALW-3 | The fixture asserts an ABSENCE, and needed a new helper to do it | `runHook` parses stdout as JSON and returns `null` when empty, which cannot separate *no decision* from *a decision that failed to parse* — and *no decision* is what the happy path must produce. `runHookRaw` returns stdout and stderr unparsed | v1.20.0 | the fixture reverting to `runHook`, where an empty and a malformed output look alike | 2026-09-01, main thread |
| ALW-4 | The trade is stated rather than hidden | this is MORE friction: the operator is prompted again for writes to the five files, exactly as before the pack was installed. The pack's offer was always the copy, not the approval — and the `allow` was asserted by a fixture and acknowledged in no document | v1.20.0 | nothing — this is a decision, and the row is where it is recorded | 2026-09-01, main thread |

## 2026-09-01 — v1.19.0, three pins measured against the registry

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| PIN5-1 | Three members sit on their release tags and all three pin surfaces agree | `git -C skills/<m> checkout v1.19.1 / v0.25.10 / v0.23.1` then `package.json` read back → 1.19.1, 0.25.10, 0.23.1; `skills.json` and README rows 44, 47, 49 moved in the same change; `npm test` → `rc=0`, `COUNTED: 46 suites, 793 fixtures, 9 pinned members` | v1.19.0 | any of the three releasing again | 2026-09-01, main thread |
| PIN5-2 | The pins were compared against what the REGISTRY serves, not against the local checkouts | `npm view` per member at cut time: agent-sync 1.19.1, seo-aeo-audit 0.25.10, agent-stack 0.23.1. `~/DATA/agent-stack` was six commits behind and would have reported 0.18.2 — the `ARCH-6` gap between the submodule and the convenience clone, which showed up twice in one day | v1.19.0 | nothing — this is a discipline, and the row exists so the next run repeats it | 2026-09-01, main thread |
| PIN5-3 | The gitlink moved under coordination for the first time | `skills/*` joined `guardedFiles` in v1.17.0, so this is the first pin wave where the third coupled surface is guarded rather than only the other two | v1.19.0 | the pattern being dropped from `.claude/agent-sync.json` | 2026-09-01, main thread |
| PIN5-4 | `task-pipeline` is deliberately NOT in this wave | the registry still serves 1.81.1: v1.82.0, v1.82.1 and v1.82.2 are dead tags, and v1.82.3 is the repair in flight. Pinning a version npm does not serve would advertise an install that cannot happen | v1.19.0 | v1.82.3 publishing, which is the next wave's first row | 2026-09-01, main thread |

## 2026-09-01 — v1.18.0, seven ordinary ways to destroy the operator's file

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| SPL-1 | Every ordinary spelling of a write to a protected file is caught | twelve spellings through `guard.decide` — plain tilde, plain absolute, quoted `$HOME`, quoted `${HOME}`, quoted tilde, no-space-before-quote, `2>`, `&>`, the clobber form, `>>`, `tee`, `rm` — all return the file. Against the previous commit seven of them returned `null` | v1.18.0 | a redirect form this matrix does not list | 2026-09-01, main thread |
| SPL-2 | The one the module meant to catch was defeated by a quote | `spellings()` enumerates `$HOME/…` and `${HOME}/…` deliberately, and `REDIRECT` was tested against `segment.slice(0, at)`, which ends in the quote — so the author's own enumeration was cancelled by standard agent practice | v1.18.0 | the operator regex losing its optional quote | 2026-09-01, main thread |
| SPL-3 | Widening it bought no false positives, and that is asserted as hard | four non-writes still pass: reading the file, writing a neighbouring one, the name inside a pipe, a `diff`. The hook answers `allow` after taking its copy, so an over-catch spends the operator's own permission prompt on an unrelated call | v1.18.0 | the matrix losing its negative half | 2026-09-01, main thread |
| SPL-4 | The remaining gap is declared and cannot close unnoticed | a third fixture asserts the cwd-relative spelling is still `null`, so closing it fails here and forces `B-136` to close in the same change | v1.18.0 | `payload.cwd` resolution landing without updating the row | 2026-09-01, main thread |
| SPL-5 | The heredoc case is pre-existing, not a regression from this change | `cat <<EOF … > ~/.claude/CLAUDE.md … EOF` is caught by the PREVIOUS commit too — verified before filing, so `B-136` describes a standing gap rather than damage done here. `lib/hygiene.js` has the `executablePart` treatment from B-59; `lib/guard.js` never received it | v1.18.0 | `guard.js` gaining that treatment | 2026-09-01, main thread |

## 2026-09-01 — v1.17.0, four guards that were looking somewhere else

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| GRD-1 | `hooks` no longer reports a byte-perfect install as stale | on this machine `diff -rq hooks ~/.sshlg-skills/runtime/hooks` is silent, and `hooks` went from `НЕ установлено или устарело — SessionStart (refreshed), UserPromptSubmit (refreshed), PreToolUse (refreshed), PostToolUse (refreshed)` to `всё на месте и совпадает` | v1.17.0 | the planner appending our entry instead of replacing it in place | 2026-09-01, main thread |
| GRD-2 | The fixture reproduces the real machine's state, not the convenient one | the pre-existing no-op fixture seeds `[theirs]` so ours lands second and the order matches; the new one seeds ours FIRST and another pack after, which is this machine. Against the previous commit it reports `a byte-identical install was reported as changed: SessionStart (refreshed)` | v1.17.0 | the fixture being rewritten to seed the foreign hook first | 2026-09-01, main thread |
| GRD-3 | The write-path corpus is discovered, and the discovery immediately paid | scanning `lib`, `hooks`, `bin` instead of two named files surfaced `lib/backup.js:118`, `lib/store.js:45` and `lib/turnstate.js:60` — none a defect, all writing the pack's own state, and all invisible to the line-level exemption because their writes are generic | v1.17.0 | the corpus being narrowed back to a list | 2026-09-01, main thread |
| GRD-4 | The exemption list is itself held to the tree | a second fixture asserts the unguarded set is exactly those three, so a fourth module writing outside `protect()` fails here rather than being waved through by a widened regex | v1.17.0 | a module legitimately joining the set without being argued for | 2026-09-01, main thread |
| GRD-5 | The gitlink is under coordination | `git ls-files -s skills/super-ux` → `160000 23d6949… 0 skills/super-ux`, a tracked entry a `skills/*` pattern matches; `guardedFiles` now carries it beside `skills.json` and `README.md`, the other two coupled pin surfaces | v1.17.0 | the pattern being dropped again on the reasoning that a gitlink is not a file | 2026-09-01, main thread |
| GRD-6 | The shadow guard says so when it cannot look | process-level fixture runs `hooks/pre-tool-use.js` with no `skills.json` beside it: exit 0, no `permissionDecision`, and stderr carries `no skills.json beside the hook`. Against the previous commit the same fixture reports `the guard went inert without saying so: stderr=""` | v1.17.0 | the diagnostic being routed through `say()`, which would make a missing manifest into a verdict | 2026-09-01, main thread |

## 2026-09-01 — v1.16.0, a phantom in the roster and a module with no callers

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| RST-1 | A directory with no `SKILL.md` is not counted as a skill | fixture builds a plugin with `real/SKILL.md` and `references/best-practices.md`; `readSkills` returns `['real']`. Against the previous commit the same fixture returned `['real','references']`. End to end: `toolkit` reads `518 skills reachable` where it read `519`, and `--expand super-ux@super-ux` no longer lists `references` | v1.16.0 | the plugin scan losing the `SKILL.md` test — the fixture is filesystem-level, not a mock | 2026-09-01, main thread |
| RST-2 | The plain-copy scan is deliberately unchanged | in `~/.claude/skills` a symlink IS the skill and the shadow detector must see it whether or not the target resolves, so only the plugin branch gained the test | v1.16.0 | a future run applying the same filter there and blinding the shadow guard | 2026-09-01, main thread |
| ORP-1 | No module in `lib/` is unreachable from production code | the guard walks `lib`, `hooks`, `bin`, `scripts` for real `require(…)` in the three shapes this codebase uses; with `lib/router-texts.js` restored it reports it by name, and returns `[]` once moved | v1.16.0 | a module reached only through a string built at run time — the guard reads source, not behaviour | 2026-09-01, main thread |
| ORP-2 | The orphan stopped shipping | `npm pack --dry-run \| grep -c router-texts` → `1` before, `0` after; `test/` is not in `package.json`'s `files`, and `runtime.sync` copies `lib` and `hooks`, not `test` | v1.16.0 | `files` gaining `test`, or `runtime.DIRS` gaining it | 2026-09-01, main thread |
| ORP-3 | The guard's FIRST version was a green that meant nothing, and was caught | it matched the module name anywhere in a file and PASSED with the orphan still in `lib/`, because `routers-registry.js` names it in a comment about where the text used to live. Found only by making the fixture fail against the old state; it reads `require(…)` now | v1.16.0 | the matcher widening back to a substring test | 2026-09-01, main thread |
| DEF-1 | The one-string block contradiction is deferred with its cost measured, not discovered halfway | changing `super-ux`'s `role` turned `check_every_member_commits_the_exact_pixels` red — `role` feeds `scripts/site.js` and the member's committed `docs/assets/social-preview.png`, so it needs a `super-ux` release and a re-pin. Filed as `B-131` with the fixture written and held back with it | v1.16.0 | the card coupling being removed, which is `B-118`'s ground | 2026-09-01, main thread |

## 2026-09-01 — v1.15.1, the family stops disowning its own members

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| SIG-1 | Every member and router name the routing block tells an agent to pass resolves | all 21 names (9 members + 12 routers) through `signature.index()` → `unresolved now: NONE`; against the previous commit the same probe returned 9 — `super-ux`, `sheleg-dev`, `agent-stack`, `telegram-dev`, `seo-llmo` | v1.15.1 | a member arriving whose name is neither a skill name nor a key — the fixture reads the manifest, so it fails in the same change | 2026-09-01, main thread |
| SIG-2 | A router address is derived from the registry, not listed | `addRouters` reads each router's own `requires` and resolves through the manifest; `project-audit` → `task-pipeline` without that pair being named anywhere in `signature.js` | v1.15.1 | a router declaring a member the manifest does not carry | 2026-09-01, main thread |
| SIG-3 | A standing rule that ships in no pack points at the bundle rather than at an invented member | `index(manifest).get('seo-llmo')` → `{"member":null,"repo":null,"url":"https://github.com/ssheleg/sshlg-skills","standingRule":true}` — the block says in its own words that `seo-llmo` ships in no pack | v1.15.1 | `seo-llmo` gaining a `requires` entry, which would make it a member's router | 2026-09-01, main thread |
| SIG-4 | Both fixtures fail against the code they were written for | `git stash` the fix → `EVERY NAME THE ROUTING BLOCK TELLS AN AGENT TO PASS RESOLVES` reports the nine names and `a standing rule…` reports *"seo-llmo does not resolve at all"*; restored → `OK (13 checks)` | v1.15.1 | the fixtures being rewritten to assert a hard-coded list rather than reading the manifest and the registry | 2026-09-01, main thread |

## 2026-09-01 — v1.15.0, consent misread in both directions

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| CON-1 | `applyCursor` refuses a recorded `no` and no longer creates the rule | scratch HOME, `state.json` = `{"routers":"no"}`, `~/.cursor/rules` present, `routers --update` → `.claude/CLAUDE.md — no-block` and `.cursor/rules/sshlg-routing.mdc — absent`; the same probe against the previous commit returned `created`, 22 512 bytes | v1.15.0 | `applyCursor` gaining a write path that skips the `existing === null` branch | 2026-09-01, main thread |
| CON-2 | A target the pack did not have last time still arrives under recorded consent | same HOME with `state.json` = `{"routers":"yes"}`, mode `update` → `sshlg-routing.mdc — created`, 22 512 bytes — the Gemini case, which is why the guard is not a flat refusal | v1.15.0 | the `newTargetUnderConsent` exception being dropped as redundant | 2026-09-01, main thread |
| CON-3 | Both new `applyCursor` fixtures fail against the code they were written for | `git stash` the fix, `node test/apply_test.js` → `2 failure(s) out of 17`, both reporting `action: "created"`; restored → `OK (17 checks)` | v1.15.0 | the fixtures being rewritten to assert the return value rather than the file's absence | 2026-09-01, main thread |
| CON-4 | `quick` and `as is` fired on ordinary work language, and no longer do | 13-prompt corpus through `optedOut`, culprit attributed per phrase: `as is` → 3, `quick` → 3, `draft it` → 1, `no docs` → 1, `как есть` → 1, `на словах` → 1. After the change the eight-prompt fixture returns `[]`; against the old list it returns six | v1.15.0 | a router advertising either phrase again — the coupling fixture reads the registry's own refusal lines | 2026-09-01, main thread |
| CON-5 | The two silence probes are silenced by having no trigger, not by a refusal | the same probe reports `ok (no refusal)` for «сделай форму логина на react» and «настрой мониторинг и алерты` — so the corpus measures over-firing rather than absence, which is what makes CON-4 readable | v1.15.0 | the probe being replaced by one that reads `match()` instead of `optedOut()` | 2026-09-01, main thread |
| CON-6 | The registry and the matcher cannot drift apart on a refusal phrase | mid-edit the two files were out of step and `every refusal the routing block advertises is one this module parses` refused — the fixture catching its own subject during this change | v1.15.0 | the fixture restating the phrase list instead of reading it | 2026-09-01, main thread |
| CON-7 | Two pins moved on all three surfaces | `make-skill` 0.25.3 → 0.26.0 and `agent-stack` 0.22.0 → 0.23.0 in `skills.json`, the gitlink (`git checkout v0.26.0` / `v0.23.0` in each submodule) and the README table rows 45 and 49; `npm test` → `rc=0`, `COUNTED: 46 suites, 783 fixtures, 9 pinned members` | v1.15.0 | either member releasing again | 2026-09-01, main thread |

## 2026-09-01 — v1.14.0, six pins and the card coupling resolved

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| PW4-1 | Six submodules sit on their annotated release tags and the three pin surfaces agree | `git -C skills/<m> describe --tags` → v0.22.0 / v0.1.11 / v0.25.9 / v0.11.3 / v1.19.0 / v1.81.1; make-skill, sheleg-design and super-ux already current; `npm test`'s pin check reads the version out of each pinned `package.json` against `skills.json` and the README row | v1.14.0 | any member release after 2026-09-01 | verified |
| PW4-2 | Every pinned version is the one the registry serves | `npm view <pkg> version` polled at cut time for all nine: 0.25.3, 0.1.11, 0.22.0, 0.25.9, 0.11.3, 0.52.3, 1.58.2, 1.19.0, 1.81.1 — pins set from that reading, never from a report | v1.14.0 | a member publishing without a tag | verified |
| PW4-3 | B-127's coupling is resolved and the member's card reproduces | role cell shortened to `orchestration, prompts, evals, protocols, and the LLM wallet` and `agent-stack` dropped from `LEGACY_FIT`; `node test/site_test.js` → `PASS: site — 42 checks (13 pages, 9 members, 12 routers)` on the v0.22.0 submodule, which byte-compares the member's committed pixels against `site.build()`'s render | v1.14.0 | agent-stack regenerating its card with different words | verified |
| PW4-4 | The gate is green at the re-derived ratchet | `npm test` exit 0: `COUNTED: 46 suites, 780 fixtures, 9 pinned members`; the DOCMAP marker already read 46/780 and was not touched by hand | v1.14.0 | the next commit that moves either count | verified |

## 2026-08-31 — v1.12.0, eight pins after the tails wave

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| PW3-1 | Eight submodules sit on their annotated release tags and the three pin surfaces agree | `git -C skills/<m> describe --tags` → v0.52.2 / v1.80.0 / v1.18.7 / v1.58.2 / v0.25.8 / v0.11.2 / v0.17.1 / v0.1.10; make-skill already at 0.25.3 from a concurrent pass; `npm test`'s pin check reads each pinned `package.json` against `skills.json` and the README row | v1.12.0 | any member release after 2026-08-31 — the pin lags until the next pass | verified |
| PW3-2 | Every pinned version is the one the registry serves | `npm view <pkg> version` polled at cut time for all nine: 0.25.3, 0.1.10, 0.17.1, 0.25.8, 0.11.2, 0.52.2, 1.58.2, 1.18.7, 1.80.0 — pins set from that reading, never from a report | v1.12.0 | a member publishing without a tag, which the pin check would then disagree with | verified |
| PW3-3 | B-124 records the recurrence class the coordinator observed rather than leaving it in a chat | `docs/evidence/backlog.md` row B-124, filed open with its three observed recurrences and P computed by the board's own formula (2.0, watched failing at 4.0 until the validator refused it) | v1.12.0 | task-pipeline shipping the stage-10 change the row names | verified |

## 2026-08-27 — SEO, the site nothing had ever crawled

Asked for as *"seo aeo аудит и сразу оптимизация всех ресурсов"* — the site, ten GitHub
repositories and ten npm package pages, where the previous pass had audited the site
alone. The widening is what found the blocker: `/` and eleven siblings were **unknown to
Google**, so every improvement the 2026-08-26 pass shipped had been made to pages no
engine had fetched. Two of the rows below are corrections to that pass, and one is a
correction to this one.

**`Observed at` was written after the merge strategy had its say**, per the lesson the
SITE section below paid for: `main` is protected, merge commits are forbidden, and a
rebase merge rewrites every commit it replays. These five SHAs were each re-checked with
`git merge-base --is-ancestor <sha> origin/main` before being written here.

| REQ | What shipped | How it was confirmed | Observed at | Invalidated by | Status |
|---|---|---|---|---|---|
| SEO-1 | **The sitemap was submitted to Search Console for the first time.** 12 of 12 URLs read `verdict=NEUTRAL`, `coverage=URL is unknown to Google`, `last crawl: None` — `robots.txt` named the sitemap and no property had ever been told about it | `url_inspection.py` over all 12 declared URLs before the fix, 12/12 unknown. `PUT .../sitemaps/<feed>` → HTTP 204; the property then reports `lastSubmitted=2026-08-27T00:34:43.437Z errors=0 warnings=0 contents: web submitted=12`, re-read after the pass | `n/a` — a Search Console mutation, not a commit | Google re-crawling, which is the event this row exists to enable and cannot itself observe | verified |
| SEO-2 | **Submission is recorded as declaration, never as indexation** | the sitemaps endpoint's `indexed` field reads 0 and Google no longer populates it — the skill's own probe prints that caveat. So the row claims only that the site is now declared, and the plan's single next action is a re-inspection in 3–7 days | `e94e827` | the re-inspection, whichever way it resolves | verified |
| SEO-3 | The previous audit's instrument list said Search Console had **no credential**; it had one | the gates were two and neither was the credential: the API needs `x-goog-user-project` naming a usable project, and the property is `sc-domain:sshlg.me`, a **domain** property covering the subdomain with no per-subdomain entry. `preflight.py` went 5/8 → 6/7 sources on the same machine, same account, once both were supplied | `e94e827` | the property being deleted or the account losing it | verified |
| SEO-4 | **Every pack page now says what each skill it ships DOES.** Nine pages rendered the skills' *names* as pills and never their purpose | link chrome measured near-constant at 315–336 words across all nine, so the variance was entirely in body prose: `/skills/seo-aeo-audit/` at 173 prose words vs 318 link words (35.2%). Derived from each `SKILL.md` front-matter `description` — the string the agent runtime itself matches on, so a page cannot advertise a capability the skill does not claim. Measured on the **served** HTML after deploy: sheleg-dev 58.6%→76.1%, agent-stack 63.2%→75.4%, super-ux 66.1%→75.3%, telegram-dev 64.4%→73.8%, seo-aeo-audit 35.2%→41.8% | `a8a9fb4` | a member rewording its description into a shape the transform mishandles, which fails `test/brief_test.js` rather than reaching a page | verified |
| SEO-5 | The trigger enumeration is **removed** before publication, not rendered | those descriptions end in a bilingual list of the phrases that fire the skill (`"SEO audit" / "сделай SEO-аудит"`, eleven more per skill). On a public page that is a keyword list wearing prose — the one tactic non-negotiable #5 forbids, in an audit of this family's own site. `lib/brief.js` keeps what the skill is for and what it is not for | `a8a9fb4` | a description whose capability text is itself keyword-shaped, which no transform can fix | verified |
| SEO-6 | **A defect this pass shipped into the generator and caught before deploy** | the first stripper used a character class of *every* quote mark, so `"why doesn't ChatGPT cite us"` ended at `doesn` and half a Russian keyword list bled into `/skills/seo-aeo-audit/` as prose with a stray `"`. Caught by asserting the SHAPE of all 28 rendered briefs — no quote residue, no dangling connective, no doubled punctuation, ends in a full stop, ≥12 words — not by reading them. Two plants watched refusing: the any-quote class (3 failures, one of them naming the real shipped page) and labelled-list stripping disabled (1) | `a8a9fb4` | nothing — it is re-derived over every shipped skill on every run | verified |
| SEO-7 | **The family's traffic is one number, before the source forgets it** | GitHub reports per repository and the family is ten; the traffic API keeps **14 days and nothing older**, so a month uncaptured is unrecoverable. `scripts/traffic.js --snapshot` merges on `(repo, date)`; idempotence proven the way this repository requires — the real command three times against a real file, `shasum` identical, 140 rows. First reading: **182 views, 19,733 clones** family-wide | `62cdd0d` | a member added to `skills.json` and not to the family — the repo list is derived from it, and a fixture asserts the two cannot diverge | verified |
| SEO-8 | A repository that refuses the traffic call is **named, never counted as zero** | traffic is admin-only data, so a public-read token still gets 403, and a silent zero is indistinguishable from a quiet week. Plant dropping the denied list refused, naming it. The scheduled job is gated on a secret that does not exist yet and **skips rather than fails** — a workflow that goes red every morning teaches an operator to ignore a red workflow | `62cdd0d` | the secret being created, which turns the skip into a daily commit | verified |
| SEO-9 | **All nine members carry the `skills.sh` badge**, naming a channel that was already sending installs | nine listings resolve 200 and the umbrella does not; badge endpoint and listing page checked 200 each for all nine **before** the first commit. Install counts read the same day: 2,051 across the family. Nine PRs, each through required checks — `task-pipeline`'s own `validate` is 444 steps and took **1h18m**. Verified after merge by fetching `README.md` from each member's `main` via the API: 9/9 contain `skills.sh/b/` | `b34ab90`, `168d6d6` | skills.sh changing the badge address, which the family would learn from a broken image rather than from a check | verified |
| SEO-10 | **The pins written here are the rebase-merged ones, because the validator refused the others** | the nine local commits were orphaned by GitHub's rebase merge, and `test/validate.py` refused the pointer bump before it could ship: *"skills/super-ux: 1 commit(s) exist only locally — a pin naming one of them fails every clone with `upload-pack: not our ref`"*. Resynced to `origin/main`; all nine re-checked with `merge-base --is-ancestor` against their own remote | `b34ab90` | nothing — the guard runs on every gate, and this is the second pass it has caught the same class in | verified |
| SEO-11 | **A finding this pass raised at med-high and then retracted** | G2 said the umbrella's `skills.sh` 404 was *"the family's front door missing from a discovery channel"*. Checked from the umbrella rather than from a submodule directory the shell had been left in: `git ls-files \| grep -c SKILL.md` → **0**, no `.claude-plugin`, `skills/` a tree of gitlinks. It ships no skills — it is a launcher (`npx sshlg-skills install`, never `npx skills add ssheleg/sshlg-skills`), so a listing would advertise an install path that does not exist and the 404 is the channel being right. The observation was real, the cause was real, the conclusion was wrong; the row is kept rather than deleted | `b34ab90` | the umbrella ever vendoring skills into its own tree | verified |
| SEO-12 | **More metadata will not make the repositories rank, and the plan says so instead of adding some** | absent from the top 100 for `agent skills`, `claude code plugin`, `claude code skills`; ranked 43 and 17 for two near-name queries. All ten repos already carry a description, a homepage, 8 topics and a custom OG image. `mattpocock/skills` holds **237,955 stars and 20,248 forks with zero topics and no custom OG image** — cross-checked against the API and against the all-time leaders (freeCodeCamp 454,640). Tier `STUDY`: the correlation is observed, the mechanism is not claimed, and the negative — completeness is not sufficient — is `CONFIRMED` by the counter-example | `e94e827` | GitHub publishing or changing its ranking model | verified |
| SEO-13 | **The star-history widget was NOT shipped, and the reason is recorded** | `api.star-history.com` returns a 60 KB placeholder reading *"GitHub restricted access to star data"* for every repository including ours — fetched single-repo, multi-repo and `theme=dark`, all three byte-identical in size and none containing a repo name. GitHub restricted the stargazers endpoint on 2026-06-30. The vendor's workaround wants a GitHub token handed to a third party and an encrypted token embedded publicly in ten READMEs, which is the operator's decision; shipping it now would put a broken chart at the top of ten READMEs | `e94e827` | the operator completing the token step, or GitHub restoring the endpoint | verified |

### What this section does not verify

**Nothing here is known to have changed what any engine does.** The site had never been
crawled, so every row above is about what the pages now *offer* a crawler. The previous
plan said the same thing and was right to; what changed is that the cause is measured
rather than assumed, and removed. `PageSpeed Insights` was rate-limited (HTTP 429) for the
whole pass, so no field Core Web Vitals figure was read and none is claimed. `Bing`,
`Yandex`, analytics and server logs have no credential here. No crawl export was run, so
site orphans and click depth are unmeasured rather than clean.

**The `faq-schema-partial` disagreement on `/agents/` is carried forward unresolved**, as
it was on 2026-08-26 and for the same reason: one disagreement of that exact class
resolved *in the instrument's favour* that day once the grep was corrected, and this pass
added a fourth instrument defect to the tally. A disagreement with live counter-examples
on both sides is not a finding in either direction.

## 2026-08-27 — SITE, two rows a reader clicked and nothing happened

Reported from the published site, not from a check: *"there are unclickable links, for
example evidence and the one next to it."* Both were real, the reading beside them found
two more untrue things on the same page, and none of the four could have been caught by
any guard this site already had — every one of them asks whether an address RESOLVES, and
these were an address never written, a token never defined, and a number never recomputed.
**Unreleased at the time of writing**: the deployment follows this section.

**Every `Observed at` in this section was written twice, and the reason is worth more
than the rows.** They first cited `d441488` and `4ae0813` — the commits this work was
actually made and measured on. `main` is protected here, so it landed through PR #10, and
the repository forbids merge commits: **a rebase merge rewrites every commit it replays**,
so those two became `1371384` and `d12e5eb` and the originals were left on a deleted
branch, on no branch at all. GitHub still serves them, because the pull request holds a
reference — which is the trap, not the reprieve: the address resolves in a browser and
resolves nowhere in a clone. A ledger row observed at a commit is written **after** the
merge strategy has had its say, or it is repointed the way these nine were.

| REQ | What shipped | How it was confirmed | Observed at | Invalidated by | Status |
|---|---|---|---|---|---|
| SITE-1 | **Every row of the front page's routing table is clickable.** `seo-llmo` and `evidence-docs` require no member, so the Router cell had no pack page to point at and rendered as bare names beside ten links | before: 10 anchors and 2 plain cells in one column, `seo-llmo` and `evidence-docs`. After: 12 rows, 12 anchors, the two standing rules carrying `routing/#<name>` — their own rule, under its own id, which is the home they do have | `1371384` | a router gaining a member, which moves it to the pack link and is guarded by the same fixture | verified |
| SITE-2 | The fragment those two now point at is checked for existing | the existing link checker strips `#frag` and asks only whether the PAGE exists, so `routing/#evidence-docs` would have passed while landing at the top of the page. `test/site_test.js` resolves the fragment too, over both spellings the site uses (`../#skills`, `/#install`); planted `routing/#no-such-rule` refused, naming `routing/index.html has no id="no-such-rule"` | `1371384` | the routing page emitting its ids in another shape, which fails as "no such id" rather than passing | verified |
| SITE-3 | A cell that is not a link, in a column of links, has to say so | the general guard fired first on `/routing/`'s *"Ships in"*, where *a standing rule* is the truth and not an omission — retro instruction #11, the instrument before the subject. Narrowed to the reader's actual signal: muted is allowed, bare ink is not. Plant restoring the two names refused, naming both | `1371384` | the site marking a non-link cell with something other than `--muted` | verified |
| SITE-4 | `color:var(--dim)` was undefined on two pages, so the cell meant to be quiet rendered loudest | 41 properties defined, 35 read with no fallback, exactly one never defined — `--dim`, on `agents/index.html` and `routing/index.html`. Invalid at computed-value time, so `color` falls back to `inherit` and *a standing rule* rendered at full ink. Now `--muted`; the guard reads every page for the class and was watched refusing the restored `--dim` | `1371384` | a token layer split across files, where a page defines properties another page reads | verified |
| SITE-5 | The evidence panel quotes the gate instead of remembering it | it said `38 suites, 667 fixtures` while `docs/DOCMAP.md`'s marker said 671 — four behind since `937566a`, which moved the marker and left the page's own copy alone. `scripts/site.js` reads the marker; `.github/workflows/pages.yml` gains `docs/DOCMAP.md`, or a moved marker would never rebuild the page that quotes it | `1371384` | the marker being renamed or dropped — the build throws rather than printing a number it guessed | verified |
| SITE-6 | The gate holds, and its own figure moved with it | `node test/site_test.js` 34 → **39 checks**; `npm test` → `COUNTED: 38 suites, 676 fixtures, 9 pinned members`, exit 0. Four plants, each asserted to have landed before the run and each watched refusing. The CI post-build pair re-run over the built artefact: 13 pages, every internal address resolves; nothing fetched from another host | `1371384` | nothing — it is re-measured by every run | verified |
| SITE-7 | **The 28 entry points a pack advertises are links to the skills themselves.** *"Each name below is an entry point an agent can be routed to"* rendered them as pills — bordered, monospace, the shape the web uses for a tag you click — that did nothing | each links to its own `SKILL.md` directory at a path READ from the tree (`plugins/*/skills/<name>/SKILL.md`), 28/28 resolved. Three of the published URLs fetched: `evidence-docs`, `sheleg-design`, `telegram-bots` → **200**. A fixture reads every built page against the tree and refuses a pill that is not a link, naming it | `d12e5eb` | a member moving its plugin layout — the build throws rather than emitting a guess | verified |
| SITE-8 | A name with nothing behind it fails the build, not the reader | planted `no-such-entry` into `skills.json`: `task-pipeline: 'no-such-entry' is advertised in skills.json and no plugins/*/skills/no-such-entry/SKILL.md exists under skills/task-pipeline`. The repo-name plant refused too, naming `skills/sheleg-design/` — the one place where repository and member genuinely diverge | `d12e5eb` | nothing — it is re-derived on every build | verified |
| SITE-9 | **A plant was written for this, run, and did not refuse — recorded rather than dropped** | composing `plugins/<member>/skills/<name>` produces the same nine URLs today, because all nine plugin directories happen to be spelled like their member, so no fixture can tell the composed path from the resolved one. What discovery buys is the `SKILL.md` check beside it, not a spelling, and the source comment says so instead of claiming a divergence that is one level up | `d12e5eb` | a member whose plugin directory stops matching its name, which would make the silent plant meaningful | verified |

## 2026-08-20 — the gate that could be walked past, and four numbers about this repository

Manifesto conformance, second pass. Rows `UM-01`, `UM-02`, `UM-04`, `UM-05`, `UM-06`,
`UM-08`, `UM-09`, `UM-10`, `UM-11` of `docs/evidence/manifesto-conformance.md`, and board
rows `B-93`…`B-102`. **Unreleased at the time of writing**: the version bump and the tag
follow this section, not the other way round.

**This section carries two columns the ones above it do not, and that is UM-05.** Proof
expires — `task-pipeline` shipped the mechanism on 2026-08-17 and the umbrella never
adopted it, so 407 rows here read `verified` with nothing that could ever un-read it.
`Observed at` is the commit the check was watched at; `Invalidated by` is what would make
the row false again. **The rows above are not back-filled**, for the reason this file
already gives one screen up: writing a retrospective observation for a row nobody
re-checked answers the question wrongly instead of not at all. From this section forward
the columns are required, and `test/validate.py` refuses a section dated 2026-08-20 or
later without them.

| REQ | What shipped | How it was confirmed | Observed at | Invalidated by | Status |
|---|---|---|---|---|---|
| U4-01 | **The commit gate no longer decides ownership from the staged index.** `git add -A && git commit` staged nothing at PreToolUse, so the gate concluded "not ours" and exited 0 without running the suite | reproduced first: the compound payload fed to `hooks/repo-gate.js` printed nothing and exited 0 with the suite never spawned. After: `permissionDecision: deny` carrying the failing tail. `test/hooks_e2e_test.js` runs the real script as a process over three compound spellings (`add -A &&`, `add . ;`, `commit -am`) | `6174583` | `lib/repogate.js commitDirs` losing a spelling; the payload dropping `cwd`; a new chaining form | verified |
| U4-02 | Ownership is derived from the command's own text and the shell's cwd — `-C <path>`, a preceding `cd`, resolved to a repository root | `git -C <other repo> commit` and a payload whose `cwd` is another repository are both left alone **while this project's index is dirty** — the state that used to claim the commit and deadlock a release | `6174583` | a payload with no `cwd` and no `-C`, where the fallback still asks the index | verified |
| U4-03 | `isCommit` reads what would RUN, reusing `executablePart()` from `lib/hygiene.js` rather than a second implementation | a whole-line comment and a heredoc body fed to `cat` are no longer commits; `bash <<EOF … git commit … EOF` still is, and so is `bash -c "git commit"` — the quoted form was passing untouched before, which was a bypass and not a false negative. 15 fixtures in `test/repogate_test.js` | `6174583` | `executablePart` changing its treatment of quotes or heredocs | verified |
| U4-04 | **The route gate speaks again.** `runOpen` is derived from the ledger's content, not from the file existing | this repository's own `.task-pipeline/run.md` has recorded `stage: 10 acceptance — verdict pass` since 2026-08-14 and is still being appended to; `runledger.isOpen` reads it as closed, and a stage-2 ledger as open. 25 fixtures, including the default that would have closed every mid-run ledger and was caught by its own fixture | `6174583` | task-pipeline changing the ledger grammar or its final stage id/name | verified |
| U4-05 | A submodule detached on a commit **no branch holds** is a failure, not a disclosure | planted a detached commit in a copied tree: before, one line among many disclosures; after, `FAIL: skills/agent-stack: detached at 40cfda6 and that commit is on no branch`. The first instrument (`git branch --contains`) prints `* (HEAD detached from …)` and read as "a branch holds it" — caught by the plant, not by review | `6174583` | `for-each-ref --contains` semantics; a submodule with no refs at all | verified |
| U4-06 | **Three numbers this repository stated about itself were wrong**, and a registry now recomputes all four | `README.md` said 20 negative self-tests against 23 in the workflow; the ledger said 119/113 id'd rows against **407/401** by a pattern that matches every id shape it uses; the conformance register's own table said 32 active rows against 41, in a file where 19 read `verified`. `check_counted_claims_agree_with_the_tree` was watched refusing a planted `**3** negative self-tests` and a planted row-count drift | `6174583` | any of the four documents rewording the sentence the pattern anchors on — which fails as "matched nothing", deliberately, rather than passing | verified |
| U4-07 | The suite's own ratchet is counted by the run and read from a marker | `test/run.js` sums every `OK (n checks)` and `PASS … — n` line and compares it with `<!-- ratchets: … -->`; it caught its own drift twice in one session (606 → 607) and printed which direction the stated figure was out by | `6174583` | a suite that prints its count in a third shape | verified |
| U4-08 | Two `judgment` gates, in the pipeline that had none | `pipeline.json` stages `brainstorm` and `spec` are typed `judgment` with a named `judge`; `grep -c judgment pipeline.json` was **0** before. The pinned schema has required a `judge` since task-pipeline `9d8695d` and `test/validate.py:184` already ran it — no new code, an unused type adopted | `6174583` | the pinned schema changing the enum or the `judge` requirement | verified |
| U4-09 | Two board guards stopped reading the table by naive `split("\|")` | four rows carrying an escaped pipe had their Status column misread — `**1.5**` where the verdict was `closed 2026-08-16` — so a waived row with no `revisit:` was silently skipped. Both now use the escape-aware split the third guard already had | `6174583` | a row whose Status cell itself contains an escaped pipe | verified |
| U4-10 | The register the program is worked from is a guarded file, and an `M-nn` must cite its line | `docs/evidence/manifesto-conformance.md` joins `guardedFiles` (7); the 41 existing rows are grandfathered in an enumerated marker and anything new must carry `manifesto.md:<line>`. Watched refusing a planted `ZZ-99 \| M-44` row with no citation | `6174583` | the marker being dropped, which fails as "no enumerated exemption" rather than passing | verified |
| U4-11 | The README says what the manifesto says, and its receipt points where its label does | the four requirements are named as built with their four commits; the link whose label read `docs/evidence/backlog.md` while its target was the member's now names both files, each with its own label | `6174583` | `pod-manifesto` changing that paragraph again — its own `check-currency.py` is the other end of this | verified |
| U4-12 | A release tag that is lightweight fails the release, and a script cuts the right kind | all eight members and the umbrella's own `v0.90.0` were lightweight, so `git submodule status` reported every member at its **previous** version while every pin was correct. `release.yml` now refuses a non-annotated tag at the one moment the fact is decidable, and `scripts/tag.sh` writes the CHANGELOG section into the tag object | `6174583` | nothing — the check runs on the tag being released | verified |

## 2026-08-19 — UM-03, the two addresses this repository could not resolve (unreleased)

Manifesto conformance, requirement **M-07**: *an address another actor can resolve, or the
claim is not proven.* Board rows `B-90` (closed) and `B-91` (open). **No release** — the
family ships this at its own version, and nothing here bumps one.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| U3-01 | Both audited citations reproduced before anything was changed | the README's `test:negatives` claim, run as written → **exit 1**, `npm error Missing script: "test:negatives"`, and that script exists only in `skills/task-pipeline/package.json`; `ls scripts/check-convergence.sh` → **exit 1**, `No such file or directory`, `scripts/` holding `stage-coverage.sh` alone | verified |
| U3-02 | The audit sampled; this did not. Every address in the nine documents resolved at once | 556 candidate tokens extracted, 94 unresolved before triage; classified into **258 real addresses** — **78** in the five live documents, **180** in the four dated records. The other 298 tokens were placeholders (`hooks/<name>.js`, `docs/evidence/briefs/…`), `$HOME` paths, markdown link **labels** whose targets resolve, and other repositories' directory names | verified |
| U3-03 | `README.md:66` points at what actually plants defects **here** | the row now names `.github/workflows/validate.yml` (**20** steps, counted with `grep -c 'name: Negative self-test'`), `test/plant_guard.py`, and `npm run test:plants` — which exists in `package.json` and whose sweep feeds every member's own gate a dropped trigger. Option (a), not (b): the plants are CI steps **by design** (`validate.yml:7-8` — *"running them from the release workflow any other way means a second home per plant"*), so an npm entry point would have created the second home | verified |
| U3-04 | `docs/evidence/convergence.md` names the real script and stops implying a mechanism | points at `templates/convergence.sh` in `skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/`, which calls itself `check-convergence.sh` in its own header — and states plainly that this repository has **not** seeded it, so the record is written by hand and nothing refuses a range that skipped one. The gap is `B-91` rather than a path shaped like a mechanism. The same paragraph's bare `references/acceptance.md` gained its owner and its resolvable target | verified |
| U3-05 | The extractor is pure and fixtured | `test/doc_refs.py` + `test/doc_refs_test.py`, **17 cases**, discovered by `npm test` with no list to keep. **Watched failing first**: `ModuleNotFoundError: No module named 'doc_refs'` before the module existed. Cases cover the three false-positive classes that would get this gate switched off — a link's label vs its target, placeholders, another repo's unprefixed path — plus a `:line` past end of file, which `test -e` calls fine | verified |
| U3-06 | The guard was watched failing **against the real tree**, not against a fixture | written before either repair, `python3 test/validate.py` → **exit 1**, naming `README.md:66` and `docs/evidence/convergence.md:10` and **nothing else**. That is the strongest available form of this evidence: the defect was not planted, it was there | verified |
| U3-07 | Four plants in CI, run locally too | three claim classes plus the corpus itself: `npm`, `path`, `link` planted into a copy of `docs/DOCMAP.md` (each refused, each naming the planted line), and `LIVE_DOCS = ()` — an empty corpus that would otherwise pass everything — refused with *"the extractor matched nothing"*. Each wrapped in `test/plant_guard.py snap`/`verify`, so a plant that did not land cannot read as a guard that held | verified |
| U3-08 | The corpus boundary is a written decision, not a silent skip | the five live documents are **gated**; the four dated records are **counted and disclosed on every run**: the count is **printed by the run**, per file, as `claimed addresses -- not gated in the dated records … (dead/total)`, and is deliberately not frozen here: a number about these files, written **inside** them, changes every time one is appended to — which it did twice while this entry was being written. Their rows cite member repositories (`test/negatives.py` is task-pipeline's, `scripts/check-docs.sh` is seo-aeo-audit's) and states true at a commit (`.agent-sync/leases/B-31.lock`, whose **removal** is the verified fact). Rewriting those is a thing this repository has already decided against in writing — `docs/DOCMAP.md`, propagation matrix. `manifesto-conformance.md` is excluded for a second reason: its single writer is the orchestrator, not this gate | verified |
| U3-09 | The guard refuses a document that quotes a dead command as runnable — including this repository's own | found twice by the guard itself, mid-repair: the convergence paragraph and the new `CLAUDE.md` invariant each named the dead script inside backticks and were **refused**. Both reworded to *name* it rather than claim it, and the convention is now written in the invariant | verified |
| U3-10 | Docs shipped in the same change | `CLAUDE.md` invariant (with the naming convention), `docs/DOCMAP.md` single-home row for `test/doc_refs.py` and a propagation row — *a file renamed that a live document cites obliges the citation in the same change* | verified |
| U3-11 | The lease was taken before the guarded files were touched | `agent_sync.py acquire UM-03` → `won UM-03 (run r-6e62c4dab, ttl 2700s)`; `README.md`, `docs/evidence/backlog.md` and `docs/evidence/verification.md` are all in `guardedFiles`, and the lease covers all three | verified |

**What this run did NOT verify, and what stopped it.** `npm test` exits **1**, and the
change above is **not committed**. Sibling submodules hold commits that exist only
locally, and the count **rose while this ran** — four at the first attempt (`super-ux`
`fe2189e`, `make-skill` `73ebeee` and `16a9682`, `sheleg-dev` `e401603`, `agent-stack`
`2b3d45e`), five at the last (`sheleg-design` joined). All are concurrent agents of the same
conformance program, and `check_no_member_holds_a_commit_the_remote_does_not` fails on each.
The number is left as a range on purpose: freezing it would date this paragraph within
minutes, which is the failure this whole row is about. `git fetch` in all
four confirmed the commits are genuinely absent from their remotes, so the check is right
about the state it reads. `validate.py` reports **those four errors and no others**; **34 of
35** suites are green; the address guard, its **17** extractor cases and its **four** plants
were each run and are recorded above.

`hooks/repo-gate.js` then denied the commit — *"`npm test` is red, so this commit was not
made"* — which is the gate doing exactly what it is wired to do. The remedy it names, *push
the submodule first*, belongs to four other agents and to a family release this row is
forbidden to touch; no submodule pointer is staged here. Rather than working around it, the
deadlock is filed as **`B-92`**: the gate asks whether a submodule's local HEAD is ahead of
its upstream, while the hazard it exists for is a **pin** naming an unfetchable commit, and
those are different questions. That is the mirror of retro item 4 and the fifth appearance of
the root cause the retrospective already names. The same session that owns this program
committed `e473189` at 13:57:19 with all four members already ahead of their remotes, which
is the measurement rather than the complaint.

**So the whole-suite exit code is the one claim this row cannot make**, and the commit sha is
the other. Both are stated rather than implied.

## 2026-08-16 — v0.60.0, the same defect in four more places

Brief `docs/evidence/briefs/2026-08-15-graph-backlog.md`. Members' own REQ rows are in their
own ledgers (`task-pipeline` 5, `agent-stack` 5); these are the umbrella's.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The composition order breaks its fake edge and names the payload on the arrows it keeps | the block renders with `{ sheleg-design ∥ copywriting }`; `npm test` → `PASS: 29 checks green`. A sweep of all nine router texts for the same order claim found **none** — the fake edge was confined to the one line | verified |
| R-02 | Every member declares `shape` and `shapeWhy`, and both are required and checked | 8 of 8 declared; three plants watched failing — a non-answer (`it depends`), a non-reason (7 chars) and a missing field | verified |
| R-03 | The shadow prune is fed the installed set | **measured before the fix**: `shadowsToPrune([agent-stack], ['agent-stack'], ['agent-orchestrator'])` → `['agent-orchestrator']` with no plugin installed anywhere, and the function takes no argument that could tell it. Now reads `installed_plugins.json`, prunes nothing when unreadable; a test pins the contract and a guard refuses the old argument, watched failing | verified |
| R-04 | Five pins moved, each verified against its own published tag before the pointer | `npm view` per package: task-pipeline **1.58.0**, agent-stack **0.11.0**, super-ux **0.41.0**, seo-aeo-audit **0.20.0**, sheleg-design **1.36.1**. `check_pins.py` reports no `BEHIND` | verified |
| R-05 | Work that landed on a member another session had moved was **rebased**, not pinned past | `seo-aeo-audit` had gone 0.17.1 → 0.19.1 under this run with an uncommitted change on the old base; the change was stashed, the member reset to the published tag, the change re-applied and released as 0.20.0 | verified |

**5 of 5 verified. 0 at `never`.**

### What the checks did not cover

- **The convergence checks are doctrine, and no run has yet been stopped by one.** Four
  skills now compare their branches before consuming them; whether that catches a real
  contradiction is evidence the first audit to use them will supply.
- **`shapeWhy` is checked for length, not for truth.** A reason of the right size that is
  wrong reads as answered — the same failure the field exists to prevent, one level in.
- **The code graph is still not refreshable here** (`B-51`), and it remains the one item
  that needs a person rather than a commit.

## 2026-08-15 — v0.59.0, the shape of the work and the arrow that carried nothing

Brief `docs/evidence/briefs/2026-08-15-graph-engineering.md` · spec
`docs/evidence/specs/2026-08-15-graph-engineering-design.md` · plan
`docs/evidence/plans/2026-08-15-graph-engineering.md`. Members' own REQ rows live in their
own ledgers (`agent-stack` 9 rows, `task-pipeline` 7); these are the umbrella's.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `skills.json` pins `agent-stack` 0.10.1 and `task-pipeline` 1.57.0, and the README family table agrees | `npm test` → `PASS: 29 checks green`. The validator was **watched failing first**, in the shape that matters: with the pins moved and the submodules not yet committed it printed *"pinned at 0.10.0 but the submodule's committed package.json says 0.9.0"* — committed state, exactly as standing instruction #10 requires | verified |
| R-02 | `skills.json`'s `agent-stack` **desc** names all four skills, and so does the README row | before: neither mentioned `agent-harness`; after: both name orchestrator, harness, evals and interop. Closes the open half of board row **B-48** — the half nothing can check, so it is closed by counting at release | verified |
| R-03 | `docs/DOCMAP.md` records the graph doctrine's single home in `agent-stack` and a pointer here, never a copy | the row is present and names the file; no copy of the material exists in this repository. `grep -rl 'fake-edge' --exclude-dir=skills --exclude-dir=.git --exclude-dir=graphify-out .` → **6 files**, every one of them a record *about* this run rather than a second home for the doctrine: `DOCMAP.md` (the pointer), `CHANGELOG.md`, the brief, the spec, the plan and this ledger | verified |
| R-04 | A propagation row for *a member gaining a reference*, whose lesson is that a README's stated count is recounted rather than incremented | `agent-stack`'s README said *eighteen* against nineteen shipped; found by counting at release, which is the failure the row now names | **observed** — the row exists because the miss happened in this run |
| R-05 | Every release closed by reading the **registry**, never the workflow | `npm view @ssheleg/agent-stack version` → `0.10.1`; both release runs resolved by tag SHA (`536cb291…`, `7a94a76f…`), never by `--limit 1`. Closed harder than the version string: `npm pack` of the published 0.10.1, extracted, and the scanner run **from the tarball** printing `9/9 passed` | verified |
| R-06 | A version collision with a concurrent session was resolved by moving, not by overwriting | `task-pipeline` main gained a different **1.56.0** mid-review; this run's work rebased onto it and shipped **1.57.0**, its board row renumbered `B-073` → `B-075`, and **their** CHANGELOG reference to their own row restored after a blind replace had rewritten it | **observed** — the collision is the umbrella's open row B-45 arriving, not a new finding |

**6 of 6 verified. 0 at `never`.**

### What the checks did not cover

- **The code graph could not be refreshed.** `graphify . --update` in `agent-stack` exits 1:
  *no LLM API key found (39 doc/paper/image files need semantic extraction)*, and this
  environment has none. `--code-only` was **not** used — it would index 10 code files and
  drop the 39 documents that are most of this pack, which is a worse graph, not a fresher
  one. Nothing stale ships: `graphify-out/` is gitignored in all three repositories, checked
  with `git check-ignore`.
- **The methodichka is not yet load-bearing anywhere.** It is linked, validated and
  released; no run has yet designed a graph with it.

## 2026-08-14 — v0.55.0, the ninth router and the coordination repair

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | A ninth router declares `sheleg-dev`, fourth in table order, carrying all four required parts | `node test/router_texts_test.js` alone → `OK (60 checks)`; `registry.order()` prints the nine in table order with `sheleg-dev` after `copywriting` | verified |
| R-02 | The router is reachable from a prompt, not only present in the block | `node test/triggers_test.js` alone → `OK (27 checks)`, including `every router in the block can be named by this table`, which is the check that would have caught its absence | verified |
| R-03 | A route may front a pack: `sources` declares one skill per trigger group, and `triggers`/`skill` are derived so every other consumer is unchanged | The new `a pack-fronted route reaches every skill it fronts` asserts each source resolves to a shipped skill **and** that the derived union equals the sources — the first half is what stops a typo in sources 2..N hiding behind a valid first entry | verified |
| R-04 | The advertisement check reads the whole description, not its first line | Measured before and after: `stripe-billing` 74 → 993 chars, `ad-tracking` 85 → 879, `google-signin` 95 → 839, `frontend-performance` 87 → 861. The floor moved 40 → 200, since one line clears forty and that is why the defect was invisible | **observed** — the defect was found by a route whose triggers were real words from real descriptions and were reported missing |
| R-05 | A trigger that wraps across a line in a folded scalar still matches | `"оплата подпиской"` is advertised by `stripe-billing` as `"оплата\n  подпиской"` and failed until whitespace was collapsed, which is the decision `router_texts_test.js` had already made for the same reason | **observed** |
| R-06 | The write to the operator's file is idempotent | `node bin/sshlg-skills.js routers` run **three times** against the real `~/.claude/CLAUDE.md`; SHA-256 identical after each: `19b1f7b5faa0788a…` | verified |
| R-07 | Everything outside the managed block survives byte for byte | The `SSHLG:ROUTERS:BEGIN…END` block stripped from a pre-run copy and from the result: **8749 bytes on both sides, byte-identical**. The block itself grew 208 → 233 lines | verified |
| R-08 | A backup is taken before the write, by the mechanism rather than by hand | Four files in `~/.sshlg-skills/backups` stamped `20260814T151014Z`, one per target; a separate pre-run copy was taken independently and its hash matched the original | verified |
| R-09 | Every pin matches its release | `python3 test/check_pins.py` alone → exit 0, `every pin matches its release`, all eight `ok` | verified |
| R-10 | A member released by another session is pinned deliberately, not blindly | `agent-stack` reported **BEHIND** at 0.7.2 against npm's 0.8.0. Before moving it: `npm view` → `0.8.0`, `v0.8.0^{}` → `078dcb6`, `agent_sync status` → no other run holding anything, and `git merge-base --is-ancestor` confirmed this run's own coordination commit is contained in their `main` | verified |
| R-11 | `skillNames` moved with the version | `agent-stack` ships four skills at 0.8.0 (`agent-harness` is new) and the registry listed three. Both moved in one edit; a version bumped alone would have left the launcher advertising three against four | verified |
| R-12 | Coordination is healthy where it claims to be | `agent_sync.py check` in all nine repositories, before and after: **41 problems → 2**, both remaining in `task-pipeline` and both left on purpose. Umbrella: exit 0 | verified |
| R-13 | The repaired guard actually refuses | It fired on this run's own hands: an `Edit` to `skills/super-ux/test/validate.py` was blocked with `this run holds no lease` before any lease was taken. A guard that has refused is a guard | **observed** |
| R-14 | The umbrella's ten `skills/*` patterns could never have matched | `git ls-files skills/super-ux` returns one entry, `160000 … skills/super-ux` — a gitlink and no files beneath it, while the file exists on disk in another repository's index | verified |
| R-15 | `sheleg-design`'s gitignore negation is no longer inert | `git check-ignore -v --no-index .claude/agent-sync.json` → ignored by `.gitignore:5:.claude/` before, not ignored after; `.claude/probe.json` still ignored by `.gitignore:9:.claude/*` | **planted** — the probe path is the negative half |
| R-16 | The suite stays green through all of it | `npm test` alone → `PASS: 29 checks green`. Its four intermediate failures were each read and fixed rather than silenced: the pin invariant, the router count in two tests, and the trigger-advertisement parser | verified |
| R-17 | Every REQ in the brief is answered, and the ladder walk's own finds are filed before this table was written | Four rows filed at stage 10 from the walk rather than from the plan: `B-45` coordination never checked, `B-46` no CI gate under it, `B-48` `skillNames` unchecked against the submodule, `B-49` `sheleg-design` unreachable by the words an operator uses. Board open count 5 → 10 | verified |
| R-18 | The knowledge reaches an installed plugin, not only a repository | `super-ux@super-ux` at `0.40.0` in the plugin cache: **215** practices, `BP-211..215` all five present, `funnel-research.md` in the shared shelf and in exactly `ux-flows` and `ux-foundation`. `sheleg-dev@sheleg-dev` at `0.5.0` with `provider-concentration.md` present and the purchase-event section in `ad-tracking` | verified |
| R-19 | No plain copy shadows a plugin after the update, and no channel holds a broken link | The provider-aware shadow check → `shadows: 0`; broken symlinks 0 in `.claude/skills`, `.agents/skills`, `.cursor/skills` | verified |
| R-20 | The ninth router reaches all four agent files | `SSHLG:ROUTER:sheleg-dev` in `~/.claude/CLAUDE.md`; `sheleg-dev` present in `AGENTS.md`, `GEMINI.md` and `sshlg-routing.mdc` | verified |
| R-21 | The router is reachable end to end, and its boundary holds in the negative direction too | `подключи stripe checkout к воронке` → `["sheleg-dev"]`, `add a meta pixel purchase event` → `["sheleg-dev"]`, `вход через google на лендинге` → `["sheleg-dev"]`. `сделай paywall красивее` → `[]`, which is correct for this router and **wrong for the family** — filed as `B-49` | verified |
| R-22 | Every repository is clean, pushed, and pointed at | `git submodule status` with no line starting `+` after the pointer commit; every repo `dirty=0 unpushed=0` except `task-pipeline`, deliberately untouched with another session's 18 files | verified |
| R-23 | No lease is left held | `agent_sync.py whoami` → `holds: nothing`, in both projects | verified |

## 2026-08-10 — v0.29.0

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | README and `SECURITY.md` count eight members, not six | `grep -rniE '\bsix\b' README.md SECURITY.md docs/DOCMAP.md` → three hits, each semantically correct ("six of the eight pins", "the first six route to", "the first six have house rules") | verified |
| R-02 | `package.json` description names all eight | script comparing the description against `skills.json` names → `OK all 8 named` | verified |
| R-03 | `git status` free of graphify noise | `git status --short` shows only intended edits; `git submodule status` has no line starting `+` | verified |
| R-04 | `docs/superpowers/backlog.md` seeded, priorities computed | file exists, 8 open rows, every row carries blast/age/effort and a computed `P` | verified |
| R-05 | this ledger | you are reading it | verified |
| R-06 | umbrella `CLAUDE.md` house rules (closes C-06) | file exists; every command it names runs — `npm test`, `python3 test/check_pins.py` | verified |
| R-07 | `routers` reports authored-vs-packaged drift; `--diff` and `--adopt` | 27 fixtures in `test/drift_test.js`; two data-loss defects planted into `bin/sshlg-skills.js` and watched failing, then restored | verified |
| R-08 | packaged text adopted for `super-ux` and `task-pipeline` on this machine | section-level comparison against the pre-run backup: exactly two sections changed per file, bytes outside the block identical; the planning rule greps in both files; three consecutive runs produce identical hashes | verified |
| R-09 | the `agent-sync` root cause recorded rather than fixed | board rows B-01 and B-02 cite run ids `31287012133` and `31352513346` and the awk in `release.yml`; both closed the same day when the agent holding that repo shipped the fix | verified |
| R-13 | `agent-sync` pinned to 1.7.0 — every pin now matches its release | `python3 test/check_pins.py` → `every pin matches its release (npm where published, git tag everywhere)`; the tag's commit `1f1f7b9` equals `origin/main`, and its `package.json` reads 1.7.0 | verified |
| R-10 | gate green, ratchets up not down | `npm test` → 10 checks green (validate.py + 9 suites), 209 fixtures counted; was 8 suites / 182 | verified |
| R-11 | the release | `validate` run `31378960647` green **before** the tag was pushed — it was the first green on `main` in three commits, and the two red ones failed on the very pin this run moved; release run `31379020333` green in both jobs; `npm view sshlg-skills version` → `0.29.0`; `gh release view v0.29.0` → published | verified |
| R-12 | a router the operator never wrote is no longer recorded as theirs | clean-HOME reproduction recorded all eight before the fix and zero after; both fixtures watched failing first | verified |

**At `never`: 0.** Every row above names a command whose output was read, not a
step that was taken and assumed to have worked.

**Local installs, same day.** `npx --yes sshlg-skills@latest update` brought this
machine's plugins to the released versions — `agent-sync` moved `v1.5.2 → v1.7.0`
— and the shadow invariant prints nothing. Claude Code loads skills at session
start, so the running session still holds the previous set until it restarts.

## 2026-08-11 — v0.32.0, the always-on budget

Measured with `cl100k` via tiktoken, because the canon says budget against a
tokenizer and `claude plugin details` over-reports by ~40%.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| F1 | eight router texts rewritten in English and compressed | per-router counts before/after: 3408 → 1885 tokens, −44%. On the live machine the block went 4384 → 2663 and the always-on budget 8964 → 7243 | verified |
| F1a | the contract survived the rewrite | the 60 fixtures were switched to English markers FIRST and watched failing 35/60 against the Russian texts, then green against the new ones | verified |
| F1b | the weakened whitespace check still catches a real gap | a boundary's negative half deleted from `TASK_PIPELINE` → suite red; restored → green | verified |
| F1c | the operator's file is undamaged | everything outside the block byte-identical to the pre-run backup; 8 router sections and the map present; three runs leave all four channels hash-identical | verified |
| F1d | the drift mechanism earned its place | after the rewrite the report named exactly the six routers still carrying a byte-identical copy of the old packaged Russian — which is why the first write saved only 625 tokens and adoption was needed for the other 1096 | verified |
| F1e | the release | `validate` green and read before the tag; release workflow green; `npm view sshlg-skills version` → `0.32.0` | verified |

**Still open from the same measurement**, each its own repository and release:
four skill bodies over the 5000-token cap (`ad-tracking` 9160/891 lines is the
worst), five descriptions with no 5% headroom (`google-signin` at 1023 of
1024), and 106 reference files over 100 lines with no `## Contents`.

## 2026-08-11 — v0.31.0, the map and two more channels

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| M1 | the entry-point map, generated from `skills.json` | 10 fixtures in `test/inventory_test.js`, one of which checks every declared `entry` against the commands the family actually ships — all six resolve. The rendered map picked up `sheleg-dev`'s new `stripe-billing` skill without an edit, which is the point of generating it | verified |
| M2 | `install` and `update` refresh the block | measured before: neither called `cmdRouters`. After: a real `update` run reports all four targets | verified |
| M3 | Gemini as a third target, and it reaches existing machines | `~/.gemini/GEMINI.md` went from empty to 200 lines carrying the map and 8 routers, via the consent-on-record path — the first run reported `no-block` and that was the defect | verified |
| M4 | Cursor as a fourth channel in its own format | `~/.cursor/rules/sshlg-routing.mdc` created, 205 lines, front-matter carries `alwaysApply: true`; 9 fixtures including the one that refuses to overwrite a foreign file at that name | verified |
| M5 | the operator's file is not damaged | against the pre-run backup: everything outside the block byte-identical, all 8 router sections unchanged, 19 lines added. Three consecutive runs leave all four files hash-identical | verified |
| M6 | the upgrade path for blocks written before the map | hand-built pre-map block: map inserted after the heading, prose above and below preserved, second run byte-identical | verified |
| M7 | gate and ratchets | `npm test` → 13 checks (validate.py + 12 suites), 247 fixtures; was 10/228 | verified |
| M8 | the release | `validate` green on `ea63262` and **read before** the tag; release workflow green; `npm view sshlg-skills version` → `0.31.0`; `gh release view v0.31.0` published 18:53Z | verified |
| M9 | the pin sweep | all eight members measured in one pass rather than chasing the one CI named — only `task-pipeline` was behind (1.39.0 → 1.44.0), and CI was green first try | verified |

## 2026-08-10 — v0.30.0, B-09

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `defaultAgents` gains `kiro-cli` and `goose` | `node bin/sshlg-skills.js agents` prints both in the default set; `test/validate.py` passes | verified |
| R-02 | `update` reconciles instead of only refreshing | `agent-orchestrator` removed from the hub and all six symlink channels, reproducing the state a never-installed member is in. `npx skills update agent-orchestrator` then printed `✓ All global skills are up to date` and restored **nothing** — a false green, watched. `node bin/sshlg-skills.js update --no-claude` restored it to all seven channels | verified |
| R-03 | `update` stays idempotent, and one channel per agent holds | two further runs left the hub and channel listings byte-identical (`93561d912215` / `6aac4cc74298` both times); restored content `diff -rq` identical to the pre-removal backup | verified |
| R-04 | the prune no longer depends on whether the run touches plugins | a shadow planted by hand (`~/.claude/skills/task-pipeline` beside the `task-pipeline` plugin); `update --no-claude` printed `pruned Claude plain copies…` and the invariant check went silent | verified |
| R-05 | docs move in the same change | the README sentence "update targets whatever is already installed, so it takes no `--agent`" greps to 0; `lib/plan.js` is in the file map and DOCMAP's single homes | verified |
| R-06 | gate green, ratchets up not down | `npm test` → 11 checks (validate.py + 10 suites), 228 fixtures counted; was 9 suites / 209 | verified |
| R-07 | the release | `validate` was read **before** the tag and was RED twice — `task-pipeline` cut 1.39.0 and `super-ux` cut 0.34.0 while this release was being built. Green only on `31421342492`; then tag, release run green, `npm view sshlg-skills version` → `0.30.0`, `gh release view v0.30.0` published | verified |
| R-08 | the released artifact behaves, not just the working tree | `npx --yes sshlg-skills@0.30.0 agents` from an empty cwd prints `kiro-cli, goose` in the default set, and its usage block carries the `--agent`/`--all` update flags | verified |

**The cost, stated rather than discovered.** `update` now issues eight `skills
add` calls it did not before, so it is slower than a pure refresh. That is the
price of reconciliation and it is deliberate: a fast command that silently
delivers nothing is worse than a slow one that delivers.

**The code graph** was refreshed at commit `8a02463` — `lib/plan.js` and
`test/plan_test.js` are in it, and both are named in the README file map and
DOCMAP. Its **document half is stale since 2026-08-08**: a full pass needs an
LLM key for eleven doc files, so this run used `--code-only`. Said here rather
than left for a reader to assume the whole graph is current.

**Found by breaking it, and worth the line.** R-04 was not in the brief. Making
`update` call `skills add` handed it the auto-detect side effect `install`
always had, and the prune's condition — *"is this run touching plugins"* — was
a proxy for the real one. The shadow appeared on the operator's own machine at
20:35 during the very run that was proving R-02, and was caught by the
invariant check rather than by a test. The fixture came afterwards.

## 2026-08-10 — family wiring audit

Ran with no task in flight, against the question "does the wiring actually
hold": registry → manifest → disclosure → install → what Claude Code loads.

| Check | Command | Result |
|---|---|---|
| Registry vs submodules vs README | `python3 test/validate.py` | 8 skills, 8 submodules, pass |
| Pins vs releases | `python3 test/check_pins.py` | every pin matches its release |
| Plugin manifests, strict | `claude plugin validate . --strict` in each member | 8/8 exit 0 |
| SKILL.md front-matter | audit script, 19 skills | 0 findings — every `name` matches its directory, every description inside 1024 |
| Progressive disclosure | 281 `references/X.md` mentions resolved against each skill's own `references/` | 0 real findings (2 hits, both the literal placeholder `FILE.md` inside `assets/*.template.md`) |
| Router wiring | 8 routers vs `skills.json` | every required member ships |
| Declared vs shipped | `skillNames` vs directories carrying a `SKILL.md` | 19 declared, 19 shipped, no extras |
| Declared vs installed | plugin cache at each pinned version | 19/19 present; command counts match the repo (15/1/1/1/1/1/0/0) |

**The instrument needed two rewrites before it was worth trusting**, and that is
the finding worth keeping. Version one scanned prose for paths and slash
commands and reported **4221** problems; version two, scoped to the shipped
surface, reported 185. A hand-check of both said essentially all were false: a
skill legitimately names files in the *user's* project (`docs/ux/scenarios.md`,
`src/lib/motion/tokens.ts`) and legitimately quotes Claude Code built-ins
(`/mcp`, `/plugin`), while `</summary>` alone produced forty command findings.
Version three checks only what has exactly one correct answer, and found
nothing — which is a much smaller and much more useful number.

## v0.35.0 — the backup stopped being a habit

**B-05, carried since 2026-08-06.** `lib/backup.js` + `protect()` in
`lib/apply.js`, 20 fixtures in `test/backup_test.js`.

What confirmed it, in the order the evidence was taken:

| Claim | What proved it |
|---|---|
| The gate has teeth | The `if (saved.action === 'backup-failed')` return was deleted and the fixture reported *the operator file was modified with no backup behind it*. Restored; 20/20 green again. |
| A real run leaves the pre-run bytes | A copy of the live `~/.claude/CLAUDE.md` was perturbed by one character in a temp HOME; `routers --update` wrote, and `claude_CLAUDE.md.20260812T090037Z` held the perturbation while the live file no longer did. |
| An idempotent run leaves nothing | Three consecutive `routers --update` runs against the real file: hash `cf59cc11` all three times, backup directory empty. Backing up happens after the bytes are known to differ. |
| A failed copy is reported, not swallowed | The backup directory's path was occupied by a file. Output: `НЕ записан: не удалось сделать резервную копию (EEXIST …). Файл не изменён.` — and the file's hash was unchanged. |
| One failed target does not hide another | Two targets, both unbackupable: both appear in the run's records with `backup-failed`. |
| A key cannot escape its directory | `keyFor('/elsewhere/etc/passwd', '/home/x')` — the first attempt returned `_.._elsewhere_etc_passwd`, and the fixture caught the surviving `..`. Separators are sanitised before dot-runs are collapsed, so a traversal is recognisable while it is still a traversal. |

**The decision worth keeping** is where copies do *not* go. The obvious fallback
for a missing `home` is the file's own parent — which puts copies inside
`~/.cursor/rules/`, a directory whose owner loads every `*.mdc` it finds. A
backup that the protected tool can read back as an always-apply rule is a worse
failure than no backup, so a missing `home` refuses to write at all.

## What is deliberately not verified here

`agent-sync`'s two defects (B-01, B-02) were recorded, not fixed: another agent
held that repository for the whole run. They shipped both fixes while this run
was in flight, which is why the pin moved — but the fixes are theirs and the
evidence cited here is their CI, not work this run did.

Nothing else about that repository is asserted here.

## 2026-08-13 — v0.42.0 (+ task-pipeline 1.50.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| REQ-001 | A write to an operator instruction file is preceded by a copy, and a copy that cannot be proven denies the write | `test/guard_test.js` (25 fixtures) + `test/hooks_e2e_test.js` runs the real script as a process: the allow path leaves exactly one copy whose bytes equal the file; the deny path is planted by putting a FILE where the backup directory belongs, and the operator file is byte-identical afterwards | verified |
| REQ-002 | The guard sees every write path, not only `Edit` | `guard_test.js`: eight Bash write forms, `~`/`$HOME` spellings, and six near misses that must stay silent (`cat`, `grep`, `diff`, a write to `…​.bak`, `cp FILE FILE.dated`, a read piped elsewhere). The `cp` case was watched failing — the first draft classified it as overwriting the file | verified |
| REQ-003 | `git commit` is refused while `npm test` is red | `test/repogate_test.js` (13) + an e2e fixture pointing `CLAUDE_PROJECT_DIR` at a throwaway project whose suite fails on demand; the refusal carries the failing output, and a green suite lets the commit through | verified |
| REQ-004 | A `SKILL.md` breaking the front-matter limits is reported in the turn it was written | `repogate_test.js`, including a **folded** `description: >-` block: measured as legal by the first draft because `$` under the `m` flag ends at a line, watched failing, then fixed | verified |
| REQ-005 | A bare `npx skills update <member>` is denied, with the launcher in the reason | `test/hygiene_test.js` (17) + e2e; the launcher itself and non-family skills are asserted **not** denied, because a guard that refuses its own remedy is worse than none | verified |
| REQ-006 | Shadowing plain copies are reported, and not during the launcher's own run | `test/shadow_test.js` (9) — including `sheleg-design` ← `sheleg-design-skill`, the differing-name case the cheap check misses — and `hygiene_test.js`'s false-positive case: a Claude session whose cwd is this repository is not the launcher installing | verified |
| REQ-007 | `obsidian-wiki setup` can no longer silently truncate the active config | `hygiene_test.js`: the four custom keys return, the **commented** QMD block survives, setup's own new values win, and the restore is idempotent. Watched failing: reversing the merge direction (truncated file as the base) loses the QMD block and the header, and four checks report it | verified |
| REQ-008 | Inflection no longer decides whether a route is named | `test/triggers_test.js`: the 20-prompt corpus scores **18/20**, up from a measured 11/20; `аудит` does not fire on `аудитория`; refusals and questions still silence the hook. Watched failing: removing the closing word boundary makes `аудитория` route | verified |
| REQ-009 | `task-pipeline` refuses an outward release act while stage 6 has not passed | `test/release_gate_test.py` in that repository, 16 fixtures run as a process; **eight watched failing** on the first implementation. CI carries a negative self-test that blanks the payload handoff and requires the suite to notice — run locally against a planted copy before it was committed | verified |
| REQ-010 | The `agent-sync` lease invariant is machine-enforced | **Already shipped upstream, and nothing was built.** `plugins/agent-sync/hooks/hooks.json` wires a `PreToolUse` guard on `Edit\|Write\|MultiEdit\|NotebookEdit` and on `Bash(git commit *)`; `hooks/guard.sh` tokenises the command so `git -C dir commit` cannot pass, and exits 2 on internal failure so it cannot fail open | verified — in place, not by this run |
| REQ-011 | `SessionStart` returns `watchPaths` and a `sessionTitle` where one lands | e2e: with a ledger present, `startup` returns the run's topic as the title and the ledger's absolute path in `watchPaths`; `compact` returns **no** title, which is what the reference says it would ignore | verified |
| REQ-012 | `Notification` emits a terminal sequence and nothing else | `test/notify_test.js` (10): the output object has exactly one key; a semicolon in the message cannot split the sequence and a BEL cannot terminate it early; OSC 8, 52, 1337 and CSI are rejected by the allowlist, and every sequence this module builds passes it | verified |
| REQ-013 | Displacement of our entries is noticed and reported | `test/displace_test.js` (11) + e2e: `ConfigChange` is asserted to emit **nothing** (the reference says every channel it has is discarded), the record survives in config, the next `SessionStart` reports it, and a repaired file stops being announced | verified |
| REQ-014 | `hooks install`/`remove` cover every entry, write only through `protect()`, and repeat | e2e: **three real runs** of the real command against a real settings file produce identical hashes; `remove` restores the pre-install bytes exactly; every wired path resolves to a file that exists | verified |
| REQ-015 | The docs moved in the same change | `docs/DOCMAP.md` — seven new single homes, two propagation rows, ratchet **23/427** recounted by running `npm test` (written as 422 first, from a count taken before five fixtures were added, and corrected by re-running); README, CHANGELOG, `CLAUDE.md`, and this ledger | verified |
| REQ-016 | *(appended during the run)* `~/.claude/settings.json` joined the protected set | `guard_test.js` asserts five targets and that a redirect into it is caught. Same class as the other four: no version control behind it, edited by installers that are not this one | verified |

## 2026-08-13 — v0.43.0

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The progress fraction is never built from the ledger's own line count | `test/runledger_test.js`: a five-stage ledger must not render `gates 5/5` or `100%`, and must print `5 gates passed`. The defect was reproduced on this repository's live ledger first — `gates 5/5` at stage 4 of ten — then fixed | verified |
| R-02 | The denominator comes from `pipeline.json` → `stages[]`, and the example flow's eleven are not a fallback | fixture asserting `/11` never appears without a declared stage list, plus `percent(…, null) === null`; end-to-end through the real `statusline.js` in a project with and without the file | verified |
| R-03 | Glyphs distinguish passed, failed, skipped, in-flight and unentered | fixture asserting `✗` and `⊘` differ from `✓` and from `·` — a skipped stage and an unentered one mean opposite things and rendered alike before | verified |
| R-04 | The four-line block is printed by a hook, derived from the ledger | e2e: `file-changed.js` returns the block with the bar and `gates 3/11`; with no stage list it draws no bar at all | verified |
| R-05 | Taskbar progress and a ping at the moment a person is required | e2e: OSC `9;4;1;27` present with a stage list, absent without one; OSC `777` emitted only when a manual gate has no verdict | verified |
| R-06 | Every router in the block can be named by the prompt hook | fixture comparing `lib/triggers.js`'s table against `lib/routers-registry.js` — it listed 8 and 4 before, so half the family was unreachable. Each new trigger is still a word its own skill advertises, checked against the shipped `description` | verified |
| R-07 | A trigger phrased as a question fires; a plain question still does not | fixtures on «почему упал трафик» (routes) versus «почему этот аудит падает?» and «объясни, как работает интеграция» (silent), and a refusal still beating both | verified |
| R-08 | The un-routed path escalates once per turn | `test/routegate_test.js` (15) + e2e: first `Edit` asks and names the route and the refusal phrase; the second `Edit` of the same turn is silent; a run already open, an opted-out session, an unclassified prompt and `Bash` are all silent | verified |
| R-09 | A refusal phrase silences the session, not the turn | e2e across two prompts of one session; `optedOut` is sticky in `lib/turnstate.js` and a fixture plants the un-declining write | verified |
| R-10 | Every sequence in a concatenated `terminalSequence` is validated | fixture: a forbidden OSC 52 hidden behind a legal OSC 9 is rejected in both orders. The ledger hook sends two sequences, and Claude Code drops the whole field if any part is outside the allowlist | verified |
| R-11 | The turn store cannot escape its directory and does not grow forever | fixtures: `../../etc/passwd` sanitises to a flat name with no dot-runs; a 30-day-old record is pruned at session start and a current one is not | verified |
| R-12 | Docs moved in the same change | DOCMAP — three new single homes, ratchet **24/469** recounted by running `npm test`; README's status-line section rewritten around the real render; CHANGELOG | verified |

## 2026-08-13 — v0.44.0 (+ task-pipeline 1.51.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The release gate is no longer keyed to a stage number | `test/release_gate_test.py`: a six-stage project with tests green at stage 4 releases. Reproduced as a defect first — v1.50.0 blocked it, exit 2, with the reason naming stage 6 | verified |
| R-02 | The tests stage resolves from `pipeline.json`, then from the ledger by name | fixtures for a declared `state: "tests"` stage passing and failing; an unresolvable flow still refuses and its reason names `pipeline.json` | verified |
| R-03 | The gate no longer believes the party it constrains | fixtures: the agent's claim alone blocks with *"the claim is the agent's own"*; claim + green observation releases; observed failure blocks even when the claim says pass | verified |
| R-04 | The observer records what ran, and never judges | `gate-observer.sh` run as a process: a green run and a **red** run are both recorded; `npm test --watch`, `echo "npm test"`, `npm run build` and `git status` record nothing; the ledger is appended to, never rewritten | verified |
| R-05 | The gate reads the **last** observation, not any green one | found by dogfooding against this repository's own ledger — an earlier green sat above a later red and the gate waved it through. Both directions fixtured: later red blocks, later green clears | verified |
| R-06 | The repository gate stops judging other repositories' commits | e2e: a commit with nothing staged in this project is not gated; the red-suite case now runs against a real repository with a real index. The deadlock was live — the umbrella red because the submodule had not shipped, the submodule unable to commit the fix | verified |
| R-07 | The ledger's grammar carries the new shape, with a reader | `templates/run.md` documents `gate:` and shows it in the log example; `references/progress.md` names the reader — the validator refuses a shape nobody reads, and refused this one until it was named | verified |
| R-08 | Guards rose with the change | `test/negatives.py` floor 310 → 311; the new CI self-test disarms the corroboration (`if command:` → `if False:`) and requires the suite to notice, watched failing locally before it was committed | verified |

## 2026-08-13 — v0.44.1

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The progress numerator counts distinct stages, not lines | `test/runledger_test.js`: a ledger with a re-entered stage renders `gates 3/4`, never over 100%. Reproduced on this repository's own run first — `gates 12/11 · 109%` | verified |
| R-02 | The last verdict for a stage id is the one that counts | both directions fixtured: a later pass clears an earlier fail, and an earlier pass does **not** outvote a later fail — the same "history satisfies the gate" shape the release gate was fixed for hours earlier | verified |

## 2026-08-13 — the rest of the hook set (task-pipeline 1.52.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | The compaction boundary is recorded | fixture: `PreCompact` appends `event: compact — auto`. The ledger's own header says it exists because compaction happens, and that boundary was the one thing it could not show | verified |
| R-02 | A run whose session ended unclosed is recorded; a finished one is not | fixtures both ways — an open run yields `event: session-end … not closed`, a run with a passing acceptance stage yields nothing. The second matters more: filing finished runs as abandoned would make `checkup` useless | verified |
| R-03 | A subagent stopping is observed, and no `hand:` line is fabricated | fixture asserts `hand:` never appears in the hook's output. That shape carries judgements only the agent holds | verified |
| R-04 | Payload text cannot break the ledger's grammar | fixture: an `agent_type` containing an em dash and a newline still produces exactly one line with exactly two separators | verified |
| R-05 | Editing the product before the build stage asks | fixture: a source edit at stage 3 returns `ask`; once the build stage is entered, silence | verified |
| R-06 | The build stage is resolved by role, never by number | fixture: an unresolvable flow is silent rather than gating. The lesson v1.51.0 learned from the release gate, applied before it could repeat | verified |
| R-07 | The pipeline's own artefacts are never gated | fixture over `docs/ux/`, `docs/superpowers/`, `.task-pipeline/`, README and CHANGELOG — the files stages 0–4 exist to write | verified |
| R-08 | Guards rose with the change | floor 311 → 312; the new CI self-test disarms the finished-run check so every closed run would be filed as abandoned, watched failing locally before it was committed | verified |
| R-09 | B-16: three members bumped in one sweep | `super-ux` 0.38.0, `sheleg-design` 1.24.0, `seo-aeo-audit` 0.16.0 — submodule, `skills.json` and README table moved together, and `npm test` reports no skill-declaration drift | verified |

## 2026-08-13 — the artifact root, and who else speaks first (v0.46.0 + six members)

Ten REQ rows from `docs/evidence/briefs/2026-08-13-artifact-root-and-precedence.md`.
Seven repositories, and the row that matters most is the one where a rename could have
gone silently wrong: 29 CI plants anchored on the literal path.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| REQ-01 | `artifactRoot()`: config → an existing `docs/evidence/` → an existing `docs/superpowers/` → the new default, adopting a directory only when it CARRIES A REGISTER | 7 cases as real trees, and **two implementations compared to each other** — `test/artifact_root_test.py` fails on a disagreement, not only on a wrong answer. Watched failing before either implementation existed. **And the proof that mattered: after `git mv`, `npm test` passed with no further path edits** | verified |
| REQ-02 | `paths.artifacts` in `pipeline.schema.json`, any relative path | `jq` resolves `properties.paths` → `definitions.paths`; the `docs/runs/` case is green. This makes real a promise `references/artifacts.md` had carried unenforced since v0.1.0 | verified |
| REQ-03a | task-pipeline's live prose stops hardcoding the path | 105 occurrences in 34 files; `references/` writes `<artifacts>/`, templates and this-repo statements write the resolved name. `grep` outside frozen records and plants → 0 | verified |
| REQ-03b | five members' live prose | 26 occurrences swept, **8 deliberately left** inside dated `docs/audit/` and `docs/research/` reports, which record a measurement taken on a date | verified |
| REQ-03c | the umbrella's live prose | 9 occurrences in 5 files | verified |
| REQ-04a | 28 task-pipeline plants moved **and proven to land** | `npm run test:negatives`: **24 broken → 0**. One plant reported `PLANT DID NOT LAND` because it anchored on a bare `superpowers/` the path sweep never matched; another guard passed with an EMPTY SUBJECT after the sweep rewrote what it matched on, and the negative self-test said `does not actually fire`. Both repaired, the second watched failing against a planted tree drift | verified |
| REQ-04b | `seo-aeo-audit` and `sheleg-design` plants | both repointed; each repo's own gate green, and `seo-aeo-audit`'s full declared gate (`bash scripts/check-docs.sh`, five suites) exits 0 | verified |
| REQ-05 | frozen records untouched; the move recorded | **155 occurrences of the old name survive inside past-run records on purpose**, counted after the sweep. One DOCMAP row per repo names the move and its release. A mid-run mistake rewrote 51 of them and was reverted from the index, then re-verified by count | verified |
| REQ-06 | `migrate-artifacts [--dry-run]` | 7 cases including **three real runs with hashes compared** — which found a real defect: a backup taken when nothing moved made every repeat run change the tree it claimed to leave alone. Refuses a configured root, never overwrites a collision, and **lists mentions elsewhere without editing one of them** | verified |
| REQ-07 | Axis A: the SessionStart injector report | `sshlg-skills injectors` run live — four injectors with exact `hooks.json` paths, where the machine's own recorded audit named three. Run against a `HOME` with no registry, where it **refuses to answer rather than claiming "none"**. 9 fixtures, watched failing by replacing the silence branch with a sentence | verified |
| REQ-08 | `/task-pipeline setup` reports the resolved root and why | all four outcomes written out, including the default landing on an occupied directory — a stop-and-ask, not a write | verified |
| REQ-09a | six members released | task-pipeline 1.53.0 · super-ux 0.38.1 · sheleg-design 1.27.1 · seo-aeo-audit 0.16.1 · agent-sync 1.10.0 · make-skill 0.17.0. Every CI verdict READ before its tag; every tag on a commit whose own gate was green | verified |
| REQ-09b | the umbrella last, pins re-measured in one sweep | `python3 test/check_pins.py` → exit 0, *every pin matches its release*, all eight. `git submodule status` shows no line starting `+`. **`sheleg-design` was three releases behind, not the one recorded after the last sweep** | verified |
| REQ-10 | B-19/C-01 stays open, marked not decided | the board row says so and carries the reason, plus the fact for whoever takes it: `statusLine` cannot move to a plugin at all | verified |

## 2026-08-13 — B-22, the one thing `update` did not update (v0.47.0)

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | `update` refreshes the wired hook runtime, printing new files individually | **Verified from the published package on the machine that had the defect.** Before: the runtime was short exactly `lib/runtime.js`. `npx sshlg-skills@latest update` printed *refreshed 36 file(s) — 1 new, 0 changed* and named it; after, `stale()` reports 0 missing and 0 differing | verified |
| R-02 | Refresh, never install — `create: false` | fixture: a runtime that does not exist is NOT created, `created:false`, and the reason is stated rather than left to be inferred from an empty list | verified |
| R-03 | A runtime that cannot be refreshed fails the update rather than passing quietly | the catch sets `ok = false` and prints `NOT refreshed: <reason>`; silence is what made this invisible for five releases | verified |
| R-04 | One home for the copy — both `hooks install` and `update` call it | `bin/sshlg-skills.js`'s `syncRuntime()` is now three lines delegating to `lib/runtime.js`; the closure that only `cmdHooks` could reach is gone | verified |
| R-05 | Idempotent at the layer that repeats | three syncs against a real tree hashed identical (instruction #2), and separately against a **copy of the operator's actual runtime**: 1 missing → 0, 36 copied, `created:false`, second pass no change | verified |
| R-06 | **A guard on the wiring, not the module** | `check_update_refreshes_runtime()` reads `cmdUpdate`'s body and fails when it stops referencing `lib/runtime.js` or drops `create: false`. Watched failing: replacing the require with `null` produces *cmdUpdate() does not refresh the wired hook runtime*. Scoped to that body, since a repo-wide grep is satisfied by the `cmdHooks` call that was always there. Negative self-test in CI, 8 → 9 | verified |

## 2026-08-14 — iteration 1 of the audit loop: B-27, B-28, B-32

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I1-01 | One plant guard for the family — `test/plant_guard.py`, `snap`/`verify`, content AND mode | 9 fixtures; the first is the incident (a mode-only change must be seen). Deployed in the umbrella, `make-skill`, `seo-aeo-audit`; `sheleg-dev` and `agent-stack` use per-anchor asserts in Python | verified |
| I1-02 | `sheleg-dev`'s two-day red `main` | `validate pass`, both runs, after the plant was re-anchored on the folded block's shape and proven to produce a 1204-char description | verified |
| I1-03 | Plants run on a developer's machine | 18 `sed -i` plants converted to Python across four repos. BSD sed needs an argument to `-i`, so they errored and changed nothing on macOS — the condition that hid the broken one | verified |
| I1-04 | Every plant proves it landed | run locally: 40 cases in `make-skill`, 9 in `seo-aeo-audit`, 8 in the umbrella, 6 in `agent-stack`, 4 in `sheleg-dev`; every one `OK` | verified |
| I1-05 | The guard that shipped wrong, and what caught it | a content-only comparison announced `PLANT DID NOT LAND` about the `hookexec` plant, whose whole effect is `chmod`. **CI caught it**; the local run had truncated its output before that case. Fixed by making the helper mode-aware, and that case is now fixture #2 | verified |
| I1-06 | `npm test` was green on YAML GitHub cannot parse | `check_workflows_parse()` fails on a workflow that does not parse, or parses with no jobs. Watched failing against the exact defect (a body line at one space), quoting GitHub's own wording. Negative self-test 9 → 10 | verified |
| I1-07 | A check that cannot run says so | the umbrella validator gained an `unlooked:` channel; the parse guard uses a real parser and discloses when pyyaml is absent, rather than passing quietly | verified |
| I1-08 | Six releases, pins in one sweep | sheleg-dev 0.4.2 · agent-stack 0.6.1 · make-skill 0.17.1 · seo-aeo-audit 0.16.2 · sshlg-skills 0.47.1. Each gate green on the commit its tag points at, `bash scripts/check-docs.sh` for `seo-aeo-audit` rather than a narrower one. `check_pins.py` → every pin at its release, all eight | verified |
| I1-09 | The loop guard fired on the run itself | after editing one repo's guards twice and another's step three times, the run stopped, named the conflict and escalated to a shared helper instead of a fourth careful copy. Both red PRs went green on the first attempt afterwards | verified |

## 2026-08-14 — iteration 2: B-26, and the coordination it forced

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I2-01 | A release cannot publish over a red suite | `validate.yml` callable, `release.yml` declares `needs: validate`, in all six repositories that lacked it. Every live release run — selected **by tag**, not by recency — reads `validate / validate=success, release=success, publish=success` | verified |
| I2-02 | No plant is duplicated to achieve it | the reusable call runs the same steps; porting a 258-line negatives runner into six repos was the rejected alternative, and is recorded as rejected rather than unconsidered | verified |
| I2-03 | The connection is guarded | three checks — trigger, call, `needs` — because calling the suite without depending on it lets the jobs run in parallel, which looks gated and is not. Watched failing against the planted removal; negative self-test in CI | verified |
| I2-04 | Closed by the registry, not the pipeline | `npm view` for each of the six, after the run reported success. Instruction #9, written by the concurrent session mid-run and honoured here | verified |
| I2-05 | Coordination is on, with its real scope stated | `agent-sync` local-files backend, six registers guarded, `docs/AGENT_SYNC.md` linked from `CLAUDE.md`; `check` → 7 passed, 1 warning naming the lease as exclusive **on this machine**. B-26 was worked under a held lease and the board row carried the claim | verified |
| I2-06 | Pins moved in one sweep | `check_pins.py` → every one of the eight at its release, run before the umbrella push (instruction #5, which fired twice tonight when members moved mid-flight) | verified |
| I2-07 | What coordination cost to be without | one CHANGELOG written at a version **behind its own tree**; a member moving under the work twice; uncommitted work found sitting on `main` in two repositories. None of it visible without a lease — which is why B-19 stopped being theoretical | verified |

## 2026-08-14 — iteration 3: B-25, the flow that declared no gates

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I3-01 | Eleven real gate criteria in this repository's own `pipeline.json` | drawn from what the run actually does, not generic prose: the graph's **measured** lag at 0, the single `protect()` write path at 5, the verdict read by the ref pushed at 7, the registry at 8, release-then-close at 10 | verified |
| I3-02 | The config satisfies the schema its own family ships | 24 violations → **0** against `pipeline.schema.json`. `version` had held the task-pipeline RELEASE (`"1.50.0"`) where the schema wants the config-format version | verified |
| I3-03 | A gate cannot pass by being unreadable | the guard refuses a criterion that is blank or a placeholder, separately from the schema. Watched failing against a criterion cut to `tests pass` | verified |
| I3-04 | The contract is CHECKED in CI, not skipped | CI installs `jsonschema`; absent, the validator discloses through `unlooked:` rather than going quiet (instruction #1). Negative self-test **10 → 11** | verified |
| I3-05 | The criteria are evidence, not decoration | every file, path and function they name was verified to resolve — `check_pins.py`, `plant_guard.py`, `validate.py`, `lib/apply.js`'s `protect()`, the five `docs/` registers, `graphify-out/graph.json`, and the wiki page in the vault | verified |
| I3-06 | Released and closed by the registry | `validate / validate=success, release=success, publish=success` on the run for the ref pushed; `npm view sshlg-skills` → 0.50.0 | verified |
| I3-07 | The lease released **before** the row was closed | B-35's lesson applied the same night it was learned: the claim tag and the status share a cell, so a close written while holding the claim is reverted by the restore | verified |

### Iteration 4 — B-31, acceptance can refuse a run that skipped a stage it declared

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I4-01 | The defect is real, not inferred | `bash scripts/stage-coverage.sh` against this run's own ledger before the fix: *stage 3 (Spec) — DECLARED BY pipeline.json, NO VERDICT IN THE LEDGER*, same for 4; `stages declared 11 · accounted for 9 · 82%`, exit 1 | verified |
| I4-02 | Detection existed and nothing refused on it | `lib/runledger.js` renders the rail that printed `3· 4·` and 73% on 2026-08-13; no gate read it. Stage 7's release gate asks only about the tests stage and fires before 8, 9 and 10 exist | verified |
| I4-03 | One implementation, seeded not copied | `templates/stage-coverage.sh` ships in task-pipeline v1.54.0 and is listed in `templates/README.md`; the umbrella's `scripts/stage-coverage.sh` is that file. The validator refused the release until the template was listed | verified |
| I4-04 | The gate names it, and the guard requires both halves | `pipeline.json` stage[10] `gate.check` opens with the command; `check_stage_coverage_is_wired()` fails on a missing script AND on a gate that stops naming it | verified |
| I4-05 | The guard was watched failing | negative self-test removes only the naming half from a copy: *the final gate does not name scripts/stage-coverage.sh* → `OK: validator refuses an acceptance gate that cannot see a skipped stage` | verified |
| I4-06 | The incident itself is a fixture | task-pipeline negative plants a five-stage flow whose ledger stamps four and requires the refusal to name stage 3; ran green locally and in CI | verified |
| I4-07 | It refuses rather than approves with no input | second negative asserts exit **2** — not 0 — with no config and no ledger (standing instruction #1) | verified |
| I4-08 | Guard counts moved with the guards | `test/negatives.py` MIN_EXPECTED 313 → 315 and the CHANGELOG count with it; both were caught stale by the repo's own ratchet, not by reading | verified |
| I4-09 | The run's own record was made true | stages 3 and 4 stamped as folded into the module brief, wording naming the fold rather than inventing documents; coverage 9/11 → **11/11** | verified |
| I4-10 | The remaining exit 1 is the check being right | stage 5 is genuinely `pending` while the loop runs; the command still exits 1 and says so, which is the intended behaviour at stage 10, not a defect | verified |
| I4-11 | Released and closed by the registry | task-pipeline CI `completed success` on 8d3ef45 read **before** the tag; umbrella CI success on 70794a7, release workflow success, `npm view sshlg-skills version` → **0.51.0** | verified |
| I4-12 | The lease released before the row closed | `.agent-sync/leases/B-31.lock` removed first, board row closed second (B-35) | verified |

### Iteration 5 — B-30, the two members whose exposure read zero because nothing was measured

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I5-01 | The board row was re-measured, not trusted | one sweep over all nine repositories for `docs/evidence/verification.md`: the row said three members, the sweep found **two** — `agent-stack` had been seeded by the concurrent session that morning (13 rows, 0 `never`). Standing instruction #5 | verified |
| I5-02 | `make-skill` has a ledger keyed to its shipped state | 10 REQ rows against v0.18.1, `main` at `ba01f8f` | verified |
| I5-03 | `sheleg-dev` has a ledger keyed to its shipped state | 10 REQ rows against v0.4.3, `main` at `33bba49` | verified |
| I5-04 | Every row was measured, none back-filled | each row carries the command AND what it printed: `PASS: make-skill structure valid (1 cursor rule(s))`, `OK: sheleg-dev structurally valid (12 checks, 6 skill(s), v0.4.3)`, four version surfaces read back per repo, `npm view` → `0.18.1` / `0.4.3` | verified |
| I5-05 | The negatives' verdict came from the registry, by identity | step-level conclusions of the release's own CI run — `31753479647` → **9/9 `success`**, `31749477902` → **8/8 `success`**, 0 failed steps in either. Not `--limit 1` on a branch (standing instruction #9) | verified |
| I5-06 | `sheleg-dev`'s reference graph is intact | 26 `](references/…)` links across six skills, **0 unresolved**; every `references/*.md` named by its own `SKILL.md`, **0 orphans** | verified |
| I5-07 | Both installer paths exercised against a fresh HOME | `HOME=/tmp/fakehome-sd node bin/sheleg-dev.js` installs six skills; the second run prints `skip:` **6** times | verified |
| I5-08 | Each ledger names what it does NOT cover | closing section per repo: vendor drift for `sheleg-dev` (six integrations, none re-checked against a live vendor), advice-as-advice for `make-skill` (no behavioural eval suite), and the CI-only paths in both | verified |
| I5-09 | The pins stayed honest without version noise | the umbrella requires `skills.json` version == the submodule's `package.json` version, not a tag; a docs-only commit keeps the pin valid, and `python3 test/validate.py` → `PASS: sshlg-skills structure valid (8 skills, 8 submodules)` with both pointers moved | verified |
| I5-10 | The family sweep is the closing number, recomputed | after the work: **nine of nine** repositories carry a ledger; `never` appears in exactly one, `task-pipeline` at 99 — which is B-29, the next row | verified |
| I5-11 | What the iteration found became a row, not a note | **B-41** filed: `make-skill` and `sheleg-dev` both carry an empty `scripts` block, so the family's `npm test` gate does not exist in either | verified |
| I5-12 | The lease released before the row closed | `.agent-sync/leases/B-30.lock` removed first, board row closed second (B-35) | verified |

### Iterations 6–9 — the loop drained to what cannot close here

| REQ | What it claims | Evidence | State |
|---|---|---|---|
| I6-01 | B-44's premise was wrong and the row says so | `task-pipeline` DID carry `.claude/agent-sync.json`, committed in v1.53.0. The measured cause is narrower: `guardedFiles` named six doc registers and nothing a release touches — `guard CHANGELOG.md` from inside the member returned *not a guarded file* | verified |
| I6-02 | Coordination now covers what two releases collide on | umbrella gains ten `skills/*/…` patterns; **8 of 8 members carry a committed config**; `task-pipeline`'s own went 6 → 13 patterns (`cfce394`, single-file commit so a concurrent release was not swept in) | verified |
| I7-01 | Eleven macOS-dead plants run anywhere (B-33) | `test/plant_edit.py`, three verbs, literal anchors, each refusing by name. **All fourteen plants in that workflow watched running locally** — none of the eleven ever had | verified |
| I7-02 | The class is closed, not the instance | a validator guard refuses `sed -i` **at command position**; the first draft matched any mention and flagged a step name, a comment and an `echo` — instruction #7 inside its own fix | verified |
| I7-03 | The plant for that guard was watched working | it rewrote its own source text twice first, because every literal it names also exists inside it; it targets the last call site now. seo-aeo-audit v0.17.1, CI success on `2366059`, npm confirmed | verified |
| I8-01 | Adopting the shared guard found real defects (B-37) | two of `agent-stack`'s eight plants were doing **nothing**: `cp -R . /tmp/x` into an existing dir nests the tree, and `touch` on a file left by the previous run changes neither content nor mode. Every copy `rm -rf`'d first now | verified |
| I8-02 | Three claim-cell defects, four fixtures watched failing | `agent-sync` v1.11.0: releasing keeps a close written while held (B-35); a register with no pattern reports instead of raising `IndexError: no such group` (B-34). Run against the pre-fix script: **4 of 6 fail** | verified |
| I8-03 | B-42 was fixed twice, and the better one was kept | the concurrent session shipped v1.10.1 with the same first-cell rule, narrowing **after** the marker so a release still trusts what it wrote. Mine was dropped, kept only as regression case 1 | verified |
| I8-04 | The push-scope refusal was fixed family-wide | hit live on `agent-sync` v1.11.0; SSH push-urls set on the two members that lacked them. Measured after: **8 of 8 fetch urls still HTTPS**, the invariant the validator enforces (B-18) | verified |
| I9-01 | The graph refreshes without a key (B-24) | `graphify update .` → **715 → 930 nodes**, 1094 edges, backup at `graphify-out/2026-08-14/`. Stated in both directions: `document` +161, `code` +76, **`rationale` −22**, 54 labels only a semantic pass can produce | verified |
| I9-02 | The stage-9 hub check ran, for the first time | all 8 god-nodes named across 30 documents scanned — no undocumented seam | verified |
| I9-03 | Instruction ids are stable, and the collision is named (B-23) | `#1` was retired 2026-08-13 and refilled the same day; recorded rather than rewritten, because renumbering either side makes a shipped sentence point at a rule it never meant. Guard watched failing on a plant that refills vacant slot 3 | verified |
| I9-04 | The hook channel is decided once (B-19) | `docs/DOCMAP.md`: the channel follows the **shape** — a plugin has a manifest, a launcher has no alternative. Measured: three events in both channels, six scripts, six jobs. A plugin member also writing `settings.json` is now refused, watched failing | verified |
| I9-05 | A check that reads a working tree was caught by CI | the coordination guard was green locally on configs never committed while CI failed on two of them — same defect as the pin guard written the same afternoon. It asks git now, watched failing on both shapes | verified |
| I9-06 | Closed by the registry, not by recency | five releases, each CI verdict read **before** its tag; `npm view` confirms `task-pipeline` 1.54.0, `seo-aeo-audit` 0.17.1, `agent-stack` 0.7.2, `agent-sync` 1.11.0, `sshlg-skills` 0.54.0 | verified |
| I9-07 | The run's own record is complete | `bash scripts/stage-coverage.sh` → **11/11, exit 0**, using the mechanism this run built in iteration 4 | verified |
| I9-08 | No lease left held, every repo pointed at | leases directory empty; `git submodule status` shows no `+`; every member clean and pushed. `task-pipeline`'s 18 modified files are a concurrent session's unreleased v1.55.0, untouched | verified |

## 2026-08-16 (second) — v0.61.0, the gate we ship running on us

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| R-01 | CI runs `agent_sync.py check` across every repository declaring a coordination config, and refuses a run that finds fewer than two | the same loop run locally as CI would: **9 configs, all exit 0**. Its first execution found `task-pipeline` unhealthy on two counts, both fixed in v1.59.0 | verified |
| R-02 | A member changing its skill set must reword its `desc` in the same change | token-matching was tried first and **produced four false failures out of eight members**, so it is the co-edit that is checked, not the prose. Watched failing on a planted fifth skill with an untouched description | verified |
| R-03 | `B-17` and `B-52` closed by measurement rather than by assertion | `negatives.py -k "high-water mark lowered"` from the submodule checkout → PASS, where it previously reported `fatal: not a git repository`; the SHA gate watched failing on an amended-away commit | verified |
| R-04 | Every pin matches its release | `python3 test/check_pins.py` → `every pin matches its release (npm where published, git tag everywhere)` | verified |

**4 of 4 verified. 0 at `never`.**

### What the checks did not cover

- **The coordination check is now in CI and has never run there.** It ran locally over the
  same nine configs; the first CI execution is evidence this row cannot supply.
- **`B-51` is still the one human step** — the code graph needs a key on this machine, and
  `--code-only` would index ten code files while dropping the thirty-nine documents that
  are most of the pack.

## 2026-08-16 (third) — v0.62.0, the router nobody could reach by asking

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B49-1 | `sheleg-design` advertises the plain words an operator types (1.37.0) | `description` 1018/1024 chars, and every added trigger is present verbatim — `test/triggers_test.js` asserts it and was watched failing on `фигма в код` before 1.37.1 restored the phrase | verified |
| B49-2 | Fourteen bare words added to `lib/triggers.js` | `T.match()` over eight visual prompts → **8 route**; over nine controls (payment bug, landing-page copy, prod check, test, README, refactor, a question, and both opt-out phrases) → **0 route** | verified |
| B49-3 | `красиво` and `красивее` are both listed because the stemmer cannot bridge them | `stemRu('красивее')` → `красиве`, which is not a prefix of `красиво`; `сделай красиво` missed until the second form was advertised, then hit | verified |
| B49-4 | `дизайн` is excluded and the exclusion is enforced, not remembered | the refusal-clash fixture rejects any trigger inside a refusal; `'без дизайна'.includes('дизайн')` is the clash | verified |
| B49-5 | The consequence of that exclusion is recorded, not guessed | `T.match('сделай дизайн лендинга')` → `[]`, contradicting the first draft of the comment beside it; filed as B-53 | verified |
| B49-6 | Both releases green and published | `sheleg-design` v1.37.1 release + validate → success, `npm view sheleg-design-skill version` → **1.37.1**; umbrella v0.62.0 validate → success | verified |
| B49-7 | A wrong tag reached the remote and was refused by a gate this pack ships | run 31932524054: `tag v1.37.1 does not match 1.37.0`, exit 1, nothing published — `npm view … versions` showed 1.37.0 as the newest at that moment | verified |
| B49-8 | Three findings filed rather than absorbed | B-53 (composition), B-54 (the invariant enforced one repo away), B-55 (`super-ux`'s unignored `graphify-out/`) | verified |

## 2026-08-16 (fourth) — v0.63.0, the pin is a tag and the hub is a branch

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B56-1 | Every hub copy is compared against its pinned source, by content | 23 of 23 match; the first instrument read a `version:` field 22 members do not carry and called them all clean, which is why the shipped one hashes file trees instead | verified |
| B56-2 | `seo-aeo-audit` 0.20.1 releases the crash that was sitting on `main` untagged | guard watched failing against the reinstated defect (`page_audit.py emits severity ['low'] that SEVERITY_ORDER cannot order`, exit 1) and green after restore; all eight member gates exit 0; `npm view @ssheleg/seo-aeo-audit version` → **0.20.1** | verified |
| B56-3 | `test/release_lag.py` discloses any member whose branch has moved past its pinned tag | 6 fixtures pass; watched on a real checkout set one commit behind — *seo-aeo-audit: 1 unreleased commit on main* — and silent after restore | verified |
| B56-4 | A checkout that cannot look reports `blind`, never `current` | fixture `no origin/main is blind, never current`; the check reads local refs only and never fetches, so `npm test` stays offline | verified |
| B56-5 | The disclosure has a negative self-test in CI | first draft died on `pathspec 'HEAD~1'` — CI clones submodules shallow — rewritten to synthesise the ahead-ref; run 31933782763 → success | verified |
| B56-6 | The umbrella ships the pin | `npm view sshlg-skills version` → **0.63.0**; release run 31933782797 → success; `git submodule status` shows no `+` | verified |
| B56-7 | The launcher's own failure is characterised, not guessed | not rate limiting (`GH_TOKEN` removes the limit line, not the failure), not size (super-ux is 2.2M/123 files and succeeds), not the lock's shape (identical to working members); it is the `skillFolderHash` loop — still open | verified |

## 2026-08-16 (fifth) — v0.64.0, the invariant moves to where it can be broken

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B54-1 | The advertisement assertion is addressable from a member | `node test/advertised_check.js --member <m> --root <c>` answers for all eight members; `agent-stack` reports *carries no routed triggers* rather than passing silently | verified |
| B54-2 | No copy of the trigger table travels with a member | the checker `require`s `lib/triggers.js`, the module the hook itself calls; the members pass a name and a path and hold nothing | verified |
| B54-3 | All seven members carrying routed triggers call it | `test/advertised_plants.py` drops one of each member's own advertised phrases and runs that member's own `validate.py`: **7 of 7 refuse**, each with the specific message and a non-zero exit | verified |
| B54-4 | The sweep itself can fail | with `check_routed_triggers_still_advertised()` deleted from `agent-sync`'s validator the sweep exits 1 and names it — which matters, because that member's other checks reject the planted description anyway and an exit-code-only sweep would have called it caught | verified |
| B54-5 | A member with no umbrella above it discloses, never passes | `--root /tmp` → `blind: no plugins/ under /tmp`, exit 2; the member wiring turns that into an `unlooked:` line | verified |
| B54-6 | The per-commit gate stays honest | the sweep costs 21 s and took `npm test` from 3.3 s to **26.2 s**; moved to `npm run test:plants` + a CI step, measured back at **5.2 s** | verified |
| B54-7 | Nothing can silently drop the sweep | `validate.py` asserts the `package.json` entry point and the CI step, each watched failing against its own deletion | verified |
| B54-8 | Seven members and the umbrella released, pins moved | every pin compared against `npm view`: 8 of 8 match; `git submodule status` shows no `+`; umbrella run 31935028659 → success | verified |
| B54-9 | The instruments were wrong twice and the asserts caught both | one-occurrence replacement read `super-ux` as not refusing (a phrase advertised twice); `glob('**/*.json')` skipped dotted dirs so `.claude-plugin/*.json` went unbumped in all seven | verified |
| B54-10 | `agent-sync` tagged with a partial version sync and its own CI refused | run 31934820251: *version sync broken: … agent_sync.py 1.11.0, SKILL.md 1.11.0*; nothing published (`gh release view` → not found), tag moved, re-released green | verified |

## 2026-08-16 (sixth) — v0.65.0, the phrase that reached no route

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B53-1 | `сделай дизайн лендинга` reaches `sheleg-design` | `T.match()` → `[sheleg-design]`, where it returned `[]` before; `design a landing page` and `сделай дизайн для лендинга` (one intervening word) also route | verified |
| B53-2 | The bare noun is still not a trigger, so copy work is not stolen | `напиши текст для лендинга` → `[copywriting]` alone; `почини баг на лендинге` → `[task-pipeline]` | verified |
| B53-3 | The replaced pair's real case survives | `make the hero more cinematic` → `[sheleg-design]`, through `hero` rather than `cinematic landing` | verified |
| B53-4 | The opt-out still wins | `сделай дизайн лендинга без дизайна` → `[]` | verified |
| B53-5 | The composition question is answered from the source, not assumed | `ux-flows`'s description advertises no landing vocabulary, and reading it says why — task analysis, flows, branches, error paths, screen states; a marketing page has no flow | verified |
| B53-6 | Both drivers repaired before reuse | the bump driver moved **6** surfaces on this release where its `glob` version found 4, and now matches `version: "x"` and `VERSION = "x"` | verified |
| B53-7 | Released and pinned | `npm view sheleg-design-skill version` → **1.37.3**, `npm view sshlg-skills version` → **0.65.0**; run 31936085317 → success; no submodule ahead | verified |
| B53-8 | The hub serves it | `~/.agents/skills/sheleg-design` byte-identical to the pinned source at 1.37.3 — copied by hand again, which is B-56 | verified |

## 2026-08-16 (seventh) — v0.67.0, a contributing guide that described a different repository

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B47-1 | The scale of the defect is measured, not inherited from the row | every backticked file name in `CONTRIBUTING.md` checked against `git ls-files`: **11 absent of 19**, where the row named 6 | verified |
| B47-2 | The rewrite describes this repository | six skills and twenty reference files counted with `find`; one executable (`install.sh`) from `git ls-files`; four version surfaces and eight CI negative self-tests read out of `test/validate.py` and `validate.yml` | verified |
| B47-3 | Every name in the new document resolves, or is explicitly another repository's | the same sweep re-run: 4 unresolved, each confirmed by context to be a pointer to `seo-aeo-audit` or the umbrella's `skills.json` | verified |
| B47-4 | The recurrence is gated | `check_contributing_routes_to_files_that_exist` watched rejecting the original row verbatim (`benchmarks.md`, exit 1) and green after restore; same plant wired into `sheleg-dev`'s CI and run locally as written | verified |
| B47-5 | The guard cannot flag a discussed path | narrowed to table rows after its first draft flagged the three sibling files named on purpose; a bare filename resolves by basename so the generic `SKILL.md` passes | verified |
| B47-6 | Released and pinned | `sheleg-dev` v0.5.2 tagged at HEAD; pin, README row and umbrella v0.67.0 moved | verified |

## 2026-08-16 (eighth) — v0.68.0, the command that was built, parked, and lost

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B43-1 | The parked work is gone, not merely misplaced | absent from the working tree, `git log --all --diff-filter=A`, `rev-list --all --objects`, `stash list` and `fsck --lost-found` | verified |
| B43-2 | `templates/exposure.sh` computes the documented line | run against this repository's own 126-row ledger: `exposure: 126 unverified · never checked · 104 releases carry one`, followed by the oldest-first list | verified |
| B43-3 | It is a measurement, not a gate | exits 0 at every count; exit 1 reserved for an unreadable ledger, asserted by the malformed-date fixture | verified |
| B43-4 | The percentage refusal is live, not decorative | the `*%*` case watched exiting 1 with the doctrine's own sentence, both in the fixture and as a CI plant | verified |
| B43-5 | Fourteen fixtures, three of which found real defects | double-zero from `grep -c … \|\| echo 0`, BSD `sort` dying on UTF-8 and leaving an empty list under a non-zero count, byte-wise `substr` splitting a Cyrillic letter | verified |
| B43-6 | A seeded script can no longer vanish silently | validator asserts existence, shebang and doctrine-naming; each watched failing on its own plant | verified |
| B43-7 | The ratchet is counted, not carried over | `MIN_EXPECTED` 344 → 347 read from the workflow; `npm run test:all` → *all 347 guards provably reject their planted defect · 9 property checks printed what they assert*, exit 0 | verified |
| B43-8 | A control that went red was a real failure, not a false positive | the carve-out property check failed because the CHANGELOG still said 344 while the workflow defined 347 — the harness was right and the tree was mid-change | verified |

## 2026-08-16 (ninth) — v0.69.0, a board row that says work exists names where it lives

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B58-1 | `parked` is a status that must name a branch or a commit | plant: the template's `parked — feat/upload-retry` reduced to `parked` → validator fails with *names no branch or commit*; green after restore | verified |
| B58-2 | An open row may not home its work in a per-session directory | plant: `open — held at scratchpad/b29/` on the template's B-002 → validator fails with *per-session directory*; green after restore | verified |
| B58-3 | The prose detector was measured before being rejected, not assumed bad | 3 hits across 187 rows, each read and confirmed false — two closed rows narrating the incident, one the row asking for the rule | verified |
| B58-4 | Both shipped rules have a zero baseline, which is what makes a first firing mean something | re-measured position-free across **191** rows including the seeded templates: rule 1 → 0, rule 2 → 0 | verified |
| B58-5 | The guard is position-free | the first draft read `cells[-2]` — status in an 8-column board, `Home` in the 10-column template — and its plant passed silently; caught by running the plant rather than by reading | verified |
| B58-6 | Ratchet counted from the workflow | `MIN_EXPECTED` 347 → 349; `npm run test:all` → *all 349 guards provably reject their planted defect · 9 property checks printed what they assert*, exit 0 | verified |
| B58-7 | Released and pinned | `task-pipeline` v1.62.0 tagged at HEAD; pin, README row and umbrella v0.69.0 moved | verified |

## 2026-08-16 (tenth) — v0.70.0, the description was not valid YAML

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B56-8 | The root cause is the front matter, not the launcher | asking the skills CLI to list the repository's skills (`npx skills add <repo> --list`) → *YAML parse error: Nested mappings are not allowed in compact mappings*, then *No valid skills found* — for both copies of the file | verified |
| B56-9 | It is a class of one, measured not assumed | a strict `yaml.safe_load` over all 24 shipped front matters: **2 invalid, both `sheleg-design`**; the narrow unquoted-colon rule over all 69 scalar lines: **2 hits, the same two** | verified |
| B56-10 | Every gate the family owns read it with a regex and stayed green | the member's own `npm test` exit 0, `claude plugin update` reporting *already at the latest version*, and `test/triggers_test.js` OK, all over the invalid file | verified |
| B56-11 | The hazard is refused at the member, before it can tag | `advertised_check.js` watched exiting 1 on the reinstated colon, and the same message surfaced through `sheleg-design`'s own `validate.py` | verified |
| B56-12 | The member nothing was checking is now checked | the shared checker's early exit for trigger-less members is gone; `agent-stack` 0.11.1 calls it and was watched refusing a planted `Broken: now a nested mapping.` in `agent-orchestrator` | verified |
| B56-13 | The umbrella runs the strict form | `check_shipped_front_matter_is_real_yaml` over 24 files including `.cursor` mirrors, watched failing on the reinstated defect, disclosing when pyyaml is absent | verified |
| B56-14 | Released and pinned | `sheleg-design` v1.37.4 and `agent-stack` v0.11.1 tagged at HEAD; both pins, both README rows and umbrella v0.70.0 moved | verified |
| B56-15 | A row edit damaged its neighbour and was caught by diff, not by the assert | a `re.S` pattern ran from B-56 past its own row into B-57's `| open |`; `git diff --stat` showed one changed line and it was the wrong one. Repaired line-scoped; both rows re-read | verified |

## 2026-08-16 (eleventh) — v0.71.0, the graph's distance from the code

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B51-1 | Every graph's drift is a number, printed every run | `npm test` discloses nine lines: umbrella **31** commits behind, super-ux **33**, seo-aeo-audit **19**, sheleg-design 12, task-pipeline 10, agent-sync / make-skill / sheleg-dev / agent-stack at 2 | verified |
| B51-2 | Two of the row's facts had expired | the graphs were rebuilt 2026-08-15/16, not frozen at 08-08; they hold **11,267 nodes and 12,494 links** between them | verified |
| B51-3 | The refresh is genuinely blocked, and the block is named | `graphify . --update` → exit 1, *no LLM API key found (40 doc/paper/image file(s) need semantic extraction)*; no key in the environment and none among the gateway's secrets (`context7`, `digitalocean-token`, `lazyweb`, `prowl`, `roles`, `searchapi`) | verified |
| B51-4 | An unresolvable build commit reads blind, never current | plant: `built_at_commit` set to a fabricated SHA → *does not resolve here*; a graph with the field removed → *its distance from the code is unknowable* | verified |
| B51-5 | The disclosure self-corrects when the decision is taken | the same suite run with `GEMINI_API_KEY` set drops the *cannot run here (B-51)* tail — 0 occurrences | verified |
| B51-6 | It is a disclosure, not a gate | `npm test` exit 0 with all nine graphs behind; a threshold would redden every repository daily and be switched off | verified |
| B51-7 | The instrument was wrong before the subject | its first draft read `edges` from a node-link document keyed `links` and reported **zero edges across all nine graphs**; `graphify god-nodes` printed real hubs one command later | verified |

## 2026-08-16 (twelfth) — v0.72.0, the age term that was a constant

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B60-1 | The board's rank is computed from its own inputs, every run | `validate.py` recomputes `Age` and `P` for every open row against the retro's stamp table; watched failing on a pinned age (*states age 2 but has survived 7 stamp-day(s)*) and on a wrong P (*states P 9.9 but … computes to 2.67*), separately | verified |
| B60-2 | The defect was real and the correction changes the ranking | B-07 2→**7**, B-08 2→**7**, B-29 0→**3**, B-51 0→**1**; P 1.0→2.67, 1.0→2.67, 0.67→2.67, 1.0→2.0 — the four rows this loop worked last are now the top of the board | verified |
| B60-3 | `age_runs` is distinct stamp-days, and the unit is stated | 38 stamps over 9 distinct days, 13 on one afternoon; both readings measured and compared before choosing, and the fixture *three stamps in one day age a row by one* holds it | verified |
| B60-4 | Unknown and zero are different | a `Source` with no date returns `None` and is disclosed, never counted as 0 — asserted separately, since 0 means *filed today* | verified |
| B60-5 | Only the stamp table counts | fixture: a date in an entry heading and a date in prose are both excluded; counting either would inflate every row at once and look like the board working | verified |
| B60-6 | The harvest rule ships | `task-pipeline` 1.63.0, `references/knowledge-sources.md`; `npm run test:all` → all **349** guards reject their planted defect, 9 property checks printed | verified |
| B60-7 | No guard was written where the corpus cannot support one | across seven open rows the checkable claims total 2 file paths and 1 count — measured before deciding, and stated in the notes rather than left as an omission | verified |
| B60-8 | A malformed row was caught by an existing guard, not by me | the first B-61 row carried `|` inside backticks and shifted to 14 cells; the board-shape check refused it | verified |

## 2026-08-16 (thirteenth) — v0.73.0, a clean bill on ledgers it could not read

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B29-1 | The silent green is real and was reproduced | the shipped script on this repository's ledger printed *0 unverified · every shipped row carries a human confirmation* from **4 rows out of 298**, the four whose inline code carries a `\|` | verified |
| B29-2 | The status column is resolved by name, per section | fixture *the status column is found by name, not position*; `Last verified` placed where `Run` sits is read correctly | verified |
| B29-3 | The preference order was measured, not guessed | `sheleg-design` carries `Last verified` **and** a `Status` holding `**green**`; preferring `status` reported 174 confirmations from the gate column | verified |
| B29-4 | Evidence columns are not status columns | `Verified by` / `How it is checked` hold shell commands in five members; sampled, then excluded by name | verified |
| B29-5 | Bold no longer hides a real row | these ledgers write `**never**`; stripped before matching, fixture asserts a bolded never is counted | verified |
| B29-6 | A shrug never gets a clean bill | fixture *a shrug never gets a clean bill* — `ask Ben` produces its own count and list, and no confirmation sentence | verified |
| B29-7 | Only a `Human` column licenses the word human | fixture asserts a `Status` column produces *confirmed in its `status` column — which does not separate a person from a command* | verified |
| B29-8 | The family measured afterwards | `task-pipeline` **126 unverified**; `sheleg-design` 1; `seo-aeo-audit`, `super-ux`, `agent-sync` **dormant — no status column**; measured by running the script in each | verified |
| B29-9 | B-29's own claims re-derived before acting | 99 rows → **126**, 14 ids → **19**, the parked command landed in 1.61.0, and `(REQ, Shipped in)` is unique across all 126 — collisions 0 | verified |
| B29-10 | Fixtures and gate | 14 → **18** cases; `npm run test:all` → all **349** guards reject their planted defect, 9 property checks printed, exit 0 | verified |

## 2026-08-16 (fourteenth) — v0.74.0, a decision is not debt

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B08-1 | Both revisit conditions re-derived before the rows were touched | B-07: **8** launcher commands, **0** with no fixture naming them; B-08: the routing block still states *Decided AT DESIGN TIME*, and the skill's only `design` mentions are split-test design | verified |
| B08-2 | `waived` is a state, not a flavour of open | both rows carry `waived — revisit: …` and priority `—`; the rank guard skips them and the open count no longer includes them | verified |
| B08-3 | A waiver with no trigger is refused | plant: `revisit:` removed from B-07 → *names no `revisit:` condition*; same plant against the shipped template's B-005 → same refusal | verified |
| B08-4 | A waiver that keeps its priority is refused | plant: B-07 priority restored to `**2.67**` → *waived but still carries priority*; template B-005 set to `3` → same | verified |
| B08-5 | Waived rows stay visible | `npm test` discloses *board — B-07 is waived, not done* and the same for B-08, beside the verdict rather than inside it | verified |
| B08-6 | The shipped doctrine and template carry it | `references/backlog.md` gains the section, `templates/backlog.md` a worked B-005; guards 349 → **351**, `npm run test:all` exit 0 | verified |
| B08-7 | A guard caught the documentation using a real id | the worked example first used `B-07`, making a second row with that id; the duplicate-id check refused it, and both board guards were narrowed to `B-\d+` so the placeholder is not read as a row | verified |

## 2026-08-16 (fifteenth) — v0.75.0, reading a board by position

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B61-1 | The defect is real and was reproduced on the seeded shape | a scratch project with the ten-column board printed `[blast L]` where the row's Blast is `3` and its Size is `L` | verified |
| B61-2 | Blast is resolved by header | the same project after the fix prints `[blast 3]`; the umbrella's eight-column board still prints its own `Blast` | verified |
| B61-3 | Both shapes are held by fixtures | *blast is read by header across both board shapes* asserts `[blast 3]` and refuses `[blast L]`, then re-checks the eight-column form | verified |
| B61-4 | An absent column stays absent | *a board with no blast column prints no blast* — the row is listed, no weight is invented | verified |
| B61-5 | Neither formula was wrong | both are documented in their own headers; convergence was refused because it breaks every seeded board or rewrites 60 rows here, stated in the row rather than left implicit | verified |
| B61-6 | The rule is doctrine, not two fixes | `references/backlog.md` — *the shape is not fixed, so nothing may assume it*; resolve by header, absent is absent, name the column in the output | verified |
| B61-7 | Gate green | fixtures 18 → **20**; `npm run test:all` → all **351** guards reject their planted defect, 9 property checks printed, exit 0 | verified |

## 2026-08-16 (sixteenth) — v0.76.0, two facts, and most ledgers record one

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B62-1 | The row under-counted its own subject | **ten** header shapes across nine repositories, not five; counted by scanning every header row in every ledger | verified |
| B62-2 | The family total is computed, not estimated | **815** rows: 126 `Human`, 180 `Last verified`, 391 `verified`-ish, 118 with no state column — the four buckets sum to the total | verified |
| B62-3 | `never` is expressible in one repository of nine | only `task-pipeline`'s shape carries a `Human` column; 126 of 815 rows, just over 15% | verified |
| B62-4 | The split is doctrine now | `references/verification.md` — *a ledger records two different things*, with three rules following from it | verified |
| B62-5 | Convergence was refused with the reason stated | back-filling 689 rows with confirmations nobody gave is the `evidence-docs` failure; recorded in the row and the notes rather than left as an omission | verified |
| B62-6 | This repository's preamble stopped promising a count it cannot produce | it claimed the checkup counts rows at `never`; the shape has no such value, and 295 of 322 rows read `verified` with no person/command distinction | verified |
| B62-7 | A self-explaining status is no longer unreadable | four rows reading `**observed** — …` were reported unparseable; matching moved to the leading word, empty tested first, and the four now read correctly | verified |
| B62-8 | All nine ledgers run through the script by hand | umbrella `0 unverified` naming its column; `task-pipeline` **126 unverified**; `agent-sync`, `seo-aeo-audit`, `super-ux` dormant with their row counts | verified |

## 2026-08-16 (seventeenth) — v0.77.0, a false positive hiding a bypass

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B59-1 | A document quoting the invocation is no longer refused | a `python3 - <<'PY'` body and a `cat > doc.md <<EOF` body both pass; fixtured | verified |
| B59-2 | A shell heredoc body is still a command | `bash <<EOF … EOF` is refused — stripping every heredoc would trade the annoyance for a documented bypass, asserted in its own case | verified |
| B59-3 | The heredoc ends where it ends | a command after the terminator is still refused; `<<-` with a tab-indented terminator is honoured | verified |
| B59-4 | A whole-line comment does not run | `# never run …` passes; fixtured | verified |
| B59-5 | **A quoted invocation was passing the guard, and now does not** | at `HEAD`, `bash -c 'npx skills add ux-flows'` → not refused, because `bareName` kept the trailing quote; after, refused | verified |
| B59-6 | The hook agrees with the module | the real `hooks/pre-tool-use.js` driven as a process over three payloads: refuse, allow, refuse | verified |
| B59-7 | Three new cases were passing for the wrong reason | they targeted a member the fixture's manifest does not declare, so every result was `null`; positive controls added at the top of the block | verified |
| B59-8 | Fixtures and gate | hygiene 17 → **22** checks; `npm test` exit 0 | verified |

## 2026-08-16 (eighteenth) — v0.78.0, an unqualified landing page

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B57-1 | Both unqualified phrases reach both crafts | `сделай лендинг`, `build a landing page`, `сделай мне лендинг` and `сделай дизайн лендинга` → `[sheleg-design, copywriting]` | verified |
| B57-2 | The controls are unchanged | `напиши текст для лендинга` → copywriting alone; `почини баг на лендинге` → task-pipeline alone; both opt-outs and the question → `[]`; `поменяй палитру` → sheleg-design alone | verified |
| B57-3 | The bare noun was tried and measured before being refused | with it, the copy task collected a visual route and the bug fix three routes; the table is in the release notes | verified |
| B57-4 | A premise of the row had expired | `copywriting` was said to be at its limit and is at **536/1024**, 488 free; only `sheleg-design` was tight at 1009 | verified |
| B57-5 | The English gap was found by re-derivation, not by the row | `build a landing page` reached `[]` and is not mentioned in B-57 at all | verified |
| B57-6 | Every trigger is advertised | `test/triggers_test.js` → OK (27 checks) after all four additions; both descriptions within 1024 (1021 and 579) | verified |
| B57-7 | Released and pinned | `sheleg-design` v1.37.5 and `super-ux` v0.41.5 tagged at HEAD; both pins, both README rows, umbrella v0.78.0 | verified |

## 2026-08-17 (nineteenth) — v0.82.1, the tag's tree and the composition check

**Four releases are missing from this ledger, and the gap is named rather than filled.**
v0.79.0, v0.80.0, v0.81.0, v0.81.1 and v0.82.0 shipped without a section here; the eighteenth
entry above is v0.78.0. That is `B-70` — *the verification ledgers have gone stale in five of
nine* — visible in this repository's own. Back-filling five releases from their CHANGELOG
entries would record confirmations nobody performed, which is the failure `evidence-docs`
exists to refuse, so the rows below cover **this** release only.

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B78-1 | v0.82.0 was tagged and never published | `npm view sshlg-skills version` → `0.81.1` with tag `v0.82.0` present at `5568783` | verified |
| B78-2 | One step failed, in all three runs, and it gated the rest | `gh run view --json jobs` on 32034181241, 32034202248, 32034202388 → the only `failure` step is *Coordination configs are checked, in every repository that declares one*; `publish` and `release` report `skipped` | verified |
| B78-3 | The pinned tag's tree fails the check, and the branch tip passes | `git worktree add --detach … 92fc3ea` then `agent_sync.py check` → *the configuration changed since the snapshot was generated*, `1 problem(s)`; the same check across all nine configs at the tip → `seen=9 rc=0` | verified |
| B78-4 | Both trees carry the version `skills.json` claims | `require('<worktree>/package.json').version` → `1.69.0`; the same at `7cd7aaf` → `1.69.0` | verified |
| B78-5 | No child patch release was needed, and that was measured not assumed | `task-pipeline-skill` `files` → `["bin","plugins","cursor","evals","README.md","HOW-IT-WORKS.md","SKILL-CARD.md","LICENSE","CHANGELOG.md","CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md"]`; `npm pack --dry-run \| grep -iE 'AGENT_SYNC\|agent-sync.json'` → **empty** | verified |
| B78-6 | The unpushed commits were the second half of the failure | umbrella `test/validate.py` before the push → *`skills/task-pipeline`: 4 commit(s) exist only locally … `upload-pack: not our ref`*; after `git push origin main` (92fc3ea..7cd7aaf) the same command is clean | verified |
| B78-7 | The gate is green on the released tree | `npm test` → `PASS: 33 checks green (validate.py + 5 python + 27 node suites)`, exit 0; `python3 test/check_pins.py` → `every pin matches its release`, exit 0 | verified |
| B78-8 | Nothing but the pointer moved | `git diff v0.82.0..HEAD --stat` limited to `skills/` shows only `skills/task-pipeline`; `skills.json` still reads `1.69.0` and no README row changed | verified |
| B79-1 | The missing signal is filed, not fixed | `B-79` open on the board: nothing asserts a pushed tag reached the registry, and `check_pins.py` covers members only and sits outside the offline gate by design | verified |
| B79-2 | And it was watched working once, by hand | the v0.82.1 monitor polled the tag's runs to terminal and then read the registry: `SHIPPED: runs [release=success validate=success] and npm serves 0.82.1` | verified |

## 2026-08-17 (twentieth) — v0.83.0, the tenth router

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B81-1 | `agent-stack` had no router of any kind | before the change: `registry.order()` → nine names, none of them `agent-stack`; `grep -c 'SSHLG:ROUTER:' ~/.claude/CLAUDE.md` → nine sections; `lib/triggers.js` `ROUTES` had no entry. Its only appearance in the operator's file was the map table at line 178 | verified |
| B81-2 | The cost was measured, not asserted | `node test/route_coverage.js` before → `39 named an expected route · 32 reached nothing`; after → `44 · 27`. The agent block goes from 6 misses of 7 to 1 | verified |
| B81-3 | Five of six agent prompts route, and the sixth is a different defect | `напиши оркестратор агентов`, `сделай эвалы для агента`, `add tool calling loop`, `sub-agent coordination`, `системный промпт для агента` → `["agent-stack"]`; `подключи mcp сервер` → `[]`, moved to `B-84` as a matcher gap, not a missing trigger | verified |
| B81-4 | No description was edited, and none could have been | `agent-orchestrator` measured at **1019/1024** before and after; all four triggers groups are drawn from the `Triggers -` lists the skills already publish, and `triggers_test.js` → `OK (27 checks)` proves every one is advertised | verified |
| B81-5 | The bare `агент` is refused, and the refusal is sayable | `без агентного слоя` → `T.match` returns `[]`; `triggers_test.js`'s clash fixture (*no refusal phrase is also a trigger*) passes with the new phrase in `REFUSALS` | verified |
| B81-6 | The neighbours still separate | `возьми задачу` and `кто сейчас делает этот файл` → `["agent-sync"]`, unchanged; the router text names the seam (who holds the file vs what is being built) | verified |
| B81-7 | A fixture that counted by hand had the bug it was checking for | `router_texts_test.js`'s member list omitted `agent-stack`, so *"the whole family contributes all nine"* passed over the gap; it now reads `skills.json` and asserts the manifest holds the member. `cli_config_test.js` reads `registry.order().length` instead of the literal `9` | verified |
| B81-8 | The block's growth is a number, not an impression | the ten rendered router texts are **10668 characters**, `agent-stack` **1326** of them — ~2735 and ~340 tokens on the repo's own ÷3.9 divisor | verified |
| B81-9 | The gate is green and the counts recompute | `npm test` → `PASS: 33 checks green`, exit 0; `router_texts_test.js` 65 → **70 checks**; the board's own recipe prints `open 7 / waived 3` | verified |
| B81-10 | The published open-count recipe survived the new rows | an escaped `\|` inside `B-82`'s prose split the status out of the second-to-last field and hid `B-82` from the waived list; the row was rewritten in words rather than the parser being taught the exception | verified |

## 2026-08-17 (twenty-first) — v0.84.0, the growth vocabulary becomes reachable

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B80-1 | The router promised ground the hook could not name | `lib/routers-registry.js:31` claims *"product decisions, funnels, onboarding, payment steps"*; `node test/route_coverage.js` before → 15 of 15 growth prompts `[]` | verified |
| B80-2 | The knowledge was never the gap | `grep -roicE` over `skills/super-ux/plugins`: funnel 448, onboarding 499, paywall 493, retention 196, activation 171, referral 100; eight first-class tags; `references/funnel-research.md` 190 lines | verified |
| B80-3 | The blocker was the description, and it is now advertised | all twelve planned words read back out of the two shipped descriptions with the fixture's own lowercased reader; `test/triggers_test.js` → `OK (27 checks)` | verified |
| B80-4 | Coverage moved and the number is the probe's | `node test/route_coverage.js` → `55 named an expected route · 16 reached nothing · 0 spoke where silence was right · 71 prompts`, from 44/27 at v0.83.0 and 39/32 at v0.82.1 | verified |
| B80-5 | The split follows the chain's own rule | `funnel-research.md` FR-07 sends the step chain to `flows.md` and the buyer / after-the-session layer to `foundation.md`; the route's two `sources` mirror it exactly | verified |
| B80-6 | Bare English stems were measured, not assumed, and then narrowed | before: `activate the virtualenv` → `["super-ux"]`, `activate the feature flag` → `["task-pipeline","super-ux"]`, `retention policy for logs` → `["super-ux"]`. After: `[]`, `["task-pipeline"]`, `[]` — while `design an activation funnel`, `improve user retention`, `улучши активацию новых пользователей`, `как повысить ретеншн пользователей` and `reduce churn on the trial` all → `["super-ux"]` | verified |
| B80-7 | The descriptions do not advertise one word and list another | the `Triggers -` lists were corrected to `"activation funnel"` and `"user retention"` in the same edit as the prose | verified |
| B80-8 | The README routers table had drifted two routers and now cannot | it read *"Eight routers"* and listed eight, missing `sheleg-dev` (ninth, 2026-08-14) and `agent-stack` (tenth, 2026-08-17). The new guard in `test/validate.py` reads names out of `lib/routers-registry.js` and was **watched failing on two plants** — a removed `agent-stack` row, and *"Nine routers"* against a registry of ten | verified |
| B80-9 | The guard cannot pass vacuously | it fails explicitly when it parses zero router names out of the registry, rather than looping over nothing and reporting success | verified |
| B80-10 | Child before parent, as v0.82.1 established | `super-ux` v0.42.0 tagged and published before the umbrella's pointer commit; `python3 test/check_pins.py` → exit 0 | verified |
| B80-11 | What is still unreachable is named | four growth phrasings remain at `[]` and are listed in the release notes and in `B-80`'s close rather than left for a later reader to rediscover | verified |

## 2026-08-17 (twenty-second) — v0.85.0, the arbitration rule and the roster behind it

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B83-1 | The one arbitrated pack is the disabled one | `enabledPlugins["superpowers@claude-plugins-official"]` is `false` in `~/.claude/settings.json`, while the map's precedence paragraph names only it | verified |
| B83-2 | The unnamed collisions are real and countable | `npx sshlg-skills conflicts` → **180 skill(s) scanned, 39 landing(s)** — twelve `figma` skills onto `sheleg-design`, `prowl-brand`/`prowl-design` onto `copywriting`/`sheleg-design`, `skill-creator` onto `make-skill`, `mcp-builder` onto `agent-stack`, eight `stripe` skills onto `sheleg-dev` | verified |
| B83-3 | The row's own fix was wrong, and the reason is structural | *one line per pack in the map* would ship one machine's roster into every operator's block; the rule generalised and the roster moved behind a command, mirroring the split `lib/injectors.js` already made | verified |
| B83-4 | The command refuses the judgement its data invites | `test/conflicts_test.js` asserts the report contains *CANDIDATES, not offenders*, *never a second entry point* and *hand-kept*, and contains no verdict wording | verified |
| B83-5 | The oldest matching bug was reproduced and closed | the first real run reported `lease` inside *please* and `seo` inside *Seoul*; three boundary cases are fixtured (`polite-bot`, `linux-helper`, `seoul-guide` → no landing) and their whole-word twins still land | verified |
| B83-6 | The fixture then caught the mirror of `B-84`'s third case | the term `mcp server` could not match `build-an-mcp-server-now`; a space inside a term now matches space, hyphen or underscore, and the real scan moved 38 → 39 landings | verified |
| B83-7 | The pure half stays pure | a fixture replaces `fs.readFileSync`, `readdirSync` and `existsSync` with throwers and runs `collisions` + `report` through them | verified |
| B83-8 | The new verb is fixtured as a process, as DOCMAP requires | `conflicts` against a fresh empty `HOME` → exit **0**, printing the header, the empty-case line and the disclaimer; `--help` advertises the verb | verified |
| B83-9 | A third hand-kept copy of the router list is gone | `lib/router-texts.js` exported nine constants and shipped the tenth router without `AGENT_STACK`; derived now — `Object.keys` gives ten uppercase names including `AGENT_STACK`, and both consumers (`router_texts_test`, `migrate_test`) stay green | verified |
| B83-10 | Every lexicon key is a router that exists | fixtured against `registry.order()`, so a renamed router cannot leave orphaned territory behind | verified |
| B83-11 | The gate grew with the suite | `npm test` → `PASS: 34 checks green (validate.py + 5 python + 28 node suites)`, up from 33 | verified |

## 2026-08-17 (twenty-seventh) — v0.88.0, every open issue in the family

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| I-01 | The family had nine open issues and one pull request | surveyed with `gh issue list` / `gh pr list` across all ten repositories: super-ux 2, task-pipeline 4, agent-sync 2, make-skill 1, seo-aeo-audit 1 PR; the other five clean | verified |
| I-02 | All ten are closed, and none was closed blind | each read in full before acting; four fixed by doctrine, four by code, one by measurement showing it was already fixed, one merged | verified |
| I-03 | Four were one class | `task-pipeline` #39/#40/#48/#49 all describe a signal reporting success while checking nothing; they landed as two rows in `gates.md`'s false-success table, two new rules, and one section in `documentation.md` | verified |
| I-04 | `agent-sync` #1 needed no code | filed against 1.3.5, fixed by B-42 on 2026-08-14. Re-run on the issue's exact board shape (`depends` column, `T-02` and `T-03` citing `T-01`): the claim lands in `T-01`'s row alone, the other two untouched | verified |
| I-05 | The pull request was checked before it was merged | neither `docs/audit/2026-08-14-prowl-orank-validation.md` nor `B-16..B-23` exist on `main`; `main`'s highest id is `B-15`; `git merge-tree` against `main` → **0** conflict markers. Retargeted from the merged `feat/track-k-hardening` to `main`, then squashed | verified |
| I-06 | `make-skill`'s doctrine went where the budget allowed | `SKILL.md` measured **4738 of a 4750** working limit, so every inline draft failed the gate; `authoring.md` is linked from `SKILL.md` twice, so the rule is reachable without a body it does not have | verified |
| I-07 | `super-ux`'s new codes do not fire on correct prose | a wider path pattern flagged three correct entries and was narrowed to require a slash **and** an extension; the linter runs clean on this family's own UX chain | verified |
| I-08 | `agent-sync` reaps only what is expired | fixtures 6 → 9, driving the shipped script as a process: an expired foreign lease is reaped and names its owner, a live one is still refused, an unparseable timestamp is expired rather than eternal | verified |
| I-09 | Five pins move together and all five are published | `npm view` for each of `super-ux` 0.44.0, `task-pipeline-skill` 1.71.0, `@ssheleg/agent-sync` 1.13.0, `@ssheleg/make-skill` 0.21.0, `sheleg-design-skill` 1.41.0 before this pointer commit | verified |
| I-10 | Every submodule is on `main` at its release tag | `git tag --points-at HEAD` returns the matching `vX.Y.Z` for all five and `rev-parse --abbrev-ref HEAD` returns `main` — no detached HEAD this time, which `B-103` exists because of | verified |

## 2026-08-17 (twenty-sixth) — v0.87.1, the check caused the state it detects

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B88-1 | The new exit code turned the next release red | `gh run view` on the v0.87.0 tag run: the only failing step is *"Pins match published releases"*; `validate` and `release` both `failure`, `npm view sshlg-skills version` → `0.86.0` | verified |
| B88-2 | The cause is a contract that lived in one file | `validate.yml`'s step ends `exit "$code"` and named 1 and 2 only; `check_pins.py` documented four codes. An unnamed code therefore failed the run | verified |
| B88-3 | The condition is unavoidable during a release | the tag exists before `publish` runs, so exit 3 is true of every release at the moment CI reads it — a gate on it produces the unshipped tag it exists to report | verified |
| B88-4 | The fix is a warning, not a weaker default | exit 3 gets a `::warning::` and a run-summary block; the trailing `exit "$code"` is kept so an unrecognised verdict still fails, with a comment naming the two-file change | verified |
| B88-5 | Both halves of the contract now state it | the workflow comment names `check_pins.py`, and the script's docstring names `validate.yml` and why its default is right | verified |
| B88-6 | The burned tag is not rewritten | v0.87.0 stays in place and v0.87.1 succeeds it, which is the decision this repository made at v0.82.1 | verified |
| B88-7 | The gate is green on the fix | `npm test` exit 0; `check_pins.py --self-test` → 13 cases, 3 distinct verdicts, exit 0 | verified |

## 2026-08-17 (twenty-fifth) — v0.87.0, a guard downstream of the failure

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B79-3 | The assertion existed and the row did not know | `release.yml` carries *"The registry must actually serve it"* — polls `npm view` for three minutes, exits 1 — inside `publish`, gated `needs: release` → `needs: validate` | verified |
| B79-4 | Which is why v0.82.0 was silent | that run's `validate` failed, `publish` reported `skipped`, and the assertion never executed; the tag sat unshipped for a day | verified |
| B79-5 | The third question is answered outside CI | `test/check_pins.py` gains exit **3** for *this repository's newest tag is not on the registry*, reusing `classify()` rather than a second notion of published | verified |
| B79-6 | Watched working in BOTH states, minutes apart | during v0.86.0's publish: `TAGGED BUT NOT SHIPPED: sshlg-skills v0.86.0 … registry serves 0.85.1`, exit 3. After it landed: `ok sshlg-skills 0.86.0 (newest tag, on the registry)`, exit 0 | verified |
| B79-7 | Exit 3 does not block, and the reason is stated in the output | a release in flight and a release that failed are indistinguishable from here; the message says so instead of the script guessing | verified |
| B79-8 | The first draft passed by failing to run | `repository` is `github:ssheleg/sshlg-skills`; a `github\.com`-anchored regex resolved nothing and the check printed `skip` and passed. Now a loud `FAIL`, with `repo_slug()` covering all five spellings | verified |
| B79-9 | The resolver is fixtured, not trusted | eight cases in `--self-test`: npm shorthand, https+.git, git+https, scp-like ssh, bare slug, empty, non-repo text, host with no path | verified |
| B79-10 | The self-test counts rather than restates | the summary said *5 cases* with thirteen running; it now prints `13 cases (5 classify, 8 slug)` computed from the lists | verified |
| B79-11 | Both documentation homes moved with the code | `docs/DOCMAP.md`'s exit-code paragraph and `README.md`'s network-checks note both name exit 3 and why it is non-blocking | verified |

## 2026-08-17 (twenty-fourth) — v0.86.0, the reference sweep becomes askable

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B85-1 | The gap was 13 of 15, and the two hits were accidents | before: only `подбери палитру под референс` → `sheleg-design` (via `палитра`) and `найди примеры пейволлов` → `super-ux` (via `пейволл`); every other reference or style prompt → `[]` | verified |
| B85-2 | The capability was precise, not merely present | `DESIGN_SYNC_BRIDGE.md` §4 separates Lazyweb, Mobbin and Refero by what each returns; `sheleg-design/SKILL.md` §*Optional — real-world references* and *How to Apply* step 1; `ux-flows` *"Real flows off the shelf"* with `funnel-research.md` FR-01 | verified |
| B85-3 | The split is the pack's own sentence | §4: *"A reference sweep answers what a good version of this screen contains … It never answers what it looks like."* `reference screens`/`референсы` → `ux-flows`; `visual reference`/`визуальные референсы` → `sheleg-design` | verified |
| B85-4 | Both routers rise on a prompt naming both halves | `нужны визуальные референсы` → `["super-ux","sheleg-design"]` | verified |
| B85-5 | One trigger cost nothing at all | `style pack` was already a substring of *"Product UI through its style packs"*; `какой style pack взять` → `["sheleg-design"]` with no description change for it | verified |
| B85-6 | The natural phrasing was refused on measurement | ten control sentences per candidate: `стиль` → «стиль кода», «стиль коммитов»; `подбери стиль` → the same; `pick a style` → *pick a style guide for python*; `вдохновение` → «вдохновение закончилось». All four unrouted, and the three controls are now permanent probe cases asserting silence | verified |
| B85-7 | A clean candidate was still refused, on budget | `мудборд`/`moodboard` fired on no control sentence and was not added: `ux-flows` had 30 free and `sheleg-design` 15, against ~26 needed. `B-66`, third time today | verified |
| B85-8 | Coverage moved and the corpus grew | `node test/route_coverage.js` → `64 named an expected route · 15 reached nothing · 0 spoke where silence was right · 79 prompts`, from 56/15 of 71 | verified |
| B85-9 | Two fixtures caught two of my own mistakes by name | `triggers_test.js` → *"hero not in sheleg-design's description"* after a compression removed the word; `sheleg-design`'s gate → *".cursor/skills/sheleg-design/SKILL.md: drifted"*, twice | verified |
| B85-10 | Children before parent, and a detached HEAD fixed on the way | `super-ux` 0.43.0 and `sheleg-design-skill` 1.40.0 both read back from `npm view` before this pointer commit. `sheleg-design` was on a detached HEAD (`B-103` in that repo) and its push was refused by a concurrent commit; the release was replayed onto `origin/main` rather than forced | verified |
| B86-1 | Three connected surfaces are named by no pack | grepping every shipped skill: `pencil`, `google_lens`/`google_images`, `higsfield` → zero hits, while `refero`, `mobbin`, `lazyweb`, `figma`, `chrome-devtools` and `prowl` all resolve to at least one member | verified |
| B87-1 | A method describes a manual click where two tools are connected | `funnel-research.md` FR-01: *"open a competitor's ad, click through, and you are in it at step one"*, naming no tool; `seo-aeo-audit` already names `chrome-devtools` for its own crawling | verified |

## 2026-08-17 (twenty-third) — v0.85.1, one of three fixed and two refused

| REQ | What shipped | How it was confirmed | Status |
|---|---|---|---|
| B84-1 | A hyphen inside a trigger was load-bearing | before: `подключи mcp сервер` → `[]` while `agent-interop` advertises `MCP-сервер` and the route carries it; after: `["agent-stack"]`, and `подключи mcp-сервер` too | verified |
| B84-2 | Both directions of the seam, and the refusals through it | `нужен суб агент` and `нужен суб-агент` → `["agent-stack"]`; `optedOut('без make-skill')` and `optedOut('без make skill')` both `true`; `сделай скилл, без make-skill` → `[]` | verified |
| B84-3 | The split loosened nothing | the `аудит`/`аудитория` precision controls re-run against it: `аудитория лендинга выросла`, `субагентство недвижимости`, `mcpserverless` → `[]` | verified |
| B84-4 | Coverage moved by exactly the one prompt | `node test/route_coverage.js` → `56 named an expected route · 15 reached nothing`, from 55/16 | verified |
| B84-5 | Prefixed verb forms were prototyped and refused on the numbers | a closed ten-prefix allowance run out of tree over 7 realistic prefixed imperatives and 10 noise cases: **1 new win, 0 regressions**. The six non-wins (`перенеси миграцию`, `доработай интеграцию`, `подкрути палитру`, `наладь воронку`, `заверши фичу`, `развей анимацию`) already routed | verified |
| B84-6 | A predicted regression did not survive its own measurement | the refusal was drafted around `расцвет` matching `цвета`; run, it does not — `рас` is not in the prefix list. The refusal stands on the win/cost ratio instead, which is the honest reason | verified |
| B84-7 | The с/ш case is one word, and its cheap fix is elsewhere | `stemRu('записать')` → `записа`, which cannot reach `запиш-`; no other advertised trigger in the family has the alternation. `evidence-docs`' description has 124 characters free, so advertising the imperative is the cheap fix and it belongs to `task-pipeline` | verified |
| B84-8 | What remains is named with its blocker | seven absent triggers, against descriptions measured the same day at `task-pipeline` 964, `stripe-billing` 967, `make-skill` 965, `seo-aeo-audit` 959, `sheleg-design` 948 / 970 | verified |
| B84-9 | The gate holds | `test/triggers_test.js` 27 → **30 checks**; `npm test` exit 0 | verified |
| SEO-1 | The author entity reaches every indexable template | live fetch of 5 templates at `289cc0c`: `described=1 refs>=1` on `/`, `/agents/`, `/routing/`, `/skills/telegram-dev/`, `/skills/sheleg-design/`; all reference `https://skills.sshlg.me/#person` | verified |
| SEO-2 | Exactly one node describes the person; the rest are `@id` alone | `test/site_test.js` +2 checks, 30 → 32; six plants watched failing — re-describe, drop the `@id`, wrong id, missing link, second opt-out, indexable 404 | verified |
| SEO-3 | `/agents/` read budget | `page_audit.py`: 54.5% → **78.4%** content in the first ~5700 chars; `high` severity gone | verified |
| SEO-4 | Five visible Q&A pairs, markup built from the array the page renders | `AGENT_FAQ` is the single source for both the DOM and the `FAQPage` node; live `/agents/` carries `FAQPage` with 5 questions | verified |
| SEO-5 | The 404 body is not indexable | measured after deploy: `GET /404.html` → **200** at its own address, `GET /no-such-page/` → 404, 0 references in `sitemap.xml`; `<meta name="robots" content="noindex">` now served | verified |
| SEO-6 | `/` at 47.9% was recorded, not silently accepted or silently fixed | `docs/seo/plan-2026-08-26.md` G1/G2, with both options and the trade-off named; it is the plan's single recommended next action | verified |
| SEO-7 | Three probe defects were not recorded as site findings | `docs/seo/audit-2026-08-26.md` addendum 2 table — pattern spacing, `@type` walker, and the one row that WAS the site | verified |

## 2026-08-29 — v1.9.0, the refusals the block advertised and the hook never parsed

| REQ | What shipped | How it was confirmed | Observed at | Invalidated by | Status |
|---|---|---|---|---|---|
| XF1-1 | The advertised refusal was measured unusable before it was renamed | «оплата подпиской, но без интеграций» → `["task-pipeline","sheleg-dev"]`, `optedOut` false; `matches('без интеграций', 'интеграция')` → true — the stemmer fires the trigger inside the phrase, so adding it would summon the route it declines | `305d58e` | the stemmer changing so the pair stops colliding — the fixture that asserts the collision true fails then, saying re-derive the rename | verified |
| XF1-2 | The renamed refusal opts out in both languages | «оплата подпиской, но без обвязки» → `[]`, `optedOut` true; `'stripe checkout, but no wiring'` → `[]` — both fixtures in `test/triggers_test.js` | v1.9.0 | rewording the registry's refusal line without updating `REFUSALS` — the block-vs-list fixture (XF4-2) fails in the same change | verified |
| XF1-3 | The class is guarded at the level the defect lived on | a match-level clash check runs beside the raw-containment one: every refusal held against every trigger with `T.matches`, and the `интеграция` pair asserted true as its executable record | v1.9.0 | removing the fixture, or a matcher change that mutes `T.matches` — the pair assertion fails first | verified |
| XF4-1 | The missing aliases were measured missing, then added | before: `optedOut('no brand')` → false, `'rewrite this, no brand'` → `["task-pipeline","copywriting"]`; after: `[]`, `optedOut` true. Twelve English forms, «без телеграма»/"no telegram", and "no tooling"/«без инструментов» all in `REFUSALS` | `305d58e` → v1.9.0 | a router rewording an alias — the block-vs-list fixture names the phrase | verified |
| XF4-2 | The list is held to the block mechanically | a fixture parses the `Refusal phrase:` bold span of all twelve registry texts plus the rendered protocol region (26+ phrases, both quote styles) and fails on any phrase `REFUSALS` does not hold; watched failing twice on its own scaffolding before passing — the checker was wrong both times, the subject clean | v1.9.0 | a refusal declared outside the bold-span format the parse reads — the `phrases.length >= 2` and `declared >= 24` floors fail then | verified |
| XF4-3 | The new refusals silenced nothing that was routing correctly | `node test/route_coverage.js` → 0 spoke where silence was right, before and after; the 20-prompt inflection corpus still ≥ 18 | v1.9.0 | a new refusal phrase colliding with living vocabulary — the probe's silence column moves off 0 | verified |
| XF2-1 | `error-tracking` was unroutable and now routes | before: `add Sentry` → `[]`, «подключить Sentry в проде» → `[]`; after: `'add sentry to the api service'` → includes `sheleg-dev`, and «настрой трекинг ошибок», `'set up error tracking for the worker'` too | `305d58e` → v1.9.0 | `error-tracking` leaving the pack — the source names no shipped skill and `triggers_test.js` fails | verified |
| XF2-2 | Zero description edits, the B-81 shape of cheap | all four triggers are literal substrings of `error-tracking`'s shipped description (`skills/sheleg-dev/plugins/sheleg-dev/skills/error-tracking/SKILL.md`), asserted by the advertisement fixture that reads it | v1.9.0 | the member rewording its description — the advertisement fixture names the trigger it dropped | verified |
| XF2-3 | The WHEN cell, the router text and the README row moved together; the map role deliberately did not | registry `when` and text enumeration name errors/`error-tracking`; README routing-table row matches the registry cell. `skills.json`'s `role` is the member card's eyebrow, whose exact pixels are committed inside the `sheleg-dev` submodule (`test/site_test.js` byte-checks them) — updating it here would dirty a member this wave may not touch, so it rides the member's own release | v1.9.0 | the README row drifting from the registry cell — prose nothing checks, per the propagation matrix | verified |
| XF2-4 | Coverage moved by exactly the new territory | `node test/route_coverage.js` → `74 named an expected route · 14 reached nothing expected · 0 spoke where silence was right · 88 prompts`, from 71/14/0 of 85 — two new hits and one new correct silence, no case regressed | v1.9.0 | the probe corpus changing — it measures, the board decides what the number should be | verified |
| XF5-1 | The homograph was measured, removed, and kept as a silence case | before: «сделай форму логина на react» → `["agent-stack"]`; after: `[]`, and `'rewrite the dashboard in react'` → `["task-pipeline"]` alone — the pipeline half of that prompt is real and stays | `305d58e` → v1.9.0 | `agent-harness` advertising a phrase form (`react loop`, `react pattern`) — the replacement lands and this row's silence flips deliberately | verified |
| XF5-2 | The route's honest vocabulary still reaches it | `'выбери workflow or agent для этой задачи'` → includes `agent-stack`; the phrase-form replacement is blocked on `agent-harness`'s own description and recorded as agent-stack's release, not silently dropped | v1.9.0 | the same member release XF5-1 names | verified |
| UM4-1 | The README documents all twelve verbs | `humanizers` in the hooks-adjacent block and in *Other commands*; `signature --used` in *Other commands* with its argument shape; both absent at the base (`grep -c` → 0) | `305d58e` → v1.9.0 | a thirteenth verb arriving without its README row — the DOCMAP same-change rule, prose nothing checks | verified |
| UM4-2 | `humanizers` has CHANGELOG documentation as a command | the v1.9.0 section states what it prints and the caveat that prints unconditionally; v1.8.0's bullet had pointed at the commit message only | v1.9.0 | nothing — a shipped CHANGELOG section is a dated record | verified |
| UM5-1 | The comment now claims only what exists | `cmdHumanizers`' header no longer says the doctrine "ships in the block" — no router text mentions humanization, deliberately; it names `copywriting`'s Humanize mode and the always-printed caveat in `lib/humanizers.js` as the two real homes | v1.9.0 | a router text gaining a humanization clause — the comment under-claims then, which is the safe direction | verified |
| GATE-1 | The whole gate is green at the ratchet | `npm test` exit 0; suites/fixtures recounted by `test/run.js` against the DOCMAP marker updated in this change | v1.9.0 | the next commit that moves either count — the marker guard fails until restated | verified |

## 2026-08-30 — v1.10.0, nine pins in one pass and ReAct by its phrase

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| HG-1 | A flag that consumes its argument no longer hides the skills-CLI verb, and neither does a line continuation | `node test/hygiene_test.js` → `OK (26 checks)`; both fixtures **watched failing** against the pre-fix module with the messages *"the flag's value was read as the verb"* and *"the backslash was read as the verb"* | v1.11.3 | a skills-CLI verb this vocabulary does not list | verified |
| HG-2 | `obsidian-wiki --vault <path> setup` and the `-v` short form are recognised as setup — the guard for the command that truncates `~/.obsidian-wiki/config` | same suite; watched failing pre-fix with *"the vault path was read as the subcommand, so setup went unguarded"*; the `--vault=value` form is asserted too, having always worked, so a fix could not silently break it | v1.11.3 | a new obsidian-wiki subcommand needing the same treatment | verified |
| HG-3 | Widening the subcommand search did not start matching directory names | `isObsidianSetup('obsidian-wiki --vault /Users/x/setup doctor')` → false; the token is compared exactly and never through `bareName`, which strips a path to its last segment. **Green before the fix as well as after** — it is the boundary, not the subject | v1.11.3 | never | verified |
| HG-4 | The gate is green with the ratchet recomputed rather than carried | `npm test` → rc=0, `COUNTED: 45 suites, 768 fixtures, 9 pinned members`; `docs/DOCMAP.md`'s marker and prose both read 768, and the run **failed on 764 first** — the ratchet demonstrating itself | v1.11.3 | any fixture added or removed | verified |
| PP-3 | The agent-stack pin moves to 0.18.1 on all three surfaces | `git submodule status` → `skills/agent-stack (v0.18.1)`; `skills.json` and the README row both read 0.18.1; `npm test` → rc=0, `COUNTED: 45 suites, 768 fixtures, 9 pinned members` | v1.12.1 | any agent-stack release after 2026-08-31 | verified |
| PP-4 | This validator refused a member's malformed board row that the member's own gate passed | the first re-pin attempt failed with *"row B-124 has 12 cells against the 3 its own header declares"* while `agent-stack`'s `npm test` was green on the same tree; the member shipped 0.18.1 to repair it, and the pin advanced only after. **The refusal is the evidence** — a member's board is checked here, not there | v1.12.1 | never | verified |
| RE-1 | The umbrella has a routing eval: 13 probes, 3 arms generated from the registry, one agent per pair | `node test/routing_eval.js` → `13 probes x 3 arms = 39 dispatches`, arm sizes 14233 / 11878 / 10594 B; `test/evals/RESULTS.md` carries the 2026-08-31 run per probe | v1.13.0 | a router added without a probe | verified |
| RE-2 | The runner reproduces the text that was actually measured | `--arms` output diffed against the three blocks the probes ran on: **identical apart from one trailing blank line** in each — so the recorded baseline is reproducible from the shipped tree | v1.13.0 | any edit to the arm generation | verified |
| RE-3 | The artefact is guarded in the gate even though the run is not | `node test/routing_evals_test.js` → `OK (12 checks)`; three plants **watched failing**, each on its own branch — an extra probe (stated count), a doctored recall denominator, and one refusal phrase deleted (`arm current carries 11 refusal phrases for 12 routers`) | v1.13.0 | never | **watched failing** |
| RE-4 | A plant that changed nothing was diagnosed as the plant, not the guard | the first refusal plant rewrote `Refusal phrase:` to `Refusal phrasex:`, which still contains the substring the check counts; it was re-planted as a deletion and then refused. Recorded because a plant passing for the wrong reason is indistinguishable from a working guard | v1.13.0 | never | **observed** |
| RE-5 | The first run authorised the next experiment rather than the change | recall 11/11 in all three arms; total routes 21 / 23 / 24 with both extra hits on the two silence probes; the boundary hypothesis falsified by the `no-among` arm; 3 wider vs 1 tighter → two-sided sign test **p = 0.625** at one run per cell. **The trim was not shipped**, and `RESULTS.md` names the narrow rerun | v1.13.0 | the rerun it names | verified |
| RE-6 | The gate is green with the ratchet recomputed, not carried | `npm test` → rc=0, `COUNTED: 46 suites, 780 fixtures, 9 pinned members`; the run **failed on 45/768 first** | v1.13.0 | any suite or fixture added | verified |
| PP-2 | The make-skill pin moves to 0.25.3 on all three surfaces, and the mismatch between them is caught rather than assumed | `git submodule status` → `skills/make-skill (v0.25.3)`; `grep -A9 '"name": "make-skill"' skills.json` → `"version": "0.25.3"`; the README row reads 0.25.3; `npm test` → rc=0, `COUNTED: 45 suites, 764 fixtures, 9 pinned members`. **Watched failing first**: with skills.json at 0.25.3 and the pointer restored to 0.25.1 by `git submodule update --init`, the same gate went red on that pair — the pin invariant demonstrating itself inside the pass that needed it | v1.11.2 | any make-skill release after 2026-08-31 | verified |
| PP-1 | Nine submodules sit on their annotated release tags and the three pin surfaces agree | `git submodule status` shows each at its tag commit; `git -C skills/<m> describe --tags` → v0.25.1 / v0.1.9 / v0.17.0 / v0.25.7 / v0.11.0 / v0.50.0 / v1.58.1 / v1.18.6 / v1.79.1; `npm test`'s pin check reads the version out of each pinned `package.json` against `skills.json` and the README row | v1.10.0 | any member release after 2026-08-30 — the pin lags until the next pass | verified |
| PP-2 | The sheleg-dev role cell equals the string its committed card encodes | `skills.json` role = `integrations: money in, tracking, errors, sign-in, speed`; `test/site_test.js` renders `og.card({eyebrow: role, …})` and byte-compares `skills/sheleg-dev/docs/assets/social-preview.png` — green in this run's gate | v1.10.0 | the member regenerating its card with different words | verified |
| PP-3 | `react loop` and `react pattern` route to agent-stack; the bare homograph stays silent | `test/triggers_test.js`: both phrase prompts → `['agent-stack']`, «сделай форму логина на react» → `[]`, `rewrite the dashboard in react` → `['task-pipeline']` — all four asserted, suite exit 0 | v1.10.0 | agent-stack renaming the advertised phrase forms | verified |
| PP-4 | task-pipeline's pin moved only after its tag landed | the pin was held at 1.78.4 while v1.79.1 was mid-release and moved in this same pass only once `npm view task-pipeline-skill version` returned 1.79.1 and the annotated tag sat on origin/main (ancestry checked) — landed evidence, never inference | v1.10.0 | any later task-pipeline release — the pin lags until the next pass | verified |

## 2026-08-30 — v1.9.1, the retro readable in full and the last write outside the gate

| REQ | What shipped | How it was confirmed | Observed at | Invalidated by | Status |
|---|---|---|---|---|---|
| UM1-1 | The stage-0 contract is completable again | `docs/evidence/retro.md` 155,084 → 35,749 bytes (`wc -c`, both measured; 34,465 at the cut, the rest is this release's own run stamp); the in-force head — standing instructions, Retired, Run stamps — is byte-identical through its final prune paragraph, and an end marker states where the records went | v1.9.1 | the in-force file growing past what one read returns — the next rotation appends to the same archive | verified |
| UM1-2 | The move is byte-exact, and the proof travels with it | SHA-256 of the 121,420-byte block (30 dated `##` headings, 2026-08-06 → 2026-08-17) computed before the cut and re-computed from `docs/evidence/retro/2026-Q3.md` after the append: `5bc1106a3905468c340aae101a07c6748b2fdc5a8bb0588e19c03edef1a4d848`, equal both times; no id changed, no sentence reworded | v1.9.1 | any edit inside the archive's rotated block — re-hashing stops matching, and the block's own header says it stays frozen | verified |
| UM1-3 | The archive's dead citations stay disclosed | `docs/evidence/retro/2026-Q3.md` added to `LEDGER_DOCS` in `test/validate.py`; the counted disclosure now prints `docs/evidence/retro/2026-Q3.md 2/23` beside `docs/evidence/retro.md 0/5` — the 2 dead citations the audit counted moved with the records and are still counted | v1.9.1 | dropping the archive from `LEDGER_DOCS` — the disclosure line stops naming it, which is the silence the corpus split exists to prevent | verified |
| UM1-4 | Every mechanical reader of `retro.md` still reads what it read | `check_standing_instruction_ids_are_stable`, `check_every_stamped_commit_resolves` (all 45 stamp-table SHAs live in the kept head) and `test/board_age.py`'s stamp-days all pass over the shortened file; `npm test` exit 0 | v1.9.1 | a reader that consumed the dated records from `retro.md` — none was found by grep over `test/ lib/ hooks/ bin/ scripts/`, and one appearing fails its own suite | verified |
| UM6-1 | The second write path is gone | `hooks/post-tool-use.js` wrote `~/.obsidian-wiki/config` bare (`fs.writeFileSync`, old line 99); the restore now calls `protect()` from `lib/apply.js` before the write, after `latest()` already holds the pre-run snapshot; e2e fixture asserts the pre-write copy in `~/.sshlg-skills/backups` carries exactly the truncated bytes the restore overwrites | v1.9.1 | a new bare write to an operator-owned file — the CLAUDE.md invariant now enumerates the wiki config, and the regression to watch for is stated there | verified |
| UM6-2 | A copy that cannot be taken cancels the restore, and the refusal names its remedy | e2e fixture chmods the backup dir `0555`: `latest()` still finds the full snapshot, the copy fails, the config keeps `setup`'s bytes untouched, and the note says the restore was NOT performed, names the snapshot path and `~/.sshlg-skills/backups` | v1.9.1 | the note losing its remedy — the fixture matches on both | verified |
| UM6-3 | Both fixtures were watched failing | against the stashed pre-fix hook: `2 failure(s) out of 35 checks` (`git stash push hooks/post-tool-use.js` → run → pop); green after. The first red was the checker, not the subject: the e2e HOME sat behind macOS's `/var → /private/var` symlink so the fixture computed a different backup key than the hook's `realpathSync` — standing instruction #11, applied before believing either red | v1.9.1 | — | verified |
| UM7-1 | B-07's waiver measurement matches the launcher again | stated *8 commands (2026-08-16)*; counted 12 in `bin/sshlg-skills.js`'s dispatch (`main()`), the 4 new ones each named by their own suite (`conflicts_test.js`, `toolkit_test.js`, `signature_test.js`, `humanizers_test.js`); row re-stamped 2026-08-30 with both measurements kept | v1.9.1 | a thirteenth verb — the revisit clause in the row, unchanged | verified |
| GATE-1 | The whole gate is green at the re-derived ratchet | `npm test` exit 0: `COUNTED: 45 suites, 760 fixtures, 9 pinned members`; DOCMAP marker moved 758 → 760 by the measured count, and the prose beside it stopped hand-carrying 751 | v1.9.1 | the next commit that moves either count — the marker guard fails until restated | verified |

## 2026-08-31 — v1.11.0, the card metric counts what it paints

| id | Claim | Evidence | Shipped in | Invalidated by | Observed at |
|---|---|---|---|---|---|
| B117-1 | The tracked fit measures the width `drawText` paints | `fitScale(text, max, hi, min, tracking)` fits `textWidth + (n-1)*tracking`; the B-105 case asserted numerically in `test/og_card_test.js` — pre-fix, the fixture prints `scale 3 paints 1115px in 1032px`, watched failing with the fix stashed (`2 of 14 failed`), green with it restored | v1.11.0 | — | verified |
| B117-2 | The corrected metric changed no shipped byte | the site built twice, from the pre-fix tree (`git stash`) and the post-fix tree, `diff -rq` over the two output dirs: every file identical, `og/*.png` included — so every committed card in every member repository still byte-matches `test/site_test.js`'s comparison, which `npm test` re-proves | v1.11.0 | any member card regenerating (B-118) — the diff was of THIS tree's texts | verified |
| B117-3 | The B-105 eyebrow stays inside its box under the tracked fit, and the gated legacy fit still shows the defect | pixel-band fixture in `test/og_card_test.js`: the sheleg-dev eyebrow rendered both ways, scanning rows 185–220 for non-background ink between the padding box's right edge and the frame — legacy `> 0`, tracked `= 0`; both asserted | v1.11.0 | the eyebrow moving off y=188 or the frame widening — the scan bounds are the card's layout constants | verified |
| B117-4 | Every LEGACY_FIT entry is needed, and the gate cannot rot silently | `test/site_test.js` re-renders each gated member's card from `site.memberCardSpec` under both metrics and fails if they are byte-identical (stale entry) or if a gated name is not a member; watched refusing a planted `make-skill` entry (`1 of 42 failed`), green after the revert | v1.11.0 | the set emptying as B-118 closes — the loop then passes trivially, which is the wanted end state | verified |
| B119-1 | The seo-llmo/seo-aeo-audit alias is stated where both names meet | `lib/routers-registry.js` SEO_LLMO text carries *"One rule, two names"* naming the rule, the skill and the member; `node test/router_texts_test.js` → `OK (80 checks)`; the routing page renders it (`test/site_test.js` member/routing-page fixtures green) | v1.11.0 | renaming the registry key — refused in B-119's close, with the four surfaces a rename would orphan | verified |
| B120-1 | The sheleg-dev rule and its WHEN cell agree on scope | the opening sentence reads *"the integration layer under the product"*; `grep -rn 'paid product' lib test docs bin hooks scripts` → 0 hits; WHEN cell unchanged | v1.11.0 | — | verified |
| B121-1 | The double-fire comment claims only what project-audit's own text claims | the comment names read-only findings → proposed board rows → pipeline delivery; behaviour unchanged: `match('сделай аудит проекта')` → `["task-pipeline","project-audit"]` before and after, `node test/triggers_test.js` → `OK (38 checks)` | v1.11.0 | project-audit ceasing to be read-only — its registry text is the source the comment now cites | verified |
| GATE-1 | The whole gate is green at the re-derived ratchet | `npm test` exit 0: `COUNTED: 45 suites, 764 fixtures, 9 pinned members`; DOCMAP marker moved 761 → 764 by the measured count, and the prose beside it (stale at 760) restated to the counted pair | v1.11.0 | the next commit that moves either count — the marker guard fails until restated | verified |
