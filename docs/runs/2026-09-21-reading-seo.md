# Skills reading and SEO handoff

Objective: enrich the Observatory story and improve search/readability across both public sites.
[Task plan](../seo/plan-2026-09-21-reading.md) and [audit/evidence](../seo/audit-2026-09-21-reading.md) contain the bounded scope, decisions and checks.
Implementation and local verification are complete and integrated in main at
[8f76ad7](https://github.com/ssheleg/sshlg-skills/commit/8f76ad754c812519f8954f9bdbc6cc13f8dd0e1a).
The source PR is [150](https://github.com/ssheleg/sshlg-skills/pull/150).

Shared contract: canonical URLs remain stable, Skills is the family entry point, Harness is its
own section, Observatory is the observation project. Measured cleanup events are not unique keys
or proven theft. No package behavior or private workspace changes. Social drafts stay unpublished.

Local-only: credentials, raw account responses, private project identities, operational stores,
private denylist and machine configuration must never be committed or deployed.

Next task: for a future website edit, change the generator and relevant reader scenarios,
run the repository gate and let the exact main revision deploy through Pages. No package
release is needed for this website-only change. Search indexing and speed outcomes need
new external data; the audit documents the PageSpeed quota limitation.

## Delivery context

[Exact-source Pages run](https://github.com/ssheleg/sshlg-skills/actions/runs/35611252365).
The complete gate passes 88 suites and 1,031 fixtures with ten pinned members; the
server gate also exercises intentionally broken configurations. No member pins changed.
Fresh public checkout: all four relative links in the new plan/audit/handoff resolve.

The [central cross-repository index](https://github.com/ssheleg/project-observatory-open-source/blob/codex/observatory-reading-receipt/docs/runs/2026-09-21-reading-seo.md)
records Observatory source and deployment, shared contracts and actual skills used.
The source article is [0dca204](https://github.com/ssheleg/project-observatory-open-source/commit/0dca20438372c0359786327f2ddf98747dc44845).

## Production verification complete

[Receipt](../seo/evidence/production-2026-09-21.json): all 33 served files match the
exact GitHub Pages artifact; the unknown route returns 404. All 14 sitemap pages
retain one h1, self-canonical, parseable JSON-LD and complete preview metadata.
The Harness article link works; the production page was reviewed at 320px without
document overflow. No implementation or deployment task remains for this change.

Initial byte comparison against the local macOS build differed for fourteen PNGs.
Decoded pixels and image format match for all fourteen; compressed encoding differs.
The decisive comparison uses the actual Linux CI deployment artifact and passes
for every file. No image was replaced to hide a checksum difference.
