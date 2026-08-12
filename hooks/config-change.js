#!/usr/bin/env node
'use strict';
/**
 * `ConfigChange` — notice that someone rewrote the entries this pack wired.
 *
 * **This hook cannot tell anybody anything, and that is not a design choice.**
 * The reference states the event discards `systemMessage` and `continue`, it is
 * absent from the list of events that deliver `additionalContext`, and a change it
 * blocks "surfaces no message to you or to Claude" — only a debug-log line. So
 * the honest shape is: record now, report later. `hooks/session-start.js` has a
 * channel and speaks on the next session.
 *
 * **Nothing is blocked.** The operator's settings file is theirs; another
 * installer editing it is not an attack, and refusing the edit would be this pack
 * arbitrating a file it does not own. The value here is that the change stops
 * being invisible.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const LIB = path.join(__dirname, '..', 'lib');

/** Where the notice waits for a hook that can speak. */
const KEY = 'displaced:entries';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    if (data.source !== 'user_settings') return process.exit(0);

    const home = os.homedir();
    const hooksLib = require(path.join(LIB, 'hooks.js'));
    const displace = require(path.join(LIB, 'displace.js'));
    const configLib = require(path.join(LIB, 'config.js'));

    const file = data.file_path || path.join(home, '.claude', 'settings.json');
    // An unparseable settings file is mid-edit, not displaced. Reporting it would
    // fire on every keystroke of a hand edit.
    let settings;
    try { settings = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (e) { return process.exit(0); }

    const rows = displace.check(settings, hooksLib.runtimeDir(home));
    if (!rows.length) {
      // Repaired since the last notice — clear it, or the next session reports a
      // displacement that no longer exists.
      if (configLib.stashGet(configLib.readConfig(home), KEY)) configLib.stashClear(home, KEY);
      return process.exit(0);
    }
    configLib.stashSet(home, KEY,
      JSON.stringify(displace.record(rows, new Date().toISOString())));
  } catch (e) {
    /* Silence, deliberately. */
  }
  process.exit(0);
});
