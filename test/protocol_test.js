#!/usr/bin/env node
'use strict';
// Fixtures for the PROTOCOL region of the routing block — how a task opens and closes.
//
// This region is doctrine written into a file the operator owns and did not write, which
// is this repository's whole risk profile. Three properties matter and each has cost
// something here before:
//
//   1. It ARRIVES on machines whose block predates it. The map shipped once with only a
//      refresh and every existing machine silently stayed on the old block.
//   2. It arrives ONCE. A region inserted rather than refreshed duplicates on every run,
//      and the file it duplicates into has no version control behind it.
//   3. Everything outside the sentinels survives byte for byte.

const assert = require('assert');

const R = require('../lib/routers.js');
const members = require('../skills.json').skills;

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const OUTSIDE_BEFORE = '# My own notes\n\nSomething I wrote by hand.\n\n';
const OUTSIDE_AFTER = '\n\n## Another section of mine\n\nAlso mine.\n';
const EMPTY = `${OUTSIDE_BEFORE}<!-- SSHLG:ROUTERS:BEGIN v=1 -->
## Роутинг работы — семья ssheleg
<!-- SSHLG:ROUTERS:TABLE:BEGIN -->
<!-- SSHLG:ROUTERS:TABLE:END -->
<!-- SSHLG:ROUTERS:END -->${OUTSIDE_AFTER}`;

const P_BEGIN = '<!-- SSHLG:ROUTERS:PROTOCOL:BEGIN -->';
const P_END = '<!-- SSHLG:ROUTERS:PROTOCOL:END -->';
const M_BEGIN = '<!-- SSHLG:ROUTERS:MAP:BEGIN -->';

function write(text) {
  return R.upsert(text, { 'task-pipeline': 'body' }, { members }).text;
}
function strip(text, name) {
  const b = text.indexOf(`<!-- SSHLG:ROUTERS:${name}:BEGIN -->`);
  const e = text.indexOf(`<!-- SSHLG:ROUTERS:${name}:END -->`);
  if (b === -1 || e === -1) return text;
  return text.slice(0, b) + text.slice(e + `<!-- SSHLG:ROUTERS:${name}:END -->`.length);
}
function count(text, needle) {
  return text.split(needle).length - 1;
}

it('a freshly written block carries the protocol, exactly once', () => {
  const out = write(EMPTY);
  assert.strictEqual(count(out, P_BEGIN), 1, `${count(out, P_BEGIN)} protocol regions`);
  assert.strictEqual(count(out, P_END), 1);
});

it('it reads after the map and before the routers', () => {
  // What you have, then how to open a task with it, then which route to take.
  const out = write(EMPTY);
  const at = (m) => out.indexOf(m);
  assert.ok(at(M_BEGIN) < at(P_BEGIN),
    'the protocol is printed before the roster it tells the agent to consult');
  assert.ok(at(P_BEGIN) < at('<!-- SSHLG:ROUTER:task-pipeline:BEGIN -->'),
    'a router section precedes the protocol');
  assert.ok(at(P_BEGIN) < at('<!-- SSHLG:ROUTERS:TABLE:BEGIN -->'));
});

it('it reaches a machine whose block predates it', () => {
  // The failure this exists to prevent: a refresh finds no sentinels, changes nothing,
  // reports success, and every installed machine stays on the old block forever.
  const old = strip(write(EMPTY), 'PROTOCOL');
  assert.ok(!old.includes(P_BEGIN), 'the fixture did not actually remove the region');
  const res = R.upsert(old, { 'task-pipeline': 'body' }, { members });
  assert.ok(res.changed, 'the upgrade reported no change');
  assert.strictEqual(count(res.text, P_BEGIN), 1);
  assert.ok(res.text.indexOf(M_BEGIN) < res.text.indexOf(P_BEGIN), 'inserted in the wrong place');
});

it('a block predating BOTH the map and the protocol gets both, in order', () => {
  const ancient = strip(strip(write(EMPTY), 'PROTOCOL'), 'MAP');
  const out = R.upsert(ancient, { 'task-pipeline': 'body' }, { members }).text;
  assert.strictEqual(count(out, M_BEGIN), 1, 'the map did not arrive');
  assert.strictEqual(count(out, P_BEGIN), 1, 'the protocol did not arrive');
  assert.ok(out.indexOf(M_BEGIN) < out.indexOf(P_BEGIN), 'the two arrived in the wrong order');
});

it('running it again does not add a second copy', () => {
  // The operator's file has no version control behind it, so a region that inserts
  // instead of refreshing grows a copy per run and nothing catches it.
  const once = write(EMPTY);
  const twice = write(once);
  const thrice = write(twice);
  assert.strictEqual(count(thrice, P_BEGIN), 1, `${count(thrice, P_BEGIN)} copies after three runs`);
  assert.strictEqual(twice, once, 'the second run changed the file');
  assert.strictEqual(thrice, once, 'the third run changed the file');
});

it('everything outside the sentinels survives byte for byte', () => {
  const out = write(EMPTY);
  assert.ok(out.startsWith(OUTSIDE_BEFORE), 'text above the block was altered');
  assert.ok(out.endsWith(OUTSIDE_AFTER), 'text below the block was altered');
});

it('the region names the command that measures, not a recollection', () => {
  // The whole point: WHICH skills are installed is a fact about one machine and cannot
  // ship inside a block written for every operator.
  const out = write(EMPTY);
  const body = out.slice(out.indexOf(P_BEGIN), out.indexOf(P_END));
  assert.ok(/npx sshlg-skills toolkit/.test(body), 'the protocol names no way to measure');
  assert.ok(/--for/.test(body), 'the task-scoped form is not shown');
});

it('it says to print the plan and NOT to wait for approval', () => {
  const body = write(EMPTY).match(/PROTOCOL:BEGIN -->([\s\S]*?)<!-- SSHLG:ROUTERS:PROTOCOL:END/)[1];
  assert.ok(/without waiting/.test(body), 'the no-approval rule is missing');
  assert.ok(/print the plan/i.test(body), 'the plan is not asked for');
});

it('it bounds the star ask to once per session', () => {
  // Repeated per task it becomes the line a reader learns to skip, which costs more than
  // the ask is worth — the same argument as a workflow that goes red every morning.
  const body = write(EMPTY).match(/PROTOCOL:BEGIN -->([\s\S]*?)<!-- SSHLG:ROUTERS:PROTOCOL:END/)[1];
  assert.ok(/once per session/.test(body), 'the star ask is unbounded');
  assert.ok(/never again/.test(body), 'nothing stops it repeating within the session');
});

it('it states no count of its own — the block ships to machines it cannot see', () => {
  // The first draft said "490 skills against the family's 28, where the text was written".
  // True of one machine, written into a file on every other. A number a document restates
  // is a number that describes the day it was typed; this one belongs to the command.
  const body = write(EMPTY).match(/PROTOCOL:BEGIN -->([\s\S]*?)<!-- SSHLG:ROUTERS:PROTOCOL:END/)[1];
  const prose = body.replace(/```bash[\s\S]*?```/g, '');
  const numbers = prose.match(/\b\d{2,}\b/g) || [];
  assert.deepStrictEqual(numbers, [],
    `the protocol states a machine-specific figure: ${numbers.join(', ')}`);
  assert.ok(/fact about YOUR machine/.test(body),
    'the region does not say why it refuses to state the number');
});

it('it carries a boundary and a refusal phrase, like every other rule in the block', () => {
  // A rule with no way to decline it is a rule an operator routes around silently.
  const body = write(EMPTY).match(/PROTOCOL:BEGIN -->([\s\S]*?)<!-- SSHLG:ROUTERS:PROTOCOL:END/)[1];
  assert.ok(/boundary/i.test(body), 'no boundary is stated');
  assert.ok(/NOT through this/.test(body), 'the boundary does not say what is excluded');
  assert.ok(/без инструментов/.test(body), 'no refusal phrase');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
