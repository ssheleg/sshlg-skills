## v1.3.6 — the ledger for the pass, and one hub stated everywhere

- `sheleg-design` advances to **1.52.0**. Its published catalogue no longer opens on a
  menu: the front door IS the pack gallery, behind a tab strip of three real screens
  (Designs, Audit, Method), each a URL of its own with its whole content in the HTML.
- That release also carries the machine layer the catalogue was missing — an `ItemList`
  of all thirty-six packs with per-pack anchors, one publisher node every page points at
  by `@id`, a 404 and a sitemap of only indexable screens — plus two defects the pass
  found in the pages it replaced: a page emitting its canonical twice, and a dark-field
  count that was wrong because the gallery could not parse `oklch()`.
- Two shipped packs were corrected in the same release, both for pairings no structural
  gate can see: a card that painted white on white inside an inverted section, and two
  focus rings that disappeared entirely in a browser without `color-mix()`.

- **`docs/evidence/verification.md` gains the SEO section this work owed it.** Thirteen
  rows, and three of them are corrections rather than shipments: the previous audit
  recorded Search Console as having *no credential* when the credential existed and the
  gates were a quota project plus a domain property; this pass shipped a stripper into the
  generator that bled a Russian keyword list into `/skills/seo-aeo-audit/` and caught it by
  asserting the shape of all 28 briefs rather than by reading them; and a finding raised at
  med-high — the umbrella's `skills.sh` 404 — was **retracted**, because the umbrella
  tracks no skills and a listing would advertise an install path that does not exist.
- The counted-claims registry refused the section before it could ship with the wrong
  arithmetic: `ledger rows` said 435 against a tree of 448. The pair is recomputed, which
  is the whole point of registering it.
- **`homepage` now names the same hub on every surface.** Nine of the ten packages sent an
  npm reader to GitHub and the tenth sent them to the site, while all ten GitHub
  repositories already declared `skills.sshlg.me`. `repository` still names the source and
  is unchanged. All ten targets were resolved before the field was written. **No member
  version moved for it** — the field only takes effect on publish, so it travels with each
  member's next release rather than justifying nine cut for one line.
- `task-pipeline` advances to the pin carrying the `skills.sh` badge, completing it across
  all nine members. Its own `validate` is 444 steps and took **1h18m**, which is why it
  landed a release behind the other eight.

**What v1.3.5 actually carried, stated here because its own notes did not.** That section
describes one style pack, and the tag swept up four commits nobody had written notes for:
the pack pages that began saying what each skill they ship does (prose share 35.2% → 41.8%
at worst, 58.6% → 76.1% at best, measured on the served HTML), the family traffic
instrument and its ledger, the 2026-08-27 audit and plan, and eight member pins. Two
sessions were releasing at once — the condition `docs/AGENT_SYNC.md` was written for — and
the tag won the race against the notes. Nothing shipped that should not have; the record of
*why* was simply thinner than the release. It is corrected by naming it rather than by
rewriting that section.

## v1.3.5 — the thirty-sixth style pack reaches the shelf

- `sheleg-design` advances to **1.51.1**, which adds `deskmate`: a warm beige
  field lit from one source above the top edge, one four-stop ramp doing three
  jobs, a 56px pill against 32px slabs, and a framed transcript whose quoted chat
  client keeps its own face, ink and status colours in a namespace of their own.
  For products sold as a colleague rather than a tool.
- The catalogue link on this shelf counts the packs from the member's own tree, so
  the number it advertises moves with the pin rather than with a hand-typed tally —
  36 now.
- `v1.51.0` of that member is a ghost tag: it was pushed before its branch, the
  member's release workflow refused it on reachability, and a `v*` tag cannot be
  moved there. Nothing was ever published under it; the pin names 1.51.1.

## v1.3.4 — the public shelf becomes one system

- Every member now opens with one promise, one install command and one concrete
  invocation; each also ships a root `SKILL-CARD.md`, schema-validated trigger
  and scenario fixtures, and a committed 1200×630 social card.
- The umbrella owns a shared public voice pack and generates version-independent
  social cards for all nine members. Its site test compares every committed card's
  decoded pixels with the generator output, remaining strict across zlib runtimes
  that legitimately encode those pixels with different bytes. A change to that
  gate now retriggers Pages, so repairing a failed page build cannot leave the
  corrected site undeployed.
- Member CI now runs the pinned make-skill house audit plus eval and social-card
  guards. The member pins advance to the nine patch releases carrying that
  contract.

## v1.3.3 — the two most quotable pages had an entity attached to nothing

With the walker repaired, the post-deploy probe reported what v1.3.2 could not
see: on `/agents/` and `/routing/` the publisher node stood alone. Their structured
data was a `FAQPage` and a `BreadcrumbList` — and a breadcrumb says where a page
sits, nothing about what it is or who stands behind it — so every content node on
the two pages an answer engine is likeliest to quote was **anonymous**, with a
`Person` beside it that nothing referenced.

`/routing/` now carries a `WebPage` node of its own, the `FAQPage` and the front
page's `ItemList` name their author, and all three reference the one `@id`.

**The fixture's own `refsSeen > 0` was counted for the whole site, so it was green
throughout.** One page with a reference satisfied it for all thirteen. Counted per
page now — and moving it inside the loop immediately found a third page,
`404.html`, which is the point of the change.

**The 404 is `noindex` now**, on its own merits: GitHub Pages serves it with a real
404 status, but a host serving that body with 200 during a migration would put a
page reading *"That page is not here"* into the index under the site's own name.
The authorship rule exempts it — keyed on the **declared** `noindex`, never on the
filename, because an exemption spelled `rel !== '404.html'` is a rule with a hole
named after one file and the next such page arrives unexamined. The exemption is
asserted to cover exactly one page.

Six plants across this version and the last, each watched failing. One of them
planted nothing on its first run and said so rather than counting as a pass — the
`assert` that the source actually changed is why.

## v1.3.2 — half of yesterday's fixture could not run, and the live page said so

v1.3.1 shipped a check asserting that every `Person` reference carries `@id` and
nothing else. **That half of it was unreachable.** A reference is `{"@id": …}` with
no `@type`, and the walker collected only nodes where `@type === 'Person'` — so it
never saw a single reference, and the id-match assertion was dead code. A wrong id
in an author reference would have passed.

Found by the live page, not by reading it: the post-deploy probe printed `refs=0`
on all five templates, which is impossible for a site that emits two references per
page. The count was the walker, not the site.

The walker now also collects the value of any `author`, `publisher`, `creator` or
`maintainer` key, and the check ends with `refsSeen > 0` — because without that line
it passes on a site emitting no references at all, which is exactly the state that
hid the defect. Three plants, each caught: a reference pointing at a **different**
person id (the one v1.3.1 could not see), a reference that re-describes the person,
and every reference deleted.

Two versions in a row where the finding was in the instrument rather than the
subject. That is now written into `docs/evidence/retro.md` as a standing
instruction: **a probe reporting zero is a claim about the probe until the probe has
been shown finding one.**

## v1.3.1 — the pass shipped the defect it was about, and the check that finds it did not exist

Post-deploy verification of v1.3.0 found **two `Person` nodes on the front page**
with no id linking them: the layout's publisher, plus an inline copy under
`WebSite.author` and another under `SoftwareApplication.author`. That is not one
entity stated twice — it is two candidates a consumer has to guess are the same,
which is precisely what v1.3.0 shipped to fix. One `@id` now
(`https://skills.sshlg.me/#person`); every other reference is `{"@id": …}` and
describes nothing.

**`test/site_test.js` had thirty checks and none of them parsed the structured
data.** That is why it shipped. Two fixtures now `JSON.parse` every `ld+json` block
on every built page and walk the objects: one asserts each page carries an
identified publisher, the other that exactly one node *describes* the person and
every other reference carries `@id` and nothing else. Both were watched failing
against planted defects before being kept — re-describing the person fails one,
removing the `@id` fails two.

**The instrument note, recorded because it is the more useful half.** The first
post-deploy check reported the entity missing from all four pages, and it was
wrong: the pattern had a space in `"@type": "Person"` and the served JSON is
minified. **The grep was broken, not the site.** A check that greps rendered HTML
for a formatted substring is testing the formatter — which is also why the new
fixtures parse rather than match. It re-opens yesterday's `faq-schema-partial`
disagreement as less certain than it was recorded: an instrument that disagreed
with a hand-check was resolved in the site's favour once today, and the cause was
the pattern.

## v1.3.0 — the page most likely to be quoted was the one saying least about itself

An audit of the live site, measured rather than recalled. Two leaks and one gain
shipped; one gain is written down and deliberately not taken.

**The author entity was on two of four templates.** `/` and `/skills/{slug}/`
carried it; `/agents/` and `/routing/` carried a `BreadcrumbList` and nothing else
— so the page that exists to answer *"does this run in my agent?"*, the one an
answer engine is likeliest to quote, told it nothing about who publishes it. The
`Person` node with its `sameAs` set is now emitted by the **layout**, which is the
only place a new template cannot arrive without it.

**`/agents/` repeated the front page's whole nine-card grid.** Its job is one
table; the trailing duplicate diluted it and cost 378 words of link text. Replaced
with a chip row and one link to the descriptions. Measured effect on the read
budget — the share of the first ~5700 characters that is content rather than link
markers, which is one engine's median window and so a `FIELD` tier finding:
**54.5% → 78.4%**, and the `high` severity is gone.

**The answers had no questions.** Five questions the page actually gets asked are
now visible text on it, and the `FAQPage` node is built **from the same array the
page renders** — markup over content a reader cannot see is the thing the audit
skill refuses, and building both from one source is what stops them drifting.

**`/` is still at 47.9% and that is on purpose.** The driver there is the same card
grid — but on the front page that grid *is* the page's job. Moving it below the
install block would trade an engine's first read against the reader's, which is a
content decision with a real cost, so `docs/seo/plan-2026-08-26.md` records it as
open with the two options rather than taking it unilaterally.

**One instrument disagreement, recorded rather than argued away.** `page_audit.py`
reports one of five declared answers as missing from the served body. Under the
rule the script documents — first 60 characters, collapsed, lowercased — all five
match, reproduced against the built file, and the page is 32 KB so truncation is
not the cause. The property that matters was verified independently and holds:
every marked-up question and answer appears verbatim in the body. The page was not
mutated further to satisfy an instrument whose disagreement could not be
reproduced.

`docs/seo/audit-2026-08-26.md` also names what could **not** be checked: no Search
Console, no second engine, no analytics, no crawl export — so orphans, click depth
and declared-vs-indexed are unknown, and nothing here claims an engine behaved
differently. Only that the page offers it more.

## v1.2.1 — the pin catches up with what the run printed

`task-pipeline` **1.77.0 → 1.78.0**, published and serving. The member release
removed a person's name from the two lines the pipeline prints at run time — the
banner before its first question and the sign-off — and put the repository and the
site in the sign-off instead. Its flow diagram also reads top to bottom now and
carries a linear-curve directive, because GitHub's mermaid was failing the two long
dotted returns with *"could not find a suitable point for the given distance"*.

**The pin moved only after the registry served it, by identity rather than by
recency.** A watch on `--limit 1` answers about whatever finished last, which is
standing instruction #9 and the reason this one polled the run for its own tag and
then read `dist-tags.latest` from the registry directly.

## v1.2.0 — the site is built from one of the packs it sells

The design was decided by `sheleg-design`, not by taste, and the pack it picked is
**`workbench`** — its token layer copied verbatim from `tokens/workbench.css` and
consumed as `var(--…)`. Measured after the change: **18 hex values in the
generator's CSS, 18 of them inside a token declaration, 0 ad-hoc.** That is the
craft bar's first rule, and it is now checkable rather than claimed.

**The pack whose register matched was refused, on its own words.** `field-notes` is
for *"an open-source or developer product sold on auditability"*, which is this
family's entire pitch. Its palette section also says the dawn gradient has no dark
twin and **"do not ship the hero in dark"** — and this site is dark. The register
lost to the constraint, and the `sheleg-design` page now says so in public.

Seven weaknesses were named from a screenshot of the live page before anything was
touched, and each has a fix that can be pointed at:

- **the right 40% of the viewport was empty at every width** → the hero is a two-column
  grid, and the right column is the **signature element**: the commands that prove
  what the page claims, opposite the claim. `workbench` is the `core` contract and
  declines `## Signature element`, so that is authored and declared, not inherited.
- **`--bg` and `--surface` were one value apart** (`#0e0f11` / `#141519`) → the pack's
  three-step ladder `#0f1218 / #161b24 / #1b212c` separates the sections without the
  hairlines doing all the work.
- **nine identical cards** → differentiated by structure and a word — each card's foot
  names the route it owns, `/task-pipeline`, in mono. Not by hue: the pack bans a
  semantic colour used decoratively, and the amber role line was exactly that.
- **the strongest claim looked like the weakest** → `0` dependencies takes `--ok`,
  which is a *state*, not decoration.
- **card copy ended mid-phrase** — *"every distribution…"*, *"with fallback and…"* →
  the cap now prefers a sentence boundary and never ends on a dangling conjunction.

**Amber came back in through the side door and was removed again.** Mapping the social
card's palette onto the token layer put the eyebrow on `--warn`, which is the pack's
banned use. `--warn` is now absent from the card generator entirely, so it has no way in.

The `sheleg-design` page shows the eight tokens this page consumes, and states both
decisions the `core` contract required saying out loud.

Rendered at 1440, 768 and 390 before shipping. The 390 shot appeared to overflow; a
real engine measured `scrollWidth` 390 against a 390 viewport with zero overflowing
elements — the screenshot path was wrong, not the CSS, which is standing instruction
#11 doing its job.

## v1.1.0 — a page that answers "will this run in my agent?"

The one question a reader arrives with had no page. `/agents/` answers it: every
named agent, the channel the skills reach it through, **the path that agent
actually reads**, and the thing worth knowing about each — because "it did not
show up" is nearly always a path question.

Fourteen agents named, and the roster is **data in `skills.json`**, not a table
typed into a template: a hand-kept list is the first thing to go stale when the
launcher's default set changes, and the site already learned that lesson from a
pack count it wrote by hand.

**DeepSeek Harness gets its own section**, because it is the one that surprises
people: nothing to install beyond the ordinary command and no plugin to write, the
two commands that establish it rather than assert it, the six discovery roots with
their ranks, and the consequence nobody expects — a project-local `.dsh/skills`
**outranks** the installed copy, which is the same shadowing trap Claude Code has.

The page carries its own social card, is in the sitemap and the navigation, and
`llms.txt` gained an agents section, since "which agents support this" is exactly
the question an answer engine gets asked.

## v1.0.2 — sheleg-design 1.50.0

`onionskin`, the thirty-fifth pack: two bases where everything quiet is an alpha of one,
so the pack ships no grey ramp at all — and at 96.5% zero radius, the squarest page in
the library.

## v1.0.1 — the pin guard called a tagged commit collectable, in the one job that clones shallow

The v1.0.0 release went red on its own structural validator while the identical
check passed in `validate`. Two causes, both in the guard rather than in the
tree:

- **A tag is a permanent ref and the guard did not count one.** It read
  `refs/heads` and `refs/remotes` only, so `telegram-dev` pinned at its own
  `v0.1.3` looked reachable from nothing — correct by the letter, wrong by the
  reason it states, which is collectability. `refs/tags` is in the list now, and
  the CI plant reads the same three namespaces so it cannot claim a plant failed
  to land for a commit the guard would rightly accept.
- **A shallow clone cannot answer the question at all.** `release.yml` clones
  submodules at depth 1 and `validate.yml` at depth 0, which is exactly why one
  job failed and the other passed on the same commit: with no history fetched,
  no ref can be shown to contain HEAD and every pin looks orphaned. That case now
  discloses instead of failing — a check that cannot look must not read as one
  that looked.

The plant still refuses the real defect: an empty commit on a detached HEAD held
by no branch, no remote and no tag is rejected, watched locally before this
shipped.

## v1.0.0 — the family runs in DeepSeek Harness, and it needed no plugin

`dsh` reads the Agent Skills standard directly. Its local provider scans
`<agentsHome>/skills` at **rank 500** — which is `~/.agents/skills`, the
directory the vercel skills CLI has been installing this family into since the
first release. Verified on this machine on 2026-08-25:
`~/.agents/skills/<name>/SKILL.md` resolves with its `references/` and
`fixtures/` beside it, for all 28 skills — and the subsystem that reads them is
in the harness's **default** profile rather than an optional add-on:
`dsh --profile web --dump-default-config` lists `@deepseek-ai/dsh-skill`,
`dsh-skill-filesystem` and `dsh-tool-skill`. **Nothing was built. The work was
finding out that nothing needed to be, and then proving it twice.**

What is recorded rather than assumed, from the harness's own skills-subsystem
document read the same day:

- **Discovery is layered and nearest-wins:** `<projectRoot>/.dsh/skills` (100),
  `<projectRoot>/.agents/skills` (200), `customSkillDirs` (300),
  `<dshHome>/skills` (400), `<agentsHome>/skills` (500), bundled (600). A
  project-local copy **overrides** the installed one — the same shadowing trap
  Claude Code has, and the same remedy this repository already automates: one
  channel per skill.
- **`disable-model-invocation` and `user-invocable`** are the two front-matter
  keys it reads, both defaulting to `true`. This family ships neither, so every
  skill is model- and user-invocable there without a change.

**A skill is not a `dsh` plugin, and the README says so.** In that harness a
plugin is a Cordis module exporting `apply(ctx)`; skills are loaded *by* one,
`dsh-skill-filesystem`. All ten repositories now carry the **`dsh-plugin`**
topic, which is the discovery channel the project asks for, and **`dsh-skill`**,
which is what they actually are — 11 651 repositories carry the first and 119
the second, so the accurate tag is also the one nobody would find them under
alone.

The version is 1.0.0 because the claim on the tin is now true everywhere it is
made: nine members, twelve routers, four instruction files, a public site and
two harnesses that load the same directory.

## v0.99.0 — a ninth member: Telegram, split by the API each surface speaks

`telegram-dev` v0.1.1, three skills. Telegram is three products behind one brand
and the expensive mistakes come from treating them as one, so the pack draws the
line first and puts each seam on the correct side of it.

- **`telegram-bots`** — the official HTTP Bot API. `update_id` is the only
  idempotency key an update carries, and a webhook retry, a poller redelivery or
  a crash between "work done" and "offset confirmed" all produce the same event
  twice. Measured across eight live Telegram bots on this machine on 2026-08-25:
  **zero of eight deduplicate on it.** Also the `allowed_updates` default that
  subscribes you to everything *except* `chat_member` and the two reaction types
  while answering `ok: true`, and Telegram Stars, where `answerPreCheckoutQuery`
  has **ten seconds** and the grant belongs to `successful_payment`.
- **`telegram-userbots`** — MTProto and Telethon. A session file is a logged-in
  person: full access, no password, no 2FA prompt, and an account that can be
  banned in a way a token cannot. The skill opens with whether a user account is
  needed at all, because a 21 MB file is a local Bot API server rather than a
  permanent liability. Measured here: **three of six** Telethon projects handle
  `FloodWaitError`; five of five gitignore the session and none has one tracked.
- **`telegram-miniapps`** — the web layer, whose entire security model is one
  signed query string. The verification algorithm ships as a **runnable fixture**
  with nine checks that watch it refuse a tampered user id, a stale `auth_date`,
  a re-serialised `user` field and a key derivation applied backwards.

The twelfth router carries it, and the trigger table can name it — a member in
the map and not in the routes is how `agent-stack` went five days unrouted, and
`test/route_coverage.js` exists because of that.

**A count typed by hand goes stale on the ninth member.** Every member README
said "all 8 skills"; the number is gone rather than corrected, in all nine.

**The plant sweep had a hole, and the ninth member found it.**
`test/advertised_plants.py` removed the phrase case-sensitively, and
`telegram-dev`'s description says *"auditing a Telegram bot"* in prose while
listing `"telegram bot"` as a trigger. The quoted one went, the prose one stayed,
the member's guard correctly reported the phrase as still advertised — and the
sweep read that as the guard failing to fire. It now removes every occurrence
regardless of case, which also moved which trigger two other members are planted
with. Nine of nine refuse the drop.

Ratchet: 38 suites, 662 → 667 fixtures, 8 → 9 pinned members.

## v0.98.1 — the site has its own address

`skills.sshlg.me`. A `CNAME` to `ssheleg.github.io`, deliberately **DNS-only**: GitHub
issues the certificate by resolving the name itself, and an orange-cloud proxy in front of
Pages' enforced HTTPS is the documented way to get a redirect loop. Certificate approved,
HTTPS enforced, the old `ssheleg.github.io/sshlg-skills` URLs redirect.

**The host is one constant, and the base path is derived from it.** `scripts/site.js`
computes `BASE` from `SITE` — `/` on a custom domain, `/<repo>/` on a `github.io` project
site — because the 404 page is the only page that cannot use relative links, and a
hardcoded `/sshlg-skills/` there turns a working 404 into a 404 with dead links the day
the domain moves. That is now a fixture rather than a comment: the 404's links must start
at the base `SITE` implies, whatever `SITE` says.

Eight member READMEs and nine repository homepages follow. A redirect is a fact about
today; a link is a promise.

## v0.98.0 — the family gets a front door, built from its own manifest

Eight skill packs with nothing a person could read without cloning a repository. There is
now a site — one page per member, one page carrying every routing rule verbatim, an
`llms.txt` for the machines that will quote it, and the two calls to action that were
missing everywhere: follow the author on X in one click, and get the packs on GitHub.

**It restates nothing.** `scripts/site.js` renders `skills.json` and
`lib/routers-registry.js` — the same two files the launcher and the operator's routing
block are generated from. A version, an install identifier, a routing rule, a refusal
phrase: read at build time or not on the page at all. A site that retyped any of it would
be the ninth home of a fact this repository already keeps in one place, and the ninth home
is the one that goes stale.

**It is never committed.** `.github/workflows/pages.yml` gates on the whole `validate`
suite through `workflow_call`, then builds and deploys. A generated page in git drifts
from the data it claims to render; a page built from the tree cannot. The workflow reads
the artifact twice more before it ships — every internal address must resolve in the bytes
being uploaded, and nothing may be fetched from another host, because "no services, no
telemetry, no API keys" is the pack's own claim and a CDN on that page refutes it.

`test/site_test.js` — 28 fixtures, the 37th suite — is the half that runs here. It builds
into a temp directory and fails when a page states a version `skills.json` does not pin,
when an internal link does not resolve, when a page hands a reader a launcher command
`bin/sshlg-skills.js` does not dispatch (`doctor` reads exactly like the real ones and
exits 2), when a copyable command exists only inside its Copy button, when a follow
control has no working `href` for a reader with JS off, or when the build is not
byte-identical twice from the same tree.

**The follow button is an enhancement, not a requirement.** The anchor carries the real
`x.com/intent/follow` URL, so with JS off, on a narrow screen, or with the popup blocked,
the click is an ordinary navigation and the dialog still opens. The popup only wins when
`window.open` actually returned a window — `preventDefault` is conditional on it — and
`original_referer` is added in the browser, because only the browser knows which page the
reader clicked from.

**Pinned with this release:** `sheleg-dev` **0.9.2 → 0.10.0**, published and tagged — the
cancel-flow save offer. Stripe's customer portal shows a coupon card when the session
carries `flow_data[subscription_cancel][retention]`, and two things about it are money: a
`duration=once` discount is removed from `subscription.discounts` the moment its invoice
finalizes, so asking Stripe whether this customer was already discounted answers no every
cycle; and under flexible `billing_mode` a portal cancellation sets `cancel_at` and leaves
`cancel_at_period_end` false, so a banner reading that boolean tells a customer who
cancelled ten seconds ago that their plan renews.

**A count on a published page is derived, and derived from the right files.** An
`extraLink` label may carry `{n}` with a `countGlob` and a `countExclude`;
`scripts/site.js` counts the member's own tree at build time and refuses to build when it
cannot. Three readings were needed to get one number right: the label said **34** by hand,
the naive glob counted **35**, and the directory holds the template a pack is written from
beside the packs. Only reading the two published pages against each other showed it.

Ratchet: 36 → 38 suites, 620 → 662 fixtures.

## v0.97.0 — a README may name a command, not claim one

Seven members move together, and one new guard holds the reason.

Measured against the published tarballs on 2026-08-25: `task-pipeline-skill` and
`@ssheleg/agent-sync` both told a reader to run `npm test`, and neither ships a `test/`
directory — `npm pack` lists 96 and 32 files with nothing under it. Six of the eight members
presented such a command in a fenced block. So this family's own dead-address rule was being
broken inside its own distribution, by the documents that state the rule.

Shipping the suite does not fix it: the plants live in `.github/workflows/`, and no packaging
npm can express puts a workflow in a tarball. The READMEs name where the command runs instead,
beside a marker, and `check_a_shipped_readme_does_not_claim_a_command_the_package_cannot_run`
refuses a member that claims one without it. Scoped to fenced blocks deliberately —
`make-skill` and `super-ux` describe `test/validate.py` and ask nobody to run it, and a guard
that fires on correct documents teaches a team to satisfy it without reading why. Watched
failing with the marker stripped from `agent-stack`.

What the members carry with them:

- **agent-sync 1.17.0** — the SessionStart hook had never once established a session identity:
  it required the id in its ENVIRONMENT while Claude Code delivers it on stdin as JSON. So the
  `shared` fallback that makes an expired lease unattributable was not a fallback, it was the
  only path. Also: the ledger's own guard demanded every dated row quote the CURRENT version,
  so each release rewrote history to satisfy it — two rows restored from git.
- **task-pipeline 1.77.0** — a version MENTIONED in the release-gap section counted as a
  declaration that the release carries no stamp. Declarations are bold now.
- **make-skill 0.23.1, seo-aeo-audit 0.25.1, agent-stack 0.13.2** — the residue scan read the
  shared `$TMPDIR` by prefix, so another session's trees and an earlier run's deliberately kept
  evidence both read as this run's leak.
- **sheleg-design 1.49.1, sheleg-dev 0.9.2** — the README scope statement.

Guards: 27 → **28**.

## v0.96.4 — sheleg-design 1.49.0, and sheleg-dev's half-landed release completed

`rimlight`, the thirty-fourth pack: elevation made of coloured light rather than
shadow — a sixteen-layer rig, six layers lit and ten held at alpha 0 — measured off a
design studio's own service page.

**`sheleg-dev` was pinned at 0.8.0 with its submodule at v0.9.1**, so a released
version carrying a whole new skill (`error-tracking`) was invisible to `list`, to
`update` and to the family table — which is the exact failure the catalogue rule
exists to prevent. Pin, submodule, `skillNames` and the README row now agree at 0.9.1.

**And `check_desc_moves_with_skills` was asserting a proxy rather than its own
intent.** It compared `desc` against `HEAD~1` and failed when `skillNames` moved while
`desc` did not — which is wrong whenever the two halves land in different commits, as
they did here: the desc gained "Sentry error tracking" in one commit and the skill name
followed in the next, with the registry correct at every step. It now asserts the
property it wants — every newly added skill is **named** in the description — and the
`desc unchanged` escape is gone, because a desc that moved without naming the new skill
is the same defect wearing an edit. Verified by planting: strip the mention and keep the
name, and it fires.

## v0.96.3 — sheleg-design 1.48.1

The assembly rule for adding a style pack is now written where each part already
lives — `STYLE_PACK_TEMPLATE.md` rules 7 and 8, both shipping inside the bundle, and
`CONTRIBUTING.md` step 8, the browser render. That step caught a defect within the
hour of being written, which is the argument for having it.

## v0.96.2 — the pin moves because the published document was wrong

`task-pipeline` 1.76.1. Nothing in the skill changed: the README it publishes put
its reference count at twenty-three where the tarball shipped 36, and the figure
had been wrong since the `1.76.0` tag. npm served it; a checkout of this umbrella,
whose pin points at the branch tip, served the true one. One version string, two
documents — the class this family calls defect (1), and the only way to see it is
to compare trees, because `npm view` answers the same number for both.

Found by a sweep of all eight members: five had commits after their tag, and for
four of them nothing a channel serves had changed. Naming that difference is why
the sweep is worth running — a tag that has moved is not automatically a divergence.

Verified on the artefact rather than the repository:

    published README                      all 36 references
    references in that same tarball       36

## v0.96.1 — sheleg-design 1.48.0, the thirty-third pack

`sheleg-design` moved 1.47.0 → **1.48.0**: `nameplate`, extracted from
`brandpush.co` — a page square on 87% of its rendered elements where the one round
shape is a white bordered plate carrying somebody else's publication name as type.

Pinned here because a release this catalogue does not name is a release nobody
installs: `npx sshlg-skills list` reports what `skills.json` says, not what npm
holds. Submodule pointer moved to `v1.48.0`, the README row carries the same number,
and all three agree — which is what the validator compares.

## v0.96.0 — the conformance register closes, and every row closed by measurement

**47 active rows, 0 open, 47 verified.** The register that has tracked this family
against the Proof of Done manifesto since 2026-08-18 is empty of open work, and
not one row closed on an argument.

**Thirteen rows closed in one pass, and none was what its row described.**

* The register **could not be parsed by anything** — three parsers pointed at it
  produced three answers. The header declared six columns while ten rows carried
  seven, because a verdict cell was added on verification and the header never
  gained it, so every reader of `state` got `done when`. Two rows carried genuine
  unescaped pipes, and `_one_board` — the guard written for exactly that — had an
  id shape of `[A-Z]{1,3}` and could not see `ALL-49`, the one row in the family
  with three of them.
* **A guard was mandating the rotting form.** All fourteen citations into the
  manifesto had gone dead — eight off by twenty lines, one by fifty, one pointing
  at a closing code fence since the day it was written — while every rule they
  named was intact. The check that policed them *required* `manifesto.md:<line>`.
* `SE-04`'s scalar was on **eight** live surfaces, not four; the row said four
  because the earlier sweep grepped `plugins/` alone.
* `ALL-49` was 160 temp trees a run and 0 removed — and the leak was never the
  defect. Nothing said so, which is what would have made the next leak invisible
  identically.
* `PM-07` needed a registry `CLAIMS` could not express: a permalink at a fixed SHA
  has no current state, so what rots is the figure moving while the link stays.

**Five rows had closed on the day they were filed** and the register never said so.
**Two carried stale numbers that were the auditor's, not the register's** — a
historical paragraph read as a live claim. **One dependency I filed was wrong**:
`ALL-26` did not need 36 CI steps wired, because the runner decides landing
centrally, and the measurement said so after I had refused to push the diff.

**And `ALL-44` closed because it happened.** The family's structural weakness —
nine repositories, overlapping doctrine, aligned by whoever happens to look — was
a sentence for six days. One runner copied into two members met three vocabularies
for "this plant behaved" (`OK:`, `ok:`, `rejected, as it must be`) and reported
**twenty healthy guards as broken**, invisibly, because the assumption was never
written down. `check_a_copied_mechanism_declares_its_divergence` now refuses an
undeclared difference across 19 copies of 5 mechanisms — and refuses a declared one
that is not real. It does not compare texts: copies are allowed to differ, and
demanding otherwise would either freeze the family or be ignored.

**The first tag of this release failed CI, on the check this release adds, over a
file this release annotated.** The umbrella's own `test/plant_guard_test.py` and
`test/residue_test.py` carried the declaration in the working tree and not in the
commit: the release staged files by name and missed two. My local gate read the
working tree; CI read the commit. That is standing instruction #10 — *a check that
reads a working tree reports a state no clone can reproduce* — arriving on the
release of the guard whose whole subject is an undeclared seam.

Nothing shipped: npm stayed at 0.95.0 and no GitHub release object exists, so the
tag was re-cut rather than superseded.

Pins: `agent-sync` 1.15.0 -> **1.16.0**, which closes one version string over two
trees — npm served 4344 lines where the marketplace served 4575 and all three
channels said 1.15.0. Re-measured after publication: 4575 and 4575.
`seo-aeo-audit` 0.25.0, `agent-stack` 0.13.1, `task-pipeline` at 1.76.0.

## v0.95.0 — the eleventh router, and the question none of the ten answered

**`project-audit` joins the routing block**, requiring `task-pipeline` — the
same shape `copywriting` has had against `super-ux` since v0.31.0. It answers
*what is actually true of this project right now*, which is the question an
operator has when they open a repository they have not touched for a month and
which none of the ten existing routers takes: `task-pipeline` owns how a change
reaches the repository, and this owns the diagnosis before any change is
proposed.

**The refusal phrase is «без диагностики», not «без аудита», and the reason is a
constraint rather than a preference.** `аудит` is `task-pipeline`'s own trigger —
kept deliberately after B-82 re-derived the premise and found the prediction
correct — and `triggers_test.js` refuses any refusal phrase that contains a
trigger, because saying it would fire the hook it exists to silence. Every
phrasing built on the word collides, so the router declines by the other name its
own text uses. Verified against the live hook: `optedOut=true`, `routes=[]`.

**Triggers are phrases, never the bare word.** `проаудируй проект` reaches
`project-audit` alone; `аудит проекта` reaches both, which is right — the work
changes the repository *and* its subject is the whole project, and
`route_coverage.js` has said since v0.71.0 that the hook may name more than one
craft for one prompt. Six cases join that file and all six hit.

**Ratchets 615 → 620**, recounted by `npm test` rather than carried: five
fixtures and no new suite, because `project-audit`'s own 43 cases are a gate in
`task-pipeline`, where the code they exercise ships.

`skills.json` declares the third skill and its `desc` moved in the same commit —
B-48's co-edit guard refuses one without the other, and it fired here.

## v0.94.0 — 2026-08-22 — a reference with no tokens, and the three layers a media query cannot reach

`sheleg-design` **1.47.0**. The library's thirty-second style pack, `patchbay`, read off
<https://nautilustrader.io/> — and the first one whose reference **declares no CSS custom
properties at all**. It is Material UI with Emotion, so there was no token layer to lift and
every value was read off a painted element with `getComputedStyle`.

**Named for its register, not its source.** ADR-0001 has required that since the seventh pack and
requires answering such a request by pointing at the ADR before writing a file. `schematic` was
rejected for colliding with `blueprint` in the drawing-name family, `switchboard` for the
`scoreboard` suffix, `engine-room` for being a good metaphor for one product and a bad one for
the register. The same commit records that the ADR was **broken twice** — `outrank` and
`babylove` both shipped under their source brands on 2026-08-21 with no entry — and renames
neither, because the ADR's own Consequences make a pack name a public API across four channels.

**The signature is measured, not admired.** 21 cords carrying 32 particles, distributed 12 / 7 /
2 at one, two and three particles each, and every multi-particle cord divides its own period
**evenly**: seven pairs at exactly half (1.25s on a 2.5s cord) and both triples at a third. Cords
start 0.1s apart, so the board has no visible beginning. Each is an inline `<svg>` driven by
`<animateMotion>` — no JavaScript, no library, one element per dot.

### The finding that left the pack and became doctrine

`MOTION_DOCTRINE.md` §9 said an animation without a reduced-motion path is a bug and stopped
there. The usual remedy is one rule that zeroes every duration, and this page demonstrates
**three layers it cannot reach**, all three live on it at once:

- **SMIL.** `<animateMotion>` is not a CSS animation and does not read `animation-duration`. All
  32 particles keep moving with the preference on. `pauseAnimations()` is the fix and has to be
  wired by hand.
- **Script.** The reveal writes `opacity` and `transform` inline per scroll frame across 48
  wrappers, so zeroing durations only makes the hidden state arrive faster — with the preference
  on the content is still hidden until scrolled.
- **A loop that does not end where it began.** Collapsing to `.01ms` jumps to the final keyframe.
  It is safe on this page only because all four ambient loops are written `0%` == `100%`.

**The query is a signal, not a mechanism.**

### Three corrections and three stale numbers

The reference paints two muted greys and only one is legible — 4.86:1 against **3.23:1** — and
there is no room for a corrected third step, so the pack ships one tier and says which token
replaces the other in each of its two uses. Its diagram group labels are **2.70:1**, corrected to
a value already on its own ladder at 5.19:1. The derived status set had to clear a constraint
most packs never meet: the accent is a mint-cyan, so `instrument-console`'s green separates from
it by **3.51** under simulated CVD against a floor of 8.

Beside the change, three numbers were already stale and none was that run's regression — a count
that named no noun (`the twenty-nine are`, over thirty-one), `sixteen` role declarations against
a tree of nineteen, and `ten` theme twins against a derived eleven. The widened remainder in
`SKILL.md` went stale for the **third consecutive release**, and the gate written for exactly
that caught it.

## v0.93.0 — 2026-08-22 — the day's findings become doctrine, and one of them fails on its own release

`task-pipeline` **1.75.0**. Nothing new ships behind a flag: what ships is the doctrine the
previous release earned, written where the next run reads it.

**`documentation.md` canon 2 gains its dual.** *Numbers are computed, never restated* had a
half nobody had written down — **an example that instantiates a number IS one.** A release note
explaining that a count was written in the wrong shape, with the digits in it, places a second
readable count in a section a gate reads: the probe removes the real one, the narrative still
matches, the guard reports green over a section that states nothing. Measured three times in one
hour, each time inside prose about this very failure. The umbrella already said it for commands.

**`gates.md` gains three sections** — probe rot (an anchor pinned to a literal the guarded thing
moves; a precondition inherited from the tree that evaporates *when the system works correctly*),
ratchet pricing (assert once per subject examined, not once per exception, or the correct
remediation lowers the count), and the local-suite rule, which is also standing instruction
**R-010**.

### And R-010 failed on its own release

The local suite was green and CI was not. One precondition asked `os.path.isdir(".git")`, and in
a **submodule** checkout `.git` is a file holding a gitdir pointer — so the release-gap check had
been switching itself off in the only checkout this family is developed in, since the day it was
written, with no line of output. It ran in CI alone.

The class was already recorded **twice** in that repository, both times naming that same wrong
question, and this instance was missed both times. Knowing a class is not sweeping it — which is
standing instruction R-003, also already in force.

Two fixes, the second general: ask `exists`, never `isdir`, of anything named `.git`; and **a
precondition that fails must disclose rather than skip.** A check guarded by a bare `and`
evaporates without output, and it evaporates most reliably in the environment its authors use.
R-010 now carries the half it learned by failing: a green local suite is not evidence until you
know which checks looked.


## v0.92.0 — 2026-08-22 — three members ship, and the release itself was the sharpest instrument

`sheleg-design` **1.46.0**, `super-ux` **0.48.0**, `task-pipeline` **1.74.0**. Three days of
work reaches an installed agent, and the three tags took four CI rounds between them — every
refusal correct, and two of them naming defects nothing else could have found.

### What shipped

**A three-tier certification for `task-pipeline`.** A node is closed by three independent
readings at escalating visibility — the changed code, everything that can reach it, and the
product around it — dispatched blind and in parallel, all three required to pass. `close`'s
contract is unchanged; what changed is that the verdict is assembled from three readings at
different distances instead of written from one. Its **first live dispatch found five `breaks`
in work that had shipped green through a single verdict hours earlier**, including a gate that
matched durations by name and missed thirteen tokens, and a ratchet that priced exceptions
rather than the rule.

**Two production references, measured and packed.** `outrank` and `babylove` are the same
product category in the same year and answer *how much system do you need* with **536 custom
properties over two borrowed design systems** and with **seven over Tailwind's defaults**. The
library carries both ends priced. Six corrections between them, each the smallest the rule
permits — including a brand orange that fails as text in both directions, on a site whose own
hero CTA is black for exactly that reason.

**Twenty-six practices** in `super-ux`: dashboards (BP-216..227), the long SaaS landing measured
end to end (BP-228..234), and products whose value takes months (BP-235..241). Three older
entries now say where they stop, because a newer practice that quietly disagrees with an older
one leaves an auditor applying whichever they read first.

### What the release found that the work did not

* **A `with:` key had leaked into `release.yml`'s script block.** `fetch-depth: 0` sat inside a
  `run:`, where bash tried to execute it and exited 127 — after the ancestry check it followed
  had already passed. It parses perfectly as YAML, which is why nothing saw it.
* **A tag with no run stamp is a release the cold-retirement trigger cannot count**, and only
  the tag run can catch it: `validate.yml` ignores tag pushes, so a branch run cannot see a tag
  that does not exist yet. Writing the stamp then hit the ten-stamp cap and taught the table's
  ordering the hard way — newest-first, so appending put the newest where the oldest belongs.
* **`NUMBER_WORDS` stopped at thirty, and a second copy of it stopped there too.** At the
  thirty-first pack the first turned every count check red, loudly and correctly, and the second
  **went quiet on exactly the sentence it exists for**.

Nothing here was found by reading. Each came from pushing a tag and reading the verdict.
## v0.91.0 — 2026-08-20 — the truth pass: nine repositories, and the gates that were green over nothing

Every member moves at once, because a family that ships one member at a time is a family
whose combination nobody tested. This release carries a pass whose subject was **checks that
reported green over something they had never read** — found by asking, per repository, what
it asserts that nothing recomputes.

**In this repository.** The commit gate could be walked past by `git add -A && git commit`:
ownership was decided by asking the index at PreToolUse, before the command ran, so nothing
was staged at decision time and the suite never spawned. Reproduced, then refused across
three compound spellings. The route gate had been silent for six days, because `runOpen` read
*the file exists* where the ledger said `stage: 10 acceptance — verdict pass`. Four numbers
this repository stated about itself were false — 20 plants against 25, 119/113 ledger rows
against 419/413, 32 register rows against 42, 32 suites / 562 fixtures against 36 / 615 — and
a registry recomputes all six now, with a pattern that matches nothing FAILING rather than
passing. A submodule detached on a commit no ref holds is an error, not a disclosure. All
nine newest tags were lightweight, so `git submodule status` named every member at its
previous version; the release refuses a non-annotated tag at the one moment the fact is
decidable. And 2536 temp trees on this machine came from suites that said nothing about what
they left.

**In the members.** An assertion could be neutered while the money self-test printed *"each
watched failing"* with exit 0 — including the PII guard a reference advertises by name
(`sheleg-dev`). A made-up public figure passed the check that exists to catch it, because the
sourced corpus was one concatenated string and any substring of it counted (`super-ux`).
Eleven documented facts were false while the gate was green (`seo-aeo-audit`). Four style
packs contradicted the token layers shipped beside them, and six new sweeps found 24 more on
their first run (`sheleg-design`). An audit refused a score and computed one, with a formula
where `3 × 1 / 3` and `1 × 1 / 1` both print 1 (`agent-stack`). A claim tag could outlive its
lease with no command able to reach it — GitHub issue #5 (`agent-sync`). A ledger said
*unshipped* over its own release commit (`make-skill`). And the claim class registered for
*exactly* the incident it was written for printed `dormant` while the false number shipped in
three surfaces (`task-pipeline`).

**Pins, all eight bumped:**

| member | version |
|---|---|
| `super-ux` | 0.46.0 | 
| `task-pipeline` | 1.73.0 | 
| `agent-sync` | 1.15.0 | 
| `make-skill` | 0.23.0 | 
| `sheleg-design` | 1.45.0 | 
| `seo-aeo-audit` | 0.24.0 | 
| `sheleg-dev` | 0.8.0 | 
| `agent-stack` | 0.13.0 | 

**Found by releasing, not by reading.** Four members' guards made their own version-bump
commit impossible — a release cannot exist before the commit that bumps to it — so *ahead of
the newest tag* is a disclosure now and only *behind* it fails. A tag push could cancel its
own release through a shared concurrency group, skipping the publish while the run list
showed a green validate beside it; measured live, `tags-ignore` in three members. Two plants
were pinned to the literal of the fact they measure, so they stopped landing on every release
— a plant that does not land is a check nobody ran, reported green.

`npm test` → 36 suites, 615 fixtures, exit 0. Program register: 33 verified · 11 open, from
19 · 21 at the start of the pass.

## v0.90.0 — the conformance release: eight members, one manifesto, and what the audit could not see

Every member moves at once, because a family that ships one member at a time is a family
whose combination nobody tested. This release carries the result of auditing all nine
packs against the **Proof of Done manifesto** — 61 requirements extracted from the
document, one auditor per member, then a programme of 44 rows to close what the audit
found.

| member | version | what it closed |
|---|---|---|
| `task-pipeline` | 1.72.0 | a node states its own completion check — the last of four gaps the manifesto named against this family |
| `super-ux` | 0.45.0 | the requirement layer can finally see a requirement with no observable; a shipped scenario stops counting as a validated one |
| `sheleg-dev` | 0.7.0 | the security document stopped describing a different skill; a credential boundary; a manual gate that refuses; money invariants as fixtures |
| `seo-aeo-audit` | 0.23.0 | the report can separate `pass` from *never looked*, and every payload says which run produced it |
| `sheleg-design` | 1.44.0 | *degrade to calm* gained an observable; a hyphenated count is no longer invisible to the gate that counts it |
| `agent-stack` | 0.12.0 | three places the pack disagreed with the manifesto it is built on |
| `agent-sync` | 1.14.0 | expiry ended a lease and left the file, and every reader folded that away |
| `make-skill` | 0.22.0 | the gate left 47 MB in `$TMPDIR` and never said what it left |

### What the audit measured

Nine members, 61 requirements, `path:line` evidence. The family scored strongest on the
manifesto's hardest requirement — *the checker needs proof too*, 7 of 9 members enforcing
it with planted defects — and weakest on its cheapest: stamping a policy version, labelling
a judgment as judgment. **Depth was bought; bookkeeping was not.**

### What only running it could find

Eight rows came from executing the programme rather than reading the code. The repository
gate is bypassable by `add`-then-commit, because it decides ownership from the index
*before* the command fills it — and deadlocks submodule commits when the index is dirty, a
regression of a defect the retrospective already records as fixed. A close was nearly
garbage-collected on a detached HEAD. Residue is 6 leak sites and 5.4 GB. **Nine
repositories share doctrine and nothing checks that they agree.** A permalink resolves
forever, so resolution alone cannot detect a receipt gone stale.

And three times in three days, a plant died *upstream* of the `PLANT DID NOT LAND` assert
written to catch it — including one that blocked its own release, correctly, by refusing
rather than passing. **A plant is code, and code that throws is not a verdict.**

### The manifesto

`podmanifesto.org` no longer claims four requirements are open. It names all four as built
with the commit for each, and names what the failure taught: *a citation that resolves is
not the same as a citation that is current.* The check that enforces that distinction now
exists, failed correctly on its first live run, and certifies its own subject.

## v0.89.0 — one member moves, and the pin is the whole point

**`sheleg-design` 1.42.0 → 1.43.0.** No other member moves. The release adds
**`bulletin`**, the twenty-ninth style pack, measured off
[socialchamp.com](https://www.socialchamp.com) by enumerating all 748 URLs in its page
sitemap, fetching every one, and reading the 58 distinct stylesheets they resolve to plus
the shared layer its theme ships.

The pack's own note is worth repeating here because it is the kind of thing a pin carries
silently: the reference's primary CTA is white on `#ff6900` at **2.89:1** on every one of
those 748 pages — under WCAG AA for body text and under the large-text floor as well, so
no type size rescues it. The pack keeps the measured hue and darkens it in oklab until
white clears AA, and marks the value DERIVED at its declaration. Two more corrections
travel with it: secondary body copy set at 3.52:1 in 176 declarations, and in-content
links at 2.91:1.

**Order, per the convergence rule.** The child published first — `v1.43.0` tagged, the
release workflow green, `npm view sheleg-design-skill version` returning 1.43.0 — and only
then did this repository move its pointer, bump `skills.json` and the README table, and run
its own gate. `python3 test/check_pins.py` reports every pin matching its release.

### Changed

- `skills.json` and the README pin table: `sheleg-design` 1.42.0 → **1.43.0**.
- Submodule pointer `skills/sheleg-design` → `v1.43.0`.

## v0.88.0 — nine issues and a pull request, and four of them were one class

**Five members move at once**: `super-ux` 0.43.0 → **0.44.0**, `task-pipeline` 1.69.0 →
**1.71.1**, `agent-sync` 1.12.0 → **1.13.0**, `make-skill` 0.20.0 → **0.21.0**,
`sheleg-design` 1.40.0 → **1.42.0**. Every open issue in the family is closed and the one open
pull request is merged.

**`sheleg-design` moves two versions, and only one of them is this run's.** A second session
released **1.42.0** — *proscenium, the twenty-eighth pack* — one commit above the 1.41.0 this
run cut, while this release was in flight. That is `B-75` again. It was **not** chased blindly:
the tag is published rather than still moving, so the pointer was moved to it, `npm view`
confirmed the version, and this repository's own gate ran green against the tree before the pin
was committed. Standing instruction #5 is about not chasing what is *still moving*, not about
refusing what has landed.

### The four that were one class

`task-pipeline` #48, #49, #40 and #39 all describe **a signal that reports success while
checking nothing**, and none is visible to inspection — the command reads correctly, the test
name is accurate, the document's rows look settled. `gates.md`'s false-success table gains two
shapes and its rules go from two to four:

- **Read a gate's own exit code, never a pipeline's.** Actions runs `run:` under `bash -e`
  *without* `pipefail`, so `npm test | tee` concluded `success` over its own `# fail 55`. The
  least visible entry in the table, because `check.sh | grep FAIL` reads as diligence — and it
  bit this session too, when `release_preflight.py | tail` reported `exit=0` under a printed
  `BLOCKED`.
- **An absence assertion needs a subject that exists somewhere.** The complement of *watch the
  green fail against a planted defect*: that finds a check which cannot fail, this finds one
  which cannot succeed meaningfully.

Plus: **a check with a wrong premise can still be the thing that finds the defect** — separate
the premise from the observation before touching either — and **a hand-corrected document
drifts back within one run**, because a document's claims are never executed and nothing
distinguishes a row that *is* true from one that *was*.

### Closed by measurement rather than by code

`agent-sync` #1 was filed against **1.3.5** and fixed by **B-42** on 2026-08-14 without anyone
connecting the two. Re-run against the current version on the exact board shape it names — a
`depends` column where two rows cite a third — the claim lands in the cited row alone.

`seo-aeo-audit` **#8** had been stacked on #7 since 2026-08-14; #7 merged that same day.
Verified before merging rather than assumed: neither the audit document nor `B-16..B-23` exist
on `main`, `main`'s highest board id is `B-15` so the range continues cleanly, and a test-merge
produced zero conflict markers.

### The rest

- **#5** (`make-skill`) — a gate's self-test runs in **both** directions. A false positive does
  not arrive as a bug report; it arrives as an argument about your gate, from someone whose code
  was fine. It went to `authoring.md` rather than the body because `SKILL.md` measured **4738 of
  a 4750 working limit** and every inline draft failed the budget check.
- **#6, #7** (`super-ux`) — `U055`/`U056` make a `Coverage` claim falsifiable, `U057` reports the
  flows whose verdict can only be **inherited**. The linter goes 43 → **54** fixtures. The path
  pattern is narrow on purpose: a wider one flagged three correct prose entries.
- **#4** (`agent-sync`) — the file carried two notions of *held*. `acquire` knew a TTL runs out;
  `release` read any lock as held. Measured in the field at **604×** its TTL with no command able
  to clear it.

`python3 test/check_pins.py` → exit 0 on all eight pins and this repository's own tag.

# Changelog

## v0.87.1 — the check that detects an unshipped tag shipped by causing one

> **Never published, and the reason is an ordering error rather than an outage.** The
> `запиши решение` trigger was committed to `lib/triggers.js` **before** `task-pipeline`
> shipped the description that advertises it, so this tree fails `triggers_test.js` —
> *"`запиши решение` not in task-pipeline/evidence-docs's description"* — and no re-run
> can change that. **The child must ship first**; this commit is the counter-example.
> Everything below shipped inside **v0.88.0**, whose pins are correct. The tag is left
> where it is: this repository decided at v0.82.1 that a burned tag gets a successor
> rather than a rewrite.

**v0.87.0 is tagged and was never published, by its own new check.** `check_pins.py` gained
exit **3** — *this repository's own newest tag is not on the registry* — documented as
non-blocking. `validate.yml`'s step ends in `exit "$code"` and had never heard of 3, so the
tag run went red, `publish` was skipped behind it exactly as `B-79` describes, and npm stayed
on 0.86.0.

**During a release the condition is always true.** The tag exists; `publish` has not run yet.
A gate on that makes the check produce the state it detects — which it did, on the first
release after it was added.

The step now treats 3 as a warning with a run-summary note. **The `exit "$code"` default is
kept on purpose**: an unrecognised verdict passing silently is how a check stops being one.
What was missing is that the exit codes are a **contract with a second file**, and nothing
said so — the script listed four codes and the workflow named three. Both halves say it now.

v0.87.0's tag stays where it is. This repository decided at v0.82.1 that a burned tag gets a
successor rather than a rewrite.

**Filed and closed as `B-88`.**

## v0.87.0 — the assertion existed and could never reach the case it was written for

**`B-79` closed, and half its premise was wrong.** The row said nothing asserts that a pushed
tag reached the registry. `release.yml` has carried exactly that assertion all along — *"The
registry must actually serve it"*, polling `npm view` for three minutes and failing the run.

It lives inside `publish`, which is `needs: release`, which is `needs: validate`. So the one
case it exists for — a run that never reaches `publish` — is precisely the case it cannot
report. v0.82.0 went red on `validate`, `publish` was skipped behind it, and the tag sat
unshipped for a day while the assertion never ran. **A guard downstream of the failure cannot
report the failure.**

### The fix had to be outside CI, and it is one exit code

`test/check_pins.py` already answered two questions about the members. It now answers a third
about this repository, reusing `classify()` rather than inventing a second notion of
*published*:

```
0  every pin names the latest published release
1  a pin names a version that was never published — the commit is wrong
2  every pin is real, some are not the newest — the world moved
3  this repository's own newest tag is not on the registry
```

**Exit 3 is deliberately not blocking.** A release in flight is indistinguishable from a
release that failed — the registry's read replica lags the write master by a minute or two —
so the output says so and the caller decides, rather than the script guessing.

**Watched working in both states, minutes apart.** While v0.86.0 was publishing it printed
`TAGGED BUT NOT SHIPPED: sshlg-skills v0.86.0 … registry serves 0.85.1`, exit 3; when the
release landed, `ok sshlg-skills 0.86.0 (newest tag, on the registry)`, exit 0.

### Its first draft passed by failing to run

`repository` in this manifest is `github:ssheleg/sshlg-skills` — npm's shorthand, carrying no
hostname. A regex anchored on `github.com` matched none of it, the resolver returned nothing,
and the check printed `skip` and passed. **A check that cannot run is not a check that
passed**, so `repo_slug()` handles all five spellings npm accepts, an unresolvable field is a
loud `FAIL` rather than a skip, and eight fixtures pin every form. The self-test summary line
now counts its cases instead of restating them — it said *5 cases* the moment eight joined it,
which is the failure this board keeps re-finding in its own files.

## v0.86.0 — a reference sweep wired to three MCP servers, documented twice, and unaskable

**`super-ux` 0.42.0 → 0.43.0, `sheleg-design` 1.39.0 → 1.40.0.** The probe grows to 79
prompts and reads **64 named / 15 reaching nothing**, from 56/15.

Asked whether the routing reaches design-reference and style search, the answer was **13 of
15 prompts reached `[]`** — and the two that landed did so through unrelated words
(`палитра`, `пейволл`). Meanwhile the capability is not merely present, it is precise:
`sheleg-design/DESIGN_SYNC_BRIDGE.md` §4 tells the three connected servers apart by what each
returns — Lazyweb web products and growth mechanics, Mobbin evenly-spaced preview images per
step, Refero visually similar screens and flows as structure — and `ux-flows` carries the
parallel rule with `funnel-research.md` FR-01 behind it. **Third instance of the same shape
in one day**, after the growth vocabulary and the tenth router.

### The split is the pack's own sentence, not a routing preference

`DESIGN_SYNC_BRIDGE.md` §4 opens: *"A reference sweep answers what a good version of this
screen contains — sections, hierarchy, content order. It never answers what it looks like."*
Structure is `super-ux`'s ground by the block's own boundary, so:

| Trigger | Router | Cost |
|---|---|---|
| `reference screens` / `референсы` | `super-ux` (`ux-flows`) | the funnel clause rewritten shorter; 893 → 940 |
| `visual reference` / `визуальные референсы` | `sheleg-design` | 42 chars, two clauses compressed |
| `style pack` | `sheleg-design` | **zero** — already in *"Product UI through its style packs"* |

`нужны визуальные референсы` now raises **both**, which is the wanted answer rather than a
collision.

### What an operator actually types was refused, and the refusal is the measurement

`подбери стиль` reaches nothing and stays that way. Each candidate was run against ten
control sentences from this machine's own vocabulary before the decision:

```
стиль            → fires on «стиль кода», «стиль коммитов»
подбери стиль    → fires on both (the matcher tolerates a qualifier between the words)
pick a style     → fires on "pick a style guide for python"
вдохновение      → fires on «вдохновение закончилось»
```

All four left unrouted: reaching nothing beats reaching the wrong craft. `мудборд` /
`moodboard` measured **clean** and was still not added — neither description has the ~26
characters, which is `B-66` binding for the third time today.

### Two fixtures caught two mistakes of mine, by name

Compressing `sheleg-design`'s description to pay for the addition took *"heroes"* out of it,
and `triggers_test.js` failed with *"hero not in sheleg-design's description"* — `hero` is a
routed trigger. And the `.cursor/` byte-identical mirror drifted twice; the member's own gate
named the file both times. Neither was found by reading.

**Filed: `B-86`** — `pencil`, `google_lens`/`google_images` and `higsfield` are connected here
and named by no pack, with no recorded decision either way, so an agent cannot tell
*considered and refused* from *never looked at*. **`B-87`** — `funnel-research.md` FR-01 says
*"open a competitor's ad, click through"* and names no tool, in a session where
`claude-in-chrome` and `chrome-devtools` are both connected and a sibling skill already uses
the second.

## v0.85.1 — one of B-84's three defects is fixed and two are refused, with the numbers

**A hyphen inside a trigger was load-bearing and should never have been.** `agent-interop`
advertises `MCP-сервер`, the route carried it, and `подключи mcp сервер` still reached
nothing — `phrasePattern` split a trigger on whitespace alone, so the hyphen had to be typed
exactly. The `gap` between a phrase's words has always accepted `[\s\-–—,:;]`, so only one
half of that seam was ever exercised. Triggers split on hyphens too now, and both spellings
match in both directions:

```
подключи mcp сервер   →  [agent-stack]     (was [])
подключи mcp-сервер   →  [agent-stack]
нужен суб агент       →  [agent-stack]
без make skill        →  []                (the refusal survives the split, in both forms)
```

`test/route_coverage.js`: **55/16 → 56/15**. `lib/conflicts.js` hit the mirror of this on its
first day, one release ago, and fixed it the same way — the two are one seam seen from
opposite sides.

### The other two are refused, and refused by measurement rather than taste

**Prefixed verb forms — refused.** `отрефактори модуль оплаты` reaches nothing because the
trigger is the noun `рефактор` and the pattern requires a word boundary before the stem. A
prototype allowing a closed list of ten Russian verbal prefixes was built and run: **1 new
win in 7 realistic prefixed imperatives, 0 regressions in 10 noise cases.** Six of the seven
already routed — `перенеси миграцию`, `доработай интеграцию`, `подкрути палитру`, `наладь
воронку`, `заверши фичу`, `развей анимацию` — because the prefix is part of the advertised
word or another trigger catches the sentence. One win does not pay for a permanent mechanism
in a pure module whose own header says *deliberately NOT a morphological analyser*, so the
prototype was measured and thrown away rather than shipped. The numbers are on the board so
the next run does not re-derive them.

**с/ш alternation — refused, and it is one word.** `запиши решение` misses the advertised
`записать решение` because `stemRu` cannot bridge `записа-` → `запиш-`. Implementing the
mutation means teaching a load-bearing stemmer a conjugation class for a single trigger; the
honest fix is that `evidence-docs` advertises the imperative, which costs characters in a
description with **124 free** — cheap, but it belongs to `task-pipeline`'s release, not to a
matcher change here.

**What is left in `B-84` is the seven absent triggers**, and they are blocked where they hurt
most: `task-pipeline` 964, `stripe-billing` 967, `make-skill` 965, `seo-aeo-audit` 959,
`sheleg-design` 948 against a 970 working limit.

## v0.85.0 — the map arbitrated one competing pack, and it was the disabled one

The block has carried a precedence paragraph naming **Superpowers** since v0.34.0. Its
`enabledPlugins` value here is `false`. Meanwhile `npx sshlg-skills conflicts`, new in this
release, reports **39 landings over 180 installed skills** — twelve `figma` skills against
`sheleg-design`'s Figma seam, `prowl-brand` and `prowl-design` against `copywriting` and
`sheleg-design`, `skill-creator` against `make-skill`, `mcp-builder` against `agent-interop`,
eight `stripe` skills against `sheleg-dev`. None of them was named anywhere, and the
criterion for arbitration was never *injects at session start* — it was *lands on ground a
router owns*.

### The rule ships, the roster does not

**Naming this machine's packs in a published package would be a fact about one laptop shipped
as doctrine.** So the paragraph became general — *the router decides the route and the other
skill is a tool it may reach for, never a second entry point; the routers answer WHEN and most
other packs answer HOW* — with Superpowers kept as the worked example that produced it, and
the roster moved behind a command. That is the same split `lib/injectors.js` made for the same
question a release earlier, and `docs/DOCMAP.md` now says so in one row.

```
$ npx sshlg-skills conflicts
  figma@claude-plugins-official
    figma-generate-library          → sheleg-design  (design system, design token, figma)
  …
  180 skill(s) scanned, 39 landing(s).
```

**It reports CANDIDATES, never offenders**, and refuses the judgement for the reason
`injectors.js` already refuses its own: overlap is not a defect, most of these answer HOW, and
a list of other people's packs presented as offenders is a judgement dressed as a measurement.
The lexicon behind it is hand-kept, short, and **says so in its own output** — territory
cannot be derived from a router's two table cells, and a generated lexicon would be a guess
carrying a machine's authority.

### Its first run over a real machine reproduced the family's oldest bug

Two thirds of the first report was words inside other words: `lease` matched *please*, `ux`
matched inside longer words, `seo` matched *Seoul*. That is `аудит` matching `аудитория`,
which `lib/triggers.js` has documented since v0.43.0, rediscovered from the other side — so
terms now match on word boundaries, with the three cases fixtured. Then the fixture caught the
mirror image: the term `mcp server` could not match the id `build-an-mcp-server`, which is
**`B-84`'s third case seen from the opposite direction**. A space inside a term now matches a
space, a hyphen or an underscore; the fix found one more real landing.

### And a third hand-kept copy of the router list

`lib/router-texts.js` destructured nine entries by hand and exported nine constants, so the
tenth router shipped without an `AGENT_STACK` export — invisible, because nothing consumed it.
Derived from the registry now, like `BY_MEMBER` beside it. With the README table (v0.84.0) and
a fixture's member list (v0.83.0) that is three hand-kept copies of one list found in one day.

**B-83 closed**, and its own proposed fix was withdrawn: the row said *one line per pack in the
map*, which is exactly the thing a published block may not contain.

## v0.84.0 — the description was the routing surface, and nobody had read it as one

**`super-ux` 0.41.5 → 0.42.0**, and with it fifteen prompts that reached nothing now reach
`/ux`. `node test/route_coverage.js`:

```
v0.82.1   39 named an expected route · 32 reached nothing
v0.83.0   44 · 27      (the tenth router)
v0.84.0   55 · 16      (the growth vocabulary)
```

**The knowledge was never missing.** `super-ux` carries 448 mentions of funnels, 499 of
onboarding, 493 of paywalls, 196 of retention, 171 of activation; `retention`, `onboarding`,
`paywall`, `winback`, `lifecycle`, `activation`, `virality` and `referral` are first-class
tags; `references/funnel-research.md` is 190 lines of method. The router text in
`lib/routers-registry.js` has promised exactly this ground since it was written — *"Not only
screens: product decisions, funnels, onboarding, payment steps."*

What was missing is that **a trigger may only be a word the skill's own `description`
advertises** (`test/triggers_test.js`, a literal substring check), and `ux-flows` advertised
flows, wireframes and task analysis. So the router claimed the territory, the pack held the
knowledge, and the mechanism that selects between routers could not say a single word of it.
`triggers_test.js` had always asked whether every trigger is advertised — soundness — and
nothing asked whether anything was reachable.

### Which word goes where is decided by the chain, not by convenience

`funnel-research.md`'s own `FR-07` already routes each finding to a file, so the route now
fronts two skills instead of one: `ux-flows` takes `funnel`/`воронка`,
`onboarding`/`онбординг`, `paywall`/`пейволл`, `activation funnel`/`активация`;
`ux-foundation` takes `user retention`/`ретеншн`, `churn`/`отток`. Neither could carry the
other's words honestly.

### The English half is phrases and the Russian half is bare words

Measured, not chosen. Bare `activation` and `retention` stem to `activat-` and `retent-`, and
the probe caught it at once: `activate the virtualenv`, `activate the feature flag` and
`retention policy for logs` all routed to `/ux`. As phrases, all three are silent and every
growth prompt still routes. «активация» and «ретеншн» stay single words for the same reason
`палитра` does — nobody here writes «активация» about a virtualenv.

### The README's routers table had been wrong for three days and two routers

It said *"Eight routers"* and listed eight, through `sheleg-dev` becoming the ninth on
2026-08-14 and `agent-stack` the tenth yesterday. Same failure as the family table one
paragraph above it in `test/validate.py`, never generalised. **A guard now reads the router
names out of `lib/routers-registry.js` and requires a row for each plus a matching count
word** — watched failing on two plants: a removed `agent-stack` row, and *"Nine routers"*
against a registry of ten. Only membership and the count are asserted; a cell's wording may
differ from the block's, or the check becomes a second copy of the registry.

**B-80 closed.** Four growth phrasings still reach nothing and are named rather than hidden:
`почему пользователи отваливаются`, `сделай реферальную программу`, `a/b тест на лендинге`,
`настрой аналитику продукта`.

## v0.83.0 — a tenth router, for the member that was in the map and in no rule

**`agent-stack` had been installed since 2026-08-06 and routable never.** It appeared in
the operator's file exactly once — in the map table, which lists what is installed rather
than deciding when to reach for it — and the registry, the block and the prompt hook had no
entry for it at all. Nine `SSHLG:ROUTER:` sections, none of them its.

**Measured before it was believed, and the probe ships.** `test/route_coverage.js` runs 71
prompts an operator would really type through the real `lib/triggers.js`:

```
before   39 named an expected route · 32 reached nothing
after    44 named an expected route · 27 reached nothing
```

Six of seven agent prompts reached `[]` — `напиши оркестратор агентов`, `сделай эвалы для
агента`, `add tool calling loop`, `sub-agent coordination`, `системный промпт для агента`.
Five of them now route; the sixth (`подключи mcp сервер`) is a matcher gap rather than a
missing router, filed under `B-84`: the pack advertises `MCP-сервер` with a hyphen and
`phrasePattern` splits trigger words on whitespace only, so the spaced form cannot match.

**`triggers_test.js` has always asked whether every trigger is advertised. Nothing asked
whether anything is reachable.** Soundness passed for eleven days over a table that could
not name half the family. The probe is deliberately **not** a `_test.js`, and not for the
reason `check_pins.py` is outside the gate — that one needs the network. This one is
excluded because its expectations are a judgement about what an operator means, and a
judgement that fails a build is a judgement nobody may revise.

### What the router costs, and what it did not cost

**No description was edited.** All four `agent-stack` skills already publish an explicit
`Triggers -` list, which is what made this the cheapest routing row on the board — and it
had to be, because `agent-orchestrator` sits at **1019 of 1024** characters, five from the
cap where the host truncates silently.

**The bare `агент` is deliberately absent from the table.** It is the word this household
uses for `agent-sync`, for subagents and for the assistant itself, so it would fire on most
sentences typed here; it is also inside the new refusal «без агентного слоя», and
`triggers_test.js` forbids a trigger that makes its own refusal unsayable. Every trigger is
a compound that carries no second trade.

**The block grows by ~340 tokens** (1326 characters over the repo's own ÷3.9 divisor), to
ten routers and ~2735 tokens of router text.

### Two fixtures were counting instead of deriving, and one of them proved the point

`router_texts_test.js`'s *"installing the whole family contributes all nine"* listed the
members **by hand and omitted `agent-stack`** — the same shape as the gap the router closes,
inside the fixture meant to prove the family is fully covered. It now reads `skills.json`.
`cli_config_test.js` asserted the switch list is *exactly nine*; it now reads
`registry.order().length`, because a hand-kept number is a second place every new router has
to be added and the tenth was added while that line still said nine.

**B-81 closed. `B-84` gains the `MCP-сервер` case.**

## v0.82.1 — the tag's tree satisfied the version claim and failed the composition check

**v0.82.0 was tagged and never published.** `npm view sshlg-skills version` still returned
`0.81.1` a day later. All three of its workflow runs — `validate` on `main` (32034181241),
`validate` on the tag and `release` (32034202248, 32034202388) — failed at **one** step,
*Coordination configs are checked, in every repository that declares one*, and `publish` and
`release` were skipped because a red suite gates them, which is the behaviour v0.49.0 shipped
on purpose. Nothing else in the release was wrong.

**The cause is the decision v0.82.0 wrote down as a principle.** It pinned `task-pipeline` at
`92fc3ea` — the v1.69.0 **tag's tree** rather than the branch tip — reasoning that
`skills.json` claims *version 1.69.0*, so the pin must be the tree that version names. The
reasoning is sound about the version and blind about everything else in the tree. Reproduced
at the pin, in a worktree, rather than inferred:

```
$ git worktree add --detach … 92fc3ea && agent_sync.py check
  ✗ the configuration changed since the snapshot was generated — regenerate with `setup`
  1 problem(s) — this setup is NOT healthy.
$ … at 7cd7aaf (branch tip)          → 9 of 9 configs OK
$ package.json version, both trees   → 1.69.0
```

Both trees satisfy the version claim identically. What differs is `.claude/agent-sync.json`
and its snapshot — and the fix for them (`7e74889`) landed **after** the tag. So pinning the
tag's tree bought the *pin is the promise* invariant nothing it did not already have, and cost
the one check that reads the repository at the pin rather than the package.

**And the package is the reason no `1.69.1` exists.** The obvious repair was a child patch
release; it was measured instead of assumed, and the measurement refused it:
`task-pipeline-skill`'s `files` field is `bin, plugins, cursor, evals` plus the root
documents — **`docs/AGENT_SYNC.md` and `.claude/` ship in neither**. `npm pack --dry-run |
grep -i agent_sync` is empty. The published 1.69.0 carries no defect, so a version bump would
have announced a fix to a channel that never had the bug. The four commits were pushed,
`skills.json` stays at 1.69.0, and the pointer moves to the tip.

**What the pin invariant actually means, corrected here.** `skills.json` promises a *version*,
and a pin keeps that promise when the pinned tree's `package.json` carries it. Which
version-bearing tree — tag or tip — is free, and the parent's own CI is the tiebreak, because
it checks out the repository rather than installing the package.

**Filed:** `B-78`, so the next release does not re-derive this.

**No member moved.** All eight pins, all eight README rows and `skills.json` are unchanged
from v0.82.0 except `task-pipeline`'s pointer, which advances 92fc3ea → 7cd7aaf within the
same version. `python3 test/check_pins.py` → exit 0, eight pins, eight matches. `npm test` →
33 checks green.

## v0.82.0 — the pointer is not the path, and this release is the first to prove it

**`task-pipeline` 1.68.0 → 1.69.0**, pinned at `92fc3ea` — **the tag's own tree, not the
branch tip.** `main` had already moved two doc commits past the tag by the time the pin was
written, and `skills.json` claims *version 1.69.0*: the pin has to be the tree that version
names, or «pinned 1.69.0» is true of the manifest and false of what a clone receives. That is
the *pin is the promise* invariant read backwards.

**What that release brought is module 1 of the role-agent programme** — the graph on disk, a
script that walks it so the model never reads it, a verifier that closes one node at a time
against a seven-key verdict, and a loop that reads a queue rather than its own recollection.
376 guards, 114 graph fixtures, 24 exposure fixtures.

### The first convergence record this family has written

`task-pipeline` v1.69.0 shipped the stage-10 criterion that says a green submodule pointer
proves **commits, not composition** — each side's suite ran against its own side, and no check
ran across the pointer. This release is the first to owe that criterion an answer, and
`docs/evidence/convergence.md` is it.

The seam is not either side's suite. The parent's catalogue claims a version; the registry
either serves it or does not. Nothing inside `task-pipeline` can check that — and nor can this
repository's own `npm test`, which is exactly why `test/check_pins.py` sits outside the offline
gate:

```
$ npm view task-pipeline-skill version   → 1.69.0
$ python3 test/check_pins.py             → exit 0 · eight pins, eight matches
```

**And the order was forced by a measurement rather than chosen.** Before the child was
published, that same check said: *«pinned 1.69.0, which task-pipeline-skill never published …
this commit is wrong on its own terms and no later release repairs it.»* So the pin could not
be committed first. Child release → observation → parent commit, in that order, because the
alternative produces a commit that installs a version which does not exist.

### Two things this release did not do, said out loud

**Six members carry unreleased work and got no tag.** `super-ux` (5 commits), `agent-sync`,
`agent-stack`, `seo-aeo-audit` (2 each), `make-skill`, `sheleg-dev` (1 each) — all of it docs
and chores from the audit: `.gitignore` for `.env`, rebuilt graph reports, ledgers brought up
to their shipped version. None changes behaviour a user installs, and six tags with six npm
publishes for documentation corrections is noise in a registry rather than a release.
`sheleg-design` has nothing unreleased at all.

**The coordination guard refused the pin commit once, correctly.** `README.md` is a guarded
file and the run held no lease — which is `R-009`, the standing instruction `task-pipeline`
filed three iterations earlier about taking the lease *before* the edit rather than after the
collision, refusing its own author. Acquired, committed, released.

## v0.81.1 — the pin follows the packs

`sheleg-design` **1.38.0 → 1.39.0**: five style packs ported from live references in one
release, taking the library from twenty-two to twenty-seven — `router` (openrouter.ai),
`daylight` (taskip.net), `notation` (twenty.com), `almanac` (auxia.io) and `vitrine`
(attio.com), each with a token layer, a reference kit and the widened contract.

A release that does not bump this pin is invisible: `list` keeps reporting the previous
version and `update` keeps installing it, with nothing to reveal the gap.


## v0.81.0 — a version heading nobody can check out

**`B-71` closes, and the real figure is 17, not the 22 the audit reported** — it had
counted pre-tagging history as a defect. `super-ux` alone documents twenty-two versions
below its own first tag, from before the project tagged at all, and flagging those is
noise about history. Measured **above** each repository's first tag, against `git tag` and
`npm view <pkg> versions --json`: ten in `sheleg-design`, three in `super-ux`, two in
`agent-sync`, one each in `task-pipeline` and `seo-aeo-audit`.

**Two different facts, and the note now says which.** Twelve were never tagged *and* never
published — `npm install` fails, `git checkout` fails, and a reader reconciling *"which
version am I on"* is shown a number that never existed. **Four of `sheleg-design`'s are on
npm with no tag**, which is the worse half: the artifact is real, so a bug report against
it has no source tree to read.

Separately, `@ssheleg/seo-aeo-audit@0.11.3` is **still installable** while its CHANGELOG
says the tag was deleted. That sentence is true about the tag and silent about the
artifact, which is the half a user gets. `npm deprecate` is named there as the operator's
call rather than taken, being an outward change to a published package.

`check_every_changelog_release_has_a_tag_or_says_it_is_not_one()` reconciles every heading
against the tags and accepts an explicit *«not a release»* note as the remedy — the form
`seo-aeo-audit` had already written for v0.18.0 before any check existed. Watched refusing
when a note is removed.

**The board is at three, and all three are decisions rather than work:** `B-29` (126
requirements waiting for a person to open the list), `B-75` (a second session committing
here without a lease — whether the lease backend moves off `fs`), and `B-76` (two checkers
giving opposite verdicts on one field, where answering costs 22 rewritten descriptions).

## v0.80.0 — a nine-repository audit, and the ten rows it closed

**131 findings, three of them blockers**, from nine parallel read-only audits — one per
repository, against a fixed eight-dimension brief, every finding carrying `file:line` or a
command and its output. The full set is committed at `docs/evidence/audit-2026-08-16/`;
what follows is what shipped.

### The three blockers

**Two were the same module, and the same mistake: a write into the operator's files that
the backup could not see.** `lib/apply.js`'s `applyCursor` upserted into the `EMPTY_BLOCK`
constant rather than into the file on disk, so a `--member`-scoped run rebuilt
`~/.cursor/rules/sshlg-routing.mdc` containing only that member — measured live at **9
router blocks and 13743 bytes before, 2 and 3233 after**. And `bin/sshlg-skills.js:493`
wrote the migrated `~/.claude/CLAUDE.md` **before any backup**: the only write to a
protected file not preceded by `protect()`, reproduced against a scratch HOME with the
backup directory unwritable — four sections to three lines, no copy anywhere, and the run
printing *«Файл не изменён»*. `test/apply_test.js` (15 fixtures) is the suite
`lib/apply.js` never had, which is the gap both lived in; it was watched failing **7 of
15** against the pre-fix code.

**The third was in the family's own standard-keeper.** Both checkers dropped the
continuation lines of a plain multi-line YAML description, so a description whose real
length was **1392 characters was measured at 180** and passed the 1024 cap, the 970
working limit and every `/skill-audit` this family issues. Shipped as `make-skill` v0.20.0
with `test/checker_parity_test.py`, watched failing 9 of 14.

### Ten board rows closed

| Row | What it was |
|---|---|
| `B-63` | the checker that measured 180 where the file said 1392 |
| `B-64` | two writes into the operator's files that bypassed `protect()` |
| `B-65` | `npm test` did not exist in three of nine members |
| `B-66` | five `SKILL.md` bodies over the 5000-token budget |
| `B-67` | nine of nine graph reports described a different build |
| `B-68` | «every graph at HEAD», false in the tree that published it |
| `B-69` | lightweight release tags reporting members up to seven releases stale |
| `B-70` | seven of eight verification ledgers behind their shipped version |
| `B-72` | 246 kB of someone else's bytecode in a published npm tarball |
| `B-73` `B-74` `B-77` | the missing CAPI contract, a `CONFIRMED` row 30 days from harm, six stale umbrella claims |

**No body in the family is over 5000 tokens now**: `task-pipeline` 6685 → **4735**,
`sheleg-design` 6203 → **4590**, `seo-aeo-audit` 5885 → **4996**, `stripe-billing` 5367 →
**4748**, `ad-tracking` 5273 → **4643** — split rather than trimmed wherever a file already
owned the material, and **every routed trigger survived**, checked after each pass.

**Six members released**: `make-skill` 0.20.0, `agent-sync` 1.12.0, `seo-aeo-audit` 0.22.0,
`sheleg-dev` 0.6.0, `sheleg-design` 1.38.0, `task-pipeline` 1.68.0.

### Two findings that reversed

**The audit was wrong about `task-pipeline`'s description.** It read the member as breaking
the house rule that a description must open with `Use when …`. That repository's own
validator refuses exactly that opening, citing Anthropic's guidance and their
capability-first example — and it is the **shared rule that is wrong**. The correction was
written and reverted rather than shipped: it flags **22 of 24** family skills, and each
carries routed phrases that must survive a rewrite verbatim. Filed as `B-76`, unresolved,
because it is a family decision and not a member's.

**And it was wrong about the graphify model.** `F-umbrella-14` claimed the v0.79.0 note
named a model the machine was not using; the note was right about what built the graphs.
The real defect was narrower and elsewhere — `~/.config/graphify/env` contradicts itself,
its comment naming `deepseek-v4-pro` at `$1.17/$2.34` while its export sets
`deepseek-v4-flash` at `$0.06/$0.12`.

### What kept happening

**A negative self-test pinned to a literal stops landing the moment the fact it guards is
reworded** — and then reads green while proving nothing. It happened five times: a date, a
count, a line break, and twice a guard looking where content used to be. It refused
`seo-aeo-audit`'s release three times, correctly, and **after the tag was public** — the
one moment the release workflow cannot recover from. So the check moved to where it is
read before the tag, and the guard added for it did not see `perl`-form plants, and its
first widening skipped a file with a comment claiming a loop checked it when no such loop
existed. All three are fixed and each was watched refusing.

### The tag went out pinning a commit that existed only on this machine

`v0.80.0`'s first CI run failed at **checkout**, not at a test: `skills/agent-stack`
was pinned at a chore commit that had been made here and never pushed, and
`actions/checkout` refused it with *upload-pack: not our ref*. Every consumer of that
hub commit would have failed the same way.

Nothing local could see it. `npm test` was green, and
`git submodule status | grep -c '^+'` returned **0** — because the pointer matched the
submodule's **local** head, which is exactly what a forgotten push looks like.
`task-pipeline`'s stage 10 already states the order (*push the submodule, then commit
the pointer*) and names the second half as the one that gets forgotten; nothing
enforced it.

`check_no_member_holds_a_commit_the_remote_does_not()` fails the gate when a member
holds a commit its upstream does not, and discloses instead where no upstream ref
resolves. Watched refusing a planted local commit.

### Also

- `test/hooks_e2e_test.js` discovers all nine hooks instead of listing six. The three it
  omitted included `repo-gate.js`, wired from a committed `.claude/settings.json` into
  every clone, where a throw breaks every Bash call in the project. Watched catching a
  planted throw in `statusline.js`.
- The umbrella requires `scripts.test` of every member, and discloses each member's ledger
  lag, graph-report disagreement and lightweight newest tag.
- Ratchets recounted by running the command: **32 suites, 562 fixtures**. `24/469` had been
  wrong by 73 before any of this.

**A second Claude Code session committed here mid-run**, between 21:46 and 21:55, holding
no lease and invisible to `agent_sync status`. Nothing was lost and its three commits were
correct. Filed as `B-75`: the `fs` backend is advisory across processes, and the decision
is whether it moves.

## v0.79.0 — the graphs are current, and a live key was one command from being published

**B-51 resolved as *provision*, and the graphs are rebuilt.** All nine, with semantic
extraction: every one now sits **at HEAD**, where this repository's was 31 commits behind,
`super-ux` 33, `seo-aeo-audit` 19, `sheleg-design` 12, `task-pipeline` 10.

> **Corrected 2026-08-17 (B-68), and the sentence above is left as it shipped.** Two of
> its numbers do not survive being recomputed. *"Every one now sits at HEAD"* was already
> false in the tree that published it: `npm test` in that same checkout printed eight of
> nine **one commit behind**, and for the members that commit `graphify-out` it is false
> **by construction** — the commit carrying the graph advances HEAD past the commit the
> graph was built at, so only the umbrella, which gitignores it, can ever read zero. The
> honest form is the per-member lag the gate already prints, not a blanket claim. And the
> edge total was **11,894**, not 11,884: summing `len(links)` over the nine `graph.json`
> files gives 10,140 nodes and 11,894 links, which is also what the concurrent session's
> own model table recorded an hour later. A release note is a record, so this stands as a
> correction beneath it rather than a quiet edit of what was published.

**Measured cost for the family: $1.05, eleven minutes.** My pre-flight estimate was $0.44
and it was low by 2.4× — it priced raw input tokens and ignored the per-file prompt
overhead and the JSON output at $1.60/1M. The number that matters came from one clean run
on the smallest member measured against OpenRouter's own accounting before and after, then
extrapolated; the estimate is recorded here beside the measurement rather than quietly
replaced by it.

**A live API key was sitting untracked-but-unignored at this repository's root**, mode 644,
while a loop that runs `git add -A` after every cycle had been working here all day. It was
never committed — `git log --all -- .env` is empty — but nothing would have stopped the
next commit from publishing it. `.env` and `.env.*` are gitignored now in **all nine**
repositories, not just the one that had the file, because the hole was open in all nine.

**Where a key belongs on this machine, and why it is not `.env`.** graphify reads
`os.environ` only — it has no config file and does not load `.env`, so a key there was
never going to be read in the first place. It lives in `~/.config/graphify/env`, mode 600,
sourced from `~/.zshrc` behind a `[ -r … ]` guard so a deleted secrets file cannot break
the shell. One home per secret.

**Two things were measured rather than assumed along the way.** `deepseek/deepseek-chat`
answers a short prompt through OpenRouter and returns *empty or filtered* on graphify's
real chunks — twice, 2 of 2 — while `openai/gpt-4.1-mini` completed the same corpus; the
model is pinned with that reason next to it. And OpenRouter's real rate for that route is
**$0.40 in / $1.30 out per 1M**, not DeepSeek's direct $0.14/$0.28, which happens to land
close to graphify's hardcoded `openai` pricing — so `cost.json` is roughly honest here by
coincidence rather than by design.

**Three models were tried before one was pinned, and the two cheap ones failed in
different ways.**

| model | outcome |
|---|---|
| `deepseek/deepseek-chat` | *empty or filtered response* on 2 of 2 real chunks, twice, while answering a short prompt perfectly. DeepSeek v4 runs reasoning by default and graphify ships `GRAPHIFY_DISABLE_THINKING` for exactly this. |
| `deepseek/deepseek-v4-pro` | **$0.35 and 25+ minutes on the smallest member**, no graph written when it was stopped. ~$8 and hours for the family. |
| `deepseek/deepseek-v4-flash` | cheapest on paper at $0.06/$0.12 and unusable here: completions **truncate at `max_completion_tokens`** on graphify's extraction schema, so the JSON arrives cut off, graphify halves the chunk and retries at depth 0, 1, 2 — and a single `SKILL.md` still truncated alone. |
| `openai/gpt-4.1-mini` | all nine repositories, **10,140 nodes and 11,894 edges, $1.05, eleven minutes**. |

The failure that looked like malformed output was truncation, and the distinction
mattered: "the model returns bad JSON" suggests a different model, while "the model
cannot finish this response" suggests a smaller schema or a bigger window. Reading the
first 200 characters graphify prints is what separated them — the JSON was well-formed
right up to where it stopped.

Total spend for all of it, experiments included: **$1.52**.

The staleness disclosure now names its remedy instead of only the lack, and retires itself:
zero occurrences of its tail once a key is in the shell.

## v0.78.0 — an unqualified landing page reaches both crafts

**B-57: `сделай лендинг` reached no route at all — and neither did `build a landing page`,
which the row never mentioned.** A landing is the canonical two-craft surface, so the ask
for one arriving at nothing was the gap; both phrases now reach **`sheleg-design` ∥
`copywriting`** together, which is the composition this family prescribes for a landing.

**Verb phrases, not the bare noun, and the difference was measured rather than argued.**

| prompt | bare `лендинг` | verb phrase |
|---|---|---|
| `сделай лендинг` | both | **both** |
| `build a landing page` | both | **both** |
| `напиши текст для лендинга` | both — a copy task handed a visual route | **copywriting alone** |
| `почини баг на лендинге` | three routes | **task-pipeline alone** |

The bare noun fixes one case and damages two. Cycle 5 refused it for a reason that no
longer held — it said the bare noun would *take* the route from `copywriting`, and with
both crafts firing that is no longer true — but measuring found a different reason that
does hold, so the refusal stands on new evidence rather than old.

**A premise of the row had expired.** It said both descriptions were at or near the
1024-character limit; `copywriting` is at **536**, with 488 free. Only `sheleg-design` was
tight, and there the room was **made rather than found** — `scrubbed sections` and one
`implemented` came out of the prose, 30 characters that were not carrying their weight
beside a phrase an operator actually types.

**Pins: `sheleg-design` 1.37.4 → 1.37.5, `super-ux` 0.41.4 → 0.41.5.**

## v0.77.0 — closing a false positive found the bypass it was hiding

**B-59: the hygiene guard could not tell a command being run from one being written
down.** It reads the whole Bash payload, so quoting the forbidden invocation *in a
document* was refused too — a verification-ledger row blocked its own commit, and the
sentence had to be split around the guard.

`executablePart()` now removes what cannot execute before matching:

- **A heredoc body fed to something that is not a shell.** `python3 - <<'PY' … PY` and
  `cat > f <<EOF … EOF` are data.
- **A whole-line comment.**

And what it keeps is the load-bearing half. **A `bash <<EOF … EOF` body is still read** —
stripping every heredoc would trade a false positive for a documented bypass. **Quoted
strings are still read** too, because `bash -c '…'` is a real invocation.

**That last decision is where the actual finding was.** Testing it produced a case the
guard *should* refuse and did not: `bareName` kept the trailing quote, so `ux-flows'`
matched no family id and **`bash -c 'npx skills add ux-flows'` passed the guard untouched**
— verified against `HEAD` before the change, so it had been open the whole time. The row
asked for relief from an annoyance; the annoyance was hiding a hole.

Both directions are fixtured — 17 → **22** checks — and the real hook was driven as a
process to confirm it agrees with the pure module. The fixture strings are **assembled at
runtime** rather than written whole, because a file containing the literal payload is
itself refused by anything that reads it: the defect demonstrated itself three times
during the fix, twice blocking the commands that were repairing it, and once making three
new cases pass for the wrong reason by targeting a member the fixture's manifest does not
declare.

## v0.76.0 — a ledger records two different things, and most record only one

**B-62 said five ledger shapes. Measured: ten, across 815 rows.**

| what the state column can say | rows | repositories |
|---|---|---|
| whether a **person** looked (`Human`) | **126** | 1 |
| a date and what was watched (`Last verified`) | 180 | 1 |
| `verified` — by a person **or** a command, indistinguishable | 391 | 4 |
| nothing: evidence recorded, no state column at all | 118 | 3 |

*What confirmed it* and *whether a person looked* are separate facts. The first is a
command, a run id, a fixture name; the second is the axis the exposure line is defined
over. **`never` is expressible in one repository of nine, over 15% of the rows** — so the
number this pack's doctrine is written around is undefined almost everywhere it is quoted.

**That is not a defect in those ledgers.** Recording what confirmed something is the Auto
job done properly, and a project that never asks the human question has made a choice.
The defect is doctrine speaking as though the column were there, and `task-pipeline` 1.67.0
now states the split with three rules following from it — no state column means the line
says so and prints no number; a `verified` that cannot separate a person from a command is
not reported as human confirmation; and adding the column later never reaches backwards.

**Convergence was refused, and the refusal is the load-bearing part.** Back-filling 689
rows with human confirmations nobody gave is the failure the `evidence-docs` router exists
to name — a filled-in ledger answers the question *wrongly* instead of not at all, and
unlike an absent column, nothing afterwards can tell which rows were real.

**This repository's own ledger preamble was one of the false promises.** It said
`/task-pipeline checkup` counts rows at `never`; this shape holds no such value, and 295 of
its 322 rows read `verified` with nothing saying whether a person or a command produced
them. It now says that, and names what the exposure line actually prints.

Also: `exposure.sh` stops calling a self-explaining status unreadable. `**observed** — the
row exists because the miss happened in this run` is an ordinary way to write a state, and
four rows here were reported unparseable for explaining themselves. Matching is on the
**leading word**, with the empty cell tested first so a blank still counts as unconfirmed.

**Pin: `task-pipeline` 1.66.0 → 1.67.0.**

## v0.75.0 — two board shapes were never the problem; reading either by position was

**B-61 asked which of two priority formulas should win. Neither.** The shipped board
computes `sev × blast + age_bonus` over ten columns; this one computes
`blast × (1 + age_runs) / effort` over eight. Both are documented in their own headers, and
this one is arguably better — dividing by effort ranks cheap-and-old above
expensive-and-old, which the other cannot express. Forcing convergence would break every
seeded board or rewrite sixty rows here, for no gain in either direction.

**What was actually broken was `exposure.sh` reading column 5 for blast.** That is `Blast`
here and **`Size`** in the ten-column board `task-pipeline` seeds, so every host project's
check-list printed `[blast L]` — the size of the work, labelled as who it hurts. Reproduced
on a scratch project before the fix and after.

It shipped for a full release **two lines away from where the same lesson had just been
applied to the ledger's status column** one cycle earlier. Fixing one instance of a class
and leaving its neighbour in the same file is the recurrence this repository's retro
already names, and this is its clearest instance yet.

Fixed in `task-pipeline` 1.66.0: blast resolved by header, fixtures 18 → **20** covering
both shapes and a board with no blast column at all — an invented weight is worse than a
missing one, because it looks like data. The rule is written into `references/backlog.md`
rather than left as two fixes: resolve every column by header name, once per section,
knowing a file may hold more than one shape; treat an absent column as absent; and name the
column in the output where the reading depends on it.

**Pin: `task-pipeline` 1.65.0 → 1.66.0.**

## v0.74.0 — a decision is not debt, and the board had no way to say so

**B-08 and B-07 reached the top of this board by ageing, and both were correct.** They
recorded deliberate decisions on 2026-08-06: one waiving a UX chain for the CLI in favour
of fixtures, one keeping `seo-aeo-audit` an audit because the `seo-llmo` router carries the
design-time rule. Both sat `open`. One cycle ago the age term started being computed for
the first time, and they went straight to **2.67 each — the top** — so this cycle picked
one up and spent itself re-deriving two decisions that were right when made.

**Fixing the constant exposed what the constant was hiding.** `open` is work not done,
`dropped` is an idea abandoned, and a deliberate *no* is neither.

`waived` is now a state, here and in `task-pipeline` 1.65.0 so seeded projects get it:
not counted open, **no priority** (`—`), and it must name what would bring it back. The
`revisit:` clause is mandatory and gated in both validators, because a waiver with no
trigger is a row nobody will reconsider — and the trigger must be something a later run can
**measure**.

Both conditions were re-derived before the rows were waived, which the doctrine now
requires:

- **B-07** — *the launcher's command surface grows past what its fixtures describe*.
  Measured: **8 commands** (install, update, routers, config, hooks, injectors, list,
  agents), **0 with no fixture naming them**. Holds.
- **B-08** — *`seo-aeo-audit` gains a design-time track, or the router stops carrying the
  rule*. Measured: the routing block still states *"Decided AT DESIGN TIME, not audited
  afterwards"*, and the skill's only mentions of design are split-test design. Holds.

Waived rows are **disclosed on every run** rather than counted — a waiver that becomes
invisible is how a decision outlives the reason for it.

**Pin: `task-pipeline` 1.64.0 → 1.65.0.** Guards there: 349 → **351**.

Caught in passing by an existing guard: the doctrine's own worked example used the real id
`B-07`, making it a second row with that id, and the duplicate-id check refused the commit
within one command.

## v0.73.0 — the exposure line reported a clean bill on ledgers it could not read

**A tool this pack shipped two releases ago was lying, in the reassuring direction, about
this very repository.** `templates/exposure.sh` keyed on position — `NF >= 7`, status in
field 7. Against the umbrella's four-column ledger it found **four rows out of 298**,
because those four happen to carry a `|` inside inline code and so crossed the field count
by accident, and printed from them:

```
exposure: 0 unverified · never checked · 125 releases carry one
         every shipped row carries a human confirmation
```

Two halves of one sentence contradicting each other — nothing has ever been checked, and
everything is confirmed — in the tool whose stated purpose is to stop silent greens. Its
eighteen fixtures did not notice because every one of them built the canonical shape.

Fixed in `task-pipeline` 1.64.0: the status column is resolved **by name, per section**,
in an order that had to be measured. `sheleg-design` carries both `Last verified` and a
`Status` holding `**green**`; preferring `status` reads the gate instead of the person.
`Verified by`, `Confirmed` and `How it is checked` are **not** status names — five members
hold shell commands under them. Bold is stripped before matching, because these ledgers
write `**never**`. A status that is neither a date nor a known word gets its own count, so
a shrug never receives a clean bill. And only a `Human` column licenses the word *human* —
this repository's own ledger defines `verified` as *a person **or** a command*.

**B-29 re-derived before acting on it**, which is the rule that shipped one cycle ago, and
three of its claims had expired: 99 rows → **126**, 14 ids → **19**, and the parked command
landed in 1.61.0. Its stated blocker is gone too — `(REQ, Shipped in)` is unique across all
126 rows and is the pair the check-list already prints. What remains is the one thing a
machine may not do: a person opening the list and writing a date.

**Filed: B-62.** Measuring this exposed something larger — the family runs **five**
verification-ledger shapes and only `task-pipeline`'s can express *a person looked*. Six of
nine members have no state column at all, so the exposure line is unmeasurable there, and
this repository's own ledger preamble promises a checkup that counts a value its shape
cannot hold. `exposure.sh` now says **dormant** in those repositories instead of zero,
which makes the gap visible rather than closing it.

**Pin: `task-pipeline` 1.63.0 → 1.64.0.** Fixtures there 14 → 18.

## v0.72.0 — the age term was a constant, so the board ranked newest-first

**B-60 asked about rows whose prose expires. The sharpest expiry turned out to be
arithmetic.** This board's header states `P = blast × (1 + age_runs) / effort` and promises
the rank is *"recomputed at stage 10 rather than inherited, so a row cannot keep a rank it
earned when it was new."* Nothing recomputed it, for eleven days:

| row | `Age` said | stamp-days survived | `P` said | `P` is |
|---|---|---|---|---|
| B-07 | 2 | **7** | 1.0 | **2.67** |
| B-08 | 2 | **7** | 1.0 | **2.67** |
| B-29 | 0 | **3** | 0.67 | **2.67** |
| B-51 | 0 | **1** | 1.0 | **2.0** |

The age term — the whole reason the formula has one — was a constant. So the board ranked
**newest-first** while its header claimed oldest-hurt-most-first, and this loop worked
those four rows **last** all day, on a ranking it re-read every cycle.

`test/board_age.py` (+9 fixtures) computes it and `validate.py` **gates** it — a gate and
not a disclosure, because unlike a graph drifting with every commit, a wrong rank is a
stated number disagreeing with its own stated inputs. Watched failing on a pinned age and
on a wrong P, separately.

**`age_runs` counts distinct stamp-days.** The table holds 38 stamps over 9 days, thirteen
of them in one afternoon; raw stamps would let a single busy day outrank a row ignored for
a week. It is the same correction the retro's prune doctrine already applies to its cold
triggers, written into the formula instead of reapplied by hand each time.

The harvest half of B-60 ships in `task-pipeline` 1.63.0: re-derive a row's checkable
claims before acting on them, and correct the row in the same run. No guard there, measured
— across the seven open rows the family carries, the checkable claims total two file paths
and one count.

**Pin: `task-pipeline` 1.62.0 → 1.63.0.**

Filed on the way: **B-61**, two different priority formulas in one family. The shipped
doctrine computes `sev × blast + age_bonus` over ten columns with age in days; this board
computes `blast × (1 + age_runs) / effort` over eight with age in stamp-days. Both are
documented in their own headers, so neither is wrong alone — together they mean the shipped
priority check can never run here.

## v0.71.0 — the graph's distance from the code stops being an impression

**B-51 stays an operator's decision, but its cost is printed now.**
`references/knowledge-graph.md` has always named `built_at_commit` and the three commands
that turn it into a number. Nothing ran them, so the number existed only when somebody
thought to ask. Asked on 2026-08-16: this repository's graph was **31 commits behind** its
own HEAD, `super-ux` **33**, `seo-aeo-audit` **19**, `sheleg-design` 12, `task-pipeline`
10, and four members at 2. The doctrine's own warning is why that matters — *a wrong doc
gets argued with, a wrong graph gets believed*.

`test/graph_staleness.py` (+9 fixtures) reports it on every `npm test`, as a **disclosure
and never a gate**: a graph is behind the moment the next commit lands, so a threshold
would redden every repository every day and be switched off within a week. Two blind
paths are asserted separately — a `built_at_commit` that does not resolve reads *blind*,
never *current*, and a graph with no such field says its distance is unknowable rather
than reporting zero.

It also names whether a refresh is possible at all. `graphify . --update` exits 1 here
with *no LLM API key found (40 doc/paper/image files need semantic extraction)*, and no
key is present in the environment or in the machine's gateway secrets. So an unrefreshable
graph says so **even when it is at HEAD** — "current today" and "current because nothing
can rebuild it" are different facts. The B-51 tail disappears by itself the moment a key
exists, verified by running the suite with one set.

**Two of the row's own facts had expired and were corrected**: the graphs are not frozen
since 2026-08-08 — every one was rebuilt on 08-15/16, and between them they hold 11,267
nodes and 12,494 links.

**The instrument that found this was wrong first, and loudly.** Its first draft read
`edges` from a node-link document whose key is `links`, and reported **zero edges across
all nine graphs** — 11,267 nodes and no relations at all, which would have meant every
reach question the graph exists to answer had been returning nothing. `graphify god-nodes`
printed real hubs against the same file one command later. That is the whole reason
`resolve()` takes measured facts and reads nothing itself.

## v0.70.0 — the description was not valid YAML, and every gate we own reads it with a regex

**B-56's root cause, after two cycles of blaming the launcher.** The launcher was fine.
`sheleg-design`'s `description` carried `style packs: dashboards` — a colon-space inside
an unquoted scalar, which YAML reads as a nested mapping. **Everything this family owns
stayed green**: `claude plugin validate`, the member's own 4636 checks, `claude plugin
update`, and this repository's trigger fixture, because every one of them matches that
field with a regular expression. The skills CLI uses a real parser, reported *No valid
skills found*, and the family launcher exited 1 on that member — so the hub copy that
twelve non-Claude-Code agents read sat on the previous version and was refreshed by hand
after each of the last four releases.

The regression arrived in 1.37.0, the release that gave the skill its plain visual
vocabulary. **It fixed routing and broke installation in the same commit**, and the two
defects were invisible to each other because they are read by different parsers.

Three things changed so this cannot repeat quietly:

- `test/advertised_check.js` refuses an unquoted, non-block scalar containing `": "`,
  measured across all **69** scalar lines the family ships — two hits, both this defect.
  It runs from each member's own gate, before that member can tag.
- **Its early exit is gone.** A member carrying no routed triggers used to get
  `ok: … carries no routed triggers` and no inspection at all — so `agent-stack`, the one
  member with no routes, was the one place nothing looked. Front matter is now checked
  for every skill of every member first, and `agent-stack` 0.11.1 is wired to call it.
- `test/validate.py` runs the **strict** form here, with a real YAML parser, over every
  shipped `SKILL.md` including the `.cursor` mirrors. It discloses when pyyaml is absent
  rather than passing.

Each of the three was watched failing against the real defect rather than a fixture of it.

**Pins: `sheleg-design` 1.37.3 → 1.37.4, `agent-stack` 0.11.0 → 0.11.1.**

## v0.69.0 — a board row that says work exists names where it lives

**B-58, filed one cycle ago and closed by the rule it asked for.** `open` claims nothing
exists; `parked` claims something does, and its status cell now carries a branch or a
commit. Two rules gate it in `task-pipeline` 1.62.0: an open row may not home its work in
a per-session directory, and a `parked` status without a ref is refused.

**The prose detector was measured first, and thrown away.** Matching *"parked"*, *"is
built"*, *"ready to merge"* in the description cell fired on **three rows out of 187 and
every hit was false** — two closed rows narrating the incident that produced the rule, and
the row that asked for it. This family discards that shape rather than tuning it; the
precedent is B-48, where token-matching descriptions produced four false failures out of
eight members and was dropped whole. What ships reads the **status cell**, which is never
prose, and both rules measure **zero** across 191 rows including the seeded templates.

**The first draft read `cells[-2]`** — the status in this repository's eight-column board
and the *Home* column in the ten-column template. So the parked rule examined the wrong
cell and reported nothing, fifty lines below the validator's own comment explaining why
positional reads fail on exactly this corpus. It is position-free now, and what proved it
was the plant that had been silently passing.

**Pin: `task-pipeline` 1.61.0 → 1.62.0.** Guards there: 347 → **349**.

## v0.68.0 — the command that was built, parked, and lost

**B-43's premise had expired, and only going to merge it would have shown that.** The row
recorded `templates/exposure.sh`, fourteen green fixtures and three negatives as finished
and parked in a session scratchpad, blocked purely on a concurrent release. Two days
later the scratchpad was gone — and so was the work: not on disk, not in git history, not
in a stash, not in a dangling object. **A board row described artifacts that no longer
existed**, and nothing in the family could have said so.

Rebuilt in `task-pipeline` 1.61.0, and this time the repository holds it: the validator
asserts that each seeded shell script exists, carries a shebang, and is still named by
the doctrine that tells a project to copy it. All three watched failing.

Three of the fourteen fixtures caught real defects in the rebuild, and all three lied in
the **reassuring** direction — which is the reason a suite is worth its cost:

- `$(grep -c "" f || echo 0)` yields **two** zeroes when nothing matches, because grep
  prints its own `0` and exits 1, so the fallback runs too. Every numeric test after it
  died with *integer expression expected* — and only in the case that means *everything
  is confirmed*.
- BSD `sort` exits *Illegal byte sequence* on a non-ASCII column under a UTF-8 locale.
  The error went to stderr, the check-list came out empty, and the count above it still
  read 126 unverified.
- A byte-wise `substr` cut a Cyrillic letter in half.

**Pin: `task-pipeline` 1.60.1 → 1.61.0.** Guards there: 344 → **347**.

**The row's own lesson is about the board, not the script.** "Built and parked" is a claim
about a filesystem that no gate reads, and a scratchpad is not version control. A row
that parks work should name the branch or the commit holding it; one that names a temp
directory is a promise with an expiry date nobody wrote down.

## v0.67.0 — a contributing guide that described a different repository

**B-47, and the row under-counted it.** `sheleg-dev`'s `CONTRIBUTING.md` routed
contributions to `benchmarks.md`, `growth-plays.md`, `myths.md`, `algorithm-updates.md`,
`aeo-geo.md` and `scripts/page_audit.py` — six files that all belong to `seo-aeo-audit`,
none of which `git ls-files` returns there. Sweeping every file name in the document
instead of reading the one table found **eleven** absent, including a reference under a
skill directory named `sheleg-dev` that has never existed: the six skills are
`stripe-billing`, `crypto-payments`, `ad-tracking`, `google-signin`, `google-auth` and
`frontend-performance`.

The document was a sibling's, adapted at the edges. It promised a standard-library
auditor and a second test command over a repository with **no runtime code at all**.
Rewritten against what the repository actually contains, and the numbers in it are
counted rather than inherited: six skills, twenty reference files, one executable
(`install.sh`), a four-way version sync, eight negative self-tests in CI.

**The new guard is narrow, and the first draft proved why it had to be.** It checks only
the *Where things go* table, because a general "every path in this file must exist" rule
cannot tell a path being **used** from a path being **discussed** — the rewrite names
three `seo-aeo-audit` files on purpose, to send a reader who wants them to the right
repository. The first draft read the whole section and flagged exactly those three, one
paragraph after the comment explaining why it must not. Standing instruction #7, caught
by its author inside the change that cites it. A bare filename resolves by basename, so
the generic `SKILL.md` passes while `benchmarks.md` does not; watched rejecting the
original row verbatim, with the same plant wired into `sheleg-dev`'s CI.

**Pin: `sheleg-dev` 0.5.1 → 0.5.2.**

## v0.66.0 — a stamp typed from memory names nothing

**Two guards, because the first one's own CI run taught the second.** The stamp check
went red in CI on twenty real commits: `actions/checkout` clones shallow, so August's
history is simply absent there. It now reads `git rev-parse --is-shallow-repository` and
**discloses** rather than failing — a checkout that cannot look must never report a
verdict — and the workflow takes `fetch-depth: 0` so CI can actually look. 224 commits,
37 MB; the cost is a second.

Wiring that flag exposed the other one. The inserted `with: fetch-depth: 0` landed **above**
the step's existing `with: submodules: recursive`, giving the step two `with:` keys —
valid YAML, silently keeping the last, so the setting did not exist. `yaml.safe_load` said
*ok*, and so would GitHub. `check_workflows_parse` now refuses duplicate keys with a
constructor that names the key and its line, watched failing against a planted
`submodules:` written twice.

**A stamp typed from memory names nothing, and now the gate says so.** Twice today a run
stamp in `docs/evidence/retro.md` carried a SHA that had never existed — `dd0b1a2`, then
`f9c3a4e` — both caught by hand, minutes apart, by the author who wrote them. That is not
an attention problem: the SHA is unknowable until the commit is made, so it gets typed, and
typing it is guessing. `task-pipeline` shipped this rule for its own docs in v1.60.0 and
this repository never grew the check.

It asserts two things, because resolution alone is not enough: the object exists **and** it
is reachable from `HEAD`. A stamp naming a commit an amend replaced resolves on the machine
that wrote it and in no clone — standing instruction #10, which this file's history records
twice. **31 stamps** are under it, and both shapes were watched failing separately: a
fabricated SHA (*does not resolve*) and a real orphan commit built with `git commit-tree`
(*resolves but is not reachable from HEAD*).

## v0.65.0 — the phrase that reached no route, and the word that could not fix it

**B-53, closed with a measurement rather than a deferral.** `сделай дизайн лендинга`
matched no route at all, and the obvious repair is unavailable: bare `дизайн` is a
substring of this route's own refusal «без дизайна», and a trigger inside a refusal makes
the refusal unsayable. The two-word `дизайн лендинга` / `design a landing` clears the
clash check and is the more precise thing anyway — it reaches `sheleg-design` while
`напиши текст для лендинга` still goes to `copywriting` alone, which the bare noun
`лендинг` would have broken.

It **replaces** `cinematic landing` / `кинематографичный лендинг` rather than joining it,
because `sheleg-design`'s description had six characters of budget left. The loss was
measured before it was taken: `make the hero more cinematic`, the case that pair was
really for, still reaches here through `hero`.

**The composition half of the row is answered, and the answer is no.** B-53 asked whether
the phrase should open the whole chain. `ux-flows` advertises nothing about landing pages,
and reading it says why: its subject is how users **move** through a product — task
analysis, flows, branches, error paths, screen states. A marketing page has no flow. So a
landing is `sheleg-design` ∥ `copywriting` plus `task-pipeline` for delivery, `super-ux`
is correctly absent, and the hook naming the craft that was actually asked for is the
behaviour rather than the gap.

Two drivers written earlier today were repaired before being reused: the version bump now
walks with `os.walk` instead of `glob('**/*.json')`, which skips dotted directories and is
why `.claude-plugin/*.json` went unbumped across seven members, and it now matches the
quoted `version: "x"` and `VERSION = "x"` forms that made `make-skill` and `agent-sync`
tag half-synced. Six surfaces moved on this release where the old driver found four.

**Pin: `sheleg-design` 1.37.2 → 1.37.3.**

## v0.64.0 — the invariant moves to where it can be broken

**Seven members can now refuse a description that breaks the routing hook.** B-54: every
trigger in `lib/triggers.js` must be a word the member's own `description` advertises, and
`test/triggers_test.js` has always asserted that — one repository away from the only file
that can break it, and after the member has already tagged. That is not hypothetical
distance: `sheleg-design` 1.37.0 shipped green on 4636 of its own checks having dropped
`фигма в код`, this repository went red minutes later, and 1.37.1 was the cost.

`test/advertised_check.js` makes the assertion addressable from a member:

    node <umbrella>/test/advertised_check.js --member <name> --root <checkout>

Each of the seven members carrying routed triggers now calls it from its own
`validate.py`. **No copy of the table travels with them** — the checker reads
`lib/triggers.js`, the module the hook itself calls, so there is nothing to drift. Where
no umbrella sits above the checkout, which is every member's standalone CI, they disclose
rather than pass.

That last property has a consequence worth stating rather than discovering: **the negative
self-test cannot live in the members.** A plant in a member's CI would assert a refusal
that cannot happen there. So it lives here, where the submodules exist:
`test/advertised_plants_test.py` drops one of each member's own advertised phrases from its
shipped `SKILL.md`, runs that member's own `validate.py`, requires a non-zero exit *and*
the specific message, and restores the file before judging. **7 of 7 refuse.** Watched
failing too — with the call deleted from `agent-sync`'s validator the sweep exits 1 and
names it, which matters because that member's other checks reject the planted description
anyway: a sweep testing only the exit code would have called it caught.

Two of this run's own instruments were wrong before the subject was, and both were caught
by asserts rather than by reading. The plant first replaced one occurrence of a phrase and
read `super-ux` as not refusing — a phrase advertised twice survives one replacement. And
the version-surface driver used `glob('**/*.json')`, which does not descend into dotted
directories, so `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` — two of
the three JSON surfaces every member has — went unbumped in all seven. `os.walk` now, and
the members' own version-sync gates would have caught it in any case.

**The sweep is not in `npm test`, and the number is why.** It runs seven member
validators and costs ~21 s; with it in, this repository's suite went from 3.3 s to 26.2 s
— and `npm test` is wired to the per-commit gate whose whole honesty argument is that
number. *A synchronous gate at three minutes is a gate people route around*, written in
`hooks/repo-gate.js` by the same hand that would have broken it here. So the sweep has its
own entry point, `npm run test:plants`, plus a CI step; the suite is back to 5.2 s.

Excluding it by name from the runner was the other option and was refused: `test/run.js`
discovers rather than lists, deliberately, because three hand-written lists in this family
each missed a shipped surface. The cost of not being discovered is that nothing calls it,
which this repository has been bitten by before — so `validate.py` asserts **both** ends,
the `package.json` entry point and the CI step, each watched failing against its own
deletion.

**Pins, all seven:** `sheleg-design` 1.37.2, `task-pipeline` 1.60.1, `super-ux` 0.41.4,
`make-skill` 0.19.1, `seo-aeo-audit` 0.20.2, `agent-sync` 1.11.1, `sheleg-dev` 0.5.1.
`agent-stack` carries no routed triggers and is unchanged, which the checker says out loud
rather than passing silently.

## v0.63.0 — the pin is a tag, the hub is a branch, and nothing compared them

**A crash sat released for six hours and every gate was green.** `seo-aeo-audit`'s `main`
carried `b063131` — a fix for a `KeyError` that killed the default markdown output on any
page without FAQ schema, which is most pages — committed at 02:25 and never tagged. So
`skills.json` advertised **0.20.0, the version that crashes**, while the hub copy every
non-Claude-Code agent reads already had the repair. Both channels were internally
consistent; they disagreed with each other. `check_pins.py` stayed green throughout and
was right to: the pin did match the latest release. The latest release was the problem.

Found while measuring B-56 — and not the way B-56 predicted. The row said channels go
*stale*; the hub was **ahead**. What the measurement actually exposed is structural: the
pin is a **tag**, the skills-CLI channels install from the **branch**, and until today
nothing in the family compared those two promises.

`test/release_lag.py` does now, with `test/release_lag_test.py` behind it (6 cases). Two
properties are deliberate:

- **It discloses, it never fails.** Between a member's tag and the umbrella's re-pin the
  branch is ahead *by design*, on every release. A gate that reddens there is the
  racy-gate class this repository already named, and the seo fix never needed the build
  stopped — it needed one line saying it was waiting.
- **A checkout with no `origin/main` reads `blind`, never `current`.** Reporting "nothing
  unreleased" from a ref that does not exist would give every member the same clean
  answer for the same empty reason, which is the uniform-measurement failure this
  repository has now caught five times. It reads local refs only and never fetches, so it
  can miss a lag and cannot invent one — `npm test` stays offline and the network stays
  `check_pins.py`'s.

Watched firing on the real thing before shipping, not only on fixtures: with the
submodule set one commit behind its branch, `npm test` printed *seo-aeo-audit: 1
unreleased commit on main, newest 'fix: release the crash…'*, and printed nothing after
the checkout was restored.

**Pin: `seo-aeo-audit` 0.20.0 → 0.20.1**, which is that fix, released. Its guard was
watched failing against the reinstated defect first — `page_audit.py emits severity
['low'] that SEVERITY_ORDER cannot order` — and the guard is the general form rather than
the incident: it parses `SEVERITY_ORDER` out of each script and compares it against every
severity that script emits, so the next severity added anywhere fails the suite instead
of the next real page.

## v0.62.0 — the router nobody could reach by asking

**The routing hook can now be reached by asking for visual work.** Board row `B-49`:
every one of `sheleg-design`'s fifteen triggers was a compound noun phrase, so the
router that owns the visual layer matched none of the ways an operator actually asks
for it. Measured before the change — `поменяй палитру`, `подбери цвета`, `сделай
красиво`, `make the hero more cinematic`, `поправь типографику`, `какой шрифт тут`,
`анимация на скролле`, `сделай paywall красивее`: **eight prompts, zero routes.**

Fourteen bare words are added — `палитра`/`palette`, `цвета`/`colors`,
`типографика`/`typography`, `шрифт`/`font`, `выглядит`/`how it looks`,
`красиво`/`красивее`/`make it prettier`, `анимация`, `hero` — and the exception to this
table's own *whole phrases, never bare words* rule is measured rather than asserted:
these words carry no second trade, so the precision a phrase buys elsewhere buys nothing
here. After: **8 route, and nine controls stay silent** — a payment bug, a landing-page
text, a production check, a test, a README, a refactor, a question (`почему палитра
сломалась?`) and both opt-outs (`без дизайна`, `как есть`).

Two of those needed the mechanism read rather than guessed. `красиво` and `красивее` are
both listed because the stemmer cannot bridge them — `красивее` cuts to `красиве`, which
is not a prefix of `красиво` — and a bare stem in the table would have passed the
advertisement check on a substring while defeating what that check is for.

**`дизайн` cannot be a trigger and is not one.** It is a substring of this route's own
refusal «без дизайна», and a trigger inside a refusal makes the refusal unsayable; the
fixture rejects it. The measured consequence is recorded next to the decision: `сделай
дизайн лендинга` matches no route at all — not `super-ux`, as a first draft of that
comment claimed before the matcher was run.

**Pin: `sheleg-design` 1.36.1 → 1.37.1**, the release that advertises those words. Its
1.37.0 rewrite dropped `фигма в код` from the description while the trigger stayed live
here; `test/triggers_test.js` caught it and 1.37.1 restored the phrase. Worth naming
because the member's own green gate could not have: **the invariant that every trigger
is a word its skill advertises is enforced one repository away from the file that can
break it.**

## v0.61.0 — the gate we ship, running on us

Four board rows close, and three of them close because something finally ran.

### Pinned

- **`task-pipeline` 1.58.0 → 1.60.0.** Two releases: *never amend a commit a record
  already names* — a procedure that invited its own defect and fired twice in one
  close-out — and then **the documentation gate this skill ships to every project, running
  on that project for the first time.** One line of wiring; five findings, each silent in
  a different way. Two of its silences were structural: the SHA section asked `[ -d .git ]`
  and a submodule's `.git` is a file (**the third time in two days** that shape disarmed
  something), and its corpus default still named the artifact root as it was before the
  2026-08-13 rename, so every migrated project got `dormant` — which reads exactly like
  having nothing to check.

### Added here

- **CI runs `agent_sync.py check` across every repository that declares a coordination
  config** (`B-46`). Forty-one coordination problems once accumulated because each
  repository's own validator was green and none of them asks whether the config describes
  files that exist. The step refuses a run that finds fewer than two configs, because a
  loop over nothing reports success for everything it skipped. Its first execution found
  `task-pipeline` unhealthy on two counts; **all nine now exit 0.**
- **A member that changes the skills it ships must reword its description in the same
  change** (`B-48`'s remaining half). Token-matching a description against skill names was
  tried and produced **four false failures out of eight members** — the concept was in
  every description and the word was not — so it is not that check. The **co-edit** is
  mechanical and needs no opinion about prose: `skillNames` moved and `desc` did not.

### Closed by measurement

- **`B-17`** — `negatives.py` reporting a broken guard from a submodule checkout, fixed by
  the `--git-common-dir` work rather than directly, and verified from that checkout.
- **`B-52`** — the stamping procedure, closed by the doctrine and the gate that now asks
  for reachability instead of resolution.

## v0.60.0 — the same defect in four more places, and a body under its budget

v0.59.0 shipped the graph model and audited one skill against it. This release applies it
to the rest of the family and finds the same sentence four more times: **work fans out, the
branches each go green, and the node that consumes them trusts them because they arrived.**

### Pinned

- **`task-pipeline` 1.57.0 → 1.58.0.** Three convergences that had no check now have one —
  the stage-0 harvest (eight independent sources landing in one brief, none compared with
  the others), stage 3's COPY and VISUAL (also a **fake edge**: neither consumes the other,
  and their real failure is each being right alone while they disagree on one screen), and
  stage 9's three artifacts. Plus the id/version allocation this repository actually uses,
  written down. Guards 339 → 344.
- **`agent-stack` 0.10.1 → 0.11.0.** The orchestrator body is **5670 → 4728 tokens**, under
  its own 4750 budget for the first time and by splitting three layers out rather than
  trimming every section. A new check for **one home per fact** — existence was checked in
  both directions and nothing checked whether two references *say the same thing* — which
  caught its own author mid-split. A seventh scanner detector, `declared-deps-ignored`.
- **`super-ux` 0.40.0 → 0.41.0.** `ux-audit` checks its parallel batches against each other
  before the report reads as one answer. The scenario base already had the mechanism one
  layer up; this is it applied to the audit's own outputs.
- **`seo-aeo-audit` 0.17.1 → 0.20.0.** The ten tracks are checked against each other before
  triage: two recommendations that cannot both be executed, one root cause wearing three
  track names, incompatible evidence rungs on one URL. Two of those three releases came from
  a concurrent session; this run rebased onto them rather than pinning past them.
- **`sheleg-design` 1.31.0 → 1.36.1.** Five releases by a concurrent session, verified
  against the published tag before the pointer moved.

### Changed here

- **The family's composition order had a fake edge in it.** `super-ux → sheleg-design →
  copywriting → task-pipeline` said copy waits for the visual. It does not: copy is written
  from the scenarios and the brand pack, the visual from the frame and the style pack. The
  block now says `super-ux → { sheleg-design ∥ copywriting } → task-pipeline`, names the
  scenario set as what crosses every arrow, and points at the one thing that *is* shared —
  the screen they both land on.
- **Every member declares its shape.** `shape` and `shapeWhy` are required fields, checked:
  the answer must contain `static` or `dynamic`, and the reason must be a reason. A run that
  has to be auditable is static, and until now only one member said so.
- **The shadow prune reads the installed set, not the marketplace listing.** Measured: fed
  the marketplace list, `shadowsToPrune` deleted the plain copy of a member whose plugin was
  **not installed** — the only copy, and the skill with it. `marketplace add` and `plugin
  install` are separate operations and a marketplace outlives its plugin. The caller now
  reads `installed_plugins.json` and prunes nothing when it cannot; a guard refuses the old
  argument, and the code comment that already stated the correct rule now matches the code.

## v0.59.0 — the shape of the work, and the arrow that carried nothing

Two members move together, because the same material lands in both: `agent-stack` learns
to decide the **shape** of a job before doing it, and `task-pipeline` gets audited against
that model and repaired where it declared a graph and executed a list.

Source: *Graph Engineering with Claude*
(`https://x.com/Mahaximus_/status/2082442856417956173`, 2026-07-29). It lives in exactly
one place — `agent-stack`'s `agent-orchestrator/references/graph-engineering.md` — and
this repository keeps a pointer in `docs/DOCMAP.md` and no copy.

### Pinned

- **`agent-stack` 0.9.0 → 0.10.1.** A nineteenth reference: node and edge, the fake-edge
  test, the diamond and its two silent failures, the checker node, static versus dynamic,
  and the cost table that says when a graph is not worth building. Plus what the host
  **actually** executes, with the version evidence — the `workflow` keyword the source
  names was renamed to `ultracode` in Claude Code **v2.1.160**, six weeks after the
  article was published, and the YAML it shows is a way of describing a graph in a prompt
  rather than a syntax anything parses. A sixth scanner detector, `unguarded-fanout`. And
  a removal: the hardcoded context-window table, nine 2024-vintage vendor ids that would
  have sized a budget for a window an order of magnitude too small.
- **`task-pipeline` 1.55.0 → 1.57.0**, and the jump is two releases, not one. A concurrent
  session shipped its own **1.56.0** — the browser-channel work — while this branch was in
  its fifth review round, and both claimed the number. This run's work is **1.57.0**; the
  collision is recorded in that repository's own CHANGELOG and traced to the umbrella's open
  row **B-45**: an id register declared against a backend that cannot allocate is a register
  in name only, and it cost a version number and a board id in the same afternoon. Audited against the same model. Nine of its ten
  macro stage edges carry data, which is why nothing was reordered; what was missing was
  the test for the tenth. The fake-edge test as a procedure, a **`Carries` column** in the
  plan's execution table so an unfillable payload is visible rather than remembered, an
  `Edges:` count the stage-4 gate reads, and a **group convergence check** after a
  fanned-out group and before the first worktree lands — because a per-task review reads
  one diff and the defect between two diffs passes both. Guards 318 → **333**: six for the
  new doctrine, nine more after an independent reviewer found three rounds of gaps in those
  six — including two that were defects rather than nits, both the same shape. A change
  that closes one of the two places its defect lives reads as closed.

### Fixed here

- **`skills.json`'s `agent-stack` description advertised two skills of four**, which is
  the open half of board row **B-48** — `list` and the family table both hid the harness
  layer entirely. Rewritten to name all four, and the README row with it. The closed half
  (`skillNames` checked in both directions) shipped in v0.33.0; this is the half nothing
  can check, so it is fixed by counting at release rather than by a guard.

### Recorded, not fixed

- **A concurrent session released `agent-stack` 0.9.0 and moved this repository's pin
  mid-run**, between this run's stage 0 and its stage 2. Nothing was lost — the working
  tree held one untracked brief — and the harvest ledger was corrected rather than left
  saying 0.8.0. Detected by `git submodule status` disagreeing with a reading taken forty
  minutes earlier, not by anything in the run.

## v0.58.0 — colour as ornament, and the scenario that outperformed the gates

`sheleg-design` 1.29.0 → **1.31.0**, carrying a twentieth style pack, **`paperclip`**,
measured off <https://paperclip.ing> — plus the fix pass its own routing scenario forced.

The pack holds a thesis the library did not: **colour is ornament.** A neutral coal field
with no functional colour anywhere in the interface — every control monochrome, every
container a hairline, every status a word with a mark beside it — and the whole chromatic
budget spent on two things a reader cannot click: a curtain of 96 gradient capsules behind
the headline, generated from one hue-rotation rule (+12.39° on the top stop, −10.45° on the
bottom, across 45 gradients and 89 distinct stops), and twelve gradient section badges under
a single noise recipe. Delete every colour from the page and it loses its poster, not its
meaning.

Two things about this release are worth the pin note.

**It was authored against a live concurrent run.** Another agent held the `PACK-TENOR`
lease on the same checkout and was mid-flight on `ora` and `tenor`. This work took its own
`git worktree` per that repo's `docs/DOCMAP.md`, left the shared tree untouched for the
whole authoring pass, and merged only after that run committed and released 1.29.0 — which
was the version this branch had already taken in order to avoid a collision, so the
collision arrived from the other side anyway. Filed in the pack's brief as a finding rather
than a footnote: a version is not reservable by guessing.

**Its routing scenario found twenty-six defects that three gates had passed three times.**
T29 ran blind against the installed bundle, went green on both branches, and returned
findings the consistency gate's check count did not move by one to accommodate — because
not one of them was structural. A token prescribed in prose and never declared; a 2.92:1
label on a tab a reader has to click; a second resting shadow hardcoding the wrong theme's
amber; three stagger formulas written as literals, which quietly made the reduced-motion
token a no-op on every diagram in the pack. Fifteen further findings against
`instrument-console` are filed on that repo's board (B-038 … B-043) rather than fixed,
because they belong to a pack the run does not own.

## v0.57.0 — two references measured, not composed

`sheleg-design` 1.27.1 → **1.29.0**, carrying the eighteenth and nineteenth style
packs. Both are live-site extractions, which in this family is the only legal way to
make a pack: the values are read off a shipped stylesheet and the ones that cannot be
are marked derived at their declaration.

**`ora`** — <https://ora.ai> — a warm coal field where **the accent is the inverted
field**, so the single solid object on a page is the one meant to be pressed; a serif
doing the sans job over a monospace that carries every machine fact; and a terminal
surface cut *below* the page plane. The library's first pack whose default theme is
dark, because that is the reference's own arrangement.

**`tenor`** — <https://heytenor.com> — the first extraction from a **hand-authored**
stylesheet rather than a compiled bundle, so the vocabulary is the reference's own.
Zero `border-radius` and zero `box-shadow` in the whole file, one hairline weight, and
an accent that only exists on hover and on focus: the page screenshots with no colour
in it at all. Severity is carried by value rather than hue, and by the word beside it.

Twelve defects in the two references are recorded in the packs rather than copied
forward. Two are worth naming from here because they are the class this family exists
to catch: `ora`'s `--border-strong` is declared once in the light `:root` and never
re-declared for dark, so it paints a paper-coloured hairline at 12.02:1 on coal; and
`tenor`'s accent clears its non-text floor by 0.02, and since contrast is symmetric,
every CTA label drops from 17.61:1 to 3.02:1 at the moment it is hovered.

Three ratios in the author's own prose were wrong on first write and were caught by
recomputing rather than by a gate, which skips a line naming no partner. They are in
the member's verification ledger as found rather than as avoided.

## v0.56.0 — the browser step in the pipeline stops being one vendor

`task-pipeline` 1.54.0 → **1.55.0**. The pipeline has told every web project to
check the rendered surface at three stages since 1.36.0 and named exactly one way
to do it — the `chrome-devtools` MCP, behind a plugin install. `playwright` now
sits beside it, **ranked by nothing**: the matrix states what each channel reaches
rather than which is better, one detection rule covers both, and a run stops at the
first that answers. Either satisfies the browser step; neither is a gate.

Two things the release settled that this family cares about beyond the browser. A
green **browser test suite** is the coverage half of stage 6 and never the look —
it proves what someone thought to assert, and the console error nobody asserted on
is exactly what the look is for. And what the look finds is fixed in the stage that
found it, on the same terms the stage's own gate already sets.

**The member's own release found a defect in the check that was supposed to prove
it.** A pipe inside a companion-matrix cell truncates every reader of that table, so
the `graphify` row had been passing its stage check without comparing anything since
the row was added. The first guard written for it tested the escaped spelling only,
and the independent reader broke it with a bare pipe in one move — then measured
every row and found `agent-sync` deriving nothing from `stage-10`. Both are closed,
guards 315 → 318, and the umbrella's own `B-40` was the same class from the other
side.

## v0.55.0 — a ninth router, for the layer that takes the money

The routing block named eight routers and none of them owned the payment and
analytics layer. An agent asked to build a paywall got UX from `super-ux`, the
visual from `sheleg-design`, the words from `copywriting`, and improvised the
Stripe wiring and the pixel — which are precisely the two seams that fail
without changing what the funnel looks like.

**`sheleg-dev` becomes the ninth router,** fourth in table order, among the ones
that say what the change contains. Its boundary is *wired, not decided*: the
tiers belong to `super-ux`, the look to `sheleg-design`, the words to
`copywriting`, and the price to nobody's skill. Refusal phrase «без интеграций».

**A premise was measured and disproved before anything was written.** The
assumption behind this work was that funnels are unrouted. They are not:
`routers-registry.js:31` has named them in the `super-ux` text all along. The
surviving gap was the pack behind the money, which is what this release closes.

**The first router that fronts a pack rather than a skill.** A route key must
equal the router name, so `sheleg-dev` cannot be split into six routes, and one
skill's description cannot advertise all six skills' trigger words. Routes may
now declare `sources` — one entry per skill, each carrying triggers that *that*
skill's own description advertises. `triggers` and `skill` are derived from them,
so `match`, the refusal-clash check and the self-match check read the table
exactly as before, and one new check holds every source against a shipped skill
so a typo in sources 2..N cannot hide behind a valid first one.

**The check that proves a trigger is advertised had been reading one line of
fifteen.** Its description parser used `$` under `/m`, which matches at the end
of the *first line*, so a folded YAML scalar was cut there: 74 characters of
`stripe-billing` instead of 993, for every skill, since the check was written.
`desc.length > 40` never fired because one line clears forty. Found because a
route whose triggers were real words from real descriptions was reported missing.
The end anchor is now `(?![\s\S])`, the floor is 200 characters, and whitespace
is collapsed for the reason `router_texts_test.js` already collapses it — a
folded scalar wraps, and `"оплата\n  подпиской"` is a phrase the skill does
advertise.

**Pins.** `super-ux` 0.39.0 → 0.40.0 and `sheleg-dev` 0.4.3 → 0.5.0, released in
this run. `agent-stack` 0.7.2 → 0.8.0 was released by another session while this
one was in flight: `check_pins.py` reported it BEHIND, the tag and npm confirmed
the release was complete, no run held a lease, and the coordination commit from
this run is contained in their `main`. Its `skillNames` gained `agent-harness`,
which 0.8.0 ships and the registry did not list — a version bumped without it
would have left the launcher advertising three skills against four.

**Coordination was red in all nine repositories** on the day the umbrella started
saying it was on: 41 problems, none of the configs ever run through `check`. Two
classes, both mechanical. Patterns matching no tracked file — the umbrella
guarded ten `skills/*` paths that a gitlink makes unmatchable, and seven members
guarded a `test/negatives.py` that `B-26` records the decision **not** to create.
And `.env.agent-sync` uncovered by `.gitignore`, one `git add -A` from a remote.
Eight of nine are clean now; `task-pipeline` is untouched on purpose, carrying
another session's uncommitted v1.55.0, and its own problem needs a decision
rather than an edit.

`sheleg-design`'s `.gitignore` also had an inert negation: `.claude/` excludes the
directory, and git cannot re-include a file whose parent directory is excluded, so
`!.claude/agent-sync.json` was doing nothing and the file survived only because it
was already tracked. `.claude/*` makes the negation real.

## v0.54.0 — four rows close, and three of them were filed on a premise that was wrong

A board is a claim about a repository, and this sweep found three of its own claims false
by measuring instead of reading — which is standing instruction #5 firing on the person
who wrote the board.

### Decided

- **Which channel a hook ships through (B-19).** Recorded in `docs/DOCMAP.md`: **the
  channel follows the shape of the thing, not a preference.** A plugin has a manifest and
  needs no write to the operator's file; a launcher has no manifest and no alternative,
  and the umbrella's `PreToolUse` entry is the backup that exists because
  `~/.claude/CLAUDE.md` was destroyed twice. Three events fire in both channels — six
  scripts, six jobs, not duplication. What is now forbidden and guarded: a member shipping
  a plugin manifest may never also wire itself into `settings.json`, because uninstalling
  the plugin would leave that entry firing and owned by nobody.

### Fixed

- **Standing-instruction ids are stable, and the collision that already happened is
  named (B-23).** `#1` was retired on 2026-08-13 and refilled the same day, so a citation
  of `#1` means two different rules depending on its date. Both sides have citations in
  shipped documents, so it is **recorded rather than rewritten** — renumbering either
  would make a published sentence point at a rule it never meant. The guard refuses any
  further reuse, a reorder, and the rule's own disappearance from the file it governs.
- **The code graph refreshes on this machine after all (B-24).** The row said it could
  not: `graphify . --update` needs an LLM key, but the CLI verb `graphify update .` does
  not, and it already refuses to overwrite with a smaller graph. **715 → 930 nodes**,
  1094 edges, curated graph backed up. Stated in both directions: `document` +161, `code`
  +76, and **`rationale` −22** — 54 labels only a semantic pass can produce. The stage-9
  hub check then ran for the first time: all 8 god-nodes are named in the docs.
- **`npm test` exists in `make-skill` and `sheleg-dev` (B-41)**, running exactly what
  their CI's blocking steps run.

### Caught by its own CI, one commit later

The coordination guard above read the **working tree**. Seven member configs had been
seeded locally, five committed, and the guard was green here while CI — which checks out
the pinned commits — failed on the two that were never committed. That is the same defect
as the pin guard two sections up, in a check written the same afternoon: *a check that
reads a working tree reports a state no clone can reproduce.* It asks git now, and was
watched failing on both shapes — file absent, and file present but untracked.

`sheleg-design` gitignores `.claude/` deliberately, so it un-ignores exactly one file
rather than the directory: `agent-sync` resolves a project by
`<root>/.claude/agent-sync.json` and nowhere else, so that config has no other home.

### Board

Nine rows closed today across five repositories. What stays open: **B-29** (99 rows at
`never` — the count comes down only when a person looks, which is the one thing a machine
may not do here), **B-43** and **B-17**, both parked behind a concurrent session's
unreleased `task-pipeline` v1.55.0, and **B-07** / **B-08**, waived at intake and
re-derived rather than quietly dropped.

## v0.53.0 — the pin is about a checkout, so it stops reading a working tree

`npm test` went red on 2026-08-14 with `'task-pipeline' pinned at 1.54.0 but the
submodule contains 1.55.0`. 1.55.0 existed nowhere: no tag carried it, npm had never
served it, and a clone of that hub commit would have installed 1.54.0 — the pinned
number. It was an uncommitted bump in a **concurrent session's working tree**, and the
gate had read the file on disk.

The invariant says *a checkout of any hub commit must install exactly the versions
`skills.json` advertises*. A checkout gets the submodule at its gitlink. Whatever a local
tree holds uncommitted is not part of that, and the remedy an operator would reach for —
bump the pin to 1.55.0 — would have advertised a version nobody had released.

### Changed

- **`test/pin_source.py`** decides in a pure module: `read_committed()` asks git, and
  `resolve()` returns one of four verdicts. `mismatch` fails. `dirty` and `blind` are
  **disclosed through `unlooked:`** rather than swallowed — a check that quietly ignores
  an edit is how the edit ships — and neither is red, because the pin is not what they
  disagree with. 7 fixtures on real git repositories, the third being the incident.
- **A real mismatch is still red, and now has its own plant.** That was the half that
  could rot silently: the loud half fires on every run, this one never would.

### Fixed

- **`test/run.js` discovers python suites instead of naming one.** `plant_guard_test.py`
  was hard-coded, and a second python suite arriving today would have been a second
  hand-written line — invariant #4 of this repository's own house rules, broken inside the
  file that runs the guards. An empty side is now reported as a broken glob rather than a
  passing suite.

### Board

**B-43** and **B-44** filed. The second is the one worth reading: the umbrella has
coordination and its submodules do not, so a lease taken on a board row here says nothing
about the member the row is worked in. Two sessions edited `skills/task-pipeline` at once
today and `npm test` was green on the mixture, which is exactly why nothing noticed.
**B-29** stays open with its blocker removed and its work parked, because filling `Human`
is the one thing in that ledger a machine may not do.

## v0.52.0 — two members learn to hear a machine writing

`super-ux` **0.38.2 → 0.39.0** and `seo-aeo-audit` **0.16.3 → 0.17.0**, pins and
README table moved with the pointers.

The pack now has a rule against the register that reads as generated, and it is
a **distinction rather than a ban**: a dash standing in for a full stop, a comma
or a colon is out, and a dash the language requires stays, because a global ban
makes Russian ungrammatical on its first line. `B062` errors on what can be
established without parsing grammar and reports the rest rather than claiming a
difference it has not measured; `B063` carries the no-terminal-full-stop rule
from the string registry out to titles and headings. Fifteen machine-drafting
markers now carry ids, and the rule enters the Brand voice hard rule, so it
reads in every session rather than only when an agent opens a reference.

`seo-aeo-audit` takes the same rules into track E as `E4b`, and opens with the
ceiling: there is no measured ranking penalty for an em dash, the section
carries no evidence tier, and it does not fork the marker list.

Three defects surfaced inside that work and were fixed in it. `super-ux` had
never run its own linters in CI while installing a rule requiring exactly that
of every other project; `B005` dated a file by mtime, which a fresh clone
rewrites, so it would have fired on every run; and `docs/brand/lint.py` was a
seeded copy 227 lines behind its source, which the gate could not see because
it checked that a command *instructs* the copy rather than that the copy is
current. All three now have checks, and the seeded-copy gate compares bytes.

## v0.51.0 — acceptance can refuse a run that skipped a stage it declared

Stage 10 asked for a ladder walk, a coverage table and closed ledgers. It never asked
the cheapest question: **does the ledger account for every stage the flow declares?**

This repository's own 2026-08-13 run closed at acceptance with `0,1,2,5,6,7,8,9,10`
recorded and 3 (spec) and 4 (plan) never stamped. The artifacts existed — the REQ table
and the module map — folded into the brief; their verdicts did not. Detection was
already there: the status line printed `3· 4·` and 73%, correctly. Nothing read it, and
a display nothing refuses on is not a check. Stage 7's release gate could not have
caught it either — it fires before 8, 9 and 10 exist and asks only about the tests
stage.

### Added

- **`scripts/stage-coverage.sh`**, seeded from `task-pipeline` 1.54.0, and named in
  stage 10's own criterion in `pipeline.json` — the criterion runs first, before the
  ladder walk.
- **A guard that requires both halves.** The script must exist AND the final gate must
  name it: a criterion citing a script nobody seeded is prose, a script no criterion
  runs is a file, and neither implies the other. Watched failing on a plant that
  removes only the naming half.
- **Exit 2 when it cannot look** — no config, no ledger — which is not a pass.

The two missing stages were then stamped for what actually happened, folded-into noted
in the line rather than invented as separate documents. Coverage went 9/11 to 11/11.
The command still exits 1, because stage 5 is genuinely `pending` while the loop runs —
which is the check being right, not the check being broken.

Closes **B-31**. Pin: `task-pipeline` 1.53.0 → **1.54.0**.

## v0.50.0 — 2026-08-14

This repository ran an eleven-stage pipeline against a config that declared no gate
criteria at all.

### Fixed

- **`pipeline.json` was a skeleton.** Every one of its eleven stages was
  `{id, state, name, gate: {type}}` — **no `gate.check` anywhere** — `run.loop` carried no
  `mode`, and `version` held the task-pipeline RELEASE (`"1.50.0"`) where the schema wants
  the config-format version. **Twenty-four violations of the schema this family ships, and
  nothing checked.** The 2026-08-13 artifact-root run passed eleven gates whose criteria
  did not exist in the config; the agent supplied them from doctrine, which is better than
  nothing and is not what the config is for.
- **Eleven real criteria, drawn from what this repository actually does** — the source
  ledger and the graph's measured lag at stage 0; the single write path through
  `protect()` at stage 5; the CI verdict read *by the ref pushed* and the pin sweep at
  stage 7; the registry rather than the pipeline at stage 8; and at stage 10, releasing
  the lease **before** closing its board row, because the claim tag and the status share a
  cell here.

### Added

- **`check_pipeline_matches_its_schema()`** validates the config against
  `pipeline.schema.json` and, separately, refuses a gate whose criterion is blank or a
  placeholder — a gate that passes by being unreadable is how eleven of them went
  unnoticed. Watched failing against both: a criterion cut to `tests pass`, and `version`
  put back to the release string. Negative self-test in CI: **10 → 11**.
- CI installs `jsonschema` so the contract is **checked** rather than disclosed as
  skipped; absent, the validator still says so through its `unlooked:` channel rather than
  going quiet.

## v0.49.0 — 2026-08-14

A release could publish over a red suite in six of this family's nine repositories, and
one of them proved it. Coordination went on the same day, after a second session released
three packages while this run was mid-flight.

### Fixed

- **A release cannot publish over a red `validate` any more.** On 2026-08-12 `sheleg-dev`
  tagged v0.4.1 while its own validate run for that exact tag **failed**, and npm served
  0.4.1 four minutes later: two separate workflows, nothing connecting them. `validate.yml`
  is callable now and `release.yml` declares `needs: validate`, so the release runs **after**
  the real suite rather than beside a copy of it — **not one plant is duplicated.** Porting
  a negatives runner into every repo was the alternative and was rejected: six copies of a
  258-line script is new drift surface.
- **A guard keeps the connection there** — the trigger, the call and the `needs`, each
  checked. Calling the suite without depending on it lets the jobs run in parallel, which
  looks gated and is not. Watched failing against the planted removal.
- Shipped in `sheleg-dev` 0.4.3 · `agent-stack` 0.7.1 · `super-ux` 0.38.2 ·
  `make-skill` 0.18.1 · `seo-aeo-audit` 0.16.3, and here. Each release run now shows
  `validate / validate` completing before `release` and `publish`.

### Added

- **Coordination is on.** `agent-sync` with the local-files backend: six shared registers
  under a lease (the board, the verification ledger, the retro, `skills.json`, the family
  table, `pipeline.json`), and `docs/AGENT_SYNC.md` linked from `CLAUDE.md` so nobody has
  to infer the wiring. The lease is exclusive **on this machine**, which is the guarantee
  that matches the situation rather than the stronger one the record plane suggests.

### Why now, and what it cost to find out

A second session ran its own pipeline in these repositories while this run was working:
it released the umbrella to 0.48.0, `agent-stack` to 0.7.0 and `make-skill` to 0.18.0, and
added standing instruction #9. Nothing was lost — but this run wrote one CHANGELOG at a
version **behind its own tree**, caught a member moving under it twice, and found its own
uncommitted work sitting on `main` in two repositories. None of that is visible without a
lease.

Two board rows came out of turning it on: **B-34**, where `agent-sync`'s id registers read
a config key no shipped config writes and an absent key becomes `re.search("")`, which
matches — so `check` crashes instead of reporting. That is standing instruction #1 inside
the coordination tool, and `task-pipeline`'s own config has the same wrong key.

## v0.48.0 — 2026-08-14

The family gains a protocol layer, and loses the second copy of one it already had.

### Changed

- **`agent-stack` 0.6.1 → 0.7.0** — a third skill, **`agent-interop`**: the protocols an
  agent speaks outside its own process. MCP pinned at revision `2026-07-28` with the four
  features it deprecated (`sampling`, `roots`, `logging`, dynamic client registration),
  running many servers at once, mounting one so a client can reach it, the registry, A2A
  1.0, and the gateway layer. `skills.json` declares all three skills — the symmetric
  check added in v0.30.0 would otherwise let a shipped-but-undeclared skill reach nobody.

- **`make-skill` 0.17.1 → 0.18.0** — hands the protocol over and keeps the skill-author
  delta. Its `references/mcp.md` had been pinned to spec revision `2025-11-25` and called
  MCP *"a stateful protocol"* with an `initialize` handshake; the live specification now
  serves `2026-07-28`, whose own summary reads *"Stateless, self-contained requests."*
  Two descriptions of one protocol drift, and the stale one is indistinguishable from the
  current one — so there is now one description, it carries the revision it was read
  against, and a validator fails the build without that stamp.

### Known

- **`sheleg-dev` is pinned at 0.4.2 while npm serves 0.4.3.** Pre-existing, not from this
  run, and deliberately not adopted here: moving a pin to a release whose gate this run
  never executed is how *green* comes to read as *verified*. `npm test` is unaffected —
  `check_pins.py` is outside it by design, because the gate must work offline.

## v0.47.1 — 2026-08-14

The family's own standing instruction, applied where it was written. Until now #6 and its
corollary lived in this repository's retro and were honoured in exactly one repo of eight.

### Added

- **`test/plant_guard.py`** — one implementation of *did the plant actually land*, now in
  the umbrella, `make-skill` and `seo-aeo-audit`. `snap` before a plant, `verify` after:
  it compares **content and mode**, ignores `.git` churn, refuses when handed no tree or
  no snapshot (instruction #1), and keeps its manifest outside the tree it measures.
  Nine fixtures, wired into `test/run.js` — Python, so the `*_test.js` discovery cannot
  find it and the tally counts it explicitly rather than silently omitting it.

### Fixed

- **Every file-editing plant in this repository proves it landed.** Six inline guards
  replaced by the helper; three per-anchor asserts inside Python kept, because a named
  anchor is stronger evidence than a tree diff.
- **The last `sed -i` here is gone.** BSD sed needs an argument to `-i`, so the
  SSH-submodule-url plant errored and changed nothing on macOS — it could only ever be
  exercised in CI, which is how a broken plant elsewhere went unnoticed for two days.

### Why a script rather than a careful copy

The guard was written inline, once per step, and produced a different defect in each:
`cmp -s A B && …` killing the step under `set -eu` when the files DIFFER; an unquoted
path; a raw triple-quoted string closed by the pattern's own leading quote; a heredoc
passed where a shell function expected an argv; and a content-only comparison against a
plant whose whole effect is `chmod` — **that one shipped into a pull request and CI caught
it.** A sixth was in the helper's own docstring, where naming the triple-quote bug with
the literal characters closed the docstring. A finding class seen twice becomes a script.

### Six pins, one sweep

`sheleg-dev` 0.4.2 · `agent-stack` 0.6.1 (which also ships two CI fixes that had sat on
`main` unreleased, closing B-32) · `make-skill` 0.17.1 · `seo-aeo-audit` 0.16.2, on top of
the four already current. `python3 test/check_pins.py` re-measured all eight before this
push and reports every pin at its release.


### And a check on the check

`npm test` was green on a `validate.yml` **GitHub could not parse**: an inserted line
carried one space of indentation instead of twelve, the run answered *this run likely
failed because of a workflow file issue*, and the local suite had no opinion. Twice in one
session a mechanical edit to a workflow produced YAML only the remote could reject.

- **`check_workflows_parse()`** parses every workflow and fails when one does not, or
  when it parses but declares no jobs — a workflow that runs nothing is indistinguishable
  from a passing one. Watched failing against the exact defect, quoting GitHub's own
  wording. Negative self-test in CI: **9 → 10**.
- A hand-rolled indentation check was tried first and **passed the planted defect**,
  because it examined only the first line of each block scalar and the damage was
  mid-block. Re-implementing YAML to avoid a dependency is how that becomes a third bug,
  so the guard uses a real parser — and **says so when it cannot run**: the validator
  gained an `unlooked:` channel, because a check that goes quiet on missing input is the
  shape this repository refuses.

## v0.47.0 — the one thing `update` did not update

`B-22`, filed at stage 8 of the previous run and fixed here because a hook nobody
receives is a hook nobody has.

The settings entries point at `~/.sshlg-skills/runtime/`, never at the package — run via
`npx`, `__dirname` is npm's cache and npx may prune it, which would leave hooks failing
silently on every prompt. So the package's `hooks/` and `lib/` are copied into the
operator's own directory and THAT is what runs. The copy lived in a closure inside
`cmdHooks` and ran on `hooks install` alone, which made the wired runtime the one thing
`update` did not touch.

Watched on a real machine at v0.46.0: `npx sshlg-skills@latest update` brought six
plugins to their new versions and left the runtime at **24 modules against the package's
25**. The module missing was `injectors.js` — the whole point of that release — so its
`SessionStart` line was published, installed, and dead. **Every hook improvement since
v0.42.0 had been reaching machines the same way:** only via a command nobody had a reason
to re-run.

### Fixed

- **`update` now refreshes the wired runtime**, and prints what moved — new files
  named individually, because a count alone would have hidden this defect just as well
  as silence did.
- **Refresh, never install.** `create` stays `false`: a machine with no runtime has not
  consented to hooks and an update is not the moment to ask — the same rule the routing
  block's own refresh follows. What it is NOT is "leave an existing runtime alone"; this
  repository has recorded three times that a rule written to protect a first run gets
  applied on the hundredth, and refusing to refresh what is already there would be the
  fourth.
- A runtime that cannot be refreshed **says so and fails the update** rather than
  passing quietly. Silence is what made this invisible for five releases.

### Added

- **`lib/runtime.js`** — one home for the copy, called by both `hooks install`
  (`create: true`) and `update` (`create: false`). `stale()` reports what is missing or
  differing without writing, which is how the fix was verified against the real machine
  before it was released.
- **8 fixtures** in `test/runtime_test.js`, including the B-22 machine exactly (a runtime
  missing the module the release exists to ship) and three-run idempotence proven by
  hashing the tree.
- **A guard on the WIRING, not just the module.** `check_update_refreshes_runtime()`
  reads `cmdUpdate`'s own body and fails when it stops referencing `lib/runtime.js` or
  drops `create: false`. The fixtures prove the copy works and cannot prove anybody calls
  it: delete the call and all eight stay green while the defect returns whole. That gap
  is how B-22 survived. Scoped to `cmdUpdate`'s body, because a repo-wide grep would be
  satisfied by the `cmdHooks` call that was always there. Watched failing against a
  planted removal, with a matching negative self-test in CI (**8 → 9**).

## v0.46.0 — 2026-08-13

The family stops naming its paperwork after another pack, and the machine can finally
say who else speaks before your first prompt.

### Added

- **`sshlg-skills injectors`** — the enabled plugins that register a `SessionStart`
  hook, with the path to each `hooks.json`. The routing block has said since v0.36.0
  that another pack's always-on mandate does not outrank the family's map; nothing here
  could tell you whether such a pack was switched ON, and the one time it mattered the
  answer took a hand-written Python one-liner. It runs on a clean machine too, printing
  `none` — a check whose output nobody has ever seen is indistinguishable from a broken
  one.
- **One line in the session block** when something else does inject, naming the plugins
  and nothing else. The block is ~90 tokens on purpose: it exists because a pack that
  prints its whole doctrine into every session is the 854-token cost this family
  measured elsewhere and removed, and three file paths every session would re-commit
  that mistake in miniature. Silent when nothing else injects.
- **It reports what INJECTS, never what competes,** and says so in its own output. Of
  the four injectors enabled on the machine this was built on, all four print their own
  state rather than competing instructions, and no machine can sort those apart. A list
  presented as a list of offenders would be a judgment about other people's packs
  dressed as a measurement. **The recorded audit in the machine's own `CLAUDE.md` named
  three; the mechanism found four.**

### Changed

- **`docs/superpowers/` → `docs/evidence/`** here and in six members, following
  `task-pipeline` v1.53.0, which renamed the default and made the root **resolvable**
  (`paths.artifacts`, else an existing `docs/evidence/`, else an existing
  `docs/superpowers/` — the legacy name stays supported and no run warns about it).
  The records inside moved with `git mv` and were **not rewritten**: a brief describes
  where things were when it was written.
- Six pins move in one sweep: `task-pipeline` 1.53.0, `super-ux` 0.38.1,
  `sheleg-design` **1.24.0 → 1.27.1** (three releases behind, not one — the pin lag
  recorded after the last sweep undercounted), `seo-aeo-audit` 0.16.1, `agent-sync`
  1.10.0, `make-skill` 0.17.0.

### Not done, deliberately

- **B-19 / C-01 — the two-channel question stays open.** This release adds output to a
  hook that is already wired rather than a new channel, so the write to the operator's
  file did not grow. Deciding where the family's hooks belong inside a run about a
  directory name would be the opposite of the deliberate decision the board asks for.
  `statusLine` cannot move to a plugin at all — no `plugin.json` among the 36 installed
  declares such a field — so that channel stays double whatever is decided.

## v0.45.0 — 2026-08-13

### Changed

- **Four pins moved in one sweep** — `task-pipeline` 1.52.0, `super-ux` 0.38.0,
  `sheleg-design` 1.24.0, `seo-aeo-audit` 0.16.0. Three of them had been behind
  since the 2026-08-12 run reported them (B-16), and standing instruction #5 is
  why they move together: fixing the one member a log names is what made an
  earlier release fail twice in a row.

  `task-pipeline` 1.52.0 completes the hook set the pipeline can own — the
  compaction boundary, an abandoned run, a subagent finishing, and a question
  before the product is edited ahead of the plan. Its ledger gains one shape for
  all three observations rather than three, because a grammar is read by four
  documents and every shape added is one each of them must learn.

  **The sweep was still moving when it closed.** `sheleg-design` cut 1.25.0 while
  these four were being verified, so this release pins 1.24.0 and `check_pins`
  reports exit 2 — every pin exists, the bundle installs what it advertises, and
  one member is a release behind the world. Standing instruction #5 says to say so
  rather than push a third time, and this is saying so.

## v0.44.1 — 2026-08-13

### Fixed

- **The progress numerator counted lines too.** v0.43.0 fixed the denominator and
  left the same defect on the other side of the fraction: a stage that a loop
  re-enters writes a second `stage:` line, which is normal and means one stage, and
  the count treated it as two. This repository's own run printed
  `gates 12/11 · 109%`.

  Distinct stages now, with the **last** verdict for an id winning — an earlier
  pass must not outvote a later failure, which is the same "history satisfies the
  gate" shape the release gate was fixed for an hour earlier, arriving in the
  status line.

  Found by looking at the widget while it described the run that built it.

## v0.44.0 — 2026-08-13

### Fixed

- **The repository gate judged commits belonging to other repositories.**
  `.claude/settings.json` wires the gate for *this* project, and the hook ran
  `npm test` in `CLAUDE_PROJECT_DIR` for any `git commit` — so a commit made
  inside a submodule was refused on the umbrella's verdict about a change it does
  not contain. It deadlocked a release while it was happening: the umbrella was
  red **because** the submodule had not shipped yet, and the submodule could not
  commit the fix because the umbrella was red.

  A commit for this project must stage something in this project. That is the
  decidable form of the question, and the payload carries no shell working
  directory to answer it any other way. Nothing staged here → the gate says
  nothing.

### Notes

- `task-pipeline` pinned at **1.51.0**, which fixes two defects in the release
  gate this repository's own run shipped the night before: a gate keyed to
  `stage: 6` blocked every release in any project whose flow has six stages, and
  the gate read a verdict typed by the agent it constrains. It now resolves the
  tests stage from `pipeline.json` and requires an observed exit code beside the
  claim.
- This repository declares `gate.command` for its tests stage, so its own releases
  are corroborated rather than asserted.

## v0.43.0 — 2026-08-13

The progress line stopped claiming a finished run, and the routing block became
reachable in full.

### Fixed

- **The status line reported `gates N/N` at every point of every run.** Both
  numbers came from *how many `stage:` lines the ledger happened to hold*, so a run
  at stage 4 of ten printed `gates 5/5` — which reads at a glance as finished.
  `task-pipeline`'s own `references/progress.md` names this exact failure: *"a bar
  reading `gates 5/11` in a project with six stages is a false success in the
  purest form the pipeline has, printed in the place designed to be trusted at a
  glance."* We shipped it in v0.41.0 and did not catch it in v0.42.0.

  The denominator now comes from the project's `pipeline.json` → `stages[]` and
  from nowhere else. **The example flow's eleven are deliberately not a fallback**:
  a host project replaces them, and guessing reproduces the defect with a number
  that looks authoritative. With no stage list the line prints a count — `5 gates
  passed` — because a count claims nothing about what remains.

- **Four of the eight routers could never be named.** The routing block carries
  `copywriting`, `seo-llmo`, `evidence-docs` and `agent-sync`; the prompt hook's
  table held four routes and none of them. "The agent picks the right skill
  itself" was structurally impossible for half the family. Each new route's
  triggers are still words its own skill advertises, and a fixture now compares the
  table against the registry so the two cannot drift apart again.

- **A trigger phrased as a question was silenced by the question filter.**
  `seo-aeo-audit` advertises «почему упал трафик» and «почему нет позиций» — the
  generic "a question is not an instruction" rule silenced the skill on exactly the
  words it claims. A trigger that itself carries a question word now wins, for any
  route; a plain question over a plain trigger still does not.

### Added

- **The progress block is printed by a hook, from the ledger.** The doctrine is
  that every glyph is derived from the verdict the gate wrote *and from nothing
  else* — and a block typed by the agent is a summary written from memory, the
  easiest artefact in a run to get confidently wrong. A block emitted by a hook
  cannot be written from memory: that process has no memory, only the file.

- **The rail, the bar, and what is actually waiting.** Glyphs `✓ ▶ · ✗ ⊘` — a
  failed gate and a skipped stage no longer render like a passed one — plus the
  percentage, how long the run has been going, and `⏸ waiting on you` when a
  **manual** gate has no verdict.

- **Taskbar progress and a ping at the moment a person is required.** OSC `9;4`
  moves the terminal's own progress indicator; OSC `777` pings when the run reaches
  a manual gate. That gate is the only moment nothing advances until the operator
  acts, which makes it a better trigger than "Claude went quiet 60 seconds ago".

- **The un-routed path escalates, once.** When a prompt reads as work the family
  routes and no run is open, the first `Edit`/`Write` of that turn asks — naming
  the route, what it owns, and the phrase that declines it for the rest of the
  session. `ask`, never `deny`: the routing block's own boundary says a typo or a
  one-line edit does not go through the pipeline, and no hook can tell a typo from
  a feature. `Bash` is not gated, because that would put a permission prompt in
  front of running the tests rather than in front of the change.

- **`pipeline.json`** — this repository declares its own eleven stages and records
  `run.loop`, so the pacing decision has a home instead of being re-asked at every
  intake.

### Notes

- **A hook cannot make a model invoke a skill.** It can refuse the un-routed path
  and name the route. Promising more would be the false guarantee
  `task-pipeline`'s `references/hooks.md` warns about, and the module says so in
  its own first paragraph.
- `isAllowed` now validates **every** sequence in a concatenation rather than the
  first. The ledger hook sends taskbar progress and a ping together, and Claude
  Code drops the whole field if any part is outside the allowlist.
- Ratchets: **24 suites, 469 fixtures** (was 23/427), 8 pinned members. Counted by
  running `npm test`.

## v0.42.0 — 2026-08-13

The family's hooks stopped only speaking and learned to hold.

### Added

- **A `PreToolUse` guard over the operator's instruction files.** `lib/backup.js`
  has ruled since v0.35.0 that a copy which cannot be taken cancels the write —
  but only for writes *this pack* performs. An agent editing `~/.claude/CLAUDE.md`
  with the `Edit` tool, or redirecting into it from a shell, passed nowhere near
  `protect()`. Two defects in this repository's history destroyed or overwrote
  exactly that file, and both times the copy that saved it was made by hand.

  Now every route is covered: five files (`~/.claude/CLAUDE.md`,
  `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.cursor/rules/sshlg-routing.mdc`
  and `~/.claude/settings.json`), every write tool, and the Bash forms that write
  without one — redirects, `tee`, `sed -i`, `cp`, `mv`, `rm`, `~`- and
  `$HOME`-spellings. A copy that cannot be proven **denies** the call and says so.

  The matching happens inside the hook, never in the entry's `if` field: the
  hooks reference states that filter is best-effort and **fails open** on a
  command it cannot parse, and a guard with a documented bypass is not a guard.

- **Three machine rules that were written down and broken anyway** (`lib/hygiene.js`):
  a bare `npx skills update <family member>` is refused with the launcher command
  in the reason; after any skills-CLI run the shadowing plain copies are named;
  and `obsidian-wiki setup` can no longer silently truncate the active config —
  the keys it drops are restored from a snapshot taken before it ran, with the
  values it wrote kept.

- **This repository's own gate, in a committed `.claude/settings.json`.** A
  `git commit` runs `npm test` first and is refused while it is red; a `SKILL.md`
  whose front matter breaks the Agent Skills limits is reported in the same turn
  it was written. The gate is honest only because of a number: the suite costs
  3.3 s here, and at three minutes this would be a gate people route around.

- **`Notification`, `ConfigChange` and `FileChanged`.** A desktop ping when a long
  run goes idle; a notice when something else overwrites these entries; one line
  when the run ledger advances a stage. `SessionStart` also returns `sessionTitle`
  and `watchPaths` now, and runs on `resume` and `fork` — without those a resumed
  session got no routing pointer at all.

### Fixed

- **The prompt hook lost every inflected form of every trigger.** The trigger
  table is written in the nominative singular, because that is what a skill's
  `description` advertises; a person writes *сделай фичу*, *запусти миграцию*,
  *добавь интеграцию*. Substring matching scored **11 of 20** realistic prompts.
  Matching is now stem-based with a closing word boundary — **18 of 20**, with no
  new hit on a question or a refusal phrase. The boundary is the precision budget:
  without it `аудит` fires on `аудитория`.

- **Two backups of one file inside the same second were one backup.** The stamp
  resolves to the second and an agent edits faster than that, so the second copy
  took the first one's name and overwrote it — losing the content the first copy
  existed to preserve. Found by the end-to-end fixture, which had meant to test
  something else entirely.

- **The event list lived in two places.** `plan()` and `removal()` each carried
  their own copy, which agree until someone adds an event to one of them and
  `hooks remove` quietly stops being an undo. One list now, `WIRED`.

### Notes

- `ConfigChange` **cannot report anything at the time it fires** — the reference
  states it discards `systemMessage` and `continue`, delivers no
  `additionalContext`, and a change it blocks surfaces no message to you or to
  Claude. So it records and `SessionStart` speaks on the next session. That is the
  honest shape, and it is written down rather than worked around.

- Ratchets: **23 suites, 427 fixtures** (was 16/303), 8 pinned members. Counted by
  running `npm test`.

## v0.41.1 — 2026-08-12

### Fixed

- **v0.41.0 wired the package's own path, which breaks for everyone who is not
  the author.** `hooks install` computed the script location from `__dirname/..`.
  From a clone that is the repository and works; run the documented way —
  `npx sshlg-skills hooks install` — it is npm's cache, and npx is free to prune
  it. The result would be three hooks that work until the cache is cleaned and
  then fail **silently** on every prompt, which is worse than not installing them.

  `install` now copies `hooks/`, `lib/` and `skills.json` into
  `~/.sshlg-skills/runtime/` and wires that — the same reason the routing block is
  written into a file the operator keeps rather than referenced from wherever the
  pack happened to run. The copy is refreshed on every `install`, including when
  the settings need no change: after a package update the paths were still right
  while the code behind them was stale.

  Two fixtures hold it: the runtime directory must not look like a package path,
  and all three wired commands must point inside it.

## v0.41.0 — 2026-08-12

### Added

- **The family now engages by itself, through three hooks it owns**
  (`npx sshlg-skills hooks install`). The routing block loads in every session
  and was still routed around, because prose in a long file loses to whatever
  spoke last. These are what speak first.

  - **`SessionStart`** — one ~90-token note saying the block is not advisory.
    Deliberately a **pointer**: the block already carries every router's text and
    is its single home, so this supplies only the salience of arriving last. This
    is the mechanism measured at **854 tokens** in another pack and switched off
    in v0.36.0, which is why a fixture caps this note's length. The difference
    between the two is not the mechanism, it is that one enforces the operator's
    own routing and the other competed with it.
  - **`UserPromptSubmit`** — names the route a prompt asks for, and **prints
    nothing on the turns that are most of them**. Conservative for the doctrine's
    own reason: every router's boundary warns that over-routing teaches an agent
    to route around it. A question beats any positive signal, a refusal phrase
    silences it completely, and no signal emits nothing — three separate reasons,
    each fixtured separately.
  - **`statusLine`** — where the pipeline is, read from `.task-pipeline/run.md`,
    the ledger the run already keeps and which already survives a compaction.

    ```
    ▶ 5 Build auto · gates 4/5 · iter 2 · holds 1 · touch 1
    ```

    Nothing here is computed: the iteration count is the number of `iter:` lines,
    the gate count comes from `stage:` verdicts, and an **unreported** `holds:`
    renders `holds —` rather than `holds 0` — a silent stage must not look like a
    clean one. That rule and the ledger's grammar are `task-pipeline`'s
    (`references/progress.md`), not this repo's; a status line that invented its
    own numbers would be the fourth copy of the truth.

- **`lib/triggers.js` cannot grow a routing policy of its own.** Every trigger it
  fires on must already appear in the target skill's shipped `description`, and
  `test/triggers_test.js` reads those descriptions and fails on any that does not.
  The first version of this table was authored rather than derived and the fixture
  rejected **eight** invented words on the first run. Whole phrases, never bare
  ones, for a second reason found the same way: a bare `дизайн` sits inside the
  refusal «без дизайна», so saying the phrase that declines a route would have
  tripped it.

### Changed

- **`hooks install` refuses to take a status line it did not set.** A `statusLine`
  held by something else is reported as a conflict and nothing is written;
  `--force` takes it *and parks the displaced value* under `displaced:statusLine`,
  so `hooks remove` gives it back and the settings file round-trips byte for byte.
  The same shape `--adopt` already follows for router wording — a value replaced
  with consent and then not returned is the same defect under a different key.

  Both write paths go through `protect()` in `lib/apply.js`. `settings.json` has no
  version control behind it either, and this pack does not get a second write path
  to a file the operator owns.

### Ratchets

13 suites/269 fixtures → **16/303**.

## v0.40.0 — 2026-08-12

### Changed

- **Pins: `task-pipeline` 1.49.2, `sheleg-design` 1.19.0.**

  `task-pipeline` 1.49.2 fixes a defect the token audit had been pointing at
  without anyone reading the file: four rows of its doctrine index sat between a
  bullet list and the next heading with no delimiter row above them, so GFM never
  opened a table and an agent read four lines of literal pipes. Those rows had
  taken the third item of *"Three things the grill does"* with them — the list
  promised three and delivered two. The item was restored from
  `references/grill.md` rather than the count reduced to two, because the
  reference proves what was lost.

  `sheleg-design` 1.19.0 is another agent's fourteenth style pack, adopted
  unchanged. Verified that it keeps the router delegation added in 1.18.0 before
  the pin moved — a member released mid-flight is the ordinary case, not a reason
  to skip checking that the previous change survived it.

### Note — the pin gate did its new job on its first real encounter

`sheleg-design` shipped 1.19.0 while this release was in flight. Before v0.37.0
that turned this repository's CI red for someone else's release, five times in one
day. It now returned **exit 2** — every pin real, one not the newest — which is a
warning and a run-summary note rather than a failure. The sweep then re-measured
all eight members in one pass rather than fixing the one the log named, per
standing instruction #5.

### Note — task-pipeline's body, measured rather than estimated

It is **5969 against the 5000 cap**, up 108 from restoring the lost bullet.
Correctness over a soft cap it already exceeded. The gap is now bounded by
measurement so it stops being re-litigated: the whole doctrine index is 555 tokens
(320 descriptive, 235 reference names), so compressing every description to nothing
closes at most **26% of the 1219-token gap**. The remainder lives in the Stages
table's `Gate` column — `grep -c '^\*\*Gate' references/stages.md` returns **0**,
so the body is its only home — and in the five-step operating procedure. Closing it
means moving content into references: a restructuring of that skill, not a trim.
Three prose trims across this programme produced 35 tokens between them.

## v0.39.0 — 2026-08-12

### Changed

- **Four members' installers now write the routing block themselves** (closing
  B-06, carried since 2026-08-06). Pins move to `task-pipeline` 1.49.1,
  `agent-sync` 1.9.0, `make-skill` 0.16.0, `sheleg-design` 1.18.0.

  Until now only `super-ux` delegated. Installing any other member alone left it
  with no router at all — the agent had the skill and no rule saying when to
  reach for it. The bundle writes all eight, which is why nothing looked broken:
  the gap only opened for someone installing one member.

  The row said four members, and four was right for a reason worth recording.
  Five of the eight own a router; the other three — `seo-aeo-audit`,
  `sheleg-dev`, `agent-stack` — own none, and `scope({member})` returns nothing
  for them. Adding an offer to those installers would print *nothing to write*:
  noise, not a fix.

  Each delegates to `npx sshlg-skills routers --member <this>` rather than
  rendering the block, because `--member` scopes the write to that skill's own
  section, and because the launcher is the only writer that copies the operator's
  global instruction file first. **Isolation verified per member**, not argued:
  two sections of a real block were damaged, the installer run, and its own
  section came back repaired while the other stayed byte-for-byte. The
  absent-launcher path prints the command instead of failing, and the
  non-interactive path records an opt-out and takes its backup — both exercised.

## v0.38.0 — 2026-08-12

### Fixed

- **The npm half of the pin check had been inert for six of eight members**
  (B-15, found while disproving B-10). `check_pins.py` resolves a package name
  by trying the `npm` field, then the member name, then the repo basename, and
  rejects any name whose `repository` is not ours. That last guard is correct and
  load-bearing — the bare `task-pipeline` on npm belongs to node-task — but `npm`
  was **unset for all eight members**, six publish as `@ssheleg/<name>`, and
  `task-pipeline` publishes as `task-pipeline-skill`.

  So six pins were never compared against the registry at all. They were printed
  as `(tag; not on npm)`, the git-tag comparison carried them, the tags happened
  to agree, and nothing ever went red. This is the failure the file's own
  docstring names: *they can all agree and all be wrong.*

  Fixed by **declaring** the package name per member and having `test/validate.py`
  compare it with the submodule's own `package.json` in both directions — a
  missing `npm` where the member publishes one fails, and a declared name the
  member does not publish fails. Deriving `@ssheleg/<name>` would have passed
  today and broken on the two members already publishing under a third shape;
  this is the same rule the map applies to `entry`, which is declared and never
  guessed.

  After the fix all eight compare against npm and the `(tag; not on npm)`
  annotations are gone. CI carries a two-plant negative self-test — drop the
  field, then declare a package the member does not publish — and both plants
  assert they changed the file before the validator is run. Disarming the guard
  makes that step exit 1, which was checked rather than assumed.

- **B-10 was no longer true.** `@ssheleg/sheleg-dev` is on npm at 0.4.1, exactly
  the pinned version, and its last release run reports `job publish: success`.
  The `ENEEDAUTH` failure recorded against v0.3.0 was fixed at some point and the
  row was never updated. All eight members have publishing armed and all eight
  publish. Closed as verified, not as assumed — what the row was really pointing
  at was B-15.

## v0.37.0 — 2026-08-12

### Changed

- **`check_pins.py` stopped failing this repository for other people's
  releases** (closing B-13). It asked one question — *is every pin the latest
  release?* — and that is a fact about the world, not about the commit under
  test. Five runs went red in one day because `task-pipeline`, then `super-ux`,
  then others shipped while this repository's own release was in flight, and
  every fix was a pin bump unrelated to the change being tested. A gate that
  fails for someone else's release teaches people to re-run it rather than read
  it.

  It now answers two questions and CI treats them differently:

  - **exit 1 — a pin names a version that was never published.** The commit is
    wrong on its own terms: a checkout installs something that does not exist,
    and no later release repairs that commit. Blocks, with a `::error::`.
  - **exit 2 — every pin is real, one is not the newest.** The world moved.
    A `::warning::` plus a run-summary listing the behind pins, and the job
    passes.

  Evidence, because three exit codes nobody watched fire are three guesses:
  `99.99.99` planted into `skills.json` produced `MISSING` and exit **1**; a
  genuine older release, `0.36.1`, produced `BEHIND` and exit **2**; restoring
  the file produced exit **0**. Each plant asserted that it changed the file
  first — a plant that no-ops is indistinguishable from a pass. The CI step's
  branching was then run for all three codes against a stub, confirming
  1 → fail, 2 → pass with the summary written, 0 → silent.

### Added

- **`check_pins.py --self-test`**, in CI's blocking path because it is pure and
  needs no network. Five cases over `classify`, including the two that keep it
  honest: a pin absent from every published version is `missing` even when
  nothing was published at all, and a pin that exists while the newest is
  unknown is `ok` rather than `missing` — otherwise a slow registry would fail
  valid commits. It also asserts the verdicts differ from one another, because
  this repository has shipped a measurement that returned the same answer for
  every input (standing instruction #4).

- **Standing instruction #6: a plant anchored on prose stops planting when the
  prose is reworded, then reports the guard it can no longer disarm as broken.**
  Three times in one session — `make-skill`'s myth list, `agent-sync`'s awk
  pattern, and `agent-stack`'s description, which turned **every push red for a
  validator that was fine**. Anchor plants on the file's shape and make them
  assert they changed something.

## v0.36.0 — 2026-08-12

### Added

- **The map now says it outranks doctrine another pack injects into every
  session.** Superpowers' plugin registers a `SessionStart` hook on
  `startup|clear|compact` that prints its whole `using-superpowers` skill — 854
  tokens measured with `cl100k_base`, wrapped in `EXTREMELY_IMPORTANT`, opening
  with *invoke skills BEFORE any response or action* and *before entering plan
  mode, invoke the brainstorming skill first*.

  That is not a skill an agent picked from a description. It is mandatory text
  in the context of every session, and it beat this family's routing in
  practice: a session opened in a repository was told to brainstorm before it
  consulted the map. Twelve of Superpowers' fourteen skills cover ground the
  family already owns — `brainstorming`, `writing-plans` and `executing-plans`
  are `task-pipeline` stages 2–5; `writing-skills` collides with `make-skill`
  head-on.

  The injected text concedes precedence itself — *user instructions take
  precedence over skills* — but says so in a closing paragraph while opening at
  maximum priority. A precedence that holds only if the reader reaches the last
  line is not a precedence, so the block states the resolution: repository work
  routes through `task-pipeline`, and brainstorm, spec and plan are its stages
  2–4, not a cycle beside it.

  **+116 tokens as actually paid**: the installed block measured 2672 before and
  2788 after. The rule tokenizes to 127 standalone — quoting that number would
  have been a measurement of the wrong thing, since tokens merge across the
  boundary where the text is spliced in. Against the 854 removed by disabling
  the plugin, the machine pays 727 fewer tokens per session.

  It sits in the map section rather than becoming a ninth router, because it
  arbitrates between packs rather than deciding when to route. A lone member's
  installer renders no map and therefore does not arbitrate on the family's
  behalf; a fixture asserts the rule cannot leak into an empty roster.

## v0.35.0 — 2026-08-12

### Added

- **A command that edits the operator's unrecoverable file now takes its own
  copy first** (`lib/backup.js`, closing B-05, carried since 2026-08-06). Two
  defects in this repository's history destroyed or overwrote
  `~/.claude/CLAUDE.md` — a file with no version control behind it — and both
  times the copy that saved it existed because an agent happened to make one,
  once ten minutes before it was needed. That is a habit, and a habit protects
  whoever remembers it.

  Copies land in `~/.sshlg-skills/backups/`, ten per file, pruned oldest-first.
  Three decisions are load-bearing:

  - **Never beside the original.** `~/.cursor/rules/` loads every `*.mdc` it
    finds, so a copy dropped next to the file it protects can be read by the
    tool that owns the directory as an always-apply rule. A missing `home` is
    therefore a refusal to write, not a quieter place to put the copy — the
    tempting fallback, the file's own parent, is the exact mistake.
  - **A failed copy cancels the write.** Degrading to "no backup, wrote anyway"
    reproduces the situation this replaces, minus the agent who used to notice.
    The run reports `НЕ записан` with the reason and the file is untouched.
  - **The copy is read back and byte-compared before the original is touched.**
    A `writeFileSync` that returned is not evidence that bytes landed.

  Backing up happens after the write is decided and the bytes are known to
  differ, so an idempotent run — which is most `update` runs — leaves nothing
  behind. Proven on the real file: three consecutive `routers --update` runs
  hold hash `cf59cc11`, and the backup directory stays empty.

### Fixed

- **Two backlog rows said `closed` in their text and `open` in their status
  column** (B-04, closed 2026-08-11; B-12, closed 2026-08-12). The board is
  read to decide what to work on next, and a row that contradicts itself is
  worse than a stale one — it costs a reader the time to work out which half to
  believe.

## v0.34.0 — 2026-08-12

### Fixed

- **`agent-stack` shipped a second capability and the catalogue never said so.**
  v0.6.0 added `agent-evals` — eval suites, judging output, regression gates —
  and the member's `desc` still described orchestrators and the wallet only. That
  string is what `list` prints and what the README table carries, so a whole
  capability existed and was advertised nowhere. Its `role` in the map was stale
  for the same reason.

  The validator had already caught the *declaration* half of this in v0.33.0 and
  stayed green on the prose half, because prose is not checkable. So the
  propagation matrix now names all three obligations for a member that gains a
  skill — `skillNames`, the member's `desc`, its README row — with the note that
  only the first has a gate behind it.

### Changed

- Six pins swept in one pass: `super-ux` 0.37.0, `task-pipeline` 1.48.0,
  `agent-sync` 1.8.3, `make-skill` 0.15.0, `sheleg-design` 1.17.0, `sheleg-dev`
  0.4.1. Measured all eight rather than chasing the one CI named.

### Measured

- **21 skills** now, up from 20. Bodies: `task-pipeline` came down 6279 → 5861
  without this repo touching it, which is the first movement on that number
  since it was recorded as a known gap. Still over the 5000 cap.
- ALWAYS-ON **7601 tok** — descriptions 4244, command descriptions 685, routing
  block 2672 — paid in every session of every project. It grew with the family,
  not with the block: the block itself is unchanged in shape since the English
  rewrite took it from 4384 to 2663.
- Conflicts: none. Routing: 8 routers, every required member present, 6 declared
  entries all resolving to commands that exist, the installed block carrying the
  map and the table in all four channels.

## v0.33.0 — 2026-08-12

### Added

- **`test/audit_bundle.py`** — the bundle audit as a gate instead of a script
  rebuilt by hand each time. It answers what nothing else does: the **always-on
  budget** (every skill description, every command description, plus the
  routing block — paid in every session of every project whether or not
  anything fires), bodies against the 5000-token cap, two skills competing for
  one trigger phrase, and the installed block against the registry.

  Outside `npm test`, beside `check_pins.py`, because that gate must work
  offline and dependency-free. **It refuses to run without a tokenizer** rather
  than falling back to a chars-per-token ratio: `claude plugin details` assumes
  ~2.8 chars/token against cl100k's 3.8–4.5, and a number from the wrong
  instrument is worse than none because it gets quoted.

  Three of its checks were wrong before they were right, and each correction
  stayed as a comment where it happened — a generated index *is* a contents
  list; a disambiguation clause has to name **the** neighbour, not merely
  exist; and `Not for` is not `NOT for`. Its first run reported nine findings
  of which eight were its own fault.

### Fixed

- **`test/validate.py` compares declared against shipped in both directions.**
  It failed on a declared skill the repo does not ship and said nothing about a
  shipped skill nobody declared — so `agent-stack` v0.6.0 could add
  `agent-evals` and have it reach no channel and no agent indefinitely, while
  every gate stayed green. `install` and `update` both resolve what to fetch
  from `skillNames`; anything outside that list does not exist to them. Planted
  against: undeclaring the skill turns the validator red.

  Found by the audit, not by the gate — which is the argument for the audit.

## v0.32.0 — 2026-08-11

**The routing block was the most expensive thing the pack shipped, and nothing
was measuring it.** Counted with `cl100k`, not estimated: 4384 tokens, in every
session of every project, whether or not a single router fired — more than all
twenty skill descriptions combined (3895), and 55% of the operator's entire
`CLAUDE.md`.

The cause was the language. Russian encodes at **1.9–2.3 chars/token against
English's 5.0**, so the same doctrine cost roughly 2.3× to carry.

### Changed

- **The eight router texts are rewritten in English**, and compressed while
  being rewritten: **3408 → 1885 tokens, −44%.** On the operator's machine the
  whole block went **4384 → 2663, −1721 tokens per session**, and the always-on
  budget from 8964 to 7243.

  Rewritten, not translated word for word: each keeps what
  `test/router_texts_test.js` demands — the rule, the boundary in **both**
  directions, the refusal phrase and one sentence placing it against its
  neighbours — and each keeps the argument that makes its boundary memorable.

  **The refusal phrases stay Russian** («без пайплайна», «без сценариев»,
  «без бренда»…). They are not prose for the agent; they are what the operator
  says out loud to opt out, and translating them would change what has to be
  typed.

- **The table and the map follow**, header and cells. The block heading stays
  Russian: migration matches it, and moving it would orphan every block already
  written.

### How this was kept honest

The fixtures assert the contract in **English markers now**, so they were
switched first and **watched failing 35 of 60 against the Russian texts** —
before a word was rewritten. A test edited alongside the thing it checks proves
only that both changed.

Two of them then failed on the new texts for a real reason: `NOT through` and
`internal docs` had landed across a line break. The fix was in the check, not
the prose — a contract assertion that reads raw hard-wrapped text makes the
*wrapping* load-bearing, so whitespace is collapsed before every phrase match.
That weakening was planted against: removing a boundary's negative half still
turns the suite red.

### For anyone whose block is already installed

Your wording still wins, so the English text does **not** overwrite a router
you wrote. `routers` reports the drift and `--adopt <name>` takes the new text
one router at a time — which is exactly how this release landed on the author's
own machine: six routers still carried a byte-identical copy of the old
packaged Russian, the drift report named them, and adoption dropped a further
1096 tokens.

## v0.31.0 — 2026-08-11

The block taught agents **when** to route and never **what** they had. Measured
before this release: it named 6 of 20 commands, 8 of 19 skills and 6 of 8
members, and `sheleg-dev` and `agent-stack` — six skills between them — did not
appear in it at all.

### Added

- **The map.** The block now opens with eight members, the single command that
  starts each, and one line saying what it closes, generated from `skills.json`
  and refreshed on every write. `entry` and `role` are **declared** in the
  registry rather than derived: super-ux's entry point is `/ux` and its member
  name is `super-ux`, so no rule over the name finds it — and a map that sends
  an agent to a command which does not exist would do it authoritatively. A
  fixture checks every declared entry against the commands the family ships.

  **A map and not a catalogue, deliberately.** The runtime already puts every
  skill's name and description in front of the agent. Copying them into the
  operator's global instructions would put one fact in two homes — the thing
  `docs/DOCMAP.md` exists to forbid — and the copy that goes stale would be the
  one costing context in every session of every project. What no runtime
  derives is the shape.

- **Two more channels, four in total.** `~/.gemini/GEMINI.md` is the same
  markdown model and cost one line. Cursor is not: `~/.cursor/rules/*.mdc` is
  one file per rule with YAML front-matter and `alwaysApply: true`, so it gets
  its own emitter — and, because that file is ours end to end rather than a
  fenced region inside someone else's, a file at that name **without** our
  sentinel is left alone. Owning a file means an overwrite leaves no surviving
  text to notice the loss by.

  Both are skipped where the agent's directory does not exist, so listing a
  target costs nothing on a machine that has not got it.

### Fixed

- **`install` and `update` now refresh the block.** Neither called it before,
  so a member could ship, `update` could run to completion, and the block would
  go on describing the family as it was. "The instruction agents read is
  current" was false by construction rather than by accident.

- **A target added in a later release never reached an existing machine.**
  `update` refuses to create a block, on the sound principle that a machine
  without one has not agreed to one — but that also meant Gemini would have
  been refreshed on nobody and reported as delivered. Where consent is already
  **on record**, `update` now writes the block into a target that has none:
  consent was given to the pack maintaining a routing block, not to one file.

- **A block written before the map existed had nowhere to put it.** The
  refresh finds sentinels to replace, and older blocks carry none — so the map
  is *inserted* after the block heading instead, which is where an agent reads
  it first. Verified against a hand-built pre-map block: map inserted, prose
  above and below preserved byte for byte, second run identical.

### Ratchets

- 12 suites, 247 fixtures (from 10 and 228), 8 pinned members. Counted by
  running `npm test`.

## v0.30.0 — 2026-08-10

### Fixed

- **`update` could not deliver a family member that had reached no channel, and
  said it had.** `skills update <id>` is a no-op for a skill installed nowhere
  — it prints `✓ All global skills are up to date` about a skill that does not
  exist. `update` issued only that verb, so a member added after your last
  `install` never arrived anywhere, while the run printed a confident line for
  it. Seven of nineteen skills were found absent from the hub on 2026-08-10
  after exactly such an update.

  `update` now **reconciles**: refresh what is there, then add what is not,
  using the same agent set `install` resolves. Proven by planting the state a
  never-installed member is in — `agent-orchestrator` removed from the hub and
  from all six symlink channels — confirming the old verb reported success and
  restored nothing, then watching the new one return it to all seven.

  The two commands built their skills-CLI argv in two independent places, which
  is how they came to disagree about a case neither of them mentioned. They now
  share `lib/plan.js`, and a fixture asserts their `add` commands are identical.

- **A plain Claude copy created under `--no-claude` was left in place.** The
  prune hung off *"is this run touching plugins"*, which is a proxy for the
  real question: a copy is a shadow when a plugin of the **same member** is
  installed. Teaching `update` to call `skills add` gave it the auto-detect
  side effect `install` always had, and the proxy let the copy survive — a
  `task-pipeline` copy beside the `task-pipeline` plugin, serving a frozen
  version forever. The prune now runs whenever the skills-CLI step ran, matches
  by **marketplace** rather than skill id (`sheleg-design` ships under
  `sheleg-design-skill`, so a skill-id lookup finds nothing and prunes
  nothing), and leaves alone a plain copy whose member has no plugin at all.

### Changed

- **`defaultAgents` gains `kiro-cli` and `goose`.** Both channels held 12 of
  the family's 19 skills: fed once by hand, never in the default set, so every
  later member missed them — and the channel read as served because most of it
  was there.
- **`update` accepts `--agent` and `--all`**, since it now resolves an agent
  set rather than only refreshing what it finds. The README sentence saying it
  takes no `--agent` was true before this release and is gone.

### Ratchets

- 10 suites, 228 fixtures (from 9 and 209), 8 pinned members. Counted by
  running `npm test`.

## v0.29.3 — 2026-08-10

### Changed

- **`seo-aeo-audit` pinned to 0.14.1.** Its acceptance walk found that 0.14.0 had
  fixed the unreachable script invocations in `SKILL.md` and guarded that one file,
  while the README carried eight more and the slash command a ninth — the release
  written to fix "a guard is written against the home that broke" broke it and
  shipped. All three homes resolve now, and the guard reads all three.

## v0.29.2 — 2026-08-10

### Changed

- **`seo-aeo-audit` pinned to 0.14.0.** A second audit of that skill, run through
  the lens the first one did not use — what happens when an *agent* uses it. All
  eleven documented script invocations were written relative to the caller's
  working directory, which is the user's project and not the skill directory, so
  every one of them failed in the only environment the skill is ever used in. That
  failure is quiet in the way that costs: the agent absorbs it, checks by hand, and
  the audit silently drops to the bottom rung of its own evidence ladder. The
  invocations now resolve through `$SKILL_DIR`, and a validator guard rejects a
  bare `scripts/*.py` path.

  Two output contracts changed with it, which is why the member went to `0.14.0`
  and not `0.13.1`: `url_inspection.py` and `psi_pull.py` exit **1** when a run
  produced nothing usable. Both already printed honest prose — a run of 403s says
  it supports no findings at any tier — but the exit status said success, and the
  documented invocation redirects stdout to a file. Four renderers also put raw
  Google error pages into markdown, so a live preflight lost two of its seven rows
  to a newline, and that instrument's coverage denominator shrank when a source
  failed rather than reporting the check as unattempted.

## v0.29.1 — 2026-08-10

### Changed

- **`make-skill` pinned to 0.11.1.** A behavioural pass over 0.11.0 measured
  coexistence instead of assuming it: the nearest neighbour is
  `claude-mem:version-bump` at 9.6%, not `task-pipeline` at 4.7% as that repo's
  own evaluation notes predicted. `version-bump` advertises the same
  manifest-bump-and-release job and is enabled alongside. make-skill's
  description now carries the "NOT for a version bump or release in a repo that
  ships anything but a skill or plugin" clause, its trigger set gains the
  ambiguous case on both sides of the split, and the 5% headroom rule now covers
  the description as well as the body.
- **`agent-sync` pinned to 1.7.1** — published to npm and released; the pin was the
  step still outstanding.

## v0.29.0 — 2026-08-10

Carries the v0.28.3 section below, which landed on `main` but was never tagged.

### Fixed

- **A router the operator never wrote was being recorded as theirs — all eight,
  on the first run of any machine.** `migrate()` returns
  `Object.assign({}, fallbacks, extracted)`: the bodies to write, with the
  packaged defaults merged in. `bin/sshlg-skills.js` read that whole map as
  "what the operator just wrote" and called `authoredSet` on every key. Since
  an authored entry wins over the packaged text on every later run, one
  `routers` run froze the block permanently — the pack could ship a reworded
  router forever and it would never arrive anywhere. Reproduced on a clean
  `HOME`: eight authored entries after a single `routers --update`, zero after
  the fix. `migrate()` now also returns `migrated`, the names it actually cut
  out of the file, and the command iterates that.

  The two are different questions and merging them is what cost the release:
  `routers` answers *what body goes in this section*, `migrated` answers *which
  of these did a person write*.

### Added

- **`routers` now says when your wording has diverged from the packaged one.**
  Your text still wins — that is the point of `authored`, and it is why the
  block can be trusted against a file with no version control behind it. What
  changes is that silence is no longer the decision: every run names the
  routers whose text has drifted.

  - `routers --diff <name>` — both sides, writes nothing, asks no consent.
  - `routers --update --adopt <name>` — take the packaged wording for that
    router only. What it replaces is parked under `adopted:<name>`,
    **write-once**, so a second adoption can never overwrite the only surviving
    copy of what you wrote. The key is deliberately not the router's own stash
    key: an on/off toggle must give back what the *switch* removed, not what
    adoption replaced.

  `lib/drift.js` is pure like `lib/routers.js` — both sides are handed in — and
  a fixture asserts it never reaches the filesystem. That fixture first failed
  against the doc comment explaining the rule; it now strips comments before
  scanning, because a guard that fires on its own prose is the substring-grep
  failure this repository has already recorded twice.

- **`docs/superpowers/backlog.md`** — what this repo owes, with priority
  computed (`blast × (1 + age) / effort`) rather than felt. Eight open rows.
- **`docs/superpowers/verification.md`** — one row per shipped REQ and what
  confirmed it, so *green* never reads as *verified*. Starts at this release;
  earlier work is not given retrospective statuses it never earned.
- **`CLAUDE.md`** for the umbrella itself, closing carry-over C-06 — every
  member had house rules and the parent did not.

### Changed

- **README and `SECURITY.md` count eight members, not six.** Three places in
  each still described the family as it was before the 2026-08-06 port.
- **`SECURITY.md` no longer claims "every pin is a release tag".** It is not
  true: `sheleg-dev` and `agent-stack` have no tags at all
  (`git ls-remote --tags` returns nothing for either), so each is pinned to a
  reviewed commit on `main`. The pin is still exact; there is simply no tag to
  compare it against, and the trust-boundary section now says so.
- **`package.json`'s description** named six of the eight members. That string
  is what npm renders.

- **`agent-sync` pinned to 1.7.0**, and the last red pin in the family closes
  with it. It had been stuck at 1.4.3 since 2026-08-03 while three tags claimed
  otherwise: `release.yml` extracted its notes with `awk '$0 ~ "^## " v'` while
  the CHANGELOG writes `## v1.5.2`, and the terminator `/^## [0-9]/` missed the
  same prefix, so v1.5.0, v1.5.1 and v1.5.2 each tagged and died at
  `no CHANGELOG section` (run `31287012133`) with npm never receiving one.

  That repository was held by another agent for the whole of this run, so this
  one diagnosed and recorded rather than fixed. They landed both halves while
  it was in flight — the notes extraction (run `31374955487`, green) and the
  validator failure underneath it (run `31374949511`, green) — and npm now
  serves 1.7.0, so the pin moved here the moment there was a release to point
  at. Board rows B-01 and B-02 close with the run ids that fixed them.

### Ratchets

- 9 suites, 209 fixtures (from 8 and 182), 8 pinned members. Counted by running
  `npm test`, not carried across from the previous edit.

## v0.28.3 — 2026-08-10

### Changed

- **`task-pipeline` pinned to 1.38.0** and **`sheleg-design` to 1.10.0.** Both had
  shipped their releases and neither pin had moved, so `list` advertised 1.18.0 and
  1.7.0 and `update` installed them — twenty and three releases behind their own
  tags, with nothing in either repo revealing the gap.

### Known gap

- **`agent-sync` stays pinned at 1.4.3 on purpose.** Its 1.5.0, 1.5.1 and 1.5.2
  tags each pushed and then failed before publishing: the release workflow looked
  for `## 1.5.2` in the CHANGELOG while the file writes `## v1.5.2`, so every tag
  looked delivered and npm never received one. Pinning to a version the registry
  does not serve would move the lie rather than fix it. The pin moves when
  agent-sync publishes, and `test/check_pins.py` keeps this build red until it
  does — which is the check working, not an obstacle to route around.

## v0.28.2 — 2026-08-10

### Changed

- **`seo-aeo-audit` pinned to 0.13.0.** A fresh-eyes audit of that skill — every
  command, every bundled script, all twenty-two references — found 43 defects, nine
  of which made it emit or suppress findings in ordinary use. The four-command gate
  was green against all of them.

  The ones that change what a user of the skill gets: `max-image-preview:none` was
  reported as a `noindex` blocker, which is a stop condition, so an audit ended there
  on a fabrication; jQuery's `$` or a correct `Offer.priceCurrency` produced a
  finding claiming the page hides its price from answer engines; a response truncated
  by `--max-bytes` was analyzed as if it were the page (10,001 words at the default
  cap, 475 at 3000, no warning either time); a Search Console run of 403s ended by
  declaring its own output `CONFIRMED`; and `gsc_pull.py` computed cannibalization,
  the CTR curve and the branded split and printed none of them in its default format.

  Thirteen reconciliation guards were added, each watched failing on the real
  repository before the fact was corrected. The pattern they close: a guard written
  against the one home a fact had drifted in, while the fact lived in four — the myth
  count was green with three of its four homes wrong.

  Two output contracts change, which is why this is a minor and not a patch: the
  `thin` finding code is now `low-extractable-text`, and `onpage-checks.md`'s
  sections are `O1`–`O5` where they were `D1`–`E2`.

## v0.28.1 — 2026-08-10

### Changed

- **`make-skill` pinned to 0.11.0.** A file-by-file audit of that repo, run with
  its own evidence rules, found two defects that manufacture wrong answers: a
  path variable used as prose (the skill body is substituted at load time, so
  agents read a filesystem path where a host capability was named), and an audit
  procedure whose very first command was built from that same variable — which is
  empty in the Bash tool, so the one step the canon forbids reasoning through was
  the one step that could not run. Both are fixed at the root: the auditor now
  ships as `bin/make-skill-audit`, which Claude Code puts on the Bash PATH.

  The release also adds NOT-RUN as a third audit verdict, and makes claims about
  a repo machine-checkable — counted claims against their artifacts, the skill
  card's version against the manifest, every shipped reference against the
  README.

  This pin is the step that release owed the family: until it moves, `list`
  advertises the previous version and `update` installs it.

## v0.28.0 — 2026-08-10

### Changed

- **`super-ux` pinned to 0.32.0.** A structural audit of 0.31.0 closed
  twenty-two findings: the system map no longer links contracts (one pointer
  had been shipping all nine brand contracts into every UX skill), `vision`
  reaches the map, both linters, the doctor, a template, a Cursor rule and
  `/ux`, and three new gates check composition rather than shape — a count in
  prose against the artifact it counts, a skill against the five places it
  must appear, a script against the command that installs it. The description
  and the README row also said "31-check copy linter" against a linter
  emitting 33.

## v0.27.1 — 2026-08-06

### Fixed

- **The two new submodules were added over SSH, and that breaks every clone
  without a key — CI included.** `gh repo create --source .` sets an SSH remote,
  `git submodule add` inherits it, and the six older members are HTTPS. The
  release smoke test runs `npx github:ssheleg/sshlg-skills#<tag>`, which
  initialises submodules and exited **128**. Both urls rewritten to HTTPS.

  The failure mode is the reason this is worth a guard rather than a fix: an SSH
  url works forever on the machine that added it. Nothing local can see it.

### Added

- **Validator guard: every submodule url must be HTTPS.** Planted against — an
  SSH url in `.gitmodules` now fails the validator — with a matching negative
  self-test in CI. This is the default mistake, not an exotic one.

## v0.27.0 — 2026-08-06

### Changed

- **Three members re-pinned to the releases this port produced:**
  `super-ux` **0.31.0** (a seventh skill, `vision` — the layer above
  `ux-foundation`), `task-pipeline` **1.18.0** (stages 7–8 gain the verbs behind
  their gates), `seo-aeo-audit` **0.12.0** (Google Discover as its own track,
  plus the sitemap protocol).
- `super-ux`'s `skillNames` gains `vision`, so the launcher installs it.

### Notes

- `task-pipeline` shipped as **1.18.0, not 1.17.0**. While the change was in
  review, another session released 1.17.0 on `main` and the numbers collided.
  Both touched stage 8, and both were right: reading the CI verdict for the
  deploy's own commit, and running all three verifications rather than one. The
  resolution keeps **both** — a merge conflict between two correct changes is
  not a choice between them.
- The family is now **8 members, 19 skills**.

## v0.26.0 — 2026-08-06

### Added

- **Two new members: `sheleg-dev` and `agent-stack`.** The family goes from six
  to eight. Both were ported out of a Cursor-only skills directory where they had
  no version, no validator and no route to any agent but one.

  - **[`sheleg-dev`](https://github.com/ssheleg/sheleg-dev) 0.1.0** — five skills:
    `crypto-payments`, `ad-tracking`, `google-signin`, `google-auth`,
    `frontend-performance`. The layer a product reaches once it has users.
  - **[`agent-stack`](https://github.com/ssheleg/agent-stack) 0.1.0** —
    `agent-orchestrator`, plus the wallet side of reselling LLM access.

- `make-skill` re-pinned to **0.10.0** — `references/mcp-ship.md`, the half of
  MCP work that starts after the server compiles.

### Changed

- **Ratchet: 6 → 8 pinned members** (`docs/DOCMAP.md`). Suites and fixtures are
  unchanged at 8 and 182, and all three numbers were **counted by running
  `npm test`**, not carried across from the previous entry.

### Decided

- **No new routers.** The global block stays at eight axes. A router obliges —
  "this work goes through it". The new skills are reference material found by
  their own descriptions, and seven more rows would have grown the block in every
  project on the machine to buy nothing a description does not already buy. This
  closes the decision deferred at stage 0 (C-11).

### Notes

- Both new members ship a validator whose every guard was **planted against and
  watched failing** before being trusted — seven defects each. One of them was
  decoration on the first attempt: the guard checking that CI still calls the
  validator matched a substring the negative self-tests themselves satisfy. That
  is the same class the 2026-08-05 retro entry records, caught the same way.

## v0.25.0 — 2026-08-06

### Added
- `task-pipeline` **1.16.1** — **`evidence-docs`**, a second skill in the same plugin and
  the front door to the ten canons: the canons as a one-line index, a pointer to their one
  home, and a table of where to go next. It fills the router row that named
  `evidence-docs` while nothing resolved it. Shipped inside the existing plugin rather
  than as a new member, so there is one set of files and no copy to drift — the launcher
  now installs two skills from this entry. Guards 108 → 113, including one that rejects
  frontmatter a regex calls valid and a YAML parser silently drops.

## v0.24.0 — 2026-08-06

### Added
- `task-pipeline` **1.15.0** — two halves under one tag. The code graph's ledger row now
  states a **measured lag** ("N commits behind HEAD") instead of a build date, so stage 0
  can tell a fresh graph from one that merely looks recent. And `references/documentation.md`
  gains **the ten canons** — what makes a document evidence rather than an assertion: a
  claim carries its address, numbers are computed rather than restated, one home per fact,
  a reference resolves from where the document is *read*, green nobody watched turn red is
  not evidence, a check proves its scope and nothing beyond it, silence is not a pass, an
  estimate is never announced as a measurement, what was not checked is printed beside what
  was, and the document ships in the change that made it true. Each canon names where it is
  enforced instead of restating the mechanism. Guards 95 → 108.

## v0.23.1 — 2026-08-06

### Fixed

- **"Hand-written rules win" was true exactly once.** Migration moves a
  hand-written rule into the block and removes the heading it came from — so
  from the second run onward there is nothing left in the file to recognise
  the section as the operator's, and the packaged default regenerated over it.
  Observed on a real machine: run two replaced both migrated sections with
  boilerplate, silently, in a file with no version control behind it.

  The same flow existed in v0.22.x and nobody reached it, because run two
  corrupted the block first (fixed in v0.23.0). Fixing the louder failure is
  what exposed the quieter one.

  A migrated section is now recorded as **authored** the one moment it is
  still identifiable — as its heading leaves the file — and an authored
  section is never rewritten: `upsert` keeps the same segment and the same
  bytes. That also protects an edit made inside the block by hand afterwards,
  which nothing protected before.

  Precedence for a section's body is now explicit: **what the operator wrote >
  what a setting took out > the packaged default.**

- Three fixtures for it, planted and watched: the second run, a hand edit
  made inside the block afterwards, and a router the operator never wrote
  still receiving the packaged text. 182 across eight suites, counted.

## v0.23.0 — 2026-08-06

### Fixed

- **The second `routers` run destroyed the block the first one wrote.** The
  block's own heading is `## Роутинг работы — семья ssheleg`; migration's
  pattern for the hand-written rule is `## Роутинг работы`. On the second run
  it took the block's heading for a hand-written rule and cut from there to the
  next H1 or end of file — carrying the closing sentinel, and every rule the
  operator kept below it, out of `~/.claude/CLAUDE.md`. The command then
  reported the block malformed and refused to touch it again. Shipped in
  v0.22.0 and reproduced against it.

  It hid because idempotence was proven on `upsert`, which is pure, while the
  damage happened one layer up in the command that runs migration first. On
  this machine it cost nothing only because the block had never been written.
  Migration now never reads inside the managed block, and **skips past it
  rather than stopping at it**, so a hand-written rule *below* the block is
  still found.

- **A section ended at the next `## `, and an `# ` heading did not stop it.**
  In the operator's real file the section to be cut is followed by exactly
  that, so the cut ran to end of file. A `### ` subheading still does not end
  its parent.

- **`npm test` did not exist.** Eight suites and two validators ran only in
  CI; locally the standard command failed with `Missing script: "test"`.

### Added

- **Eight routers, declared once each.** A router used to be written twice —
  its text in `router-texts.js`, its table row in `routers.js` — with nothing
  comparing the halves. One registry entry now carries what a router is: the
  members it needs, its two table cells, its text. Key order is table order.
  - New: `sheleg-design` (how it looks and moves), `make-skill` (how the skill
    itself is built), `agent-sync` (who is holding this file).
  - New and backed by **no skill at all**: `seo-llmo` and `evidence-docs` are
    rules rather than tools, so they hold whether or not anything is
    installed. That is why a router stopped being a property of a member.
  - `task-pipeline`'s text now claims **planning** as its own stages 2–4,
    which retires the competing planning rule beside it: a superseded heading
    is removed only when the router replacing it is actually written, and its
    body is kept rather than dropped.
- **`sshlg-skills config`** — every router on or off by name. Switching one
  off removes its section and its table row; switching it back on restores the
  **exact bytes**, including wording of the operator's that migration had
  moved in. `~/.claude/CLAUDE.md` has no version control behind it, so a
  toggle that regenerated the packaged text would erase a person's words
  silently.
  - Settings store **deviations only**, so a router added in a later release
    arrives switched on rather than silently off.
- Sections are kept in registry order, so the block's reading order cannot
  drift from the table it renders.

### Changed

- `npm test` is the one entry point, and it **discovers** `test/*_test.js`
  instead of listing them. An empty run fails rather than reporting green, and
  `validate.py` fails if CI stops calling `npm test` — a guard that shipped
  wrong the first time (it matched the substring anywhere in the workflow,
  which the negative self-tests satisfy) and was tightened after being planted
  and watched.
- `node --check` on the launcher is replaced by running the launcher, per the
  retrospective's first standing instruction.
- **179 fixtures across eight suites, up from 75 across five** — both numbers
  counted by running the suites, not carried over. The previous release notes
  claimed 71 and its acceptance record claimed 74; the count at that commit is
  75. Three numbers, one measurement, and the two that were restated are the
  two that were wrong. That is the `evidence-docs` router's entire argument,
  arriving from this repository's own paperwork.

## v0.22.2 — 2026-08-05

### Fixed
- **`--dry-run` previewed the refusal instead of the block.** Down a pipe it
  reported `would-opt-out`, which answers "what happens if I decline" — not
  the question a preview is asked. It now shows the block that would be
  written and states plainly that nothing was changed and no consent was
  requested or recorded.

 — 2026-08-05

### Fixed
- **`lib/` was missing from the published package**, so `sshlg-skills routers`
  died with `MODULE_NOT_FOUND` for anyone installing through npx. The code was
  correct and complete in the repository and absent from the tarball —
  `files[]` listed `bin` and not `lib`.
- `test/validate.py` now derives the requirement from the source: every
  `require('../…')` in `bin/` must have its top-level directory in `files[]`.
  A hand-kept list is what was already wrong, so the check reads the code
  instead of trusting one.

 — 2026-08-05

### Added
- **`sshlg-skills routers`** — writes a managed routing block into the global
  agent instructions (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`), so the
  family's skills engage by default in every project instead of only when
  someone remembers to ask.
  - **Consent is asked once and silence is never the answer.** Installing a
    skill is not permission to change persistent instructions; a
    non-interactive stdin answers no and says so. Declining writes an
    `SSHLG:ROUTERS:OPTOUT` marker, which the block's own header names as the
    way out and which survives reinstalls and restored dotfiles.
  - **Sections are per-member**, so the bundle and a single member's installer
    can both write without one reformatting the other's work.
    `--member super-ux` writes two routers and a two-row table.
  - **Hand-written rules win.** Migration moves the operator's own wording in
    verbatim; the packaged texts are used only for a router they never wrote.
  - Everything outside the sentinels is preserved byte for byte, `--dry-run`
    shows a diff and writes nothing, and a malformed block is reported and
    never repaired — repairing is a guess about text we did not write.
- Five Node test suites (71 fixtures), gated in CI.

### Changed
- super-ux pinned to 0.30.2.

 — 2026-08-05

### Changed
- **super-ux pinned to 0.30.1** — it patches a template that told projects to
  write `PER-NN` where the UX contract numbers personas `P-NN`, which earned a
  false blocking lint error. Caught by `check_pins.py` within a minute of the
  tag; third catch since it was built.

## v0.21.2 — 2026-08-05

### Fixed
- `task-pipeline` **1.14.1** — 1.14.0's fourteen new guards were first written below the
  validator's verdict block, where a check runs after the verdict on a clean repo and
  not at all on a corrupted one. A guard now rejects any check placed there. v0.21.1
  shipped while the member was already one patch ahead.

 — 2026-08-05

### Changed
- **`check_pins.py` also compares against each member's own git tag.** The npm
  half, shipped hours earlier in v0.20.0, is silent for four of six members —
  they are not published there at all, and that silence is not safety. v0.21.0
  had just fixed exactly the drift it could not see: `task-pipeline` pinned at
  1.11.0 while 1.12.0 and 1.13.0 were tagged, invisible for two days. A tag
  exists for every member, so the tag comparison is the half that covers all
  of them.
- **make-skill pinned to 0.9.1** — it corrected a release checklist that told
  agents to publish npm by hand, contradicting its own instruction to arm CI
  publishing.

 — 2026-08-05

### Added
- `task-pipeline` **1.14.0** — **false success**, named as a class: a mechanism that
  reports a win it never checked. Every instance this project had recorded — the hook
  that fails open, the cancel that accepted an unscheduled id, the counter asserting
  the new number instead of the absence of the old — had been fixed as its own bug,
  because the class had no name to be swept by. Its second half is **effect
  verification**: a diff shows what a task wrote and never what it did, so every step
  with an effect outside its own diff now carries the command that *confirmed* the
  state rather than the one that caused it. Guards 80 → 94.

### Fixed
- **The pin sat at 1.11.0 while 1.12.0 and 1.13.0 shipped.** Two releases — the
  artifact-hygiene gate and the read-back rules — were tagged, published to npm and
  invisible here: `list` reported 1.11.0 and `update` installed it. This is the exact
  failure the release doctrine warns about, and it went unnoticed because nothing
  compares the catalogue against the member's own latest tag. Pin moved straight to
  1.14.0; the two skipped releases are in the member's changelog.

## v0.20.1 — 2026-08-05

### Changed
- **make-skill pinned to 0.9.1** — it corrected a release checklist that told
  agents to publish npm by hand, contradicting its own instruction to arm CI
  publishing.

 — 2026-08-05

### Added
- **`test/check_pins.py`** — compares every pin against the npm registry, and
  runs in CI. `validate.py` proves the pin, the submodule and the README agree
  with each other; all three can agree and all three be wrong, because nothing
  local knows what was actually published. That is how the super-ux pin sat at
  0.26.5 for four releases while npm carried 0.29.0.
  - It verifies **ownership** before reporting drift: a name that exists is not
    a name that belongs to us — `task-pipeline` on npm is someone else's 0.1.0,
    and calling that drift would be worse than not checking.
  - Kept out of `validate.py` deliberately: that one must run offline.

### Fixed
- **sheleg-design pinned to 1.7.0** (was 1.3.4) — found by the new check on its
  first run, along with the submodule and README table that had drifted with it.

 — 2026-08-05

### Fixed
- **v0.19.0 shipped with the submodule and the README still on 0.26.5.** The
  pin in `skills.json` moved to 0.30.0 while `skills/super-ux` still pointed at
  the old commit and the README table still printed the old number — the
  validator said so and the release went out anyway. v0.19.0 is left in place
  and superseded, not deleted.

## v0.19.0 — 2026-08-05

### Changed
- **super-ux pinned to 0.30.0** (was 0.26.5). The pin had gone four releases
  stale, so `list` and `update` were reporting and installing 0.26.5 while npm
  carried 0.29.0 — the exact failure the catalogue exists to prevent.
- **Two new skills in the super-ux entry:** `brand-voice` and `copywriting`,
  the verbal identity layer added in 0.30.0.

## v0.18.5 — 2026-08-05

### Changed
- **seo-aeo-audit pinned to 0.11.2** (was 0.11.1). A self-audit of the previous
  two releases: a 2017 engine statement had been dated 2026, a second table was
  split by a blank line (now a validator check), and four smaller defects in
  precision and provenance.

## v0.18.4 — 2026-08-05

### Changed
- **seo-aeo-audit pinned to 0.11.1** (was 0.11.0). Patch: two myth-guard rows
  rendered outside their table, and the validator gained the count check that
  found them.

## v0.18.3 — 2026-08-05

### Changed
- **seo-aeo-audit pinned to 0.11.0** (was 0.10.0). A two-week window of
  practitioner sources screened on two gates — does it contradict what the skill
  already holds, and does the number survive its primary source. Adds rendering
  as a budget separate from crawl budget (with a diagnostic that can actually be
  run), Googlebot's one-shot viewport stretch, the reliability problem in entity
  extraction tooling, a service-area local block, and five detection patterns
  including the paid-mention market now selling itself as AEO. Fixes three
  defects the screening exposed: the evidence-tier vocabulary had two homes that
  disagreed, an on-page check reported a non-finding, and a documented diagnostic
  named a Search Console field that does not exist.

## v0.18.2 — 2026-08-04

### Changed
- **seo-aeo-audit pinned to 0.10.0** (was 0.9.3). That release adds an eighth
  non-negotiable — instruments must declare their own blind spots — four new
  collectors (URL Inspection, sitemap inventory, PageSpeed field/lab, access
  preflight), and the C-SEO Bench result that bounds the GEO study the skill
  had been quoting unqualified. It also fixes a false finding: JS-injected
  JSON-LD was reported as absent schema.


## v0.18.1 — 2026-08-04

### Added
- `task-pipeline` **1.11.0** — run continuity: the pacing rules the operator had been
  repeating by hand. The loop is configuration now (`run.loop`, absent ⇒ off) and is
  surfaced at launch instead of assumed. The context rule states its evidence
  condition, so "the context is nearly exhausted" may no longer be announced without a
  signal that says so — an estimate presented as a measurement teaches everyone to
  ignore the one time it is true. A fire landing on a parked `manual` gate quiesces its
  own loop and prints the re-arm line instead of idling, and the teardown is verified
  by listing the schedule, never by trusting the cancel's reply.

### Fixed
- `task-pipeline` **1.11.0** — three shipped templates carried relative links that
  broke the moment the template was seeded where the doctrine says to seed it; present
  since v1.1.0, unnoticed because no run had seeded them verbatim. Guards 63 → 68, each
  with a negative self-test that plants the defect and requires rejection.
- The pin moved in `skills.json` alone. The launcher's own validator refused the
  release for the two surfaces that were left behind — the submodule still checked out
  at v1.10.3 and the README table still printing 1.10.3 — so **v0.18.0 was tagged and
  never published**; 0.18.1 is that release, complete. The gate did exactly its job:
  a catalogue that says one version while shipping another is the failure it exists
  to prevent.

## v0.17.3 — 2026-08-03

### Fixed
- `task-pipeline` **1.10.3** — the cause behind five audit passes rather than a sixth
  symptom. Nine of ~30 findings were one missing propagation row: *adding a document*,
  the change type a project makes most often and the row nobody writes. It is now step
  0 of the matrix procedure, guarded in the seeded template, a pass of the entry audit
  and a named release step.

## v0.17.2 — 2026-08-03

### Fixed
- `task-pipeline` **1.10.2** — `CONTRIBUTING.md` claims its invariants are what the
  validator enforces and was eight guards behind. The list is self-verifying now:
  every invariant citing a guard cites a literal the validator actually prints.

## v0.17.1 — 2026-08-03

### Fixed
- `task-pipeline` **1.10.1** — four surfaces that never heard about the last two
  releases, the Cursor rule among them: it is the one copied into foreign projects and
  it knew nothing about the routing boundary, the opt-out phrase or the entry audit.
  Plus the portability manifest, which covered 14 of 26 references while claiming
  every workflow decision. Two new guards check the direction that finds absences.

## v0.17.0 — 2026-08-03

### Changed
- `task-pipeline` **1.10.0** — the entry audit (`/task-pipeline setup`) that runs over
  the docs a project already has, *before* the feature; the portability boundary that
  keeps workflow decisions inside the bundle and project answers inside the project,
  with a guarded manifest; and a routing rule that finally ships as a file instead of
  being hand-installed. Plus self-currency at preflight, the cost-of-being-wrong
  escalation boundary, and user paths as a stage-2 design output.

## v0.16.2 — 2026-08-03

### Changed
- `make-skill` pinned to **0.9.0** — it now ships the Claude Code capability set it
  documents (a `PostToolUse` hook that audits a `SKILL.md` the moment it is written
  and is silent otherwise, a `skill-auditor` subagent, a `/skill-audit` command, and
  a stdlib `audit_skill.py` that audits any skill directory), and turns the missing
  half into a rule: **every host capability is an accelerator with a written
  fallback** — for hosts that are not Claude Code, for a recommended plugin that is
  absent, and for a missing tool or MCP server. Skeletons moved inside the skill
  directory, where they finally reach every channel; `SKILL-CARD.md` discloses the
  hook to a reviewer.

## v0.16.1 — 2026-08-03

### Changed
- `task-pipeline` **1.9.1** — `artifacts.md` now maps the stage/artifact relation in
  both directions: what each stage **reads and from where**, and which host-owned
  rule files bind a run, with where each is read and enforced.

## v0.16.0 — 2026-08-03

### Changed
- `task-pipeline` **1.9.0** — the adoption track: greenfield seeding and a brownfield
  walkthrough whose third step baselines the ratchets at today, so a gate is green on
  the history it inherited. Default-on routing inside a stated boundary — work that
  changes the repository — with an explicit exclusion clause and an opt-out phrase
  that an eval exercises.
- `agent-sync` **1.4.3** — its binding to the pipeline: a config example that
  actually validates against the schema it cites, gate texts that extend the stage's
  own criteria instead of replacing them, the right stage-9 doctrine, and
  `docs/DOCMAP.md` + `docs/superpowers/retro.md` added to `guardedFiles`.

## v0.15.9 — 2026-08-03

### Fixed
- `task-pipeline` pinned to **1.8.1** — a code-and-contradiction audit: fifteen false
  cross-references (eleven pointing at a section about something else), both
  installers creating the plain `~/.claude/skills/` copy this launcher prunes, and an
  npm package that excluded the files its own README links to.

## v0.15.8 — 2026-08-03

### Fixed
- `make-skill` pinned to **0.8.1** — a file-by-file re-read of 0.8.0 found fourteen
  defects, two of them misleading: the SKILL.md token estimate was asserted rather
  than measured (real range 3.78–4.47 chars/token, so the budget check was
  recalibrated and the audit checklist moved into its own reference), and
  `SECURITY.md` described an installer path that has not existed since 0.6.x. Also
  a trigger-eval split that left every positive in the train half, `displayName`
  required by the canon and missing from both manifest skeletons, and three more
  negative self-tests.

## v0.15.7 — 2026-08-03

### Fixed
- `make-skill` pinned to **0.8.0** — audited against the same four Anthropic Agent
  Skills pages, which its canon had never been written against. Three new
  references: `surfaces.md` (the Claude API container has no network and no runtime
  package install, so a script that `pip install`s works in Claude Code and fails
  after upload), `enterprise.md` (the risk table and review checklist for
  installing a skill you did not write), `authoring.md` (degrees of freedom, script
  rules, evaluation-driven development). Two rules the open standard is silent
  about and the Skills API enforces on upload — no `anthropic`/`claude` in `name`,
  no XML tags in `name`/`description` — are now validator-checked, along with
  third-person descriptions, the 5000-token body budget the skill had quietly been
  exceeding, and a `## Contents` list on every reference over 100 lines. Ships its
  own evaluation suite in `test/evals/`.

## v0.15.6 — 2026-08-03

### Fixed
- `task-pipeline` pinned to **1.8.0** — audited against Anthropic's four Agent Skills
  pages and brought to them: a `## Contents` list on every reference over 100 lines
  (compared against the headings, not merely present), a behavioural evaluation suite
  covering trigger accuracy, coexistence and instruction following, a copyable run
  checklist, a stated degree of freedom per stage, and a `SKILL-CARD.md` with an
  honest pass over the enterprise risk table.

## v0.15.5 — 2026-08-03

### Fixed
- `task-pipeline` pinned to **1.7.2** — nine findings from a post-release audit of
  1.7.1: the seeded documentation gate read only one of the two register shapes it
  promises (an ADR project got eight green `dormant` lines over a populated
  register), the Doc Loop was declared cross-cutting and named in no stage doctrine
  at all, and the hook contract had been written from memory. Each was proven before
  the fix and again after; 46 of 46 guards provably reject their planted defect.

## v0.15.4 — 2026-08-03

### Fixed
- `task-pipeline` pinned at **1.4.4** while the registry served **1.7.1** — three
  releases (1.6.0, 1.6.1, 1.7.0) were invisible from here. `list` kept reporting
  the old number and `update` kept installing it, so anyone comparing their install
  against the catalogue was told the wrong thing with nothing to reveal it. This is
  the exact failure `task-pipeline`'s own CONTRIBUTING warns about — *a release is
  not finished at `npm publish`* — and it had been true for three of them.
- Pin moved to **1.7.1**: documentation as a governed deliverable with a portable
  gate, the gate and hook doctrines, and a retrospective whose every lesson carries
  a resolvable commit.

## v0.15.3 — 2026-07-31

### Fixed
- `make-skill` 0.7.1 — six corrections from re-reading the Claude Code plugin
  reference, two of them places where the docs and the binary disagree:
  `claude plugin validate` does not check front matter despite the docs saying
  it does, and `claude plugin update <bare-name>` reports "not found" and exits
  0 instead of working as documented. Also: the marketplace-root exception to
  the `skills` field, `allowed-tools` being looser in Claude Code than in the
  open standard, and the LSP/monitor field sets the reference promised but never
  carried.

## v0.15.2 — 2026-07-30

### Changed
- `make-skill` 0.7.0 — the Claude Code plugin reference is now a bundled
  reference file (`references/claude-code-plugin.md`: both manifest schemas,
  plugin sources, component locations, host-only front matter, path variables,
  cache and symlink rules, the whole `claude plugin` CLI), `$schema` sits in
  both manifests, and the validator enforces recognized-fields-only,
  `./`-relative component paths and a clean `.claude-plugin/` with negative
  tests for each. Its own duplicate component is gone: `commands/make-skill.md`
  registered `/make-skill` a second time behind the skill, so it was deleted and
  the rule ("never name a command after a skill") is now validator-enforced.

## v0.15.1 — 2026-07-30

Second pass against the Claude Code docs, checking the two layouts `--strict`
does not look at.

### Added
- **`displayName` in both manifests of all six plugins.** `name` is kebab-case
  because it namespaces components; the `/plugin` picker falls back to it, so the
  listing read `sheleg-design` where it now reads "SHELEG Design".
- `agent-sync` 1.4.2 — its README hook section now opens by naming itself the
  only part of the plugin that executes code on the reader's machine (four bash
  scripts, 15-20s timeouts, named events), pointing at `SECURITY.md` for every
  path the install touches. The facts were already there; the framing a reviewer
  looks for first was not.
- `make-skill` 0.6.6 — **`claude plugin details` joins the canon**: it reports
  what Claude Code believes a plugin contains and the always-on token cost per
  component, which is where duplicate components and oversized descriptions
  become visible.

### Verified, not assumed
- **`super-ux`'s shared `skills/references/` directory is not mistaken for a
  skill** on either channel: Claude Code's own inventory lists 12 components and
  none of them is `references`, and `npx skills add ssheleg/super-ux --list`
  reports exactly 4 skills. It has no `SKILL.md`, which is what both discoverers
  key on.

### Known, not yet changed
- **Every plugin lists one component twice.** `claude plugin details` shows
  `task-pipeline, task-pipeline` and, for `super-ux`, three duplicated names —
  because a `commands/<x>.md` and a `skills/<x>/SKILL.md` both claim `/<x>` now
  that custom commands are merged into skills. Both are loaded and both pay
  always-on tokens; only one answers the name. Removing the wrapper commands is
  the fix, but it also changes what the npx installers copy into
  `~/.claude/commands/`, so it is a deliberate change rather than a cleanup.

### Changed
- Pins: `super-ux` 0.26.5, `task-pipeline` 1.4.4, `make-skill` 0.6.6,
  `sheleg-design` 1.3.4, `seo-aeo-audit` 0.9.3, `agent-sync` 1.4.2.

## v0.15.0 — 2026-07-30

Audited all six plugins against the [Claude Code plugin
reference](https://code.claude.com/docs/en/plugins-reference) using
`claude plugin validate --strict`, the upstream schema checker, rather than by
reading the spec. Two defects, both invisible to every house validator in the
family, and one of them live in a published plugin.

### Fixed
- **`/ux-audit` was loading with no metadata at all** (`super-ux` 0.26.4). Its
  `argument-hint` was an unquoted `[all | feature:<name> | ...] [quick|deep]` —
  in YAML a bare `[...]` is a flow sequence, and this one failed to parse
  outright. A command whose front matter fails to parse loads with **every field
  silently dropped, description included**, and nothing at runtime says so. Nine
  command files across the family were unquoted; six were parsing as *lists*
  instead of strings, one (`seo-aeo-audit`) split on an internal comma.
- **`homepage` and `repository` sat at the top level of all six
  `marketplace.json` files, where Claude Code does not recognize them.** They are
  plugin-entry fields; moved there, so the values reach the plugin listing
  instead of being discarded at load time. Unrecognized fields are warnings the
  runtime tolerates — which is precisely why they survived everything except
  `--strict`.

### Added
- **The upstream validator now runs in every member's CI**, against both the
  plugin and the marketplace manifest. It needs no auth and no API key, so a
  runner installs `@anthropic-ai/claude-code` and runs it next to the repo's own
  validator. House rules and upstream schema are different checks; only one of
  them was being made.
- `make-skill` 0.6.5 carries both failures as canon, so the next skill is not
  born with either.

### Changed
- Pins: `super-ux` 0.26.4, `task-pipeline` 1.4.3, `make-skill` 0.6.5,
  `sheleg-design` 1.3.3, `seo-aeo-audit` 0.9.2, `agent-sync` 1.4.1.

## v0.14.1 — 2026-07-30

### Added
- **Releases publish themselves.** Every repo in the family — the six members
  and this hub — now carries a `release.yml` whose second job runs `npm publish
  --provenance` on a `v*` tag. `seo-aeo-audit` and `agent-sync` had no release
  workflow at all and now have the full one. Armed per repository by
  **`PUBLISH_NPMJS`**, alongside the existing `RELEASE_ENABLED`, so a fork of
  any of these inherits an inert workflow.

  Auth is written for both routes: `NODE_AUTH_TOKEN` from an `NPM_TOKEN` secret
  (a *granular automation* token — a classic one is still refused by 2FA), and
  `id-token: write` granted unconditionally so npm **trusted publishing** works
  once a package names this workflow as its trusted publisher. Adopting OIDC
  later is deleting a secret, not editing CI. That permission also signs
  provenance.

  Three properties, each of which is a red build if missing:
  - a version already on the registry is **skipped** — publishing over one is a
    hard 403, which would turn every re-run red;
  - a `workflow_dispatch` **`tag` input**, because a dispatch runs the workflow
    file *as of the ref it is dispatched on*: a tag pushed before the publish job
    existed can never grow one, and this is what lets the current workflow
    release an old tag;
  - `npm view` is **polled** after publishing — the read replica lags the write
    master, so published is a claim until the registry serves it.
- The GitHub-release step is now **idempotent** (create, or refresh the notes),
  so the whole workflow can be re-run instead of aborting on a release that
  already exists.

### Changed
- Pin **`make-skill` 0.6.4** — arming CI publishing is now step 9 of its
  first-publish checklist, and *the next tag publishes without a human* is a
  definition-of-done fact. Its distribution reference carries both auth routes.
- Pin **`agent-sync` 1.4.0** — branch discipline and a merge log.

## v0.14.0 — 2026-07-30

A sweep across all seven repositories over three things a user relies on and
nobody had checked end to end: that the installers work, that the licence is
visible, and that the links resolve.

### Fixed
- **`task-pipeline`'s `pipeline.schema.json` identified itself with a URL that
  404s** — and that file is installed into `~/.claude/skills/`, so every install
  carried a schema whose own `$id` could not be fetched. Fixed in 1.4.2.

### Changed
- **The licence is declared where it can be seen.** All six member repos ship a
  `LICENSE`, and not one declared it in either manifest a user actually reads:
  the `marketplace.json` plugin entry (a documented SPDX field) or the SKILL.md
  front matter. Both are optional in their specs, which is exactly why it stayed
  open — nothing errors on an absent licence. Now declared in both, everywhere.
- **`make-skill` 0.6.3 makes it part of the spec floor**, so the next skill is
  not born with the same gap.
- Pins: `super-ux` 0.26.3, `task-pipeline` 1.4.2, `make-skill` 0.6.3,
  `sheleg-design` 1.3.2, `seo-aeo-audit` 0.9.1, `agent-sync` 1.3.9.

### Verified, not assumed
- **Installers** — every package was built with `npm pack` and run from the
  tarball in a clean `HOME` from a non-repo directory. All install what they
  claim. `super-ux`'s tarball carries no `SKILL.md` **by design**: it delegates
  skill installation to the skills CLI and ships only templates and the linter.
  Both installers that accept `--agent a,b` were checked to split the list into
  repeated `--agent` flags — a comma-joined value reaches the skills CLI as one
  invalid agent.
- **Links** — all 108 external URLs across the family were requested. Everything
  outside the schema `$id` resolves; the rest of the non-200s are placeholders
  (`example.com`), API base paths, bot-blocked npm pages and `<file>` templates.
  Every relative markdown link resolves on disk.

## v0.13.1 — 2026-07-30

### Fixed
- **v0.13.0 justified the URL rewrite with a claim that does not hold**:
  `raw.githubusercontent.com` was said not to follow a repository transfer. It
  does — the old owner's raw path returns 200 with the current file. Corrected
  in place below, and the rewrite still stands on the reason that survives
  measurement: the old path works only while nobody re-registers the name.

### Changed
- Pin **`agent-sync` 1.3.7** — the same correction in that repo's notes.

## v0.13.0 — 2026-07-30

`agent-sync` moved to **`ssheleg/agent-sync`**. The whole family now lives under
one owner, which changes what this repo says about its own trust boundary.

### Changed
- **Submodule URL and manifest** — `.gitmodules` and `skills.json` (`repo`,
  `pluginMarketplace`) point at the new owner. GitHub keeps serving the old path
  on every surface, so this breaks nothing today; it stops depending on the
  `appvillis-com` name never being re-registered.
- **`SECURITY.md`** — the trust boundary is no longer split: six repos, one
  organization.
- README family table and `CONTRIBUTING.md` link to the new location.
- Pin **`agent-sync` 1.3.6** — every install path, identity field and raw URL
  inside that repo now names `ssheleg`.
- Pin **`task-pipeline` 1.4.1** — the three places it links to `agent-sync`.

### Fixed
- **The README family table advertised versions the manifest had moved past** —
  every row was behind (`super-ux` 0.26.1 vs 0.26.2, `task-pipeline` 1.3.2 vs
  1.4.1, `seo-aeo-audit` 0.8.0 vs 0.9.0, and so on), and `agent-sync`'s link had
  been stale since the move. It is the first thing a visitor reads.
- **Nothing was checking that table.** The validator now requires each skill's
  row to carry the repo URL and the version `skills.json` declares — the two
  ways it has actually drifted — with a CI negative self-test proving the check
  can fail.

## v0.12.2 — 2026-07-30

### Fixed
- The parent now points at `seo-aeo-audit` **v0.9.0**. v0.12.1 moved the pin in
  `skills.json` but left the submodule on v0.8.1 — the validator caught it, and
  the tag was left in place rather than rewritten, so this is the released
  version of that pin.

## v0.12.1 — 2026-07-30

### Changed
- Pin **`seo-aeo-audit` 0.9.0** — tracking parameters get their own mechanism,
  separate from facets and filters: canonicals already consolidate UTM variants,
  a `robots.txt` block cannot improve consolidation and cannot touch the one case
  where a parameterized URL out-signals its canonical, and the fix sits at the
  source (own internal and partner links) rather than in `robots.txt`. Ships with
  play L13, a thirtieth refuted myth, and the rung-2 crawl-waste fallback for
  hosted platforms that expose no server logs.

## v0.12.0 — 2026-07-30

Family-wide release sweep. Every member had work sitting on `main` that no
release carried: two had a bumped version with no tag, four had shipped files
(README, `SKILL.md`, references) changed under a version already on the
registry. A doc that only exists on `main` reaches nobody — the registry copy
is what `npx` installs and what the package page shows.

### Changed
- Pin **`task-pipeline` 1.4.0** — `references/learned.md`, fourteen rules
  earned by failure, wired into stages 5, 6, 9 and 10. Was tagged nowhere.
- Pin **`agent-sync` 1.3.5** — the two rules the plugin enforces (identity
  before coordination; a submodule's work is unfinished until its parent points
  at it), stated with the incidents behind them.
- Pin **`make-skill` 0.6.2** — first-publish step 10: a family member is not
  released until the umbrella pin moves. The rule this release exists to
  satisfy.
- Pin **`super-ux` 0.26.2**, **`sheleg-design` 1.3.1**, **`seo-aeo-audit`
  0.8.1** — the family install block (`install` / `update` / `list` + the
  restart note) and `agent-sync` in the member list now reach the registry.
- Hub README carries the same family commands and the six-member list.

## v0.11.1 — 2026-07-29

### Changed
- Pin `agent-sync` 1.3.4. The release fixes `release` reporting success for a
  lease held by another run while blanking that task's board claim — the board
  advertised work as free that was still leased, which is exactly the collision
  the skill exists to prevent.

## v0.11.0 — 2026-07-29

Consolidation pass: the hub had drifted behind the skills it advertises.

### Changed
- **Every pin refreshed** — super-ux 0.26.1, task-pipeline 1.3.2, agent-sync
  1.3.3, make-skill 0.6.1, sheleg-design 1.3.0, seo-aeo-audit 0.8.0. The hub was
  advertising versions up to five minors old, so a fresh `install` from a hub
  checkout got skills the table did not describe.
- **Descriptions rewritten against what each skill does today**, not what it did
  when it was added: super-ux carries Figma frames in its screens map,
  sheleg-design crosses the Figma border (tokens as variables, design to code),
  seo-aeo-audit ends in a link-building brief as well as a change plan, and
  agent-sync is described as a coordination *plane* rather than a lease store.
- `agent-sync` is now pinned to a release tag rather than a bare commit — it
  publishes tags as of 1.2.3, so the caveat recorded in `SECURITY.md` when it
  joined no longer applies.

## v0.10.0 — 2026-07-29

### Added
- **`agent-sync` joins the family** ([appvillis-com/agent-sync](https://github.com/appvillis-com/agent-sync),
  npm `@ssheleg/agent-sync`, pinned at **1.2.2**). Coordination for concurrent
  coding agents: leases with a TTL so two agents cannot claim the same work,
  race-free id reservation, a run journal and a generated board, over a
  pluggable knowledge cloud. It pairs with `task-pipeline`, which takes its
  leases from it.
- The family is now **six** skills, and the first one that does not live under
  the `ssheleg` organization — the launcher and validator were already
  org-agnostic (they use `repo` and `pluginMarketplace` verbatim), so nothing in
  the install path changed. `CONTRIBUTING.md` now says so explicitly: a new
  member has to ship the marketplace layout, not a particular owner.

### Changed
- Every place that enumerated the family — README, `package.json`, the launcher
  header, `SECURITY.md`, the issue forms — lists six.
- `SECURITY.md` names the split trust boundary (five repos under `ssheleg`, one
  under `appvillis-com`) and records that `agent-sync` publishes no git tags yet,
  so its pin is a bare commit rather than a release tag.

## v0.9.1 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.18.1 — the last repo to get its open-source surface, so
  all five now ship a security policy, a code of conduct, issue forms and a PR
  template.

## v0.9.0 — 2026-07-28

### Changed
- Pins refreshed after the family-wide open-source hygiene pass — every repo now
  carries a security policy, a code of conduct, issue forms and a PR template
  (super-ux 0.23.2, make-skill 0.6.1, sheleg-design 1.0.1, seo-aeo-audit 0.6.1).

## v0.8.1 — 2026-07-28

### Changed
- Pin `seo-aeo-audit` 0.6.0 — its release-readiness pass plus the US-spelling
  sweep that renamed the auditor's `analyse()` to `analyze()`.

## v0.8.0 — 2026-07-28

Production pass on the hub as a public repository.

### Added
- `CONTRIBUTING.md` — where a change belongs (hub vs skill repo), the two checks
  a PR must pass, and the install rules that are easy to work around by accident.
- `SECURITY.md` — what the launcher executes (three commands, explicit argv, no
  shell), the one path it ever deletes and why, the trust boundary, and private
  reporting.
- `CODE_OF_CONDUCT.md`, issue forms for bugs and ideas, and a PR template that
  asks for the command output rather than a "tests pass" claim.

### Changed
- README restructured for a first-time reader: what these skills are *for* comes
  before the install mechanics, and the family table carries an accurate one-line
  description of each skill.
- Registry descriptions rewritten to match what each skill does today, and pins
  refreshed (super-ux 0.23.0, task-pipeline 0.18.0, make-skill 0.6.0,
  sheleg-design 1.0.0, seo-aeo-audit 0.5.0).

### Fixed
- **The registry could advertise a version the submodule did not contain.** The
  validator compared `skills.json` to `.gitmodules` only, so a gitlink pointing
  at any commit of the right repo passed — and two pins were in fact wrong when
  this was written. It now reads the version out of each submodule's own
  `package.json` and fails on disagreement, with a CI self-test proving it.
- The README claimed task-pipeline runs **nine** gated stages while the table two
  sections above said ten — a contradiction left over from the tenth stage
  landing in task-pipeline 0.16.0.
- British spellings (`materialise`) in the README, launcher, validator and
  changelog; the repo standard is US spelling.

## v0.7.2 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.17.0. Scope now has a spine: the grill turns the request
  into an addressable **REQ list** where every row names how it is verified, the
  ids are traced through spec (`covers:`), plan (`Implements:`, gated on **set
  equality** against the brief), build and review, and a final **acceptance**
  stage accounts for every requirement with evidence before the run can close.
  An append-only carry-over ledger catches anything deferred, dropped or left
  half-done — deferred out loud is forgotten.
- Registry description updated to match.

## v0.7.1 — 2026-07-28

### Changed
- Pin `task-pipeline` 0.16.1 — the tenth stage landed in 0.16.0 while fifteen
  places, the npm description among them, still promised nine.

## v0.7.0 — 2026-07-28

### Changed
- Author link moved from `svlab.online` to **https://sshlg.me** across every
  README, every repo homepage and the GitHub organization profile.
- Family table refreshed: new pins (super-ux 0.21.0, task-pipeline 0.16.0,
  make-skill 0.5.1, sheleg-design 0.9.0, seo-aeo-audit 0.5.0) and descriptions
  that match what each skill now does — the screens layer, decomposition and
  the loop guard, Agent Skills conformance, per-pack token layers.

## v0.6.1 — 2026-07-28

### Changed
- Pin `make-skill` to 0.4.1 — its `validate` workflow had been red since v0.3.0
  because the negative self-test targeted a template renamed three releases
  earlier.

## v0.6.0 — 2026-07-28

### Changed
- README is English-only and leads with what the family gives you before the
  install mechanics; author and links block added.
- Registry pins refreshed to the descriptions-and-canon releases across all five
  skills.

## v0.5.5 — 2026-07-28

- **seo-aeo-audit bumped to v0.4.1** in the registry and the submodule pin: the
  bundled page auditor now refuses non-http(s) URL schemes and redirects (a
  crafted URL list could previously have made it read local files via `file://`),
  and the repo gained a `SECURITY.md` stating what runs, what it touches and how
  to verify it.
- README rewritten around the five-skill family, the install channels and the
  one-channel-per-agent rule; `npx sshlg-skills` short form is now the primary
  path since the launcher is published on npm.

## v0.5.4 — 2026-07-28

- **seo-aeo-audit bumped to v0.4.0** in the registry and the submodule pin (was
  0.3.1). That release ran ten per-track extraction passes over the full source
  corpus and one reconciliation pass over all 19 contracts: +1,725 lines, sixteen
  contradictions resolved by naming both studies and demoting contested
  directions, duplication removed with a single owner per fact, and the coverage
  gaps filled (hreflang and international duplication, fabricated information
  gain, licensing posture, rank-tracker vendor continuity, EU DMA exposure).
- Registry `desc` updated to match.

## v0.5.3 — 2026-07-28

- **seo-aeo-audit bumped to v0.3.1** in the registry and the submodule pin
  (was 0.2.0). Two releases landed: v0.3.0 added the ranking model, the on-page
  completeness sweep, the tooling/evidence ladder and the post-click track
  (conversion elements, call and offline attribution, paid × organic alignment);
  v0.3.1 ran a consistency pass over the whole flow — one evidence ladder, one
  stance on structured data, reconciled page-experience and keyword framing,
  tier discipline in every new contract — and rewrote the README around install,
  update, the audit flow, what knowledge ships inside and how fresh it is.
- Registry `desc` updated to match.

## v0.5.2 — 2026-07-28

- **seo-aeo-audit bumped to v0.2.0** in the registry and the submodule pin. That
  release adds a dated Google update timeline (every core, spam and Discover
  update from March 2025 to June 2026, plus the platform changes that retired old
  tactics), an update-response protocol wired into the audit flow, a refresh
  routine with named sources, and SEJ's *SEO Trends 2026* distilled into the
  existing contracts.
- Registry `desc` updated to match.

## v0.5.1 — 2026-07-28

- **seo-aeo-audit bumped to v0.1.0 → v0.1.1** in the registry and the submodule
  pin. That release fixes the make-skill gotcha the first cut tripped over — the
  deliverable skeletons lived only at the repo root, which the skills CLI does not
  ship, so non-Claude agents received a SKILL.md pointing at files they could not
  read — plus a broken cross-reference anchor, mixed British/American spelling
  across the contracts, and two auditor defects (navigation labels inflating the
  word count, robots directives matched as substrings).

## v0.5.0 — 2026-07-28

- **New family member: `seo-aeo-audit` v0.1.0** ([ssheleg/seo-aeo-audit](https://github.com/ssheleg/seo-aeo-audit)) —
  evidence-first website audit for search **and** answer engines that ends in a
  prioritized change plan. Ten tracks (access & indexation economics,
  canonicalization, architecture & link equity, intent & SERP fit, content value,
  extractability/AEO-GEO, entity & brand consensus, experience signals, risk &
  threats, measurement), an evidence-tier triage model
  (`priority = (impact × confidence) / effort`), an explicit myth guard, and a
  stdlib-only page auditor that measures the answer-engine read budget.
- Registered in `skills.json`, added as a submodule at `skills/seo-aeo-audit`,
  README family table and RU section updated.

## v0.4.1 — 2026-07-27

- **task-pipeline bumped to v0.12.0** in the registry and the submodule pin
  (was 0.10.0). That release makes the intake grill mandatory and **built in** —
  the `grill-me` / `grilling` dependency is gone, the doctrine is ported in-house
  with domain awareness (CONTEXT.md glossary challenges, ADR discipline) and an
  autonomy sweep that pre-resolves every stage-1→9 blocker — and replaces
  per-stage model tiering with one provider-agnostic model confirmed up front.
- Registry `desc` and the README family table updated to match.

## v0.4.0 — 2026-07-25

- **Enforce "one channel per agent" automatically.** The skills CLI auto-detects
  Claude Code and writes `~/.claude/skills/<id>` even when it is never named as a
  target, so every `install`/`update` silently recreated plain copies that shadow
  the Claude plugin. The launcher now prunes those copies after any skills-CLI
  step while the plugin channel is active (skipped under `--no-claude`, where the
  plain copies are the intended channel). Verified live: 7 shadows → 0.

## v0.3.1 — 2026-07-25

- Pin bump: sheleg-design **0.7.0** (style-agnostic build recipe, release
  workflow, RU README). Family now pinned at super-ux 0.19.0, task-pipeline
  0.10.0, make-skill 0.3.0, sheleg-design 0.7.0.

## v0.3.0 — 2026-07-25

Launcher hardening — four defects an adversarial audit proved by execution.

- **FIX: `update` silently moved the pins, even with `--claude-only`.** The
  submodule step ran before any flag branch and used `--remote --merge`, so a
  "Claude-only" run fast-forwarded a submodule to its upstream tip and left the
  superproject dirty — destroying the pinned-snapshot contract. It now runs only
  when not `--claude-only`, uses `--init --recursive` (materialize, don't move),
  and moves pins **only** behind the new explicit `--bump-pins`.
- **FIX: every `claude plugin` failure was swallowed.** Those `run()` results were
  discarded, so a completely failing `claude` still exited 0 (worst with
  `--claude-only`, where nothing else could set the flag). All four calls now feed
  the exit status — verified with a failing stub on PATH: exit 1.
- **FIX: the CI could not catch a bad `skillNames`.** Both workflows checked out
  `submodules: false`, and the cross-check was guarded by `if isdir(...)` — so it
  skipped silently and a bogus id passed green. Workflows now check out
  `submodules: recursive`, and the validator **fails loudly** when a submodule
  isn't materialized instead of skipping.
- **`skills update` now runs one call per skill id** so a single bad id can't fail
  the batch; contradictory `--claude-only --no-claude` and a valueless `--agent`
  now exit 2; `spawnSync` uses `shell` on Windows (npx/claude are `.cmd` shims);
  `list` falls back to versions recorded in `skills.json` when run from an npx
  tarball (it printed `v?` for everything, including the release smoke test).
- README's `update` section now matches the launcher (no `--agent`, adds
  `--bump-pins`).

## v0.2.1 — 2026-07-25

- Pins bumped to the review-pass releases: super-ux **0.19.0** (contracts now ship
  with every skill), task-pipeline **0.10.0** (brief template reachable on every
  channel, current super-ux chain), make-skill **0.3.0** (stopped shipping a
  placeholder skill; validator enforces the canon), sheleg-design 0.6.0.

## v0.2.0 — 2026-07-24

- **Fix: `update` never updated super-ux.** A repo can ship several skills under
  different ids — super-ux ships `ux-foundation`/`ux-flows`/`ux-scenarios`/
  `ux-audit` and there is no skill called `super-ux` — but the launcher passed the
  repo names to `skills update`, which matches INSTALLED SKILL ids. super-ux was
  silently skipped on every update. `skills.json` entries now carry `skillNames[]`
  (the ids actually shipped) and the launcher updates those; the validator
  enforces the field and cross-checks it against the skills each submodule ships,
  so the regression cannot come back.

## v0.1.3 — 2026-07-24

- **Tolerate stray non-flag arguments.** zsh does not treat `#` as a comment by
  default, so `... install # note` passed `#` into the launcher and it hard-failed
  with "unknown option: #". Now only `-`/`--`-prefixed unknowns error; bare stray
  tokens are ignored with a notice, so the intended command still runs.

## v0.1.2 — 2026-07-24

- Bumped submodule pins to the current release of each skill: super-ux 0.18.0,
  task-pipeline 0.9.0, **make-skill 0.2.0** (correct multi-agent + cross-platform
  distribution guidance), sheleg-design 0.6.0.

## v0.1.1 — 2026-07-24

- **Fix multi-agent install.** The vercel `skills` CLI does not split a
  comma/space-joined `--agent` value (it read `cursor,opencode,…` as one invalid
  agent). The launcher now passes one repeated `--agent <name>` flag per agent, so
  `install` reaches the whole default agent set (and `--all`/`--agent a,b`) in one
  `skills add` call per skill.

## v0.1.0 — 2026-07-24

Initial release — the ssheleg skill-family umbrella.

- **Submodules** (`skills/`): super-ux, task-pipeline, make-skill, sheleg-design
  (→ `ssheleg/sheleg-design-skill`), wired via `.gitmodules` (https urls, clonable
  without SSH).
- **Launcher/updater** `bin/sshlg-skills.js` (zero-dep): `install` / `update` /
  `list` / `agents`. A thin orchestrator over the vercel `skills` CLI (70+ agents),
  `claude plugin` (Claude Code), and `git submodule` (pinned snapshots). Non-Claude
  agents via the skills CLI; Claude Code via its plugin to avoid a shadow duplicate.
  Flags: `--agent`, `--all`, `--no-claude`, `--claude-only`.
- **`skills.json`** — source of truth (repos, plugin ids, default agent set).
- **Validator** (`test/validate.py`, stdlib): package/version, bin resolves, files
  whitelist, CHANGELOG version match, and `.gitmodules` ↔ `skills.json` ↔ on-disk
  submodule agreement. CI runs it plus a negative self-test and `node --check`.
- **Distribution:** `npx github:ssheleg/sshlg-skills` (no publish needed),
  `git clone --recursive` + `install.sh`, and (optional) npm `sshlg-skills`.
