# Public repository standard — spec

Brief: `docs/evidence/briefs/2026-08-26-public-repo-polish.md`

## Repository contract

Every plugin repository contains:

- the existing marketplace and plugin manifests;
- one or more portable `plugins/<plugin>/skills/<skill>/SKILL.md` directories;
- `SKILL-CARD.md` at the repository root;
- `test/evals/triggers.json` and `test/evals/scenarios.json`;
- a stdlib-only validator that checks those artefacts and can be observed
  rejecting a planted defect;
- CI jobs for the repository validator, the shared skill audit and both Claude
  plugin strict checks;
- README, CHANGELOG, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT and MIT licensing.

The umbrella contains the same public files where applicable, but does not
pretend to be a plugin and therefore has no `SKILL-CARD.md` requirement.

## Public-copy contract

The first README viewport, in this order:

1. repository name;
2. CI, npm, license and docs badges;
3. one-sentence promise;
4. one recommended install command;
5. one concrete invocation or outcome;
6. link to the detailed site page.

Long doctrine remains available below or on `skills.sshlg.me`; it does not delay
the first successful install. GitHub descriptions stay at or below 160 characters
and topics are capped at eight deliberate search terms.

## Visual contract

Cards are 1200×630 PNGs generated from the same manifest as the site. They use the
existing `workbench` palette, bitmap type system and mark from
`scripts/og-card.js`. The generated member card is copied to
`docs/assets/social-preview.png` in its repository and uploaded as the GitHub
custom social preview. A validator compares its PNG dimensions and checksum with
the generator output for the pinned member.

## Skill-eval contract

`triggers.json` contains positive and near-miss negative prompts per skill.
`scenarios.json` contains at least three behavioural scenarios per repository:
baseline failure, skill-assisted expected behaviour, and coexistence with the
installed family. Data files do not claim a model run occurred unless an
evidence row names the model, date and output. Until then they are executable
cases with `status: designed`, not fabricated results.

## Governance contract

One GitHub ruleset shape is applied to every repository:

- target: branches; include `~DEFAULT_BRANCH`; block deletion and non-fast-forward
  updates; require the repository's validation status before merge;
- target: tags; include `refs/tags/v*`; block deletion and non-fast-forward
  updates.

Rulesets must not require an unavailable paid feature. If GitHub rejects a rule,
the exact API response is evidence and the strongest supported subset is applied.

## Release contract

A member release proceeds only after its own suite and strict checks are green.
The umbrella pin moves in the same run, after npm serves the member version. The
umbrella validator compares pins against public npm and reports stale as a
blocking release preflight. Tag counts are history and are not rewritten; future
public releases are batched when several internal commits belong to one coherent
user-facing change.

