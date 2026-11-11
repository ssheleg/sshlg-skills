'use strict';
/**
 * Which plugins Claude Code loads for a directory — not only the user-scope answer.
 *
 * Why it exists. `domains --apply` (B-185) turns a domain member off in
 * `~/.claude/settings.json` and on in each project's `.claude/settings.local.json`.
 * Every reader that looked at user scope alone — `toolkit --find`, `conflicts`,
 * `visibility`'s listing count, the post-tool-use shadow check, the prompt hook's
 * route note — then saw the member as gone even in a project where it loads.
 *
 * The answer is merged the way the settings files layer: user, then the project's
 * `.claude/settings.json`, then `.claude/settings.local.json`; the later file wins per
 * plugin. The project is the nearest directory at or above `cwd` holding `.git` (the
 * checkout `domains` writes into), or `cwd` itself when there is none.
 *
 * Read-only, and every read fails soft: an unreadable file contributes nothing.
 */

const fs = require('fs');
const path = require('path');

/** The same documented root used by host writers; project .claude paths stay local. */
function claudeRoot(home, env) {
  const apply = require('./apply');
  return apply.hostRoot(apply.TARGETS.find((t) => t.agent === 'claude'), home, { env: env || process.env });
}

/** The checkout `cwd` belongs to: nearest ancestor (inclusive) with `.git`, else `cwd`. */
function projectRoot(cwd, f) {
  const fsx = f || fs;
  let dir = path.resolve(cwd);
  for (;;) {
    if (fsx.existsSync(path.join(dir, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(cwd);
    dir = up;
  }
}

function readEnabled(file, f) {
  try {
    const d = JSON.parse((f || fs).readFileSync(file, 'utf8'));
    const ep = d && d.enabledPlugins;
    return ep && typeof ep === 'object' && !Array.isArray(ep) ? ep : {};
  } catch (e) { return {}; }
}

/** `{spec: bool}` as Claude Code would merge it for a session in `cwd` (user scope alone without one). */
function effective(home, cwd, f, profileRoot) {
  const user = readEnabled(path.join(profileRoot || claudeRoot(home), 'settings.json'), f);
  if (!cwd) return Object.assign({}, user);
  const root = projectRoot(cwd, f);
  return Object.assign({}, user,
    readEnabled(path.join(root, '.claude', 'settings.json'), f),
    readEnabled(path.join(root, '.claude', 'settings.local.json'), f));
}

/** Installed plugin specs → their install path (the first row), from Claude's registry. */
function installed(home, f, profileRoot) {
  const out = {};
  try {
    const reg = JSON.parse((f || fs).readFileSync(path.join(profileRoot || claudeRoot(home), 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {};
    for (const [spec, rows] of Object.entries(reg)) {
      if (Array.isArray(rows) && rows[0] && rows[0].installPath) out[spec] = rows[0].installPath;
    }
  } catch (e) { /* no registry: nothing installed that we can see */ }
  return out;
}

/**
 * Domain members (by name) installed here but not loaded for `cwd` — the ones whose route
 * cannot be taken in that session. `specs` maps member → "<plugin>@<marketplace>".
 */
function unloaded(home, cwd, specs, f) {
  const inst = installed(home, f);
  const eff = effective(home, cwd, f);
  return Object.keys(specs || {}).filter((m) => inst[specs[m]] && eff[specs[m]] !== true);
}

/**
 * User-scope `enabledPlugins` as Claude Code reads it, or null when the settings file is
 * missing, unreadable, not JSON or has no `enabledPlugins` object: "cannot tell" must not
 * read as "nothing enabled" (R1).
 */
function userEnabled(home, f, profileRoot) {
  try {
    const d = JSON.parse((f || fs).readFileSync(path.join(profileRoot || claudeRoot(home), 'settings.json'), 'utf8'));
    const ep = d && d.enabledPlugins;
    return ep && typeof ep === 'object' && !Array.isArray(ep) ? ep : null;
  } catch (e) { return null; }
}

/**
 * R1 (audit 2026-11-11): the family members whose routers belong in the CLAUDE target's
 * global block. A member counts when its Claude plugin is enabled at user scope; one that
 * is installed but disabled there (B-185 `domains` turns telegram-dev, xr-dev, web3d-dev
 * off globally and on per project) loads in no session by default, so its router section
 * and router-table row leave the global block (its map row stays). Pure: `enabled` is the
 * user-scope map, or null when it cannot be read, which keeps every member (the old scope).
 */
function claudeMembers(skills, enabled) {
  const all = (skills || []).map((s) => s.name);
  if (!enabled || typeof enabled !== 'object') return all;
  return (skills || []).filter((s) => !s.pluginInstall || enabled[s.pluginInstall] === true).map((s) => s.name);
}

module.exports = { claudeRoot, projectRoot, effective, installed, unloaded, readEnabled, userEnabled, claudeMembers };
