#!/usr/bin/env node
'use strict';
// Fixtures for `node test/run.js --ratchets-from FILE` — DOCMAP's stated figures judged
// against counts a full run wrote (`SSHLG_RATCHETS_OUT`), without running a suite.
//
// CI's plant of a stale Ratchets sentence re-ran the whole gate to watch one comparison
// refuse, a minute per run (B-164). It now reuses the Tests step's counts, so this flag
// carries a guard: it must refuse what a full run refuses and nothing it accepts, and a
// counts file that is missing or empty must refuse rather than compare against nothing.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RUN = path.join(__dirname, 'run.js');
const DOCMAP = fs.readFileSync(path.join(__dirname, '..', 'docs', 'DOCMAP.md'), 'utf8');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchets-from-'));
function judge(content) {
  const file = path.join(tmp, `counts-${checks}.json`);
  if (content !== undefined) fs.writeFileSync(file, content);
  const r = spawnSync(process.execPath, [RUN, '--ratchets-from', file], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

// The figures as DOCMAP states them — what a run that agrees with it would have written.
const m = /<!--\s*ratchets:\s*suites=(\d+)\s+fixtures=(\d+)\s+members=(\d+)/.exec(DOCMAP);
const stated = m && { suites: Number(m[1]), fixtures: Number(m[2]), members: Number(m[3]) };

it('DOCMAP carries the marker this suite reads', () => {
  assert.ok(stated, 'no `<!-- ratchets: suites=N fixtures=M members=K` marker in docs/DOCMAP.md');
});

it('counts that match the marker and the sentence pass', () => {
  const r = judge(JSON.stringify(stated));
  assert.strictEqual(r.status, 0, r.out);
  assert.match(r.out, /PASS: DOCMAP's stated figures match/);
});

it('a fixture count one off is refused, naming the figure', () => {
  const r = judge(JSON.stringify({ ...stated, fixtures: stated.fixtures + 1 }));
  assert.strictEqual(r.status, 1, r.out);
  assert.match(r.out, new RegExp(`states fixtures=${stated.fixtures}, this run counted ${stated.fixtures + 1}`));
});

it('a suite count one off is refused', () => {
  const r = judge(JSON.stringify({ ...stated, suites: stated.suites - 1 }));
  assert.strictEqual(r.status, 1, r.out);
  assert.match(r.out, /states suites=/);
});

it('a missing counts file is refused, not compared against nothing', () => {
  const r = judge(undefined);
  assert.strictEqual(r.status, 1, r.out);
  assert.match(r.out, /could not read counts/);
});

it('a counts file without positive figures is refused', () => {
  for (const bad of ['{}', '{"suites":0,"fixtures":0,"members":0}', 'not json']) {
    const r = judge(bad);
    assert.strictEqual(r.status, 1, `${bad}: ${r.out}`);
  }
});

it('it runs no suite', () => {
  const r = judge(JSON.stringify(stated));
  assert.doesNotMatch(r.out, /== structural validator ==|== .*_test\.(js|py) ==/);
});

fs.rmSync(tmp, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
