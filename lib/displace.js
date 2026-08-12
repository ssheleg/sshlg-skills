'use strict';
/**
 * Did something else overwrite the entries this pack wired?
 *
 * `hooks install` already parks a `statusLine` it displaced, so `remove` can hand
 * it back. Nothing watches the other direction: another installer editing
 * `~/.claude/settings.json` can drop or replace our entries, and the operator
 * finds out the next time they wonder why a hook stopped firing.
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
 * What is missing or altered, one row per entry.
 *
 * `state` is `missing` when nothing of ours is there at all and `altered` when an
 * entry exists under our path but no longer matches the plan — different repairs
 * and different stories, so they are not collapsed into "wrong".
 */
function check(settings, root) {
  const want = hooksLib.entries(root);
  const rows = [];

  for (const event of hooksLib.EVENTS) {
    const groups = ((settings && settings.hooks) || {})[event] || [];
    const mine = groups.filter((g) => (g.hooks || []).some((h) => hooksLib.isOurs(h.command, root)));
    if (!mine.length) rows.push({ key: event, state: 'missing' });
    else if (!mine.some((g) => same(g, want[event]))) rows.push({ key: event, state: 'altered' });
  }

  const sl = settings && settings.statusLine;
  if (!sl || !hooksLib.isOurs(sl.command, root)) {
    // Someone else legitimately holding it is a conflict `hooks install` already
    // reports and refuses to take. Only report it here when it is neither ours
    // nor anybody's — a key that was dropped rather than claimed.
    if (!sl) rows.push({ key: 'statusLine', state: 'missing' });
  } else if (!same(sl, want.statusLine)) {
    rows.push({ key: 'statusLine', state: 'altered' });
  }

  return rows;
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
