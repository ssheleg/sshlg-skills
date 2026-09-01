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
  if (fs.existsSync(path.join(pkgRoot, MANIFEST))) wanted.push(MANIFEST);
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

/**
 * Bring the runtime level with this package.
 *
 * `{create}` false — the refresh path — returns without writing when the runtime is
 * absent, and says so in `reason` rather than leaving the caller to infer it from an
 * empty list. Idempotent: a second call copies the same bytes over the same bytes, and
 * `test/runtime_test.js` proves that by hashing the tree three times, because a pure
 * core with passing fixtures once sat under a command whose second run destroyed a file.
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

  const copied = [];
  const copyDir = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    let entries;
    try { entries = fs.readdirSync(from, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      const a = path.join(from, e.name);
      const b = path.join(to, e.name);
      if (e.isDirectory()) copyDir(a, b);
      else if (e.name.endsWith('.js')) {
        fs.copyFileSync(a, b);
        copied.push(path.relative(runtimeRoot, b).split(path.sep).join('/'));
      }
    }
  };

  fs.mkdirSync(runtimeRoot, { recursive: true });
  for (const d of DIRS) copyDir(path.join(pkgRoot, d), path.join(runtimeRoot, d));
  const manifestSrc = path.join(pkgRoot, MANIFEST);
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, path.join(runtimeRoot, MANIFEST));
    copied.push(MANIFEST);
  }
  return { created: !exists, copied: copied.sort(), reason: null };
}

module.exports = { sync, stale, DIRS, MANIFEST };
