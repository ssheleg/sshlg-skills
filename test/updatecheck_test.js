'use strict';
/**
 * The set-update notice: every decision, both polarities, no HOME and no socket.
 *
 * The impure half (read a file, spawn a process) lives in hooks/session-start.js
 * and is covered by test/hooks_e2e_test.js, which runs the real hook as a
 * process. This file owns the policy.
 */
const assert = require('assert');
const U = require('../lib/updatecheck.js');

let n = 0;
const it = (name, fn) => { fn(); n += 1; console.log(`  ok  ${name}`); };

it('a newer set is behind, an older one is ahead, the same one is current', () => {
  assert.strictEqual(U.compare('1.47.1', '1.48.0'), 'behind');
  assert.strictEqual(U.compare('1.47.1', '1.47.2'), 'behind');
  assert.strictEqual(U.compare('1.47.1', '2.0.0'), 'behind');
  assert.strictEqual(U.compare('1.47.1', '1.47.1'), 'current');
  assert.strictEqual(U.compare('1.48.0', '1.47.1'), 'ahead');
});

it('a version that does not parse is UNKNOWN, never current', () => {
  // The false green this family refuses everywhere else: reporting "up to date"
  // from a string nothing compared.
  for (const bad of ['', null, undefined, 'latest', 'v1.2', '1.2', {}, 'nope']) {
    assert.strictEqual(U.compare('1.47.1', bad), 'unknown', `latest=${String(bad)}`);
    assert.strictEqual(U.compare(bad, '1.47.1'), 'unknown', `installed=${String(bad)}`);
  }
});

it('only `behind` produces a line, and it names BOTH versions', () => {
  const l = U.line('1.47.1', '1.48.0');
  assert.ok(l.includes('1.48.0') && l.includes('1.47.1'),
    'a notice that omits what you have makes the reader go and find out');
  assert.ok(l.includes('npx sshlg-skills@latest update'), 'the notice does not carry the command');
  assert.ok(l.includes('move together'), 'the notice does not say why it is one command');
  assert.strictEqual(U.line('1.47.1', '1.47.1'), '');
  assert.strictEqual(U.line('1.48.0', '1.47.1'), '');
  assert.strictEqual(U.line('1.47.1', ''), '');
});

it('the line is ONE line — the hook budget is ~90 tokens', () => {
  assert.strictEqual(U.line('1.47.1', '1.48.0').split('\n').length, 1);
});

it('a missing or unreadable stamp means never checked, which is a reason TO check', () => {
  const now = 1_000_000_000;
  for (const bad of [undefined, null, 0, -5, 'soon', NaN]) {
    assert.strictEqual(U.shouldProbe(bad, now), true, `stamp=${String(bad)}`);
  }
});

it('a fresh stamp does not probe, a stale one does', () => {
  const now = 1_000_000_000;
  assert.strictEqual(U.shouldProbe(now - 1000, now), false);
  assert.strictEqual(U.shouldProbe(now - U.CHECK_INTERVAL_MS, now), true);
  assert.strictEqual(U.shouldProbe(now - U.CHECK_INTERVAL_MS - 1, now), true);
});

it('a stamp in the FUTURE re-checks rather than backing off forever', () => {
  // A clock that moved backwards would otherwise park the check permanently.
  const now = 1_000_000_000;
  assert.strictEqual(U.shouldProbe(now + U.CHECK_INTERVAL_MS * 10, now), true);
});

it('plan() decides both halves so the hook holds no policy', () => {
  const now = 1_000_000_000;
  const behind = U.plan('1.47.1', { at: now - 10, latest: '1.48.0' }, now);
  assert.ok(behind.line && behind.probe === false);
  const stale = U.plan('1.47.1', { at: now - U.CHECK_INTERVAL_MS * 2, latest: '1.47.1' }, now);
  assert.strictEqual(stale.line, '');
  assert.strictEqual(stale.probe, true);
  // An absent cache is the first-run shape: nothing to say, and a probe to run.
  for (const empty of [undefined, null, {}, 'not an object', 42]) {
    const p = U.plan('1.47.1', empty, now);
    assert.strictEqual(p.line, '', `cache=${String(empty)}`);
    assert.strictEqual(p.probe, true, `cache=${String(empty)}`);
  }
});

it('a failed probe stamps the time and no version, so it backs off', () => {
  // Otherwise a machine behind a proxy spawns a doomed probe at every start.
  const r = U.record(null, 123);
  assert.strictEqual(r.at, 123);
  assert.strictEqual(r.latest, null);
  assert.strictEqual(U.plan('1.47.1', r, 124).line, '', 'a failure must not claim a version');
  assert.strictEqual(U.plan('1.47.1', r, 124).probe, false, 'a failure must back off, not retry');
});

it('the probe records a trimmed version string', () => {
  assert.strictEqual(U.record('  1.48.0\n', 1).latest, '1.48.0');
  assert.strictEqual(U.record('', 1).latest, null);
});

console.log(`\nPASS: set-update notice — ${n} case(s)`);
