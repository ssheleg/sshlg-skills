# Skills: whole-site search and reading audit

Scope: 14 indexable URLs (home, Harness, Agents, Routing and ten packs), plus 404.
Source: `scripts/site.js`; [bounded plan](plan-2026-09-21-reading.md).

Baseline crawl already had self-canonicals, one h1, social cards, author entities
and real 404 handling. Preserve these rather than claiming they were missing.
The generator now adds large-image preview permission, the correct personal
profile URL for the author, a Harness breadcrumb and a descriptive link to the
Observatory origin story. Pack Open Graph type is website. Purpose precedes the
Harness relationship, repeated positioning is shortened and the redundant header
follow link is removed; the footer follow action remains.

All 14 generated indexable pages pass canonical/metadata/JSON-LD/anchor contracts.
The complete repository test run passes **88 suites, 1,031 fixtures, ten members**.
Member pins, launcher behavior, package version and skill doctrine are unchanged.
Harness and a representative pack were reviewed at 390px without overflow.

## Difference from the previous audit

The [27 August audit](audit-2026-08-27.md) had twelve inspected pages unknown to
Google. Current inspection reports twelve Skills pages indexed; the newer Harness
and xr-dev URLs remain unknown/not crawled. This is chronology, not proof of causality.
The registered sitemap has no reported errors or warnings. No bulk indexing request
was made. Production crawl and exact-revision Pages status belong in the delivery receipt.

The source tool still reports FIELD linked-content/read-budget heuristics on home,
agent-sync, make-skill and seo-aeo-audit. The seo-aeo-audit page has a CONFIRMED short
prose count (253 words in baseline); thinness alone does not establish poor usefulness.
Do not pad a focused one-skill page to satisfy an arbitrary word threshold. Its
purpose, commands, install action and source links remain extractable. The tool's
heuristics remain visible as limitations rather than being mislabeled as fixed bugs.
No unsupported directory-keyword or vendor-vulnerability claims were added.

## Method and limits

Measured on 2026-09-21. HTTP/HTML evidence covers all 16 indexable URLs across the
two sitemaps; source checks cover their generated/static counterparts. CONFIRMED
means observable markup/status, FIELD means a tool heuristic, and UNMEASURED
means no outcome evidence. No ranking, indexing or AI-citation improvement is claimed.

Google's [Article documentation](https://developers.google.com/search/docs/appearance/structured-data/article)
supports accurate article entities; [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features)
requires no special AI schema; [Discover guidance](https://developers.google.com/search/docs/appearance/google-discover)
explains large-image permission without promising inclusion. These are primary
references, checked during this revision.

Coverage: crawling/indexability, canonicals/sitemaps, titles/descriptions, headings,
static answer text, author/entity/structured-data relationships, social previews,
internal links, rendering and scoped accessibility. Full external backlink analysis,
conversion analytics and API/MCP distribution are outside this website change.
PageSpeed Insights returned HTTP 429: no new lab performance or field Core Web Vitals
result is claimed. Search Console inspection is a dated observation, not a crawl
request or forecast. Raw account responses, traffic analytics, credential material
and local configuration stay outside Git.
