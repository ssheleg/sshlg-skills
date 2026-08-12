#!/usr/bin/env node
'use strict';
// Fixtures for lib/runledger.js — the status line's reading of the run ledger.
//
// The three that matter are about NOT inventing:
//   - the iteration counter is a count of `iter:` lines, never a remembered number;
//   - a missing `holds:` line renders differently from a reported zero, because a
//     silent stage must not look like a clean one;
//   - no ledger renders as nothing, not as `0/0`.

const assert = require('assert');
const L = require('../lib/runledger.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const LEDGER = `# Run ledger

Run: \`pipeline-audit\` · started \`2026-08-12\` · module map: \`none\`

stage: 0 Intake — gate manual — verdict pass — 2026-08-12T09:00Z
stage: 1 Docs — gate auto — verdict pass — 2026-08-12T09:20Z
stage: 2 Brainstorm — gate auto — verdict pass — 2026-08-12T09:40Z
stage: 3 Spec — gate manual — verdict fail — 2026-08-12T10:00Z
iter:  1 — item B-023 — closed at gate 6
iter:  2 — item B-024 — closed at gate 6
iter:  3 — item B-025 — closed at gate 6
touch: test/validate.py — pass 2 (stage 7) — reason: F-014
holds: 3 — 2 (background shells: two node servers, run; worktrees: one, run) — enumerated 8/8 classes
`;

it('the iteration counter is a count of lines, not a parsed number', () => {
  assert.strictEqual(L.parse(LEDGER).iters, 3);
  // Renumbered lines must not change the count — the count is the lines.
  const renumbered = LEDGER.replace('iter:  2', 'iter:  99').replace('iter:  3', 'iter:  99');
  assert.strictEqual(L.parse(renumbered).iters, 3);
});

it('stage verdicts drive the gate count, and a fail does not count as passed', () => {
  const s = L.parse(LEDGER);
  assert.strictEqual(s.stages.length, 4);
  assert.strictEqual(s.stages.filter((x) => x.verdict === 'pass').length, 3);
  assert.ok(L.render(LEDGER).includes('gates 3/4'), L.render(LEDGER));
});

it('the live stage is the last one written, with its gate type', () => {
  const line = L.render(LEDGER);
  assert.ok(line.startsWith('▶ 3 Spec manual'), line);
});

it('a missing holds line reads as unreported, never as zero', () => {
  const without = LEDGER.split('\n').filter((l) => !l.startsWith('holds:')).join('\n');
  assert.ok(L.render(without).includes('holds —'), L.render(without));
  assert.ok(!L.render(without).includes('holds 0'),
    'an unreported holds line rendered as a clean zero — a silent stage now looks safe');
});

it('a reported "none" is different again from both', () => {
  const none = LEDGER.replace(/holds: .*/, 'holds: 3 — 0 (none) — enumerated 8/8 classes');
  const line = L.render(none);
  assert.ok(line.includes('holds none'), line);
});

it('no ledger content renders as nothing at all', () => {
  assert.strictEqual(L.render(''), '');
  assert.strictEqual(L.render(null), '');
  assert.strictEqual(L.render('# Run ledger\n\nRun: `x`\n'), '');
});

it('the hand-back trace is shown only when it disagrees with the iterations', () => {
  assert.ok(!/hand/.test(L.render(LEDGER)), 'shown while agreeing (it does not exist here yet)');
  const withHands = LEDGER + 'hand:  1|10 — task "x" — done 1 — surfaced 0 — decisions 0 — amb 0 (— no register)\n';
  assert.ok(/hand 1≠iter 3/.test(L.render(withHands)), L.render(withHands));
});

it('the topic is read from the Run: line', () => {
  assert.strictEqual(L.parse(LEDGER).topic, 'pipeline-audit');
});

it('touch lines are counted for churn, and omitted when there are none', () => {
  assert.strictEqual(L.parse(LEDGER).touches, 1);
  assert.ok(L.render(LEDGER).includes('touch 1'));
  const clean = LEDGER.split('\n').filter((l) => !l.startsWith('touch:')).join('\n');
  assert.ok(!/touch/.test(L.render(clean)), L.render(clean));
});

it('the line stays one line, whatever the ledger holds', () => {
  const long = LEDGER + Array.from({ length: 40 }, (_, i) =>
    `touch: file${i}.ts — pass 1 (stage 5) — reason: F-0${i}`).join('\n');
  const line = L.render(long);
  assert.ok(!line.includes('\n'), 'the status line wrapped — it would push the prompt around');
  assert.ok(line.length < 120, `status line is ${line.length} chars, too wide for a terminal strip`);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
