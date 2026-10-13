'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
const R = require('../lib/runtime-recovery');
const MODULE = path.resolve(__dirname, '../lib/runtime');
let checks = 0;
const failed = [];
function it(name, fn) {
  const base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-recovery-')));
  checks++;
  try { fn(base); console.log('ok ' + name); } catch (e) { failed.push(name + ': ' + e.stack); }
  finally { fs.rmSync(base, { recursive: true, force: true }); }
}
function write(file, bytes) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); }
function seed(base, runtimeRoot) {
  const pkg = path.join(base, 'pkg'), rt = runtimeRoot || path.join(base, 'rt');
  for (const rel of ['hooks/a.js', 'lib/b.js', 'skills.json', 'package.json']) { write(path.join(pkg, rel), 'new'); write(path.join(rt, rel), 'old'); }
  write(path.join(pkg, 'hooks/introduced.js'), 'introduced');
  return { pkg, rt };
}
function crash(base, runtimeRoot) {
  const { pkg, rt } = seed(base, runtimeRoot);
  const r = spawnSync(process.execPath, ['-e', `const fs=require('fs'),old=fs.renameSync; fs.renameSync=function(a,b){const r=old.apply(this,arguments);if(a.includes('.staging-'))process.kill(process.pid,'SIGKILL');return r};require(${JSON.stringify(MODULE)}).sync(${JSON.stringify(pkg)},${JSON.stringify(rt)});`], { timeout: 10000 });
  assert.equal(r.signal, 'SIGKILL');
  return { pkg, rt };
}
function until(fn) {
  const end = Date.now() + 10000;
  while (!fn()) { if (Date.now() > end) throw Error('owned child barrier timed out'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15); }
}
function paused(base, rt, stage, pkg) {
  const marker = path.join(base, 'barrier-' + stage), resume = marker + '.resume', done = marker + '.done';
  const preloader = marker + '.js';
  write(preloader, `const fs=require('fs');
const worker=process.argv[2]==='--worker', rt=${JSON.stringify(rt)}, stage=${JSON.stringify(stage)};
let used=false; function stop(){if(used)return;used=true;fs.writeFileSync(${JSON.stringify(marker)},String(process.pid));while(!fs.existsSync(${JSON.stringify(resume)}))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,15);}
if(worker||stage==='writer'){
const lstat=fs.lstatSync;let seen=0;fs.lstatSync=function(p){if(p===rt+'/.recovery-coordinator'&&stage==='coordinator'&&++seen===3)stop();return lstat.apply(this,arguments);};
const unlink=fs.unlinkSync;fs.unlinkSync=function(p){if(p===rt+'/.sync.lock'&&stage==='before-retire')stop();const r=unlink.apply(this,arguments);if(p===rt+'/.sync.lock'&&stage==='after-retire'||p===rt+'/.switch-journal.json'&&stage==='committed')stop();return r;};
const read=fs.readFileSync;fs.readFileSync=function(p){if(p===rt+'/.switch-journal.json'&&(stage==='acquired'||stage==='writer'))stop();return read.apply(this,arguments);};
}
`);
  const operation = pkg ? `require(${JSON.stringify(MODULE)}).sync(${JSON.stringify(pkg)},${JSON.stringify(rt)})` : `require(${JSON.stringify(path.resolve(__dirname, '../lib/runtime-recovery'))}).recover(${JSON.stringify(rt)},${JSON.stringify(R.inspect(rt).expected)})`;
  const code = `const fs=require('fs'); const result=${operation};fs.writeFileSync(${JSON.stringify(done)},JSON.stringify(result));`;
  const child = spawn(process.execPath, ['-e', code], { env: { ...process.env, NODE_OPTIONS: '--require=' + preloader }, stdio: 'ignore' });
  try { until(() => fs.existsSync(marker)); }
  catch (e) { try { child.kill('SIGKILL'); } catch (_) {} throw e; }
  const pid = Number(fs.readFileSync(marker));
  return {
    pid, resume() { fs.writeFileSync(resume, ''); },
    finish() { until(() => fs.existsSync(done)); return JSON.parse(fs.readFileSync(done)); },
    close() { try { process.kill(pid, 'SIGKILL'); } catch (_) {} try { child.kill('SIGKILL'); } catch (_) {} }
  };
}
it('real killed writer is inspected without mutation then recovered', base => {
  const { rt } = crash(base), file = path.join(rt, '.sync.lock'), raw = fs.readFileSync(file);
  const view = R.inspect(rt); assert.equal(view.state, 'DEAD'); assert.deepEqual(fs.readFileSync(file), raw);
  const result = R.recover(rt, view.expected); assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.state, 'RECOVERED');
  assert.equal(fs.readFileSync(path.join(rt, 'hooks/a.js'), 'utf8'), 'old');
  assert(!fs.existsSync(path.join(rt, '.switch-journal.json'))); assert(!fs.existsSync(file));
  assert.equal(R.recover(rt, 'absent').state, 'NO_PENDING_JOURNAL');
  assert.equal(R.recover(rt, view.expected).ok, false);
});
it('live writer refuses with exact bytes preserved', base => {
  const { rt } = seed(base), file = path.join(rt, '.sync.lock');
  fs.writeFileSync(file, JSON.stringify(R.record(rt)), { mode: 0o600 }); const before = fs.readFileSync(file);
  const view = R.inspect(rt); assert.equal(view.state, 'BUSY'); assert.equal(R.recover(rt, view.expected).ok, false); assert.deepEqual(fs.readFileSync(file), before);
  assert(!fs.existsSync(path.join(rt, '.recovery-coordinator')));
});
for (const kind of ['legacy', 'other-boot', 'other-root', 'other-inode', 'missing-inode', 'unknown-key', 'duplicate-key', 'invalid-utf8', 'malformed', 'mode', 'symlink', 'hardlink']) it('unknown lock refuses: ' + kind, base => {
  const { rt } = crash(base), file = path.join(rt, '.sync.lock');
  let data = JSON.parse(fs.readFileSync(file));
  if (kind === 'legacy') delete data.identity;
  if (kind === 'other-boot') data.identity.boot = '0'.repeat(64);
  if (kind === 'other-root') data.identity.root = base;
  if (kind === 'other-inode') data.identity.ino++;
  if (kind === 'missing-inode') delete data.identity.ino;
  if (kind === 'unknown-key') data.foreign = 'preserve';
  fs.writeFileSync(file, kind === 'malformed' ? '{' : JSON.stringify(data));
  if (kind === 'duplicate-key') fs.writeFileSync(file, JSON.stringify(data).replace('{', '{"pid":1,'));
  if (kind === 'invalid-utf8') fs.writeFileSync(file, Buffer.concat([Buffer.from(JSON.stringify(data).slice(0, -1) + ',"foreign":"'), Buffer.from([255]), Buffer.from('"}') ]));
  if (kind === 'mode') fs.chmodSync(file, 0o644);
  if (kind === 'symlink') { fs.renameSync(file, path.join(base, 'foreign')); fs.symlinkSync(path.join(base, 'foreign'), file); }
  if (kind === 'hardlink') fs.linkSync(file, path.join(base, 'foreign'));
  const before = fs.readFileSync(file); assert.equal(R.inspect(rt).state, 'UNKNOWN'); assert.equal(R.recover(rt, 'absent').ok, false); assert.deepEqual(fs.readFileSync(file), before);
});
it('copied dead lock in replacement root remains unknown', base => {
  const { rt } = crash(base), previous = rt + '-previous'; fs.renameSync(rt, previous); fs.mkdirSync(rt);
  fs.copyFileSync(path.join(previous, '.sync.lock'), path.join(rt, '.sync.lock'));
  assert.equal(R.inspect(rt).state, 'UNKNOWN'); assert.equal(R.recover(rt, R.inspect(rt).expected).ok, false);
});
for (const kind of ['mode', 'symlink', 'hardlink']) it('unsafe coordinator refuses before lock retirement: ' + kind, base => {
  const { rt } = crash(base), file = path.join(rt, '.recovery-coordinator');
  fs.writeFileSync(file, '', { mode: kind === 'mode' ? 0o644 : 0o600 });
  if (kind === 'symlink') { fs.renameSync(file, path.join(base, 'foreign')); fs.symlinkSync(path.join(base, 'foreign'), file); }
  if (kind === 'hardlink') fs.linkSync(file, path.join(base, 'foreign'));
  const before = fs.readFileSync(path.join(rt, '.sync.lock')), view = R.inspect(rt); assert.equal(view.state, 'DEAD');
  assert.equal(R.recover(rt, view.expected).ok, false); assert.deepEqual(fs.readFileSync(path.join(rt, '.sync.lock')), before);
});
it('FIFO coordinator refuses promptly without opening a blocking reader', base => {
  const { rt } = crash(base), view = R.inspect(rt), before = fs.readFileSync(path.join(rt, '.sync.lock'));
  const made = spawnSync('/usr/bin/mkfifo', [path.join(rt, '.recovery-coordinator')], { timeout: 3000 }); assert.equal(made.status, 0);
  const start = Date.now(); assert.equal(R.recover(rt, view.expected).ok, false); assert(Date.now() - start < 5000);
  assert.deepEqual(fs.readFileSync(path.join(rt, '.sync.lock')), before);
});
it('exec-inherited flock excludes a second reclaimer and SIGKILL releases it', base => {
  const { rt } = crash(base), expected = R.inspect(rt).expected, before = fs.readFileSync(path.join(rt, '.sync.lock'));
  const child = paused(base, rt, 'before-retire');
  try {
    assert.equal(R.recover(rt, expected).ok, false);
    assert.deepEqual(fs.readFileSync(path.join(rt, '.sync.lock')), before);
    process.kill(child.pid, 'SIGKILL'); assert.equal(child.finish().ok, false);
    assert.equal(R.recover(rt, expected).state, 'RECOVERED');
  } finally { child.close(); }
});
it('reclaimer killed after retirement can resume from absent lock', base => {
  const { rt } = crash(base), child = paused(base, rt, 'after-retire');
  try {
    assert.equal(R.inspect(rt).state, 'PENDING_JOURNAL'); assert.equal(R.recover(rt, 'absent').ok, false);
    process.kill(child.pid, 'SIGKILL'); assert.equal(child.finish().ok, false);
    assert.equal(R.recover(rt, 'absent').state, 'RECOVERED');
  } finally { child.close(); }
});
it('reclaimer killed holding its own writer lock is recoverable without stealing a live holder', base => {
  const { rt } = crash(base), child = paused(base, rt, 'acquired');
  try {
    const active = R.inspect(rt); assert.equal(active.state, 'BUSY'); assert.equal(active.holder, child.pid);
    assert.equal(R.recover(rt, active.expected).ok, false);
    process.kill(child.pid, 'SIGKILL'); child.finish();
    assert.equal(R.inspect(rt).state, 'DEAD'); assert.equal(R.recover(rt, active.expected).state, 'RECOVERED');
  } finally { child.close(); }
});
it('normal writer winning retirement gap is never removed by recovery', base => {
  const { rt, pkg } = crash(base), reclaimer = paused(base, rt, 'after-retire'); let writer;
  try {
    writer = paused(base, rt, 'writer', pkg);
    const lock = fs.readFileSync(path.join(rt, '.sync.lock'));
    reclaimer.resume(); assert.equal(reclaimer.finish().ok, false);
    assert.deepEqual(fs.readFileSync(path.join(rt, '.sync.lock')), lock);
    writer.resume(); assert.equal(writer.finish().ok, true);
    assert.equal(fs.readFileSync(path.join(rt, 'hooks/a.js'), 'utf8'), 'new');
  } finally { reclaimer.close(); if (writer) writer.close(); }
});
it('two concurrent recovery requests cannot both retire the same lock', base => {
  const { rt } = crash(base), expected = R.inspect(rt).expected, children = [], results = [];
  try {
    for (let i = 0; i < 2; i++) {
      const done = path.join(base, 'race-' + i); results.push(done);
      children.push(spawn(process.execPath, ['-e', `const fs=require('fs'),r=require(${JSON.stringify(path.resolve(__dirname, '../lib/runtime-recovery'))});fs.writeFileSync(${JSON.stringify(done)},JSON.stringify(r.recover(${JSON.stringify(rt)},${JSON.stringify(expected)})));`], { stdio: 'ignore' }));
    }
    until(() => results.every(file => fs.existsSync(file)));
    const values = results.map(file => JSON.parse(fs.readFileSync(file)));
    assert.equal(values.filter(x => x.ok).length, 1); assert.equal(values.filter(x => x.state === 'RECOVERED').length, 1);
    assert.equal(fs.readFileSync(path.join(rt, 'hooks/a.js'), 'utf8'), 'old');
  } finally { for (const child of children) { try { child.kill('SIGKILL'); } catch (_) {} } }
});
it('crash after rollback commit never invents a historical recovered outcome', base => {
  const { rt } = crash(base), child = paused(base, rt, 'committed');
  try {
    assert(!fs.existsSync(path.join(rt, '.switch-journal.json')));
    process.kill(child.pid, 'SIGKILL'); child.finish();
    const view = R.inspect(rt); assert.equal(view.state, 'DEAD');
    const result = R.recover(rt, view.expected); assert.equal(result.ok, true); assert.equal(result.recovered, false); assert.equal(result.state, 'NO_PENDING_JOURNAL');
    assert.equal(fs.readFileSync(path.join(rt, 'hooks/a.js'), 'utf8'), 'old');
  } finally { child.close(); }
});
it('free inherited descriptor acquires its own exclusion before recovery', base => {
  const { rt } = crash(base), file = path.join(rt, '.recovery-coordinator'); fs.writeFileSync(file, '', { mode: 0o600 });
  const fd = fs.openSync(file, 'r+'), s = fs.statSync(rt), before = fs.readFileSync(path.join(rt, '.sync.lock'));
  try {
    const r = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/runtime-recovery'), '--worker', rt, R.inspect(rt).expected, '3', String(s.dev), String(s.ino)], { stdio: ['ignore', 'pipe', 'pipe', fd], encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(JSON.parse(r.stdout).state, 'RECOVERED'); assert(!fs.existsSync(path.join(rt, '.sync.lock')));
  } finally { fs.closeSync(fd); }
});
it('distinct unlocked descriptor cannot bypass another reclaimer kernel lock', base => {
  const { rt } = crash(base), expected = R.inspect(rt).expected, child = paused(base, rt, 'before-retire');
  const lock = path.join(rt, '.sync.lock'), before = fs.readFileSync(lock), fd = fs.openSync(path.join(rt, '.recovery-coordinator'), 'r+'), s = fs.statSync(rt);
  try {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/runtime-recovery'), '--worker', rt, expected, '3', String(s.dev), String(s.ino)], { stdio: ['ignore', 'pipe', 'pipe', fd], encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.deepEqual(fs.readFileSync(lock), before);
  } finally { fs.closeSync(fd); child.close(); }
});
it('changed coordinator pathname refuses without retiring old lock', base => {
  const { rt } = crash(base), child = paused(base, rt, 'coordinator'), lock = path.join(rt, '.sync.lock');
  try {
    const before = fs.readFileSync(lock), file = path.join(rt, '.recovery-coordinator');
    fs.renameSync(file, file + '.moved'); fs.writeFileSync(file, '', { mode: 0o600 });
    child.resume();
    const result = child.finish(); assert.equal(result.ok, false);
    assert(fs.existsSync(path.join(rt, '.switch-journal.json')));
    assert.deepEqual(fs.readFileSync(lock), before);
  } finally { child.close(); }
});
for (const kind of ['missing-python', 'timeout', 'signal', 'exit-with-success-output']) it('capability failure remains unresolved: ' + kind, base => {
  const { rt } = crash(base), lock = fs.readFileSync(path.join(rt, '.sync.lock'));
  const code = `const cp=require('child_process'),real=cp.spawnSync;cp.spawnSync=function(cmd,args,opts){if(cmd==='/usr/bin/python3')return ${JSON.stringify(kind === 'missing-python' ? { error: { code: 'ENOENT' }, status: null } : kind === 'timeout' ? { error: { code: 'ETIMEDOUT' }, status: null } : kind === 'signal' ? { signal: 'SIGKILL', status: null } : { status: 1, stdout: '{"ok":true,"state":"RECOVERED"}' })};return real.apply(this,arguments);};const r=require(${JSON.stringify(path.resolve(__dirname, '../lib/runtime-recovery'))});console.log(JSON.stringify(r.recover(${JSON.stringify(rt)},r.inspect(${JSON.stringify(rt)}).expected)));`;
  const result = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).ok, false); assert.deepEqual(fs.readFileSync(path.join(rt, '.sync.lock')), lock);
});
it('public CLI inspect/recover binds home and leaves settings bytes untouched', base => {
  const rt = path.join(base, '.sshlg-skills/runtime'); crash(base, rt);
  const settings = path.join(base, '.claude/settings.json'); write(settings, '{ deliberately malformed private fixture');
  const bin = path.resolve(__dirname, '../bin/sshlg-skills.js');
  const run = args => spawnSync(process.execPath, [bin, 'hooks', 'recovery', ...args], { env: { ...process.env, HOME: base }, encoding: 'utf8', timeout: 15000 });
  const view = run(['inspect', '--json']); assert.equal(view.status, 1); assert.equal(JSON.parse(view.stdout).state, 'DEAD');
  for (const args of [['recover'], ['recover', '--force'], ['inspect', '--root', base], ['inspect', '--json', '--json'], ['recover', '--expect', 'absent', '--expect', 'absent']]) assert.equal(run(args).status, 2);
  const result = run(['recover', '--expect', JSON.parse(view.stdout).expected, '--json']); assert.equal(result.status, 0, result.stdout + result.stderr); assert.equal(JSON.parse(result.stdout).state, 'RECOVERED');
  assert.equal(fs.readFileSync(settings, 'utf8'), '{ deliberately malformed private fixture');
  for (let i = 0; i < 3; i++) assert.equal(run(['inspect', '--json']).status, 0);
});
it('worker refusal after retiring the dead lock keeps its own reason', base => {
  const { rt } = crash(base); fs.writeFileSync(path.join(rt, 'hooks/a.js'), 'tampered');
  const view = R.inspect(rt); assert.equal(view.state, 'DEAD');
  const result = R.recover(rt, view.expected);
  assert.equal(result.ok, false); assert.equal(result.state, 'UNRESOLVED'); assert.strictEqual(result.retired, true, JSON.stringify(result));
  assert.match(result.reason, /changed outside transaction/); assert.equal(result.exit, 2);
  assert.equal(R.inspect(rt).state, 'PENDING_JOURNAL'); assert(!fs.existsSync(path.join(rt, '.sync.lock')));
});
it('runtime reached through a symlinked home binds the writer identity', base => {
  const real = path.join(base, 'real'), link = path.join(base, 'link'); fs.mkdirSync(real); fs.symlinkSync(real, link);
  const { rt } = crash(base, path.join(link, 'rt'));
  const view = R.inspect(rt); assert.equal(view.state, 'DEAD', JSON.stringify(view)); assert.equal(view.root, path.join(real, 'rt'));
  assert.equal(R.recover(rt, view.expected).state, 'RECOVERED');
});
it('lock swapped for a FIFO after its type check never blocks inspect', base => {
  const { rt } = crash(base), lock = path.join(rt, '.sync.lock');
  const code = `const fs=require('fs'),cp=require('child_process'),lstat=fs.lstatSync;let swapped=false;fs.lstatSync=function(p){const s=lstat.apply(this,arguments);if(p===${JSON.stringify(lock)}&&!swapped){swapped=true;fs.unlinkSync(p);cp.spawnSync('/usr/bin/mkfifo',[p]);}return s;};console.log(JSON.stringify(require(${JSON.stringify(path.resolve(__dirname, '../lib/runtime-recovery'))}).inspect(${JSON.stringify(rt)})));`;
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 5000 });
  assert.equal(r.signal, null, 'inspect blocked on a FIFO'); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).state, 'UNKNOWN');
});
it('refusals name their next step', base => {
  const { rt } = seed(base), file = path.join(rt, '.sync.lock');
  fs.writeFileSync(file, JSON.stringify(R.record(rt)), { mode: 0o600 });
  const busy = R.recover(rt, R.inspect(rt).expected); assert.equal(busy.state, 'BUSY'); assert.equal(busy.holder, process.pid); assert.match(busy.reason, new RegExp('pid ' + process.pid));
  const stale = R.recover(rt, '0'.repeat(64)); assert.match(stale.reason, /inspect again/); assert.doesNotMatch(stale.reason, /alive/);
  fs.unlinkSync(file); fs.chmodSync(rt, 0o775);
  const open = R.inspect(rt); assert.equal(open.state, 'UNKNOWN'); assert.match(open.reason, /chmod go-w/);
  fs.chmodSync(rt, 0o755);
  const missing = R.inspect(path.join(base, 'absent')); assert.equal(missing.state, 'NOT_INSTALLED'); assert.match(missing.reason, /hooks install/);
  for (const shape of [busy, stale, open, missing, R.recover(path.join(base, 'absent'), 'absent')]) for (const key of ['ok', 'state', 'reason']) assert(key in shape, key + ' missing from ' + JSON.stringify(shape));
});
for (const kind of ['missing-python', 'timeout']) it('unknown capability outcome never claims what the worker did: ' + kind, base => {
  const { rt } = crash(base);
  const code = `const cp=require('child_process'),real=cp.spawnSync;cp.spawnSync=function(cmd,args,opts){if(cmd==='/usr/bin/python3')return ${JSON.stringify(kind === 'missing-python' ? { error: { code: 'ENOENT' }, status: null } : { error: { code: 'ETIMEDOUT' }, status: null })};return real.apply(this,arguments);};const r=require(${JSON.stringify(path.resolve(__dirname, '../lib/runtime-recovery'))});console.log(JSON.stringify(r.recover(${JSON.stringify(rt)},r.inspect(${JSON.stringify(rt)}).expected)));`;
  const result = JSON.parse(spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 10000 }).stdout);
  if (kind === 'missing-python') { assert.match(result.reason, /\/usr\/bin\/python3/); assert.strictEqual(result.retired, false); assert.strictEqual(result.recovered, false); }
  else { assert.strictEqual(result.retired, null); assert.strictEqual(result.recovered, null); }
});
it('CLI usage errors exit 2 and print JSON only when asked', base => {
  const bin = path.resolve(__dirname, '../bin/sshlg-skills.js');
  const run = args => spawnSync(process.execPath, [bin, 'hooks', 'recovery', ...args], { env: { ...process.env, HOME: base }, encoding: 'utf8', timeout: 15000 });
  const plain = run(['recover']); assert.equal(plain.status, 2); assert.doesNotMatch(plain.stdout, /^\{/m);
  const json = run(['recover', '--json']); assert.equal(json.status, 2); assert.equal(JSON.parse(json.stdout).ok, false);
  const missing = run(['inspect', '--json']); assert.equal(missing.status, 1); assert.equal(JSON.parse(missing.stdout).state, 'NOT_INSTALLED');
});
if (failed.length) { console.error(failed.join('\n')); process.exitCode = 1; }
else console.log(`PASS: runtime recovery — ${checks} checks`);
