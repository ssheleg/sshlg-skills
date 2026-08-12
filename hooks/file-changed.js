#!/usr/bin/env node
'use strict';
/**
 * `FileChanged` — the run ledger moved, said once.
 *
 * The status line already renders the ledger on every paint, which answers "where
 * am I" when you look. This answers "something happened" when you are not looking:
 * a stage flipping during a long autonomous run is exactly the moment worth a
 * line, and the only moment the status line cannot supply, because nothing about
 * it distinguishes a repaint from a change.
 *
 * The watch list arrives from `SessionStart`'s `watchPaths` — this event's own
 * matcher can only name files in the working directory, and the ledger lives at
 * `.task-pipeline/run.md`. The matcher (`run.md`) then filters which hook groups
 * run against the changed file's basename.
 *
 * The event has no decision control and cannot block a file change, which is
 * correct for it. `systemMessage` is delivered as a brief terminal notification.
 */

const path = require('path');
const fs = require('fs');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const file = data.file_path || '';
    if (path.basename(file) !== 'run.md') return process.exit(0);
    // A deleted ledger is a finished or abandoned run, not a stage advance.
    if (data.event === 'unlink' || !fs.existsSync(file)) return process.exit(0);

    const ledger = require(path.join(__dirname, '..', 'lib', 'runledger.js'));
    const line = ledger.render(fs.readFileSync(file, 'utf8'));
    if (line) process.stdout.write(JSON.stringify({ systemMessage: line }) + '\n');
  } catch (e) {
    /* Silence, deliberately. */
  }
  process.exit(0);
});
