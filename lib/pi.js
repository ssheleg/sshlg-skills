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
 *     list and read at the user position. Project roots load only in a project Pi trusts;
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
  const seenRoot = new Set();
  const live = [];
  const byName = new Map();
  for (const r of roots) {
    const rr = real(r.path);
    if (!rr || seenRoot.has(rr)) continue;       // absent, or the same directory twice
    seenRoot.add(rr);
    const found = scan(r.path);
    live.push({ path: r.path, kind: r.kind, skills: found.length });
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

module.exports = { inspect, scan, projectDirs, whichBin };
