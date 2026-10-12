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
  ['a secret piped into python3 - beside a heredoc — one stdin, two passengers',
   "heroku config:get DATABASE_URL -a app | python3 - <<'PY'\nimport sys\nPY", 'secret-into-stdin-program'],
  ['the same into node -', "vault.py get x | node - <<'JS'\nconsole.log(1)\nJS", 'secret-into-stdin-program'],
  ['a literal key anywhere at all', `curl -H "x: ${FAKE_OR}" https://x`, 'literal-credential'],
  ['a private key header', 'echo "-----BEGIN RSA PRIVATE KEY-----" > k', 'literal-credential'],
  ['reading the secret store', 'cat ~/.config/agentgateway/secrets/openrouter',
   'reads-secret-file'],
  ['reading a .env', 'head -20 /Users/x/proj/.env', 'reads-secret-file'],
  ['reading a private key file', 'tail ~/.ssh/id_rsa', 'reads-secret-file'],
  ['a reader and the secret path in ONE segment of a longer line',
   'ls; head -5 ~/proj/.env.agent-sync | wc -l', 'reads-secret-file'],
  ['a reader fed the secret by redirection', 'head < ~/proj/.env', 'reads-secret-file'],
  ['a reader inside a substitution', 'echo "$(cat ~/proj/.env)"', 'reads-secret-file'],
  // The PR #200 blind reading: splitting into segments must not open these.
  ['the path through a variable', 'f=~/proj/.env; cat $f', 'reads-secret-file'],
  ['the path through an exported variable', 'export F=~/x/.env && head "$F"', 'reads-secret-file'],
  ['a redirect with & is not a separator', 'cat 2>&1 ~/proj/.env', 'reads-secret-file'],
  ['the same into stderr', 'tail >&2 ~/.ssh/id_rsa', 'reads-secret-file'],
  ['grep prints the matching secret lines', 'grep TOKEN ~/proj/.env | head -1', 'reads-secret-file'],
  ['copy, then read the copy', 'cp ~/proj/.env /tmp/x; cat /tmp/x', 'reads-secret-file'],
  ['a separator inside quotes does not cut the command', 'cat "a;b" ~/proj/.env', 'reads-secret-file'],
  ['grep -i still prints the lines (only sed -i is quiet)', 'grep -i token ~/proj/.env', 'reads-secret-file'],
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
  // INB-006 (Observatory, 2026-10-12): a reader in one segment and a secret-looking path
  // in ANOTHER were joined into one refusal, so the remedy `test -f FILE && echo present`
  // was refused because an unrelated `| head` sat elsewhere on the line.
  ['the existence remedy beside an unrelated reader',
   'launchctl list | grep tick | head -3; test -f ~/DATA/x/.env.agent-sync && echo "token file present"'],
  ['counting matching lines prints no value', 'grep -c ^TOKEN= ~/proj/.env'],
  ['an in-place edit prints nothing', 'sed -i "" s/a/b/ ~/proj/.env'],
  ['an unrelated reader on both sides of the existence remedy',
   'grep -c x ~/notes.md | head -1; test -f ~/x/.env && echo present; tail -2 ~/log.txt'],
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

// ── scan(): the layer that reads what came BACK ─────────────────────────────
it('scan finds a credential in output', () => {
  const v = S.scan('config dump\napi_key: ' + FAKE_OR + '\nok');
  assert.ok(v, 'a printed key was not noticed');
  assert.strictEqual(v.found[0].what, 'an OpenRouter key');
});
it('scan never repeats the value it found', () => {
  const v = S.scan('key=' + FAKE_OR);
  assert.ok(!v.why.includes(FAKE_OR),
    'the warning leaked the secret a second time, into the same transcript');
});
it('scan counts repeats without quoting them', () => {
  const v = S.scan(FAKE_OR + '\n' + FAKE_OR);
  assert.strictEqual(v.found[0].count, 2);
});
it('scan is silent on ordinary output', () => {
  for (const clean of ['3 files changed', '', 'Authorization: Bearer <redacted>',
                       'sk-or-v1-short', 'talking about ghp_ tokens in prose']) {
    assert.strictEqual(S.scan(clean), null, JSON.stringify(clean));
  }
});
it('scan decides nothing on a non-string rather than throwing', () => {
  for (const bad of [undefined, null, 42, {}, []]) assert.strictEqual(S.scan(bad), null);
});

// R04 (B-158): a remedy must not hardcode where Observatory is checked out.
it('no remedy hardcodes the Observatory path, and every use_secret.py is runtime-resolved', () => {
  const fs = require('fs');
  const path = require('path');
  const texts = [];
  // every refusal the guard can produce, from its own corpus of denied commands
  for (const [, cmd] of DENIED) { const r = S.inspect(cmd); if (r) texts.push(r.why); }
  const stdinProgram = ['cat x', "python3 - <<'PY'\nprint(1)\nPY"].join(' | ');
  texts.push(S.inspect(stdinProgram).why);
  // ...and every source file that can print a remedy
  for (const f of ['secrets.js', 'hygiene.js', 'guard.js', 'mcpsecrets.js']) {
    texts.push(fs.readFileSync(path.join(__dirname, '..', 'lib', f), 'utf8')
      .split('\n').filter((l) => !/^\s*(\/?\*|\/\/)/.test(l)).join('\n'));
  }
  assert.ok(texts.every((t) => typeof t === 'string' && t.length), 'a remedy text was empty');
  assert.ok(texts.some((t) => t.includes('use_secret.py')), 'no remedy names use_secret.py — the fixture proves nothing');
  const checkout = '~/DATA/' + 'project-observatory';
  for (const t of texts) {
    assert.ok(!t.includes(checkout), 'a remedy hardcodes the Observatory checkout path');
    let at = 0;
    for (;;) {
      const i = t.indexOf('/tools/use_secret.py', at);
      if (i === -1) break;
      assert.ok(t.slice(0, i).endsWith('$(project-observatory full-path)'),
        `use_secret.py without the resolver: ...${t.slice(Math.max(0, i - 40), i + 25)}`);
      at = i + 1;
    }
  }
  assert.strictEqual(S.USE_SECRET, '"$(project-observatory full-path)/tools/use_secret.py"');
});

// Fix round, risk h: `$(project-observatory full-path)` expands to NOTHING when the engine is
// not on PATH, so the remedy as printed runs `/tools/use_secret.py` — a path at the root
// of the disk — and fails with "No such file". A remedy whose own command fails that way
// must say what to do then, in the same text, because that is when it is read.
it('a remedy naming use_secret.py says what to do when project-observatory is not on PATH', () => {
  const { spawnSync } = require('child_process');
  // the failure mode the sentence describes, measured rather than asserted
  const r = spawnSync('/bin/sh', ['-c', `echo ${S.USE_SECRET}`],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.strictEqual(r.stdout.trim(), '/tools/use_secret.py',
    `the resolver did not expand to the root path without the engine: ${JSON.stringify(r.stdout)}`);
  const stdinProgram = ['cat x', "python3 - <<'PY'\nprint(1)\nPY"].join(' | ');
  const texts = [S.inspect(stdinProgram).why];
  for (const [, cmd] of DENIED) { const d = S.inspect(cmd); if (d) texts.push(d.why); }
  const naming = texts.filter((t) => t.includes('use_secret.py'));
  assert.ok(naming.length >= 1, 'no remedy names use_secret.py — the fixture proves nothing');
  for (const t of naming) {
    assert.ok(/not on PATH/.test(t) && /root of the disk/.test(t),
      `a remedy names use_secret.py and not what to do without the engine on PATH:\n${t}`);
    assert.ok(t.includes(S.NOT_ON_PATH), 'the not-on-PATH sentence is not the shared constant');
  }
});

if (failures.length) {
  console.error(`secrets_test: ${failures.length}/${checks} failed`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
// `OK (N checks)` and not a sentence of my own: test/run.js counts fixtures by
// this exact shape, so a suite that reports in prose is invisible to the ratchet
// — 33 checks that could be deleted without moving a number anybody watches.
console.log(`OK (${checks} checks)`);
