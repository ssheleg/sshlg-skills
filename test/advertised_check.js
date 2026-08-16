#!/usr/bin/env node
'use strict';
/**
 * Does one member still advertise every word the family's routing hook fires on?
 *
 * `test/triggers_test.js` already asserts this across all eight members, and that is one
 * repository too far away. B-54: `sheleg-design` 1.37.0 shipped green on 4636 checks
 * having dropped `фигма в код` from its description while that phrase was a live trigger
 * here. The member has no way to know the trigger table exists, the member releases
 * FIRST, and the umbrella found out minutes after the tag — costing a patch release and
 * leaving a window where the hook named a skill that no longer claimed the words.
 *
 * So the same assertion, addressable from a member's own gate:
 *
 *     node <umbrella>/test/advertised_check.js --member sheleg-design --root <checkout>
 *
 * **There is no second copy of the table.** This reads `lib/triggers.js` — the module the
 * hook itself calls — so a member cannot go green against a stale duplicate. A member run
 * standalone, with no umbrella above it, gets a disclosure rather than a pass: the caller
 * prints it and moves on, because a check that cannot look must never read as one that
 * looked.
 *
 * Exit 0 = every trigger is advertised, or the member has no routes at all.
 * Exit 1 = at least one trigger is a word the member no longer claims.
 * Exit 2 = could not look (bad arguments, missing SKILL.md, unparseable description).
 */
const fs = require('fs');
const path = require('path');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const member = arg('member');
const root = arg('root') || process.cwd();
if (!member) {
  console.error('blind: --member <name> is required');
  process.exit(2);
}

let ROUTES;
try {
  ({ ROUTES } = require(path.join(__dirname, '..', 'lib', 'triggers.js')));
} catch (e) {
  console.error(`blind: cannot load the routing table — ${e.message}`);
  process.exit(2);
}

/**
 * Every `{skill, triggers}` group this member owns, flattened across routes.
 *
 * A route may front several skills (`sheleg-dev` fronts five), and a member may be named
 * by several routes (`super-ux` by both `super-ux` and `copywriting`). Grouping by member
 * rather than by route is what lets one member ask one question.
 */
const groups = [];
for (const spec of Object.values(ROUTES)) {
  for (const g of spec.sources || [{ skill: spec.skill, triggers: spec.triggers }]) {
    if (g.skill.split('/')[0] === member) groups.push(g);
  }
}
if (!groups.length) {
  console.log(`ok: ${member} carries no routed triggers`);
  process.exit(0);
}

/**
 * The `description` of a shipped SKILL.md, whitespace-collapsed.
 *
 * Collapsed for the reason `triggers_test.js` collapses it: a folded scalar is hard-
 * wrapped, so an advertised phrase can land across a line break. Matching the raw string
 * would make the WRAPPING load-bearing and reject a phrase the skill does advertise.
 */
function description(skillName) {
  const base = path.join(root, 'plugins');
  if (!fs.existsSync(base)) return { err: `no plugins/ under ${root}` };
  for (const plugin of fs.readdirSync(base)) {
    const file = path.join(base, plugin, 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const fm = /^---\n([\s\S]*?)\n---/.exec(text);
    if (!fm) return { err: `${skillName}: no front matter` };
    const d = /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
    const desc = (d ? d[1] : '').toLowerCase().replace(/\s+/g, ' ');
    // The same 200-char floor triggers_test.js uses. A description that "parses" to one
    // line of fifteen would pass every trigger against a fragment and prove nothing —
    // that exact defect shipped here on 2026-08-14.
    if (desc.length <= 200) return { err: `${skillName}: description parsed to ${desc.length} chars` };
    return { desc };
  }
  return { err: `${skillName}: no shipped SKILL.md under ${base}` };
}

const missing = [];
for (const g of groups) {
  const name = g.skill.split('/')[1];
  const { desc, err } = description(name);
  if (err) {
    console.error(`blind: ${err}`);
    process.exit(2);
  }
  for (const t of g.triggers) if (!desc.includes(t)) missing.push(`${name}: ${JSON.stringify(t)}`);
}

if (missing.length) {
  console.error(
    // No `FAIL:` prefix — the caller labels its own failures, and a member validator
    // that prefixes too printed `FAIL: FAIL:` the first time this was wired.
    `the family's routing hook fires on ${missing.length} word(s) ${member} no longer advertises:`
  );
  for (const m of missing) console.error(`  - ${m}`);
  console.error(
    '\nThe hook would name this skill for a phrase its own description does not claim.\n' +
    'Either restore the wording, or drop the trigger in the umbrella FIRST — the member\n' +
    'releases before the umbrella re-pins, so the umbrella cannot be the one to notice.'
  );
  process.exit(1);
}
const n = groups.reduce((a, g) => a + g.triggers.length, 0);
console.log(`ok: ${member} advertises all ${n} routed trigger(s) across ${groups.length} skill(s)`);
