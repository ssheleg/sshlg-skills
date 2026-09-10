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

// --- the unattended half -----------------------------------------------------

it('auto-update is ON unless the config says off — the file holds deviations', () => {
  const now = 1_000_000_000;
  const behind = { self: '1.0.0', latest: '2.0.0' };
  assert.strictEqual(U.shouldAutoUpdate({}, behind, now).run, true);
  assert.strictEqual(U.shouldAutoUpdate({ update: {} }, behind, now).run, true);
  assert.strictEqual(U.shouldAutoUpdate({ update: { auto: 'on' } }, behind, now).run, true);
  const off = U.shouldAutoUpdate({ update: { auto: 'off' } }, behind, now);
  assert.strictEqual(off.run, false);
  assert.match(off.why, /off in config/);
});

it('nothing newer means no run — it does not spend idle on a no-op launcher', () => {
  const now = 1_000_000_000;
  assert.strictEqual(U.shouldAutoUpdate({}, { self: '2.0.0', latest: '2.0.0' }, now).run, false);
  assert.strictEqual(U.shouldAutoUpdate({}, { self: '2.0.0', latest: '1.0.0' }, now).run, false);
  // An unknown version is not a reason to run: it is a reason to know nothing.
  assert.strictEqual(U.shouldAutoUpdate({}, { self: '2.0.0', latest: null }, now).run, false);
  assert.strictEqual(U.shouldAutoUpdate({}, {}, now).run, false);
});

it('an attempt inside the interval does not repeat — idle pings are frequent', () => {
  const now = 1_000_000_000;
  const behind = { self: '1.0.0', latest: '2.0.0' };
  const just = Object.assign({}, behind, { ranAt: now - 5 });
  assert.strictEqual(U.shouldAutoUpdate({}, just, now).run, false);
  const old = Object.assign({}, behind, { ranAt: now - U.CHECK_INTERVAL_MS - 1 });
  assert.strictEqual(U.shouldAutoUpdate({}, old, now).run, true);
  // A stamp in the future must not park it forever.
  const future = Object.assign({}, behind, { ranAt: now + U.CHECK_INTERVAL_MS });
  assert.strictEqual(U.shouldAutoUpdate({}, future, now).run, true);
});

it('the unattended path is never silent about being on', () => {
  assert.match(U.autoLine({}), /auto-updates when you go idle/);
  assert.match(U.autoLine({}), /config set update\.auto off/,
    'the disclosure does not say how to turn it off');
  assert.strictEqual(U.autoLine({ update: { auto: 'off' } }), '',
    'it announces itself while switched off');
});

it('a completed run asks for the restart that actually loads it', () => {
  const l = U.ranLine({ lastRun: U.ranRecord('1.47.1', '1.48.0', true, 1) });
  assert.match(l, /1\.47\.1/); assert.match(l, /1\.48\.0/);
  assert.match(l, /Restart/, 'skills are read at session start and the line does not say so');
});

it('a FAILED run says so — a quiet failure is worse than never running', () => {
  const l = U.ranLine({ lastRun: U.ranRecord('1.47.1', null, false, 1) });
  assert.match(l, /FAILED/);
  assert.match(l, /npx sshlg-skills@latest update/, 'the failure gives no way to look');
});

it('a run that changed nothing says nothing', () => {
  assert.strictEqual(U.ranLine({ lastRun: U.ranRecord('1.47.1', '1.47.1', true, 1) }), '');
  assert.strictEqual(U.ranLine({}), '');
  assert.strictEqual(U.ranLine(null), '');
});

it('plan() orders the lines: what happened, what is out, what is on', () => {
  const now = 1_000_000_000;
  const p = U.plan('1.47.1', {
    at: now, latest: '1.48.0',
    lastRun: U.ranRecord('1.46.0', '1.47.1', true, now),
  }, now, undefined, {});
  assert.strictEqual(p.lines.length, 3);
  assert.match(p.lines[0], /updated while you were away/);
  assert.match(p.lines[1], /A newer set is out/);
  assert.match(p.lines[2], /auto-updates when you go idle/);
});

it('the disclosure rides WITH the notice, not on every session', () => {
  const now = 1_000_000_000;
  // Nothing out: no notice, and therefore no standing announcement either.
  const quiet = U.plan('1.47.1', { at: now, latest: '1.47.1' }, now, undefined, {});
  assert.strictEqual(quiet.lines.length, 0,
    'a session with nothing to report still printed something');
});

console.log(`\nPASS: set-update notice — ${n} case(s)`);
