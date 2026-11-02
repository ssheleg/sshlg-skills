'use strict';
// B-316: runtime recovery on Windows. A writer there holds `.sync.lock` open with share
// mode 0 until it releases it; an exclusive open that succeeds proves the holder is gone.
// The real scenarios need Windows (the CI `windows` job runs this file); elsewhere the
// file checks that POSIX writers are unchanged and never judge a Windows-format lock.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const R = require('../lib/runtime-recovery');
const MODULE = path.resolve(__dirname, '../lib/runtime');
const WINDOWS = process.platform === 'win32';
let checks = 0;
const failed = [];
function it(name, fn) {
  const base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-recovery-win-')));
  checks++;
  try { fn(base); console.log('ok ' + name); } catch (e) { failed.push(name + ': ' + e.stack); }
  finally { fs.rmSync(base, { recursive: true, force: true }); }
}
function write(file, bytes) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); }
function seed(base) {
  const pkg = path.join(base, 'pkg'), rt = path.join(base, 'rt');
  for (const rel of ['hooks/a.js', 'lib/b.js', 'skills.json', 'package.json']) { write(path.join(pkg, rel), 'new'); write(path.join(rt, rel), 'old'); }
  write(path.join(pkg, 'hooks/introduced.js'), 'introduced');
  return { pkg, rt };
}
const windowsLock = rt => JSON.stringify({ pid: 4242, nonce: 'a'.repeat(32), identity: { version: 2, platform: 'win32', hold: 'exclusive', root: rt } });

if (!WINDOWS) {
  it('POSIX writers still write a version 1 lock and hold nothing open', base => {
    const { rt } = seed(base);
    assert.strictEqual(R.hold(path.join(rt, '.sync.lock'), '{}'), null);
    assert.ok(!fs.existsSync(path.join(rt, '.sync.lock')));
    const rec = R.record(rt);
    assert.ok(rec.identity === null || rec.identity.version === 1, JSON.stringify(rec));
  });
  it('a Windows-format lock is never judged dead on POSIX', base => {
    const { rt } = seed(base), file = path.join(rt, '.sync.lock');
    fs.writeFileSync(file, windowsLock(rt), { mode: 0o600 });
    const view = R.inspect(rt);
    assert.strictEqual(view.state, 'UNKNOWN', JSON.stringify(view));
    assert.strictEqual(R.recover(rt, view.expected).ok, false);
    assert.strictEqual(fs.readFileSync(file, 'utf8'), windowsLock(rt));
  });
} else {
  it('a writer holding the lock reads BUSY and recovery refuses without touching it', base => {
    const { rt } = seed(base), file = path.join(rt, '.sync.lock');
    const token = JSON.stringify(R.record(rt));
    assert.strictEqual(JSON.parse(token).identity.hold, 'exclusive', token);
    const fd = R.hold(file, token);
    try {
      const view = R.inspect(rt);
      assert.strictEqual(view.state, 'BUSY', JSON.stringify(view));
      const r = R.recover(rt, 'absent');
      assert.strictEqual(r.ok, false, JSON.stringify(r));
    } finally { fs.closeSync(fd); }
    assert.strictEqual(fs.readFileSync(file, 'utf8'), token);
  });
  it('a writer that exits mid-switch leaves a lock read DEAD, and recovery rolls back and retires it', base => {
    const { pkg, rt } = seed(base), file = path.join(rt, '.sync.lock');
    // process.exit runs no finally block: the lock and the journal stay, as after a crash.
    const r = spawnSync(process.execPath, ['-e', `const fs=require('fs'),old=fs.renameSync; fs.renameSync=function(a,b){const r=old.apply(this,arguments);if(a.includes('.staging-'))process.exit(9);return r};require(${JSON.stringify(MODULE)}).sync(${JSON.stringify(pkg)},${JSON.stringify(rt)});`], { timeout: 20000 });
    assert.strictEqual(r.status, 9, String(r.stderr));
    assert.ok(fs.existsSync(file) && fs.existsSync(path.join(rt, '.switch-journal.json')));
    const raw = fs.readFileSync(file);
    const view = R.inspect(rt);
    assert.strictEqual(view.state, 'DEAD', JSON.stringify(view));
    assert.deepStrictEqual(fs.readFileSync(file), raw, 'inspect changed the lock');
    const result = R.recover(rt, view.expected);
    assert.strictEqual(result.ok, true, JSON.stringify(result));
    assert.strictEqual(result.state, 'RECOVERED');
    assert.strictEqual(result.retired, true);
    assert.strictEqual(fs.readFileSync(path.join(rt, 'hooks', 'a.js'), 'utf8'), 'old');
    assert.ok(!fs.existsSync(file) && !fs.existsSync(path.join(rt, '.switch-journal.json')));
    assert.deepStrictEqual(fs.readdirSync(rt).filter(n => n.startsWith('.sync.lock')), []);
    assert.strictEqual(R.recover(rt, 'absent').state, 'NO_PENDING_JOURNAL');
  });
  it('a stale digest is refused and the lock is kept', base => {
    const { rt } = seed(base), file = path.join(rt, '.sync.lock');
    fs.writeFileSync(file, windowsLock(rt));
    assert.strictEqual(R.inspect(rt).state, 'DEAD');
    const r = R.recover(rt, 'b'.repeat(64));
    assert.strictEqual(r.ok, false, JSON.stringify(r));
    assert.strictEqual(fs.readFileSync(file, 'utf8'), windowsLock(rt));
  });
  it('a lock from a writer that did not hold it open is UNKNOWN and names the manual check', base => {
    const { rt } = seed(base), file = path.join(rt, '.sync.lock');
    fs.writeFileSync(file, JSON.stringify({ pid: 4242, nonce: 'a'.repeat(32), identity: null }));
    const view = R.inspect(rt);
    assert.strictEqual(view.state, 'UNKNOWN', JSON.stringify(view));
    assert.match(view.reason, /Get-Process node/);
    assert.strictEqual(R.recover(rt, view.expected).ok, false);
    assert.ok(fs.existsSync(file));
  });
  it('a normal switch on Windows takes and releases the lock', base => {
    const { pkg, rt } = seed(base);
    const r = require(MODULE).sync(pkg, rt);
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.ok(!fs.existsSync(path.join(rt, '.sync.lock')));
    assert.strictEqual(R.inspect(rt).state, 'NO_LOCK');
  });
}

if (failed.length) { console.error(failed.join('\n')); console.error(`FAIL: ${failed.length} of ${checks}`); process.exit(1); }
console.log(`PASS: runtime recovery on ${WINDOWS ? 'Windows' : 'POSIX (Windows-format locks)'}: ${checks} checks`);
