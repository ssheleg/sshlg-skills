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
 *
 * It also COUNTS what it ran, and refuses a stated figure that has gone stale.
 * `docs/DOCMAP.md` carried "32 suites, 562 fixtures" beside its own sentence saying
 * the numbers are counted rather than carried; the recount on 2026-08-20 was 34 and
 * 602, and the conformance row correcting it (34/585) was itself 17 fixtures behind.
 * A ratchet nothing computes is a ratchet that only ever describes the past, so the
 * figures now live in a marker this runner reads and re-derives.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TEST_DIR = __dirname;
const ROOT = path.resolve(TEST_DIR, '..');

// Every count a suite prints, so the total is measured rather than remembered:
// `OK (n checks)` from the python side, `PASS: <name> — n cases` from the node side.
const COUNTS = [/\bOK \((\d+) checks?\)/g, /^PASS: [^\n]*?— (\d+)\b/gm];
let fixtures = 0;

function run(label, cmd, args) {
  process.stdout.write(`\n== ${label} ==\n`);
  // Captured rather than inherited, because the totals are read from what the suites
  // print. The output is written straight through, so a run still reads the same.
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  if (r.error) {
    process.stdout.write(`FAIL: ${label} — ${r.error.message}\n`);
    return false;
  }
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  process.stdout.write(out);
  for (const re of COUNTS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(out)) !== null) fixtures += Number(m[1]);
  }
  return r.status === 0;
}

/** The ratchet as `docs/DOCMAP.md` states it, or null when the marker is absent. */
function statedRatchets() {
  const file = path.join(ROOT, 'docs', 'DOCMAP.md');
  const m = /<!--\s*ratchets:\s*([^>]*?)-->/.exec(fs.readFileSync(file, 'utf8'));
  if (!m) return null;
  const out = {};
  for (const pair of m[1].trim().split(/\s+/)) {
    const [k, v] = pair.split('=');
    out[k] = Number(v);
  }
  return out;
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

// The ratchet, computed. A figure stated in DOCMAP that this run does not reproduce
// is a stale claim about the gate, reported here rather than in a re-read months
// later — and a figure that DROPPED is a suite that stopped running.
const suiteCount = suites.length + pySuites.length + 1;
const members = fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).length;
const stated = statedRatchets();
process.stdout.write(
  `COUNTED: ${suiteCount} suites, ${fixtures} fixtures, ${members} pinned members\n`);
if (stated) {
  const measured = { suites: suiteCount, fixtures, members };
  const wrong = Object.keys(measured).filter((k) => stated[k] !== undefined && stated[k] !== measured[k]);
  if (wrong.length) {
    for (const k of wrong) {
      const verb = stated[k] < measured[k] ? 'behind' : 'AHEAD OF';
      process.stdout.write(
        `FAIL: docs/DOCMAP.md states ${k}=${stated[k]}, this run counted ${measured[k]} — the stated figure is ${verb} the gate\n`);
    }
    process.stdout.write('  the marker is `<!-- ratchets: ... -->` beside the prose that quotes it\n');
    process.exit(1);
  }
} else {
  process.stdout.write(
    'FAIL: docs/DOCMAP.md carries no `<!-- ratchets: ... -->` marker, so its stated figures are unchecked\n');
  process.exit(1);
}
process.stdout.write(`PASS: ${suiteCount} checks green (validate.py + ${pySuites.length} python + ${suites.length} node suites)\n`);
