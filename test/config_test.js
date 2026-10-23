#!/usr/bin/env node
'use strict';
// Fixtures for lib/config.js — the pack's settings.
//
// Two properties carry the whole feature. First, only DEVIATIONS are stored:
// a router absent from the file is on, so a new family member's router
// appears by itself instead of waiting to be switched on by hand. Second, a
// section switched off has its body stashed — migration moves the operator's
// own wording into the block, and a toggle round-trip that regenerated the
// packaged text would erase it silently, against a file with no version
// control behind it.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const C = require('../lib/config.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-config-'));
}

it('with no file at all, every router is on', () => {
  const home = tmpHome();
  const cfg = C.readConfig(home);
  assert.strictEqual(C.isEnabled(cfg, 'seo-llmo'), true);
  assert.strictEqual(C.isEnabled(cfg, 'anything-at-all'), true);
});

it('a file we cannot parse falls back to defaults rather than to "off"', () => {
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(C.configPath(home), '{ broken');
  assert.strictEqual(C.isEnabled(C.readConfig(home), 'copywriting'), true);
});

it('setRouter off is readable back as off', () => {
  const home = tmpHome();
  C.setRouter(home, 'seo-llmo', 'off');
  assert.strictEqual(C.isEnabled(C.readConfig(home), 'seo-llmo'), false);
});

it('only deviations are stored — "on" removes the key rather than writing it', () => {
  const home = tmpHome();
  C.setRouter(home, 'seo-llmo', 'off');
  C.setRouter(home, 'seo-llmo', 'on');
  const raw = JSON.parse(fs.readFileSync(C.configPath(home), 'utf8'));
  assert.ok(
    !raw.routers || !('seo-llmo' in raw.routers),
    'switching back on left a key behind; a future default change would not reach it'
  );
});

it('switching one router off leaves the others alone', () => {
  const home = tmpHome();
  C.setRouter(home, 'seo-llmo', 'off');
  C.setRouter(home, 'make-skill', 'off');
  const cfg = C.readConfig(home);
  assert.strictEqual(C.isEnabled(cfg, 'seo-llmo'), false);
  assert.strictEqual(C.isEnabled(cfg, 'make-skill'), false);
  assert.strictEqual(C.isEnabled(cfg, 'super-ux'), true);
});

it('the stash returns exactly the bytes it was given', () => {
  const home = tmpHome();
  const body = '**Правило.**\n\nМногострочное тело\nс *разметкой* и «кавычками».';
  C.stashSet(home, 'task-pipeline', body);
  assert.strictEqual(C.stashGet(C.readConfig(home), 'task-pipeline'), body);
});

it('clearing the stash removes it, and a missing entry is undefined not empty', () => {
  const home = tmpHome();
  C.stashSet(home, 'x', 'body');
  C.stashClear(home, 'x');
  assert.strictEqual(C.stashGet(C.readConfig(home), 'x'), undefined);
  assert.strictEqual(C.stashGet(C.readConfig(home), 'never-stashed'), undefined);
});

it('the settings file is 0600 — it records decisions about global instructions', () => {
  const home = tmpHome();
  C.setRouter(home, 'seo-llmo', 'off');
  assert.strictEqual(fs.statSync(C.configPath(home)).mode & 0o777, 0o600);
});

it('an unknown state is refused rather than guessed', () => {
  const home = tmpHome();
  assert.throws(() => C.setRouter(home, 'seo-llmo', 'maybe'), /on.*off|off.*on/);
});

// Final polish, item 3: the stash, `authored` and `routes.external` were read, rebuilt and
// written from a copy taken OUTSIDE config.json's lock, so parallel writers erased each
// other's keys (measured: 4 processes x 20 stashSet of distinct keys kept 20 of 80). Every
// sub-object write is now a function of the file at write time.
it('four processes x 20 stashSet of distinct keys keep all 80 (final polish 3)', () => {
  const home = tmpHome();
  const writer = path.join(home, 'w.js');
  fs.writeFileSync(writer, `const C = require(${JSON.stringify(path.join(__dirname, '..', 'lib', 'config.js'))});
const [home, id] = process.argv.slice(2);
for (let i = 0; i < 20; i += 1) C.stashSet(home, 'k' + id + '-' + i, 'v' + i);
`);
  const { spawnSync } = require('child_process');
  const cmd = [0, 1, 2, 3].map((i) => `node "${writer}" "${home}" ${i} &`).join(' ') + ' wait';
  spawnSync('sh', ['-c', cmd], { encoding: 'utf8' });
  const stash = C.readConfig(home).stash || {};
  assert.strictEqual(Object.keys(stash).length, 80, `parallel stashSet lost keys: kept ${Object.keys(stash).length} of 80`);
});

it('authored, external, router and auto-update writes merge into the file as it is at write time (final polish 3)', () => {
  const home = tmpHome();
  C.stashSet(home, 'a', 'A');
  C.authoredSet(home, 'r1', 'one');
  C.authoredSet(home, 'r2', 'two');
  C.externalSet(home, 'x', { triggers: ['t'] });
  C.externalSet(home, 'y', { triggers: ['u'] });
  C.setRouter(home, 'seo-llmo', 'off');
  C.setAutoUpdate(home, 'off');
  assert.strictEqual(C.authoredClear(home, 'r1'), 'one');
  assert.deepStrictEqual(C.externalClear(home, 'x'), { triggers: ['t'] });
  C.stashClear(home, 'a');
  const cfg = C.readConfig(home);
  assert.deepStrictEqual(cfg.authored, { r2: 'two' });
  assert.deepStrictEqual(cfg.routes, { external: { y: { triggers: ['u'] } } });
  assert.deepStrictEqual(cfg.routers, { 'seo-llmo': 'off' });
  assert.deepStrictEqual(cfg.update, { auto: 'off' });
  assert.deepStrictEqual(cfg.stash, {});
  assert.strictEqual(C.externalClear(home, 'y').triggers[0], 'u');
  assert.ok(!('routes' in C.readConfig(home)), 'an empty routes object was left behind');
  assert.strictEqual(C.authoredClear(home, 'never'), undefined);
});

it('B-180: rules.star is off by default, stored only as on, and leaves rules.wait alone', () => {
  const home = tmpHome();
  assert.strictEqual(C.starEnabled(C.readConfig(home)), false);
  C.setStar(home, 'on');
  assert.deepStrictEqual(C.readConfig(home).rules, { star: 'on' });
  assert.strictEqual(C.starEnabled(C.readConfig(home)), true);
  C.setStar(home, 'off');
  assert.ok(!('rules' in C.readConfig(home)), 'an empty rules object was left behind');
  const file = C.configPath(home);
  fs.writeFileSync(file, JSON.stringify({ rules: { wait: 'on' } }));
  C.setStar(home, 'on'); C.setStar(home, 'off');
  assert.deepStrictEqual(C.readConfig(home).rules, { wait: 'on' }, 'the wait rule was touched');
  assert.throws(() => C.setStar(home, 'maybe'), /on, off/);
});

it('no config.js writer merges a sub-object read outside the lock (final polish 3)', () => {
  const text = fs.readFileSync(path.join(__dirname, '..', 'lib', 'config.js'), 'utf8');
  const offenders = text.split('\n').map((l, i) => [l, i + 1])
    .filter(([l]) => /store\.writeJson\(configPath\(home\),\s*\{/.test(l)).map(([, n]) => `lib/config.js:${n}`);
  assert.deepStrictEqual(offenders, [], 'a config.json write is an object patch built from an earlier read');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
