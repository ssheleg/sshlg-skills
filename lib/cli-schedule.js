'use strict';
/**
 * `schedule` and the nightly job step `install` and `update` keep level with update.mode.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { ROOT, log, opres, run } = require('./cli-core.js');

/**
 * The nightly update job (B-323, `lib/updatesched.js`): its options on this machine. The OS is
 * touched only when HOME is the account's own home: a fixture HOME (tests, a sandbox) gets the
 * files and never a job in the real login session. `SSHLG_SKILLS_SCHEDULE=skip` keeps a run
 * away from the OS scheduler on purpose.
 */
function scheduleContext() {
  const home = os.homedir();
  const sched = require('../lib/updatesched.js');
  const configLib = require('../lib/config.js');
  let accountHome = null;
  try { accountHome = os.userInfo().homedir; } catch (_) { accountHome = null; }
  const run = (cmd, args) => {
    const r = require('child_process').spawnSync(cmd, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
    return { code: r.error ? 127 : (r.status === null ? 1 : r.status), stdout: r.stdout || '', stderr: r.error ? r.error.message : (r.stderr || '') };
  };
  return { sched, o: {
    platform: sched.platformOf(process.platform), home, env: process.env,
    node: sched.stableNode(process.execPath, String(process.env.PATH || '').split(path.delimiter)),
    uid: typeof process.getuid === 'function' ? process.getuid() : null,
    mode: configLib.updateMode(configLib.readConfig(home)),
    // Read again by `apply` right before the job would remove itself (B-324).
    reread: () => configLib.updateMode(configLib.readConfig(home)),
    register: sched.shouldRegister({ home, accountHome, env: process.env }), run,
  } };
}

/**
 * Run `fn` under `~/.sshlg-skills/update.lock`, the lock `update` takes (R05). A live holder is
 * a refusal with exit 75 (`lock.BUSY_EXIT`) and nothing done, said the way `update` says it
 * with `label` in front. B-324: `config set update.mode` and `schedule --apply/--revert` take
 * it too, so a mode switched during the nightly job's window can no longer boot out the job
 * while its update runs. The lock is released on return, a throw and `process.exit`.
 */
function withUpdateLock(label, fn) {
  const lock = require('../lib/updatelock.js');
  const home = os.homedir();
  const got = lock.acquire(home);
  if (!got.ok) {
    const h = got.holder || {};
    log(`${label}: refused: ${got.message}${h.host ? ` on ${h.host}` : ''}.`);
    log(`  lock: ${lock.lockPath(home)} (taken over once its process is gone; a lock from another host after 30 minutes)`);
    return lock.BUSY_EXIT;
  }
  if (got.tookOver) log(`${label}: took over update.lock: ${got.tookOver}`);
  if (got.degraded) log(`${label}: running without a lock: ${got.degraded}`);
  const free = () => { lock.release(home, got.token); };
  process.on('exit', free);
  try {
    return fn();
  } finally {
    free();
  }
}

/** The dry-run line for install and update: what the schedule step would do, nothing done. */
function scheduleStep(f) {
  if (f.member) return null;
  try {
    const { sched, o } = scheduleContext();
    const p = sched.plan(o);
    const what = o.mode !== 'auto'
      ? (p.state === 'remove' ? `update.mode is ${o.mode}: remove the nightly update job` : `update.mode is ${o.mode}: no nightly update job`)
      : ({ install: 'install the nightly update job', update: 'rewrite the nightly update job', current: 'nightly update job: already level (re-registered if the OS lost it)' }[p.state]
        || `nightly update job: ${p.state}${p.reason ? ` (${p.reason})` : ''}`);
    return opres.step('schedule', 'home', `${what} (copy before write, through protect())`,
      { files: p.files.map((x) => x.file), platform: String(p.platform) });
  } catch (e) { return null; }
}

/**
 * Bring the nightly job level with `update.mode` (install, update, `schedule --apply`, a
 * `config set` of the mode). `auto`: refresh the runner copy, write and register the job;
 * otherwise remove it. Announced the first time it is installed, with the way to stop it.
 */
function refreshSchedule(f) {
  if (f && f.member) return true; // a lone member's installer speaks only for itself
  log('\n== Nightly update job ==');
  let ctx;
  try { ctx = scheduleContext(); } catch (e) { log(`  not scheduled: ${e.message}`); return false; }
  const { sched, o } = ctx;
  if (!o.platform) { log(`  not scheduled: no scheduler this launcher knows on ${process.platform}`); return true; }
  if (o.mode === 'auto') {
    const r = require('../lib/runtime.js').sync(ROOT, sched.schedulerDir(o.home), { create: true });
    if (r.ok === false) { log(`  not scheduled: the runner copy was not refreshed (${r.reason})`); return false; }
  }
  let p;
  let res;
  try {
    p = sched.plan(o);
    res = sched.apply(p, o);
  } catch (e) {
    // Never a stack trace that skips the rest of install or update: named, and the run goes on.
    log(`  not scheduled: ${e.code || e.message}`);
    return false;
  }
  for (const l of res.lines) log(`  ${l}`);
  // A job left registered keeps its runner, and so does a job that is this very run (B-324).
  if (o.mode !== 'auto' && p.state === 'remove' && res.ok && !['deferred', 'kept'].includes(res.state)) {
    try { fs.rmSync(sched.schedulerDir(o.home), { recursive: true, force: true }); } catch (_) { /* a copy left behind runs nothing */ }
  }
  if (o.mode === 'auto' && res.ok && p.state === 'install' && res.state !== 'unreachable' && o.register !== false) {
    const at = sched.slot(o.home);
    log(`  The set now also installs itself every night at ${String(at.hour).padStart(2, '0')}:${String(at.minute).padStart(2, '0')} `
      + 'when a newer one is out (a sleeping machine catches up when it wakes).');
    log('  Only notify instead: npx sshlg-skills config set update.mode notify   ·   remove the job: npx sshlg-skills schedule --revert');
  }
  if (o.mode !== 'auto' && p.state === 'absent') log(`  update.mode is ${o.mode}: no job, as asked`);
  return res.ok;
}

/** `schedule` (status), `schedule --apply`, `schedule --revert` (B-323). */
function cmdSchedule(argv) {
  const args = argv.slice(3);
  const unknown = args.filter((a) => !['--apply', '--revert', '--dry-run', '--json'].includes(a));
  const json = args.includes('--json');
  if (unknown.length || (args.includes('--apply') && args.includes('--revert'))
      || (json && (args.includes('--apply') || args.includes('--revert') || args.includes('--dry-run')))) {
    log('usage: npx sshlg-skills schedule [--apply | --revert] [--dry-run] | schedule --json');
    return 2;
  }
  const { sched, o } = scheduleContext();
  const dry = args.includes('--dry-run');
  if (args.includes('--revert')) {
    const p = sched.planRemoval(o);
    if (dry) { log(`schedule --revert --dry-run: ${p.state}; files: ${p.files.map((x) => x.file).join(', ') || 'none'}; update.mode ${o.mode === 'auto' ? 'auto → notify' : `${o.mode} (unchanged)`}`); return 0; }
    return withUpdateLock('schedule --revert', () => {
      // Without this the next `update` would put the job back: the mode is what it follows.
      // Read under the lock: the mode read before it may have changed while another run held it.
      const configLib = require('../lib/config.js');
      const was = configLib.updateMode(configLib.readConfig(o.home));
      if (was === 'auto') configLib.setUpdateMode(o.home, 'notify');
      log(`update.mode: ${was}${was === 'auto' ? ' → notify (so `update` does not put the job back; `config set update.mode auto` does)' : ' (unchanged)'}`);
      return refreshSchedule({}) ? 0 : 1;
    });
  }
  if (args.includes('--apply')) {
    if (dry) { const st = scheduleStep({}); log(`schedule --apply --dry-run: ${st ? st.label : 'nothing'}`); return 0; }
    return withUpdateLock('schedule --apply', () => (refreshSchedule({}) ? 0 : 1));
  }
  const p = sched.plan(o);
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(sched.recordPath(o.home), 'utf8')); } catch (_) { rec = null; }
  const probe = o.platform && sched.loadedCommand(o.platform, o);
  const loaded = probe && o.register ? (o.run(probe.cmd, probe.args).code === 0 ? 'yes' : 'no') : 'not asked (this HOME is not the account\'s own)';
  const recFiles = rec && Array.isArray(rec.files) ? rec.files : [];
  if (json) {
    // B-340 (asked by fabric-dashboards, board `a61d646f`): the stable form other agents read.
    // schedule-status/1: fields are only added; a renamed or removed field is schedule-status/2.
    process.stdout.write(`${JSON.stringify({
      schema: 'schedule-status/1',
      updateMode: o.mode,
      platform: o.platform || null,
      job: rec ? { at: rec.at || null, files: recFiles, task: rec.task || null } : null,
      registered: probe && o.register ? loaded === 'yes' : null,
      plan: { state: p.state, reason: p.reason || null },
    }, null, 2)}\n`);
    return 0;
  }
  log(`update.mode      ${o.mode}`);
  log(`platform         ${o.platform || `${process.platform} (no scheduler known)`}`);
  log(`job              ${rec ? `${rec.at || 'time unknown'}, ${recFiles.length ? recFiles.join(', ') : (rec.task ? `task ${rec.task}` : 'files unknown')}` : 'none recorded'}`);
  log(`registered       ${loaded}`);
  log(`plan             ${p.state}${p.reason ? ` (${p.reason})` : ''}`);
  if (p.state === 'install' || p.state === 'update') log('Apply: npx sshlg-skills schedule --apply');
  return 0;
}

Object.assign(module.exports, {
  scheduleContext, scheduleStep, refreshSchedule, cmdSchedule, withUpdateLock
});
