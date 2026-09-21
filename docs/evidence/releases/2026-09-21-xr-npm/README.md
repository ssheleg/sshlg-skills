# XR npm automation propagation — 2026-09-21

## Scope, dependencies and acceptance

Propagate xr-dev 0.3.1 after a verified GitHub OIDC publish: family submodule pin,
catalog, README, generated social cards, website, npm release and installed skills.
Preserve the Skills/Harness separation delivered in parent baseline 4aad53f.
The operator authorized release and site/npm updates. No new UI flow or visual
style is introduced: the existing version display and npm availability link change.

Dependencies: [member task](https://github.com/ssheleg/xr-dev/blob/codex/xr-npm-automation/docs/evidence/releases/2026-09-21-npm-automation/README.md),
[prior lifecycle release](../2026-09-21-xr-lifecycle/README.md), repository CLAUDE.md,
[coordination contract](../../../AGENT_SYNC.md), [docs map](../../../DOCMAP.md).

Checks: complete npm test, strict pin check after member publication, site generation,
CI release/Pages, exact npm versions/integrities, fresh package installation and
whole-family update. Do not remove npmPublished:false until the registry serves XR.

Plan: publish/verify member → advance pin and catalog → test/release parent → verify
site/npm/install → commit delivery receipt. Exact next task: wait for member CI,
prepare the parent metadata change, then verify its new version on npm.

Local-only: npm credentials, machine configuration, caches, downloaded dependencies
and temporary test homes are not deliverables and must stay out of Git.

## Local verification

- `npm test`: PASS, 88 suites, 1031 fixtures, 10 pinned members.
- Site generation: 15 pages, 33 files; XR page names 0.3.1, has the npm package
  link and no pending-publication marker. Both committed social previews remain
  byte-identical to generator output; no image change is required.
- Context evidence regenerated with `python3 test/audit_regressions/ctx-04.06.py --emit`.
- Member tag v0.3.1 resolves to 7515a914ce4aad860b5fd08ce472509d6f7f5bbf.
  [Tag-push run](https://github.com/ssheleg/xr-dev/actions/runs/35605315535)
  reports the npm publish step succeeded (not skipped); registry propagation is
  still being checked. The parent must not be released before that check passes.
