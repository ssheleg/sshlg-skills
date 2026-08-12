'use strict';
/**
 * Wiring the family's hooks into `~/.claude/settings.json`.
 *
 * Seven events and a status line, and each one earns its cost differently:
 *
 * - `SessionStart` — one ~90-token pointer saying the routing block is not
 *   advisory, plus the session's title and the paths worth watching. This is the
 *   mechanism this family measured at 854 tokens in another pack and switched
 *   off, so the size is the design, not an accident.
 * - `UserPromptSubmit` — names the route a prompt asks for, and prints nothing
 *   on the turns that are most of them.
 * - `PreToolUse` — the half that HOLDS: a copy before any write to a file the
 *   operator cannot recover, and a refusal for the one command that has silently
 *   pinned a skill at an old version on this machine before.
 * - `PostToolUse` — what could only be checked after the fact: shadowing copies,
 *   and the config `obsidian-wiki setup` truncates on every run.
 * - `Notification` — a desktop ping during an autonomous run.
 * - `ConfigChange` — notices when something else overwrites these very entries.
 *   It cannot report at the time (the event discards every channel it has), so it
 *   records and `SessionStart` speaks.
 * - `FileChanged` — the run ledger advancing a stage, said once.
 * - `statusLine` — where the pipeline is, read from the ledger it already keeps.
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

/**
 * Every event we wire, its matcher, and the script behind it.
 *
 * One table, because the previous shape listed the events inside `plan()` and
 * again inside `removal()`: two lists that agree until someone adds an event to
 * one of them, and then `remove` silently stops being an undo.
 */
const WIRED = [
  // `resume` and `fork` join the original three: without them a resumed session
  // gets no routing pointer at all, and `sessionTitle` — which the reference says
  // is ignored on `clear` and `compact` — would have no event that can carry it.
  { event: 'SessionStart', matcher: 'startup|clear|compact|resume|fork', script: 'session-start' },
  { event: 'UserPromptSubmit', matcher: null, script: 'user-prompt-submit' },
  { event: 'PreToolUse', matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', script: 'pre-tool-use' },
  { event: 'PostToolUse', matcher: 'Bash', script: 'post-tool-use' },
  { event: 'Notification', matcher: 'idle_prompt|agent_completed', script: 'notification' },
  { event: 'ConfigChange', matcher: 'user_settings', script: 'config-change' },
  // FileChanged's matcher is a filename, not a tool name. The watch list itself
  // arrives from SessionStart's `watchPaths`, because the ledger lives at
  // `.task-pipeline/run.md` and this matcher can only name files in the cwd.
  { event: 'FileChanged', matcher: 'run.md', script: 'file-changed' },
];

/** The events, in wiring order. */
const EVENTS = WIRED.map((w) => w.event);

/** Kept for readers of the previous shape: the `SessionStart` matcher. */
const MATCHER = WIRED[0].matcher;

/** Where the wired copy lives, relative to home. */
const RUNTIME = ['.sshlg-skills', 'runtime'];

/**
 * The directory the settings entries point at — never the package directory.
 *
 * `npx sshlg-skills hooks install` runs from npm's cache, which npx is free to
 * clean. Wiring that path produces hooks that work until the cache is pruned and
 * then fail silently on every prompt, which is worse than not installing them.
 * So `install` copies `hooks/` and `lib/` into the operator's own directory and
 * wires THAT — the same reason the routing block is written into a file the
 * operator keeps rather than referenced from wherever the pack happened to run.
 */
function runtimeDir(home) {
  return require('path').join(home, ...RUNTIME);
}

/** The entries, keyed by what they hook. */
function entries(root) {
  const script = (name) => `node "${root}/hooks/${name}.js"`;
  const out = {};
  for (const w of WIRED) {
    const group = { hooks: [{ type: 'command', command: script(w.script), shell: 'bash', async: false }] };
    if (w.matcher) group.matcher = w.matcher;
    // Matcher first, so a human diffing settings.json reads what it matches
    // before what it runs.
    out[w.event] = w.matcher
      ? { matcher: w.matcher, hooks: group.hooks }
      : { hooks: group.hooks };
  }
  out.statusLine = { type: 'command', command: script('statusline') };
  return out;
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

  for (const event of EVENTS) {
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
    const merged = others.concat([want[event]]);
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

  for (const event of EVENTS) {
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
  const rows = EVENTS.map((e) => {
    const m = w[e].matcher ? `   (matcher: ${w[e].matcher})` : '';
    return `${e.padEnd(17)}${w[e].hooks[0].command}${m}`;
  });
  rows.push(`${'statusLine'.padEnd(17)}${w.statusLine.command}`);
  return rows;
}

module.exports = {
  plan, removal, describe, entries, isOurs, runtimeDir,
  WIRED, EVENTS, MATCHER, RUNTIME,
};
