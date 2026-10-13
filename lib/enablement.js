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
function effective(home, cwd, f) {
  const user = readEnabled(path.join(home, '.claude', 'settings.json'), f);
  if (!cwd) return Object.assign({}, user);
  const root = projectRoot(cwd, f);
  return Object.assign({}, user,
    readEnabled(path.join(root, '.claude', 'settings.json'), f),
    readEnabled(path.join(root, '.claude', 'settings.local.json'), f));
}

/** Installed plugin specs → their install path (the first row), from Claude's registry. */
function installed(home, f) {
  const out = {};
  try {
    const reg = JSON.parse((f || fs).readFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {};
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

module.exports = { projectRoot, effective, installed, unloaded, readEnabled };
