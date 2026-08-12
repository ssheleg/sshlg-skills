'use strict';
/**
 * A copy of the operator's file, taken before this pack overwrites it.
 *
 * Two defects in this repository's history destroyed or overwrote
 * `~/.claude/CLAUDE.md`, a file with no version control behind it. Both times
 * the copy that saved it existed because an agent happened to make one — once
 * ten minutes before it was needed. That is a habit, and a habit protects
 * whoever remembers it.
 *
 * Three decisions are worth stating, because each one is a mistake not made:
 *
 * 1. **Backups live in our directory, never the agent's.** A copy dropped
 *    beside the original is read by the tool that owns that directory:
 *    `~/.cursor/rules/` loads every `*.mdc` it finds, so one careless name
 *    turns a backup into an always-apply rule. Our own directory cannot do
 *    that to anybody.
 *
 * 2. **A failed backup cancels the write.** Degrading to "no backup, wrote
 *    anyway" would reproduce exactly the situation this module replaces, minus
 *    the agent who used to notice. The caller reports `backup-failed` and the
 *    operator's file is untouched.
 *
 * 3. **The copy is read back and compared before the original is touched.** A
 *    write that returned without throwing is not evidence that bytes landed.
 *
 * Naming, selection and pruning are pure and take their clock from the caller,
 * so all of it is provable without a HOME — the same discipline `routers.js`
 * and `drift.js` follow.
 */

const fs = require('fs');
const path = require('path');

/** Where copies go, relative to home. Ours, so nothing else globs it. */
const DIR = ['.sshlg-skills', 'backups'];

/** How many copies of one file to keep. Older ones are pruned oldest-first. */
const KEEP = 10;

/**
 * A filesystem-safe, sortable UTC stamp: `20260812T104500Z`.
 *
 * Sortable matters more than pretty — pruning picks victims by sorting names,
 * so the stamp has to order lexicographically the way it orders in time. The
 * colons of a plain ISO string are not safe on every filesystem.
 */
function stamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

/**
 * The key identifying which file a backup belongs to.
 *
 * Derived from the whole home-relative path rather than the basename: three of
 * the four targets have distinct basenames today, and relying on that would
 * make the fourth target added a silent collision. Every character outside a
 * conservative set becomes `_`, which also disposes of `..` — a key is a flat
 * filename, and nothing here may escape the backup directory.
 */
function keyFor(file, home) {
  const rel = (home ? path.relative(home, file) : '') || path.basename(file);
  const key = rel
    // Separators go first: while they are still separators, `..` is still a
    // traversal and can be recognised as one.
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    // No run of dots survives anywhere in the name, not merely at the front. A
    // file outside home relativises to `../..`, and a key is a flat filename.
    .replace(/\.{2,}/g, '_')
    .replace(/^[._]+/, '');
  // A path that sanitises away entirely — `..` on its own — would otherwise
  // name every backup the same empty-keyed file.
  return key || 'file';
}

/** Full backup filename: the key, then the stamp. */
function nameFor(file, home, stampStr) {
  return `${keyFor(file, home)}.${stampStr}`;
}

/**
 * Which existing names to delete so that `keep` copies of `key` survive.
 *
 * Only names carrying this exact key are candidates — a run backing up one
 * file must never prune another's history. Returns oldest first.
 */
function toPrune(names, key, keep) {
  const mine = names.filter((n) => n.startsWith(key + '.')).sort();
  const excess = mine.length - keep;
  return excess > 0 ? mine.slice(0, excess) : [];
}

/**
 * Copy `file` into the backup directory, verify the bytes, prune the history.
 *
 * Throws if the copy cannot be proven — callers treat a throw as "do not
 * write". Returns `no-file` when there is nothing to protect yet, which is not
 * a failure: creating the block in a file that does not exist destroys nothing.
 */
function save(opts) {
  const file = opts.file;
  const home = opts.home;
  if (!fs.existsSync(file)) return { action: 'no-file', file };

  const original = fs.readFileSync(file);
  const dir = opts.dir || path.join(home, ...DIR);
  fs.mkdirSync(dir, { recursive: true });

  const name = nameFor(file, home, opts.stamp || stamp(new Date()));
  const dest = path.join(dir, name);
  fs.writeFileSync(dest, original);

  // The point of the whole module. A `writeFileSync` that returned is not
  // proof; a short write, a full disk or a filesystem that lied all end here.
  const copy = fs.readFileSync(dest);
  if (!copy.equals(original)) {
    throw new Error(`backup ${dest} does not match ${file} (${copy.length} of ${original.length} bytes)`);
  }

  const keep = opts.keep === undefined ? KEEP : opts.keep;
  const pruned = toPrune(fs.readdirSync(dir), keyFor(file, home), keep);
  for (const old of pruned) fs.unlinkSync(path.join(dir, old));

  return { action: 'saved', file, path: dest, bytes: original.length, pruned };
}

/**
 * `save`, reduced to the question the writers ask: may I write?
 *
 * Returns the record on success and `{action:'backup-failed'}` on any failure,
 * so one unwritable target does not abort the other three — the run still
 * reports a record per target, and every record is true.
 */
function guard(opts) {
  try {
    return save(opts);
  } catch (e) {
    return { action: 'backup-failed', file: opts.file, error: e.message };
  }
}

module.exports = { save, guard, stamp, keyFor, nameFor, toPrune, DIR, KEEP };
