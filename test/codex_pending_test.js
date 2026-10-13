'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const P = require('../lib/codex-pending');
let n = 0;
function t(name, fn) { fn(); n++; console.log('  ok  ' + name); }
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-pending-'));
try {
  const home = path.join(root, 'home'); const profile = path.join(root, 'profile');
  fs.mkdirSync(home); fs.mkdirSync(profile);
  const cfg = path.join(profile, 'config.toml'); const bytes = Buffer.from('foreign = "private value never journalled"\n'); fs.writeFileSync(cfg, bytes);
  const result = { status: 'deferred', item: { member: 'probe', pluginId: 'probe@probe', from: '1', pin: '2', ref: 'a'.repeat(40), refKind: 'commit', url: 'https://github.com/fixture/probe.git' } };
  const args = { home, configPath: cfg, configBytes: bytes, results: [result], runtime: 'codex-cli 0.162.1' };
  let file, receipt;
  t('private immutable receipt records exact requested ref without raw config', () => {
    file = P.save(args); receipt = P.read(file);
    assert.strictEqual(receipt.items[0].ref, 'a'.repeat(40));
    assert.strictEqual(receipt.profile, fs.realpathSync(profile));
    assert.ok(!fs.readFileSync(file, 'utf8').includes('private value'));
    assert.strictEqual(fs.statSync(file).mode & 0o777, 0o600);
    assert.strictEqual(fs.statSync(path.dirname(file)).mode & 0o777, 0o700);
  });
  t('three identical admissions preserve bytes and one receipt', () => {
    const before = fs.readFileSync(file);
    for (let i = 0; i < 3; i++) assert.strictEqual(P.save(args), file);
    assert.ok(fs.readFileSync(file).equals(before));
    assert.strictEqual(fs.readdirSync(path.dirname(file)).length, 1);
  });
  t('changed intent has separate immutable receipt, never overwrites old work', () => {
    const second = P.save({ ...args, results: [{ ...result, item: { ...result.item, pin: '3' } }] });
    assert.notStrictEqual(second, file); assert.strictEqual(P.read(file).items[0].desired, '2');
  });
  t('changed config is refused before creating state in a fresh home', () => {
    const h = path.join(root, 'fresh'); fs.mkdirSync(h); fs.writeFileSync(cfg, 'changed');
    assert.throws(() => P.save({ ...args, home: h }), /config changed/);
    assert.deepStrictEqual(fs.readdirSync(h), []); fs.writeFileSync(cfg, bytes);
  });
  t('symlink namespace cannot route receipt into foreign directory', () => {
    const h = path.join(root, 'linked'); fs.mkdirSync(h); const foreign = path.join(root, 'foreign'); fs.mkdirSync(foreign);
    fs.symlinkSync(foreign, path.join(h, '.sshlg-skills'));
    assert.throws(() => P.save({ ...args, home: h }), /plain directory/);
    assert.deepStrictEqual(fs.readdirSync(foreign), []);
  });
  t('preexisting conflicting receipt remains byte-exact', () => {
    const f = path.join(root, 'collision'); fs.writeFileSync(f, 'foreign');
    assert.throws(() => P.immutable(f, {}), /collision/); assert.strictEqual(fs.readFileSync(f, 'utf8'), 'foreign');
  });
  t('publish failure leaves no truncated receipt or temporary residue', () => {
    const original = fs.linkSync; const f = path.join(root, 'fail.json');
    fs.linkSync = () => { const e = new Error('injected publish failure'); e.code = 'EIO'; throw e; };
    try { assert.throws(() => P.immutable(f, {}), /publish failure/); } finally { fs.linkSync = original; }
    assert.ok(!fs.existsSync(f)); assert.ok(!fs.readdirSync(root).some((x) => x.startsWith('.pending-')));
  });
  t('partial temp write failure leaves no published receipt', () => {
    const original = fs.writeFileSync; const f = path.join(root, 'partial.json');
    fs.writeFileSync = (fd) => { fs.writeSync(fd, '{'); throw new Error('injected partial write'); };
    try { assert.throws(() => P.immutable(f, {}), /partial write/); } finally { fs.writeFileSync = original; }
    assert.ok(!fs.existsSync(f)); assert.ok(!fs.readdirSync(root).some((x) => x.startsWith('.pending-')));
  });
  const runner = (version, enabled = true) => (cmd, a, opts) => {
    assert.strictEqual(cmd, 'codex'); assert.deepStrictEqual(a, ['plugin', 'list', '--json']);
    assert.strictEqual(opts.profile, receipt.profile); assert.strictEqual(opts.read, true);
    return { status: 0, stdout: JSON.stringify({ installed: [{ pluginId: 'probe@probe', installed: true, enabled, version }] }) };
  };
  t('watcher keeps stale catalog pending, never admits mutation', () => {
    const r = P.observe(receipt, runner('1')); assert.strictEqual(r.status, 'deferred'); assert.strictEqual(r.mutationAllowed, false);
  });
  t('matching native catalog is distinct from unknown thread generation and no mutation grant', () => {
    const r = P.observe(receipt, runner('2')); assert.strictEqual(r.status, 'catalog-matches-thread-generation-unknown');
    assert.strictEqual(r.threadLoadedVersion, 'unknown'); assert.strictEqual(r.mutationAllowed, false);
  });
  t('disabled plugin never resolves pending work as current', () => assert.strictEqual(P.observe(receipt, runner('2', false)).status, 'deferred'));
  t('failed or malformed native reads do not become empty-success', () => {
    for (const r of [{ status: 1 }, { status: 0, signal: 'SIGTERM' }, { status: 0, stdout: '{}' }])
      assert.strictEqual(P.observe(receipt, () => r).status, 'unread');
  });
  t('changed config stops before spawning anything', () => {
    fs.writeFileSync(cfg, 'changed');
    assert.strictEqual(P.observe(receipt, () => { throw new Error('spawned'); }).status, 'config-changed-rescan-required');
    fs.writeFileSync(cfg, bytes);
  });
  t('retargeted profile alias stops before spawning anything', () => {
    const alias = path.join(root, 'alias'); fs.symlinkSync(profile, alias);
    const r = { ...receipt, requestedProfile: alias }; const other = path.join(root, 'other'); fs.mkdirSync(other);
    fs.unlinkSync(alias); fs.symlinkSync(other, alias);
    assert.strictEqual(P.observe(r, () => { throw new Error('spawned'); }).status, 'profile-changed');
  });
  t('invalid UTF-8 and symlink receipts refuse without rewrite', () => {
    const f = path.join(root, 'bad.json'); const bad = Buffer.from([0xff]); fs.writeFileSync(f, bad);
    assert.throws(() => P.read(f), /UTF-8/); assert.ok(fs.readFileSync(f).equals(bad));
    const link = path.join(root, 'link.json'); fs.symlinkSync(file, link); assert.throws(() => P.read(link), /plain file/);
  });
  t('real watcher process once is bounded, writes its observation and runs only list', () => {
    const shims = path.join(root, 'shims'); fs.mkdirSync(shims); const calls = path.join(root, 'calls');
    fs.writeFileSync(path.join(shims, 'codex'), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${calls}'\nprintf '%s\\n' '{"installed":[{"pluginId":"probe@probe","version":"1"}]}'\n`, { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/codex-deferred-watch.js'), file, '--once'], {
      encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: shims + path.delimiter + process.env.PATH },
    });
    assert.strictEqual(r.status, 3, r.stderr); assert.strictEqual(JSON.parse(r.stdout).status, 'deferred');
    assert.strictEqual(fs.readFileSync(calls, 'utf8'), 'plugin list --json\n');
    assert.ok(fs.readdirSync(path.dirname(file)).some((x) => x.includes('.observation-')));
  });
  t('wall-clock exhaustion preserves pending intent and writes an explicit durable observation', () => {
    const preload = path.join(root, 'elapsed.cjs');
    fs.writeFileSync(preload, 'let n=0;Date.now=()=>1700000000000+(n++ ? 7200001 : 0);\n');
    const before = fs.readFileSync(file);
    const r = spawnSync(process.execPath, ['--require', preload, path.resolve(__dirname, '../lib/codex-deferred-watch.js'), file], {
      encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: '' },
    });
    assert.strictEqual(r.status, 3, r.stderr);
    const observation = JSON.parse(r.stdout); assert.strictEqual(observation.status, 'watch-exhausted');
    assert.strictEqual(observation.pending, true); assert.strictEqual(observation.mutationAllowed, false);
    assert.ok(fs.readFileSync(file).equals(before));
    const exhausted = fs.readdirSync(path.dirname(file)).filter((x) => x.includes('.exhausted-'));
    assert.strictEqual(exhausted.length, 1);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(path.dirname(file), exhausted[0]))), observation);
  });
  t('unknown watcher arguments refuse before native calls', () => {
    const r = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/codex-deferred-watch.js'), file, '--force'], { encoding: 'utf8' });
    assert.strictEqual(r.status, 1); assert.ok(r.stderr.includes('usage:'));
  });
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(`\nPASS: codex pending — ${n} cases`);
