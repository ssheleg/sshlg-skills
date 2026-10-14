#!/usr/bin/env node
'use strict';
// The PostToolUse layer that reads a credential by its LABEL (I-6 remainder, OPS-002).
//
// `secrets.scan` knows vendor prefixes (`sk-or-v1-`, `ghp_`, `AKIA` …). A key with no
// prefix printed under a name that says what it is — `x-api-key: …`, `FOO_API_KEY=…`,
// `Authorization: Bearer …` — went past it. This detector reads the label and judges the
// value by its shape, and it reports the LABEL, never the value.
//
// Every secret-looking value here is generated at run time from `crypto.randomBytes`:
// no key-shaped literal sits in this file for the repository's own scanners to trip on,
// and none is a real credential. The false-positive half matters as much as the true
// half: a detector that cries wolf on hashes, ids and code is switched off within a week.

const assert = require('assert');
const crypto = require('crypto');
const L = require('../lib/labelledsecrets.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

/** A fresh random value, never a placeholder word by accident. */
function randomValue(kind, bytes) {
  for (;;) {
    const b = crypto.randomBytes(bytes || 24);
    const v = kind === 'hex' ? b.toString('hex') : b.toString('base64url');
    // base64url of random bytes can (rarely) spell a placeholder word or lack a digit;
    // a fixture must not depend on luck in either direction.
    if (!L.isPlaceholder(v) && /\d/.test(v) && /[A-Za-z]/.test(v)) return v;
  }
}
const V = () => randomValue('b64', 24);
const HEX = () => randomValue('hex', 20);
const JWTISH = () => [randomValue('b64', 12), randomValue('b64', 30), randomValue('b64', 24)].join('.');
const BASIC = () => Buffer.from(`svc-user:${randomValue('b64', 18)}`).toString('base64');

function labels(r) { return r ? r.found.map((f) => f.label) : []; }

// ── Labelled values the detector must report ────────────────────────────────
const REPORTED = [
  ['an x-*-key header, curl -v style', () => `> X-Api-Key: ${V()}\n> Accept: */*`, ['X-Api-Key']],
  ['a lower-case x-*-key header', () => `x-goog-api-key: ${V()}`, ['x-goog-api-key']],
  ['an env file line', () => `PORT=3000\nOPENROUTER_API_KEY=${V()}\nDEBUG=1`, ['OPENROUTER_API_KEY']],
  ['an exported env line, hex value', () => `export SERVICE_TOKEN=${HEX()}`, ['SERVICE_TOKEN']],
  ['Authorization: Bearer', () => `Authorization: Bearer ${JWTISH()}`, ['Authorization']],
  ['Authorization: Basic', () => `authorization: Basic ${BASIC()}`, ['authorization']],
  ['a JSON config key', () => `{"name":"svc","apiKey":"${V()}","region":"eu"}`, ['apiKey']],
  ['a YAML key', () => `client:\n  client_secret: ${V()}\n  timeout: 30`, ['client_secret']],
  ['api-key with a colon', () => `api-key: ${V()}`, ['api-key']],
  ['a command-line flag with =', () => `node srv.js --api-key=${V()} --port 8080`, ['api-key']],
  ['a command-line flag with a space (ps output)', () => `deploy --token ${V()} --env prod`, ['token']],
  ['a database password', () => `DB_PASSWORD='${V()}'`, ['DB_PASSWORD']],
  ['an id_token is a token, not an id', () => `"id_token": "${JWTISH()}"`, ['id_token']],
  ['a refresh token', () => `refresh_token=${V()}&grant_type=refresh`, ['refresh_token']],
  ['a key with a trailing qualifier', () => `STRIPE_SECRET_KEY_LIVE=${V()}`, ['STRIPE_SECRET_KEY_LIVE']],
  ['docker inspect Env', () => `"Env": ["PATH=/usr/bin", "WEBHOOK_SECRET=${V()}"]`, ['WEBHOOK_SECRET']],
  ['a bare Bearer in a log line', () => `sending request with Bearer ${JWTISH()} to upstream`, ['Bearer']],
  ['several labels, counted', () => `A_TOKEN=${V()}\nA_TOKEN=${V()}\nx-auth-token: ${V()}`, ['A_TOKEN', 'x-auth-token']],
];

for (const [name, make, want] of REPORTED) {
  it(`reports: ${name}`, () => {
    const text = make();
    const r = L.scanLabelled(text);
    assert.ok(r, 'a labelled credential was not noticed');
    assert.deepStrictEqual(labels(r), want);
  });
}

it('counts a repeated label once with its count', () => {
  const r = L.scanLabelled(`A_TOKEN=${V()}\nA_TOKEN=${V()}`);
  assert.strictEqual(r.found.length, 1);
  assert.strictEqual(r.found[0].count, 2);
});

it('the report never carries the value — not in found, not in the note', () => {
  const values = [V(), HEX(), JWTISH(), BASIC()];
  const text = `X-Api-Key: ${values[0]}\nFOO_TOKEN=${values[1]}\n`
    + `Authorization: Bearer ${values[2]}\nauthorization: Basic ${values[3]}`;
  const r = L.scanLabelled(text);
  assert.ok(r && r.found.length === 3, `expected three labels, got ${JSON.stringify(labels(r))}`);
  const note = L.describe(r, { tool: 'Bash', where: 'curl' });
  const serialised = JSON.stringify(r) + note;
  for (const v of values) {
    assert.ok(!serialised.includes(v), 'the report repeats a value it found');
    // not even a recognisable slice of it
    assert.ok(!serialised.includes(v.slice(0, 8)) && !serialised.includes(v.slice(-6)),
      'the report repeats part of a value it found');
  }
});

it('the note names the label, the tool and where, and gives the remedy with the not-on-PATH step', () => {
  const S = require('../lib/secrets.js');
  const r = L.scanLabelled(`X-Api-Key: ${V()}`);
  const note = L.describe(r, { tool: 'Read', where: '/srv/app/config.yaml' });
  assert.match(note, /X-Api-Key/);
  assert.match(note, /Read/);
  assert.match(note, /\/srv\/app\/config\.yaml/);
  assert.match(note, /rotate/i);
  assert.ok(note.includes(S.USE_SECRET) || /observatory_credentials/.test(note),
    'the remedy does not name the owner\'s door');
  assert.match(note, /[Ww]ithout Observatory/, 'no step for a machine without Observatory');
  assert.ok(note.includes(S.NOT_ON_PATH), 'names use_secret.py without the not-on-PATH sentence');
  assert.match(note, /not repeated/i, 'the note does not say the value is withheld');
});

// ── Values the detector must NOT report ─────────────────────────────────────
// Hashes, ids and public fingerprints under neutral names; code; placeholders; the
// shapes this repository's own guard recommends.
const SILENT = [
  ['a commit sha under a neutral name', () => `commit ${HEX()}\nAuthor: someone`],
  ['an integrity hash', () => `"integrity": "sha512-${V()}${V()}"`],
  ['a checksum line', () => `SHA256 (pkg.tgz) = ${HEX()}${HEX()}`],
  ['a key fingerprint', () => `fingerprint: ${HEX()}`],
  ['an SSH host key fingerprint', () => `ED25519 key fingerprint is SHA256:${V()}.`],
  ['a public key', () => `public_key: ${V()}${V()}`],
  ['a key id', () => `key_id: ${HEX()}`],
  ['an access key id under its own name', () => `ACCESS_KEY_ID=${HEX()}`],
  ['a client id', () => `client_id=${HEX()}`],
  ['a request id', () => `x-request-id: ${HEX()}`],
  ['an idempotency key', () => `Idempotency-Key: ${V()}`],
  ['a pagination token', () => `"nextPageToken": "${V()}"`],
  ['a csrf token in a page', () => `<input name="csrf_token" value="${V()}">`],
  ['a cache key', () => `cache_key=${HEX()}`],
  ['a token count', () => `max_tokens: 4096\ntoken_count=1234567890123456`],
  ['an env reference, not a value', () => 'OPENROUTER_API_KEY=${OPENROUTER_API_KEY}'],
  ['a shell expansion in a header', () => 'Authorization: Bearer $OPENROUTER_API_KEY'],
  ['a template placeholder', () => 'api_key: <YOUR_API_KEY_HERE_PLEASE>'],
  ['a redacted value', () => 'X-Api-Key: REDACTED_REDACTED_REDACTED'],
  ['a masked value', () => 'Token: gho_************************************'],
  ['an example value', () => 'API_KEY=example-key-value-1234567890'],
  ['a key path, not a key', () => 'PRIVATE_KEY_PATH=/etc/ssl/private/server-2026.key'],
  ['a path value under a secret name', () => 'SSH_KEY=~/.ssh/id_ed25519_work_2026'],
  ['a url under a token name', () => 'TOKEN_URL=https://auth.example.com/oauth2/token'],
  ['code: a call, not a value', () => 'const apiKey = loadKeyFromVault2(config);'],
  ['code: a dotted identifier', () => 'secret_key = settings.SECRET_KEY_V2'],
  ['code: environment lookup', () => 'token: process.env.GITHUB_TOKEN_2,'],
  ['an identifier value with a version suffix', () => 'AUTH_MODE=oauth_device_flow_v2'],
  ['a word value', () => 'password: correcthorsebatterystaple'],
  ['a long number', () => 'SECRET_VERSION_NUMBER=12345678901234567890'],
  ['a timestamp', () => 'token_expires_at=2026-10-14T03:16:52.123Z'],
  ['a low-entropy value', () => 'API_KEY=aaaaaaaaaaaaaaaa1111111111'],
  ['a short value', () => 'api_key=ab12cd34'],
  ['the guard\'s own presence check', () => '[ -n "$OPENROUTER_API_KEY" ] && echo set'],
  ['a length report', () => 'OPENROUTER_API_KEY length: 73'],
  ['prose about keys', () => 'Rotate the api key handling and the token refresh before release.'],
  ['a uuid under a neutral name', () => `"requestId": "${crypto.randomUUID()}"`],
  ['ordinary output', () => '3 files changed, 42 insertions(+), 7 deletions(-)'],
  // Measured on 6,456 real files (this repository, its members, Observatory docs/tools):
  // a registry's namespaced ids and a logo CDN's publishable key were the false positives.
  ['a namespaced credential id in a registry', () => `{"id": "credential:svc-${HEX()}", "kind": "store"}`],
  ['a namespaced secret subject', () => `"subject": "secret:${V()}"`],
  ['a publishable key in an image URL', () => `img.logo.example/acme.com?token=pk_${V()}&size=128`],
  ['a vault slot name, not its value', () => '{"event": "leak", "secret": "acme-web-app/prod/OPENROUTER_API_KEY_2"}'],
  ['a snake_case function name as a value', () => '{"svc-auth": check_svc2_status_handler,'],
  ['a sequential example value', () => 'curl -H "Authorization: Bearer sk-admin-key123456abcdef"'],
  ['a commit sha under a git qualifier', () => `"commit_token": "${HEX()}"`],
  ['empty', () => ''],
];

for (const [name, make] of SILENT) {
  it(`silent: ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.strictEqual(r, null, `false positive on ${JSON.stringify(labels(r))}`);
  });
}

it('a vendor-prefixed literal is left to secrets.scan, so one leak is not reported twice', () => {
  const vendor = 'gh' + 'p_' + randomValue('hex', 20);
  const r = L.scanLabelled(`GITHUB_TOKEN=${vendor}`);
  assert.strictEqual(r, null, 'the labelled detector double-reports a vendor literal');
  assert.ok(require('../lib/secrets.js').scan(`GITHUB_TOKEN=${vendor}`), 'secrets.scan no longer sees it');
});

// ── Robustness: fail open, bounded ──────────────────────────────────────────
it('a non-string decides nothing rather than throwing', () => {
  for (const bad of [undefined, null, 42, {}, [], true]) assert.strictEqual(L.scanLabelled(bad), null);
});

it('describe on nothing is empty, never a throw', () => {
  assert.strictEqual(L.describe(null, {}), '');
  assert.strictEqual(L.describe({ found: [] }, null), '');
});

it('a large output is scanned within a bounded time and reports the scan as partial', () => {
  const filler = (crypto.randomBytes(1 << 20).toString('base64') + '\n').repeat(3); // ~4.2 MB
  const head = `X-Api-Key: ${V()}\n`;
  const t0 = Date.now();
  const r = L.scanLabelled(head + filler);
  const ms = Date.now() - t0;
  assert.ok(r && labels(r).includes('X-Api-Key'), 'a value in the head of a large output was missed');
  assert.strictEqual(r.partial, true, 'a capped scan does not say it was partial');
  assert.ok(ms < 3000, `scan of a large output took ${ms} ms`);
});

it('a pathological line (one huge label-shaped run) stays bounded', () => {
  const evil = 'a_token'.repeat(200000) + '=' + 'b'.repeat(100000);
  const t0 = Date.now();
  L.scanLabelled(evil);
  const ms = Date.now() - t0;
  assert.ok(ms < 3000, `a pathological input took ${ms} ms`);
});

// ── outputText: what the hook reads from each tool's response ───────────────
it('outputText reads Bash, Read, Grep and MCP-style responses', () => {
  const v = V();
  const cases = [
    { stdout: `ok\nFOO_TOKEN=${v}`, stderr: '' },
    { type: 'text', file: { filePath: '/x/.config', content: `FOO_TOKEN=${v}` } },
    { mode: 'content', content: `app.yml:3:FOO_TOKEN=${v}`, numLines: 1 },
    [{ type: 'text', text: `FOO_TOKEN=${v}` }],
    `FOO_TOKEN=${v}`,
  ];
  for (const c of cases) {
    const text = L.outputText(c);
    assert.ok(text.includes(v), `outputText missed the text of ${JSON.stringify(Object.keys(c))}`);
    assert.ok(L.scanLabelled(text), 'the text read was not scannable');
  }
});

it('outputText is bounded on deep or cyclic input and never throws', () => {
  const cyclic = { a: 'x' };
  cyclic.self = cyclic;
  let deep = { s: 'leaf' };
  for (let i = 0; i < 1000; i += 1) deep = { d: deep };
  assert.strictEqual(typeof L.outputText(cyclic), 'string');
  assert.strictEqual(typeof L.outputText(deep), 'string');
  for (const bad of [undefined, null, 42, true]) assert.strictEqual(L.outputText(bad), '');
});

// ── where: the file or command, never the value ─────────────────────────────
it('whereOf names the program for Bash and drops anything value-shaped from it', () => {
  const v = V();
  const w = L.whereOf({ tool_name: 'Bash', tool_input: { command: `curl -sS -H "x-api-key: ${v}" https://api.example.com` } });
  assert.strictEqual(w.tool, 'Bash');
  assert.match(w.where, /^curl/);
  assert.ok(!w.where.includes(v) && !w.where.includes(v.slice(0, 8)), 'where repeats the value');
});

it('whereOf names the file for Read and the path for Grep', () => {
  assert.deepStrictEqual(L.whereOf({ tool_name: 'Read', tool_input: { file_path: '/srv/app/.config' } }),
    { tool: 'Read', where: '/srv/app/.config' });
  assert.deepStrictEqual(L.whereOf({ tool_name: 'Grep', tool_input: { pattern: 'TOKEN', path: '/srv/app' } }),
    { tool: 'Grep', where: '/srv/app' });
  assert.deepStrictEqual(L.whereOf({}), { tool: 'a tool', where: '' });
});

if (failures.length) {
  console.error(`labelled_secrets_test: ${failures.length}/${checks} failed`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
