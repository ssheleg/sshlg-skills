'use strict';
/**
 * Consent for editing the operator's global agent instructions.
 *
 * Installing a skill is not permission to change persistent instructions.
 * That file governs every project and every session the operator runs, so the
 * answer is asked once, recorded, and never asked again — and the absence of
 * an answer is never treated as one.
 *
 * `home` is a parameter rather than `process.env.HOME` so the fixtures run
 * against a temp directory and cannot reach the real state file.
 */

const path = require('path');
const store = require('./store.js');

function statePath(home) {
  return path.join(home, '.sshlg-skills', 'state.json');
}

/** The recorded state, or `{}`. A file we cannot parse is not consent. */
function readState(home) {
  return store.readJson(statePath(home));
}

/**
 * Merge `patch` into the recorded state. Owner-only, like anything else here.
 *
 * The reading, the merge and the 0600 now live in `store.js`, shared with the
 * settings file — one implementation of the permission rule instead of two
 * that agree today.
 */
function writeState(home, patch) {
  return store.writeJson(statePath(home), patch);
}

function defaultPrompt() {
  // Node has no synchronous stdin read that works everywhere, so the caller in
  // bin/ supplies the real prompt. Reaching this means an interactive path ran
  // without one -- refuse loudly rather than return an empty string, which
  // would read as a decline the operator never made.
  throw new Error(
    'askConsent: interactive mode needs a prompt function; none was supplied'
  );
}

/**
 * `"yes"` or `"no"`, asked at most once in the lifetime of a machine.
 *
 * A non-interactive stdin — CI, a piped installer, an automation — answers
 * `"no"` and says so. Silence is not consent, and the one context where an
 * unattended installer could quietly rewrite a global instruction file is
 * exactly the one where nobody would notice.
 */
function askConsent(opts) {
  const home = opts.home;
  // A preview must not decide anything. Without this, `--dry-run` down a pipe
  // records a permanent "no" -- the one flag whose whole promise is that it
  // changes nothing.
  const persist = opts.persist !== false;
  const log = opts.log || ((m) => console.log(m));
  const prompt = opts.prompt || defaultPrompt;

  const recorded = readState(home).routers;
  if (recorded === 'yes' || recorded === 'no') return recorded;

  if (!opts.interactive) {
    log(
      'stdin не интерактивен — роутинг-блок не записан (non-interactive: ' +
      'treating as no). Запусти `npx sshlg-skills install` в терминале, ' +
      'чтобы решить.'
    );
    if (persist) writeState(home, { routers: 'no' });
    return 'no';
  }

  const answer = String(
    prompt(
      'Дописать блок роутинга скилов в глобальные инструкции агента? ' +
      'Он влияет на все проекты. [y/N] '
    ) || ''
  ).trim().toLowerCase();

  const decision = answer === 'y' || answer === 'yes' || answer === 'д' ? 'yes' : 'no';
  if (persist) writeState(home, { routers: decision });
  return decision;
}

module.exports = { statePath, readState, writeState, askConsent };
