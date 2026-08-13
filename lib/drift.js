'use strict';
/**
 * Where the operator's wording has diverged from the packaged wording.
 *
 * `authored` exists so a hand-written rule survives every later run: the block
 * is written into a file the operator owns and did not write, and a packaged
 * default regenerating over their words is the failure this repository already
 * recorded once (`docs/evidence/retro.md`, 2026-08-06, defect 2).
 *
 * The cost is on the other side of the same mechanism. `bin/sshlg-skills.js`
 * uses the packaged text **only when the section is missing entirely**, so a
 * router reworded in a later release never reaches a machine that has authored
 * text — and nothing says so. The pack keeps shipping doctrine that stops at
 * one config file, and the operator finds out by reading two files side by
 * side, which nobody schedules.
 *
 * So this module reports and never applies. Adoption is a separate, named act
 * (`routers --adopt <name>`), it is per router, and the wording it replaces is
 * stashed rather than dropped. **The operator's word still wins; silence stops
 * being the decision.**
 *
 * Pure by construction, like `routers.js` beside it: both sides are handed in,
 * so the comparison is provable without a HOME. A fixture asserts the absence
 * of `require('fs')` here, because the thing that makes this testable is the
 * thing an added convenience would quietly remove.
 */

/**
 * The stash key adoption parks the replaced wording under.
 *
 * Deliberately NOT the router name. The stash's own entries are what a
 * setting took out and gives back when the router is switched on again; if
 * adoption wrote there too, an off/on round-trip would return the wording
 * adoption had just replaced, and the toggle would undo a decision it knows
 * nothing about. The `superseded:` entries already in that file establish the
 * prefix convention this follows.
 */
function stashKey(name) {
  return `adopted:${name}`;
}

/**
 * Trailing whitespace is settled by the block writer, not by the operator.
 * Counting it would give every machine a drift row it could never clear, and a
 * report that cannot be cleared is trained into noise inside one release.
 */
function comparable(body) {
  return String(body === undefined || body === null ? '' : body).replace(/\s+$/, '');
}

/**
 * `{ packaged, authored } -> [{ name, authored, packaged }]`
 *
 * - `packaged` is the registry's text for the routers **in scope on this
 *   machine**, in registry order. Iterating it rather than `authored` is what
 *   keeps a router out of the report when its member is not installed: there
 *   is no section in the file, so there is no divergence to decide about.
 * - Order follows `packaged`, which is the order the block renders and the
 *   README table prints. A report in config-file order would be a third
 *   ordering of the same eight things.
 */
function diverged(opts) {
  const o = opts || {};
  const packaged = o.packaged || {};
  const authored = o.authored || {};
  const out = [];
  for (const name of Object.keys(packaged)) {
    if (!Object.prototype.hasOwnProperty.call(authored, name)) continue;
    if (comparable(authored[name]) === comparable(packaged[name])) continue;
    out.push({ name, authored: authored[name], packaged: packaged[name] });
  }
  return out;
}

module.exports = { diverged, stashKey, comparable };
