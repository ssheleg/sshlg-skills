'use strict';
/**
 * The nightly update job (B-323): the set installs itself on a machine where no session goes
 * idle, too. Until 1.86.0 the only unattended path was the idle hook (`hooks/notification.js`),
 * so a machine whose agents run headless, or whose operator never left a session idle, stayed
 * on its set until somebody typed `update`.
 *
 * - macOS: a LaunchAgent `~/Library/LaunchAgents/me.sshlg.skills.update.plist`, loaded into the
 *   login session with `launchctl bootstrap gui/<uid>`. A calendar job missed while the Mac
 *   slept runs once on wake.
 * - Linux: a user timer `~/.config/systemd/user/sshlg-skills-update.{service,timer}`, enabled
 *   with `systemctl --user enable --now`; `Persistent=true` runs a missed night when the user's
 *   manager next starts (at boot with lingering, otherwise at login; no lingering, no run while
 *   logged out).
 * - Windows: a task `sshlg-skills-update` made with `schtasks /Create /SC DAILY`; no file.
 *
 * The job runs `<node> ~/.sshlg-skills/scheduler/lib/updaterun.js --scheduled`: the absolute
 * node path, because launchd and systemd see neither nvm nor Homebrew on PATH, and a copy of
 * this package's `lib/` the launcher refreshes on every `update`, because npx may prune its own
 * cache. The runner asks the registry, then updates only when a newer set is out and none ran
 * in the last day (`lib/updatecheck.js` decides; `update.lock` keeps it apart from the idle
 * updater and the operator's own run).
 *
 * Only mode `auto` (`lib/config.js`) has a job; `notify` and `off` remove it. Pure planning
 * (`plan`, `planRemoval`, the command lists) is separate from the writes (`apply`), which take
 * an injected runner, so fixtures need no scheduler and no HOME. Every file write goes through
 * `apply.protectedWrite` (copy first, compare before replace, read back); a removal copies first.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LABEL = 'me.sshlg.skills.update';
const UNIT = 'sshlg-skills-update';
const TASK = 'sshlg-skills-update';
const HOUR = 4;
const MARK = 'sshlg-skills managed update schedule (B-323). `npx sshlg-skills schedule --revert` removes it.';
/** What ownership is recognised by: stable across releases, so a reworded MARK is still ours. */
const OWNER = 'sshlg-skills managed update schedule';
const RECORD = 'schedule.json';

/** `launchd` | `systemd` | `schtasks` | null for a platform with no scheduler here. */
function platformOf(p) {
  if (p === 'darwin') return 'launchd';
  if (p === 'linux') return 'systemd';
  if (p === 'win32') return 'schtasks';
  return null;
}

/**
 * The minute, stable per account: the same machine always gets the same time (so a rerun
 * writes the same bytes), and a fleet does not ask the registry in the same second.
 */
function slot(home) {
  const h = crypto.createHash('sha256').update(String(home)).digest();
  return { hour: HOUR, minute: h[0] % 60 };
}

/** Where the runner copy lives, and the script the job executes. */
function schedulerDir(home) { return path.join(home, '.sshlg-skills', 'scheduler'); }
function scriptPath(home) { return path.join(schedulerDir(home), 'lib', 'updaterun.js'); }
function recordPath(home) { return path.join(home, '.sshlg-skills', RECORD); }

/**
 * PATH for the job: node's own directory first, then where agent CLIs install themselves
 * (`~/.local/bin`: Claude Code's native installer), then the system's, never the caller's shell.
 */
function jobPath(platform, node, home) {
  const dirs = [path.dirname(node)];
  if (home) dirs.push(path.join(home, '.local', 'bin'));
  if (platform === 'launchd') dirs.push('/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin');
  else dirs.push('/usr/local/bin', '/usr/bin', '/bin');
  return dirs.filter((d, i) => dirs.indexOf(d) === i).join(':');
}

/**
 * The node the job runs: a PATH entry that resolves to the running node, so the path outlives
 * an upgrade (Homebrew's `/opt/homebrew/bin/node`, not its versioned Cellar keg, which
 * `brew cleanup` deletes and launchd then cannot start). The running binary only when no PATH
 * entry resolves to it. `o`: {realpath, exists} for fixtures.
 */
function stableNode(execPath, pathDirs, o) {
  const real = (o && o.realpath) || ((p) => fs.realpathSync(p));
  const exists = (o && o.exists) || fs.existsSync;
  let want;
  try { want = real(execPath); } catch (_) { return execPath; }
  for (const dir of pathDirs || []) {
    if (!path.isAbsolute(dir)) continue;
    for (const name of process.platform === 'win32' ? ['node.exe'] : ['node']) {
      const cand = path.join(dir, name);
      try { if (exists(cand) && real(cand) === want) return cand; } catch (_) { /* next */ }
    }
  }
  return execPath;
}

/**
 * Whether this run may touch the OS scheduler: only for the account's own home (a test or
 * sandbox HOME would load a job into the real login session), and not when told to skip.
 */
function shouldRegister(o) {
  return Boolean(o && o.home && o.accountHome && o.home === o.accountHome && (o.env || {}).SSHLG_SKILLS_SCHEDULE !== 'skip');
}

/**
 * Whether this process runs under the job itself: re-registering then would boot the job out
 * and kill this very update mid-run (launchd ends the job's process group).
 */
function insideJob(env) {
  const e = env || {};
  return e.SSHLG_SKILLS_JOB === '1' || e.XPC_SERVICE_NAME === LABEL;
}

/** A scheduler this login cannot reach (no systemd user manager, no GUI session, no binary). */
const UNREACHABLE = /ENOENT|Failed to connect to bus|No medium found|not been booted with systemd|Could not find domain|Domain does not support|Operation not permitted while System Integrity|user manager|DBUS_SESSION_BUS_ADDRESS|XDG_RUNTIME_DIR/i;

function xml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** systemd's own quoting for one ExecStart word. */
function unitWord(s) { return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`; }

/** The files a platform's job is made of, as `[{file, text}]`. Windows has none. */
function jobFiles(platform, o) {
  const { hour, minute } = slot(o.home);
  const script = o.script || scriptPath(o.home);
  if (platform === 'launchd') {
    const file = path.join(o.home, 'Library', 'LaunchAgents', `${LABEL}.plist`);
    const text = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- ${MARK} -->`,
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      `  <key>Label</key><string>${LABEL}</string>`,
      '  <key>ProgramArguments</key>',
      '  <array>',
      `    <string>${xml(o.node)}</string>`,
      `    <string>${xml(script)}</string>`,
      '    <string>--scheduled</string>',
      '  </array>',
      '  <key>StartCalendarInterval</key>',
      `  <dict><key>Hour</key><integer>${hour}</integer><key>Minute</key><integer>${minute}</integer></dict>`,
      '  <key>EnvironmentVariables</key>',
      `  <dict><key>PATH</key><string>${xml(jobPath(platform, o.node, o.home))}</string>`
        + '<key>SSHLG_SKILLS_JOB</key><string>1</string></dict>',
      // Not ProcessType Background: macOS throttles such a job so hard that `npm view` took
      // 38 s and answered nothing (measured 2026-11-07); Nice keeps it out of the way enough.
      '  <key>Nice</key><integer>10</integer>',
      '</dict>',
      '</plist>',
      ''].join('\n');
    return [{ file, text }];
  }
  if (platform === 'systemd') {
    const dir = path.join(o.home, '.config', 'systemd', 'user');
    const pad = (n) => String(n).padStart(2, '0');
    return [
      { file: path.join(dir, `${UNIT}.service`), text: [
        `# ${MARK}`,
        '[Unit]',
        'Description=sshlg-skills: install the next family set when one is out',
        '',
        '[Service]',
        'Type=oneshot',
        `ExecStart=${[o.node, script].map(unitWord).join(' ')} --scheduled`,
        `Environment=${unitWord(`PATH=${jobPath(platform, o.node, o.home)}`)} SSHLG_SKILLS_JOB=1`,
        'Nice=10',
        ''].join('\n') },
      { file: path.join(dir, `${UNIT}.timer`), text: [
        `# ${MARK}`,
        '[Unit]',
        'Description=sshlg-skills: nightly check for the next family set',
        '',
        '[Timer]',
        `OnCalendar=*-*-* ${pad(hour)}:${pad(minute)}:00`,
        'Persistent=true',
        '',
        '[Install]',
        'WantedBy=timers.target',
        ''].join('\n') },
    ];
  }
  return [];
}

/** The Windows task's command line; `/TR` takes at most 261 characters. */
function taskCommand(o) {
  return `"${o.node}" "${o.script || scriptPath(o.home)}" --scheduled`;
}

/** What registers the job with the OS, as `[{cmd, args, allowFail}]`. */
function registerCommands(platform, o) {
  if (platform === 'launchd') {
    const domain = `gui/${o.uid}`;
    return [
      // A loaded job keeps its old definition until it is booted out; absent is not an error.
      { cmd: 'launchctl', args: ['bootout', `${domain}/${LABEL}`], allowFail: true },
      { cmd: 'launchctl', args: ['bootstrap', domain, jobFiles(platform, o)[0].file] },
    ];
  }
  if (platform === 'systemd') {
    return [
      { cmd: 'systemctl', args: ['--user', 'daemon-reload'] },
      { cmd: 'systemctl', args: ['--user', 'enable', '--now', `${UNIT}.timer`] },
    ];
  }
  if (platform === 'schtasks') {
    const { hour, minute } = slot(o.home);
    const pad = (n) => String(n).padStart(2, '0');
    return [{ cmd: 'schtasks', args: ['/Create', '/F', '/SC', 'DAILY', '/ST', `${pad(hour)}:${pad(minute)}`,
      '/TN', TASK, '/TR', taskCommand(o)] }];
  }
  return [];
}

/** What unregisters it. Every step may fail on a job that is not there. */
function unregisterCommands(platform, o) {
  if (platform === 'launchd') return [{ cmd: 'launchctl', args: ['bootout', `gui/${o.uid}/${LABEL}`], allowFail: true }];
  if (platform === 'systemd') return [{ cmd: 'systemctl', args: ['--user', 'disable', '--now', `${UNIT}.timer`], allowFail: true }];
  if (platform === 'schtasks') return [{ cmd: 'schtasks', args: ['/Delete', '/F', '/TN', TASK], allowFail: true }];
  return [];
}

/** The read-only question "is the job registered?": exit 0 means yes. */
function loadedCommand(platform, o) {
  if (platform === 'launchd') return { cmd: 'launchctl', args: ['print', `gui/${o.uid}/${LABEL}`] };
  if (platform === 'systemd') return { cmd: 'systemctl', args: ['--user', 'is-enabled', `${UNIT}.timer`] };
  if (platform === 'schtasks') return { cmd: 'schtasks', args: ['/Query', '/TN', TASK] };
  return null;
}

function readText(file) {
  try { return { text: fs.readFileSync(file, 'utf8') }; } catch (e) { return e.code === 'ENOENT' ? { text: null } : { error: e.code || e.message }; }
}

/**
 * What `apply` would do to bring the job level with the mode. `o`: {platform, home, node,
 * script, uid, mode, read}. Returns `{platform, state, files, reason?}`: state is
 * `unsupported` | `unreadable` | `conflict` | `current` | `install` | `update` | `remove` |
 * `absent`; each file is `{file, text, next}` (`next` null deletes). `current` still
 * re-registers when the OS has lost the job; `apply` asks.
 */
function plan(o) {
  const platform = o.platform;
  if (!platform) return { platform, state: 'unsupported', files: [], reason: 'no scheduler this launcher knows on this platform' };
  if (o.mode !== 'auto') return planRemoval(o);
  if (platform === 'schtasks' && taskCommand(o).length > 261) {
    return { platform, state: 'unsupported', files: [], reason: `the task command is ${taskCommand(o).length} characters; schtasks /TR takes 261` };
  }
  const read = o.read || readText;
  const files = [];
  let present = false;
  for (const want of jobFiles(platform, o)) {
    const cur = read(want.file);
    if (cur.error) return { platform, state: 'unreadable', files: [], reason: `${want.file}: ${cur.error}` };
    if (cur.text !== null && !cur.text.includes(OWNER)) {
      return { platform, state: 'conflict', files: [], reason: `${want.file} was not written by sshlg-skills; left as it is` };
    }
    if (cur.text !== null) present = true;
    files.push({ file: want.file, text: cur.text, next: want.text });
  }
  const changed = files.filter((f) => f.text !== f.next);
  if (platform === 'schtasks') return { platform, state: 'current', files: [], register: true };
  if (!changed.length) return { platform, state: 'current', files };
  return { platform, state: present ? 'update' : 'install', files };
}

/** What removing the job would do: the files of ours, deleted; others' files left alone. */
function planRemoval(o) {
  const platform = o.platform;
  if (!platform) return { platform, state: 'unsupported', files: [], reason: 'no scheduler this launcher knows on this platform' };
  const read = o.read || readText;
  const files = [];
  for (const want of jobFiles(platform, o)) {
    const cur = read(want.file);
    if (cur.error) return { platform, state: 'unreadable', files: [], reason: `${want.file}: ${cur.error}` };
    if (cur.text !== null && cur.text.includes(OWNER)) files.push({ file: want.file, text: cur.text, next: null });
  }
  if (platform === 'schtasks') return { platform, state: 'remove', files: [], unregister: true };
  return { platform, state: files.length ? 'remove' : 'absent', files };
}

/**
 * Carry out a plan. `o`: the plan's options plus `run(cmd, args) -> {code, stdout, stderr}`
 * and `register` (false: write the files, never touch the OS; a fixture HOME is not the
 * account whose login session launchd would load the job into). Returns
 * `{ok, state, lines}`, one line per thing done, every failure named.
 */
function apply(p, o) {
  const lines = [];
  const writer = require('./apply.js');
  const runAll = (cmds) => {
    for (const c of cmds) {
      const r = o.run(c.cmd, c.args);
      if (r.code !== 0 && !c.allowFail) {
        return `${c.cmd} ${c.args.join(' ')} exited ${r.code}: ${String(r.stderr || r.stdout || '').trim().split('\n')[0].slice(0, 200)}`;
      }
    }
    return null;
  };
  if (['unsupported', 'unreadable', 'conflict'].includes(p.state)) {
    return { ok: p.state === 'unsupported', state: p.state, lines: [`not scheduled: ${p.reason}`] };
  }
  if (p.state === 'absent') return { ok: true, state: 'absent', lines: ['no nightly job here: nothing to remove'] };
  if (p.state === 'remove') {
    if (p.platform === 'schtasks') {
      const q = loadedCommand(p.platform, o);
      if (o.register === false || o.run(q.cmd, q.args).code !== 0) {
        return { ok: true, state: 'absent', lines: ['no nightly job here: nothing to remove'] };
      }
    }
    // The copies first: a copy that fails must leave the job registered, not half removed.
    const saved = [];
    for (const f of p.files) {
      const c = writer.protect(f.file, { home: o.home });
      if (c.action === 'backup-failed') return { ok: false, state: p.state, lines: [`not removed: no copy of ${f.file} (${c.error})`] };
      saved.push(c);
    }
    if (o.register !== false) {
      const err = runAll(unregisterCommands(p.platform, o));
      if (err) return { ok: false, state: p.state, lines: [`not removed: ${err}`] };
    }
    for (const [i, f] of p.files.entries()) {
      if (readText(f.file).text !== f.text) return { ok: false, state: p.state, lines: lines.concat(`not removed: ${f.file} changed while this ran`) };
      fs.unlinkSync(f.file);
      lines.push(`removed ${f.file}${saved[i].path ? ` (copy: ${saved[i].path})` : ''}`);
    }
    if (p.platform === 'systemd' && p.files.length && o.register !== false) {
      const err = runAll([{ cmd: 'systemctl', args: ['--user', 'daemon-reload'], allowFail: true }]);
      if (err) lines.push(`warning: ${err}`);
    }
    if (p.platform === 'schtasks') lines.push(`removed the task ${TASK}`);
    try { fs.unlinkSync(recordPath(o.home)); } catch (_) { /* no record: nothing to clear */ }
    return { ok: true, state: p.state, lines };
  }
  for (const f of p.files.filter((x) => x.text !== x.next)) {
    fs.mkdirSync(path.dirname(f.file), { recursive: true });
    const w = writer.protectedWrite(f.file, f.next, { home: o.home, expected: f.text });
    if (!w.ok) return { ok: false, state: p.state, lines: [`not scheduled: ${f.file}: ${w.action}${w.error ? ` (${w.error})` : ''}`] };
    lines.push(`${f.text === null ? 'wrote' : 'rewrote'} ${f.file}`);
  }
  // What the OS was last given: a definition written from inside the job is on disk but not
  // loaded, and the next interactive run must register it although the file looks level.
  const defHash = crypto.createHash('sha256').update(jobFiles(p.platform, o).map((f) => f.text).join('\0')
    + (p.platform === 'schtasks' ? taskCommand(o) : '')).digest('hex');
  let prior = null;
  try { prior = JSON.parse(fs.readFileSync(recordPath(o.home), 'utf8')); } catch (_) { prior = null; }
  let registeredHash = prior && prior.registered ? prior.registered : null;
  if (o.register === false) {
    lines.push('not registered with the OS: this HOME is not the account\'s own (a fixture or a sandbox)');
  } else if (insideJob(o.env)) {
    // Booting the job out (or re-creating a Windows task) from inside it would kill this update;
    // the file is in place, and the next interactive install, update or login loads it.
    if (p.state !== 'current' || registeredHash !== defHash) {
      lines.push('not re-registered: this run is the job itself; the next interactive install, update or `schedule --apply` registers the new definition');
    }
  } else {
    const probe = loadedCommand(p.platform, o);
    const loaded = probe && o.run(probe.cmd, probe.args).code === 0;
    if (p.state !== 'current' || !loaded || p.register || (registeredHash !== null && registeredHash !== defHash)) {
      const err = runAll(registerCommands(p.platform, o));
      if (err && UNREACHABLE.test(err)) {
        // An environment without a user scheduler (a container, WSL without systemd, no GUI
        // login) is not a failed update: said, and the exit code stays what it was.
        lines.push(`not registered: no user scheduler reachable here (${err}); `
          + 'run `npx sshlg-skills schedule --apply` from a login session that has one');
        return { ok: true, state: 'unreachable', lines };
      }
      if (err) return { ok: false, state: p.state, lines: lines.concat(`not registered: ${err}`) };
      lines.push(`registered with ${p.platform}`);
    }
    registeredHash = defHash;
  }
  const { hour, minute } = slot(o.home);
  const record = { schema: 1, platform: p.platform, files: jobFiles(p.platform, o).map((f) => f.file),
    task: p.platform === 'schtasks' ? TASK : undefined, node: o.node, script: o.script || scriptPath(o.home),
    registered: registeredHash || undefined,
    at: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} local` };
  try {
    require('./store.js').writeJson(recordPath(o.home), () => record);
  } catch (e) { lines.push(`warning: ${RECORD} not written (${e.message})`); }
  return { ok: true, state: p.state, lines };
}

module.exports = {
  LABEL, UNIT, TASK, HOUR, MARK, OWNER, RECORD, UNREACHABLE, platformOf, slot, stableNode, shouldRegister, insideJob, schedulerDir, scriptPath, recordPath, jobPath,
  jobFiles, taskCommand, registerCommands, unregisterCommands, loadedCommand, plan, planRemoval, apply,
};
