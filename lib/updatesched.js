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
 *   with `systemctl --user enable --now`; `Persistent=true` runs a missed night at the next boot.
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

/** PATH for the job: node's own directory first, then the system's, never the caller's shell. */
function jobPath(platform, node) {
  const dirs = [path.dirname(node)];
  if (platform === 'launchd') dirs.push('/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin');
  else dirs.push('/usr/local/bin', '/usr/bin', '/bin');
  return dirs.filter((d, i) => dirs.indexOf(d) === i).join(':');
}

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
      `  <dict><key>PATH</key><string>${xml(jobPath(platform, o.node))}</string></dict>`,
      '  <key>ProcessType</key><string>Background</string>',
      '  <key>LowPriorityIO</key><true/>',
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
        `Environment=${unitWord(`PATH=${jobPath(platform, o.node)}`)}`,
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
    if (cur.text !== null && !cur.text.includes(MARK)) {
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
    if (cur.text !== null && cur.text.includes(MARK)) files.push({ file: want.file, text: cur.text, next: null });
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
    if (o.register !== false) {
      const err = runAll(unregisterCommands(p.platform, o));
      if (err) return { ok: false, state: p.state, lines: [`not removed: ${err}`] };
    }
    for (const f of p.files) {
      const saved = writer.protect(f.file, { home: o.home });
      if (saved.action === 'backup-failed') return { ok: false, state: p.state, lines: [`not removed: no copy of ${f.file} (${saved.error})`] };
      if (readText(f.file).text !== f.text) return { ok: false, state: p.state, lines: [`not removed: ${f.file} changed while this ran`] };
      fs.unlinkSync(f.file);
      lines.push(`removed ${f.file}${saved.path ? ` (copy: ${saved.path})` : ''}`);
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
  if (o.register === false) {
    lines.push('not registered with the OS: this HOME is not the account\'s own (a fixture or a sandbox)');
  } else {
    const probe = loadedCommand(p.platform, o);
    const loaded = probe && o.run(probe.cmd, probe.args).code === 0;
    if (p.state !== 'current' || !loaded || p.register) {
      const err = runAll(registerCommands(p.platform, o));
      if (err) return { ok: false, state: p.state, lines: lines.concat(`not registered: ${err}`) };
      lines.push(`registered with ${p.platform}`);
    }
  }
  const { hour, minute } = slot(o.home);
  const record = { schema: 1, platform: p.platform, files: jobFiles(p.platform, o).map((f) => f.file),
    task: p.platform === 'schtasks' ? TASK : undefined, node: o.node, script: o.script || scriptPath(o.home),
    at: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} local` };
  try {
    require('./store.js').writeJson(recordPath(o.home), () => record);
  } catch (e) { lines.push(`warning: ${RECORD} not written (${e.message})`); }
  return { ok: true, state: p.state, lines };
}

module.exports = {
  LABEL, UNIT, TASK, HOUR, MARK, RECORD, platformOf, slot, schedulerDir, scriptPath, recordPath, jobPath,
  jobFiles, taskCommand, registerCommands, unregisterCommands, loadedCommand, plan, planRemoval, apply,
};
