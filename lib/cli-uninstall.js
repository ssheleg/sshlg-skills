'use strict';
/**
 * `uninstall`, `backup`, `wipe` and `restore`.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const {
  SKILLS, atomic, channelEntries, discoverChannels, lazy, lockSources, log, opres, plan,
  renderDryRun, run, skillLockFile
} = require('./cli-core.js');
const attachWaitPlan = lazy('./cli-rules.js', 'attachWaitPlan');
const cmdHooks = lazy('./cli-hooks.js', 'cmdHooks');
const executeWaitPlan = lazy('./cli-rules.js', 'executeWaitPlan');
const scheduleContext = lazy('./cli-schedule.js', 'scheduleContext');

/**
 * What `uninstall` would remove — computed once, walked by both the dry run
 * and the real run (the UP-02 rule: one array, two renderings).
 */
function uninstallRemovals() {
  const skillstore = require('../lib/skillstore.js');
  const familyIds = SKILLS.flatMap((s) => plan.skillIds(s));
  const memberNames = SKILLS.map((s) => s.name);
  const lock = lockSources();
  const removals = [];
  const kept = [];
  for (const channel of discoverChannels()) {
    for (const name of channelEntries(channel)) {
      if (!familyIds.includes(name)) continue;
      const full = path.join(channel, name);
      let isSymlink = false; let target = '';
      try { isSymlink = fs.lstatSync(full).isSymbolicLink(); } catch (_) { continue; }
      if (isSymlink) { try { target = fs.realpathSync(full); } catch (_) { try { target = fs.readlinkSync(full); } catch (_) { target = ''; } } }
      const verdict = skillstore.classifyFamilyEntry(
        { name, isSymlink, target, lockRepo: lock[name] || '' }, familyIds, memberNames);
      (verdict.remove ? removals : kept).push({ path: full, name, reason: verdict.reason });
    }
  }
  return { removals, kept, familyIds };
}

function planUninstall(f) {
  const apply = require('../lib/apply.js');
  const cursor = require('../lib/cursor.js');
  const { removals, kept } = uninstallRemovals();
  const steps = [];
  steps.push(opres.step('prune', 'home',
    `remove ${removals.length} family skill entr(ies) across the agent channels (${kept.length} name-collision entr(ies) left in place)`,
    { paths: removals.map((r) => r.path) }));
  steps.push(opres.step('runtime-sync', 'home',
    `drop the removed ids from ${skillLockFile()} (protect() copy first)`,
    { ids: [...new Set(removals.map((r) => r.name))] }));
  if (f.claude !== false) {
    for (const s of SKILLS) {
      steps.push(opres.step('subprocess', 'home', `claude plugin uninstall (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'uninstall', s.pluginInstall] }));
      steps.push(opres.step('subprocess', 'home', `claude plugin marketplace remove (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'marketplace', 'remove', s.name] }));
    }
  }
  for (const t of apply.TARGETS) {
    steps.push(opres.step('router-block', 'home',
      `remove the managed routing block from ${path.join(apply.hostRoot(t, os.homedir()), t.file)} (backup first; bytes outside the sentinels untouched)`,
      { file: path.join(apply.hostRoot(t, os.homedir()), t.file) }));
  }
  for (const t of require('../lib/instruction-targets.js').EXTRA_TARGETS) {
    const file = t.file(os.homedir(), process.env);
    steps.push(opres.step('router-block', 'home',
      `remove the managed routing block from ${file} if present (backup first; a symlink is left alone`
        + `${t.ownFile ? '; the file itself when the hub created it and the block was all it held' : ''})`, { file }));
  }
  steps.push(opres.step('prune', 'home', 'remove the Cursor rules file (backup first)',
    { paths: [path.join(os.homedir(), '.cursor', 'rules', cursor.FILENAME)] }));
  steps.push(opres.step('runtime-sync', 'home', 'hooks remove (returns any displaced statusLine)', {}));
  steps.push(opres.step('schedule', 'home', 'remove the nightly update job and its runner copy (backup first)', {}));
  return attachWaitPlan(steps, f, { remove: true });
}

/**
 * The reverse of `install`, at the same depth install reaches: the 28 family
 * skills out of every agent channel (provenance-checked — a foreign skill
 * that merely shares a name is reported and kept), the Claude plugins and
 * their marketplaces, the managed routing blocks (through `protect()`, bytes
 * outside the sentinels preserved), the Cursor rules file, and the hooks.
 * Backups precede every operator-file write; a copy that cannot be taken
 * cancels that write and only that write.
 */
function cmdUninstall(f) {
  const planned = planUninstall(f);
  if (f.dryRun) return renderDryRun(planned, 'uninstall');
  const apply = require('../lib/apply.js');
  const R = require('../lib/routers.js');
  const cursor = require('../lib/cursor.js');
  const home = os.homedir();
  let ok = executeWaitPlan(planned);

  const { removals, kept } = uninstallRemovals();
  log(`\n== Removing family skills from the agent channels ==`);
  for (const r of removals) {
    try { fs.rmSync(r.path, { recursive: true, force: true }); log(`  - ${r.path} (${r.reason})`); }
    catch (e) { log(`  ! ${r.path}: ${e.message}`); ok = false; }
  }
  for (const k of kept) log(`  = left in place: ${k.path} (${k.reason})`);

  const lockFile = skillLockFile();
  const dropped = [...new Set(removals.map((r) => r.name))];
  if (dropped.length && fs.existsSync(lockFile)) {
    // The same copy-first rule as every other write: protect() takes the
    // backup, and a copy that cannot be taken cancels the rewrite.
    const savedLock = apply.protect(lockFile, { home });
    if (savedLock.action === 'backup-failed') {
      log(`  ! lock NOT rewritten: the backup failed (${savedLock.error}); the file is unchanged`);
      ok = false;
    } else {
      try {
        const j = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        let hits = 0;
        for (const id of dropped) if (j.skills && j.skills[id]) { delete j.skills[id]; hits += 1; }
        atomic.write(lockFile, JSON.stringify(j, null, 2) + '\n');
        log(`  lock: dropped ${hits} entr(ies); copy at ${savedLock.path}`);
      } catch (e) { log(`  ! lock not rewritten: ${e.message}`); ok = false; }
    }
  }

  if (f.claude !== false) {
    log(`\n== Removing Claude Code plugins ==`);
    for (const s of SKILLS) {
      // Plugin first, then its marketplace: the reverse of install's order.
      run('claude', ['plugin', 'uninstall', s.pluginInstall]);
      run('claude', ['plugin', 'marketplace', 'remove', s.name]);
    }
  }

  log(`\n== Removing the managed routing block ==`);
  // B-206: the other hosts' files too; a symlinked shared file is not ours to write through.
  const IT = require('../lib/instruction-targets.js');
  const extraFiles = IT.EXTRA_TARGETS.map((t) => ({ file: t.file(home, process.env), row: t }))
    .filter((x) => { try { return !fs.lstatSync(x.file).isSymbolicLink(); } catch (e) { return false; } });
  for (const { file, row } of apply.TARGETS.map((t) => ({ file: path.join(apply.hostRoot(t, home), t.file), row: null })).concat(extraFiles)) {   // honours CODEX_HOME & co. (B-165)
    if (!fs.existsSync(file)) { log(`  routers: ${file}: absent`); continue; }
    const before = fs.readFileSync(file, 'utf8');
    // B-283: a file the hub created and filled with the block alone goes with the block.
    const next = IT.afterRemoval(row, before);
    if (next.action === 'none') { log(`  routers: ${file}: no managed block`); continue; }
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') {
      log(`  ! ${file} NOT written: the backup failed (${saved.error}); the file is unchanged`);
      ok = false; continue;
    }
    if (next.action === 'delete') {
      fs.unlinkSync(file);
      log(`  routers: removed ${file} (the hub created it and the block was all it held; copy: ${saved.path})`);
      continue;
    }
    atomic.write(file, next.text);
    log(`  routers: block removed from ${file} (copy: ${saved.path})`);
  }
  const mdc = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  if (fs.existsSync(mdc)) {
    const saved = apply.protect(mdc, { home });
    if (saved.action === 'backup-failed') { log(`  ! ${mdc} kept: backup failed (${saved.error})`); ok = false; }
    else { fs.unlinkSync(mdc); log(`  routers: removed ${mdc} (copy: ${saved.path})`); }
  }

  log(`\n== Removing hooks ==`);
  ok = cmdHooks(['remove']) && ok;

  // The nightly job goes with the packs (B-323); the mode in config.json stays the operator's.
  try {
    const { sched, o } = scheduleContext();
    const p = sched.planRemoval(o);
    log('\n== Removing the nightly update job ==');
    const res = sched.apply(p, o);
    for (const l of res.lines) log(`  ${l}`);
    if (res.ok) { try { fs.rmSync(sched.schedulerDir(o.home), { recursive: true, force: true }); } catch (_) { /* nothing to run it */ } }
    ok = res.ok && ok;
  } catch (e) { log(`  ! nightly job not removed: ${e.message}`); ok = false; }

  // Skill visibility is NOT undone here: its values sit in other hosts' settings and
  // undoing them is a separate, previewable act. What it still holds is named instead.
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8'));
    const held = ['claude', 'codex', 'gemini', 'pi', 'opencode', 'hermes']
      .filter((h) => Array.isArray(rec[h]) && rec[h].length).map((h) => `${h} ${rec[h].length}`);
    if (held.length || rec.applied === true) {
      log(`\n== Skill visibility (left in place) ==`);
      log(`  still hidden by this launcher: ${held.join(', ') || 'none'}${rec.applied === true ? '; update re-applies it while consent stands' : ''}`);
      log('  Undo it: npx sshlg-skills visibility --revert   (preview: npx sshlg-skills visibility)');
    }
  } catch (e) { /* no record: visibility never ran here */ }

  log('\n(restart every agent: skills are read at session start)');
  log('To reinstall: npx sshlg-skills install');
  return ok;
}

// ------------------------------------------------- backup / wipe / restore (ALL skills)

function backupsDir() {
  const d = path.join(os.homedir(), '.sshlg-skills', 'backups');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/**
 * Archive EVERY agent's skills directory — the whole store, not just the
 * family — as one tar.gz relative to $HOME, symlinks preserved as symlinks,
 * with a manifest beside it that restore verifies against. Returns the
 * verification input for `wipeGate`, so `wipe` cannot proceed on a backup
 * this function could not prove.
 */
function cmdBackupAll() {
  const skillstore = require('../lib/skillstore.js');
  const home = os.homedir();
  const channels = discoverChannels().map((p) => ({ path: p, entries: channelEntries(p) }));
  const nonEmpty = channels.filter((c) => c.entries.length);
  // Nothing to archive is a state, not a failure: a run that finds no skills exits 0 (passioncode board
  // request c33f4d8b, 2026-11-09). A tar or readback failure still returns null and exits 1.
  if (!nonEmpty.length) { log('backup: no agent skills directories found: nothing to archive'); return { nothing: true, channels: [] }; }
  const stamp = skillstore.stampName(new Date());
  const man = skillstore.manifest(nonEmpty, stamp);
  const archive = path.join(backupsDir(), `${stamp}.tar.gz`);
  const rel = nonEmpty.map((c) => path.relative(home, c.path));
  log(`\n== Backing up ${man.total} entr(ies) from ${nonEmpty.length} channel(s) ==`);
  for (const c of nonEmpty) log(`  ${c.path}: ${c.entries.length}`);
  const r = spawnSync('tar', ['-czf', archive, '-C', home, ...rel], { stdio: 'inherit' });
  if (r.status !== 0) { log('backup: tar failed: no archive written'); return null; }
  // Verify against the archive's OWN listing, not the plan.
  const list = spawnSync('tar', ['-tzf', archive], { encoding: 'utf8' });
  if (list.status !== 0) { log('backup: the archive does not list back: treating as failed'); return null; }
  const listed = list.stdout.split('\n').filter(Boolean);
  let verifiedCount = 0;
  for (const c of nonEmpty) {
    const prefix = path.relative(home, c.path) + '/';
    for (const name of c.entries) {
      if (listed.some((l) => l === prefix + name || l.startsWith(prefix + name + '/') || l === prefix + name + '/')) verifiedCount += 1;
    }
  }
  fs.writeFileSync(archive.replace(/\.tar\.gz$/, '.manifest.json'), JSON.stringify(man, null, 2) + '\n', 'utf8');
  log(`backup: ${archive}`);
  log(`backup: verified ${verifiedCount}/${man.total} entr(ies) against the archive's own listing`);
  return { archive, manifestTotal: man.total, verifiedCount, channels: nonEmpty };
}

/**
 * Back up EVERYTHING, verify the archive, and only then tear the stores down.
 * A backup that could not be taken and proven cancels the wipe — the same
 * copy-first rule the operator files live under, held for the skill stores.
 */
function cmdWipeAll(f) {
  const skillstore = require('../lib/skillstore.js');
  if (f.dryRun) {
    const channels = discoverChannels().map((p) => ({ path: p, entries: channelEntries(p) })).filter((c) => c.entries.length);
    log(`\n== --dry-run: wipe would back up, verify, then remove ==`);
    for (const c of channels) log(`  ${c.path}: ${c.entries.length} entr(ies)`);
    log(`(${channels.reduce((n, c) => n + c.entries.length, 0)} entr(ies) total; 0 mutations)`);
    return true;
  }
  const backup = cmdBackupAll();
  if (backup && backup.nothing) { log('\nwipe: nothing to remove'); return true; }
  const gate = skillstore.wipeGate(backup || {});
  if (!gate.ok) { log(`\nwipe REFUSED: ${gate.reason}`); return false; }
  log(`\n== Wiping (${gate.reason}) ==`);
  let ok = true;
  for (const c of backup.channels) {
    for (const name of c.entries) {
      const full = path.join(c.path, name);
      try { fs.rmSync(full, { recursive: true, force: true }); }
      catch (e) { log(`  ! ${full}: ${e.message}`); ok = false; }
    }
    log(`  cleared ${c.path} (${c.entries.length})`);
  }
  log(`\nTo bring everything back: npx sshlg-skills restore`);
  log('(restart every agent: skills are read at session start)');
  return ok;
}

/** Bring a backup back, newest by default, and verify counts against its manifest. */
function cmdRestoreAll(rest) {
  const skillstore = require('../lib/skillstore.js');
  const home = os.homedir();
  const dir = backupsDir();
  const named = (rest || []).find((a) => !a.startsWith('-'));
  let archive = named ? (fs.existsSync(named) ? named : path.join(dir, named)) : null;
  if (!archive) {
    const all = fs.readdirSync(dir).filter((n) => /^skills-all-.*\.tar\.gz$/.test(n)).sort();
    if (!all.length) { log(`restore: no skills-all-*.tar.gz in ${dir}`); return false; }
    archive = path.join(dir, all[all.length - 1]);
  }
  if (!fs.existsSync(archive)) { log(`restore: ${archive} does not exist`); return false; }
  log(`\n== Restoring ${archive} into ${home} ==`);
  const r = spawnSync('tar', ['-xzf', archive, '-C', home], { stdio: 'inherit' });
  if (r.status !== 0) { log('restore: tar failed'); return false; }
  const manFile = archive.replace(/\.tar\.gz$/, '.manifest.json');
  if (!fs.existsSync(manFile)) {
    log('restore: extracted, but no manifest sits beside the archive: counts not verified');
    return true;
  }
  const man = JSON.parse(fs.readFileSync(manFile, 'utf8'));
  const observed = {};
  for (const row of man.channels) observed[row.path] = channelEntries(row.path).length;
  const v = skillstore.restoreVerify(man, observed);
  if (!v.ok) { for (const m of v.mismatches) log(`  ! ${m}`); log('restore: extracted, but the counts above disagree with the manifest'); return false; }
  log(`restore: verified: ${man.total} entr(ies) across ${man.channels.length} channel(s) match the manifest`);
  log('(restart every agent: skills are read at session start)');
  return true;
}

Object.assign(module.exports, {
  uninstallRemovals, planUninstall, cmdUninstall, backupsDir, cmdBackupAll, cmdWipeAll,
  cmdRestoreAll
});
