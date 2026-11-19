'use strict';
/**
 * Which pinned members are missing from this checkout (2026-11-19 retro).
 *
 * A fresh worktree without `git submodule update --init` failed seven suites on
 * 2026-11-18, and the red summary read like a broken change. The runner now names
 * the cause on its first and last line: a member directory that is absent or empty
 * is not a member this run could read.
 */
const fs = require('fs');
const path = require('path');

function missingMembers(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'skills.json'), 'utf8'));
  return (manifest.skills || []).filter((m) => {
    const dir = path.join(root, m.dir || path.join('skills', m.name));
    try { return fs.readdirSync(dir).length === 0; } catch (_) { return true; }
  }).map((m) => m.name);
}

function note(missing, total) {
  if (!missing.length) return '';
  return `NOTE: ${missing.length} of ${total} pinned members are not checked out (${missing.join(', ')}): `
    + 'suites that read members fail for that reason alone; run `git submodule update --init` first\n';
}

module.exports = { missingMembers, note };
