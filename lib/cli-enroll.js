'use strict';
/**
 * `enroll`: this repository's routes, its SSHLG:PROJECT block and routers.json.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { ROOT, atomic, log } = require('./cli-core.js');

/**
 * `materialised` — the difference between a router obeyed from the tree and one skipped.
 *
 * A project can declare that a router's doctrine now lives in its own files: tokens with
 * their provenance markers, a voice pack, a fact registry, a scenario contract. Work that
 * obeys such a router stops invoking it, because the answers are cheaper to read than to
 * load — and a retrospective cannot tell that from a route somebody skipped for budget.
 *
 * **The declaration is not evidence; resolving it is.** Every path is opened and every
 * `#marker` looked for, so an entry naming a file that no longer carries the doctrine
 * reports FALSE rather than satisfied — a document asserting a route was honoured when it
 * was not is worse than the silence it replaced.
 *
 * The guards are **not run**. Executing code out of somebody's repository is a different
 * act with a different risk; the project's own gate runs them, and the report says so
 * rather than implying it.
 */
/**
 * `enroll`: which family routes apply to THIS repository, and what is still missing
 * for them (docs/evidence/specs/2026-10-19-enroll.md). `lib/enroll.js` decides from a
 * reader; this function lists the tree through Git, takes the backup through
 * `apply.protect()` and writes. Two things only: the `SSHLG:PROJECT` block in the
 * project's CLAUDE.md / AGENTS.md, and `.claude/routers.json` entries for material that
 * already exists, plus `.claude/sshlg-enroll.json`, the record of the entries it wrote
 * (B-229). `--prune` removes recorded entries whose material is gone, previewing unless
 * `--apply`. Exit 0 written, previewed or unchanged, 1 refused, 2 usage.
 */
function cmdEnroll(argv) {
  const E = require(path.join(ROOT, 'lib', 'enroll.js'));
  const Bk = require(path.join(ROOT, 'lib', 'blocks.js'));
  const A = require(path.join(ROOT, 'lib', 'apply.js'));
  const rest = argv.slice(3);
  const f = { root: null, dryRun: false, json: false, surface: null, prune: false, apply: false };
  const seen = new Set();
  const usageError = (reason) => {
    if (rest.includes('--json')) log(JSON.stringify({ schema: 'sshlg-enroll/1', state: 'USAGE', reason }));
    else log(`enroll: ${reason}\nusage: npx sshlg-skills enroll [--root DIR] [--dry-run] [--json] [--surface ${E.SURFACES.join('|')}]\n       npx sshlg-skills enroll --prune [--apply] [--root DIR] [--json]`);
    return 2;
  };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (seen.has(a)) return usageError(`duplicate flag: ${a}`);
    seen.add(a);
    if (a === '--dry-run') f.dryRun = true;
    else if (a === '--json') f.json = true;
    else if (a === '--prune') f.prune = true;
    else if (a === '--apply') f.apply = true;
    else if (a === '--root' || a === '--surface') {
      const v = rest[i + 1];
      if (!v || v.startsWith('--')) return usageError(`${a} needs a value`);
      i += 1;
      if (a === '--root') f.root = v;
      else if (!E.SURFACES.includes(v)) return usageError(`unknown surface: ${v} (${E.SURFACES.join('|')})`);
      else f.surface = v;
    } else return usageError(`unknown flag: ${a}`);
  }
  if (f.apply && !f.prune) return usageError('--apply belongs to --prune (enroll itself writes unless --dry-run)');
  if (f.prune && f.surface) return usageError('--surface does not apply to --prune');
  if (f.prune && f.apply && f.dryRun) return usageError('--apply and --dry-run contradict each other');

  const root = path.resolve(f.root || process.cwd());
  const refuse = (refusals) => {
    if (f.json) log(JSON.stringify({ schema: 'sshlg-enroll/1', state: 'REFUSED', root, refusals }, null, 2));
    else {
      log(`enroll: refused, nothing written (${root})`);
      for (const r of refusals) log(`  ${r.code}${r.file ? ' ' + r.file : ''}: ${r.reason}`);
    }
    return 1;
  };
  // A root outside a Git work tree is refused: the tree enroll reads is what Git lists.
  const inside = spawnSync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
  if (inside.status !== 0 || String(inside.stdout).trim() !== 'true') {
    return refuse([{ code: 'NOT_A_GIT_WORK_TREE', file: null, reason: `${root} is not inside a Git work tree; enroll reads the tree Git lists and writes only inside one` }]);
  }
  const ls = spawnSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (ls.status !== 0) return refuse([{ code: 'GIT_FAILED', file: null, reason: `git ls-files failed: ${String(ls.stderr).trim()}` }]);
  const paths = String(ls.stdout).split('\0').filter(Boolean);

  // Every path is resolved under the root and refused if it escapes: enroll is about
  // THIS repository and nothing else on the machine.
  const under = (rel) => {
    const target = path.resolve(root, rel);
    return target === root || target.startsWith(root + path.sep) ? target : null;
  };
  const MAX = 1024 * 1024;
  const kind = (rel) => {
    const target = under(rel);
    if (!target) return 'other';
    let st;
    try { st = fs.lstatSync(target); } catch (e) { return e.code === 'ENOENT' ? 'absent' : 'unreadable'; }
    if (st.isSymbolicLink()) return 'symlink';
    if (st.isDirectory()) return 'dir';
    if (!st.isFile()) return 'other';
    if (st.size > MAX) return 'unreadable';
    try { Bk.decode(fs.readFileSync(target)); } catch (e) { return e.message === 'INVALID_UTF8' ? 'invalid-utf8' : 'unreadable'; }
    return 'file';
  };
  const read = (rel) => {
    const target = under(rel);
    if (!target) return null;
    try {
      const st = fs.statSync(target);
      if (!st.isFile() || st.size > MAX) return null;
      return Bk.decode(fs.readFileSync(target));
    } catch (e) { return null; }
  };

  // Where a symlinked instruction file points, as a path inside the work tree, or null.
  const alias = (rel) => {
    const target = under(rel);
    if (!target) return null;
    let real;
    try { real = fs.realpathSync(target); } catch (e) { return null; }
    const realRoot = fs.realpathSync(root);
    if (!(real === realRoot || real.startsWith(realRoot + path.sep))) return null;
    return path.relative(realRoot, real).split(path.sep).join('/');
  };
  // Each changed file: the bytes the plan was computed from are still there, a verified
  // backup through apply.protect(), then the atomic write and a read-back.
  const home = process.env.HOME || os.homedir();
  const commit = (writes) => {
    const files = [];
    for (const w of writes) {
      if (w.action === 'unchanged') { files.push({ file: w.file, action: 'unchanged' }); continue; }
      const target = under(w.file);
      const now = kind(w.file) === 'absent' ? null : read(w.file);
      if (now !== w.before) return { refusal: { code: 'TARGET_CHANGED', file: w.file, reason: 'changed while enroll was planning; run it again' } };
      const saved = A.protect(target, { home });
      if (saved.action === 'backup-failed') {
        return { refusal: { code: 'BACKUP_FAILED', file: w.file, reason: `no verified backup (${saved.error || 'copy failed'}), so nothing was written` } };
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      atomic.write(target, w.after);
      if (fs.readFileSync(target, 'utf8') !== w.after) {
        return { refusal: { code: 'WRITE_UNVERIFIED', file: w.file, reason: 'the bytes read back differ from the bytes written; restore from the backup' } };
      }
      files.push({ file: w.file, action: w.action, backup: saved.path ? path.basename(saved.path) : saved.action });
    }
    return { files };
  };

  if (f.prune) {
    const q = E.prune({ paths, read, kind, alias });
    if (!q.ok) return refuse(q.refusals);
    const changed = q.writes.filter((w) => w.action !== 'unchanged');
    const state = !changed.length ? 'UNCHANGED' : f.apply ? 'PRUNED' : 'PREVIEW';
    let files = q.writes.map((w) => ({ file: w.file, action: w.action, diff: w.diff }));
    if (f.apply && changed.length) {
      const c = commit(q.writes);
      if (c.refusal) return refuse([c.refusal]);
      files = c.files;
    }
    if (f.json) {
      log(JSON.stringify({ schema: 'sshlg-enroll/1', state, mode: 'prune', root, record: q.record, removed: q.removed, kept: q.kept, files }, null, 2));
      return 0;
    }
    log(`enroll --prune: ${root}`);
    if (q.record === 'absent') log(`  no ${E.AUTH_PATH}: enroll has no record of writing any entry, so it removes none`);
    for (const r of q.removed) log(`  ${f.apply ? 'removed' : 'would remove'} ${r.router}: ${r.why}`);
    for (const k of q.kept) log(`  kept ${k.router}: ${k.why}`);
    if (!f.apply) {
      for (const w of changed) { log(`--- ${w.file}`); log(`+++ ${w.file} (after enroll --prune)`); log(w.diff); }
      log(changed.length ? 'Preview: nothing written. Run again with --apply to write it (backup first).' : 'enroll --prune: unchanged');
      return 0;
    }
    for (const x of files) log(`  ${x.file}: ${x.action}`);
    log(changed.length ? `enroll --prune: written (${changed.length} file${changed.length === 1 ? '' : 's'}; backups in ~/.sshlg-skills/backups/)` : 'enroll --prune: unchanged');
    return 0;
  }

  const p = E.plan({ paths, read, kind, alias }, { surface: f.surface });
  if (!p.ok) return refuse(p.refusals);

  const changed = p.writes.filter((w) => w.action !== 'unchanged');
  const summary = () => {
    log(`enroll: ${root}`);
    log(`  surface: ${p.surface}${p.override ? ` (override; detected ${p.detected})` : ' (detected)'}`);
    log(`  routes: ${p.routes.map((r) => r.router).join(', ')}`);
    log(`  remaining setup: ${p.remaining.length ? p.remaining.map((x) => x.seed).join(', ') : 'none'}`);
  };
  const report = (state, files) => ({
    schema: 'sshlg-enroll/1', state, root, surface: p.surface, detected: p.detected, override: p.override,
    signals: p.signals, extras: p.extras,
    routes: p.routes.map((r) => ({ router: r.router, extra: r.extra, setup: r.setup && { what: r.setup.what, state: r.setup.state, missing: r.setup.missing, seed: r.setup.seed } })),
    remaining: p.remaining, files,
  });

  if (f.dryRun) {
    if (f.json) {
      log(JSON.stringify(report('PREVIEW', p.writes.map((w) => ({ file: w.file, action: w.action, diff: w.diff }))), null, 2));
      return 0;
    }
    summary();
    for (const w of p.writes) {
      log(`  ${w.file}: ${w.action === 'unchanged' ? 'unchanged' : 'would ' + w.action}`);
      if (w.action !== 'unchanged') { log(`--- ${w.file}`); log(`+++ ${w.file} (after enroll)`); log(w.diff); }
    }
    log(changed.length ? 'Dry run: nothing written.' : 'enroll: unchanged (dry run, nothing written)');
    return 0;
  }

  const c = commit(p.writes);
  if (c.refusal) return refuse([c.refusal]);
  const files = c.files;
  if (f.json) { log(JSON.stringify(report(changed.length ? 'WRITTEN' : 'UNCHANGED', files), null, 2)); return 0; }
  summary();
  for (const x of files) log(`  ${x.file}: ${x.action}`);
  log(changed.length ? `enroll: written (${changed.length} file${changed.length === 1 ? '' : 's'}; backups in ~/.sshlg-skills/backups/)` : 'enroll: unchanged');
  return 0;
}

Object.assign(module.exports, {
  cmdEnroll
});
