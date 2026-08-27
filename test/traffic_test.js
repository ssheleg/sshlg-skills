#!/usr/bin/env node
'use strict';
// Fixtures for scripts/traffic.js — the family's traffic, folded into one number.
//
// The behaviour worth gating is not the arithmetic. It is that the ledger REPEATS:
// GitHub serves a rolling fourteen-day window, so every run overlaps the last one, and
// a merge that appended instead of merging would multiply every figure it exists to
// preserve. That is this repository's own rule — prove idempotence at the layer that
// repeats, against a real file, not at a pure core with a passing round trip under it.
//
// The other half is honesty about what the numbers are: a repository that refused the
// call is reported, never counted as zero, because a silent zero and a quiet week are
// the same row.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const T = require('../scripts/traffic.js');
const data = require('../skills.json');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmp() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'traffic-')), 'traffic.ndjson');
}

const ROWS = [{
  repo: 'ssheleg/sshlg-skills',
  views: 3,
  viewUniques: 2,
  clones: 9,
  cloneUniques: 4,
  days: {
    views: [{ timestamp: '2026-08-20T00:00:00Z', count: 3, uniques: 2 }],
    clones: [{ timestamp: '2026-08-20T00:00:00Z', count: 9, uniques: 4 }],
  },
  referrers: [{ referrer: 'Google', count: 5, uniques: 2 }],
  paths: [],
}];

it('every repository the family ships is counted, and the list is derived', () => {
  // A member added to skills.json and missed by a hand-kept list here reports a family
  // total that is quietly short — which is the whole class of defect this repo hunts.
  for (const s of data.skills) {
    assert.ok(T.REPOS.includes(s.repo), `${s.repo} is in the family and not in the report`);
  }
  assert.ok(T.REPOS.includes(`${data.owner}/sshlg-skills`), 'the umbrella is not counted');
  assert.strictEqual(T.REPOS.length, data.skills.length + 1,
    'the repository list and the family have drifted apart');
  assert.strictEqual(new Set(T.REPOS).size, T.REPOS.length, 'a repository is counted twice');
});

it('a day is one row per repository, carrying both metrics', () => {
  const rows = T.daily(ROWS);
  assert.strictEqual(rows.length, 1, 'views and clones for one day split into two rows');
  assert.deepStrictEqual(rows[0], {
    repo: 'ssheleg/sshlg-skills',
    date: '2026-08-20',
    views: 3,
    viewUniques: 2,
    clones: 9,
    cloneUniques: 4,
  });
});

it('re-running the snapshot does not double the counts', () => {
  // The window overlaps itself on every run. This is the assertion the script exists
  // for: three merges of the same reading leave one row, not three.
  const file = tmp();
  const rows = T.daily(ROWS);
  const first = T.merge(file, rows);
  T.merge(file, rows);
  const third = T.merge(file, rows);
  assert.strictEqual(first.added, 1);
  assert.strictEqual(third.added, 0, 'a repeated reading was added again');
  assert.strictEqual(third.updated, 0, 'an identical reading was recorded as a correction');
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 1, `${lines.length} rows after three identical merges`);
});

it('a corrected reading of the same day replaces the earlier one', () => {
  // GitHub revises a partial day. Keeping the first reading would freeze it forever.
  const file = tmp();
  T.merge(file, T.daily(ROWS));
  const later = JSON.parse(JSON.stringify(ROWS));
  later[0].days.views[0].count = 11;
  const res = T.merge(file, T.daily(later));
  assert.strictEqual(res.added, 0, 'the corrected day was added as a new row');
  assert.strictEqual(res.updated, 1, 'the correction was not recorded');
  const rows = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(rows.length, 1, 'the day exists twice');
  assert.strictEqual(rows[0].views, 11, 'the stale reading won');
});

it('history already on disk survives a merge that does not mention it', () => {
  // The window only reaches back fourteen days; everything older is unrecoverable from
  // the source, so a merge that dropped unmentioned rows would destroy the only copy.
  const file = tmp();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    repo: 'ssheleg/super-ux', date: '2020-01-01', views: 7, viewUniques: 7, clones: 0, cloneUniques: 0,
  })}\n`);
  T.merge(file, T.daily(ROWS));
  const rows = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(rows.some((r) => r.date === '2020-01-01' && r.views === 7),
    'a row outside the window was dropped');
  assert.strictEqual(rows.length, 2);
});

it('a repository that refused is named, never counted as zero', () => {
  // A silent zero and a quiet week are the same row, and only one of them is true.
  const out = T.report([...ROWS, { repo: 'ssheleg/secret', error: 'HTTP 403: Forbidden' }]);
  assert.ok(/NOT READ/.test(out), 'a denied repository vanished from the report');
  assert.ok(/ssheleg\/secret/.test(out) && /403/.test(out), out);
  assert.ok(/FAMILY \(1 repos\)/.test(out),
    'the denied repository was folded into the family count');
});

it('the report says that summed uniques are not people', () => {
  // One person reading three packs counts three times. Printing the column without
  // saying so is how a number gets quoted as an audience size.
  const out = T.report(ROWS);
  assert.ok(/NOT additive/.test(out), 'the uniques caveat is missing from the report');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
