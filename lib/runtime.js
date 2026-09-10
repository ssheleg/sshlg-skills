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
function jsFiles(dir, base, out) {
  out = out || [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) jsFiles(full, base, out);
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
      const a = fs.readFileSync(path.join(pkgRoot, rel));
      const b = fs.readFileSync(to);
      if (!a.equals(b)) differing.push(rel);
    } catch (e) { differing.push(rel); }
  }
  return { missing, differing, wanted };
}

/** The set of managed files (posix-relative) the package would install. */
function managedFiles(pkgRoot) {
  const rels = DIRS.flatMap((d) => jsFiles(path.join(pkgRoot, d), pkgRoot));
  for (const f of FLAT) if (fs.existsSync(path.join(pkgRoot, f))) rels.push(f);
  return rels.sort();
}

/**
 * Recover from a switch interrupted by a crash/SIGTERM (FIX-UP-05.04).
 *
 * `sync` writes `.switch-journal.json` before renaming staged files into place
 * and drops it on commit — so a journal PRESENT on restart means the switch did
 * not finish, and the managed files may be a mix of old and new (some renamed,
 * some not). Recovery ROLLS BACK to the previous generation: every managed file
 * named in the journal is restored from `.prev-generation`, giving a COHERENT
 * old-generation digest rather than a torn one. Unknown/user files are never
 * touched — only the journal's managed set moves. Idempotent: no journal, nothing
 * to do; run it as often as you like.
 */
function recover(runtimeRoot) {
  const journal = path.join(runtimeRoot, '.switch-journal.json');
  const prevGen = path.join(runtimeRoot, '.prev-generation');
  let files;
  try { files = JSON.parse(fs.readFileSync(journal, 'utf8')).files; }
  catch (e) { return { recovered: false, restored: [] }; }   // no journal in flight
  const restored = [];
  for (const rel of (files || [])) {
    const saved = path.join(prevGen, rel);
    if (fs.existsSync(saved)) {
      const dst = path.join(runtimeRoot, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(saved, dst);                            // roll the file back
      restored.push(rel);
    }
  }
  // Clear the transaction's artifacts; the active install is coherent again.
  for (const name of fs.readdirSync(runtimeRoot)) {
    if (name.startsWith('.staging-')) {
      fs.rmSync(path.join(runtimeRoot, name), { recursive: true, force: true });
    }
  }
  fs.rmSync(prevGen, { recursive: true, force: true });
  fs.rmSync(journal, { force: true });
  return { recovered: true, restored: restored.sort() };
}

/**
 * Bring the runtime level with this package — as ONE TRANSACTION (FIX-UP-05.01).
 *
 * The old path copied file-by-file straight into the target, so an ENOSPC on the
 * third of ten files left seven old, three new — a half install, and with
 * `--force` (which deleted the old install first) it left NOTHING. The writer now
 * stages every managed file into a same-filesystem sibling, VERIFIES each staged
 * byte against its source, journals the intent, snapshots the previous generation
 * so it is recoverable, and only then switches the files into place with atomic
 * renames. A fault at any point before the switch leaves the OLD install complete;
 * a fault during the switch is recoverable from the journal + previous generation.
 * Unknown files already in the runtime are PRESERVED — only the managed set moves.
 *
 * `{create}` false — the refresh path — returns without writing when the runtime is
 * absent. Idempotent: a second call stages the same bytes and switches them over
 * identical bytes, and `test/runtime_test.js` hashes the tree three times.
 */
function sync(pkgRoot, runtimeRoot, opts) {
  const o = opts || {};
  const exists = fs.existsSync(runtimeRoot);
  if (!exists && !o.create) {
    return {
      created: false,
      copied: [],
      reason: 'the hooks are not installed on this machine — nothing to refresh, and '
            + 'an update is not the moment to install them',
    };
  }

  // Self-heal first: a crash in a PREVIOUS run may have left a switch in flight.
  if (exists) recover(runtimeRoot);
  const rels = managedFiles(pkgRoot);
  // Idempotence at the layer that repeats: if the managed set already matches,
  // change NOTHING — no staging, no new previous-generation snapshot — so a
  // second run leaves the tree (recovery artifacts included) byte-identical.
  if (exists) {
    const { missing, differing } = stale(pkgRoot, runtimeRoot);
    if (!missing.length && !differing.length) {
      return { created: false, copied: [], reason: null };
    }
  }
  fs.mkdirSync(runtimeRoot, { recursive: true });
  // Staging sibling on the SAME filesystem as the runtime, so the final switch
  // is an atomic rename, never a cross-device copy.
  const staging = path.join(runtimeRoot, `.staging-${process.pid}`);
  const prevGen = path.join(runtimeRoot, '.prev-generation');
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  try {
    // 1. STAGE + VERIFY. If any copy fails (ENOSPC) it fails HERE, before a
    //    single target file has been touched — the old install stays complete.
    for (const rel of rels) {
      const src = path.join(pkgRoot, rel);
      const dst = path.join(staging, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      const fd = fs.openSync(dst, 'r+');
      try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      if (!fs.readFileSync(src).equals(fs.readFileSync(dst))) {
        throw new Error(`staged ${rel} does not match its source — refusing to switch`);
      }
    }

    // 2. JOURNAL the intent, and snapshot the previous generation of each
    //    managed file so the switch is reversible.
    fs.rmSync(prevGen, { recursive: true, force: true });
    fs.mkdirSync(prevGen, { recursive: true });
    for (const rel of rels) {
      const cur = path.join(runtimeRoot, rel);
      if (fs.existsSync(cur)) {
        const save = path.join(prevGen, rel);
        fs.mkdirSync(path.dirname(save), { recursive: true });
        fs.copyFileSync(cur, save);
      }
    }
    fs.writeFileSync(path.join(runtimeRoot, '.switch-journal.json'),
      JSON.stringify({ files: rels, staging: path.basename(staging), at: 'staged' }));

    // 3. SWITCH: atomic rename per file. Fast, and each is all-or-nothing.
    const copied = [];
    for (const rel of rels) {
      const dst = path.join(runtimeRoot, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(path.join(staging, rel), dst);
      copied.push(rel);
    }
    // 4. COMMIT: drop the journal and staging; keep the previous generation.
    fs.rmSync(path.join(runtimeRoot, '.switch-journal.json'), { force: true });
    fs.rmSync(staging, { recursive: true, force: true });
    return { created: !exists, copied: copied.sort(), reason: null };
  } catch (err) {
    // Abort: leave the old install untouched, remove the half-built staging.
    fs.rmSync(staging, { recursive: true, force: true });
    return { created: false, copied: [], reason: `install aborted, old runtime intact: ${err.message}` };
  }
}

module.exports = { sync, recover, stale, managedFiles, DIRS, MANIFEST, FLAT };
