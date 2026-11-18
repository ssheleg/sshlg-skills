'use strict';
/**
 * B-359: `install` and `update` run from a copy the npx cache cannot take away.
 *
 * `npx sshlg-skills@latest update` runs from `~/.npm/_npx/<hash>/node_modules/sshlg-skills`, and
 * an update takes a quarter of an hour of child processes. On 2026-11-18 that folder was
 * removed mid-run (a disk-pressure cleanup emptied the npx cache), and the next lazy
 * `require` failed with MODULE_NOT_FOUND after the skills CLI had already run. Modules
 * required later and scripts started as processes (`lib/domainscan.js`) all need the files
 * on disk, so the launcher copies its own package files to
 * `~/.sshlg-skills/launcher/<version>-<digest>` once, and runs from there.
 *
 * Only the package's own files are copied (package.json `files` plus package.json), never a
 * checkout's tree; a run from a checkout or a global install is left where it is.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV = 'SSHLG_SKILLS_STABLE_COPY';
const KEEP = 2;

/** Is this package root inside an npx cache, which npm may prune while it runs? */
function inNpxCache(root) {
  return root.split(path.sep).includes('_npx');
}

/** Every file the package ships, relative to its root, sorted. */
function packageFiles(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const out = ['package.json'];
  const walk = (rel) => {
    const abs = path.join(root, rel);
    let st;
    try { st = fs.statSync(abs); } catch (_) { return; }
    if (st.isDirectory()) for (const n of fs.readdirSync(abs).sort()) walk(path.join(rel, n));
    else if (st.isFile()) out.push(rel);
  };
  for (const f of pkg.files || []) walk(f.replace(/\/+$/, ''));
  return [...new Set(out)].sort();
}

/**
 * Copy the package to `<home>/.sshlg-skills/launcher/<version>-<digest>` and return that root.
 * A finished copy with the same digest is reused as is; a partial one is replaced. Older
 * copies beyond KEEP are removed, never the one returned.
 */
function stableCopy({ root, home }) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const files = packageFiles(root);
  const h = crypto.createHash('sha256');
  for (const f of files) { h.update(f + '\0'); h.update(fs.readFileSync(path.join(root, f))); h.update('\0'); }
  const digest = h.digest('hex').slice(0, 12);
  const base = path.join(home, '.sshlg-skills', 'launcher');
  const dest = path.join(base, `${pkg.version}-${digest}`);
  const done = path.join(dest, '.complete');
  if (!fs.existsSync(done)) {
    const tmp = `${dest}.${process.pid}.tmp`;
    fs.rmSync(tmp, { recursive: true, force: true });
    for (const f of files) {
      fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true });
      fs.copyFileSync(path.join(root, f), path.join(tmp, f));
      fs.chmodSync(path.join(tmp, f), fs.statSync(path.join(root, f)).mode & 0o777);
    }
    fs.writeFileSync(path.join(tmp, '.complete'), digest + '\n');
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(tmp, dest);
  }
  let others = [];
  try { others = fs.readdirSync(base).filter((n) => !n.endsWith('.tmp') && path.join(base, n) !== dest); } catch (_) { /* none */ }
  others = others.map((n) => ({ n, t: fs.statSync(path.join(base, n)).mtimeMs })).sort((a, b) => b.t - a.t);
  for (const o of others.slice(KEEP - 1)) fs.rmSync(path.join(base, o.n), { recursive: true, force: true });
  return dest;
}

/**
 * The root to run from: this one, or a stable copy when this one sits in the npx cache and
 * this process is not already the copy. `null` means run here.
 */
function relaunchRoot({ root, home, env }) {
  if (env[ENV] || !inNpxCache(root)) return null;
  return stableCopy({ root, home });
}

module.exports = { ENV, KEEP, inNpxCache, packageFiles, stableCopy, relaunchRoot };
