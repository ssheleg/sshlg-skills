#!/usr/bin/env node
'use strict';
// B-169 (a router that holds only on a machine with something installed outside the
// family) and B-170 (the block's heading in English, the Russian one an alias), as
// real `routers` runs against a sandbox HOME. Each case ends with three runs whose
// file hashes must be identical: a rule that changes the file on every run is one
// the operator learns to distrust.
//
// The machine is stated, never inherited from the runner: FABRIC_SERVICES_DIR points
// at a directory this file made, or at one that does not exist.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const R = require('../lib/routers.js');
const registry = require('../lib/routers-registry.js');
const configLib = require('../lib/config.js');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const made = [];
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-machine-')); made.push(d); return d; };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function run(home, args, env) {
  const r = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home }, env || {}),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function sandbox() {
  const home = tmp();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(path.join(home, '.sshlg-skills', 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  return home;
}
const NO_FABRIC = { FABRIC_SERVICES_DIR: path.join(os.tmpdir(), 'sshlg-no-fabric-' + process.pid) };
const hasFabric = (body) => body.includes('<!-- SSHLG:ROUTER:fabric:BEGIN -->');
const hasFabricRow = (body) => /^\| `fabric` \|/m.test(body);
const threeRuns = (home, file, env) => {
  const hashes = [];
  for (let i = 0; i < 3; i++) { run(home, ['routers', '--update'], env); hashes.push(sha(file)); }
  assert.ok(hashes[0] === hashes[1] && hashes[1] === hashes[2], `hashes ${hashes.map((h) => h.slice(0, 8)).join(' ')}`);
};

it('B-169: with Fabric installed the block carries the fabric rule and its row', () => {
  const home = sandbox();
  const services = tmp();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n');
  const r = run(home, ['routers'], { FABRIC_SERVICES_DIR: services });
  assert.strictEqual(r.code, 0, r.out);
  const body = fs.readFileSync(file, 'utf8');
  assert.ok(hasFabric(body) && hasFabricRow(body), 'no fabric section or row');
  assert.ok(!body.includes('working-in-passioncode'), 'the org-internal skill is still named');
  threeRuns(home, file, { FABRIC_SERVICES_DIR: services });
});

it('B-169: without Fabric a new block has no fabric rule', () => {
  const home = sandbox();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n');
  const r = run(home, ['routers'], NO_FABRIC);
  assert.strictEqual(r.code, 0, r.out);
  const body = fs.readFileSync(file, 'utf8');
  assert.ok(/SSHLG:ROUTERS:BEGIN/.test(body), 'no block written');
  assert.ok(!hasFabric(body) && !hasFabricRow(body), 'fabric written onto a machine without Fabric');
  threeRuns(home, file, NO_FABRIC);
});

it('B-169: a block 1.58.0 wrote onto a machine without Fabric loses the rule, its row and keeps no copy', () => {
  const home = sandbox();
  const services = tmp();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n\nKeep this.\n');
  run(home, ['routers'], { FABRIC_SERVICES_DIR: services }); // what 1.58.0 left everywhere
  assert.ok(hasFabric(fs.readFileSync(file, 'utf8')), 'fixture did not write the fabric section');
  const r = run(home, ['routers', '--update'], NO_FABRIC);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /fabric: not on this machine/);
  assert.doesNotMatch(r.out, /выключены настройкой/, 'reported as if the operator had switched it off');
  const body = fs.readFileSync(file, 'utf8');
  assert.ok(!hasFabric(body) && !hasFabricRow(body), 'fabric section or row survived');
  assert.ok(body.includes('Keep this.'), 'operator text outside the block changed');
  const stash = configLib.stashGet(configLib.readConfig(home), 'fabric');
  assert.strictEqual(stash, undefined, 'the packaged text was stashed and would come back instead of the current one');
  threeRuns(home, file, NO_FABRIC);
  // …and it comes back, current, the day Fabric is installed.
  run(home, ['routers', '--update'], { FABRIC_SERVICES_DIR: services });
  const back = fs.readFileSync(file, 'utf8');
  assert.ok(hasFabric(back) && hasFabricRow(back), 'fabric did not come back with Fabric');
  assert.ok(back.includes(registry.REGISTRY.fabric.text.split('\n')[0]), 'not the packaged text');
});

it('B-169: an operator\'s own wording of the fabric rule is kept when it leaves', () => {
  const home = sandbox();
  const services = tmp();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n');
  run(home, ['routers'], { FABRIC_SERVICES_DIR: services });
  const edited = fs.readFileSync(file, 'utf8').replace('Prefer the `fabric-dashboards` MCP', 'Always prefer the `fabric-dashboards` MCP');
  assert.ok(edited !== fs.readFileSync(file, 'utf8'), 'fixture edit did not apply');
  fs.writeFileSync(file, edited);
  run(home, ['routers', '--update'], NO_FABRIC);
  const stash = configLib.stashGet(configLib.readConfig(home), 'fabric');
  assert.ok(typeof stash === 'string' && stash.includes('Always prefer'), 'the operator\'s wording was dropped');
});

it('B-170: a block titled in Russian is retitled in English once, and three runs agree', () => {
  const home = sandbox();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n');
  run(home, ['routers'], NO_FABRIC);
  const legacy = fs.readFileSync(file, 'utf8').replace(R.HEADING, R.LEGACY_HEADINGS[0]);
  assert.ok(legacy.includes(R.LEGACY_HEADINGS[0]), 'fixture did not take the legacy heading');
  fs.writeFileSync(file, legacy);
  const r = run(home, ['routers', '--update'], NO_FABRIC);
  assert.strictEqual(r.code, 0, r.out);
  const body = fs.readFileSync(file, 'utf8');
  assert.ok(body.includes(R.HEADING), 'no English heading');
  assert.ok(!body.includes(R.LEGACY_HEADINGS[0]), 'the Russian heading is still there');
  assert.ok(/SSHLG:ROUTERS:END/.test(body), 'the block lost its end: migration ate it');
  assert.ok(body.startsWith('# mine\n'), 'operator text changed');
  threeRuns(home, file, NO_FABRIC);
});

it('B-170: migration takes neither heading for a hand-written rule', () => {
  const migrate = require('../lib/migrate.js');
  for (const heading of [R.HEADING, R.LEGACY_HEADINGS[0]]) {
    const block = [R.BEGIN + ' -->', heading, '', '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
      '<!-- SSHLG:ROUTERS:TABLE:END -->', R.END].join('\n');
    const text = `# mine\n\n${block}\n\n# After\n\nkeep\n`;
    const once = migrate.migrate(text, { fallbacks: {} });
    const twice = migrate.migrate(once.text, { fallbacks: {} });
    assert.strictEqual(once.text, text, `migration changed a block titled ${heading}`);
    assert.strictEqual(twice.text, text);
  }
});

// Everything this file made goes, pass or fail: the sandboxes hold nothing a reader needs.
for (const d of made) fs.rmSync(d, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
