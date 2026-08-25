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

/** Where the site is served from. Every canonical URL is built off this. */
const SITE = 'https://ssheleg.github.io/sshlg-skills';
const X_HANDLE = 'sshlg93';
const GH_OWNER = 'ssheleg';
const GH_REPO = 'sshlg-skills';
const AUTHOR = 'Sergey Sheleg';
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
  const hard = out.slice(0, cap - 1);
  const back = hard.lastIndexOf(' ');
  return `${(back > cap * 0.6 ? hard.slice(0, back) : hard).replace(/[\s,;:—-]+$/, '')}…`;
}

/** The refusal phrase a router text declares, so the page can show it as a chip. */
function refusalOf(text) {
  const m = text.match(/Refusal phrase:\s*(.+?)\*\*/);
  if (!m) return null;
  return m[1].replace(/[«»"]/g, (c) => (c === '"' ? '' : c)).trim();
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
  let n = 0;
  try {
    n = fs.readdirSync(dir).filter((f) => f.endsWith(ext)).length;
  } catch (e) {
    throw new Error(`${member.name}: countGlob points at ${glob}, which is not readable `
      + `(${e.code}) — the submodule is probably not checked out, and a card that says {n} `
      + 'cannot be published from a tree that cannot be counted');
  }
  if (!n) throw new Error(`${member.name}: countGlob ${glob} matched nothing`);
  return String(link.label).replace('{n}', String(n));
}

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

const totalSkills = members.reduce((n, m) => n + (m.skillNames || []).length, 0);
const agentCount = 70;

// ----------------------------------------------------------------------- style

const CSS = `
:root{
  --bg:#0e0f11; --surface:#141519; --surface-2:#191a1f; --line:#24262b;
  --line-2:#2f323a; --ink:#e8e9ec; --ink-2:#c8cad0; --muted:#9a9ca4;
  --dim:#6e7178; --link:#8ab0ff; --link-hi:#b9cdff; --ok:#5ec98a;
  --warm:#e0a458; --radius:14px;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);
  font:400 15px/1.6 var(--sans);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:var(--link);text-decoration:none}
a:hover{color:var(--link-hi);text-decoration:underline;text-underline-offset:3px}
code{font-family:var(--mono);font-size:.9em;color:var(--ink-2)}
h1,h2,h3{letter-spacing:-.02em;font-weight:600;margin:0}
img,svg{max-width:100%;height:auto}
:focus-visible{outline:2px solid var(--link);outline-offset:3px;border-radius:6px}

.wrap{max-width:1100px;margin:0 auto;padding:0 32px}
.skip{position:absolute;left:-9999px}
.skip:focus{left:16px;top:12px;z-index:9;background:var(--surface);
  padding:8px 14px;border-radius:8px;border:1px solid var(--line-2)}

/* ---- nav */
.nav{border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;
  background:rgba(14,15,17,.86);backdrop-filter:saturate(140%) blur(10px)}
.nav .wrap{display:flex;align-items:center;gap:22px;height:58px}
.brand{display:flex;align-items:center;gap:9px;color:var(--ink);font-weight:600;
  letter-spacing:-.02em;white-space:nowrap}
.brand:hover{color:var(--ink);text-decoration:none}
.brand .mark{width:20px;height:20px;flex:0 0 20px}
.nav nav{display:flex;gap:20px;font-size:14px;margin-left:auto;align-items:center}
.nav nav a{color:var(--muted)} .nav nav a:hover{color:var(--ink);text-decoration:none}
@media (max-width:720px){.nav nav a.opt{display:none}}

/* ---- hero */
.hero{padding:74px 0 10px}
.eyebrow{color:var(--dim);font-size:12.5px;letter-spacing:.08em;
  text-transform:uppercase;margin:0 0 18px}
.hero h1{font-size:clamp(32px,5.2vw,52px);line-height:1.07;max-width:20ch}
.hero .lede{color:var(--muted);font-size:clamp(16px,2.1vw,19px);
  max-width:64ch;margin:20px 0 0}
.hero .lede b{color:var(--ink-2);font-weight:600}

/* ---- terminal + copy */
.term{margin:30px 0 0;border:1px solid var(--line);border-radius:var(--radius);
  background:var(--surface);overflow:hidden;max-width:640px}
.term .bar{display:flex;align-items:center;gap:8px;padding:9px 14px;
  border-bottom:1px solid var(--line);color:var(--dim);font-size:11.5px;
  letter-spacing:.06em;text-transform:uppercase}
.term .dot{width:9px;height:9px;border-radius:50%;background:var(--line-2)}
.term .body{display:flex;align-items:center;gap:12px;padding:14px 16px}
.term pre{margin:0;font-family:var(--mono);font-size:14px;color:var(--ink);
  overflow-x:auto;flex:1 1 auto;white-space:pre}
.term .pmt{color:var(--ok);user-select:none}
.copy{flex:0 0 auto;border:1px solid var(--line-2);background:var(--surface-2);
  color:var(--muted);font:500 12px/1 var(--sans);padding:7px 11px;border-radius:8px;
  cursor:pointer;transition:color .15s,border-color .15s}
.copy:hover{color:var(--ink);border-color:var(--dim)}
.copy[data-done="1"]{color:var(--ok);border-color:var(--ok)}

/* ---- buttons */
.ctas{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 0}
.btn{display:inline-flex;align-items:center;gap:9px;padding:11px 18px;
  border-radius:10px;border:1px solid var(--line-2);background:var(--surface);
  color:var(--ink);font:500 14.5px/1 var(--sans);cursor:pointer;
  transition:border-color .15s,background .15s,transform .15s}
.btn:hover{border-color:var(--dim);background:var(--surface-2);color:var(--ink);
  text-decoration:none;transform:translateY(-1px)}
.btn svg{width:17px;height:17px;flex:0 0 17px;fill:currentColor}
.btn--x{background:var(--ink);color:#0e0f11;border-color:var(--ink)}
.btn--x:hover{background:#fff;border-color:#fff;color:#000}
.btn--ghost{background:transparent}
@media (prefers-reduced-motion:reduce){.btn,.btn:hover{transition:none;transform:none}}

/* ---- sections */
.sec{padding:64px 0 0}
.sec>h2{font-size:clamp(21px,2.6vw,27px)}
.sec>.sub{color:var(--muted);max-width:74ch;margin:12px 0 0}
.rule{border:0;border-top:1px solid var(--line);margin:64px 0 0}

/* ---- cards */
.grid{display:grid;gap:16px;margin:28px 0 0;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.card{border:1px solid var(--line);border-radius:var(--radius);
  background:var(--surface);padding:22px;display:flex;flex-direction:column;
  color:inherit;transition:border-color .15s,transform .15s}
a.card:hover{border-color:var(--line-2);text-decoration:none;transform:translateY(-2px)}
.card h3{font-size:17.5px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.card h3 .v{color:var(--dim);font:400 12px/1 var(--mono);letter-spacing:0}
.card .role{color:var(--warm);font-size:12.5px;margin:8px 0 0}
.card p{color:var(--muted);font-size:14px;margin:11px 0 0}
.card .foot{margin:16px 0 0;padding-top:14px;border-top:1px solid var(--line);
  color:var(--dim);font-size:12.5px;display:flex;justify-content:space-between;gap:10px}
@media (prefers-reduced-motion:reduce){a.card:hover{transform:none}}

/* ---- stats */
.stats{display:grid;gap:16px;margin:34px 0 0;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.stat{border:1px solid var(--line);border-radius:var(--radius);
  background:var(--surface);padding:20px}
.stat b{display:block;font-size:29px;font-weight:600;letter-spacing:-.02em}
.stat span{color:var(--muted);font-size:13px}

/* ---- tables */
.tw{overflow-x:auto;margin:26px 0 0;border:1px solid var(--line);
  border-radius:var(--radius);background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);
  vertical-align:top}
tbody tr:last-child td{border-bottom:0}
th{color:var(--dim);font-weight:500;font-size:11.5px;text-transform:uppercase;
  letter-spacing:.06em;white-space:nowrap}
td.nw{white-space:nowrap}

/* ---- prose */
.prose p{color:var(--muted);max-width:74ch}
.prose p b,.prose p strong{color:var(--ink-2)}
.prose h3{font-size:16.5px;margin:30px 0 0}
.prose ul{color:var(--muted);max-width:74ch;padding-left:20px}
.prose li{margin:7px 0}

/* ---- chips */
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.chip{border:1px solid var(--line-2);border-radius:999px;padding:5px 12px;
  font-size:12.5px;color:var(--ink-2);background:var(--surface)}
.chip--refuse{border-color:#43331f;color:var(--warm);background:#191510}

/* ---- callout */
.note{border:1px solid var(--line);border-left:3px solid var(--warm);
  border-radius:0 var(--radius) var(--radius) 0;background:var(--surface);
  padding:18px 20px;margin:26px 0 0;max-width:78ch}
.note p{margin:0;color:var(--muted)} .note p+p{margin-top:10px}

/* ---- footer */
footer{border-top:1px solid var(--line);margin-top:78px;padding:34px 0 60px;
  color:var(--dim);font-size:13px}
footer .wrap{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between}
footer a{color:var(--muted)} footer a:hover{color:var(--ink)}
footer nav{display:flex;gap:18px;flex-wrap:wrap}

/* ---- breadcrumb */
.crumb{color:var(--dim);font-size:13px;padding:26px 0 0}
.crumb a{color:var(--muted)}

@media (max-width:640px){
  .wrap{padding:0 18px}
  .hero{padding:48px 0 6px}
  .sec{padding:48px 0 0}
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
  const jsonld = (o.jsonld || []).map(
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
<meta name="theme-color" content="#0e0f11">
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
  + '<rect width="24" height="24" rx="5" fill="#0e0f11"/>'
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
    (m.extraLinks || []).length ? ' · a catalogue of its own' : ''}</span><span>Read →</span></div>
</a>`;
}

// An extraLink may advertise a COUNT, and a count written by hand goes stale on the
// next release of the member it describes — `"Browse all 34 style packs"` was already
// one pack behind reality the day a thirty-fifth would land, with nothing to catch it.
// So a label may carry `{n}` and name what to count: the files are counted in the
// member's own submodule at build time, which CI checks out recursively.
function resolveCount(member, link) {
  if (!link.label.includes('{n}')) return link.label;
  if (!link.countGlob) {
    throw new Error(`skills.json: ${member.name} extraLink label uses {n} but sets no countGlob`);
  }
  const dir = path.join(ROOT, member.dir, path.dirname(link.countGlob));
  const pattern = path.basename(link.countGlob);
  const rx = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  let names;
  try {
    names = fs.readdirSync(dir).filter((f) => rx.test(f));
  } catch (e) {
    throw new Error(`skills.json: ${member.name} countGlob '${link.countGlob}' does not resolve — ` +
      `submodule not checked out? (${e.code})`);
  }
  const skip = new Set(link.countExclude || []);
  const n = names.filter((f) => !skip.has(f)).length;
  if (!n) throw new Error(`skills.json: ${member.name} countGlob matched nothing`);
  return link.label.replace('{n}', String(n));
}

function indexPage() {
  const rel = '';
  const install = 'npx sshlg-skills install';
  const body = `
<section class="wrap hero">
  <p class="eyebrow">${members.length} skills · ${totalSkills} entry points · one command</p>
  <h1>Agent skills for the work around the code.</h1>
  <p class="lede">A coding agent writes code well and does almost everything around it
  badly. It builds an interface with no idea who uses it, calls a task done without
  checking what was asked, and ships a page no answer engine can read. These
  ${members.length} skills each take one of those gaps and give the agent
  <b>a contract it has to follow</b> — documentation, validators and small
  standard-library scripts. No services, no telemetry, no API keys.</p>
  ${term(install, 'install the whole family')}
  <div class="ctas">
    ${xFollowBtn()}
    ${ghBtn(`https://github.com/${GH_OWNER}/${GH_REPO}`, 'Get it on GitHub')}
    <a class="btn btn--ghost" href="#skills">Browse the skills</a>
  </div>
  <div class="stats">
    <div class="stat"><b>${members.length}</b><span>skill packs, pinned and released together</span></div>
    <div class="stat"><b>${totalSkills}</b><span>entry points an agent can be routed to</span></div>
    <div class="stat"><b>${agentCount}+</b><span>agents supported, Claude Code as plugins</span></div>
    <div class="stat"><b>0</b><span>runtime dependencies, services or keys</span></div>
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
      const label = m ? `<a href="${rel}skills/${m.slug}/">${esc(r)}</a>` : esc(r);
      return `<tr><td class="nw">${label}</td><td>${esc(e.answers)}</td><td>${esc(e.when)}</td></tr>`;
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
        author: { '@type': 'Person', name: AUTHOR, sameAs: [`https://x.com/${X_HANDLE}`] },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'The ssheleg skill family',
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
  <ul class="chips">${subs.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}</ul>
  <div class="prose" style="margin-top:22px">
    <p><b>Shape:</b> ${esc(m.shape)}. ${esc(m.shapeWhy || '')}</p>
  </div>
  ${(m.extraLinks || []).map((l) => `<div class="note">
    <p><a href="${esc(l.url)}" rel="noopener" target="_blank"><strong>${esc(resolveCount(m, l))} →</strong></a></p>
    <p>${esc(l.note || '')}</p>
  </div>`).join('\n')}
</section>

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
        author: { '@type': 'Person', name: AUTHOR, sameAs: [`https://x.com/${X_HANDLE}`] },
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
          : '<span style="color:var(--dim)">a standing rule</span>'}</td></tr>`;
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

// -------------------------------------------------------------------- 404 page

function notFoundPage() {
  const body = `
<section class="wrap hero">
  <p class="eyebrow">404</p>
  <h1>That page is not here.</h1>
  <p class="lede">It may have moved with a release. The ${members.length} packs and
  every routing rule are one click away.</p>
  <div class="ctas">
    <a class="btn" href="/${GH_REPO}/">All ${members.length} skills</a>
    <a class="btn btn--ghost" href="/${GH_REPO}/routing/">Routing</a>
    ${xFollowBtn()}
  </div>
</section>`;
  return layout({
    rel: `/${GH_REPO}/`,
    url: '/404.html',
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
  const urls = ['/', '/routing/', ...members.map((m) => `/skills/${m.slug}/`)];
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
  for (const m of members) written.push(write(`skills/${m.slug}/index.html`, memberPage(m)));
  written.push(write('404.html', notFoundPage()));

  // The social cards. One per page, generated from the same manifest the page is,
  // because a card is a claim about the page and a hand-made one goes stale first.
  written.push(write2('og/index.png', og.card({
    eyebrow: `${members.length} skills · one command · every agent`,
    title: 'ssheleg skills',
    lines: ['agent skills for the work around the code',
      'no services, no telemetry, no api keys'],
    footer: SITE.replace(/^https?:\/\//, ''),
  })));
  written.push(write2('og/routing.png', og.card({
    eyebrow: `${registry.order().length} rules · each names the phrase that declines it`,
    title: 'routing',
    lines: ['which pack answers what, and when'],
    footer: `${SITE.replace(/^https?:\/\//, '')}/routing`,
  })));
  for (const m of members) {
    written.push(write2(`og/skills-${m.slug}.png`, og.card({
      eyebrow: m.role,
      title: m.name,
      lines: [
        `${(m.skillNames || []).length} skills in the pack · v${m.version}`,
        `npx skills add ${m.repo}`,
      ],
      footer: `${SITE.replace(/^https?:\/\//, '')}/skills/${m.slug}`,
    })));
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
  build, SITE, X_HANDLE, GH_OWNER, GH_REPO, members, firstSentence, refusalOf,
  inline, esc,
};
