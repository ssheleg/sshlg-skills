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


// ---- task 2: upsert one section, leave every other byte alone ----

it('upserting one section leaves the other byte-identical', () => {
  const before = R.parse(wellFormed);
  const other = before.sections.find(s => s.name === 'copywriting').raw;
  const out = R.upsert(wellFormed, { 'super-ux': 'REPLACED BODY' });
  const after = R.parse(out.text);
  assert.strictEqual(after.sections.find(s => s.name === 'copywriting').raw, other);
  assert.strictEqual(after.sections.find(s => s.name === 'super-ux').body, 'REPLACED BODY');
});

it('prose above and below the block survives an upsert byte for byte', () => {
  const original = R.parse(wellFormed);
  const out = R.upsert(wellFormed, { 'super-ux': 'REPLACED BODY' });
  const after = R.parse(out.text);
  assert.strictEqual(after.before, original.before);
  assert.strictEqual(after.after, original.after);
});

it('an unknown router lands inside the block, before the table', () => {
  const out = R.upsert(wellFormed, { 'task-pipeline': 'new body' });
  // Containment, not position. Asserting only that the section precedes the
  // table stays true even when the section has been written outside the fence
  // entirely -- which is exactly the bug this fixture failed to catch once.
  const parsed = R.parse(out.text);
  assert.ok(parsed.sections.map(s => s.name).includes('task-pipeline'));
  const idxSection = out.text.indexOf('SSHLG:ROUTER:task-pipeline:BEGIN');
  const idxTable = out.text.indexOf('SSHLG:ROUTERS:TABLE:BEGIN');
  const idxBegin = out.text.indexOf('SSHLG:ROUTERS:BEGIN');
  assert.ok(idxBegin < idxSection && idxSection < idxTable);
});

it('a section added to an empty block is inside it, not before it', () => {
  const empty = [B, '## Роутинг', '', '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
    '<!-- SSHLG:ROUTERS:TABLE:END -->', E, ''].join('\n');
  const out = R.upsert(empty, { 'super-ux': 'body' });
  const parsed = R.parse(out.text);
  assert.deepStrictEqual(parsed.sections.map(s => s.name), ['super-ux']);
  assert.strictEqual(parsed.before, '');
});

it('upserting nothing changes nothing', () => {
  const out = R.upsert(wellFormed, {});
  assert.strictEqual(out.changed, false);
  assert.strictEqual(out.text, wellFormed);
});

it('an opted-out file is never written to', () => {
  const src = wellFormed + '\n<!-- SSHLG:ROUTERS:OPTOUT -->\n';
  const out = R.upsert(src, { 'super-ux': 'nope' });
  assert.strictEqual(out.changed, false);
  assert.strictEqual(out.text, src);
});

it('a malformed block is reported, never repaired', () => {
  const src = `# notes\n\n${E}\nstuff\n${B}\n`;
  const out = R.upsert(src, { 'super-ux': 'nope' });
  assert.strictEqual(out.changed, false);
  assert.strictEqual(out.state, 'malformed');
  assert.strictEqual(out.text, src);
});


// ---- task 3: the table describes what is actually present ----

it('one section renders a one-row table', () => {
  const minimal = [B, '## Роутинг', '',
    '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->', '<!-- SSHLG:ROUTERS:TABLE:END -->', E, ''].join('\n');
  const out = R.upsert(minimal, { 'super-ux': 'body' });
  const rows = out.text.split('\n').filter(l => l.startsWith('| `'));
  assert.strictEqual(rows.length, 1);
  assert.ok(rows[0].includes('super-ux'));
});

it('three sections render three rows in the fixed order', () => {
  const minimal = [B, '## Роутинг', '',
    '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->', '<!-- SSHLG:ROUTERS:TABLE:END -->', E, ''].join('\n');
  const out = R.upsert(minimal, {
    'task-pipeline': 'c', 'copywriting': 'b', 'super-ux': 'a',
  });
  const rows = out.text.split('\n').filter(l => l.startsWith('| `'));
  assert.deepStrictEqual(
    rows.map(r => r.split('`')[1]),
    ['super-ux', 'copywriting', 'task-pipeline']
  );
});

it('the table drops a row when its section is gone', () => {
  const two = R.upsert(
    [B, '## Роутинг', '', '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
     '<!-- SSHLG:ROUTERS:TABLE:END -->', E, ''].join('\n'),
    { 'super-ux': 'a', 'copywriting': 'b' }
  ).text;
  const stripped = two.replace(
    /<!-- SSHLG:ROUTER:copywriting:BEGIN -->[\s\S]*?<!-- SSHLG:ROUTER:copywriting:END -->/,
    ''
  );
  const out = R.upsert(stripped, { 'super-ux': 'a2' });
  const rows = out.text.split('\n').filter(l => l.startsWith('| `'));
  assert.strictEqual(rows.length, 1);
  assert.ok(!out.text.includes('SSHLG:ROUTER:copywriting'));
});


// ---- task 4: idempotence, and a diff that shows what would change ----

it('a second identical upsert changes nothing', () => {
  const once = R.upsert(wellFormed, { 'super-ux': 'stable body' });
  assert.strictEqual(once.changed, true);
  const twice = R.upsert(once.text, { 'super-ux': 'stable body' });
  assert.strictEqual(twice.changed, false);
  assert.strictEqual(twice.text, once.text);
});

it('idempotence survives a third pass', () => {
  let cur = wellFormed;
  for (let i = 0; i < 3; i += 1) cur = R.upsert(cur, { 'super-ux': 'x' }).text;
  assert.strictEqual(R.upsert(cur, { 'super-ux': 'x' }).changed, false);
});

it('diff of identical text is empty', () => {
  assert.strictEqual(R.diff(wellFormed, wellFormed), '');
});

it('diff names the lines that would change, with markers', () => {
  const out = R.upsert(wellFormed, { 'super-ux': 'NEW BODY' });
  const d = R.diff(wellFormed, out.text);
  assert.ok(d.includes('-super-ux body line one'));
  assert.ok(d.includes('+NEW BODY'));
});

it('a one-newline difference is still a difference', () => {
  assert.notStrictEqual(R.diff('a\n', 'a\n\n'), '');
});

// --- removal -------------------------------------------------------------
//
// A setting that cannot take a section back out is not a switch. These watch
// the property that makes removal safe to run against a file nobody versions:
// only newlines are ever dropped alongside the section.

it('removing a section takes it out and hands back its body', () => {
  const out = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  assert.ok(!out.text.includes('SSHLG:ROUTER:copywriting:BEGIN'), 'section survived');
  assert.strictEqual(out.removed.copywriting, 'copywriting body');
  assert.strictEqual(out.changed, true);
});

it('removing one section leaves the other byte for byte', () => {
  const out = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  const kept = [
    '<!-- SSHLG:ROUTER:super-ux:BEGIN -->',
    'super-ux body line one',
    'super-ux body line two',
    '<!-- SSHLG:ROUTER:super-ux:END -->',
  ].join('\n');
  assert.ok(out.text.includes(kept), 'the surviving section was reformatted');
});

it('removal loses the row from the table, by the same mechanism as a hand deletion', () => {
  const src = R.upsert(wellFormed, {
    'super-ux': 'a', copywriting: 'b', 'task-pipeline': 'c',
  }).text;
  assert.ok(src.includes('| `copywriting` |'), 'precondition: three rows');
  const out = R.upsert(src, {}, { remove: ['copywriting'] });
  assert.ok(!out.text.includes('| `copywriting` |'), 'the row outlived its section');
  assert.ok(out.text.includes('| `super-ux` |') && out.text.includes('| `task-pipeline` |'));
});

it('prose above and below the block survives a removal byte for byte', () => {
  const out = R.upsert(wellFormed, {}, { remove: ['super-ux'] });
  assert.ok(out.text.startsWith('# My notes\n\nSome prose I wrote myself.\n\n'));
  assert.ok(out.text.endsWith('\nTrailing prose that must survive.\n'));
});

it('removal never eats a byte that is not a newline', () => {
  const out = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  // The heading and the table markers are chrome adjacent to the removed
  // section; a greedy separator rule would take them with it.
  assert.ok(out.text.includes('## Роутинг работы — семья ssheleg'));
  assert.ok(out.text.includes('<!-- SSHLG:ROUTERS:TABLE:BEGIN -->'));
  assert.ok(out.text.includes('<!-- SSHLG:ROUTERS:TABLE:END -->'));
});

it('removal does not open a widening gap', () => {
  const out = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  assert.ok(!/\n{4,}/.test(out.text), 'three or more blank lines left behind');
});

it('removing what is not there changes nothing', () => {
  // Against a settled block, not `wellFormed`: that fixture carries a
  // placeholder table, so ANY write regenerates it and reports a change —
  // correctly. The property under test is about removal, so the table has to
  // already be what it will be.
  const settled = R.upsert(wellFormed, { 'super-ux': 'a', copywriting: 'b' }).text;
  const out = R.upsert(settled, {}, { remove: ['never-installed'] });
  assert.strictEqual(out.changed, false);
  assert.strictEqual(out.text, settled);
  assert.deepStrictEqual(out.removed, {});
});

it('removing twice is idempotent', () => {
  const once = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  const twice = R.upsert(once.text, {}, { remove: ['copywriting'] });
  assert.strictEqual(twice.changed, false);
  assert.strictEqual(twice.text, once.text);
});

it('removing the last section leaves a well-formed, empty block', () => {
  let t = R.upsert(wellFormed, {}, { remove: ['copywriting'] }).text;
  t = R.upsert(t, {}, { remove: ['super-ux'] }).text;
  const parsed = R.parse(t);
  assert.strictEqual(parsed.state, 'present');
  assert.strictEqual(parsed.sections.length, 0);
  assert.ok(t.includes('<!-- SSHLG:ROUTERS:TABLE:BEGIN -->\n<!-- SSHLG:ROUTERS:TABLE:END -->'));
});

it('a removed section can be written back, and the block round-trips', () => {
  const gone = R.upsert(wellFormed, {}, { remove: ['copywriting'] });
  const back = R.upsert(gone.text, { copywriting: gone.removed.copywriting });
  assert.strictEqual(R.parse(back.text).sections.length, 2);
  assert.ok(back.text.includes('copywriting body'));
});

it('an opted-out file is not removed from either', () => {
  const out = R.upsert('<!-- SSHLG:ROUTERS:OPTOUT -->\n', {}, { remove: ['super-ux'] });
  assert.strictEqual(out.state, 'opted-out');
  assert.strictEqual(out.changed, false);
});

it('write and remove in one pass do not fight over indices', () => {
  const out = R.upsert(
    wellFormed,
    { 'task-pipeline': 'brand new body' },
    { remove: ['super-ux'] }
  );
  assert.ok(out.text.includes('brand new body'));
  assert.ok(!out.text.includes('SSHLG:ROUTER:super-ux:BEGIN'));
  assert.strictEqual(R.parse(out.text).sections.length, 2);
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
