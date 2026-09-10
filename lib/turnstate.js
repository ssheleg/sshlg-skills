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
 * un-decline it by writing `false`. It remains the DELIBERATE whole-session
 * flag — a recorded policy decision (FIX-RT-02.01), separate from the
 * route-scoped waivers below, not replaced by them.
 *
 * `waivers` merge per route: a later turn adds its own routes and never
 * silently drops an earlier one — a session waiver survives the next turn.
 * The one way a waiver leaves is an EXPLICIT act: a patch naming the route
 * with `null` (the revoke path).
 */
function write(home, sessionId, patch) {
  const current = read(home, sessionId);
  const next = Object.assign({}, current, patch);
  if (current.optedOut) next.optedOut = true;
  if (current.waivers || (patch && patch.waivers)) {
    const merged = Object.assign({}, current.waivers, patch && patch.waivers);
    for (const route of Object.keys(merged)) {
      if (merged[route] === null) delete merged[route];
    }
    next.waivers = merged;
  }
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

/**
 * Route-scoped waivers (FIX-RT-02.01).
 *
 * «без дизайна» used to zero EVERY route for the turn while `optedOut` stuck
 * for the session — and a QUOTED "no pipeline." flipped the same boolean,
 * though a quote is nobody's decision. A waiver now carries route_id, scope
 * and source, and only an explicit user act creates one; the whole-session
 * opt-out stays a separate deliberate flag (`optedOut`), recorded above as a
 * policy decision rather than silently rewired.
 */

/** Only a user's own act records a waiver — a quote, an example or a tool's
 * echo returns the state untouched. */
function recordWaiver(state, routeId, opts) {
  const o = opts || {};
  const source = o.source || 'user';
  if (source !== 'user' || !routeId) return state;
  const waivers = Object.assign({}, state.waivers);
  waivers[routeId] = { scope: o.scope || 'session', source: 'user' };
  return Object.assign({}, state, { waivers });
}

/** Waived when the route has its own waiver, or the session's deliberate
 * whole-session flag is set. One route's waiver says nothing about another. */
function waived(state, routeId) {
  if (state && state.optedOut) return true;
  return Boolean(state && state.waivers && state.waivers[routeId]);
}

/** An explicitly chosen waiver can be explicitly withdrawn. */
function revokeWaiver(state, routeId) {
  if (!state || !state.waivers || !state.waivers[routeId]) return state;
  const waivers = Object.assign({}, state.waivers);
  delete waivers[routeId];
  return Object.assign({}, state, { waivers });
}

/**
 * Whether every occurrence of `phrase` in `text` sits inside quoting —
 * backticks, «guillemets», "double" or 'single' quotes. Discussing a refusal
 * phrase is not saying it: a quoted occurrence carries source 'quote' and
 * records nothing.
 */
function isQuoted(text, phrase) {
  const t = String(text || '');
  const p = String(phrase || '');
  if (!p || !t.includes(p)) return false;
  const spans = [];
  const pairs = [['`', '`'], ['«', '»'], ['"', '"'], ["'", "'"]];
  for (const [open, close] of pairs) {
    let from = 0;
    for (;;) {
      const a = t.indexOf(open, from);
      if (a === -1) break;
      const b = t.indexOf(close, a + 1);
      if (b === -1) break;
      spans.push([a, b]);
      from = b + 1;
    }
  }
  let at = 0;
  for (;;) {
    const i = t.indexOf(p, at);
    if (i === -1) return true;
    if (!spans.some(([a, b]) => a < i && i + p.length <= b)) return false;
    at = i + 1;
  }
}

module.exports = {
  read, write, prune, fileFor, DIR,
  recordWaiver, waived, revokeWaiver, isQuoted,
};
