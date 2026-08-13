'use strict';
/**
 * What one turn decided, kept where the next hook of the same turn can read it.
 *
 * `UserPromptSubmit` classifies the prompt; `PreToolUse` acts on that
 * classification several tool calls later, in a different process. Nothing in the
 * hook payload carries it between them, so it goes through a file keyed by
 * session.
 *
 * Deliberately **not** the config file. `~/.sshlg-skills/config.json` holds what
 * the operator chose and must survive; this holds what a turn happened to say and
 * is worthless tomorrow. Mixing the two puts throwaway state in the file whose
 * whole value is that it persists.
 */

const fs = require('fs');
const path = require('path');

/** Where a session's turn state lives, relative to home. */
const DIR = ['.sshlg-skills', 'turns'];

/**
 * A session id is used as a filename, so nothing in it may be a path.
 *
 * Separators go first, then every run of dots — the same order `lib/backup.js`
 * settled on, and for the same reason: while they are still separators, `..` is
 * still recognisable as a traversal, and a key is a flat filename.
 */
function fileFor(home, sessionId) {
  const key = String(sessionId || 'unknown')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 80);
  return path.join(home, ...DIR, `${key || 'unknown'}.json`);
}

/** The recorded state, or an empty one. An unreadable file is an empty one. */
function read(home, sessionId) {
  try {
    return JSON.parse(fs.readFileSync(fileFor(home, sessionId), 'utf8'));
  } catch (e) {
    return {};
  }
}

/**
 * Merge and persist. Returns the merged state.
 *
 * `optedOut` is sticky: once a session has declined, no later turn may quietly
 * un-decline it by writing `false`.
 */
function write(home, sessionId, patch) {
  const current = read(home, sessionId);
  const next = Object.assign({}, current, patch);
  if (current.optedOut) next.optedOut = true;
  try {
    const file = fileFor(home, sessionId);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(next), 'utf8');
  } catch (e) {
    /* A turn hint that cannot be stored is a turn hint that does not happen. */
  }
  return next;
}

/**
 * Delete session files older than `maxAgeMs`.
 *
 * Called on session start. Without it this directory grows one small file per
 * session forever, which is the kind of litter nobody notices until it is
 * thousands of files.
 */
function prune(home, nowMs, maxAgeMs) {
  const dir = path.join(home, ...DIR);
  let removed = 0;
  try {
    for (const name of fs.readdirSync(dir)) {
      const f = path.join(dir, name);
      if (nowMs - fs.statSync(f).mtimeMs > maxAgeMs) { fs.unlinkSync(f); removed += 1; }
    }
  } catch (e) { /* nothing to prune is the normal case */ }
  return removed;
}

module.exports = { read, write, prune, fileFor, DIR };
