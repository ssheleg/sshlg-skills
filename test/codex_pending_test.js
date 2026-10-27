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
  t('an existing public receipt directory refuses without chmod or new writes', () => {
    const dir = path.dirname(file); const before = fs.readdirSync(dir);
    fs.chmodSync(dir, 0o777);
    try { assert.throws(() => P.save(args), /private|permission/); assert.throws(() => P.read(file), /private|permission/);
      assert.throws(() => P.immutable(path.join(dir, 'new-observation.json'), {}), /private|permission/);
      assert.strictEqual(fs.statSync(dir).mode & 0o777, 0o777); assert.deepStrictEqual(fs.readdirSync(dir), before); }
    finally { fs.chmodSync(dir, 0o700); }
  });
  t('an existing public receipt refuses read and replay without chmod or replacement', () => {
    const before = fs.readFileSync(file); fs.chmodSync(file, 0o644);
    try { assert.throws(() => P.read(file), /private|permission/); assert.throws(() => P.save(args), /private|permission/);
      assert.strictEqual(fs.statSync(file).mode & 0o777, 0o644); assert.ok(fs.readFileSync(file).equals(before)); }
    finally { fs.chmodSync(file, 0o600); }
  });
  t('an EEXIST publication race validates private ownership and modes before reuse', () => {
    const original = fs.linkSync; const f = path.join(root, 'raced.json'); const data = { bounded: true };
    fs.linkSync = (temp, dest) => { fs.copyFileSync(temp, dest); fs.chmodSync(dest, 0o644);
      const e = new Error('injected concurrent publish'); e.code = 'EEXIST'; throw e; };
    try { assert.throws(() => P.immutable(f, data), /private|permission/);
      assert.strictEqual(fs.statSync(f).mode & 0o777, 0o644); assert.deepStrictEqual(JSON.parse(fs.readFileSync(f)), data); }
    finally { fs.linkSync = original; }
    assert.ok(!fs.readdirSync(root).some((x) => x.startsWith('.pending-')));
  });
  t('foreign file ownership refuses even with private mode', () => {
    if (typeof process.getuid !== 'function') return;
    const original = fs.lstatSync;
    fs.lstatSync = (p, ...rest) => { const stat = original(p, ...rest); if (p === file) stat.uid += 1; return stat; };
    try { assert.throws(() => P.read(file), /owner|permission/); assert.throws(() => P.save(args), /owner|permission/); }
    finally { fs.lstatSync = original; }
  });
  t('EEXIST publication refuses a privately permissioned but foreign-owned file', () => {
    if (typeof process.getuid !== 'function') return;
    const originalLink = fs.linkSync; const originalStat = fs.lstatSync; const f = path.join(root, 'foreign-race.json');
    fs.linkSync = (temp, dest) => { fs.copyFileSync(temp, dest); const e = new Error('concurrent publish'); e.code = 'EEXIST'; throw e; };
    fs.lstatSync = (p, ...rest) => { const stat = originalStat(p, ...rest); if (p === f) stat.uid += 1; return stat; };
    try { assert.throws(() => P.immutable(f, { bounded: true }), /owner|permission/); }
    finally { fs.linkSync = originalLink; fs.lstatSync = originalStat; }
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(f)), { bounded: true });
  });
  t('readable hub root is retained, but another-writable hub root refuses', () => {
    const base = path.dirname(path.dirname(file)); fs.chmodSync(base, 0o755);
    assert.strictEqual(P.save(args), file); assert.strictEqual(fs.statSync(base).mode & 0o777, 0o755);
    fs.chmodSync(base, 0o777);
    try { assert.throws(() => P.save(args), /permission/); assert.throws(() => P.read(file), /permission/);
      assert.strictEqual(fs.statSync(base).mode & 0o777, 0o777); }
    finally { fs.chmodSync(base, 0o700); }
  });
  t('three identical admissions preserve bytes and one receipt', () => {
    const before = fs.readFileSync(file);
    for (let i = 0; i < 3; i++) assert.strictEqual(P.save(args), file);
    assert.ok(fs.readFileSync(file).equals(before));
    assert.strictEqual(fs.readdirSync(path.dirname(file)).length, 1);
  });
  t('changed intent has a separate receipt; the superseded one is retired whole, never rewritten (B-224)', () => {
    const before = fs.readFileSync(file);
    const second = P.save({ ...args, results: [{ ...result, item: { ...result.item, pin: '3' } }] });
    assert.notStrictEqual(second, file); assert.strictEqual(P.read(second).items[0].desired, '3');
    assert.ok(!fs.existsSync(file), 'the superseded receipt for the same member stayed');
    // the first intent saved again republishes the same bytes and supersedes the second
    assert.strictEqual(P.save(args), file); assert.ok(fs.readFileSync(file).equals(before));
    assert.ok(!fs.existsSync(second));
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
    const f = path.join(root, 'collision'); fs.writeFileSync(f, 'foreign', { mode: 0o600 });
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
    const f = path.join(root, 'bad.json'); const bad = Buffer.from([0xff]); fs.writeFileSync(f, bad, { mode: 0o600 });
    assert.throws(() => P.read(f), /UTF-8/); assert.ok(fs.readFileSync(f).equals(bad));
    const link = path.join(root, 'link.json'); fs.symlinkSync(file, link); assert.throws(() => P.read(link), /plain file/);
  });
  t('copied receipt outside its namespace is refused before adjacent writes', () => {
    const copied = path.join(root, path.basename(file)); fs.copyFileSync(file, copied);
    assert.throws(() => P.read(copied), /outside.*namespace/);
    const r = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/codex-deferred-watch.js'), copied, '--once'], { encoding: 'utf8' });
    assert.strictEqual(r.status, 1); assert.ok(r.stderr.includes('outside'));
    assert.ok(!fs.readdirSync(root).some((x) => x.includes('.observation-')));
  });
  t('valid-shape tampering refuses the immutable receipt identity', () => {
    const before = fs.readFileSync(file); const changed = JSON.parse(before); changed.items[0].desired = '999';
    try { fs.writeFileSync(file, JSON.stringify(changed)); assert.throws(() => P.read(file), /immutable identity/); }
    finally { fs.writeFileSync(file, before); }
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
  t('printed POSIX watcher argv survives spaces and shell substitutions literally', () => {
    const odd = "space $(exit 7) `exit 8` apostrophe' ";
    const dir = path.join(root, odd); fs.mkdirSync(dir);
    const executable = path.join(dir, 'node ' + odd); fs.symlinkSync(process.execPath, executable);
    const script = path.join(dir, 'script ' + odd + '.js');
    fs.writeFileSync(script, 'process.stdout.write(JSON.stringify(process.argv.slice(1)));\n');
    const input = path.join(dir, 'receipt ' + odd + '.json');
    const command = P.watcherCommand(script, input, { platform: 'darwin', executable });
    const result = spawnSync('/bin/sh', ['-c', command], { encoding: 'utf8', timeout: 5000 });
    assert.strictEqual(result.status, 0, result.stderr); assert.strictEqual(result.stderr, '');
    assert.deepStrictEqual(JSON.parse(result.stdout), [script, input]);
    assert.ok(!fs.existsSync(input), 'formatting or execution must not create the receipt');
  });
  t('Windows receives no falsely runnable POSIX command; NUL argv refuses', () => {
    assert.strictEqual(P.watcherCommand('C:\\Program Files\\watch.js', 'C:\\data\\receipt.json', { platform: 'win32' }), null);
    assert.throws(() => P.watcherCommand('watch.js', 'bad\0name', { platform: 'linux' }), /NUL/);
  });
  t('unknown watcher arguments refuse before native calls', () => {
    const r = spawnSync(process.execPath, [path.resolve(__dirname, '../lib/codex-deferred-watch.js'), file, '--force'], { encoding: 'utf8' });
    assert.strictEqual(r.status, 1); assert.ok(r.stderr.includes('usage:'));
  });
  // B-224: deferral receipts accumulated (67, then 92 files) while Codex stayed deferred.
  // Each member keeps only its newest receipt; a receipt goes with its observations.
  t('B-224: KEEP+2 deferred updates keep the newest receipt per member, with capped observations', () => {
    const h2 = path.join(root, 'home-cap'); const p2 = path.join(root, 'profile-cap');
    fs.mkdirSync(h2); fs.mkdirSync(p2);
    const cfg2 = path.join(p2, 'config.toml');
    const item = (member) => ({ status: 'deferred', item: { member, pluginId: member + '@' + member, from: '1', pin: '2', ref: 'b'.repeat(40), refKind: 'commit', url: 'https://github.com/fixture/' + member + '.git' } });
    const saveWith = (n, members) => { const b = Buffer.from('n = ' + n + '\n'); fs.writeFileSync(cfg2, b);
      return P.save({ home: h2, configPath: cfg2, configBytes: b, results: members.map(item), runtime: 'codex-cli 0.162.1' }); };
    const other = saveWith(0, ['other']);
    const both = saveWith(1, ['probe', 'other']);
    let last;
    for (let i = 0; i < P.KEEP_OBSERVATIONS + 2; i++) P.immutable(both.replace(/\.json$/, `.observation-${String(i).padStart(64, '0')}.json`), { i });
    for (let i = 2; i < 2 + 3 + 2; i++) last = saveWith(i, ['probe']);
    const dir = path.dirname(last);
    const receipts = fs.readdirSync(dir).filter((x) => /^[a-f0-9]{64}\.json$/.test(x)).sort();
    // newest probe receipt, and the newest receipt naming `other` (both): `other`'s own older one goes
    assert.deepStrictEqual(receipts, [path.basename(last), path.basename(both)].sort(), receipts.join(','));
    assert.ok(!fs.existsSync(other));
    const obs = fs.readdirSync(dir).filter((x) => x.includes('.observation-'));
    assert.strictEqual(obs.length, P.KEEP_OBSERVATIONS, `kept ${obs.length} observations`);
    // a re-saved identical receipt is the newest again, not pruned for its first date
    const again = saveWith(1, ['probe', 'other']);
    assert.strictEqual(again, both);
    const after = fs.readdirSync(dir).filter((x) => /^[a-f0-9]{64}\.json$/.test(x));
    assert.deepStrictEqual(after, [path.basename(both)], after.join(','));
    // a file the namespace does not name is left alone
    fs.writeFileSync(path.join(dir, 'operator-note.txt'), 'mine', { mode: 0o600 }); saveWith(9, ['probe']);
    assert.ok(fs.existsSync(path.join(dir, 'operator-note.txt')));
  });
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(`\nPASS: codex pending — ${n} cases`);
