#!/usr/bin/env node
'use strict';
/**
 * `UserPromptSubmit` — name the route the prompt is asking for, or say nothing.
 *
 * Claude Code passes the hook a JSON payload on stdin and treats this script's
 * stdout as extra context for the turn. So stdout is a budget: everything
 * printed here is paid on this turn, and printing on a turn that did not need it
 * is how an operator learns to stop reading the line.
 *
 * All of the deciding happens in `lib/triggers.js`, which is pure and fixtured.
 * This file only moves bytes, and it fails silent by design: a hook that errors
 * on a malformed payload would break every prompt in the session, and it is a
 * routing hint — never worth costing someone their turn.
 */

const path = require('path');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    // The payload's field name has changed across Claude Code versions, and a
    // hook that knows only one of them goes quiet without saying so. Try each,
    // then fall back to the raw body — which is right when a future version
    // pipes the prompt in plain.
    const data = raw.trim().startsWith('{') ? JSON.parse(raw) : {};
    const prompt = data.prompt || data.user_prompt || data.userPrompt ||
                   data.message || (raw.trim().startsWith('{') ? '' : raw);
    const triggers = require(path.join(__dirname, '..', 'lib', 'triggers.js'));

    // Record what this turn asked for, so `PreToolUse` can act on it several tool
    // calls and one process later. Naming a route is a hint the model may ignore;
    // this is what lets the un-routed path be escalated instead.
    try {
      const os = require('os');
      const turnstate = require(path.join(__dirname, '..', 'lib', 'turnstate.js'));
      turnstate.write(os.homedir(), data.session_id, {
        promptId: data.prompt_id || null,
        routes: triggers.match(prompt),
        optedOut: triggers.optedOut(prompt),
        asked: false,
      });
    } catch (e) { /* a hint that cannot be stored is a hint that does not happen */ }

    const out = triggers.render(prompt);
    if (out) process.stdout.write(out + '\n');
  } catch (e) {
    // Silence, deliberately. The alternative is a stack trace injected into the
    // model's context on a turn the operator did not ask anything of this hook.
  }
  process.exit(0);
});
