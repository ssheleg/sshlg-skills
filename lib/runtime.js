'use strict';
/**
 * The wired copy — the code the hooks actually execute.
 *
 * The settings entries point at `~/.sshlg-skills/runtime/`, never at this package:
 * run via `npx`, `__dirname` is npm's cache and npx may prune it, which would leave
 * hooks that fail silently on every prompt. So the package's `hooks/` and `lib/` are
 * copied into the operator's own directory and THAT is what runs.
 *
 * **Which made the runtime the one thing `update` did not update.** The copy lived in
 * a closure inside `cmdHooks` and was called on `hooks install` alone. Stage 8 of the
 * 2026-08-13 run found the result on a real machine: `update` had brought six plugins
 * to their new versions while the runtime sat at 24 modules against the package's 25,
 * and the module missing was the one that release existed to ship. Its SessionStart
 * line could never print. Every hook improvement since v0.42.0 had been reaching
 * machines the same way — only via a command nobody had a reason to re-run. `B-22`.
 *
 * **`create` is the whole difference between install and refresh.** A machine with no
 * runtime has not consented to hooks, and an update is not the moment to ask — the
 * same rule the routing block's own refresh follows, and for the same reason. But note
 * what that rule is NOT: it does not mean "leave an existing runtime alone". This
 * repository has recorded three times that a rule written to protect a first run gets
 * applied on the hundredth; refusing to refresh what is already there would be the
 * fourth.
 */

const fs = require('fs');
const path = require('path');

/** Copied wholesale, and only their `.js` files: the hooks require the lib beside them. */
const DIRS = ['hooks', 'lib'];

/**
 * Copied too, and the ONE consumer is `hooks/pre-tool-use.js` — the shadow guard.
 *
 * This said "`lib/plan.js` and the bin read it", and neither does: `plan.js` takes its
 * members as parameters and its own header calls itself pure, and the bin never
 * executes from the runtime tree. Grepping `lib/*.js` for the filename returns comments
 * only.
 *
 * The correction matters because the real consumer FAILS SILENTLY. The hook wraps its
 * read in `catch { /* no manifest beside us: guard nothing rather than guess *\/ }`, so
 * a reader trimming this payload on the strength of the old comment would drop the
 * manifest, the shadow guard would return an empty id set, and it would deny nothing
 * with no message — the guard the whole pack was written around, off, quietly.
 */
const MANIFEST = 'skills.json';

/**
 * Flat files copied beside the module trees, and why `package.json` is one.
 *
 * `lib/updaterun.js` opens with `require('../package.json')` to learn which version
 * is RUNNING. From the package that resolves; from the runtime — the copy the wired
 * hooks actually execute — it resolved to nothing, so the module threw at load and
 * the unattended update never ran once. Hooks fail silent, so nothing said so
 * (FIX-RT-01, measured 2026-09-10 against the wired runtime on this machine).
 *
 * Copying it makes the version READABLE where the code runs, and makes it the right
 * version: the generation whose modules are executing, not whichever package the
 * probe happens to reach. It is inert as a package manifest — no `type` field, so
 * CommonJS stays CommonJS, and no dependencies to install.
 */
const FLAT = [MANIFEST, 'package.json'];

/** Every `.js` under `dir`, as paths relative to `base`, posix-separated. */
function jsFiles(dir, base, out, strict = false) {
  out = out || [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) {
    if (!strict) return out;
    throw e; // unreadable discovery is not a complete managed set
  }
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, e.name);
    if (strict && e.isSymbolicLink()) throw new Error(`source link is not an admitted runtime file: ${full}`);
    if (e.isDirectory()) jsFiles(full, base, out, strict);
    else if (e.name.endsWith('.js')) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/** What the package holds that the runtime does not, or holds differently. Writes nothing. */
function stale(pkgRoot, runtimeRoot) {
  const missing = [];
  const differing = [];
  const wanted = DIRS.flatMap((d) => jsFiles(path.join(pkgRoot, d), pkgRoot));
  for (const f of FLAT) if (fs.existsSync(path.join(pkgRoot, f))) wanted.push(f);
  for (const rel of wanted) {
    const to = path.join(runtimeRoot, rel);
    if (!fs.existsSync(to)) { missing.push(rel); continue; }
    try {
      // Discovery is read-only and best-effort, but must never open a FIFO or
      // follow a managed-file alias before sync's strict admission can refuse it.
      const a = fingerprint(path.join(pkgRoot, rel));
      const b = fingerprint(to);
      if (!same(a, b)) differing.push(rel);
    } catch (e) { differing.push(rel); }
  }
  return { missing, differing, wanted };
}

/** The set of managed files (posix-relative) the package would install. */
function managedFiles(pkgRoot) {
  directory(pkgRoot);
  const rels = [];
  for (const dir of DIRS) {
    const full = path.join(pkgRoot, dir);
    directory(full);
    if (!stat(full)) throw new Error(`required source directory absent: ${dir}`);
    jsFiles(full, pkgRoot, rels, true);
  }
  for (const file of FLAT) {
    if (!fingerprint(path.join(pkgRoot, file))) throw new Error(`required source manifest absent: ${file}`);
    rels.push(file);
  }
  return rels.sort();
}

const crypto = require('crypto');
const JOURNAL = '.switch-journal.json';
const PREVIOUS = '.prev-generation';

function stat(file) {
  try { return fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
function directory(file) {
  const s = stat(file);
  if (s && (!s.isDirectory() || s.isSymbolicLink())) throw new Error(`unsafe directory: ${file}`);
}
function managedPath(root, rel) {
  if (typeof rel !== 'string' || rel.includes('\\') || rel.split('/').some(x => !x || x === '.' || x === '..')
      || !(FLAT.includes(rel) || /^(hooks|lib)\/.+\.js$/.test(rel))) throw new Error('invalid managed path in journal');
  directory(root);
  let current = root;
  for (const part of rel.split('/').slice(0, -1)) { current = path.join(current, part); directory(current); }
  return path.join(root, rel);
}
function fingerprint(file) {
  const s = stat(file);
  if (!s) return null;
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1) throw new Error(`unsafe runtime file: ${file}`);
  return { sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), mode: s.mode & 0o777 };
}
function same(a, b) { return a === null || b === null ? a === b : a.sha256 === b.sha256 && a.mode === b.mode; }
function validPrint(p) {
  return p && /^[a-f0-9]{64}$/.test(p.sha256) && Number.isInteger(p.mode) && p.mode >= 0 && p.mode <= 0o777;
}
function durable(file, bytes, mode = 0o600) {
  const fd = fs.openSync(file, 'wx', mode);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function failure(reason, recovery = 'unresolved') {
  return { ok: false, status: 'failed', created: false, copied: [], recovery, reason };
}

// Every writer, including hooks install, uses this admission. A crash can leave
// the lock: an unknown/dead holder is NOT stolen automatically. Refusal preserves
// the journal and backup until the holder/lock is resolved; there is no unsafe
// check-then-unlink takeover. This is process-failure containment, not power-loss
// durability or atomic visibility to already-running hook readers.
function withLock(runtimeRoot, fn) {
  directory(runtimeRoot);
  const file = path.join(runtimeRoot, '.sync.lock');
  const token = JSON.stringify(require('./runtime-recovery').record(runtimeRoot));
  try { durable(file, token); }
  catch (e) {
    if (e.code === 'EEXIST') throw new Error(`runtime busy or recovery unresolved: inspect holder in ${file} and ${path.join(runtimeRoot, JOURNAL)}; lock was not removed (EEXIST)`);
    throw e;
  }
  const held = fs.lstatSync(file);
  try { return fn(); }
  finally {
    try {
      const current = stat(file);
      if (current && current.isFile() && !current.isSymbolicLink() && current.dev === held.dev
          && current.ino === held.ino && fs.readFileSync(file, 'utf8') === token) fs.unlinkSync(file);
    } catch (_) { /* retained for inspection */ }
  }
}

function recoverUnlocked(runtimeRoot) {
  const journal = path.join(runtimeRoot, JOURNAL);
  if (!stat(journal)) return { ok: true, recovered: false, restored: [] };
  try {
    fingerprint(journal); // refuse links/devices before read
    const raw = fs.readFileSync(journal, 'utf8');
    const data = JSON.parse(raw);
    if (data.version !== 2 || !Array.isArray(data.files) || !data.files.length
        || typeof data.staging !== 'string' || !/^\.staging-[a-zA-Z0-9]+$/.test(data.staging)) {
      throw new Error('unrecognised recovery journal (legacy journals need inspection)');
    }
    const prev = path.join(runtimeRoot, PREVIOUS);
    directory(prev);
    const seen = new Set();
    const rows = data.files.map(row => {
      if (!row || seen.has(row.rel) || !(row.before === null || validPrint(row.before)) || !validPrint(row.after)) {
        throw new Error('invalid recovery fingerprints');
      }
      seen.add(row.rel);
      const dst = managedPath(runtimeRoot, row.rel), saved = managedPath(prev, row.rel);
      const current = fingerprint(dst);
      if (!same(current, row.before) && !same(current, row.after)) throw new Error(`runtime changed outside transaction: ${row.rel}`);
      if (row.before !== null && !same(fingerprint(saved), row.before)) throw new Error(`missing or changed recovery copy: ${row.rel}`);
      return { ...row, dst, saved, current };
    });
    // Preflight the ENTIRE journal before touching any file. Retry admits already
    // restored old bytes as well as known new bytes; unrelated bytes remain intact.
    const restored = [];
    for (const row of rows) {
      if (!same(fingerprint(row.dst), row.current)) throw new Error(`runtime changed during recovery: ${row.rel}`);
      if (!same(row.current, row.before)) {
        if (row.before === null) fs.unlinkSync(row.dst);
        else {
          const temp = path.join(runtimeRoot, `.rollback-${crypto.randomBytes(12).toString('hex')}`);
          try {
            durable(temp, fs.readFileSync(row.saved), row.before.mode);
            fs.chmodSync(temp, row.before.mode);
            if (!same(fingerprint(temp), row.before)) throw new Error('rollback copy mismatch');
            fs.renameSync(temp, row.dst);
          } finally { try { fs.unlinkSync(temp); } catch (_) { /* moved or preserved */ } }
        }
      }
      restored.push(row.rel);
    }
    for (const row of rows) if (!same(fingerprint(row.dst), row.before)) throw new Error(`rollback verification failed: ${row.rel}`);
    if (fs.readFileSync(journal, 'utf8') !== raw) throw new Error('journal changed during recovery');
    // Clearing journal is the rollback commit. Cleanup afterwards is optional.
    fs.unlinkSync(journal);
    for (const dir of [prev, path.join(runtimeRoot, data.staging)]) {
      try { directory(dir); fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* inert leftovers */ }
    }
    return { ok: true, recovered: true, restored: restored.sort() };
  } catch (e) {
    return { ok: false, recovered: false, restored: [], reason: `recovery unresolved: ${e.message}` };
  }
}

/** Explicit recovery shares writer admission; unknown metadata never means absent. */
function recover(runtimeRoot) {
  try {
    if (!stat(runtimeRoot)) return { ok: true, recovered: false, restored: [] };
    return withLock(runtimeRoot, () => recoverUnlocked(runtimeRoot));
  } catch (e) { return { ok: false, recovered: false, restored: [], reason: `recovery admission refused: ${e.message}` }; }
}

function syncLocked(pkgRoot, runtimeRoot, exists) {
  const rels = managedFiles(pkgRoot); // admit complete source before recovery writes
  const recovery = recoverUnlocked(runtimeRoot);
  if (!recovery.ok) return failure(recovery.reason);
  if (!rels.length) return failure('package has no managed runtime files', 'not-needed');
  const rows = rels.map(rel => ({ rel, before: fingerprint(managedPath(runtimeRoot, rel)) }));
  if (exists && rows.every(row => same(row.before, fingerprint(managedPath(pkgRoot, row.rel))))) {
    return { ok: true, status: 'unchanged', created: false, copied: [], reason: null };
  }
  const staging = fs.mkdtempSync(path.join(runtimeRoot, '.staging-'));
  const prev = path.join(runtimeRoot, PREVIOUS);
  const journal = path.join(runtimeRoot, JOURNAL);
  let journaled = false;
  try {
    for (const row of rows) {
      const src = managedPath(pkgRoot, row.rel), dst = path.join(staging, row.rel);
      row.after = fingerprint(src);
      if (!row.after) throw new Error(`source disappeared: ${row.rel}`);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, row.after.mode);
      const fd = fs.openSync(dst, 'r+');
      try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      if (!same(fingerprint(dst), row.after) || !same(fingerprint(src), row.after)) throw new Error(`staged source changed: ${row.rel}`);
    }
    directory(prev);
    fs.rmSync(prev, { recursive: true, force: true });
    fs.mkdirSync(prev);
    for (const row of rows) {
      const current = managedPath(runtimeRoot, row.rel);
      if (!same(fingerprint(current), row.before)) throw new Error(`runtime changed before snapshot: ${row.rel}`);
      if (row.before !== null) {
        const saved = path.join(prev, row.rel);
        fs.mkdirSync(path.dirname(saved), { recursive: true });
        fs.copyFileSync(current, saved);
        fs.chmodSync(saved, row.before.mode);
        const fd = fs.openSync(saved, 'r+');
        try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
        if (!same(fingerprint(saved), row.before)) throw new Error(`snapshot mismatch: ${row.rel}`);
      }
    }
    // Exclusive journal creation: a failed/truncated write is itself unresolved
    // evidence. No target switches until durable() returns successfully.
    journaled = true;
    durable(journal, JSON.stringify({ version: 2, files: rows, staging: path.basename(staging) }) + '\n');
    for (const row of rows) {
      const dst = managedPath(runtimeRoot, row.rel);
      if (!same(fingerprint(dst), row.before)) throw new Error(`runtime changed before switch: ${row.rel}`);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(path.join(staging, row.rel), dst);
    }
    for (const row of rows) if (!same(fingerprint(managedPath(runtimeRoot, row.rel)), row.after)) throw new Error(`switch verification failed: ${row.rel}`);
    fs.unlinkSync(journal);
    journaled = false;
    try { fs.rmSync(staging, { recursive: true, force: true }); } catch (_) { /* committed, inert staging */ }
    return { ok: true, status: 'synced', created: !exists, copied: rels, reason: null };
  } catch (e) {
    if (journaled) {
      const rolled = recoverUnlocked(runtimeRoot);
      const restored = rolled.ok && rolled.recovered;
      return failure(`runtime sync failed: ${e.message}; ${restored ? 'old runtime restored' : (rolled.reason || 'journal absent; recovery not proven')}`,
        restored ? 'rolled-back' : 'unresolved');
    }
    try { fs.rmSync(staging, { recursive: true, force: true }); } catch (_) { /* inert staging retained */ }
    return failure(`runtime sync failed before switch; no target switch attempted: ${e.message}`, 'not-needed');
  }
}

/** Refresh differs from install only in whether absent runtime creation is allowed. */
function sync(pkgRoot, runtimeRoot, opts) {
  try {
    const exists = Boolean(stat(runtimeRoot));
    if (!exists && !(opts || {}).create) return { ok: true, status: 'skipped', created: false, copied: [],
      reason: 'the hooks are not installed on this machine — nothing to refresh, and an update is not the moment to install them' };
    directory(runtimeRoot);
    fs.mkdirSync(runtimeRoot, { recursive: true });
    return withLock(runtimeRoot, () => syncLocked(pkgRoot, runtimeRoot, exists));
  } catch (e) { return failure(`runtime admission/sync refused: ${e.message}`); }
}

module.exports = { sync, recover, stale, managedFiles, DIRS, MANIFEST, FLAT };
