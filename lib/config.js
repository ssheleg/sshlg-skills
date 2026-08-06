'use strict';
/**
 * The pack's settings — which routers this machine wants.
 *
 * Shape:
 *
 *   {
 *     "routers": { "seo-llmo": "off" },
 *     "stash":   { "task-pipeline": "…the section body that was removed…" }
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
  const config = readConfig(home);
  const routers = Object.assign({}, config.routers);
  if (state === 'off') routers[name] = 'off';
  else delete routers[name];
  return store.writeJson(configPath(home), { routers });
}

function stashGet(config, name) {
  const stash = (config && config.stash) || {};
  return Object.prototype.hasOwnProperty.call(stash, name) ? stash[name] : undefined;
}

function stashSet(home, name, body) {
  const config = readConfig(home);
  const stash = Object.assign({}, config.stash);
  stash[name] = body;
  return store.writeJson(configPath(home), { stash });
}

function stashClear(home, name) {
  const config = readConfig(home);
  const stash = Object.assign({}, config.stash);
  delete stash[name];
  return store.writeJson(configPath(home), { stash });
}

module.exports = {
  configPath, readConfig, isEnabled, setRouter,
  stashGet, stashSet, stashClear, STATES,
};
