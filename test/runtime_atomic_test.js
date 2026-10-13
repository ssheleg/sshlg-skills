'use strict';
// Process/filesystem fault controls; every HOME and target is fixture-owned.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const R = require('../lib/runtime');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const failed = [];
function write(p, text) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
function fixture(fn) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-atomic-'));
  try { fn(base); } finally { fs.rmSync(base, { recursive: true, force: true }); }
}
function it(name, fn) { checks++; try { fixture(fn); console.log('ok ' + name); } catch (e) { failed.push(name + ': ' + e.stack); } }
function seed(base) {
  const pkg = path.join(base, 'pkg'), rt = path.join(base, 'rt');
  for (const rel of ['hooks/a.js', 'lib/b.js']) { write(path.join(pkg, rel), 'new ' + rel); write(path.join(rt, rel), 'old ' + rel); }
  write(path.join(pkg, 'hooks/introduced.js'), 'introduced');
  write(path.join(pkg, 'skills.json'), '{}'); write(path.join(pkg, 'package.json'), '{}');
  write(path.join(rt, 'notes.txt'), 'foreign');
  return { pkg, rt };
}
function fp(text) { return { sha256: crypto.createHash('sha256').update(text).digest('hex'), mode: 0o644 }; }
function crashed(base, switched = ['hooks/a.js', 'hooks/introduced.js']) {
  const x = seed(base), files = [];
  for (const rel of ['hooks/a.js', 'hooks/introduced.js', 'lib/b.js']) {
    const before = rel.includes('introduced') ? null : fp('old ' + rel);
    const after = fp(rel.includes('introduced') ? 'introduced' : 'new ' + rel);
    if (before) write(path.join(x.rt, '.prev-generation', rel), 'old ' + rel);
    if (switched.includes(rel)) write(path.join(x.rt, rel), rel.includes('introduced') ? 'introduced' : 'new ' + rel);
    files.push({ rel, before, after });
  }
  write(path.join(x.rt, '.switch-journal.json'), JSON.stringify({ version: 2, staging: '.staging-fixture', files }));
  return x;
}
function old(x) {
  for (const rel of ['hooks/a.js', 'lib/b.js']) assert.equal(fs.readFileSync(path.join(x.rt, rel), 'utf8'), 'old ' + rel);
  assert(!fs.existsSync(path.join(x.rt, 'hooks/introduced.js')));
  assert.equal(fs.readFileSync(path.join(x.rt, 'notes.txt'), 'utf8'), 'foreign');
}
for (const point of [1, 2, 3]) it('switch fault ' + point + ' immediately restores old/existence set', base => {
  const x = seed(base), real = fs.renameSync; let n = 0;
  fs.renameSync = (a, b) => { if (a.includes('.staging-') && ++n === point) throw Error('fixture rename'); return real(a, b); };
  let result; try { result = R.sync(x.pkg, x.rt); } finally { fs.renameSync = real; }
  assert.equal(result.ok, false); assert.equal(result.recovery, 'rolled-back'); old(x);
  assert(!fs.existsSync(path.join(x.rt, '.switch-journal.json')));
});
it('staging failure is failed rather than skipped and leaves old bytes', base => {
  const x = seed(base), real = fs.copyFileSync;
  fs.copyFileSync = () => { throw Error('fixture staging'); };
  let r; try { r = R.sync(x.pkg, x.rt); } finally { fs.copyFileSync = real; }
  assert.equal(r.status, 'failed'); assert.equal(r.recovery, 'not-needed'); old(x);
});
for (const switched of [[], ['hooks/a.js'], ['hooks/a.js', 'hooks/introduced.js', 'lib/b.js']]) it('recovery preserves original existence, switched=' + switched.length, base => {
  const x = crashed(base, switched); const r = R.recover(x.rt); assert.equal(r.ok, true); assert(r.recovered); old(x);
  assert.equal(R.recover(x.rt).recovered, false);
});
for (const kind of ['malformed', 'legacy', 'missing-backup', 'changed-backup', 'foreign-current', 'foreign-introduced', 'invalid-path', 'duplicate', 'journal-symlink']) it('unknown recovery preserved: ' + kind, base => {
  const x = crashed(base), j = path.join(x.rt, '.switch-journal.json');
  if (kind === 'malformed') fs.writeFileSync(j, '{');
  if (kind === 'legacy') fs.writeFileSync(j, JSON.stringify({ files: ['hooks/a.js'] }));
  if (kind === 'missing-backup') fs.unlinkSync(path.join(x.rt, '.prev-generation/hooks/a.js'));
  if (kind === 'changed-backup') fs.writeFileSync(path.join(x.rt, '.prev-generation/hooks/a.js'), 'foreign');
  if (kind === 'foreign-current') fs.writeFileSync(path.join(x.rt, 'lib/b.js'), 'foreign');
  if (kind === 'foreign-introduced') fs.writeFileSync(path.join(x.rt, 'hooks/introduced.js'), 'foreign');
  if (kind === 'invalid-path' || kind === 'duplicate') { const data = JSON.parse(fs.readFileSync(j)); if (kind === 'duplicate') data.files.push(data.files[0]); else data.files[0].rel = '../outside'; fs.writeFileSync(j, JSON.stringify(data)); }
  if (kind === 'journal-symlink') { const to = path.join(base, 'foreign-journal'); fs.renameSync(j, to); fs.symlinkSync(to, j); }
  const before = fs.readFileSync(j), current = fs.readFileSync(path.join(x.rt, 'hooks/a.js'));
  assert.equal(R.recover(x.rt).ok, false);
  assert.equal(R.sync(x.pkg, x.rt).ok, false);
  assert.deepEqual(fs.readFileSync(j), before); assert.deepEqual(fs.readFileSync(path.join(x.rt, 'hooks/a.js')), current);
});
it('rollback failure retains journal and retry finishes', base => {
  const x = seed(base), real = fs.renameSync;
  let n = 0; fs.renameSync = (a, b) => { if (a.includes('.staging-') && ++n === 2 || a.includes('.rollback-')) throw Error('fixture rename'); return real(a, b); };
  let r; try { r = R.sync(x.pkg, x.rt); } finally { fs.renameSync = real; }
  assert.equal(r.ok, false); assert.equal(r.recovery, 'unresolved'); assert(fs.existsSync(path.join(x.rt, '.switch-journal.json')));
  assert.equal(R.recover(x.rt).ok, true); old(x);
});
it('lost journal during failed switch cannot claim rollback', base => {
  const x = seed(base), real = fs.renameSync; let n = 0;
  fs.renameSync = (a, b) => { if (a.includes('.staging-') && ++n === 2) { fs.unlinkSync(path.join(x.rt, '.switch-journal.json')); throw Error('lost journal'); } return real(a, b); };
  let r; try { r = R.sync(x.pkg, x.rt); } finally { fs.renameSync = real; }
  assert.equal(r.ok, false); assert.equal(r.recovery, 'unresolved'); assert(!/old runtime restored|old runtime intact/.test(r.reason));
  assert(fs.existsSync(path.join(x.rt, '.prev-generation')));
});
it('concurrent sync is refused before shared transaction files move', base => {
  const x = seed(base), real = fs.copyFileSync; let nested;
  fs.copyFileSync = (a, b) => { if (!nested) { nested = {}; nested = R.sync(x.pkg, x.rt); } return real(a, b); };
  let outer; try { outer = R.sync(x.pkg, x.rt); } finally { fs.copyFileSync = real; }
  assert.equal(nested.ok, false); assert.match(nested.reason, /EEXIST/); assert.equal(outer.ok, true);
});
it('hard crash retains lock and journal; no automatic lock steal', base => {
  const x = seed(base), module = path.join(ROOT, 'lib/runtime.js');
  const child = spawnSync(process.execPath, ['-e', `const fs=require('fs'),r=require(process.argv[1]),rename=fs.renameSync;fs.renameSync=(a,b)=>{rename(a,b);if(a.includes('.staging-'))process.exit(23);};r.sync(process.argv[2],process.argv[3]);`, module, x.pkg, x.rt], { encoding: 'utf8' });
  assert.equal(child.status, 23); const j = fs.readFileSync(path.join(x.rt, '.switch-journal.json'));
  assert.equal(R.sync(x.pkg, x.rt).ok, false); assert.deepEqual(fs.readFileSync(path.join(x.rt, '.switch-journal.json')), j);
  // Fixture owner knows that exact child exited. This is NOT automatic production takeover.
  fs.unlinkSync(path.join(x.rt, '.sync.lock'));
  assert.equal(R.recover(x.rt).ok, true); old(x);
});
it('absent refresh remains a benign skip without directory creation', base => {
  const r = R.sync(base, path.join(base, 'absent')); assert.equal(r.ok, true); assert.equal(r.status, 'skipped'); assert(!fs.existsSync(path.join(base, 'absent')));
});
for (const kind of ['snapshot', 'journal-write', 'journal-truncated', 'discovery', 'managed-symlink', 'managed-fifo']) it('bounded failure at ' + kind, base => {
  const x = seed(base), copy = fs.copyFileSync, writeFile = fs.writeFileSync, readDir = fs.readdirSync;
  const j = path.join(x.rt, '.switch-journal.json');
  if (kind === 'managed-symlink' || kind === 'managed-fifo') {
    const target = path.join(x.rt, 'hooks/a.js'); fs.unlinkSync(target);
    if (kind === 'managed-symlink') { write(path.join(base, 'outside'), 'foreign'); fs.symlinkSync(path.join(base, 'outside'), target); }
    else assert.equal(spawnSync('mkfifo', [target]).status, 0);
  }
  fs.copyFileSync = (a, b, ...args) => { if (kind === 'snapshot' && b.includes('.prev-generation')) throw Error('snapshot failed'); return copy(a, b, ...args); };
  fs.readdirSync = (dir, ...args) => { if (kind === 'discovery' && dir === path.join(x.pkg, 'hooks')) { const e = Error('unreadable'); e.code = 'EACCES'; throw e; } return readDir(dir, ...args); };
  fs.writeFileSync = (file, data, ...args) => {
    if (typeof file === 'number' && typeof data === 'string' && data.includes('"version":2')) {
      if (kind === 'journal-write') throw Error('journal write failed');
      if (kind === 'journal-truncated') { writeFile(file, '{'); throw Error('journal partial write'); }
    }
    return writeFile(file, data, ...args);
  };
  let r; try { r = R.sync(x.pkg, x.rt); } finally { fs.copyFileSync = copy; fs.writeFileSync = writeFile; fs.readdirSync = readDir; }
  assert.equal(r.ok, false);
  if (!kind.startsWith('managed-')) old(x);
  if (kind.startsWith('journal-')) { assert(fs.existsSync(j)); assert.equal(r.recovery, 'unresolved'); }
  if (kind === 'managed-symlink') assert.equal(fs.readFileSync(path.join(base, 'outside'), 'utf8'), 'foreign');
});
it('three successful real syncs preserve exact bytes and modes', base => {
  const x = seed(base); fs.chmodSync(path.join(x.pkg, 'hooks/a.js'), 0o755);
  const first = R.sync(x.pkg, x.rt); assert(first.ok); assert(first.copied.length === 5);
  assert.equal(fs.statSync(path.join(x.rt, 'hooks/a.js')).mode & 0o777, 0o755);
  assert.equal(R.sync(x.pkg, x.rt).status, 'unchanged'); assert.equal(R.sync(x.pkg, x.rt).status, 'unchanged');
  assert.equal(fs.readFileSync(path.join(x.rt, 'hooks/introduced.js'), 'utf8'), 'introduced');
});
for (const missing of ['hooks', 'lib', 'skills.json', 'package.json']) it('missing required source refuses before mutation: ' + missing, base => {
  const x = seed(base); fs.rmSync(path.join(x.pkg, missing), { recursive: true, force: true });
  assert.equal(R.sync(x.pkg, x.rt).ok, false); old(x); assert(!fs.existsSync(path.join(x.rt, '.prev-generation')));
});
it('journal parent symlink refuses without writing its target', base => {
  const x = crashed(base); fs.renameSync(path.join(x.rt, 'hooks'), path.join(base, 'foreign-hooks')); fs.symlinkSync(path.join(base, 'foreign-hooks'), path.join(x.rt, 'hooks'));
  const before = fs.readFileSync(path.join(base, 'foreign-hooks/a.js'));
  assert.equal(R.recover(x.rt).ok, false); assert.deepEqual(fs.readFileSync(path.join(base, 'foreign-hooks/a.js')), before); assert(fs.existsSync(path.join(x.rt, '.switch-journal.json')));
});
it('read-only stale refuses to read a source FIFO', base => {
  const x = seed(base), source = path.join(x.pkg, 'lib/b.js'); fs.unlinkSync(source); assert.equal(spawnSync('mkfifo', [source]).status, 0);
  const r = spawnSync(process.execPath, ['-e', "console.log(JSON.stringify(require(process.argv[1]).stale(process.argv[2],process.argv[3])))", path.join(ROOT, 'lib/runtime.js'), x.pkg, x.rt], { encoding: 'utf8', timeout: 3000 });
  assert(!r.error, String(r.error)); assert.equal(r.status, 0, r.stderr); assert(JSON.parse(r.stdout).differing.includes('lib/b.js')); assert(fs.lstatSync(source).isFIFO());
});
for (const command of [['hooks', 'install'], ['update', '--claude-only']]) for (const fault of ['stage', 'switch', 'fifo']) it('actual CLI ' + command.join(' ') + ' propagates ' + fault + ' failure', base => {
  const home = path.join(base, 'home'), rt = path.join(home, '.sshlg-skills/runtime'), settings = path.join(home, '.claude/settings.json');
  const original = '{"env":{"KEEP":"fixture"}}\n'; write(settings, original); write(path.join(rt, 'hooks/notification.js'), 'old');
  if (fault === 'fifo') { fs.unlinkSync(path.join(rt, 'hooks/notification.js')); assert.equal(spawnSync('mkfifo', [path.join(rt, 'hooks/notification.js')]).status, 0); }
  const shim = path.join(base, 'fault.cjs');
  write(shim, `require(${JSON.stringify(path.join(ROOT, 'test/fixtures/native-transaction-boundary.cjs'))});const fs=require('fs');let n=0;const copy=fs.copyFileSync,rename=fs.renameSync;fs.copyFileSync=(a,b,...rest)=>{if(${JSON.stringify(fault)}==='stage'&&b.includes('.staging-'))throw Error('FIXTURE_STAGE');return copy(a,b,...rest);};fs.renameSync=(a,b,...rest)=>{if(${JSON.stringify(fault)}==='switch'&&a.includes('.staging-')&&++n===2)throw Error('FIXTURE_SWITCH');return rename(a,b,...rest);};`);
  const bin = path.join(base, 'bin'); fs.mkdirSync(bin);
  for (const cmd of ['git', 'npx', 'npm', 'claude', 'gh']) { const f = path.join(bin, cmd); write(f, '#!/bin/sh\nexit 0\n'); fs.chmodSync(f, 0o755); }
  const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'), CLAUDE_CONFIG_DIR: path.join(home, '.claude'), XDG_CONFIG_HOME: path.join(home, '.config'), NODE_OPTIONS: '--require=' + JSON.stringify(shim), SSHLG_SKILLS_NO_PROBE: '1', PATH: bin + path.delimiter + process.env.PATH };
  const r = spawnSync(process.execPath, [path.join(ROOT, 'bin/sshlg-skills.js'), ...command], { env, cwd: home, encoding: 'utf8', timeout: fault === 'fifo' ? 3000 : 30000 });
  assert(!r.error, String(r.error));
  const out = r.stdout + r.stderr;
  assert.notEqual(r.status, 0, out); assert.match(out, fault === 'fifo' ? /unsafe runtime file/ : /FIXTURE_STAGE|FIXTURE_SWITCH/);
  assert(!/скрипты синхронизированы/.test(out), out); assert.equal(fs.readFileSync(settings, 'utf8'), original);
  if (fault === 'fifo') assert(fs.lstatSync(path.join(rt, 'hooks/notification.js')).isFIFO());
  else assert.equal(fs.readFileSync(path.join(rt, 'hooks/notification.js'), 'utf8'), 'old');
});
if (failed.length) { console.error(failed.join('\n')); process.exitCode = 1; }
console.log(`${failed.length ? 'FAIL' : 'PASS'} runtime atomic: ${checks - failed.length}/${checks}`);
