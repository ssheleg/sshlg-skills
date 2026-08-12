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
    const notify = require(path.join(__dirname, '..', 'lib', 'notify.js'));
    const seq = notify.sequence(data);
    if (seq) process.stdout.write(JSON.stringify({ terminalSequence: seq }) + '\n');
  } catch (e) {
    /* Silence: a notification is never worth costing someone their turn. */
  }
  process.exit(0);
});
