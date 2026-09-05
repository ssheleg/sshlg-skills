#!/usr/bin/env node
'use strict';
// The guard that stands where a credential would reach the transcript.
//
// The fixtures that matter most are the SECOND half. A guard that denies real
// leaks and also denies ordinary work gets switched off within a week, and then
// it denies nothing at all — so every legitimate spelling of the same idea is
// asserted to pass, not merely hoped to.
//
// Case 1 is the exact line that leaked a live OpenRouter key twice on
// 2026-09-05, written to CHECK whether a variable was set.

const assert = require('assert');
const S = require('../lib/secrets.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const FAKE_OR = 'sk-or-v1-' + 'a'.repeat(64);

const DENIED = [
  ['the construct that actually leaked',
   'echo "key: ${OPENROUTER_API_KEY:-not set}"', 'expansion-into-print'],
  ['printf is not a loophole',
   'printf "%s\\n" "$LINEAR_API_TOKEN"', 'expansion-into-print'],
  ['a literal key in argv', `export OR=${FAKE_OR}`, 'literal-credential'],
  ['a literal key anywhere at all', `curl -H "x: ${FAKE_OR}" https://x`, 'literal-credential'],
  ['a private key header', 'echo "-----BEGIN RSA PRIVATE KEY-----" > k', 'literal-credential'],
  ['reading the secret store', 'cat ~/.config/agentgateway/secrets/openrouter',
   'reads-secret-file'],
  ['reading a .env', 'head -20 /Users/x/proj/.env', 'reads-secret-file'],
  ['reading a private key file', 'tail ~/.ssh/id_rsa', 'reads-secret-file'],
  ['the whole environment', 'env', 'dumps-environment'],
  ['printenv with no argument', 'printenv', 'dumps-environment'],
  ['verbose curl with an auth header',
   'curl -v -H "Authorization: Bearer $T" https://api.example.com', 'curl-prints-headers'],
  ['curl --user is a credential too',
   'curl --verbose --user me:pw https://api.example.com', 'curl-prints-headers'],
];

// Every one of these is ordinary work, and denying any of them is how the guard
// stops being obeyed. They are the point of the suite, not its afterthought.
const ALLOWED = [
  ['a header the request needs — the legitimate use',
   'curl -sS -H "Authorization: Bearer $OPENROUTER_API_KEY" https://openrouter.ai/api/v1/key'],
  ['the safe presence check', '[ -n "$OPENROUTER_API_KEY" ] && echo set'],
  ['the safe length check', 'echo "${#OPENROUTER_API_KEY}"'],
  ['the safe tail', 'echo "…${OPENROUTER_API_KEY: -4}"'],
  ['size of a secret file without reading it',
   'wc -c < ~/.config/agentgateway/secrets/openrouter'],
  ['mode of a secret file', 'stat -f "%Sp" ~/.config/agentgateway/secrets/openrouter'],
  ['existence of a secret file', 'test -f ~/.config/agentgateway/secrets/prowl && echo yes'],
  ['a filtered environment probe', 'env | grep -c "^OPENROUTER"'],
  ['printenv naming one variable', 'printenv PATH'],
  ['quiet curl with no auth at all', 'curl -v https://example.com'],
  ['prose that merely mentions the words', 'git commit -m "rotate the api key handling"'],
  ['a path that only looks secret-ish', 'cat docs/authentication.md'],
  ['chmod on the secret, which reads nothing', 'chmod 600 ~/.config/agentgateway/secrets/x'],
  ['an empty command', ''],
];

for (const [name, cmd, rule] of DENIED) {
  it(`denies: ${name}`, () => {
    const v = S.inspect(cmd);
    assert.ok(v, 'was allowed');
    assert.strictEqual(v.rule, rule);
    assert.ok(v.why.length > 80, 'a refusal with no remedy is an obstacle');
    assert.ok(/QUOTED/.test(v.why), 'every refusal must admit it may be wrong');
  });
}
for (const [name, cmd] of ALLOWED) {
  it(`allows: ${name}`, () => {
    assert.strictEqual(S.inspect(cmd), null, 'ordinary work was denied');
  });
}

it('a refusal never repeats the value it is refusing', () => {
  const v = S.inspect(`export OR=${FAKE_OR}`);
  assert.ok(!v.why.includes(FAKE_OR),
    'the guard printed the very credential it exists to keep out of the transcript');
});

it('a non-string payload decides nothing rather than throwing', () => {
  // The hook fails silent by design; a guard that throws on an unfamiliar
  // payload would break every tool call in every session.
  for (const bad of [undefined, null, 42, {}, []]) {
    assert.strictEqual(S.inspect(bad), null);
  }
});

if (failures.length) {
  console.error(`secrets_test: ${failures.length}/${checks} failed`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`secrets_test: ${checks} checks passed`);
