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

/**
 * The shape of `state.json` (R05). Every writer stamps it, so a reader can tell a file
 * written under this contract from an older one; readers must keep working on a file
 * without it. Keys and owners: docs/working-rules/state-json.md.
 */
const STATE_SCHEMA = 1;

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
 *
 * **The one writer of `state.json`** (fix round, risk g). Written to a temp file
 * beside the target at mode 0600 and RENAMED over it, so a reader — a hook, the
 * idle updater, Fabric Dashboards — sees the old file or the new one, never half
 * of one; and the mode is the new file's, set before it becomes visible. A
 * symlinked target is resolved first, so the rename replaces the file the link
 * points at, never the link. `test/updatelock_test.js` refuses a `writeFileSync`
 * of `state.json` anywhere else.
 */
function writeJson(file, patch) {
  let target = file;
  try { target = fs.realpathSync(file); } catch (e) { /* absent: write where asked */ }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const next = Object.assign(readJson(target), patch || {});
  const tmp = `${target}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', { mode: MODE });
    fs.chmodSync(tmp, MODE);
    fs.renameSync(tmp, target);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) { /* nothing was created */ }
    throw e;
  }
  return readJson(target);
}

module.exports = { readJson, writeJson, MODE, STATE_SCHEMA };
