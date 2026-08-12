#!/usr/bin/env node
'use strict';
// Fixtures for lib/notify.js.
//
// The load-bearing property is negative: a sequence outside Claude Code's
// allowlist is DROPPED by it, with no error anywhere. A module that emitted one
// would ship a feature that silently never fires, so the refusal is asserted
// rather than assumed.

const assert = require('assert');
const N = require('../lib/notify.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ESC = '\u001b';
const BEL = '\u0007';

it('an idle prompt produces an OSC 777 notification', () => {
  const seq = N.sequence({ notification_type: 'idle_prompt', message: 'Claude is waiting' });
  assert.ok(seq.startsWith(`${ESC}]777;notify;`), `not an OSC 777 sequence: ${JSON.stringify(seq)}`);
  assert.ok(seq.endsWith(BEL), 'the sequence is not terminated');
  assert.ok(seq.includes('Claude is waiting'), 'the message did not survive');
});

it('a finished background agent produces one too', () => {
  assert.ok(N.sequence({ notification_type: 'agent_completed', message: 'done' }));
});

it('the types we do not notify on are silence', () => {
  for (const t of ['permission_prompt', 'auth_success', 'elicitation_dialog', undefined]) {
    assert.strictEqual(N.sequence({ notification_type: t, message: 'x' }), '',
      `fired on ${t} — a ping for every permission prompt is a ping nobody reads`);
  }
});

it('an empty message emits nothing rather than an empty notification', () => {
  assert.strictEqual(N.sequence({ notification_type: 'idle_prompt', message: '' }), '');
  assert.strictEqual(N.sequence({ notification_type: 'idle_prompt' }), '');
});

it('a semicolon in the message cannot split the sequence', () => {
  const seq = N.sequence({ notification_type: 'idle_prompt', message: 'a;b;c' });
  const fields = seq.slice(`${ESC}]777;`.length, -1).split(';');
  assert.strictEqual(fields.length, 3, `the payload broke into ${fields.length} fields: ${fields}`);
});

it('a control byte in the message cannot terminate it early', () => {
  const seq = N.sequence({ notification_type: 'idle_prompt', message: `oops${BEL}injected` });
  assert.strictEqual(seq.indexOf(BEL), seq.length - 1, 'a BEL from the message survived inside the payload');
});

it('a long message is cut rather than shipped whole', () => {
  const seq = N.sequence({ notification_type: 'idle_prompt', message: 'x'.repeat(500) });
  assert.ok(seq.length < 250, `a ${seq.length}-char escape sequence is not a notification`);
});

it('the allowlist is enforced, not assumed', () => {
  // OSC 8 (hyperlinks), OSC 52 (clipboard) and OSC 1337 are named in the
  // reference as rejected. If this module ever built one, the field would be
  // ignored and the feature would be dead with nothing saying so.
  assert.strictEqual(N.isAllowed(`${ESC}]8;;http://x${BEL}`), false);
  assert.strictEqual(N.isAllowed(`${ESC}]52;c;AAAA${BEL}`), false);
  assert.strictEqual(N.isAllowed(`${ESC}]1337;File=x${BEL}`), false);
  assert.strictEqual(N.isAllowed(`${ESC}[2J`), false, 'a CSI sequence passed the allowlist');
  for (const code of N.ALLOWED_OSC) {
    assert.strictEqual(N.isAllowed(`${ESC}]${code};x${BEL}`), true, `OSC ${code} was rejected`);
  }
  assert.strictEqual(N.isAllowed(BEL), true, 'a bare BEL is allowed by the reference');
});

it('every sequence this module builds passes its own allowlist', () => {
  for (const t of N.TYPES) {
    const seq = N.sequence({ notification_type: t, message: 'work', title: 'x' });
    assert.ok(N.isAllowed(seq), `built a sequence Claude Code would drop: ${JSON.stringify(seq)}`);
  }
});

it('a malformed payload is silence, not a throw', () => {
  assert.strictEqual(N.sequence(undefined), '');
  assert.strictEqual(N.sequence({}), '');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
