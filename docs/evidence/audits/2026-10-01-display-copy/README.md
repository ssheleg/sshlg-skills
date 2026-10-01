# Display-copy regression: 2026-10-01

## Objective and route

Trace the actual source of decorative periods, repair the skill and website checks,
and publish the member updates through the umbrella. Route: task-pipeline for
implementation and review; make-skill Retrofit for skill construction; agent-sync
for guarded writes. This is an engineering regression fix, not a new brand direction.

## Initial evidence and gaps

- PASS mechanical: installed copywriting audit 19 checks; sheleg-design 18 checks.
  Command: `python3 <make-skill>/scripts/audit_skill.py <skill-dir> --house --json`.
- GAP: super-ux 0.56.2 already forbids title full stops in AT-07, but B063 reads
  Markdown/frontmatter titles and quoted-code extraction misses HTML headings.
- GAP: website copy projection discards heading semantics; npm check does not
  include an editorial gate. Exit zero from advisory lint was not proof of coverage.
- GAP: site check historically required the period-bearing literal; the release
  generator also emitted heading periods. The preceding site change repaired
  content/generator at d9dd06ab2cdabd7a624a1169d6d3db230e0617f3, but did not add a
  durable general regression gate.
- NOT_RUN: baseline/candidate agent-outcome experiments. Deterministic fixtures
  demonstrate scanner coverage, not a promise that every model follows a skill.

## Bounded owners

1. [Super UX packet](super-ux.md): semantic scanner, title rule, portable invocation.
2. [Design packet](design.md): visible-copy review seam, bounded adjacent audit.
3. [Website packet](website.md): project display policy gate with failing plants.
4. Coordinator: independent review; member PR/CI/release; umbrella pins/release;
   installed provenance/hash readback; central handoff. No unrelated repositories.


## Provenance and causal limit

The installed skill entry files matched the umbrella's pinned source bytes before
work ([hash receipt](installed-before.json)): copywriting came from super-ux
0.56.2 and design from sheleg-design 1.61.1. These were current installed entries,
not an unexplained stale local override. The canonical title rule already existed
in `skills/super-ux/plugins/super-ux/skills/references/ai-tells.md`, AT-07.

The website's history provides the concrete text path: original H1 restored in
`86acb6c3a6908f68ce1d541ee25f2de280e72ea6`, staccato reframe in `887923a8`,
period-bearing expectations in its old `scripts/check-site.mjs`, and periods in
release-generated headings. The old flat projection erased title roles. These
facts establish copying and validation defects, not which prompt caused a model
choice. The operator requested the original wording, not necessarily its period.

The correction must survive source regeneration, packaging, installation and a
fresh checkout. A generic title linter and the site's broader hero/caption policy
have different scopes; the website gate is self-contained so CI does not depend
on a globally installed agent skill. Computed CSS visibility/line breaks remain
a browser-review responsibility.

## Review and execution

The task-pipeline stage-5 fresh-implementer route was used for the two skill
owners. A third fresh agent was unavailable (runtime thread limit), so the
coordinator implemented the site packet inline with a read-only review from the
design implementer. That review found future-page coverage drift: the site now
asserts equality with both sitemap pages and the build's public HTML entries.

The site found another real role gap: the typography specimen was a styled
paragraph, not an h-tag. It now reads `Keep building`; explanatory prose keeps
its punctuation. The design kit had the same issue in the Deskmate Empty title.

## Owner index

| Owner | Source / entry | State |
|---|---|---|
| PassionCode site | [source 2513989](https://github.com/passioncode-ai/passioncode-ai.github.io/blob/2513989fe3fdd423df5679aec6a3e24756824d32/docs/tasks/2026-10-01-copy-guard.md) | Main CI success; deployed Worker e00ec2e7-51ac-4445-9bb0-bdba53e2bab2; 37 live checks and three specimen viewports pass |
| sheleg-design | [PR 37](https://github.com/ssheleg/sheleg-design-skill/pull/37), merge 55d6b4e8af42b943486ad839e65cb3a0d1172e66 | Reviewed, CI success, annotated v1.61.2; GitHub/npm publication verified (release run 36925352294) |
| super-ux | [PR 31](https://github.com/ssheleg/super-ux/pull/31), [DC-01 packet](super-ux.md) | Merge d3aa694163cfa696406198495f1d428ce850e0c3, annotated v0.56.3; GitHub/npm publication verified (release run 36926697905) |
| sshlg-skills | This entry | Candidate 1.52.6 pins both released members; local full gate and release-pin readback pass; publication/install remain |

The generic real-consumer pass also found joined navigation labels; the final
parser separates controls while preserving prose links and narrows HTML B022 to
interface candidates. The final site pass has zero errors and 185 advisory
registry findings (repeated navigation, decorative arrows and whole-card names
need interpretation); SITE-005 in the site backlog owns that separate review.
No blanket clean brand-lint claim is made. Historical exact-text snapshots must
be rechecked against the current project policy, now explicit in copywriting.

The site baseline missed all three deliberate plants; its candidate gate rejects
all three. The mandatory gate checks 239 display blocks over seven pages with ten
focused tests plus existing checks. These are deterministic scanner results,
not a before/after model-outcome experiment (NOT_RUN).

## Umbrella verification

- `npm test`: 88 suites, 1035 fixtures, 11 pinned members; exit 0.
- `python3 test/check_pins.py`: every pin matches its GitHub tag and npm version.
- The first full gate correctly rejected the old CTX-04.06 simulated staging
  receipt after member pins changed. `python3 test/audit_regressions/ctx-04.06.py
  --emit` regenerated it; its six checks and the full gate then passed. This is
  a staging-model receipt, not a claim about the operator's active processes.
- `CLAUDE.md` no longer says the growing family contains eight members; the
  current member count is computed by the gate rather than restated there.
- The native Codex design plugin was refreshed through its official marketplace
  and install commands to 1.61.2. Super-ux is not an installed native Codex plugin
  on this machine; its portable skills are delivered through the shared hub.
- Host-file backups were kept privately before the machine update. No credential
  or private config content is included in this repository.

Next: publish the reviewed umbrella, execute its full updater, compare installed
entry/reference/script bytes with these source pins, and append the receipt.
