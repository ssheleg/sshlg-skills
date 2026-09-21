<sub>ssheleg skills — task-pipeline · agent-harness · make-skill · ux-scenarios · copywriting · sheleg-design · agent-sync · cloudflare</sub>

# Harness publication handoff

Objective and requirement IDs: [delivery plan](2026-09-21-harness-observatory.md). Architecture and shared component contracts: [harness overview](../../harness/README.md). This entry coordinates repositories; source, implementation and detailed evidence stay with their owners.

## Decisions

- The public name is **ssheleg harness**. `sshlg-skills` remains the package/launcher identity. The family supplies specialist instructions, routing and verification; Project Observatory is an optional separate observation tool.
- The coding host owns execution and permissions. No new sandbox or automatic permission grant is claimed.
- The operational Observatory repository remains private. A new portable edition has independent history, generic source, synthetic fixtures and no operational inventory. Its migration map distinguishes shipped scope from future features.
- ECC informed selected workbench contracts, with pinned-source attribution. Its code, hooks and host configuration were not installed or copied wholesale.
- Existing family and personal site hosts/URLs are preserved. Observatory has its own Cloudflare Pages project and custom subdomain.

## Owning repositories

| Owner | Working branch / integration | Revision and entry | State |
|---|---|---|---|
| `ssheleg/agent-stack` | main, v0.25.2 | [released source](https://github.com/ssheleg/agent-stack/tree/20cebb27f2824da6a95ae3f29241c76bb0ef61e6); `docs/evidence/research/2026-09-21-ecc-handoff.md` | member implementation and canonical ledger integrated; registry verification recorded below |
| `ssheleg/sshlg-skills` | codex/harness-observatory-20260921 | this entry; `docs/harness/README.md` | implementation complete, release convergence |
| `ssheleg/project-observatory-open-source` | new main | `docs/HANDOFF.md`, `docs/MIGRATION.md`, `docs/ONBOARDING.md` | reviewed portable implementation, publication convergence |
| `ssheleg/sshlg-me` | codex/harness-observatory-20260921 | `docs/handoffs/2026-09-21-harness.md` | final public-link convergence |
| `ssheleg/sshlg-home` | codex/harness-positioning-20260921 | [fe5c89b](https://github.com/ssheleg/sshlg-home/tree/fe5c89b52f7b21f520a00d7a3547bf34a686b356), `brand/harness-positioning.md` | additive canonical positioning pushed; unrelated operator edits preserved |

## Verification actually run

- Family: `npm test`, 88 suites, 1,028 fixtures, 10 pinned members, exit 0. `node test/site_test.js`, 42 checks, 15 pages, exit 0. The ctx acceptance receipt was regenerated against the final member pin.
- Browser: home, harness overview and member relationship reviewed; 390px mobile document had no horizontal overflow. Combined wrapper/section padding was corrected after visual review. See [scenario evidence](../../ux/scenarios.md).
- Observatory runtime: independent security review plus synthetic tests. The owner records exact file hashes, adversarial probes, install and privacy evidence in its handoff. No private raw audit, key, filesystem inventory or runtime screenshot is a publication input.
- Observatory site: exact nine-file allowlist, local links, no external assets, capability disclosures and case-study arithmetic. Three negative probes reject unknown files, private markers and changed counts. The historical aggregate counts replacement events (66 + 136), never unique credentials or vendor breaches.
- Agent-stack: member gate, strict plugin validation, pinned ECC provenance and registry payload comparison recorded in the member handoff. An accidentally tagged old v0.25.0 was not published to npm; its protected tag was not force-rewritten. Correct releases and tag identities are recorded there.

## Release receipts and resume

Publication URLs, exact deployed revisions and installed-host verification are added here after observation. Do not infer them from a local build or a successful push. The next task during convergence is to finish the Observatory full-history privacy gate, publish the reviewed clean repository, then verify its static deployment before replacing personal-site preparation wording.

The migration packets M01–M16 in Observatory's `docs/MIGRATION.md` are future feature work, not hidden installation requirements. No cloud key, scheduler, MCP service or paid model is needed for the portable local edition. Do not migrate the private predecessor's Git history to accelerate those packets.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — delivery and repository handoff
- [`agent-harness`](https://github.com/ssheleg/agent-stack) — ECC analysis and workbench contracts
- [`make-skill`](https://github.com/ssheleg/make-skill) — skill release checks
- [`ux-scenarios`](https://github.com/ssheleg/super-ux) — website and onboarding scenarios
- [`copywriting`](https://github.com/ssheleg/super-ux) — harness and Observatory narrative
- [`sheleg-design`](https://github.com/ssheleg/sheleg-design-skill) — Observatory visual system
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — shared-file claims
- `cloudflare` — static deployment — not a skill this family ships
