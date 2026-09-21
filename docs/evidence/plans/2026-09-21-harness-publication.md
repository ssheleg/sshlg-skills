<sub>ssheleg skills — task-pipeline · agent-harness · make-skill · ux-scenarios · brand-voice · copywriting · sheleg-design · agent-sync · evidence-docs · cloudflare</sub>

# Harness publication handoff

Objective and requirement IDs: [delivery plan](2026-09-21-harness-observatory.md). Architecture and shared component contracts: [harness overview](../../harness/README.md). This entry coordinates repositories; source, implementation and detailed evidence stay with their owners.

## Decisions

- The public name is **ssheleg harness**. `sshlg-skills` remains the package/launcher identity. The family supplies specialist instructions, routing and verification; Project Observatory is an optional separate observation tool.
- The coding host owns execution and permissions. No new sandbox or automatic permission grant is claimed.
- The operational Observatory repository remains private. A new portable edition has independent history, generic source, synthetic fixtures and no operational inventory. Its migration map distinguishes shipped scope from future features.
- ECC informed selected workbench contracts, with pinned-source attribution. Its code, hooks and host configuration were not installed or copied wholesale.
- Existing family and personal site hosts/URLs are preserved. Observatory has its own Cloudflare Pages project and custom subdomain.

## Owning repositories

| Owner | Integrated revision / release | Entry and status |
|---|---|---|
| `ssheleg/agent-stack` | main [20cebb27](https://github.com/ssheleg/agent-stack/tree/20cebb27f2824da6a95ae3f29241c76bb0ef61e6), v0.25.2 | [Final ECC receipt](https://github.com/ssheleg/agent-stack/blob/2216d17d2fae1a5ecb7c267df5565e0252602826/docs/evidence/research/2026-09-21-ecc-handoff.md); release source integrated, final receipt on `codex/ecc-final-receipt` |
| `ssheleg/sshlg-skills` | main [e3853cc](https://github.com/ssheleg/sshlg-skills/tree/e3853cc724aa87f1e26a69c40690df69fde368e4), v1.50.0 | this entry; [architecture](../../harness/README.md); public site deployed |
| `ssheleg/project-observatory-open-source` | v0.1.0 [d2ac940](https://github.com/ssheleg/project-observatory-open-source/tree/d2ac94082a31b64a95482dc6b97727b119955d1c), main receipt [e755332](https://github.com/ssheleg/project-observatory-open-source/tree/e75533217f61775096f74c5e6bcd4dbaa5f5e498) | [Handoff](https://github.com/ssheleg/project-observatory-open-source/blob/e75533217f61775096f74c5e6bcd4dbaa5f5e498/docs/HANDOFF.md), [onboarding](https://github.com/ssheleg/project-observatory-open-source/blob/d2ac94082a31b64a95482dc6b97727b119955d1c/docs/ONBOARDING.md); PUBLIC, CI green and site deployed |
| `ssheleg/sshlg-me` | main [40ca3cc](https://github.com/ssheleg/sshlg-me/tree/40ca3cc0b19e51d1d3d05bf0407ab8d97fc15f61) | `docs/handoffs/2026-09-21-harness.md`; narrative live, automated deployment confirmation below |
| `ssheleg/sshlg-home` | master [3df7fa8](https://github.com/ssheleg/sshlg-home/tree/3df7fa87059661bc9f2c6f5bdcb95d96317f8f00) | `brand/harness-positioning.md`, linked from the brand index; integrated, unrelated operator edits preserved |

No unmerged member implementation pin is hidden in the umbrella. The agent-stack final receipt branch is documentation only; the pin remains the exact published code. The private predecessor's generic readiness report and audit handoff were separately committed/pushed to its existing private remote; neither raw private audit data nor that private inventory is copied here.

## Verification actually run

- Family: `npm test`, 88 suites, 1,028 fixtures, 10 pinned members, exit 0. `node test/site_test.js`, 42 checks, 15 pages, exit 0. The ctx acceptance receipt was regenerated against the final member pin.
- Browser: home, harness overview and member relationship reviewed; 390px mobile document had no horizontal overflow. Combined wrapper/section padding was corrected after visual review. See [scenario evidence](../../ux/scenarios.md).
- Observatory runtime: independent security review plus synthetic tests. The owner records exact file hashes, adversarial probes, install and privacy evidence in its handoff. No private raw audit, key, filesystem inventory or runtime screenshot is a publication input.
- Observatory site: exact nine-file allowlist, local links, no external assets, capability disclosures and case-study arithmetic. Three negative probes reject unknown files, private markers and changed counts. The historical aggregate counts replacement events (66 + 136), never unique credentials or vendor breaches.
- Agent-stack: member gate, strict plugin validation, pinned ECC provenance and registry payload comparison recorded in the member handoff. An accidentally tagged old v0.25.0 was not published to npm; its protected tag was not force-rewritten. Correct releases and tag identities are recorded there.

## Release receipts and installed channels

- Personal site [production run 35587897928](https://github.com/ssheleg/sshlg-me/actions/runs/35587897928) succeeded at `40ca3cc0b19e51d1d3d05bf0407ab8d97fc15f61`. The harness/Observatory narrative is live at [sshlg.me](https://sshlg.me/). A pre-existing invalid deployment credential was replaced with a dedicated account-scoped Pages Write credential; its value remains outside Git. The crawler check now accepts the actual origin policy with or without Cloudflare’s managed group and still rejects duplicate groups.
- Family Pages [run 35587027596](https://github.com/ssheleg/sshlg-skills/actions/runs/35587027596) succeeded at `e3853cc724aa87f1e26a69c40690df69fde368e4`. The live [harness page](https://skills.sshlg.me/harness/) was reviewed in the browser with the correct host-runtime boundary and Observatory link.
- Observatory's [release receipt](https://github.com/ssheleg/project-observatory-open-source/blob/e75533217f61775096f74c5e6bcd4dbaa5f5e498/docs/RELEASE.md) records its clean history, 302-identifier gate, fresh public clone, three successful CI platforms and exact deployed HTML hash. Cloudflare deployment `8e675a83-d974-4e11-86cb-cafd9df48183` serves [observatory.sshlg.me](https://observatory.sshlg.me/); only the public static artifact was uploaded.
- The family updater ran from the reviewed 1.50.0 source and completed **65 of 65 steps**, refreshing its managed skill/Claude channels, routing blocks and wired runtime. No raw machine inventory is attached.
- The installed `agent-harness/references/workbench-contracts.md` in skills-CLI, Claude native plugin 0.25.2 and Codex native plugin 0.25.2 matched released SHA-256 `a17af9cc84dcc8661085ebb606b09ac08ebe39f6c1fc436ab547ac21747bca80`.
- Codex's native channel was updated separately with its documented `codex plugin marketplace add ssheleg/agent-stack --ref main` and `codex plugin add agent-stack@agent-stack`. The launcher still reports that native lifecycle as unsupported by the launcher itself; it must not be read as proof that a separate host-manager operation failed. Installed files do not replace instructions already loaded in a running conversation: start a fresh session.

## Exact next development task

Read Observatory [M01](https://github.com/ssheleg/project-observatory-open-source/blob/d2ac94082a31b64a95482dc6b97727b119955d1c/docs/MIGRATION.md) and its [UI packet plan](https://github.com/ssheleg/project-observatory-open-source/blob/d2ac94082a31b64a95482dc6b97727b119955d1c/docs/ux/UI-PLAN.md). Implement transactional enrollment/removal with stable project identity before history/detail views. Future provider, MCP, scheduler and administrative capabilities are explicit backlog; they are not installation prerequisites. No cloud key or paid model is needed for the portable local edition. Never migrate the private predecessor's Git history to accelerate these packets.


---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — delivery and repository handoff
- [`agent-harness`](https://github.com/ssheleg/agent-stack) — ECC analysis and workbench contracts
- [`make-skill`](https://github.com/ssheleg/make-skill) — skill release checks
- [`ux-scenarios`](https://github.com/ssheleg/super-ux) — website and onboarding scenarios
- [`brand-voice`](https://github.com/ssheleg/super-ux) — canonical positioning
- [`copywriting`](https://github.com/ssheleg/super-ux) — harness and Observatory narrative
- [`sheleg-design`](https://github.com/ssheleg/sheleg-design-skill) — Observatory visual system
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — shared-file claims
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — private readiness receipts
- `cloudflare` — static deployment — not a skill this family ships
