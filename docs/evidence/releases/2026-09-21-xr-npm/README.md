<sub>ssheleg skills — make-skill · task-pipeline · agent-sync</sub>

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

## Completed delivery

All acceptance requirements above are complete. [Machine-readable receipt](delivery.json)
records exact integrity values, checks, scope limits and the next release procedure.

| Owner | Release branch / commit | Public release and entry point | Status |
|---|---|---|---|
| [xr-dev](https://github.com/ssheleg/xr-dev) | main / `7515a914ce4aad860b5fd08ce472509d6f7f5bbf` | [v0.3.1](https://github.com/ssheleg/xr-dev/releases/tag/v0.3.1), [release instructions](https://github.com/ssheleg/xr-dev/blob/7515a914ce4aad860b5fd08ce472509d6f7f5bbf/docs/RELEASING.md) | GitHub OIDC publication succeeded; npm serves the package |
| [sshlg-skills](https://github.com/ssheleg/sshlg-skills) | main / `c75ebde4e229f9b4e2dacb0b091da91d62e11178` | [v1.51.1](https://github.com/ssheleg/sshlg-skills/releases/tag/v1.51.1), [catalog](https://github.com/ssheleg/sshlg-skills/blob/c75ebde4e229f9b4e2dacb0b091da91d62e11178/skills.json) | Published; XR pin matches the member release |

- Actual non-skipped publishing succeeded in [XR Actions](https://github.com/ssheleg/xr-dev/actions/runs/35605315535)
  and [family Actions](https://github.com/ssheleg/sshlg-skills/actions/runs/35606192705).
- The [Pages run](https://github.com/ssheleg/sshlg-skills/actions/runs/35606184263)
  succeeded. HTTP readback of the XR page and llms.txt confirms XR 0.3.1, family
  1.51.1 and an npm link, without the pending marker.
- Fresh registry tarballs tested outside the repositories: XR contains 39 files,
  installs 7 skills and all 32 Markdown files; the family contains 58 files,
  advertises XR 0.3.1 as published, and its `list` command succeeds. Temporary
  package directories/test homes were removed. The normal npm cache is local-only.
- Full family update passed 66/66 steps. Shared skills and the Claude plugin
  match all 32 XR Markdown files in the tagged source. Active sessions still
  need to reload; the Codex native plugin cache is outside the family updater.
- [XR provenance receipt](xr-provenance.json) matches the tag, source commit,
  push event and registry digest. This is a statement/digest comparison,
  not an independent cryptographic signature verification.

## Handoff and exact next task

Implementation is merged and released. This branch `codex/xr-npm-family` adds
final delivery evidence only; it must not replace the released parent pin.
The member evidence branch `codex/xr-npm-automation` is pushed at
[6179bc3036c5a12c0419a2e4f265d48eeb7307c1](https://github.com/ssheleg/xr-dev/blob/6179bc3036c5a12c0419a2e4f265d48eeb7307c1/docs/evidence/releases/2026-09-21-npm-automation/README.md).
It also adds evidence only beyond the released source. All resource claims are released.

No work remains for this request. For the next XR release, follow the linked
release instructions: synchronized version bump, tested merge, tag push and
family pin/release. GitHub now publishes XR without a manual npm login or publish.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — npm OIDC release setup
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — release checks and delivery
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — claims for shared files
