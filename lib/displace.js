'use strict';
/**
 * Did something else overwrite the entries this pack wired?
 *
 * `hooks install` already parks a `statusLine` it displaced, so `remove` can hand
 * it back. Nothing watches the other direction: another installer editing
 * `~/.claude/settings.json` can rewrite our entries, and the operator finds out
 * the next time they wonder why a hook stopped firing. (An entry dropped outright
 * looks exactly like one the operator removed, so it is not nagged about; see
 * `check()`.)
 *
 * **`ConfigChange` cannot report this, and that shapes the whole design.** The
 * reference is explicit: the event discards `systemMessage` and `continue`, it is
 * not in the list of events that deliver `additionalContext`, and a blocked change
 * "surfaces no message to you or to Claude" — only a debug-log line. So the hook
 * that notices **records**, and `SessionStart`, which does have a channel, reports
 * it on the next session.
 *
 * The expectation comes from `lib/hooks.js` — the single home for what we wire —
 * so a renamed entry cannot leave the detector describing a plan nobody installs.
 */

const hooksLib = require('./hooks.js');

/** Deep-equal enough for settings fragments, which are JSON by construction. */
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * What is altered, one row per entry: `{key, state: 'altered', reason}`.
 *
 * **The same rule as `update`** (fix round 2, A): the rows are exactly the entries a
 * refresh (`hooks.plan(..., {refreshOnly: true})`) would change, with the field that
 * differs. So a field the operator added to our entry (a `timeout`, a `padding`) is not a
 * displacement, and the repair this notice names cannot delete it.
 *
 * **An entry that is gone is not reported.** Another installer dropping our entry and the
 * operator removing it by hand leave the same file, and a notice at every session start
 * whose named repair (`hooks install`) puts it back would overrule the operator's removal.
 * `hooks status` lists such entries on demand as "not wired here"; a status line somebody
 * else holds is `hooks install`'s conflict, already reported there.
 */
function check(settings, root) {
  return hooksLib.plan(settings || {}, root, { refreshOnly: true }).reasons
    .map((r) => ({ key: r.event, state: 'altered', reason: r.reason }));
}

/** The record `ConfigChange` writes down for the next session to read. */
function record(rows, at) {
  return { at, entries: rows.map((r) => `${r.key}:${r.state}`) };
}

/**
 * What `SessionStart` says about a recorded displacement, or `''`.
 *
 * One line plus the repair. A report with no command is a report that turns into
 * a support question.
 */
function render(rec) {
  if (!rec || !rec.entries || !rec.entries.length) return '';
  return [
    `[sshlg-skills] settings.json changed and ${rec.entries.length} of this pack's ` +
      `entries no longer match what it wired (${rec.entries.join(', ')})` +
      (rec.at ? ` — noticed ${rec.at}` : '') + '.',
    'Repair: `npx sshlg-skills hooks install`. Nothing was blocked or rewritten.',
  ].join('\n');
}

module.exports = { check, record, render, same };
