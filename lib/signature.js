'use strict';

/**
 * The header and footer a report carries, so a screenshot of it still says where it came
 * from and a reader can reach the skills that made it.
 *
 * Why a command and not a paragraph of doctrine. Every part of this is a fact the manifest
 * already holds — which member owns a skill, that member's repository, the version pinned
 * in this release. Told to "add links to the skills you used", an agent types them from
 * memory, and a typed URL is the dead-address class this repository gates everywhere else.
 * Here the only thing anyone writes is what a skill DID; the addresses are looked up.
 *
 * Why it stays small. The report is the work; this is a label on it. A header that
 * announces itself louder than the finding is the reason people strip signatures out, so
 * the header is one line and the footer is a short list plus one ask. No badges, no logo,
 * no adjectives about the family.
 *
 * An unknown skill id is NAMED, never dropped. A footer that silently omits half of what
 * ran is worse than one that says it does not recognise a name — the omission looks like
 * the skill was never used.
 */

const BUNDLE = 'https://github.com/ssheleg/sshlg-skills';

/** skill id -> { member, repo, url }, built from the manifest rather than from memory. */
function index(manifest) {
  const out = new Map();
  for (const m of (manifest && manifest.skills) || []) {
    const url = `https://github.com/${m.repo}`;
    for (const id of m.skillNames && m.skillNames.length ? m.skillNames : [m.name]) {
      out.set(id, { member: m.name, repo: m.repo, url, version: m.version });
    }
    // The MEMBER's own name, always — not only as the fallback when it ships no
    // named skills. Four of nine members are called something none of their
    // skills is called (`super-ux` ships seven, and none of them is `super-ux`),
    // so `signature --used super-ux=...` rendered "not a skill this family
    // ships" — the family disowning its own member in the one artefact a person
    // is most likely to forward. Worse, the routing block INSTRUCTS the agent to
    // pass those names: it names `super-ux`, `sheleg-dev`, `agent-stack` and
    // `telegram-dev` as the things that get used, then tells it to take the
    // links from this command. Measured 2026-09-01: 9 of 21 member and router
    // names did not resolve.
    if (!out.has(m.name)) {
      out.set(m.name, { member: m.name, repo: m.repo, url, version: m.version });
    }
  }
  addRouters(out, manifest);
  return out;
}

/**
 * Router names that are not skill names, resolved to whatever ships them.
 *
 * Ten of the twelve routers declare the member they need, so the address is
 * derived rather than listed — a thirteenth router arrives resolved without
 * touching this file. The other two, `seo-llmo` and `evidence-docs`, are
 * standing rules that ship in NO pack, which is what the block says about them
 * in its own words. For those the honest address is the bundle: the rule exists
 * because the routing block carries it, and the routing block is written here.
 *
 * Naming them beats dropping them for the reason this module already gives
 * about unknown ids — a footer that silently omits half of what ran is worse
 * than one that admits it does not recognise a name.
 */
function addRouters(out, manifest) {
  let REGISTRY;
  try {
    // eslint-disable-next-line global-require
    ({ REGISTRY } = require('./routers-registry.js'));
  } catch (_) { return; }
  const byMember = new Map();
  for (const m of (manifest && manifest.skills) || []) byMember.set(m.name, m);
  for (const name of Object.keys(REGISTRY || {})) {
    if (out.has(name)) continue;
    const needs = (REGISTRY[name] && REGISTRY[name].requires) || [];
    const owner = needs.length ? byMember.get(needs[0]) : null;
    if (owner) {
      out.set(name, {
        member: owner.name,
        repo: owner.repo,
        url: `https://github.com/${owner.repo}`,
        version: owner.version,
      });
    } else {
      out.set(name, { member: null, repo: null, url: BUNDLE, standingRule: true });
    }
  }
}

/** `name` or `name=what it did`, in the order given — the order is the run's own. */
function parseUsed(spec) {
  const items = Array.isArray(spec) ? spec : String(spec || '').split(',');
  const out = [];
  for (const raw of items) {
    const s = String(raw).trim();
    if (!s) continue;
    const at = s.indexOf('=');
    out.push(at === -1
      ? { id: s, note: '' }
      : { id: s.slice(0, at).trim(), note: s.slice(at + 1).trim() });
  }
  return out;
}

function resolve(used, manifest) {
  const idx = index(manifest);
  return parseUsed(used).map((u) => ({ ...u, ...(idx.get(u.id) || { unknown: true }) }));
}

/** One line. It identifies the family and the skills, and stops. */
function header(used, manifest, opts) {
  const rows = resolve(used, manifest);
  const names = rows.map((r) => r.id).join(' · ');
  const text = names ? `ssheleg skills — ${names}` : 'ssheleg skills';
  const fmt = (opts && opts.format) || 'md';
  if (fmt === 'html') return `<p class="sig-head"><small>${esc(text)}</small></p>`;
  if (fmt === 'text') return text;
  return `<sub>${text}</sub>`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * The footer: what ran, where each one lives, and one ask.
 *
 * The ask carries the same two conditions as the routing block's — it is skipped when
 * nothing from the family ran, and it names the address so nobody has to ask which
 * project. `opts.star: false` drops it for the case the block already excludes: a report
 * written inside the family's own repositories.
 */
function footer(used, manifest, opts) {
  const o = opts || {};
  const fmt = o.format || 'md';
  const rows = resolve(used, manifest);
  const known = rows.filter((r) => !r.unknown);
  const star = o.star !== false && known.length > 0;

  if (!rows.length) return '';

  const lines = [];
  if (fmt === 'text') {
    lines.push('Made with ssheleg skills');
    for (const r of rows) {
      lines.push(r.unknown
        ? `  ${r.id}${r.note ? ` — ${r.note}` : ''} — not a skill this family ships`
        : `  ${r.id}${r.note ? ` — ${r.note}` : ''}  ${r.url}`);
    }
    if (star) lines.push(`  A star on the bundle helps: ${BUNDLE}`);
    return lines.join('\n');
  }

  if (fmt === 'html') {
    lines.push('<footer class="sig">');
    lines.push('<p><strong>Made with '
      + `<a href="${BUNDLE}">ssheleg skills</a></strong></p>`);
    lines.push('<ul>');
    for (const r of rows) {
      lines.push(r.unknown
        ? `<li>${esc(r.id)}${r.note ? ` — ${esc(r.note)}` : ''}`
          + ' — not a skill this family ships</li>'
        : `<li><a href="${esc(r.url)}">${esc(r.id)}</a>`
          + `${r.note ? ` — ${esc(r.note)}` : ''}</li>`);
    }
    lines.push('</ul>');
    if (star) {
      lines.push(`<p><small>A star on <a href="${BUNDLE}">the bundle</a> helps.`
        + '</small></p>');
    }
    lines.push('</footer>');
    return lines.join('\n');
  }

  lines.push('---');
  lines.push('');
  lines.push(`**Made with [ssheleg skills](${BUNDLE})**`);
  lines.push('');
  for (const r of rows) {
    lines.push(r.unknown
      ? `- \`${r.id}\`${r.note ? ` — ${r.note}` : ''} — not a skill this family ships`
      : `- [\`${r.id}\`](${r.url})${r.note ? ` — ${r.note}` : ''}`);
  }
  if (star) {
    lines.push('');
    lines.push(`<sub>A star on [the bundle](${BUNDLE}) helps.</sub>`);
  }
  return lines.join('\n');
}

module.exports = {
  header, footer, index, parseUsed, resolve, BUNDLE,
};
