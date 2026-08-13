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

it('EVERY sequence in a concatenation is validated, not just the first', () => {
  // The ledger hook sends taskbar progress and a notification together. Checking
  // only the first would let the second through unvalidated — and Claude Code
  // drops the whole field, so the feature would be dead with nothing saying so.
  const progress = `${ESC}]9;4;1;45${BEL}`;
  const ping = `${ESC}]777;notify;t;b${BEL}`;
  const forbidden = `${ESC}]52;c;AAAA${BEL}`;
  assert.strictEqual(N.isAllowed(progress + ping), true, 'a legal pair was rejected');
  assert.strictEqual(N.isAllowed(progress + forbidden), false,
    'a forbidden sequence hid behind a legal one');
  assert.strictEqual(N.isAllowed(forbidden + progress), false);
});

it('an unterminated sequence is not allowed', () => {
  assert.strictEqual(N.isAllowed(`${ESC}]9;4;1;45`), false, 'a sequence with no terminator passed');
  assert.strictEqual(N.isAllowed(''), false);
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
