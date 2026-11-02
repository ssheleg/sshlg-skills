'use strict';
// test/tmproot.js: every `npm test` run keeps its suites' temporary files in one directory
// and removes it at exit; a root left by a killed run is removed by the next one.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const T = require('./tmproot.js');

let n = 0;
const failed = [];
function it(name, fn) {
  n++;
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tmproot-case-')));
  try { fn(base); console.log(`ok ${name}`); } catch (e) { failed.push(`${name}: ${e.stack}`); }
  finally { fs.rmSync(base, { recursive: true, force: true }); }
}
/** A pid that is certainly gone: a child that has already exited. */
function deadPid() { return spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout.trim(); }
const MODULE = JSON.stringify(path.join(__dirname, 'tmproot.js'));

it('a run root carries its runner pid, routes every temp variable and is removed on close', (base) => {
  const dir = T.open(base);
  assert.ok(path.basename(dir).startsWith(T.PREFIX));
  assert.strictEqual(fs.readFileSync(path.join(dir, T.OWNER), 'utf8').trim(), String(process.pid));
  const env = T.env(dir, { HOME: '/h', TMPDIR: '/elsewhere' });
  assert.deepStrictEqual(env, { HOME: '/h', TMPDIR: dir, TMP: dir, TEMP: dir });
  fs.mkdirSync(path.join(dir, 'sshlg-apply-x', '.hermes', 'installs'), { recursive: true });
  T.close(dir);
  assert.ok(!fs.existsSync(dir));
});

it('a suite process writes into the root and the root goes when the runner exits', (base) => {
  const script = `const T=require(${MODULE}),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
    const dir=T.open(${JSON.stringify(base)}); process.on('exit',()=>T.close(dir));
    const r=spawnSync(process.execPath,['-e',"const fs=require('fs'),os=require('os'),p=require('path');fs.mkdtempSync(p.join(os.tmpdir(),'sshlg-it-'));process.stdout.write(os.tmpdir())"],{env:T.env(dir),encoding:'utf8'});
    process.stdout.write(JSON.stringify({seen:r.stdout,dir,inside:fs.readdirSync(dir).filter(x=>x.startsWith('sshlg-it-')).length}));`;
  const r = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const o = JSON.parse(r.stdout);
  assert.strictEqual(path.resolve(o.seen), path.resolve(o.dir), 'the suite saw another TMPDIR');
  assert.strictEqual(o.inside, 1, 'the suite did not write into the run root');
  assert.deepStrictEqual(fs.readdirSync(base), [], 'the run root outlived its runner');
});

it('a root whose runner was killed is reaped by the next run; a live runner keeps its root', (base) => {
  const r = spawnSync(process.execPath, ['-e', `const T=require(${MODULE});process.stdout.write(T.open(${JSON.stringify(base)}));process.kill(process.pid,'SIGKILL')`], { encoding: 'utf8' });
  assert.strictEqual(r.signal, 'SIGKILL');
  const orphan = r.stdout;
  assert.ok(fs.existsSync(orphan), 'a killed run cannot clean up, so its root must still be there');
  fs.mkdirSync(path.join(orphan, 'sshlg-pi-y'));
  const mine = T.open(base);
  assert.deepStrictEqual(T.reapStale(base), [path.basename(orphan)]);
  assert.ok(!fs.existsSync(orphan));
  assert.ok(fs.existsSync(mine), 'a live runner lost its root');
});

it('reaping keeps roots without an owner file and everything that is not a run root', (base) => {
  const unowned = path.join(base, `${T.PREFIX}AAAAAA`);
  fs.mkdirSync(unowned);
  const foreign = path.join(base, 'sshlg-apply-ZZZZZZ');
  fs.mkdirSync(foreign);
  fs.writeFileSync(path.join(foreign, T.OWNER), `${deadPid()}\n`);
  const dead = path.join(base, `${T.PREFIX}BBBBBB`);
  fs.mkdirSync(dead);
  fs.writeFileSync(path.join(dead, T.OWNER), `${deadPid()}\n`);
  assert.deepStrictEqual(T.reapStale(base), [path.basename(dead)]);
  assert.ok(fs.existsSync(unowned) && fs.existsSync(foreign));
  assert.deepStrictEqual(T.reapStale(path.join(base, 'absent')), []);
});

it('liveness: this process is alive, an exited child and garbage are not', () => {
  assert.strictEqual(T.alive(process.pid), true);
  assert.strictEqual(T.alive(Number(deadPid())), false);
  for (const v of [0, -1, NaN, 1.5]) assert.strictEqual(T.alive(v), false, String(v));
});

it('the runner itself routes suites into its root and removes it', () => {
  const src = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
  assert.match(src, /env: tmproot\.env\(RUN_TMP\)/);
  assert.match(src, /process\.on\('exit', \(\) => tmproot\.close\(RUN_TMP\)\)/);
  assert.match(src, /tmproot\.reapStale\(/);
});

if (failed.length) { console.error(failed.join('\n')); console.error(`FAIL: tmproot — ${failed.length} of ${n}`); process.exit(1); }
console.log(`PASS: tmproot — ${n} cases`);
