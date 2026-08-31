#!/usr/bin/env node
'use strict';
/**
 * The public site, built from this repository's own single homes.
 *
 *   node scripts/site.js --out _site
 *
 * Nothing here is written by hand twice. Versions, descriptions and install
 * commands come from `skills.json`; the routing rules, their boundaries and
 * their refusal phrases come from `lib/routers-registry.js` — the same two files
 * the launcher and the operator's routing block are generated from. A page that
 * restated any of it would be a second home, and the second home is the one
 * that goes stale.
 *
 * The built site is NEVER committed. `.github/workflows/pages.yml` builds it on
 * every push to `main` after the gate is green, so a published page cannot
 * describe a tree that no longer exists. `test/site_test.js` is the half that
 * runs here: it builds into a temp directory and checks that every internal
 * link resolves, that every stated version is the pinned one, and that no page
 * claims a command this repository cannot run.
 *
 * No dependencies, no network, no build step. Node built-ins only.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));
const data = require(path.join(ROOT, 'skills.json'));
const registry = require(path.join(ROOT, 'lib', 'routers-registry.js'));
const og = require('./og-card.js');
const { capabilityBrief } = require(path.join(ROOT, 'lib', 'brief.js'));

/**
 * Where the site is served from — the one knob. Every canonical, every card URL and
 * every absolute path on the 404 page is derived from it, so moving hosts is this
 * line and nothing else.
 *
 * `BASE` is the path a root-relative link has to start with. A custom domain serves
 * the site at `/`; a project site on `github.io` serves it under `/<repo>/`. The 404
 * page is the only page that cannot use relative links — the browser may be at any
 * depth when it is served — and hardcoding `/sshlg-skills/` there is how a working
 * 404 becomes a 404 with dead links the day the domain changes.
 */
const SITE = 'https://skills.sshlg.me';
const BASE = new URL(`${SITE}/`).pathname;
const X_HANDLE = 'sshlg93';
const GH_OWNER = 'ssheleg';
const GH_REPO = 'sshlg-skills';
const AUTHOR = 'Sergey Sheleg';
// The ONE node id for the person behind the family. Two Person nodes on one page
// with no id linking them is not entity consensus — it is two candidate entities a
// consumer has to guess are the same, which is the exact defect this site shipped
// on 2026-08-26 and found in its own post-deploy check. Every other reference is
// `{'@id': PERSON_ID}` and describes nothing.
const PERSON_ID = 'https://skills.sshlg.me/#person';
const MANIFESTO = 'https://github.com/ssheleg/pod-manifesto';

// ---------------------------------------------------------------- text helpers

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * The inline subset the registry's own texts use: `code`, **strong**, *em* and
 * [label](url). Escaped FIRST, so a text that grows an angle bracket cannot
 * inject markup into a published page.
 */
function inline(md) {
  return esc(md)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, (_, c) => `<strong>${c}</strong>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, l, u) => `<a href="${u}">${l}</a>`);
}

/** Registry texts are paragraphs separated by a blank line. */
const paras = (md) => md.trim().split(/\n\s*\n/)
  .map((p) => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('\n');

/**
 * The opening of a description — what a card and a `<meta description>` want.
 *
 * Sentence-aware in both directions, and the FLOOR is the half that matters: one
 * member opens with a 53-character sentence, and a 53-character meta description
 * is the search result nobody clicks. Keep taking sentences until there is enough
 * to answer with, then stop at the first boundary past the cap.
 */
function firstSentence(text, cap = 185, floor = 95) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  if (flat.length <= floor) return flat;
  const bound = /(?<![A-Z])\.\s(?=[A-Z*`])/g;
  let out = '';
  let m;
  while ((m = bound.exec(flat)) !== null) {
    const next = flat.slice(0, m.index + 1);
    out = next;
    if (next.length >= floor) break;
  }
  if (!out) out = flat;
  if (out.length <= cap) return out;
  // A card that ends mid-phrase — "every distribution…", "with fallback and…" —
  // reads as a truncation bug rather than a summary. Prefer the last sentence
  // boundary inside the cap; a hard cut is the fallback, not the default.
  const window = out.slice(0, cap);
  const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '),
    window.lastIndexOf(' — '), window.lastIndexOf(': '));
  if (lastStop > floor) return window.slice(0, lastStop + 1).replace(/[;:—-]$/, '').trim();
  const hard = out.slice(0, cap - 1);
  const back = hard.lastIndexOf(' ');
  const cut = (back > cap * 0.6 ? hard.slice(0, back) : hard).replace(/[\s,;:—-]+$/, '');
  // ...and never end on a dangling conjunction or article: "with fallback and…"
  // is a worse summary than the same sentence one word shorter.
  return `${cut.replace(/\s+(?:and|or|with|the|a|an|of|in|to|for|from|plus|its|that)$/i, '')}…`;
}

/** The refusal phrase a router text declares, so the page can show it as a chip. */
/**
 * The phrase that declines a route, in English, for a page that is written in English.
 *
 * Every router declares the refusal twice — `"no scenarios" or «без сценариев»` — because
 * the phrase is a LITERAL the operator types, and both are honoured by the block. So the
 * card can show one without documenting something that does not work, which is the reason
 * the English alias was added before this function was allowed to drop the other.
 *
 * `/routing/` is deliberately NOT filtered the same way: its job is the block **verbatim**,
 * one of its rules is a sentence about which Russian word is already a trigger, and an
 * English-only rendering of that sentence would be a bigger untruth than the Cyrillic.
 */
function refusalOf(text) {
  const m = text.match(/Refusal phrase:\s*(.+?)\*\*/);
  if (!m) return null;
  const raw = m[1].trim();
  const english = [...raw.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
  if (english.length) return english.join(' or ');
  return raw.replace(/[«»"]/g, (c) => (c === '"' ? '' : c)).trim();
}

// ------------------------------------------------------------------- the model

/**
 * `{n}` in an extraLink label, resolved by counting files in the member's own tree.
 *
 * The label shipped as "Browse all 34 style packs" and the tree held 35 the day it
 * was published — a hand-written tally on the family's most-read page, which is the
 * dead-address class this repository gates everywhere else arriving through a field
 * nothing read. A count that cannot be resolved THROWS: a link advertising `{n}` or
 * `0` is worse than a build that stopped.
 */
/**
 * Where one entry point actually lives, RESOLVED in the checked-out tree.
 *
 * "Each name below is an entry point an agent can be routed to" was rendered as
 * twenty-eight pills — bordered, monospace, the shape the whole web uses for a tag you
 * can click — that did nothing. Every one of them has an address: a directory holding a
 * `SKILL.md` inside its member's repository.
 *
 * It is DISCOVERED rather than composed. Today all nine plugin directories happen to be
 * spelled like their member, so `plugins/<member>/skills/<name>` would produce the same
 * nine URLs and a fixture comparing the two cannot tell them apart — stated plainly
 * because a plant proving otherwise was written, run, and did not refuse. What the
 * discovery buys is not a spelling: it is that the path is READ from the tree, so the
 * `SKILL.md` beside it is what makes the link real, and a name with nothing behind it
 * fails the build instead of shipping as a pill that 404s. The two names are already
 * independent one level up — `sheleg-design` ships from the repository
 * `sheleg-design-skill` — so composing from either is a guess that happens to be right.
 */
function entryPath(member, name) {
  const plugins = path.join(ROOT, member.dir, 'plugins');
  let dirs = [];
  try {
    dirs = fs.readdirSync(plugins, { withFileTypes: true })
      .filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch (e) {
    throw new Error(`${member.name}: ${member.dir}/plugins is not readable (${e.code}) — the `
      + 'submodule is probably not checked out, and a page cannot link entry points it '
      + 'cannot find');
  }
  for (const plugin of dirs) {
    const rel = path.posix.join('plugins', plugin, 'skills', name);
    if (fs.existsSync(path.join(ROOT, member.dir, rel, 'SKILL.md'))) return rel;
  }
  throw new Error(`${member.name}: '${name}' is advertised in skills.json and no `
    + `plugins/*/skills/${name}/SKILL.md exists under ${member.dir} — the page would `
    + 'offer an address that resolves nowhere');
}

/**
 * What one shipped skill is FOR, in the words its own `SKILL.md` advertises.
 *
 * The pack pages listed the names of the skills in each pack and never said what any
 * of them does, so the page an engine reaches when asked "what is this pack for" was
 * mostly navigation — `/skills/seo-aeo-audit/` measured 173 words of prose against 318
 * words of link text on 2026-08-27. The answer was already written and already has a
 * single home: the front-matter `description` is the string the agent runtime itself
 * matches on, so a page that derives it cannot advertise a capability the skill does
 * not claim. `lib/brief.js` removes the trigger enumeration and says why.
 *
 * Empty is a build error, not an empty paragraph: a heading with nothing under it is
 * the same defect as the pill that linked nowhere.
 */
function skillBrief(member, name) {
  const file = path.join(ROOT, member.dir, entryPath(member, name), 'SKILL.md');
  const text = fs.readFileSync(file, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) {
    throw new Error(`${member.name}/${name}: SKILL.md has no front matter, so the page `
      + 'has no description to derive from');
  }
  const raw = readScalar(fm[1], 'description');
  const brief = capabilityBrief(raw);
  if (!brief) {
    throw new Error(`${member.name}/${name}: front matter declares no description — the `
      + 'page would render a heading with nothing under it');
  }
  return brief;
}

/**
 * One front-matter key, folded. YAML block scalars (`description: >-`) are how the
 * longer descriptions are written, and a reader that only takes the rest of the line
 * returns `>-` for seven of the nine packs — which is what a first pass at this did,
 * and it looked like the skills had no descriptions rather than like a broken parser.
 */
function readScalar(fm, key) {
  const lines = fm.split(/\r?\n/);
  const at = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (at === -1) return '';
  const head = lines[at].slice(key.length + 1).trim();
  if (!/^[>|][-+]?$/.test(head)) return head.replace(/^["']|["']$/g, '');
  const out = [];
  for (const line of lines.slice(at + 1)) {
    if (!line.trim()) { out.push(''); continue; }
    if (!/^\s/.test(line)) break;
    out.push(line.trim());
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

function resolveCount(member, link) {
  if (!String(link.label).includes('{n}')) return link.label;
  if (!link.countGlob) {
    throw new Error(`${member.name}: extraLink label uses {n} and names no countGlob`);
  }
  const glob = link.countGlob;
  const dir = path.join(ROOT, member.dir, path.dirname(glob));
  const pattern = path.basename(glob);
  if (!pattern.startsWith('*') || pattern.includes('/')) {
    throw new Error(`${member.name}: countGlob must end in *<ext>, got ${pattern}`);
  }
  const ext = pattern.slice(1);
  // `countExclude` names files the glob catches and a reader would not count. The style
  // pack directory holds STYLE_PACK_TEMPLATE.md beside the packs, so counting every .md
  // advertised 35 packs where 34 exist — a derived number can still be derived from one
  // file too many, and only reading the two published pages against each other showed it.
  const skip = new Set(link.countExclude || []);
  let n = 0;
  try {
    n = fs.readdirSync(dir).filter((f) => f.endsWith(ext) && !skip.has(f)).length;
  } catch (e) {
    throw new Error(`${member.name}: countGlob points at ${glob}, which is not readable `
      + `(${e.code}) — the submodule is probably not checked out, and a card that says {n} `
      + 'cannot be published from a tree that cannot be counted');
  }
  if (!n) throw new Error(`${member.name}: countGlob ${glob} matched nothing`);
  return String(link.label).replace('{n}', String(n));
}

/**
 * How big the gate is, READ from the ratchet marker in `docs/DOCMAP.md`.
 *
 * That marker is the single home: `test/run.js` re-derives all three figures from the
 * run it just did and fails when the stated one disagrees. This page restated them —
 * "38 suites, 667 fixtures" typed into the evidence panel against a marker that said
 * 671 — so the widest-read document this repository has was four fixtures behind its
 * own gate, in the one panel whose entire argument is that a claim carries its
 * receipt. A number is computed, not carried across.
 */
function gateRatchets() {
  const file = path.join(ROOT, 'docs', 'DOCMAP.md');
  const m = /<!--\s*ratchets:\s*([^>]*?)-->/.exec(fs.readFileSync(file, 'utf8'));
  if (!m) {
    throw new Error('docs/DOCMAP.md carries no `<!-- ratchets: ... -->` marker — the page '
      + 'cannot state the size of a gate it cannot read, and typing the figure in here is '
      + 'exactly how the last one went stale');
  }
  const out = {};
  for (const pair of m[1].trim().split(/\s+/)) {
    const [k, v] = pair.split('=');
    if (!/^\d+$/.test(v || '')) throw new Error(`ratchets marker: '${pair}' is not key=<number>`);
    out[k] = Number(v);
  }
  for (const k of ['suites', 'fixtures']) {
    if (!out[k]) throw new Error(`ratchets marker states no ${k}, which the page quotes`);
  }
  return out;
}
const GATE = gateRatchets();

const members = data.skills.map((s) => ({
  ...s,
  slug: s.name,
  routers: registry.order()
    .filter((r) => (registry.REGISTRY[r].requires || []).includes(s.name))
    .map((r) => ({ name: r, ...registry.REGISTRY[r] })),
  extraLinks: (s.extraLinks || []).map((l) => ({ ...l, label: resolveCount(s, l) })),
}));

const standingRules = registry.order()
  .filter((r) => (registry.REGISTRY[r].requires || []).length === 0)
  .map((r) => ({ name: r, ...registry.REGISTRY[r] }));

/**
 * Members whose committed social card still encodes the UNTRACKED fit metric —
 * B-105's gate. `fitScale` ignored `drawText`'s tracking from the day the card
 * shipped, so a long line could pick a scale that paints past the padding box
 * (the sheleg-dev eyebrow reached x=1199 of 1200). The metric is fixed, but a
 * member's card pixels are committed IN THE MEMBER'S OWN REPOSITORY and
 * `test/site_test.js` byte-compares them, so the corrected metric applies only
 * where it changes nothing — measured: every member except these three — and
 * these three keep the legacy fit until their own release recommits the card
 * (board row B-118). Remove a name here in the same change that repins the
 * member whose regenerated card lands; a stale entry fails the exactness
 * fixture in `test/site_test.js`, which asserts each listed member actually
 * still needs the gate.
 */
const LEGACY_FIT = new Set(['sheleg-design', 'sheleg-dev', 'agent-stack']);

/**
 * The `og.card` options for one member's social card — the single home for
 * them. `test/site_test.js` re-renders exactly these under both metrics to
 * prove every `LEGACY_FIT` entry is still needed; a second copy of the strings
 * in the test would measure a different card the day one of them changes.
 */
function memberCardSpec(m) {
  return {
    eyebrow: m.role,
    title: m.name,
    lines: [
      `${(m.skillNames || []).length} Agent Skills · one installable pack`,
      `npx skills add ${m.repo}`,
    ],
    footer: `${SITE.replace(/^https?:\/\//, '')}/skills/${m.slug}`,
    fitTracking: !LEGACY_FIT.has(m.name),
  };
}

const totalSkills = members.reduce((n, m) => n + (m.skillNames || []).length, 0);
const agentCount = 70;
/** Named agents, declared in `skills.json` rather than typed into a template — the
 *  page is a claim about where these skills run, and a hand-kept list is the first
 *  thing to go stale when the launcher's default set changes. */
const agents = data.agents || [];

/**
 * The questions this page is opened to answer, with answers that are ON the page.
 * Marked up as FAQPage — which is only legitimate because the text is visible;
 * schema over content a reader cannot see is the thing the audit skill refuses.
 */
const AGENT_FAQ = [
  {
    q: 'Do these skills work in my agent?',
    a: 'If it reads the <a href="https://agentskills.io/specification" rel="noopener" '
      + 'target="_blank">Agent Skills</a> standard, yes. Every pack is a '
      + '<code>SKILL.md</code> with its references beside it, and the table above names '
      + 'the path each agent actually reads.',
  },
  {
    q: 'Does DeepSeek Harness need a plugin for these?',
    a: 'No. <code>dsh</code> reads the Agent Skills standard directly and its skills '
      + 'subsystem is in the default profile — a plugin there is a Cordis module, and '
      + 'skills are loaded <em>by</em> one rather than being one.',
  },
  {
    q: 'Why did my skill not show up after installing?',
    a: 'Almost always a path question rather than an install one. A project-local copy '
      + 'outranks the installed one in every host that scans more than one root, and a '
      + 'plain copy beside a Claude Code plugin shadows the plugin and serves its frozen '
      + 'version. Keep one channel per skill.',
  },
  {
    q: 'Do I have to install all of them?',
    // A concrete repo rather than an angle-bracket placeholder. It is the better
    // answer, and it also keeps the node's decoded text comparable to the served
    // body — a check that reads the body escaped sees &lt;name&gt; where the node
    // correctly carries <name>, and reports the pair as drift.
    a: 'No — every pack installs standalone, as in '
      + '<code>npx skills add ssheleg/telegram-dev</code> for one of them. The launcher '
      + 'exists because a member updated on its own leaves the set in a combination '
      + 'nobody tested.',
  },
  {
    q: 'Do they send anything anywhere?',
    a: 'No. They are documentation, validators and small standard-library scripts — no '
      + 'services, no telemetry and no API keys, which is checkable in the repository '
      + 'rather than promised here.',
  },
];

// ----------------------------------------------------------------------- style

const CSS = `
/* ── SHELEG Design · Workbench token layer, copied verbatim from
   styles/tokens/workbench.css (dark twin). Components consume var(--…) only.
   This site is dark-committed, so the dark twin's values sit on :root. ── */
:root{
  --bg:#0f1218; --panel:#161b24; --panel-2:#1b212c;
  --ink:#e8ecf3; --muted:#8a93a6;
  --border:#232a36; --border-strong:#2c3441;
  --accent:#4b8bff; --accent-weak:#1b2740; --accent-ink:#0f1218;
  --ok:#3fb960; --ok-weak:#12281a;
  --warn:#d9a93f; --warn-weak:#2b2210;
  --danger:#e5534b; --danger-weak:#2d1517;
  --info:#4b8bff; --info-weak:#1b2740;
  --r-control:6px; --r-card:10px; --r-pill:999px;
  --motion-ease:cubic-bezier(.2,0,0,1); --dur-state:.18s; --dur-hover:.12s;
  --font-ui:-apple-system,"SF Pro","Segoe UI",Roboto,sans-serif;
  --font-data:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --t-chip:11px; --t-label:12px; --t-body:13px; --t-card:15px;
  --t-section:20px; --t-page:28px;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px;
  color-scheme:dark;

  /* AUTHORED HERE, not from the pack. Workbench is the core contract and
     declines ## Hero; its scale stops at --t-page 28px, which is an app page
     title and not a landing claim. These two are mine and are named so rather
     than filled in from the token layer with a citation attached. */
  --t-hero:clamp(34px,5vw,56px);
  --t-lede:clamp(15px,1.6vw,18px);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);
  font:400 var(--t-body)/1.6 var(--font-ui);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:3px}
code{font-family:var(--font-data);font-size:.92em;color:var(--ink)}
h1,h2,h3{margin:0;font-weight:600;letter-spacing:-.02em}
img,svg{max-width:100%;height:auto}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:var(--r-control)}

.wrap{max-width:1152px;margin:0 auto;padding:0 var(--space-6)}
.skip{position:absolute;left:-9999px}
.skip:focus{left:16px;top:12px;z-index:9;background:var(--panel);
  padding:var(--space-2) var(--space-4);border-radius:var(--r-control);
  border:1px solid var(--border-strong)}

/* ── nav */
.nav{border-bottom:1px solid var(--border);position:sticky;top:0;z-index:5;
  background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:saturate(140%) blur(10px)}
.nav .wrap{display:flex;align-items:center;gap:var(--space-5);height:56px}
.brand{display:flex;align-items:center;gap:var(--space-2);color:var(--ink);
  font-weight:600;letter-spacing:-.02em;white-space:nowrap}
.brand:hover{color:var(--ink);text-decoration:none}
.brand .mark{width:20px;height:20px;flex:0 0 20px}
.nav nav{display:flex;gap:var(--space-5);font-size:var(--t-body);
  margin-left:auto;align-items:center}
.nav nav a{color:var(--muted)}
.nav nav a:hover{color:var(--ink);text-decoration:none}
@media (max-width:760px){.nav nav a.opt{display:none}}

/* ── hero: two columns, because the right rail was empty at every width */
.hero{padding:var(--space-6) 0 var(--space-5)}
.hero-grid{display:grid;gap:var(--space-6);align-items:start;
  grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)}
@media (max-width:900px){.hero-grid{grid-template-columns:1fr}}
.eyebrow{color:var(--muted);font:400 var(--t-label)/1 var(--font-data);
  letter-spacing:.1em;text-transform:uppercase;margin:0 0 var(--space-5)}
.hero h1{font-size:var(--t-hero);line-height:1.06;max-width:16ch}
.hero .lede{color:var(--muted);font-size:var(--t-lede);line-height:1.6;
  max-width:56ch;margin:var(--space-5) 0 0}
.hero .lede b{color:var(--ink);font-weight:600}

/* ── SIGNATURE ELEMENT (authored — workbench declines it).
   The evidence panel: the commands that prove what the page claims, sitting
   opposite the claim. The page's whole argument is that a claim carries its
   receipt, so the receipt is the thing it is remembered by. */
.evidence{border:1px solid var(--border);border-radius:var(--r-card);
  background:var(--panel);overflow:hidden}
.evidence h2{font:500 var(--t-label)/1 var(--font-data);letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);
  padding:var(--space-4) var(--space-4);border-bottom:1px solid var(--border);margin:0}
.evidence ol{list-style:none;margin:0;padding:0;counter-reset:e}
.evidence li{padding:var(--space-4);border-bottom:1px solid var(--border)}
.evidence li:last-child{border-bottom:0}
.evidence .cmd{font-family:var(--font-data);font-size:var(--t-body);
  color:var(--ink);display:block;white-space:pre-wrap;overflow-wrap:anywhere;
  line-height:1.5}
.evidence .cmd::before{content:"$ ";color:var(--ok)}
.evidence .says{color:var(--muted);font-size:var(--t-chip);
  margin:var(--space-2) 0 0;display:block}

/* ── terminal */
.term{margin:var(--space-5) 0 0;border:1px solid var(--border);
  border-radius:var(--r-card);background:var(--panel);overflow:hidden;max-width:600px}
.term .bar{display:flex;align-items:center;gap:var(--space-2);
  padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border);
  color:var(--muted);font:400 var(--t-chip)/1 var(--font-data);
  letter-spacing:.08em;text-transform:uppercase}
.term .dot{width:8px;height:8px;border-radius:var(--r-pill);background:var(--border-strong)}
.term .body{display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4)}
.term pre{margin:0;font-family:var(--font-data);font-size:var(--t-body);
  color:var(--ink);flex:1 1 auto;white-space:pre-wrap;overflow-wrap:anywhere;
  line-height:1.5}
.term .pmt{color:var(--ok);user-select:none}
.copy{flex:0 0 auto;border:1px solid var(--border-strong);background:var(--panel-2);
  color:var(--muted);font:500 var(--t-chip)/1 var(--font-ui);
  padding:var(--space-2) var(--space-3);border-radius:var(--r-control);cursor:pointer;
  transition:color var(--dur-hover) var(--motion-ease),
             border-color var(--dur-hover) var(--motion-ease)}
.copy:hover{color:var(--ink);border-color:var(--muted)}
.copy[data-done="1"]{color:var(--ok);border-color:var(--ok)}

/* ── buttons */
.ctas{display:flex;flex-wrap:wrap;gap:var(--space-3);margin:var(--space-5) 0 0}
.btn{display:inline-flex;align-items:center;gap:var(--space-2);
  padding:10px var(--space-4);border-radius:var(--r-control);
  border:1px solid var(--border-strong);background:var(--panel);color:var(--ink);
  font:500 var(--t-body)/1 var(--font-ui);cursor:pointer;
  transition:background var(--dur-hover) var(--motion-ease),
             border-color var(--dur-hover) var(--motion-ease)}
.btn:hover{border-color:var(--muted);background:var(--panel-2);
  color:var(--ink);text-decoration:none}
.btn svg{width:16px;height:16px;flex:0 0 16px;fill:currentColor}
.btn--x{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.btn--x:hover{background:var(--accent);border-color:var(--accent);
  color:var(--accent-ink);filter:brightness(1.08)}
.btn--ghost{background:transparent}

/* ── sections */
.sec{padding:var(--space-6) 0 0}
.sec>h2{font-size:var(--t-section)}
.sec>.sub{color:var(--muted);max-width:68ch;margin:var(--space-3) 0 0}
.rule{border:0;border-top:1px solid var(--border);margin:var(--space-6) 0 0}

/* ── cards. Differentiated by STRUCTURE and a word, never by hue: the pack
   bans semantic colour used decoratively, and the role line used to be amber. */
.grid{display:grid;gap:var(--space-4);margin:var(--space-5) 0 0;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.card{border:1px solid var(--border);border-radius:var(--r-card);
  background:var(--panel);padding:var(--space-5);display:flex;flex-direction:column;
  color:inherit;transition:border-color var(--dur-hover) var(--motion-ease),
             background var(--dur-hover) var(--motion-ease)}
a.card:hover{border-color:var(--border-strong);background:var(--panel-2);text-decoration:none}
.card h3{font-size:var(--t-card);display:flex;align-items:baseline;
  gap:var(--space-2);flex-wrap:wrap}
.card h3 .v{color:var(--muted);font:400 var(--t-chip)/1 var(--font-data);letter-spacing:0}
.card .role{color:var(--muted);font-size:var(--t-chip);margin:var(--space-2) 0 0;
  font-family:var(--font-data)}
.card p{color:var(--muted);font-size:var(--t-body);margin:var(--space-3) 0 0}
.card .foot{margin-top:auto;padding-top:var(--space-3);
  border-top:1px solid var(--border);color:var(--muted);font-size:var(--t-chip);
  display:flex;justify-content:space-between;gap:var(--space-2);align-items:center}
.card .entry{font-family:var(--font-data);color:var(--accent)}

/* ── stats. --ok on the zero is STATE (healthy), which the pack allows;
   the others stay ink, because a number is not a status. */
.stats{display:grid;gap:var(--space-4);margin:var(--space-6) 0 0;
  grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.stat{border:1px solid var(--border);border-radius:var(--r-card);
  background:var(--panel-2);padding:var(--space-5)}
.stat b{display:block;font-size:var(--t-page);font-weight:600;letter-spacing:-.02em}
.stat.is-ok b{color:var(--ok)}
.stat span{color:var(--muted);font-size:var(--t-chip)}

/* ── tables */
.tw{overflow-x:auto;margin:var(--space-5) 0 0;border:1px solid var(--border);
  border-radius:var(--r-card);background:var(--panel)}
table{width:100%;border-collapse:collapse;font-size:var(--t-body)}
th,td{text-align:left;padding:var(--space-3) var(--space-4);
  border-bottom:1px solid var(--border);vertical-align:top}
tbody tr:last-child td{border-bottom:0}
th{color:var(--muted);font-weight:500;font-size:var(--t-chip);
  text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
td.nw{white-space:nowrap}

/* ── prose */
.prose p{color:var(--muted);max-width:68ch}
.prose p b,.prose p strong{color:var(--ink)}
.prose h3{font-size:var(--t-card);margin:var(--space-6) 0 0}
.prose ul{color:var(--muted);max-width:68ch;padding-left:20px}
.prose li{margin:var(--space-2) 0}

/* ── chips */
.chips{display:flex;flex-wrap:wrap;gap:var(--space-2);
  margin:var(--space-4) 0 0;padding:0;list-style:none}
.chip{border:1px solid var(--border-strong);border-radius:var(--r-pill);
  padding:var(--space-1) var(--space-3);font-size:var(--t-chip);
  color:var(--ink);background:var(--panel);font-family:var(--font-data)}
.chip--refuse{border-color:var(--warn);color:var(--warn);background:var(--warn-weak)}
/* A pill that DOES something has to be told apart from one that only labels. The
   colour stays ink so the row still reads as a set of names; the border and the
   hover carry the affordance, and the underline is the browser's own. */
.chip--link{padding:0}
.chip--link a{display:block;color:var(--ink);padding:var(--space-1) var(--space-3)}
.chip--link:hover{border-color:var(--accent);background:var(--accent-weak)}
.chip--link:hover a{color:var(--accent);text-decoration:none}

/* ── callout */
.note{border:1px solid var(--border);border-left:2px solid var(--accent);
  border-radius:0 var(--r-card) var(--r-card) 0;background:var(--panel);
  padding:var(--space-4) var(--space-5);margin:var(--space-5) 0 0;max-width:72ch}
.note p{margin:0;color:var(--muted)}
.note p+p{margin-top:var(--space-3)}

/* ── swatches: the design pack's page shows the tokens this site is built from */
.swatches{display:grid;gap:var(--space-3);margin:var(--space-5) 0 0;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
.sw{border:1px solid var(--border);border-radius:var(--r-card);
  background:var(--panel);overflow:hidden}
.sw i{display:block;height:52px;border-bottom:1px solid var(--border)}
.sw span{display:block;padding:var(--space-3);font-family:var(--font-data);
  font-size:var(--t-chip);color:var(--muted)}
.sw span b{display:block;color:var(--ink);font-weight:500}

/* ── footer */
footer{border-top:1px solid var(--border);margin-top:var(--space-6);
  padding:var(--space-6) 0 48px;color:var(--muted);font-size:var(--t-body)}
footer .wrap{display:flex;flex-wrap:wrap;gap:var(--space-4);justify-content:space-between}
footer a{color:var(--muted)}
footer a:hover{color:var(--ink)}
footer nav{display:flex;gap:var(--space-4);flex-wrap:wrap}

.crumb{color:var(--muted);font-size:var(--t-body);padding:var(--space-5) 0 0}
.crumb a{color:var(--muted)}

@media (max-width:640px){
  .wrap{padding:0 var(--space-4)}
  .hero{padding:var(--space-5) 0 var(--space-3)}
  .sec{padding:var(--space-5) 0 0}
}
@media (prefers-reduced-motion:reduce){
  *{transition-duration:0s!important}
}
`.trim();

const JS = `
(function(){
  "use strict";

  /* Copy a command without asking the reader to select it. */
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var text = b.getAttribute("data-copy");
    var done = function(){
      var was = b.textContent;
      b.textContent = "Copied";
      b.setAttribute("data-done","1");
      setTimeout(function(){ b.textContent = was; b.removeAttribute("data-done"); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function(){});
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly","");
    ta.style.position = "fixed"; ta.style.top = "-1000px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (err) {}
    document.body.removeChild(ta);
  });

  /* The X follow intent, in the popup X sizes it for.
     The anchor already carries the full intent URL, so with JS off, on a narrow
     screen, or if the popup is blocked, the click is a normal navigation and the
     follow dialog still opens. \`original_referer\` is added here because only
     the browser knows which page the reader clicked from. */
  document.addEventListener("click", function(e){
    var a = e.target.closest("[data-x-follow]");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (window.innerWidth < 600) return;          /* phones: let it navigate */

    var w = 550, h = 620;
    var dx = (window.screenX || window.screenLeft || 0);
    var dy = (window.screenY || window.screenTop || 0);
    var vw = window.outerWidth || document.documentElement.clientWidth;
    var vh = window.outerHeight || document.documentElement.clientHeight;
    var left = Math.max(0, Math.round(dx + (vw - w) / 2));
    var top  = Math.max(0, Math.round(dy + (vh - h) / 2));

    var url = a.href + (a.href.indexOf("?") === -1 ? "?" : "&")
            + "original_referer=" + encodeURIComponent(location.href);

    var win = window.open(url, "x-follow",
      "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top +
      ",resizable=yes,scrollbars=yes,status=yes,toolbar=no,menubar=no,location=no");

    if (win) { e.preventDefault(); try { win.focus(); } catch (err) {} }
  });
})();
`.trim();

// ------------------------------------------------------------------- fragments

const MARK = `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true">
<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"
 d="M12 2.6 21 7.4v9.2L12 21.4 3 16.6V7.4z"/>
<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"
 d="M12 8.1 16.6 10.6v5L12 18.1 7.4 15.6v-5z"/></svg>`;

const X_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

const GH_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.07-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.995 7.995 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;

const NPM_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 3.5h16v9H8.5v-7H6v7H0z"/></svg>`;

function xFollowBtn(cls = 'btn btn--x') {
  return `<a class="${cls}" data-x-follow rel="noopener noreferrer" target="_blank"
   href="https://x.com/intent/follow?screen_name=${X_HANDLE}"
   >${X_ICON}<span>Follow @${X_HANDLE} on X</span></a>`;
}

function ghBtn(href, label, cls = 'btn') {
  return `<a class="${cls}" href="${esc(href)}" rel="noopener" target="_blank"
   >${GH_ICON}<span>${esc(label)}</span></a>`;
}

function term(cmd, label = 'terminal') {
  return `<div class="term">
  <div class="bar"><span class="dot"></span>${esc(label)}</div>
  <div class="body"><span class="pmt">$</span><pre>${esc(cmd)}</pre>
  <button class="copy" type="button" data-copy="${esc(cmd)}">Copy</button></div>
</div>`;
}

// --------------------------------------------------------------------- layout

/**
 * @param {object} o
 * @param {string} o.rel   prefix to the site root from this page ('' or '../../')
 */
function layout(o) {
  const rel = o.rel;
  const canonical = `${SITE}${o.url}`;
  // Every page carries the publisher, not just the two templates that happened to.
  // Entity consensus is a property of the SITE; emitting it per-page in the layout
  // is the only way a new template cannot arrive without it.
  const publisher = {
    '@context': 'https://schema.org',
    '@id': PERSON_ID,
    '@type': 'Person',
    name: AUTHOR,
    url: `${SITE}/`,
    sameAs: [
      `https://x.com/${X_HANDLE}`,
      `https://github.com/${GH_OWNER}`,
      'https://www.npmjs.com/~ssheleg',
      'https://sshlg.me',
    ],
  };
  const jsonld = [publisher, ...(o.jsonld || [])].map(
    (b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${canonical}">
<meta name="author" content="${esc(AUTHOR)}">
${o.noindex ? '<meta name="robots" content="noindex">\n' : ''}
<meta name="theme-color" content="#0f1218">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="ssheleg skills">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image" content="${SITE}/og/${o.card}.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${og.WIDTH}">
<meta property="og:image:height" content="${og.HEIGHT}">
<meta property="og:image:alt" content="${esc(o.cardAlt || o.title)}">
<meta name="twitter:image" content="${SITE}/og/${o.card}.png">
<meta name="twitter:site" content="@${X_HANDLE}">
<meta name="twitter:creator" content="@${X_HANDLE}">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
  + '<rect width="24" height="24" rx="5" fill="#0f1218"/>'
  + '<path fill="none" stroke="#e8e9ec" stroke-width="1.7" stroke-linejoin="round"'
  + ' d="M12 3.6 20 7.9v8.2L12 20.4 4 16.1V7.9z"/></svg>')}">
<style>${CSS}</style>
${jsonld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav"><div class="wrap">
  <a class="brand" href="${rel || './'}">${MARK}<span>ssheleg skills</span></a>
  <nav>
    <a class="opt" href="${rel}#skills">Skills</a>
    <a class="opt" href="${rel}agents/">Agents</a>
    <a class="opt" href="${rel}routing/">Routing</a>
    <a class="opt" href="${rel}#install">Install</a>
    <a href="https://github.com/${GH_OWNER}/${GH_REPO}" rel="noopener" target="_blank">GitHub</a>
    <a data-x-follow rel="noopener noreferrer" target="_blank"
       href="https://x.com/intent/follow?screen_name=${X_HANDLE}">X</a>
  </nav>
</div></header>
<main id="main">
${o.body}
</main>
<footer><div class="wrap">
  <div>MIT · <a href="https://github.com/${GH_OWNER}/${GH_REPO}" rel="noopener"
    target="_blank">${GH_OWNER}/${GH_REPO}</a> v${esc(pkg.version)}
    · built by <a data-x-follow rel="noopener noreferrer" target="_blank"
    href="https://x.com/intent/follow?screen_name=${X_HANDLE}">@${X_HANDLE}</a></div>
  <nav>
    <a href="${rel}agents/">Agents</a>
    <a href="${rel}routing/">Routing</a>
    <a href="${rel}llms.txt">llms.txt</a>
    <a href="${MANIFESTO}" rel="noopener" target="_blank">Manifesto</a>
    <a href="https://www.npmjs.com/package/sshlg-skills" rel="noopener" target="_blank">npm</a>
  </nav>
</div></footer>
<script>${JS}</script>
</body>
</html>
`;
}

// ----------------------------------------------------------------- index page

function memberCard(m, rel) {
  const subs = (m.skillNames || []).length;
  return `<a class="card" href="${rel}skills/${m.slug}/">
  <h3>${esc(m.name)} <span class="v">v${esc(m.version)}</span></h3>
  <div class="role">${esc(m.role)}</div>
  <p>${esc(firstSentence(m.desc, 210))}</p>
  <div class="foot"><span>${subs} skill${subs === 1 ? '' : 's'}${
    (m.extraLinks || []).length ? ' · a catalogue of its own' : ''}</span>${
    m.routers && m.routers.length
      ? `<span class="entry">/${m.routers[0].name}</span>`
      : '<span>Read →</span>'}</div>
</a>`;
}

function indexPage() {
  const rel = '';
  const install = 'npx sshlg-skills install';
  const body = `
<section class="wrap hero">
  <div class="hero-grid">
    <div>
      <p class="eyebrow">${members.length} packs · ${totalSkills} Agent Skills · one command</p>
      <h1>Agent skills for the work around the code.</h1>
      <p class="lede">A coding agent writes code well and does almost everything
      around it badly. It builds an interface with no idea who uses it, calls a task
      done without checking what was asked, and ships a page no answer engine can
      read. These ${members.length} packs each take one of those gaps and give the
      agent <b>a contract it has to follow</b> — documentation, validators and small
      standard-library scripts. No services, no telemetry, no API keys.</p>
      ${term('npx sshlg-skills install', 'install the whole family')}
      <div class="ctas">
        ${xFollowBtn()}
        ${ghBtn(`https://github.com/${GH_OWNER}/${GH_REPO}`, 'Get it on GitHub')}
        <a class="btn btn--ghost" href="#skills">Browse the skills</a>
      </div>
    </div>

    <!-- The signature element. workbench declines ## Signature element, so this is
         authored: the page argues that a claim carries its receipt, so the receipt
         is what it is remembered by. Every command here is one a reader can run. -->
    <aside class="evidence">
      <h2>What proves it</h2>
      <ol>
        <li><code class="cmd">npx --yes sshlg-skills@latest list</code>
          <span class="says">every pack, its pinned version and where it came from</span></li>
        <li><code class="cmd">npx @deepseek-ai/dsh --profile web --dump-default-config | grep skill</code>
          <span class="says">the harness reads these without a plugin — its own default profile says so</span></li>
        <li><code class="cmd">ls ~/.agents/skills/telegram-bots/</code>
          <span class="says">SKILL.md, references and fixtures, where every agent looks</span></li>
        <li><code class="cmd">npm test</code>
          <span class="says">${GATE.suites} suites, ${GATE.fixtures} fixtures — the gate this repository ships with</span></li>
      </ol>
    </aside>
  </div>

  <div class="stats">
    <div class="stat"><b>${members.length}</b><span>skill packs, pinned and released together</span></div>
    <div class="stat"><b>${totalSkills}</b><span>entry points an agent can be routed to</span></div>
    <div class="stat"><b>${agentCount}+</b><span>agents, from Claude Code to DeepSeek Harness</span></div>
    <div class="stat is-ok"><b>0</b><span>runtime dependencies, services or keys</span></div>
  </div>
</section>

<hr class="rule">

<section class="wrap sec" id="skills">
  <h2>The family</h2>
  <p class="sub">Each pack owns one question. They compose: the router decides the
  route, and every route names the phrase that declines it.</p>
  <div class="grid">${members.map((m) => memberCard(m, rel)).join('\n')}</div>
</section>

<hr class="rule">

<section class="wrap sec" id="install">
  <h2>Install</h2>
  <p class="sub">One launcher installs every pack into every agent you have, and
  prunes the plain Claude Code copies that would shadow your plugins.</p>
  ${term(install, 'from npm — nothing to clone')}
  ${term('npx sshlg-skills update', 'installed but behind')}
  ${term('npx --yes sshlg-skills@latest list', 'what the current release of each member is')}
  <div class="note">
    <p><strong>Three commands are the whole interface.</strong> <code>install</code> when
    nothing is there, <code>update</code> when it is there and behind, <code>list</code>
    to see where each member stands.</p>
    <p><code>update</code> takes no member argument on purpose: a member updated on its
    own leaves the bundle in a combination nobody tested.</p>
  </div>
  <div class="prose">
    <h3>What it actually does</h3>
    <ul>
      <li><b>Claude Code</b> → each pack as a <b>plugin</b>, never as a plain
      <code>~/.claude/skills/</code> copy.</li>
      <li><b>Every other agent</b> → the vercel
      <a href="https://github.com/vercel-labs/skills" rel="noopener" target="_blank">skills</a>
      CLI, into <code>~/.agents/skills/</code>.</li>
      <li><b>DeepSeek Harness</b> (<code>dsh</code>) needs nothing further and
      <b>no plugin</b>: it reads the Agent Skills standard directly, scanning
      <code>&lt;agentsHome&gt;/skills</code> — the same
      <code>~/.agents/skills/</code> — at rank 500. A project-local
      <code>.dsh/skills</code> or <code>.agents/skills</code> outranks it, which
      is the same shadowing trap, with the same remedy: one channel per skill.</li>
      <li><b>Then it prunes</b> the plain Claude copies the skills CLI recreates on its
      own. That duplicate shadows your plugin and silently serves a stale skill — the one
      failure mode worth automating away.</li>
    </ul>
  </div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>Why a router, and not eleven more prompts</h2>
  <p class="sub">Installing a skill does not make an agent reach for it. The family
  writes a routing block into your agent's own instruction file: one table saying
  which pack answers what, and when. Every route also names the phrase that
  declines it, so the rule can be turned off in the sentence rather than in a file.</p>
  <div class="tw"><table>
    <thead><tr><th>Router</th><th>Answers</th><th>When</th></tr></thead>
    <tbody>${registry.order().map((r) => {
      const e = registry.REGISTRY[r];
      const m = members.find((x) => (e.requires || []).includes(x.name));
      // A standing rule ships in no pack, so this cell had no member page to point at
      // and rendered as bare text: ten links and two plain names in ONE column, where
      // a reader finishes the row and then clicks the name. Nothing was broken enough
      // to fail the link checker — the defect is an address that was never written.
      // Every rule has a home regardless: its own text, under its own id, on the
      // routing page. That is where the name goes when no pack owns it.
      const href = m ? `${rel}skills/${m.slug}/` : `${rel}routing/#${esc(r)}`;
      return `<tr><td class="nw"><a href="${href}">${esc(r)}</a></td>`
        + `<td>${esc(e.answers)}</td><td>${esc(e.when)}</td></tr>`;
    }).join('\n')}</tbody>
  </table></div>
  <p style="margin:20px 0 0"><a href="${rel}routing/">Read every routing rule and its boundary →</a></p>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>The manifesto this pack implements</h2>
  <p class="sub">These skills are the reference implementation of
  <a href="${MANIFESTO}" rel="noopener" target="_blank">Proof of Done: The Agentic
  Software Development Manifesto</a> by ${esc(AUTHOR)}. Its claim is that the unit of
  progress is not generated code but an <b>evidence-carrying change</b>: one that
  carries the intent it implements, the evidence that verifies it, the limits of that
  evidence, and the decision that accepts it. The manifesto lives in its own
  repository; this one is where it stops being an argument.</p>
  <div class="ctas">
    ${ghBtn(MANIFESTO, 'Read the manifesto', 'btn btn--ghost')}
    ${xFollowBtn()}
  </div>
</section>
`;
  return layout({
    rel,
    url: '/',
    card: 'index',
    cardAlt: `ssheleg skills — ${members.length} agent skill packs, one command, every agent`,
    title: 'ssheleg skills — agent skills for the work around the code',
    description: `${members.length} agent skill packs for Claude Code, Cursor, Codex and `
      + `${agentCount}+ more agents: UX scenarios, gated delivery, multi-agent leases, `
      + `skill authoring, design tokens, SEO/AEO audits, payment and agent-system `
      + `patterns. One command installs all of them.`,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ssheleg skills',
        url: `${SITE}/`,
        author: { '@id': PERSON_ID },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'The ssheleg skill family',
        author: { '@id': PERSON_ID },
        numberOfItems: members.length,
        itemListElement: members.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: m.name,
          url: `${SITE}/skills/${m.slug}/`,
        })),
      },
    ],
    body,
  });
}

// ---------------------------------------------------------------- member pages

function memberPage(m) {
  const rel = '../../';
  const subs = m.skillNames || [];
  const npmUrl = `https://www.npmjs.com/package/${m.npm}`;
  const repoUrl = `https://github.com/${m.repo}`;

  const routerBlocks = m.routers.map((r) => {
    const refusal = refusalOf(r.text);
    return `<div class="prose" style="margin-top:34px">
  <h3>/${esc(r.name)} — ${esc(r.answers)}</h3>
  <ul class="chips">
    <li class="chip">when: ${esc(r.when)}</li>
    ${refusal ? `<li class="chip chip--refuse">decline it: ${esc(refusal)}</li>` : ''}
  </ul>
  ${paras(r.text)}
</div>`;
  }).join('\n');

  const body = `
<div class="wrap crumb"><a href="${rel}">ssheleg skills</a> → <span>${esc(m.name)}</span></div>

<section class="wrap hero" style="padding-top:22px">
  <p class="eyebrow">${esc(m.role)}</p>
  <h1>${esc(m.name)}</h1>
  <p class="lede">${esc(m.desc)}</p>
  <div class="ctas">
    ${ghBtn(repoUrl, 'Repository')}
    <a class="btn btn--ghost" href="${esc(npmUrl)}" rel="noopener" target="_blank"
      >${NPM_ICON}<span>${esc(m.npm)}</span></a>
    ${xFollowBtn('btn btn--x')}
  </div>
  <div class="stats">
    <div class="stat"><b>v${esc(m.version)}</b><span>pinned in this release of the family</span></div>
    <div class="stat"><b>${subs.length}</b><span>skill${subs.length === 1 ? '' : 's'} in the pack</span></div>
    <div class="stat"><b>${m.routers.length || '—'}</b><span>routing rule${m.routers.length === 1 ? '' : 's'} it owns</span></div>
  </div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>What it ships</h2>
  <p class="sub">Each name below is an entry point an agent can be routed to.</p>
  <ul class="chips">${subs.map((s) => `<li class="chip chip--link"><a href="${
    esc(`https://github.com/${m.repo}/tree/main/${entryPath(m, s)}`)
  }" rel="noopener" target="_blank">${esc(s)}</a></li>`).join('')}</ul>
  <div class="prose" style="margin-top:22px">
    <p><b>Shape:</b> ${esc(m.shape)}. ${esc(m.shapeWhy || '')}</p>
  </div>
  <div class="prose" style="margin-top:26px">
    ${subs.map((s) => `<h3 id="${esc(s)}">${esc(s)}</h3>
    <p>${esc(skillBrief(m, s))}</p>`).join('\n    ')}
  </div>
  ${(m.extraLinks || []).map((l) => `<div class="note">
    <p><a href="${esc(l.url)}" rel="noopener" target="_blank"><strong>${esc(l.label)} →</strong></a></p>
    <p>${esc(l.note || '')}</p>
  </div>`).join('\n')}
</section>

${m.name === 'sheleg-design' ? `<hr class="rule">

<section class="wrap sec">
  <h2>This page is built from one of its packs</h2>
  <p class="sub">Not an illustration of the pack — the page you are reading consumes
  it. The site's token layer is <strong>workbench</strong>, the pack this skill ships
  for product UI, copied from its own <code>tokens/workbench.css</code> and consumed
  as <code>var(--…)</code> with no literal hex anywhere in the generator.</p>
  <div class="swatches">${[
    ['--bg', 'app ground'], ['--panel', 'cards, bars, dialogs'],
    ['--panel-2', 'inset, quiet stat tiles'], ['--border', '1px lines'],
    ['--accent', 'the one accent'], ['--ok', 'done, healthy'],
    ['--warn', 'needs a human'], ['--danger', 'failed'],
  ].map(([tok, role]) => `<div class="sw">
    <i style="background:var(${tok})"></i>
    <span><b>${tok}</b>${esc(role)}</span>
  </div>`).join('\n')}</div>
  <div class="note">
    <p><strong>Two decisions this page had to make out loud.</strong> workbench is the
    <em>core</em> contract: it declines <code>## Hero</code>,
    <code>## Components</code>, <code>## Responsive</code> and
    <code>## Signature element</code>, so those four are authored rather than
    inherited — and the pack requires saying so instead of filling them from the token
    layer with a citation attached.</p>
    <p>The pack whose register matched this site exactly was <strong>field-notes</strong>,
    for <em>open-source and developer tools sold on auditability</em>. It was refused on
    its own words: its palette section says the dawn gradient has no dark twin and
    <em>"do not ship the hero in dark"</em>. This site is dark, so the register lost to
    the constraint.</p>
  </div>
</section>` : ''}

<hr class="rule">

<section class="wrap sec">
  <h2>Install just this one</h2>
  <p class="sub">Every pack installs standalone. The whole family is
  <a href="${rel}#install">one command</a>.</p>
  ${term(`npx skills add ${m.repo}`, 'any agent the skills CLI supports')}
  ${term(`claude plugin marketplace add ${m.pluginMarketplace} && claude plugin install ${m.pluginInstall}`, 'claude code, as a plugin')}
</section>

${m.routers.length ? `<hr class="rule">

<section class="wrap sec">
  <h2>When the agent reaches for it</h2>
  <p class="sub">These are the rules the family writes into your agent's own
  instruction file — verbatim. Each one states the rule, the boundary in both
  directions, and the phrase that declines it.</p>
  ${routerBlocks}
</section>` : ''}

<hr class="rule">

<section class="wrap sec">
  <h2>The rest of the family</h2>
  <div class="grid">${members.filter((x) => x.name !== m.name)
    .map((x) => memberCard(x, rel)).join('\n')}</div>
</section>
`;

  return layout({
    rel,
    url: `/skills/${m.slug}/`,
    card: `skills-${m.slug}`,
    cardAlt: `${m.name} v${m.version} — ${m.role}`,
    ogType: 'article',
    title: `${m.name} — ${m.role} · ssheleg skills`,
    description: firstSentence(m.desc, 300),
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: m.name,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows',
        softwareVersion: m.version,
        description: firstSentence(m.desc, 300),
        url: `${SITE}/skills/${m.slug}/`,
        codeRepository: repoUrl,
        license: 'https://opensource.org/licenses/MIT',
        author: { '@id': PERSON_ID },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ssheleg skills', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: m.name, item: `${SITE}/skills/${m.slug}/` },
        ],
      },
    ],
    body,
  });
}

// --------------------------------------------------------------- routing page

function routingPage() {
  const rel = '../';
  const block = (r) => {
    const refusal = refusalOf(r.text);
    const m = members.find((x) => (r.requires || []).includes(x.name));
    return `<div class="prose" style="margin-top:38px">
  <h3 id="${esc(r.name)}">/${esc(r.name)} — ${esc(r.answers)}</h3>
  <ul class="chips">
    <li class="chip">when: ${esc(r.when)}</li>
    ${m ? `<li class="chip">ships in <a href="${rel}skills/${m.slug}/">${esc(m.name)}</a></li>`
       : '<li class="chip">a rule, not a skill — it holds whether or not anything is installed</li>'}
    ${refusal ? `<li class="chip chip--refuse">decline it: ${esc(refusal)}</li>` : ''}
  </ul>
  ${paras(r.text)}
</div>`;
  };

  const body = `
<div class="wrap crumb"><a href="${rel}">ssheleg skills</a> → <span>Routing</span></div>

<section class="wrap hero" style="padding-top:22px">
  <p class="eyebrow">${registry.order().length} rules · ${standingRules.length} of them hold with nothing installed</p>
  <h1>Which pack answers what, and when.</h1>
  <p class="lede">Installing a skill does not make an agent reach for it. The family
  writes this block into your agent's own instruction file, so the decision is made
  before the work starts rather than remembered afterwards. <b>Every rule names the
  boundary in both directions</b> — a router that swallows everything gets routed
  around within a week — and <b>every rule names the phrase that declines it</b>.</p>
  <div class="ctas">${xFollowBtn()}${ghBtn(`https://github.com/${GH_OWNER}/${GH_REPO}#routing--making-the-family-engage-by-default`, 'How the block is installed')}</div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>The table</h2>
  <div class="tw"><table>
    <thead><tr><th>Router</th><th>Answers</th><th>When</th><th>Ships in</th></tr></thead>
    <tbody>${registry.order().map((n) => {
      const e = registry.REGISTRY[n];
      const m = members.find((x) => (e.requires || []).includes(x.name));
      return `<tr><td class="nw"><a href="#${esc(n)}">${esc(n)}</a></td>`
        + `<td>${esc(e.answers)}</td><td>${esc(e.when)}</td>`
        + `<td class="nw">${m ? `<a href="${rel}skills/${m.slug}/">${esc(m.name)}</a>`
          : '<span style="color:var(--muted)">a standing rule</span>'}</td></tr>`;
    }).join('\n')}</tbody>
  </table></div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>Every rule, verbatim</h2>
  <p class="sub">This is the exact text the family writes into your instruction
  file — read from <code>lib/routers-registry.js</code>, which is the only place a
  router is declared.</p>
  ${registry.order().map((n) => block({ name: n, ...registry.REGISTRY[n] })).join('\n')}
</section>
`;
  return layout({
    rel,
    url: '/routing/',
    card: 'routing',
    cardAlt: `${registry.order().length} routing rules — which agent skill answers what, and when`,
    ogType: 'article',
    title: 'Routing — which agent skill answers what, and when · ssheleg skills',
    description: `The ${registry.order().length} routing rules the ssheleg skill family `
      + 'writes into your agent\'s instruction file: what each pack answers, when it '
      + 'applies, the boundary in both directions, and the phrase that declines it.',
    jsonld: [{
      // A BreadcrumbList is navigation, not content — it says where the page sits
      // and nothing about what it is or who stands behind it. This page carried
      // only that, so the publisher the layout emits had nothing to attach to.
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'The routing block',
      url: `${SITE}/routing/`,
      author: { '@id': PERSON_ID },
      isPartOf: { '@type': 'WebSite', name: 'ssheleg skills', url: `${SITE}/` },
    }, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ssheleg skills', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Routing', item: `${SITE}/routing/` },
      ],
    }],
    body,
  });
}

// ------------------------------------------------------------------- agents page

function agentsPage() {
  const rel = '../';
  const body = `
<div class="wrap crumb"><a href="${rel}">ssheleg skills</a> → <span>Agents</span></div>

<section class="wrap hero" style="padding-top:22px">
  <p class="eyebrow">${agents.length} named · ${agentCount}+ supported · one install</p>
  <h1>Where these skills run.</h1>
  <p class="lede">Every pack is an <a href="https://agentskills.io/specification"
  rel="noopener" target="_blank">Agent Skills</a> bundle — a <code>SKILL.md</code> with
  its references beside it — so <b>any agent that reads that standard reads these</b>.
  Two get a channel of their own; the rest share one directory.</p>
  <div class="ctas">${xFollowBtn()}${ghBtn(`https://github.com/${GH_OWNER}/${GH_REPO}`, 'Get it on GitHub')}</div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>The named agents</h2>
  <p class="sub"><b>Reads</b> is the path that agent actually looks in — the fact worth
  having when something does not show up.</p>
  <div class="tw"><table>
    <thead><tr><th>Agent</th><th>Channel</th><th>Reads</th><th>Worth knowing</th></tr></thead>
    <tbody>${agents.map((a) => `<tr><td class="nw"><strong>${esc(a.name)}</strong></td>`
      + `<td class="nw">${esc(a.channel)}</td>`
      + `<td class="nw"><code>${esc(a.reads)}</code></td>`
      + `<td>${a.note ? esc(a.note) : '<span style="color:var(--muted)">—</span>'}</td></tr>`).join('\n')}</tbody>
  </table></div>
  <div class="note">
    <p><strong>One channel per agent, always.</strong> A plain copy beside a plugin, or a
    project-local copy beside the installed one, wins — and then serves its frozen version
    forever. The launcher prunes the copies the skills CLI recreates; the project-local
    case is yours to avoid.</p>
  </div>
</section>

<hr class="rule">

<section class="wrap sec" id="dsh">
  <h2>DeepSeek Harness, specifically</h2>
  <p class="sub">Nothing to install beyond the ordinary command, and <b>no plugin to
  write</b> — in <code>dsh</code> a plugin is a Cordis module exporting
  <code>apply(ctx)</code>, and skills are loaded <em>by</em> one.</p>
  ${term('npx sshlg-skills install', 'and dsh already sees them')}
  <div class="prose" style="margin-top:26px">
    <p>Verified twice on 2026-08-25 rather than read off a page. The subsystem is in the
    <b>default</b> profile, not an add-on a reader has to enable:</p>
  </div>
  ${term('npx @deepseek-ai/dsh --profile web --dump-default-config | grep skill', 'dsh-skill · dsh-skill-filesystem · dsh-tool-skill')}
  <div class="prose" style="margin-top:22px">
    <p>and the files are where that provider looks:
    <code>~/.agents/skills/&lt;name&gt;/SKILL.md</code>, with its <code>references/</code>
    and <code>fixtures/</code> beside it.</p>
    <h3>Six roots, nearest wins</h3>
    <ul>
      <li><code>&lt;projectRoot&gt;/.dsh/skills</code> — rank 100</li>
      <li><code>&lt;projectRoot&gt;/.agents/skills</code> — rank 200</li>
      <li><code>customSkillDirs</code> — rank 300</li>
      <li><code>&lt;dshHome&gt;/skills</code> — rank 400</li>
      <li><b><code>&lt;agentsHome&gt;/skills</code> — rank 500</b>, which is <code>~/.agents/skills</code></li>
      <li>bundled — rank 600</li>
    </ul>
    <p><b>A project-local copy overrides the installed one</b> — the same shadowing trap
    Claude Code has, with the same remedy.</p>
    <p><code>disable-model-invocation</code> and <code>user-invocable</code> are the two
    front-matter keys it reads, both defaulting to <code>true</code>. This family ships
    neither, so every skill is model- and user-invocable there without a change.</p>
  </div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>Any other agent</h2>
  <p class="sub">The vercel <a href="https://github.com/vercel-labs/skills" rel="noopener"
  target="_blank">skills</a> CLI supports ${agentCount}+ of them and installs into the
  same hub directory. If yours reads <code>SKILL.md</code>, it reads these.</p>
  ${term('npx skills add ssheleg/sshlg-skills', 'any agent the skills CLI knows')}
</section>

<hr class="rule">

<section class="wrap sec" id="faq">
  <h2>Questions this page gets asked</h2>
  <div class="prose">${AGENT_FAQ.map((f) => `
    <h3>${esc(f.q)}</h3>
    <p>${f.a}</p>`).join('\n')}</div>
</section>

<hr class="rule">

<section class="wrap sec">
  <h2>The ${members.length} packs</h2>
  <p class="sub">Each one is an entry point an agent can be routed to.
  <a href="${rel}#skills">The full descriptions are on the front page</a>.</p>
  <ul class="chips">${members.map((m) => `<li class="chip"><a href="${rel}skills/${m.slug}/">${esc(m.name)}</a></li>`).join('')}</ul>
</section>
`;
  return layout({
    rel,
    url: '/agents/',
    card: 'agents',
    cardAlt: `Where the ssheleg skills run — ${agents.length} named agents including Claude Code and DeepSeek Harness`,
    ogType: 'article',
    title: 'Agents — where these skills run · Claude Code, DeepSeek Harness, Cursor and more',
    description: `The ${agents.length} agents the ssheleg skill family installs into by name — `
      + 'Claude Code as plugins, DeepSeek Harness reading the same hub directory, plus Cursor, '
      + `Codex, Gemini CLI, OpenCode, Windsurf, Zed and the rest of ${agentCount}+ through the `
      + 'skills CLI — with the path each one actually reads.',
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        author: { '@id': PERSON_ID },
        // Built from the same array the page renders, so the markup cannot drift
        // from the visible answer — which is the only thing that makes it honest.
        mainEntity: AGENT_FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            // Tags out AND entities back — the node has to carry the text a reader
            // sees. Leaving `&lt;name&gt;` encoded put one answer out of step with
            // its own page, which the audit's f8 check reports as schema drift.
            text: f.a
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ssheleg skills', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Agents', item: `${SITE}/agents/` },
        ],
      },
    ],
    body,
  });
}

// -------------------------------------------------------------------- 404 page

function notFoundPage() {
  const body = `
<section class="wrap hero">
  <p class="eyebrow">404</p>
  <h1>That page is not here.</h1>
  <p class="lede">It may have moved with a release. The ${members.length} packs and
  every routing rule are one click away.</p>
  <div class="ctas">
    <a class="btn" href="${BASE}">All ${members.length} packs</a>
    <a class="btn btn--ghost" href="${BASE}routing/">Routing</a>
    ${xFollowBtn()}
  </div>
</section>`;
  return layout({
    rel: BASE,
    url: '/404.html',
    // The one page that must never be indexed. GitHub Pages serves it with a real
    // 404 status, so this is belt-and-braces — but a host that serves the body with
    // 200 during a migration would otherwise put a page reading "That page is not
    // here" into the index under the site's own name.
    noindex: true,
    card: 'index',
    title: 'Not found · ssheleg skills',
    description: 'That page is not here — it may have moved with a release. '
      + `All ${members.length} skill packs of the ssheleg family, and every routing `
      + 'rule, are one click away.',
    body,
  });
}

// ------------------------------------------------------------- machine-readable

function sitemap() {
  const urls = ['/', '/agents/', '/routing/', ...members.map((m) => `/skills/${m.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc>`
  + `<changefreq>weekly</changefreq>`
  + `<priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
}

const robots = () => `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

/**
 * The answer-engine surface. One of these packs audits sites for exactly this,
 * so the site carries it: a plain-text map an LLM can quote without running JS.
 */
function llms() {
  return `# ssheleg skills

> ${members.length} agent skill packs that give a coding agent a contract for the
> work around the code: what the interface must do, how a change reaches the
> repository, who is holding a file, how a skill is built, how it looks, whether a
> machine will find it, what the integrations run on, and how an agent system is
> built and metered. Documentation, validators and small standard-library scripts.
> No services, no telemetry, no API keys. MIT. Author: ${AUTHOR} (@${X_HANDLE}).

Install: \`npx sshlg-skills install\`
Repository: https://github.com/${GH_OWNER}/${GH_REPO}
Site: ${SITE}/
Manifesto: ${MANIFESTO}

## Skills

${members.map((m) => `- [${m.name} v${m.version}](${SITE}/skills/${m.slug}/): `
  + `${m.role}. Ships ${(m.skillNames || []).join(', ')}. `
  + `Repository https://github.com/${m.repo}, npm ${m.npm}.`).join('\n')}

## Routing — which pack answers what, when

${registry.order().map((n) => {
  const e = registry.REGISTRY[n];
  const r = refusalOf(e.text);
  return `- ${n}: answers ${e.answers}; applies when ${e.when}`
    + `${r ? `; declined with ${r}` : ''}.`;
}).join('\n')}

Full text of every rule: ${SITE}/routing/

## Agents these skills run in

${agents.map((a) => `- ${a.name}: ${a.channel}, reads ${a.reads}`).join('\n')}

Any agent that reads the Agent Skills standard reads these; the vercel skills CLI
covers ${agentCount}+ of them. Detail: ${SITE}/agents/
`;
}

// ----------------------------------------------------------------------- write

function build(outDir) {
  const out = path.resolve(outDir);
  fs.rmSync(out, { recursive: true, force: true });
  const write = (rel, text) => {
    const p = path.join(out, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
    return rel;
  };

  const write2 = (rel, buf) => {
    const p = path.join(out, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, buf);
    return rel;
  };

  const written = [];
  written.push(write('index.html', indexPage()));
  written.push(write('routing/index.html', routingPage()));
  written.push(write('agents/index.html', agentsPage()));
  for (const m of members) written.push(write(`skills/${m.slug}/index.html`, memberPage(m)));
  written.push(write('404.html', notFoundPage()));

  // The social cards. One per page, generated from the same manifest the page is,
  // because a card is a claim about the page and a hand-made one goes stale first.
  // The umbrella's own three cards fit with the corrected, tracking-aware metric
  // (B-105); today that changes none of their bytes — every text picks the same
  // scale either way — and it means a future longer eyebrow shrinks instead of
  // painting into the frame. Member cards are gated through LEGACY_FIT below.
  written.push(write2('og/index.png', og.card({
    eyebrow: `${members.length} packs · ${totalSkills} Agent Skills · one command`,
    title: 'ssheleg skills',
    lines: ['agent skills for the work around the code',
      'no services, no telemetry, no api keys'],
    footer: SITE.replace(/^https?:\/\//, ''),
    fitTracking: true,
  })));
  written.push(write2('og/agents.png', og.card({
    eyebrow: `${agents.length} named agents · ${agentCount}+ supported`,
    title: 'where they run',
    lines: ['claude code, deepseek harness, cursor, codex and more',
      'any agent that reads the agent skills standard'],
    footer: `${SITE.replace(/^https?:\/\//, '')}/agents`,
    fitTracking: true,
  })));
  written.push(write2('og/routing.png', og.card({
    eyebrow: `${registry.order().length} rules · each names the phrase that declines it`,
    title: 'routing',
    lines: ['which pack answers what, and when'],
    footer: `${SITE.replace(/^https?:\/\//, '')}/routing`,
    fitTracking: true,
  })));
  for (const m of members) {
    written.push(write2(`og/skills-${m.slug}.png`, og.card(memberCardSpec(m))));
  }
  written.push(write('sitemap.xml', sitemap()));
  written.push(write('robots.txt', robots()));
  written.push(write('llms.txt', llms()));
  written.push(write('.nojekyll', ''));
  return { out, written };
}

if (require.main === module) {
  const i = process.argv.indexOf('--out');
  const dir = i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : '_site';
  const { out, written } = build(dir);
  const pages = written.filter((f) => f.endsWith('.html')).length;
  console.log(`OK: site built — ${pages} pages, ${written.length} files, `
    + `${members.length} members, ${registry.order().length} routers → ${path.relative(ROOT, out) || out}`);
}

module.exports = {
  build, SITE, BASE, X_HANDLE, GH_OWNER, GH_REPO, members, firstSentence, refusalOf,
  inline, esc, entryPath, skillBrief, capabilityBrief, LEGACY_FIT, memberCardSpec,
};
