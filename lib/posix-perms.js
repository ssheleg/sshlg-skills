'use strict';
/**
 * Ownership and permission checks that mean something on the platform they run on.
 *
 * On Windows Node reports `mode = 0o666` for every file and `0o777`-style bits for every
 * directory, `fs.chmod` only toggles the read-only bit, and `process.getuid` does not
 * exist. A POSIX privacy check (`mode & 0o077`) is therefore never satisfiable there, and
 * every hub write behind a backup refused (reported from a 1.84.0 install, 2026-10-28:
 * "backup retention storage is not private and owned"). On Windows the files live under the
 * user's profile, whose ACL already restricts them to that user; the hub does not read ACLs,
 * so the POSIX bits are simply not consulted there. Everywhere else the checks are unchanged.
 *
 * `platform` is a parameter so the Windows branch is testable on any machine.
 */

const path = require('path');
const fs = require('fs');

const isWindows = (platform = process.platform) => platform === 'win32';

/** No group or other bits (or, with `mask`, none of the given bits). Always true on Windows. */
function isPrivate(stat, mask = 0o077, platform = process.platform) {
  return isWindows(platform) || (stat.mode & mask) === 0;
}

/** Owned by this process's user. True where the platform has no uid (Windows). */
function ownedByMe(stat, platform = process.platform) {
  if (isWindows(platform) || typeof process.getuid !== 'function') return true;
  return stat.uid === process.getuid();
}

/** The executable for `bin` in `dirs`: the exec bit on POSIX, a PATHEXT extension on Windows. */
function findExecutable(bin, dirs, env = process.env, platform = process.platform) {
  const win = isWindows(platform);
  const exts = win
    ? String((env && (env.PATHEXT || env.Pathext)) || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
    : [''];
  for (const d of dirs) {
    for (const ext of win ? ['', ...exts] : exts) {
      const f = path.join(d, bin + ext);
      try {
        const st = fs.statSync(f);
        if (!st.isFile()) continue;
        if (win) { if (ext || /\.(com|exe|bat|cmd|ps1)$/i.test(f)) return f; continue; }
        if (st.mode & 0o111) return f;
      } catch (e) { /* not here */ }
    }
  }
  return null;
}

module.exports = { isWindows, isPrivate, ownedByMe, findExecutable };
