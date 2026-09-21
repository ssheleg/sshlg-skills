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
