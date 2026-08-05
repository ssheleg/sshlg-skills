#!/usr/bin/env node
'use strict';
// Fixtures for lib/routers.js. The whole point of this module is that it
// never touches disk, so every rule protecting the operator's file is proven
// here, before any code exists that could write one.

const assert = require('assert');
const R = require('../lib/routers.js');

let checks = 0;
const failures = [];

function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const B = '<!-- SSHLG:ROUTERS:BEGIN — managed by sshlg-skills; delete this block to opt out -->';
const E = '<!-- SSHLG:ROUTERS:END -->';

const wellFormed = [
  '# My notes',
  '',
  'Some prose I wrote myself.',
  '',
  B,
  '## Роутинг работы — семья ssheleg',
  '',
  '<!-- SSHLG:ROUTER:super-ux:BEGIN -->',
  'super-ux body line one',
  'super-ux body line two',
  '<!-- SSHLG:ROUTER:super-ux:END -->',
  '',
  '<!-- SSHLG:ROUTER:copywriting:BEGIN -->',
  'copywriting body',
  '<!-- SSHLG:ROUTER:copywriting:END -->',
  '',
  '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
  '| a | b |',
  '<!-- SSHLG:ROUTERS:TABLE:END -->',
  E,
  '',
  'Trailing prose that must survive.',
  ''
].join('\n');

it('a file with no block is absent, not broken', () => {
  const r = R.parse('# Just my notes\n\nnothing here\n');
  assert.strictEqual(r.state, 'absent');
});

it('an opt-out marker outranks everything', () => {
  const r = R.parse('# notes\n\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  assert.strictEqual(r.state, 'opted-out');
});

it('an opt-out marker outranks even a present block', () => {
  const r = R.parse(wellFormed + '\n<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  assert.strictEqual(r.state, 'opted-out');
});

it('END before BEGIN is malformed, and malformed is never repaired', () => {
  const r = R.parse(`# notes\n\n${E}\nstuff\n${B}\n`);
  assert.strictEqual(r.state, 'malformed');
});

it('a second BEGIN is malformed', () => {
  const r = R.parse(`${B}\n${B}\n${E}\n`);
  assert.strictEqual(r.state, 'malformed');
});

it('a well-formed block parses its sections in order', () => {
  const r = R.parse(wellFormed);
  assert.strictEqual(r.state, 'present');
  assert.deepStrictEqual(r.sections.map(s => s.name), ['super-ux', 'copywriting']);
  assert.strictEqual(r.sections[0].body, 'super-ux body line one\nsuper-ux body line two');
});

it('round-trip reproduces the input byte for byte', () => {
  const r = R.parse(wellFormed);
  assert.strictEqual(r.before + R.render(r) + r.after, wellFormed);
});

it('prose outside the block is captured, not swallowed', () => {
  const r = R.parse(wellFormed);
  assert.ok(r.before.includes('Some prose I wrote myself.'));
  assert.ok(r.after.includes('Trailing prose that must survive.'));
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
