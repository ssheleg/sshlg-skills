<sub>ssheleg skills — task-pipeline · agent-sync</sub>

# Skills-first website deployment receipt

Status: deployed and verified on 2026-09-21.

## Scope and integration

The operator requested a Skills-first website and a separate Harness section,
with Project Observatory and Asset Foundry described as companion projects.
[Implementation packet](2026-09-21-skills-primary.md) contains the scenarios,
copy/visual checks and the exact brand-parser limitation. That limitation is
not reclassified as a passing brand lint by this deployment.

[PR #146](https://github.com/ssheleg/sshlg-skills/pull/146) was squash-merged
only after both validate checks passed, with a head-commit match guard.
Published candidate: `bf6a78d32de8fc2d5851e1313cba47db8a70d82e`.
The release waited for the [public Observatory engine source](https://github.com/ssheleg/project-observatory-open-source/tree/585d8e210891821213a2b22fe9b7fbe1b1c77a79)
before integration. Foundry remains explicitly in development.

Deployment owner: GitHub Pages, via [pages workflow](https://github.com/ssheleg/sshlg-skills/blob/bf6a78d32de8fc2d5851e1313cba47db8a70d82e/.github/workflows/pages.yml).
Run: [35597679245](https://github.com/ssheleg/sshlg-skills/actions/runs/35597679245).

## Installed family verification

This was a read-only comparison against the v1.50.0 family manifest and pinned
member source trees. All 34 installed Agent Skills payloads matched, including
490 files of instructions, references and scripts. Python caches were excluded.
All ten active Claude plugin version records matched the pinned versions.
Eight packs also had matching Codex plugin-cache versions; telegram-dev and
xr-dev were available through the matching Agent Skills payloads. Cached files
and installed metadata do not prove that every running session reloaded them.

The separately installed observatory-log companion remained at 0.8.0. Its
marketplace is directory-sourced. Public 0.10.0 instructions require an explicit
engine root and private workspace; updating it without that binding would change
the existing operational setup. Per release-task direction, no companion hooks,
host configuration, gateway configuration or live Observatory state were changed.

## Validation

- Before merge: `npm test`, 88 suites / 1030 fixtures PASS; generated-site suite,
  44 checks across 15 pages PASS.
- Local browser evidence covers 320px/390px mobile and 1440px desktop, with all
  ten member pages checked at 320px. See the implementation packet.
- Production Pages workflow: validate, build and deploy all SUCCESS for the
  exact candidate SHA above.
- HTTP verification: all 15 public HTML routes returned 200 and matched the
  locally built bytes of that commit, including all ten member pages. The
  [machine receipt](2026-09-21-skills-primary-release.json) records the route,
  content hash, title and verification timestamp for each page.
- Production Chrome: desktop home at 1440×900; home, Harness and agent-stack at
  320×740. Skills and Harness remained visible in navigation; document width
  equalled viewport width. Foundry's development/availability text was visible;
  the member retained independent use and harness affiliation. No console
  errors were reported. The temporary viewport override and verification tab
  were cleaned up.

## Handoff

The website release is complete. Next owner: the parent cross-project release
record should link this receipt and separately retain the known brand-parser
limitation. The companion plugin's live migration remains deliberately outside
this website release. No package version, submodule pin or installed skill
mutation was made.

Private machine configuration, individual external projects, credentials and raw
operational logs remain local-only. This receipt contains only public repository
and route identifiers plus aggregate installation verification.

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
