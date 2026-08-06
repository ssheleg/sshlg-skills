'use strict';
/**
 * The JSON files under `~/.sshlg-skills/`.
 *
 * Two files live here — the recorded consent (`state.json`) and the pack's
 * settings (`config.json`) — and both hold decisions about a file the
 * operator owns and did not write. They share one reader and one writer so
 * the permission discipline has a single implementation rather than a copy
 * that drifts.
 *
 * The permission is set, not requested. `fs.writeFileSync`'s `mode` is passed
 * only to `open()`: on an existing file `open()` with `O_CREAT` ignores it and
 * no chmod is ever performed, and on creation it is masked by the process
 * umask. Grounded in nodejs/node `doc/api/fs.md` and
 * `lib/internal/fs/promises.js`, not in recollection — the fixture that
 * chmods a file to 0644 before writing is the one that would catch a
 * regression to `{mode}` alone.
 */

const fs = require('fs');
const path = require('path');

const MODE = 0o600;

/** The parsed object, or `{}`. A file we cannot read is not an answer. */
function readJson(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

/**
 * Merge `patch` into the file and return the result.
 *
 * A key set to `undefined` is deleted rather than written — `JSON.stringify`
 * drops it, so the round-trip already means removal, and saying so here keeps
 * callers from inventing a second convention for it.
 */
function writeJson(file, patch) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const next = Object.assign(readJson(file), patch || {});
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', { mode: MODE });
  fs.chmodSync(file, MODE);
  return readJson(file);
}

module.exports = { readJson, writeJson, MODE };
