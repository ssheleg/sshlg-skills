'use strict';
/**
 * The family's map — what goes into the managed block above the routers.
 *
 * The routers say WHEN to route. Until this existed, nothing said WHAT the
 * agent had: the block named 6 of 20 commands, 8 of 19 skills and 6 of 8
 * members, and `sheleg-dev` and `agent-stack` — six skills between them —
 * appeared nowhere at all. An agent that installed the whole pack learned
 * eight rules about an inventory it could not see.
 *
 * **A map, deliberately, and not a catalogue.** Claude Code already places
 * every skill's name and description in front of the agent; copying them here
 * would put one fact in two homes, and the copy in the operator's global
 * instructions is the one that goes stale — while costing context in every
 * session of every project. What no harness derives is the shape: the single
 * command that starts each member, the one line saying what it closes, and the
 * order they compose in. That is what the block is for.
 *
 * **`entry` is declared, never derived.** super-ux's entry point is `/ux` and
 * its member name is `super-ux`; no rule over the name produces that. A map
 * whose entry points are guessed is worse than no map, because it sends an
 * agent to a command that does not exist and does it authoritatively — so an
 * entry that is not a slash command is refused here rather than rendered.
 *
 * Pure, like `routers.js`, `drift.js` and `plan.js`: it is handed the registry
 * and returns text. A fixture asserts it never reaches the filesystem.
 */

/**
 * `[member] -> [{ name, entry, role }]`, one row per member, registry order.
 *
 * A member with no command is reached by description rather than by typing
 * something, so its cell names the skill ids instead. An empty cell would read
 * as "nothing here", which is exactly wrong for the two members that carry six
 * skills and no command.
 */
function mapRows(members) {
  return (members || []).map((m) => {
    if (!m.role) throw new Error(`${m.name}: role is required — it is the column the map exists for`);
    if (m.entry && String(m.entry).charAt(0) !== '/') {
      throw new Error(`${m.name}: entry ${JSON.stringify(m.entry)} must start with "/" — a map that names a command that does not exist is worse than no map`);
    }
    const ids = m.skillNames || [];
    if (!m.entry && !ids.length) {
      throw new Error(`${m.name}: has neither an entry command nor skill ids, so its row would say nothing`);
    }
    return {
      name: m.name,
      entry: m.entry ? '`' + m.entry + '`' : ids.map((s) => '`' + s + '`').join(', '),
      role: m.role,
    };
  });
}

/** The map as a markdown table. Rows start with a backticked member name. */
function renderMap(members) {
  const rows = mapRows(members);
  return [
    '| Member | Entry | What it closes |',
    '|---|---|---|',
  ].concat(rows.map((r) => `| \`${r.name}\` | ${r.entry} | ${r.role} |`)).join('\n');
}

module.exports = { mapRows, renderMap };
