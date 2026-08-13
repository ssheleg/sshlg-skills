#!/usr/bin/env node
'use strict';
/**
 * `npm test` — the structural validator, then every Node suite.
 *
 * Suites are DISCOVERED, never listed. A list would have to be kept in
 * `package.json` and in the CI workflow at once, and a suite added to one and
 * forgotten in the other reports green from a file nobody ran — which is the
 * same class of failure this repository keeps finding in its own history.
 *
 * `check_pins.py` is deliberately absent: it queries the npm registry, and
 * `npm test` has to work offline.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TEST_DIR = __dirname;
const ROOT = path.resolve(TEST_DIR, '..');

function run(label, cmd, args) {
  process.stdout.write(`\n== ${label} ==\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT });
  if (r.error) {
    process.stdout.write(`FAIL: ${label} — ${r.error.message}\n`);
    return false;
  }
  return r.status === 0;
}

const suites = fs
  .readdirSync(TEST_DIR)
  .filter((f) => f.endsWith('_test.js'))
  .sort();

if (!suites.length) {
  // An empty run is not a pass. A rename or a bad glob would otherwise turn
  // "no tests" into "all tests green".
  process.stdout.write('FAIL: no *_test.js suites found in test/\n');
  process.exit(1);
}

const failed = [];

if (!run('structural validator', 'python3', [path.join(TEST_DIR, 'validate.py')])) {
  failed.push('validate.py');
}
// Python, so the *_test.js discovery above cannot find it — and it has to run, because
// it is the check that decides whether a negative self-test's damage actually landed.
// Five hand-written copies of that check shipped five different bugs before it became
// a script; one of them reached a pull request.
if (!run('plant guard', 'python3', [path.join(TEST_DIR, 'plant_guard_test.py')])) {
  failed.push('plant_guard_test.py');
}
for (const suite of suites) {
  if (!run(suite, process.execPath, [path.join(TEST_DIR, suite)])) failed.push(suite);
}

process.stdout.write(`\n${'='.repeat(60)}\n`);
if (failed.length) {
  process.stdout.write(`FAIL: ${failed.length} of ${suites.length + 2} — ${failed.join(', ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: ${suites.length + 2} checks green (validate.py + plant_guard + ${suites.length} suites)\n`);
