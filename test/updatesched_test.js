'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
/**
 * The nightly update job (B-323, lib/updatesched.js): the plan per platform from fixtures, and
 * the writes against a temporary HOME with an injected runner, so no test registers anything
 * with this machine's launchd, systemd or Task Scheduler.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const S = require('../lib/updatesched.js');

let n = 0;
const it = (name, fn) => { fn(); n += 1; console.log(`  ok  ${name}`); };

const HOME = '/home/someone';
const NODE = '/opt/node v26/bin/node';
const base = (platform, extra) => Object.assign({ platform, home: HOME, node: NODE, uid: 501, mode: 'auto',
  read: () => ({ text: null }) }, extra);
const tmpHome = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sched-home-'));
const recorder = (codes) => {
  const calls = [];
  const run = (cmd, args) => { calls.push([cmd, ...args].join(' ')); const c = codes && codes(cmd, args); return { code: c || 0, stdout: '', stderr: c ? 'boom' : '' }; };
  return { calls, run };
};
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

it('the platform names its scheduler; anything else is unsupported, not guessed', () => {
  assert.strictEqual(S.platformOf('darwin'), 'launchd');
  assert.strictEqual(S.platformOf('linux'), 'systemd');
  assert.strictEqual(S.platformOf('win32'), 'schtasks');
  assert.strictEqual(S.platformOf('freebsd'), null);
  assert.strictEqual(S.plan(base(null)).state, 'unsupported');
});

it('the time is the same for one account on every run, at night, and differs across accounts', () => {
  const a = S.slot('/Users/a');
  assert.deepStrictEqual(a, S.slot('/Users/a'));
  assert.strictEqual(a.hour, 4);
  assert.ok(a.minute >= 0 && a.minute < 60);
  const minutes = new Set(Array.from({ length: 40 }, (_, i) => S.slot(`/Users/u${i}`).minute));
  assert.ok(minutes.size > 10, `40 accounts share ${minutes.size} minutes`);
});

it('launchd: one plist, the absolute node, the runner copy, a calendar slot, a PATH that is not the shell\'s', () => {
  const [f] = S.jobFiles('launchd', base('launchd'));
  assert.strictEqual(f.file, path.join(HOME, 'Library', 'LaunchAgents', 'me.sshlg.skills.update.plist'));
  assert.ok(f.text.includes(S.MARK_XML), 'the file does not say who owns it');
  // A comment holding `--` is not well-formed XML: launchd and plistlib refuse the whole file (board finding fd6cf23d).
  for (const c of f.text.match(/<!--([\s\S]*?)-->/g) || []) assert.ok(!c.slice(4, -3).includes('--'), `XML comment holds "--": ${c}`);
  assert.ok(!S.MARK_XML.includes('--'));
  assert.ok(f.text.includes('<string>/opt/node v26/bin/node</string>'));
  assert.ok(f.text.includes(`<string>${path.join(HOME, '.sshlg-skills', 'scheduler', 'lib', 'updaterun.js')}</string>`));
  assert.ok(f.text.includes('<string>--scheduled</string>'));
  assert.ok(f.text.includes(`<key>Minute</key><integer>${S.slot(HOME).minute}</integer>`));
  assert.ok(f.text.includes('<string>/opt/node v26/bin:/home/someone/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>'),
    'the job PATH lacks node\'s directory or ~/.local/bin (Claude Code\'s native installer)');
  assert.ok(f.text.includes('<key>SSHLG_SKILLS_JOB</key><string>1</string>'), 'the job cannot tell it is the job');
  assert.ok(!/RunAtLoad/.test(f.text), 'a login must not start an update mid-work');
  assert.ok(!/Background|LowPriorityIO/.test(f.text), 'a Background job is throttled until npm answers nothing');
  const amp = S.jobFiles('launchd', base('launchd', { node: '/a&b/<n>/node' }))[0].text;
  assert.ok(amp.includes('/a&amp;b/&lt;n&gt;/node'), 'a path with XML characters breaks the plist');
});

it('launchd: the plist is one plutil accepts (macOS only)', () => {
  if (process.platform !== 'darwin') return;
  const d = tmpHome();
  try {
    const f = path.join(d, 'job.plist');
    fs.writeFileSync(f, S.jobFiles('launchd', base('launchd', { node: '/a&b/node' }))[0].text);
    const r = spawnSync('plutil', ['-lint', f], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
});

it('systemd: a oneshot service and a persistent timer, ExecStart quoted the way systemd reads it', () => {
  const [svc, timer] = S.jobFiles('systemd', base('systemd', { node: '/x/"q"\\node' }));
  assert.strictEqual(svc.file, path.join(HOME, '.config', 'systemd', 'user', 'sshlg-skills-update.service'));
  assert.ok(svc.text.includes('Type=oneshot'));
  assert.ok(svc.text.includes('ExecStart="/x/\\"q\\"\\\\node" '), svc.text);
  assert.ok(svc.text.includes(' --scheduled\n'));
  const m = String(S.slot(HOME).minute).padStart(2, '0');
  assert.ok(timer.text.includes(`OnCalendar=*-*-* 04:${m}:00`));
  assert.ok(timer.text.includes('Persistent=true'), 'a night missed while off is never caught up');
  assert.ok(timer.text.includes('WantedBy=timers.target'));
  for (const f of [svc, timer]) assert.ok(f.text.includes(S.MARK));
  assert.ok(svc.text.includes(`Environment="PATH=/x/\\"q\\"\\\\node/..:/home/someone/.local/bin:/usr/local/bin:/usr/bin:/bin" SSHLG_SKILLS_JOB=1`)
    || /^Environment="PATH=[^"\n]*\.local\/bin[^"\n]*" SSHLG_SKILLS_JOB=1$/m.test(svc.text), `the unit has no job PATH or job marker:\n${svc.text}`);
});

it('register and unregister commands per platform; a missing job is not an error to remove', () => {
  const o = base('launchd');
  assert.deepStrictEqual(S.registerCommands('launchd', o).map((c) => [c.cmd, ...c.args].join(' ')), [
    'launchctl bootout gui/501/me.sshlg.skills.update',
    `launchctl bootstrap gui/501 ${path.join(HOME, 'Library', 'LaunchAgents', 'me.sshlg.skills.update.plist')}`]);
  assert.strictEqual(S.registerCommands('launchd', o)[0].allowFail, true);
  assert.deepStrictEqual(S.registerCommands('systemd', o).map((c) => c.args.join(' ')),
    ['--user daemon-reload', '--user enable --now sshlg-skills-update.timer']);
  const win = S.registerCommands('schtasks', base('schtasks', { node: 'C:\\node\\node.exe', script: 'C:\\u\\run.js' }))[0];
  assert.deepStrictEqual(win.args.slice(0, 7), ['/Create', '/F', '/SC', 'DAILY', '/ST', `04:${String(S.slot(HOME).minute).padStart(2, '0')}`, '/TN']);
  assert.strictEqual(win.args[9], '"C:\\node\\node.exe" "C:\\u\\run.js" --scheduled');
  for (const p of ['launchd', 'systemd', 'schtasks']) {
    assert.ok(S.unregisterCommands(p, o).every((c) => c.allowFail), p);
  }
});

it('plan: absent → install; ours and level → current; ours and different → update; foreign → conflict', () => {
  const want = S.jobFiles('launchd', base('launchd'))[0].text;
  assert.strictEqual(S.plan(base('launchd')).state, 'install');
  assert.strictEqual(S.plan(base('launchd', { read: () => ({ text: want }) })).state, 'current');
  assert.strictEqual(S.plan(base('launchd', { read: () => ({ text: `${want}<!-- old -->` }) })).state, 'update');
  const foreign = S.plan(base('launchd', { read: () => ({ text: '<plist/>' }) }));
  assert.strictEqual(foreign.state, 'conflict');
  assert.match(foreign.reason, /not written by sshlg-skills/);
  assert.strictEqual(S.plan(base('launchd', { read: () => ({ error: 'EACCES' }) })).state, 'unreadable');
});

it('plan: notify and off remove our job and leave a foreign file alone', () => {
  const want = S.jobFiles('launchd', base('launchd'))[0].text;
  for (const mode of ['notify', 'off']) {
    const p = S.plan(base('launchd', { mode, read: () => ({ text: want }) }));
    assert.strictEqual(p.state, 'remove', mode);
    assert.strictEqual(p.files[0].next, null);
    assert.strictEqual(S.plan(base('launchd', { mode })).state, 'absent');
    assert.strictEqual(S.plan(base('launchd', { mode, read: () => ({ text: '<plist/>' }) })).state, 'absent');
  }
});

it('Windows: a task command over 261 characters is unsupported, said, never truncated', () => {
  const long = base('schtasks', { node: `C:\\${'n'.repeat(250)}\\node.exe` });
  const p = S.plan(long);
  assert.strictEqual(p.state, 'unsupported');
  assert.match(p.reason, /261/);
});

it('apply: writes and registers, three runs leave the same bytes and register once', () => {
  const home = tmpHome();
  try {
    const rec = recorder((cmd, args) => (args[0] === 'print' && !rec.calls.some((c) => c.includes('bootstrap')) ? 113 : 0));
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run };
    const first = S.apply(S.plan(o), o);
    assert.strictEqual(first.ok, true, first.lines.join('\n'));
    assert.strictEqual(first.state, 'install');
    const plist = path.join(home, 'Library', 'LaunchAgents', 'me.sshlg.skills.update.plist');
    const hashes = [sha(plist)];
    for (let i = 0; i < 2; i += 1) {
      const again = S.apply(S.plan(o), o);
      assert.strictEqual(again.state, 'current');
      hashes.push(sha(plist));
    }
    assert.strictEqual(new Set(hashes).size, 1, 'a rerun changed the job file');
    assert.strictEqual(rec.calls.filter((c) => c.includes('bootstrap')).length, 1, rec.calls.join('\n'));
    const record = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'schedule.json'), 'utf8'));
    assert.deepStrictEqual(record.files, [plist]);
    assert.strictEqual(record.platform, 'launchd');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('apply: a job the OS lost is registered again even when the file is level', () => {
  const home = tmpHome();
  try {
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: recorder().run };
    S.apply(S.plan(o), o);
    const lost = recorder((cmd, args) => (args[0] === 'print' ? 113 : 0));
    const r = S.apply(S.plan(Object.assign({}, o, { run: lost.run })), Object.assign({}, o, { run: lost.run }));
    assert.strictEqual(r.state, 'current');
    assert.ok(lost.calls.some((c) => c.includes('bootstrap')), lost.calls.join('\n'));
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('apply: a fixture HOME gets the files and never touches the OS scheduler', () => {
  const home = tmpHome();
  try {
    const rec = recorder();
    const o = { platform: 'systemd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run, register: false };
    const r = S.apply(S.plan(o), o);
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(rec.calls, []);
    assert.ok(r.lines.some((l) => /not registered with the OS/.test(l)));
    assert.ok(fs.existsSync(path.join(home, '.config', 'systemd', 'user', 'sshlg-skills-update.timer')));
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('apply: a failed registration is a failure, named with the command', () => {
  const home = tmpHome();
  try {
    const rec = recorder((cmd, args) => (args.includes('enable') ? 1 : 0));
    const o = { platform: 'systemd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run };
    const r = S.apply(S.plan(o), o);
    assert.strictEqual(r.ok, false);
    assert.ok(r.lines.some((l) => /not registered: systemctl --user enable --now sshlg-skills-update\.timer exited 1/.test(l)), r.lines.join('\n'));
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('apply: removal unregisters, copies each file before deleting it, and clears the record', () => {
  const home = tmpHome();
  try {
    const rec = recorder();
    const o = { platform: 'systemd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run };
    S.apply(S.plan(o), o);
    const off = Object.assign({}, o, { mode: 'notify' });
    const r = S.apply(S.plan(off), off);
    assert.strictEqual(r.ok, true, r.lines.join('\n'));
    assert.strictEqual(r.state, 'remove');
    const dir = path.join(home, '.config', 'systemd', 'user');
    assert.deepStrictEqual(fs.readdirSync(dir), []);
    assert.ok(r.lines.filter((l) => /^removed .*\(copy: /.test(l)).length === 2, r.lines.join('\n'));
    assert.ok(rec.calls.includes('systemctl --user disable --now sshlg-skills-update.timer'));
    assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'schedule.json')));
    const again = S.apply(S.plan(off), off);
    assert.strictEqual(again.state, 'absent');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('apply: a foreign file where ours would go is left byte for byte', () => {
  const home = tmpHome();
  try {
    const plist = path.join(home, 'Library', 'LaunchAgents', 'me.sshlg.skills.update.plist');
    fs.mkdirSync(path.dirname(plist), { recursive: true });
    fs.writeFileSync(plist, '<plist>mine</plist>\n');
    const rec = recorder();
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run };
    const r = S.apply(S.plan(o), o);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(fs.readFileSync(plist, 'utf8'), '<plist>mine</plist>\n');
    assert.deepStrictEqual(rec.calls, []);
    const rm = Object.assign({}, o, { mode: 'off' });
    assert.strictEqual(S.apply(S.plan(rm), rm).state, 'absent');
    assert.strictEqual(fs.readFileSync(plist, 'utf8'), '<plist>mine</plist>\n');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('the job runs a node path that survives an upgrade, not the versioned keg', () => {
  const links = { '/opt/homebrew/bin/node': '/opt/homebrew/Cellar/node/26.10.0_2/bin/node' };
  const real = (p) => links[p] || p;
  const exists = (p) => p in links || p === '/opt/homebrew/Cellar/node/26.10.0_2/bin/node';
  const keg = '/opt/homebrew/Cellar/node/26.10.0_2/bin/node';
  assert.strictEqual(S.stableNode(keg, ['relative', '/usr/bin', '/opt/homebrew/bin'], { realpath: real, exists }), '/opt/homebrew/bin/node');
  assert.strictEqual(S.stableNode(keg, ['/usr/bin'], { realpath: real, exists }), keg, 'no PATH entry: the running binary');
  const other = { '/opt/homebrew/bin/node': '/opt/homebrew/Cellar/node/27.0.0/bin/node' };
  assert.strictEqual(S.stableNode(keg, ['/opt/homebrew/bin'], { realpath: (p) => other[p] || p, exists: () => true }), keg,
    'a node on PATH that is another version must not be taken');
});

it('only the account\'s own HOME may reach the OS scheduler, and skip keeps it away', () => {
  assert.strictEqual(S.shouldRegister({ home: '/Users/a', accountHome: '/Users/a', env: {} }), true);
  assert.strictEqual(S.shouldRegister({ home: '/tmp/fixture', accountHome: '/Users/a', env: {} }), false);
  assert.strictEqual(S.shouldRegister({ home: '/Users/a', accountHome: '/Users/a', env: { SSHLG_SKILLS_SCHEDULE: 'skip' } }), false);
  assert.strictEqual(S.shouldRegister({ home: '/Users/a', accountHome: null, env: {} }), false);
});

it('a run that is the job itself writes the new definition and never boots itself out', () => {
  const home = tmpHome();
  try {
    const rec = recorder();
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: rec.run, env: { XPC_SERVICE_NAME: S.LABEL } };
    const r = S.apply(S.plan(o), o);
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(rec.calls, [], rec.calls.join('\n'));
    assert.ok(r.lines.some((l) => /this run is the job itself/.test(l)));
    assert.strictEqual(S.insideJob({ SSHLG_SKILLS_JOB: '1' }), true);
    assert.strictEqual(S.insideJob({}), false);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('no user scheduler reachable is said and is not a failure; a real refusal still is', () => {
  for (const [platform, code, stderr] of [['systemd', 127, 'spawnSync systemctl ENOENT'],
    ['systemd', 1, 'Failed to connect to bus: No medium found'],
    ['launchd', 125, 'Bootstrap failed: 125: Domain does not support specified action'],
    ['launchd', 113, 'Could not find domain for user gui: 501']]) {
    const home = tmpHome();
    try {
      const run = (cmd, args) => (['is-enabled', 'print'].includes(args[0]) || args.includes('is-enabled')
        ? { code: 1, stdout: '', stderr } : (args[0] === 'bootout' ? { code: 3, stdout: '', stderr: '' } : { code, stdout: '', stderr }));
      const o = { platform, home, node: NODE, uid: 501, mode: 'auto', run };
      const r = S.apply(S.plan(o), o);
      assert.strictEqual(r.ok, true, `${stderr}: ${r.lines.join('\n')}`);
      assert.strictEqual(r.state, 'unreachable');
      assert.ok(r.lines.some((l) => /no user scheduler reachable here/.test(l)));
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  }
  const home = tmpHome();
  try {
    const run = (cmd, args) => (args[0] === 'bootstrap' ? { code: 5, stdout: '', stderr: 'Bootstrap failed: 5: Input/output error' } : { code: args[0] === 'print' ? 113 : 0, stdout: '', stderr: '' });
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run };
    assert.strictEqual(S.apply(S.plan(o), o).ok, false, 'a real bootstrap failure read as an unreachable scheduler');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('removal takes its copies before it unregisters; Windows with no task says so', () => {
  const home = tmpHome();
  try {
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: recorder().run };
    S.apply(S.plan(o), o);
    const rec = recorder();
    const off = Object.assign({}, o, { mode: 'off', run: rec.run, home });
    const p = S.plan(off);
    const writer = require('../lib/apply.js');
    const protect = writer.protect;
    writer.protect = () => ({ action: 'backup-failed', error: 'fixture' });
    let r;
    try { r = S.apply(p, off); } finally { writer.protect = protect; }
    assert.strictEqual(r.ok, false);
    assert.deepStrictEqual(rec.calls, [], 'the job was unregistered although its copy failed');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
  const win = recorder((cmd, args) => (args[0] === '/Query' ? 1 : 0));
  const o = base('schtasks', { mode: 'notify', run: win.run });
  const r = S.apply(S.plan(o), o);
  assert.strictEqual(r.state, 'absent');
  assert.ok(!r.lines.some((l) => /removed/.test(l)), r.lines.join('\n'));
  assert.ok(!win.calls.some((c) => c.includes('/Delete')));
});

it('update says "only Codex held back" exactly when that is all that failed', () => {
  const U = require('../lib/updatecheck.js');
  assert.deepStrictEqual(U.updateOutcome({ ok: false, codexOk: false, codexHeld: true, restOk: true }), { ok: false, codexDeferredOnly: true });
  assert.strictEqual(U.updateOutcome({ ok: false, codexOk: false, codexHeld: true, restOk: false }).codexDeferredOnly, false, 'another step failed too');
  assert.strictEqual(U.updateOutcome({ ok: false, codexOk: false, codexHeld: false, restOk: true }).codexDeferredOnly, false, 'Codex failed, not held');
  assert.strictEqual(U.updateOutcome({ ok: false, codexOk: true, codexHeld: false, restOk: false }).codexDeferredOnly, false, 'a failure with Codex fine');
  assert.strictEqual(U.updateOutcome({ ok: true, codexOk: true, codexHeld: false, restOk: true }).codexDeferredOnly, false);
  const cp = require('../lib/codexplugins.js');
  assert.strictEqual(cp.heldOnly([{ status: 'deferred' }, { status: 'current' }]), true);
  assert.strictEqual(cp.heldOnly([{ status: 'deferred' }, { status: 'failed' }]), false, 'a failed plugin beside a held one');
  assert.strictEqual(cp.heldOnly([{ status: 'current' }]), false, 'nothing held back');
  assert.strictEqual(cp.heldOnly([]), false);
  assert.match(require('./launcher.js').source(), /codexHeld = cp\.heldOnly\(out\.results\)/);
});

it('a definition the job wrote for itself is registered by the next interactive run', () => {
  const home = tmpHome();
  try {
    const first = recorder();
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: first.run, env: {} };
    S.apply(S.plan(o), o);
    const inJob = recorder();
    const newer = Object.assign({}, o, { node: '/opt/new/bin/node', run: inJob.run, env: { SSHLG_SKILLS_JOB: '1' } });
    const r1 = S.apply(S.plan(newer), newer);
    assert.deepStrictEqual(inJob.calls, [], 'the job booted itself out');
    assert.ok(r1.lines.some((l) => /this run is the job itself/.test(l)));
    const later = recorder();
    const interactive = Object.assign({}, newer, { run: later.run, env: {} });
    const r2 = S.apply(S.plan(interactive), interactive);
    assert.strictEqual(r2.state, 'current');
    assert.ok(later.calls.some((c) => c.includes('bootstrap')), `the new definition was never loaded: ${later.calls.join(' | ')}`);
    const again = recorder();
    S.apply(S.plan(Object.assign({}, interactive, { run: again.run })), Object.assign({}, interactive, { run: again.run }));
    assert.ok(!again.calls.some((c) => c.includes('bootstrap')), 'a level, registered job was registered again');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('the runner starts npm and npx through a shell on Windows only, and the job retries within 20 hours', () => {
  const U = require('../lib/updatecheck.js');
  assert.strictEqual(U.childOptions('win32').shell, true);
  assert.strictEqual(U.childOptions('darwin').shell, false);
  assert.strictEqual(U.childOptions('linux', { timeout: 5 }).timeout, 5);
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'updaterun.js'), 'utf8');
  const calls = src.match(/execFile\('(npm|npx)'[^\n]*\n?[^\n]*/g) || [];
  assert.strictEqual(calls.length, 2, 'the runner starts npm and npx somewhere this test does not see');
  for (const c of calls) assert.match(c, /chk\.childOptions\(process\.platform/, `spawned without the Windows shell: ${c}`);
  assert.match(src, /shouldAutoUpdate\(cfg, cache, Date\.now\(\), chk\.SCHEDULED_INTERVAL_MS\)/);
  const now = 1_000_000_000_000;
  const cache = { self: '1.0.0', latest: '2.0.0', ranAt: now - U.CHECK_INTERVAL_MS + 5000 };
  assert.strictEqual(U.shouldAutoUpdate({}, cache, now, U.SCHEDULED_INTERVAL_MS).run, true, 'tonight skipped because last night ran 5 s late');
  assert.strictEqual(U.shouldAutoUpdate({}, Object.assign({}, cache, { ranAt: now - 3600000 }), now, U.SCHEDULED_INTERVAL_MS).run, false);
  const H20 = 20 * 60 * 60 * 1000;
  assert.strictEqual(U.SCHEDULED_INTERVAL_MS, H20);
  assert.strictEqual(U.shouldAutoUpdate({}, Object.assign({}, cache, { ranAt: now - H20 - 1000 }), now, U.SCHEDULED_INTERVAL_MS).run, true);
  assert.strictEqual(U.shouldAutoUpdate({}, Object.assign({}, cache, { ranAt: now - H20 + 1000 }), now, U.SCHEDULED_INTERVAL_MS).run, false);
});

it('the job never registers itself, on any platform; an older ownership line is still ours', () => {
  for (const platform of ['schtasks', 'launchd', 'systemd']) {
    const home = tmpHome();
    try {
      // An interactive run first, so the record says the OS holds exactly this definition.
      const o = { platform, home, node: NODE, uid: 501, mode: 'auto', run: recorder().run, env: {} };
      S.apply(S.plan(o), o);
      const job = recorder();
      const inJob = Object.assign({}, o, { run: job.run, env: { SSHLG_SKILLS_JOB: '1' } });
      const r = S.apply(S.plan(inJob), inJob);
      assert.strictEqual(r.ok, true);
      assert.deepStrictEqual(job.calls, [], `${platform}: the job touched its own registration: ${job.calls.join(' | ')}`);
      assert.deepStrictEqual(r.lines, [], `${platform}: a level job printed a line from inside itself`);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  }
  const want = S.jobFiles('launchd', base('launchd'))[0].text;
  const older = want.replace(S.MARK_XML, `${S.OWNER} (an older release's wording).`);
  assert.strictEqual(S.plan(base('launchd', { read: () => ({ text: older }) })).state, 'update', 'a reworded ownership line made our own job foreign');
  assert.strictEqual(S.plan(base('launchd', { mode: 'off', read: () => ({ text: older }) })).state, 'remove');
});

it('setting notify or off also writes the older key a 1.85 runtime reads', () => {
  const home = tmpHome();
  try {
    const C = require('../lib/config.js');
    for (const mode of ['notify', 'off']) {
      C.setUpdateMode(home, mode);
      const u = C.readConfig(home).update;
      assert.strictEqual(u.mode, mode);
      assert.strictEqual(u.auto !== 'off', false, `${mode}: the 1.85 expression \`auto !== 'off'\` still says update`);
    }
    C.setUpdateMode(home, 'auto');
    assert.deepStrictEqual(C.readConfig(home).update || {}, {});
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('a job directory that cannot be written is a named failure, never a stack trace', () => {
  if (process.platform === 'win32' || (process.getuid && process.getuid() === 0)) return;
  for (const platform of ['launchd', 'systemd']) {
    const home = tmpHome();
    try {
      const dir = path.dirname(S.jobFiles(platform, { home, node: NODE })[0].file);
      fs.mkdirSync(dir, { recursive: true });
      fs.chmodSync(dir, 0o555);
      const o = { platform, home, node: NODE, uid: 501, mode: 'auto', run: recorder().run };
      let r;
      try { r = S.apply(S.plan(o), o); } finally { fs.chmodSync(dir, 0o755); }
      assert.strictEqual(r.ok, false);
      assert.ok(r.lines.some((l) => /^not scheduled: .*EACCES/.test(l)), `${platform}: ${r.lines.join(' | ')}`);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  }
});

it('a record without a registered hash re-registers; a refused unlink is named', () => {
  const home = tmpHome();
  try {
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: recorder().run, env: {} };
    S.apply(S.plan(o), o);
    const rec = S.recordPath(home);
    const r0 = JSON.parse(fs.readFileSync(rec, 'utf8'));
    delete r0.registered;
    fs.writeFileSync(rec, JSON.stringify(r0));
    const again = recorder();
    S.apply(S.plan(Object.assign({}, o, { run: again.run })), Object.assign({}, o, { run: again.run }));
    assert.ok(again.calls.some((c) => c.includes('bootstrap')), `no record of what the OS holds, yet nothing re-registered: ${again.calls.join(' | ')}`);
    if (process.platform !== 'win32' && !(process.getuid && process.getuid() === 0)) {
      const dir = path.dirname(S.jobFiles('launchd', o)[0].file);
      const off = Object.assign({}, o, { mode: 'off', run: recorder().run });
      const p = S.plan(off);
      fs.chmodSync(dir, 0o555);
      let r;
      try { r = S.apply(p, off); } finally { fs.chmodSync(dir, 0o755); }
      assert.strictEqual(r.ok, false);
      assert.ok(r.lines.some((l) => /^not removed: .*EACCES/.test(l)), r.lines.join(' | '));
      assert.ok(fs.existsSync(rec), 'a failed removal cleared the record of a job still there');
    }
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// --- B-324: the edges the 1.86.0 readings left open -------------------------------------
it('a job still loaded with its plist deleted by hand is present: booted out, its record cleared', () => {
  const home = tmpHome();
  try {
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: recorder().run, env: {} };
    S.apply(S.plan(o), o);
    const plist = S.jobFiles('launchd', o)[0].file;
    fs.unlinkSync(plist);
    assert.ok(fs.existsSync(S.recordPath(home)));
    const rec = recorder((cmd, args) => (args[0] === 'print' ? 0 : 0));
    const off = Object.assign({}, o, { mode: 'notify', run: rec.run });
    const p = S.plan(off);
    assert.strictEqual(p.state, 'remove', 'a loaded job without its file read as absent');
    assert.deepStrictEqual(p.files, []);
    const r = S.apply(p, off);
    assert.strictEqual(r.ok, true, r.lines.join('\n'));
    assert.ok(rec.calls.includes('launchctl bootout gui/501/me.sshlg.skills.update'), rec.calls.join(' | '));
    assert.ok(r.lines.some((l) => /booted out .*still loaded.*file was gone/.test(l)), r.lines.join(' | '));
    assert.ok(!fs.existsSync(S.recordPath(home)), 'the record of a job booted out stayed');
    // Not loaded and no file: absent, as before; a fixture HOME never asks the OS.
    const gone = recorder((cmd, args) => (args[0] === 'print' ? 113 : 0));
    assert.strictEqual(S.plan(Object.assign({}, off, { run: gone.run })).state, 'absent');
    const quiet = recorder();
    assert.strictEqual(S.plan(Object.assign({}, off, { run: quiet.run, register: false })).state, 'absent');
    assert.deepStrictEqual(quiet.calls, [], 'a fixture HOME asked launchctl');
    // A foreign file at our path with something loaded under the label is not ours to boot out.
    fs.mkdirSync(path.dirname(plist), { recursive: true });
    fs.writeFileSync(plist, '<plist>mine</plist>\n');
    assert.strictEqual(S.plan(Object.assign({}, off, { run: recorder().run })).state, 'absent');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('the job never boots itself out when it sees a mode switched mid-run; it re-reads the mode first', () => {
  const home = tmpHome();
  try {
    const o = { platform: 'launchd', home, node: NODE, uid: 501, mode: 'auto', run: recorder().run, env: {} };
    S.apply(S.plan(o), o);
    const plist = S.jobFiles('launchd', o)[0].file;
    for (const [now, state, line] of [['notify', 'deferred', /not removed: this run is the job itself/], ['auto', 'kept', /kept: update\.mode is auto again/]]) {
      const job = recorder();
      let asked = 0;
      const inJob = Object.assign({}, o, { mode: 'notify', run: job.run, env: { SSHLG_SKILLS_JOB: '1' }, reread: () => { asked += 1; return now; } });
      const r = S.apply(S.plan(inJob), inJob);
      assert.strictEqual(asked, 1, `${now}: the mode was not read again before acting`);
      assert.strictEqual(r.ok, true, r.lines.join(' | '));
      assert.strictEqual(r.state, state);
      assert.ok(r.lines.some((l) => line.test(l)), r.lines.join(' | '));
      assert.ok(!job.calls.some((c) => c.includes('bootout')), `${now}: the job booted itself out: ${job.calls.join(' | ')}`);
      assert.ok(fs.existsSync(plist) && fs.existsSync(S.recordPath(home)), `${now}: the job removed its own file or record`);
    }
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('Windows: the exact schtasks command list, announced once, re-created on interactive runs, never from the job', () => {
  const home = tmpHome();
  try {
    const node = 'C:\\nodejs\\node.exe';
    const st = `04:${String(S.slot(home).minute).padStart(2, '0')}`;
    const tr = `"${node}" "${S.scriptPath(home)}" --scheduled`;
    const create = `schtasks /Create /F /SC DAILY /ST ${st} /TN sshlg-skills-update /TR ${tr}`;
    let have = false;
    const rec = recorder((cmd, args) => {
      if (args[0] === '/Query') return have ? 0 : 1;
      if (args[0] === '/Create') have = true;
      if (args[0] === '/Delete') have = false;
      return 0;
    });
    const o = { platform: 'schtasks', home, node, uid: null, mode: 'auto', run: rec.run, env: {} };
    const first = S.plan(o);
    assert.strictEqual(first.state, 'install', 'a first run never says install, so the announcement never shows on Windows');
    assert.deepStrictEqual(first.files, []);
    const r1 = S.apply(first, o);
    assert.strictEqual(r1.ok, true, r1.lines.join(' | '));
    assert.deepStrictEqual(rec.calls, ['schtasks /Query /TN sshlg-skills-update', create]);
    const record = JSON.parse(fs.readFileSync(S.recordPath(home), 'utf8'));
    assert.deepStrictEqual([record.platform, record.task, record.files], ['schtasks', 'sshlg-skills-update', []]);
    assert.ok(record.registered, 'the record does not say what the OS was given');
    rec.calls.length = 0;
    const second = S.plan(o);
    assert.strictEqual(second.state, 'current');
    S.apply(second, o);
    assert.deepStrictEqual(rec.calls, ['schtasks /Query /TN sshlg-skills-update', create], 'an interactive run re-creates the task (/F), by design');
    rec.calls.length = 0;
    const inJob = Object.assign({}, o, { env: { SSHLG_SKILLS_JOB: '1' } });
    assert.deepStrictEqual(S.apply(S.plan(inJob), inJob).lines, []);
    assert.deepStrictEqual(rec.calls, [], 'the job re-created its own task');
    const off = Object.assign({}, o, { mode: 'notify' });
    const rm = S.apply(S.plan(off), off);
    assert.strictEqual(rm.state, 'remove');
    assert.deepStrictEqual(rec.calls, ['schtasks /Query /TN sshlg-skills-update', 'schtasks /Delete /F /TN sshlg-skills-update']);
    assert.ok(rm.lines.includes('removed the task sshlg-skills-update'), rm.lines.join(' | '));
    assert.ok(!fs.existsSync(S.recordPath(home)));
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

it('update: every step after the Codex step that can fail also fails restOk, so a Codex hold beside it is not "only Codex"', () => {
  const src = require('./launcher.js').source();
  const body = src.slice(src.indexOf('let restOk = ok'), src.indexOf('writeOutcome(require(\'../lib/updatecheck.js\').updateOutcome'));
  assert.ok(body.length > 0 && body.length < 4000, 'the restOk span of cmdUpdate was not found');
  const lines = body.split('\n').filter((l) => /\bok = /.test(l) && !/^\s*let restOk/.test(l));
  assert.ok(lines.some((l) => /cmdDomains/.test(l)), 'the domain step moved out of the span this test reads');
  for (const l of lines) {
    if (/ok = codexOk && ok/.test(l)) continue;
    const okSets = (l.match(/\bok = /g) || []).length;
    assert.strictEqual((l.match(/restOk = /g) || []).length, okSets, `a failing step keeps restOk true, so a Codex hold beside it reads as "only Codex": ${l.trim()}`);
  }
  const U = require('../lib/updatecheck.js');
  assert.strictEqual(U.updateOutcome({ ok: false, codexOk: false, codexHeld: true, restOk: false }).codexDeferredOnly, false);
});

// --- the runner the job executes (lib/updaterun.js --scheduled) ----------------------------
const ROOT = path.join(__dirname, '..');
const SELF = require('../package.json').version;
function runScheduled(opts) {
  const home = fs.realpathSync(tmpHome());
  const stubs = fs.mkdtempSync(path.join(os.tmpdir(), 'sched-stubs-'));
  const npm = opts.npm === null ? '#!/bin/sh\nexit 1\n' : `#!/bin/sh\necho ${opts.npm}\n`;
  fs.writeFileSync(path.join(stubs, 'npm'), npm, { mode: 0o755 });
  fs.writeFileSync(path.join(stubs, 'npx'), `#!/bin/sh\ntouch "$HOME/npx-ran"\n${opts.npx || 'exit 0'}\n`, { mode: 0o755 });
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  if (opts.config) fs.writeFileSync(path.join(home, '.sshlg-skills', 'config.json'), JSON.stringify(opts.config));
  if (opts.state) fs.writeFileSync(path.join(home, '.sshlg-skills', 'state.json'), JSON.stringify(opts.state));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'lib', 'updaterun.js'), '--scheduled'],
    { encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home, USERPROFILE: home, PATH: `${stubs}:${process.env.PATH}` }) });
  let st = {};
  try { st = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'state.json'), 'utf8')); } catch (_) { st = {}; }
  const marker = path.join(home, 'job-marker');
  const out = { code: r.status, ran: fs.existsSync(path.join(home, 'npx-ran')), uc: st.updateCheck || {},
    jobMarker: fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : null,
    leftovers: fs.readdirSync(path.join(home, '.sshlg-skills')).filter((f) => f.startsWith('update-outcome')) };
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(stubs, { recursive: true, force: true });
  return out;
}

if (process.platform !== 'win32') {
  it('--scheduled asks the registry, then updates when a newer set is out, and records it', () => {
    const r = runScheduled({ npm: '99.0.0',
      npx: 'mkdir -p "$HOME/.sshlg-skills/scheduler"\necho \'{"version":"99.0.0"}\' > "$HOME/.sshlg-skills/scheduler/package.json"\n'
        + 'echo "$SSHLG_SKILLS_JOB" > "$HOME/job-marker"\nexit 0' });
    assert.strictEqual(r.jobMarker, '1', 'the job\'s own update cannot tell it runs inside the job');
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.ran, true, 'a newer set was out and nothing ran');
    assert.strictEqual(r.uc.latest, '99.0.0');
    assert.deepStrictEqual([r.uc.from, r.uc.to, r.uc.ok], [SELF, '99.0.0', true]);
    assert.ok(require('../lib/updatecheck.js').ranLine(r.uc, Date.now()).includes(`${SELF} → 99.0.0`));
  });

  it('--scheduled: the same set, a registry that does not answer, or a run within a day: nothing runs', () => {
    const same = runScheduled({ npm: SELF });
    assert.strictEqual(same.ran, false);
    assert.strictEqual(same.uc.latest, SELF, 'the registry answer was not recorded');
    assert.strictEqual(runScheduled({ npm: null }).ran, false);
    const cached = runScheduled({ npm: null, state: { updateCheck: { at: 1, latest: '99.0.0' } } });
    assert.strictEqual(cached.ran, false, 'a silent registry and a cache a session wrote started an update');
    assert.strictEqual(cached.uc.latest, '99.0.0', 'a silent registry erased what the session last learned');
    assert.strictEqual(cached.uc.at, 1, 'a silent registry was recorded as an answer');
    const recent = runScheduled({ npm: '99.0.0', state: { updateCheck: { ranAt: Date.now() - 60000, ok: false } } });
    assert.strictEqual(recent.ran, false, 'the job retried inside the interval the idle updater keeps');
  });

  it('--scheduled: update.mode notify or off runs nothing and asks nothing', () => {
    for (const config of [{ update: { mode: 'notify' } }, { update: { mode: 'off' } }, { update: { auto: 'off' } }]) {
      const r = runScheduled({ npm: '99.0.0', config });
      assert.strictEqual(r.ran, false, JSON.stringify(config));
      assert.strictEqual(r.uc.latest, undefined, `${JSON.stringify(config)}: the registry was asked`);
    }
  });

  it('--scheduled: exit 1 with only Codex held is recorded as a partial success, a real exit 1 as FAILED', () => {
    const held = runScheduled({ npm: '99.0.0',
      npx: 'mkdir -p "$HOME/.sshlg-skills/scheduler"\necho \'{"version":"99.0.0"}\' > "$HOME/.sshlg-skills/scheduler/package.json"\n'
        + 'echo \'{"ok":false,"codexDeferredOnly":true}\' > "$SSHLG_SKILLS_OUTCOME"\nexit 1' });
    assert.deepStrictEqual([held.uc.ok, held.uc.deferred, held.uc.to], [true, true, '99.0.0'], JSON.stringify(held.uc));
    assert.deepStrictEqual(held.leftovers, [], 'the outcome file was left behind');
    const chk = require('../lib/updatecheck.js');
    assert.ok(!/FAILED/.test(chk.ranLine(held.uc, Date.now())));
    const failed = runScheduled({ npm: '99.0.0',
      npx: 'echo \'{"ok":false,"codexDeferredOnly":false}\' > "$SSHLG_SKILLS_OUTCOME"\nexit 1' });
    assert.deepStrictEqual([failed.uc.ok, failed.uc.deferred], [false, undefined]);
    assert.match(chk.ranLine(failed.uc, Date.now()), /FAILED/);
  });
}

// --- B-324 at the command line, in a fixture HOME (the OS schedulers are shims that log) -----
function cliMachine() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sched-cli-')));
  const home = path.join(root, 'home');
  const shims = path.join(root, 'bin');
  const calls = path.join(root, 'calls.log');
  fs.mkdirSync(home);
  fs.mkdirSync(shims);
  for (const c of ['git', 'npx', 'claude', 'codex', 'launchctl', 'systemctl', 'schtasks']) {
    fs.writeFileSync(path.join(shims, c), `#!/bin/sh\necho "${c} $*" >> "${calls}"\nexit 0\n`, { mode: 0o755 });
  }
  const run = (...args) => {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'bin', 'sshlg-skills.js'), ...args], {
      cwd: ROOT, encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'],
      env: { HOME: home, USERPROFILE: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', NO_COLOR: '1',
        PATH: [shims, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter) } });
    return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };
  const platform = S.platformOf(process.platform);
  const job = S.jobFiles(platform, { home, node: NODE })[0].file;
  const osCalls = () => (fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8') : '').split('\n').filter((l) => /^(launchctl|systemctl|schtasks) /.test(l));
  const config = path.join(home, '.sshlg-skills', 'config.json');
  const holdLock = () => {
    fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
    // This test process is alive and on this host: a running update, however old.
    fs.writeFileSync(path.join(home, '.sshlg-skills', 'update.lock'), JSON.stringify({ pid: process.pid, startedAt: Date.now() - 5000, host: os.hostname() }));
  };
  return { root, home, run, job, osCalls, config, holdLock,
    runner: path.join(home, '.sshlg-skills', 'scheduler', 'lib', 'updaterun.js'),
    snap: () => [job, config].map((f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null)),
    done: () => fs.rmSync(root, { recursive: true, force: true }) };
}

if (['darwin', 'linux'].includes(process.platform)) {
  it('schedule --apply and --revert wait for a running update: exit 75, nothing changed, said as update says it', () => {
    const m = cliMachine();
    try {
      m.holdLock();
      const before = m.snap();
      const a = m.run('schedule', '--apply');
      assert.strictEqual(a.code, 75, a.out);
      assert.match(a.out, /^schedule --apply: refused: another update is running \(pid \d+, started \d+ s ago\) on /m);
      assert.match(a.out, /^ {2}lock: .*update\.lock \(taken over once its process is gone; a lock from another host after 30 minutes\)$/m);
      assert.deepStrictEqual(m.snap(), before, 'schedule --apply wrote while an update held the lock');
      const r = m.run('schedule', '--revert');
      assert.strictEqual(r.code, 75, r.out);
      assert.match(r.out, /^schedule --revert: refused: another update is running/m);
      assert.deepStrictEqual(m.snap(), before, 'schedule --revert changed update.mode while an update held the lock');
      // The read-only forms take no lock.
      assert.strictEqual(m.run('schedule').code, 0);
      assert.strictEqual(m.run('schedule', '--apply', '--dry-run').code, 0);
      fs.unlinkSync(path.join(m.home, '.sshlg-skills', 'update.lock'));
      const ok = m.run('schedule', '--apply');
      assert.strictEqual(ok.code, 0, ok.out);
      assert.ok(fs.existsSync(m.job));
      assert.ok(!fs.existsSync(path.join(m.home, '.sshlg-skills', 'update.lock')), 'schedule --apply left its lock behind');
      assert.deepStrictEqual(m.osCalls(), [], 'a fixture HOME reached the OS scheduler');
    } finally { m.done(); }
  });

  it('install writes the job and uninstall removes it with its runner copy, in a fixture HOME', () => {
    const m = cliMachine();
    try {
      const i = m.run('install', '--agent', 'gemini-cli');
      assert.strictEqual(i.code, 0, i.out.slice(-1500));
      assert.match(i.out, /== Nightly update job ==\n {2}wrote /);
      assert.ok(fs.existsSync(m.job), 'install did not write the job');
      assert.ok(fs.readFileSync(m.job, 'utf8').includes(S.OWNER));
      assert.ok(fs.existsSync(m.runner), 'install did not make the runner copy the job runs');
      assert.ok(fs.existsSync(S.recordPath(m.home)));
      const u = m.run('uninstall', '--agent', 'gemini-cli');
      assert.strictEqual(u.code, 0, u.out.slice(-1500));
      assert.match(u.out, /== Removing the nightly update job ==\n {2}removed .*\(copy: /);
      assert.ok(!fs.existsSync(m.job), 'uninstall left the job');
      assert.ok(!fs.existsSync(S.schedulerDir(m.home)), 'uninstall left the runner copy');
      assert.ok(!fs.existsSync(S.recordPath(m.home)), 'uninstall left the record');
      assert.deepStrictEqual(m.osCalls(), [], 'a fixture HOME reached the OS scheduler');
    } finally { m.done(); }
  });

  it('a removal that fails keeps the runner copy the still-registered job runs (config set and uninstall)', () => {
    if (process.getuid && process.getuid() === 0) return;
    const m = cliMachine();
    try {
      assert.strictEqual(m.run('config', 'set', 'update.mode', 'auto').code, 0);
      assert.ok(fs.existsSync(m.job) && fs.existsSync(m.runner));
      const dir = path.dirname(m.job);
      fs.chmodSync(dir, 0o555);
      let c;
      let u;
      try {
        c = m.run('config', 'set', 'update.mode', 'notify');
        assert.ok(fs.existsSync(m.runner), `a failed removal deleted the runner copy: ${c.out}`);
        u = m.run('uninstall', '--agent', 'gemini-cli');
      } finally { fs.chmodSync(dir, 0o755); }
      assert.strictEqual(c.code, 1, c.out);
      assert.match(c.out, /not removed: .*EACCES/);
      assert.ok(fs.existsSync(m.job));
      assert.notStrictEqual(u.code, 0, u.out.slice(-800));
      assert.match(u.out, /== Removing the nightly update job ==\n {2}not removed: .*EACCES/);
      assert.ok(fs.existsSync(m.runner), 'uninstall deleted the runner copy of a job it could not remove');
    } finally { m.done(); }
  });
}

console.log(`\nPASS: nightly update job — ${n} case(s)`);
