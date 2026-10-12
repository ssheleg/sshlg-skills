'use strict';
/**
 * The lock that keeps two `update` runs from writing the same files at once
 * (R05, B-159).
 *
 * `update` is started from more than one place: the operator's terminal, the idle
 * hook (`lib/updaterun.js`, unattended, ten-minute budget) and an external consumer
 * (Fabric Dashboards runs `npx sshlg-skills update` in the background). Two of them
 * at once race on `~/.claude/settings.json`, the runtime copy and `state.json`, and
 * the loser's write is silently the winner's input. One file, created exclusively,
 * says who is running.
 *
 * `decide()` is pure: it takes what the lock file said, the clock and whether the
 * recorded pid is alive, and answers. The filesystem wrapper below only moves bytes.
 *
 * The three outcomes:
 *   - no lock                                          → `acquire`
 *   - this host, pid dead                              → `takeover`
 *   - this host, pid alive                             → `refuse`, however old (fix round,
 *     risk i: a slow update past 30 minutes was taken over while it was still writing)
 *   - another host, older than STALE_MS                → `takeover` (its pid means nothing here)
 *   - otherwise                                        → `refuse`, naming the holder and its age
 *
 * A takeover deletes the judged lock only if it is STILL that lock (fix round, risk b):
 * another `update` may have taken it over and written its own between the read and the
 * unlink, and deleting that one would let two runs write at once.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const STALE_MS = 30 * 60 * 1000;
/** A lock file that does not parse is a writer caught mid-write — or litter. */
const UNREADABLE_GRACE_MS = 30 * 1000;

function lockPath(home) {
  return path.join(home, '.sshlg-skills', 'update.lock');
}

/**
 * @param {object|null} lock   parsed lock file, or null when absent
 * @param {number} nowMs
 * @param {boolean} pidAlive   whether `lock.pid` is a live process (true when unknowable)
 * @param {boolean} [sameHost] whether the lock was written on this host (default true)
 * @returns {{action: 'acquire'|'takeover'|'refuse', reason: string, ageMs?: number, pid?: number}}
 */
function decide(lock, nowMs, pidAlive, sameHost) {
  if (!lock || typeof lock !== 'object') return { action: 'acquire', reason: 'no lock' };
  const here = sameHost !== false;
  const started = Number(lock.startedAt);
  const ageMs = Number.isFinite(started) ? Math.max(0, nowMs - started) : Infinity;
  const pid = lock.pid;
  if (here && !pidAlive) {
    return { action: 'takeover', reason: `holder pid ${pid} is not running`, ageMs, pid };
  }
  if (here) {
    // A live process on this host IS a running update, however long it has run.
    const age = Number.isFinite(ageMs) ? `started ${Math.round(ageMs / 1000)} s ago` : 'start time unknown';
    return { action: 'refuse', reason: `another update is running (pid ${pid}, ${age})`, ageMs, pid };
  }
  if (!Number.isFinite(started)) {
    return { action: 'takeover', reason: 'lock from another host has no startedAt', ageMs, pid };
  }
  if (ageMs > STALE_MS) {
    return { action: 'takeover', reason: `stale: held ${Math.round(ageMs / 60000)} min on ${lock.host} (limit 30)`, ageMs, pid };
  }
  return { action: 'refuse', reason: `another update is running (pid ${pid}, started ${Math.round(ageMs / 1000)} s ago)`, ageMs, pid };
}

/** Whether `pid` is a live process on this machine. EPERM means alive, not ours. */
function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function readLock(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return { absent: true }; }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? { lock: parsed } : { unreadable: true };
  } catch (e) {
    return { unreadable: true };
  }
}

function create(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(body) + '\n', { flag: 'wx', mode: 0o600 });
}

/**
 * Take the lock. Returns `{ok: true, token, tookOver?}` or `{ok: false, message}`.
 * `opts` carries test seams: `now`, `pid`, `host`, `alive`.
 */
function acquire(home, opts) {
  const o = opts || {};
  const file = lockPath(home);
  const now = o.now !== undefined ? o.now : Date.now();
  const pid = o.pid !== undefined ? o.pid : process.pid;
  const host = o.host || os.hostname();
  const alive = o.alive || isAlive;
  const body = { pid, startedAt: now, host };
  let tookOver = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      create(file, body);
      return { ok: true, token: body, tookOver };
    } catch (e) {
      if (e.code !== 'EEXIST') {
        // A lock that cannot be created is not a reason to run unprotected AND not a
        // reason to refuse an update on a read-only home: say so and let it run.
        return { ok: true, token: null, degraded: `lock not created (${e.code || e.message})` };
      }
    }
    const read = readLock(file);
    if (read.absent) continue;                       // released between our two calls
    let verdict;
    if (read.unreadable) {
      let mtime = 0;
      try { mtime = fs.statSync(file).mtimeMs; } catch (e) { continue; }
      verdict = now - mtime > UNREADABLE_GRACE_MS
        ? { action: 'takeover', reason: 'lock file unreadable' }
        : { action: 'refuse', reason: 'update.lock is being written by another update' };
    } else {
      // A pid is meaningful only on the host that wrote it; elsewhere trust the clock alone.
      const sameHost = !read.lock.host || read.lock.host === host;
      verdict = decide(read.lock, now, sameHost ? alive(read.lock.pid) : true, sameHost);
    }
    if (verdict.action === 'refuse') return { ok: false, message: verdict.reason, holder: read.lock || null };
    // Delete only the lock that was judged. Re-read: if another update replaced it in the
    // meantime, leave it and judge again on the next pass.
    const again = readLock(file);
    const same = read.unreadable ? again.unreadable
      : (again.lock && again.lock.pid === read.lock.pid && again.lock.startedAt === read.lock.startedAt);
    if (!same) continue;
    tookOver = verdict.reason;
    try { fs.unlinkSync(file); } catch (e) { /* someone else took it first; the next wx decides */ }
  }
  return { ok: false, message: 'another update took the lock while this one was taking it over' };
}

/** Release, but only a lock that is still ours — never delete a successor's. */
function release(home, token) {
  if (!token) return false;
  const file = lockPath(home);
  const read = readLock(file);
  if (!read.lock || read.lock.pid !== token.pid || read.lock.startedAt !== token.startedAt) return false;
  try { fs.unlinkSync(file); return true; } catch (e) { return false; }
}

module.exports = { decide, acquire, release, isAlive, lockPath, STALE_MS };
