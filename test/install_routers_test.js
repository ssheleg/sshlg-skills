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

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
