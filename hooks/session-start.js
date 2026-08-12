#!/usr/bin/env node
'use strict';
/**
 * `SessionStart` — one short note saying the routing block is not advisory.
 *
 * This is the mechanism this family measured at 854 tokens in someone else's
 * pack and switched off, so its size is the design. It prints a POINTER: the
 * block in the operator's global instructions already carries every router's
 * text, loads in the same session, and is the single home. What it lacks is the
 * salience of arriving last, and that is the only thing supplied here.
 *
 * A fixture caps the note's length for exactly that reason — see
 * `test/triggers_test.js` → *the session note stays a pointer*.
 *
 * Fails silent: a session must start even when this cannot.
 */

const path = require('path');

try {
  const triggers = require(path.join(__dirname, '..', 'lib', 'triggers.js'));
  process.stdout.write(triggers.sessionNote() + '\n');
} catch (e) {
  /* a broken hint is not worth a broken session */
}
process.exit(0);
