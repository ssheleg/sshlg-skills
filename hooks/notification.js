#!/usr/bin/env node
'use strict';
/**
 * `Notification` — a desktop ping while a long run is unattended.
 *
 * This event has exactly one channel. The reference states that Claude Code
 * discards a Notification hook's `systemMessage` and `continue`, and the event is
 * not among those that deliver `additionalContext` — `terminalSequence` is all
 * there is, and Claude Code writes it through its own terminal path because a
 * hook has no controlling terminal to write to.
 *
 * Wired for `idle_prompt` and `agent_completed` only. `permission_prompt` is
 * deliberately absent: a ping on every permission ask is a ping that gets muted,
 * and then the two that matter are muted with it.
 *
 * The sequence is built and validated in `lib/notify.js`, which refuses to emit
 * anything outside the documented OSC allowlist — Claude Code silently ignores
 * such a field, so a module that built one would ship a dead feature.
 */

const path = require('path');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};

    // The unattended set update, and `idle_prompt` is the whole reason it sits
    // here rather than in SessionStart: skills load AT session start, so an
    // update landing there reaches the operator only next session anyway — the
    // notice already does that, without a session start that waits on npm. Idle
    // costs nothing. Decided in lib/updatecheck.js; this only spawns.
    try {
      const kind = data.matcher || data.notification_type;
      if (kind === 'idle_prompt') {
        const os = require('os');
        const fs = require('fs');
        const LIB = path.join(__dirname, '..', 'lib');
        const chk = require(path.join(LIB, 'updatecheck.js'));
        const home = os.homedir();
        const cfg = require(path.join(LIB, 'config.js')).readConfig(home);
        let st = {};
        try {
          st = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'state.json'), 'utf8'));
        } catch (e) { st = {}; }
        const cache = Object.assign({}, st.updateCheck,
          { self: require(path.join(__dirname, '..', 'package.json')).version });
        if (chk.shouldAutoUpdate(cfg, cache, Date.now()).run) {
          const { spawn } = require('child_process');
          const run = spawn(process.execPath, [path.join(LIB, 'updaterun.js')],
            { detached: true, stdio: 'ignore' });
          run.unref();
        }
      }
    } catch (e) { /* an update that could not start is not a broken notification */ }
    const notify = require(path.join(__dirname, '..', 'lib', 'notify.js'));
    const seq = notify.sequence(data);
    if (seq) process.stdout.write(JSON.stringify({ terminalSequence: seq }) + '\n');
  } catch (e) {
    /* Silence: a notification is never worth costing someone their turn. */
  }
  process.exit(0);
});
