#!/usr/bin/env node
'use strict';
// Consent fixtures. HOME is a parameter, never process.env, so these run
// against a temp directory and can never touch the operator's real state.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const C = require('../lib/consent.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-consent-'));
}

it('a fresh home has no recorded answer', () => {
  assert.strictEqual(C.readState(tmpHome()).routers, undefined);
});

it('non-interactive stdin answers no, and says so once', () => {
  const home = tmpHome();
  const lines = [];
  const answer = C.askConsent({ home, interactive: false, log: (m) => lines.push(m) });
  assert.strictEqual(answer, 'no');
  assert.strictEqual(lines.length, 1);
  assert.ok(/не интеракт|non-interactive/i.test(lines[0]));
});

it('non-interactive never prompts', () => {
  const home = tmpHome();
  let prompted = false;
  C.askConsent({ home, interactive: false, prompt: () => { prompted = true; return 'y'; }, log: () => {} });
  assert.strictEqual(prompted, false);
});

it('a recorded answer is never asked again', () => {
  const home = tmpHome();
  C.writeState(home, { routers: 'no' });
  let prompted = false;
  const answer = C.askConsent({ home, interactive: true, prompt: () => { prompted = true; return 'y'; }, log: () => {} });
  assert.strictEqual(answer, 'no');
  assert.strictEqual(prompted, false);
});

it('an interactive yes is recorded', () => {
  const home = tmpHome();
  const answer = C.askConsent({ home, interactive: true, prompt: () => 'y', log: () => {} });
  assert.strictEqual(answer, 'yes');
  assert.strictEqual(C.readState(home).routers, 'yes');
});

it('anything that is not a yes is a no', () => {
  const home = tmpHome();
  assert.strictEqual(C.askConsent({ home, interactive: true, prompt: () => '', log: () => {} }), 'no');
});

it('the state file is not world-readable', () => {
  const home = tmpHome();
  C.writeState(home, { routers: 'yes' });
  const mode = fs.statSync(C.statePath(home)).mode & 0o777;
  assert.strictEqual(mode, 0o600);
});

it('writeState merges rather than replaces', () => {
  const home = tmpHome();
  C.writeState(home, { other: 1 });
  C.writeState(home, { routers: 'yes' });
  const s = C.readState(home);
  assert.strictEqual(s.other, 1);
  assert.strictEqual(s.routers, 'yes');
});

it('a corrupt state file is treated as empty, never as consent', () => {
  const home = tmpHome();
  fs.mkdirSync(path.dirname(C.statePath(home)), { recursive: true });
  fs.writeFileSync(C.statePath(home), '{not json');
  assert.deepStrictEqual(C.readState(home), {});
});

it('a dry run decides nothing and records nothing', () => {
  const home = tmpHome();
  const answer = C.askConsent({ home, interactive: false, persist: false, log: () => {} });
  assert.strictEqual(answer, 'no');
  assert.strictEqual(C.readState(home).routers, undefined,
    'a preview must not write a permanent refusal');
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
