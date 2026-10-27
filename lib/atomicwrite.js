'use strict';
/**
 * The one way bytes reach a file the operator owns (B-260).
 *
 * `apply.protect()` decides WHETHER a write may happen (a verified copy first);
 * this decides HOW it lands. Until 1.80 every routing write was an in-place
 * `fs.writeFileSync` after the copy: a crash, a full disk or a killed process
 * mid-write left `~/.claude/CLAUDE.md` truncated, and the backup was the only
 * way back. Here the new bytes go to a temp file in the target's own directory,
 * are flushed to disk, and replace the target by one `rename`, which is atomic on
 * one filesystem: a reader sees the old file or the new one, never half of one.
 *
 * Four properties the in-place write had, kept on purpose:
 *  - an existing file keeps its permission bits; a new one gets the mode the
 *    caller asked for, or the umask-shaped default `writeFileSync` would give;
 *  - a symlink stays a symlink: the bytes go to the file it resolves to, so an
 *    operator's dotfile link is not silently replaced by a regular file. A
 *    dangling link is refused, because writing there would invent a file the
 *    link's owner never made;
 *  - a read-only target is refused (EACCES), as the in-place write was; the
 *    rename alone would bypass the permission the operator set;
 *  - a hard link is NOT kept: the rename gives the path a new inode. No target
 *    the hub writes is expected to be hard-linked; a symlink is the supported
 *    way to share one file.
 *
 * `opts.beforeRename(tmp)` runs with the complete, flushed temp file and may
 * throw to cancel: callers that re-check the target or journal an intent before
 * the replacement do it there, so there is one rename in the hub, not five.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Where the bytes really go: the file itself, or what its symlink resolves to. */
function destination(file) {
  let st;
  try { st = fs.lstatSync(file); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return { dest: file, exists: false };
  }
  if (st.isSymbolicLink()) {
    let real;
    try { real = fs.realpathSync(file); } catch (e) {
      if (e.code === 'ENOENT') {
        throw Object.assign(new Error(`${file} is a dangling symlink; refusing to create the file it points to`), { code: 'EDANGLING' });
      }
      throw e;
    }
    const target = fs.statSync(real);
    if (!target.isFile()) throw Object.assign(new Error(`${file} resolves to ${real}, which is not a regular file`), { code: 'ENOTFILE' });
    return { dest: real, exists: true, mode: target.mode & 0o7777 };
  }
  if (!st.isFile()) throw Object.assign(new Error(`${file} is not a regular file`), { code: 'ENOTFILE' });
  return { dest: file, exists: true, mode: st.mode & 0o7777 };
}

/** Best effort: make the rename itself durable. Not every platform opens a directory. */
function syncDir(dir) {
  let fd;
  try { fd = fs.openSync(dir, 'r'); fs.fsyncSync(fd); } catch (e) { /* EISDIR/EPERM on some platforms: the rename is still atomic */ }
  finally { if (fd !== undefined) { try { fs.closeSync(fd); } catch (e) { /* already closed */ } } }
}

/**
 * Replace `file` with `data` atomically. Throws on any failure, leaving the
 * original untouched and no temp file behind.
 * @param {string} file
 * @param {string|Buffer} data
 * @param {{mode?: number, encoding?: string, tmpName?: string, beforeRename?: (tmp: string) => void}} [opts]
 */
function write(file, data, opts) {
  const o = opts || {};
  const where = destination(file);
  // The in-place write threw EACCES on a read-only file; the rename would not.
  if (where.exists) fs.accessSync(where.dest, fs.constants.W_OK);
  const dir = path.dirname(where.dest);
  // A caller whose recovery sweeps its own leftovers by name passes that name.
  const name = o.tmpName || `.${path.basename(where.dest)}.sshlg-${process.pid}-${crypto.randomBytes(8).toString('hex')}.tmp`;
  if (name !== path.basename(name)) throw new Error('tmpName must be a bare file name');
  const tmp = path.join(dir, name);
  let fd;
  let renamed = false;
  try {
    // 0o666 lets the umask shape a new file exactly as writeFileSync would.
    fd = fs.openSync(tmp, 'wx', 0o666);
    if (where.exists) fs.fchmodSync(fd, where.mode);
    else if (o.mode !== undefined) fs.fchmodSync(fd, o.mode);
    fs.writeFileSync(fd, data, typeof data === 'string' ? (o.encoding || 'utf8') : undefined);
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    if (typeof o.beforeRename === 'function') o.beforeRename(tmp);
    fs.renameSync(tmp, where.dest);
    renamed = true;
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch (e) { /* the error that brought us here wins */ } }
    if (!renamed) { try { fs.unlinkSync(tmp); } catch (e) { /* never created, or already gone */ } }
  }
  syncDir(dir);
  return { file, dest: where.dest, created: !where.exists };
}

module.exports = { write, destination };
