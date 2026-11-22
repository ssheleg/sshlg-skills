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
  let user = null;
  try { const u = os.userInfo(); accountHome = u.homedir; user = u.username; } catch (_) { accountHome = null; }
  const run = (cmd, args) => {
    const r = require('child_process').spawnSync(cmd, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
    return { code: r.error ? 127 : (r.status === null ? 1 : r.status), stdout: r.stdout || '', stderr: r.error ? r.error.message : (r.stderr || '') };
  };
  return { sched, o: {
    platform: sched.platformOf(process.platform), home, env: process.env,
    node: sched.stableNode(process.execPath, String(process.env.PATH || '').split(path.delimiter)),
    uid: typeof process.getuid === 'function' ? process.getuid() : null,
    user, // B-334: names the system-domain job of an account with no graphical login
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
 * The line that says the job's node sits in a version's own folder (B-358): no PATH entry of
 * the running node names no version, so removing that version stops the job with no error
 * anywhere. Null when the path names none.
 */
function versionedNodeLine(sched, node) {
  if (!sched.versionedPath(node)) return null;
  return `note: the job runs ${node}, a folder of one node version; removing that version (nvm uninstall, a manager's cleanup) `
    + 'stops the job. After it, run `npx sshlg-skills schedule --apply` under the node you keep.';
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
  if (o.mode === 'auto' && res.ok) { const w = versionedNodeLine(sched, o.node); if (w) log(`  ${w}`); }
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

/**
 * `schedule --daemon` (B-334): the nightly job as a LaunchDaemon for this account, on stdout
 * and nothing else there, so the output is the file. What to do with it goes to stderr. Nothing
 * is written and no scheduler is asked: installing it is an administrator's step.
 */
function printDaemon(sched, o) {
  const say = (m) => process.stderr.write(`${m}\n`);
  if (o.platform !== 'launchd') { say(`schedule --daemon: a LaunchDaemon is macOS's; this platform is ${o.platform || process.platform}`); return 1; }
  const d = sched.daemonFile(o);
  if (!d) { say('schedule --daemon: this account\'s name cannot be read or cannot be part of a launchd label'); return 1; }
  process.stdout.write(d.text);
  say(`# The nightly update job for the account ${o.user}, for a machine where it never logs in graphically.`);
  say('# An administrator installs it (this launcher never runs sudo):');
  say(`#   sudo install -o root -g wheel -m 644 <this output saved to a file> ${d.file}`);
  say(`#   sudo launchctl bootstrap system ${d.file}`);
  say(`# Remove: sudo launchctl bootout system/${d.label} && sudo rm ${d.file}`);
  if (!fs.existsSync(sched.scriptPath(o.home))) say(`# note: ${sched.scriptPath(o.home)} is not there yet; \`npx sshlg-skills update\` under update.mode auto writes it.`);
  if (o.mode !== 'auto') say(`# note: update.mode is ${o.mode}; the job installs nothing until it is auto.`);
  if (sched.versionedPath(o.node)) say(`# note: the job runs ${o.node}, a folder of one node version; removing that version stops the job.`);
  return 0;
}

/** `schedule` (status), `schedule --apply`, `schedule --revert`, `schedule --daemon` (B-323, B-334). */
function cmdSchedule(argv) {
  const args = argv.slice(3);
  const unknown = args.filter((a) => !['--apply', '--revert', '--dry-run', '--json', '--daemon'].includes(a));
  const json = args.includes('--json');
  if (unknown.length || (args.includes('--apply') && args.includes('--revert'))
      || (json && (args.includes('--apply') || args.includes('--revert') || args.includes('--dry-run')))
      || (args.includes('--daemon') && args.length > 1)) {
    if (unknown.length) log(`schedule: unknown argument ${unknown[0]}`); // B-331: the refusal names what it refused
    log('usage: npx sshlg-skills schedule [--apply | --revert] [--dry-run] | schedule --json | schedule --daemon');
    return 2;
  }
  const { sched, o } = scheduleContext();
  if (args.includes('--daemon')) return printDaemon(sched, o);
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
  const inSession = Boolean(probe && o.register && o.run(probe.cmd, probe.args).code === 0);
  // B-334: an account with no graphical login is scheduled by its system-domain job, when an
  // administrator loaded one; asked only when the login session holds none.
  const dq = o.register ? sched.daemonLoadedCommand(o) : null;
  const asDaemon = Boolean(!inSession && o.platform === 'launchd' && o.register && sched.daemonLoaded(o));
  const loaded = probe && o.register
    ? (inSession ? 'yes' : (asDaemon ? `yes (system daemon ${sched.daemonLabel(o.user)})` : 'no'))
    : 'not asked (this HOME is not the account\'s own)';
  const recFiles = rec && Array.isArray(rec.files) ? rec.files : [];
  if (json) {
    // B-340 (asked by fabric-dashboards, board `a61d646f`): the stable form other agents read.
    // schedule-status/1: fields are only added; a renamed or removed field is schedule-status/2.
    process.stdout.write(`${JSON.stringify({
      schema: 'schedule-status/1',
      updateMode: o.mode,
      platform: o.platform || null,
      job: rec ? { at: rec.at || null, files: recFiles, task: rec.task || null, node: rec.node || null, nodeVersioned: sched.versionedPath(rec.node) } : null,
      registered: probe && o.register ? (inSession || asDaemon) : null,
      plan: { state: p.state, reason: p.reason || null },
      // B-334: the account's system-domain job (macOS), when this run may ask the OS; added last.
      daemon: o.platform === 'launchd' && dq ? { label: sched.daemonLabel(o.user), loaded: asDaemon } : null,
    }, null, 2)}\n`);
    return 0;
  }
  log(`update.mode      ${o.mode}`);
  log(`platform         ${o.platform || `${process.platform} (no scheduler known)`}`);
  log(`job              ${rec ? `${rec.at || 'time unknown'}, ${recFiles.length ? recFiles.join(', ') : (rec.task ? `task ${rec.task}` : 'files unknown')}` : 'none recorded'}`);
  if (rec && rec.node) log(`node             ${rec.node}`);
  log(`registered       ${loaded}`);
  log(`plan             ${p.state}${p.reason ? ` (${p.reason})` : ''}`);
  if (p.state === 'install' || p.state === 'update') log('Apply: npx sshlg-skills schedule --apply');
  const w = rec && o.mode === 'auto' ? versionedNodeLine(sched, rec.node) : null;
  if (w) log(w);
  return 0;
}

Object.assign(module.exports, {
  scheduleContext, scheduleStep, refreshSchedule, cmdSchedule, withUpdateLock, versionedNodeLine
});
