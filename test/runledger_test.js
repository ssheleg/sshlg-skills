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
  assert.ok(L.render(LEDGER, { stageIds: [0, 1, 2, 3, 4, 5] }).includes('gates 3/6'),
    L.render(LEDGER, { stageIds: [0, 1, 2, 3, 4, 5] }));
});

it('the live stage is named with its gate type', () => {
  const line = L.render(LEDGER);
  assert.ok(line.includes('▶ 3 Spec manual'), line);
});

// --- the denominator, which was the defect --------------------------------

it('THE DEFECT: a fraction is never built from the ledger\'s own line count', () => {
  // Shipped in v0.41.0 and v0.42.0: both numbers came from how many `stage:` lines
  // the ledger happened to hold, so a run at stage 4 of ten printed `gates 5/5` —
  // which reads at a glance as finished. `progress.md` names this exact failure.
  const mid = [
    'stage: 0 intake — gate manual — verdict pass — 2026-08-13T01:00:00Z',
    'stage: 1 docs — gate auto — verdict pass — 2026-08-13T01:05:00Z',
    'stage: 2 brainstorm — gate auto — verdict pass — 2026-08-13T01:10:00Z',
    'stage: 3 spec — gate auto — verdict pass — 2026-08-13T01:15:00Z',
    'stage: 4 plan — gate auto — verdict pass — 2026-08-13T01:20:00Z',
  ].join('\n');
  const line = L.render(mid);
  assert.ok(!/gates 5\/5/.test(line), `the false success is back: ${line}`);
  assert.ok(!/\b100%/.test(line), `a run at stage 4 of ten reported complete: ${line}`);
  assert.ok(/5 gates passed/.test(line),
    `with no stage list the honest rendering is a count, not a fraction: ${line}`);
});

it('the example flow\'s eleven are NOT a fallback', () => {
  // A host project replaces the stage list; guessing it reproduces the defect with
  // a different number, which is worse because it looks authoritative.
  const line = L.render('stage: 0 intake — gate manual — verdict pass — 2026-08-13T01:00:00Z');
  assert.ok(!/\/11\b/.test(line), `a stage list was invented: ${line}`);
  assert.strictEqual(L.percent(L.parse('stage: 0 x — gate auto — verdict pass — x'), null), null);
});

it('with the project\'s stage list, the fraction and the percent appear', () => {
  const line = L.render(LEDGER, { stageIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
  assert.ok(/gates 3\/11/.test(line), line);
  assert.ok(/27%/.test(line), line);
});

// --- the rail --------------------------------------------------------------

it('every glyph is derived from a recorded verdict, and they differ', () => {
  const r = L.rail(L.parse(LEDGER), [0, 1, 2, 3, 4]);
  assert.ok(r.includes('3' + L.GLYPH.fail), `a failed gate is not marked as failed: ${r}`);
  assert.ok(r.includes('4' + L.GLYPH.absent), `an unentered stage is not marked absent: ${r}`);
  assert.notStrictEqual(L.GLYPH.skip, L.GLYPH.absent,
    'a skipped stage and an unentered one render alike — they mean opposite things');
  assert.notStrictEqual(L.GLYPH.fail, L.GLYPH.pass);
});

it('without a stage list the rail claims nothing about what remains', () => {
  const r = L.rail(L.parse(LEDGER), null);
  assert.ok(!r.includes(L.GLYPH.absent), `positions were invented: ${r}`);
});

// --- the moment a person is actually needed --------------------------------

it('a manual gate with no verdict is the run waiting on the operator', () => {
  assert.strictEqual(L.awaitingOperator(L.parse(
    'stage: 7 deploy — gate manual — 2026-08-13T01:00:00Z')), true);
  assert.strictEqual(L.awaitingOperator(L.parse(
    'stage: 7 deploy — gate manual — verdict pass — 2026-08-13T01:00:00Z')), false);
  assert.strictEqual(L.awaitingOperator(L.parse(
    'stage: 5 build — gate auto — 2026-08-13T01:00:00Z')), false,
    'an auto gate does not wait for a person');
});

it('waiting on the operator is said in the line, not left to be inferred', () => {
  const line = L.render('stage: 7 deploy — gate manual — 2026-08-13T01:00:00Z');
  assert.ok(/waiting on you/.test(line), line);
});

// --- elapsed ---------------------------------------------------------------

it('elapsed takes its clock from the caller, so this module stays pure', () => {
  const from = '2026-08-13T01:00:00Z';
  assert.strictEqual(L.elapsed(from, Date.parse('2026-08-13T01:00:40Z')), '40s');
  assert.strictEqual(L.elapsed(from, Date.parse('2026-08-13T01:12:00Z')), '12m');
  assert.strictEqual(L.elapsed(from, Date.parse('2026-08-13T02:12:00Z')), '1h 12m');
  assert.strictEqual(L.elapsed(null, Date.now()), null);
  assert.strictEqual(L.elapsed(from, undefined), null, 'no clock is not a duration of zero');
});

// --- the printed block -----------------------------------------------------

it('the block is derived from the ledger, never from what anyone remembers', () => {
  const b = L.block(LEDGER, { stageIds: [0, 1, 2, 3, 4, 5], version: '1.50.0' });
  assert.ok(b.includes('v1.50.0'));
  assert.ok(b.includes(L.GLYPH.fail), 'the block hid a failed gate');
  assert.ok(b.includes('gates 3/6'), b);
  assert.ok(/[█░]/.test(b), 'no bar was drawn');
});

it('the block draws no bar when the total is unknown', () => {
  const b = L.block(LEDGER, {});
  assert.ok(!/[█░]/.test(b), `a bar was drawn with no denominator behind it: ${b}`);
  assert.ok(b.includes('3 gates passed'), b);
});

it('no run, no block', () => {
  assert.strictEqual(L.block('', {}), '');
  assert.strictEqual(L.block('iter: 1 — item B-01 — closed at gate 5', {}), '');
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
