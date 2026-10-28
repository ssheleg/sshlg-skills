'use strict';
/**
 * B-286: what Hermes reads through a link into the shared ~/.agents/skills store.
 *
 * B-217 gave Hermes its own copy of every family skill (lib/plan.js `COPY_AGENTS`), because
 * Hermes `skill_manage(patch)` rewrites a skill in place and through a link that place is the
 * copy every other host reads. Third-party skills were left as they were: on the operator
 * machine (2026-10-28) 360 entries in ~/.hermes/skills were links into ~/.agents/skills (449
 * when the row was filed), so a Hermes self-patch to one of them still changes the shared copy.
 *
 * The hub does not take ownership of third-party skills: it never adds, copies or removes
 * one. It reports the count and the exact remedy, one `skills add` per upstream source naming
 * only the skills that are linked today (skills@1.7.2 `-s, --skill <skills>`; `--copy`
 * replaces an existing link with a directory, as B-217 measured). A bare `npx skills update`
 * re-links the family copies too; that case names `npx sshlg-skills update`, which copies
 * them again.
 *
 * Decisions only, fixtured without a HOME: the caller reads the directory and the lock.
 */
const path = require('path');

const REMEDY_FAMILY = 'npx --yes sshlg-skills@latest update';

const inside = (p, root) => {
  const rel = path.relative(path.resolve(String(root || '/')), path.resolve(String(p || '/')));
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** A word a POSIX shell reads as itself, bare; anything else single-quoted. */
function word(s) {
  const t = String(s);
  return /^[A-Za-z0-9._\/@:+=-]+$/.test(t) ? t : `'${t.replace(/'/g, "'\\''")}'`;
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * What ~/.hermes/skills holds, from what the caller observed.
 * @param o.entries    [{ name, isSymlink, target (absolute, lexical), live, isDir }]
 * @param o.familyIds  the family's skill ids
 * @param o.lock       id -> source from ~/.agents/.skill-lock.json
 * @param o.sharedRoot ~/.agents/skills
 */
function assess(o) {
  const opts = o && typeof o === 'object' ? o : {};
  const family = new Set(Array.isArray(opts.familyIds) ? opts.familyIds : []);
  const lock = opts.lock && typeof opts.lock === 'object' ? opts.lock : {};
  const out = { family: { copies: [], links: [] }, shared: [], bySource: [], unsourced: [],
    elsewhere: 0, dangling: 0, ownCopies: 0 };
  for (const e of Array.isArray(opts.entries) ? opts.entries : []) {
    if (!e || typeof e !== 'object' || typeof e.name !== 'string') continue;
    const intoShared = !!e.isSymlink && inside(e.target, opts.sharedRoot);
    if (family.has(e.name)) {
      if (e.isSymlink) { if (intoShared) out.family.links.push(e.name); }
      else if (e.isDir) out.family.copies.push(e.name);
      continue;
    }
    if (!e.isSymlink) { if (e.isDir) out.ownCopies += 1; continue; }
    if (!e.live) { out.dangling += 1; continue; }
    if (!intoShared) { out.elsewhere += 1; continue; }
    out.shared.push({ name: e.name, source: typeof lock[e.name] === 'string' ? lock[e.name] : '' });
  }
  out.family.copies.sort(byText);
  out.family.links.sort(byText);
  out.shared.sort((a, b) => byText(a.name, b.name));
  const groups = new Map();
  for (const s of out.shared) {
    if (!s.source) { out.unsourced.push(s.name); continue; }
    if (!groups.has(s.source)) groups.set(s.source, []);
    groups.get(s.source).push(s.name);
  }
  out.bySource = [...groups].map(([source, names]) => ({ source, names }))
    .sort((a, b) => b.names.length - a.names.length || byText(a.source, b.source));
  return out;
}

/** The `hosts` lines for one assessment. Read-only advice; nothing here is run. */
function report(a, o) {
  const dir = (o && o.dir) || '~/.hermes/skills';
  const x = a && typeof a === 'object' ? a : assess({});
  const lines = [`  skills root ${dir}`];
  lines.push(`  family skills: ${x.family.copies.length} own copies, ${x.family.links.length} links into ~/.agents/skills`);
  if (x.family.links.length) {
    lines.push(`  ${x.family.links.length} family skill(s) are links again (a bare \`npx skills update\` re-links them): ${x.family.links.join(', ')}`);
    lines.push(`  \`${REMEDY_FAMILY}\` gives Hermes its own copy again.`);
  }
  const rest = [];
  if (x.ownCopies) rest.push(`${x.ownCopies} own copies`);
  if (x.elsewhere) rest.push(`${x.elsewhere} links outside the shared store`);
  if (x.dangling) rest.push(`${x.dangling} links that resolve nowhere`);
  if (!x.shared.length) {
    lines.push(`  other skills: no third-party skill is a link into ~/.agents/skills${rest.length ? `; ${rest.join(', ')}` : ''}.`);
    return lines;
  }
  lines.push(`  other skills: ${x.shared.length} third-party skill(s) are links into the shared ~/.agents/skills${rest.length ? `; ${rest.join(', ')}` : ''}.`);
  lines.push('  A Hermes `skill_manage(patch)` on one of them rewrites the copy every other host reads.');
  lines.push('  sshlg-skills does not take over third-party skills and changes none of them. To give Hermes its own copy, per source:');
  for (const g of x.bySource) {
    lines.push(`    npx skills add ${word(g.source)} --skill ${g.names.map(word).join(' ')} --agent hermes-agent --global --copy --yes   (${g.names.length})`);
  }
  if (x.unsourced.length) {
    lines.push(`  ${x.unsourced.length} linked skill(s) have no source recorded in ~/.agents/.skill-lock.json, so no command here can name them: ${x.unsourced.join(', ')}`);
  }
  return lines;
}

module.exports = { assess, report, word, REMEDY_FAMILY };
