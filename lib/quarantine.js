'use strict';
/**
 * Recoverable pruning of shadow plain copies (FIX-UP-04.02).
 *
 * `pruneClaudeShadows` deletes plain copies that shadow a plugin. A delete of
 * an EDITED or unknown copy is unrecoverable unless its bytes were captured
 * first, so this module quarantines a copy — recording its TYPE and BYTES (or a
 * symlink's target) under a manifest — verifies the capture, and only then
 * lets the caller remove the original. Restore reconstructs the exact type and
 * bytes.
 *
 * This writes the pack's OWN recovery state (the quarantine store) and restores
 * the pack's OWN managed skill copies — never a file the operator authored, so
 * it is exempt from `protect()` for the same reason `backup.js` / `store.js` /
 * `turnstate.js` are, and it is argued into that exemption list in
 * `test/apply_test.js`.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const skillstore = require('./skillstore.js');

function quarantineDir() {
  return path.join(os.homedir(), '.claude', 'skills-quarantine');
}

function skillsBase() {
  return path.join(os.homedir(), '.claude', 'skills');
}

/**
 * Capture one plain copy into quarantine, verified. Returns the manifest row,
 * or null when it could not be captured (in which case the caller must NOT
 * delete the original — recoverability comes first).
 */
function capture(id) {
  const src = path.join(skillsBase(), id);
  let st;
  try { st = fs.lstatSync(src); } catch (_) { return null; }
  const kind = skillstore.quarantineKind(st);
  const dest = path.join(quarantineDir(), id);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const row = { id, kind };
  if (kind === 'symlink') {
    row.target = fs.readlinkSync(src);
    fs.symlinkSync(row.target, dest);
  } else if (kind === 'file') {
    row.bytes = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, row.bytes);
  } else if (kind === 'dir') {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    return null;                       // unknown type: do not touch it
  }
  // Verify the capture BEFORE the caller removes the original — a quarantine
  // that did not land must not authorise the delete.
  try {
    const back = fs.lstatSync(dest);
    if (skillstore.quarantineKind(back) !== kind) return null;
    if (kind === 'file' && fs.readFileSync(dest, 'utf8') !== row.bytes) return null;
    if (kind === 'symlink' && fs.readlinkSync(dest) !== row.target) return null;
  } catch (_) { return null; }
  return row;
}

/** Write the quarantine manifest for a set of captured rows. */
function writeManifest(rows, stamp) {
  const man = { stamp, quarantine: quarantineDir(), rows };
  try {
    fs.writeFileSync(path.join(quarantineDir(), 'manifest.json'),
                     JSON.stringify(man, null, 2));
  } catch (_) { /* the copies still exist; the manifest is the convenience */ }
  return man;
}

/**
 * Restore a quarantined copy, returning {kind, bytes|target} so the caller can
 * verify against the manifest row (skillstore.restoreMatches).
 */
function restore(id) {
  const manPath = path.join(quarantineDir(), 'manifest.json');
  let man;
  try { man = JSON.parse(fs.readFileSync(manPath, 'utf8')); } catch (_) { return null; }
  const row = (man.rows || []).find((r) => r.id === id);
  if (!row) return null;
  const dest = path.join(skillsBase(), id);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (row.kind === 'symlink') { fs.symlinkSync(row.target, dest); return { kind: 'symlink', target: row.target }; }
  if (row.kind === 'file') { fs.writeFileSync(dest, row.bytes); return { kind: 'file', bytes: row.bytes }; }
  if (row.kind === 'dir') { fs.cpSync(path.join(quarantineDir(), id), dest, { recursive: true }); return { kind: 'dir' }; }
  return null;
}

module.exports = { quarantineDir, capture, writeManifest, restore };
