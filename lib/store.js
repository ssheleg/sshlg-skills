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

/** A lock whose holder cannot be identified (no pid in it) and is older than this is a dead
 * writer's. A lock naming a pid is judged by that pid instead (B-227). */
const LOCK_STALE_MS = 2000;
/** A lock naming a LIVE pid older than this is an orphan whose pid was reused: no writer holds
 * this lock for a read, a small JSON write and a rename for a minute. */
const LOCK_ORPHAN_MS = 60000;
/** How long a writer waits for a live holder before it refuses (`ELOCKED`). Bounded, so a hook
 * never hangs; long enough that a slow disk or a descheduled holder is waited out (B-227). */
const LOCK_WAIT_MS = 5000;

function pause(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (e) { /* busy-wait never */ }
}

/** `alive`, `dead` or `unknown` for the pid a lock file names. Never follows a symlink. */
function holderOf(lock, st) {
  if (!st.isFile()) return { state: 'unknown' };
  let raw;
  try { raw = fs.readFileSync(lock, 'utf8'); } catch (e) { return { state: 'unknown' }; }
  // `<pid>` or `<pid> <token>`: the token tells two locks apart when the file system hands a
  // freed inode straight back (Linux does, which the inode comparison alone missed in CI).
  const m = /^\s*(\d+)(?:\s+[0-9a-f]+)?\s*$/.exec(raw);
  if (!m) return { state: 'unknown', raw };
  const pid = Number(m[1]);
  if (!Number.isSafeInteger(pid) || pid < 1) return { state: 'unknown', raw };
  try { process.kill(pid, 0); return { state: 'alive', pid, raw }; }
  catch (e) { return { state: e.code === 'EPERM' ? 'alive' : 'dead', pid, raw }; }
}

/** Same file and same bytes: an inode alone can be reused the moment a lock is removed. */
function sameLock(lock, st, body) {
  const now = fs.lstatSync(lock);
  if (now.dev !== st.dev || now.ino !== st.ino) return false;
  if (body === undefined) return true;
  try { return fs.readFileSync(lock, 'utf8') === body; } catch (e) { return false; }
}

/** Remove a lock judged stale only if it is still the very file that was judged. */
function breakStale(lock, judged, body) {
  try {
    if (!sameLock(lock, judged, body)) return true;                    // replaced: look again
    fs.unlinkSync(lock);
    return true;
  } catch (e) { return e.code === 'ENOENT'; }                           // cannot remove: wait it out
}

/**
 * Run `fn` holding `<target>.lock` (created exclusively, holding the writer's pid), so a
 * read-modify-write of the file cannot interleave with another writer's (fix round 2, I).
 *
 * **A live holder is never written past or broken (B-227).** The lock names its holder's pid.
 * A dead pid's lock is removed at once; a live pid's is waited for up to `LOCK_WAIT_MS`, and
 * then the write is REFUSED with `ELOCKED` instead of written past: writing past a live holder
 * lost a write under load (its rename replaced the file with a version read before ours), and
 * so did breaking a live holder's lock merely for being older than two seconds. A lock naming
 * no pid (a dangling symlink, foreign bytes) keeps the old degrade: it is broken after
 * `LOCK_STALE_MS`, and written past at the deadline. A lock that cannot be created at all (a
 * read-only directory) is written past too; that write then fails on its own temp file.
 *
 * **Release removes only its own lock**: the lock's inode AND its bytes (pid plus a random
 * token) are compared first, so a holder whose lock was broken does not remove the successor's,
 * even when the file system gives the successor's lock the freed inode.
 *
 * **It never spins** (final polish 2). The deadline is consulted on every retry path. The age is
 * `lstat`'s, so a dangling symlink at `<target>.lock` has an age of its own.
 */
function withLock(target, fn) {
  const lock = `${target}.lock`;
  const deadline = Date.now() + LOCK_WAIT_MS;
  let own = null;
  const mine = `${process.pid} ${require('crypto').randomBytes(8).toString('hex')}`;
  for (;;) {
    let fd;
    try {
      fd = fs.openSync(lock, 'wx', MODE);
      try { fs.writeSync(fd, mine); own = fs.fstatSync(fd); } finally { fs.closeSync(fd); }
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') break;                                // no lock possible: write past
      let st;
      try { st = fs.lstatSync(lock); } catch (_) { if (Date.now() > deadline) break; continue; }   // released: retry
      const holder = holderOf(lock, st);
      const age = Date.now() - st.mtimeMs;
      if (holder.state === 'dead' || (holder.state === 'unknown' && age > LOCK_STALE_MS)
          || (holder.state === 'alive' && age > LOCK_ORPHAN_MS)) {
        if (breakStale(lock, st, holder.raw)) { if (Date.now() <= deadline) continue; }
        else if (holder.state === 'dead') break;                    // dead and unremovable: write past
      }
      if (Date.now() > deadline) {
        if (holder.state === 'alive') {
          const err = new Error(`${path.basename(lock)} is held by running process ${holder.pid} past ${LOCK_WAIT_MS} ms; nothing was written`);
          err.code = 'ELOCKED';
          throw err;
        }
        break;                                                       // unknown or dead holder: write past
      }
      pause(5);
    }
  }
  try {
    return fn();
  } finally {
    if (own) {
      try {
        if (sameLock(lock, own, mine)) fs.unlinkSync(lock);
      } catch (e) { /* already broken */ }
    }
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
      fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', { mode: MODE, flag: 'wx' });
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

module.exports = { readJson, writeJson, nested, MODE, STATE_SCHEMA, LOCK_WAIT_MS, LOCK_STALE_MS, LOCK_ORPHAN_MS };
