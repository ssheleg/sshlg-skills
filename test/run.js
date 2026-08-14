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

const entries = fs.readdirSync(TEST_DIR).sort();
const suites = entries.filter((f) => f.endsWith('_test.js'));
// Python suites are DISCOVERED too, not listed. `plant_guard_test.py` was named here by
// hand, and a second Python suite arriving on 2026-08-14 would have been a second hand-
// written line — which is invariant #4 of this repository's own house rules ("guard
// corpora are discovered, not listed"), broken in the file that runs the guards. Three
// hand-written lists in this family each missed a shipped surface, and none of the
// misses was found by the guard holding the list.
const pySuites = entries.filter((f) => f.endsWith('_test.py'));

if (!suites.length || !pySuites.length) {
  // An empty run is not a pass. A rename or a bad glob would otherwise turn
  // "no tests" into "all tests green".
  process.stdout.write(
    `FAIL: discovery found ${suites.length} *_test.js and ${pySuites.length} *_test.py in test/ — a side at zero is a glob that broke, not a suite that passed\n`
  );
  process.exit(1);
}

const failed = [];

if (!run('structural validator', 'python3', [path.join(TEST_DIR, 'validate.py')])) {
  failed.push('validate.py');
}
for (const suite of pySuites) {
  if (!run(suite, 'python3', [path.join(TEST_DIR, suite)])) failed.push(suite);
}
for (const suite of suites) {
  if (!run(suite, process.execPath, [path.join(TEST_DIR, suite)])) failed.push(suite);
}

process.stdout.write(`\n${'='.repeat(60)}\n`);
if (failed.length) {
  process.stdout.write(`FAIL: ${failed.length} of ${suites.length + pySuites.length + 1} — ${failed.join(', ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: ${suites.length + pySuites.length + 1} checks green (validate.py + ${pySuites.length} python + ${suites.length} node suites)\n`);
