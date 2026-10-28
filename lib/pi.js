'use strict';
/**
 * Pi (`@earendil-works/pi-coding-agent`) as a host — READ-ONLY.
 *
 * What this module knows, and where it was read (Pi 1.1.0 docs, 2026-10-12; discovery
 * order re-read in the installed 1.1.0 code, 2026-10-27, B-221):
 *   - skills: `~/.pi/agent/skills`, `~/.agents/skills` (user) and `.pi/skills`,
 *     `.agents/skills` (project), every directory holding a SKILL.md found recursively
 *     (docs/skills.md:59-61);
 *   - discovery order is project first: `<cwd>/.pi/skills` (the working directory only),
 *     then `.agents/skills` from cwd up through its ancestors, stopping at the git root,
 *     then `~/.pi/agent/skills`, then `~/.agents/skills` (dist/core/package-manager.js,
 *     `addAutoDiscoveredResources`; `projectBaseDir = join(cwd, ".pi")` in `resolve`).
 *     A project `.agents/skills` that IS `~/.agents/skills` is dropped from the project
 *     list and read at the user position. Project roots load only in a project Pi trusts
 *     (B-263, `projectTrust` below reads the trust store the way Pi 1.1.0 does);
 *   - a name collision keeps the FIRST discovered skill and warns (docs/skills.md:85;
 *     dist/core/skills.js `loadSkills`), so a project copy wins over a user copy;
 *   - `<agent-dir>` is `~/.pi/agent`, or `$PI_CODING_AGENT_DIR` (docs/configuration.md:9);
 *   - it does not load Claude Code plugins, so the family reaches Pi only as plain
 *     skill directories and through the instruction file.
 *
 * It writes nothing. The routing block goes through apply.js (`TARGETS`), the one
 * writer, so the backup and the sentinels are not a second implementation here.
 */
const fs = require('fs');
const path = require('path');

const MAX_DEPTH = 4;

function real(p) { try { return fs.realpathSync(p); } catch (_) { return null; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (_) { return false; } }
function exists(p) { try { fs.accessSync(p); return true; } catch (_) { return false; } }

/** Every directory under `root` holding a SKILL.md → [{name, path, real}]. */
function scan(root) {
  const out = [];
  const seen = new Set();
  (function walk(dir, depth) {
    const rp = real(dir);
    if (!rp || seen.has(rp) || depth > MAX_DEPTH) return;
    seen.add(rp);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (_) { return; }
    for (const n of names.sort()) {
      const p = path.join(dir, n);
      if (!isDir(p)) continue;
      if (exists(path.join(p, 'SKILL.md'))) out.push({ name: n, path: p, real: real(p) });
      else walk(p, depth + 1);
    }
  })(root, 0);
  return out;
}

/** cwd and its ancestors, stopping after the first directory that holds `.git`. */
function projectDirs(cwd) {
  const dirs = [];
  let d = path.resolve(cwd);
  for (;;) {
    dirs.push(d);
    if (exists(path.join(d, '.git'))) break;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return dirs;
}

/** What under `<cwd>/.pi` makes a project need trust (dist/core/trust-manager.js 1.1.0). */
const TRUST_REQUIRING = ['settings.json', 'mcp.json', 'extensions', 'skills', 'prompts', 'themes', 'SYSTEM.md', 'APPEND_SYSTEM.md'];

/** Pi's `canonicalizePath(resolvePath(p))`: the realpath, or the resolved path. */
function canonical(p) { return real(path.resolve(p)) || path.resolve(p); }

/**
 * B-263: does Pi load this project's roots? Read-only, as Pi 1.1.0 decides it:
 *   - `needed`: `<cwd>/.pi` holds a TRUST_REQUIRING entry, or `.agents/skills` exists in
 *     cwd or any ancestor other than `~/.agents/skills` (`hasTrustRequiringProjectResources`);
 *     a project with none loads (there is nothing to gate);
 *   - the nearest entry (cwd, then its ancestors, by realpath) in `<agent-dir>/trust.json`
 *     whose value is true or false (`ProjectTrustStore.get`; null is no entry);
 *   - else `defaultProjectTrust` in `<agent-dir>/settings.json`: `always`, `never`, anything
 *     else `ask` (`getDefaultProjectTrust`); `ask` prompts in an interactive session and is
 *     false headless (`resolveProjectTrusted`).
 * Not readable here: `--approve`/`--no-approve` and an extension's `project_trust` answer,
 * which decide per run. A store Pi would refuse is `unknown` with Pi's own reason.
 *
 * @returns {needed, verdict: 'not-needed'|'trusted'|'untrusted'|'asks'|'unknown', entry,
 *   default, store: 'absent'|'read'|'invalid', file, reason, entries: [{path, trusted}]}
 */
function projectTrust(o) {
  const env = o.env || {};
  const agentDir = env.PI_CODING_AGENT_DIR || path.join(o.home, '.pi', 'agent');
  const file = path.join(path.resolve(agentDir), 'trust.json');
  const cwd = canonical(o.cwd || o.home);
  const userAgents = path.join(canonical(o.home), '.agents', 'skills');
  let needed = TRUST_REQUIRING.some((e) => exists(path.join(cwd, '.pi', e)));
  for (let d = cwd; !needed;) {
    const p = path.join(d, '.agents', 'skills');
    if (p !== userAgents && exists(p)) needed = true;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  let def = 'ask';
  try {
    const v = JSON.parse(fs.readFileSync(path.join(agentDir, 'settings.json'), 'utf8')).defaultProjectTrust;
    if (v === 'always' || v === 'never') def = v;
  } catch (_) { /* absent or unreadable settings: Pi's default, ask */ }
  const out = { needed, verdict: null, entry: null, default: def, store: 'absent', file, reason: null, entries: [] };
  let data = {};
  if (exists(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error(`Invalid trust store ${file}: expected an object`);
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== true && v !== false && v !== null) throw new Error(`Invalid trust store ${file}: value for ${JSON.stringify(k)} must be true, false, or null`);
      }
      data = parsed;
      out.store = 'read';
    } catch (e) {
      out.store = 'invalid';
      out.reason = e instanceof SyntaxError ? `Failed to read trust store ${file}: ${e.message}` : e.message;
    }
  }
  out.entries = Object.keys(data).sort().filter((k) => data[k] === true || data[k] === false)
    .map((k) => ({ path: k, trusted: data[k] }));
  if (!needed) { out.verdict = 'not-needed'; return out; }
  if (out.store === 'invalid') { out.verdict = 'unknown'; return out; }
  for (let d = cwd; ;) {
    if (data[d] === true || data[d] === false) { out.entry = d; out.verdict = data[d] ? 'trusted' : 'untrusted'; return out; }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  out.verdict = def === 'always' ? 'trusted' : def === 'never' ? 'untrusted' : 'asks';
  return out;
}

/**
 * @param o.home   home directory
 * @param o.env    environment (PI_CODING_AGENT_DIR)
 * @param o.cwd    working directory for the project roots
 * @param o.which  (bin) => absolute path | null — injected so a fixture needs no PATH
 * @param o.family Set of family skill names
 */
function inspect(o) {
  const home = o.home;
  const env = o.env || {};
  const family = o.family || new Set();
  const which = o.which || (() => null);

  const agentDir = env.PI_CODING_AGENT_DIR || path.join(home, '.pi', 'agent');
  const via = [];
  if (isDir(agentDir)) via.push(env.PI_CODING_AGENT_DIR ? '$PI_CODING_AGENT_DIR' : '~/.pi/agent');
  if (which('pi')) via.push('pi on PATH');

  // Discovery order is the collision order: Pi keeps the first (B-221: project first).
  const cwd = path.resolve(o.cwd || home);
  const userAgents = path.join(home, '.agents', 'skills');
  const roots = [{ path: path.join(cwd, '.pi', 'skills'), kind: 'project' }];
  for (const d of projectDirs(cwd)) {
    const p = path.join(d, '.agents', 'skills');
    if (path.resolve(p) !== path.resolve(userAgents)) roots.push({ path: p, kind: 'project' });
  }
  roots.push({ path: path.join(agentDir, 'skills'), kind: 'user' });
  roots.push({ path: userAgents, kind: 'user' });
  // B-263: an untrusted project loads none of its roots (or a store Pi cannot read: it
  // refuses to start the project then). Pi asking first still counts: accepting loads them.
  const trust = projectTrust({ home, env, cwd });
  const projectLoads = trust.verdict !== 'untrusted' && trust.verdict !== 'unknown';
  const seenRoot = new Set();
  const live = [];
  const byName = new Map();
  for (const r of roots) {
    const rr = real(r.path);
    if (!rr || seenRoot.has(rr)) continue;       // absent, or the same directory twice
    seenRoot.add(rr);
    const found = scan(r.path);
    const loaded = r.kind !== 'project' || projectLoads;
    live.push({ path: r.path, kind: r.kind, skills: found.length, loaded });
    if (!loaded) continue;
    for (const s of found) {
      if (!byName.has(s.name)) byName.set(s.name, []);
      byName.get(s.name).push({ path: s.path, real: s.real });
    }
  }

  let harmless = 0;
  const conflicts = [];
  for (const [name, locs] of byName) {
    if (locs.length < 2) continue;
    if (new Set(locs.map((l) => l.real)).size === 1) harmless += 1;
    else conflicts.push({ name, locations: locs });
  }
  const visible = [...family].filter((n) => byName.has(n)).sort();
  return {
    detected: via.length > 0,
    via,
    agentDir,
    instructionFile: path.join(agentDir, 'AGENTS.md'),
    roots: live,
    trust,
    names: byName.size,
    family: { total: family.size, visible, missing: [...family].filter((n) => !byName.has(n)).sort() },
    duplicates: {
      harmless,
      conflicts,
      familyConflicts: conflicts.map((c) => c.name).filter((n) => family.has(n)).sort(),
    },
  };
}

/** The absolute path of `bin` on PATH, or null. */
function whichBin(bin, env) {
  for (const d of String((env || process.env).PATH || '').split(path.delimiter)) {
    if (!d) continue;
    const p = path.join(d, bin);
    try { fs.accessSync(p, fs.constants.X_OK); if (fs.statSync(p).isFile()) return p; } catch (_) { /* next */ }
  }
  return null;
}

module.exports = { inspect, scan, projectDirs, projectTrust, whichBin };
