'use strict';
/**
 * Family skill links in host roots OUTSIDE the default agent set (B-216). Decisions only:
 * the caller reads the directories and moves the bytes, so every rule here is fixtured
 * without a HOME, as `guard.js`, `hygiene.js` and `skillstore.js` keep theirs.
 *
 * Why these four. An interactive `skills add` remembers every agent it was given
 * (`lastSelectedAgents` in ~/.agents/.skill-lock.json) and links into each one's global
 * root, but `update` adds members for `skills.json` `defaultAgents` only. On the operator
 * machine (2026-10-16 compatibility review, INST-8, QWEN-2, DROID-1, CURSOR-7, WINDSURF-2)
 * ~/.qwen/skills and ~/.config/devin/skills held 39 family links, ~/.factory/skills 27 of 39,
 * ~/.grok/skills 39, and nothing refreshed or pruned them. The roots are the skills CLI's
 * own (skills@1.7.2 dist/cli.mjs agent table: qwen-code `join(home, ".qwen/skills")`,
 * devin `join(configHome, "devin/skills")` with configHome = XDG_CONFIG_HOME or ~/.config,
 * droid `join(home, ".factory/skills")`, grok `join(grokHome, "skills")` with grokHome =
 * GROK_HOME or ~/.grok). Windsurf's ~/.codeium/windsurf/skills is a default agent already.
 *
 * What `update` does with a root that holds a family entry:
 *   - host installed (its command on PATH, or its folder holds more than `skills`):
 *     refresh it through the same pinned `skills add` steps, one more `--agent`;
 *   - host absent: report the count, the missing ids and the exact remedy; write nothing;
 *   - either way: remove a DANGLING link the family owns (a family id, or a lock row from an
 *     `ssheleg/` repository) that points into ~/.agents/skills. A live link, a real
 *     directory and anything the family cannot claim are left as they are.
 */
const path = require('path');

const FAMILY_REPO = /^ssheleg\//i;

/** The four roots, as skills@1.7.2 resolves them for `home` and `env`. */
function hosts(home, env) {
  const e = env || {};
  const config = e.XDG_CONFIG_HOME || path.join(home, '.config');
  const grok = (e.GROK_HOME && String(e.GROK_HOME).trim()) || path.join(home, '.grok');
  return [
    { agent: 'qwen-code', label: 'Qwen Code', base: path.join(home, '.qwen'), bin: 'qwen' },
    { agent: 'devin', label: 'Devin for Terminal', base: path.join(config, 'devin'), bin: 'devin' },
    { agent: 'droid', label: 'Droid', base: path.join(home, '.factory'), bin: 'droid' },
    { agent: 'grok', label: 'Grok Build', base: grok, bin: 'grok' },
  ].map((h) => Object.assign(h, { dir: path.join(h.base, 'skills') }));
}

const inside = (p, root) => {
  const rel = path.relative(path.resolve(root), path.resolve(p));
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/**
 * What one root holds, from what the caller observed.
 * @param o.entries   [{ name, isSymlink, target (absolute, resolved lexically from the link), live, isDir }]
 * @param o.familyIds the family's skill ids
 * @param o.lock      id -> source from ~/.agents/.skill-lock.json
 * @param o.sharedRoot ~/.agents/skills
 */
function assess(o) {
  const family = new Set(o.familyIds || []);
  const lock = o.lock || {};
  const linked = [], copies = [], stale = [], danglingKept = [];
  let foreign = 0;
  const present = new Set();
  for (const e of o.entries || []) {
    const ours = family.has(e.name);
    if (ours) present.add(e.name);
    if (e.isSymlink && !e.live) {
      const owned = (ours || FAMILY_REPO.test(String(lock[e.name] || ''))) && inside(String(e.target || ''), o.sharedRoot);
      (owned ? stale : danglingKept).push({ name: e.name, path: e.path || null, target: e.target || null });
      continue;
    }
    if (!ours) { foreign += 1; continue; }
    if (e.isSymlink) linked.push(e.name);
    else if (e.isDir) copies.push(e.name);
  }
  const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  return {
    linked: linked.sort(), copies: copies.sort(), stale: stale.sort(byName), danglingKept: danglingKept.sort(byName), foreign,
    missing: [...family].filter((id) => !present.has(id)).sort(),
  };
}

/** A path quoted for a POSIX shell. */
function q(p) { return `'${String(p).replace(/'/g, "'\\''")}'`; }

/**
 * What `update` does with one root.
 * @param o.host      one row of hosts()
 * @param o.assessed  assess() for its root
 * @param o.installed the host itself is on this machine
 * @param o.scope     { agents: the --agent list or null, claudeOnly }
 * @returns { action: 'none'|'out-of-scope'|'refresh'|'report', addAgent, prune: [paths], lines: [text] }
 */
function decide(o) {
  const h = o.host, a = o.assessed, s = o.scope || {};
  const out = { agent: h.agent, action: 'none', addAgent: null, prune: [], lines: [] };
  if (s.claudeOnly || (s.agents && s.agents.length && !s.agents.includes(h.agent))) { out.action = 'out-of-scope'; return out; }
  const named = !!(s.agents && s.agents.includes(h.agent));
  const holds = a.linked.length + a.copies.length;
  out.prune = a.stale.map((x) => x.path).filter(Boolean);
  if (!holds && !out.prune.length) return out;
  const have = `${holds} family entr${holds === 1 ? 'y' : 'ies'} (${a.linked.length} linked, ${a.copies.length} copied)`;
  const missing = a.missing.length ? `; missing ${a.missing.length}: ${a.missing.join(', ')}` : '; none missing';
  if (!holds) {
    out.lines.push(`${h.agent} ${h.dir}: no live family entry`);
  } else if (named) {
    out.action = 'refresh';
    out.lines.push(`${h.agent} ${h.dir}: ${have}${missing}; named by --agent, so this run's skills add refreshed it`);
  } else if (o.installed) {
    out.action = 'refresh';
    out.addAgent = h.agent;
    out.lines.push(`${h.agent} ${h.dir}: ${have}${missing}; ${h.label} is installed, so it is refreshed with the default set`);
  } else {
    out.action = 'report';
    out.lines.push(`${h.agent} ${h.dir}: ${have}${missing}; ${h.label} is not installed here, so update leaves it as it is.`);
    out.lines.push(`  keep it current: npx sshlg-skills update --agent ${h.agent}`);
    // `rm` without -r removes a symlink and refuses a directory, so a copy can never go.
    if (a.linked.length) out.lines.push(`  or drop the family links (symlinks only): cd ${q(h.dir)} && rm -- ${a.linked.map(q).join(' ')}`);
  }
  for (const k of a.danglingKept) out.lines.push(`  left in place: dangling ${k.name} -> ${k.target} (not attributable to the family)`);
  return out;
}

module.exports = { hosts, assess, decide, q, FAMILY_REPO };
