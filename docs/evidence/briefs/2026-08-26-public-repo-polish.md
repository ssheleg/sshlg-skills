# Public repository retrofit — locked brief

Date: 2026-08-26
Status: locked
Model: current Codex model for the whole run
Run: `PUBLIC-POLISH-2026-08-26`

## Task

Bring all ten public ssheleg skill repositories to one externally credible
standard: current distribution metadata, enforceable skill conformance,
behavioural evidence, consistent public copy and social cards, protected release
branches, quieter releases, and verified publication through every supported
channel.

## Source ledger

| Source | What it settles | Contradictions found |
|---|---|---|
| `skills.json` | member ids, repos, npm packages and family pins | `agent-sync` and `telegram-dev` pins trail npm; the public repository description still says eight packs |
| member `package.json`, manifests and CHANGELOG | each released version | direct GitHub and npm versions agree at audit time |
| member `README.md` and GitHub metadata | the public promise and install path | top blocks now agree, but descriptions are 236–333 characters and no repository uses a custom GitHub social preview |
| `make-skill` Retrofit checklist | distributable skill floor | seven repositories lack `SKILL-CARD.md`; eight lack `test/evals/`; four primary skills fail the shared headroom/budget audit |
| GitHub Actions history | release reliability | latest runs are green; 12 of the sampled 100 recent runs failed before a later retry/fix |
| GitHub branch and ruleset APIs | merge protection | all ten repositories have neither branch protection nor a ruleset |
| `scripts/og-card.js` and the public site build | visual source of truth | cards already exist for the site but are not attached to GitHub repositories |
| `docs/DOCMAP.md`, `docs/evidence/retro.md`, member validators | local contracts and learned constraints | the doc map still says eight members; member validators can pass while the shared skill auditor reports gaps |

Contradictions: all contradictions above are in scope and must be resolved, not
documented as permanent exceptions.

## Decisions

- `sshlg-skills` remains the source of truth for family membership, versions,
  copy primitives and generated social cards.
- Public prose uses the `peer-builder` voice: specific, falsifiable, direct,
  explicit about limits. `operator-brief` is the rejected alternative because
  these readers evaluate source and install contracts rather than operate an
  incident.
- Visuals use the existing `workbench` dark token layer and generated card
  mechanism. No hand-maintained second palette and no version text that is not
  generated from `skills.json`.
- Existing package and plugin names do not change. Renames would create migration
  cost without closing a demonstrated defect.
- Every member keeps its own repository and release. The umbrella must detect a
  stale pin automatically and update only after the member version is publicly
  resolvable.
- Releases may be published in this run. A release is not complete until GitHub,
  npm, skills discovery and the umbrella pin all agree.
- GitHub `main` and `v*` tags are protected through one consistent ruleset shape.

## Requirements

| REQ | Deliverable | Verification |
|---|---|---|
| PR-001 | Family membership, README, CLI output and GitHub description say nine packs and current versions | `npm test`; `npx sshlg-skills@latest list`; GitHub API |
| PR-002 | A central, contract-valid family brand pack owns public repository copy | brand linter exits 0; sources resolve |
| PR-003 | Every shipped skill passes the shared `make-skill` mechanical audit with working headroom | audit every `plugins/*/skills/*/SKILL.md`; zero GAP |
| PR-004 | Every plugin repository runs the shared audit in CI in addition to its own validator and both strict manifest checks | workflow inspection plus a planted invalid skill that fails |
| PR-005 | All nine plugin repositories carry `SKILL-CARD.md` | public tree API and local validators |
| PR-006 | All nine plugin repositories carry behavioural trigger/scenario eval data with positive, near-miss and coexistence cases | schema validator plus negative self-test |
| PR-007 | README first screens and GitHub descriptions follow one family contract without erasing each pack's distinct promise | generated/public-copy checks and manual read |
| PR-008 | Every repository has a generated 1200×630 social card and GitHub uses it as the custom preview | PNG checks and GitHub GraphQL `usesCustomOpenGraphImage` |
| PR-009 | All ten repositories protect `main` and `v*` tags | GitHub rulesets API |
| PR-010 | Release jobs consume a green validation result and do not create a tag before the claimed suite is green | workflow checks and one negative fixture |
| PR-011 | All local validators, strict plugin checks, skills discovery and npm CLI smoke-tests pass | recorded command outputs |
| PR-012 | Releases, npm versions, submodule pointers and umbrella pins converge | GitHub/npm/CLI checks after publication |

## Autonomy and residue

- Repository edits, commits, pushes, GitHub metadata/rulesets and releases are
  authorised by the operator's “исправим всё”.
- Secrets are never read or printed. A publisher requiring interactive auth is
  reported as a human hold rather than bypassed.
- Existing unrelated changes stop the affected repository; none were present at
  intake.
- Every `agent-sync` lease is released on success or failure. Temporary build
  directories and generated caches are removed or declared.

