#!/usr/bin/env node
'use strict';
/**
 * `SessionStart` — the pointer, the session's name, and anything the session
 * needs told that no other event has a channel for.
 *
 * Three payloads, and each is small on purpose:
 *
 * - `additionalContext` — the ~90-token pointer saying the family's routing block
 *   is not advisory. A pack that prints its whole doctrine into every session is
 *   the 854-token cost this family measured elsewhere and removed; the block
 *   already carries the content and loads in the same session. What it lacks is
 *   the salience of arriving last, and that is all this supplies.
 * - `sessionTitle` — the open run's topic. The reference says this field is
 *   ignored on `clear` and `compact`, so it is emitted only where it lands.
 * - `watchPaths` — the run ledger, so `FileChanged` can say when a stage moves.
 *
 * It also reports what `hooks/config-change.js` could only write down: that event
 * discards every channel it has, so the notice waits here for a hook that can
 * speak.
 *
 * Plain stdout would be enough for context alone. The JSON form is used because
 * the other two fields have no other spelling.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const LIB = path.join(__dirname, '..', 'lib');


let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const home = os.homedir();
    const triggers = require(path.join(LIB, 'triggers.js'));

    const context = [triggers.sessionNote()];
    const out = { hookEventName: 'SessionStart' };

    // What ConfigChange noticed and had no way to say.
    try {
      const configLib = require(path.join(LIB, 'config.js'));
      const displace = require(path.join(LIB, 'displace.js'));
      const parked = configLib.stashGet(configLib.readConfig(home), 'displaced:entries');
      const text = parked ? displace.render(JSON.parse(parked)) : '';
      if (text) context.push(text);
    } catch (e) { /* a notice that cannot be read is not worth a broken session */ }

    // Who else speaks before the first prompt. One line, and only when there is
    // somebody: the routing block says another pack's mandate does not outrank the
    // map, and until now nothing on the machine could say whether such a pack was
    // switched on. `lib/injectors.js` decides; this only reads the registry.
    try {
      const inj = require(path.join(LIB, 'injectors.js'));
      const text = inj.line(inj.injectors(...inj.readRegistry(home)));
      if (text) context.push(text);
    } catch (e) { /* an unreadable plugin registry means no claim, not a wrong one */ }

    // One small file per session accumulates forever otherwise — the kind of
    // litter nobody notices until it is thousands of files.
    try {
      require(path.join(LIB, 'turnstate.js')).prune(home, Date.now(), 1000 * 60 * 60 * 24 * 7);
    } catch (e) { /* nothing to prune is the normal case */ }

    const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const ledgerPath = path.join(cwd, '.task-pipeline', 'run.md');
    if (fs.existsSync(ledgerPath)) {
      out.watchPaths = [ledgerPath];
      // `clear` and `compact` are documented to ignore a title; sending one there
      // would be a field that silently does nothing.
      if (['startup', 'resume', 'fork'].includes(data.source)) {
        const ledger = require(path.join(LIB, 'runledger.js'));
        const topic = ledger.parse(fs.readFileSync(ledgerPath, 'utf8')).topic;
        if (topic) out.sessionTitle = topic.slice(0, 60);
      }
    }

    out.additionalContext = context.join('\n\n');
    process.stdout.write(JSON.stringify({ hookSpecificOutput: out }) + '\n');
  } catch (e) {
    /* Silence, deliberately: a session must start even when this file is wrong. */
  }
  process.exit(0);
});
