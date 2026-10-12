'use strict';
/**
 * The pack's settings — which routers this machine wants.
 *
 * Shape:
 *
 *   {
 *     "routers": { "seo-llmo": "off" },
 *     "stash":   { "task-pipeline": "…the section body that was removed…" },
 *     "visibility": { "hidePacks": ["owner/repo"], "showPacks": ["owner/repo"] }
 *   }
 *
 * **Only deviations are stored.** A router absent from `routers` is on. That
 * is what lets a new family member's router appear on its own: a file listing
 * every router as "on" would freeze today's list, and the next release's
 * router would arrive switched off by a file nobody remembered writing.
 *
 * **The stash is not a cache.** Migration moves the operator's own wording
 * into the block, asides and all. Switching a router off and back on would
 * otherwise return the packaged default, silently replacing text a person
 * wrote — against `~/.claude/CLAUDE.md`, which is not under version control
 * and has nothing to roll back to.
 */

const path = require('path');
const store = require('./store.js');

const STATES = ['on', 'off'];

function configPath(home) {
  return path.join(home, '.sshlg-skills', 'config.json');
}

/** The settings, or `{}`. A file we cannot read falls back to the defaults. */
function readConfig(home) {
  return store.readJson(configPath(home));
}

/**
 * Edit one sub-object of the file AS IT IS AT WRITE TIME (final polish 3). Every writer
 * below used to read the file, rebuild a sub-object (`stash`, `authored`, `routes`, …) from
 * that read and write it back whole: the read happened outside `config.json.lock`, so two
 * writers erased each other's keys (measured: four processes × 20 `stashSet` of distinct
 * keys kept 20 of 80). `edit(sub, cur)` mutates a copy of `cur[key]` under the lock that
 * `store.writeJson` holds around the read and the rename; a sub-object left empty by
 * `dropEmpty` goes, so the file keeps holding deviations only. Returns the whole file after
 * the write, or — when `edit` returns something other than `undefined` — that value.
 */
function editSub(home, key, edit, dropEmpty) {
  let result;
  const after = store.writeJson(configPath(home), (cur) => {
    const sub = Object.assign({}, cur[key]);
    result = edit(sub, cur);
    const next = Object.assign({}, cur, { [key]: sub });
    if (dropEmpty && !Object.keys(sub).length) delete next[key];
    return next;
  });
  return result === undefined ? after : result;
}

/** Absent means on. Only an explicit "off" disables a router. */
function isEnabled(config, name) {
  const routers = (config && config.routers) || {};
  return routers[name] !== 'off';
}

/**
 * Record a router's state. `on` DELETES the key rather than writing it, so
 * the file keeps holding deviations only.
 */
function setRouter(home, name, state) {
  if (!STATES.includes(state)) {
    throw new Error(`state must be one of on, off — got "${state}"`);
  }
  return editSub(home, 'routers', (routers) => {
    if (state === 'off') routers[name] = 'off';
    else delete routers[name];
  });
}

/**
 * Whether the set updates itself while the operator is idle. Absent means ON:
 * the file holds DEVIATIONS, the same convention `setRouter` uses, so a fresh
 * machine gets the behaviour without a config file having to say so.
 */
function autoUpdateEnabled(config) {
  const u = (config && config.update) || {};
  return u.auto !== 'off';
}

/** Record it. `on` DELETES the key so the file keeps only deviations. */
function setAutoUpdate(home, state) {
  if (!STATES.includes(state)) {
    throw new Error(`state must be one of on, off — got "${state}"`);
  }
  return editSub(home, 'update', (update) => {
    if (state === 'off') update.auto = 'off';
    else delete update.auto;
  });
}

/**
 * Sections the operator wrote themselves, keyed by router name.
 *
 * Distinct from the stash, and never cleared. The stash holds a section that
 * a setting took OUT and gives it back on the way in. `authored` records that
 * a section is the operator's work at all — migration moves a hand-written
 * rule into the block and removes the heading, so from the second run onward
 * there is nothing left in the file to recognise it by. Without this record
 * the packaged default quietly regenerates over their words, and "hand-written
 * rules win" is true exactly once.
 */
function authoredGet(config, name) {
  const authored = (config && config.authored) || {};
  return Object.prototype.hasOwnProperty.call(authored, name) ? authored[name] : undefined;
}

function authoredSet(home, name, body) {
  return editSub(home, 'authored', (authored) => { authored[name] = body; });
}

/**
 * Forget that a router's section is the operator's, and hand back the bytes
 * that were forgotten.
 *
 * The return value is the whole point. Adoption is the one act that replaces
 * words a person wrote, against a file with no version control behind it, so
 * the caller is given what it removed and is expected to park it — see
 * `drift.stashKey`. Returning `undefined` for a router that was never authored
 * keeps "nothing to adopt" from reading as "adopted an empty body".
 */
function authoredClear(home, name) {
  // Read and removed in ONE locked write, so the bytes handed back are the bytes removed.
  if (authoredGet(readConfig(home), name) === undefined) return undefined;
  let previous;
  editSub(home, 'authored', (authored, cur) => {
    previous = authoredGet(cur, name);
    delete authored[name];
  });
  return previous;
}

function stashGet(config, name) {
  const stash = (config && config.stash) || {};
  return Object.prototype.hasOwnProperty.call(stash, name) ? stash[name] : undefined;
}

function stashSet(home, name, body) {
  return editSub(home, 'stash', (stash) => { stash[name] = body; });
}

function stashClear(home, name) {
  return editSub(home, 'stash', (stash) => { delete stash[name]; });
}

/**
 * Routes the operator declared for skills outside the family — `routes.external`.
 *
 *   { "routes": { "external": { "<name>": { "triggers": [...], "skill"?, "line"? } } } }
 *
 * The family cannot know what a machine carries for media, data or anything else, and a
 * PUBLIC package naming one would ship a fact about one laptop as doctrine. So the
 * mechanism ships and the roster lives here, in a file the package never publishes.
 * Validation is `lib/triggers.js`'s (`routeProblems`): the hook that reads this must
 * fail silent, so an entry it cannot use is dropped there and refused here, loudly.
 */
function externalGet(config) {
  const routes = (config && config.routes) || {};
  const ext = routes.external;
  return ext && typeof ext === 'object' && !Array.isArray(ext) ? ext : {};
}

/** Merge `patch` into one declaration and write it; returns the declaration stored. */
function externalSet(home, name, patch) {
  return editSub(home, 'routes', (routes, cur) => {
    const external = Object.assign({}, externalGet(cur));
    external[name] = Object.assign({}, external[name], patch);
    routes.external = external;
    return external[name];
  });
}

/** Forget a declaration; returns what was forgotten, or `undefined`. */
function externalClear(home, name) {
  const has = (cfg) => Object.prototype.hasOwnProperty.call(externalGet(cfg), name);
  if (!has(readConfig(home))) return undefined;
  let previous;
  editSub(home, 'routes', (routes, cur) => {
    if (!has(cur)) return;                       // another writer cleared it first
    const external = Object.assign({}, externalGet(cur));
    previous = external[name];
    delete external[name];
    if (Object.keys(external).length) routes.external = external;
    else delete routes.external;
  }, true);
  return previous;
}

/**
 * Per-pack overrides of the shipped marks (`pack-marks.json`) — `visibility.hidePacks` and
 * `visibility.showPacks`, lists of `owner/repo`. Absent means the shipped mark decides;
 * `default` removes a pack from both lists, so the file keeps deviations only. The rule
 * that reads them is `packHidden` in lib/visibility.js (show beats hide beats the mark).
 */
function packOverridesGet(config) {
  const v = (config && config.visibility) || {};
  const list = (x) => (Array.isArray(x) ? x.slice() : []);
  return { hidePacks: list(v.hidePacks), showPacks: list(v.showPacks) };
}

function setPackOverride(home, pack, state) {
  const V = require('./visibility.js');
  // Validated before the lock is taken, so a typo never reaches the file.
  V.setPackOverride({}, pack, state);
  return editSub(home, 'visibility', (vis) => {
    const next = V.setPackOverride(vis, pack, state);
    for (const k of Object.keys(vis)) delete vis[k];
    Object.assign(vis, next);
  }, true);
}

module.exports = {
  packOverridesGet, setPackOverride,
  externalGet, externalSet, externalClear,
  configPath, readConfig, isEnabled, setRouter,
  authoredGet, authoredSet, authoredClear,
  stashGet, stashSet, stashClear, STATES,
  autoUpdateEnabled, setAutoUpdate,
};
