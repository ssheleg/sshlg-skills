'use strict';
/**
 * Wiring the family's hooks into `~/.claude/settings.json`.
 *
 * Three entries, and each one earns its cost differently:
 *
 * - `SessionStart` — one ~90-token pointer saying the routing block is not
 *   advisory. This is the mechanism this family measured at 854 tokens in
 *   another pack and switched off, so the size is the design, not an accident.
 * - `UserPromptSubmit` — names the route a prompt asks for, and prints nothing
 *   on the turns that are most of them.
 * - `statusLine` — where the pipeline is, read from the run ledger it already
 *   keeps.
 *
 * **The operator's file wins.** A `statusLine` already set by something else is
 * never silently replaced: `plan()` reports the conflict and the caller decides.
 * The one thing this module will not do is take a setting it did not put there
 * and lose what was in it — that is how a person discovers their configuration
 * changed by noticing it is gone.
 *
 * Pure. `plan()` computes the edit and `describe()` explains it; writing is
 * `bin/sshlg-skills.js`'s job, through `protect()`, because this pack does not
 * get a second path to the operator's files.
 */

const MATCHER = 'startup|clear|compact';

/** The three entries, keyed by what they hook. */
function entries(root) {
  const script = (name) => `node "${root}/hooks/${name}.js"`;
  return {
    SessionStart: {
      matcher: MATCHER,
      hooks: [{ type: 'command', command: script('session-start'), shell: 'bash', async: false }],
    },
    UserPromptSubmit: {
      hooks: [{ type: 'command', command: script('user-prompt-submit'), shell: 'bash', async: false }],
    },
    statusLine: { type: 'command', command: script('statusline') },
  };
}

/** Is this entry one of ours? Matched by path, so a rename is a fresh install. */
function isOurs(command, root) {
  return typeof command === 'string' && command.includes(`${root}/hooks/`);
}

/**
 * The edit to make, and what it would displace.
 *
 * Returns `{settings, changed, conflicts}`. `conflicts` lists settings owned by
 * someone else that the requested install would overwrite; the caller refuses on
 * those unless `force` is set, so replacing another tool's status line is always
 * a decision somebody made out loud.
 */
function plan(current, root, opts) {
  const o = opts || {};
  const next = JSON.parse(JSON.stringify(current || {}));
  const want = entries(root);
  const conflicts = [];
  const changed = [];

  for (const event of ['SessionStart', 'UserPromptSubmit']) {
    next.hooks = next.hooks || {};
    const existing = next.hooks[event] || [];
    // Ours is replaced in place; anyone else's is left beside it. Two packs can
    // both hook SessionStart, and dropping the other one is not this pack's call.
    const others = existing.filter(
      (m) => !(m.hooks || []).some((h) => isOurs(h.command, root))
    );
    const mine = existing.filter(
      (m) => (m.hooks || []).some((h) => isOurs(h.command, root))
    );
    const desired = [want[event]];
    const merged = others.concat(desired);
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      changed.push(mine.length ? `${event} (refreshed)` : `${event} (added)`);
    }
    next.hooks[event] = merged;
  }

  const sl = next.statusLine;
  if (sl && sl.command && !isOurs(sl.command, root)) {
    conflicts.push({
      key: 'statusLine',
      held_by: sl.command,
      note: 'a status line set by something else — replacing it loses what it printed',
    });
    if (o.force) {
      next.statusLine = want.statusLine;
      changed.push('statusLine (replaced)');
    }
  } else if (JSON.stringify(sl) !== JSON.stringify(want.statusLine)) {
    next.statusLine = want.statusLine;
    changed.push(sl ? 'statusLine (refreshed)' : 'statusLine (added)');
  }

  return { settings: next, changed, conflicts };
}

/** The edit that removes ours and leaves everything else exactly as it was. */
function removal(current, root) {
  const next = JSON.parse(JSON.stringify(current || {}));
  const changed = [];

  for (const event of ['SessionStart', 'UserPromptSubmit']) {
    if (!next.hooks || !next.hooks[event]) continue;
    const kept = next.hooks[event].filter(
      (m) => !(m.hooks || []).some((h) => isOurs(h.command, root))
    );
    if (kept.length !== next.hooks[event].length) changed.push(event);
    // An empty array is not the same as an absent key to every reader of this
    // file, so the key goes when nothing is left in it.
    if (kept.length) next.hooks[event] = kept;
    else delete next.hooks[event];
  }
  if (next.hooks && !Object.keys(next.hooks).length) delete next.hooks;

  if (next.statusLine && isOurs(next.statusLine.command, root)) {
    delete next.statusLine;
    changed.push('statusLine');
  }
  return { settings: next, changed };
}

/** One line per entry, for the report a run prints about itself. */
function describe(root) {
  const w = entries(root);
  return [
    `SessionStart     ${w.SessionStart.hooks[0].command}   (matcher: ${MATCHER})`,
    `UserPromptSubmit ${w.UserPromptSubmit.hooks[0].command}`,
    `statusLine       ${w.statusLine.command}`,
  ];
}

module.exports = { plan, removal, describe, entries, isOurs, MATCHER };
