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

/** A lock older than this was left by a writer that died mid-write. */
const LOCK_STALE_MS = 2000;
/** How long a writer waits for the lock before writing anyway — a hook must never hang. */
const LOCK_WAIT_MS = 1000;

function pause(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (e) { /* busy-wait never */ }
}

/**
 * Run `fn` holding `<target>.lock` (created exclusively), so a read-modify-write of the file
 * cannot interleave with another writer's (fix round 2, I). It degrades rather than blocks:
 * a lock that cannot be created at all (a read-only directory) or is still held after
 * `LOCK_WAIT_MS` is written past — the old, unlocked behaviour — and a lock older than
 * `LOCK_STALE_MS` is a dead writer's and is removed. Two writers both judging one lock stale
 * can both remove it; that narrows the race to a dead writer's lock, it does not close it.
 *
 * **It never spins** (final polish 2). The deadline is consulted on EVERY retry path, before
 * the retry: a lock whose age cannot be read, and a stale lock that cannot be removed (a
 * read-only directory), used to `continue` straight past it and loop for ever. The age is
 * `lstat`'s, so a dangling symlink at `<target>.lock` — `wx` says EEXIST, `stat` follows the
 * link and says ENOENT — has an age of its own instead of looking released on every pass.
 */
function withLock(target, fn) {
  const lock = `${target}.lock`;
  const deadline = Date.now() + LOCK_WAIT_MS;
  let held = false;
  for (;;) {
    try {
      fs.writeFileSync(lock, String(process.pid), { flag: 'wx', mode: MODE });
      held = true;
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') break;
      if (Date.now() > deadline) break;                  // write past it, as documented
      let age;
      try { age = Date.now() - fs.lstatSync(lock).mtimeMs; } catch (_) { continue; }   // released: retry
      if (age > LOCK_STALE_MS) {
        try { fs.unlinkSync(lock); continue; } catch (_) { /* cannot remove it: wait it out */ }
      }
      pause(3);
    }
  }
  try {
    return fn();
  } finally {
    if (held) { try { fs.unlinkSync(lock); } catch (e) { /* already broken as stale */ } }
  }
}

/**
 * Merge `patch` into the file and return the result.
 *
 * `patch` is an object merged at the top level, or a FUNCTION from the file's current
 * content to its next content (fix round 2, I). A function is applied to the file as it is
 * at write time, under `<file>.lock`, so a writer that merges a sub-key (`updateCheck.ranAt`)
 * cannot erase another writer's sub-key written since the caller last read the file —
 * `nested()` builds that function for one key. A plain object is merged under the same lock.
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
  return withLock(target, () => {
    const current = readJson(target);
    const next = typeof patch === 'function' ? (patch(current) || current) : Object.assign(current, patch || {});
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
  });
}

/**
 * A function patch that merges `sub` into the object at `key` (and `extra` at the top
 * level), applied to the file as it is at write time. `undefined` in `sub` removes that
 * sub-key.
 */
function nested(key, sub, extra) {
  return (cur) => Object.assign({}, cur, { [key]: Object.assign({}, cur[key], sub) }, extra || {});
}

module.exports = { readJson, writeJson, nested, MODE, STATE_SCHEMA, LOCK_WAIT_MS, LOCK_STALE_MS };
