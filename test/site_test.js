#!/usr/bin/env node
'use strict';
// Fixtures for scripts/site.js — the public site, built from this repository's own
// single homes.
//
// A published page is the widest-read document this repository has, and it is the
// one nobody re-reads. Four ways it could quietly stop being true, and one check
// each:
//
//   - it restates a VERSION that skills.json owns. The pin is the promise, so a
//     page advertising a version the manifest does not is the same defect as a
//     README table that drifted — one level further from anyone who would notice.
//   - it names an ADDRESS that does not resolve. This repository refuses a
//     document whose local paths are dead; a site whose own links 404 is that rule
//     with the enforcement removed.
//   - it CLAIMS a command the launcher cannot run. `npx sshlg-skills doctor` reads
//     exactly like the real ones and exits 2.
//   - it reaches OUT. A CDN or a tracker on a page whose whole selling point is
//     "no services, no telemetry" is the argument refuting itself.
//
// The site is built into a temp directory here and thrown away: a generated page in
// git drifts from the data it claims to render, and a page built from the tree
// cannot.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const site = require('../scripts/site.js');
const data = require('../skills.json');
const registry = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// -------------------------------------------------------------------- the build

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-site-'));
const built = site.build(OUT);
const read = (rel) => fs.readFileSync(path.join(OUT, rel), 'utf8');
const pages = built.written.filter((f) => f.endsWith('.html'));
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

process.on('exit', () => fs.rmSync(OUT, { recursive: true, force: true }));

// ------------------------------------------------------------------- structure

it('every member in skills.json has a page, and no page has no member', () => {
  const expected = data.skills.map((s) => `skills/${s.name}/index.html`).sort();
  const actual = pages.filter((p) => p.startsWith('skills/')).sort();
  assert.deepStrictEqual(actual, expected,
    'a member without a page is a member the site does not sell');
});

it('every page has a card of its own, and no card belongs to no page', () => {
  const cards = built.written.filter((f) => f.startsWith('og/'));
  const expected = ['og/index.png', 'og/routing.png', 'og/agents.png',
    ...data.skills.map((m) => `og/skills-${m.name}.png`)].sort();
  assert.deepStrictEqual(cards.sort(), expected,
    'a member without a card shares as a blank box');
  const declared = new Set();
  for (const page of pages) {
    const m = read(page).match(/property="og:image" content="([^"]+)"/);
    if (m) declared.add(m[1].replace(`${site.SITE}/`, ''));
  }
  for (const c of cards) {
    assert.ok(declared.has(c), `${c} is built and no page declares it`);
  }
});

it('the entry points a reader is handed all exist', () => {
  for (const rel of ['index.html', 'routing/index.html', 'agents/index.html', '404.html',
    'sitemap.xml', 'robots.txt', 'llms.txt', '.nojekyll']) {
    assert.ok(built.written.includes(rel), `${rel} was not built`);
  }
});

it('.nojekyll is present, or GitHub Pages drops nothing visible and everything subtle', () => {
  assert.ok(fs.existsSync(path.join(OUT, '.nojekyll')));
});

// --------------------------------------------------------------- the pin is the promise

it('every stated version is the one skills.json pins', () => {
  for (const m of data.skills) {
    const html = read(`skills/${m.name}/index.html`);
    assert.ok(html.includes(`v${m.version}`),
      `${m.name}'s page does not state v${m.version}`);
    const others = data.skills.filter((x) => x.version !== m.version)
      .map((x) => x.version);
    for (const v of others) {
      // Another member's version may legitimately appear in the family grid, so
      // only the hero stat is checked: it is the number a reader acts on.
      const hero = html.slice(0, html.indexOf('The rest of the family'));
      const stat = hero.match(/<b>v([\d.]+)<\/b>/);
      assert.ok(stat && stat[1] === m.version,
        `${m.name}'s hero states v${stat && stat[1]}, the manifest pins ${m.version}`);
      void v;
      break;
    }
  }
});

it('the index card for each member states that member version', () => {
  const html = read('index.html');
  for (const m of data.skills) {
    assert.ok(html.includes(`>${m.name} <span class="v">v${m.version}</span>`),
      `the index card for ${m.name} does not carry v${m.version}`);
  }
});

// --------------------------------------------------------- every address resolves

function localLinks(html) {
  const out = [];
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = unesc(m[1]);
    if (/^(https?:|mailto:|data:|#|javascript:)/i.test(raw)) continue;
    out.push(raw.split('#')[0]);
  }
  return out.filter(Boolean);
}

it('every internal link resolves inside the built site', () => {
  const dead = [];
  for (const page of pages) {
    if (page === '404.html') continue;     // its links are absolute, checked below
    const dir = path.dirname(page);
    for (const href of localLinks(read(page))) {
      const target = path.normalize(path.join(dir, href));
      const candidates = [target, path.join(target, 'index.html')];
      if (!candidates.some((c) => fs.existsSync(path.join(OUT, c)))) {
        dead.push(`${page} → ${href}`);
      }
    }
  }
  assert.deepStrictEqual(dead, [], `dead internal links: ${dead.join(', ')}`);
});

it('the 404 page links from the base path the site is actually served at', () => {
  // Derived from SITE, not written down: on a custom domain the base is `/`, on a
  // github.io project site it is `/<repo>/`, and a hardcoded one is a dead link the
  // day the host changes. This is the page a reader reaches BY being lost.
  assert.strictEqual(site.BASE, new URL(`${site.SITE}/`).pathname);
  const html = read('404.html');
  const links = localLinks(html);
  assert.ok(links.length >= 2, '404.html offers no way out');
  for (const href of links) {
    assert.ok(href.startsWith(site.BASE),
      `404.html → ${href} does not start at ${site.BASE}, so it resolves nowhere`);
  }
});

it('sitemap.xml lists every page and nothing that was not built', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 2 + data.skills.length, `sitemap lists only ${locs.length}`);
  for (const loc of locs) {
    assert.ok(loc.startsWith(site.SITE), `${loc} is not under ${site.SITE}`);
    const rel = loc.slice(site.SITE.length).replace(/^\//, '');
    const target = rel === '' ? 'index.html' : path.join(rel, 'index.html');
    assert.ok(fs.existsSync(path.join(OUT, target)), `${loc} is in the sitemap and not built`);
  }
  assert.ok(!locs.some((l) => l.endsWith('/404.html')), 'a 404 page in the sitemap asks to be indexed');
});

it('robots.txt points at the sitemap that exists', () => {
  assert.ok(read('robots.txt').includes(`${site.SITE}/sitemap.xml`));
});

// ------------------------------------------------ it may name a command, not claim one

const CLI_COMMANDS = new Set(['help', 'list', 'ls', 'agents', 'config', 'hooks',
  'injectors', 'conflicts', 'install', 'i', 'update', 'up', 'routers']);

it('every launcher command the site hands a reader is one the CLI implements', () => {
  const bad = [];
  for (const page of pages) {
    const html = read(page);
    for (const m of html.matchAll(/data-copy="([^"]*)"/g)) {
      const cmd = unesc(m[1]);
      const sub = cmd.match(/\bsshlg-skills(?:@[\w.-]+)?\s+([a-z-]+)/);
      if (sub && !CLI_COMMANDS.has(sub[1])) bad.push(`${page}: ${cmd}`);
    }
  }
  assert.deepStrictEqual(bad, [],
    `the site claims a launcher command bin/sshlg-skills.js does not dispatch: ${bad.join(' | ')}`);
});

it('the per-member install commands are the identifiers the manifest carries', () => {
  for (const m of data.skills) {
    const html = read(`skills/${m.name}/index.html`);
    assert.ok(html.includes(`npx skills add ${m.repo}`), `${m.name}: wrong skills-CLI command`);
    assert.ok(html.includes(`claude plugin install ${m.pluginInstall}`),
      `${m.name}: wrong plugin id — the marketplace and the plugin name differ for some members`);
  }
});

it('every copyable command is also visible as text, not only in the button', () => {
  for (const page of pages) {
    const html = read(page);
    for (const m of html.matchAll(/data-copy="([^"]*)"/g)) {
      assert.ok(html.includes(`<pre>${m[1]}</pre>`),
        `${page}: a command exists only inside a Copy button, so JS-off readers cannot see it`);
    }
  }
});

// ------------------------------------------------------------------ the X button

it('every follow control is a real X intent URL for the configured handle', () => {
  let found = 0;
  for (const page of pages) {
    for (const m of read(page).matchAll(/<a[^>]*\bdata-x-follow\b[^>]*>/g)) {
      const tag = m[0];
      const href = (tag.match(/href="([^"]+)"/) || [])[1];
      assert.ok(href, `${page}: a follow control with no href cannot work with JS off`);
      assert.strictEqual(unesc(href),
        `https://x.com/intent/follow?screen_name=${site.X_HANDLE}`,
        `${page}: follow href is not the intent URL for @${site.X_HANDLE}`);
      assert.ok(/rel="noopener noreferrer"/.test(tag), `${page}: follow link without rel=noopener`);
      assert.ok(/target="_blank"/.test(tag), `${page}: follow link without target=_blank`);
      found += 1;
    }
  }
  assert.ok(found >= pages.length, `only ${found} follow controls across ${pages.length} pages`);
});

it('the popup is an enhancement: the anchor still navigates when it is blocked', () => {
  const js = read('index.html');
  assert.ok(js.includes('if (win) { e.preventDefault();'),
    'preventDefault must be conditional on the popup having opened');
  assert.ok(js.includes('window.innerWidth < 600'),
    'a 550px popup on a phone is a broken page — narrow screens must navigate');
  assert.ok(js.includes('original_referer='),
    'the intent URL should carry original_referer, which only the browser knows');
});

// --------------------------------------------------------------- no reaching out

it('nothing is loaded from another host', () => {
  const bad = [];
  for (const page of pages) {
    const html = read(page);
    for (const m of html.matchAll(/<(script|link|img|iframe|source)\b[^>]*>/g)) {
      const tag = m[0];
      const url = (tag.match(/\b(?:src|href)="([^"]+)"/) || [])[1] || '';
      if (/^https?:/i.test(url) && !/rel="canonical"/.test(tag)) bad.push(`${page}: ${tag}`);
    }
  }
  assert.deepStrictEqual(bad, [], `the site fetches from another host: ${bad.join(' | ')}`);
});

it('the CSS and the JS are inline, so the page renders in one request', () => {
  const html = read('index.html');
  assert.ok(/<style>[\s\S]*--bg:/.test(html), 'no inline stylesheet');
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html), 'an external stylesheet');
  assert.ok(/<script>\(function\(\)/.test(html), 'no inline script');
});

// -------------------------------------------------------- the machine reader too

it('every page carries a title, a description, a canonical and exactly one h1', () => {
  for (const page of pages) {
    const html = read(page);
    assert.ok(/<title>[^<]{15,}<\/title>/.test(html), `${page}: no usable title`);
    assert.ok(/<meta name="description" content="[^"]{60,}"/.test(html),
      `${page}: description missing or too short to be an answer`);
    assert.ok(/<link rel="canonical" href="https:\/\//.test(html), `${page}: no canonical`);
    assert.strictEqual((html.match(/<h1[ >]/g) || []).length, 1,
      `${page}: a page answering one question has one h1`);
    assert.ok(/<meta property="og:title"/.test(html), `${page}: no og:title`);
    // A card type may not promise an image the page does not carry: X renders the
    // large card as an empty box, which is worse than the small one. So the claim
    // is checked against a FILE, not against another tag.
    const card = (html.match(/name="twitter:card" content="([^"]+)"/) || [])[1];
    if (card === 'summary_large_image') {
      const src = (html.match(/property="og:image" content="([^"]+)"/) || [])[1];
      assert.ok(src, `${page}: claims the large card and declares no og:image`);
      const rel = src.replace(`${site.SITE}/`, '');
      const file = path.join(OUT, rel);
      assert.ok(fs.existsSync(file), `${page}: og:image ${rel} was not built`);
      const bytes = fs.readFileSync(file);
      assert.deepStrictEqual([...bytes.slice(1, 4)], [0x50, 0x4e, 0x47],
        `${rel} is not a PNG`);
      assert.strictEqual(bytes.readUInt32BE(16), 1200, `${rel}: not 1200 wide`);
      assert.strictEqual(bytes.readUInt32BE(20), 630, `${rel}: not 630 tall`);
      const w = (html.match(/property="og:image:width" content="(\d+)"/) || [])[1];
      assert.strictEqual(Number(w), 1200, `${page}: og:image:width is not the real width`);
      assert.ok(/property="og:image:alt" content="[^"]{10,}"/.test(html),
        `${page}: an image with no alt is an image a screen reader cannot report`);
    }
  }
});

it('every canonical is the URL the page is actually served at', () => {
  for (const page of pages) {
    const href = read(page).match(/<link rel="canonical" href="([^"]+)"/)[1];
    const expect = page === 'index.html' ? `${site.SITE}/`
      : page === '404.html' ? `${site.SITE}/404.html`
        : `${site.SITE}/${path.dirname(page)}/`;
    assert.strictEqual(href, expect, `${page}: canonical points elsewhere`);
  }
});

it('the JSON-LD parses, and names the version the manifest pins', () => {
  for (const m of data.skills) {
    const html = read(`skills/${m.name}/index.html`);
    const blocks = [...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
    const app = blocks.find((b) => b['@type'] === 'SoftwareApplication');
    assert.ok(app, `${m.name}: no SoftwareApplication block`);
    assert.strictEqual(app.softwareVersion, m.version);
    assert.strictEqual(app.url, `${site.SITE}/skills/${m.name}/`);
  }
});

it('llms.txt names every member and every router', () => {
  const txt = read('llms.txt');
  for (const m of data.skills) {
    assert.ok(txt.includes(m.name), `llms.txt omits ${m.name}`);
    assert.ok(txt.includes(`v${m.version}`), `llms.txt omits ${m.name}'s version`);
  }
  for (const r of registry.order()) {
    assert.ok(txt.includes(`- ${r}:`), `llms.txt omits the router ${r}`);
  }
});

// ------------------------------------------------------------------ the routing

it('the routing page carries every rule, and every refusal phrase the registry declares', () => {
  const html = read('routing/index.html');
  for (const name of registry.order()) {
    assert.ok(html.includes(`id="${name}"`), `routing page has no section for ${name}`);
    const refusal = site.refusalOf(registry.REGISTRY[name].text);
    if (refusal) {
      assert.ok(html.includes(refusal),
        `routing page states ${name} and not the phrase that declines it`);
    }
  }
});

it('a router whose member is installed links to that member page', () => {
  const html = read('routing/index.html');
  for (const name of registry.order()) {
    const req = registry.REGISTRY[name].requires || [];
    if (!req.length) continue;
    assert.ok(html.includes(`href="../skills/${req[0]}/"`),
      `the ${name} rule does not link to ${req[0]}`);
  }
});

it('a member page reproduces its own routing text verbatim', () => {
  const withRouter = data.skills.filter((m) => registry.order()
    .some((r) => (registry.REGISTRY[r].requires || []).includes(m.name)));
  assert.ok(withRouter.length >= 6, 'the fixture found almost no routed members');
  for (const m of withRouter) {
    const html = read(`skills/${m.name}/index.html`);
    const own = registry.order()
      .filter((r) => (registry.REGISTRY[r].requires || []).includes(m.name));
    for (const r of own) {
      assert.ok(html.includes(`/${r} — ${registry.REGISTRY[r].answers}`),
        `${m.name}'s page does not carry the ${r} rule`);
    }
  }
});

// ------------------------------------------------------ a count is derived, not typed

it('an advertised count on the page is the number of files in the tree', () => {
  for (const m of data.skills) {
    for (const link of m.extraLinks || []) {
      assert.ok(link.countGlob || !/\d/.test(link.label),
        `${m.name}: an extraLink label carries a number and no countGlob`);
      if (!link.countGlob) continue;
      const dir = path.join(__dirname, '..', m.dir, path.dirname(link.countGlob));
      const ext = path.basename(link.countGlob).slice(1);
      // `countExclude` names files that match the glob and are not one of the things
      // being counted — `STYLE_PACK_TEMPLATE.md` is the shape a pack is written in,
      // not a pack. Counted here the same way the generator counts, or this fixture
      // measures a different number and calls the generator wrong.
      const skip = new Set(link.countExclude || []);
      const real = fs.readdirSync(dir)
        .filter((f) => f.endsWith(ext) && !skip.has(f)).length;
      const html = read(`skills/${m.name}/index.html`);
      const [head, tail] = link.label.split('{n}');
      const q = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const shown = html.match(new RegExp(`${q(head)}(\\d+)${q(tail)}`));
      assert.ok(shown, `${m.name}: the extraLink label is not on the page`);
      assert.strictEqual(Number(shown[1]), real,
        `${m.name}: the page advertises ${shown[1]} and the tree holds ${real}`);
    }
  }
});

// --------------------------------------------------------------------- escaping

it('markup in the data cannot reach the page as markup', () => {
  const hostile = 'x <img src=q onerror="alert(1)"> **b** `c` [l](javascript:alert(2))';
  const out = site.inline(hostile);
  assert.ok(!out.includes('<img'), 'a tag in the data survived into the page');
  assert.ok(out.includes('&lt;img'), 'the tag was not escaped');
  assert.ok(out.includes('<strong>b</strong>'), 'markdown is still interpreted after escaping');
  assert.ok(out.includes('<code>c</code>'), 'code spans are still interpreted');
  for (const page of pages) {
    assert.ok(!/onerror=/.test(read(page)), `${page}: an event handler attribute reached the page`);
  }
});

it('a short opening sentence is still a usable meta description', () => {
  const short = 'Production patterns for agent systems, in four skills. The orchestrator '
    + 'survives its own context pressure. A third sentence nobody needs.';
  const out = site.firstSentence(short, 300);
  assert.ok(out.length >= 95, `a ${out.length}-character description is a result nobody clicks`);
  assert.ok(out.startsWith('Production patterns'), 'the opening was dropped rather than extended');
});

it('the router texts are rendered with tags escaped and markdown interpreted', () => {
  const html = read('routing/index.html');
  assert.ok(html.includes('<strong>Refusal phrase:'), 'bold is interpreted');
  assert.ok(html.includes('<code>docs/ux/scenarios.md</code>'), 'code spans are interpreted');
  assert.ok(!/<p>\*\*/.test(html), 'raw asterisks reached the page');
});

// ---------------------------------------------------------------- accessibility

it('the page is navigable without a mouse and without JS', () => {
  const html = read('index.html');
  assert.ok(html.includes('class="skip" href="#main"'), 'no skip link');
  assert.ok(html.includes('id="main"'), 'the skip link has no target');
  assert.ok(html.includes('prefers-reduced-motion'), 'motion is not conditional');
  assert.ok(/<html lang="en">/.test(html), 'no document language');
  for (const m of html.matchAll(/<svg[^>]*>/g)) {
    assert.ok(/aria-hidden="true"/.test(m[0]), 'a decorative svg is announced to a screen reader');
  }
});

// ---------------------------------------------------------------- entity consensus

// Every page emits structured data and nothing here ever read it, which is how a
// page shipped on 2026-08-26 carrying TWO Person nodes — one full, one with a lone
// sameAs — with no id linking them. That is not one entity stated twice; it is two
// candidates a consumer must guess are the same, on the exact axis that day's audit
// was about. Found by curling the deploy, not by reading the diff.
const ldNodes = (html) => [...html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

it('every page emits parseable JSON-LD carrying the publisher', () => {
  for (const rel of built.written.filter((r) => r.endsWith('.html'))) {
    const nodes = ldNodes(read(rel));
    assert.ok(nodes.length > 0, `${rel} emits no structured data`);
    assert.ok(nodes.some((n) => n['@type'] === 'Person' && n['@id']),
      `${rel} carries no identified publisher`);
  }
});

it('one node describes the person; every other reference is by @id alone', () => {
  // Collect BOTH shapes, or half this check is unreachable: a reference is
  // `{'@id': …}` with no `@type`, so a walker keyed on `@type === 'Person'` never
  // sees one and the id-match assertion below is dead code. Shipped that way in
  // v1.3.1 — the live page reported `refs=0` on every template, which was the
  // walker, not the page.
  const AUTHORSHIP = ['author', 'publisher', 'creator', 'maintainer'];
  const collect = (n, out = []) => {
    if (Array.isArray(n)) { n.forEach((x) => collect(x, out)); return out; }
    if (!n || typeof n !== 'object') return out;
    if (n['@type'] === 'Person' && !out.includes(n)) out.push(n);
    for (const [k, v] of Object.entries(n)) {
      if (AUTHORSHIP.includes(k) && v && typeof v === 'object' && !Array.isArray(v)
          && !out.includes(v)) out.push(v);
      collect(v, out);
    }
    return out;
  };
  let exempt = 0;
  for (const rel of built.written.filter((r) => r.endsWith('.html'))) {
    let refsSeen = 0;
    const html = read(rel);
    // A page nobody may index owes nobody an entity. Keyed on the DECLARED signal,
    // never on the filename — an exemption spelled `rel !== '404.html'` is a rule
    // with a hole named after one file, and the next such page arrives unexamined.
    if (/<meta name="robots" content="noindex">/.test(html)) { exempt += 1; continue; }
    const persons = collect(ldNodes(html));
    const named = persons.filter((n) => n.name || n.sameAs);
    assert.strictEqual(named.length, 1,
      `${rel} describes the person ${named.length} times — a consumer cannot tell they are one entity`);
    assert.ok(named[0]['@id'], `${rel} describes the person with no @id to reference`);
    for (const ref of persons.filter((n) => n !== named[0])) {
      refsSeen += 1;
      assert.deepStrictEqual(Object.keys(ref), ['@id'],
        `${rel} re-describes the person instead of referencing @id`);
      assert.strictEqual(ref['@id'], named[0]['@id'],
        `${rel} references ${ref['@id']}, not the page's own person`);
    }
    // PER PAGE, not once for the site. Counted globally this passed while /agents/
    // and /routing/ emitted no authorship at all — their nodes were a FAQPage and a
    // BreadcrumbList, so the publisher the layout emits had nothing to attach to
    // and every content node on the two most-quotable pages was anonymous. The
    // global form was green throughout. Same quiet zero, one layer up.
    assert.ok(refsSeen > 0,
      `${rel} attaches the person to nothing — no author, publisher or creator reference`);
  }
  // And the exemption must stay narrow: exactly one page opts out, and it is the
  // one that must never be indexed. A widening exemption is how a rule goes quiet.
  assert.strictEqual(exempt, 1, `${exempt} pages opted out of carrying the entity`);
  assert.ok(/<meta name="robots" content="noindex">/.test(read('404.html')),
    'the 404 page is indexable');
});

it('the build is deterministic — twice from the same tree is byte-identical', () => {
  const second = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-site-b-'));
  site.build(second);
  try {
    for (const rel of built.written) {
      assert.strictEqual(fs.readFileSync(path.join(second, rel), 'utf8'),
        fs.readFileSync(path.join(OUT, rel), 'utf8'), `${rel} differs between builds`);
    }
  } finally {
    fs.rmSync(second, { recursive: true, force: true });
  }
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: site — ${checks} checks (${pages.length} pages, `
  + `${data.skills.length} members, ${registry.order().length} routers)`);
