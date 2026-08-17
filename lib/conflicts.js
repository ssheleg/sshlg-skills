'use strict';
/**
 * Which installed skills land on ground a router owns — the machine-specific half
 * of the map's arbitration paragraph.
 *
 * The block says another pack's skill does not outrank the map. It cannot say
 * WHICH packs, because the block is written on every operator's machine and this
 * one's roster is not theirs: naming `figma` or `notfair` in a published package
 * would be a fact about one laptop shipped as doctrine. So the rule is general and
 * the roster is a command, exactly as `injectors.js` split the same problem.
 *
 * **This reports CANDIDATES, never offenders**, and the distinction is the whole
 * reason the module is allowed to exist. Overlap is not a defect: most of what it
 * finds answers HOW where a router answers WHEN, and a router reaching for one of
 * them as a tool is the system working. What the list is for is the case an agent
 * cannot see on its own — a competing skill advertises its own trigger, the harness
 * offers both, and nothing compares them. `injectors.js` makes the same refusal
 * about the same class of question, and for the same reason: a list of other
 * people's packs presented as offenders is a judgement dressed as a measurement.
 *
 * **The lexicon below is hand-kept and small, deliberately.** Territory cannot be
 * derived from a router's two table cells — `how it looks and moves` matches
 * nothing an outside skill is named. A generated lexicon would be a guess with a
 * machine's authority; a short explicit one is a guess that admits it. Every term
 * is a word that carries the router's trade and little else, and a term that starts
 * matching everything should be deleted rather than qualified.
 *
 * Pure, like `injectors.js`, `routers.js` and `inventory.js`. Walking the plugin
 * cache belongs to `readSkills`, the one impure function, kept here because the
 * command and any future hook need the identical walk.
 */

/**
 * `router -> terms`. Matched against a skill's id and its description, lowercased.
 *
 * `evidence-docs` is absent on purpose. It is a rule about every document rather
 * than a subject area, so any term broad enough to catch a competitor (`docs`,
 * `documentation`) catches half the roster, and a check that flags everything is
 * read as noise within a day.
 */
const TERRITORY = {
  'super-ux': ['ux', 'scenario', 'persona', 'journey', 'user flow', 'wireframe',
               'funnel', 'onboarding', 'paywall', 'retention'],
  'sheleg-design': ['design system', 'visual', 'palette', 'typography', 'design token',
                    'figma', 'dataviz', 'chart', 'canvas', 'motion'],
  copywriting: ['copywriting', 'brand voice', 'brandbook', 'tone of voice',
                'microcopy', 'content writer', 'landing copy'],
  'sheleg-dev': ['stripe', 'billing', 'checkout', 'meta pixel', 'conversion tracking',
                 'sign in with google', 'core web vitals'],
  'agent-stack': ['orchestrator', 'mcp server', 'agent eval', 'a2a', 'tool calling',
                  'prompt engineering'],
  'seo-llmo': ['seo', 'keyword research', 'serp', 'schema markup', 'meta tags',
               'geo optimiz', 'indexing'],
  'task-pipeline': ['make a plan', 'writing plans', 'brainstorm', 'delivery pipeline',
                    'spec to backlog'],
  'make-skill': ['skill-creator', 'create a skill', 'agent skills standard', 'plugin manifest'],
  'agent-sync': ['lease', 'concurrent agents', 'shared registry'],
};

/**
 * One row per (skill, router) landing, sorted, so two runs over the same machine
 * agree and a difference between them means something.
 *
 * `skills` is `[{plugin, id, description}]`. `owned` is the set of plugin specs the
 * family itself ships — its own skills obviously land on its own ground, and
 * reporting them would bury the four rows that matter under twenty that do not.
 * `routers` limits the answer to routers actually in the block: a machine without
 * `sheleg-dev` installed has no `sheleg-dev` ground to defend.
 */
/**
 * A term matches on WORD boundaries, never as a substring — the first run of this
 * module rediscovered the family's oldest matching bug from the other side.
 * `includes('lease')` fired on *please*, `includes('ux')` on any word containing
 * it, and two thirds of the first report were words inside other words. It is the
 * same defect `lib/triggers.js` documents as `аудит` matching `аудитория`, and the
 * same fix: the term must begin and end where a word does.
 */
const RE_SPECIAL = /[.*+?^${}()|[\]\\]/g;
const CACHE = new Map();
function termPattern(term) {
  let re = CACHE.get(term);
  if (!re) {
    // A SPACE inside a term matches a space, a hyphen or an underscore, because a
    // skill id is `build-an-mcp-server` where a description says `MCP server` and a
    // term that demands one spelling finds neither half the time. This is the same
    // seam as `B-84`'s third case in `lib/triggers.js`, from the other direction:
    // there a hyphenated trigger could not match a spaced prompt.
    const body = term.trim().split(/\s+/)
      .map((w) => w.replace(RE_SPECIAL, '\\$&'))
      .join('[\\s\\-_]+');
    re = new RegExp(`(^|[^a-zа-яё0-9])${body}(?![a-zа-яё0-9])`, 'i');
    CACHE.set(term, re);
  }
  return re;
}

function collisions(skills, opts) {
  const o = opts || {};
  const owned = new Set(o.owned || []);
  const routers = o.routers || Object.keys(TERRITORY);
  const rows = [];
  for (const s of Array.isArray(skills) ? skills : []) {
    if (!s || !s.id) continue;
    if (owned.has(s.plugin)) continue;
    const hay = `${s.id} ${s.description || ''}`.toLowerCase();
    for (const router of routers) {
      const terms = (TERRITORY[router] || []).filter((t) => termPattern(t).test(hay));
      if (terms.length) rows.push({ plugin: s.plugin, id: s.id, router, terms });
    }
  }
  return rows.sort((a, b) =>
    a.plugin.localeCompare(b.plugin) || a.id.localeCompare(b.id) || a.router.localeCompare(b.router));
}

/**
 * The full account, for the operator who asked. Always prints something, including
 * on a machine where nothing overlaps — a check with no visible output on the only
 * machine that runs it is a check nobody has watched work.
 */
function report(rows, opts) {
  const list = Array.isArray(rows) ? rows : [];
  const o = opts || {};
  const out = ['Installed skills that land on ground a router owns'];
  if (!list.length) {
    out.push('  none — nothing installed here overlaps a router\'s subject.');
  } else {
    let plugin = null;
    for (const r of list) {
      if (r.plugin !== plugin) { plugin = r.plugin; out.push(`  ${plugin}`); }
      out.push(`    ${r.id.padEnd(34)}→ ${r.router.padEnd(15)}(${r.terms.join(', ')})`);
    }
  }
  if (o.scanned != null) {
    out.push('');
    out.push(`  ${o.scanned} skill(s) scanned, ${list.length} landing(s).`);
  }
  out.push('');
  out.push('These are CANDIDATES, not offenders. Overlap is not a defect: most of');
  out.push('them answer HOW where a router answers WHEN, and reaching for one as a');
  out.push('tool is the system working. The rule is only that the ROUTER decides the');
  out.push('route — a competing skill is never a second entry point, which is easy to');
  out.push('lose because it advertises its own trigger and nothing compares the two.');
  out.push('');
  out.push('The lexicon behind this is hand-kept and short, so it is a prompt to look');
  out.push('rather than a verdict. Read `lib/conflicts.js` before quoting a row.');
  return out.join('\n');
}

/**
 * Every skill an enabled plugin ships, plus the plain skills in `~/.claude/skills/`.
 *
 * The impure one. A description is read from the skill's own front matter when it
 * parses and left empty when it does not — a skill contributes its id either way,
 * because dropping it would make an unparseable skill invisible to a check whose
 * whole job is to notice what is installed.
 */
function readSkills(home) {
  const fs = require('fs');
  const path = require('path');
  const out = [];
  const seen = new Set();

  const describe = (dir) => {
    try {
      const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
      const fm = /^---\n([\s\S]*?)\n---/.exec(text);
      if (!fm) return '';
      const d = /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
      return d ? d[1].replace(/\s+/g, ' ') : '';
    } catch (e) { return ''; }
  };
  const add = (plugin, dir, id) => {
    const key = `${plugin}/${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ plugin, id, description: describe(dir) });
  };

  let installed = {};
  try {
    installed = JSON.parse(fs.readFileSync(
      path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {};
  } catch (e) { /* no plugin registry here — the plain skills below still count */ }

  let enabled = {};
  try {
    enabled = JSON.parse(fs.readFileSync(
      path.join(home, '.claude', 'settings.json'), 'utf8')).enabledPlugins || {};
  } catch (e) { /* nothing enabled that we can read */ }

  for (const [spec, on] of Object.entries(enabled)) {
    if (!on) continue;
    const entry = installed[spec];
    if (!Array.isArray(entry) || !entry[0] || !entry[0].installPath) continue;
    const base = path.join(entry[0].installPath, 'skills');
    let names = [];
    try { names = fs.readdirSync(base, { withFileTypes: true }); } catch (e) { continue; }
    for (const d of names) if (d.isDirectory()) add(spec, path.join(base, d.name), d.name);
  }

  const plain = path.join(home, '.claude', 'skills');
  let names = [];
  try { names = fs.readdirSync(plain, { withFileTypes: true }); } catch (e) { names = []; }
  for (const d of names) {
    if (!d.isDirectory() && !d.isSymbolicLink()) continue;
    add('(plain ~/.claude/skills)', path.join(plain, d.name), d.name);
  }

  return out;
}

module.exports = { TERRITORY, collisions, report, readSkills };
