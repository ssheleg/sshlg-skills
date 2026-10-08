#!/usr/bin/env node
'use strict';
// The first code that writes. Every fixture runs against a temp HOME, and
// most of them assert what the write did NOT do.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const A = require('../lib/apply.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
function home(withClaude) {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-apply-'));
  if (withClaude !== false) fs.mkdirSync(path.join(h, '.claude'), { recursive: true });
  return h;
}
const claudeMd = (h) => path.join(h, '.claude', 'CLAUDE.md');
const ROUTERS = { 'super-ux': 'ux body', 'copywriting': 'copy body' };

it('update never creates a block that is not there', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n\nprose\n');
  const r = A.apply({ home: h, mode: 'update', routers: ROUTERS, log: () => {} });
  assert.strictEqual(fs.readFileSync(claudeMd(h), 'utf8'), '# mine\n\nprose\n');
  assert.ok(r.targets.every(t => ['no-block', 'absent', 'agent-absent'].includes(t.action)));
});

it('update never creates the file either', () => {
  const h = home();
  A.apply({ home: h, mode: 'update', routers: ROUTERS, log: () => {} });
  assert.strictEqual(fs.existsSync(claudeMd(h)), false);
});

it('install with consent writes the block and keeps the prose', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n\nprose above\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.ok(out.startsWith('# mine\n\nprose above\n'));
  assert.ok(out.includes('SSHLG:ROUTER:super-ux:BEGIN'));
  assert.ok(out.includes('SSHLG:ROUTER:copywriting:BEGIN'));
});

it('install without consent writes no block', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.ok(!out.includes('SSHLG:ROUTER:super-ux'));
  assert.ok(out.startsWith('# mine\n'));
});

it('a second install refreshes the block and leaves the rest byte-identical', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n\nabove\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const first = fs.readFileSync(claudeMd(h), 'utf8');
  fs.appendFileSync(claudeMd(h), '\nprose the user added later\n');
  const withTail = fs.readFileSync(claudeMd(h), 'utf8');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const second = fs.readFileSync(claudeMd(h), 'utf8');
  assert.strictEqual(second, withTail);
  assert.ok(first.length > 0);
});

it('a target whose agent directory does not exist is skipped, not created', () => {
  const h = home(false);
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  assert.strictEqual(fs.existsSync(path.join(h, '.claude')), false);
  assert.strictEqual(fs.existsSync(path.join(h, '.codex')), false);
});

it('dry run reports the diff and writes nothing', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  const r = A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, dryRun: true, log: () => {} });
  assert.strictEqual(fs.readFileSync(claudeMd(h), 'utf8'), '# mine\n');
  assert.ok(r.targets.some(t => t.diff && t.diff.includes('+')));
});

it('an opted-out file stays opted out through install', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.ok(!out.includes('SSHLG:ROUTER:super-ux'));
});


// ---- task 7: a refusal leaves a marker that survives ----

it('declining writes the marker and no block', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.ok(out.includes('SSHLG:ROUTERS:OPTOUT'));
  assert.ok(!out.includes('SSHLG:ROUTER:super-ux'));
  assert.ok(out.startsWith('# mine\n'));
});

it('the marker makes every later install and update silent', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, log: () => {} });
  const afterDecline = fs.readFileSync(claudeMd(h), 'utf8');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  A.apply({ home: h, mode: 'update', routers: ROUTERS, log: () => {} });
  assert.strictEqual(fs.readFileSync(claudeMd(h), 'utf8'), afterDecline);
});

it('declining twice does not stack markers', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, log: () => {} });
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.strictEqual(out.split('SSHLG:ROUTERS:OPTOUT').length - 1, 1);
});

it('a dry-run decline writes no marker either', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'no', routers: ROUTERS, dryRun: true, log: () => {} });
  assert.strictEqual(fs.readFileSync(claudeMd(h), 'utf8'), '# mine\n');
});

it('the block names the marker as the way out', () => {
  const h = home();
  fs.writeFileSync(claudeMd(h), '# mine\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(claudeMd(h), 'utf8');
  assert.ok(out.includes('SSHLG:ROUTERS:OPTOUT'), 'the header must name the opt-out marker');
});


// ---- R-11: the second agent target, which had shipped untested ----

it('an existing codex home gets the block too', () => {
  const h = home();
  fs.mkdirSync(path.join(h, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(h, '.codex', 'AGENTS.md'), '# agents\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const out = fs.readFileSync(path.join(h, '.codex', 'AGENTS.md'), 'utf8');
  assert.ok(out.includes('SSHLG:ROUTER:super-ux:BEGIN'));
  assert.ok(out.startsWith('# agents\n'));
});

it('both agent targets are written in one pass', () => {
  const h = home();
  fs.mkdirSync(path.join(h, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(h, '.codex', 'AGENTS.md'), '# agents\n');
  fs.writeFileSync(claudeMd(h), '# claude\n');
  const r = A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  const written = r.targets.filter(t => t.action === 'updated' || t.action === 'created');
  assert.strictEqual(written.length, 2);
});

it('one agent opting out does not silence the other', () => {
  const h = home();
  fs.mkdirSync(path.join(h, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(h, '.codex', 'AGENTS.md'), '# agents\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  fs.writeFileSync(claudeMd(h), '# claude\n');
  A.apply({ home: h, mode: 'install', consent: 'yes', routers: ROUTERS, log: () => {} });
  assert.ok(!fs.readFileSync(path.join(h, '.codex', 'AGENTS.md'), 'utf8').includes('SSHLG:ROUTER:super-ux'));
  assert.ok(fs.readFileSync(claudeMd(h), 'utf8').includes('SSHLG:ROUTER:super-ux'));
});

// --- a release that ADDS routers, over an operator's own wording (REQ-07) -------------
//
// xr-dev and web3d-dev arrive as routers on a machine whose block was written before
// them, by the real command, three times. Retro #2: idempotence is proven at the layer
// that repeats, against a real file, by hash — and the operator's `authored` wording for
// an existing router must survive every one of the three runs.

it('`routers --update` adds the new routers, keeps authored wording, and is idempotent over three runs', () => {
  const crypto = require('crypto');
  const { spawnSync } = require('child_process');
  const registry = require('../lib/routers-registry.js');
  const h = home();
  try {
    const installed = require('../skills.json').skills.map((s) => s.name);
    const all = registry.resolve({ installed });
    const before = Object.assign({}, all);
    delete before['xr-dev'];
    delete before['web3d-dev'];
    fs.writeFileSync(claudeMd(h), '# mine\n\nprose the operator wrote\n');
    A.apply({ home: h, mode: 'install', consent: 'yes', routers: before, log: () => {} });
    const mine = '**My own super-ux rule.** Scenarios first, in my words.\n\n'
      + '**Refusal phrase: "no scenarios" or «без сценариев».**';
    fs.mkdirSync(path.join(h, '.sshlg-skills'), { recursive: true });
    fs.writeFileSync(path.join(h, '.sshlg-skills', 'config.json'),
      JSON.stringify({ authored: { 'super-ux': mine } }));
    // the authored body is what the block carries, as after a real migration
    const seeded = fs.readFileSync(claudeMd(h), 'utf8').replace(all['super-ux'].trim(), mine);
    fs.writeFileSync(claudeMd(h), seeded);
    assert.ok(!seeded.includes('SSHLG:ROUTER:xr-dev'), 'precondition: the old block has no xr-dev');

    const backups = path.join(h, '.sshlg-skills', 'backups');
    const countBackups = () => (fs.existsSync(backups) ? fs.readdirSync(backups).length : 0);
    const backupsBefore = countBackups();
    const seededHash = crypto.createHash('sha256').update(seeded).digest('hex');
    const hashes = [];
    let last = '';
    for (let i = 0; i < 3; i += 1) {
      const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'routers', '--update'],
        { encoding: 'utf8', env: Object.assign({}, process.env, { HOME: h }) });
      assert.strictEqual(r.status, 0, `run ${i + 1} exited ${r.status}:\n${r.stdout}${r.stderr}`);
      last = `${r.stdout}${r.stderr}`;
      hashes.push(crypto.createHash('sha256').update(fs.readFileSync(claudeMd(h))).digest('hex'));
    }
    const out = fs.readFileSync(claudeMd(h), 'utf8');
    assert.ok(out.includes('SSHLG:ROUTER:xr-dev:BEGIN'), 'xr-dev never arrived');
    assert.ok(out.includes('SSHLG:ROUTER:web3d-dev:BEGIN'), 'web3d-dev never arrived');
    assert.ok(out.includes('My own super-ux rule.'), 'the operator\'s authored wording was replaced');
    assert.ok(!out.includes(all['super-ux'].trim().split('\n')[0]), 'the packaged super-ux text came back');
    assert.ok(out.startsWith('# mine\n\nprose the operator wrote\n'), 'prose outside the block moved');
    assert.notStrictEqual(hashes[0], seededHash, 'the first run wrote nothing — the routers were never added');
    assert.strictEqual(hashes[1], hashes[0], 'the second run changed the file');
    assert.strictEqual(hashes[2], hashes[1], 'the third run changed the file');
    assert.ok(/расходится с пакетным — super-ux/.test(last), `the drift was not reported:\n${last}`);
    assert.ok(countBackups() > backupsBefore, 'the write that added the routers took no backup');
  } finally {
    fs.rmSync(h, { recursive: true, force: true });
  }
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
