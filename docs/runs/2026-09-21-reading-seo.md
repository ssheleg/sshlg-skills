# Skills reading and SEO handoff

Objective: enrich the Observatory story and improve search/readability across both public sites.
[Task plan](../seo/plan-2026-09-21-reading.md) and [audit/evidence](../seo/audit-2026-09-21-reading.md) contain the bounded scope, decisions and checks.
Implementation and local verification are complete. Release integration, exact-source deployment
and production verification are pending at this source commit; a delivery receipt will close them.

Shared contract: canonical URLs remain stable, Skills is the family entry point, Harness is its
own section, Observatory is the observation project. Measured cleanup events are not unique keys
or proven theft. No package behavior or private workspace changes. Social drafts stay unpublished.

Local-only: credentials, raw account responses, private project identities, operational stores,
private denylist and machine configuration must never be committed or deployed.

Next task: pass repository CI, integrate this branch under its existing policy, deploy and verify
all served routes; record source SHAs and deployment receipts in this handoff. Prerequisites are
existing authorized GitHub and hosting access; no new permissions are required.
