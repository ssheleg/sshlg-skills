#!/usr/bin/env node
'use strict';
// B-259: `lib/runtime-retired.js` lists, for every runtime module path the package
// once shipped and no longer does, the sha256 of each blob that path held in Git
// history. `lib/runtime.js` retires an unrecorded runtime file only on an exact match.
//
// The table is committed and this suite regenerates it from history: a module
// deleted without a table update fails here. Known-clean: the committed table equals
// the regeneration. Planted: a temporary repository that deletes a module yields
// exactly that module's blobs, and a module still present yields nothing.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const G = require('../scripts/retired-runtime.js');
const T = require('../lib/runtime-retired.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const git = (dir, args) => {
  const r = spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false'].concat(args), { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
};

it('planted: a module deleted from history yields every blob it held; a live one yields nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retired-'));
  try {
    git(dir, ['init', '-q']);
    fs.mkdirSync(path.join(dir, 'lib'));
    fs.mkdirSync(path.join(dir, 'hooks'));
    fs.writeFileSync(path.join(dir, 'lib', 'old.js'), '// v1\n');
    fs.writeFileSync(path.join(dir, 'lib', 'live.js'), '// live\n');
    fs.writeFileSync(path.join(dir, 'hooks', 'gone.js'), '// hook\n');
    git(dir, ['add', '-A']); git(dir, ['commit', '-qm', 'one']);
    fs.writeFileSync(path.join(dir, 'lib', 'old.js'), '// v2\n');
    git(dir, ['commit', '-qam', 'two']);
    fs.unlinkSync(path.join(dir, 'lib', 'old.js'));
    fs.unlinkSync(path.join(dir, 'hooks', 'gone.js'));
    git(dir, ['commit', '-qam', 'three']);
    const got = G.generate(dir);
    assert.deepStrictEqual(Object.keys(got), ['lib/old.js'], 'only retired lib modules are listed (hooks never retire)');
    assert.deepStrictEqual(got['lib/old.js'], [sha('// v1\n'), sha('// v2\n')].sort());
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

it('known-clean: the committed table equals the table regenerated from this history', () => {
  const shallow = spawnSync('git', ['-C', ROOT, 'rev-parse', '--is-shallow-repository'], { encoding: 'utf8' });
  if (String(shallow.stdout).trim() === 'true') throw new Error('shallow clone: the table cannot be regenerated here; fetch full history (CI uses fetch-depth: 0)');
  assert.deepStrictEqual(T.BLOBS, G.generate(ROOT), 'run `node scripts/retired-runtime.js --write` and commit lib/runtime-retired.js');
});

it('no listed path is a module the package still ships', () => {
  for (const rel of Object.keys(T.BLOBS)) assert.ok(!fs.existsSync(path.join(ROOT, rel)), `${rel} is still in the package`);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: runtime_retired — ${checks} cases`);
