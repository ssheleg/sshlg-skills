'use strict';
/**
 * The packaged router texts — a façade over `routers-registry.js`.
 *
 * These are defaults, not the truth. Where the operator already wrote a rule
 * by hand, migration moves their wording in and these are never used — a rule
 * someone wrote in their own words is followed, and a rule that arrived as
 * boilerplate is skimmed.
 *
 * The declarations moved to `routers-registry.js`, where a router's text, its
 * table row and the members it needs live in one entry. This file stays as
 * the import path callers already use, so the move cost nobody a rewrite.
 */

const registry = require('./routers-registry.js');

/**
 * The named exports, DERIVED — `agent-stack` → `AGENT_STACK`.
 *
 * This block was nine hand-written destructurings and nine hand-written
 * constants, and the tenth router shipped without either: nothing consumed
 * `AGENT_STACK`, so nothing went red, and the façade quietly served nine of
 * ten. That is the third hand-kept copy of the router list found in one day —
 * the README table, a fixture's member list and this — so it is derived like
 * `BY_MEMBER` below rather than extended.
 */
const NAMED = registry.order().reduce((acc, name) => {
  acc[name.toUpperCase().replace(/-/g, '_')] = registry.REGISTRY[name].text;
  return acc;
}, {});

/**
 * Skill name in `skills.json` → the routers it makes available.
 *
 * Derived from the registry rather than hand-kept: a router listed here but
 * missing there was exactly the drift the registry exists to end.
 */
const BY_MEMBER = registry.order().reduce((acc, name) => {
  for (const member of registry.REGISTRY[name].requires) {
    acc[member] = acc[member] || {};
    acc[member][name] = registry.REGISTRY[name].text;
  }
  return acc;
}, {});

/**
 * The routers contributed by the members actually installed.
 *
 * Routers with no required member (`seo-llmo`, `evidence-docs`) are rules
 * rather than skills, so they are always included: they hold whether or not
 * anything is installed, which is why a router stopped being a property of a
 * member in the first place.
 */
function forMembers(names) {
  return registry.resolve({ installed: names || [] });
}

module.exports = { ...NAMED, BY_MEMBER, forMembers };
