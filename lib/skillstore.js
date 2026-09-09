'use strict';
/**
 * Channel discovery, uninstall classification and backup/wipe/restore
 * verdicts for the agents' skill stores.
 *
 * Three commands lean on this module — `uninstall`, `backup`/`wipe`,
 * `restore` — and every decision they make is taken HERE, from values the
 * caller passes in. The binary moves bytes: it lists directories, spawns
 * `tar`, unlinks files. What may be removed, whether a wipe is allowed to
 * proceed, and whether a restore brought back what the manifest promised are
 * pure functions, fixtured without a HOME — the same split `guard.js`,
 * `hygiene.js` and `routegate.js` already keep, because a rule that lives in
 * the binary is a rule nobody can test without a machine to break.
 *
 * The dangerous command is `wipe`, and its whole safety story is one gate:
 * **a wipe whose backup could not be taken and VERIFIED does not run.**
 * `lib/backup.js` has enforced "a copy that cannot be taken cancels the
 * write" for the four operator files since v0.35.0; `wipeGate` is the same
 * rule for the skill stores, and the verification is against the archive's
 * own listing, never against the plan — a backup that exists but holds the
 * wrong count is a backup that will not restore, and finding that out AFTER
 * the wipe is finding it out never.
 */

/** Nested agent roots that live deeper than one dot-directory. */
const NESTED = Object.freeze([
  ['.gemini', 'antigravity'],
  ['.codeium', 'windsurf'],
  ['.pi', 'agent'],
]);

/** Our own state directory — holds the backups, must never be a channel. */
const SELF = '.sshlg-skills';

/**
 * Every path that MAY be an agent's global skills directory, built from what
 * the caller found on disk: the dot-entries directly under home and the
 * entries under ~/.config. Existence is the caller's fact to check — this
 * only decides what counts as a candidate, so `~/DATA/<project>/skills`
 * (not a dot-directory) and our own backup store never enter the list.
 */
function channelCandidates(home, dotEntries, configEntries) {
  const sep = home.endsWith('/') ? '' : '/';
  const out = [];
  for (const d of (dotEntries || [])) {
    if (!d.startsWith('.') || d === '.' || d === '..' || d === SELF || d === '.config') continue;
    out.push(`${home}${sep}${d}/skills`);
  }
  for (const c of (configEntries || [])) {
    if (c === '.' || c === '..') continue;
    out.push(`${home}${sep}.config/${c}/skills`);
  }
  for (const [a, b] of NESTED) {
    if ((dotEntries || []).includes(a)) out.push(`${home}${sep}${a}/${b}/skills`);
  }
  return out;
}

/**
 * May `uninstall` remove this entry from a channel?
 *
 * `entry` is what the caller observed: `{ name, isSymlink, target, lockRepo }`
 * — `target` the RESOLVED absolute path when it is a symlink, `lockRepo` the
 * upstream `~/.agents/.skill-lock.json` records for this id, when it does.
 *
 * The rule errs toward leaving things: a skill named `vision` is only ours if
 * something beyond its NAME says so — a symlink resolving into the family's
 * hub entry or a member's source checkout, or a lock row attributing it to an
 * `ssheleg/` repository. An unattributed real directory with a family name is
 * reported and kept, because deleting someone else's skill on a name
 * collision is worse than leaving one of ours behind.
 */
function classifyFamilyEntry(entry, familyIds, memberNames) {
  const e = entry || {};
  if (!familyIds.includes(e.name)) return { remove: false, reason: 'not a family skill id' };
  if (e.isSymlink) {
    const t = String(e.target || '');
    const intoHub = familyIds.some((id) => t.includes(`/.agents/skills/${id}`));
    const intoSource = (memberNames || []).some((m) => t.includes(`/${m}/`) && t.includes('/DATA/'));
    if (intoHub || intoSource) return { remove: true, reason: 'symlink into the family' };
    return { remove: false, reason: `symlink resolves elsewhere (${t || 'nowhere'}) — a name is not provenance` };
  }
  const repo = String(e.lockRepo || '');
  if (/^ssheleg\//.test(repo)) return { remove: true, reason: `lock attributes it to ${repo}` };
  return { remove: false, reason: 'real directory the lock does not attribute to ssheleg — left in place' };
}

/** `skills-all-<stamp>` — sortable, one per second, no locale in it. */
function stampName(date) {
  const d = date instanceof Date ? date : new Date(date);
  const p = (n, w) => String(n).padStart(w || 2, '0');
  return `skills-all-${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`
    + `-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

/** What the archive PROMISES — written beside it, read back by restore. */
function manifest(channels, stamp) {
  const rows = (channels || []).map((c) => ({ path: c.path, entries: (c.entries || []).length }));
  return {
    schema: 'sshlg-skills-backup/1',
    stamp,
    channels: rows,
    total: rows.reduce((n, r) => n + r.entries, 0),
  };
}

/**
 * May the wipe proceed? Only over a backup that was TAKEN and VERIFIED:
 * the archive exists, the manifest counted something, and the archive's own
 * listing agrees with the manifest. Anything else cancels the wipe — the
 * copy-first rule `lib/backup.js` holds for one file, held for ten thousand.
 */
function wipeGate(backup) {
  const b = backup || {};
  if (!b.archive) return { ok: false, reason: 'no archive was written — the wipe is cancelled' };
  if (!Number.isInteger(b.manifestTotal) || b.manifestTotal <= 0) {
    return { ok: false, reason: 'the manifest counted nothing — there is nothing this wipe would be recoverable from' };
  }
  if (b.verifiedCount !== b.manifestTotal) {
    return {
      ok: false,
      reason: `the archive lists ${b.verifiedCount} entr(ies) but the manifest promises ${b.manifestTotal} — a backup that will not restore cancels the wipe`,
    };
  }
  return { ok: true, reason: `backup verified: ${b.manifestTotal} entr(ies) in ${b.archive}` };
}

/**
 * Did the restore bring back what the manifest promised? `observed` maps each
 * channel path to the entry count found on disk AFTER extraction.
 */
function restoreVerify(man, observed) {
  const mismatches = [];
  for (const row of (man && man.channels) || []) {
    const got = (observed || {})[row.path];
    if (got !== row.entries) {
      mismatches.push(`${row.path}: manifest promises ${row.entries}, found ${got == null ? 'nothing' : got}`);
    }
  }
  return { ok: mismatches.length === 0, mismatches };
}

/**
 * Classify a path so a prune can be RECOVERED (FIX-UP-04.02): the type Fabric
 * must reconstruct on restore. A prune that hard-`rm`s an edited or unknown
 * plain copy is unrecoverable; quarantine records the type here and the caller
 * captures the bytes, so a restore returns exactly what was removed.
 *
 * Pure: it reads no filesystem — the caller passes what it lstat'd.
 */
function quarantineKind(stat) {
  if (!stat) return 'absent';
  if (stat.isSymbolicLink && stat.isSymbolicLink()) return 'symlink';
  if (stat.isDirectory && stat.isDirectory()) return 'dir';
  if (stat.isFile && stat.isFile()) return 'file';
  return 'other';
}

/**
 * Did a restore return bytes and type matching the quarantine manifest row?
 * `observed` is {kind, bytes} the caller read back after restoring.
 */
function restoreMatches(row, observed) {
  if (!observed) return false;
  if (observed.kind !== row.kind) return false;
  if (row.kind === 'symlink') return observed.target === row.target;
  if (row.kind === 'file') return observed.bytes === row.bytes;
  return true;   // a dir is matched by presence + kind; its files carry their own rows
}

module.exports = {
  channelCandidates, classifyFamilyEntry, stampName, manifest,
  wipeGate, restoreVerify, quarantineKind, restoreMatches, NESTED, SELF,
};
