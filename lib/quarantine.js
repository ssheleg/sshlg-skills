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
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const skillstore = require('./skillstore.js');

/**
 * The Claude config root the prune deletes under: CLAUDE_CONFIG_DIR when set, as
 * Claude reads it (B-355). The store sits beside the skills it guards, so a copy is
 * never captured from one profile and deleted from another.
 */
function configRoot(o) {
  if (o && o.root) return o.root;
  return require('./enablement.js').claudeRoot(os.homedir(), process.env);
}

function quarantineDir(o) {
  return path.join(configRoot(o), 'skills-quarantine');
}

function skillsBase(o) {
  return path.join(configRoot(o), 'skills');
}

/** sha256 over a tree's relative paths, types, link targets and bytes, in a stable order. */
function treeDigest(dir) {
  const h = crypto.createHash('sha256');
  const walk = (abs, rel) => {
    for (const name of fs.readdirSync(abs).sort()) {
      const a = path.join(abs, name);
      const r = rel ? `${rel}/${name}` : name;
      const st = fs.lstatSync(a);
      if (st.isSymbolicLink()) h.update(`l\0${r}\0${fs.readlinkSync(a)}\0`);
      else if (st.isDirectory()) { h.update(`d\0${r}\0`); walk(a, r); }
      else if (st.isFile()) { h.update(`f\0${r}\0`); h.update(fs.readFileSync(a)); h.update('\0'); }
      else h.update(`o\0${r}\0`);
    }
  };
  walk(dir, '');
  return h.digest('hex');
}

/**
 * Move a previous run's quarantine aside, under the stamp it was written with.
 *
 * The store is keyed by skill id, so a SECOND run quarantining the same id lands on
 * the first run's entry. `capture` used to write it blind: `fs.symlinkSync` threw
 * `EEXIST`, the throw escaped `pruneClaudeShadows`, and `update` died **after** the
 * skills CLI had created the plain copies and **before** anything pruned them —
 * leaving 20 shadowed plugins on this machine, which is worse than the state the
 * command started in. Measured 2026-09-14 on v1.48.3, against a quarantine written
 * 2026-09-10.
 *
 * Rolling rather than overwriting, because the previous entry may be the only copy
 * of a plain skill somebody edited: it goes to `archive/<stamp>/`, manifest included,
 * and `restore` keeps reading the current `manifest.json` exactly as before. Returns
 * the archive path, or null when there was nothing to roll.
 */
function rollPrevious(o) {
  const dir = quarantineDir(o);
  let names;
  try { names = fs.readdirSync(dir).filter((n) => n !== 'archive'); } catch (_) { return null; }
  if (!names.length) return null;
  // A store whose run died before its manifest still holds captured copies (B-355):
  // archive it under a stamp of its own rather than let the next capture overwrite it.
  let man = null;
  try { man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch (_) { /* no manifest */ }
  const stamp = (man && man.stamp) || `unstamped-${skillstore.stampName(new Date())}`;
  const archive = path.join(dir, 'archive', String(stamp));
  try {
    fs.mkdirSync(archive, { recursive: true });
    for (const name of names) {
      const from = path.join(dir, name);
      const to = path.join(archive, name);
      try { fs.rmSync(to, { recursive: true, force: true }); } catch (_) { /* nothing there */ }
      fs.renameSync(from, to);
    }
  } catch (_) { return null; }
  return archive;
}

/**
 * Capture one plain copy into quarantine, verified. Returns the manifest row,
 * or null when it could not be captured (in which case the caller must NOT
 * delete the original — recoverability comes first).
 */
function capture(id, o) {
  const src = path.join(skillsBase(o), id);
  let st;
  try { st = fs.lstatSync(src); } catch (_) { return null; }
  const kind = skillstore.quarantineKind(st);
  const dest = path.join(quarantineDir(o), id);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // A leftover at this id is this run's own work (the caller rolled any previous
  // store aside first). Writing blind is what threw EEXIST and killed `update`.
  try { fs.rmSync(dest, { recursive: true, force: true }); } catch (_) { /* nothing there */ }
  const row = { id, kind };
  if (kind === 'symlink') {
    row.target = fs.readlinkSync(src);
    fs.symlinkSync(row.target, dest);
  } else if (kind === 'file') {
    // Bytes, not text (B-355): a UTF-8 read replaced invalid sequences and the restore
    // wrote back something else. `bytes` stays for a text file, which restoreMatches reads.
    const buf = fs.readFileSync(src);
    row.b64 = buf.toString('base64');
    if (Buffer.from(buf.toString('utf8'), 'utf8').equals(buf)) row.bytes = buf.toString('utf8');
    fs.writeFileSync(dest, buf);
  } else if (kind === 'dir') {
    row.digest = treeDigest(src);
    fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: true });
  } else {
    return null;                       // unknown type: do not touch it
  }
  // Verify the capture BEFORE the caller removes the original — a quarantine
  // that did not land must not authorise the delete.
  try {
    const back = fs.lstatSync(dest);
    if (skillstore.quarantineKind(back) !== kind) return null;
    if (kind === 'file' && fs.readFileSync(dest).toString('base64') !== row.b64) return null;
    if (kind === 'symlink' && fs.readlinkSync(dest) !== row.target) return null;
    if (kind === 'dir' && treeDigest(dest) !== row.digest) return null;
  } catch (_) { return null; }
  return row;
}

/**
 * Write the quarantine manifest for a set of captured rows. Throws when it cannot:
 * `restore` and `rollPrevious` find nothing without it, so a prune whose manifest
 * did not land must delete nothing (B-355).
 */
function writeManifest(rows, stamp, o) {
  const man = { stamp, quarantine: quarantineDir(o), rows };
  const file = path.join(quarantineDir(o), 'manifest.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  ((o && o.writeFile) || fs.writeFileSync)(file, JSON.stringify(man, null, 2));
  return man;
}

/**
 * Prune plain copies recoverably: roll the previous store aside, capture every copy
 * and verify it, write the manifest, and only then delete. A copy that could not be
 * captured is kept; a manifest that could not be written keeps them all. Returns
 * { pruned, archived, error }.
 */
function prune(ids, o) {
  const out = { pruned: [], archived: null, error: null };
  if (!ids || !ids.length) return out;
  out.archived = rollPrevious(o);
  const rows = [];
  for (const id of ids) {
    let row = null;
    try { row = capture(id, o); } catch (_) { row = null; }
    if (row) rows.push(row);               // could not quarantine: do NOT delete, recoverability first
  }
  if (!rows.length) return out;
  try { writeManifest(rows, (o && o.stamp) || skillstore.stampName(new Date()), o); }
  catch (e) { out.error = `quarantine manifest not written (${e.code || e.message}); nothing pruned`; return out; }
  for (const row of rows) {
    try {
      fs.rmSync(path.join(skillsBase(o), row.id), { recursive: true, force: true });
      out.pruned.push(row.id);
    } catch (_) { /* leave it; the quarantine holds a copy either way */ }
  }
  return out;
}

/**
 * Restore a quarantined copy, returning {kind, bytes|target} so the caller can
 * verify against the manifest row (skillstore.restoreMatches).
 */
function restore(id, o) {
  const manPath = path.join(quarantineDir(o), 'manifest.json');
  let man;
  try { man = JSON.parse(fs.readFileSync(manPath, 'utf8')); } catch (_) { return null; }
  const row = (man.rows || []).find((r) => r.id === id);
  if (!row) return null;
  const dest = path.join(skillsBase(o), id);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (row.kind === 'symlink') { fs.symlinkSync(row.target, dest); return { kind: 'symlink', target: row.target }; }
  if (row.kind === 'file') {
    // A row written before 1.90.0 carries text only; a newer one carries the bytes.
    const buf = row.b64 != null ? Buffer.from(row.b64, 'base64') : Buffer.from(row.bytes, 'utf8');
    fs.writeFileSync(dest, buf);
    return { kind: 'file', bytes: row.bytes };
  }
  if (row.kind === 'dir') {
    fs.cpSync(path.join(quarantineDir(o), id), dest, { recursive: true, verbatimSymlinks: true });
    return { kind: 'dir' };
  }
  return null;
}

module.exports = { configRoot, quarantineDir, rollPrevious, capture, writeManifest, prune, restore, treeDigest };
