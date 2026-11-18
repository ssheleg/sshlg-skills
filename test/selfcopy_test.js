#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// B-359: install and update run from a copy the npx cache cannot take away.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const SC = require('../lib/selfcopy.js');

const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-selfcopy-')));

// A package laid out as npx lays it out: <home>/.npm/_npx/<hash>/node_modules/sshlg-skills.
const home = path.join(tmp, 'home');
const npxRoot = path.join(home, '.npm', '_npx', 'abc123', 'node_modules', 'sshlg-skills');
for (const f of SC.packageFiles(ROOT)) {
  fs.mkdirSync(path.dirname(path.join(npxRoot, f)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), path.join(npxRoot, f));
}

it('a checkout or a global install runs where it is', () => {
  assert.strictEqual(SC.inNpxCache(ROOT), ROOT.split(path.sep).includes('_npx'));
  assert.strictEqual(SC.relaunchRoot({ root: path.join(tmp, 'checkout'), home, env: {} }), null);
});
it('the copy holds every shipped file byte for byte and nothing else', () => {
  const dest = SC.relaunchRoot({ root: npxRoot, home, env: {} });
  assert.ok(dest && dest.startsWith(path.join(home, '.sshlg-skills', 'launcher')), dest);
  for (const f of SC.packageFiles(npxRoot)) assert.ok(fs.readFileSync(path.join(dest, f)).equals(fs.readFileSync(path.join(npxRoot, f))), f);
  assert.ok(SC.packageFiles(npxRoot).includes(path.join('lib', 'quarantine.js')));
  assert.ok(!fs.existsSync(path.join(dest, 'test')) && !fs.existsSync(path.join(dest, 'skills')), 'a checkout tree was copied');
});
it('the copy is reused, and the process already in it does not copy again', () => {
  const a = SC.stableCopy({ root: npxRoot, home });
  const stamp = fs.statSync(path.join(a, '.complete')).mtimeMs;
  assert.strictEqual(SC.stableCopy({ root: npxRoot, home }), a);
  assert.strictEqual(fs.statSync(path.join(a, '.complete')).mtimeMs, stamp);
  assert.strictEqual(SC.relaunchRoot({ root: npxRoot, home, env: { [SC.ENV]: '1' } }), null);
});
it('the copy runs after the npx folder is gone: the incident of 2026-11-18', () => {
  const dest = SC.stableCopy({ root: npxRoot, home });
  fs.rmSync(path.join(home, '.npm'), { recursive: true, force: true });
  const r = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(path.join(dest, 'lib', 'cli-install.js'))});require(${JSON.stringify(path.join(dest, 'lib', 'quarantine.js'))});console.log('ok')`], { encoding: 'utf8' });
  assert.strictEqual(r.stdout.trim(), 'ok', r.stderr);
  const v = spawnSync(process.execPath, [path.join(dest, 'bin', 'sshlg-skills.js'), '--version'], { encoding: 'utf8' });
  assert.strictEqual(v.stdout.trim(), require('../package.json').version, v.stderr);
});
it('old copies beyond KEEP are removed, the current one never', () => {
  const h = path.join(tmp, 'home3');
  const base = path.join(h, '.sshlg-skills', 'launcher');
  ['0.0.1-aaaaaaaaaaaa', '0.0.2-bbbbbbbbbbbb', '0.0.3-cccccccccccc'].forEach((n, i) => {
    fs.mkdirSync(path.join(base, n), { recursive: true });
    const t = new Date(Date.now() - (10 - i) * 60000); fs.utimesSync(path.join(base, n), t, t);
  });
  const kept = SC.stableCopy({ root: ROOT, home: h });
  const left = fs.readdirSync(base).sort();
  assert.ok(left.includes(path.basename(kept)), left.join());
  assert.deepStrictEqual(left.length, SC.KEEP, left.join());
  assert.ok(left.includes('0.0.3-cccccccccccc'), 'the newest older copy is the one kept: ' + left.join());
});

fs.rmSync(tmp, { recursive: true, force: true });
if (failures.length) { failures.forEach((f) => console.log('FAIL: ' + f)); console.log(`${failures.length} failure(s) out of ${checks} checks`); process.exit(1); }
console.log(`OK (${checks} checks)`);
