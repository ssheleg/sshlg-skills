'use strict';

/**
 * How the next version reaches this machine — said out loud, because not saying it is
 * itself a choice and the choice is "never".
 *
 * Claude Code carries a per-marketplace `autoUpdate` flag in
 * `~/.claude/plugins/known_marketplaces.json`. It is real and it is **not in the
 * documented settings surface** — the `/plugin` UI writes it, and third-party installers
 * write it directly: `vercel-labs/plugins` prompts `Enable auto-updates? [Y/n]`, defaults
 * to yes, and asks only when the marketplace is new and the install did not go through the
 * official CLI. Measured here 2026-08-28: of 20 marketplaces on one machine, the 2
 * installed by that tool carry `autoUpdate: true` and 18 have no such key, because
 * `claude plugin marketplace add` never sets it.
 *
 * **This family leaves it off deliberately, and that is the part worth writing down.**
 * The nine packs are released and pinned as a set; `skills.json` says which versions belong
 * together and the launcher refuses a per-member argument for the same reason. Per-
 * marketplace auto-update updates each one on its own clock, so a machine drifts into a
 * combination nobody tested — which is precisely the failure the launcher exists to
 * prevent. For a pack that stands alone the flag is the better answer; for a family that
 * composes it is not.
 *
 * So the installer states the model, and reports it when somebody has turned the flag on
 * behind its back. Reporting rather than reverting: the file belongs to the operator and
 * to Claude Code, and silently rewriting somebody's setting is how a tool loses trust.
 */

const FAMILY_LINE = 'npx sshlg-skills@latest update';

/** The notice, as lines. Pure — no filesystem, no HOME, so a fixture can read every word. */
function notice(mode, findings) {
  const on = (findings && findings.on) || [];
  const out = [];
  out.push('');
  out.push('== How the next version arrives ==');
  out.push(`  ${FAMILY_LINE}`);
  out.push('');
  out.push('  Auto-update is OFF for these packs on purpose. They are pinned and released');
  out.push('  as a set, so updating one on its own clock leaves a combination nobody');
  out.push('  tested — the same reason this launcher takes no member argument.');
  if (mode === 'install') {
    out.push('  Nothing checks for you: run the line above when you want the next set.');
  }
  if (on.length) {
    out.push('');
    out.push(`  NOTE: auto-update is enabled on ${on.length} of this family's marketplaces —`);
    out.push(`  ${on.join(', ')}`);
    out.push('  Claude Code will move those independently of the rest. Nothing here changed');
    out.push('  it: turn it off in /plugin if you want the set to move together.');
  }
  return out;
}

/**
 * Which of this family's marketplaces have the flag on.
 *
 * The single impure function here, and the same split `injectors.js` and `conflicts.js`
 * use: the rule ships to every operator, the roster is a fact about one machine and is
 * read at the moment it is needed. An unreadable or absent file is not an error — a
 * machine with no plugins installed has nothing to report, and a notice that failed the
 * install over a missing JSON file would be worse than the drift it warns about.
 */
function autoUpdateState(home, marketplaces) {
  const wanted = new Set(marketplaces || []);
  const on = [];
  try {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(home, '.claude', 'plugins', 'known_marketplaces.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [name, entry] of Object.entries(data || {})) {
      if (!wanted.has(name)) continue;
      if (entry && entry.autoUpdate === true) on.push(name);
    }
  } catch (e) {
    return { on: [], read: false };
  }
  return { on: on.sort(), read: true };
}

module.exports = { notice, autoUpdateState, FAMILY_LINE };
