# Changelog

## v0.15.0 — 2026-07-30

Audited all six plugins against the [Claude Code plugin
reference](https://code.claude.com/docs/en/plugins-reference) using
`claude plugin validate --strict`, the upstream schema checker, rather than by
reading the spec. Two defects, both invisible to every house validator in the
family, and one of them live in a published plugin.

### Fixed
- **`/ux-audit` was loading with no metadata at all** (`super-ux` 0.26.4). Its
  `argument-hint` was an unquoted `[all | feature:<name> | ...] [quick|deep]` —
  in YAML a bare `[...]` is a flow sequence, and this one failed to parse
  outright. A command whose front matter fails to parse loads with **every field
  silently dropped, description included**, and nothing at runtime says so. Nine
  command files across the family were unquoted; six were parsing as *lists*
  instead of strings, one (`seo-aeo-audit`) split on an internal comma.
- **`homepage` and `repository` sat at the top level of all six
  `marketplace.json` files, where Claude Code does not recognize them.** They are
  plugin-entry fields; moved there, so the values reach the plugin listing
  instead of being discarded at load time. Unrecognized fields are warnings the
  runtime tolerates — which is precisely why they survived everything except
  `--strict`.

### Added
- **The upstream validator now runs in every member's CI**, against both the
  plugin and the marketplace manifest. It needs no auth and no API key, so a
  runner installs `@anthropic-ai/claude-code` and runs it next to the repo's own
  validator. House rules and upstream schema are different checks; only one of
  them was being made.
- `make-skill` 0.6.5 carries both failures as canon, so the next skill is not
  born with either.

### Changed
- Pins: `super-ux` 0.26.4, `task-pipeline` 1.4.3, `make-skill` 0.6.5,
  `sheleg-design` 1.3.3, `seo-aeo-audit` 0.9.2, `agent-sync` 1.4.1.

## v0.14.1 — 2026-07-30

### Added
- **Releases publish themselves.** Every repo in the family — the six members
  and this hub — now carries a `release.yml` whose second job runs `npm publish
  --provenance` on a `v*` tag. `seo-aeo-audit` and `agent-sync` had no release
  workflow at all and now have the full one. Armed per repository by
  **`PUBLISH_NPMJS`**, alongside the existing `RELEASE_ENABLED`, so a fork of
  any of these inherits an inert workflow.

  Auth is written for both routes: `NODE_AUTH_TOKEN` from an `NPM_TOKEN` secret
  (a *granular automation* token — a classic one is still refused by 2FA), and
  `id-token: write` granted unconditionally so npm **trusted publishing** works
  once a package names this workflow as its trusted publisher. Adopting OIDC
  later is deleting a secret, not editing CI. That permission also signs
  provenance.

  Three properties, each of which is a red build if missing:
  - a version already on the registry is **skipped** — publishing over one is a
    hard 403, which would turn every re-run red;
  - a `workflow_dispatch` **`tag` input**, because a dispatch runs the workflow
    file *as of the ref it is dispatched on*: a tag pushed before the publish job
    existed can never grow one, and this is what lets the current workflow
    release an old tag;
  - `npm view` is **polled** after publishing — the read replica lags the write
    master, so published is a claim until the registry serves it.
- The GitHub-release step is now **idempotent** (create, or refresh the notes),
  so the whole workflow can be re-run instead of aborting on a release that
  already exists.

### Changed
- Pin **`make-skill` 0.6.4** — arming CI publishing is now step 9 of its
  first-publish checklist, and *the next tag publishes without a human* is a
  definition-of-done fact. Its distribution reference carries both auth routes.
- Pin **`agent-sync` 1.4.0** — branch discipline and a merge log.

## v0.14.0 — 2026-07-30

A sweep across all seven repositories over three things a user relies on and
nobody had checked end to end: that the installers work, that the licence is
visible, and that the links resolve.

### Fixed
- **`task-pipeline`'s `pipeline.schema.json` identified itself with a URL that
  404s** — and that file is installed into `~/.claude/skills/`, so every install
  carried a schema whose own `$id` could not be fetched. Fixed in 1.4.2.

### Changed
- **The licence is declared where it can be seen.** All six member repos ship a
  `LICENSE`, and not one declared it in either manifest a user actually reads:
  the `marketplace.json` plugin entry (a documented SPDX field) or the SKILL.md
  front matter. Both are optional in their specs, which is exactly why it stayed
  open — nothing errors on an absent licence. Now declared in both, everywhere.
- **`make-skill` 0.6.3 makes it part of the spec floor**, so the next skill is
  not born with the same gap.
- Pins: `super-ux` 0.26.3, `task-pipeline` 1.4.2, `make-skill` 0.6.3,
  `sheleg-design` 1.3.2, `seo-aeo-audit` 0.9.1, `agent-sync` 1.3.9.

### Verified, not assumed
- **Installers** — every package was built with `npm pack` and run from the
  tarball in a clean `HOME` from a non-repo directory. All install what they
  claim. `super-ux`'s tarball carries no `SKILL.md` **by design**: it delegates
  skill installation to the skills CLI and ships only templates and the linter.
  Both installers that accept `--agent a,b` were checked to split the list into
  repeated `--agent` flags — a comma-joined value reaches the skills CLI as one
  invalid agent.
- **Links** — all 108 external URLs across the family were requested. Everything
  outside the schema `$id` resolves; the rest of the non-200s are placeholders
  (`example.com`), API base paths, bot-blocked npm pages and `<file>` templates.
  Every relative markdown link resolves on disk.

## v0.13.1 — 2026-07-30

### Fixed
- **v0.13.0 justified the URL rewrite with a claim that does not hold**:
  `raw.githubusercontent.com` was said not to follow a repository transfer. It
  does — the old owner's raw path returns 200 with the current file. Corrected
  in place below, and the rewrite still stands on the reason that survives
  measurement: the old path works only while nobody re-registers the name.

### Changed
- Pin **`agent-sync` 1.3.7** — the same correction in that repo's notes.

## v0.13.0 — 2026-07-30

`agent-sync` moved to **`ssheleg/agent-sync`**. The whole family now lives under
one owner, which changes what this repo says about its own trust boundary.

### Changed
- **Submodule URL and manifest** — `.gitmodules` and `skills.json` (`repo`,
  `pluginMarketplace`) point at the new owner. GitHub keeps serving the old path
  on every surface, so this breaks nothing today; it stops depending on the
  `appvillis-com` name never being re-registered.
- **`SECURITY.md`** — the trust boundary is no longer split: six repos, one
  organization.
- README family table and `CONTRIBUTING.md` link to the new location.
- Pin **`agent-sync` 1.3.6** — every install path, identity field and raw URL
  inside that repo now names `ssheleg`.
- Pin **`task-pipeline` 1.4.1** — the three places it links to `agent-sync`.

### Fixed
- **The README family table advertised versions the manifest had moved past** —
  every row was behind (`super-ux` 0.26.1 vs 0.26.2, `task-pipeline` 1.3.2 vs
  1.4.1, `seo-aeo-audit` 0.8.0 vs 0.9.0, and so on), and `agent-sync`'s link had
  been stale since the move. It is the first thing a visitor reads.
- **Nothing was checking that table.** The validator now requires each skill's
  row to carry the repo URL and the version `skills.json` declares — the two
  ways it has actually drifted — with a CI negative self-test proving the check
  can fail.

## v0.12.2 — 2026-07-30

### Fixed
- The parent now points at `seo-aeo-audit` **v0.9.0**. v0.12.1 moved the pin in
  `skills.json` but left the submodule on v0.8.1 — the validator caught it, and
  the tag was left in place rather than rewritten, so this is the released
  version of that pin.

## v0.12.1 — 2026-07-30

### Changed
- Pin **`seo-aeo-audit` 0.9.0** — tracking parameters get their own mechanism,
  separate from facets and filters: canonicals already consolidate UTM variants,
  a `robots.txt` block cannot improve consolidation and cannot touch the one case
  where a parameterized URL out-signals its canonical, and the fix sits at the
  source (own internal and partner links) rather than in `robots.txt`. Ships with
  play L13, a thirtieth refuted myth, and the rung-2 crawl-waste fallback for
  hosted platforms that expose no server logs.

## v0.12.0 — 2026-07-30

Family-wide release sweep. Every member had work sitting on `main` that no
release carried: two had a bumped version with no tag, four had shipped files
(README, `SKILL.md`, references) changed under a version already on the
registry. A doc that only exists on `main` reaches nobody — the registry copy
is what `npx` installs and what the package page shows.

### Changed
- Pin **`task-pipeline` 1.4.0** — `references/learned.md`, fourteen rules
  earned by failure, wired into stages 5, 6, 9 and 10. Was tagged nowhere.
- Pin **`agent-sync` 1.3.5** — the two rules the plugin enforces (identity
  before coordination; a submodule's work is unfinished until its parent points
  at it), stated with the incidents behind them.
- Pin **`make-skill` 0.6.2** — first-publish step 10: a family member is not
  released until the umbrella pin moves. The rule this release exists to
  satisfy.
- Pin **`super-ux` 0.26.2**, **`sheleg-design` 1.3.1**, **`seo-aeo-audit`
  0.8.1** — the family install block (`install` / `update` / `list` + the
  restart note) and `agent-sync` in the member list now reach the registry.
- Hub README carries the same family commands and the six-member list.

## v0.11.1 — 2026-07-29

### Changed
- Pin `agent-sync` 1.3.4. The release fixes `release` reporting success for a
  lease held by another run while blanking that task's board claim — the board
  advertised work as free that was still leased, which is exactly the collision
  the skill exists to prevent.

## v0.11.0 — 2026-07-29

Consolidation pass: the hub had drifted behind the skills it advertises.

### Changed
- **Every pin refreshed** — super-ux 0.26.1, task-pipeline 1.3.2, agent-sync
  1.3.3, make-skill 0.6.1, sheleg-design 1.3.0, seo-aeo-audit 0.8.0. The hub was
  advertising versions up to five minors old, so a fresh `install` from a hub
  checkout got skills the table did not describe.
- **Descriptions rewritten against what each skill does today**, not what it did
  when it was added: super-ux carries Figma frames in its screens map,
  sheleg-design crosses the Figma border (tokens as variables, design to code),
  seo-aeo-audit ends in a link-building brief as well as a change plan, and
  agent-sync is described as a coordination *plane* rather than a lease store.
- `agent-sync` is now pinned to a release tag rather than a bare commit — it
  publishes tags as of 1.2.3, so the caveat recorded in `SECURITY.md` when it
  joined no longer applies.

## v0.10.0 — 2026-07-29

### Added
- **`agent-sync` joins the family** ([appvillis-com/agent-sync](https://github.com/appvillis-com/agent-sync),
  npm `@ssheleg/agent-sync`, pinned at **1.2.2**). Coordination for concurrent
  coding agents: leases with a TTL so two agents cannot claim the same work,
  race-free id reservation, a run journal and a generated board, over a
  pluggable knowledge cloud. It pairs with `task-pipeline`, which takes its
  leases from it.
- The family is now **six** skills, and the first one that does not live under
  the `ssheleg` organization — the launcher and validator were already
  org-agnostic (they use `repo` and `pluginMarketplace` verbatim), so nothing in
  the install path changed. `CONTRIBUTING.md` now says so explicitly: a new
  member has to ship the marketplace layout, not a particular owner.

### Changed
- Every place that enumerated the family — README, `package.json`, the launcher
  header, `SECURITY.md`, the issue forms — lists six.
- `SECURITY.md` names the split trust boundary (five repos under `ssheleg`, one
  under `appvillis-com`) and records that `agent-sync` publishes no git tags yet,
  so its pin is a bare commit rather than a release tag.

## v0.9.1 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.18.1 — the last repo to get its open-source surface, so
  all five now ship a security policy, a code of conduct, issue forms and a PR
  template.

## v0.9.0 — 2026-07-28

### Changed
- Pins refreshed after the family-wide open-source hygiene pass — every repo now
  carries a security policy, a code of conduct, issue forms and a PR template
  (super-ux 0.23.2, make-skill 0.6.1, sheleg-design 1.0.1, seo-aeo-audit 0.6.1).

## v0.8.1 — 2026-07-28

### Changed
- Pin `seo-aeo-audit` 0.6.0 — its release-readiness pass plus the US-spelling
  sweep that renamed the auditor's `analyse()` to `analyze()`.

## v0.8.0 — 2026-07-28

Production pass on the hub as a public repository.

### Added
- `CONTRIBUTING.md` — where a change belongs (hub vs skill repo), the two checks
  a PR must pass, and the install rules that are easy to work around by accident.
- `SECURITY.md` — what the launcher executes (three commands, explicit argv, no
  shell), the one path it ever deletes and why, the trust boundary, and private
  reporting.
- `CODE_OF_CONDUCT.md`, issue forms for bugs and ideas, and a PR template that
  asks for the command output rather than a "tests pass" claim.

### Changed
- README restructured for a first-time reader: what these skills are *for* comes
  before the install mechanics, and the family table carries an accurate one-line
  description of each skill.
- Registry descriptions rewritten to match what each skill does today, and pins
  refreshed (super-ux 0.23.0, task-pipeline 0.18.0, make-skill 0.6.0,
  sheleg-design 1.0.0, seo-aeo-audit 0.5.0).

### Fixed
- **The registry could advertise a version the submodule did not contain.** The
  validator compared `skills.json` to `.gitmodules` only, so a gitlink pointing
  at any commit of the right repo passed — and two pins were in fact wrong when
  this was written. It now reads the version out of each submodule's own
  `package.json` and fails on disagreement, with a CI self-test proving it.
- The README claimed task-pipeline runs **nine** gated stages while the table two
  sections above said ten — a contradiction left over from the tenth stage
  landing in task-pipeline 0.16.0.
- British spellings (`materialise`) in the README, launcher, validator and
  changelog; the repo standard is US spelling.

## v0.7.2 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.17.0. Scope now has a spine: the grill turns the request
  into an addressable **REQ list** where every row names how it is verified, the
  ids are traced through spec (`covers:`), plan (`Implements:`, gated on **set
  equality** against the brief), build and review, and a final **acceptance**
  stage accounts for every requirement with evidence before the run can close.
  An append-only carry-over ledger catches anything deferred, dropped or left
  half-done — deferred out loud is forgotten.
- Registry description updated to match.

## v0.7.1 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.16.1 — the tenth stage landed in 0.16.0 while fifteen
  places, the npm description among them, still promised nine.

## v0.7.0 — 2026-07-28

### Changed
- Author link moved from `svlab.online` to **https://sshlg.me** across every
  README, every repo homepage and the GitHub organization profile.
- Family table refreshed: new pins (super-ux 0.21.0, task-pipeline 0.16.0,
  make-skill 0.5.1, sheleg-design 0.9.0, seo-aeo-audit 0.5.0) and descriptions
  that match what each skill now does — the screens layer, decomposition and
  the loop guard, Agent Skills conformance, per-pack token layers.

## v0.6.1 — 2026-07-28

### Changed
- Pin `make-skill` to 0.4.1 — its `validate` workflow had been red since v0.3.0
  because the negative self-test targeted a template renamed three releases
  earlier.

## v0.6.0 — 2026-07-28

### Changed
- README is English-only and leads with what the family gives you before the
  install mechanics; author and links block added.
- Registry pins refreshed to the descriptions-and-canon releases across all five
  skills.

## v0.5.5 — 2026-07-28

- **seo-aeo-audit bumped to v0.4.1** in the registry and the submodule pin: the
  bundled page auditor now refuses non-http(s) URL schemes and redirects (a
  crafted URL list could previously have made it read local files via `file://`),
  and the repo gained a `SECURITY.md` stating what runs, what it touches and how
  to verify it.
- README rewritten around the five-skill family, the install channels and the
  one-channel-per-agent rule; `npx sshlg-skills` short form is now the primary
  path since the launcher is published on npm.

## v0.5.4 — 2026-07-28

- **seo-aeo-audit bumped to v0.4.0** in the registry and the submodule pin (was
  0.3.1). That release ran ten per-track extraction passes over the full source
  corpus and one reconciliation pass over all 19 contracts: +1,725 lines, sixteen
  contradictions resolved by naming both studies and demoting contested
  directions, duplication removed with a single owner per fact, and the coverage
  gaps filled (hreflang and international duplication, fabricated information
  gain, licensing posture, rank-tracker vendor continuity, EU DMA exposure).
- Registry `desc` updated to match.

## v0.5.3 — 2026-07-28

- **seo-aeo-audit bumped to v0.3.1** in the registry and the submodule pin
  (was 0.2.0). Two releases landed: v0.3.0 added the ranking model, the on-page
  completeness sweep, the tooling/evidence ladder and the post-click track
  (conversion elements, call and offline attribution, paid × organic alignment);
  v0.3.1 ran a consistency pass over the whole flow — one evidence ladder, one
  stance on structured data, reconciled page-experience and keyword framing,
  tier discipline in every new contract — and rewrote the README around install,
  update, the audit flow, what knowledge ships inside and how fresh it is.
- Registry `desc` updated to match.

## v0.5.2 — 2026-07-28

- **seo-aeo-audit bumped to v0.2.0** in the registry and the submodule pin. That
  release adds a dated Google update timeline (every core, spam and Discover
  update from March 2025 to June 2026, plus the platform changes that retired old
  tactics), an update-response protocol wired into the audit flow, a refresh
  routine with named sources, and SEJ's *SEO Trends 2026* distilled into the
  existing contracts.
- Registry `desc` updated to match.

## v0.5.1 — 2026-07-28

- **seo-aeo-audit bumped to v0.1.0 → v0.1.1** in the registry and the submodule
  pin. That release fixes the make-skill gotcha the first cut tripped over — the
  deliverable skeletons lived only at the repo root, which the skills CLI does not
  ship, so non-Claude agents received a SKILL.md pointing at files they could not
  read — plus a broken cross-reference anchor, mixed British/American spelling
  across the contracts, and two auditor defects (navigation labels inflating the
  word count, robots directives matched as substrings).

## v0.5.0 — 2026-07-28

- **New family member: `seo-aeo-audit` v0.1.0** ([ssheleg/seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)) —
  evidence-first website audit for search **and** answer engines that ends in a
  prioritized change plan. Ten tracks (access & indexation economics,
  canonicalization, architecture & link equity, intent & SERP fit, content value,
  extractability/AEO-GEO, entity & brand consensus, experience signals, risk &
  threats, measurement), an evidence-tier triage model
  (`priority = (impact × confidence) / effort`), an explicit myth guard, and a
  stdlib-only page auditor that measures the answer-engine read budget.
- Registered in `skills.json`, added as a submodule at `skills/seo-aeo-audit`,
  README family table and RU section updated.

## v0.4.1 — 2026-07-27

- **task-pipeline bumped to v0.12.0** in the registry and the submodule pin
  (was 0.10.0). That release makes the intake grill mandatory and **built in** —
  the `grill-me` / `grilling` dependency is gone, the doctrine is ported in-house
  with domain awareness (CONTEXT.md glossary challenges, ADR discipline) and an
  autonomy sweep that pre-resolves every stage-1→9 blocker — and replaces
  per-stage model tiering with one provider-agnostic model confirmed up front.
- Registry `desc` and the README family table updated to match.

## v0.4.0 — 2026-07-25

- **Enforce "one channel per agent" automatically.** The skills CLI auto-detects
  Claude Code and writes `~/.claude/skills/<id>` even when it is never named as a
  target, so every `install`/`update` silently recreated plain copies that shadow
  the Claude plugin. The launcher now prunes those copies after any skills-CLI
  step while the plugin channel is active (skipped under `--no-claude`, where the
  plain copies are the intended channel). Verified live: 7 shadows → 0.

## v0.3.1 — 2026-07-25

- Pin bump: sheleg-design **0.7.0** (style-agnostic build recipe, release
  workflow, RU README). Family now pinned at super-ux 0.19.0, task-pipeline
  0.10.0, make-skill 0.3.0, sheleg-design 0.7.0.

## v0.3.0 — 2026-07-25

Launcher hardening — four defects an adversarial audit proved by execution.

- **FIX: `update` silently moved the pins, even with `--claude-only`.** The
  submodule step ran before any flag branch and used `--remote --merge`, so a
  "Claude-only" run fast-forwarded a submodule to its upstream tip and left the
  superproject dirty — destroying the pinned-snapshot contract. It now runs only
  when not `--claude-only`, uses `--init --recursive` (materialize, don't move),
  and moves pins **only** behind the new explicit `--bump-pins`.
- **FIX: every `claude plugin` failure was swallowed.** Those `run()` results were
  discarded, so a completely failing `claude` still exited 0 (worst with
  `--claude-only`, where nothing else could set the flag). All four calls now feed
  the exit status — verified with a failing stub on PATH: exit 1.
- **FIX: the CI could not catch a bad `skillNames`.** Both workflows checked out
  `submodules: false`, and the cross-check was guarded by `if isdir(...)` — so it
  skipped silently and a bogus id passed green. Workflows now check out
  `submodules: recursive`, and the validator **fails loudly** when a submodule
  isn't materialized instead of skipping.
- **`skills update` now runs one call per skill id** so a single bad id can't fail
  the batch; contradictory `--claude-only --no-claude` and a valueless `--agent`
  now exit 2; `spawnSync` uses `shell` on Windows (npx/claude are `.cmd` shims);
  `list` falls back to versions recorded in `skills.json` when run from an npx
  tarball (it printed `v?` for everything, including the release smoke test).
- README's `update` section now matches the launcher (no `--agent`, adds
  `--bump-pins`).

## v0.2.1 — 2026-07-25

- Pins bumped to the review-pass releases: super-ux **0.19.0** (contracts now ship
  with every skill), task-pipeline **0.10.0** (brief template reachable on every
  channel, current super-ux chain), make-skill **0.3.0** (stopped shipping a
  placeholder skill; validator enforces the canon), sheleg-design 0.6.0.

## v0.2.0 — 2026-07-24

- **Fix: `update` never updated super-ux.** A repo can ship several skills under
  different ids — super-ux ships `ux-foundation`/`ux-flows`/`ux-scenarios`/
  `ux-audit` and there is no skill called `super-ux` — but the launcher passed the
  repo names to `skills update`, which matches INSTALLED SKILL ids. super-ux was
  silently skipped on every update. `skills.json` entries now carry `skillNames[]`
  (the ids actually shipped) and the launcher updates those; the validator
  enforces the field and cross-checks it against the skills each submodule ships,
  so the regression cannot come back.

## v0.1.3 — 2026-07-24

- **Tolerate stray non-flag arguments.** zsh does not treat `#` as a comment by
  default, so `... install # note` passed `#` into the launcher and it hard-failed
  with "unknown option: #". Now only `-`/`--`-prefixed unknowns error; bare stray
  tokens are ignored with a notice, so the intended command still runs.

## v0.1.2 — 2026-07-24

- Bumped submodule pins to the current release of each skill: super-ux 0.18.0,
  task-pipeline 0.9.0, **make-skill 0.2.0** (correct multi-agent + cross-platform
  distribution guidance), sheleg-design 0.6.0.

## v0.1.1 — 2026-07-24

- **Fix multi-agent install.** The vercel `skills` CLI does not split a
  comma/space-joined `--agent` value (it read `cursor,opencode,…` as one invalid
  agent). The launcher now passes one repeated `--agent <name>` flag per agent, so
  `install` reaches the whole default agent set (and `--all`/`--agent a,b`) in one
  `skills add` call per skill.

## v0.1.0 — 2026-07-24

Initial release — the ssheleg skill-family umbrella.

- **Submodules** (`skills/`): super-ux, task-pipeline, make-skill, sheleg-design
  (→ `ssheleg/sheleg-design-skill`), wired via `.gitmodules` (https urls, clonable
  without SSH).
- **Launcher/updater** `bin/sshlg-skills.js` (zero-dep): `install` / `update` /
  `list` / `agents`. A thin orchestrator over the vercel `skills` CLI (70+ agents),
  `claude plugin` (Claude Code), and `git submodule` (pinned snapshots). Non-Claude
  agents via the skills CLI; Claude Code via its plugin to avoid a shadow duplicate.
  Flags: `--agent`, `--all`, `--no-claude`, `--claude-only`.
- **`skills.json`** — source of truth (repos, plugin ids, default agent set).
- **Validator** (`test/validate.py`, stdlib): package/version, bin resolves, files
  whitelist, CHANGELOG version match, and `.gitmodules` ↔ `skills.json` ↔ on-disk
  submodule agreement. CI runs it plus a negative self-test and `node --check`.
- **Distribution:** `npx github:ssheleg/sshlg-skills` (no publish needed),
  `git clone --recursive` + `install.sh`, and (optional) npm `sshlg-skills`.
