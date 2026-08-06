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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
