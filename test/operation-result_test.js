#!/usr/bin/env node
'use strict';
/**
 * `lib/operation-result.js` — the plan/result contract under finding UP-02.
 *
 * The defect: `--dry-run` was accepted by the parser and `install`/`update`
 * executed subprocesses and deletions anyway. The contract pinned here is what
 * makes that structurally impossible to reintroduce quietly: a plan is
 * immutable and renderable without executing; a result is typed; statuses that
 * are not success never map to exit 0; a receipt cannot carry a secret.
 */
const assert = require('assert');
const opres = require('../lib/operation-result.js');

let passed = 0;
const failures = [];
function check(name, fn) {
  try { fn(); passed += 1; } catch (e) { failures.push(`${name}: ${e.message.split('\n')[0]}`); }
}

// ------------------------------------------------------------------- the plan

check('a step is frozen, deep', () => {
  const s = opres.step('subprocess', 'home', 'skills add x', { cmd: 'npx', args: ['a', 'b'] });
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.effect) && Object.isFrozen(s.effect.args));
  assert.throws(() => { s.effect.args.push('--force'); });
});

check('a plan is immutable and renders every step with scope and effect', () => {
  const plan = opres.buildPlan([
    opres.step('subprocess', 'home', 'skills add x', { cmd: 'npx', args: ['skills', 'add', 'x'] }),
    opres.step('prune', 'home', 'remove shadow', { paths: ['/tmp/claude/skills/x'] }),
    opres.step('router-block', 'home', 'refresh block', { mode: 'update' }),
    opres.step('runtime-sync', 'runtime', 'refresh runtime', { root: '/tmp/rt' }),
  ]);
  assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.steps));
  const out = opres.render(plan).join('\n');
  for (const needle of ['[home] subprocess', 'npx skills add x', '[home] prune',
    '/tmp/claude/skills/x', '[home] router-block', 'mode=update',
    '[runtime] runtime-sync', '/tmp/rt', '4 action(s), 0 executed']) {
    assert.ok(out.includes(needle), `render lost ${needle}: ${out}`);
  }
});

check('an empty prune step says so instead of hiding the action', () => {
  const plan = opres.buildPlan([opres.step('prune', 'home', 'remove shadows', { paths: [] })]);
  assert.ok(opres.render(plan).join('\n').includes('(no candidates at plan time)'));
});

check('a secret-shaped effect key is refused at construction', () => {
  for (const key of ['token', 'apiKey', 'authorization', 'GITHUB_TOKEN']) {
    assert.throws(() => opres.step('subprocess', 'home', 'x', { [key]: 'v' }),
      /names a secret/, `${key} was accepted into a receipt`);
  }
});

check('a non-string effect is refused — a receipt is rendered, not executed', () => {
  assert.throws(() => opres.step('subprocess', 'home', 'x', { args: [() => {}] }));
  assert.throws(() => opres.step('nonsense', 'home', 'x', {}), /unknown step kind/);
  assert.throws(() => opres.step('prune', 'attic', 'x', {}), /unknown step scope/);
});

// ----------------------------------------------------------------- the result

check('dry-run: a complete result with zero-mutation evidence and exit 0', () => {
  const r = opres.result({ scope: 'home', status: 'dry-run', evidence: '59 planned; 0 mutations' });
  assert.equal(r.errorClass, 'none');
  assert.equal(opres.exitCode(r), 0);
});

check('error: failed requires a remediation and exits nonzero', () => {
  assert.throws(() => opres.result({ scope: 'home', status: 'failed', errorClass: 'child' }),
    /remediation/);
  const r = opres.result({ scope: 'home', status: 'failed', errorClass: 'child',
    evidence: '2 of 59 failed', remediation: 're-run the two commands' });
  assert.equal(opres.exitCode(r), 1);
});

check('every non-success error class exits nonzero', () => {
  for (const errorClass of ['auth', 'network', 'parse', 'child']) {
    const r = opres.result({ scope: 'home', status: 'failed', errorClass,
      evidence: 'x', remediation: 'y' });
    assert.equal(opres.exitCode(r), 1, `${errorClass} mapped to exit 0`);
  }
});

check('unknown and unsupported never masquerade as success', () => {
  for (const status of ['unknown', 'unsupported']) {
    const r = opres.result({ scope: 'none', status, errorClass: status, evidence: 'could not tell' });
    assert.equal(opres.exitCode(r), 1, `${status} mapped to exit 0`);
  }
  assert.throws(() => opres.result({ scope: 'home', status: 'ok', errorClass: 'unknown' }),
    /cannot carry/);
});

check('partial: mixed success and failure, remediation carried through', () => {
  const agg = opres.aggregate([
    opres.result({ scope: 'home', status: 'ok' }),
    opres.result({ scope: 'home', status: 'failed', errorClass: 'network',
      evidence: 'registry unreachable', remediation: 'retry with network' }),
  ], 'home');
  assert.equal(agg.status, 'partial');
  assert.equal(agg.errorClass, 'network');
  assert.ok(agg.remediation.includes('retry with network'));
  assert.equal(opres.exitCode(agg), 1);
});

check('aggregate: all failed is failed; all dry-run is dry-run; all ok is ok', () => {
  const failed = opres.result({ scope: 'home', status: 'failed', errorClass: 'child',
    evidence: 'x', remediation: 'y' });
  assert.equal(opres.aggregate([failed, failed], 'home').status, 'failed');
  const dry = opres.result({ scope: 'home', status: 'dry-run' });
  assert.equal(opres.aggregate([dry, dry], 'home').status, 'dry-run');
  const ok = opres.result({ scope: 'home', status: 'ok' });
  assert.equal(opres.aggregate([ok, ok], 'home').status, 'ok');
});

check('aggregate: one dark step keeps the whole answer honest', () => {
  const agg = opres.aggregate([
    opres.result({ scope: 'home', status: 'ok' }),
    opres.result({ scope: 'home', status: 'unknown', errorClass: 'unknown',
      evidence: 'agent list unreadable' }),
  ], 'home');
  assert.equal(agg.status, 'unknown');
  assert.equal(opres.exitCode(agg), 1);
});

check('aggregate of nothing is unknown, not ok', () => {
  const agg = opres.aggregate([], 'none');
  assert.equal(agg.status, 'unknown');
  assert.equal(opres.exitCode(agg), 1);
});

check('results are frozen and carry no secret fields', () => {
  const r = opres.result({ scope: 'home', status: 'ok', evidence: 'done' });
  assert.ok(Object.isFrozen(r));
  assert.deepEqual(Object.keys(r).sort(),
    ['errorClass', 'evidence', 'remediation', 'scope', 'status']);
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`PASS: operation plan/result contract — ${passed} cases`);
